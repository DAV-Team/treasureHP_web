import { Award, BookOpenCheck, CheckCircle2, Compass, LayoutDashboard, MapPinned, Plus, ShieldAlert, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../hooks/useAuth';
import { describeApiError } from '../lib/apiError';
import {
  createAdminContent, deleteAdminContent, deleteAdminUser, getAdminBadges, getAdminChallenges, getAdminDashboard, getAdminLocations, getAdminProgress, getAdminUsers, updateAdminContent,
  type AdminBadge, type AdminChallenge, type AdminContentType, type AdminDashboard, type AdminLocation, type AdminUser,
} from '../services/admin';
import { AdminTable } from './admin/AdminTable';
import { rowLabel, type AdminRow, type AdminTab } from './admin/adminRows';
import { BadgeForm } from './admin/BadgeForm';
import { ChallengeForm } from './admin/ChallengeForm';
import { LocationForm } from './admin/LocationForm';
import { UserEditor } from './admin/UserEditor';

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'locations', label: 'Địa điểm' }, { id: 'challenges', label: 'Thử thách' }, { id: 'badges', label: 'Huy hiệu' }, { id: 'users', label: 'Người dùng' }, { id: 'progress', label: 'Tiến độ' },
];
const contentTabs: AdminContentType[] = ['locations', 'challenges', 'badges'];
const loaders = { locations: getAdminLocations, challenges: getAdminChallenges, badges: getAdminBadges, users: getAdminUsers, progress: getAdminProgress };
const noun: Record<AdminContentType, string> = { locations: 'địa điểm', challenges: 'thử thách', badges: 'huy hiệu' };

const isContentTab = (tab: AdminTab): tab is AdminContentType => (contentTabs as string[]).includes(tab);

interface Editing { type: AdminContentType; record: AdminRow | null }
interface PendingDelete { tab: AdminContentType | 'users'; row: AdminRow }

