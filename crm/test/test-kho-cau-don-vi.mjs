/**
 * BEEFTOWN KHO — Kiểm thử chữ nhỏ trong câu: đơn vị đếm của món, chữ "kg", ngày giờ kiểu Việt
 * ========================================================================================
 *
 *     node test/test-kho-cau-don-vi.mjs
 *
 * LỖI CHỮ ĐÃ THẤY (soát luồng 11/10/2026):
 *   · Món đếm bằng "khay" mà câu vẫn ghi "gói": màn chốt phiên lóc "Chuyển 18 gói ra quầy
 *     ngay", danh sách yêu cầu của quầy "1 món · 10 gói", câu nhận hàng "Đã nhận đủ XC-…:
 *     10 gói", hộp Duyệt, danh sách phiếu.
 *   · Hộp Duyệt, dòng báo hủy: "1 gói · 0,305 · ở Quầy thịt" — thiếu chữ "kg".
 *   · Kết nối iPOS: "Đã chuyển sang trừ kho theo iPOS từ 2026-10-11 21:48" — ngày kiểu máy.
 *
 * Luật: câu nói về MỘT món (hoặc các món cùng một đơn vị) thì dùng đơn vị của món
 * (kho_mat_hang.don_vi_goi). Câu gộp nhiều món khác đơn vị, hoặc không biết món → giữ chữ
 * chung "gói". Câu do database trả về KHÔNG sửa trong SQL (kiểm thử khác khớp theo chữ) —
 * đổi đơn vị ở phía web, cả bản tiếng Việt lẫn tiếng Anh.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';
import * as CHUNG from '../../web/src/lib/kho/chung.ts';
import * as XUAT from '../../web/src/lib/kho/xuat.ts';
import * as QUAY from '../../web/src/lib/kho/quay.ts';
import * as PHA from '../../web/src/lib/kho/pha-loc.ts';
import * as DEM from '../../web/src/lib/kho/dem-quay.ts';
import { chuyenSangIpos } from '../../web/src/lib/kho/ban-ipos.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — ĐƠN VỊ ĐẾM TRONG CÂU · CHỮ KG · NGÀY GIỜ');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, 'web', 'src', p), 'utf8');
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// ===========================================================================
await nhom('1 · ĐƠN VỊ CHUNG CỦA MỘT NHÓM MÓN (donViChung)', async () => {
  ok('HỒI QUY: chung.ts có donViChung', typeof CHUNG.donViChung === 'function');
  const dv = CHUNG.donViChung;
  ok('Mọi món đếm cùng đơn vị "khay" → "khay"', dv([{ dem_goi: true, don_vi_goi: 'khay' }, { dem_goi: true, don_vi_goi: 'khay' }]) === 'khay');
  ok('Khác đơn vị (khay + gói) → null (trang dùng chữ chung)', dv([{ dem_goi: true, don_vi_goi: 'khay' }, { dem_goi: true, don_vi_goi: 'gói' }]) === null);
  ok('Món cân ký (không đếm) không tính: phụ phẩm theo kg + tảng → "tảng"', dv([{ dem_goi: false, don_vi_goi: 'khay' }, { dem_goi: true, don_vi_goi: 'tảng' }]) === 'tảng');
  ok('Không món nào đếm, danh sách rỗng, món không đọc được → null', dv([{ dem_goi: false, don_vi_goi: 'khay' }]) === null && dv([]) === null && dv([undefined, null]) === null);
  ok('Món thiếu đơn vị coi như "gói": gói + khay → null; chỉ món thiếu đơn vị → "gói"',
     dv([{ dem_goi: true, don_vi_goi: '' }, { dem_goi: true, don_vi_goi: 'khay' }]) === null && dv([{ dem_goi: true, don_vi_goi: null }]) === 'gói');
});

// ===========================================================================
await nhom('2 · CÂU DATABASE NÓI "GÓI" → ĐƠN VỊ CỦA MÓN, CẢ HAI THỨ TIẾNG (doiDonViCau)', async () => {
  ok('HỒI QUY: xuat.ts có doiDonViCau', typeof XUAT.doiDonViCau === 'function');
  const doi = (cau, dv) => XUAT.doiDonViCau({ ok: true, cau }, dv);
  const a = doi('Đã nhận đủ XC-2610-0001: 10 gói (3,050 kg).', 'khay');
  ok('HỒI QUY: "Đã nhận đủ XC-2610-0001: 10 gói (3,050 kg)." → "… 10 khay (3,050 kg)."', a.cau === 'Đã nhận đủ XC-2610-0001: 10 khay (3,050 kg).', a.cau);
  ok('… bản tiếng Anh cũng đổi: "Received XC-2610-0001 in full: 10 khay (3,050 kg)."', a.cauEn === 'Received XC-2610-0001 in full: 10 khay (3,050 kg).', a.cauEn);
  const b = doi('Đã nhận XC-2610-0002: 8 gói. Thiếu 2 gói (0,610 kg) — đã báo quản lý.', 'khay');
  ok('Câu nhận thiếu: đổi cả hai chỗ, vi và en',
     b.cau === 'Đã nhận XC-2610-0002: 8 khay. Thiếu 2 khay (0,610 kg) — đã báo quản lý.'
     && b.cauEn === 'Received XC-2610-0002: 8 khay. Short: 2 khay (0,610 kg) — the manager has been notified.', `${b.cau} | ${b.cauEn}`);
  const c = [
    ['Đã trả 2 gói thiếu của XC-2610-0002 về kho.', 'Đã trả 2 khay thiếu của XC-2610-0002 về kho.', 'Returned 2 short khay of XC-2610-0002 to stock.'],
    ['Đã ghi mất 2 gói (0,610 kg) của XC-2610-0002.', 'Đã ghi mất 2 khay (0,610 kg) của XC-2610-0002.', 'Recorded 2 khay (0,610 kg) of XC-2610-0002 as lost.'],
    ['Đã hủy XC-2610-0003 — 10 gói đã về lại chỗ cũ.', 'Đã hủy XC-2610-0003 — 10 khay đã về lại chỗ cũ.', 'Cancelled XC-2610-0003 — 10 khay back where they were.'],
  ];
  for (const [goc, vi, en] of c) {
    const k = doi(goc, 'khay');
    ok(`"${goc}" → khay (vi + en)`, k.cau === vi && k.cauEn === en, `${k.cau} | ${k.cauEn}`);
  }
  const bot = XUAT.doiDonViCau({ ok: true, cau: 'Đã bớt 1 gói.', cauEn: 'Removed 1 pack.' }, 'khay');
  ok('Câu của web có sẵn cauEn ("Đã bớt 1 gói." / "Removed 1 pack.") → "Đã bớt 1 khay." / "Removed 1 khay."',
     bot.cau === 'Đã bớt 1 khay.' && bot.cauEn === 'Removed 1 khay.', `${bot.cau} | ${bot.cauEn}`);
  const goc = { ok: true, cau: 'Đã nhận đủ XC-2610-0001: 10 gói (3,050 kg).' };
  ok('Không biết đơn vị (null), hoặc đơn vị vốn là "gói" → trả nguyên câu, không dựng cauEn',
     XUAT.doiDonViCau(goc, null) === goc && XUAT.doiDonViCau(goc, 'gói') === goc && XUAT.doiDonViCau(goc, '') === goc);
  const loi = { ok: false, cau: '"Ribeye": nhận 12 gói nhưng phiếu chỉ mang ra 10 gói' };
  ok('Câu báo lỗi giữ nguyên (không đụng câu raise exception)', XUAT.doiDonViCau(loi, 'khay') === loi);
  const khong = doi('Đã ghi nhận hàng của phiếu XC-2610-0001.', 'khay');
  ok('Câu không có số gói → chữ giữ nguyên, bản tiếng Anh vẫn đúng', khong.cau === 'Đã ghi nhận hàng của phiếu XC-2610-0001.'
     && (khong.cauEn ?? dichCau('en', khong.cau)) === 'The goods of XC-2610-0001 are recorded.');
  ok('Chữ "gói" không đi sau con số (lời dặn chung) không bị đổi', doi('Quét nhãn từng gói, còn 3 gói.', 'khay').cau === 'Quét nhãn từng gói, còn 3 khay.');
  ok('Bản tiếng Anh sau khi đổi không lẫn chữ Việt (đơn vị "khay" không dấu)', [a, b].every(k => !VIET.test(k.cauEn.replace(/đ/g, ''))));

  // Các câu trên phải còn đúng dạng database đang trả: đọc lại từ migration mới nhất có hàm đó.
  const MIG = join(GOC, 'crm', 'supabase', 'migrations');
  const sql = readdirSync(MIG).filter(f => /^\d{4}_.+\.sql$/.test(f)).sort().reverse()
    .map(f => readFileSync(join(MIG, f), 'utf8')).find(s => s.includes('create or replace function kho_nhan_hang_chuyen(')) ?? '';
  const than = sql.slice(sql.indexOf('create or replace function kho_nhan_hang_chuyen('));
  ok('kho_nhan_hang_chuyen vẫn trả câu dạng "… || \' gói (\' …" (web đổi đơn vị dựa vào dạng này)',
     /return 'Đã nhận đủ ' \|\| v_px\.so_phieu \|\| ': ' \|\| v_nhan_g \|\| ' gói \('/.test(than)
     && /'Đã nhận ' \|\| v_px\.so_phieu \|\| ': ' \|\| v_nhan_g \|\| ' gói\. Thiếu ' \|\| v_con_g \|\| ' gói \('/.test(than));
});

// ===========================================================================
await nhom('3 · ĐỌC ĐƠN VỊ CỦA TỪNG PHIẾU / YÊU CẦU CHO DANH SÁCH (một lượt đọc, không mỗi phiếu một lượt)', async () => {
  ok('HỒI QUY: xuat.ts có docDonViPhieuXuat, quay.ts có docDonViYeuCau', typeof XUAT.docDonViPhieuXuat === 'function' && typeof QUAY.docDonViYeuCau === 'function');
  const goi = [];
  const bang = {
    kho_phieu_xuat_dong: [
      { phieu_xuat_id: U(1), mat_hang_id: U(11) }, { phieu_xuat_id: U(1), mat_hang_id: U(11) },   // một món, hai dòng (hai lô)
      { phieu_xuat_id: U(2), mat_hang_id: U(11) }, { phieu_xuat_id: U(2), mat_hang_id: U(12) },   // khay + gói
      { phieu_xuat_id: U(3), mat_hang_id: U(13) },                                                // chỉ món cân ký
      { phieu_xuat_id: U(4), mat_hang_id: U(11) }, { phieu_xuat_id: U(4), mat_hang_id: U(13) },   // khay + món cân ký
    ],
    kho_mat_hang: [
      { id: U(11), dem_goi: true, don_vi_goi: 'khay' }, { id: U(12), dem_goi: true, don_vi_goi: 'gói' },
      { id: U(13), dem_goi: false, don_vi_goi: 'khay' },
    ],
    kho_yeu_cau_quay_dong: [
      { yeu_cau_id: U(21), mat_hang_id: U(11) }, { yeu_cau_id: U(22), mat_hang_id: U(11) }, { yeu_cau_id: U(22), mat_hang_id: U(12) },
    ],
  };
  const clientGia = (hong = {}) => ({
    from(ten) {
      const q = { ten, trong: null };
      goi.push(q);
      const b = {
        select() { return b; },
        in(k, ds) { q.trong = [k, ds]; return b; },
        then(xong, loi) {
          if (hong[ten]) return Promise.resolve({ data: null, error: { message: 'fetch failed' } }).then(xong, loi);
          const ds = (bang[ten] ?? []).filter(r => !q.trong || q.trong[1].includes(r[q.trong[0]]));
          return Promise.resolve({ data: ds, error: null }).then(xong, loi);
        },
      };
      return b;
    },
  });
  const dv = await XUAT.docDonViPhieuXuat(clientGia(), [U(1), U(2), U(3), U(4), U(5), null, 'x']);
  ok('Phiếu một món đếm khay → "khay"; khay + gói → không có; chỉ món cân ký → không có; khay + món cân ký → "khay"; phiếu không có dòng → không có',
     dv.get(U(1)) === 'khay' && !dv.has(U(2)) && !dv.has(U(3)) && dv.get(U(4)) === 'khay' && !dv.has(U(5)), JSON.stringify([...dv]));
  ok('Chỉ hai lượt đọc cho cả danh sách (dòng phiếu của mọi phiếu + danh mục), lọc đúng các phiếu đang hiện',
     goi.length === 2 && goi.find(q => q.ten === 'kho_phieu_xuat_dong')?.trong?.[1].length === 5, JSON.stringify(goi.map(q => [q.ten, q.trong?.[1].length])));
  goi.length = 0;
  ok('Không có phiếu nào → không gọi database', (await XUAT.docDonViPhieuXuat(clientGia(), [])).size === 0 && goi.length === 0);
  ok('Đọc hỏng → Map rỗng (trang dùng chữ chung "gói"), không ném lỗi',
     (await XUAT.docDonViPhieuXuat(clientGia({ kho_phieu_xuat_dong: true }), [U(1)])).size === 0
     && (await XUAT.docDonViPhieuXuat(clientGia({ kho_mat_hang: true }), [U(1)])).size === 0);
  goi.length = 0;
  const yc = await QUAY.docDonViYeuCau(clientGia(), [U(21), U(22)], bang.kho_mat_hang);
  ok('Yêu cầu một món đếm khay → "khay"; khay + gói → không có; một lượt đọc (danh mục trang đã có sẵn)',
     yc.get(U(21)) === 'khay' && !yc.has(U(22)) && goi.length === 1, JSON.stringify([...yc]));
  ok('Yêu cầu: đọc hỏng → Map rỗng, không ném lỗi', (await QUAY.docDonViYeuCau(clientGia({ kho_yeu_cau_quay_dong: true }), [U(21)], bang.kho_mat_hang)).size === 0);
});

// ===========================================================================
await nhom('4 · NGÀY GIỜ TRONG CÂU "ĐÃ CHUYỂN SANG TRỪ KHO THEO iPOS"', async () => {
  const chay = async iso => {
    const f = new FormData();
    f.set('xac_nhan', 'co'); f.set('tu_luc', '2026-10-11T21:48');
    return chuyenSangIpos({ rpc: async () => ({ data: { ipos_tu_luc: iso }, error: null }) }, U(1), f);
  };
  const kq = await chay('2026-10-11T14:48:00+00:00');
  ok('HỒI QUY: mốc ghi kiểu Việt "từ 11/10 21:48" (giờ Việt Nam), không còn "2026-10-11 21:48"',
     kq.ok && /iPOS từ 11\/10 21:48\./.test(kq.cau) && !/2026-10-11/.test(kq.cau), kq.cau);
  ok('Bản tiếng Anh cùng mốc "from 11/10 21:48", không còn ngày kiểu máy', /from 11\/10 21:48\./.test(kq.cauEn ?? '') && !/2026-10-11/.test(kq.cauEn ?? ''), kq.cauEn);
  const dem = await chay('2026-10-11T17:30:00Z');
  ok('Mốc 17:30 UTC ngày 11/10 là 00:30 ngày 12/10 giờ Việt Nam', /từ 12\/10 00:30\./.test(dem.cau), dem.cau);
});

// ===========================================================================
await nhom('5 · CÁC TRANG DÙNG ĐƠN VỊ CỦA MÓN, HỘP DUYỆT CÓ CHỮ KG', async () => {
  const duyet = doc('pages/noi-bo/kho/duyet.astro');
  ok('HỒI QUY: hộp Duyệt, dòng báo hủy có chữ "kg" sau số kg', /\{dinhDangKg\(p\.tong_kg, nn\)\} kg · \{t\.o\}/.test(duyet));
  ok('HỒI QUY: hộp Duyệt đọc đơn vị của từng phiếu báo hủy (docDonViPhieuXuat) cùng lượt với tên người lập',
     /Promise\.all\(\[[\s\S]{0,200}tenNhanSu\([\s\S]{0,200}docDonViPhieuXuat\(/.test(duyet) && /t\.soGoi\(p\.tong_goi, donVi\.get\(p\.id\)\)/.test(duyet));
  const dsXuat = doc('pages/noi-bo/kho/xuat/index.astro');
  ok('Danh sách phiếu chuyển / xuất / hủy cũng vậy', /docDonViPhieuXuat\(/.test(dsXuat) && /t\.soGoi\(p\.tong_goi, donVi\.get\(p\.id\)\)/.test(dsXuat));
  const yc = doc('pages/noi-bo/kho/quay/yeu-cau/index.astro');
  ok('HỒI QUY: danh sách yêu cầu của quầy "1 món · 10 khay" (docDonViYeuCau)', /docDonViYeuCau\(/.test(yc) && /t\.soGoi\(y\.tong_goi, donVi\.get\(y\.id\)\)/.test(yc));
  const chuCung = s => /vi: \(n: number\) => `\$\{n\} gói/.test(s);
  ok('Ba danh sách đó không còn câu "${n} gói" viết cứng', !chuCung(duyet) && !chuCung(dsXuat) && !chuCung(yc));

  ok('HỒI QUY: goiRaQuay trả thêm đơn vị chung của các lô (donVi, donViQuay)', (() => {
    const lo = (id, loai, dv, goi) => ({ lo_id: id, vi_tri_id: `v-${loai}`, loai_vi_tri: loai, ten_hang: 'X', so_goi: goi, so_kg: 1, don_vi_goi: dv, dem_goi: true });
    const g = PHA.goiRaQuay([{ lo_id: 'a' }, { lo_id: 'b' }, { lo_id: 'c' }], [lo('a', 'kho', 'khay', 10), lo('b', 'kho', 'khay', 8), lo('c', 'quay', 'khay', 5)]);
    const tron = PHA.goiRaQuay([{ lo_id: 'a' }, { lo_id: 'b' }], [lo('a', 'kho', 'khay', 10), lo('b', 'kho', 'gói', 8)]);
    return g.tongGoi === 18 && g.donVi === 'khay' && g.daOQuay === 5 && g.donViQuay === 'khay' && tron.donVi === null;
  })());
  const pha = doc('pages/noi-bo/kho/pha-loc/[id].astro');
  ok('HỒI QUY: màn chốt phiên lóc "Chuyển 18 khay ra quầy ngay" — truyền đơn vị cho câu, không còn "${n} gói" viết cứng',
     /t\.chuyenRaQuay\(raQuay\.tongGoi, raQuay\.donVi\)/.test(pha) && /t\.daOQuay\(raQuay\.daOQuay, raQuay\.donViQuay\)/.test(pha)
     && !/`Chuyển \$\{n > 0 \? `\$\{n\} gói`/.test(pha) && !/`\$\{n\} gói đã để thẳng ở quầy\.`/.test(pha));
  ok('Phiên lóc: nút −1 và câu "Đã bớt 1 …" theo đơn vị của món', /t\.botMot\(m\.don_vi_goi, m\.ten\)/.test(pha) && /doiDonViCau\(/.test(pha));
  const dem = doc('pages/noi-bo/kho/quay/dem.astro');
  const motMon = (dong, hong = false) => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => (hong ? { data: null, error: { message: 'fetch failed' } } : { data: dong, error: null }) }) }) }) });
  ok('Đếm quầy: câu "Đã bớt 1 …" sau khi bấm −1 theo đơn vị của món (docDonViMon đọc song song với lệnh −1)',
     /doiDonViCau\(kq, dv\)/.test(dem) && /Promise\.all\(\[\s*suaQuet\([\s\S]{0,200}docDonViMon\(/.test(dem)
     && await DEM.docDonViMon(motMon({ dem_goi: true, don_vi_goi: 'khay' }), U(1)) === 'khay'
     && await DEM.docDonViMon(motMon({ dem_goi: false, don_vi_goi: 'khay' }), U(1)) === null
     && await DEM.docDonViMon(motMon(null), U(1)) === null && await DEM.docDonViMon(motMon(null, true), U(1)) === null
     && await DEM.docDonViMon(motMon({ dem_goi: true, don_vi_goi: 'khay' }), 'x') === null);
  const nhan = doc('pages/noi-bo/kho/quay/nhan.astro');
  ok('HỒI QUY: màn Nhận hàng ra quầy đổi đơn vị trong câu "Đã nhận đủ …" theo món của phiếu', /doiDonViCau\(/.test(nhan) && /donViChung\(/.test(nhan));
  const xuat = doc('pages/noi-bo/kho/xuat/[id].astro');
  ok('Trang phiếu chuyển: câu trả về kho / ghi mất / hủy chuyến và dòng "quầy nhận 8/10 …" theo đơn vị của món',
     /doiDonViCau\(await xuLyChuyenThieu\(/.test(xuat) && /doiDonViCau\(await huyChuyenDiDuong\(/.test(xuat)
     && /ch\.nhanTrenGoi\([^)]*donViPhieu\)/.test(xuat) && /ch\.soGoiDem\(congGoi\(traVe\), donViPhieu\)/.test(xuat));
  const xuatTs = doc('lib/kho/xuat.ts');
  ok('Lỗi nhập ở form phiếu xuất nói đúng đơn vị của món ("chưa nhập số khay")', (() => {
    const f = new FormData();
    f.set('so_dong', '1'); f.set('d0_mat_hang', U(1)); f.set('d0_so_kg', '1');
    const d = XUAT.docFormPhieuXuat(f, [{ id: U(1), ten: 'Ribeye', dem_goi: true, don_vi_goi: 'khay' }]);
    const cu = XUAT.docFormPhieuXuat(f, [{ id: U(1), ten: 'Ribeye', dem_goi: true }]);
    return d.loi.some(c => /chưa nhập số khay/.test(c)) && d.loiEn.some(c => /number of khay not entered/.test(c))
      && cu.loi.some(c => /chưa nhập số gói/.test(c)) && cu.loiEn.some(c => /number of packs not entered/.test(c));
  })(), xuatTs.length ? '' : 'không đọc được xuat.ts');
});

process.exit(ketThuc('ĐƠN VỊ ĐẾM TRONG CÂU · CHỮ KG · NGÀY GIỜ'));
