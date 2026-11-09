/**
 * BEEFTOWN — HỘP THƯ ĐƠN MUA THỊT VỀ: /noi-bo/don-mua-thit (0113)
 * ===============================================================
 *
 *     node test/test-noi-bo-don-mua-thit.mjs
 *
 * Trang đọc và đổi trạng thái đơn chỉ qua don_mua_thit_danh_sach / don_mua_thit_chuyen (bảng khóa kín). Ba chỗ phải
 * nói cùng một điều, lệch là người dùng bấm nút rồi nhận lỗi khó hiểu (hoặc tệ hơn, thấy nút mà database cho):
 *
 *   1. quyen — vai của trang (VAI_DON_MUA_THIT) = vai của mục menu (lib/dieu-huong-noi-bo.ts) = vai database cho
 *      (don_mua_thit_duoc_xem, thử thật dưới từng vai); trang không đọc bảng thẳng (from('don_mua_thit')).
 *   2. bam-hai-lan — mọi nút CHUYEN_DUOC của trang là một bước database cho; mọi bước không có nút thì database
 *      chặn; bấm lại → da_o_san (trang báo "đơn đã ở …"), người khác đã đổi → nguoi_khac.
 *   5. mat-mang — ghi và câu báo là cùng một await (rpc rồi mới chuyển hướng với câu "Đã chuyển").
 *   7. cau-chu — chữ của trang đủ vi / en; trạng thái phân biệt bằng chữ (không màu xanh / vàng).
 *   3. gio-vn — giờ đặt in theo giờ Việt Nam qua gioVnTuMs (không tự cộng 7 tiếng).
 *   4, 6, 8, 9 — không áp dụng (kiểm ở test-mua-thit-dat-hang.mjs; trang không ghi kho, không migration, không dịch vụ ngoài).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, maGui, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TRANG = readFileSync(join(GOC, 'web', 'src', 'pages', 'noi-bo', 'don-mua-thit.astro'), 'utf8');
const { MUC_NOI_BO } = await import(pathToFileURL(join(GOC, 'web', 'src', 'lib', 'dieu-huong-noi-bo.ts')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — HỘP THƯ ĐƠN MUA THỊT VỀ (/noi-bo/don-mua-thit)');
const { db, cnA, duoi, duoiAnon } = await dungDatabase();
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.rows));

// CHUYEN_DUOC của trang: { tu: [toi…] } đọc từ mã nguồn.
const khoiChuyen = TRANG.match(/const CHUYEN_DUOC[^=]*= \{([\s\S]*?)\n\};/)?.[1] ?? '';
const CHUYEN = {};
for (const m of khoiChuyen.matchAll(/(\w+): \[([\s\S]*?)\n  \]/g)) CHUYEN[m[1]] = [...m[2].matchAll(/toi: '(\w+)'/g)].map(x => x[1]);
const VAI_TRANG = JSON.parse((TRANG.match(/const VAI_DON_MUA_THIT = (\[[^\]]*\])/)?.[1] ?? '[]').replace(/'/g, '"'));
const TRANG_THAI = ['cho_xac_nhan', 'da_xac_nhan', 'da_giao', 'da_huy'];

// Một đơn ở trạng thái bất kỳ, ghi thẳng bằng superuser (khung kiểm thử): đủ để thử bước chuyển và quyền.
async function don(trangThai = 'cho_xac_nhan', cn = cnA) {
  const { rows: [r] } = await db.query(
    `insert into don_mua_thit (ma_don, ma_gui, chi_nhanh_id, ho_ten, sdt, dia_chi, dong, tam_tinh, trang_thai, created_at)
     values (sinh_ma_don_mua_thit(), $1, $2, 'Nguyễn Thị Hoa', '0912345678', '12 Nguyễn Huệ, phường Sài Gòn',
             '[{"khoa":"ribeye-cap_200","ten_vi":"Ribeye with Cap","don_vi":"goi","bao_quan":"mat","so_gam":200,"so_luong":2,"gia":400000,"thanh_tien":800000}]',
             800000, $3, '2026-11-13T16:50:00Z') returning id`, [maGui(), cn.id, trangThai]);
  return r.id;
}
const chuyen = (uid, id, tu, toi) => duoi(uid, `select don_mua_thit_chuyen($1::uuid, $2, $3) as r`, [id, tu, toi]);

// ===========================================================================
await nhom('1 · QUYỀN: TRANG = MENU = DATABASE', async () => {
  const muc = MUC_NOI_BO.find(m => m.ma === 'don_mua_thit');
  ok('Mục menu Đơn mua thịt trỏ /noi-bo/don-mua-thit, nhóm Khách hàng', muc?.link === '/noi-bo/don-mua-thit' && muc?.nhom === 'khach');
  ok('Vai của trang = vai của mục menu = chủ, quản lý, thu ngân',
     JSON.stringify([...VAI_TRANG].sort()) === JSON.stringify(['chu_so_huu', 'quan_ly', 'thu_ngan'])
       && JSON.stringify([...(muc?.vai ?? [])].sort()) === JSON.stringify([...VAI_TRANG].sort()), `${VAI_TRANG} · ${muc?.vai}`);
  const id = await don();
  const UID_NHAN_SU = { chu_so_huu: UID.chu, quan_ly: UID.qlA, thu_ngan: UID.thuNganA, marketing: UID.mktA, thu_kho: UID.thuKhoA,
                        nhan_vien_quay: UID.nvQuayA, ke_toan: UID.keToanA };
  for (const [vai, uid] of Object.entries(UID_NHAN_SU)) {
    const r = await duoi(uid, `select count(*)::int as n from don_mua_thit_danh_sach('tat_ca')`);
    const duoc = r.loi === null;
    ok(`${vai}: database ${duoc ? 'cho' : 'chặn'} — trang ${VAI_TRANG.includes(vai) ? 'cho' : 'chặn'} (phải khớp)`, duoc === VAI_TRANG.includes(vai), vi(r));
  }
  const anon = await duoiAnon(`select * from don_mua_thit_danh_sach('cho')`);
  ok('anon không gọi được hộp thư', anon.loi !== null);
  ok('Trang không đọc / ghi bảng thẳng (from(\'don_mua_thit\')), chỉ qua hai hàm', !/from\('don_mua_thit'\)/.test(TRANG)
     && /rpc\('don_mua_thit_danh_sach'/.test(TRANG) && /rpc\('don_mua_thit_chuyen'/.test(TRANG));
  ok('Trang chặn vai khác trước khi gọi database (duocXem) và chỉ nhận POST khi duocXem',
     /const duocXem = VAI_DON_MUA_THIT\.includes\(nhanSu\.vai_tro\);/.test(TRANG) && /if \(duocXem && Astro\.request\.method === 'POST'\)/.test(TRANG));
  await db.query(`delete from don_mua_thit where id = $1`, [id]);
});

// ===========================================================================
await nhom('2 · NÚT CỦA TRANG = BƯỚC DATABASE CHO (bam-hai-lan)', async () => {
  ok('Trang có hai trạng thái có nút: chờ gọi, đã xác nhận', JSON.stringify(Object.keys(CHUYEN)) === '["cho_xac_nhan","da_xac_nhan"]', JSON.stringify(CHUYEN));
  for (const tu of TRANG_THAI) {
    for (const toi of TRANG_THAI) {
      if (tu === toi) continue;
      const id = await don(tu);
      const r = await chuyen(UID.qlA, id, tu, toi);
      const coNut = (CHUYEN[tu] ?? []).includes(toi);
      ok(`${tu} → ${toi}: ${coNut ? 'có nút, database cho' : 'không nút, database chặn'}`,
         coNut ? r.loi === null && r.rows[0].r === 'da_chuyen' : r.loi !== null && /không hợp lệ/.test(r.loi), vi(r));
    }
  }
  const id = await don();
  await chuyen(UID.qlA, id, 'cho_xac_nhan', 'da_xac_nhan');
  const lai = await chuyen(UID.qlA, id, 'cho_xac_nhan', 'da_xac_nhan');
  const khac = await chuyen(UID.thuNganA, id, 'cho_xac_nhan', 'da_huy');
  ok('Bấm lại → da_o_san; người khác bấm trên trang cũ → nguoi_khac', lai.rows?.[0]?.r === 'da_o_san' && khac.rows?.[0]?.r === 'nguoi_khac', `${vi(lai)} · ${vi(khac)}`);
  ok('Trang báo đúng ba kết quả: da_chuyen → "Đã chuyển", da_o_san → "Đơn đã ở", nguoi_khac → "người khác xử lý"',
     /data === 'da_chuyen'\) return chuyenHuongNoiBo\(Astro, \{ ok: true, cau: t\.daChuyen\(ten\) \}\)/.test(TRANG)
       && /data === 'da_o_san'\) return chuyenHuongNoiBo\(Astro, \{ ok: true, cau: t\.daO\(ten\) \}\)/.test(TRANG)
       && /data === 'nguoi_khac' \? \{ ok: false, cau: t\.daXuLy \}/.test(TRANG));
  ok('Tham số tự chế (bước không có nút) bị chặn ở trang trước khi gọi database',
     /const hopLe = CHUYEN_DUOC\[tu\]\?\.some\(b => b\.toi === toi\);/.test(TRANG) && /else if \(!id \|\| !hopLe\)/.test(TRANG));
});

// ===========================================================================
await nhom('3 · GHI VÀ CÂU BÁO CÙNG MỘT AWAIT (mat-mang), GIỜ VIỆT NAM, CHỮ', async () => {
  const iGoi = TRANG.indexOf("await client.rpc('don_mua_thit_chuyen'");
  const iBao = TRANG.indexOf('t.daChuyen(ten)');
  ok('"Đã chuyển" chỉ sau khi await rpc trả da_chuyen, không lỗi', iGoi > 0 && iBao > iGoi && /if \(!error && data === 'da_chuyen'\)/.test(TRANG));
  ok('Lỗi mạng / database → câu lỗi (dichCau), không "Đã chuyển"', /\{ ok: false, cau: dichCau\(nn, error\?\.message \?\? t\.khongDoc\) \}/.test(TRANG));
  ok('Giờ đặt in theo giờ Việt Nam bằng gioVnTuMs (không tự cộng giờ)', /gioVnTuMs\(Date\.parse\(iso\)\)/.test(TRANG) && !/7 \* 60|25200|\+ 7/.test(TRANG));
  const cap = [...TRANG.matchAll(/\{ vi: '([^']*)', en: '([^']*)' \}/g)];
  ok('Chữ của trang viết theo cặp { vi, en }, bản en không lẫn chữ Việt',
     cap.length > 20 && cap.every(m => !/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(m[2])),
     cap.filter(m => /[ăâđêôơư]/i.test(m[2])).map(m => m[2]).join(' | '));
  ok('Trạng thái phân biệt bằng chữ (nb-nhan), không màu xanh / vàng', !/green|yellow|#0[0-9a-f]{5}|xanh|vàng/i.test(TRANG));
  ok('Số điện thoại bấm gọi được (tel:)', /href=\{`tel:\$\{d\.sdt\}`\}/.test(TRANG));
});

process.exit(ketThuc('HỘP THƯ ĐƠN MUA THỊT VỀ'));
