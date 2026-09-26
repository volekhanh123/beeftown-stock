/**
 * BEEFTOWN KHO — Kiểm thử phần web của Pha lóc 3 bước (GĐ5c)
 * ==========================================================
 *
 *     node test/test-kho-pha-web.mjs
 *
 * Hàm thuần trong web/src/lib/kho/pha-loc.ts — không cần database. Chỗ nào
 * phải khớp luật của database (nơi để sau pha, ngưỡng thu hồi thấp) thì so
 * với đúng thân hàm trong migration 0033.
 *
 *   · Bước 1: nút theo tảng (bỏ hàng chờ hủy / đang mang ra quầy, cộng kg
 *     không lệch số lẻ), lô điền sẵn khi chỉ có một lô.
 *   · Bước nào hiện theo trạng thái phiên và ?buoc=.
 *   · Nơi để sau pha: cùng luật kho_vi_tri_sau_pha.
 *   · Danh sách món đã quét: món vừa quét lên đầu, số nhãn đúng.
 *   · Dòng gõ tay điền sẵn theo công thức: chỉ phụ phẩm và phần bỏ.
 *   · Form lưu: ô "Để ở" trống → theo mặt hàng.
 *   · So thu hồi với dự kiến: cùng luật kho_chot_phien_pha.
 *   · Màn xong: lô còn ở kho lạnh → link chuyển ra quầy đúng lô.
 *   · Các trang pha lóc có đủ bước, không lộ tiền cho thủ kho.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import {
  tomTatTang, vaoMacDinh, buocPhien, viTriSauPha, monDaQuet, dongGoTayTheoCongThuc, soSanhThuHoi,
  goiRaQuay, cauDaQuet, docFormPhienPha, TEN_NGUON_DU_KIEN, VIEC_LUU_GO_TAY_TRUOC,
} from '../../web/src/lib/kho/pha-loc.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ WEB PHA LÓC 3 BƯỚC');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const THU_MUC_MIG = join(GOC, 'crm', 'supabase', 'migrations');
const cacMig = readdirSync(THU_MUC_MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort();
/** Nội dung migration mới nhất có chứa đoạn chữ này. */
function migMoiNhat(chua) {
  for (const f of [...cacMig].reverse()) {
    const s = readFileSync(join(THU_MUC_MIG, f), 'utf8');
    if (s.includes(chua)) return { ten: f, s };
  }
  return null;
}
const TRANG = join(GOC, 'web', 'src', 'pages', 'noi-bo', 'kho', 'pha-loc');
const docTrang = ten => readFileSync(join(TRANG, ten), 'utf8');
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** Một dòng tồn (kho_v_ton) đủ cột cho các hàm ở đây. */
const dongTon = (x) => ({
  lo_id: U(100), ma_lo: 'L1', mat_hang_id: U(1), ma_hang: 'T', ten_hang: 'Thăn tảng', nhom: null,
  loai_hang: 'tang', dem_goi: true, don_vi_goi: 'tảng', vi_tri_id: U(50), ten_vi_tri: 'Kho lạnh',
  loai_vi_tri: 'kho', so_kg: 10, so_goi: 1, nguon: 'nhap', ngay_dong_goi: '2026-09-20',
  han_dung: '2026-10-10', so_ngay_con: 15, tinh_trang_han: 'con_han', ...x,
});

