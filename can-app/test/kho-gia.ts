/**
 * Kho giả cho máy quầy (0054) — dùng chung cho test/thu.ts và
 * test/xem-giao-dien.ts. Ghi lại mọi lần gọi hàm kho (goiKho) và ảnh đã tải.
 *
 * 2.9.2 — nói như kho thật ở hai chỗ phiếu huỷ dựa vào:
 *   - ảnh: đường dẫn như taiAnh của web (`<chi nhánh>/huy/<ma_gui>/<số>.jpg`, số từ `batDau`); kho file không cho ghi đè
 *     (upsert: false) — đường dẫn đã có thì báo "The resource already exists" như Supabase Storage;
 *   - kho_tao_phieu_xuat: một ma_gui một phiếu (gửi lại trả phiếu cũ, da_co = true).
 * Chế độ hỏng: `hong.anh` (số thứ tự ảnh → 'luu-roi-loi': kho đã lưu nhưng trả lời không tới — hết giờ),
 * `hong.phieuXuat` (lần gọi tới: 'truoc' — mất mạng trước khi kho ghi; 'sau' — kho đã ghi, câu trả lời mất).
 */
import type { KhoTruyCap } from '../src/nghiep-vu.ts';
import type { BangQuay, TinhTrangHan } from '../src/quay.ts';

