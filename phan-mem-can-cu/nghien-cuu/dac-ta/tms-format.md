# TM-xA ".TMS" data file — full read/write specification

Reverse-engineered from "TM-xA Management Program" v3.10 (JHScale, decompiled with ILSpy), checked against the
factory sample files, the Access DB dumps and the scale manuals. Target: the Beeftown TM-A label scale
(firmware V3.14E8) and our tool `C:\Beeftown\cong-cu\Beeftown_Can_TMA.html`.

## 0. Conventions and sources

| Abbreviation | Path |
|---|---|
| `SRC/` | `...\scratchpad\tmxa-src\ECS\` (decompiled C#) |
| `SRCROOT/` | `...\scratchpad\tmxa-src\` (app.config, `MyBarItemBox\`, *.resx) |
| `INST/` | `C:\Users\khanh\Downloads\tma co hsd2\tma co hsd2\` (read-only install) |
| `SAMPLE` | `INST/Config/en/_ECS.TMS` (es/ru/zh-CHS/zh-CHT have the same layout; **pt differs**, see §2.2 [verified-fix]) |
| `REAL` | [verified-add] `C:\Users\khanh\OneDrive - CÔNG TY CỔ PHẦN GREEN SPEED\Desktop\A_000.TMS`: a **real USB export written by the Beeftown scale** (firmware V3.14E8, `TIM` = 2026-09-26 20:25:43, file mtime 2013-08-09 = the scale's fixed FAT timestamp). Byte-identical copies: `Documents\Beeftown Can\A_000.TMS` and `...\da-gui\20260928-000207.TMS`. It holds the shop's WiFi SSID/password (TMT 15/16) and salesman data: values are never quoted here, only structure. See §2.2b. |
| `TEAMTEST` | [verified-add] The team's notes from tests on the real scale (26/09/2026, V3.14E8): `C:\Beeftown\.claude\worktrees\can-dich-nguoc\web\README.md:216-217`, `...\can-app\README.md:47-53`, `...\can-app\src\nghiep-vu.ts:19-22`, `...\web\public\kho\can-wifi\Nap-Can-WiFi.ps1:9-17`. This is real-device evidence, but it comes from the team and not from vendor code. |
| `DUMP/` | `...\scratchpad\mdb\dump\` (`A_en_Default` = `INST/Config/en/Default.mdb`) |
| `TOOL` | `C:\Beeftown\cong-cu\Beeftown_Can_TMA.html` |
| `MANUAL` | `INST/Document/User Manual/Printing Serial Scale V2.50A.pdf` (V3.04A has the same text). Page numbers are PDF page numbers, not the printed ones. |

- **CONFIRMED** means seen in code or data (the citation is given).
- **INFERRED** means reasoned from indirect evidence. It is not seen in code, and in most cases it is scale-firmware behaviour, which the PC code cannot show.
- Column numbers are **split indexes**: `line.split('\t')[i]`. Index 0 is the tag (`PLU`, `LAB`, ...). Every record ends with a tab, so the last split element is always `''`.
- This scratchpad contains no product names from the vendor databases. The only product names used below are Beeftown's own.

---

## 1. What a .TMS file is (the key insight)

A .TMS file is a **recorded command stream**. It uses the same line protocol that the program speaks to the scale over TCP and RS-232:

| Tag at column 0 | Meaning | Direction | Evidence |
|---|---|---|---|
| `DWL\t<SEC>\t` | "download" = start sending section `<SEC>` from the PC to the scale | PC→scale | SaveForm.cs:956 etc.; NetForm.cs:3279 etc. |
| `END\t<SEC>\t` | end of section `<SEC>` | both | SaveForm.cs:964 etc. |
| `CLR\t<SEC>\t` + `CLR\tEND\t` | **clear (wipe) the whole table `<SEC>`** on the scale | PC→scale | SaveForm.cs:950-953, 1047-1051 |
| `UPL\t<SEC>\t` | "upload" = the PC asks the scale for section `<SEC>`. The scale answers with data lines and then `END...`. The PC closes the exchange with `UPL\tEND\t`. | PC→scale (request) | SaveForm.cs:1737-1777; NetForm.cs:2495-2542 |
| `ECS\tVER\t100\t` | file header (file only; never sent on serial or TCP) | file | SaveForm.cs:947 |
| `END\tECS\t` | file trailer (file only) | file | SaveForm.cs:1224 |
| `LAE\t` | end of one label block inside `LAB` | both | SaveForm.cs:1103 |
| `ASK\tREP\t` / `ASK\tPLU\t<plu>\t<code>\t<index>\t` | unsolicited request from the scale (TCP only) | scale→PC | NetForm.cs:821-860, 794-818 |
| `UDP\t` | UDP discovery broadcast | PC→LAN | NetForm.cs:4296 |

The same text is sent over the network. NetForm.cs:3667-3689 even streams a whole .TMS file character by character over TCP ("TMS File" download), and SaveToSerial (SaveForm.cs:1285-1565) writes the same records to the COM port. **"XD1" appears nowhere** in the decompiled source or in any install data file. See §2.4.

---

## 2. File envelope

### 2.1 Bytes written by the PC program (SaveForm.SaveToFile, SaveForm.cs:928-1239) — CONFIRMED

```
EF BB BF                    UTF-8 BOM (StreamWriter preamble, Encoding "utf-8")
\r\n                        one empty line            (SaveForm.cs:946 streamWriter.WriteLine())
ECS\tVER\t100\t\r\n        header                     (SaveForm.cs:947)
[CLR\t<SEC>\t\r\nCLR\tEND\t\r\n]   optional, only when "Clear Data" is ticked
DWL\t<SEC>\t\r\n
<SEC>\t...\t\r\n  (0..n records)
END\t<SEC>\t\r\n
... more sections, no blank lines between them ...
[wizard stream]             (SaveForm.cs:1220-1223, Program.sWizard; starts with \r\n)
END\tECS\t\r\n              (SaveForm.cs:1224)
```

- **Encoding**: `Program.GetEncoding()` = `Encoding.GetEncoding(Settings.configEncoding)` (Program.cs:105-108).
  - `configEncoding` comes from `INST/Config/Config.xml`, and it is `utf-8` for every language (en/es/pt/ru/zh-CHS/zh-CHT).
  - The user config also has `utf-8` (`INST/user_config.bck` line 57-58).
  - The .NET "utf-8" encoding emits a BOM. So a PC-made file is **UTF-8 with BOM**. There is no UTF-16.
  - Exception: TMT 15 (WiFi SSID) is always written in UTF-8, even when the config encoding is something else. The writer re-opens the file just for that line (SaveForm.cs:979-986; NetForm.cs:3319-3323 uses a second `swutf` writer).
- **Line ending**: `WriteLine` uses `Environment.NewLine` = **CRLF**. The serial port also sets `NewLine = Environment.NewLine` (SaveForm.cs:1260).
- **Trailing tab**: every record format string ends with `\t` (e.g. `"TMS\t{0}\t{1}\t"`). So every non-empty line ends with a TAB, including `LAE\t`, `DWL\tX\t` and `END\tX\t`. SAMPLE has 0 non-empty lines without a trailing tab (checked with a script).
- **Atomic write**: the PC writes to `<app>\Tm-xA.tmp`, then does `File.Copy(tmp, target, overwrite)`, then deletes the tmp (SaveForm.cs:936, 945, 1226, 1236). The target folder is created if it is missing (SaveForm.cs:940-944).
- **Serial and TCP streams** start with one empty line, and they carry **no** `ECS VER` header and **no** `END ECS` (SaveForm.cs:1287; NetForm.cs:3270, 3774). Before a serial transfer the PC sends the handshake `UPL\tTIM\t` and waits for `END`, then sends `UPL\tEND\t` (SaveForm.cs:1262-1284).
- [verified-add] **The streams also begin with a BOM.** In UTF-8 mode the serial and TCP writers are `new StreamWriter(<non-seekable stream>, Encoding.UTF8-instance)` (SaveForm.cs:1285; NetForm.cs:124-134). .NET writes the preamble on the first flush of a non-seekable stream, so the vendor's own stream to the scale starts `EF BB BF 0D 0A`. INFERRED: the scale's line parser tolerates a leading BOM, so a BOM at the start of a USB file is almost certainly harmless too.
- [verified-add] The "TMS File" TCP option (NetForm.cs:3667-3689) reads the whole file with `File.ReadAllText`, which strips the BOM, and writes it into the open stream, including its `ECS VER`/`END ECS` lines. After any download the PC sends an empty line plus `UPL\tTIM\t` and waits up to 30 s for the answer ("pw_WaitingDeviceUpdate", NetForm.cs:3772-3780). That is how the vendor knows the scale has finished applying the data. The team's tool closes the socket instead.

### 2.2 The sample file SAMPLE — CONFIRMED by byte dump

- It starts `EF BB BF 0D 0A 45 43 53 09 56 45 52 09 31 30 30 09 0D 0A`, i.e. BOM, empty line, `ECS\tVER\t100\t`.
- It has 2877 CRLFs, 0 bare LFs, and ends with `END\tECS\t\r\n`.
- Its layout **differs from SaveToFile**:
  - It has an **empty line between sections**.
  - Its order is `DPT, CLS, PLU(empty), UNT(empty), BAR, LAB, SAL(empty), TMS, TMT`.
  - It contains a `UNT` section, which this program version never writes.
  - Its `CLS` lines have only 3 data fields (the current writer has 9).
  - It contains all 500 `TMS` rows, although only 3 Spec rows in the DB are `Valid`. The current writer outputs only Valid rows (SaveForm.cs:959).
- So SAMPLE was produced by an older/other writer. Its layout matches the one the team reconstructed from the real V3.14E8 USB export (`C:\Beeftown\supabase\test\test-kho-can.mjs:44-72`: blank line between sections, order `DPT, CLS, PLU, UNT, BAR, LAB, SAL, REP, SCP, TMS, TMT, INF, TIM`). INFERRED: the scale's own "save to USB" writer uses this layout.
  - [verified-fix] Now **CONFIRMED only for the blank lines and the section order**, using the real export (§2.2b). SAMPLE is **not** a faithful copy of a scale export. The real file has no BOM, no leading empty line, `VER` = firmware string, 9-field CLS lines and DPT/CLS IDs 1-9, and it has REP, SCP, INF and TIM sections.
- [verified-fix] **The languages are not all identical.** `pt/_ECS.TMS` has 9 DPT and 9 CLS rows (IDs 6-8 = "Reservado"), and its CLS lines have the **full 9 data fields** (`CLS\t1\tDiversos-Peso\t1\t0\t0\t0\t0\t0\t0\t`), like REAL. Its accented letters are stored as U+FFFD (EF BF BD), so the vendor's pt template is itself mojibake. `es` has one extra empty line (lines 2339-2340), and `zh-CHS` has 2280 LAS rows instead of 2230. All six have the BOM + empty line + `ECS\tVER\t100\t` start, and none contains `\v`.
- The Default.mdb dump matches SAMPLE exactly:
  - 500/500 TMS values equal `DUMP/A_en_Default/Spec.tsv`.
  - 28/28 TMT values equal `String.tsv`.
  - 10 BAR lines equal `Barcode.tsv`.
  - 33 LAB lines and all 2230 LAS lines equal `Label.tsv` / `LabelItem.tsv`, with Width/Height = file × 8.
  - DPT and CLS match too.
  - SAMPLE is literally the source the program imports into an empty DB on first start (RDS.cs:1215-1232 reads `Config\<lang>\_ECS.TMS` with encoding "utf-8" when the Spec table is empty).
  - [verified-fix] "Matches exactly" holds **line by line for what SAMPLE contains** (re-checked: 500/500 TMS, 28/28 TMT, 10/10 BAR, 33/33 LAB, 2230/2230 LAS). Default.mdb, however, is a **superset**: it was modified 2026-01-30, while SAMPLE is dated 2018-08-21. It has **7 PLU rows** (SAMPLE's PLU section is empty), 12 barcodes, 38 labels and 2398 label items. Also `String.Valid` is False for all 28 rows, so the PC would write **no** TMT lines from this DB.
  - [verified-add] On that first-start import `oldData.Spec` is empty, so every TMS row is added with `Valid = false` (RDS.cs:739-750). This explains why almost no Spec rows are Valid (only 104-106, set later).

### 2.2b The real scale export REAL (V3.14E8) — [verified-add], CONFIRMED by byte dump

| Property | Value |
|---|---|
| Size / lines | 39 142 bytes, 1514 CRLF, 0 bare LF, 0 `\v`, valid UTF-8, **no BOM** |
| Line 1 | `ECS\tVER\tV3.14E8\t` (the header is the **first** line, and `VER` = firmware version) |
| Layout | Header, then an empty line. After that, each section is `DWL\tX\t` … `END\tX\t` followed by an empty line. Last line `END\tECS\t` + CRLF. |
| Section order | `DPT, CLS, PLU, UNT(empty), BAR, LAB, SAL(empty), REP, SCP, TMS, TMT, INF, TIM` (13 × `DWL`; no `XD1`, no `CLR`, no `PAS`/`VIP`/`FNT`/`BMP`) |
| Field counts (split length) | DPT 4, CLS **11**, PLU **69**, BAR 9, LAB **40**, LAS 14, LAE 2, REP 11, RES 19, REE 2, SCP 5, TMS 4, TMT 4, INA 9, INM 5, INF 6, TIM 8. **Every** non-empty line ends with a tab. |
| DPT / CLS | IDs 1-9 (6-8 reserved); CLS = full 9-field form (`CLS\t<id>\t<name>\t<dept>\t0\t0\t0\t0\t0\t0\t`) |
| PLU | 6 rows, 67 data fields each; numeric columns identical to TOOL's template (§8.1) |
| BAR | IDs 1-9 + **28** (`QS-Item`, Num1 = 99999, `B201F501J500A000A000A000`). No BAR 0 (unlike SAMPLE). |
| LAB | IDs **1-9 = factory labels "PF-1".."PF-9"** (not the PC's 11000.. template IDs), plus 10, 11, 27, 28 (`BEEFTOWN`, 58×40 mm). All 40-element lines, i.e. the full Text1-32. |
| REP | 41 sales, FIDs 2..42, all unique |
| SCP | 199 rows: PageID **0..2**; KeyID 1..73 on page 0, 1..63 on pages 1-2 (see §4.3) |
| TMS | all 500 rows. Relevant values: 0 = 28, 1 = 28, 2 = 20, 42 = 1, 58 = 1, 105 = 0, 106 = 0, 200-203 = 3, 208 = 3, 209 = 2, 250 = 1, 499 = 1522729470 |
| TMT | 28 rows. TMT 15 (SSID) and TMT 16 (WiFi password) are non-empty, **in clear text** |
| INF section | `INA`, `INM`, `INF` (in that order) inside `DWL INF … END INF` (§4.16) |
| TIM | `TIM\t26\t9\t26\t20\t25\t43\t` = the moment of saving |

### 2.3 Header `ECS\tVER\t<v>\t`

- The PC always writes `100` (SaveForm.cs:947).
- According to the team's notes, the real scale export writes its firmware version there (`ECS\tVER\tV3.14E8\t`, test-kho-can.mjs:46). The V3.15C5 fixture adds an encoding field `UTF-8` (test-kho-can.mjs:187). This is UNVERIFIED because it is not in any vendor file available here.
  - [verified-fix] The V3.14E8 part is now **CONFIRMED** by REAL line 1: `ECS\tVER\tV3.14E8\t` (4 split elements, no encoding field). The V3.15C5 form with `UTF-8` is still only a hand-made fixture. In REAL the encoding is reported separately, in `INA` (`UTF-8`, §4.16).
- The PC reader **ignores the ECS line completely** (`case "ECS": break;`, RDS.cs:1110-1114). So the VER value has no meaning on import. What the scale does with it is unknown. INFERRED: `100` is safe, because the vendor program always sends it.

### 2.4 `DWL` vs `XD1`

- **DWL** = "download" (PC→scale data block). CONFIRMED in about 40 writer sites (SaveForm, NetForm, WizardForm, RDS).
- **XD1: NOT FOUND.**
  - `grep` over all decompiled code finds nothing.
  - A binary grep of the install finds only random byte hits inside `Easy Manual V2.36L.pdf` and a teaching-video .exe.
  - The only "XD1" in the Beeftown repo is a hand-made fixture (`supabase/test/test-kho-can.mjs:187`) and comments that repeat the claim (`TOOL:317`, `web/src/lib/kho/can-tma.ts:12`, `README.md:69`).
- The PC reader does not care what the opener is: it dispatches on the data tag only (RDS.cs:728-1127), so an `XD1` file would import fine into the PC. Whether the scale accepts `XD1` in a file is unknown.
- **Recommendation**: accept `XD1` (and any opener) when reading. Always write `DWL`.
- [verified-add] REAL, written by firmware V3.14E8 itself, opens all 13 sections with `DWL`. So `XD1` is unsupported by any evidence for V3.14E8. Its only source remains the team's hand-made "V3.15C5" fixture. A disk search found no other .TMS files, apart from the install templates and copies of REAL.

### 2.5 Section order and optional sections

- Every section is optional. The PC writes only the ticked ones (SaveForm.cs:948-1219).
- **PC writer order**: `TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB, SAL, FNT, BMP, VIP, Custom1..4, [wizard: DWL TMS / DWL BAR / DWL PAS / DWL TMT], END ECS`.
- **Scale export order** (INFERRED from the team's reconstruction and SAMPLE): `DPT, CLS, PLU, UNT, BAR, LAB, SAL, REP, SCP, TMS, TMT, INF, TIM, END ECS`.
  - [verified-fix] Now **CONFIRMED** by REAL (§2.2b). The INF section also carries `INA` and `INM` lines before `INF`.
- **The PC reader is order-independent**: it processes line by line, and a `LAS` binds to the last `LAB` seen (RDS.cs:1008, 1017-1022).
- INFERRED: the scale executes the stream **sequentially**, like a command stream. The Wizard closes and re-opens a section just to apply a spec in two steps: `TMS 250 1` / `END TMS` / `DWL TMS` / `TMS 250 2` (WizardForm.cs:1654-1657). It also interleaves `END TMS / DWL TMT / ... / DWL TMS` (WizardForm.cs:1709-1714, 1738-1742).
- A section may appear **more than once** (the wizard does this).
- **Dependency order** that is safe to write: `TMS` → `TMT` → `DPT` → `CLS` → `BAR` → `LAB` → `PLU` → `SCP`. Keeping the PC order is also fine, because references are by ID.

### 2.6 File names and folders

- PC "Export (TMS File)" on a drive: `<drive>\JHSCALE\A_<nnn>.TMS`, with `nnn` = 3-digit number 000–999 (`$"JHSCALE\\A_{n:d3}.TMS"`, SaveForm.cs:493).
- With **"Boot File"** ticked (`updateCheckBox`, Lang `pw_BootFile`), the name is literally `JHSCALE\A_xxx.TMS` (SaveForm.cs:487-490).
- MANUAL PDF p.69: `A_xxx.TMS` is the **auto-update file**. If "USB-Disk Auto Update" is on (**Spec 42** = 1, the factory default per the manual; Tm.xml Spec_Info 42), the scale loads it at power-on when it finds it.
  - In menu **P41 U-Disk**, key 【×】 selects `A_xxx.TMS`, or a typed number selects `A_000.TMS`…`A_999.TMS`.
  - 【Confirm】 = load (screen "Dw-Data": error count / OK count / bytes / state).
  - 【Amend】 = **save the scale's working data** to that file ("Up-Data").
  - 【PLU】 = save the not-yet-uploaded sale list. 【F-Prog】+【PLU】 = save every sale that has not been deleted (MANUAL p.69-70).
  - [verified-add] The load screen shows "Number of Error Data / Number of Right Data / Number of Bytes". MANUAL p.69 Note 1: "Normally, the amount of error commands should be 0". This is more support for the command-stream model: each line is counted as one command. Use it as the acceptance test after a USB load.
  - [verified-add] The power-on auto-load (Spec 42 = 1; REAL has 42 = 1) applies to the **auto-update file `A_xxx.TMS`** (MANUAL p.69). TOOL's UI note (TOOL:298: leave the USB unplugged at power-on "because the scale auto-loads A_000.TMS") contradicts the manual. INFERRED: `A_000.TMS` is only loaded through P41. The caution is harmless, but the wording is probably wrong.
- Custom path: any name through the file dialog; the filter is `TMS File (*.TMS)|*.tms` (SaveForm.cs:817-827; Lang `pw_TMSFile___TMS____tms_AllFile_________`).
- **Other TMS-format files**:
  - `INST/Config/<lang>/_ECS.TMS` (factory template, see §2.2).
  - The sales file that the scale saves to USB. The PC imports it in the Report window through a file dialog (ReportForm.cs:5965-5972, 4888-4919). `GetInfo` identifies the scale from `INF` (store, device, number, version), `INM` (MAC, required: the device must already be known), `TIM`, `TMS 40` (machine number) and `TMT 0/1` (ReportForm.cs:5499-5595). The sales themselves are `REP/RES/REE` lines, parsed by RDS.NL_Log_Get (RDS.cs:2308-2567).
- Non-TMS side files:
  - `Tm-xA.tmp` (temp).
  - `Wizard.BIN` (BinaryFormatter dump of the wizard settings; it contains the wizard TMS stream as text, WizardForm.cs:1953-1957).
  - `ECSData.txt` (network log, NetForm.cs:3880).
  - `Report\LogError\yyMMddHHmmss_<MAC>.txt` (NetForm.cs:3940-3970).
  - The "TXT file" PLU import/export: a separate, user-defined format (`CODE_<enc>` + `FILE_PLU#...` mini-language; TXTForm.cs:233-300, TXTEditorForm.cs:1307-1322, Common.cs:581/916). It is **not** TMS and the scale never reads it.

