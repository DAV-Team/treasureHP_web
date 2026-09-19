import { useState, type FormEvent } from 'react';
import { Button } from '../../components/common/Button';
import { SelectField } from '../../components/common/FormControls';
import { FormField } from '../../components/common/FormField';
import { Modal } from '../../components/common/Modal';
import { describeSaveError } from '../../lib/apiError';
import { updateAdminUser, type AdminUser } from '../../services/admin';

interface UserEditorProps {
  user: AdminUser | null;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function UserEditor({ user, isSelf, onClose, onSaved }: UserEditorProps) {
  return (
    <Modal isOpen={user !== null} onClose={onClose} title="Sửa người dùng">
      {/* Keyed so each opened user starts from their own values. */}
      {user && <UserEditorForm key={user._id} user={user} isSelf={isSelf} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function UserEditorForm({ user, isSelf, onClose, onSaved }: { user: AdminUser; isSelf: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState('');
  const [isSaving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateAdminUser(user._id, { name: name.trim(), ...(isSelf ? {} : { role }) });
      await onSaved();
    } catch (caught) {
      setError(describeSaveError(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-600">{user.email}</p>
      <FormField label="Tên hiển thị" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={60} />
      <SelectField label="Vai trò" value={role} disabled={isSelf} hint={isSelf ? 'Bạn không thể đổi vai trò của chính mình.' : undefined} options={[{ value: 'player', label: 'Người chơi' }, { value: 'admin', label: 'Quản trị viên' }]} onChange={(event) => setRole(event.target.value as AdminUser['role'])} />
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>Hủy</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
      </div>
    </form>
  );
}
