/**
 * BEEFTOWN KHO — Trang mặt hàng: mục "Ai bán món này" (30/10/2026, issue #133)
 * ============================================================================
 *
 *     node test/test-kho-ai-ban-mon.mjs
 *
 * Issue #133 ("Việc tiếp: nhà cung cấp – món"), Khánh bảo làm 30/10/2026: trang mặt hàng có mục "Ai bán món này" — chỉ
 * đọc, có link tới trang sửa NCC. Dùng danh mục NCC – món có sẵn (0110, kho_ds_ncc_mat_hang lọc theo món); không
 * migration.
 *
 * Kiểm: thứ tự (NCC chính đầu, rồi giao gần nhất), NCC đã bỏ tay không nằm trong danh sách mà ghi riêng, dòng phụ
 * chuAiBan (vi / en, số kiểu Việt, không tiền), quyền đọc (quản lý được; NV quầy, chi nhánh khác, anon không), mã nguồn
 * trang (chỉ đọc, link #mon-ncc, đọc lỗi chỉ mất mục, đọc cùng lượt); kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { chuAiBan, docNccMon, nccCuaMon, nccDaBoCuaMon } from '../../web/src/lib/kho/ncc-mat-hang.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — TRANG MẶT HÀNG: "AI BÁN MÓN NÀY"');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const ngayNgan = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const MH = {};
const NCC = {};
let khoA;

async function nhapMua(ncc, ngay, dong) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null,
      p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), NCC[ncc], khoA, ngay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  for (const [sql, ts] of [[`select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]],
                           [`select kho_duyet_phieu_nhap($1)`, [p.phieu_id]]]) {
    const r = await duoi(UID.qlA, sql, ts);
    if (r.loi) throw new Error(r.loi);
  }
}
const sua = async (ncc, ma, viec) => {
  const r = await duoi(UID.qlA, `select kho_luu_ncc_mat_hang($1, $2, $3)`, [NCC[ncc], MH[ma].id, viec]);
  if (r.loi) throw new Error(r.loi);
};

// ===========================================================================
await nhom('0 · DỰNG DỮ LIỆU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  khoA = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnA.id])).rows[0].id;
  for (const ten of ['Đông Á', 'Bò Úc', 'Chợ Sáng']) {
    NCC[ten] = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ($1) returning id`, [ten])).rows[0].id;
  }
  const nacVai = kg => [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: kg * 2, so_kg: kg, don_gia_kg: 400000, han_dung: homNay }];
  // Đông Á giao nạc vai hai lần (2 kg hai hôm trước, 3 kg hôm nay); Chợ Sáng giao một lần rồi bị bỏ tay;
  // Bò Úc chưa giao, thêm tay và đặt làm NCC chính.
  await nhapMua('Đông Á', await ngaySau(-2), nacVai(2));
  await nhapMua('Đông Á', homNay, nacVai(3));
  await nhapMua('Chợ Sáng', await ngaySau(-1), nacVai(1));
  await sua('Chợ Sáng', 'C-NACVAI', 'bo');
  await sua('Bò Úc', 'C-NACVAI', 'them');
  await sua('Bò Úc', 'C-NACVAI', 'chinh');
  ok('Nạc vai: Đông Á giao 2 lần, Chợ Sáng giao rồi bị bỏ, Bò Úc thêm tay làm NCC chính', !!NCC['Bò Úc']);
});

// ===========================================================================
await nhom('1 · DANH SÁCH VÀ DÒNG PHỤ', async () => {
  const ds = await docNccMon(clientCua(UID.qlA), cnA.id, { mon: MH['C-NACVAI'].id });
  const ban = nccCuaMon(ds, MH['C-NACVAI'].id);
  const ten = id => Object.keys(NCC).find(k => NCC[k] === id);
  ok('Ai bán: Bò Úc (NCC chính) đầu, rồi Đông Á; Chợ Sáng (đã bỏ) không có',
    ban.map(c => ten(c.nha_cung_cap_id)).join() === 'Bò Úc,Đông Á', ban.map(c => ten(c.nha_cung_cap_id)).join());
  ok('Đã bỏ ghi riêng: Chợ Sáng', nccDaBoCuaMon(ds, MH['C-NACVAI'].id).map(c => ten(c.nha_cung_cap_id)).join() === 'Chợ Sáng');
  const mon = MH['C-NACVAI'];
  const dongA = ban.find(c => c.nha_cung_cap_id === NCC['Đông Á']);
  ok('Đông Á: "Lần trước 3 kg · <hôm nay> · giao 2 lần" (phiếu gần nhất, số kiểu Việt, không tiền)',
    chuAiBan(dongA, mon) === `Lần trước 3 kg · ${ngayNgan(homNay)} · giao 2 lần`, chuAiBan(dongA, mon));
  ok('Bò Úc: "NCC chính · thêm tay, chưa giao"', chuAiBan(ban[0], mon) === 'NCC chính · thêm tay, chưa giao', chuAiBan(ban[0], mon));
  ok('Tiếng Anh: "Main supplier · added by hand, not delivered yet" / "Last time 3 kg · … · 2 deliveries"',
    chuAiBan(ban[0], mon, 'en') === 'Main supplier · added by hand, not delivered yet'
      && chuAiBan(dongA, mon, 'en') === `Last time 3 kg · ${ngayNgan(homNay)} · 2 deliveries`, chuAiBan(dongA, mon, 'en'));
  const gia = { ...dongA, kg_lan_cuoi: null, goi_lan_cuoi: null, so_lan: 1, la_chinh: false, lan_cuoi: '2026-10-25' };
  ok('Đã giao mà phiếu gần nhất không có số → "giao 25/10"; giao một lần thì không ghi số lần',
    chuAiBan(gia, mon) === 'giao 25/10', chuAiBan(gia, mon));
  ok('Món chưa chọn → không ai bán, không đã bỏ', nccCuaMon(ds, '').length === 0 && nccDaBoCuaMon(ds, null).length === 0);
});

// ===========================================================================
await nhom('2 · QUYỀN ĐỌC', async () => {
  const doc = async uid => { try { return await docNccMon(clientCua(uid), cnA.id, { mon: MH['C-NACVAI'].id }); } catch { return null; } };
  ok('Quản lý A đọc được (trang mặt hàng chỉ chủ, quản lý — vai danh_muc)', Array.isArray(await doc(UID.qlA)));
  ok('NV quầy KHÔNG đọc được', (await doc(UID.nvQuayA)) === null);
  ok('Quản lý chi nhánh B KHÔNG đọc được chi nhánh A', (await doc(UID.qlB)) === null);
  ok('anon KHÔNG đọc được', (await doc('anon')) === null);
  ok('Nhân sự đã nghỉ KHÔNG đọc được', (await doc(UID.nghiViec)) === null);
  const cot = Object.keys((await doc(UID.qlA))?.[0] ?? {});
  ok('Không cột tiền', cot.length > 0 && !cot.some(c => /(^|_)(gia|tien)(_|$)/.test(c)), cot.join());
});

// ===========================================================================
await nhom('3 · MÃ NGUỒN TRANG MẶT HÀNG', async () => {
  const mh = doc('web/src/pages/noi-bo/kho/cai-dat/mat-hang.astro');
  ok('Trang vẫn chỉ cho vai danh_muc', /if \(!k\.duoc\('danh_muc'\)\) return Astro\.redirect/.test(mh));
  ok('Đọc theo món (database lọc), lỗi thì null — chỉ mất mục này',
    /docNccMon\(k\.client, k\.chiNhanh\.id, \{ mon: monId \}\)/.test(mh) && /\.catch\(\(\) => null\)/.test(mh)
      && /\{t\.khongDocAiBan\}/.test(mh));
  ok('Đọc cùng lượt với danh mục khi ?sua= là một món; món đang sửa khác thì đọc lại',
    /const huaAiBan = laUuid\(suaId\) \? docAiBan\(suaId\)/.test(mh) && /dangSua\.id === suaId \? await huaAiBan : await docAiBan\(dangSua\.id\)/.test(mh));
  const muc = mh.slice(mh.indexOf('<section class="nb-the" id="ai-ban">'), mh.indexOf('</section>', mh.indexOf('id="ai-ban"')));
  ok('Mục "Ai bán món này" chỉ đọc (không form, không nút); tên NCC dẫn tới trang sửa NCC #mon-ncc',
    muc.length > 0 && !/<form|<button/.test(muc) && /nha-cung-cap\?sua=\$\{c\.nha_cung_cap_id\}#mon-ncc/.test(muc));
});

const dsTon = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', dsTon.length === 0, JSON.stringify(dsTon));

process.exit(ketThuc('AI BÁN MÓN NÀY'));