---

## 3. Scalar encodings

| Kind | Writer | Reader | Notes |
|---|---|---|---|
| int | `{n}` → `int.ToString()` | `Program.ParseInt` → `int.TryParse`, **0 on failure** (Program.cs:168-185) | Empty field → 0, *not* the DB default. Negative OK (`-1`). [verified-add] Leading zeros are not kept: `01234` reads as 1234. This matters for PLU col 2 (item code, DB Int32, max 99 999 999): a code with a leading zero cannot round-trip as text. |
| **decimal** ("mantissa,decimals") | `Program.FormatDecimal(d, fmt)` (Program.cs:530-557) | `Program.ParseDecimal` (Program.cs:229-251) | See the algorithm below. |
| string | `Program.FormatString(s)` = replace CRLF with `\v` (0x0B) (Program.cs:525-528) | `Program.ParseString` = replace `\v` with CRLF (Program.cs:224-227) | **TAB is never escaped.** A tab inside a value corrupts the line, so writers must strip tabs, CR and LF. Only PLU Name/Text1-7 and LAB Text1-32 go through FormatString; names in DPT/CLS/BAR/LAB/SAL and TMT values are written raw. |
| boolean | none are serialized; flags are ints 0/1 or bit masks | | The DB `Valid` columns never go to the file. |
| date/time | `TIM\tyy\tM\td\tH\tm\ts\t` (year % 100, no zero padding) (NetForm.cs:2322) | year+2000 (NetForm.cs:2360-2365) | PLU times are HHMM ints (0..2359); day masks are bit sets, see §7. |
| binary blobs (FNT, VER, BMP) | each byte → 2 chars `(char)(64 + b>>4)`, `(char)(64 + b&15)`, i.e. letters `@`..`O` (Program.cs:125-139; SaveForm.cs:1131-1140) | | Multi-byte ints are little-endian (`getByte_multi`). |
| packed decimal (Spec Type 3, e.g. Spec 297) | `mantissa*8 + decimals` stored as one int (Program.cs:570-598; SpecForm.cs:295-313) | | INFERRED to be the scale's internal number format (3-bit decimal count). |

### 3.1 FormatDecimal exactly (CONFIRMED, Program.cs:530-557; emulated in `scratchpad/work/plu.py`)