// ===========================================================================
await nhom('1 · BƯỚC 1: NÚT THEO TẢNG', async () => {
  const ton = [
    dongTon({ lo_id: U(100), so_kg: 0.1, so_goi: 1 }),
    dongTon({ lo_id: U(101), so_kg: 0.2, so_goi: 1, han_dung: '2026-10-01' }),
    dongTon({ lo_id: U(102), so_kg: 5, so_goi: 1, loai_vi_tri: 'cho_huy' }),
    dongTon({ lo_id: U(103), so_kg: 5, so_goi: 1, loai_vi_tri: 'dang_chuyen' }),
    dongTon({ lo_id: U(104), mat_hang_id: U(2), ten_hang: 'Nạm', loai_hang: 'phan_cat', so_kg: 20, so_goi: 4 }),
    dongTon({ lo_id: U(105), mat_hang_id: U(3), ten_hang: 'Gân', loai_hang: 'phu_pham', so_kg: 3 }),
    dongTon({ lo_id: U(106), mat_hang_id: U(4), ten_hang: 'Ba chỉ tảng', so_kg: 0, so_goi: 0 }),
  ];
  const t = tomTatTang(ton);
  ok('Chỉ tảng nhập và phần cắt còn hàng (bỏ phụ phẩm, lô đã hết)',
     t.length === 2 && t.every(x => x.mat_hang_id !== U(3) && x.mat_hang_id !== U(4)), JSON.stringify(t.map(x => x.ten)));
  ok('Tảng nhập lên trước phần cắt (dù ít kg hơn)', t[0].mat_hang_id === U(1));
  ok('Không cộng hàng chờ hủy / đang mang ra quầy; 0,1 + 0,2 = 0,3 đúng', t[0].so_kg === 0.3, String(t[0].so_kg));
  ok('Đếm số tảng và số lô', t[0].so_goi === 2 && t[0].so_lo === 2);
  ok('Hạn gần nhất của loại tảng', t[0].han_gan === '2026-10-01');

  ok('Một lô duy nhất → điền sẵn (lấy hết)',
     JSON.stringify(vaoMacDinh(ton, U(2))) === JSON.stringify([{ lo_id: U(104), vi_tri_id: U(50) }]));
  ok('Nhiều lô → không đoán, để thợ chọn', vaoMacDinh(ton, U(1)).length === 0);
  ok('Hàng chờ hủy / đang mang ra quầy không bao giờ được điền sẵn',
     vaoMacDinh([dongTon({ loai_vi_tri: 'cho_huy' })], U(1)).length === 0
     && vaoMacDinh([dongTon({ loai_vi_tri: 'dang_chuyen' })], U(1)).length === 0);
});

// ===========================================================================
await nhom('2 · BƯỚC NÀO HIỆN', async () => {
  ok('Nháp, ghi được → Cân & quét', buocPhien('nhap', true, null) === 'can_quet');
  ok('Nháp + ?buoc=ket-qua → Kết quả', buocPhien('nhap', true, 'ket-qua') === 'ket_qua');
  ok('Nháp mà không ghi được (kế toán) → chỉ xem', buocPhien('nhap', false, 'ket-qua') === 'xem');
  ok('Đã chốt + ?buoc=xong → màn xong', buocPhien('da_chot', true, 'xong') === 'xong');
  ok('Đã chốt + ?buoc=ket-qua → xem (không chốt lại được)', buocPhien('da_chot', true, 'ket-qua') === 'xem');
  ok('Đã hủy → xem', buocPhien('da_huy', true, 'xong') === 'xem');
});

// ===========================================================================
await nhom('3 · NƠI ĐỂ SAU PHA (khớp kho_vi_tri_sau_pha)', async () => {
  const vt = [
    { id: 'CH', ten: 'Chờ hủy', loai: 'cho_huy', dang_dung: true, thu_tu: 0 },
    { id: 'DC', ten: 'Đang mang ra quầy', loai: 'dang_chuyen', dang_dung: true, thu_tu: 0 },
    { id: 'Q2', ten: 'Quầy 2', loai: 'quay', dang_dung: true, thu_tu: 2 },
    { id: 'Q1', ten: 'Quầy 1', loai: 'quay', dang_dung: true, thu_tu: 1 },
    { id: 'K0', ten: 'Kho cũ', loai: 'kho', dang_dung: false, thu_tu: 0 },
    { id: 'K1', ten: 'Kho lạnh', loai: 'kho', dang_dung: true, thu_tu: 5 },
  ];
  ok('Món để quầy → quầy đang dùng đầu tiên', viTriSauPha('quay', vt) === 'Q1');
  ok('Món để kho → kho lạnh đang dùng', viTriSauPha('kho', vt) === 'K1');
  ok('Chưa cài (null) → kho lạnh', viTriSauPha(null, vt) === 'K1' && viTriSauPha(undefined, vt) === 'K1');
  ok('Chi nhánh không có quầy → về kho lạnh', viTriSauPha('quay', vt.filter(v => v.loai !== 'quay')) === 'K1');
  ok('Không bao giờ là chờ hủy / đang mang ra quầy',
     viTriSauPha('kho', vt.filter(v => v.loai !== 'kho' && v.loai !== 'quay')) === null);
  const m = migMoiNhat('create or replace function kho_vi_tri_sau_pha(');
  const than = m ? m.s.slice(m.s.indexOf('create or replace function kho_vi_tri_sau_pha('), m.s.indexOf('comment on function kho_vi_tri_sau_pha')) : '';
  ok('Database cùng luật: chỉ kho / quầy đang dùng, null = kho, rồi thu_tu',
     /v\.dang_dung and v\.loai in \('kho', 'quay'\)/.test(than) && /coalesce\(p_noi, 'kho'\)/.test(than) && /v\.thu_tu/.test(than),
     m?.ten ?? 'không thấy hàm');
});

