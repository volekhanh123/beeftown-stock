/**
 * KHO — TỆP EXCEL (.xlsx) TỐI GIẢN, KHÔNG THƯ VIỆN (thuần, chỉ web)
 *
 * Dùng cho file "Thêm món từ file" của FABi (lib/kho/thu-ngan.ts → /noi-bo/kho/ban-ipos/mon-fabi.xlsx):
 * FABi chỉ nhận .xlsx, không nhận CSV. Repo không có thư viện Excel và không cần thêm: một .xlsx là gói
 * zip các file XML (Office Open XML, ECMA-376). File này ghi đúng phần tối thiểu mọi trình đọc chấp nhận:
 * [Content_Types].xml, _rels/.rels, xl/workbook.xml, xl/_rels/workbook.xml.rels, xl/styles.xml,
 * xl/sharedStrings.xml, xl/worksheets/sheet<N>.xml.
 *   · Chữ đi qua sharedStrings (ô kiểu "s") — Excel, SheetJS, Apache POI đều đọc; "01011" là chữ, giữ nguyên
 *     số 0 đầu. Số (giá) là ô số. Ô trống không ghi.
 *   · Chữ chuẩn hóa NFC, thoát & < > " ', bỏ ký tự điều khiển XML 1.0 không cho phép.
 *   · Zip KHÔNG nén (STORE), CRC-32 tự tính, cờ UTF-8; ngày giờ trong zip cố định 01/01/1980 — cùng nội
 *     dung ra cùng byte (kiểm thử so được, crm/test/test-kho-ipos-ma-can.mjs).
 */

export type GiaTriO = string | number | null | undefined;
export interface TrangTinh {
  /** Tên trang (sheet): 1–31 ký tự, không chứa : \ / ? * [ ]. */
  ten: string;
  hang: readonly (readonly GiaTriO[])[];
}

