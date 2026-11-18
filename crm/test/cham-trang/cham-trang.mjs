/**
 * BỘ CHẤM 50 CÂU CỦA TRANG — chạy tay, gọi Claude THẬT (tốn tiền, khoảng vài trăm đồng một lượt chấm)
 * =================================================================================================
 *
 *     cd crm
 *     npm i --no-save @anthropic-ai/sdk@1.8.0          # một lần; không ghi vào package.json
 *     ANTHROPIC_API_KEY=… node test/cham-trang/cham-trang.mjs [--chi 1,7,39] [--mo-hinh claude-haiku-5-5]
 *
 * Khóa chỉ đọc từ biến môi trường của lệnh — không ghi file, không in ra. Khóa của Khánh là khóa cấp tổ chức nên mỗi lời
 * gọi kèm workspace (WORKSPACE_MAC_DINH của xu-ly.ts).
 *
 * Chạy ĐÚNG mã của Edge Function (xu-ly.ts: lời dặn, che thông tin, máy kiểm tiếng Việt, viết lại một lần, gọt kết quả)
 * với database giả trong bộ nhớ: menu và sổ học là ảnh chụp production ngày 18/11/2026 (menu-18-11.json), lịch sử của
 * mỗi cuộc chat giữ như tro_ly_mo_luot (tám lượt gần nhất). Không đụng database thật, không deploy gì.
 *
 * Máy chấm từng câu theo cau-hoi.json (JSON đúng khuôn, tiếng Việt, chữ cấm kể cả AI / bot / tự động, "trợ lý ảo" chỉ khi khách hỏi, các ô phai_* /
 * khong_*). Kết quả: ket-qua-<ngày>.json (đủ chi tiết, cả bản Claude trả lần đầu) và ket-qua-<ngày>.md (bảng để người
 * chấm đọc từng câu theo "tot_la" rồi ghi Đạt / Không đạt). Ngưỡng bật cho khách: từ 45/50 câu Đạt.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DAY = dirname(fileURLToPath(import.meta.url));
const GOC = join(DAY, '..', '..', '..');
const nap = p => import(pathToFileURL(join(GOC, p)).href);
const { xuLyYeuCau, WORKSPACE_MAC_DINH, MO_HINH } = await nap('crm/supabase/functions/tro-ly-trang/xu-ly.ts');
const { chuNgoai, chuCam } = await nap('web/src/lib/tieng-viet-trang.ts');

const thamSo = process.argv.slice(2);
const lay = ten => { const i = thamSo.indexOf(ten); return i >= 0 ? thamSo[i + 1] : null; };
const chi = (lay('--chi') ?? '').split(',').map(Number).filter(Boolean);
const moHinh = lay('--mo-hinh') ?? MO_HINH;

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Thiếu ANTHROPIC_API_KEY trong biến môi trường của lệnh (đặt cho riêng lệnh này, không ghi file).');
  process.exit(2);
}
let Anthropic;
try { ({ default: Anthropic } = await import('@anthropic-ai/sdk')); } catch {
  console.error('Thiếu @anthropic-ai/sdk: cd crm && npm i --no-save @anthropic-ai/sdk@1.8.0');
  process.exit(2);
}
// baseURL ghi thẳng: máy có thể đặt sẵn ANTHROPIC_BASE_URL cho việc khác — bộ chấm luôn gọi đúng API của Anthropic.
const claude = new Anthropic({
  baseURL: 'https://api.anthropic.com', defaultHeaders: { 'anthropic-workspace-id': WORKSPACE_MAC_DINH }, timeout: 30_000, maxRetries: 2,
});

const { menu, so_hoc: soHoc } = JSON.parse(readFileSync(join(DAY, 'menu-18-11.json'), 'utf8'));
const { cau: tatCa } = JSON.parse(readFileSync(join(DAY, 'cau-hoi.json'), 'utf8'));
const boCau = chi.length ? tatCa.filter(c => chi.includes(c.id)) : tatCa;

/** Database giả: giữ lịch sử từng cuộc như tro_ly_mo_luot / tro_ly_ghi_luot. */
function dbGia() {
  const cuoc = new Map();
  const ghi = [];
  return {
    ghi,
    rpc: async (ten, p) => {
      if (ten === 'tro_ly_mo_luot') {
        const ds = cuoc.get(p.p_cuoc) ?? [];
        cuoc.set(p.p_cuoc, ds);
        const dong = { ma_tin: p.p_ma_tin, khach: p.p_tin, tra_loi: null };
        ds.push(dong);
        const lichSu = ds.filter(d => d.tra_loi && d !== dong).slice(-8).map(d => ({ khach: d.khach, tra_loi: d.tra_loi }));
        return { data: { duoc: true, luot: ds.length, lich_su: lichSu, menu, so_hoc: soHoc }, error: null };
      }
      if (ten === 'tro_ly_ghi_luot') {
        const dong = (cuoc.get(p.p_cuoc) ?? []).find(d => d.ma_tin === p.p_ma_tin);
        if (dong && p.p_ket_qua?.tra_loi) dong.tra_loi = p.p_ket_qua.tra_loi;
        ghi.push(p.p_ket_qua);
        return { data: true, error: null };
      }
      if (ten === 'mua_thit_ve_cong_khai') return { data: menu, error: null };
      return { data: null, error: { message: 'không có hàm ' + ten } };
    },
  };
}