// ===========================================================================
await nhom('4 · DANH SÁCH MÓN ĐÃ QUÉT', async () => {
  const mh = new Map([
    [U(1), { ten: 'Thăn', dem_goi: true, don_vi_goi: 'gói' }],
    [U(2), { ten: 'Nạm', dem_goi: false, don_vi_goi: 'gói' }],
  ]);
  const ra = [
    { mat_hang_id: U(1), so_kg: 1.5, so_goi: 3, vi_tri_id: 'K1', tu_quet: true, thu_tu: 1 },
    { mat_hang_id: U(2), so_kg: 2.25, so_goi: 0, vi_tri_id: 'Q1', tu_quet: true, thu_tu: 2 },
    { mat_hang_id: U(3), so_kg: 0.8, so_goi: 0, vi_tri_id: null, tu_quet: false, thu_tu: 3 },
  ];
  const nhan = [
    { mat_hang_id: U(1), thu_tu: 10 }, { mat_hang_id: U(1), thu_tu: 11 }, { mat_hang_id: U(1), thu_tu: 12 },
    { mat_hang_id: U(2), thu_tu: 15 }, { mat_hang_id: U(2), thu_tu: 16 },
  ];
  const ds = monDaQuet(ra, nhan, mh);
  ok('Chỉ dòng quét nhãn (dòng gõ tay không vào đây)', ds.length === 2 && !ds.some(d => d.mat_hang_id === U(3)));
  ok('Món vừa quét lên đầu', ds[0].mat_hang_id === U(2), ds.map(d => d.ten).join(', '));
  ok('Số nhãn, gói, kg, nơi để đúng',
     ds[1].so_nhan === 3 && ds[1].so_goi === 3 && ds[1].so_kg === 1.5 && ds[1].vi_tri_id === 'K1'
     && ds[0].so_nhan === 2 && ds[0].so_goi === 0 && ds[0].dem_goi === false);
  ok('Câu sau khi quét', cauDaQuet(3, false) === 'Đã cộng 3 nhãn.' && /từ trước/.test(cauDaQuet(3, true))
     && cauDaQuet(0, false) === 'Chưa cộng được nhãn nào.');
});