```
1. if fmt==Price  : d = Math.Round(d, Settings.Format_Price)   // banker's rounding (ToEven)
   if fmt==Weight : d = Math.Round(d, Settings.Format_Weight)
   if fmt==None   : no rounding
2. if d > 9 999 999 or d < -9 999 999  -> return "0,0"          // silently zeroed!
3. n = 0; m = d
   while |m| <= 999999.9 and m is not an integer and n < 7: m *= 10; n++
4. return Convert.ToInt32(m) + "," + n                           // ToInt32 also rounds half-to-even
```

- `Format_Price` default = 2 and `Format_Weight` default = 3 (`SRCROOT/app.config:296-300`). The Config Wizard sets `Format_Price = MISC_UPPoint` (WizardForm.cs:6907) and at the same time writes `TMS 202 = MISC_UPPoint` (WizardForm.cs:1702). So the PC rounds prices to the scale's U.Price decimal count (Spec 202).
- The output is the **shortest** form. Trailing zeros are dropped because decimal equality ignores scale.
- The mantissa has **at most ~7 significant digits**: once |m| > 999 999.9 the loop stops and the remainder is rounded away. This means precision loss.

| input | fmt | output |
|---|---|---|
| 845 | Price(2) | `845,0` |
| 110.5 | Price | `1105,1` |
| 12.30 | Price | `123,1` |
| 0 | any | `0,0` |
| −0.5 | Price | `-5,1` |
| 1234.565 | Price | `123456,2` (round half-even to 1234.56) |
| 123456.789 | Weight(3) | `1234568,1` (**precision loss**) |
| 1234567.5 | Price | `1234568,0` |
| 9999999.99 | Price | `0,0` (**overflow → zero**) |
| −1 (VIP "don't update points") | Price | `-1,0` |

### 3.2 ParseDecimal (CONFIRMED, Program.cs:229-251)

- `"m,d"` → m / 10^d. `"m"` (no comma) → the integer m. Anything that throws (empty field, non-numeric, mantissa > Int32) → **0**.
- There is no locale dependence: the comma is the field separator inside the value, not a decimal comma.

### 3.3 What the number means on the scale

- The value is in **display units** (currency units, kg, etc.). It is **not** pre-scaled by Spec 202. The scale shows it with Spec 202 decimals for U.Price and Spec 203 for T.Price (Tm.xml Spec_Info 200-203: decimal points for Tare/Weight/U.Price/T.Price).
- Beeftown's scale has Spec 202 = 3, and staff read the decimal point as a thousands separator. So `845,0` → shows `845.000` → **845 000 đ**, i.e. **file value = VND / 1000**. TOOL's `rawToVnd`/`vndToRaw` (TOOL:344-355) do exactly `VND = m·10^(Spec202 − d)` and the shortest `m,d`. **CONFIRMED consistent.**
- INFERRED: the scale stores the (mantissa, decimals) pair as received and echoes it back unchanged. This fits the real export having `845,0`/`0,0` in PLU lines but `16000,3`/`0,3` in scale-generated `RES` lines (test-kho-can.mjs:57).
  - [verified-add] REAL confirms both halves. The PLU prices come back exactly as TOOL sent them (`845,0`, `876,0`, `695,0`, `516,0`), and so do the two older vendor items (`222,0`, `100,0`). Scale-generated `RES` lines use a **fixed** 3 decimals for money (`28800,3` = 28.800, `60000,3`) but the shortest form for amounts (`48,2` = 0.48 kg, `1,0` = 1 pcs). Readers must therefore accept any decimals count, not only Spec 202.

---

## 4. Section reference (every tag the code can write or read)

"W" = the PC writes it. "R" = the PC reads it from a file (RDS.DataSet_ReadTMS) or from UPL (SaveForm.OpenFromSerial / NetForm.UploadECS). DB = `ECS.mdb` table.column.

### 4.1 `TMS` — Spec (global parameters) (W/R)

- **Format**: `TMS\t<SpecID>\t<Value>\t` → `Spec.SpecID` (int, PK), `Spec.Value` (int).
- **Written** only for `Spec.Valid = true` rows (SaveForm.cs:957-963). The scale export and SAMPLE contain all rows 0..499.
- **Import rule** (RDS.cs:730-758):
  - If the DB already has that SpecID with `Valid = false`, the line is **skipped**.
  - If the DB has no row for it, the row is added with `Valid = false`.
  - If the DB row has `Valid = true`, the value is replaced.
- **Value types** (Tm.xml `<Spec_Info><Type>`):
  - 0 = plain int (214 specs)
  - 1 = enum `value|label|...` (168 specs)
  - 2 = checkbox 0/1
    - [verified-fix] Type 2 is handled by SpecForm.cs:284-290, but **no** Spec in `INST/Tm.xml` uses it (the counts are 214 × 0, 168 × 1, 1 × 3 = 383 documented specs).
  - 3 = packed decimal (only Spec 297, "Second Currency Exchange")
- **Specs that matter to us** (names from `INST/Tm.xml`):

| Spec | Meaning | Values / notes |
|---|---|---|
| 0 | Bill 1: item print format | Label ID used for item labels. TOOL uses it to find the active label ✔ |
| 1 | Bill 1: item barcode format | Barcode ID |
| 2 | Bill 1: item barcode flag | 0~99999 |
| 3 | Bill 1: item print times | |
| 4 | Bill 1: item print reversed | |
| 5 | Bill 1: sum print format | |
| 6 | Bill 1: sum barcode format | |
| 7 | Bill 1: sum barcode flag | |
| 10.. | Bill 2 equivalents | |
| 21 | Paper type | 0 plain / 1 gap |
| 22 / 23 | Gray level (gap / plain paper) | |
| 40 | Device/machine number | ReportForm.cs:5532 |
| 42 | USB-disk auto update | 0/1 |
| 58 | ASK flags | bit0 = ask logs, bit1 = ask PLU (NetForm.cs:1451-1465) |
| 100 / 101 | Rounding | |
| 104 | Date format | |
| 105 | Shelf-day print mode | 0 = use the PLU setting; 1/2 = use Spec 106. [verified-fix] Incomplete. Tm.xml has 0-6: 0 PLU setting (due-date mode); 1 Spec 106 only if the PLU has no shelf days (due-date mode); 2 always Spec 106 (due-date mode); **3 do not print shelf**; 4/5/6 = the same as 0/1/2 but in **days mode** (prints a number of days, not a date). REAL = 0. |
| 106 | Default shelf days | 0~999 |
| 110 | Manual-discount forbids | |
| 150-165 / 430-441 | IP settings | NetForm.cs:2233-2252 |
| 200 | Decimal point: Tare | |
| 201 | Decimal point: Weight | |
| **202** | **Decimal point: U.Price (0~5)** | |
| **203** | **Decimal point: T.Price** | |
| 208 / 209 | Decimals of weight / money inside barcodes | |
| 250 | Accumulation mode | [verified-add] Tm.xml: 0 normal accumulation, 1 【Accu】 does the same as 【Print】, 2 can only accumulate once. REAL = 1. The wizard sends `TMS 250 1`, `END TMS`, `DWL TMS`, `TMS 250 2` for one-item prepack mode without direct print (WizardForm.cs:1654-1657). |
| 456 | QR version | |
| 499 | Undocumented | SAMPLE value 1522729470 = Unix time 2018-04-03. INFERRED: a stamp or serial. [verified-add] REAL (the Beeftown scale, saved 2026-09-26) has the **same** value 1522729470 as the 2018 vendor template. So it is not the save time. INFERRED: it is a firmware/factory constant, or a value copied in from vendor data. Never change it. |

### 4.2 `TMT` — global strings (W/R)

- **Format**: `TMT\t<StringID>\t<Value>\t` → `String.StringID`, `String.Value` (MaxLength 255). The value is written raw, **without FormatString**.
- **Write filter and import rule**: the same Valid rules as TMS (SaveForm.cs:975-992; RDS.cs:759-787).
- **IDs** (Tm.xml String_Info):

| ID | Meaning |
|---|---|
| 0 | Store Name |
| 1 | Device Name |
| 2 | Prefix of money unit |
| 3 | Suffix of money unit |
| 4-11 | Device Postil 1-8 |
| 12-13 | Reserved |
| 14 | Industry Mark |
| **15** | **Wireless SSID** |
| **16** | **Wireless Password** |
| 17-18 | Reserved |
| 19 | Server domain |
| 20.. | Custom Text |

- ⚠ A scale export therefore contains the shop's **WiFi name and password in clear text**. Never publish a real file.

### 4.3 `SCP` — PLU shortcut keys (W/R)

- **Format**: `SCP\t<PageID>\t<KeyID>\t<PLUID>\t` → `Face.PageID`, `Face.KeyID`, `Face.PLUID`.
- `Face.ScaleID` (which key layout) is **not** in the file. It is picked in the UI (SaveForm.cs:1004).
- `PageID` 0..1 = shift layer. `KeyID` is 1-based (the layouts start at `Data_Offset` 1: `INST/ScPLU/ScPLU_KA.xml` has keys 1..35 + 36..63). 128 rows = 2×64 (Program.Public_Cal_NewSCP).
  - [verified-fix] "0..1 / 128 rows" only describes the **PC's default blank layout**, and even that is 0-based: Program.cs:614-630 creates `PageID = i / 64`, `KeyID = i % 64` for i < 128, so KeyID runs **0..63** and key 0 is an unused dummy that "Clear Data" would still write as `SCP\t0\t0\t0\t`. The **real scale** exports 199 SCP rows: **PageID 0..2**, with KeyID **1..73** on page 0 and 1..63 on pages 1 and 2 (REAL). `DUMP/B_ECS/Face.tsv` (201 rows, pages 0-2, keys 0-73) shows the PC imports such data unchanged, because the Face PK is (ScaleID, KeyID, PageID). Writers must not assume 2 × 64. Read what the file has and keep page/key pairs as they are.
- `PLUID` 0 = empty key. Without "Clear Data" only keys with `PLUID != 0` are written. With it, every key is written, so the empty keys erase the old assignments (SaveForm.cs:1004).
- In file mode there is no `CLR SCP`. Serial and TCP send `CLR\tSCP\t` (SaveForm.cs:1337-1341).
  - [verified-fix] **Only serial** sends it (SaveForm.cs:1339). The TCP writer (NetForm.cs:3339-3358) has no `CLR SCP`; like the file writer, it "clears" by writing every key including PLUID 0. `CLR\tSCP\t` appears exactly once in the whole code base. Conversely, TCP has a `CLR\tFNT\t` (NetForm.cs:3565) that the file writer lacks.
- TOOL `keyOfPlu` (page 0, key > 0) ✔.

### 4.4 `DPT` — departments (W/R)

- **Format**: `DPT\t<DeptID>\t<Name>\t` → `Dept.DeptID`, `Dept.Name` (255, raw).
- IDs 1-9 are system IDs (SAMPLE: 1 T-Weight, 2 T-Count, 3 Service Charge, 4 Discount & Rounding, 5 Not Cash Payment, 9 Default). User IDs are 10~99 (MANUAL p.48 DPT.00).

### 4.5 `CLS` — classes (W/R)

- **Format**: `CLS\t<ClassID>\t<Name>\t<DeptID>\t<LabelID1>\t<BarT1>\t<BarF1>\t<LabelID2>\t<BarT2>\t<BarF2>\t` (SaveForm.cs:1041). Each field maps to the `Class.*` column of the same name.
- Defaults: DeptID 9, others 0 (ECSDataSet.cs ClassDataTable).
- SAMPLE uses the **old 3-field form** `CLS\t1\tT-Weight\t1\t`. The reader fills the missing columns with defaults (RDS.cs:823-847).
  - [verified-fix] Precisely: the trailing empty element is consumed as the 4th field, so `LabelID1 = ParseInt("") = 0`, and only BarT1..BarF2 get DataTable defaults (all 0 anyway).
  - [verified-add] The real scale export (REAL) and `pt/_ECS.TMS` both use the **full 9-field form**, so write 9 fields.
  - [verified-add] MANUAL p.48 steps CLS.00 No / CLS.01 Name / "CLS.00 [sic] Dept" = columns 1/2/3.
- System IDs 1-9 (9 = "Default", which every default PLU points to). User IDs 10~99.

### 4.6 `PLU` — items (W/R)