export function taoKhoGia() {
  const MH = { rib: '11111111-1111-4111-8111-111111111111', bap: '22222222-2222-4222-8222-222222222222', xx: '33333333-3333-4333-8333-333333333333' };
  const Q1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', Q2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const LD = { han: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', khac: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' };
  const lo = (id: string, mh: string, goi: number, kg: number, han: string, con: number, tt: TinhTrangHan, vt = Q1, tang: number | null = null) =>
    ({ lo_id: id, ma_lo: 'L' + id.slice(0, 4), mat_hang_id: mh, vi_tri_id: vt, so_goi: goi, so_kg: kg, han_dung: han, so_ngay_con: con,
       tinh_trang: tt, ngay_dong_goi: null, so_tang: tang });
  const L = { het: '44444444-4444-4444-8444-444444444444', can: '55555555-5555-4555-8555-555555555555',
              xa: '66666666-6666-4666-8666-666666666666', q2: '77777777-7777-4777-8777-777777777777' };
  const bang: BangQuay = {
    hom_nay: '2026-09-28', canh_bao_truoc_ngay: 1,
    vi_tri: [{ id: Q1, ten: 'Quầy thịt' }, { id: Q2, ten: 'Quầy 2' }],
    lo: [lo(L.het, MH.rib, 2, 0.9, '2026-09-27', -1, 'het_han', Q1, 142), lo(L.can, MH.rib, 3, 1.4, '2026-09-29', 1, 'sap_het', Q1, 150),
         lo(L.xa, MH.rib, 4, 1.8, '2026-10-02', 4, 'con_han'), lo(L.q2, MH.bap, 5, 2.5, '2026-09-29', 1, 'sap_het', Q2)],
    mon: [
      { id: MH.rib, ma: 'C-RIB', ten: 'Steak Ribeye Angus', nhom: 'Angus', loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', ma_can: '107', gia_ban_kg: 1350000, quay_toi_thieu_goi: 10, quay_toi_da_goi: 16, ton_toi_thieu_kg: null },
      { id: MH.bap, ma: 'C-BAP', ten: 'Bắp bò cắt lát', nhom: null, loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', ma_can: '130', gia_ban_kg: 480000, quay_toi_thieu_goi: null, quay_toi_da_goi: null, ton_toi_thieu_kg: null },
      { id: MH.xx, ma: 'H-XX', ten: 'Xúc xích', nhom: null, loai: 'phan_cat', dem_goi: true, don_vi_goi: 'hộp', ma_can: null, gia_ban_kg: 760000, quay_toi_thieu_goi: 4, quay_toi_da_goi: 10, ton_toi_thieu_kg: null },
    ],
    goi_y: [{ mat_hang_id: MH.rib, so_goi_quay: 7, so_kg_quay: 3.2, so_goi_dang_mang: 0, so_goi_kho: 20, so_kg_kho: 9, so_goi_de_nghi: 9, so_kg_de_nghi: 4 },
            { mat_hang_id: MH.xx, so_goi_quay: 0, so_kg_quay: 0, so_goi_dang_mang: 0, so_goi_kho: 0, so_kg_kho: 0, so_goi_de_nghi: 0, so_kg_de_nghi: 0 }],
    ma_giam: [{ id: 'g1', mat_hang_id: MH.rib, phan_tram: 30, ma_can: '90001', gia_giam_kg: 945000 }],
    yeu_cau: [], dang_mang: [], cho_duyet_huy: [],
    ly_do_huy: [{ id: LD.han, ten: 'Hết hạn dùng', can_anh: true }, { id: LD.khac, ten: 'Khác', can_anh: false }],
  };
  const goiKho: { ten: string; thamSo: Record<string, unknown> }[] = [];
  /** Ảnh tải lên được (kho trả lời được), theo thứ tự. */
  const anhDaTai: string[] = [];
  /** Mọi đường dẫn đang nằm trong kho file (kể cả ảnh đã lưu mà câu trả lời không tới). */
  const anhTrongKho = new Set<string>();
  /** Phiếu xuất đã ghi theo ma_gui → số phiếu. */
  const phieuXuat = new Map<string, string>();
  const hong: { anh: Map<number, 'luu-roi-loi'>; phieuXuat: 'truoc' | 'sau' | null } = { anh: new Map(), phieuXuat: null };
  const kho: KhoTruyCap = {
    async rpc(ten, thamSo) {
      goiKho.push({ ten, thamSo });
      if (ten === 'kho_bang_quay') return bang;
      if (ten === 'kho_tao_yeu_cau') return [{ yeu_cau_id: 'y1', so_phieu: 'YC-0001', da_co: false }];
      if (ten === 'kho_tao_phieu_xuat') {
        const maGui = String(thamSo.p_ma_gui);
        const cheDo = hong.phieuXuat;
        hong.phieuXuat = null;
        if (cheDo === 'truoc') throw new Error('TypeError: fetch failed');
        const daCo = phieuXuat.has(maGui);
        if (!daCo) phieuXuat.set(maGui, `PX-${String(9 + phieuXuat.size).padStart(4, '0')}`);
        if (cheDo === 'sau') throw new Error('TimeoutError: The operation timed out.');
        return [{ phieu_id: 'p-' + maGui, so_phieu: phieuXuat.get(maGui), da_co: daCo }];
      }
      if (ten === 'kho_luu_ma_giam') return { id: 'g2', ma_can: '90002', gia_giam_kg: 675000, ten: 'Steak Ribeye Angus', phan_tram: 50 };
      if (ten === 'kho_bat_ma_giam') return 'Đã tắt mã 90001.';
      if (ten === 'kho_can_o_ma') return [
        { o_ma_id: 'o1', mat_hang_id: MH.rib, ten: 'Steak Ribeye Angus', so_o: 1, ma_can: '10071', giao_id: 'g', tu_luc: '2026-09-27T01:00:00Z',
          so_phieu_loc: 'PL-1', trang_thai_phien: 'da_chot', lo_id: L.can, ma_lo: 'L1', han_dung: '2026-09-29', so_tang: 150, ma_lo_tang: 'LT',
          kg_ra: 2, goi_ra: 4, con_kg: 1.4, con_goi: 3, kg_ban: 0.5, goi_ban: 1, kg_huy: 0, kg_khac: 0, so_ban_dung_o: 1, so_lech_o: 2, con_giu: true },
        { o_ma_id: 'o2', mat_hang_id: MH.rib, ten: 'Steak Ribeye Angus', so_o: 2, ma_can: '10072', giao_id: null, tu_luc: null,
          so_phieu_loc: null, trang_thai_phien: null, lo_id: null, ma_lo: null, han_dung: null, so_tang: null, ma_lo_tang: null,
          kg_ra: null, goi_ra: null, con_kg: 0, con_goi: 0, kg_ban: 0, goi_ban: 0, kg_huy: 0, kg_khac: 0, so_ban_dung_o: 0, so_lech_o: 0, con_giu: false },
      ];
      if (ten === 'kho_bao_cao_ban_gio') return [
        { ngay: '2026-09-27', gio: 11, mat_hang_id: MH.rib, ma: 'C-RIB', ten: 'Steak Ribeye Angus', nhom: 'Angus', so_dong: 3, so_kg: '1.500', so_goi: 3, doanh_thu: 2025000,
          so_dong_giam: 1, so_kg_giam: '0.5', doanh_thu_giam: 472500, tien_giam: 202500, so_dong_giam_som: 1, so_dong_lech_o: 1 },
        { ngay: '2026-09-28', gio: 18, mat_hang_id: MH.bap, ma: 'C-BAP', ten: 'Bắp bò cắt lát', nhom: null, so_dong: 2, so_kg: '1', so_goi: 2, doanh_thu: 480000,
          so_dong_giam: 0, so_kg_giam: '0', doanh_thu_giam: 0, tien_giam: 0, so_dong_giam_som: 0, so_dong_lech_o: 0 },
      ];
      if (ten === 'kho_bao_cao_tang') return [{ lo_id: 't', so_tang: 150, ma_lo: 'LT', ten_hang: 'Ribeye Angus (tảng)', ten_ncc: 'NCC', ngay_nhan: null, ngay_loc: null,
        kg_ncc: 6, kg_repack: 5.9, kg_vao_loc: 5.9, kg_thit: 4.2, thu_hoi_pt: 71, kg_ban: 2, kg_huy: 0, kg_con: 2.2, ban_pt: 48, so_ngay_ban: 2, tinh_trang: 'dang_ban' }];
      throw new Error('Kho giả không có hàm ' + ten);
    },
    async bang(ten) {
      if (ten === 'kho_ma_giam') return [{ id: 'g1', mat_hang_id: MH.rib, phan_tram: 30, ma_can: '90001', dang_dung: true },
                                         { id: 'g0', mat_hang_id: MH.bap, phan_tram: 20, ma_can: '90003', dang_dung: false }];
      if (ten === 'kho_mat_hang') return [{ id: MH.rib, ma: 'C-RIB', ten: 'Steak Ribeye Angus', ma_can: '107', gia_ban_kg: '1350000', dang_dung: true },
                                          { id: MH.bap, ma: 'C-BAP', ten: 'Bắp bò cắt lát', ma_can: '130', gia_ban_kg: 480000, dang_dung: true },
                                          { id: MH.xx, ma: 'H-XX', ten: 'Xúc xích', ma_can: null, gia_ban_kg: 760000, dang_dung: true },
                                          { id: 'x-tang', ma: 'T-RIB', ten: 'Ribeye tảng', ma_can: null, gia_ban_kg: null, dang_dung: true }];
      return [];
    },
    async taiAnhHuy(cn, maGui, tep, batDau = 1) {
      const duongDan: string[] = [], loi: string[] = [];
      let so = batDau;
      for (const f of tep) {
        const duong = `${cn}/huy/${maGui}/${so}.jpg`;
        const h = hong.anh.get(so);
        so += 1;
        if (anhTrongKho.has(duong)) { loi.push(`"${f.name}" chưa tải lên được (The resource already exists)`); continue; }
        anhTrongKho.add(duong);
        if (h === 'luu-roi-loi') { loi.push(`"${f.name}" chưa tải lên được (The operation timed out.)`); continue; }
        anhDaTai.push(duong);
        duongDan.push(duong);
      }
      return { duongDan, loi };
    },
  };
  return { kho, goiKho, anhDaTai, anhTrongKho, phieuXuat, hong, bang, MH, Q1, Q2, LD, L };
}