const chuThuong = s => String(s ?? '').normalize('NFC').toLowerCase();
const coChu = (tin, mau) => chuThuong(tin).includes(chuThuong(mau));
/** Chữ ngắn (rẻ, ok, set…) so theo từ trọn; cụm dài so theo chuỗi con. */
const coTu = (tin, tu) => (/\s/.test(tu) || tu.length > 6 ? coChu(tin, tu)
  : chuThuong(tin).split(/[^\p{L}\p{N}]+/u).includes(chuThuong(tu)));

async function chamMotCau(c) {
  const db = dbGia();
  const tho = [];
  const goiClaude = async p => {
    const batDau = Date.now();
    const m = await claude.messages.create({ ...p, model: moHinh });
    tho.push({ chu: m.content?.find(b => b.type === 'text')?.text ?? null, ly_do: m.stop_reason, usage: m.usage, ms: Date.now() - batDau });
    return m;
  };
  const cuoc = crypto.randomUUID();
  const luot = [];
  for (const tin of c.luot) {
    const truoc = tho.length;
    const req = new Request('https://bzfzutyuqwxjarlsmgjt.supabase.co/functions/v1/tro-ly-trang', {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8', Origin: 'https://beeftown.vn', 'x-forwarded-for': '203.0.113.50' },
      body: JSON.stringify({ cuoc, ma_tin: crypto.randomUUID(), tin, tra_truoc: true, chi_nhanh: 'q1' }),
    });
    const batDau = Date.now();
    const r = await xuLyYeuCau(req, { goiClaude, rpc: db.rpc, ghiLog: () => {} });
    const j = await r.json();
    luot.push({ khach: tin, trang_thai: r.status, tra_loi: j, ghi: db.ghi.at(-1), claude: tho.slice(truoc), ms: Date.now() - batDau });
  }
  return { ...c, ket: luot, may: chamMay(c, luot) };
}

/** Máy chấm: danh sách lỗi (rỗng = máy cho qua). Người chấm vẫn đọc từng câu theo tot_la. */
function chamMay(c, luot) {
  const loi = [];
  const cuoi = luot.at(-1)?.tra_loi;
  if (!cuoi?.ok) { loi.push(`lượt cuối không trả lời được (${luot.at(-1)?.trang_thai} ${cuoi?.loi ?? ''})`); return loi; }
  for (const [i, l] of luot.entries()) {
    const tin = l.tra_loi?.tin ?? [];
    if (!l.tra_loi?.ok) loi.push(`lượt ${i + 1} lỗi`);
    if (tin.length < 1 || tin.length > 3) loi.push(`lượt ${i + 1}: ${tin.length} tin`);
    for (const t of tin) {
      if (chuNgoai(t).length) loi.push(`chữ nước ngoài: ${chuNgoai(t).join(', ')}`);
      if (chuCam(t).length) loi.push(`chữ cấm: ${chuCam(t).join(' ')}`);
      // Chữ AI, bot, tự động đã bị chuCam bắt ở mọi câu (Khánh 18/11/2026). "Trợ lý ảo" chỉ khi khách hỏi.
      if (!c.cho_phep_tro_ly_ao && /trợ lý ảo|là máy/i.test(t)) loi.push(`tự nhắc trợ lý ảo khi khách không hỏi: "${t}"`);
    }
  }
  const tinCuoi = cuoi.tin.join(' ');
  const theDaGui = luot.flatMap(l => (l.tra_loi?.the ?? []).map(t => t.ma));
  if (c.phai_chuyen_nguoi && !cuoi.chuyen_nguoi) loi.push('phải mời liên hệ nhân viên (chuyen_nguoi)');
  if (c.phai_cau_chua_biet && !luot.at(-1)?.ghi?.tra_loi?.cau_chua_biet) loi.push('phải ghi câu chưa biết vào sổ học');
  for (const ma of c.phai_co_the ?? []) if (!theDaGui.includes(ma)) loi.push(`thiếu thẻ ${ma}`);
  if (c.phai_co_don && !(cuoi.don?.length > 0)) loi.push('phải có đơn gợi ý (don)');
  if (c.phai_chot && !cuoi.chot) loi.push('phải chốt đơn (chot)');
  for (const m of c.phai_noi ?? []) if (!coChu(tinCuoi, m)) loi.push(`phải nói "${m}"`);
  for (const m of c.khong_duoc_noi ?? []) if (luot.some(l => coTu((l.tra_loi?.tin ?? []).join(' '), m))) loi.push(`không được nói "${m}"`);
  return loi;
}

