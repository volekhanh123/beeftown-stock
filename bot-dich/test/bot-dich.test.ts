/**
 * Kiểm thử bot dịch: chạy bằng `npm run thu` (node --test, Node ≥ 22.18 đọc thẳng .ts).
 * Zalo và Claude đều giả bằng một hàm fetch ghi lại mọi lời gọi — không gọi mạng thật.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BoNhoTinDaNhan,
  boTagBot,
  canDich,
  chiaDoan,
  CAU_DICH_HONG,
  docTinZalo,
  doanNgonNgu,
  khoaWebhook,
  ngonNguDich,
  soBiMat,
} from '../src/xu-ly.ts';
import { xuLyTin, xuLyYeuCau, type Env } from '../src/index.ts';

const TOKEN = '1234567890:bi-mat-thu';

interface LoiGoi {
  url: string;
  than: Record<string, unknown>;
}

/** fetch giả: Zalo trả ok; Claude trả bản dịch cho trước, hoặc lỗi theo kịch bản. */
type CheGemini = 'ok' | 'loi-500' | 'mat-mang' | 'chan' | 'dung-giua' | 'rong' | 'khong-nhan-muc-nghi' | 'khoa-sai';

function taoFetchGia(
  kichBan: {
    claude?: 'ok' | 'loi-500' | 'tu-choi' | 'rong' | 'mat-mang';
    gemini?: CheGemini;
    banDich?: string;
    zalo?: 'ok' | 'loi';
  } = {},
) {
  const goi: LoiGoi[] = [];
  const headerGemini: (string | null)[] = [];
  const fetchGia = (async (dauVao: RequestInfo | URL, tuyChon?: RequestInit) => {
    const url = typeof dauVao === 'string' ? dauVao : dauVao instanceof URL ? dauVao.href : dauVao.url;
    const thanChu = tuyChon?.body ? String(tuyChon.body) : '';
    goi.push({ url, than: thanChu ? JSON.parse(thanChu) : {} });
    if (url.startsWith('https://generativelanguage.googleapis.com/')) {
      headerGemini.push(new Headers(tuyChon?.headers).get('x-goog-api-key'));
      const che = kichBan.gemini ?? 'ok';
      const json = (du: unknown, trangThai = 200) => new Response(JSON.stringify(du), { status: trangThai });
      if (che === 'mat-mang') throw new TypeError('fetch failed');
      if (che === 'loi-500') return json({ error: { code: 500 } }, 500);
      if (che === 'khoa-sai') return json({ error: { code: 400, message: 'API key not valid' } }, 400);
      const kemMucNghi = JSON.parse(thanChu).generationConfig?.thinkingConfig !== undefined;
      if (che === 'khong-nhan-muc-nghi' && kemMucNghi) {
        return json({ error: { code: 400, message: 'Thinking level is not supported for this model.' } }, 400);
      }
      if (che === 'chan') return json({ promptFeedback: { blockReason: 'SAFETY' } });
      if (che === 'dung-giua') return json({ candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] });
      const phan = che === 'rong' ? [] : [{ text: 'suy nghĩ', thought: true }, { text: kichBan.banDich ?? '안녕하세요' }];
      return json({ candidates: [{ finishReason: 'STOP', content: { parts: phan } }] });
    }
    if (url.includes('api.anthropic.com')) {
      const che = kichBan.claude ?? 'ok';
      if (che === 'mat-mang') throw new TypeError('fetch failed');
      if (che === 'loi-500') {
        return new Response(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'boom' } }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          id: 'msg_thu',
          type: 'message',
          role: 'assistant',
          model: 'claude-opus-5-5',
          content: che === 'rong' ? [] : [{ type: 'text', text: kichBan.banDich ?? '안녕하세요' }],
          stop_reason: che === 'tu-choi' ? 'refusal' : 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.startsWith('https://bot-api.zaloplatforms.com/')) {
      if (kichBan.zalo === 'loi') {
        return new Response(JSON.stringify({ ok: false, error_code: 500, description: 'loi' }), { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true, result: { message_id: 'm-gui', account_name: 'Bot thu' } }), {
        status: 200,
      });
    }
    throw new Error(`fetch giả không biết ${url}`);
  }) as typeof fetch;
  const tinGui = () =>
    goi.filter(g => g.url.endsWith('/sendMessage')).map(g => String(g.than.text));
  const goiClaude = () => goi.filter(g => g.url.includes('api.anthropic.com'));
  const goiGemini = () => goi.filter(g => g.url.includes('generativelanguage.googleapis.com'));
  return { fetchGia, goi, tinGui, goiClaude, goiGemini, headerGemini };
}

