/**
 * BEEFTOWN KHO — Kiểm thử "Lóc #0142" một chạm (web, không migration)
 * ===================================================================
 *
 *     node test/test-kho-loc-tang-web.mjs
 *
 * Món theo dõi theo tảng trước đây phải đi 4–5 bước để lóc một tảng: chọn loại tảng, sang bước 2, mở mục
 * Tảng đem pha, tích đúng lô trong nhiều lô, Lưu, bấm "Giao ô mã". Bước dễ sai nhất là tích nhầm tảng.
 * Nay mục "Tảng lóc được" ở Pha lóc mới và nút "Lóc" dưới số tảng ở Tảng · ủ mở phiên nháp với ĐÚNG lô đó
 * (mọi chỗ lóc được: kho lạnh, quầy) và giao ô mã luôn khi loại tảng có một công thức (locMotTang trong
 * web/src/lib/kho/pha-loc.ts). Không migration: dùng lại kho_luu_phien_pha (cùng ma_gui trả phiên cũ) và
 * kho_giao_o_ma (bấm lại không lấy thêm ô).
 *
 * Gọi THẲNG hàm web bằng client giả trên PGlite (taoClientPg) — đúng RLS, đúng quyền hàm như Supabase.
 *
 *   1. Hàm thuần: chỗ lóc được, tảng nào có nút, công thức, câu báo (số kiểu Việt, không chữ cấm).
 *   2–3. Dựng database; danh sách tảng lóc được đọc từ database.
 *   4. Một chạm: đúng lô, mọi vị trí kho / quầy (bỏ chờ huỷ), ngày pha giờ Việt Nam, công thức, ô mã.
 *   5. Bấm hai lần: tuần tự, SONG SONG cùng ma_gui (lần sau đọc danh sách trước khi lần đầu ghi xong),
 *      ma_gui khác khi tảng đang lóc dở, form cũ của phiên đã huỷ.
 *   6. Mất mạng: giao ô báo lỗi mạng / ném / database đã giao rồi phản hồi mất (vẫn vào phiên, câu đỏ "Không chắc
 *      đã giao ô mã" — không khẳng định "chưa giao được"), bấm lại tự lành, tạo phiên hỏng, đọc hỏng từng lượt
 *      (không ghi gì).
 *   7. Nhiều công thức: không tự giao ô. Món không dùng ô mã, phần cắt mang ô đã ngừng dùng: không gọi giao ô.
 *   8. Không có nút: lô không số tảng, tảng đang ủ, tảng chỉ còn ở chỗ chờ huỷ.
 *   9. Quyền: NV quầy, kế toán, chi nhánh khác, nhân sự đã nghỉ, tài khoản không có nhan_su, chưa đăng nhập.
 *   10. Giờ Việt Nam quanh mốc ủ xong (23:50 / 00:10).
 *   11. Hết ô mã: vẫn vào phiên, câu đỏ.
 *   12. Phiên nháp của từng lô (docLoCuaPhien trên database có phiên nháp thật): tảng đang lóc dở không có nút,
 *       Tảng · ủ có đúng số phiên; đọc hỏng thì ném.
 *   13. Sổ kho: phiên mở bằng Lóc → quét nhãn ô → chốt → kho_doi_soat_ton() rỗng.
 *   14. Trang (đọc mã nguồn): nút, chữ ghép, ve=tang, bảng 5 cột, hướng dẫn.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID, maGui, datGioDatabase, traGioDatabase } from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';
import { tinhSoKiemTra } from '../../web/src/lib/kho/ma-vach.ts';
import * as PL from '../../web/src/lib/kho/pha-loc.ts';
import { docTon } from '../../web/src/lib/kho/ton.ts';
import { docTangTon, cauConU } from '../../web/src/lib/kho/tang.ts';
import { MUC_HUONG_DAN } from '../../web/src/lib/kho/huong-dan.ts';
import { LOI_KHO_CHUNG } from '../../web/src/lib/kho/chung.ts';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — LÓC MỘT CHẠM "LÓC #0142" (WEB)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sach = s => !/thành công|success/i.test(s ?? '') && timChuoiCam(s ?? '').length === 0;

// ===========================================================================
await nhom('1 · HÀM THUẦN', async () => {
  const ton = [
    { lo_id: U(1), vi_tri_id: U(50), loai_vi_tri: 'kho', so_kg: 5.2 },
    { lo_id: U(1), vi_tri_id: U(51), loai_vi_tri: 'quay', so_kg: 1 },
    { lo_id: U(1), vi_tri_id: U(52), loai_vi_tri: 'cho_huy', so_kg: 0.2 },
    { lo_id: U(1), vi_tri_id: U(53), loai_vi_tri: 'dang_chuyen', so_kg: 0.3 },
    { lo_id: U(1), vi_tri_id: U(54), loai_vi_tri: 'kho', so_kg: 0 },
    { lo_id: U(2), vi_tri_id: U(52), loai_vi_tri: 'cho_huy', so_kg: 6 },
    { lo_id: U(3), vi_tri_id: U(50), loai_vi_tri: 'kho', so_kg: 0.1 },
    { lo_id: U(3), vi_tri_id: U(51), loai_vi_tri: 'quay', so_kg: 0.2 },
    ...[4, 5, 6].map(n => ({ lo_id: U(n), vi_tri_id: U(50), loai_vi_tri: 'kho', so_kg: 6 })),
  ];
  const cho = PL.choLocTheoLo(ton);
  ok('vaoCuaTang: tảng nằm kho lạnh và quầy → hai dòng; bỏ chờ huỷ, đang mang ra quầy, kg 0',
     JSON.stringify(PL.vaoCuaTang(cho, U(1))) === JSON.stringify([{ lo_id: U(1), vi_tri_id: U(50) }, { lo_id: U(1), vi_tri_id: U(51) }]),
     JSON.stringify(PL.vaoCuaTang(cho, U(1))));
  const tang = (lo, x = {}) => ({ lo_id: lo, so_tang: Number(lo.slice(-3)), tinh_trang_u: 'san_sang', ...x });
  ok('vaoCuaTang: lô khác hoặc tảng chỉ còn ở chờ huỷ → rỗng, không hiện nút Lóc',
     PL.vaoCuaTang(cho, U(2)).length === 0 && PL.vaoCuaTang(cho, U(9)).length === 0
     && PL.tangLocDuoc([tang(U(2)), tang(U(9))], cho, new Set()).length === 0);
  const ds = PL.tangLocDuoc([
    tang(U(1)), tang(U(3), { tinh_trang_u: 'chua_co_bang_u' }), tang(U(4), { so_tang: null }),
    tang(U(5), { tinh_trang_u: 'dang_u' }), tang(U(6)),
  ], cho, new Map([[U(6), { id: U(600), so_phieu: 'PL1' }]]));
  ok('tangLocDuoc: có số tảng, không đang ủ (chưa có bảng ủ vẫn có), còn chỗ lóc được, chưa nằm trong phiên nháp',
     ds.map(x => x.lo_id).join() === [U(1), U(3)].join(), ds.map(x => x.lo_id).join());
  ok('tangLocDuoc: kg chỉ tính chỗ lóc được, cộng theo gam (5,2 + 1 = 6,2; 0,1 + 0,2 = 0,3)',
     ds[0]?.kg_loc === 6.2 && ds[1]?.kg_loc === 0.3, JSON.stringify(ds.map(x => x.kg_loc)));

  const ct = [
    { id: 'a', mat_hang_vao_id: U(10), dang_dung: true, dong: [{ mat_hang_ra_id: U(20) }, { mat_hang_ra_id: U(21) }] },
    { id: 'b', mat_hang_vao_id: U(11), dang_dung: true, dong: [{ mat_hang_ra_id: U(20) }] },
    { id: 'c', mat_hang_vao_id: U(11), dang_dung: true, dong: [{ mat_hang_ra_id: U(21) }] },
    { id: 'd', mat_hang_vao_id: U(12), dang_dung: false, dong: [{ mat_hang_ra_id: U(20) }] },
    { id: 'e', mat_hang_vao_id: U(13), dang_dung: true, dong: [{ mat_hang_ra_id: U(21) }] },
    { id: 'f', mat_hang_vao_id: U(13), dang_dung: false, dong: [{ mat_hang_ra_id: U(20) }] },
  ];
  ok('congThucMot: đúng một công thức đang dùng → id; không có hoặc hai → null; công thức ngừng dùng không tính',
     PL.congThucMot(ct, U(10)) === 'a' && PL.congThucMot(ct, U(11)) === null && PL.congThucMot(ct, U(12)) === null
     && PL.congThucMot(ct, U(13)) === 'e' && PL.congThucMot(ct, U(99)) === null);
  const oMa = new Map([[U(20), [{ id: 'o1', mat_hang_id: U(20), so_o: 1, ma_can: '10011' }]]]);
  const dung = new Set();
  ok('coOMaTrongCongThuc: công thức có phần cắt mang ô → có; món theo tảng không dùng ô → không gọi giao ô',
     PL.coOMaTrongCongThuc(ct, U(10), null, oMa, dung) && PL.coOMaTrongCongThuc(ct, U(10), 'a', oMa, dung)
     && PL.coOMaTrongCongThuc(ct, U(11), 'b', oMa, dung) && !PL.coOMaTrongCongThuc(ct, U(11), 'c', oMa, dung)
     && !PL.coOMaTrongCongThuc(ct, U(13), null, oMa, dung) && !PL.coOMaTrongCongThuc(ct, U(12), null, oMa, dung));
  ok('coOMaTrongCongThuc: phần cắt mang ô mà mặt hàng đã ngừng dùng → không tính (như kho_giao_o_ma lọc m.dang_dung)',
     !PL.coOMaTrongCongThuc(ct, U(10), 'a', oMa, new Set([U(20)])) && !PL.coOMaTrongCongThuc(ct, U(11), null, oMa, new Set([U(20)]))
     && PL.coOMaTrongCongThuc(ct, U(10), 'a', oMa, new Set([U(21)])));

  const khongGoi = { from() { throw new Error('không được đọc database'); }, rpc() { throw new Error('không được gọi hàm'); } };
  const rong = await PL.docLoCuaPhien(khongGoi, []);
  ok('docLoCuaPhien: danh sách phiên rỗng → Map rỗng, không gọi database', rong instanceof Map && rong.size === 0);

  const giaoOk = { ok: true, cau: 'Đã giao ô mã — Thăn ngoại cắt lát: ô 1 (mã 10011).', cauEn: 'Rotating codes assigned — Striploin slice: slot 1 (code 10011).' };
  const giaoLoi = { ok: false, cau: '"Thăn ngoại cắt lát" đã dùng hết ô mã ở chi nhánh này — giải phóng ô của tảng đã bán hết, hoặc thêm ô ở Thiết lập → Mặt hàng' };
  const moi = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'moi', giao: null });
  const coO = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'moi', giao: giaoOk });
  const hong = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'moi', giao: giaoLoi });
  const doDo = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'dang_do', soPhieu: 'PL261026-001', giao: giaoOk });
  const daCo = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'da_co', giao: null });
  const chon = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'moi', giao: null, nhacChon: true });
  const tatCa = [moi, coO, hong, doDo, daCo, chon];
  ok('cauLocTang: giao ô hỏng → ok false, có "chưa giao được ô mã", có bản tiếng Anh; không câu nào chứa "thành công" hay chữ cấm (timChuoiCam)',
     hong.ok === false && /chưa giao được ô mã/.test(hong.cau) && /đã dùng hết ô mã/.test(hong.cau)
     && /Giao ô mã cho phần cắt/.test(hong.cau) && /chưa in tem bằng phím ô/.test(hong.cau)
     && /not assigned yet/.test(hong.cauEn ?? '') && !/Đã giao ô mã/.test(hong.cau)
     && tatCa.every(k => !!k.cauEn && sach(k.cau) && sach(k.cauEn)), hong.cau);
  ok('cauLocTang: số kiểu Việt "6,2 kg", tiếng Anh "6.2 kg", số tảng "#0142"',
     /#0142/.test(moi.cau) && /6,2 kg/.test(moi.cau) && /6\.2 kg/.test(moi.cauEn) && /#0142/.test(moi.cauEn) && !/6\.2/.test(moi.cau));
  ok('cauLocTang: giao xong → ok, nối câu giao ô (vi và en); lóc dở nêu số phiên; bấm trước nói "từ lần bấm trước"',
     coO.ok && coO.cau.endsWith(giaoOk.cau) && coO.cauEn.endsWith(giaoOk.cauEn) && moi.ok && !/ô mã/.test(moi.cau)
     && doDo.ok && /đang lóc dở ở phiên PL261026-001/.test(doDo.cau) && /PL261026-001/.test(doDo.cauEn)
     && daCo.ok && /lần bấm trước/.test(daCo.cau));
  // Mất mạng lúc giao ô: database có thể đã giao xong mà phản hồi không về — không được nói "chưa giao được".
  const matMang = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'moi', giao: { ok: false, cau: LOI_KHO_CHUNG.mang.vi, cauEn: LOI_KHO_CHUNG.mang.en } });
  const nemGiao = PL.cauLocTang({ soTang: 142, kg: 6.2, cach: 'dang_do', soPhieu: 'PL261026-001', giao: giaoLoi, giaoKhongChac: true });
  ok('cauLocTang: giao ô mất mạng / ném → ok false, "Không chắc đã giao ô mã", không "chưa giao được", nhắc xem khung "Ô mã của tảng này" (vi và en)',
     [matMang, nemGiao].every(k => !k.ok && /Không chắc đã giao ô mã/.test(k.cau) && !/chưa giao được|Nếu vừa bấm lưu/.test(k.cau)
       && /"Ô mã của tảng này"/.test(k.cau) && /Giao ô mã cho phần cắt/.test(k.cau) && /chưa in tem bằng phím ô/.test(k.cau)
       && /not certain whether the rotating codes were assigned/.test(k.cauEn ?? '') && /"Rotating codes for this primal"/.test(k.cauEn ?? '')
       && !/not assigned yet|may or may not/.test(k.cauEn ?? '') && sach(k.cau) && sach(k.cauEn))
     && /#0142/.test(matMang.cau) && /đang lóc dở ở phiên PL261026-001/.test(nemGiao.cau), `${matMang.cau} | ${nemGiao.cau}`);
  ok('cauLocTang: nhiều công thức → nhắc chọn công thức rồi bấm "Giao ô mã cho phần cắt" (vi và en)',
     chon.ok && /nhiều công thức/.test(chon.cau) && /Giao ô mã cho phần cắt/.test(chon.cau)
     && /several recipes/.test(chon.cauEn) && /Assign rotating codes to the cuts/.test(chon.cauEn));
});

// ===========================================================================
// DATABASE
// ===========================================================================
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
// Mỗi câu lệnh "dưới danh nghĩa một người" phải chạy trọn rồi mới tới câu sau: duoi() ghi rồi xoá người đang đăng
// nhập quanh câu lệnh, hai lệnh xen nhau trên cùng một PGlite thì lệnh này chạy bằng người của lệnh kia. Hàm web
// đọc song song (Promise.all) nên nối tiếp ở đây — như mỗi yêu cầu PostgREST là một giao dịch riêng.
let hang = Promise.resolve();
const noiTiep = f => (...a) => { const kq = hang.then(() => f(...a)); hang = kq.catch(() => {}); return kq; };
const chay = noiTiep(duoi);
// Câu lệnh trực tiếp của kiểm thử cũng xếp chung hàng: lượt đọc còn dở của một hàm web (Promise.all dừng sớm khi một
// lượt hỏng, các lượt khác vẫn chạy nốt) không được chen vào giữa lúc database đang mang danh một người.
const truyVan = noiTiep((sql, gt) => db['query'](sql, gt));
const datGioDb = noiTiep(datGioDatabase);
const traGioDb = noiTiep(traGioDatabase);
const clientCua = await taoClientPg({ db, duoi: chay, duoiAnon: noiTiep(duoiAnon) });
const lam = async (uid, sql, gt = []) => {
  const r = await chay(uid, sql, gt);
  if (r.loi) throw new Error(`${sql.trim().slice(0, 70)}… → ${r.loi}`);
  return r.rows;
};

const homNay = (await truyVan(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await truyVan(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK (gram). */
const nhan = (maCan, gram) => {
  const s12 = `20${String(maCan).padStart(5, '0')}${String(gram).padStart(5, '0')}`;
  return s12 + tinhSoKiemTra(s12);
};