67 data fields; see §7 for the full map. `PLU\t{0}…{66}\t` (SaveForm.cs:1060; NetForm.cs:3444 is identical).

- With the PLU checkbox Checked, all rows are written. With it Indeterminate, only rows with `PLU.Valid = true` (the "Import/Export" flag) are written (SaveForm.cs:1058).
- PLUID range 1..9 999 999 (PluForm.cs:3130; MANUAL "1~9999999"). IDs 9999991-9999999 are reserved system PLUs ("PLU Default" in `INST/Combo.xml`: T-Weight, T-Count, Service Fee, Discount&Rounding, Card, Payment1-3, Store payments). **Do not use them.**
  - [verified-add] The sales-log parser also treats PLU numbers **9999981-9999988** on SubID-0 `RES` lines as e-payment totals (Alipay/WeChat/Epay2-7; RDS.cs:2479-2502, inside NL_Log_Get). Keep user PLUs well below 9 999 981.
  - [verified-add] REAL: 6 PLU lines, all 69 elements. PLUs 1, 2, 3, 5 were written by TOOL (ALPHA = TOOL `aliasOf`, 5-13 chars). PLU 4 (code 12304, ALPHA 13 chars = vendor `GetAlpha` style) and PLU 6 (code 12306, **ALPHA empty**) are leftovers from the vendor. INFERRED: the scale does not compute ALPHA itself for items keyed in on the scale.

### 4.7 `UNT` — units (neither written nor read by PC v3.10)

- SAMPLE and the scale export have an empty `DWL UNT / END UNT` section.
- The PC hides the Unit checkbox (SaveForm.cs:690-694), and the reader has no `UNT` case (it falls to the custom handlers, RDS.cs:1092-1109).
- Units are fixed 1..9: 1 Weight (default weight unit), 2 pcs (default count unit), 3 kg, 4 g, 5 ton, 6 lb, 7 500g, 8 100g, 9 1/4lb (RDS.cs:509-532; Lang `pw_AllUnitMeasure`). Pack = grams per unit (1000, 1, 1e6, 453.592, 500, 100, 113.398).
- INFERRED line layout from MANUAL p.60 (steps UNT.00 No, .01 Name, .04 PUnit, .05 Pack, with step n = column n+1): `UNT\tUnitID\tName\t?\t?\tPUnit\tPack\t`. **Unverified. Do not write UNT.**

### 4.8 `BAR` — barcode formats (W/R)

- **Format**: `BAR\t<BarID>\t<Name>\t<Format>\t<Check>\t<Num1>\t<Num2>\t<TChar>\t` → `Barcode.*` (SaveForm.cs:1078).
- **Format** (Combo.xml `Barcode_Format`): 0 Default(EAN13 family), 1 EAN13, 2 EAN8, 3 UPC-A, 4 UPC-E, 5 EAN-128C, 6 Code-128C, 7 ITF25, 8 PDF417, 9 EAN-128, 10 Code-128, 11 QR, 12/13 Code39, 14 Code93.
- **Check**: 0 = try to add a check digit, 3 = never.
- **Num1 / Num2**: constant numbers 1/2 (used by sources C/D).
- **TChar grammar** (BarItemBox.cs:300-455), a sequence of items:
  - `<letters><L><S><O>`: letters are the base-26 source index, 'A' = 0 (Combo.xml `Barcode_Source`: A not print, B spec flag, C const1, D const2, E PLU number, **F PLU item code**, G index barcode, H PLU flag, I U.price, **J weight/pcs**, **K T.price**, L sale T.price, …). L = length digit, S = shift digit, O = overflow mode (0 not print, 1 cut off, 2 fill 0, 3 fill 9, 4 extend).
  - `@CNN` = text source.
  - `=CNN` = symbol (partition / checksum / unreadable).
  - `?NNN` = custom.
  - `>text\v` = constant text.
- Example `B201F501J500A000A000A000`: flag 2 digits, item code 5 digits, weight 5 digits, check digit implied. This is the Beeftown real BAR 28 (test fixture). The vendor wizard default has `K500` (price) instead of `J500` (`INST/Wizard.BIN`).
- IDs 0-9 are factory IDs, 10-99 are user IDs. 28/29 = "QS-Item"/"QS-Sum" created by the Config Wizard (WizardForm.cs:1800-1909).

### 4.9 `LAB` / `LAS` / `LAE` — print formats (labels) (W/R)

**LAB** (SaveForm.cs:1097):

| col | field | DB | notes |
|---|---|---|---|
| 1 | LabelID | Label.LabelID | Only 10..99 (`minUserLabelID`..`maxLabelID`) are exported unless the user is SuperAdmin (SaveForm.cs:1092). 0 = system; 11000-19999 = PC-side templates; 90000+ = recycled. |
| 2 | Name | Label.Name | raw |
| 3 | Sort | Label.Sort | 1 Item label, 2 Sum label, 3 Receipt, 4 List (Combo.xml `Label_Sort`) |
| 4 | Width **mm** | Label.Width / 8 (integer division) | The DB stores dots at 8 dots/mm; the reader multiplies by 8 (RDS.cs:965). |
| 5 | Height **mm** | Label.Height / 8 | |
| 6..21 | Text1..Text16 | Label.Text1..16 | FormatString; captions referenced by const-text items |
| 22 | Version | Label.Version | 1 = "New Font Mode (V2.xx)" (Combo.xml `Label_Version`); default 1 |
| 23..38 | Text17..Text32 | Label.Text17..32 | |
| 39 | `''` | | trailing |

**LAS** (one per element; SaveForm.cs:1101):

| col | field | meaning |
|---|---|---|
| 1 | SubID | element index (0..n) |
| 2 | Flag1 | element type: 0 Barcode, 1 Item (PLU field), 2 Sale info, 3 Const text, 4 Outline border, 5 Partition/area line, 6 Bitmap, 7 Custom print (LabelForm.cs:34-44; LabelItem.xml `LabelItem_Flag1`) |
| 3 | Flag2 | depends on type (see below) |
| 4 | Flag3 | depends on type (see below) |
| 5 | Print | print condition (Combo.xml `LabelItem_Print`): 0 never, 1 always, 2 weight item, 3 count item, 7 sale date, 8 pack date, **9 shelf date**, … 33 |
| 6 | Angle | 0/1/2/3 = 0°/90°/180°/270° |
| 7 | Align | 0 default, 1-9 = TL,TC,TR,ML,MC,MR,BL,BC,BR |
| 8 | Font | Version-1 font index (Combo.xml `LabelItem_Font2`), dots W×H: 0=10×18, 1=14×26, 2=18×34, 3=10×36, 4=14×52, 5=18×68, 6=28×52, 7=36×68, 8=36×136, 9=54×102 |
| 9..12 | Left, Top, Width, Height | dots (0.125 mm) |

Flag2 and Flag3 by element type:

- **Barcode** (Flag1 = 0): Flag2 is 0 readable / 1 no readable code. Flag3 is the barcode ID (0 = "System", i.e. use Spec 1/6; 10-29 user).
- **Item** (Flag1 = 1): Flag2 is 0 ("X") or 1-31, meaning unknown (all samples use 0).
  - [verified-fix] **Wrong.** SAMPLE has Item elements with Flag2 = 1..10 on the **Sum labels** (Sort 2: 12000, 12100, 12200, 12300; 30 such rows), and the DB dumps do too (A_ECS/A_en_Default: values 1-10). Example from 12000: `LAS\t2\t1\t1\t0\t…\t252\t0\t108\t18\t` (Flag2 1, Name) and `LAS\t3\t1\t1\t5\t…\t360\t0\t70\t18\t` (Flag2 1, Price). Flag2 2 is the same pair at y = 18, Flag2 3 at y = 36, and so on, 18 dots apart.
  - So Flag2 = **n selects the n-th accumulated item** of a sum/list label. 0 ("X") = the current item, which is what item labels use. (Values CONFIRMED, meaning INFERRED from the layout.)
  - Flag3 is the PLU field: 0 Name, 1 Weight/Pcs, 2 Tare, 3 First U.Price, 4 Payable U.Price, 5 Price, 6 PLU No, 7 Class, 8 Dept, 9 Index, 10 Item code, 11 Sale date, 12 Sale time, 13 Pack date, 14 Pack time, **15 Shelf date**, 16-22 Text1-7, 23 Gross, 24 Measure unit, 25 Price unit, … 33 Bitmap, 36 Tare %.
- **Sale info** (Flag1 = 2): Flag2 selects the item (0 Store Name, 1 Device name, 3 Print date, 4 Print time, 16 Unit of money, 27 Grand total, …, 66).
- **Const text** (Flag1 = 3): Flag2 = n prints **Label.Text(n+1)**, i.e. LAB column `n<16 ? 6+n : 7+n` (LabelForm.cs:1435-1449). TOOL `textCol` ✔.
- **Border** (Flag1 = 4): Flag2 is the thickness (1-24).
- **Partition** (Flag1 = 5): Flag2 is 0 area flag / 1 page print / 2 line print. Flag3 is in mm.
- **Bitmap** (Flag1 = 6): Flag2 is the bitmap ID.
- **Custom print** (Flag1 = 7): see `LabelItem_Flag4`.

- **LAE**: `LAE\t` closes the label.
- **Reader**: `LAS` lines attach to the preceding `LAB`. Serial and TCP read `LAS` until `LAE` (SaveForm.cs:2124-2156).
- **Import replaces the label**: the old DB label with the same ID is deleted before the merge (RDS.cs:1007; SaveForm.cs:2123).
  - [verified-add] The delete **cascades** to the old elements: `FK_Label_LabelItem` has `DeleteRule = Rule.Cascade` (ECSDataSet.cs:39373-39377). So an imported label fully replaces the old elements, and none are merged.
- [verified-add] **Units, confirmed three ways.**
  - Every LAB reader multiplies by 8: file RDS.cs:965-966, serial SaveForm.cs:2079-2080, TCP NetForm.cs:2921-2922. So the **scale itself** sends LAB width/height in **mm**, while LAS positions are in dots (8/mm).
  - MANUAL p.51-52 numbers the scale's label editor steps PST.nn = LAB column nn+1: PST.01 Name, .02 Sort, .03 Lng-X = col 4, .04 Lng-Y = col 5, .05-.20 Txt01-16 = cols 6-21, **.21 FontM = col 22 (Version)**, .22 LAS. This independently confirms the LAB column order.
- [verified-add] **Label IDs on the scale.**
  - MANUAL p.51 PST.00: factory labels 1~9, user labels **10~29**. The PC exports 10..99 (`maxLabelID` = 99), so IDs 30-99 would probably be rejected by the scale (INFERRED).
  - REAL holds factory labels 1-9 named "PF-1".."PF-9", plus 10, 11, 27 and 28. They contain the same elements as the PC templates 11000, 11100, … (same sizes), but in a **different SubID order**.
  - SubIDs **need not be contiguous**: REAL's LAB 28 has SubIDs 0, 1, 4, 5, 10, 12, 15, 16, 17, 20, 26, 27, 28, 29.
  - Identify an element by (Flag1, Flag2, Flag3) and position, not by SubID. SubIDs must be unique within a label, because LabelItem PK = (LabelID, SubID).

### 4.10 `SAL` — salesmen (W/R)

- **Format**: `SAL\t<SalesmanID>\t<Name>\t<Password>\t<Discount_Low>\t<Discount_High>\t<RightFB>\t<Code>\t` → `Salesman.*` (SaveForm.cs:1120).
- The password is in clear text.

### 4.11 `FNT` — printer font (W only)

- `DWL\tFNT\t` / `FNT\t<nibble-hex of Binary\Font.bin or Binary\Font\<name>.bin>\t` / `END\tFNT\t` (SaveForm.cs:1124-1143).
- One line, about 2.5 MB for the 1.27 MB Font.bin.

### 4.12 `BMP` — bitmaps (W only)

- **Format**: `BMP\t<ID>\t<hex>\t`.
- The hex is nibble-coded bytes: ID (4 bytes LE), width (2), height (2), 88 zero bytes, then `Bitmap.PicString` appended (already nibble-coded) (SaveForm.cs:1151-1167).

### 4.13 `VIP` — members (W/R)