function thanWebhook(text: string, ghiDe: Record<string, unknown> = {}) {
  return {
    event_name: 'message.text.received',
    message: {
      message_id: `m-${Math.random().toString(36).slice(2)}`,
      from: { id: 'u-khanh', display_name: 'Khánh', is_bot: false },
      chat: { id: 'g-nhom', chat_type: 'GROUP' },
      date: 1763280000000,
      text,
      ...ghiDe,
    },
  };
}

const ENV_CLAUDE: Env = { ZALO_BOT_TOKEN: TOKEN, ANTHROPIC_API_KEY: 'sk-ant-thu', TEN_BOT: 'Bot Beeftown Translate' };

function nguCanhGia() {
  const viec: Promise<unknown>[] = [];
  return { waitUntil: (p: Promise<unknown>) => viec.push(p), xong: () => Promise.all(viec), viec };
}

async function guiWebhook(than: unknown, env: Env, fetchGia: typeof fetch, khoa?: string) {
  const nguCanh = nguCanhGia();
  const traVe = await xuLyYeuCau(
    new Request('https://bot.thu.workers.dev/zalo', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-bot-api-secret-token': khoa ?? (await khoaWebhook(TOKEN)) },
      body: JSON.stringify(than),
    }),
    env,
    nguCanh,
    fetchGia,
  );
  await nguCanh.xong();
  return { traVe, nguCanh };
}

// ---------- Đọc tin ----------

test('đọc tin chữ trong nhóm, kể cả khi bọc trong { ok, result }', () => {
  const tin = docTinZalo(thanWebhook('hello'));
  assert.equal(tin?.laNhom, true);
  assert.equal(tin?.tenNguoiGui, 'Khánh');
  const boc = docTinZalo({ ok: true, result: thanWebhook('hi', { chat: { id: 'u1', chat_type: 'PRIVATE' } }) });
  assert.equal(boc?.laNhom, false);
  assert.equal(boc?.noiDung, 'hi');
});

test('bỏ qua sticker, ảnh, tin rỗng và thân hỏng', () => {
  assert.equal(docTinZalo({ ...thanWebhook('x'), event_name: 'message.sticker.received' }), null);
  assert.equal(docTinZalo(thanWebhook('   ')), null);
  assert.equal(docTinZalo(null), null);
  assert.equal(docTinZalo('chuoi'), null);
  assert.equal(docTinZalo({ event_name: 'message.text.received', message: { text: 'thiếu mã' } }), null);
});

// ---------- @tag ----------

test('bỏ chữ @tên bot ở đầu, giữa, khác hoa thường', () => {
  assert.deepEqual(boTagBot('@Bot Beeftown Translate hello bạn', 'Bot Beeftown Translate'), { conLai: 'hello bạn', coTag: true });
  assert.deepEqual(boTagBot('ok @bot beeftown translate dịch giúp', 'Bot Beeftown Translate'), { conLai: 'ok dịch giúp', coTag: true });
  assert.deepEqual(boTagBot('không tag', 'Bot Beeftown Translate'), { conLai: 'không tag', coTag: false });
});

// ---------- Ngôn ngữ (chu-va-so) ----------

test('đoán ngôn ngữ: Hàn, Việt có dấu, Anh', () => {
  assert.equal(doanNgonNgu('안녕하세요 오늘 뭐해요?'), 'ko');
  assert.equal(doanNgonNgu('ok 내일 봐요'), 'ko');
  assert.equal(doanNgonNgu('Đúng rồi, mai gặp nhé'), 'vi');
  assert.equal(doanNgonNgu('dừng lại'), 'vi');
  assert.equal(doanNgonNgu('See you tomorrow at 7pm'), 'en');
  assert.equal(doanNgonNgu('Giá 1.000.000đ'), 'vi');
});

test('chọn ngôn ngữ đích: Hàn → Anh (hoặc Việt), Anh/Việt → Hàn', () => {
  assert.equal(ngonNguDich('ko'), 'en');
  assert.equal(ngonNguDich('ko', 'vi'), 'vi');
  assert.equal(ngonNguDich('en'), 'ko');
  assert.equal(ngonNguDich('vi'), 'ko');
});

