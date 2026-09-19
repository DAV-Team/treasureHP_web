import axios from 'axios';

export function apiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** Vietnamese message for the failures every form can hit; `fallback` covers the rest. */
export function describeApiError(error: unknown, fallback: string): string {
  const status = apiErrorStatus(error);
  if (status === undefined) return 'Không thể kết nối tới máy chủ. Hãy kiểm tra mạng và thử lại.';
  if (status === 429) return 'Bạn thao tác quá nhanh. Hãy đợi một chút rồi thử lại.';
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Hãy thử lại sau.';
  return fallback;
}

/** The raw `message` NestJS puts in an error body (a string, or the first of several validation messages). */
export function apiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return '';
  const message: unknown = error.response?.data?.message;
  if (Array.isArray(message)) return String(message[0] ?? '');
  return typeof message === 'string' ? message : '';
}

/** Message for a failed create/update: explains duplicates and invalid data instead of a generic error. */
export function describeSaveError(error: unknown): string {
  const status = apiErrorStatus(error);
  const message = apiErrorMessage(error);
  if (status === 409) return message.includes('challenge') ? 'Địa điểm này đã có thử thách. Hãy sửa thử thách hiện có.' : 'Slug hoặc mã này đã tồn tại. Hãy chọn giá trị khác.';
  if (status === 400) return message ? `Dữ liệu chưa hợp lệ: ${message}` : 'Dữ liệu chưa hợp lệ.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  return describeApiError(error, 'Không thể lưu. Hãy thử lại.');
}
