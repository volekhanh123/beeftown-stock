/**
 * BEEFTOWN — Kiểm thử: trang tuyển dụng cho máy đọc — danh sách thật, quyền lợi một lần, JobPosting, lời lẽ khách đọc
 * ====================================================================================================================
 *
 *     node test/test-cong-khai-tuyen-dung-seo.mjs
 *
 * Rà soát SEO 23/11/2026, mục tuyển dụng (mức thấp / trung bình):
 *   · nhiệm vụ gõ bằng dòng gạch trong <p> pre-line → máy đọc thành một câu dài → <ul><li> thật (tachKhoiChu, KhoiChuTin.astro);
 *   · khối "Quyền lợi" (cả câu đóng) in lại nguyên văn dưới từng vị trí, bốn lần → một khối chung (tachQuyenLoiChung);
 *   · chưa có JobPosting → tinTuyenDungJsonLd: một cho mỗi tin CÓ ngày công bố thật, không baseSalary, không bịa hạn;
 *   · "đội mở cửa / opening team / 오픈 팀" trong tiêu đề, mô tả của ba trang (Khánh 24/11/2026: viết như nhà hàng đã mở).
 * Dữ liệu thử bám đúng hình dạng tin thật (chép cấu trúc của trang beeftown.vn/tuyen-dung ngày 24/11/2026).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { tachKhoiChu, tachQuyenLoiChung, tinTuyenDungJsonLd, ngayDangTuMoc } from '../../web/src/lib/tuyen-dung.ts';
import { diaChiCoCauTruc } from '../../web/src/lib/trang-cong-khai.ts';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = (...p) => readFileSync(join(GOC, ...p), 'utf8').replace(/\r\n/g, '\n');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG TUYỂN DỤNG CHO MÁY ĐỌC (DANH SÁCH, QUYỀN LỢI CHUNG, JOBPOSTING)');

const DONG_DONG = 'Beeftown tách rõ kỹ năng cần có trước khi vào làm với những tiêu chuẩn riêng của Beeftown mà bạn sẽ học sau khi vào làm.';
const QL_CHUNG = ['Học các tiêu chuẩn sản phẩm và phục vụ rõ ràng', 'Phát triển theo năng lực và kết quả làm việc thực tế'];
const quyenLoi = (...them) => ['Vì sao nên gia nhập Beeftown:', ...QL_CHUNG.map(d => `– ${d}`), ...them.map(d => `– ${d}`), DONG_DONG].join('\n');
const TIN = [
  { ma: 'SANH', ten: 'Nhân viên sảnh', loai_hop_dong: 'ban_thoi_gian', han_nop: null, cong_bo_luc: '2026-11-20T03:12:45.123+00:00',
    mo_ta: 'Beeftown cần những người ấm áp, chủ động.\nCông việc chính:\n– Đón và hỗ trợ khách\n– Phục vụ và dọn bàn',
    yeu_cau: 'Phù hợp nếu bạn:\n– Biết lắng nghe\n– Sẵn sàng học hỏi\nKhi tuyển, bạn có thể được mời thử một tình huống.',
    quyen_loi: quyenLoi('Được đào tạo về phục vụ khách') },
  { ma: 'BEP', ten: 'Nhân viên bếp có kinh nghiệm', loai_hop_dong: null, han_nop: '2026-12-31', cong_bo_luc: '2026-11-20T03:12:45+00:00',
    mo_ta: 'Beeftown cần người đã có kinh nghiệm làm bếp.\nCông việc chính:\n– Sơ chế nguyên liệu',
    yeu_cau: '– Đã có kinh nghiệm làm bếp', quyen_loi: quyenLoi('Được đào tạo thực tế') },
  { ma: 'PHA-LOC', ten: 'Thợ pha lóc thịt bò', loai_hop_dong: 'toan_thoi_gian', han_nop: null, cong_bo_luc: null,
    mo_ta: 'Beeftown cần một người đã có kinh nghiệm lọc thịt bò.\n– Lọc và chia thịt', yeu_cau: null, quyen_loi: quyenLoi('Được đào tạo thực tế') },
];
const BOI_CANH = {
  trangUrl: 'https://beeftown.vn/tuyen-dung', tenToChuc: 'Beeftown', goc: 'https://beeftown.vn/',
  diaChi: diaChiCoCauTruc({}),
};

// ===========================================================================
await nhom('1 · tachKhoiChu: dòng gạch đầu dòng thành danh sách, dòng khác thành đoạn', async () => {
  const k = tachKhoiChu(TIN[0].mo_ta);
  ok('mô tả: đoạn, đoạn, danh sách 2 mục', k.length === 3 && k[0].kieu === 'doan' && k[1].kieu === 'doan' && k[2].kieu === 'ds' && k[2].muc.length === 2, JSON.stringify(k));
  ok('bỏ dấu gạch và khoảng trắng đầu mục', k[2].muc[0] === 'Đón và hỗ trợ khách' && k[2].muc[1] === 'Phục vụ và dọn bàn');
  const k2 = tachKhoiChu(TIN[0].yeu_cau);
  ok('yêu cầu: đoạn dẫn, danh sách, đoạn kết (danh sách đứt khi gặp dòng thường)', k2.map(x => x.kieu).join() === 'doan,ds,doan', JSON.stringify(k2));
  ok('mọi kiểu gạch của người gõ: – - — • đều thành mục', tachKhoiChu('– a\n- b\n— c\n• d\n* e').every(x => x.kieu === 'ds' && x.muc.length === 5));
  ok('gạch nối giữa chữ không bị cắt ("Hall-Crew")', tachKhoiChu('Hall-Crew là vị trí đầu').length === 1 && tachKhoiChu('Hall-Crew là vị trí đầu')[0].kieu === 'doan');
  ok('CRLF và dòng trống', tachKhoiChu('a\r\n\r\n– b\r\n').length === 2);
  ok('null / rỗng → không khối nào', tachKhoiChu(null).length === 0 && tachKhoiChu('  \n ').length === 0);
});

// ===========================================================================
await nhom('2 · tachQuyenLoiChung: một lần, phần riêng giữ lại, tin khác thật không bị ép', async () => {
  const { chung, rieng } = tachQuyenLoiChung(TIN);
  ok('khối chung có hai dòng chung và câu đóng — mỗi dòng đúng một lần',
     chung !== null && QL_CHUNG.every(d => chung.split(d).length === 2) && chung.split(DONG_DONG).length === 2, chung);
  ok('dòng riêng của từng tin ("Được đào tạo…") KHÔNG vào khối chung', !chung.includes('Được đào tạo'));
  ok('tin sảnh giữ phần riêng của nó', rieng.get('SANH') === '– Được đào tạo về phục vụ khách', rieng.get('SANH'));
  ok('tin bếp và pha lóc giữ "Được đào tạo thực tế" (không mất dữ liệu)', rieng.get('BEP') === '– Được đào tạo thực tế' && rieng.get('PHA-LOC') === '– Được đào tạo thực tế');
  ok('KHÔNG dòng nào bị in hai lần: chung + riêng của mọi tin = toàn bộ dòng gốc (không thiếu, không thừa)',
     TIN.every(t => {
       const goc = t.quyen_loi.split('\n').filter(d => d.trim()).sort().join('|');
       const ghep = [...chung.split('\n'), ...(rieng.get(t.ma) ?? '').split('\n').filter(Boolean)].sort().join('|');
       return goc === ghep;
     }));
  ok('dòng "Vì sao nên gia nhập Beeftown:" chung cũng chỉ một lần', chung.split('Vì sao nên gia nhập Beeftown:').length === 2);

  // Gạch khác nhau nhưng cùng chữ vẫn là một dòng.
  const g = tachQuyenLoiChung([{ ma: 'A', quyen_loi: '– Học nghề\n- Có thưởng' }, { ma: 'B', quyen_loi: '- Học nghề\n– Có lương tháng 13' }]);
  ok('so sánh bỏ gạch đầu dòng và khoảng trắng thừa', g.chung === '– Học nghề' && g.rieng.get('B') === '– Có lương tháng 13', JSON.stringify(g));

  // Các tin khác thật → không ép gộp.
  const k = tachQuyenLoiChung([{ ma: 'A', quyen_loi: 'Lương cao' }, { ma: 'B', quyen_loi: 'Ăn trưa miễn phí' }]);
  ok('quyền lợi khác hẳn nhau: không khối chung, mỗi tin giữ của mình', k.chung === null && k.rieng.get('A') === 'Lương cao' && k.rieng.get('B') === 'Ăn trưa miễn phí');
  const mot = tachQuyenLoiChung([{ ma: 'A', quyen_loi: '– X\n– Y' }]);
  ok('chỉ một tin: không khối chung (không có gì để lặp)', mot.chung === null && mot.rieng.get('A') === '– X\n– Y');
  const trong = tachQuyenLoiChung([{ ma: 'A', quyen_loi: null }, { ma: 'B', quyen_loi: '– X' }, { ma: 'C', quyen_loi: '  ' }]);
  ok('tin không có quyền lợi không kéo khối chung về rỗng', trong.chung === null && trong.rieng.get('B') === '– X' && trong.rieng.get('A') === null);
  const khong = tachQuyenLoiChung([]);
  ok('không tin nào → không lỗi', khong.chung === null && khong.rieng.size === 0);
});

// ===========================================================================
await nhom('3 · tinTuyenDungJsonLd: một JobPosting cho mỗi tin có ngày thật, không khai điều không có', async () => {
  const ds = tinTuyenDungJsonLd(TIN, BOI_CANH);
  ok('3 tin, 1 tin không có cong_bo_luc → đúng 2 JobPosting (không đoán ngày cho tin kia)', ds.length === 2, String(ds.length));
  ok('đúng hai tin có ngày: sảnh và bếp', ds.map(d => d.identifier.value).join() === 'SANH,BEP');
  for (const d of ds) {
    const ten = d.title;
    ok(`${ten}: @type JobPosting, tên, mô tả không rỗng`, d['@type'] === 'JobPosting' && d.title && d.description.length > 40);
    ok(`${ten}: JSON.stringify → parse lại được`, JSON.parse(JSON.stringify(d)).title === d.title);
    ok(`${ten}: KHÔNG baseSalary`, !('baseSalary' in d) && !/baseSalary/.test(JSON.stringify(d)));
    ok(`${ten}: hiringOrganization Beeftown`, d.hiringOrganization.name === 'Beeftown' && d.hiringOrganization['@type'] === 'Organization');
    ok(`${ten}: jobLocation là Place có address PostalAddress "Tầng 3, 63 Hồ Tùng Mậu", VN`,
       d.jobLocation['@type'] === 'Place' && d.jobLocation.address.streetAddress === 'Tầng 3, 63 Hồ Tùng Mậu' && d.jobLocation.address.addressCountry === 'VN');
    ok(`${ten}: KHÔNG tên phường (không addressLocality)`, !('addressLocality' in d.jobLocation.address) && !/phường/i.test(JSON.stringify(d.jobLocation)));
    ok(`${ten}: directApply true (form nộp ngay trên trang)`, d.directApply === true);
    ok(`${ten}: datePosted là ngày YYYY-MM-DD`, /^\d{4}-\d{2}-\d{2}$/.test(d.datePosted), d.datePosted);
  }
  ok('datePosted tính theo giờ Việt Nam: 2026-11-20T03:12Z → 2026-11-20; 2026-11-19T20:00Z → 2026-11-20 (đã qua nửa đêm VN)',
     ngayDangTuMoc('2026-11-20T03:12:45+00:00') === '2026-11-20' && ngayDangTuMoc('2026-11-19T20:00:00+00:00') === '2026-11-20' && ngayDangTuMoc('2026-11-19T16:59:00+00:00') === '2026-11-19');
  ok('mốc rác / null → không có ngày (không ném lỗi)', ngayDangTuMoc('hôm qua') === null && ngayDangTuMoc(null) === null && ngayDangTuMoc(undefined) === null);

  const sanh = ds[0], bep = ds[1];
  ok('employmentType: bán thời gian → PART_TIME', sanh.employmentType === 'PART_TIME');
  ok('loại hợp đồng chưa chốt (null) → không có employmentType (không đoán)', !('employmentType' in bep));
  ok('validThrough chỉ khi tin có hạn nộp thật: bếp 2026-12-31 có, sảnh không', bep.validThrough === '2026-12-31' && !('validThrough' in sanh));
  ok('mô tả là HTML có <ul><li> thật và không còn dấu gạch đầu dòng', sanh.description.includes('<ul><li>Đón và hỗ trợ khách</li><li>Phục vụ và dọn bàn</li></ul>') && !/[–—]\s/.test(sanh.description));
  ok('mô tả thoát HTML (không chèn thẻ từ chữ gõ vào)',
     tinTuyenDungJsonLd([{ ...TIN[0], mo_ta: 'Dòng <script>alert(1)</script> & "x"', yeu_cau: null, quyen_loi: null }], BOI_CANH)[0].description === '<p>Dòng &lt;script&gt;alert(1)&lt;/script&gt; &amp; "x"</p>');
  ok('tin không có cong_bo_luc (field thiếu hẳn, như RPC hôm nay chưa trả) → không JobPosting nào',
     tinTuyenDungJsonLd(TIN.map(({ cong_bo_luc, ...con }) => con), BOI_CANH).length === 0);
  ok('không tin → mảng rỗng', tinTuyenDungJsonLd([], BOI_CANH).length === 0);
  ok('tên rỗng hoặc không chữ nào → bỏ', tinTuyenDungJsonLd([{ ...TIN[0], ten: '  ' }], BOI_CANH).length === 0 && tinTuyenDungJsonLd([{ ...TIN[0], mo_ta: null, yeu_cau: null, quyen_loi: null }], BOI_CANH).length === 0);
  ok('hạn nộp sai dạng → bỏ validThrough thay vì in rác', !('validThrough' in tinTuyenDungJsonLd([{ ...TIN[0], han_nop: '31/12/2026' }], BOI_CANH)[0]));
});

// ===========================================================================
await nhom('4 · mã của trang: nối đủ, không còn <p> pre-line cho nhiệm vụ, không "đội mở cửa / opening team / 오픈 팀"', async () => {
  const td = doc('web/src/components/TrangTuyenDung.astro');
  ok('TrangTuyenDung dùng KhoiChuTin cho mô tả, yêu cầu, quyền lợi', (td.match(/<KhoiChuTin /g) ?? []).length >= 4);
  ok('không còn white-space: pre-line (td-giu-dong) cho khối chữ của tin', !/td-giu-dong/.test(td) && !/pre-line/.test(td.replace(/\/\*[\s\S]*?\*\//g, '')));
  ok('quyền lợi riêng lấy từ tachQuyenLoiChung, khối chung in một lần', /tachQuyenLoiChung\(viTri\)/.test(td) && (td.match(/quyenLoi\.chung/g) ?? []).length >= 2 && /class="td-chung"/.test(td));
  ok('JSON-LD: thẻ script cặp mở/đóng, mỗi tin một thẻ, qua jsonTrongScript (thoát "<")',
     /jobPostings\.map\(j => <script type="application\/ld\+json" set:html=\{jsonTrongScript\(j\)\} is:inline><\/script>\)/.test(td));
  ok('địa chỉ JSON-LD lấy từ diaChiCoCauTruc (cùng nguồn với cả web, không phường)', /diaChi: diaChiCoCauTruc\(nd\)/.test(td));

  const kct = doc('web/src/components/KhoiChuTin.astro');
  ok('KhoiChuTin: <ul> cho danh sách, <p> cho đoạn, từ tachKhoiChu', /tachKhoiChu\(chu\)/.test(kct) && /<ul /.test(kct) && /<li>\{m\}<\/li>/.test(kct) && /<p /.test(kct));

  const rac = /đội mở cửa|opening team|오픈 팀|doi mo cua/i;
  const TEP = ['web/src/components/TrangTuyenDung.astro', 'web/src/components/KhoiChuTin.astro', 'web/src/lib/tuyen-dung.ts', 'web/src/lib/tin-tuyen-dung.ts',
    'web/src/pages/tuyen-dung.astro', 'web/src/pages/en/jobs.astro', 'web/src/pages/ko/jobs.astro', 'web/src/components/FormUngTuyen.astro'];
  for (const t of TEP) ok(`${t}: không còn lời lẽ giai đoạn mở cửa`, !rac.test(doc(t)), (doc(t).match(rac) ?? [])[0]);

  for (const [nn, f] of [['vi', 'tuyen-dung.astro'], ['en', 'en/jobs.astro'], ['ko', 'ko/jobs.astro']]) {
    const s = doc('web/src/pages', f);
    const tieuDe = s.match(/\btieuDe="([^"]*)"/)?.[1] ?? '', moTa = s.match(/\bmoTa="([^"]*)"/)?.[1] ?? '';
    ok(`${nn}: tiêu đề và mô tả còn, mô tả nói là đang tuyển`, tieuDe.length > 15 && moTa.length > 40, `${tieuDe} | ${moTa}`);
    ok(`${nn}: không phường trong mô tả`, !/phường|ward|동\b/i.test(moTa));
  }
});

process.exit(ketThuc('trang tuyển dụng cho máy đọc'));