- **Format**: `VIP\t<BAR div 1e9>\t<BAR mod 1e9>\t<PH div 1e9>\t<PH mod 1e9>\t<Point>\t<Discount>\t`.
- BAR/PH (up to 18-digit card and phone numbers) are split into two ints.
- `Point` = FormatDecimal(Price), or `-1,0` = "do not overwrite points" when "Update Points" is not ticked (SaveForm.cs:1170-1198). The reader clamps negative values to 0 (RDS.cs:1080-1083).
- `Discount` (Combo.xml `VIP Discount Sort`): 0 default, 1-99 custom %, 101-104 level A-D.

### 4.14 `PAS` — scale passwords (Wizard only, W)

- **Format**: `PAS\t<n>\t<password>\t` with n: 0 Admin, 1 Sale, 2 Prog, 3 Account, 4 Drawer, 5 PriceFProg (WizardForm.cs:1912-1940).
- The scale may include this section in exports (unknown).

### 4.15 `TIM` — clock

- **Format**: `TIM\t<yy>\t<M>\t<d>\t<H>\t<m>\t<s>\t`.
- PC→scale `DWL TIM` sets the clock (NetForm.cs:2314-2325). The scale answers `UPL TIM` with the same line (NetForm.cs:2327-2375).
- In a scale export it is the save time. INFERRED: loading such a file back sets the clock to that old time, so TOOL's "drop TIM" is correct.

### 4.16 `INF` / `INA` / `INM` / `MAC` — device identity (network; INF and INM also appear in USB exports)

- `INF\t<StoreName>\t<DeviceName>\t<DeviceNo>\t<model string>\t`, e.g. model `TM-xA UA006 V3.14E8`: first word = type, second-to-last = customer code, last = firmware (NetForm.cs:2159-2193; ReportForm.cs:5557-5580). DeviceNo = −1 means the handshake failed.
  - The PC can write `DWL INF` with `INF\t<store>\t<device>\t<no>\txxx\t` (NetForm.cs:2292-2303).
- `INA\t<enc1>\t<enc2>\t<?>\t<memData>\t<memFont>\t`: the scale reports its text encodings; the PC switches the stream encoding accordingly (NetForm.cs:2109-2156).
- `INM\t<MAC 12 hex>\t[<orig MAC>]\t` (`ZZZZ...` = none) (NetForm.cs:2088-2107; ReportForm.cs:5581-5595).
- [verified-fix] **The real field counts are larger** (REAL, inside `DWL INF`):
  - `INA\t\tUTF-8\t0\t8388608\t8388608\t7\t7\t` has **7 data fields**: enc1 empty, enc2 `UTF-8`, an int 0, memData = 8 MiB, memFont = 8 MiB, then two more ints (7, 7) of unknown meaning. NetForm reads only [1]..[5].
  - `INM\t<MAC>\t<MAC>\t0\t` has **3 data fields**. [3] is an int that the PC stores in `Args[8]` (NetForm.cs:2103).
  - This resolves the stated unknown: USB exports **do** contain INA and INM, and do **not** contain PAS.
- `MAC\t<b1>\t…\t<b6>\t` as decimal bytes. `DWL MAC` sets it. The code closes that block with `END\tTMS\t` (bug/quirk, NetForm.cs:2255-2269).
- TOOL reads `INF[4]` as the model ✔.

### 4.17 `VER` — firmware upgrade (W, network only)

- `DWL\tVER\t` / `VER\t<nibble-hex of firmware>\t` / `END\tVER\t` (NetForm.cs:3636-3666).

### 4.18 `REP` / `RES` / `REE` — sales log (scale→PC; in USB sales files and in scale exports)

- **Format** (RDS.cs:2308-2567; NetForm.cs:3905-3990):
  - `REP\tyy\tM\td\tH\tm\ts\t<FID>\t<SID>\t<Salesman>\t…` (≥ 10 fields)
  - then `RES\t<SubID>\t<Price>\t<PLU>\t<Class>\t<Dept>\t<Cost>\t<Amount>\t<Unit>\t<Type>\t<Tax>\t<Text1>\t<Text2>\t<Text3>\t<Text4>\t<UnitPrice>\t<CoFID>\t<PLUName>\t…` (≥ 18 fields)
  - then `REE\t`
- `Type`: 0 sale, 1 buy-back, 2 unconfirmed, 3 deleted, 4 hang-up, 10 inbound, … 255 error (RDS.cs:45-68). SubID 0 lines with PLU 99999xx are payment/fee lines.
- Numbers are "m,d". `UPL\tREP\t<fromFID>\t` requests sales from FID (NetForm.cs:3911-3916).
- The PC **never sends** REP. ⚠ TOOL writes back every unchanged section, so it re-sends `DWL REP` to the scale. The scale's reaction to that is unknown. See §9.
- [verified-add] **REAL, saved on 26/09 after the 25/09 reload that re-sent `DWL REP`:**
  - 41 REP blocks with **41 unique FIDs** (2..42), each block REP + one RES + REE. No duplicated sales, so INFERRED: the scale ignores a re-sent REP, or de-duplicates it by FID.
  - The first block is an **event record**, not a sale: `RES\t0\t0,0\t0\t0\t0\t0,0\t0,0\t2\t1254\t0,0\tUA006 V3.14E8\t…`, i.e. SubID 0, Type **1254** (≥ 255 = Error/event class, RDS.cs:67 and the `num38 >= 255` branch), Text1 = customer code + firmware. INFERRED: a power-on / firmware event.
  - Other RES Types seen: 0 (sale) × 21, 2 (unconfirmed) × 19.

### 4.19 Custom sections (keyword from `INST/Custom.xml`)

- Written by `SaveCustom` (SaveForm.cs:523-564): the fields are defined in Custom.xml. int → `n`, string → FormatString, decimal → FormatDecimal(None), other types → empty.
- `INST/Custom.xml` is empty here, so there are none.

---

## 5. Import direction (PC reading a TMS)

**File import** (SaveForm "Import (To Software)", RDS.DataSet_ReadTMS, RDS.cs:647-1213) — CONFIRMED:

1. The file is first copied to `Tm-xA.tmp` (SaveForm.cs:1614).
2. It is read with `StreamReader(file, Encoding.GetEncoding(configEncoding))`. `StreamReader` auto-detects and strips the BOM.
3. The reader goes line by line: `Split('\t')`, then `switch(array[0])` (RDS.cs:717-728).
   - **Section markers are ignored**: `ECS`, `DWL`, `END`, `LAE` → `break` (RDS.cs:1110-1114). `CLR`, `XD1`, `UPL`, blank lines, `UNT`, `REP`, `RES`, `INF`, `TIM`, … → `default:` (only the custom keywords are checked there), i.e. ignored. Sections are recognised **only by the tag of each data line**.
   - Only the tags whose checkbox is ticked are processed (bspec, bstring, sface, …).
4. **Column-count tolerance**: every field assignment sits inside `try { … } catch (IndexOutOfRangeException) {}`.
   - A **shorter** line keeps the fields parsed so far, and the rest get **DataTable defaults** (e.g. PLU ClassID 9, UnitID 1, DA_Day 127, Valid true). SAMPLE's 3-field CLS lines prove this.
   - **Extra columns are ignored.**
   - A **present but empty or non-numeric** field becomes 0 (ParseInt) or 0 (ParseDecimal), *not* the default.
   - [verified-fix] **Precise rule for short lines.** The trailing tab makes the last split element `''`, and that element is parsed as the next column. So in a truncated line the **first missing column gets 0 / "" / 0,0**, and only the columns after it get DataTable defaults.
     - Example: a PLU line cut after col 37 (DA_Sort1) would give DA_Day1 = **0**, not 127.
     - Example: SAMPLE's `CLS\t1\tT-Weight\t1\t` sets LabelID1 from `''`.
4b. [verified-add] **What makes a PC import fail as a whole.** The loop is wrapped in one outer `try` (RDS.cs:712/1204): any exception other than IndexOutOfRange aborts the whole import, and nothing is merged or saved ("Operation failed").
   - **Duplicate primary keys.** Only PLU has an explicit "first wins" check. For every other table, `AddXxxRow` on a duplicate key throws `ConstraintException` (EnforceConstraints = true, ECSDataSet.cs:39323). The PKs are: Spec.SpecID, String.StringID, Dept, Class, Barcode, Label, LabelItem (LabelID, SubID), Face (ScaleID, KeyID, PageID), Salesman, VIP.BAR (ECSDataSet.cs:281-2992, 11915).
     - Example: the wizard stream's own `TMS 250 1 … TMS 250 2` (WizardForm.cs:1654-1657), or a Spec section plus wizard rows for the same SpecID, cannot be re-imported into the PC.
     - Rule for our writer: **never emit a duplicate ID within one file.**
   - **Strings longer than the DataColumn MaxLength** raise ArgumentException when the row is added: PLU.ALPHA 16 (ECSDataSet.cs:4263), Index/Text1-7 255, LAB Text 255, names 255. TOOL's `aliasOf` truncates to 16 ✔.
   - File import runs with `protect = false` (SaveForm.cs:1609), so no ID-range filter applies: IDs 1-9 overwrite the system rows.
   - All three PLU readers (file RDS.cs:856-926, serial SaveForm.cs:1938+, TCP NetForm.cs:2758+) use the **identical** index→column map (checked by script).
5. **Duplicates**: a PLU whose PLUID already appeared earlier in the same file is skipped, so the first one wins (RDS.cs:857-860).
6. **Merge**: `oldData.Merge(newData)`, then `TableAdapter.Update` (RDS.cs:1130-1201). This is an **upsert by primary key**; nothing is deleted, except that a label with the same LabelID is deleted before it is re-added (RDS.cs:1007).
7. Spec and String rows are subject to the DB `Valid` gate (§4.1).
8. There is no firmware-version switch for the PLU/LAB layouts anywhere (the only version checks are `V2.49A` for Spec 58 and `V3.00A` for the cost source, NetForm.cs:1452, 4026). So all firmware versions use the same 67-field PLU line.

**Serial / TCP upload** (SaveForm.cs:1634-2323; NetForm.cs:2377-3140): same field maps and the same try/catch tolerance. The difference is that the reader waits for `END` after each `UPL\t<SEC>\t` and, for labels, reads `LAS` until `LAE`.

**Sales file import** (ReportForm.cs:4888+): see §2.6.

---

## 6. Delete / replace semantics

1. **`DWL <SEC>` without CLR = add/overwrite by key.**
   - INFERRED for the scale. The manual says "load file data and **update** the information in the scale" (MANUAL p.69).
   - The PC program adds an explicit "**Clear Data**" option (Lang `pw_ClearData`) that emits `CLR\t<SEC>\t` + `CLR\tEND\t` before the `DWL` (SaveForm.cs:950-953, 968-972, 1013-1017, 1030-1034, 1047-1051, 1067-1071, 1084-1088, 1109-1113, 1146-1150, 1172-1176). That option would be pointless if DWL already replaced the table.
   - The PC writes `CLR` into **USB files** as well, so the scale's file loader must understand it (CONFIRMED that the PC writes it; the scale's handling is INFERRED).
   - [verified-fix] **The real-scale test contradicts this for USB.** TEAMTEST (26/09/2026, V3.14E8) reports two behaviours:
     - **TCP port 33571: the scale only adds and updates PLU lines.** PLUs missing from the stream stay on the scale.
     - **USB load: "the scale replaces the whole list"**, i.e. PLUs missing from the file disappear.
     - So "DWL without CLR = upsert" holds for the **network** path only. For a **USB file load** the observed behaviour is **replace** (at least for PLU).
     - This is team-reported and not visible in vendor code. The mechanism is unknown: the loader may clear each table it receives a `DWL` for, or only PLU. Which other tables are replaced by a USB load (LAB? SCP? BAR?) is **untested**. INFERRED: to be safe, a USB file should contain complete tables for every section it includes.
   - [verified-add] The vendor also sends `CLR\tPLU\t`/`CLR\tEND\t` **over TCP** when "Clear" is ticked (NetForm.cs:3426-3430, likewise for the other tables). This is the vendor's way to delete over the network. It is untested on V3.14E8.
