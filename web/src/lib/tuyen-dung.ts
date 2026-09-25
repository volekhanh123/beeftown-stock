/** Đọc tin tuyển dụng đã công bố. Chưa có database thì trả về mảng rỗng, và
 *  trang tự dùng danh sách dự phòng tĩnh. */
import { taoClient } from './noi-dung';
import type { NgonNgu } from './noi-dung';
import type { ViTri } from '../components/TrangTuyenDung.astro';

export async function docViTri(ngonNgu: NgonNgu = 'vi'): Promise<ViTri[]> {
  const client = taoClient();
  if (!client) return [];
  try {
    const { data, error } = await client.rpc('tin_tuyen_dung_cong_khai', {
      p_ngon_ngu: ngonNgu,
    });
    if (error || !Array.isArray(data)) return [];
    return data as ViTri[];
  } catch {
    return [];
  }
}
