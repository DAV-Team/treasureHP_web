import { useState } from 'react';
import { describeSaveError } from '../../lib/apiError';

/** Tracks the saving state and the error message of an admin form. */
export function useFormSubmit(onSubmit: (payload: Record<string, unknown>) => Promise<void>) {
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      await onSubmit(payload);
    } catch (caught) {
      setError(describeSaveError(caught));
    } finally {
      setSaving(false);
    }
  };
  return { isSaving, error, setError, submit };
}