2. **There is no per-record delete command** in the PC code. Deleting a PLU in the PC (PluForm.cs:1484-1504) only deletes the DB row; nothing is queued for the scale.
3. **So, to remove PLUs from the scale** the vendor way is: `CLR\tPLU\t`, `CLR\tEND\t`, `DWL\tPLU\t`, all remaining PLUs, `END\tPLU\t`.
   - [verified-add] According to TEAMTEST, a **USB load of a complete PLU list** already removes the missing items, with no CLR needed. Over **TCP** it does not, so CLR (or a USB load, or P33 DEL.03) is needed there.
4. On the scale itself: menu **P33 DTAss → DEL.03 PLU**, code **9958**, with a from–to range ("if the 2nd number is 0 only the 1st is deleted", MANUAL p.68; V3.04A manual lines 2360-2375). DEL.01..07 = Dept, Class, PLU, Unit, Barcode, Print format, Salesman.
5. SCP has no CLR in file mode. "Clear" there means writing every key, including `PLUID 0` (§4.3).
6. PC import: always an upsert (§5). Labels are replaced per ID.

---

## 7. PLU line — full column map (SaveForm.cs:1060 writer; RDS.cs:856-926 reader)

- The split gives **69 elements**: [0] = `PLU`, [1..67] = data, [68] = `''` (trailing tab).
- **MANUAL p.49-51 numbers the scale's own PLU editor steps "PLU.nn" with nn = column − 1.** Checked on: PLU.00 Number, .01 ICode, .02 Index, .03 Unit, .04 Price, .05 Cost, .06 Tare, .07 Lab-1, … .14 Name, .15-.21 Des-1..7, .22 PS-SD … .26 PS-UD, .27 PC-SD … .31 PC-UD, .32 DF-D, … .56 Tax-S, .57 Tax-D. This independently confirms the order.
- "Tpl" = value in TOOL's `PLU_TEMPLATE` (TOOL:329). A script that emulates the PC writer (`scratchpad/work/plu.py`) produces **exactly the template** for a default DB row: 0 differences on every non-placeholder column, over 19 PLU rows from 3 DBs. The only differences are rows that use shelf life (col 27 = 1, col 32 = 30).

| col | DB column (PLU.*) | type / encoding | meaning | default / range | Tpl |
|---|---|---|---|---|---|
| 0 | — | tag | `PLU` | | `PLU` |
| 1 | PLUID | int, PK | PLU number | 1..9 999 999 | {1} ✔ NO |
| 2 | Remark | **int** | **Item code** ("pw_ItemCode"; MANUAL "ICode, printed with barcodes"; barcode source F). The scale's `ASK PLU` looks items up by it (NetForm.cs:801-807). | 0..99 999 999 (PluForm.cs:3219) | {2} ✔ CODE |
| 3 | Index | string (255) | **Index barcode** ("pw_IndexBarcode"; MANUAL "Index for exterior barcode"): an external/EAN code that calls up the PLU (ASK PLU lookup, NetForm.cs:809-815) | "" | `''` ✔ |
| 4 | UnitID | int | unit: 1 weight (default weight unit), 2 pcs (count), 3 kg, 4 g, 5 ton, 6 lb, 7 500 g, 8 100 g, 9 ¼ lb | 1 | {4} ✔ UNIT |
| 5 | Price | decimal (Price) | unit price per unit | 0 | {5} ✔ PRICE |
| 6 | Cost | decimal (Price) | cost | 0 | `0,0` |
| 7 | Tare | decimal (Weight) | preset tare; **fixed weight** when Flag bit1 is set on a weight PLU | 0..9999 | `0,0` |
| 8 | LabelID1 | int | bill-1 print format (0 = use Spec 0) | 0 | `0` |
| 9 | BarT1 | int | bill-1 barcode ID (0 = Spec 1) | 0 | `0` |
| 10 | BarF1 | int | bill-1 barcode flag (0 = Spec 2) | 0..9999 | `0` |
| 11 | LabelID2 | int | bill-2 print format | 0 | `0` |
| 12 | BarT2 | int | bill-2 barcode | 0 | `0` |
| 13 | BarF2 | int | bill-2 barcode flag | 0 | `0` |
| 14 | ClassID | int | **class**. 9 = "Default" class (DeptID 9) | **9** (ECSDataSet.cs:4204) | `9` ✔ |
| 15 | Name | string, FormatString | goods name (multi-line via `\v`) | "" | {15} ✔ NAME |
| 16-22 | Text1..Text7 | string, FormatString | goods postil 1..7. With Flag bit0 on a count PLU, Text7 is the "measure word". | "" | `''` ×7 |
| 23 | PS_SD | int | print sale date: 0 no / 1 yes | 0 | `0` |
| 24 | PS_ST | int | print sale time: 0 no / 1 appointed (col 29) / 2 current | 0 | `0` |
| 25 | PS_PD | int | print pack date 0/1 | 0 | `0` |
| 26 | PS_PT | int | print pack time 0/1/2 | 0 | `0` |
| 27 | PS_UD | int | **print shelf (use-by) date 0/1** | 0 | `0` |
| 28 | PC_SD | int | sale-date offset days | 0..999 | `0` |
| 29 | PC_ST | int | appointed sale time HHMM | 0..2359 | `0` |
| 30 | PC_PD | int | pack-date offset days | 0..999 | `0` |
| 31 | PC_PT | int | appointed pack time HHMM | 0..2359 | `0` |
| 32 | PC_UD | int | **shelf days** (0 = same day; Spec 105/106 may override) | 0..999 | `0` |
| 33 | DF_D | int | manual-discount lower limit mode: 0 system, 1 none, 2 original cost, 3 value in col 35. [verified-add] MANUAL PLU.32 says "original cost", but Combo.xml `PLU_DF_D` labels 2 as "First Price" (the PC UI text). The two sources disagree. | 0 | `0` |
| 34 | DF_U | int | manual-discount upper limit mode: 0 system, 1 none, 2 original price, 3 value in col 36 | 0 | `0` |
| 35 | DF_DN | decimal (**Weight** fmt) | lower limit value | 0 | `0,0` |
| 36 | DF_UN | decimal (Weight fmt) | upper limit value | 0 | `0,0` |
| 37 | DA_Sort1 | int | auto-discount 1 kind (Combo `PLU_DA_Sort`): 0 off, 1 amount, 2 time, 3 total-forbidden-1, 4-7 VIP A-D, 8/9 amount-forbidden, 10 total-forbidden-2 | 0 | `0` |
| 38 | DA_Day1 | int bitmask | active days: Sun 1, Mon 2, Tue 4, Wed 8, Thu 16, Fri 32, Sat 64 (Program.cs:302-312; MANUAL PLU.37) | **127** (ECSDataSet.cs:4257) | `127` ✔ |
| 39 | DA_Dn1 | decimal (Weight fmt) | range start (amount, or HHMM for time discounts) | 0 | `0,0` |
| 40 | DA_Up1 | decimal (Weight fmt) | range end (exclusive) | 0 | `0,0` |
| 41 | DA_Num1 | decimal (Price fmt) | discount price: >0 replaces the U.Price, <0 is subtracted | 0 | `0,0` |
| 42-46 | DA_Sort2, DA_Day2, DA_Dn2, DA_Up2, DA_Num2 | as 37-41 | auto-discount 2 | 0,127,0,0,0 | ✔ |
| 47-51 | DA_*3 | as 37-41 | auto-discount 3 | 0,127,0,0,0 | ✔ |
| 52-56 | DA_*4 | as 37-41 | auto-discount 4 | 0,127,0,0,0 | ✔ |
| 57 | TaxType | int | 0 no tax / per Spec 116-117, 1 excl., 2 excl. with the price after tax, 3 incl. | 0 | `0` |
| 58 | Tax | int | tax rate in 0.01 % units (1700 = 17 %) | 0 | `0` |
| 59-62 | SspValue1..4 | int | ID of the linked Custom-Info row (Custom1..4 tables; PluForm.cs:790-815) | 0..10000 | `0` ×4 |
| 63 | SType | int | special mode (Combo `PLU SType`): 0 normal, 1 tare only, 2-5 custom info 1-4, 6 custom info common | 0 | `0` |
| 64 | ALPHA | string (DB MaxLength **16**) | "Alpha search" key used for letter-key lookup. See the note below. | "" | {64} ✔ ALIAS |
| 65 | Flag | int bitmask | bit0 (1) measure word (count PLU); bit1 (2) save-as-weight (count) / fixed weight (weight PLU); bit2 (4) percent tare (PluForm.cs:2261-2295) | 0 | `0` |
| 66 | Flag_Value | int | tare percent 0..99 when bit2 is set | 0 | `0` |
| 67 | Bitmap | int | bitmap ID printed with the item | 0 | `0` |
| 68 | — | trailing `''` | | | `''` |

**ALPHA generation** (the PC does it when the name changes, PluForm.cs:2141-2144 → Program.GetAlpha, Program.cs:491-523):

- ASCII letters are kept.
- Other printable ASCII (digits, punctuation) is kept **only after the first letter**.
- A space is dropped.
- A **non-ASCII letter is dropped** (only Chinese characters are converted, to their pinyin initial).
- Generation stops at 14 characters, and the result is lower-cased.
- Verified against the dumps: 15 of 19 rows have `ALPHA == GetAlpha(Name)`. The 4 exceptions are stale or empty aliases, which proves that ALPHA is stored per row, may be empty, and is not recomputed on export.
- So the vendor would produce `livaibm` for "Lõi vai bò Mỹ", while TOOL's `aliasOf` produces `loivaibomy`. Both are plain `[a-z0-9]` ≤ 16. TOOL's version is friendlier and fits the DB limit. Keep it ≤ 16 (≤ 14 if you want to mirror the vendor).

**Tool beliefs** `COL = {NO:1, CODE:2, UNIT:4, PRICE:5, NAME:15, ALIAS:64}` → **all CONFIRMED**. Col 3 = Index barcode; col 14 = ClassID 9 (Default class); col 64 = ALPHA.

[verified-add] **Re-verification.**
- An independent emulation of SaveForm.cs:1060 over the 19 PLU rows of A_ECS, B_ECS and A_en_Default (`scratchpad/verify-tms/emu.py`) gives 69 elements for every row. It differs from `PLU_TEMPLATE` (TOOL:329) **only** in cols 27 = `1` and 32 = `30`, in the two HSD rows.
- The MANUAL p.48-51 step numbers PLU.nn = col nn+1 hold for .00-.57, including DF-D/DF-U = 33/34 and Tax-S/Tax-D = 57/58, and "17% input 1700" for col 58.
- The manual lists units 1-8 only. Unit 9 (1/4 lb) exists only in the PC (RDS.cs:509-532).
- The PC and the scale use no different layout for PLU lines: REAL's six PLU lines have exactly 69 elements.

---

## 8. Worked examples

### 8.1 One PLU line (Beeftown's own item; SAMPLE's PLU section is empty)

The line as TOOL writes it, and as the PC would write it too (apart from ALPHA). Spec 202 = 3, 845 000 đ/kg:

[verified-add] This line is **not hypothetical**. REAL (the scale's own V3.14E8 export) contains PLU 1 with exactly these 67 data fields: `1`, `10001`, empty Index, `1`, `845,0`, …, `9` in col 14, a 13-character name, a 10-character ALPHA, `0 0 0` and the trailing `''`. The scale therefore stored and echoed TOOL's line unchanged. REAL also confirms Spec 202 = 3.

```
PLU⇥1⇥10001⇥⇥1⇥845,0⇥0,0⇥0,0⇥0⇥0⇥0⇥0⇥0⇥0⇥9⇥Lõi vai bò Mỹ⇥⇥⇥⇥⇥⇥⇥⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥127⇥0,0⇥0,0⇥0,0⇥0⇥0⇥0⇥0⇥0⇥0⇥0⇥loivaibomy⇥0⇥0⇥0⇥␍␊
```

| col | raw | decoded |
|---|---|---|
| 0 | `PLU` | tag |
| 1 | `1` | PLU number 1 (the number typed on the keypad) |
| 2 | `10001` | item code 10001 (goes into the barcode as `F501` = 5 digits) |
| 3 | `` | no index barcode |
| 4 | `1` | sold by weight (default weight unit = kg) |
| 5 | `845,0` | 845 → shown `845.000` with Spec 202 = 3 → 845 000 đ/kg |
| 6 | `0,0` | cost 0 |
| 7 | `0,0` | tare 0 |
| 8-13 | `0`×6 | label/barcode/flag for bill 1 and bill 2 = use Spec 0/1/2 (Spec 5/6/7) |
| 14 | `9` | class 9 "Default" (dept 9) |
| 15 | `Lõi vai bò Mỹ` | name (UTF-8 bytes) |
| 16-22 | `` ×7 | Text1..7 empty |
| 23-27 | `0`×5 | print none of sale date/time, pack date/time, shelf date |
| 28-32 | `0`×5 | no day offsets / times; shelf days 0 |
| 33-34 | `0`,`0` | manual-discount limits = system |
| 35-36 | `0,0`,`0,0` | limit values |
| 37-41 | `0`,`127`,`0,0`,`0,0`,`0,0` | auto-discount 1 off (all days) |
| 42-56 | same ×3 | auto-discounts 2-4 off |
| 57-58 | `0`,`0` | no tax |
| 59-62 | `0`×4 | no custom info |
| 63 | `0` | normal mode |
| 64 | `loivaibomy` | alpha-search key |
| 65-67 | `0`,`0`,`0` | no flags, no tare %, no bitmap |
| 68 | `` | trailing tab |

**Shelf-life variant (HSD)**, as in the technician's DB rows 1-2 (`DUMP/A_ECS/PLU.tsv`): col 27 = `1`, col 32 = `30`. This prints the use-by date as today + 30 days, on a label that has a `Flag1=1, Flag3=15` (Shelf Date) element with Print = 9. Spec 105/106 can supply a global default.

### 8.2 One LAB block (SAMPLE lines 44-67, factory template "Item Label: 60*40mm")

```
LAB⇥11000⇥Item Label: 60*40mm⇥1⇥54⇥37⇥Price⇥NetWT⇥Count⇥Total⇥Sale Date⇥Sale Time⇥Shelf Date⇥(9 empty)⇥1⇥(16 empty)⇥
```

LAB columns:

- 1 = ID 11000 (a PC template; the PC exports only 10-99 unless SuperAdmin).
- 2 = name.
- 3 = Sort 1 (item label).
- 4/5 = 54 × 37 mm printable, i.e. DB 432 × 296 dots.
- 6..12 = Text1..Text7 = "Price", "NetWT", "Count", "Total", "Sale Date", "Sale Time", "Shelf Date".
- 13..21 empty.
- 22 = Version 1.
- 23..38 (Text17..32) empty.

| LAS | SubID | Flag1 | Flag2 | Flag3 | Print | Angle | Align | Font | L,T,W,H (dots) | decoded |
|---|---|---|---|---|---|---|---|---|---|---|
| `LAS⇥0⇥1⇥0⇥0⇥1⇥0⇥5⇥2⇥0⇥0⇥362⇥34⇥` | 0 | 1 Item | 0 | 0 Name | 1 always | 0° | 5 mid-center | 2 (18×34) | 0,0,362,34 | product name, top |
| `LAS⇥1⇥1⇥0⇥6⇥1⇥0⇥5⇥0⇥362⇥0⇥70⇥34⇥` | 1 | Item | 0 | 6 PLU No | always | | MC | 0 | 362,0,70,34 | PLU number, top-right |
| `LAS⇥2⇥3⇥0⇥0⇥1⇥0⇥6⇥1⇥0⇥34⇥80⇥26⇥` | 2 | 3 Const | 0 → Text1 | | always | | 6 mid-right | 1 | 0,34,80,26 | caption "Price" |
| `LAS⇥3⇥1⇥0⇥25⇥…` | 3 | Item | | 25 Price unit | always | | ML | 1 | 82,34,60,26 | e.g. "/kg" |
| `LAS⇥4⇥3⇥1⇥0⇥2⇥…` | 4 | Const | 1 → Text2 | | **2 weight item** | | MR | 1 | 160,34,74,26 | "NetWT" only on weighed items |
| `LAS⇥5⇥3⇥2⇥0⇥3⇥…` | 5 | Const | 2 → Text3 | | **3 count item** | | MR | 1 | 160,34,74,26 | "Count" only on count items (same place) |
| `LAS⇥6⇥1⇥0⇥24⇥…` | 6 | Item | | 24 Measure unit | always | | ML | 1 | 236,34,57,26 | "kg"/"pcs" |
| `LAS⇥7⇥3⇥3⇥0⇥…` | 7 | Const | 3 → Text4 | | always | | MR | 1 | 300,34,72,26 | "Total" |
| `LAS⇥8⇥2⇥16⇥0⇥…` | 8 | 2 Sale | 16 unit of money | | always | | ML | 1 | 380,34,42,26 | currency unit |
| `LAS⇥9⇥1⇥0⇥4⇥…` | 9 | Item | | 4 Payable U.Price | always | | MC | 1 | 0,60,137,26 | unit-price value |
| `LAS⇥10⇥1⇥0⇥1⇥…` | 10 | Item | | 1 Weight/Pcs | always | | MC | 1 | 139,60,141,26 | weight value |
| `LAS⇥11⇥2⇥27⇥0⇥…⇥2⇥…` | 11 | Sale | 27 Grand total | | always | | MC | 2 | 282,60,149,34 | total price value |
| `LAS⇥12⇥0⇥0⇥0⇥1⇥0⇥5⇥1⇥0⇥88⇥281⇥113⇥` | 12 | 0 Barcode | 0 readable | 0 system (Spec 1) | always | | MC | 1 | 0,88,281,113 | EAN-13 |
| `LAS⇥13⇥1⇥0⇥16⇥…` | 13 | Item | | 16 Text1 | always | | MC | 0 | 285,94,147,107 | PLU postil 1 box |
| `LAS⇥14..16` | | Const | 4/5/6 → Text5/6/7 | | 1/1/**9 shelf date** | | MC | 0 | y = 202 | captions "Sale Date", "Sale Time", "Shelf Date" |
| `LAS⇥17⇥2⇥3…`, `LAS⇥18⇥2⇥4…` | | Sale | 3 print date / 4 print time | | always | | | 0 | y = 220 | date and time values |
| `LAS⇥19⇥1⇥0⇥15⇥9…` | 19 | Item | | **15 Shelf date** | **9 shelf-date print** | | | 0 | 280,220,148,20 | use-by date value |
| `LAS⇥20⇥2⇥0…`, `LAS⇥21⇥2⇥1…` | | Sale | 0 Store name / 1 Device name | | always | | | 1 | y = 240/266, W = 432 | footer (TMT 0/1) |
| `LAE⇥` | | | | | | | | | | end of label 11000 |

(All 2230 LAS rows in SAMPLE equal `DUMP/A_en_Default/LabelItem.tsv` column for column.)

---

## 9. Corrections and recommendations for TOOL (PART 1)

1. **Header parse fails on PC-made files.** `parseTms` requires `lines[0]` to start with `ECS` (TOOL:380-383). The vendor program writes BOM + an **empty line** before `ECS\tVER\t100\t` (SaveForm.cs:946-947; SAMPLE bytes). **Skip leading empty lines** and find the first `ECS\tVER` line.
   - [verified-add] Severity: real scale exports (REAL) start with `ECS` on line 1 and have no BOM, so TOOL works on them. The bug only affects files made by the vendor PC program, and the `_ECS.TMS` templates.
2. **Section opener detection is too loose.** Any `X\t<SEC>\t` line counts as an opener (TOOL:390). A file with "Clear Data" contains `CLR\tPLU\t` followed by `CLR\tEND\t`. TOOL would then open PLU at the `CLR` line and insert the new rows between `CLR PLU` and `CLR END`. **Accept only `DWL` (and `XD1`) as openers, and treat `CLR` lines separately.**
   - [verified-add] Confirmed by reading TOOL:386-393. The condition `!open && f.length === 3 && f[2] === '' && SECTION_NAMES.includes(f[1]) && f[0] !== f[1]` also matches `UPL\tPLU\t`. The output would be `CLR PLU` / new rows / `CLR END` / `DWL PLU` / `END PLU`, i.e. an empty PLU block. Real scale exports contain no `CLR`, so this only bites on PC-made files.
3. **Deleting a PLU does not delete it on the scale** (INFERRED, §6). TOOL drops the `PLU` line but sends no `CLR`. The removed item probably stays in the scale's memory. When the product set shrinks, or always when TOOL owns the full catalogue, emit before `DWL\tPLU\t`:
   - [verified-fix] **For TOOL's USB workflow this is contradicted by TEAMTEST**: loading a file by USB "replaces the whole list", so dropping the line does delete the item. The risk is real only for the **WiFi/TCP** path (port 33571), where missing PLUs stay. There, vendor-style `CLR PLU` + `CLR END` (as NetForm.cs:3428-3429 sends) is the candidate, and it is still untested on V3.14E8.
   - Keep TOOL's USB behaviour. If `CLR` is ever added, test it first with a throw-away PLU. A misplaced `CLR` wipes the whole table.
   ```
   CLR⇥PLU⇥␍␊
   CLR⇥END⇥␍␊
   ```
   The alternative is to tell staff to delete it on the scale (P33 DEL.03, code 9958). Test once on the real scale with a throw-away PLU.
4. **`parseLas` field names**: `size: f[7]` is actually **Align**. The font index is `f[8]`. `type`/`text`/`data`/`cond` = Flag1/Flag2/Flag3/Print ✔. x, y, w, h = f[9..12] ✔.
   - [verified-add] `size` is never read. The preview derives font size from the element height (TOOL:857-861), so the bug has no visible effect today. Fix the name before anything uses it.
   - The preview ignores Flag2 for Item elements. That is correct for item labels (Flag2 0), but it would show sum-label rows 1..n (§4.9) all as the current item.
5. **Sections re-sent unchanged.** TOOL copies back REP (sales), INF, TMT (incl. WiFi SSID/password), TMS (all 500 specs), LAB, and so on. The PC never sends REP or INF. INFERRED safest output for a catalogue update:
   ```
   ECS⇥VER⇥<same as input>⇥
   [CLR PLU]
   DWL⇥PLU⇥ … END⇥PLU⇥
   [DWL⇥SCP⇥ … END⇥SCP⇥]
   [the edited LAB block]
   END⇥ECS⇥
   ```
   TIM is already dropped ✔. At minimum drop `REP` and `INF`. Keeping them "worked once" (25/09/2026), but their effect is unknown.
   - [verified-add] Some evidence now exists. REAL was saved after that reload and has 41 REP blocks with unique FIDs, so the re-sent REP did not duplicate sales.
   - The re-sent INF section also carries `INA`/`INM` (encoding, memory, MAC). The PC sends `DWL INF` only with an `INF` line (NetForm.cs:2292-2303), which means the scale accepts INF as a way to set the store/device name. How it treats a re-sent `INM` is unknown.
   - Recommendation unchanged: drop REP and INF, because nothing needs them.
   - TIM: TOOL drops it only when the `keepClock` checkbox is ticked (TOOL:504, `T = keepClock ? file.sec.TIM : null`). That checkbox is `checked` by default (TOOL:279, 677) ✔.
6. **XD1** is unverified (§2.4). Keep reading it, and never write it.
7. **PLU template (69 fields)**, `COL` map, "mantissa,decimals", Spec 202 decimals, Spec 0 = active item label, `textCol`, SCP page/key, INF[4] → all **CONFIRMED**.
8. **Encoding**: write UTF-8. Keeping the input's BOM choice is fine: the PC always writes a BOM, and the scale export per the team has none. Strip `\t`, `\r`, `\n` from names; a newline may be encoded as `\v`. Keep the trailing tab on every record and CRLF line endings.
9. **Limits not enforced by the file itself** (all INFERRED): the name length (TOOL uses 40), price ≤ 999 999 (display), and the PC's mantissa ≤ 7 digits. The DB limits are Name unlimited, Text 255, ALPHA 16, Index 255.

---

## 10. Unknowns (not answerable from the PC code)

- Whether the scale accepts `XD1`, and what the VER field in an export means beyond the firmware string.
  - [verified-fix] Partly resolved. VER = the firmware string (`V3.14E8`), with no extra fields (REAL). V3.14E8 itself writes `DWL`. Whether it *accepts* `XD1` is still unknown, and there is no evidence that any real file uses it.
- The scale's exact reaction to `DWL REP`, `DWL INF` and the full `DWL TMS` of 500 specs in a re-loaded export.
  - [verified-add] Partly resolved. After the 25/09 reload (which carried REP/INF/TMS/TMT), REAL shows unique sale FIDs and plausible TMS values (0 = 28, 202 = 3). So the reload did no visible harm, but there is no proof that it was ignored.
- Scale-side limits: name length, Index length, maximum PLU count / memory (INA `memData`), whether decimals beyond Spec 202 are rounded or truncated.
  - [verified-add] REAL `INA` reports memData = memFont = 8 388 608 (8 MiB). Label IDs: MANUAL says user labels 10~29. The rest is still unknown. REAL's longest PLU name is 22 characters, so the 40-character limit is still unverified.
- Whether `CLR` inside a USB file is honoured by firmware V3.14E8. Very likely, because the vendor writes it into USB files, but it is untested.
  - [verified-add] Less important now. TEAMTEST says a USB load already replaces the PLU list. The open question moves to TCP: does `CLR PLU` over port 33571 wipe the list? (The vendor sends it there, NetForm.cs:3428.) It is also unknown which non-PLU tables a USB load replaces.
- The UNT line layout. INFERRED `UNT⇥UnitID⇥Name⇥?⇥?⇥PUnit⇥Pack⇥`; never written by the PC.
  - [verified-add] Still unknown: the UNT section is empty in REAL too. MANUAL p.51 (UNT.00 No, .01 Name, .04 PUnit, .05 Pack) supports the inferred column positions.
- The meaning of Item-element Flag2 (0 / 1-31) in LAS, and of Spec 499.
  - [verified-fix] Flag2 is resolved (§4.9): it is the n-th accumulated item on sum labels, and 0 = the current item. Spec 499 has the same value (1522729470) in REAL and in the 2018 template, so it is not a save stamp. Its meaning is still unknown.
- Whether the real V3.14E8 export contains `INM`/`INA`/`PAS` lines. The PC's sales-file reader expects `INM` (MAC) in USB sales files.
  - [verified-fix] Resolved: REAL has `INA` and `INM` (inside `DWL INF`, before `INF`) and no `PAS` (§4.16). So a full "Amend" export also satisfies the PC sales-file importer (INF + INM + TIM + TMS 40 + TMT 0/1 are all present).

---

## Verification log

An adversarial re-check on 2026-09-29 by a second agent.
- **Sources re-opened independently:** the decompiled C# (`SRC/`), `INST/Tm.xml`, `Combo.xml`, `LabelItem.xml`, `Config.xml`, the MANUAL text, all six `_ECS.TMS`, the TSV dumps, TOOL, and the team's fixtures and notes.
- **New evidence:** a real scale export (REAL, §2.2b) and the team's notes from real-device tests (TEAMTEST).
- **Scratch scripts:** `scratchpad/verify-tms/emu.py` (PLU writer emulation) and `cmp.py` (SAMPLE vs Default.mdb).
- **Privacy:** no WiFi, salesman or product values were copied into this file.

| # | Claim checked | Evidence | Outcome |
|---|---|---|---|
| 1 | File envelope: BOM, empty line, `ECS\tVER\t100\t`, trailing tabs, CRLF, `END\tECS\t`, tmp file + copy | SaveForm.cs:936-947, 1224-1236; SAMPLE bytes `EF BB BF 0D 0A 45 43 53…`; 0 lines without a trailing tab in all 6 SAMPLEs and in REAL | CONFIRMED |
| 2 | Encoding = Config.xml `utf-8` for all 6 languages; `Program.GetEncoding` | Program.cs:105-108; `INST/Config/Config.xml`; app.config default is empty (set by ConfigForm.cs:119) | CONFIRMED. Added that serial/TCP streams also start with a BOM |
| 3 | "XD1 appears nowhere" | `grep -r XD1 tmxa-src` = 0 hits; REAL (V3.14E8) uses `DWL` for all 13 sections | CONFIRMED, and strengthened |
| 4 | Header VER meaning | REAL line 1 `ECS\tVER\tV3.14E8\t` | Previously unverified, now CONFIRMED |
| 5 | Scale export layout/order is the team's reconstruction | REAL §2.2b | CONFIRMED for order and blank lines. **Fixed:** SAMPLE ≠ scale layout (no BOM or leading empty line in REAL, 9-field CLS, IDs 1-9, extra sections) |
| 6 | "Other 5 languages same layout" | Script over all 6 `_ECS.TMS` | **Fixed:** pt has 9-field CLS, DPT/CLS 1-9 and U+FFFD mojibake; es has an extra blank line; zh-CHS has 2280 LAS |
| 7 | SAMPLE = Default.mdb "exactly" | `cmp.py`: TMS 500/500, TMT 28/28, BAR 10/10, LAB 33/33, LAS 2230/2230 equal | Line-level CONFIRMED. **Fixed:** the DB is a superset (7 PLU, 12 BAR, 38 LAB, 2398 LAS; String.Valid 0/28) |
| 8 | File names `JHSCALE\A_{n:d3}.TMS` / `A_xxx.TMS` | SaveForm.cs:485-495 | CONFIRMED. Added that TOOL's "A_000 auto-loads" note contradicts MANUAL p.69 |
| 9 | FormatDecimal algorithm and all 10 table rows | Program.cs:530-557 (ToEven rounding, ±9 999 999 → `0,0`, loop bound 999 999.9, n < 7, `Convert.ToInt32`) | CONFIRMED (each row recomputed by hand) |
| 10 | ParseDecimal / ParseInt / ParseString / FormatString | Program.cs:168-251, 525-528 | CONFIRMED. Added leading-zero loss for col 2 |
| 11 | PLU column map 1..67 (writer ↔ reader), NetForm writer identical | SaveForm.cs:1060; RDS.cs:856-926; NetForm.cs:3444 and 3452 compared by script; readers RDS.cs:856, SaveForm.cs:1938, NetForm.cs:2758 compared by script | CONFIRMED. No off-by-one |
| 12 | TOOL `PLU_TEMPLATE` = PC writer for default rows; `COL` map | `emu.py` over 19 rows: 69 elements each, diffs only cols 27/32 on 2 HSD rows; REAL PLU 1 numeric columns equal the template | CONFIRMED (now also on real scale data) |
| 13 | Col 14 default 9, DA_Day default 127, ALPHA MaxLength 16 | ECSDataSet.cs:4204, 4257-4260, 4263 | CONFIRMED |
| 14 | MANUAL PLU.nn = col nn+1; DF-D/DF-U 33/34; Tax 57/58 (1700 = 17 %) | V2.50A text lines 2077-2225 (PDF p.48-51) | CONFIRMED. DF_D value 2 is "original cost" (manual) vs "First Price" (Combo); both noted |
| 15 | GetAlpha rules; 15/19 rows match; "livaibm" | Program.cs:491-523 (and GetFirstPY: non-GB2312 characters throw and are dropped); re-computed on the dumps | CONFIRMED |
| 16 | TMS/TMT Valid gate; only 3 Valid specs | RDS.cs:730-787; Spec.tsv Valid = 104, 105, 106 | CONFIRMED. Added that the first-start import marks every row Valid = false |
| 17 | Spec meanings (0, 1, 42, 105, 202, 203, 250, 499) and Type counts | Tm.xml Spec_Info; REAL TMS values | 42/202/203 CONFIRMED. **Fixed** 105 (0-6 incl. "3 not print", days mode) and Type 2 unused. **Added** 250 and 499 (same value in REAL) |
| 18 | SCP: PageID 0..1, KeyID 1-based, 2 × 64 | Program.cs:614-630 (KeyID = i % 64); REAL: pages 0-2, keys 1-73/1-63; B_ECS Face 201 rows | **Fixed** |
| 19 | "Serial and TCP send `CLR SCP`" | Only SaveForm.cs:1339; NetForm.cs:3339-3358 has none | **Fixed** (serial only) |
| 20 | CLS 3-field tolerance | RDS.cs:823-847 | **Fixed** (trailing `''` → LabelID1 = 0). Added that REAL and pt use 9 fields |
| 21 | LAS columns and Flag meanings | SaveForm.cs:1101; RDS.cs:1016-1044; LabelItem.xml; Combo.xml `LabelItem_Print/Align/Font2` | CONFIRMED. **Fixed:** Item Flag2 is used (1..10 on sum labels) |
| 22 | LAB columns, ÷8/×8, Version default 1 | SaveForm.cs:1097; RDS.cs:962-999; SaveForm.cs:2079; NetForm.cs:2921; ECSDataSet.cs Label `columnVersion.DefaultValue = 1`; MANUAL PST.nn | CONFIRMED. Added the manual PST numbering, scale label IDs 1-9 / 10-29, non-contiguous SubIDs |
| 23 | Label import replaces the label | RDS.cs:1007 + FK cascade ECSDataSet.cs:39373-39377 | CONFIRMED. Cascade added |
| 24 | Worked LAB example (SAMPLE lines 44-67) | Re-printed lines 44-67: Align 4 = ML, 5 = MC, 6 = MR; Flag values; texts | CONFIRMED |
| 25 | Import tolerance | RDS.cs:712-1213 | Short/extra columns CONFIRMED. **Added:** duplicate keys (other than PLU) and MaxLength violations abort the whole import; `protect = false` for files (SaveForm.cs:1609) |
| 26 | Delete semantics (DWL = upsert; TOOL deletions stay on scale) | TEAMTEST (USB replaces the list; TCP only adds/updates); NetForm.cs:3428-3429 (CLR over TCP) | **Fixed** for USB. The upsert inference still stands for TCP |
| 27 | REP/RES format; the PC never sends REP | RDS.cs:2308-2567; REAL 41/41/41 REP/RES/REE, 11/19 elements | CONFIRMED. Added unique FIDs after the reload and the event Type 1254 |
| 28 | INA/INM/INF layout | NetForm.cs:2088-2193; REAL | **Fixed** field counts (INA 7, INM 3 data fields). The unknown "INM/INA/PAS in export" is resolved |
| 29 | Only firmware-version switches are V2.49A (Spec 58) and V3.00A (cost) | `grep '"V[0-9]\.'` → NetForm.cs:1452, 4026; ReportForm.cs:4919, 6253 | CONFIRMED |
| 30 | ASK PLU lookup order PLU → Remark → Index | NetForm.cs:794-818 | CONFIRMED |
| 31 | Wizard stream starts with CRLF and re-opens TMS for 250 | WizardForm.cs:1638-1640, 1654-1657, 1953 | CONFIRMED |
| 32 | VIP split, point clamp; BMP 88 zero bytes; FNT ≈ 2.5 MB | SaveForm.cs:1151-1198; RDS.cs:1077-1084; `Binary/Font.bin` = 1 269 176 B | CONFIRMED |
| 33 | Units 1-9 and Pack values | RDS.cs:509-532 | CONFIRMED (the 7 listed Pack values are units 3-9; units 1 and 2 have Pack 1) |
| 34 | TOOL bug #1 (leading empty line) | TOOL:377-383 | CONFIRMED. Severity lowered: real exports are not affected |
| 35 | TOOL bug #2 (`CLR` taken as opener) | TOOL:386-393 | CONFIRMED (also `UPL`). Only affects PC-made files |
| 36 | TOOL bug #4 (`size` = Align) | TOOL:445-448; `size` unused (TOOL:857-861) | CONFIRMED. No visible effect today |
| 37 | TOOL bug #5 (re-sends REP/INF) | TOOL:504-512 copies every non-PLU line | CONFIRMED. The effect so far is harmless (REAL) |
| 38 | TOOL `aliasOf` ≤ 16; `keepClock` default on | TOOL:339-342, 279, 677 | CONFIRMED |

**Not re-verified** (left as written): the BarItemBox meaning of the "S" digit in TChar (§4.8), ReportForm `GetInfo` details (§2.6), BMP `PicString` encoding, and the Custom-section writer (§4.19; Custom.xml is empty).