// ===========================================================================
await nhom('5 · DÒNG GÕ TAY ĐIỀN SẴN THEO CÔNG THỨC', async () => {
  const mh = new Map([
    [U(1), { loai: 'phan_cat', xu_ly_mac_dinh: 'nhap_kho' }],
    [U(2), { loai: 'phu_pham', xu_ly_mac_dinh: 'nhap_kho' }],
    [U(3), { loai: 'phan_cat', xu_ly_mac_dinh: 'bo' }],        // mỡ bỏ
    [U(4), { loai: 'phan_cat', xu_ly_mac_dinh: 'nhap_kho' }],  // công thức ghi "bỏ"
    [U(5), { loai: 'phu_pham', xu_ly_mac_dinh: 'nhap_kho' }],  // đã có dòng
  ]);
  const dong = [
    { id: 'a', mat_hang_ra_id: U(1), ty_le_du_kien: 60, xu_ly: null, thu_tu: 1 },
    { id: 'b', mat_hang_ra_id: U(3), ty_le_du_kien: 10, xu_ly: null, thu_tu: 3 },
    { id: 'c', mat_hang_ra_id: U(2), ty_le_du_kien: 8, xu_ly: null, thu_tu: 2 },
    { id: 'd', mat_hang_ra_id: U(4), ty_le_du_kien: 2, xu_ly: 'bo', thu_tu: 4 },
    { id: 'e', mat_hang_ra_id: U(5), ty_le_du_kien: 2, xu_ly: null, thu_tu: 5 },
  ];
  const r = dongGoTayTheoCongThuc(dong, mh, new Set([U(5)]));
  ok('Chỉ phụ phẩm và phần bỏ, theo thứ tự công thức; phần cắt có nhãn thì quét',
     r.map(x => x.mat_hang_id).join() === [U(2), U(3), U(4)].join(), r.map(x => x.mat_hang_id).join());
  ok('Giữ cách xử lý của công thức, ô kg để trống', r[2].xu_ly === 'bo' && r.every(x => x.so_kg === '' && x.vi_tri_id === ''));
});

// ===========================================================================
await nhom('6 · FORM LƯU: "ĐỂ Ở" TRỐNG → THEO MẶT HÀNG', async () => {
  const f = new Map([
    ['ngay_pha', '2026-09-25'], ['so_vao', '0'], ['so_ra', '4'],
    ['r0_mat_hang', U(1)], ['r0_so_kg', '1,2'], ['r0_xu_ly', 'nhap_kho'], ['r0_so_goi', '2'],
    ['r1_mat_hang', U(2)], ['r1_so_kg', '0,8'], ['r1_xu_ly', 'nhap_kho'], ['r1_vi_tri', U(60)], ['r1_so_goi', '1'],
    ['r2_mat_hang', U(3)], ['r2_so_kg', '0,5'], ['r2_xu_ly', 'bo'],
    ['r3_mat_hang', U(4)], ['r3_so_kg', '0,3'], ['r3_xu_ly', ''],
  ]);
  const theoMon = id => (id === U(1) ? U(70) : U(71));
  const d = docFormPhienPha(f, theoMon);
  ok('Không lỗi', d.loi.length === 0, d.loi.join(' · '));
  ok('Trống ô "Để ở" → nơi để của mặt hàng', d.payloadRa[0].vi_tri_id === U(70));
  ok('Đã chọn thì giữ đúng chỗ đã chọn', d.payloadRa[1].vi_tri_id === U(60));
  ok('Phần bỏ không cần nơi để', !('vi_tri_id' in d.payloadRa[2]));
  ok('Xử lý mặc định của mặt hàng → vẫn gửi nơi để theo món (database bỏ qua nếu là bỏ)', d.payloadRa[3].vi_tri_id === U(71));
  const cu = docFormPhienPha(f);
  ok('Không truyền hàm nơi để → như cũ (không tự điền)', !('vi_tri_id' in cu.payloadRa[0]));

  // GĐ5e: dòng điền sẵn theo công thức (có món, chưa cân) không làm hỏng lượt
  // lưu — mỗi lượt quét giờ lưu phần gõ tay trước.
  const goiY = docFormPhienPha(new Map([
    ['ngay_pha', '2026-09-25'], ['so_vao', '0'], ['so_ra', '3'],
    ['r0_mat_hang', U(2)], ['r0_so_kg', ''], ['r0_xu_ly', ''],
    ['r1_mat_hang', U(4)], ['r1_so_kg', ''], ['r1_xu_ly', 'bo'],
    ['r2_mat_hang', U(3)], ['r2_so_kg', '0,4'], ['r2_xu_ly', ''],
  ]), theoMon);
  ok('Dòng gợi ý chưa cân (không kg, không gói) bị bỏ qua, không báo lỗi',
     goiY.loi.length === 0 && goiY.payloadRa.length === 1 && goiY.payloadRa[0].mat_hang_id === U(3), goiY.loi.join(' · '));
  const thieuKg = docFormPhienPha(new Map([['so_vao', '0'], ['so_ra', '1'], ['r0_mat_hang', U(2)], ['r0_so_goi', '2']]));
  ok('Có số gói mà thiếu kg vẫn báo', thieuKg.loi.length === 1 && /số kg/.test(thieuKg.loi[0]));
});

