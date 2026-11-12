/**
 * BEEFTOWN — CHỌN THEO GU (0116): GU CỦA PHẦN THỊT, KHỐI Ở TRANG THỰC ĐƠN
 * =======================================================================
 *
 *     node test/test-ban-le-gu.mjs
 *
 * Đợt 2 của đề xuất giao diện (Khánh duyệt 12/11/2026). Chủ, quản lý gắn gu cho phần thịt của menu bán lẻ ở
 * /noi-bo/ban-le/<id> (ban_le_luu_gu); trang Thực đơn đọc bo_tai_quay_theo_gu (anon) và dựng khối "Chọn theo gu".
 *
 * Bất biến:
 *   1. Quyền: chỉ chủ và quản lý ĐANG LÀM gắn được gu (cả hai chi nhánh — menu bán lẻ là của cả thương hiệu); thu
 *      ngân, marketing, thủ kho, nhân viên quầy, kế toán, quản lý đã nghỉ, tài khoản không có dòng nhan_su, anon
 *      đều bị từ chối và gu không đổi. Anon đọc được bo_tai_quay_theo_gu.
 *   2. Dữ liệu: khóa lạ, null, gu cho kim chi bị từ chối cả lượt (không ghi nửa vời); thứ tự cố định, bỏ trùng —
 *      gửi hai lần cùng lựa chọn là cùng một kết quả; mảng rỗng là gỡ khỏi khối. Ràng buộc bảng chặn cả ghi thẳng.
 *   3. Hàm công khai: chỉ phần thịt đã gắn gu, tên còn chữ tạm thì không, không cột giá / gói / tồn; bản dịch en /
 *      ko chỉ khi còn khớp câu tiếng Việt; theo thu_tu.
 *   4. Web công khai (lib/chon-theo-gu.ts): lớp chặn thứ hai; không bao giờ ném lỗi — lỗi, ném, hết giờ, chưa nối
 *      database đều ra danh sách rỗng (khối ẩn).
 *   5. Web nội bộ (lib/ban-le-noi-bo.ts): "Đã lưu gu" chỉ khi database trả mảng đã ghi; khóa lạ không gửi; mất mạng,
 *      lỗi quyền → câu lỗi đúng thứ tiếng.
 *   6. Mã nguồn: khối đứng trước thẻ nhãn khay trong tab Bò tại quầy; ba trang Thực đơn đọc đúng thứ tiếng; lọc bằng
 *      CSS có đúng một quy tắc cho mỗi gu; tên gu đủ ba thứ tiếng, không chữ cấm.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, maGui, taoClientPg, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(WEB, 'lib', f)).href);
const doc = (...p) => readFileSync(join(WEB, ...p), 'utf8');
const { GU, TEN_GU, locPhanCat, guCoMat, docBoTheoGu } = await nap('chon-theo-gu.ts');
const { luuGu, docSanPham } = await nap('ban-le-noi-bo.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — CHỌN THEO GU (0116): GU CỦA PHẦN THỊT, KHỐI Ở TRANG THỰC ĐƠN');
const { db, cnA, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const UID_QL_NGHI = '00000000-0000-4000-8000-0000000000ad';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1, $2, 'Quản lý đã nghỉ', 'quan_ly', false)`, [UID_QL_NGHI, cnA.id]);

const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
async function tao(ma, ten, loai = 'thit', cach = 'theo_can') {
  const r = await goi(UID.chu, `select ban_le_tao_san_pham($1, $2, $3, $4, $5) as r`, [maGui(), ma, ten, loai, cach]);
  if (r.loi || !r.kq?.id) throw new Error(`không tạo được ${ma}: ${r.loi ?? JSON.stringify(r.kq)}`);
  return r.kq.id;
}
const luu = (uid, id, gu) => goi(uid, `select ban_le_luu_gu($1, $2::text[]) as r`, [id, gu]);
const guCua = async id => (await db.query(`select gu from ban_le_san_pham where id = $1`, [id])).rows[0]?.gu;
const congKhai = async (nn = 'vi', uid = 'anon') => (await goi(uid, `select * from bo_tai_quay_theo_gu($1)`, [nn])).rows ?? [];

const ribeye = await tao('ribeye', 'Ribeye');
const skirt = await tao('outside-skirt', 'Outside Skirt');
const topBlade = await tao('top-blade', 'Top Blade');
const kimChi = await tao('kim-chi-cai-thao', 'Kim chi cải thảo', 'kim_chi', 'theo_hop');
const tam = await tao('phan-tam', '[Tên tạm] Phần mới');

// ===========================================================================
await nhom('1 · QUYỀN: CHỈ CHỦ VÀ QUẢN LÝ ĐANG LÀM GẮN ĐƯỢC GU; ANON ĐỌC KHỐI', async () => {
  const chu = await luu(UID.chu, ribeye, ['mem_beo']);
  ok('Chủ gắn gu được, nhận lại gu đã ghi', !chu.loi && JSON.stringify(chu.kq) === '["mem_beo"]', chu.loi ?? JSON.stringify(chu.kq));
  const qlA = await luu(UID.qlA, skirt, ['dam_vi']);
  ok('Quản lý Q1 gắn gu được', !qlA.loi && JSON.stringify(qlA.kq) === '["dam_vi"]', qlA.loi ?? '');
  const qlB = await luu(UID.qlB, topBlade, ['nac_thanh']);
  ok('Quản lý chi nhánh khác cũng gắn được — menu bán lẻ là của cả thương hiệu', !qlB.loi && JSON.stringify(qlB.kq) === '["nac_thanh"]', qlB.loi ?? '');

  for (const [ten, uid] of [['Thu ngân', UID.thuNganA], ['Marketing', UID.mktA], ['Thủ kho', UID.thuKhoA], ['Nhân viên quầy', UID.nvQuayA],
    ['Kế toán', UID.keToanA], ['Quản lý đã nghỉ', UID_QL_NGHI], ['Tài khoản không có dòng nhan_su', UID_LA], ['Nhân sự đã nghỉ (khung)', UID.nghiViec]]) {
    const r = await luu(uid, ribeye, ['lat_mong']);
    ok(`${ten}: bị từ chối, gu không đổi`, !!r.loi && /Chỉ chủ hoặc quản lý được sửa gu của phần thịt\./.test(r.loi)
       && JSON.stringify(await guCua(ribeye)) === '["mem_beo"]', r.loi ?? 'không lỗi');
  }
  const anon = await luu('anon', ribeye, ['lat_mong']);
  ok('Anon: không có quyền gọi ban_le_luu_gu, gu không đổi', !!anon.loi && /permission denied/i.test(anon.loi)
     && JSON.stringify(await guCua(ribeye)) === '["mem_beo"]', anon.loi ?? 'không lỗi');
  const ghiThang = await duoi(UID.qlA, `update ban_le_san_pham set gu = '{lat_mong}' where id = $1`, [ribeye]);
  ok('Quản lý không ghi thẳng cột gu được (chỉ qua ban_le_luu_gu)', !!ghiThang.loi && JSON.stringify(await guCua(ribeye)) === '["mem_beo"]', ghiThang.loi ?? 'ghi được');
  const doc = await congKhai('vi');
  ok('Anon đọc được bo_tai_quay_theo_gu', doc.length >= 1, JSON.stringify(doc).slice(0, 200));
});

// ===========================================================================
await nhom('2 · DỮ LIỆU: TỪ CHỐI CẢ LƯỢT KHI SAI, THỨ TỰ CỐ ĐỊNH, BỎ TRÙNG, GỬI HAI LẦN NHƯ MỘT', async () => {
  const la = await luu(UID.chu, ribeye, ['mem_beo', 'cay']);
  ok('Khóa lạ ("cay") → "Gu không hợp lệ.", không ghi nửa vời', /Gu không hợp lệ\./.test(la.loi ?? '') && JSON.stringify(await guCua(ribeye)) === '["mem_beo"]', la.loi ?? '');
  const rong = await goi(UID.chu, `select ban_le_luu_gu($1, null) as r`, [ribeye]);
  ok('null → "Gu không hợp lệ."', /Gu không hợp lệ\./.test(rong.loi ?? ''), rong.loi ?? '');
  const phanTuNull = await goi(UID.chu, `select ban_le_luu_gu($1, array['mem_beo', null]) as r`, [ribeye]);
  ok('Mảng có phần tử null → "Gu không hợp lệ."', /Gu không hợp lệ\./.test(phanTuNull.loi ?? ''), phanTuNull.loi ?? '');
  const kc = await luu(UID.chu, kimChi, ['mem_beo']);
  ok('Kim chi → "Chỉ phần thịt mới có gu."', /Chỉ phần thịt mới có gu\./.test(kc.loi ?? '') && JSON.stringify(await guCua(kimChi)) === '[]', kc.loi ?? '');
  const kcRong = await luu(UID.chu, kimChi, []);
  ok('Kim chi gửi mảng rỗng: không lỗi (không có gì để gỡ)', !kcRong.loi && JSON.stringify(kcRong.kq) === '[]', kcRong.loi ?? '');
  const khongCo = await luu(UID.chu, '00000000-0000-4000-8000-00000000abcd', ['mem_beo']);
  ok('Sản phẩm không có → "Không thấy sản phẩm này."', /Không thấy sản phẩm này\./.test(khongCo.loi ?? ''), khongCo.loi ?? '');

  const sap = await luu(UID.chu, skirt, ['lat_mong', 'dam_vi', 'dam_vi', 'mem_beo']);
  ok('Thứ tự cố định mem_beo, dam_vi, nac_thanh, lat_mong; bỏ trùng', JSON.stringify(sap.kq) === '["mem_beo","dam_vi","lat_mong"]', JSON.stringify(sap.kq));
  const lan2 = await luu(UID.chu, skirt, ['mem_beo', 'lat_mong', 'dam_vi']);
  ok('Gửi lại cùng lựa chọn (bấm hai lần) → cùng kết quả, không lỗi', !lan2.loi && JSON.stringify(lan2.kq) === JSON.stringify(sap.kq)
     && JSON.stringify(await guCua(skirt)) === '["mem_beo","dam_vi","lat_mong"]');
  await luu(UID.chu, skirt, ['dam_vi']);

  const ghiKimChi = await db.query(`update ban_le_san_pham set gu = '{mem_beo}' where id = $1`, [kimChi]).then(() => null, e => e.message);
  ok('Ràng buộc bảng: ghi thẳng gu cho kim chi bị chặn', /ban_le_san_pham_gu_hop_le/.test(ghiKimChi ?? ''), ghiKimChi ?? 'ghi được');
  const ghiLa = await db.query(`update ban_le_san_pham set gu = '{ngon}' where id = $1`, [ribeye]).then(() => null, e => e.message);
  ok('Ràng buộc bảng: ghi thẳng khóa lạ bị chặn', /ban_le_san_pham_gu_hop_le/.test(ghiLa ?? ''), ghiLa ?? 'ghi được');
});

// ===========================================================================
await nhom('3 · HÀM CÔNG KHAI: CHỈ PHẦN THỊT ĐÃ GẮN GU, KHÔNG GIÁ, BẢN DỊCH CÒN HIỆU LỰC', async () => {
  await luu(UID.chu, tam, ['mem_beo']);
  const dong = await congKhai('vi');
  const ma = dong.map(d => d.san_pham_ma);
  ok('Chỉ phần thịt đã gắn gu: ribeye, outside-skirt, top-blade', JSON.stringify([...ma].sort()) === '["outside-skirt","ribeye","top-blade"]', ma.join(', '));
  ok('Tên còn chữ tạm ("[Tên tạm] …") thì không có, dù đã gắn gu', !ma.includes('phan-tam'));
  ok('Đúng sáu cột: san_pham_ma, ten, ten_vi, mo_ta, cach_dung, gu — không giá, không gói, không tồn',
     JSON.stringify(Object.keys(dong[0] ?? {}).sort()) === JSON.stringify(['cach_dung', 'gu', 'mo_ta', 'san_pham_ma', 'ten', 'ten_vi']), Object.keys(dong[0] ?? {}).join(', '));

  await luu(UID.chu, topBlade, []);
  ok('Gỡ hết gu → phần thịt ra khỏi khối', !(await congKhai('vi')).some(d => d.san_pham_ma === 'top-blade'));
  await luu(UID.chu, topBlade, ['nac_thanh']);

  // Thứ tự theo thu_tu rồi tên.
  await db.query(`update ban_le_san_pham set thu_tu = 1 where id = $1`, [topBlade]);
  await db.query(`update ban_le_san_pham set thu_tu = 2 where id = $1`, [ribeye]);
  await db.query(`update ban_le_san_pham set thu_tu = 3 where id = $1`, [skirt]);
  ok('Theo thu_tu', JSON.stringify((await congKhai('vi')).map(d => d.san_pham_ma)) === '["top-blade","ribeye","outside-skirt"]');

  // Bản dịch: mô tả tiếng Việt + bản tiếng Anh khớp băm → tiếng Anh; sửa câu tiếng Việt sau đó → bản dịch cũ hết hiệu lực.
  await db.query(`update ban_le_san_pham set mo_ta_vi = 'Thớ mềm, mỡ xen giữa thớ.' where id = $1`, [ribeye]);
  await db.query(`update ban_le_san_pham set mo_ta_en = 'Tender grain with fat running through it.',
                  ban_dich = jsonb_set(ban_dich, '{mo_ta,en}', jsonb_build_object('bam', bam_nguon('Thớ mềm, mỡ xen giữa thớ.'), 'cach', 'may', 'tt', 'ok'), true)
                  where id = $1`, [ribeye]);
  const en = (await congKhai('en')).find(d => d.san_pham_ma === 'ribeye');
  ok('[en] Bản dịch khớp câu tiếng Việt → mô tả tiếng Anh', en?.mo_ta === 'Tender grain with fat running through it.', en?.mo_ta);
  await db.query(`update ban_le_san_pham set mo_ta_vi = 'Thớ mềm, nhiều mỡ xen giữa thớ.' where id = $1`, [ribeye]);
  const enCu = (await congKhai('en')).find(d => d.san_pham_ma === 'ribeye');
  ok('[en] Câu tiếng Việt đổi sau khi dịch → không hiện bản dịch cũ (về câu tiếng Việt)', enCu?.mo_ta === 'Thớ mềm, nhiều mỡ xen giữa thớ.', enCu?.mo_ta);
  ok('ten_vi luôn là tên tiếng Việt (trang en / ko in để khách nói với quầy)', enCu?.ten_vi === 'Ribeye');
});

// ===========================================================================
await nhom('4 · WEB CÔNG KHAI: LỚP CHẶN THỨ HAI, KHÔNG BAO GIỜ NÉM LỖI', async () => {
  const day = await docBoTheoGu('vi', clientCua('anon'));
  ok('docBoTheoGu (anon, database thật): ba phần cắt, đúng gu', day.length === 3 && day.find(p => p.ma === 'outside-skirt')?.gu.join() === 'dam_vi', JSON.stringify(day));
  ok('guCoMat: chỉ gu có phần cắt, theo thứ tự cố định', JSON.stringify(guCoMat(day)) === '["mem_beo","dam_vi","nac_thanh"]', JSON.stringify(guCoMat(day)));

  const loc = locPhanCat([
    { san_pham_ma: 'tot', ten: ' Ribeye  ', ten_vi: 'Ribeye', mo_ta: 'Mềm.', gu: ['mem_beo', 'la'] },
    { san_pham_ma: 'Hoa-Hoa', ten: 'X', ten_vi: 'X', gu: ['mem_beo'] },
    { san_pham_ma: 'ngoac', ten: '[tạm]', ten_vi: 'Y', gu: ['mem_beo'] },
    { san_pham_ma: 'cam', ten: 'Bò Wagyu A5', ten_vi: 'Bò Wagyu A5', gu: ['mem_beo'] },
    { san_pham_ma: 'khong-gu', ten: 'Z', ten_vi: 'Z', gu: ['la'] },
    { san_pham_ma: 'mo-ta-cam', ten: 'W', ten_vi: 'W', mo_ta: 'Bò Wagyu A5 cao cấp', gu: ['lat_mong'] },
    { san_pham_ma: 'tot', ten: 'Trùng', ten_vi: 'Trùng', gu: ['dam_vi'] },
    null, 'chuoi', [1],
  ]);
  ok('locPhanCat: giữ "tot" (tên gọn một dòng, bỏ gu lạ), bỏ mã sai, tên tạm, tên dính chữ cấm, không gu, dòng trùng, rác',
     JSON.stringify(loc.map(p => [p.ma, p.ten, p.gu.join()])) === JSON.stringify([['tot', 'Ribeye', 'mem_beo'], ['mo-ta-cam', 'W', 'lat_mong']]),
     JSON.stringify(loc));
  ok('locPhanCat: mô tả dính chữ cấm → không hiện mô tả, vẫn giữ phần cắt', loc.find(p => p.ma === 'mo-ta-cam')?.moTa === null);
  ok('locPhanCat: không phải danh sách → []', locPhanCat(null).length === 0 && locPhanCat({}).length === 0);

  const log = []; const goc = console.error; console.error = (...a) => log.push(a.join(' '));
  try {
    ok('Chưa nối database (client null) → [], không log', (await docBoTheoGu('vi', null)).length === 0 && log.length === 0);
    const loi = await docBoTheoGu('vi', { rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } }) });
    ok('Database báo lỗi (hàm chưa có — web deploy trước migration) → [], đúng một dòng log [chon-theo-gu]', loi.length === 0 && log.length === 1 && /\[chon-theo-gu\]/.test(log[0]), log.join(' | '));
    const nem = await docBoTheoGu('vi', { rpc: () => { throw new Error('fetch failed'); } });
    ok('Mất mạng (rpc ném) → []', nem.length === 0 && log.length === 2);
    const cham = await docBoTheoGu('vi', { rpc: () => new Promise(() => {}) }, 30);
    ok('Hết giờ → [] và log "hết giờ"', cham.length === 0 && /hết giờ/.test(log[2] ?? ''), log.join(' | '));
    const la = await docBoTheoGu('vi', { rpc: async () => ({ data: { x: 1 }, error: null }) });
    ok('Trả thứ không phải danh sách → []', la.length === 0 && log.length === 4);
  } finally { console.error = goc; }
});

// ===========================================================================
await nhom('5 · WEB NỘI BỘ: CÂU BÁO ĐÚNG SỰ THẬT, ĐỦ VI / EN', async () => {
  // Mỗi gu một ô chọn gu_<khóa> = co / khong, như form của trang.
  const form = (...gu) => { const f = new FormData(); for (const g of GU) f.append(`gu_${g}`, gu.includes(g) ? 'co' : 'khong'); return f; };
  const qlA = clientCua(UID.qlA);
  const daLuu = await luuGu(qlA, ribeye, form('lat_mong', 'mem_beo'), 'vi');
  ok('Quản lý lưu gu → "Đã lưu gu…", database có đúng gu', daLuu.ok && /^Đã lưu gu\./.test(daLuu.cau) && JSON.stringify(await guCua(ribeye)) === '["mem_beo","lat_mong"]', daLuu.cau);
  ok('docSanPham trả gu (trang dựng ô chọn từ đây)', JSON.stringify((await docSanPham(qlA, ribeye, null))?.gu) === '["mem_beo","lat_mong"]');
  const goHet = await luuGu(qlA, topBlade, form(), 'en');
  ok('[en] Bỏ hết gu → câu "All taste tags removed…"', goHet.ok && /^All taste tags removed/.test(goHet.cau), goHet.cau);
  await luuGu(qlA, topBlade, form('nac_thanh'), 'vi');
  let goiRpc = 0;
  const demRpc = { rpc: async () => { goiRpc++; return { data: [], error: null }; } };
  const la = form('mem_beo'); la.set('gu_dam_vi', 'ngon');
  const kqLa = await luuGu(demRpc, ribeye, la, 'vi');
  ok('Giá trị lạ ("ngon") → câu "Gu không hợp lệ — tải lại trang.", không gọi database', !kqLa.ok && /Gu không hợp lệ/.test(kqLa.cau) && goiRpc === 0, kqLa.cau);
  const thieu = form('mem_beo'); thieu.delete('gu_lat_mong');
  const kqThieu = await luuGu(demRpc, ribeye, thieu, 'vi');
  ok('Form thiếu một ô gu → từ chối, không gọi database (không coi là "không")', !kqThieu.ok && goiRpc === 0, kqThieu.cau);
  const thuNgan = await luuGu(clientCua(UID.thuNganA), ribeye, form('dam_vi'), 'en');
  ok('[en] Thu ngân → câu lỗi tiếng Anh của database, không "saved"', !thuNgan.ok && /Only the owner or a manager can change the taste tags/.test(thuNgan.cau), thuNgan.cau);
  const matMang = await luuGu({ rpc: () => { throw new TypeError('fetch failed'); } }, ribeye, form('dam_vi'), 'vi');
  ok('Mất mạng → không bao giờ "Đã lưu"', !matMang.ok && !/Đã lưu/.test(matMang.cau), matMang.cau);
  const traLa = await luuGu({ rpc: async () => ({ data: null, error: null }) }, ribeye, form('dam_vi'), 'vi');
  ok('Database không trả mảng → "Không lưu được gu."', !traLa.ok && traLa.cau === 'Không lưu được gu.', traLa.cau);
  ok('Gu không đổi sau các lượt hỏng', JSON.stringify(await guCua(ribeye)) === '["mem_beo","lat_mong"]');
});

// ===========================================================================
await nhom('6 · MÃ NGUỒN VÀ CÂU CHỮ', async () => {
  const td = doc('components', 'TrangThucDon.astro');
  ok('TrangThucDon: khối Chọn theo gu đứng trong tab Bò tại quầy, trước thẻ nhãn khay',
     td.indexOf('<ChonTheoGu ngonNgu={ngonNgu} phanCat={theoGu} />') > td.indexOf('id="bo-tai-quay"')
       && td.indexOf('<ChonTheoGu ') < td.indexOf('<NhanKhay ngonNgu={ngonNgu} />') && td.indexOf('<ChonTheoGu ') < td.indexOf('id="mon-an"'));
  for (const [tep, nn] of [['thuc-don.astro', 'vi'], ['en/menu.astro', 'en'], ['ko/menu.astro', 'ko']]) {
    const s = doc('pages', ...tep.split('/'));
    ok(`pages/${tep}: đọc gu đúng thứ tiếng (docBoTheoGu('${nn}')) song song, truyền theoGu`,
       s.includes(`docBoTheoGu('${nn}')`) && s.includes('theoGu={theoGu}') && /Promise\.all\(\[/.test(s));
  }
  const cg = doc('components', 'ChonTheoGu.astro');
  ok('ChonTheoGu: một quy tắc lọc CSS cho mỗi gu của GU', GU.every(g => cg.includes(`.cg:has(#cg-${g}:checked) .cg-the:not([data-gu~='${g}'])`)));
  ok('ChonTheoGu: radio thật có nhãn (label for), nhóm có legend; "Tất cả" chọn sẵn',
     cg.includes('<legend class="an-chu">') && cg.includes('<input type="radio" name="cg-gu" id="cg-tat-ca" value="tat-ca" checked />')
       && cg.includes('<label for={`cg-${g}`}>'));
  ok('ChonTheoGu: không giá — chỉ câu "Giá mỗi 100g ghi trên nhãn khay tại quầy"', !/dinhDangTien|\bgia\b/.test(cg.replace(/giaNhan|cg-gia/g, '')));
  for (const g of GU) {
    const ten = TEN_GU[g];
    ok(`Tên gu "${g}" đủ ba thứ tiếng, không chữ cấm`, ['vi', 'en', 'ko'].every(nn => ten[nn]?.trim()) && ['vi', 'en', 'ko'].every(nn => timChuoiCam(ten[nn]).length === 0));
  }
  const trang = doc('pages', 'noi-bo', 'ban-le', '[id].astro');
  ok('Trang /noi-bo/ban-le/<id>: form gu chỉ cho phần thịt, khóa (disabled) với vai chỉ xem, việc "gu" gọi luuGu',
     trang.includes("{sp.loai === 'thit' && (") && trang.includes('<fieldset disabled={!duocSua} class="bl-gu">')
       && trang.includes(": viec === 'gu'   ? await luuGu(client, id, form, nn)"));
  ok('Trang /noi-bo/ban-le/<id>: mỗi gu một ô chọn gu_<khóa> Có / Không, chọn sẵn theo sp.gu',
     trang.includes('<select name={`gu_${g}`}>') && trang.includes('<option value="co" selected={(sp.gu ?? []).includes(g)}>')
       && trang.includes('<option value="khong" selected={!(sp.gu ?? []).includes(g)}>'));
});

process.exit(ketThuc('CHỌN THEO GU (0116)'));