const BANG_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 (đa thức zip / PNG). */
export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (const x of b) c = BANG_CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Tên cột Excel của chỉ số cột (từ 0): 0 → A, 25 → Z, 26 → AA. */
export function tenCot(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function thoatXml(s: string): string {
  return s.normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const DAU_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS_CHINH = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_QUAN_HE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_GOI = 'http://schemas.openxmlformats.org/package/2006/relationships';
const KIEU_OOXML = 'application/vnd.openxmlformats-officedocument.spreadsheetml';

/** Gói zip không nén (STORE). Tên file ASCII / UTF-8 (cờ bit 11). */
function taoZip(tep: readonly { ten: string; noiDung: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  const ma = new TextEncoder();
  const NGAY_DOS = (0 << 9) | (1 << 5) | 1;   // 01/01/1980
  const phan: Uint8Array[] = [];
  const thuMuc: Uint8Array[] = [];
  let viTri = 0;
  for (const t of tep) {
    const ten = ma.encode(t.ten);
    const crc = crc32(t.noiDung);
    const dau = new DataView(new ArrayBuffer(30));
    dau.setUint32(0, 0x04034b50, true); dau.setUint16(4, 20, true); dau.setUint16(6, 0x0800, true);
    dau.setUint16(8, 0, true); dau.setUint16(10, 0, true); dau.setUint16(12, NGAY_DOS, true);
    dau.setUint32(14, crc, true); dau.setUint32(18, t.noiDung.length, true); dau.setUint32(22, t.noiDung.length, true);
    dau.setUint16(26, ten.length, true); dau.setUint16(28, 0, true);
    const tt = new DataView(new ArrayBuffer(46));
    tt.setUint32(0, 0x02014b50, true); tt.setUint16(4, 20, true); tt.setUint16(6, 20, true); tt.setUint16(8, 0x0800, true);
    tt.setUint16(10, 0, true); tt.setUint16(12, 0, true); tt.setUint16(14, NGAY_DOS, true);
    tt.setUint32(16, crc, true); tt.setUint32(20, t.noiDung.length, true); tt.setUint32(24, t.noiDung.length, true);
    tt.setUint16(28, ten.length, true); tt.setUint16(30, 0, true); tt.setUint16(32, 0, true); tt.setUint16(34, 0, true);
    tt.setUint16(36, 0, true); tt.setUint32(38, 0, true); tt.setUint32(42, viTri, true);
    phan.push(new Uint8Array(dau.buffer), ten, t.noiDung);
    thuMuc.push(new Uint8Array(tt.buffer), ten);
    viTri += 30 + ten.length + t.noiDung.length;
  }
  const coThuMuc = thuMuc.reduce((s, x) => s + x.length, 0);
  const cuoi = new DataView(new ArrayBuffer(22));
  cuoi.setUint32(0, 0x06054b50, true); cuoi.setUint16(4, 0, true); cuoi.setUint16(6, 0, true);
  cuoi.setUint16(8, tep.length, true); cuoi.setUint16(10, tep.length, true);
  cuoi.setUint32(12, coThuMuc, true); cuoi.setUint32(16, viTri, true); cuoi.setUint16(20, 0, true);
  const tatCa = [...phan, ...thuMuc, new Uint8Array(cuoi.buffer)];
  const ra = new Uint8Array(tatCa.reduce((s, x) => s + x.length, 0));
  let o = 0;
  for (const x of tatCa) { ra.set(x, o); o += x.length; }
  return ra;
}

/** Một sổ Excel từ các trang tính. Tên trang sai hay trùng, số không hữu hạn → ném lỗi (lỗi của người gọi). */
export function taoTepExcel(trang: readonly TrangTinh[]): Uint8Array<ArrayBuffer> {
  if (trang.length === 0) throw new Error('Sổ Excel cần ít nhất một trang');
  const tenDaCo = new Set<string>();
  for (const t of trang) {
    if (!/^[^:\\/?*[\]]{1,31}$/.test(t.ten) || tenDaCo.has(t.ten.toLowerCase())) throw new Error(`Tên trang Excel không hợp lệ: ${t.ten}`);
    tenDaCo.add(t.ten.toLowerCase());
  }
  const chu: string[] = [];
  const soChu = new Map<string, number>();
  let soO = 0;
  const viTriChu = (s: string) => {
    let i = soChu.get(s);
    if (i === undefined) { i = chu.length; chu.push(s); soChu.set(s, i); }
    soO++;
    return i;
  };
  const trangXml = trang.map(t => {
    const hang = t.hang.map((h, r) => {
      const o = h.map((v, c) => {
        if (v === null || v === undefined || v === '') return '';
        const ref = `${tenCot(c)}${r + 1}`;
        if (typeof v === 'number') {
          if (!Number.isFinite(v)) throw new Error(`Ô ${ref} không phải số hữu hạn`);
          return `<c r="${ref}"><v>${v}</v></c>`;
        }
        return `<c r="${ref}" t="s"><v>${viTriChu(String(v).normalize('NFC'))}</v></c>`;
      }).join('');
      return `<row r="${r + 1}">${o}</row>`;
    }).join('');
    return `${DAU_XML}<worksheet xmlns="${NS_CHINH}"><sheetData>${hang}</sheetData></worksheet>`;
  });
  const n = trang.length;
  const xml: { ten: string; noiDung: string }[] = [
    { ten: '[Content_Types].xml', noiDung: `${DAU_XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + `<Override PartName="/xl/workbook.xml" ContentType="${KIEU_OOXML}.sheet.main+xml"/>`
      + trang.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="${KIEU_OOXML}.worksheet+xml"/>`).join('')
      + `<Override PartName="/xl/styles.xml" ContentType="${KIEU_OOXML}.styles+xml"/>`
      + `<Override PartName="/xl/sharedStrings.xml" ContentType="${KIEU_OOXML}.sharedStrings+xml"/>`
      + '</Types>' },
    { ten: '_rels/.rels', noiDung: `${DAU_XML}<Relationships xmlns="${NS_GOI}">`
      + `<Relationship Id="rId1" Type="${NS_QUAN_HE}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { ten: 'xl/workbook.xml', noiDung: `${DAU_XML}<workbook xmlns="${NS_CHINH}" xmlns:r="${NS_QUAN_HE}"><sheets>`
      + trang.map((t, i) => `<sheet name="${thoatXml(t.ten)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
      + '</sheets></workbook>' },
    { ten: 'xl/_rels/workbook.xml.rels', noiDung: `${DAU_XML}<Relationships xmlns="${NS_GOI}">`
      + trang.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_QUAN_HE}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
      + `<Relationship Id="rId${n + 1}" Type="${NS_QUAN_HE}/styles" Target="styles.xml"/>`
      + `<Relationship Id="rId${n + 2}" Type="${NS_QUAN_HE}/sharedStrings" Target="sharedStrings.xml"/></Relationships>` },
    { ten: 'xl/styles.xml', noiDung: `${DAU_XML}<styleSheet xmlns="${NS_CHINH}">`
      + '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>'
      + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
      + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>'
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
    ...trangXml.map((x, i) => ({ ten: `xl/worksheets/sheet${i + 1}.xml`, noiDung: x })),
    { ten: 'xl/sharedStrings.xml', noiDung: `${DAU_XML}<sst xmlns="${NS_CHINH}" count="${soO}" uniqueCount="${chu.length}">`
      + chu.map(s => `<si><t xml:space="preserve">${thoatXml(s)}</t></si>`).join('') + '</sst>' },
  ];
  const ma = new TextEncoder();
  return taoZip(xml.map(x => ({ ten: x.ten, noiDung: ma.encode(x.noiDung) })));
}

/** Kiểu nội dung (MIME) của file .xlsx. */
export const KIEU_XLSX = `${KIEU_OOXML}.sheet`;