// ===========================================================================
await nhom('7 · THU HỒI SO VỚI DỰ KIẾN (khớp kho_chot_phien_pha)', async () => {
  ok('Thấp hơn quá ngưỡng → thấp', soSanhThuHoi(70, 75, 3).muc === 'thap' && soSanhThuHoi(70, 75, 3).chenh === -5);
  ok('Đúng bằng dự kiến − ngưỡng → chưa báo (so "nhỏ hơn")', soSanhThuHoi(72, 75, 3).muc === 'dat');
  ok('Cao hơn dự kiến → đạt', soSanhThuHoi(80, 75, 3).muc === 'dat');
  ok('Ngưỡng trống → mặc định 3 điểm', soSanhThuHoi(71.9, 75, null).muc === 'thap' && soSanhThuHoi(72.1, 75, undefined).muc === 'dat');
  ok('Chưa có dự kiến / chưa có thu hồi → chưa so', soSanhThuHoi(70, null, 3).muc === 'chua_ro' && soSanhThuHoi(null, 75, 3).muc === 'chua_ro');
  ok('Nguồn dự kiến có tên', TEN_NGUON_DU_KIEN.cong_thuc && TEN_NGUON_DU_KIEN.tb_30_ngay);
  const m = migMoiNhat('create or replace function kho_chot_phien_pha(');
  ok('Database cùng luật: thu hồi < dự kiến − coalesce(ngưỡng, 3)',
     !!m && /< \(v_dk ->> 'ty_le_du_kien'\)::numeric - coalesce\(v_nguong, 3\)/.test(m.s), m?.ten ?? 'không thấy');
  const nguon = migMoiNhat("add constraint kho_phien_pha_nguon_du_kien_hop_le");
  ok('Mọi nguồn dự kiến database nhận đều có tên',
     !!nguon && ['cong_thuc', 'tb_30_ngay'].every(k => nguon.s.includes(`'${k}'`) && TEN_NGUON_DU_KIEN[k]));
});

// ===========================================================================
await nhom('8 · MÀN XONG: CHUYỂN RA QUẦY NGAY', async () => {
  const ra = [{ lo_id: U(200) }, { lo_id: U(201) }, { lo_id: U(202) }, { lo_id: null }];
  const ton = [
    dongTon({ lo_id: U(200), ten_hang: 'Thăn', so_kg: 3, so_goi: 6, vi_tri_id: U(50), loai_vi_tri: 'kho' }),
    dongTon({ lo_id: U(201), ten_hang: 'Nạm', so_kg: 2, so_goi: 4, vi_tri_id: U(51), loai_vi_tri: 'quay' }),
    dongTon({ lo_id: U(202), ten_hang: 'Gầu', so_kg: 1, so_goi: 2, vi_tri_id: U(52), loai_vi_tri: 'cho_huy' }),
    dongTon({ lo_id: U(299), ten_hang: 'Lô khác', so_kg: 9, so_goi: 9, loai_vi_tri: 'kho' }),
  ];
  const g = goiRaQuay(ra, ton);
  ok('Chỉ lô của phiên này còn ở kho lạnh', g.lo.length === 1 && g.lo[0].lo_id === U(200));
  ok('N gói = số gói còn ở kho', g.tongGoi === 6);
  ok('Đếm gói đã để thẳng ở quầy', g.daOQuay === 4);
  ok('Link mở sẵn phiếu chuyển đúng nơi lấy và đúng lô',
     g.lo[0].link === `/noi-bo/kho/xuat/moi?loai=chuyen&tu=${U(50)}&lo=${U(200)}`, g.lo[0].link);
});