test('không dịch tin chỉ có link, số hay biểu tượng', () => {
  assert.equal(canDich('https://beeftown.vn/thuc-don'), false);
  assert.equal(canDich('1.000 😂😂'), false);
  assert.equal(canDich('xem https://beeftown.vn nhé'), true);
});

test('chia tin dài thành đoạn ≤ 2.000 ký tự, không mất chữ', () => {
  const dai = 'Một câu tiếng Việt có dấu. '.repeat(200);
  const doan = chiaDoan(dai);
  assert.ok(doan.length >= 3);
  assert.ok(doan.every(d => d.length <= 2000));
  assert.equal(doan.join(' ').replace(/\s+/g, ' ').trim(), dai.replace(/\s+/g, ' ').trim());
});

// ---------- Dịch và gửi ----------

test('tin tiếng Anh trong nhóm: gọi Claude dịch sang tiếng Hàn rồi gửi vào đúng nhóm', async () => {
  const { fetchGia, tinGui, goiClaude, goi } = taoFetchGia({ banDich: '내일 봐요!' });
  const { traVe } = await guiWebhook(thanWebhook('@Bot Beeftown Translate See you tomorrow!'), ENV_CLAUDE, fetchGia);
  assert.equal(traVe.status, 200);
  assert.deepEqual(tinGui(), ['🇰🇷 Khánh: 내일 봐요!']);
  const gui = goi.find(g => g.url.endsWith('/sendMessage'));
  assert.equal(gui?.than.chat_id, 'g-nhom');
  // Chữ @tag không lọt vào Claude; tiếng nguồn và đích đúng.
  const thanClaude = goiClaude()[0].than as { system: string; messages: { content: string }[]; model: string };
  assert.ok(!thanClaude.messages[0].content.includes('@Bot'));
  assert.match(thanClaude.system, /from English into Korean/);
  assert.equal(thanClaude.model, 'claude-opus-5-5');
});

test('tin tiếng Hàn: dịch sang tiếng Anh', async () => {
  const { fetchGia, tinGui, goiClaude } = taoFetchGia({ banDich: 'What are you doing today?' });
  await guiWebhook(thanWebhook('오늘 뭐해요?', { from: { id: 'u-han', display_name: 'Minho' } }), ENV_CLAUDE, fetchGia);
  assert.deepEqual(tinGui(), ['🇬🇧 Minho: What are you doing today?']);
  assert.match((goiClaude()[0].than as { system: string }).system, /from Korean into English/);
});

test('MO_HINH_CLAUDE đổi được model (ví dụ Haiku cho rẻ)', async () => {
  const { fetchGia, goiClaude } = taoFetchGia();
  await guiWebhook(thanWebhook('hello'), { ...ENV_CLAUDE, MO_HINH_CLAUDE: 'claude-haiku-5-5' }, fetchGia);
  assert.equal((goiClaude()[0].than as { model: string }).model, 'claude-haiku-5-5');
});

// ---------- quyen: webhook giả mạo ----------

test('quyen: webhook sai khóa, thiếu khóa bị từ chối 401 và không dịch, không gửi gì', async () => {
  const { fetchGia, goi } = taoFetchGia();
  const sai = await guiWebhook(thanWebhook('hello'), ENV_CLAUDE, fetchGia, 'khoa-sai');
  assert.equal(sai.traVe.status, 401);
  const thieu = await guiWebhook(thanWebhook('hello'), ENV_CLAUDE, fetchGia, '');
  assert.equal(thieu.traVe.status, 401);
  assert.equal(goi.length, 0);
});

test('quyen: khóa webhook suy từ token — đổi token thì khóa cũ hết hiệu lực', async () => {
  const cu = await khoaWebhook(TOKEN);
  const moi = await khoaWebhook('1234567890:token-moi');
  assert.notEqual(cu, moi);
  assert.equal(cu.length, 48);
  assert.equal(soBiMat(cu, cu), true);
  assert.equal(soBiMat(cu, moi), false);
  assert.equal(soBiMat('', ''), false);
});

test('quyen: không dịch tin do chính bot (hoặc bot khác) gửi — tránh vòng lặp', async () => {
  const { fetchGia, goi } = taoFetchGia();
  await guiWebhook(thanWebhook('hello', { from: { id: 'bot', display_name: 'Bot', is_bot: true } }), ENV_CLAUDE, fetchGia);
  assert.equal(goi.length, 0);
});

