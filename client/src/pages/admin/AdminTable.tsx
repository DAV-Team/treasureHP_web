import { Pencil, Search, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { categories } from '../../lib/categories';
import type { AdminBadge, AdminChallenge, AdminLocation, AdminProgress, AdminUser } from '../../services/admin';
import { rowLabel, searchableText, type AdminRow, type AdminTab } from './adminRows';

interface Column {
  header: string;
  cell: (row: never) => ReactNode;
}

const cellText = (primary: string, secondary?: string) => (
  <div className="min-w-0"><p className="truncate font-semibold text-navy">{primary}</p>{secondary && <p className="truncate text-xs text-slate-500">{secondary}</p>}</div>
);
const pill = (text: string, className: string) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}>{text}</span>;

const conditionLabel = (condition: AdminBadge['unlockCondition']) => {
  if (condition.type === 'fullQuestCompleted') return 'Hoàn thành Full Quest';
  if (condition.type === 'locationsInCategory') return `${condition.value} địa điểm ${condition.category ? categories[condition.category].label : ''}`;
  return `${condition.value} địa điểm bất kỳ`;
};

// Cells are typed against their own row shape; the table only ever passes the rows of the matching tab.
const typed = <Row,>(render: (row: Row) => ReactNode) => render as (row: never) => ReactNode;

const columns: Record<AdminTab, Column[]> = {
  locations: [
    { header: 'Địa điểm', cell: typed((row: AdminLocation) => cellText(row.name, row.slug)) },
    { header: 'Danh mục', cell: typed((row: AdminLocation) => pill(categories[row.category]?.label ?? row.category, categories[row.category]?.tint ?? 'bg-slate-100 text-slate-600')) },
    { header: 'XP', cell: typed((row: AdminLocation) => row.xpReward) },
    { header: 'Loại', cell: typed((row: AdminLocation) => (row.isSpecialQuest ? pill('Đặc biệt', 'bg-amber-100 text-amber-700') : pill('Thường', 'bg-slate-100 text-slate-600'))) },
  ],
  challenges: [
    { header: 'Level', cell: typed((row: AdminChallenge) => cellText(row.levelName)) },
    { header: 'Địa điểm', cell: typed((row: AdminChallenge) => row.locationId?.name ?? '-') },
    { header: 'Câu hỏi', cell: typed((row: AdminChallenge) => row.questions.length) },
    { header: 'XP', cell: typed((row: AdminChallenge) => row.xpReward) },
  ],
  badges: [
    { header: 'Huy hiệu', cell: typed((row: AdminBadge) => cellText(row.name, row.code)) },
    { header: 'Điều kiện', cell: typed((row: AdminBadge) => conditionLabel(row.unlockCondition)) },
    { header: 'Biểu tượng', cell: typed((row: AdminBadge) => `${row.icon} / ${row.colorTheme}`) },
  ],
  users: [
    { header: 'Người dùng', cell: typed((row: AdminUser) => cellText(row.name, row.email)) },
    { header: 'Vai trò', cell: typed((row: AdminUser) => (row.role === 'admin' ? pill('Quản trị', 'bg-violet-100 text-violet-700') : pill('Người chơi', 'bg-slate-100 text-slate-600'))) },
    { header: 'Level', cell: typed((row: AdminUser) => row.level) },
    { header: 'XP', cell: typed((row: AdminUser) => row.totalXp) },
  ],
  progress: [
    { header: 'Người dùng', cell: typed((row: AdminProgress) => row.userId?.name ?? '-') },
    { header: 'Địa điểm', cell: typed((row: AdminProgress) => row.locationId?.name ?? '-') },
    { header: 'Trạng thái', cell: typed((row: AdminProgress) => row.status) },
    { header: 'XP', cell: typed((row: AdminProgress) => row.xpEarned) },
  ],
};

interface AdminTableProps {
  tab: AdminTab;
  rows: AdminRow[];
  query: string;
  onQueryChange: (query: string) => void;
  currentUserId?: string;
  onEdit?: (row: AdminRow) => void;
  onDelete?: (row: AdminRow) => void;
}

export function AdminTable({ tab, rows, query, onQueryChange, currentUserId, onEdit, onDelete }: AdminTableProps) {
  const needle = query.trim().toLowerCase();
  const visible = needle ? rows.filter((row) => searchableText(row).toLowerCase().includes(needle)) : rows;
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-500 focus-within:border-navy">
          <Search className="size-4 shrink-0" />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm trong danh sách..." aria-label="Tìm trong danh sách" className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400" />
        </label>
        <p className="shrink-0 text-xs text-slate-500">{visible.length}/{rows.length} mục</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns[tab].map((column) => <th key={column.header} className="px-5 py-3">{column.header}</th>)}
              {hasActions && <th className="px-5 py-3 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const isSelf = tab === 'users' && row._id === currentUserId;
              return (
                <tr key={row._id} className="border-t border-slate-100">
                  {columns[tab].map((column) => <td key={column.header} className="px-5 py-3 text-slate-700">{column.cell(row as never)}</td>)}
                  {hasActions && (
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {onEdit && <button type="button" aria-label={`Sửa ${rowLabel(row)}`} onClick={() => onEdit(row)} className="grid size-8 place-items-center rounded-full text-navy hover:bg-slate-100"><Pencil className="size-4" /></button>}
                        {onDelete && (
                          <button type="button" aria-label={`Xóa ${rowLabel(row)}`} disabled={isSelf} title={isSelf ? 'Bạn không thể xóa chính mình' : undefined} onClick={() => onDelete(row)} className="grid size-8 place-items-center rounded-full text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"><Trash2 className="size-4" /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-5 text-sm text-slate-500">{rows.length === 0 ? 'Chưa có dữ liệu.' : 'Không có mục nào khớp tìm kiếm.'}</p>}
      </div>
    </div>
  );
}