// ===========================================================================
await nhom('9 · CÁC TRANG PHA LÓC', async () => {
  ok('Có trang bước 1 /pha-loc/moi', existsSync(join(TRANG, 'moi.astro')));
  const moi = docTrang('moi.astro');
  const id = docTrang('[id].astro');
  ok('Bước 1: nút theo tảng, mỗi nút một ma_gui', /tomTatTang/.test(moi) && /taoPhienPha/.test(moi)
     && /tang\.map\(t => \(\s*<form method="POST">\s*<input type="hidden" name="ma_gui" value=\{crypto\.randomUUID\(\)\}/.test(moi));
  ok('Bước 2: ô quét trên cùng, tự đặt con trỏ', /<QuetMa[^>]*tuFocus/.test(id));
  ok('Bước 2: −1, bỏ lượt, bỏ món', /value="bot_mot"/.test(id) && /value="bo_luot"/.test(id) && /value="xoa_mon"/.test(id));
  // GĐ5e: gõ kg phụ phẩm rồi quét ngay không mất số — ô quét, −1, bỏ lượt, bỏ
  // món và các ô gõ kg cùng MỘT form; máy chủ lưu phần gõ tay trước.
  const buoc2 = id.slice(id.indexOf('BƯỚC 2 — CÂN & QUÉT'), id.indexOf('Hủy phiên nháp này'));
  const tuQuet = buoc2.slice(buoc2.indexOf('<QuetMa'));
  ok('Bước 2: ô quét và ô gõ kg trong cùng một form (không có </form> xen giữa)',
     buoc2.indexOf('<QuetMa') > buoc2.indexOf('<form') && !tuQuet.slice(0, tuQuet.indexOf('r${i}_so_kg')).includes('</form>'));
  ok('Món của −1 / bỏ món đi theo formaction, lệnh sửa có ma_gui riêng',
     /value="bot_mot" formaction=\{`\$\{DUONG\}\?mon=/.test(id) && /name="ma_gui_sua"/.test(id) && /q\.get\('mon'\)/.test(id));
  ok('Máy chủ lưu phần gõ tay trước khi quét / sửa',
     VIEC_LUU_GO_TAY_TRUOC.join() === 'quet,bo_luot,bot_mot,xoa_mon' && /VIEC_LUU_GO_TAY_TRUOC\.includes\(viec\)/.test(id)
     && id.indexOf('luuPhienPha', id.indexOf('VIEC_LUU_GO_TAY_TRUOC.includes(viec)')) < id.indexOf('quetPhienPha(k.client', id.indexOf('VIEC_LUU_GO_TAY_TRUOC.includes(viec)')));
  ok('Bỏ câu nhắc "bấm Lưu trước khi quét"', !/quét trước khi lưu|bấm <strong>Lưu<\/strong> trước/i.test(id));
  const chot = [...id.matchAll(/name="viec" value="chot"/g)].length;
  ok('Nút Chốt chỉ có một chỗ (bước Kết quả)', chot === 1
     && id.indexOf('value="chot"') > id.indexOf('BƯỚC 3 — KẾT QUẢ') && id.indexOf('value="chot"') < id.indexOf('XONG — CHUYỂN RA QUẦY'));
  ok('Chốt xong → màn "Chuyển ra quầy"', /'\?buoc=xong'/.test(id) && /goiRaQuay/.test(id));
  ok('Quản lý: nút "Đã xem" chỉ với quyền duyet', /k\.duoc\('duyet'\) \? \(/.test(id) && /value="da_xem"/.test(id));
  ok('Tiền chỉ hiện với xem_gia (thủ kho xem bản chỉ kg)',
     /xemThuPhienKg/.test(id) && /xemGia && buoc === 'ket_qua'/.test(id) && !/dinhDangTien/.test(moi));
  // huongDan có thể là biểu thức (vd. [id]: thu-hoi-thap cho quản lý) — test-kho-giao-dien nhóm 5 kiểm id có thật.
  ok('Mọi trang pha lóc bọc trong <Kho … huongDan=…>',
     ['moi.astro', '[id].astro'].every(f => /<Kho k=\{k\} tieuDe=[^\n]*huongDan=("[a-z-]+"|\{)/.test(docTrang(f))));
  ok('Bẫy Astro: không "{x.length && …}" in ra số 0',
     !/\{[a-zA-Z.]+\.length && /.test(id) && !/\{[a-zA-Z.]+\.length && /.test(moi));
});

process.exit(ketThuc('WEB PHA LÓC 3 BƯỚC'));