// Chạy bốn câu một lúc (mỗi câu các lượt nối nhau).
const ketQua = [];
let iTiep = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (iTiep < boCau.length) {
    const c = boCau[iTiep++];
    try { ketQua.push(await chamMotCau(c)); }
    catch (e) { ketQua.push({ ...c, ket: [], may: [`lỗi khi chạy: ${e?.status ?? ''} ${e?.name ?? ''}`.trim()] }); }
    process.stdout.write(c.id + ' ');
  }
}));
ketQua.sort((a, b) => a.id - b.id);
console.log('\n');

// Tổng hợp.
const tong = { cau: ketQua.length, may_dat: ketQua.filter(k => k.may.length === 0).length, luot: 0, viet_lai: 0, thay_tu: 0, bo_tin: 0,
  token_vao: 0, token_ra: 0, token_doc_dem: 0, token_ghi_dem: 0, ms: [] };
for (const k of ketQua) for (const l of k.ket) {
  tong.luot++;
  if (l.ghi?.viet_lai) tong.viet_lai++;
  if (l.ghi?.thay_tu) tong.thay_tu++;
  tong.bo_tin += l.ghi?.bo_tin ?? 0;
  tong.token_vao += l.ghi?.token_vao ?? 0; tong.token_ra += l.ghi?.token_ra ?? 0;
  tong.token_doc_dem += l.ghi?.token_doc_dem ?? 0; tong.token_ghi_dem += l.ghi?.token_ghi_dem ?? 0;
  tong.ms.push(l.ms);
}
tong.ms.sort((a, b) => a - b);
const trungVi = tong.ms[Math.floor(tong.ms.length / 2)] ?? 0;
const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
writeFileSync(join(DAY, `ket-qua-${ngay}.json`), JSON.stringify({ ngay, mo_hinh: moHinh, tong: { ...tong, ms: undefined, ms_trung_vi: trungVi }, ket_qua: ketQua }, null, 2));

const oBang = s => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const dongBang = ketQua.map(k => {
  const cuoi = k.ket.at(-1)?.tra_loi;
  const the = k.ket.flatMap(l => (l.tra_loi?.the ?? []).map(t => t.ma)).join(', ');
  const don = (cuoi?.don ?? []).map(d => `${d.khoa}×${d.so_goi}`).join(', ');
  const them = [the && `thẻ: ${the}`, don && `đơn: ${don}`, cuoi?.chot && 'chốt', cuoi?.chuyen_nguoi && 'liên hệ nhân viên'].filter(Boolean).join(' · ');
  const hoiThoai = k.ket.map(l => `**Khách:** ${oBang(l.khach)}<br>**Trang:** ${oBang((l.tra_loi?.tin ?? [l.tra_loi?.loi]).join(' / '))}`).join('<br>');
  return `| ${k.id} | ${oBang(k.nhom)} | ${hoiThoai} | ${oBang(them)} | ${k.may.length ? 'Không qua: ' + oBang(k.may.join('; ')) : 'Qua'} | ${oBang(k.tot_la)} |`;
});
const md = [
  `# Bảng chấm Trang — ${ngay}, ${moHinh}`, '',
  `Máy chấm: ${tong.may_dat}/${tong.cau} câu qua. ${tong.luot} lượt; viết lại ${tong.viet_lai} lượt, thay bảng từ ${tong.thay_tu}, bỏ ${tong.bo_tin} tin. `
    + `Token: vào ${tong.token_vao}, đọc lưu đệm ${tong.token_doc_dem}, ghi lưu đệm ${tong.token_ghi_dem}, ra ${tong.token_ra}. Thời gian một lượt (trung vị): ${(trungVi / 1000).toFixed(1).replace('.', ',')} giây.`, '',
  '| # | Nhóm | Hội thoại | Thẻ, đơn | Máy chấm | Tốt là |', '|---|---|---|---|---|---|', ...dongBang, '',
].join('\n');
writeFileSync(join(DAY, `ket-qua-${ngay}.md`), md);
console.log(`Máy chấm: ${tong.may_dat}/${tong.cau} câu qua · ${tong.luot} lượt · viết lại ${tong.viet_lai} · trung vị ${trungVi} ms`);
for (const k of ketQua.filter(x => x.may.length)) console.log(`  #${k.id}: ${k.may.join('; ')}`);