test('quyen: không dịch lại tin trông như bản dịch hay câu báo hỏng của bot — chặn vòng lặp kể cả khi Zalo không gắn is_bot', async () => {
  const { fetchGia, goi } = taoFetchGia();
  for (const noiDung of ['🇰🇷 Khánh: 내일 봐요!', '🇬🇧 Minho: See you', CAU_DICH_HONG]) {
    assert.equal(await xuLyTin(docTinZalo(thanWebhook(noiDung))!, ENV_CLAUDE, fetchGia), 'bo-qua');
  }
  assert.equal(goi.length, 0);
});

test('quyen: thân không phải JSON trả 400; đường lạ trả 404', async () => {
  const { fetchGia } = taoFetchGia();
  const hong = await xuLyYeuCau(
    new Request('https://bot.thu.workers.dev/zalo', {
      method: 'POST',
      headers: { 'x-bot-api-secret-token': await khoaWebhook(TOKEN) },
      body: '{hong',
    }),
    ENV_CLAUDE,
    nguCanhGia(),
    fetchGia,
  );
  assert.equal(hong.status, 400);
  const la = await xuLyYeuCau(new Request('https://bot.thu.workers.dev/la'), ENV_CLAUDE, nguCanhGia(), fetchGia);
  assert.equal(la.status, 404);
});

// ---------- bam-hai-lan ----------

test('bam-hai-lan: Zalo gửi lại cùng một tin hai lần — chỉ dịch và gửi một lần', async () => {
  const { fetchGia, tinGui, goiClaude } = taoFetchGia();
  const than = thanWebhook('hello');
  await guiWebhook(than, ENV_CLAUDE, fetchGia);
  const lan2 = await guiWebhook(than, ENV_CLAUDE, fetchGia);
  assert.equal(lan2.traVe.status, 200);
  assert.equal(lan2.nguCanh.viec.length, 0);
  assert.equal(goiClaude().length, 1);
  assert.equal(tinGui().length, 1);
});

test('bam-hai-lan: bộ nhớ quên tin cũ sau thời hạn và không phình quá giới hạn', () => {
  const boNho = new BoNhoTinDaNhan(1000, 3);
  assert.equal(boNho.nhanLanDau('a', 0), true);
  assert.equal(boNho.nhanLanDau('a', 500), false);
  assert.equal(boNho.nhanLanDau('a', 2000), true);
  for (let i = 0; i < 50; i++) boNho.nhanLanDau(`t${i}`, 3000);
  assert.ok((boNho as unknown as { daNhan: Map<string, number> }).daNhan.size <= 5);
});

// ---------- mat-mang / cau-chu ----------

for (const che of ['loi-500', 'mat-mang', 'tu-choi', 'rong'] as const) {
  test(`mat-mang: Claude ${che} — gửi câu báo "chưa dịch được", không gửi bản dịch giả`, async () => {
    const { fetchGia, tinGui } = taoFetchGia({ claude: che });
    const ket = await xuLyTin(docTinZalo(thanWebhook('hello'))!, ENV_CLAUDE, fetchGia);
    assert.equal(ket, 'dich-hong');
    assert.deepEqual(tinGui(), [CAU_DICH_HONG]);
  });
}

test('mat-mang: Zalo lỗi khi gửi bản dịch — báo gui-hong, không ném lỗi làm sập Worker', async () => {
  const { fetchGia } = taoFetchGia({ zalo: 'loi' });
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('hello'))!, ENV_CLAUDE, fetchGia), 'gui-hong');
});

test('cau-chu: câu báo hỏng có cả tiếng Việt và tiếng Hàn, không nói "thành công"', () => {
  assert.match(CAU_DICH_HONG, /chưa dịch được/);
  assert.match(CAU_DICH_HONG, /번역하지 못했어요/);
  assert.doesNotMatch(CAU_DICH_HONG, /thành công/i);
});

// ---------- Chế độ ----------

test('CHI_DICH_KHI_TAG=1: trong nhóm bỏ qua tin không tag, vẫn dịch tin có tag và tin nhắn riêng', async () => {
  const env = { ...ENV_CLAUDE, CHI_DICH_KHI_TAG: '1' };
  const a = taoFetchGia();
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('hello'))!, env, a.fetchGia), 'bo-qua');
  assert.equal(a.goi.length, 0);
  const b = taoFetchGia();
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('@Bot Beeftown Translate hello'))!, env, b.fetchGia), 'da-dich');
  const c = taoFetchGia();
  const rieng = docTinZalo(thanWebhook('hello', { chat: { id: 'u1', chat_type: 'PRIVATE' } }))!;
  assert.equal(await xuLyTin(rieng, env, c.fetchGia), 'da-dich');
});

