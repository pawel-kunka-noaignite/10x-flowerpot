---
project: "Flowerpot"
version: 1
status: draft
created: 2026-07-21
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
---

# PRD — Flowerpot

## Vision & Problem Statement

Zosia keeps around ten houseplants of different species in her apartment. Each species wants a different rhythm of watering, feeding, and pruning, and those rhythms shift with the season and with how much light a given spot gets. With no single place tracking this, she overwaters some plants and lets others dry out — the plants suffer and the hobby turns into guilt.

Houseplant care is not a to-do list, it is a per-plant schedule that has to adapt. The interval between waterings depends on species, season, and light, and every real watering — early, on time, or late — should shift the next one. Fixed, plant-agnostic reminder apps never solve this; a product that computes and continuously re-adjusts each plant's schedule removes the guesswork.

## User & Persona

**Zosia, 30, apartment houseplant owner.** Owns ~10 plants of mixed species. Enjoys plants but is not a botanist; she cannot keep each species' needs in her head. She reaches for the product when she suspects something needs watering today but is unsure what, and when she adds a new plant and wants to know how to care for it.

## Success Criteria

### Primary
- A user adds a plant and sees a concrete care schedule in under 1 minute, with zero manual interval configuration.
- Completing a care task visibly reschedules that task's next occurrence.

### Secondary
- A user returns across multiple sessions to check "today's tasks" (early retention signal).

### Guardrails
- A user never sees or affects another user's plants or tasks.
- A newly added plant is never left without a schedule — no empty or broken state.

## User Stories

### US-01: User adds a plant and gets a schedule

- **Given** a signed-in user
- **When** they add a plant by choosing a species, a nickname, its light exposure, and its last-watered date
- **Then** the plant appears in their list with a computed care schedule (watering, fertilizing, pruning) already populated

#### Acceptance Criteria
- The first schedule is visible immediately, with no separate configuration step.
- Watering interval reflects the species base interval adjusted for season and light exposure.

### US-02: User sees what needs care now

- **Given** a signed-in user with at least one plant
- **When** they open the dashboard
- **Then** they see care tasks grouped as "today" and "this week" across all their plants

#### Acceptance Criteria
- An empty state (no tasks due) shows an explanatory message, not a blank screen.
- Tasks show which plant and which action (water / fertilize / prune).

### US-03: User completes a task and the schedule adapts

- **Given** a care task that is due
- **When** the user marks it done
- **Then** the task's next occurrence is recalculated from the completion date

#### Acceptance Criteria
- Completing a task early moves the next occurrence forward relative to completion, not to the originally planned date.
- The change is reflected in the dashboard within the same interaction (no manual refresh).

### US-04: Overdue tasks shift the schedule

- **Given** a care task whose due date has passed without completion
- **When** the user views the dashboard
- **Then** the task is shown as overdue and the schedule reflects the slip

#### Acceptance Criteria
- Overdue tasks are visually distinct from upcoming tasks.
- Completing an overdue task recalculates the next occurrence from the actual completion date.

### US-05: Access control

- **Given** an unauthenticated visitor
- **When** they try to reach any plant or task view
- **Then** they are redirected to sign in, and after signing in see only their own data

#### Acceptance Criteria
- A user can create an account and sign in.
- No plant or task belonging to another user is ever returned.

## Functional Requirements

### Authentication & access
- FR-001: A visitor can create an account and sign in. Priority: must-have
- FR-002: A signed-in user can only see and manage their own plants and tasks. Priority: must-have

### Plant management (CRUD)
- FR-010: A user can add a plant by choosing a species, a nickname, a light exposure, and a last-watered date. Priority: must-have
- FR-011: A user can view a list of their plants. Priority: must-have
- FR-012: A user can edit a plant's details. Priority: must-have
- FR-013: A user can delete a plant. Priority: must-have

### Care scheduling (business logic)
- FR-020: The system generates a care schedule (watering, fertilizing, pruning) for each plant from species, current season, and light exposure. Priority: must-have
- FR-021: A user sees care tasks grouped as "today" and "this week" across all their plants. Priority: must-have
- FR-022: A user can mark a care task done, and its next occurrence is recalculated from the completion date. Priority: must-have
- FR-023: Overdue tasks are shown as overdue and the schedule reflects the slip. Priority: must-have

### Species reference
- FR-030: The system provides a curated species list (a seed of ~15–20 common houseplants) with base care intervals. Priority: must-have
- FR-031: A user can add a custom species with manual intervals when theirs is missing. Priority: nice-to-have

## Non-Functional Requirements

- A user sees today's care tasks within 1 second of opening the dashboard under normal use.
- A newly added plant shows its first computed schedule immediately, with no manual setup step.
- A user never sees, receives, or affects data belonging to another user.
- Completing a task reflects the recalculated schedule within the same interaction, without a manual page reload.
- The product remains usable on the latest two major versions of mainstream mobile and desktop browsers (web / installable PWA).

## Business Logic

**Each plant's care schedule (watering, fertilizing, pruning) is computed from its species, the current season, and its light exposure, and upcoming due dates auto-adjust whenever the user completes a task or lets it slip overdue.**

The rule consumes user-facing inputs: the plant's species (which carries base intervals for each care action), the current time of year, the plant's light exposure, and the history of when tasks were actually completed. Its output is, per plant and per care action, the next due date, plus an ordered view of what is due today and this week across all of the user's plants.

The user encounters the rule first when adding a plant — an immediate schedule appears — and continuously afterwards on the dashboard, where completing a task or missing it reshapes the following due dates. Season is determined by a fixed Northern-hemisphere calendar.

## Access Control

Multi-user with authentication. A visitor must create an account and sign in. Every plant, care task, and custom species belongs to exactly one user; a user can only read and mutate their own resources. Unauthenticated requests to any plant or task view are redirected to sign in. No admin or shared-workspace roles in the MVP.

## Non-Goals

- **No photo-based plant identification** — species is chosen from a list; keeps the first working flow small.
- **No social / community features** — no sharing, feeds, or following.
- **No marketplace or shopping** — the product advises care, it does not sell.
- **No IoT / hardware sensor integration** — inputs are user-entered, not measured.
- **No push or mobile notifications in the MVP** — care surfaces in the in-app dashboard; notifications may come later.
- **No internationalization** — single UI language (Polish) for the MVP.
- **No offline-first guarantee** — the app assumes connectivity.
- **No community-shared care presets in the MVP** — users cannot publish or browse each other's care methods yet; deferred as a post-MVP idea, not a permanent exclusion (avoids a cold-start empty dataset and social-feature scope).

## Open Questions

All shaping questions are resolved at PRD sign-off:

- **Species base-interval dataset** → curated seed of ~15–20 common houseplants (see FR-030).
- **Season definition** → fixed Northern-hemisphere calendar (see Business Logic).
- **Project name** → Flowerpot.

Deferred, non-blocking: user-shared care presets as a post-MVP idea (see Non-Goals).