const MH = {};
const CT = {};
let vt = {}, vtB = {};
const L = {};
const phienCuaLo = async lo => (await truyVan(`select p.id, p.so_phieu, p.trang_thai, p.ngay_pha::text as ngay_pha, p.cong_thuc_id
  from kho_phien_pha p where exists (select 1 from kho_phien_pha_vao v where v.phien_pha_id = p.id and v.lo_id = $1)
  order by p.created_at`, [lo])).rows;
const oCuaPhien = async id => (await truyVan(`select o.so_o, o.ma_can from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
  where g.phien_pha_id = $1 and g.den_luc is null order by o.ma_can`, [id])).rows;
const vaoCuaPhien = async id => (await truyVan(`select lo_id, vi_tri_id, so_kg::float8 as so_kg from kho_phien_pha_vao
  where phien_pha_id = $1 order by thu_tu`, [id])).rows;
const demGiao = async () => (await truyVan(`select count(*)::int as n from kho_o_ma_giao`)).rows[0].n;
/** Chuyển kg (và số tảng) của một lô giữa hai vị trí — hai dòng sổ, tồn tự theo (trigger), đối soát vẫn khớp. */
const chuyen = async (lo, tu, den, kg, goi = 0) => {
  const ct = (await truyVan(`select gen_random_uuid() as id`)).rows[0].id;
  for (const [vi, k, g, loai] of [[tu, -kg, -goi, 'chuyen_di'], [den, kg, goi, 'chuyen_den']]) {
    await truyVan(`insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
      values ($1, $2, $3, $4, $5, $6, $7, 'phieu_xuat', $8)`, [lo.chi_nhanh_id, lo.id, vi, lo.mat_hang_id, loai, k, g, ct]);
  }
};