// ---------- Gemini ----------

const ENV_GEMINI: Env = { ZALO_BOT_TOKEN: TOKEN, GEMINI_API_KEY: 'AIza-thu', AI: { run: async () => ({ translated_text: 'x' }) } };

test('có GEMINI_API_KEY (không có khóa Claude): dịch bằng Gemini, khóa đi bằng header chứ không nằm trên URL', async () => {
  const { fetchGia, tinGui, goiGemini, goiClaude, headerGemini } = taoFetchGia({ banDich: '내일 봐요!' });
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('See you tomorrow!'))!, ENV_GEMINI, fetchGia), 'da-dich');
  assert.equal(goiClaude().length, 0);
  assert.equal(goiGemini().length, 1);
  const g = goiGemini()[0];
  assert.match(g.url, /models\/gemini-flash-latest:generateContent$/);
  assert.ok(!g.url.includes('AIza-thu'));
  assert.deepEqual(headerGemini, ['AIza-thu']);
  const than = g.than as { systemInstruction: { parts: { text: string }[] }; generationConfig: { thinkingConfig?: unknown } };
  assert.match(than.systemInstruction.parts[0].text, /from English into Korean/);
  assert.deepEqual(than.generationConfig.thinkingConfig, { thinkingLevel: 'LOW' });
  // Phần "suy nghĩ" (thought: true) không lọt vào bản dịch.
  assert.deepEqual(tinGui(), ['🇰🇷 Khánh: 내일 봐요!']);
});

test('cấu hình đang chạy (wrangler.jsonc): tin tiếng Hàn dịch sang tiếng Việt, tin tiếng Việt dịch sang tiếng Hàn', async () => {
  const cauHinh = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const giaTri = cauHinh.match(/"DICH_TIENG_HAN_SANG":\s*"(\w+)"/)?.[1];
  assert.equal(giaTri, 'vi');
  const env = { ...ENV_GEMINI, DICH_TIENG_HAN_SANG: giaTri };

  const han = taoFetchGia({ banDich: 'Hôm nay bạn làm gì?' });
  const tinHan = docTinZalo(thanWebhook('오늘 뭐해요?', { from: { id: 'u-han', display_name: 'Minho' } }))!;
  assert.equal(await xuLyTin(tinHan, env, han.fetchGia), 'da-dich');
  const loiNhacHan = (han.goiGemini()[0].than as { systemInstruction: { parts: { text: string }[] } }).systemInstruction.parts[0].text;
  assert.match(loiNhacHan, /from Korean into Vietnamese/);
  assert.deepEqual(han.tinGui(), ['🇻🇳 Minho: Hôm nay bạn làm gì?']);

  const viet = taoFetchGia({ banDich: '오늘 뭐 해요?' });
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('Hôm nay bạn làm gì?'))!, env, viet.fetchGia), 'da-dich');
  const loiNhacViet = (viet.goiGemini()[0].than as { systemInstruction: { parts: { text: string }[] } }).systemInstruction.parts[0].text;
  assert.match(loiNhacViet, /from Vietnamese into Korean/);
  assert.deepEqual(viet.tinGui(), ['🇰🇷 Khánh: 오늘 뭐 해요?']);
});

test('GEMINI_MODEL đổi được model; model không nhận mức suy nghĩ thì gọi lại một lần không kèm', async () => {
  const { fetchGia, goiGemini, tinGui } = taoFetchGia({ gemini: 'khong-nhan-muc-nghi' });
  const env = { ...ENV_GEMINI, GEMINI_MODEL: 'gemini-2.5-flash' };
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('hello'))!, env, fetchGia), 'da-dich');
  assert.equal(goiGemini().length, 2);
  assert.match(goiGemini()[0].url, /gemini-2\.5-flash/);
  assert.equal((goiGemini()[1].than as { generationConfig: { thinkingConfig?: unknown } }).generationConfig.thinkingConfig, undefined);
  assert.equal(tinGui().length, 1);
});