export function AdminPage() {
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<AdminTab>('locations');
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  // Rows remember which tab they belong to so a tab switch never renders them with another tab's columns.
  const [loaded, setLoaded] = useState<{ tab: AdminTab; rows: AdminRow[] } | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoadingData, setLoadingData] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [userEditor, setUserEditor] = useState<AdminUser | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isDeleting, setDeleting] = useState(false);
  // Only needed by the challenge form, which has to offer the locations to attach a challenge to.
  const [locationChoices, setLocationChoices] = useState<AdminLocation[]>([]);

  const refresh = useCallback(async () => {
    setLoadingData(true);
    setError('');
    try {
      const [summary, data] = await Promise.all([getAdminDashboard(), loaders[tab]()]);
      setDashboard(summary);
      setLoaded({ tab, rows: data as AdminRow[] });
    } catch {
      setError('Không thể tải dữ liệu quản trị.');
    } finally {
      setLoadingData(false);
    }
  }, [tab]);

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin, refresh]);

  if (isLoading) return null;
  if (!isAdmin || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
        <Card className="max-w-md p-7 text-center">
          <ShieldAlert className="mx-auto size-10 text-rose-500" />
          <h1 className="mt-4 text-xl font-black text-[#12294D]">Khu vực quản trị</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Bạn cần tài khoản quản trị để truy cập khu vực này.</p>
          <Link className="mt-5 inline-block rounded-full bg-[#12294D] px-5 py-2 text-sm font-bold text-white" to="/login">Đăng nhập</Link>
        </Card>
      </main>
    );
  }

  const changeTab = (next: AdminTab) => { setTab(next); setQuery(''); setNotice(''); };

  const openEditor = async (type: AdminContentType, record: AdminRow | null) => {
    if (type === 'challenges') {
      try { setLocationChoices(await getAdminLocations()); }
      catch { setError('Không thể tải danh sách địa điểm.'); return; }
    }
    setNotice('');
    setEditing({ type, record });
  };

  const saveContent = async (payload: Record<string, unknown>) => {
    if (!editing) return;
    const { type, record } = editing;
    // Errors propagate to the form, which shows them next to the button and keeps the entered data.
    if (record) await updateAdminContent(type, record._id, payload);
    else await createAdminContent(type, payload);
    setEditing(null);
    setNotice(record ? `Đã lưu ${noun[type]}.` : `Đã tạo ${noun[type]} mới.`);
    await refresh();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.tab === 'users') await deleteAdminUser(pendingDelete.row._id);
      else await deleteAdminContent(pendingDelete.tab, pendingDelete.row._id);
      setNotice(`Đã xóa "${rowLabel(pendingDelete.row)}".`);
      setPendingDelete(null);
      await refresh();
    } catch (caught) {
      setPendingDelete(null);
      setError(describeApiError(caught, 'Không thể xóa. Hãy thử lại.'));
    } finally {
      setDeleting(false);
    }
  };

  const metrics = dashboard
    ? [
      { label: 'Người dùng', value: dashboard.users, icon: Users, tone: 'text-sky-600 bg-sky-50' },
      { label: 'Địa điểm', value: dashboard.locations, icon: MapPinned, tone: 'text-emerald-600 bg-emerald-50' },
      { label: 'Thử thách', value: dashboard.challenges, icon: BookOpenCheck, tone: 'text-amber-600 bg-amber-50' },
      { label: 'Huy hiệu', value: dashboard.badges, icon: Award, tone: 'text-rose-600 bg-rose-50' },
    ]
    : [];
  const rows = loaded?.tab === tab ? loaded.rows : [];
  const isTableLoading = isLoadingData || loaded?.tab !== tab;
  const editable = isContentTab(tab) || tab === 'users';
  const editingRecord = editing?.record ?? null;
  const takenLocationIds = tab === 'challenges' ? (rows as AdminChallenge[]).flatMap((row) => (row.locationId ? [row.locationId._id] : [])) : [];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-black text-[#12294D]"><LayoutDashboard className="size-5" />Culture Quest Admin</div>
          <Link to="/" className="text-sm font-bold text-[#12294D]">Về ứng dụng</Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <h1 className="text-2xl font-black text-[#12294D]">Bảng điều hành</h1>
        <p className="mt-1 text-sm text-slate-600">Quản lý nội dung và theo dõi toàn bộ nghiệp vụ Culture Quest.</p>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="flex items-center gap-4 p-4">
              <span className={`grid size-10 place-items-center rounded-md ${tone}`}><Icon className="size-5" /></span>
              <div><strong className="block text-2xl text-[#12294D]">{value}</strong><span className="text-sm text-slate-600">{label}</span></div>
            </Card>
          ))}
        </section>

        {notice && <p role="status" className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-4" />{notice}</p>}

        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3">
            <div role="tablist" className="flex overflow-x-auto">
              {tabs.map((item) => (
                <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={`shrink-0 px-4 py-3 text-sm font-bold ${tab === item.id ? 'border-b-2 border-[#12294D] text-[#12294D]' : 'text-slate-500'}`} onClick={() => changeTab(item.id)}>{item.label}</button>
              ))}
            </div>
            {isContentTab(tab) && (
              <button type="button" onClick={() => void openEditor(tab, null)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#12294D] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1B3A6B]">
                <Plus className="size-4" />Thêm {noun[tab]}
              </button>
            )}
          </div>
          {error
            ? <p role="alert" className="p-5 text-sm text-rose-700">{error}</p>
            : isTableLoading
              ? <p className="p-5 text-sm text-slate-500">Đang tải dữ liệu...</p>
              : (
                <AdminTable
                  tab={tab}
                  rows={rows}
                  query={query}
                  onQueryChange={setQuery}
                  currentUserId={user.id}
                  onEdit={editable ? (row) => (isContentTab(tab) ? void openEditor(tab, row) : setUserEditor(row as AdminUser)) : undefined}
                  onDelete={editable ? (row) => setPendingDelete({ tab: isContentTab(tab) ? tab : 'users', row }) : undefined}
                />
              )}
        </Card>

        <Card className="mt-6 flex items-center gap-3 p-4">
          <Compass className="size-5 text-[#12294D]" />
          <p className="text-sm text-slate-600">Hoàn thành quest: <strong className="text-[#12294D]">{dashboard?.completed ?? 0}</strong> / Bản ghi tiến độ: <strong className="text-[#12294D]">{dashboard?.progress ?? 0}</strong></p>
        </Card>
      </div>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing ? `${editingRecord ? 'Sửa' : 'Thêm'} ${noun[editing.type]}` : ''} className="max-w-3xl">
        {editing?.type === 'locations' && <LocationForm record={editingRecord as AdminLocation | null} onSubmit={saveContent} onCancel={() => setEditing(null)} />}
        {editing?.type === 'challenges' && <ChallengeForm record={editingRecord as AdminChallenge | null} locations={locationChoices} takenLocationIds={takenLocationIds} onSubmit={saveContent} onCancel={() => setEditing(null)} />}
        {editing?.type === 'badges' && <BadgeForm record={editingRecord as AdminBadge | null} onSubmit={saveContent} onCancel={() => setEditing(null)} />}
      </Modal>
      <UserEditor user={userEditor} isSelf={userEditor?._id === user.id} onClose={() => setUserEditor(null)} onSaved={async () => { setUserEditor(null); setNotice('Đã lưu người dùng.'); await refresh(); }} />
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Xác nhận xóa"
        message={pendingDelete ? deleteMessage(pendingDelete) : ''}
        busy={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

function deleteMessage({ tab, row }: PendingDelete) {
  const name = `"${rowLabel(row)}"`;
  if (tab === 'users') return `Xóa người dùng ${name} cùng toàn bộ tiến độ và huy hiệu của họ? Hành động không thể hoàn tác.`;
  if (tab === 'locations') return `Xóa địa điểm ${name}? Thử thách và tiến độ của người chơi tại địa điểm này cũng bị xóa. Hành động không thể hoàn tác.`;
  if (tab === 'badges') return `Xóa huy hiệu ${name}? Huy hiệu sẽ bị gỡ khỏi những người đã nhận. Hành động không thể hoàn tác.`;
  return `Xóa thử thách ${name}? Hành động không thể hoàn tác.`;
}