/**
 * Client giả hỏng: `bang` — đọc các bảng này trả lỗi như mất mạng; `rpcLoi` / `rpcNem` — hàm trả lỗi / ném;
 * `rpcMatSau` — hàm chạy xong trong database rồi phản hồi mới mất (trả lỗi mất mạng);
 * `truocRpc` — chờ trước khi gọi hàm (để xếp hai lần bấm song song); `bangSauGhi` — bảng hỏng sau khi đã gọi
 * kho_luu_phien_pha. `goi` ghi lại mọi hàm đã gọi.
 */
function clientGia(goc, { bang = [], rpcLoi = [], rpcNem = [], rpcMatSau = [], truocRpc = null, bangSauGhi = [] } = {}) {
  const goi = [];
  const loi = { data: null, error: { message: 'TypeError: fetch failed' } };
  const hong = () => {
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b, limit: () => b, range: () => b,
      maybeSingle: async () => loi, then: (xong, h) => Promise.resolve(loi).then(xong, h),
    };
    return b;
  };
  return {
    goi,
    from: ten => (bang.includes(ten) || (goi.includes('kho_luu_phien_pha') && bangSauGhi.includes(ten)) ? hong() : goc.from(ten)),
    async rpc(ten, ts) {
      goi.push(ten);
      if (truocRpc) await truocRpc(ten);
      if (rpcNem.includes(ten)) throw new TypeError('fetch failed');
      if (rpcLoi.includes(ten)) return loi;
      if (rpcMatSau.includes(ten)) { await goc.rpc(ten, ts); return loi; }
      return goc.rpc(ten, ts);
    },
  };
}

const tk = clientCua(UID.thuKhoA);
const loc = (client, lo, mg = maGui(), cn = cnA.id) => PL.locMotTang(client, cn, { maGui: mg, loId: lo.id });