test('có cả khóa Claude và Gemini: dùng Claude', async () => {
  const { fetchGia, goiClaude, goiGemini } = taoFetchGia();
  await xuLyTin(docTinZalo(thanWebhook('hello'))!, { ...ENV_GEMINI, ANTHROPIC_API_KEY: 'sk-ant-thu' }, fetchGia);
  assert.equal(goiClaude().length, 1);
  assert.equal(goiGemini().length, 0);
});

for (const che of ['loi-500', 'mat-mang', 'chan', 'dung-giua', 'rong', 'khoa-sai'] as const) {
  test(`mat-mang: Gemini ${che} — gửi câu báo "chưa dịch được", không gửi bản dịch giả`, async () => {
    const { fetchGia, tinGui } = taoFetchGia({ gemini: che });
    assert.equal(await xuLyTin(docTinZalo(thanWebhook('hello'))!, ENV_GEMINI, fetchGia), 'dich-hong');
    assert.deepEqual(tinGui(), [CAU_DICH_HONG]);
  });
}

test('/cai-dat ghi rõ máy dịch đang dùng là Gemini', async () => {
  const { fetchGia } = taoFetchGia();
  const traVe = await xuLyYeuCau(new Request('https://bot.thu.workers.dev/cai-dat'), ENV_GEMINI, nguCanhGia(), fetchGia);
  assert.match(await traVe.text(), /Máy dịch: Gemini\./);
});

test('chưa có khóa Claude hay Gemini: dịch bằng Workers AI', async () => {
  const { fetchGia, tinGui, goiClaude } = taoFetchGia();
  const goiAi: unknown[] = [];
  const env: Env = {
    ZALO_BOT_TOKEN: TOKEN,
    AI: { run: async (model, dauVao) => (goiAi.push({ model, dauVao }), { translated_text: '안녕' }) },
  };
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('hello'))!, env, fetchGia), 'da-dich');
  assert.equal(goiClaude().length, 0);
  assert.deepEqual(goiAi, [{ model: '@cf/meta/m2m100-1.2b', dauVao: { text: 'hello', source_lang: 'en', target_lang: 'ko' } }]);
  assert.deepEqual(tinGui(), ['🇰🇷 Khánh: 안녕']);
});

test('không có máy dịch nào: báo chưa dịch được', async () => {
  const { fetchGia, tinGui } = taoFetchGia();
  assert.equal(await xuLyTin(docTinZalo(thanWebhook('hello'))!, { ZALO_BOT_TOKEN: TOKEN }, fetchGia), 'dich-hong');
  assert.deepEqual(tinGui(), [CAU_DICH_HONG]);
});

// ---------- /cai-dat ----------

test('/cai-dat đăng ký webhook về đúng địa chỉ /zalo với khóa suy từ token, không lộ token', async () => {
  const { fetchGia, goi } = taoFetchGia();
  const traVe = await xuLyYeuCau(new Request('https://bot.thu.workers.dev/cai-dat'), ENV_CLAUDE, nguCanhGia(), fetchGia);
  assert.equal(traVe.status, 200);
  const chu = await traVe.text();
  assert.match(chu, /Đã đăng ký webhook https:\/\/bot\.thu\.workers\.dev\/zalo/);
  assert.ok(!chu.includes(TOKEN));
  const dangKy = goi.find(g => g.url.endsWith('/setWebhook'));
  assert.deepEqual(dangKy?.than, { url: 'https://bot.thu.workers.dev/zalo', secret_token: await khoaWebhook(TOKEN) });
});

test('/cai-dat khi Zalo lỗi: báo chưa đăng ký được, không báo thành công', async () => {
  const { fetchGia } = taoFetchGia({ zalo: 'loi' });
  const traVe = await xuLyYeuCau(new Request('https://bot.thu.workers.dev/cai-dat'), ENV_CLAUDE, nguCanhGia(), fetchGia);
  assert.equal(traVe.status, 502);
  assert.match(await traVe.text(), /Chưa đăng ký được webhook/);
});

test('thiếu ZALO_BOT_TOKEN: trang chủ và /cai-dat nói rõ thiếu gì', async () => {
  const { fetchGia } = taoFetchGia();
  const chu = await (await xuLyYeuCau(new Request('https://bot.thu.workers.dev/'), {}, nguCanhGia(), fetchGia)).text();
  assert.match(chu, /CHƯA có ZALO_BOT_TOKEN/);
  const caiDat = await xuLyYeuCau(new Request('https://bot.thu.workers.dev/cai-dat'), {}, nguCanhGia(), fetchGia);
  assert.equal(caiDat.status, 500);
});
