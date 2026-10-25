/**
 * BEEFTOWN CRM — Kiểm thử: chữ mới của mẫu ZBS-03 "Cảm ơn & xin đánh giá" (0095)
 * ===========================================================================
 *
 *     node test/test-zalo-mau-cam-on.mjs
 *
 * Khánh chọn bản B ngày 25/10/2026 (GPT viết qua cầu nối Claude ↔ Codex, Claude soát luật chữ). Chữ trên
 * trang ZBS phải khớp ĐÚNG chữ trong database — màn Cài đặt Zalo dặn chép nguyên văn — nên ở đây giữ bản
 * chép tay CHU_MOI và so từng ký tự.
 *
 * Kiểm:
 *   1 · Sau mọi migration, ZBS-03 đúng chữ mới, đúng 2 tham số, kết thúc bằng câu NGUNG; khách không có tên
 *       (zalo_du_lieu_goc điền "Quý khách") đọc thành câu tự nhiên, không ra "anh/chị Quý khách"; sạch chữ cấm.
 *   2 · Migration chỉ sửa mẫu CHƯA duyệt: mẫu đã duyệt (khớp bản đã nộp Zalo) giữ nguyên; chạy lại không
 *       đổi gì thêm; không chạm ZBS-01, 02, 04.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabaseTrong, taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { timChuoiCam } = await import(pathToFileURL(join(GOC, 'web', 'src', 'lib', 'chuoi-cam.js')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — CHỮ MỚI CỦA MẪU ZBS-03 (0095)');
const { db, vanBan } = await dungDatabaseTrong();

// Tiêu đề và 4 đoạn — đúng 5 ô của mẫu tuỳ chỉnh trên ZBS (dòng trống trước câu NGUNG chỉ để đọc dễ).
const CHU_MOI = [
  'Cảm ơn anh/chị đã dùng bữa tại Beeftown',
  'Beeftown cảm ơn <customer_name> đã dùng bữa tại quán hôm nay.',
  'Mời anh/chị chia sẻ cảm nhận về bữa ăn trên Google. Góp ý của anh/chị giúp Beeftown hiểu rõ hơn trải nghiệm tại quán.',
  'Gửi nhận xét tại: <google_review_link>',
  '',
  'Để ngừng nhận tin, anh/chị vui lòng nhắn NGUNG cho Beeftown.',
].join('\n');

// Chữ 0047 đặt — nhóm 2 dùng làm "bản đã nộp Zalo" của một mẫu đã duyệt.
const CHU_CU = 'BEEFTOWN — CẢM ƠN ANH/CHỊ\nCảm ơn anh/chị <customer_name> đã ghé Beeftown hôm nay.\n'
  + 'Nếu bữa ăn vừa ý, anh/chị dành 30 giây đánh giá giúp tụi em nhé — mỗi góp ý đều được đọc và ghi nhận.\n'
  + 'Đánh giá tại: <google_review_link>\n\nKhông muốn nhận tin nữa, anh/chị nhắn "NGUNG" cho Beeftown.';

// Tìm theo đuôi tên, không theo số: số migration có thể phải đánh lại khi nhánh khác gộp trước.
const tenFile = [...vanBan.keys()].find(f => f.endsWith('_zalo_zbs03_chu_moi.sql'));
const sqlMigration = tenFile ? vanBan.get(tenFile) : null;

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const mau03 = () => mot(`select noi_dung, tham_so, da_duyet, ma_zalo from mau_tin where ma = 'ZBS-03'`);

// ===========================================================================
await nhom('1 · ZBS-03 SAU MỌI MIGRATION — chữ bản B, tham số, câu NGUNG, khách không có tên', async () => {
  ok('Có migration *_zalo_zbs03_chu_moi.sql', !!sqlMigration, [...vanBan.keys()].slice(-3).join(', '));

  const m = await mau03();
  ok('ZBS-03 đúng từng ký tự bản B Khánh chọn', m.noi_dung === CHU_MOI, JSON.stringify(m.noi_dung));
  ok('Đúng 2 tham số theo thứ tự: customer_name, google_review_link',
     JSON.stringify(m.tham_so) === JSON.stringify(['customer_name', 'google_review_link']), JSON.stringify(m.tham_so));
  ok('Kết thúc bằng câu hủy nhận NGUNG', /nhắn NGUNG cho Beeftown\.$/.test(m.noi_dung));
  ok('Vẫn chưa duyệt, chưa có mã mẫu Zalo (chủ nhập sau khi Zalo duyệt)', m.da_duyet === false && m.ma_zalo === null,
     JSON.stringify({ da_duyet: m.da_duyet, ma_zalo: m.ma_zalo }));

  const dong = m.noi_dung.split('\n').filter(Boolean);
  ok('5 dòng có chữ = tiêu đề + 4 đoạn của mẫu tuỳ chỉnh ZBS', dong.length === 5, String(dong.length));
  ok('Tiêu đề không chứa tham số', !/<[a-z_]+>/.test(dong[0]), dong[0]);

  const { ten } = await mot(`select zalo_du_lieu_goc(gen_random_uuid(), null)->>'customer_name' as ten`);
  ok('Khách không có tên → customer_name là "Quý khách" (0047)', ten === 'Quý khách', ten);
  const { chu } = await mot(`select zalo_dien_noi_dung($1, jsonb_build_object('customer_name', $2::text,
                                                         'google_review_link', 'https://g.page/r/thu')) as chu`,
                            [m.noi_dung, ten]);
  ok('Khách không có tên đọc thành "Beeftown cảm ơn Quý khách đã dùng bữa tại quán hôm nay."',
     chu.includes('\nBeeftown cảm ơn Quý khách đã dùng bữa tại quán hôm nay.\n'), chu);
  ok('Không còn "anh/chị Quý khách"', !/anh\/chị Quý khách/i.test(chu), chu);
  ok('Điền đủ, không còn chỗ trống <...>', !/<[a-z_]+>/.test(chu), chu);

  ok('Sạch chữ cấm (web/src/lib/chuoi-cam.js)', timChuoiCam(m.noi_dung).length === 0, JSON.stringify(timChuoiCam(m.noi_dung)));
  ok('Không còn "tụi em" và lời xin đánh giá chỉ khi "vừa ý"', !/tụi em|vừa ý/i.test(m.noi_dung));
});

// ===========================================================================
await nhom('2 · MIGRATION CHỈ SỬA MẪU CHƯA DUYỆT — chạy lại không đổi gì, không chạm mẫu khác', async () => {
  if (!sqlMigration) { ok('Có migration để chạy lại', false); return; }
  const khac = async () => (await db.query(`select ma, noi_dung from mau_tin where ma <> 'ZBS-03' order by ma`)).rows;
  const truoc = await khac();

  await db.query(`update mau_tin set noi_dung = $1, da_duyet = true, ma_zalo = 'tpl_da_nop' where ma = 'ZBS-03'`, [CHU_CU]);
  await db.exec(sqlMigration);
  const daDuyet = await mau03();
  ok('Mẫu đã duyệt giữ nguyên chữ đã nộp Zalo', daDuyet.noi_dung === CHU_CU && daDuyet.da_duyet === true,
     JSON.stringify(daDuyet.noi_dung));

  await db.query(`update mau_tin set da_duyet = false, ma_zalo = null where ma = 'ZBS-03'`);
  await db.exec(sqlMigration);
  const chuaDuyet = await mau03();
  ok('Mẫu chưa duyệt (chữ cũ) → đổi sang chữ mới, tham số tự tính lại',
     chuaDuyet.noi_dung === CHU_MOI && JSON.stringify(chuaDuyet.tham_so) === '["customer_name","google_review_link"]',
     JSON.stringify(chuaDuyet));

  await db.exec(sqlMigration);
  ok('Chạy lại lần nữa: vẫn đúng chữ mới', (await mau03()).noi_dung === CHU_MOI);
  ok('ZBS-01, ZBS-02, ZBS-04 không đổi', JSON.stringify(await khac()) === JSON.stringify(truoc));
});

process.exit(ketThuc('CHỮ MỚI CỦA MẪU ZBS-03'));
