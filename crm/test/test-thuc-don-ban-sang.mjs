/**
 * BEEFTOWN CRM — THỰC ĐƠN THEO CUỐN MENU BẢN SÁNG (migration 0091)
 * ================================================================
 *
 *     node test/test-thuc-don-ban-sang.mjs
 *
 * Khánh chốt cuốn menu in "bản sáng" ngày 11/10/2026. 0091 đưa danh mục trong database (seed 0011:
 * 13 nhóm, 31 món) về đúng cuốn: 17 nhóm dùng, 42 món còn dùng, 10 món thu hồi, 3 nhóm tắt — và
 * KHÔNG công bố gì. Điều cần chứng minh, ngay sau 0091:
 *
 *   1. Danh mục: đúng nhóm, tên ba thứ tiếng, thứ tự; đúng số món từng nhóm, thứ tự món; 52 dòng.
 *   2. Không món nào công bố, không giá (gia_de_xuat chỉ 4 món = 69.000), không độ cay duyệt (độ cay
 *      đề xuất theo cuốn), đúng 2 món sống, chưa mô tả công khai, chưa câu cảnh báo.
 *   3. Trang công khai rỗng kể cả khi bật hai công tắc; món thu hồi KHÔNG BAO GIỜ lên trang; view
 *      món còn vướng (trang Tổng quan /noi-bo đọc thẳng) không có món thu hồi, nhóm tắt.
 *   4. Sổ bản dịch (0036): tên ba thứ tiếng là bản tay của tên tiếng Việt mới — máy không dịch đè.
 *   5. Chạy lại 0091 ngay sau lần đầu: không lỗi, dữ liệu y hệt.
 *   6. Quyền: anon không đọc bảng; marketing sửa được món, không sửa được nhóm; vai khác bị từ chối.
 *   7. Database KHÔNG còn đúng seed (Beeftown-thu sau web/THUC-DON.md bản cũ, có bản dịch máy):
 *      0091 đưa về đúng như database mới cài — không món nào còn công bố với mô tả của tên cũ.
 *   8. Chạy lại 0091 SAU khi đã làm tiếp (công bố, duyệt giá, duyệt độ cay, ghi mô tả, ghi cảnh báo)
 *      → khối chặn đầu file từ chối, không cột nào của bất kỳ dòng nào đổi.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, dungDatabaseTrong, taoBoDem, UID } from './kho-chung.mjs';

const THU_MUC_MIGRATION = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
const TEN_FILE = readdirSync(THU_MUC_MIGRATION).find(f => /^\d{4}_thuc_don_ban_sang\.sql$/.test(f));
const SQL_0091 = readFileSync(join(THU_MUC_MIGRATION, TEN_FILE), 'utf8');
const SO_MIGRATION = Number(TEN_FILE.slice(0, 4));

const { ok, nhom, ketThuc } = taoBoDem(`BEEFTOWN CRM — THỰC ĐƠN THEO CUỐN MENU BẢN SÁNG (${TEN_FILE})`);

// ---------------------------------------------------------------------------
// Danh mục chép tay từ cuốn (danh mục 11/10/2026) — sửa nhầm migration là đỏ
// ---------------------------------------------------------------------------
/** [mã, tên vi, tên en, tên ko, loại, thứ tự, các món theo thứ tự] — 17 nhóm đang dùng. */
const NHOM = [
  ['goi-them', 'Gọi thêm tùy chọn', 'Add-ons', '추가 메뉴', 'goi_them', 3, ['S01']],
  ['bo-tai-quay', 'Bò tại quầy', 'Beef at the Counter', '정육 코너', 'thit_bo', 4, []],
  ['dac-trung', 'Món đặc trưng', 'Signature', '시그니처 메뉴', 'khai_vi', 5, ['F03', 'F19']],
  ['lau', 'Lẩu', 'Hot pot', '전골', 'mon_chinh', 6, ['F15', 'F16', 'F20']],
  ['salad', 'Salad', 'Salads', '샐러드', 'khai_vi', 7, ['F21', 'F01', 'F10']],
  ['mon-them', 'Món thêm', 'Sides', '사이드 메뉴', 'khai_vi', 8, ['F22', 'F23', 'F18']],
  ['canh', 'Canh', 'Stews', '찌개', 'mon_chinh', 9, ['F12', 'F14', 'F13']],
  ['com', 'Cơm', 'Rice', '밥', 'mon_chinh', 10, ['F06', 'F05', 'F04']],
  ['mi-y', 'Mì', 'Noodles & pasta', '면·파스타', 'mon_chinh', 11, ['F11', 'F08', 'F07', 'F09']],
  ['do-uong-signature', 'Signature', 'Signature drinks', '시그니처 드링크', 'do_uong', 12, ['D13', 'D01', 'D14']],
  ['highball', 'Highball', 'Highball', '하이볼', 'do_uong', 13, ['D02', 'D15']],
  ['bia', 'Bia', 'Beer', '맥주', 'do_uong', 14, ['D16', 'D17']],
  ['soju', 'Soju', 'Soju', '소주', 'do_uong', 15, ['D18', 'D19', 'D20']],
  ['makgeolli', 'Makgeolli', 'Makgeolli', '막걸리', 'do_uong', 16, ['D21']],
  ['khong-con', 'Nước ép & ade', 'Juice & ade', '주스·에이드', 'do_uong', 17, ['D09', 'D22', 'D10', 'D23']],
  ['nuoc-ngot', 'Nước ngọt', 'Soft drinks', '탄산음료', 'do_uong', 18, ['D24', 'D25', 'D26']],
  ['nuoc-suoi', 'Nước suối', 'Water', '생수', 'do_uong', 19, ['D27', 'D28']],
];
const NHOM_TAT = ['mien-mi', 'trang-mieng', 'cocktail'];
const THU_HOI = ['F02', 'F17', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D11', 'D12'];
const LY_DO_THU_HOI = 'Không có trong thực đơn chốt 11/10/2026 (cuốn menu bản sáng).';
const CON_DUNG = NHOM.flatMap(n => n[6]);
const NHOM_DO_UONG = NHOM.filter(n => n[4] === 'do_uong').map(n => n[0]);
const DO_UONG = NHOM.filter(n => n[4] === 'do_uong').flatMap(n => n[6]);
const MON_AN = CON_DUNG.filter(m => !DO_UONG.includes(m));
const SIGNATURE = ['D13', 'D01', 'D14'];
const CO_CON = ['D13', 'D01', 'D14', 'D02', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21'];
/** Số ớt in trong cuốn (số giả lập) → muc_cay_de_xuat. */
const CAY_DE_XUAT = { S01: 0, F03: 0, F19: 2, F15: 2, F16: 0, F20: 0, F21: 0, F01: 0, F10: 0, F22: 0, F23: 1, F18: 0,
  F12: 2, F14: 2, F13: 1, F06: 1, F05: 1, F04: 0, F11: 3, F08: 1, F07: 0, F09: 0 };
/** Trang của cuốn: lẩu 7, set sốt 8, salad 9, món thêm 10, canh 11, cơm 12, mì 13, có cồn 14, không cồn 15; tờ kẹp null. */
const TRANG_NHOM = { 'goi-them': 8, 'dac-trung': null, lau: 7, salad: 9, 'mon-them': 10, canh: 11, com: 12, 'mi-y': 13 };
const CAU_DO_UONG = 'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).';
/** Tên vài món chép tay (tên đổi so với seed 0011, chữ "kim chi" của tên giữ đúng cuốn). */
const TEN_MAU = {
  F03: ['Tartare bò hoa tuyết', 'Snow flower flank tartare', '눈꽃치즈 소고기 타르타르'],
  F19: ['Cơm trộn tartare bò cay', 'Spicy flank tartare rice bowl', '매콤 육회비빔밥'],
  F14: ['Đậu phụ hầm', 'Sundubu jjigae', '순두부찌개'],
  F15: ['Lẩu kim chi', 'Kimchi hot pot', '김치전골'],
  F18: ['Bánh gạo chiên phô mai', 'Fried injeolmi rice cake', '치즈 인절미 튀김'],
  S01: ['Set 4 sốt', 'Signature set', '시그니처 소스 4종 세트'],
  D01: ['Strawberry Crush', 'Strawberry Crush', '스트로베리 크러시'],
  D10: ['Ade chanh', 'Lemon ade', '레몬에이드'],
  D26: ['Soda chanh', 'Lemon-lime soda', '사이다'],
  D28: ['Nước có ga', 'Sparkling water', '탄산수'],
};

const { db, duoi, duoiAnon } = await dungDatabase();
const mon = async () => (await db.query(`
  select m.*, g.ma as nhom_ma, g.dang_dung as nhom_dang_dung
  from mon_an m join nhom_mon g on g.id = m.nhom_mon_id order by g.thu_tu, m.thu_tu`)).rows;
const theoMa = rows => Object.fromEntries(rows.map(r => [r.ma, r]));
const danhSach = a => [...a].sort().join(',');

/** Mọi cột nghiệp vụ của món và nhóm (không id, không giờ ghi) — để so hai database với nhau. */
const COT_MON = `m.ma, g.ma as nhom, m.thu_tu, m.ten_vi, m.ten_en, m.ten_ko, m.mo_ta_vi, m.mo_ta_en, m.mo_ta_ko, m.copy_nhap,
  m.nguyen_van_nguon, m.can_xac_nhan, m.trang_thai, m.cong_bo_luc, m.gia_de_xuat, m.gia, m.gia_da_duyet, m.muc_cay_de_xuat,
  m.muc_cay, m.muc_cay_da_duyet, m.co_con, m.la_mon_song, m.canh_bao, m.canh_bao_en, m.canh_bao_ko, m.khau_phan, m.shot_id, m.trang_in`;
const chupDanhMuc = async d => JSON.stringify([
  (await d.query(`select ${COT_MON} from mon_an m join nhom_mon g on g.id = m.nhom_mon_id order by m.ma`)).rows,
  (await d.query(`select ma, ten_vi, ten_en, ten_ko, loai, thu_tu, dang_dung, khong_niem_yet_gia, mo_ta_vi from nhom_mon order by ma`)).rows,
]);
/** Danh mục ngay sau khi cài (mục 3 và 6 sửa vài dòng sau đó). */
const DANH_MUC_MOI_CAI = await chupDanhMuc(db);

// ===========================================================================
await nhom('1 · DANH MỤC ĐÚNG CUỐN: 17 NHÓM, 42 MÓN CÒN DÙNG, 10 MÓN THU HỒI', async () => {
  const { rows: g } = await db.query(`select * from nhom_mon order by thu_tu, ma`);
  const gm = theoMa(g);
  ok('20 nhóm: 17 đang dùng, 3 đã tắt (mien-mi, trang-mieng, cocktail) — không xóa nhóm nào',
     g.length === 20 && danhSach(g.filter(x => x.dang_dung).map(x => x.ma)) === danhSach(NHOM.map(n => n[0]))
       && danhSach(g.filter(x => !x.dang_dung).map(x => x.ma)) === danhSach(NHOM_TAT),
     g.map(x => `${x.ma}${x.dang_dung ? '' : '(tắt)'}`).join(','));
  const sai = NHOM.filter(([ma, vi, en, ko, loai, tt]) => {
    const x = gm[ma];
    return !x || x.ten_vi !== vi || x.ten_en !== en || x.ten_ko !== ko || x.loai !== loai || x.thu_tu !== tt;
  }).map(n => n[0]);
  ok('17 nhóm đúng tên vi / en / ko, loại và thứ tự trang của cuốn', sai.length === 0, sai.join(','));
  ok('Bò tại quầy vẫn không niêm yết giá; nhóm mới đều niêm yết',
     gm['bo-tai-quay'].khong_niem_yet_gia === true && g.filter(x => x.ma !== 'bo-tai-quay').every(x => !x.khong_niem_yet_gia));

  const m = await mon();
  ok('52 dòng món: 42 còn dùng + 10 thu hồi (21 dòng cũ giữ, 21 dòng mới, không xóa dòng nào)',
     m.length === 52 && m.filter(x => x.trang_thai !== 'da_thu_hoi').length === 42, `${m.length} dòng`);
  const lechNhom = NHOM.filter(([ma, , , , , , ds]) =>
    m.filter(x => x.nhom_ma === ma && x.trang_thai !== 'da_thu_hoi').map(x => x.ma).join() !== ds.join()).map(n => n[0]);
  ok('Mỗi nhóm đúng số món và đúng thứ tự món của cuốn (món dẫn đầu trang có thu_tu nhỏ nhất)', lechNhom.length === 0, lechNhom.join(','));
  ok('22 món ăn (2 đặc trưng, 3 lẩu, 1 set sốt, 3 salad, 3 món thêm, 3 canh, 3 cơm, 4 mì) + 20 đồ uống',
     MON_AN.length === 22 && DO_UONG.length === 20);
  ok('Nhóm đã tắt không còn món nào đang dùng',
     m.filter(x => !x.nhom_dang_dung && x.trang_thai !== 'da_thu_hoi').length === 0);

  const mm = theoMa(m);
  ok('Đúng 10 món thu hồi (da_thu_hoi), lý do ghi ở can_xac_nhan',
     danhSach(m.filter(x => x.trang_thai === 'da_thu_hoi').map(x => x.ma)) === danhSach(THU_HOI)
       && THU_HOI.every(ma => mm[ma].can_xac_nhan === LY_DO_THU_HOI));
  ok('Món thu hồi giữ nguyên tên, bản nháp, câu nguồn, mã ảnh của bảng 17/09 (để truy vết)',
     mm.F02.ten_vi === 'Salad bò nướng' && mm.D06.ten_en === 'Beeftown Mule' && /BeefTown Mule/.test(mm.D06.nguyen_van_nguon)
       && mm.D11.copy_nhap === '[Chờ xác nhận loại trái cây và công thức]' && mm.F17.shot_id === 'P-F17');
  const lechTen = Object.entries(TEN_MAU).filter(([ma, [vi, en, ko]]) =>
    mm[ma]?.ten_vi !== vi || mm[ma]?.ten_en !== en || mm[ma]?.ten_ko !== ko).map(([ma]) => ma);
  ok('Tên ba thứ tiếng đúng cuốn ở các món mẫu (đổi tên, dời nhóm, món mới)', lechTen.length === 0,
     lechTen.map(ma => `${ma}: ${mm[ma]?.ten_vi} / ${mm[ma]?.ten_en} / ${mm[ma]?.ten_ko}`).join(' · '));
  const thieuKo = m.filter(x => x.trang_thai !== 'da_thu_hoi' && !/[가-힣]/.test(x.ten_ko ?? '')).map(x => x.ma);
  ok('42 món còn dùng đều có tên tiếng Hàn (chữ Hàn), ghi ngay trong migration', thieuKo.length === 0, thieuKo.join(','));
});

// ===========================================================================
await nhom('2 · KHÔNG CÔNG BỐ, KHÔNG GIÁ, KHÔNG DUYỆT ĐỘ CAY — CHỈ ĐỀ XUẤT', async () => {
  const m = await mon();
  const mm = theoMa(m);
  const dung = m.filter(x => x.trang_thai !== 'da_thu_hoi');
  ok('Mọi món còn dùng ở trạng thái nhap; không món nào da_cong_bo',
     dung.every(x => x.trang_thai === 'nhap') && !m.some(x => x.trang_thai === 'da_cong_bo'));
  ok('Không món nào có giá (gia null, gia_da_duyet false — cả 52 dòng)', m.every(x => x.gia === null && x.gia_da_duyet === false));
  const coDeXuat = m.filter(x => x.gia_de_xuat !== null);
  ok('gia_de_xuat chỉ ở 4 món có giá thật theo menu chuẩn 29/09: S01 và ba ly signature, đều 69.000',
     danhSach(coDeXuat.map(x => x.ma)) === danhSach(['S01', ...SIGNATURE]) && coDeXuat.every(x => Number(x.gia_de_xuat) === 69000),
     coDeXuat.map(x => `${x.ma}=${x.gia_de_xuat}`).join(','));
  ok('muc_cay null ở mọi dòng (số ớt của cuốn là số giả lập, chưa duyệt)', m.every(x => x.muc_cay === null && x.muc_cay_da_duyet === false));
  const lechCay = MON_AN.filter(ma => mm[ma].muc_cay_de_xuat !== CAY_DE_XUAT[ma]);
  ok('muc_cay_de_xuat của 22 món ăn đúng số ớt in trong cuốn', lechCay.length === 0,
     lechCay.map(ma => `${ma}: ${mm[ma].muc_cay_de_xuat} ≠ ${CAY_DE_XUAT[ma]}`).join(','));
  ok('Đồ uống không có độ cay đề xuất', DO_UONG.every(ma => mm[ma].muc_cay_de_xuat === null));
  ok('Đúng 2 món sống: F03, F19 (F07 Mì carbonara chờ quyết — vẫn false)',
     m.filter(x => x.la_mon_song).map(x => x.ma).join() === 'F03,F19', m.filter(x => x.la_mon_song).map(x => x.ma).join());
  ok('Có cồn: đúng 3 ly signature, 2 highball, 2 bia, 3 soju, 1 makgeolli',
     danhSach(dung.filter(x => x.co_con).map(x => x.ma)) === danhSach(CO_CON), dung.filter(x => x.co_con).map(x => x.ma).join());
  ok('mo_ta_vi / mo_ta_en / mo_ta_ko null ở mọi dòng (chỉ ghi ở bước công bố của web/THUC-DON.md)',
     m.every(x => x.mo_ta_vi === null && x.mo_ta_en === null && x.mo_ta_ko === null));
  ok('canh_bao ba thứ tiếng null ở mọi dòng', m.every(x => x.canh_bao === null && x.canh_bao_en === null && x.canh_bao_ko === null));

  const coMoTaCuon = dung.filter(x => x.copy_nhap !== null).map(x => x.ma);
  ok('Mô tả của cuốn ở cột nội bộ: đúng 25 món (22 món ăn, 3 ly signature) có copy_nhap và nguyen_van_nguon',
     danhSach(coMoTaCuon) === danhSach([...MON_AN, ...SIGNATURE])
       && dung.every(x => (x.copy_nhap === null) === (x.nguyen_van_nguon === null)),
     coMoTaCuon.join(','));
  ok('17 đồ uống dạng danh sách không có mô tả nào (không tự viết thay cuốn)',
     DO_UONG.filter(ma => !SIGNATURE.includes(ma)).every(ma => mm[ma].copy_nhap === null && mm[ma].nguyen_van_nguon === null));
  ok('Mô tả của cuốn ở cột nội bộ: S01 gộp câu và danh sách 4 sốt; F15 giữ chữ "kimchi" của mô tả',
     mm.S01.copy_nhap === '4 sốt hâm nóng ngay trên vỉ: phô mai, tare, ssamjang, sốt cay Tứ Xuyên. Kèm kimchi nhà làm và rau cuốn. Thêm 1 lần.'
       && mm.F15.nguyen_van_nguon === 'Made with our house kimchi, pork, tofu and mushrooms. Sour, spicy broth.');

  ok('can_xac_nhan của 20 đồ uống bắt đầu bằng câu chung "chờ chốt" của cuốn',
     DO_UONG.every(ma => mm[ma].can_xac_nhan?.startsWith(CAU_DO_UONG)));
  ok('can_xac_nhan riêng: D13 "Tên tạm.", D14 "Tên tạm; chưa có thành phần."; F03, F19 chờ Sang xác nhận nạm và trứng sống',
     mm.D13.can_xac_nhan === `${CAU_DO_UONG} Tên tạm.` && mm.D14.can_xac_nhan === `${CAU_DO_UONG} Tên tạm; chưa có thành phần.`
       && /nguồn trứng dùng sống/.test(mm.F03.can_xac_nhan) && /nguồn trứng dùng sống/.test(mm.F19.can_xac_nhan));
  ok('Món không còn gì chờ xác nhận thì can_xac_nhan null (F21, F01, F10, F22, F23, F14, F13, F05, F04, F08, F09)',
     ['F21', 'F01', 'F10', 'F22', 'F23', 'F14', 'F13', 'F05', 'F04', 'F08', 'F09'].every(ma => mm[ma].can_xac_nhan === null));
  const lechTrang = dung.filter(x => x.trang_in !== (DO_UONG.includes(x.ma) ? (x.co_con ? 14 : 15) : TRANG_NHOM[x.nhom_ma])).map(x => x.ma);
  ok('trang_in theo trang của cuốn (lẩu 7 … mì 13, có cồn 14, không cồn 15; hai món tartare null)', lechTrang.length === 0, lechTrang.join(','));
  ok('shot_id null ở 42 món còn dùng (mã ảnh P-… của bảng 17/09 không còn chỉ đúng món)', dung.every(x => x.shot_id === null));
});

// ===========================================================================
await nhom('3 · TRANG CÔNG KHAI RỖNG; MÓN THU HỒI KHÔNG BAO GIỜ LÊN TRANG; VIEW MÓN CÒN VƯỚNG', async () => {
  const goi = async () => {
    const r = await duoiAnon(`select mon_ma from thuc_don_cong_khai('vi')`);
    if (r.loi) throw new Error(r.loi);
    return r.rows.map(x => x.mon_ma);
  };
  ok('Ngay sau 0091: thuc_don_cong_khai() rỗng', (await goi()).length === 0);

  const { rows: vuong } = await db.query(`select ma, vuong_gi from v_mon_con_vuong`);
  ok('v_mon_con_vuong: đúng 42 món còn dùng, theo thứ tự của cuốn, đều "Chưa có mô tả"',
     vuong.map(x => x.ma).join() === CON_DUNG.join() && vuong.every(x => x.vuong_gi === 'Chưa có mô tả'), vuong.map(x => x.ma).join());
  ok('v_mon_con_vuong không có món thu hồi', !vuong.some(x => THU_HOI.includes(x.ma)));
  const { rows: [{ opts }] } = await db.query(`select coalesce(reloptions, '{}')::text as opts from pg_class where relname = 'v_mon_con_vuong'`);
  ok('v_mon_con_vuong vẫn security_invoker (create or replace không làm mất tùy chọn)', opts.includes('security_invoker=true'), opts);

  for (const khoa of ['hien_thuc_don', 'hien_do_uong_co_con']) {
    await db.query(`insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ($1, 'bool', true, 'da_cong_bo')`, [khoa]);
  }
  ok('Bật cả hien_thuc_don và hien_do_uong_co_con: trang vẫn rỗng (chưa món nào công bố)', (await goi()).length === 0);

  // Món thu hồi có đủ mô tả và cảnh báo — vẫn không có đường lên trang.
  await db.query(`update mon_an set mo_ta_vi = 'Vodka, ginger beer, chanh xanh và bạc hà.' where ma = 'D06'`);
  await db.query(`update mon_an set mo_ta_vi = 'Rau xanh dùng cùng bò nướng.' where ma = 'F02'`);
  ok('Món thu hồi có mô tả, mọi công tắc bật → vẫn không hiện trên trang (vi, en, ko)',
     (await goi()).length === 0
       && (await duoiAnon(`select count(*)::int n from thuc_don_cong_khai('en')`)).rows[0].n === 0
       && (await duoiAnon(`select count(*)::int n from thuc_don_cong_khai('ko')`)).rows[0].n === 0);
  ok('…và không thành "món còn vướng"',
     !(await db.query(`select ma from v_mon_con_vuong`)).rows.some(x => THU_HOI.includes(x.ma)));

  // Một món còn dùng công bố → hiện; món của nhóm đã tắt (giả sử ai đó công bố lại F17) → không hiện.
  await db.query(`update mon_an set mo_ta_vi = 'Rau xanh, nấm nướng.' , trang_thai = 'da_cong_bo' where ma = 'F21'`);
  await db.query(`update mon_an set mo_ta_vi = 'Kem dùng lạnh.', trang_thai = 'da_cong_bo' where ma = 'F17'`);
  ok('Món còn dùng công bố thì hiện; món thuộc nhóm đã tắt (F17, Tráng miệng) dù bị công bố lại vẫn không hiện',
     (await goi()).join() === 'F21', (await goi()).join());
  ok('Nhóm đã tắt cũng không đưa món vào v_mon_con_vuong',
     !(await db.query(`select ma from v_mon_con_vuong`)).rows.some(x => x.ma === 'F17'));
  // Trả hai dòng về như sau 0091 cho các mục sau.
  await db.query(`update mon_an set trang_thai = 'nhap', mo_ta_vi = null, cong_bo_luc = null where ma = 'F21'`);
  await db.query(`update mon_an set trang_thai = 'da_thu_hoi' where ma = 'F17'`);
  await db.query(`update noi_dung_cong_bo set trang_thai = 'da_thu_hoi' where khoa in ('hien_thuc_don', 'hien_do_uong_co_con') and trang_thai = 'da_cong_bo'`);
});

// ===========================================================================
await nhom('4 · SỔ BẢN DỊCH: TÊN BA THỨ TIẾNG LÀ BẢN TAY, MÁY KHÔNG DỊCH ĐÈ', async () => {
  const { rows: viec } = await db.query(`
    select bang, cot, ngon_ngu, count(*)::int n from v_viec_dich where bang in ('mon_an', 'nhom_mon') group by 1, 2, 3`);
  ok('v_viec_dich không có ô nào của món / nhóm (tên đã đủ ba thứ tiếng, mô tả chưa có)', viec.length === 0, JSON.stringify(viec));
  const { rows: so } = await db.query(`
    select ma, ban_dich -> 'ten' as so, bam_nguon(ten_vi) as bam from mon_an where trang_thai <> 'da_thu_hoi'
    union all
    select ma, ban_dich -> 'ten', bam_nguon(ten_vi) from nhom_mon where dang_dung`);
  const lech = so.filter(r => ['en', 'ko'].some(l => r.so?.[l]?.cach !== 'tay' || r.so?.[l]?.tt !== 'ok' || r.so?.[l]?.bam !== r.bam)).map(r => r.ma);
  ok('42 món và 17 nhóm: sổ ghi tên en, ko là bản tay, của đúng tên tiếng Việt hiện tại', so.length === 59 && lech.length === 0, lech.join(','));
});

// ===========================================================================
await nhom('5 · CHẠY LẠI 0091 NGAY SAU LẦN ĐẦU: KHÔNG LỖI, DỮ LIỆU Y HỆT', async () => {
  const chup = async () => JSON.stringify([
    (await db.query(`select to_jsonb(m) - 'updated_at' as d from mon_an m order by ma`)).rows,
    (await db.query(`select to_jsonb(g) as d from nhom_mon g order by ma`)).rows,
  ]);
  const truoc = await chup();
  const loi = await db.exec(SQL_0091).then(() => null, e => e.message);
  ok(`Chạy lại ${TEN_FILE} → không lỗi`, loi === null, loi);
  ok('…mọi cột của 52 món và 20 nhóm y hệt (trừ updated_at), kể cả sổ bản dịch', (await chup()) === truoc);
});

// ===========================================================================
await nhom('6 · QUYỀN: ANON KHÔNG ĐỌC; MARKETING SỬA ĐƯỢC MÓN; VAI KHÁC BỊ TỪ CHỐI', async () => {
  for (const bang of ['mon_an', 'nhom_mon', 'v_mon_con_vuong']) {
    const r = await duoiAnon(`select * from ${bang} limit 1`);
    ok(`anon select ${bang} → bị từ chối`, r.loi !== null && /permission denied/i.test(r.loi), r.loi ?? `đọc được ${r.rows?.length} dòng`);
  }
  const anonSua = await duoiAnon(`update mon_an set trang_thai = 'da_cong_bo' where ma = 'F21'`);
  ok('anon không sửa được món', anonSua.loi !== null, anonSua.loi ?? 'SỬA ĐƯỢC');

  const mkt = await duoi(UID.mktA, `update mon_an set mo_ta_vi = 'Nấm nướng trên rau xanh, sốt mè. Ăn xen với bò cho đỡ ngán.' where ma = 'F21' returning ma`);
  ok('Marketing sửa được món (policy mon_an_sua: chủ, quản lý, marketing)', mkt.loi === null && mkt.rows.length === 1, mkt.loi ?? `${mkt.rows.length} dòng`);
  const mktNhom = await duoi(UID.mktA, `update nhom_mon set ten_vi = 'Salad 2' where ma = 'salad' returning ma`);
  ok('Marketing KHÔNG sửa được nhóm (policy nhom_mon_sua: chủ, quản lý)', mktNhom.loi !== null || mktNhom.rows.length === 0,
     mktNhom.loi ?? `${mktNhom.rows.length} dòng`);
  const qlNhom = await duoi(UID.qlA, `update nhom_mon set ten_vi = ten_vi where ma = 'salad' returning ma`);
  ok('Quản lý sửa được nhóm', qlNhom.loi === null && qlNhom.rows.length === 1, qlNhom.loi ?? `${qlNhom.rows.length} dòng`);

  const UID_KHONG_NHAN_SU = '00000000-0000-4000-8000-0000000000ee';
  for (const [ai, uid] of [['Thu ngân Q1', UID.thuNganA], ['Thủ kho Q1', UID.thuKhoA], ['NV quầy Q1', UID.nvQuayA],
    ['Kế toán Q1', UID.keToanA], ['Thủ kho đã nghỉ', UID.nghiViec], ['Tài khoản không có nhan_su', UID_KHONG_NHAN_SU]]) {
    const r = await duoi(uid, `update mon_an set trang_thai = 'da_cong_bo', mo_ta_vi = 'x' where ma = 'F01' returning ma`);
    ok(`${ai} không sửa được món`, r.loi !== null || r.rows.length === 0, r.loi ?? `${r.rows.length} dòng`);
  }
  ok('…F01 vẫn ở nhap, chưa có mô tả', (await db.query(`select trang_thai, mo_ta_vi from mon_an where ma = 'F01'`)).rows
    .every(r => r.trang_thai === 'nhap' && r.mo_ta_vi === null));

  const xem = async uid => (await duoi(uid, `select count(*)::int n from v_mon_con_vuong`)).rows?.[0]?.n;
  ok('v_mon_con_vuong: chủ, thu ngân, marketing thấy 42 món; thủ kho, người đã nghỉ thấy 0',
     (await xem(UID.chu)) === 42 && (await xem(UID.thuNganA)) === 42 && (await xem(UID.mktA)) === 42
       && (await xem(UID.thuKhoA)) === 0 && (await xem(UID.nghiViec)) === 0);
});

// ===========================================================================
await nhom('7 · DATABASE KHÔNG CÒN ĐÚNG SEED (Beeftown-thu sau THUC-DON.md bản cũ) → 0091 ĐƯA VỀ ĐÚNG DANH MỤC', async () => {
  const { db: cu } = await dungDatabaseTrong({ den: SO_MIGRATION - 1 });
  const id = async (bang, ma) => (await cu.query(`select id from ${bang} where ma = $1`, [ma])).rows[0].id;

  // web/THUC-DON.md bản cũ: bốn món công bố với mô tả của TÊN CŨ, cảnh báo Yukhoe, tên nhóm tiếng Hàn, hai công tắc.
  await cu.exec(`
    update mon_an set mo_ta_vi = 'Xà lách romaine, sốt Caesar, phô mai Parmesan và bánh mì giòn.',
                      mo_ta_en = 'Romaine lettuce, Caesar dressing, Parmesan and croutons.', ten_ko = '시저 샐러드' where ma = 'F01';
    update mon_an set mo_ta_vi = 'Bò sống trộn kiểu Hàn. Hỏi nhân viên về thành phần và cách dùng.', ten_ko = '육회',
                      canh_bao = 'Món dùng thịt bò sống, không nấu chín.', canh_bao_en = 'Made with raw, uncooked beef.' where ma = 'F03';
    update mon_an set mo_ta_vi = 'Nước cam dùng lạnh.' where ma = 'D09';
    update mon_an set mo_ta_vi = 'Whisky, soda và chanh trong ly highball cổ điển.' where ma = 'D02';
    update mon_an set trang_thai = 'da_cong_bo' where ma in ('F01', 'F03', 'D09', 'D02');
    update nhom_mon set ten_ko = '샐러드 & 애피타이저' where ma = 'salad';
    update mon_an set gia_de_xuat = 189000, gia = 189000, gia_da_duyet = true, muc_cay_de_xuat = 2, muc_cay = 2, muc_cay_da_duyet = true where ma = 'F05';
    insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values
      ('hien_thuc_don', 'bool', true, 'da_cong_bo'), ('hien_do_uong_co_con', 'bool', true, 'da_cong_bo');`);
  // Máy dịch đã dịch tên tiếng Hàn từ tên Việt cũ — đúng chữ cuốn dùng lại, nên ô dịch không đổi khi 0091 chạy.
  await cu.query(`select ghi_ban_dich('mon_an', $1, jsonb_build_array(jsonb_build_object(
                    'cot', 'ten', 'ngon_ngu', 'ko', 'bam', bam_nguon('Canh đậu hũ non'), 'tt', 'ok', 'noi_dung', '순두부찌개')))`, [await id('mon_an', 'F14')]);
  await cu.query(`select ghi_ban_dich('nhom_mon', $1, jsonb_build_array(jsonb_build_object(
                    'cot', 'ten', 'ngon_ngu', 'ko', 'bam', bam_nguon('Canh Hàn'), 'tt', 'ok', 'noi_dung', '찌개')))`, [await id('nhom_mon', 'canh')]);
  const { rows: truocTrang } = await cu.query(`select mon_ma from thuc_don_cong_khai('vi')`);
  ok('Trước 0091: trang đang hiện bốn món của danh mục cũ', danhSach(truocTrang.map(r => r.mon_ma)) === 'D02,D09,F01,F03');

  const loi = await cu.exec(SQL_0091).then(() => null, e => e.message);
  ok(`${TEN_FILE} chạy được trên database đã công bố món theo bản cũ`, loi === null, loi);

  const { rows: sauTrang } = await cu.query(`select mon_ma from thuc_don_cong_khai('vi')`);
  ok('Sau 0091: trang rỗng dù hai công tắc vẫn bật — "Tartare bò hoa tuyết" không hiện với mô tả của Yukhoe',
     sauTrang.length === 0, sauTrang.map(r => r.mon_ma).join(','));
  const { rows: [f03] } = await cu.query(`select * from mon_an where ma = 'F03'`);
  ok('F03 về nhap: mô tả, cảnh báo, ngày công bố bỏ; tên ba thứ tiếng là tên mới',
     f03.trang_thai === 'nhap' && f03.mo_ta_vi === null && f03.mo_ta_en === null && f03.canh_bao === null && f03.canh_bao_en === null
       && f03.cong_bo_luc === null && f03.ten_vi === 'Tartare bò hoa tuyết' && f03.ten_ko === '눈꽃치즈 소고기 타르타르');
  const { rows: [f05] } = await cu.query(`select gia, gia_da_duyet, gia_de_xuat, muc_cay, muc_cay_da_duyet, muc_cay_de_xuat from mon_an where ma = 'F05'`);
  ok('Giá và độ cay đã duyệt của danh mục cũ bị bỏ; độ cay đề xuất theo cuốn',
     f05.gia === null && f05.gia_da_duyet === false && f05.gia_de_xuat === null && f05.muc_cay === null && f05.muc_cay_da_duyet === false
       && f05.muc_cay_de_xuat === 1, JSON.stringify(f05));

  const { rows: viec } = await cu.query(`select bang, cot, ngon_ngu, ly_do from v_viec_dich where bang in ('mon_an', 'nhom_mon')`);
  ok('Sổ bản dịch không lệch: máy KHÔNG được giao dịch lại tên nào (kể cả "Đậu phụ hầm" / "순두부찌개", nhóm "Canh" / "찌개")',
     viec.length === 0, JSON.stringify(viec));
  const { rows: [{ so }] } = await cu.query(`select ban_dich -> 'ten' -> 'ko' as so from mon_an where ma = 'F14'`);
  const { rows: [{ bam }] } = await cu.query(`select bam_nguon('Đậu phụ hầm') as bam`);
  ok('F14: sổ ghi tên tiếng Hàn là bản tay của tên Việt MỚI', so?.cach === 'tay' && so?.bam === bam, JSON.stringify(so));

  ok('Sau 0091, danh mục trên database cũ giống hệt database mới cài: mọi cột nghiệp vụ của 52 món và 20 nhóm',
     (await chupDanhMuc(cu)) === DANH_MUC_MOI_CAI);
  const { rows: [{ ten_ko: tenKoSalad }] } = await cu.query(`select ten_ko from nhom_mon where ma = 'salad'`);
  ok('…kể cả tên tiếng Hàn của nhóm salad: "샐러드 & 애피타이저" (khối cũ) thành "샐러드" của cuốn', tenKoSalad === '샐러드', tenKoSalad);
  await cu.close();
});

// ===========================================================================
await nhom('8 · CHẠY LẠI 0091 SAU KHI ĐÃ LÀM TIẾP → BỊ CHẶN, KHÔNG CỘT NÀO ĐỔI', async () => {
  const CAU_CHAN = 'Thực đơn đã có món công bố, giá hoặc độ cay đã duyệt, hoặc mô tả đã ghi: chạy lại 0091 sẽ xóa hết. Không chạy lại file này.';
  /** Mọi cột của mọi dòng món, nhóm, công tắc, phiên bản — kể cả updated_at và sổ bản dịch. */
  const chupHet = async () => JSON.stringify(await Promise.all([
    `select to_jsonb(m) as d from mon_an m order by ma`, `select to_jsonb(g) as d from nhom_mon g order by ma`,
    `select to_jsonb(n) as d from noi_dung_cong_bo n order by id`, `select to_jsonb(p) as d from phien_ban_thuc_don p order by ma`,
  ].map(async q => (await db.query(q)).rows)));
  const chayLai = () => db.exec(SQL_0091).then(() => null, e => ({ message: e.message, detail: e.detail ?? '' }));

  // Về đúng trạng thái ngay sau 0091 (mục 6 cho marketing ghi mô tả F21): chạy lại được.
  await db.query(`update mon_an set mo_ta_vi = null where ma = 'F21'`);
  ok('Chưa làm gì thêm (không công bố, không duyệt, không mô tả) → chạy lại được', (await chayLai()) === null);

  const TRUONG_HOP = [
    ['đã có mô tả (F21)', `update mon_an set mo_ta_vi = 'Nấm nướng trên rau xanh, sốt mè. Ăn xen với bò cho đỡ ngán.' where ma = 'F21'`,
     `update mon_an set mo_ta_vi = null where ma = 'F21'`, /F21: đã có mô tả/],
    ['đã công bố (F01)', `update mon_an set mo_ta_vi = 'Xà lách romaine, bánh mì nướng giòn, phô mai bào, sốt Caesar.', trang_thai = 'da_cong_bo' where ma = 'F01'`,
     `update mon_an set mo_ta_vi = null, trang_thai = 'nhap', cong_bo_luc = null where ma = 'F01'`, /F01: đã công bố, đã có mô tả/],
    ['giá đã duyệt (S01)', `update mon_an set gia = gia_de_xuat, gia_da_duyet = true, gia_duyet_luc = now() where ma = 'S01'`,
     `update mon_an set gia = null, gia_da_duyet = false, gia_duyet_luc = null where ma = 'S01'`, /S01: giá đã duyệt/],
    ['độ cay đã duyệt (F11)', `update mon_an set muc_cay = muc_cay_de_xuat, muc_cay_da_duyet = true where ma = 'F11'`,
     `update mon_an set muc_cay = null, muc_cay_da_duyet = false where ma = 'F11'`, /F11: độ cay đã duyệt/],
    ['đã có câu cảnh báo (F19)', `update mon_an set canh_bao = 'Món có bò sống và lòng đỏ trứng sống.' where ma = 'F19'`,
     `update mon_an set canh_bao = null where ma = 'F19'`, /F19: đã có câu cảnh báo/],
    ['công bố rồi gỡ khẩn cấp (F03, da_thu_hoi, còn mô tả)',
     `update mon_an set mo_ta_vi = 'Nạm có thớ rõ.', canh_bao = 'Món có bò sống.' where ma = 'F03';
      update mon_an set trang_thai = 'da_cong_bo' where ma = 'F03'; update mon_an set trang_thai = 'da_thu_hoi' where ma = 'F03'`,
     `update mon_an set mo_ta_vi = null, canh_bao = null, trang_thai = 'nhap', cong_bo_luc = null where ma = 'F03'`, /F03: đã có mô tả, đã có câu cảnh báo/],
  ];
  for (const [ten, lam, tra, chiTiet] of TRUONG_HOP) {
    await db.exec(lam);
    const truoc = await chupHet();
    const loi = await chayLai();
    ok(`${ten} → chạy lại 0091 bị từ chối, câu báo rõ, detail chỉ đúng món`,
       loi?.message === CAU_CHAN && chiTiet.test(loi.detail), loi ? `${loi.message} | ${loi.detail}` : 'CHẠY ĐƯỢC');
    ok(`${ten} → không cột nào của bất kỳ dòng nào đổi (kể cả updated_at, sổ bản dịch)`, (await chupHet()) === truoc);
    await db.exec(tra);
  }

  // Đủ cả: hướng dẫn chạy xong (mô tả, cảnh báo, công bố, công tắc) và duyệt giá, độ cay.
  await db.exec(`
    update mon_an set mo_ta_vi = copy_nhap, mo_ta_en = nguyen_van_nguon where copy_nhap is not null and trang_thai <> 'da_thu_hoi';
    update mon_an set canh_bao = 'Món có bò sống và lòng đỏ trứng sống.' where la_mon_song;
    update mon_an set trang_thai = 'da_cong_bo' where mo_ta_vi is not null and trang_thai = 'nhap';
    update mon_an set gia = gia_de_xuat, gia_da_duyet = true where gia_de_xuat is not null;
    update mon_an set muc_cay = muc_cay_de_xuat, muc_cay_da_duyet = true where muc_cay_de_xuat is not null;
    update mon_an set ten_ko = '눈꽃치즈 육회 타르타르' where ma = 'F03';
    insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ('hien_thuc_don', 'bool', true, 'da_cong_bo');`);
  const truoc = await chupHet();
  const { rows: trangTruoc } = await db.query(`select mon_ma, ten, mo_ta, gia from thuc_don_cong_khai('vi')`);
  const loi = await chayLai();
  ok('Đã công bố 25 món, duyệt giá và độ cay → chạy lại 0091 bị từ chối', loi?.message === CAU_CHAN, loi?.message ?? 'CHẠY ĐƯỢC');
  ok('…mọi cột giữ nguyên: giá, độ cay đã duyệt, tên Hàn sửa tay, 25 món đã công bố, công tắc', (await chupHet()) === truoc);
  const { rows: trangSau } = await db.query(`select mon_ma, ten, mo_ta, gia from thuc_don_cong_khai('vi')`);
  ok('…và trang Thực đơn y như trước (22 món ăn, giá đã duyệt vẫn còn)',
     trangTruoc.length === 22 && JSON.stringify(trangSau) === JSON.stringify(trangTruoc), `${trangSau.length} món`);
});

process.exit(ketThuc('THỰC ĐƠN THEO CUỐN MENU BẢN SÁNG'));