// ===========================================================================
await nhom('2 · DỰNG: TẢNG THEO DÕI THEO TẢNG, BẢNG Ủ, CÔNG THỨC, Ô MÃ', async () => {
  await lam(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await lam(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await lam(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await truyVan(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await truyVan(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  vtB = Object.fromEntries((await truyVan(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnB.id])).rows.map(r => [r.loai, r.id]));
  await lam(UID.qlA, `update kho_mat_hang set theo_tang = true where ma in ('T-THANNGOAI', 'T-THANLUNG', 'T-THANNOI')`);
  await lam(UID.qlA, `update kho_mat_hang set ma_can = case ma when 'C-THANNGOAI' then '301' when 'C-THANNOI' then '302' when 'C-THANLUNG' then '303' end,
    gia_ban_kg = 900000 where ma in ('C-THANNGOAI', 'C-THANNOI', 'C-THANLUNG')`);
  await lam(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012'), ($1, 3, '10013')`, [MH['C-THANNGOAI'].id]);
  await lam(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10021'), ($1, 2, '10022')`, [MH['C-THANLUNG'].id]);
  const congThuc = async (ma, ten, dong) => {
    const id = (await lam(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, $2) returning id`, [MH[ma].id, ten]))[0].id;
    for (const [ra, tl, xl] of dong) {
      await lam(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien, xu_ly) values ($1, $2, $3, $4)`, [id, MH[ra].id, tl, xl]);
    }
    return id;
  };
  CT.ngoai = await congThuc('T-THANNGOAI', 'Thăn ngoại chuẩn', [['C-THANNGOAI', 60, null], ['C-THANNOI', 15, null], ['P-MO', 12, 'bo']]);
  CT.lung1 = await congThuc('T-THANLUNG', 'Thăn lưng lát mỏng', [['C-THANLUNG', 65, null]]);
  CT.lung2 = await congThuc('T-THANLUNG', 'Thăn lưng steak', [['C-THANLUNG', 70, null]]);
  CT.noi = await congThuc('T-THANNOI', 'Thăn nội', [['C-THANNOI', 70, null]]);
  // Bảng ủ thăn ngoại: tuổi ≤ 1 ngày ủ 20 ngày, ≤ 2 ủ 13, còn lại ủ 8 — nhận ngày −10: tuổi 4 → ủ xong ngày −2 (sẵn
  // sàng), tuổi 1 → ngày +10 (đang ủ), tuổi 2 → ngày +3 (mốc giờ Việt Nam ở nhóm 10).
  for (const [tuoi, n] of [[1, 20], [2, 13], [null, 8]]) {
    await lam(UID.qlA, `insert into kho_bang_u (mat_hang_id, tuoi_den_ngay, so_ngay_u) values ($1, $2, $3)`, [MH['T-THANNGOAI'].id, tuoi, n]);
  }
  const ncc = (await lam(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`))[0].id;
  const nhap = async (cn, dong) => {
    const ql = cn === cnB.id ? UID.qlB : UID.qlA;
    const pn = (await lam(ql, `
      select * from kho_luu_phieu_nhap(
        p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null, p_loai => 'mua', p_nha_cung_cap_id => $3,
        p_vi_tri_id => $4, p_ngay_nhap => $5::date, p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
        p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
        p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
      [cn, maGui(), ncc, cn === cnB.id ? vtB.kho : vt.kho, await ngay(-10), JSON.stringify(dong)]))[0];
    await lam(cn === cnB.id ? UID.thuKhoB : UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [pn.phieu_id, pn.phien_ban_moi]);
    await lam(ql, `select kho_duyet_phieu_nhap($1)`, [pn.phieu_id]);
    return (await truyVan(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
      where d.phieu_nhap_id = $1 order by d.thu_tu`, [pn.phieu_id])).rows;
  };
  // Nạc vai nhận TRƯỚC khi bật theo dõi theo tảng → lô của nó không có số tảng.
  L.khongSo = (await nhap(cnA.id, [{ mat_hang_id: MH['T-NACVAI'].id, so_kg: 7, so_kg_thuc: 7, so_goi: 1, don_gia_kg: 400000 }]))[0];
  await lam(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-NACVAI'`);
  const tang = (ma, kg, tuoi) => ({ mat_hang_id: MH[ma].id, so_kg: kg, so_kg_thuc: kg, don_gia_kg: 500000, ngay_mo: tuoi });
  const [m14, m11, m12] = [await ngay(-14), await ngay(-11), await ngay(-12)];
  const lo = await nhap(cnA.id, [
    tang('T-THANNGOAI', 6.4, m14), tang('T-THANNGOAI', 6.1, m14), tang('T-THANNGOAI', 6.2, m14), tang('T-THANNGOAI', 6.3, m14),
    tang('T-THANNGOAI', 6.5, m11), tang('T-THANNGOAI', 6.6, m12), tang('T-THANNGOAI', 6.7, m14), tang('T-THANNGOAI', 6.8, m14),
    tang('T-THANLUNG', 5.5, m14), tang('T-THANNOI', 3.2, m14),
  ]);
  [L[1], L[2], L[3], L[4], L[5], L[6], L[7], L[8], L.lung, L.noi] = lo;
  L.b = (await nhap(cnB.id, [tang('T-THANNGOAI', 6, m14)]))[0];
  ok('Tảng thăn ngoại #0001–#0008, thăn lưng #0009, thăn nội #0010; nạc vai nhận trước khi bật → không số tảng',
     lo.map(l => l.so_tang).join() === '1,2,3,4,5,6,7,8,9,10' && L.khongSo.so_tang === null, lo.map(l => l.so_tang).join());
  ok('Ngày ủ xong theo bảng ủ: tuổi 4 → ngày −2, tuổi 1 → ngày +10, tuổi 2 → ngày +3',
     (await truyVan(`select (ngay_u_xong - $1::date) as n from kho_lo where id = any($2::uuid[]) order by so_tang`,
       [homNay, [L[1].id, L[5].id, L[6].id]])).rows.map(r => r.n).join() === '-2,10,3');
  // Tảng #0001: 1 kg đã ra quầy, 0,2 kg đang chờ huỷ — một chạm lấy kho lạnh + quầy (6,2 kg), bỏ chờ huỷ.
  await chuyen(L[1], vt.kho, vt.quay, 1);
  await chuyen(L[1], vt.kho, vt.cho_huy, 0.2);
  const t1 = (await truyVan(`select v.loai, t.so_kg::float8 as kg from kho_ton t join kho_vi_tri v on v.id = t.vi_tri_id
    where t.lo_id = $1 and t.so_kg > 0 order by v.loai`, [L[1].id])).rows;
  ok('Tảng #0001 nằm ba chỗ: kho lạnh 5,2 · quầy 1 · chờ huỷ 0,2', t1.map(r => `${r.loai}:${r.kg}`).join() === 'cho_huy:0.2,kho:5.2,quay:1',
     JSON.stringify(t1));
});

// ===========================================================================
await nhom('3 · TẢNG LÓC ĐƯỢC (đọc từ database — cùng luật ở Pha lóc mới và Tảng · ủ)', async () => {
  const [ton, tang] = await Promise.all([docTon(tk, cnA.id), docTangTon(tk, cnA.id)]);
  const ds = PL.tangLocDuoc(tang, PL.choLocTheoLo(ton), new Map());
  const so = ds.map(x => x.so_tang).sort((a, b) => a - b).join();
  ok('Tảng lóc được: ủ xong và chưa có bảng ủ có số; không có tảng đang ủ (#0005, #0006 ủ xong ngày +3), không có lô không số tảng',
     so === '1,2,3,4,7,8,9,10', so);
  ok('Tảng #0001: 6,2 kg lóc được (bỏ 0,2 kg chờ huỷ)', ds.find(x => x.so_tang === 1)?.kg_loc === 6.2);
  const cho = await PL.docChoLocTang(tk, cnA.id, tang.map(t => t.lo_id));
  const soCho = PL.tangLocDuoc(tang, cho, new Map()).map(x => `${x.so_tang}:${x.kg_loc}`).sort().join();
  ok('docChoLocTang (Tảng · ủ, đọc theo lô) ra đúng như tồn đầy đủ (Pha lóc mới)',
     soCho === ds.map(x => `${x.so_tang}:${x.kg_loc}`).sort().join(), soCho);
});

// ===========================================================================
const P = {};
let mg1 = '';
await nhom('4 · MỘT CHẠM: ĐÚNG LÔ, ĐÚNG CÔNG THỨC, Ô MÃ GIAO LUÔN', async () => {
  mg1 = maGui();
  const kq = await loc(tk, L[1], mg1);
  const ph = await phienCuaLo(L[1].id);
  P[1] = ph[0]?.id;
  const vao = P[1] ? await vaoCuaPhien(P[1]) : [];
  ok('Thủ kho bấm Lóc #0001: một phiên nháp đúng lô đó (mọi vị trí kho/quầy), ngày pha hôm nay giờ Việt Nam, công thức gắn sẵn',
     kq.ok && kq.id === P[1] && ph.length === 1 && ph[0].trang_thai === 'nhap' && ph[0].ngay_pha === homNay
     && ph[0].cong_thuc_id === CT.ngoai && vao.length === 2 && vao.every(v => v.lo_id === L[1].id)
     && vao.map(v => `${v.vi_tri_id === vt.kho ? 'kho' : v.vi_tri_id === vt.quay ? 'quay' : '?'}:${v.so_kg}`).sort().join() === 'kho:5.2,quay:1',
     `${kq.cau} · ${JSON.stringify(vao)}`);
  const o = P[1] ? await oCuaPhien(P[1]) : [];
  ok('Ô mã giao luôn cho phần cắt có ô trong công thức; câu báo nêu ô và mã',
     o.map(x => x.ma_can).join() === '10011' && /ô 1 \(mã 10011\)/.test(kq.cau) && /slot 1 \(code 10011\)/.test(kq.cauEn ?? '')
     && /#0001/.test(kq.cau) && /6,2 kg/.test(kq.cau) && /6\.2 kg/.test(kq.cauEn ?? ''), kq.cau);
  ok('Câu báo vừa cookie chuyển trang (dưới 3.800 byte sau khi mã hoá)',
     encodeURIComponent(JSON.stringify(kq)).length < 3800, String(encodeURIComponent(JSON.stringify(kq)).length));
});

// ===========================================================================
await nhom('5 · BẤM HAI LẦN', async () => {
  const lai = await loc(tk, L[1], mg1);
  ok('HAI LẦN: bấm lại cùng ma_gui (tuần tự) → cùng phiên, câu "đang lóc dở", vẫn một phiên, vẫn một ô',
     lai.ok && lai.id === P[1] && /đang lóc dở/.test(lai.cau) && (await phienCuaLo(L[1].id)).length === 1
     && (await oCuaPhien(P[1])).length === 1, lai.cau);

  // SONG SONG: lần bấm thứ hai đọc xong (chưa thấy phiên nào) rồi mới tới lượt ghi — trong lúc đó lần đầu ghi xong.
  let toiGhi, moCua;
  const daToiGhi = new Promise(r => { toiGhi = r; });
  const cua = new Promise(r => { moCua = r; });
  const mg = maGui();
  const cham = clientGia(tk, { truocRpc: async ten => { if (ten === 'kho_luu_phien_pha') { toiGhi(); await cua; } } });
  const lan2 = loc(cham, L[2], mg);
  await daToiGhi;
  const lan1 = await loc(tk, L[2], mg);
  moCua();
  const kq2 = await lan2;
  P[2] = lan1.id;
  ok('HAI LẦN song song: gọi locMotTang hai lần cùng ma_gui (lần sau đọc trước khi lần một ghi xong) → lần sau trả cùng id, ok true, vẫn một phiên, một ô mỗi phần cắt',
     lan1.ok && kq2.ok && kq2.id === lan1.id && /lần bấm trước/.test(kq2.cau) && (await phienCuaLo(L[2].id)).length === 1
     && (await oCuaPhien(P[2])).map(o => o.ma_can).join() === '10012' && cham.goi.includes('kho_giao_o_ma'),
     `${lan1.cau} | ${kq2.cau}`);

  const khac = await loc(tk, L[1]);
  ok('HAI LẦN: bấm lại bằng ma_gui khác (máy khác, trang tải lại) khi tảng đang lóc dở → mở phiên cũ, không tạo phiên mới',
     khac.ok && khac.id === P[1] && /đang lóc dở ở phiên PL/.test(khac.cau) && (await phienCuaLo(L[1].id)).length === 1
     && (await oCuaPhien(P[1])).length === 1, khac.cau);

  const huy = await PL.huyPhien(tk, P[2], 'Để mai lóc');
  const giaoTruoc = await demGiao();
  const cu = await loc(tk, L[2], mg);
  ok('Form cũ của phiên đã huỷ (cùng ma_gui) → "Trang đã cũ", không giao ô cho phiên đã huỷ',
     huy.ok && !cu.ok && !cu.id && /Trang đã cũ/.test(cu.cau) && (await oCuaPhien(P[2])).length === 0
     && await demGiao() === giaoTruoc && (await phienCuaLo(L[2].id)).length === 1, `${huy.cau} · ${cu.cau}`);

  // Song song mà lần sau đọc lại phiên hỏng (mạng đứt ngay sau lượt ghi): không đoán, không ghi thêm.
  let toi2, mo2;
  const den2 = new Promise(r => { toi2 = r; });
  const cua2 = new Promise(r => { mo2 = r; });
  const mgB = maGui();
  const cham2 = clientGia(tk, { bangSauGhi: ['kho_phien_pha'],
    truocRpc: async ten => { if (ten === 'kho_luu_phien_pha') { toi2(); await cua2; } } });
  const sau = loc(cham2, L[2], mgB);
  await den2;
  const truoc = await loc(tk, L[2], mgB);
  mo2();
  const kqSau = await sau;
  P['2b'] = truoc.id;
  ok('HAI LẦN song song, lần sau đọc lại phiên hỏng → ok false, không id, câu "Không đọc được", không giao ô thêm',
     truoc.ok && !kqSau.ok && !kqSau.id && /Không đọc được/.test(kqSau.cau) && !cham2.goi.includes('kho_giao_o_ma')
     && (await oCuaPhien(truoc.id)).length === 1 && (await phienCuaLo(L[2].id)).length === 2, kqSau.cau);
  await PL.huyPhien(tk, P['2b'], 'Thử bấm đúp');
});

// ===========================================================================
await nhom('6 · MẤT MẠNG', async () => {
  const loiGiao = clientGia(tk, { rpcLoi: ['kho_giao_o_ma'] });
  const a = await loc(loiGiao, L[3]);
  P[3] = a.id;
  ok('MẤT MẠNG: rpc kho_giao_o_ma báo lỗi mạng → vẫn trả id phiên đã mở, ok false, câu "Không chắc đã giao ô mã" (không khẳng định "chưa giao được"); không nói đã giao',
     !a.ok && !!a.id && /Không chắc đã giao ô mã/.test(a.cau) && !/chưa giao được/.test(a.cau) && !/Đã giao ô mã/.test(a.cau)
     && /not certain whether the rotating codes were assigned/.test(a.cauEn ?? '')
     && (await oCuaPhien(a.id)).length === 0 && (await phienCuaLo(L[3].id)).length === 1, a.cau);
  const nem = clientGia(tk, { rpcNem: ['kho_giao_o_ma'] });
  const b = await loc(nem, L[3]);
  ok('MẤT MẠNG: rpc kho_giao_o_ma ném (fetch failed) khi bấm lại → vẫn vào đúng phiên đó, ok false, câu "Không chắc đã giao ô mã"',
     !b.ok && b.id === P[3] && /Không chắc đã giao ô mã/.test(b.cau) && !/chưa giao được/.test(b.cau) && !/Đã giao ô mã/.test(b.cau)
     && (await phienCuaLo(L[3].id)).length === 1, b.cau);
  const matSau = clientGia(tk, { rpcMatSau: ['kho_giao_o_ma'] });
  const b2 = await loc(matSau, L[3]);
  ok('MẤT MẠNG sau khi database đã giao ô (phản hồi mất) → ok false, câu "Không chắc đã giao ô mã", không "chưa giao được"; ô đã có trong khung Ô mã của tảng này',
     !b2.ok && b2.id === P[3] && /Không chắc đã giao ô mã/.test(b2.cau) && !/chưa giao được/.test(b2.cau)
     && matSau.goi.includes('kho_giao_o_ma') && (await oCuaPhien(P[3])).length === 1 && (await phienCuaLo(L[3].id)).length === 1, b2.cau);
  const c = await loc(tk, L[3]);
  ok('Lóc dở tự lành: bấm lại khi mạng đã về → cùng phiên, giao được ô, vẫn một phiên',
     c.ok && c.id === P[3] && /đang lóc dở/.test(c.cau) && /Đã giao ô mã/.test(c.cau)
     && (await oCuaPhien(P[3])).length === 1 && (await phienCuaLo(L[3].id)).length === 1, c.cau);

  const giaoTruoc = await demGiao();
  const loiTao = clientGia(tk, { rpcLoi: ['kho_luu_phien_pha'] });
  const d = await loc(loiTao, L[7]);
  const nemTao = clientGia(tk, { rpcNem: ['kho_luu_phien_pha'] });
  const e = await loc(nemTao, L[7]);
  ok('MẤT MẠNG: rpc kho_luu_phien_pha báo lỗi → không id, không phiên nào, câu lỗi; ném → "Không chắc đã mở phiên"',
     !d.ok && !d.id && !e.ok && !e.id && /Không chắc đã mở phiên/.test(e.cau) && !loiTao.goi.includes('kho_giao_o_ma')
     && !nemTao.goi.includes('kho_giao_o_ma') && (await phienCuaLo(L[7].id)).length === 0 && await demGiao() === giaoTruoc,
     `${d.cau} · ${e.cau}`);

  for (const bang of ['kho_v_tang', 'kho_v_ton', 'kho_cong_thuc_pha', 'kho_cong_thuc_pha_dong', 'kho_o_ma', 'kho_mat_hang', 'kho_phien_pha_vao']) {
    const c2 = clientGia(tk, { bang: [bang] });
    const r = await loc(c2, L[4]);
    ok(`MẤT MẠNG khi đọc ${bang}: không gọi hàm ghi nào, không phiên nào, câu "Không đọc được … — tải lại trang rồi bấm lại"`,
       !r.ok && !r.id && /Không đọc được/.test(r.cau) && /bấm lại/.test(r.cau) && !!r.cauEn && c2.goi.length === 0
       && (await phienCuaLo(L[4].id)).length === 0, `${r.cau} · ${c2.goi.join()}`);
  }
  const c3 = clientGia(tk, { bang: ['kho_phien_pha'] });
  const r3 = await loc(c3, L[1]);
  ok('MẤT MẠNG khi đọc phiên nháp của tảng đang lóc dở: không gọi hàm nào (kể cả giao ô), câu "Không đọc được"',
     !r3.ok && !r3.id && /Không đọc được/.test(r3.cau) && c3.goi.length === 0 && (await phienCuaLo(L[1].id)).length === 1, r3.cau);
});

// ===========================================================================
await nhom('7 · CÔNG THỨC: NHIỀU CÔNG THỨC, MÓN KHÔNG DÙNG Ô MÃ', async () => {
  const c = clientGia(tk);
  const kq = await loc(c, L.lung);
  const ph = await phienCuaLo(L.lung.id);
  ok('Nhiều công thức → mở phiên, KHÔNG tự giao ô, câu nhắc chọn công thức rồi bấm "Giao ô mã cho phần cắt"',
     kq.ok && !!kq.id && ph.length === 1 && ph[0].cong_thuc_id === null && !c.goi.includes('kho_giao_o_ma')
     && (await oCuaPhien(kq.id)).length === 0 && /nhiều công thức/.test(kq.cau) && /Giao ô mã cho phần cắt/.test(kq.cau)
     && /several recipes/.test(kq.cauEn ?? ''), kq.cau);
  const c2 = clientGia(tk);
  const noi = await loc(c2, L.noi);
  const phNoi = await phienCuaLo(L.noi.id);
  ok('Món theo tảng không có ô trong công thức → mở phiên, không gọi giao ô, câu xanh không nhắc ô',
     noi.ok && !!noi.id && phNoi.length === 1 && phNoi[0].cong_thuc_id === CT.noi && !c2.goi.includes('kho_giao_o_ma')
     && !/ô mã/.test(noi.cau) && /#0010/.test(noi.cau), noi.cau);

  // Phần cắt mang ô duy nhất của công thức thăn ngoại bị ngừng dùng mà công thức chưa sửa: kho_giao_o_ma chỉ lấy phần
  // cắt đang dùng (0049, m.dang_dung) nên không có ô nào để giao — không gọi, không câu đỏ "Chưa có phần cắt nào có ô mã".
  await lam(UID.qlA, `update kho_mat_hang set dang_dung = false where id = $1`, [MH['C-THANNGOAI'].id]);
  try {
    const c3 = clientGia(tk);
    const ngung = await loc(c3, L[7]);
    const ph7 = await phienCuaLo(L[7].id);
    ok('Phần cắt mang ô đã ngừng dùng (C-THANNGOAI) → mở phiên, KHÔNG gọi kho_giao_o_ma, câu xanh không nhắc ô mã',
       ngung.ok && !!ngung.id && ph7.length === 1 && ph7[0].cong_thuc_id === CT.ngoai && !c3.goi.includes('kho_giao_o_ma')
       && !/ô mã/.test(ngung.cau) && !/Chưa có phần cắt nào có ô mã/.test(ngung.cau) && /#0007/.test(ngung.cau)
       && (await oCuaPhien(ngung.id)).length === 0, ngung.cau);
    P[7] = ngung.id;
  } finally {
    await lam(UID.qlA, `update kho_mat_hang set dang_dung = true where id = $1`, [MH['C-THANNGOAI'].id]);
  }
});

// ===========================================================================
await nhom('8 · KHÔNG CÓ NÚT: LÔ KHÔNG SỐ TẢNG, TẢNG ĐANG Ủ', async () => {
  const [ton, tang] = await Promise.all([docTon(tk, cnA.id), docTangTon(tk, cnA.id)]);
  const ds = PL.tangLocDuoc(tang, PL.choLocTheoLo(ton), new Map());
  const c = clientGia(tk);
  const kq = await loc(c, L.khongSo);
  ok('Lô theo tảng không có số tảng (nhận trước khi bật theo dõi) → không có nút Lóc, locMotTang không mở phiên',
     tang.some(t => t.lo_id === L.khongSo.id) && !ds.some(t => t.lo_id === L.khongSo.id)
     && !kq.ok && !kq.id && /không có số tảng/.test(kq.cau) && !!kq.cauEn && c.goi.length === 0
     && (await phienCuaLo(L.khongSo.id)).length === 0, kq.cau);
  const c5 = clientGia(tk);
  const u = await loc(c5, L[5]);
  ok('Tảng đang ủ (#0005) → không có nút; form cũ bấm vào cũng không mở phiên, câu nói còn đang ủ',
     !ds.some(t => t.lo_id === L[5].id) && !u.ok && !u.id && /#0005 còn đang ủ/.test(u.cau) && /còn 10 ngày/.test(u.cau)
     && !!u.cauEn && c5.goi.length === 0 && (await phienCuaLo(L[5].id)).length === 0, u.cau);
});

// ===========================================================================
await nhom('9 · QUYỀN', async () => {
  const giaoTruoc = await demGiao();
  const ai = [
    ['NV quầy', UID.nvQuayA, cnA.id], ['Kế toán', UID.keToanA, cnA.id], ['Thủ kho chi nhánh B', UID.thuKhoB, cnA.id],
    ['Thủ kho chi nhánh B gửi chi nhánh của mình', UID.thuKhoB, cnB.id], ['Quản lý chi nhánh B', UID.qlB, cnA.id],
    ['Nhân sự đã nghỉ', UID.nghiViec, cnA.id], ['Tài khoản không có dòng nhan_su', null, cnA.id], ['Chưa đăng nhập', 'anon', cnA.id],
  ];
  const kq = [];
  for (const [ten, uid, cn] of ai) kq.push([ten, await loc(clientCua(uid), L[4], maGui(), cn)]);
  const lot = kq.filter(([, r]) => r.ok || r.id);
  ok('QUYỀN: NV quầy, kế toán, thủ kho chi nhánh B, nhân sự đã nghỉ, tài khoản không có dòng nhan_su → ok false, không có phiên nào, không có dòng kho_o_ma_giao nào',
     lot.length === 0 && (await phienCuaLo(L[4].id)).length === 0 && await demGiao() === giaoTruoc,
     lot.map(([t, r]) => `${t}: ${r.cau}`).join(' | ') || kq.map(([t, r]) => `${t}: ${r.cau}`).join(' | '));
  const tkB = await loc(clientCua(UID.thuKhoB), L.b, maGui(), cnA.id);
  ok('Thủ kho B bấm tảng của chi nhánh B mà gửi chi nhánh A → không mở phiên', !tkB.ok && !tkB.id && (await phienCuaLo(L.b.id)).length === 0, tkB.cau);

  // Tảng #0004 dời hết vào chỗ chờ huỷ: không còn chỗ lóc được.
  await chuyen(L[4], vt.kho, vt.cho_huy, 6.3, 1);
  const [ton, tang] = await Promise.all([docTon(tk, cnA.id), docTangTon(tk, cnA.id)]);
  const r = await loc(tk, L[4]);
  ok('Tảng chỉ còn ở chỗ chờ huỷ → không có nút, bấm (form cũ) không mở phiên, câu nói rõ',
     tang.some(t => t.lo_id === L[4].id) && !PL.tangLocDuoc(tang, PL.choLocTheoLo(ton), new Map()).some(t => t.lo_id === L[4].id)
     && !r.ok && !r.id && /chờ huỷ/.test(r.cau) && (await phienCuaLo(L[4].id)).length === 0, r.cau);
});

// ===========================================================================
await nhom('10 · GIỜ VIỆT NAM QUANH MỐC Ủ XONG', async () => {
  const D = await ngay(3);          // tảng #0006 ủ xong ngày D
  const truoc = await ngay(2);
  try {
    datGio(`${truoc}T16:50:00Z`);
    await datGioDb(db, `${truoc}T23:50:00+07:00`);
    const [ton, tang] = await Promise.all([docTon(tk, cnA.id), docTangTon(tk, cnA.id)]);
    const t6 = tang.find(t => t.lo_id === L[6].id);
    const c = clientGia(tk);
    const kq = await loc(c, L[6]);
    ok('GIỜ VN: 23:50 ngày trước ngày ủ xong → tảng đang ủ, không có nút Lóc, bấm không mở phiên',
       t6?.tinh_trang_u === 'dang_u' && !PL.tangLocDuoc(tang, PL.choLocTheoLo(ton), new Map()).some(t => t.lo_id === L[6].id)
       && !kq.ok && !kq.id && /còn đang ủ/.test(kq.cau) && c.goi.length === 0 && (await phienCuaLo(L[6].id)).length === 0,
       `${t6?.tinh_trang_u} · ${kq.cau}`);

    datGio(`${truoc}T17:10:00Z`);
    await datGioDb(db, `${D}T00:10:00+07:00`);
    const [ton2, tang2] = await Promise.all([docTon(tk, cnA.id), docTangTon(tk, cnA.id)]);
    const t6b = tang2.find(t => t.lo_id === L[6].id);
    const ds = PL.tangLocDuoc(tang2, PL.choLocTheoLo(ton2), new Map());
    const kq2 = await loc(tk, L[6]);
    const ph = await phienCuaLo(L[6].id);
    P[6] = kq2.id;
    ok('GIỜ VN: 00:10 ngày ủ xong → sẵn sàng ("ủ xong hôm nay"), có nút; bấm mở phiên, ngày pha là ngày mới theo giờ Việt Nam',
       t6b?.tinh_trang_u === 'san_sang' && cauConU(t6b) === 'ủ xong hôm nay' && ds.some(t => t.lo_id === L[6].id)
       && kq2.ok && !!kq2.id && ph.length === 1 && ph[0].ngay_pha === D, `${t6b?.tinh_trang_u} · ${kq2.cau} · ${ph[0]?.ngay_pha}`);
  } finally {
    traGio();
    await traGioDb(db);
  }
});

// ===========================================================================
await nhom('11 · HẾT Ô MÃ: VẪN VÀO PHIÊN, CÂU ĐỎ', async () => {
  const giu = (await truyVan(`select count(*)::int as n from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
    where o.mat_hang_id = $1 and g.chi_nhanh_id = $2 and g.den_luc is null`, [MH['C-THANNGOAI'].id, cnA.id])).rows[0].n;
  const kq = await loc(clientCua(UID.qlA), L[8]);
  ok('Quản lý (pha_loc) bấm Lóc #0008 khi ba ô đang giữ → phiên vẫn mở, ok false, câu "chưa giao được ô mã" nêu đã dùng hết ô',
     giu === 3 && !kq.ok && !!kq.id && /chưa giao được ô mã/.test(kq.cau) && /đã dùng hết ô mã/.test(kq.cau)
     && (await phienCuaLo(L[8].id)).length === 1 && (await oCuaPhien(kq.id)).length === 0, `${giu} · ${kq.cau}`);
});

// ===========================================================================
await nhom('12 · PHIÊN NHÁP CỦA TỪNG LÔ (docLoCuaPhien trên database)', async () => {
  // Lúc này đang nháp: #0001 (P1), #0003 (P3), #0007, #0008, thăn lưng, thăn nội, #0006; #0002 có hai phiên đã huỷ.
  const nhap = await PL.docDanhSachPhienPha(tk, cnA.id, 'nhap');
  const m = await PL.docLoCuaPhien(tk, nhap);
  const soPhieu = async lo => (await phienCuaLo(lo.id)).find(p => p.trang_thai === 'nhap')?.so_phieu;
  const dangLoc = [L[1], L[3], L[6], L[7], L[8], L.lung, L.noi];
  ok('docLoCuaPhien: mỗi tảng đang nằm trong phiên nháp → đúng phiên đó và số phiếu (link "Đang lóc · PL…" ở Tảng · ủ)',
     m.get(L[1].id)?.id === P[1] && m.get(L[1].id)?.so_phieu === await soPhieu(L[1])
     && m.get(L[3].id)?.id === P[3] && m.get(L[3].id)?.so_phieu === await soPhieu(L[3])
     && m.get(L[7].id)?.id === P[7] && dangLoc.every(l => m.has(l.id)),
     JSON.stringify([...m.entries()].map(([lo, p]) => [Object.keys(L).find(k => L[k].id === lo), p.so_phieu])));
  ok('docLoCuaPhien: lô chỉ nằm trong phiên đã huỷ (#0002) hay chưa vào phiên nào (#0005) → không có',
     !m.has(L[2].id) && !m.has(L[5].id) && !m.has(L.khongSo.id) && m.size === dangLoc.length, String(m.size));
  const [ton, tang] = await Promise.all([docTon(tk, cnA.id), docTangTon(tk, cnA.id)]);
  const ds = PL.tangLocDuoc(tang, PL.choLocTheoLo(ton), m).map(x => x.so_tang).join();
  ok('Pha lóc mới: tảng đang lóc dở (#0001, #0003, #0007, #0008…) không có nút Lóc mới — chỉ còn #0002 (phiên cũ đã huỷ)',
     ds === '2', ds);
  const hong = clientGia(tk, { bang: ['kho_phien_pha_vao'] });
  const nem = await PL.docLoCuaPhien(hong, nhap).then(() => false, () => true);
  ok('docLoCuaPhien: đọc kho_phien_pha_vao hỏng → ném (trang không hiện nút nào, câu "chưa đọc được"), không gọi hàm ghi nào',
     nem && hong.goi.length === 0);
});

// ===========================================================================
await nhom('13 · SỔ KHO', async () => {
  const q = await PL.quetPhienPha(tk, P[1], maGui(), [nhan(10011, 1000), nhan(10011, 1100), nhan(10011, 900)].join('\n'));
  const pb = (await truyVan(`select phien_ban from kho_phien_pha where id = $1`, [P[1]])).rows[0].phien_ban;
  const c = await PL.chotPhien(tk, P[1], pb);
  const loRa = (await truyVan(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1 and mat_hang_id = $2`,
    [P[1], MH['C-THANNGOAI'].id])).rows[0]?.lo_id;
  const o = (await truyVan(`select g.lo_id from kho_o_ma_giao g where g.phien_pha_id = $1 and g.den_luc is null`, [P[1]])).rows[0];
  const { rows } = await truyVan(`select * from kho_doi_soat_ton()`);
  ok('SỔ KHO: phiên mở bằng Lóc, quét nhãn ô, chốt → ô gắn lô ra, kho_doi_soat_ton() rỗng',
     q.ok && q.soNhan === 3 && c.ok && !!loRa && o?.lo_id === loRa && rows.length === 0, `${q.cau} · ${c.cau} · ${JSON.stringify(rows)}`);
});

// ===========================================================================
await nhom('14 · TRANG (đọc mã nguồn)', async () => {
  const moi = doc('web/src/pages/noi-bo/kho/pha-loc/moi.astro');
  const tang = doc('web/src/pages/noi-bo/kho/tang/index.astro');
  ok('Pha lóc mới: mục Tảng lóc được dùng nb-nut phu pl-nut, mỗi nút một ma_gui và lo_id, viec=loc_tang',
     /tangLoc\.map\(x => \(\s*<form method="POST">\s*<input type="hidden" name="ma_gui" value=\{crypto\.randomUUID\(\)\} \/>\s*<input type="hidden" name="lo_id" value=\{x\.lo_id\} \/>\s*<button type="submit" name="viec" value="loc_tang" class="nb-nut phu pl-nut">/.test(moi)
     && /tangLocDuoc\(/.test(moi) && /id="tang-loc"/.test(moi));
  ok('Pha lóc mới: chữ trên nút ghép bằng {\' \'} — compressHTML không làm dính "Lóc#0142" hay "6,2kg"',
     /<b>\{ch\.loc\}\{' '\}\{soTangChu\(x\.so_tang\)\}<\/b>/.test(moi) && /\{dinhDangKg\(x\.kg_loc, nn\)\}\{' kg'\}/.test(moi));
  ok('Pha lóc mới: tảng đang lóc dở không có nút mới (đã có ở "Phiên đang dở"); đọc danh sách hỏng → không có nút, có câu "chưa đọc được"',
     /docLoCuaPhien\(k\.client, dangDo\)/.test(moi) && /loiTangLoc &&/.test(moi) && /class="nb-bao luu-y"/.test(moi));
  ok('Pha lóc mới: một chạm gọi locMotTang chỉ với ma_gui và lo_id (hàm tự đọc lại tảng, công thức, ô mã, phiên nháp — lỗi đọc thì không gọi hàm ghi nào)',
     /locMotTang\(k\.client, cn\.id, \{ maGui: String\(form\.get\('ma_gui'\) \?\? ''\), loId: String\(form\.get\('lo_id'\) \?\? ''\) \}\)/.test(moi));
  ok('Pha lóc mới: có id phiên (kể cả giao ô hỏng) → vào thẳng bước 2; ve chỉ nhận đúng "tang"',
     /if \(kq\.id\) return chuyenHuong\(Astro, `\/noi-bo\/kho\/pha-loc\/\$\{kq\.id\}`, kq\);/.test(moi)
     && /form\.get\('ve'\) === 'tang'\) return chuyenHuong\(Astro, '\/noi-bo\/kho\/tang', kq\)/.test(moi)
     && !/form\.get\('ve'\)\)/.test(moi));
  ok('Pha lóc mới: nút theo loại tảng giữ nguyên, gắn công thức bằng congThucMot',
     /congThucMot\(congThuc, mhId\)/.test(moi) && /value="tao" class="nb-nut phu pl-nut"/.test(moi));

  const bangTang = tang.slice(tang.indexOf('theoNhom.map'), tang.indexOf('</table>', tang.indexOf('theoNhom.map')));
  ok('Tảng · ủ: nút Lóc chỉ cho pha_loc, gửi /noi-bo/kho/pha-loc/moi với ve=tang, bảng vẫn 5 cột, không chữ gia_von / xem_gia',
     /k\.duoc\('pha_loc'\)/.test(tang) && /<form method="POST" action="\/noi-bo\/kho\/pha-loc\/moi"/.test(bangTang)
     && /name="ve" value="tang"/.test(bangTang) && /name="lo_id" value=\{x\.lo_id\}/.test(bangTang)
     && /name="ma_gui" value=\{crypto\.randomUUID\(\)\}/.test(bangTang) && /value="loc_tang" class="nb-nut phu"/.test(bangTang)
     && (bangTang.match(/<th\b/g) ?? []).length === 5 && !/gia_von|xem_gia/.test(tang));
  ok('Tảng · ủ: cùng luật tangLocDuoc với Pha lóc mới; tảng đang lóc dở → link tới phiên; đọc hỏng → không nút, câu "chưa đọc được"',
     /tangLocDuoc\(ds, cho, dangLoc\)/.test(tang) && /docChoLocTang\(/.test(tang) && /docLoCuaPhien\(/.test(tang)
     && /href=\{`\/noi-bo\/kho\/pha-loc\/\$\{/.test(bangTang) && /loiLoc &&/.test(tang));

  const hd = id => MUC_HUONG_DAN.find(m => m.id === id);
  const chu = (m, nn) => (m ? [...m.buoc, ...(m.meo ?? [])].map(x => x[nn]).join('\n') : '');
  const tt = hd('theo-tang'), pl = hd('pha-loc');
  ok('Hướng dẫn: theo-tang và pha-loc nhắc nút Lóc (vi và en), nút hiện sau khi phiếu nhận được duyệt; không chữ cấm',
     /\*\*Lóc\*\*/.test(chu(tt, 'vi')) && /\*\*Cut\*\*/.test(chu(tt, 'en')) && /phiếu nhận đã được duyệt/.test(chu(tt, 'vi'))
     && /receiving note is approved/.test(chu(tt, 'en'))
     && /\*\*Lóc #0142\*\*/.test(chu(pl, 'vi')) && /\*\*Cut #0142\*\*/.test(chu(pl, 'en')) && /\*\*Tảng lóc được\*\*/.test(chu(pl, 'vi'))
     && [tt, pl].every(m => ['vi', 'en'].every(nn => timChuoiCam(chu(m, nn)).length === 0)));
  ok('Hướng dẫn pha-loc vẫn giữ các cụm test-kho-giao-dien khớp (15–60 giây, **Gửi xuống cân**)',
     /15–60 giây/.test(chu(pl, 'vi')) && /\*\*Gửi xuống cân\*\*/.test(chu(pl, 'vi')));
});

process.exit(ketThuc('LÓC MỘT CHẠM'));
