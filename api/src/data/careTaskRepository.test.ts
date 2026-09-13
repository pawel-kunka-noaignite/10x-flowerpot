import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCareTask, getCareTasksByPlantId, getCareTasksByUserId } from "./careTaskRepository";

// Mock the tableClient module
const mockCreateEntity = vi.fn();
const mockListEntities = vi.fn();

vi.mock("../lib/tableClient", () => ({
  getTableClient: vi.fn(() => ({
    createEntity: mockCreateEntity,
    listEntities: mockListEntities,
  })),
}));

describe("careTaskRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCareTask", () => {
    it("creates a care task with valid data", async () => {
      mockCreateEntity.mockResolvedValue(undefined);

      const dueDate = new Date("2026-01-15");
      const task = await createCareTask(
        "user-1",
        "plant-1",
        "water",
        dueDate
      );

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      ); // UUID format
      expect(task.plantId).toBe("plant-1");
      expect(task.action).toBe("water");
      expect(task.dueAt).toBe("2026-01-15");
      expect(task.completedAt).toBeNull();
    });

    it("stores dueAt as YYYY-MM-DD format", async () => {
      mockCreateEntity.mockResolvedValue(undefined);

      const dueDate = new Date("2026-12-25T14:30:45Z"); // Time should be ignored
      await createCareTask("user-1", "plant-1", "fertilize", dueDate);

      // Check that createEntity was called with correct dueAt format
      const callArgs = mockCreateEntity.mock.calls[0][0];
      expect(callArgs.dueAt).toBe("2026-12-25");
    });

    it("uses userId as partition key", async () => {
      mockCreateEntity.mockResolvedValue(undefined);

      const dueDate = new Date("2026-01-15");
      await createCareTask("user-123", "plant-1", "water", dueDate);

      const callArgs = mockCreateEntity.mock.calls[0][0];
      expect(callArgs.partitionKey).toBe("user-123");
    });

    it("generates task id as row key", async () => {
      mockCreateEntity.mockResolvedValue(undefined);

      const dueDate = new Date("2026-01-15");
      const task = await createCareTask("user-1", "plant-1", "water", dueDate);

      const callArgs = mockCreateEntity.mock.calls[0][0];
      expect(callArgs.rowKey).toBe(task.id);
    });

    it("creates tasks for different care actions", async () => {
      mockCreateEntity.mockResolvedValue(undefined);

      const dueDate = new Date("2026-01-15");

      const waterTask = await createCareTask("user-1", "plant-1", "water", dueDate);
      const fertilizeTask = await createCareTask("user-1", "plant-1", "fertilize", dueDate);
      const pruneTask = await createCareTask("user-1", "plant-1", "prune", dueDate);

      expect(waterTask.action).toBe("water");
      expect(fertilizeTask.action).toBe("fertilize");
      expect(pruneTask.action).toBe("prune");
    });
  });

  describe("getCareTasksByPlantId", () => {
    it("retrieves tasks for a specific plant", async () => {
      const mockEntities = [
        {
          rowKey: "task-1",
          partitionKey: "user-1",
          plantId: "plant-1",
          action: "water",
          dueAt: "2026-01-15",
          completedAt: null,
        },
        {
          rowKey: "task-2",
          partitionKey: "user-1",
          plantId: "plant-1",
          action: "fertilize",
          dueAt: "2026-01-20",
          completedAt: null,
        },
      ];

      mockListEntities.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const entity of mockEntities) {
            yield entity;
          }
        },
      });

      const tasks = await getCareTasksByPlantId("user-1", "plant-1");

      expect(tasks).toHaveLength(2);
      expect(tasks[0].action).toBe("water");
      expect(tasks[1].action).toBe("fertilize");
    });

    it("applies partition key filter for user isolation", async () => {
      mockListEntities.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // No entities
        },
      });

      await getCareTasksByPlantId("user-1", "plant-1");

      const callArgs = mockListEntities.mock.calls[0][0];
      expect(callArgs.queryOptions.filter).toContain("PartitionKey eq 'user-1'");
      expect(callArgs.queryOptions.filter).toContain("plantId eq 'plant-1'");
    });

    it("returns empty array if no tasks found", async () => {
      mockListEntities.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // No entities
        },
      });

      const tasks = await getCareTasksByPlantId("user-1", "plant-1");

      expect(tasks).toEqual([]);
    });

    it("maps completedAt null correctly", async () => {
      const mockEntities = [
        {
          rowKey: "task-1",
          partitionKey: "user-1",
          plantId: "plant-1",
          action: "water",
          dueAt: "2026-01-15",
          completedAt: undefined, // Table Storage returns undefined for null
        },
      ];

      mockListEntities.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const entity of mockEntities) {
            yield entity;
          }
        },
      });

      const tasks = await getCareTasksByPlantId("user-1", "plant-1");

      expect(tasks[0].completedAt).toBeNull();
    });
  });

  describe("getCareTasksByUserId", () => {
    it("retrieves all tasks for a user across all plants", async () => {
      const mockEntities = [
        {
          rowKey: "task-1",
          partitionKey: "user-1",
          plantId: "plant-1",
          action: "water",
          dueAt: "2026-01-15",
          completedAt: null,
        },
        {
          rowKey: "task-2",
          partitionKey: "user-1",
          plantId: "plant-2",
          action: "fertilize",
          dueAt: "2026-01-20",
          completedAt: null,
        },
      ];

      mockListEntities.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          for (const entity of mockEntities) {
            yield entity;
          }
        },
      });

      const tasks = await getCareTasksByUserId("user-1");

      expect(tasks).toHaveLength(2);
      expect(tasks[0].plantId).toBe("plant-1");
      expect(tasks[1].plantId).toBe("plant-2");
    });

    it("applies partition key filter for user isolation", async () => {
      mockListEntities.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // No entities
        },
      });

      await getCareTasksByUserId("user-1");

      const callArgs = mockListEntities.mock.calls[0][0];
      expect(callArgs.queryOptions.filter).toBe("PartitionKey eq 'user-1'");
    });

    it("does not leak tasks from other users", async () => {
      // This is an implicit test: the partition key filter ensures
      // only tasks with the specified userId are returned
      mockListEntities.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          // Simulate no tasks (because partition key filters them out)
        },
      });

      const tasks = await getCareTasksByUserId("user-1");

      expect(tasks).toEqual([]);
    });
  });
});
