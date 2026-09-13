import { useState, useEffect } from 'react';
import type { CreatePlantDto, Species, PlantWithTasksResponse } from '@10x-flowerpot/shared';

interface AddPlantFormProps {
  onPlantAdded?: (response: PlantWithTasksResponse) => void;
  onCancel?: () => void;
}

export function AddPlantForm({ onPlantAdded, onCancel }: AddPlantFormProps) {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(false);
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreatePlantDto>({
    speciesId: '',
    nickname: '',
    lightExposure: 'medium',
    lastWateredAt: new Date().toISOString().split('T')[0],
  });

  // Fetch species on mount
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const response = await fetch('/api/species');
        if (!response.ok) throw new Error('Failed to fetch species');
        const data = await response.json();
        setSpecies(data);
        // Set default species to first one
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, speciesId: data[0].id }));
        }
      } catch (err) {
        setError('Failed to load species list');
        console.error(err);
      } finally {
        setSpeciesLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add plant');
      }

      const result = (await response.json()) as PlantWithTasksResponse;
      setSuccess(true);

      // Reset form
      setFormData({
        speciesId: species[0]?.id || '',
        nickname: '',
        lightExposure: 'medium',
        lastWateredAt: new Date().toISOString().split('T')[0],
      });

      // Call callback
      onPlantAdded?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (speciesLoading) {
    return <div style={styles.loading}>Loading species...</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.formHeader}>
        <h3 style={styles.heading}>Add a New Plant</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={styles.closeButton}
          >
            ×
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>Plant added successfully!</div>}

      <div style={styles.formGroup}>
        <label htmlFor="speciesId" style={styles.label}>Species:</label>
        <select
          id="speciesId"
          name="speciesId"
          value={formData.speciesId}
          onChange={handleChange}
          required
          disabled={loading}
          style={styles.input}
        >
          {species.map((s) => (
            <option key={s.id} value={s.id}>
              {s.commonName}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label htmlFor="nickname" style={styles.label}>Nickname:</label>
        <input
          id="nickname"
          type="text"
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
          placeholder="e.g., My Monstera"
          required
          disabled={loading}
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label htmlFor="lightExposure" style={styles.label}>Light Exposure:</label>
        <select
          id="lightExposure"
          name="lightExposure"
          value={formData.lightExposure}
          onChange={handleChange}
          disabled={loading}
          style={styles.input}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="bright">Bright</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label htmlFor="lastWateredAt" style={styles.label}>Last Watered:</label>
        <input
          id="lastWateredAt"
          type="date"
          name="lastWateredAt"
          value={formData.lastWateredAt}
          onChange={handleChange}
          disabled={loading}
          style={styles.input}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Adding...' : 'Add Plant'}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--code-bg)',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    margin: 0,
    color: 'var(--text-h)',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    fontSize: '1.5rem',
    lineHeight: 1,
    cursor: 'pointer',
    padding: '0 0.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    color: 'var(--text)',
  },
  input: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg)',
    color: 'var(--text-h)',
    fontFamily: 'inherit',
    fontSize: '1rem',
  },
  loading: {
    padding: '1rem',
    color: 'var(--text)',
  },
  error: {
    padding: '0.75rem',
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error-text)',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  success: {
    padding: '0.75rem',
    backgroundColor: 'var(--success-bg)',
    color: 'var(--success-text)',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  button: {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--button-bg)',
    color: 'var(--button-text)',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
  } as const,
};
