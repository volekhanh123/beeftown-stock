# TM-xA label (tem) / print-format spec — LAB · LAS · LAE · BMP

Scope: JHScale "TM-xA Management Program" v3.10, decompiled with ILSpy, plus the vendor data shipped with it, for the TM-A label scale
(Beeftown tool: `C:\Beeftown\cong-cu\Beeftown_Can_TMA.html`). In the vendor's own words a label template is a **"Print Format"**
(`pw_PrintFormat`; on the scale it is menu **P26 "PSets"**). One format = one **Label** row (LAB) + up to 100 **LabelItem** rows (LAS).

Tags: **CONFIRMED** means seen in code or data. **INFERRED** means reasoned from names, UI text, manuals or data patterns but not proven.
**UNKNOWN** means a real open question.

Abbreviations for evidence paths:
- `src/` = `scratchpad\tmxa-src\` (decompiled C#). Most files are in `src/ECS/`.
- `inst/` = `C:\Users\khanh\Downloads\tma co hsd2\tma co hsd2\` (read-only install A).
- `dump/` = `scratchpad\mdb\dump\` (TSV dumps of the Access DBs).
- `TMS` = `inst/Config/en/_ECS.TMS` (a real TMS file shipped by the vendor; UTF-8 with BOM, CRLF, tab-separated, every row ends with a trailing TAB).
- `Manual` = `inst/Document/User Manual/Printing Serial Scale V3.04A.pdf` (PDF page numbers). `Help` = `inst/en/TM-xA.chm`, topic `DT-Set/Print Format.htm` (decompiled with Windows `hh.exe -decompile` into `scratchpad\work-label\chm\`).

---------------------------------------------------------------------------------------------------------------------------

## 0. TL;DR (what our tool must know)

| Topic | Answer | Status |
|---|---|---|
| LAB column order | `LAB, LabelID, Name, Sort, Width_mm, Height_mm, Text1..Text16, Version, Text17..Text32` + trailing TAB (40 split fields) | CONFIRMED `src/ECS/SaveForm.cs:1097`, `NetForm.cs:3510`, reader `SaveForm.cs:2074-2112` (`*8` at 2079), `RDS.cs:961-996` (`*8` at 965) |
| LAB size unit | **mm** in TMS (the DB stores dots, and the writer does `Width/8`, `Height/8`). The reader does `*8`. The editor forces dots to be a multiple of 8. | CONFIRMED `SaveForm.cs:1097`, `SaveForm.cs:2079-2080`, `LabelForm.cs:2622-2630` |
| LAS column order | `LAS, SubID, Flag1, Flag2, Flag3, Print, Angle, Align, Font, Left, Top, Width, Height` + trailing TAB (14 split fields) | CONFIRMED `SaveForm.cs:1101`, reader `SaveForm.cs:2135-2146`, `RDS.cs:1021-1033`; scale menu P26 LAS.00-11 (Manual p.53) |
| LAS geometry unit | **dots** (8 dots/mm, 203 dpi), origin at the top-left of the label, x to the right, y down | CONFIRMED (no /8 on LAS: `SaveForm.cs:1101`; UI mm = dots/8: `LabelForm.cs:2642-2700`) |
| Element type | `Flag1`: 0 Barcode, 1 Item (PLU/line data), 2 Sale Info (transaction/system data), 3 Const Text, 4 Outline Border, 5 Partition, 6 Bitmap, 7 Custom Print | CONFIRMED enum `LabelForm.cs:34-44`, `inst/en/LabelItem.xml` |
| Data code | depends on Flag1: Item → **Flag3** is the field (Flag2 is the item index, 0 = "X"). Sale Info → **Flag2** is the field. Const Text → **Flag2** is the text slot (Text(Flag2+1)). | CONFIRMED `LabelForm.cs:1412-1457`, `FlagForm.cs:207-232` |
| LAE | end-of-format marker `LAE\t`, written after the last LAS of every LAB (also after an empty format). It carries no data. | CONFIRMED `SaveForm.cs:1103`, reader loop end `SaveForm.cs:2128-2131` |
| Which label a PLU prints | Bill 1: if ≥2 items are accumulated → **Spec005** (sum format). Otherwise → PLU `LabelID1` (PLU line **f[8]**) if ≠0, else **Spec000**. Spec054 can redirect this to "Spec" or "Class" sources. Bill 2 is the same with LabelID2 (f[11]) and Spec010/Spec015. | CONFIRMED (Manual p.23 §2.2; field positions `SaveForm.cs:1060`). Spec054 semantics INFERRED. |
| Our tool's `size=f[7]` | **Wrong**: f[7] is **Align**. Font is **f[8]** and Angle is **f[6]**. | CONFIRMED |
| Our `textCol(t)` | correct (f[22] is Version / font mode) | CONFIRMED |
| Bitmaps | Stored PC-side in `ECS.SBP` (a .NET BinaryFormatter file), not in the mdb. They travel in their own TMS section `DWL BMP … END BMP` as `BMP\t<id>\t<payload>\t`. LAS only references them by ID. | CONFIRMED `BitmapFuc.cs`, `SaveForm.cs:1144-1169` |
| **[verified-add]** Independent cross-check | All 33 LAB + 2230 LAS rows of the vendor TMS were compared field by field with the named DB columns of `A_en_Default` and `B_ECS` (header ×8, Text1..32 with `\v`, LAS order SubID,Flag1,Flag2,Flag3,Print,Angle,Align,Font,Left,Top,Width,Height): **0 mismatches** (`scratchpad\verify-label\tmsdb.py`) | CONFIRMED |
| **[verified-fix]** LAB Name escaping | Name (f[2]) is written **raw**. Only Text1..32 are `\v`-escaped. Strip CR/LF/TAB from Name | CONFIRMED `SaveForm.cs:1097` |
| **[verified-add]** Bitmaps are one-way | No BMP/FNT reader exists in the program, so logos cannot be read back from a scale or TMS by the vendor tool | CONFIRMED (grep of `RDS.cs`, `SaveForm.cs`, `NetForm.cs`) |

---------------------------------------------------------------------------------------------------------------------------

## 1. Label header (DB table `Label`, TMS row `LAB`)

### 1.1 DB columns (`dump/*/Label.tsv` header, `src/ECS.ECSDataSetTableAdapters/LabelTableAdapter.cs:267`)

| # | Column | Type | Meaning | Default |
|---|---|---|---|---|
| 0 | LabelID | int, PK | Format number (see ID ranges §1.4) | — |
| 1 | Width | int | Label width in **dots**, always a multiple of 8 | 360 (`ECSDataSet.cs:1555`) |
| 2 | Height | int | Label height in **dots**, always a multiple of 8 | 270 |

**[verified-fix]** "Always a multiple of 8" holds for every row in every dump and in the vendor TMS, but it is **not enforced** everywhere:
- The DataSet default Height is **270**, which is not a multiple of 8 (`ECSDataSet.cs:1556`, `columnHeight.DefaultValue = 270`). A new format whose size is never touched in the mm box exports as `270/8 = 33` mm and comes back as 264 dots.
- The wizard canvas auto-grows `Width`/`Height` to the furthest element edge (`Math.Max(val, …)`) without rounding to 8 (`WizardForm.cs:4974-4981`).
- Only the LabelForm mm boxes round (`NumericUpDown_ValueChanged_Div8/_Multi8`, `LabelForm.cs:2622-2640`).

Our writer must round up to a multiple of 8 before dividing, or the label will shrink by up to 7 dots on every round trip.
| 3 | Sort | int | Kind: 1 Item Label, 2 Sum Label, 3 Receipt, 4 List (`Combo.xml` `Label_Sort`) | 1 |
| 4 | Name | string ≤255 | Description | "" |
| 5-20 | Text1..Text16 | string ≤255 | Constant texts used by Const-Text elements (Flag1=3) | "" |
| 21 | Version | int | Font mode: **1 = "New Font Mode (V2.xx)"** (the only value in `Combo.xml`). 0 = old font mode (fonts 3~5 before firmware V2.03, Manual p.65). Its font table `LabelItem_Font1` is empty in every shipped Combo.xml. | 1 (`ECSDataSet.cs:1592`) |
| 22-37 | Text17..Text32 | string ≤255 | More constant texts | "" |

The DB column order explains why Version sits between Text16 and Text32 in LAB.

Editor rules (CONFIRMED `LabelForm.cs:2622-2702`): the mm box for the label size rounds **up** to whole mm and rewrites dots = mm×8
(`NumericUpDown_ValueChanged_Div8`). Element boxes use `dots/8` with decimals, with no rounding. Limits: `maxLabelWidth` = 2048 dots
and `maxLabelHeight` = 4096 dots (`src/app.config:97,214`).

### 1.2 TMS `LAB` line — exact order (0-based index after `split('\t')`)

```
f[0]  "LAB"
f[1]  LabelID
f[2]  Name            (Program.FormatString: CRLF -> \v (0x0B))   [verified-fix] NOT escaped by the writer: all three writers pass `labelRow.Name` raw (SaveForm.cs:1097, SaveForm.cs:1439, NetForm.cs:3510), only Text1..32 go through FormatString. The readers still apply ParseString (\v -> CRLF). So a newline typed into Name would split the row: strip CR/LF/TAB from Name.
f[3]  Sort            1..4
f[4]  Width  in mm    (= DB Width/8, integer division)
f[5]  Height in mm    (= DB Height/8)
f[6]..f[21]   Text1..Text16   (FormatString)
f[22] Version         (font mode, normally 1)
f[23]..f[38]  Text17..Text32  (FormatString)
f[39] ""              (trailing TAB)
```
Evidence: writer `SaveForm.cs:1097` (file export), `SaveForm.cs:1439` (other export path), `NetForm.cs:3510` (Ethernet).
**[verified-fix]** `SaveForm.cs:1439` is `SaveToSerial()` (the RS-232 download, `SaveForm.cs:1241`), not a second file path.

**[verified-add]** File framing written by the PC (`SaveForm.cs:945-947`): the file starts with an **empty line**, then `ECS\tVER\t100\t`.
- The vendor `_ECS.TMS` confirms this: bytes `EF BB BF 0D 0A 45 43 53 09 56 45 52 09 31 30 30 09`.
- `Beeftown_Can_TMA.html` `parseTms` requires `lines[0]` to be `ECS VER`, so it rejects any TMS written by TM-xA itself, including `_ECS.TMS` with its templates. Scale USB exports may differ.
- To import templates from a PC-made TMS, skip leading blank lines.
Readers: `SaveForm.cs:2074-2112` (serial upload), `NetForm.cs:2916-2958` (`*8` at 2921), `RDS.cs:961-996` (TMS import). All of them do `ParseInt(f[4])*8`.
Scale menu P26 lists the same order: `PST.00 NoSet, 01 Name, 02 Sort, 03 Lng-X, 04 Lng-Y, 05-20 Txt01-Txt16, 21 FontM, 22 LAS` (Manual p.52-53).

Sample (TMS line 44, tabs shown as →):
```
LAB→11000→Item Label: 60*40mm→1→54→37→Price→NetWT→Count→Total→Sale Date→Sale Time→Shelf Date→→→→→→→→→→1→→→→→→→→→→→→→→→→→
```
(DB 432×296 dots → 54×37 mm.)

**Text escaping** (CONFIRMED `Program.cs:224-227, 525-528`): a newline inside Name/Text is written as `\v` (vertical tab, 0x0B) and read back as CRLF.
A TAB inside a text would break the row. The writer does not escape it, so our tool must strip it.
File encoding: `configEncoding = utf-8` (`inst/TM-xA.exe.Config`). The vendor TMS has a UTF-8 BOM.
Vietnamese precomposed letters (U+1EA0–U+1EF9) are in the scale's printable set ("Characters Printable in U Version.pdf", rows 784x–789x). Our tool should write **NFC**.

### 1.3 `Sort` (CONFIRMED `Combo.xml` `Label_Sort`)
1 = Item Label (one weighed/counted item), 2 = Sum Label (total of accumulated items), 3 = Receipt (long plain paper), 4 = List (kitchen/"cookroom" list).
The label-selection rules pick a format by number, not by Sort (Manual p.23). Sort is a UI category that the wizard uses.
Our tool filters `f[3]==='1'`, which is fine for item labels.

**[verified-fix]** No PC code branches on `Sort`. It is only read, written and shown in a combo (`labelSortBindingSource`).
- The wizard chooses candidate templates by **LabelID range** (11000-11099 for 60×40 item labels, and so on), not by Sort (`WizardForm.cs:3413-3504`).
- Whether the firmware uses Sort (menu `PST.02 Sort "Using sort"`) is UNKNOWN.
- Because of that, our tool's `f[3]==='1'` filter is only a heuristic: a user could store an item layout with Sort 3.

### 1.4 LabelID ranges (CONFIRMED `src/app.config` and `inst/TM-xA.exe.Config`)
| Range | Meaning | Evidence |
|---|---|---|
| 0 | "System Default" placeholder (0×0, no items). A PLU `LabelID1=0` means "use the Spec default". Hidden from non-SuperAdmin. | `TMS` line 42-43; `LabelForm.cs:1113-1116` |
| 1..9 | **Factory formats built into the firmware** ("PF-1".."PF-9"). 1 Item 58×40, 2 Item 40×30, 3 Item 58×30, 4-6 Total (sum) 58×40/40×30/58×30, 7 Receipt 58 mm, 8 Receipt 40 mm, 9 Receipt 48 mm. They are not downloadable by this PC program. | Manual p.64 Table 5-5; `dump/B_ECS` labels 1-9 (uploaded from a scale, INFERRED) |
| 10..99 | **User formats**, the only range sent to the scale (`minUserLabelID=10`, `maxLabelID=99`). UI hint says "Custom ID must between 10 ~ 29" (`maxUserLabelID=29`). Manual V3.04A says 10~39; Help says 10~99. **[verified-add]** A plain "User" login can edit only 10..99 in LabelForm; Admin and SuperAdmin can edit any ID (`LabelForm.cs:3037-3055` `labelBindingSource_CurrentChanged`, `Edit_panel`/`View_panel`). The Lang string is "Please clone from template, only ID=10~29 is allowed" (`pw_CustomIDmustbetween10_29`, `LabelForm.cs:1091`). | `NetForm.cs:3505-3508`, `SaveForm.cs:1092,1433` |
| 26/27/28/29 | Wizard clone targets: 28 = item label, 29 = sum label, 27 = receipt, 26 = other (`suggestUserLabelID=29`, minus 1/0/2/3) | `WizardForm.cs:3416,3447,3478,3504` |
| 10000..19999 | **PC-side templates** (never downloaded): 11xxx item, 12xxx sum, 13xxx receipt, 14xxx list. Sub-range by paper: x000 = 60×40 / 57 mm, x100 = 40×30 / 40 mm, x200 = 60×30 / 60 mm, x300 = 30×40 | `WizardForm.cs:3418-3499`; `minLabelID_Template/maxLabelID_Template` `app.config:434-439` |
| 90000..90099 | **Recycle bin** ("Recycled: …"). When the wizard overwrites 26-29, the old format is renamed and moved here. | `WizardForm.cs:5644-5676`; `app.config:440-445` |

The templates come from `Config\<lang>\_ECS.TMS`. They are imported once into a fresh DB when the Spec table is empty (`RDS.cs:1215-1232`).

**[verified-add]** That import runs with `protect: false`, so label 0 and every template ID are taken.
`Config\en\Default.mdb` (dump `A_en_Default`) is **not a pristine vendor DB**:
- Its Label and LabelItem tables are byte-identical to install A's `ECS.mdb` (dump `A_ECS`).
- So it also holds the technician's user formats 10, 11, 27, 28 and 90000 (file dated 2026-01-30, same as `ECS2.mdb`).
- Only `_ECS.TMS` (and `Default_ECS`, which is empty) are clean vendor sources.

---------------------------------------------------------------------------------------------------------------------------

## 2. Label elements (DB table `LabelItem`, TMS row `LAS`)

### 2.1 DB columns (`dump/*/LabelItem.tsv`; `ECSDataSet.cs:2358-2375`; adapter `LabelItemTableAdapter.cs:194`)

| # | Column | Meaning | Default |
|---|---|---|---|
| 0 | LabelID | FK → Label (PK is LabelID+SubID) | — |
| 1 | SubID | Element number 0..99 (`maxLabelItemID=99`). This is the **print order**. | — |
| 2 | Print | Print condition (§2.6) | 1 |
| 3 | Angle | Rotation 0..3 × 90° clockwise | 0 |
| 4 | Font | Font code (§2.5) | 0 |
| 5 | Left | x, dots | 20 |
| 6 | Top | y, dots | 20 |
| 7 | Width | box width, dots (in the element's own, unrotated frame) | 200 |
| 8 | Height | box height, dots | 50 |
| 9 | Align | Snap/alignment 0..9 (+ unknown high bits, §2.7) | 0 |
| 10 | Flag1 | Element type | 0 |
| 11 | Flag2 | Sub-code 1 (meaning depends on Flag1) | 0 |
| 12 | Flag3 | Sub-code 2 (meaning depends on Flag1) | 0 |
| (13) | Display | UI-only computed caption, not stored | "" |

Rows are loaded `ORDER BY LabelID, SubID` and written in that order.

### 2.2 TMS `LAS` line — exact order
```
f[0]  "LAS"
f[1]  SubID
f[2]  Flag1   element type
f[3]  Flag2
f[4]  Flag3
f[5]  Print   condition
f[6]  Angle   0..3
f[7]  Align   0..9 (see §2.7)
f[8]  Font    0..9
f[9]  Left    dots
f[10] Top     dots
f[11] Width   dots
f[12] Height  dots
f[13] ""      trailing TAB
```
CONFIRMED by the writer `SaveForm.cs:1101` (`labelItemRow.SubID, Flag1, Flag2, Flag3, Print, Angle, Align, Font, Left, Top, Width, Height`) and the readers.
Scale menu: `LAS.00 NoSet, 01 Flag1, 02 Flag2, 03 Flag3, 04 Print, 05 Angel, 06 Grid, 07 CFont, 08 S-X, 09 S-Y, 10 L-X, 11 L-Y` (Manual p.53).
Manual Table 5-7 (p.65): X/Y/W/H are 2-byte values 0..65535, and the other fields are 1 byte.
Cross-check with TMS line 45 `LAS 0 1 0 0 1 0 5 2 0 0 362 34` and DB row `11000,0,Print=1,Angle=0,Font=2,Left=0,Top=0,W=362,H=34,Align=5,Flag1=1,0,0`: Align=5 is at f[7] and Font=2 is at f[8].

### 2.3 `Flag1` element types and their Flag2/Flag3 meaning (CONFIRMED `LabelForm.cs:34-44`, `inst/en/LabelItem.xml`, `FlagForm.cs:207-232`)

| Flag1 | Name (enum / UI) | Flag2 | Flag3 | Font used? | Align used? | Size editable? |
|---|---|---|---|---|---|---|
| 0 | Barcode | 0 = Readable Code (digits under the bars), 1 = No Readable Code | 0 = "System" barcode format; 10..29 = a specific barcode format number (BAR table ID). INFERRED | no (hidden) | yes | yes |
| 1 | Item ("Item Info") | item index: **0 = "X"** (the current item; in a receipt area it repeats for every accumulated item), 1..31 = the n-th accumulated item | **field code** (§3.1) | yes | yes | yes |
| 2 | Sale ("Sale Info") | **field code** (§3.2) | 0, except sub-options (the "Flag4" table) for codes 50 and 61-64 (§3.2) | yes | yes | yes |
| 3 | Text ("Const Text") | text slot 0..31 → LAB `Text(Flag2+1)` | 0 | yes | yes | yes |
| 4 | Border ("Outline Border") | line thickness 1..24 dots (Manual Table 5-8) | 0 | no | no | yes |
| 5 | Area ("Partition") | 0 = Area Flag, 1 = Page Print, 2 = Line Print | 0..32 = feed distance in mm | no | no | Top only (Left/W/H disabled) |
| 6 | Bitmap | bitmap ID 1..255 (from ECS.SBP; the UI shows `ID - Name (w mm * h mm)`) | 0 | no | yes | yes |
| 7 | Special ("Custom Print") | no codes defined in any shipped LabelItem.xml | shown via the Flag4 table | — | yes | yes |

UI visibility rules: `LabelForm.cs:2783-2810`. Font is hidden for 0/4/5/6, Align is hidden for 4/5, and Left/Width/Height are disabled for 5.

**[verified-fix] Border and Custom Print are untested by data.**
- Border (Flag1=4): "line thickness 1..24 **dots**". The unit is INFERRED. The Manual (Table 5-8) and the Help only say "Flag2 is outline border thickness" / "Choice2 is the thick of the border".
- **No Border (Flag1=4) and no Custom Print (Flag1=7) element exists in any format** in the vendor TMS, A_ECS, B_ECS or the firmware PF-1..9. The Flag1 values seen are only 0, 1, 2, 3, 5, 6.
- So their rendering on the real printer is unverified.

**[verified-add]** Partitions (Flag1=5) in real data carry arbitrary Left/Width/Height, e.g. firmware PF-7 SubID 21 = `5,0,0 @ 38,371,200,50` (B_ECS). These are UI leftovers. The PC draws only the full-width line at Top. Our editor must keep them as they are, not zero them.

`LabelItem.xml` is a user-editable definition file. `FlagDesigner.cs:739-757` rewrites it, and a language switch copies `<lang>\LabelItem.xml` to the root.
The customised root copy (2026-05-14) differs from `en\LabelItem.xml` only in XML nesting (the same codes).

**[verified-fix]** The root file is **regenerated at every program start**, not copied on a language switch.
- `Program.Main` → `MergeConfig()` (`Program.cs:975`) → `MergeXML("Combo.xml" / "LabelItem.xml" / "Tm.xml" / "Lang.xml")` (`Program.cs:649-671, 738-745`).
- `MergeXML` merges these sources and `WriteXml`s the result to the root: `<culture-parent>\X.xml` + `<culture>\X.xml` + `Config\<configFolder>\X.xml` + `Config\X.xml`.

Consequences:
- The 2026-05-14 16:18 timestamps on the root `Combo.xml`/`LabelItem.xml` are just the last program start (install A's ECS.mdb is from 16:52 the same day). They are not a technician customisation, which is why only the nesting differs.
- FlagDesigner edits to the root file (menu `flagToolStripMenuItem`, `MainForm.cs:1316-1321`) are lost at the next start unless they are also put in `Config\LabelItem.xml`.

CONFIRMED by a set comparison: the root and `en` files hold exactly the same Flag1/2/3/4 rows.
Other languages add Sale Info 67-69 (zh-CHS, es: cloud-pay type/amount/ID).

### 2.4 Coordinates, rotation and drawing model (CONFIRMED PC preview `LabelForm.cs:1459-1582, 2579-2588`)
- The canvas is `Width × Height` dots with origin (0,0) at the top-left and y increasing downward. 1 mm = 8 dots.
- Each element: `translate(Left, Top)`, then `rotate(Angle×90°)` (GDI+ positive = clockwise on screen), then box `(0,0,Width,Height)` in the rotated frame. Text is laid out inside that box.
- The real on-paper bounding box (`GetRealRect`):
  - 0 → (L, T, W, H)
  - 1 (90°) → (L−H, T, H, W)
  - 2 (180°) → (L−W, T−H, W, H)
  - 3 (270°) → (L, T−W, H, W)

  Template 11300 (30×40, all Angle=3) fits this model. For example, Name `L=6,T=303,W=304,H=26` gives the box x 6..32, y −1..303 inside 224×304 (`dump/A_en_Default` label 11300).
- Partition (Flag1=5): the PC draws a full-width horizontal line at `Top` and ignores Left/W/H. The partition is **not printed**. Its meaning is in §2.8.
- Print order = SubID order ("The device would print in sequence of Numbers of print item" — Help). Elements may overlap. Templates put the two alternates "NetWT" (Print=2) and "Count" (Print=3) in the same box.

### 2.5 Fonts (`Font`, Label.Version=1 → `Combo.xml` `LabelItem_Font2`) — CONFIRMED
The Display column is "char-width × line-height" in dots. The Western combos show the half-width cell. The zh-CHS combo shows the full-width (CJK) cell, e.g. `0 = 18*18`.
The second number matches the box heights used by every template (18/26/34), so it is the line height.

| Font | Latin cell W×H (dots) | CJK cell (zh-CHS) | = | line height mm | PC preview em-size (pt) |
|---|---|---|---|---|---|
| 0 | 10×18 | 18×18 | base small | 2.25 | 10 |
| 1 | 14×26 | 26×26 | base medium | 3.25 | 14 |
| 2 | 18×34 | 34×34 | base large | 4.25 | 18 |
| 3 | 10×36 | 18×36 | font 0, double height | 4.5 | 10 |
| 4 | 14×52 | 26×52 | font 1, double height | 6.5 | 14 |
| 5 | 18×68 | 34×68 | font 2, double height | 8.5 | 18 |
| 6 | 28×52 | 52×52 | font 1, 2×2 | 6.5 | 28 |
| 7 | 36×68 | 68×68 | font 2, 2×2 | 8.5 | 36 |
| 8 | 36×136 | 68×136 | font 2, 2× wide, 4× high | 17 | 36 |
| 9 | 54×102 | 102×102 | font 2, 3×3 | 12.75 | 52 |
| 10-15 | "#NULL#" (filtered out of the UI, `LabelForm.cs:835`) | | | | |

There is **no bold, inverse or underline attribute** anywhere in LAB/LAS. Emphasis is only by font code (3-9) or by a Border element. CONFIRMED (no such column; Manual Table 5-7).
Barcode readable digits use Spec033 (0~2), not the element's Font. Report printing uses Spec028.
The glyphs come from the scale's font file (`Binary\Font.bin`, which can be sent as a TMS `FNT` section, `SaveForm.cs:1124-1143`).

### 2.6 `Print` = print condition (CONFIRMED `Combo.xml` `LabelItem_Print`; Manual Table 5-7 p.65 documents 0-13)

| Code | Condition | Code | Condition |
|---|---|---|---|
| 0 | Not Print | 17 | Payment 1 |
| 1 | Always Print | 18 | Payment 2 |
| 2 | **Weight Item Print** (by-weight PLU only) | 19 | Payment 3 |
| 3 | **Count Item Print** (by-count PLU only) | 20 | VIP Print |
| 4 | T-Sale Print (temporary PLU) | 21 | Normal Print (not re-print/pre-print, INFERRED) |
| 5 | Tared Item Print | 22 | Re-Print |
| 6 | Free Item Print | 23 | Pre-Print |
| 7 | Sale Date Print (only if the PLU prints a sale date) | 24 | Only 1pcs Item Print |
| 8 | Pack Date Print | 25 | Not T-Sale Print |
| 9 | **Shelf Date Print** (only if a shelf/use-by date is printed) | 26 | Not Tared Item Print |
| 10 | Not 1pcs Item Print | 27 | Not Free Item Print |
| 11 | Item Service Fee Print | 28 | Tax Free Item Print |
| 12 | Service Fee Print | 29 | Not VIP Print |
| 13 | Taxed Item Print | 30 | Default Tared Item Print |
| 14 | Cash Pay | 31 | Card Info Print |
| 15 | Card Pay | 32 | Cloud Pay Print |
| 16 | Total Discounted | 33 | Non-Default Tared Item Print |

Codes **34, 35 and 36** appear in the firmware's own receipt formats (B_ECS labels 7/8/9, uploaded from a scale) but not in any Combo.xml.
- 34 goes with Sale Info 71/72 captioned "Orignal Total:"/"Saved:" (INFERRED: "discount/saving present").
- 35 goes with Sale Info 70 captioned "JKY Pay:" (INFERRED: that payment used).
- 36 goes with Card Balance 48 captioned "Balance:" (INFERRED: card-balance print).

Which PLU flags drive codes 7/8/9 (INFERRED from `PluForm.cs:995-1007`): the PLU fields `PS_SD/PS_ST/PS_PD/PS_PT/PS_UD` ("Print Sale Date / Sale Time / Package Date / Package Time / Shelf Date"), with day offsets `PC_*`, plus Spec105/Spec106 (shelf day mode / default shelf days).

**[verified-add]**
- **Language differences.** Code **33** "Non-Default Tared Item Print" exists only in the root/en and zh-CHS `Combo.xml`. The es, ru, pt, fa and zh-CHT combos stop at 32. A different UI language would show 33 as blank but keep the value.
- **Spec105 options** (Tm.xml): 0 = PLU setting (due-date mode), 1 = Spec106 if the PLU has none, 2 = always Spec106, **3 = Not Print Shelf**, 4-6 = the same in "days mode". With Spec105=3, Print=9 elements should be hidden in a preview. A Shelf Date element with Print=1 (as in A_ECS label 28) then prints whatever the firmware emits for "no shelf date" (UNKNOWN).
- **Help text** (`chm_txt.txt` ~l.320): day fields are "the number of days counting from the day to print". Time fields are an entered hh:mm.
- **"Weight item" vs "Count item" (Print 2/3)** follows the PLU's **unit type**, not UnitID==2.
  - Unit table `Punit`: 1 = Weight, 2 = Count (`Combo.xml` `Unit_Type`). Dump `A_ECS/Unit.tsv`: units 1, 3-9 are Punit 1 and unit 2 "pcs" is Punit 2.
  - So `Beeftown_Can_TMA.html`'s `sample.unit === '2'` test is right only for the stock unit table. Resolve Punit through the UNT section instead (the link from Punit to Print 2/3 is INFERRED, but it is the only weight/count attribute a PLU has).

### 2.7 `Align` ("Snap") and `Angle`
- Angle (CONFIRMED `Combo.xml` `LabelItem_Angle`): 0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°, clockwise (Manual: "Clockwise rotation: Angle*90").
- Align (CONFIRMED `Combo.xml` `LabelItem_Align`, `AlignForm.cs:136-190`, `LabelForm.cs:1515-1554`):

| Value | Meaning | Value | Meaning |
|---|---|---|---|
| 0 | Default (the PC preview draws it like 5) | 5 | Middle Center |
| 1 | Top Left | 6 | Middle Right |
| 2 | Top Center | 7 | Bottom Left |
| 3 | Top Right | 8 | Bottom Center |
| 4 | Middle Left | 9 | Bottom Right |

- **High bits** (UNKNOWN): the firmware factory receipts (B_ECS 7/8/9) use `Align = 192 (0xC0)` on full-width rows (logo bitmap, store name, device postils 1-8, dashed separators) and `198 (0xC6)` on the cloud-pay-ID row. So bits 6-7 are extra flags and the low nibble is the 0..9 snap. Their meaning is UNKNOWN (plausible: auto-wrap / auto-height / skip-if-empty).
  The PC software does not know them (preview falls through to top-left) but keeps the value. **Our editor must preserve unknown bits and compare `align & 0x0F`.**
  **[verified-add]** Data context (B_ECS PF-7/8/9, 38 × 192 and 3 × 198):
  - 0xC0 sits on the logo bitmap (6,1), Store Name (Sale 0), Device Postils (Sale 17-24) and on two of the three dashed separator rows (Const Text2).
  - The third separator in PF-7 (SubID 20) uses plain 5.
  - The PC receipt templates (13xxx) put **Align 0 ("Default")** on the same kinds of rows (e.g. 13201 SubID 0 logo = 0, SubID 2 store name = 0).
  - 198 = 0xC0|6 is used only on the cloud-pay-ID row (Sale 69, Print 32).

  So 0xC0 looks like extra flags added to "Default"/snap, not a new alignment. A safe preview rule is `a = align & 0x0F; if (a===0) a = 5`.
  Semantics are still UNKNOWN: "skip if empty" does not fit, because the dashed separator is never empty.
  Also note that the LabelForm Snap combo binds `SelectedValue` to Align, so a value of 192 shows an empty combo.

### 2.8 Partition (Flag1=5) semantics — CONFIRMED (Help `DT-Set/Print Format.htm`) + code
- **Area Flag (Flag2=0)**: splits the format into areas. For each area, the firmware subtracts the partition's `Top` from the Y of the elements that follow. Example from the Help: partitions at SubID 20 (Top 100) and 50 (Top 200) → SubIDs 21-50 print at y−100 and SubIDs 51+ print at y−200.
  An area that contains Item elements with Flag2=0 ("X") is **repeated once per accumulated item** (receipt lines).
  The firmware appends its own area flag as item **101**. Flag3 = extra blank feed in mm.
- **Page Print (Flag2=1)**: feed past the gap (label paper) or a fixed distance (plain paper). The firmware appends this as item **100**.
- **Line Print (Flag2=2)**: flush (print) everything so far now, then feed Flag3 mm.
- Because areas are defined by SubID order, the PC renumbers SubIDs by vertical position whenever a format contains any partition. Key = `Top*10000 + (Left+1)`; `Top*10000` for partitions; `Top*10000 − (Left+1)` for Angle 2/3. This runs on save when `fucLabelReID=True` (`LabelForm.cs:1183-1203, 1231-1301`; `app.config:235`).
  **Our editor must do the same for any format with Flag1=5.** Item labels without partitions keep arbitrary SubIDs.
  **[verified-fix]** It does not renumber 0..n. `SaveData` (`LabelForm.cs:1231-1301`) runs a selection sort that **permutes the existing SubID values**: the set of numbers, gaps included, is kept, and the element contents are reassigned so that ascending SubID = ascending key.
  - Details of the key (`LabelItem_Pos`, `LabelForm.cs:1183-1203`): `Left+1` is clamped to 1..9999. A partition gets `Top*10000` exactly, so it sorts **before** a normal element on the same Top but **after** an Angle 2/3 element on the same Top.
  - The sort runs over every format in the dataset that contains a partition, whenever there are unsaved changes.
  - Our editor should copy this behaviour (keep the gaps) so the SubIDs match the vendor tool.

---------------------------------------------------------------------------------------------------------------------------

## 3. Data-code tables

### 3.1 Item (Flag1=1) — the field is in **Flag3** (Flag2 = item index: 0 "X", 1..31 = n-th accumulated item)
CONFIRMED `inst/en/LabelItem.xml`. Manual Table 5-8 (p.65-66) has 0-30 with slightly different names in brackets.
**[verified-add] Caution when reading the Help table** (`DT-Set/Print Format.htm`). It prints two independent lists side by side: the Choice2 item index (1..9, "…", 20..31) and the Choice3 field names (Amount … Index, Note, Sale Date … Text 7). Rows like "20 | Sale Date" or "24 | Shelf Date" do **not** mean Flag3=20/24. The real codes are the XML/Manual ones (Sale Date 11, Shelf Date 15, Text1 16).
CONFIRMED by data: template 11000 SubID 19 = Item Flag3 **15** with Print 9 "Shelf Date".

| Flag3 | Field | Notes |
|---|---|---|
| 0 | Name | PLU name |
| 1 | Weight/Pcs ("Amount") | net weight for weighed PLUs, quantity for counted PLUs |
| 2 | Tare | |
| 3 | First Unit Price | price before any discount rule |
| 4 | **Payable Unit Price** ("Real Price") | the unit price labels show |
| 5 | Price (item total "T.Price") | the templates use Sale Info 27 on item labels instead |
| 6 | PLU Number | |
| 7 | Class Number | |
| 8 | Dept. Number | |
| 9 | Index Barcode ("Index") | PLU `Index` (external barcode) |
| 10 | Item Code | PLU `Remark` (shown as "Item Code" in PluForm) |
| 11 | Sale Date | |
| 12 | Sale Time | |
| 13 | Package Date | |
| 14 | Package Time | |
| 15 | **Shelf Date** (use-by / HSD) | pair with Print=9 or Print=1 |
| 16..22 | Text 1..Text 7 | PLU Text1..Text7 |
| 23 | Gross | |
| 24 | Measure Unit | unit name of the PLU (e.g. kg / pcs) INFERRED |
| 25 | Price Unit | the "/unit" of the unit price INFERRED |
| 26 | Price without Tax | |
| 27 | Tax | |
| 28 | Item Service Fee | |
| 29 | Tax Rate | |
| 30 | PLU No and Name | |
| 31 | PLU U.Price Before Discount | |
| 32 | Weight of by-count PLU | |
| 33 | Bitmap | the PLU's own picture = PLU column `Bitmap` (last PLU field f[67]), an ECS.SBP ID (`PluForm.cs:3001-3008`) |
| 34 | Tare from package | |
| 35 | Tare from percent | |
| 36 | Tare percent number | |
| 38 | UNKNOWN — used by firmware receipts PF-7/8/9 SubID 23 (right of the item name, where templates put PLU Number or Index) | not in any XML |

**[verified-add]** About code 38 in PF-7: SubID 23 (Item X, Flag3 38, Align 6 Middle Right) sits in the header's Text4 column. PF-7/8/9 leave **Text4 empty**, while template 13001 has Text4 = "Item No". So 38 is some per-item code or number printed without a caption. Its exact field is still UNKNOWN.

### 3.2 Sale Info (Flag1=2) — the field is in **Flag2**; Flag3 = 0 unless noted
CONFIRMED `inst/en/LabelItem.xml`. Manual Table 5-8 p.66-67 names 27 "Net Price" and 28 "Gross Price".

| Flag2 | Field | Flag2 | Field |
|---|---|---|---|
| 0 | Store Name (= global string TMT 0) | 34 | Serviceman Number ("Waiter Number") |
| 1 | Device Name (= TMT 1) | 35 | Serviceman Name |
| 2 | Device Number | 36 | Reserved 1 (= TMT 12) |
| 3 | **Print Date** | 37 | Reserved 2 (= TMT 13) |
| 4 | **Print Time** | 38 | Industry Mark (= TMT 14) |
| 5 | Add-up Times | 39 | WiFi SSID (= TMT 15) |
| 6 | Total Count | 40 | WiFi Password (= TMT 16) |
| 7 | Total Weight | 41 | Reserved 6 (= TMT 17) |
| 8 | Total Price (before rounding) | 42 | Reserved 7 (= TMT 18) |
| 9 | Payment | 43 | Server's Domain Name (= TMT 19) |
| 10 | Change | 44 | Service Fee |
| 11 | Rounding Money | 45 | Tax of Service Fee |
| 12 | Unit of Weight | 46 | Service Fee without Tax |
| 13 | Unit of Weight Price | 47 | Table Number ("Buffer Number") |
| 14 | Unit of Count | 48 | Card Balance |
| 15 | Unit of Count Price | 49 | Card Original |
| 16 | **Unit of Money** (currency) | 50 | Card Text — **Flag3**: 0 Card Number, 1..15 Text1..Text15 |
| 17..24 | Device Postil 1..8 (= TMT 4..11) | 51 | Card Payment |
| 25 | FID (Manual: Flag3 0~8 = least digits; also Spec143) | 52/53/54 | Payment 1/2/3 |
| 26 | SID (same) | 55 | Sale Type |
| 27 | **Grand Total** (the item total on item labels) | 56 / 57 | VIP Primary ID / VIP Assist ID |
| 28 | Add-up Price (before discount and rounding) | 58 / 59 | VIP Discount / VIP Point |
| 29 | Money of Discount and Rounding | 60 | Grand Total (second currency) |
| 30 | Salesman No. | 61..64 | Custom Info 1..4 — **Flag3**: 0 Original, 1 CoPLU Name, 2..8 CoPLU Text1..7 |
| 31 | Salesman Name | 65 | MAC |
| 32 | Total Price without Tax | 66 | Money of Discount and Rounding (tax included) |
| 33 | Total Tax | 67/68/69 | Cloud pay type / amount / ID (zh-CHS, es XML only) |
| | | 70/71/72 | UNKNOWN, seen only in firmware receipts: captions "JKY Pay:", "Orignal Total:", "Saved:" (INFERRED) |

The TMT mapping (global strings, TMS section `TMT\t<id>\t<text>\t`, names in `inst/Tm.xml` `String_Info`) is CONFIRMED by the wizard code that decides which global strings a format needs: `WizardForm.cs:5247-5264` and `3931-3946`.
**[verified-add]**
- The wizard writes exactly those TMT IDs (`TMT\t{i}\t…` for every flagged `PT_GlobalText_ED[i]`, `WizardForm.cs:1941-1950`), so index = TMT StringID.
- Tm.xml has TMT 0-27. TMT 20-27 = "Custom Text 1..8" have no Sale Info code mapped to them in the wizard.
- Manual V3.04A Table 5-8 names Sale Info **36 "Text of Item Service Fee"** and **37 "Text of Service Fee"**, where the XML says Reserved 1/2 (= TMT 12/13). The manual also names 34/35 "Waiter Number/Name" and 47 "Buffer Number".
- Wizard quirk: a Bitmap element (Flag1=6) also sets `PT_GlobalText_ED[Flag2]` (`WizardForm.cs:3948-3951`). So a logo #1 makes the wizard emit TMT 1 (Device Name). This is harmless but explains extra TMT rows.
The mapping is 0→0, 1→1, 17..24→4..11, 36..43→12..19. TMT 2/3 are "Prefix/Suffix of Money Unit" (INFERRED source of code 16).

### 3.3 Const Text (Flag1=3)
`Flag2 = n` prints LAB `Text(n+1)`, i.e. TMS column `textCol(n) = n<16 ? 6+n : 7+n` (CONFIRMED `LabelForm.cs:1435-1451`, `FlagForm.cs:217-221`).
The Manual (V3.04A) documents slots 0~15 only. Slots 16..31 (Text17..32) are used by all newer receipt templates and by the firmware's own PF-7/8/9 (Flag2 up to 27), so current firmware supports them. CONFIRMED by data.

### 3.4 Barcode (Flag1=0)
Flag2: 0 readable, 1 no readable (CONFIRMED). Flag3: 0 = "System" (the barcode format chosen by the normal rules: PLU `BarT1`/`BarF1` (PLU f[9]/f[10]), else Spec001/Spec002, per Spec054), 10..29 = fixed BAR format ID (INFERRED from the XML value list 10..29 = user barcode IDs).
Barcode content and structure come from the `BAR` table (`BAR\tID\tName\tFormat\tCheck\tNum1\tNum2\tTChar\t`, `SaveForm.cs:1078`). That is outside this spec.
**[verified-add]** Evidence on Flag3:
- Manual V3.04A Table 5-8 says, for the Barcode row, "Flag3 blank means no effect". The V3.04A firmware documentation therefore ignores Flag3. The 10..29 list comes only from the newer XML.
- Every barcode element in all data has Flag3=0 (18 in B_ECS, 8 in the TMS).
- The Barcode tables hold IDs 0-9 (factory "Barcode-1..6", "B-Sum 1..3") plus 28 "QS-Item" and 29 "QS-Sum". The wizard creates the last two (`WizardForm.cs:1800-1910`) and points Spec001/005-side settings at them, not LAS Flag3.

So "Flag3 = BAR ID" stays INFERRED. Always write 0.
Rendering parameters: narrow/wide bar dots Spec031/Spec032 (0 = default), readable font Spec033. The element box is the barcode area. How the firmware fits bars into the box is UNKNOWN. The templates give 281×113 dots (EAN-13 on 60×40).

---------------------------------------------------------------------------------------------------------------------------

## 4. LAE and the LAB block in a TMS file; label selection

### 4.1 Block grammar (CONFIRMED `SaveForm.cs:1082-1106`, `TMS` lines 41-2338)
```
[CLR\tLAB\t]                 optional: only when "clear" is ticked → wipe user formats on the scale
[CLR\tEND\t]
DWL\tLAB\t
  LAB\t…40 fields…\t
  LAS\t…\t                   0..100 rows, SubID ascending
  LAE\t                      end of this format (always present, even with 0 LAS)
  … next LAB …
END\tLAB\t
```
- **LAE** has no fields. The serial and Ethernet upload loops use it as the terminator of the LAS list (`SaveForm.cs:2122-2131`, `NetForm.cs:2966-2975`). The TMS-file importer ignores it and attaches LAS to the last LAB seen (`RDS.cs:1016-1040, 1113`).
  **[verified-add]** The importer drops LAS rows when the current LAB was skipped (protected ID < 10) or has ID 0 (`case "LAS": if (blabel && num > 0)`; `num = 0` for a protected LAB). A serial or Ethernet upload that is missing its LAE would swallow the next LAB's lines into the LAS loop until an LAE appears. So LAE is mandatory for scale uploads.
- Our writer must emit LAB, its LAS rows and LAE together. It must not drop LAE.
- Export filter: non-SuperAdmin file export and **all Ethernet downloads send only IDs 10..99** (`SaveForm.cs:1092,1433`; `NetForm.cs:3505`). The vendor `_ECS.TMS` is a SuperAdmin/template file and contains 0 and 11000-14001.
  **[verified-fix]** Precisely:
  - File export (`SaveToFile`, `SaveForm.cs:1092`): SuperAdmin gets every ID, other roles get 10..99.
  - **Serial** download (`SaveToSerial`, `SaveForm.cs:1433`): always 10..99, whatever the role.
  - Ethernet (`NetForm.cs:3505-3508`): always 10..99.
- Import filter: when "protect" is on, LAB IDs < 10 (and their LAS) are skipped (`RDS.cs:1004-1012`, `SaveForm.cs:2118-2121`, `NetForm.cs:2960`).
- There are 33 LAB blocks and 2230 LAS rows in the vendor TMS.

### 4.2 Which format a sale prints (Manual p.22-23 §2.2 + Tm.xml specs)
Specs (`inst/Tm.xml` `Spec_Info`; TMS section rows `TMS\t<SpecID>\t<value>\t`):
- 000 Bill 1 Item Print Format · 001 Item Barcode Format · 002 Item Barcode Flag · 003 Item Print Times · 004 Item Print Reversed
- 005 Sum Print Format · 006-009 the same for the sum
- 010-019 the same for **Bill 2**
- 350-359 the same for the network printer (PTR)
- 021 paper type (0 plain / 1 gap) · 022/023 gray level · 024 plain-paper interval · 025 cut-off position
- 054 "Print Format and Barcode Select" · 056 Print Function (which bills) · 065 Reprint · 256 Pre-print · 278 hang-up bill format · 289 other-transaction format

Rules (Manual text, CONFIRMED): *"If two or more goods are sold, print sum bill and use Spec005 as print format. If only one good is sold, print the item bill. If sale PLU has been set for a specific print format (not 0), system would use the print format. If … 0, the print format would be Spec000."* Bill 2 uses Spec010/015 and PLU LabelID2.
- PLU line positions (CONFIRMED `SaveForm.cs:1060`): **f[8]=LabelID1, f[9]=BarT1, f[10]=BarF1, f[11]=LabelID2, f[12]=BarT2, f[13]=BarF2, f[14]=ClassID**.
- CLS line: `CLS\tClassID\tName\tDeptID\tLabelID1\tBarT1\tBarF1\tLabelID2\tBarT2\tBarF2\t` (`SaveForm.cs:1041`).
- Spec054 values (CONFIRMED list, semantics INFERRED): units digit = print-format source (0 "default" = PLU→Spec000 rule above, 1 = always Spec, 2 = the Class's LabelID); tens digit = barcode source (0 default, 1 Spec, 2 Class).
- Spec003 = 0 → item bills are not printed. Spec056 selects bill 1 / bill 2 / both / gap-vs-plain paper.
- The wizard writes `TMS\t0\t<itemFormat>`, `TMS\t5\t<sumFormat>`, `TMS\t21\t…`, `TMS\t22/23\t<gray>` and `TMS\t250\t…` (`WizardForm.cs:1640-1680`).
  **[verified-add]** Detail (`WizardForm.cs:1643-1681`):
  - **Prepack mode, one item only**: `TMS 250 1` (plus a second block with `250 2` when not "print direct"), and `TMS 0 <item>` only.
  - **Prepack mode with accumulation**: `TMS 250 0`, `TMS 5 <sum>`, `TMS 0 <item>`.
  - **Non-prepack (receipt) mode**: `TMS 250 0`, and **both** `TMS 0` and `TMS 5` = the receipt format.
  - Spec250 = "Accumulation Mode" (0 Normal / 1 [Accu] does the same as [Print] / 2 can accumulate only once).
  - This matches Manual Table 5-5 notes 4-6: plain paper → Spec000 = Spec005 = 7/8/9.
  - For a Beeftown prepack label, Spec000 is the item label that matters.
- Data seen: every PLU in A/B has LabelID1=LabelID2=0. Spec000=1 and Spec005=4 in the dumps and vendor TMS. So in those DBs everything prints factory format 1 (or the Spec value on the real scale).

**Consequence for `Beeftown_Can_TMA.html`** (`activeLabel = labels.find(f[1]===spec[0] && f[3]==='1') || first Sort-1 label`):
- This is right only when the PLU's LabelID1 is 0 and Spec054's units digit is 0.
- Improve it: resolve per PLU = `plu.f[8]` if ≠0; else (Spec054%10==2 ? class LabelID1 : Spec000).
- If the resolved ID is 1..9 and the file has no such LAB, say "factory format N (built into the scale)". The layouts of PF-1/2/3/5/6 are identical to templates 11000/11100/11200/12100/12200, element for element (CONFIRMED by comparing `dump/B_ECS` labels 1-9 with the templates; PF-1 == 11000 exactly), so we can preview them from the template.
  **[verified-fix]** Re-compared with a script (`scratchpad\verify-label\cmp.py`, `cmp2.py`):
  - **PF-1 == 11000 exactly**, SubIDs and texts included.
  - PF-2 / PF-3 have the same element set as 11100 / 11200, but **different SubID numbers** (renumbered; no partitions, so the print result is the same).
  - PF-5 / PF-6 have the same geometry as 12100 / 12200, with different SubIDs and **one caption changed**: Text1 is "Total Label:" on the scale vs "T-Label:" in the template.
  - **PF-4 is not identical to 12000.** Several heights are 32 instead of 34, and the rows sit 2-6 dots higher (e.g. barcode at y 32 vs 34, footer rows at y 191/209 vs 195/215). Text1 also differs.
  - PF-7/8/9 differ from every template (different heights, Sale Info 67-72, Item 38, Print 32/34-36, Align 192/198).

  A template preview of a factory format is therefore exact only for PF-1, and approximate for the others.
- Also show the sum format (Spec005) when accumulation is used.

---------------------------------------------------------------------------------------------------------------------------

## 5. Bitmaps / logos (Flag1=6 and Item Flag3=33)

- **Conversion** (CONFIRMED `WizardPicForm.cs:153-194`): the user picks a JPG/other image. `Binary\BitmapConvert.exe "<src>" "<WF_Pic.bmp>" <w> <h> <mode>` produces a 1-bpp BMP.
  mode = threshold 0..255 (default 128), or 256+k for dither pattern k=0..7.
  Max size is 432×432 dots (54×54 mm) (`BitmapForm.cs:521,570`). "Original size / Zoom / Custom" keep the aspect ratio.
  - Our replacement: canvas → grey → threshold or ordered/error-diffusion dither → pack. **Do not run BitmapConvert.exe.**
- **Packing**: rows top→bottom. Each row has `ceil(w/8)` bytes (stride padding dropped), MSB = leftmost pixel, **bits inverted so 1 = black** (`~array[...]`).
  Each byte becomes two chars `'@'+(b>>4)`, `'@'+(b&15)` (i.e. `@ABCDEFGHIJKLMNO`) (`Program.cs:124-139`).
- **Storage**: `ECS.SBP` (and `Config\<lang>\Default.sbp`) = .NET BinaryFormatter `List<SinglePicture>{ID, Name, Used, Picture(Image), PicString, PicSize}` (`SinglePicture.cs`, `BitmapFuc.cs:51-86,167-173`). Pictures are **not in the mdb**.
  - Used ("block quantity") = `ceil((len(PicString)+192)/8192)`: 4-KiB blocks including a 96-byte header.
  - A picture with ID n occupies IDs n..n+Used−1. The next picture must start after that (`BitmapFuc.cs:88-126, 203-224`).
  - IDs 1..255.
  - Both installs' `ECS.sbp` files are **0 bytes**, so no pictures exist. The receipt templates reference bitmap #1 (logo), which is therefore empty.
- **TMS transport** (CONFIRMED `SaveForm.cs:1144-1169`, `NetForm.cs:3600-3630`): a separate section, not part of LAB.
  ```
  [CLR\tBMP\t / CLR\tEND\t]
  DWL\tBMP\t
  BMP\t<ID>\t<payload>\t
  END\tBMP\t
  ```
  `payload` = `@`-hex of: ID (4 bytes, LE) + width px (2 bytes, LE) + height px (2 bytes, LE) + 88 zero bytes (22×uint32), then PicString.
  Our tool's section list (`SECTION_NAMES`) lacks `BMP` and `FNT`. Unknown sections pass through untouched, which is correct.
- **[verified-add] Bitmaps travel one way only.**
  - There is **no BMP (or FNT) reader** anywhere in the program: `RDS.cs` (the TMS import switch has no `"BMP"` case), the `SaveForm` serial upload and the `NetForm` Ethernet upload.
  - The writers are `SaveForm.cs:1153-1168` (file), `SaveForm.cs:1495-1510` (serial) and `NetForm.cs:3608-3626` (Ethernet), all with the same payload.
  - So logos cannot be recovered from a scale or TMS file by the vendor tool. Our tool must decode the `@`-nibble payload itself if it wants to preview a BMP section.
  - FNT is the same: `FNT\t` + `@`-nibble dump of `Binary\Font.bin` or `binary\Font\<name>.bin` + `\t` (`SaveForm.cs:1124-1142`).
- **[verified-add] Row padding.** Each row is `ceil(w/8)` bytes taken from the 1-bpp BMP **after** `~` inversion (`WizardPicForm.cs:171-177`). So when `w % 8 != 0`, the pad bits of the last byte are whatever the inverted source stride holds. Presumably the printer ignores bits past `w` (INFERRED). Our encoder should clear them to 0 (white).
- **[verified-add]** The 1 = black convention assumes BitmapConvert writes a palette with index 0 = black, as the GDI+ 1-bpp default does. That is INFERRED, since BitmapConvert.exe is not run.
- PLU picture: PLU column `Bitmap` (TMS PLU f[67]) = a bitmap ID, printed where a format has `Item / Flag3=33`.

---------------------------------------------------------------------------------------------------------------------------

## 6. Shipped templates and the technician's custom labels

### 6.1 Vendor templates (`TMS` = `dump/A_en_Default`, identical in A_ECS/B_ECS). Sizes: DB dots → TMS mm.
| ID | Sort | Name | dots | mm | #elements |
|---|---|---|---|---|---|
| 0 | 1 | System Default | 0×0 | 0×0 | 0 |
| 11000 | 1 | Item Label: 60*40mm | 432×296 | 54×37 | 22 |
| 11100 | 1 | Item Label: 40*30mm | 304×216 | 38×27 | 18 |
| 11200 | 1 | Item Label: 60*30mm | 432×232 | 54×29 | 18 |
| 11300 | 1 | Item Label: 30*40mm (all Angle=3) | 224×304 | 28×38 | 18 |
| 12000 | 2 | Sum Label: 60*40mm (Item[1..10] name+price rows) | 432×296 | 54×37 | 35 |
| 12100 / 12200 / 12300 | 2 | Sum Label 40*30 / 60*30 / 30*40 | 304×216 / 432×224 / 224×304 | 38×27 / 54×28 / 28×38 | 15 / 23 / 15 |
| 13001-13008, 13020 | 3 | Receipt 57mm variants (D-Line with Number/Index/LongName/Discount, S-Line) | 384×944 (13004: 384×1192) | 48×118 (48×149) | 91-95 |
| 13101-13108, 13120 | 3 | Receipt 40mm variants | 304×696 | 38×87 | 91-95 |
| 13201-13203, 13208, 13220 | 3 | Receipt 60mm variants | 432×1224 | 54×153 | 91-94 |
| 14000 / 14001 | 4 | List: 57mm / Big Font | 384×80 / 384×96 | 48×10 / 48×12 | 9 / 8 |

Note that the "60×40" paper templates are only **54 mm (432 dots) wide × 37 mm high**: the printable area, not the paper size. B_ECS additionally holds the firmware's PF-1..PF-9 (IDs 1-9). PF-7/8/9 = 54×175, 38×96, 48×134 mm receipts.

### 6.2 User formats in the technician DBs (abstract; other customers' texts omitted)
- **10, 11** (A and B): clones of 11000 (60×40) with English captions. 10 lacks the PLU Text1 block. 11 has SubIDs re-ordered.
- **27** (A and B): clone of receipt 13001 (57 mm) with Vietnamese captions (Đơn giá / Tr.lượng/PCS / Thành tiền / Tổng cộng / Khách đưa / Tiền thối, and Text26 = "Tên Sản Phẩm").
  **[verified-add]** B_ECS 27's **Name** is `Clone: Receipt: 57mm, D-Line with Number and Disc` + 2 spaces (51 chars), where A_ECS has the full 53-char name. B_ECS also contains the firmware PF-1..9, so it has received an upload from a real scale.
  A name cut at 49 characters and padded is consistent with a round trip through a scale whose Name field holds about 50 bytes. This is INFERRED and the only hint on unknown #8. Keep LAB Name ≤ 48 ASCII bytes to be safe.
  (Texts are not truncated in B; B_ECS 28 holds a const text of 68 UTF-8 bytes, but 28 may never have made the round trip.)
- **90000 "Recycled: Clone: Item Label: 60*40mm"** (A and B) — **the Vietnamese 60×40 item label** ('giá', 'số kg', HSD-style slot). It sits in the recycle bin, so it is an older label 28 that a later wizard run replaced.
  **[verified-fix]** "Older label 28" is INFERRED, not proven.
  - The recycle code (`WizardForm.cs:5644-5676`) moves whatever occupies the clone target of the current wizard step: 28 for item labels, 29 sum, 27 receipt, **26 for the generic "other" step**.
  - An item-label clone done from the generic step would have landed in 26.
  - 28 is the most likely source, because the name says "Clone: Item Label" and the size is 432×296.
  - A_ECS 90000 and B_ECS 90000 are identical, element for element and in texts.
  Layout = template 11000 geometry (432×296 dots), 22 elements:
  1. Row 0 (y 0, h 34): PLU Name (font 2, centered, w 362) + PLU Number (font 0, right block w 70).
  2. Row 1 (y 34, h 26, font 1): Const Text1 "giá" (price caption) | Item Price Unit | Const Text2 "số kg" (**Print=2**, weighed only) and Const Text3 "Count" (**Print=3**, counted only) in the same box | Item Measure Unit | Const Text4 "tiền" | Sale Info Unit of Money.
  3. Row 2 (y 60): Item Weight/Pcs (139,60,141×26) | Sale Info **Grand Total** (font 2, 282,60,149×34) | Item Payable Unit Price (1,62,137×26).
  4. Barcode (readable, System format) at 0,88,281×113 + Item Text 1 block (285,94,147×107, font 0).
  5. Row y 202 (font 0): Const Text5 "ngày bán" | Text6 "thời gian" | Text7 "ngày dóng gói" [sic] with **Print=9** (shelf-date only). So the technician captioned the use-by slot "packing date".
  6. Row y 220: Sale Info Print Date | Print Time | Item **Shelf Date** (Print=9).
  7. Rows y 240 / 266: Sale Info Store Name / Device Name (full width, font 1).
- **28** (wizard "item label" slot, 58×40 mm = 464×320 dots; label Name = another shop's name, omitted). Two versions:
  - **A_ECS 28 (the "HSD" layout, 14 elements).**
    - Name font 6 (28×52) at 19,0 w408 h53, and PLU No font 0 at 408,1.
    - Captions Text2 "Trọng Lượng" (Print=2) and Text1 "Đơn giá" at y 61.
    - Text4 "Thành Tiền" font 5 at 291,76.
    - Weight/Pcs (6,93) and Payable Unit Price (128,95).
    - Barcode 3,128 245×85 (Align 0).
    - **Grand Total** font 5 (18×68) at 256,132 207×58.
    - Text5 "Ngày đóng gói" + Sale Info Print Date at y 216.
    - **Item Shelf Date (Flag3=15, Print=1)** at 109,240 + Const **Text17 "HSD"** (Flag2=16) at 19,243.
    - A company-name Const Text13 (font 6) at 12,269, omitted.
  - B_ECS 28 (15 elements): the same idea for another customer. It has a "NĐG:" + Print Date but **no shelf-date element**, plus a warning line and supplier/PLU/address const texts (customer data, omitted).
  - Our tool's built-in `EXAMPLE.label` (id 28, "BEEFTOWN", 58×40) has the A_ECS-28 structure, including Shelf Date + "HSD". Its 9th number per element is the **Align** value, not a size.

---------------------------------------------------------------------------------------------------------------------------

## 7. One fully decoded label — template 11000 "Item Label: 60*40mm"

Raw LAB (TMS line 44):
`LAB→11000→Item Label: 60*40mm→1→54→37→Price→NetWT→Count→Total→Sale Date→Sale Time→Shelf Date→(Text8-16 empty)→1→(Text17-32 empty)→`
- Sort 1 (item label), 54×37 mm = 432×296 dots, Version 1.
- Text1..7 = Price, NetWT, Count, Total, Sale Date, Sale Time, Shelf Date.

| SubID | raw LAS fields (after "LAS") | element (Flag1,Flag2,Flag3) | Print | Angle | Align | Font (W×H dots) | box x,y,w,h dots | box mm |
|---|---|---|---|---|---|---|---|---|
| 0 | `0 1 0 0 1 0 5 2 0 0 362 34` | Item[X]: Name | 1 Always | 0 | 5 Middle Center | 2 (18×34) | 0,0,362,34 | 0,0,45.25,4.25 |
| 1 | `1 1 0 6 1 0 5 0 362 0 70 34` | Item[X]: PLU Number | 1 Always | 0 | 5 Middle Center | 0 (10×18) | 362,0,70,34 | 45.25,0,8.75,4.25 |
| 2 | `2 3 0 0 1 0 6 1 0 34 80 26` | Const Text1 'Price' | 1 Always | 0 | 6 Middle Right | 1 (14×26) | 0,34,80,26 | 0,4.25,10,3.25 |
| 3 | `3 1 0 25 1 0 4 1 82 34 60 26` | Item[X]: Price Unit | 1 Always | 0 | 4 Middle Left | 1 | 82,34,60,26 | 10.25,4.25,7.5,3.25 |
| 4 | `4 3 1 0 2 0 6 1 160 34 74 26` | Const Text2 'NetWT' | **2 Weight Item** | 0 | 6 | 1 | 160,34,74,26 | 20,4.25,9.25,3.25 |
| 5 | `5 3 2 0 3 0 6 1 160 34 74 26` | Const Text3 'Count' | **3 Count Item** | 0 | 6 | 1 | 160,34,74,26 | same box as 4 |
| 6 | `6 1 0 24 1 0 4 1 236 34 57 26` | Item[X]: Measure Unit | 1 | 0 | 4 | 1 | 236,34,57,26 | 29.5,4.25,7.125,3.25 |
| 7 | `7 3 3 0 1 0 6 1 300 34 72 26` | Const Text4 'Total' | 1 | 0 | 6 | 1 | 300,34,72,26 | 37.5,4.25,9,3.25 |
| 8 | `8 2 16 0 1 0 4 1 380 34 42 26` | Sale Info: Unit of Money | 1 | 0 | 4 | 1 | 380,34,42,26 | 47.5,4.25,5.25,3.25 |
| 9 | `9 1 0 4 1 0 5 1 0 60 137 26` | Item[X]: Payable Unit Price | 1 | 0 | 5 | 1 | 0,60,137,26 | 0,7.5,17.125,3.25 |
| 10 | `10 1 0 1 1 0 5 1 139 60 141 26` | Item[X]: Weight/Pcs | 1 | 0 | 5 | 1 | 139,60,141,26 | 17.375,7.5,17.625,3.25 |
| 11 | `11 2 27 0 1 0 5 2 282 60 149 34` | Sale Info: **Grand Total** | 1 | 0 | 5 | 2 (18×34) | 282,60,149,34 | 35.25,7.5,18.625,4.25 |
| 12 | `12 0 0 0 1 0 5 1 0 88 281 113` | Barcode, readable, System format | 1 | 0 | 5 | (1, ignored) | 0,88,281,113 | 0,11,35.125,14.125 |
| 13 | `13 1 0 16 1 0 5 0 285 94 147 107` | Item[X]: Text 1 (PLU Text1, multi-line block) | 1 | 0 | 5 | 0 | 285,94,147,107 | 35.625,11.75,18.375,13.375 |
| 14 | `14 3 4 0 1 0 5 0 2 202 138 18` | Const Text5 'Sale Date' | 1 | 0 | 5 | 0 | 2,202,138,18 | 0.25,25.25,17.25,2.25 |
| 15 | `15 3 5 0 1 0 5 0 142 202 134 18` | Const Text6 'Sale Time' | 1 | 0 | 5 | 0 | 142,202,134,18 | 17.75,25.25,16.75,2.25 |
| 16 | `16 3 6 0 9 0 5 0 283 202 144 18` | Const Text7 'Shelf Date' | **9 Shelf Date** | 0 | 5 | 0 | 283,202,144,18 | 35.375,25.25,18,2.25 |
| 17 | `17 2 3 0 1 0 5 0 1 220 138 20` | Sale Info: Print Date | 1 | 0 | 5 | 0 | 1,220,138,20 | 0.125,27.5,17.25,2.5 |
| 18 | `18 2 4 0 1 0 5 0 141 220 136 20` | Sale Info: Print Time | 1 | 0 | 5 | 0 | 141,220,136,20 | 17.625,27.5,17,2.5 |
| 19 | `19 1 0 15 9 0 5 0 280 220 148 20` | Item[X]: **Shelf Date** | **9** | 0 | 5 | 0 | 280,220,148,20 | 35,27.5,18.5,2.5 |
| 20 | `20 2 0 0 1 0 5 1 0 240 432 26` | Sale Info: Store Name (TMT 0) | 1 | 0 | 5 | 1 | 0,240,432,26 | 0,30,54,3.25 |
| 21 | `21 2 1 0 1 0 5 1 0 266 431 26` | Sale Info: Device Name (TMT 1) | 1 | 0 | 5 | 1 | 0,266,431,26 | 0,33.25,53.875,3.25 |

`LAE→` follows. This format is element-for-element identical to firmware PF-1 (B_ECS label 1).

Sketch (54×37 mm):
```
┌──────────────────────── Name (font2) ──────────────────────┬ PLU# ┐ y 0-34
│  Price │/kg│ NetWT|Count │ kg │   Total │ đ                        │ y 34-60
│ U.Price (17mm)│ Weight/Pcs (17.6mm)│  GRAND TOTAL (font2)          │ y 60-94
│ ███ barcode 35×14mm █████████████ │ PLU Text1 block (18×13mm)      │ y 88-201
│ Sale Date     │ Sale Time          │ Shelf Date (if shelf)         │ y 202
│ 2026.09.29    │ 14:05              │ 2026.10.03 (if shelf)         │ y 220
│                     STORE NAME                                     │ y 240
│                     DEVICE NAME                                    │ y 266-292
└────────────────────────────────────────────────────────────────────┘
```

---------------------------------------------------------------------------------------------------------------------------

## 8. How to draw a faithful preview / build an editor (recipe)

1. Parse LAB: `W = f[4]*8`, `H = f[5]*8` dots, `texts[i] = f[textCol(i)]` with `\v`→newline, `fontMode = f[22]`.
2. Parse each LAS into `{sub:f1, t:f2, a:f3, b:f4, print:f5, angle:f6, align:f7, font:f8, x:f9, y:f10, w:f11, h:f12}`. Keep the raw array so unknown values round-trip.
3. Sort by SubID. For a sample context (weighed vs counted, shelf date on/off, tare, etc.), **skip the element if `print` is false** (§2.6). At minimum handle 0, 1, 2, 3, 7, 8, 9. Treat other codes as "true" in item-label previews but mark them.
4. If there is any Flag1=5, apply the area offset (y − partition.Top) and, for receipts, repeat "X" areas per item. Item labels normally have no partitions.
5. For each element: `ctx.translate(x,y); ctx.rotate(angle*Math.PI/2)` (clockwise with y down). Then draw in box `(0,0,w,h)`:
   - **Text** (Flag1 1/2/3): line height = the font table above (18/26/34/36/52/68/52/68/136/102 dots). Horizontal scale for fonts 6-9 per the table. Position by `align & 0x0F` (0 → treat as 5).
     Clip to the box. Wrap only if Spec035 "Auto New Line Mode" = 1 (INFERRED; the default font fits roughly `floor(w/charW)` Latin characters).
   - **Barcode** (0): bars in the box, digits below if Flag2=0.
   - **Border** (4): rectangle stroke of `Flag2` dots.
   - **Bitmap** (6): 1-bpp image ID Flag2 from the BMP section, at the box origin (clipping INFERRED).
   - **Partition** (5): nothing is printed. Show a dashed guide line at Top.
6. Sample values: Name/PLU No/Unit price from the PLU line. Weight from the scale sample.
   - Grand Total = Sale Info 27 (not Item 5).
   - Dates are formatted per Spec104 (0 = `YYYY.MM.DD`, 4 = `DD/MM/YY`, …) and Spec265.
   - Decimal places come from Spec202/203 (price) and Spec180/181 (separators).
7. Editing invariants:
   - SubID unique 0..99. Label ID 10..99 for anything sent to the scale.
   - Width/Height multiple of 8.
   - Texts ≤255 chars, no TAB, newline→`\v`, NFC.
   - Keep `Version`. Keep unknown Align bits and unknown codes.
   - Renumber SubIDs by Y when partitions exist (§2.8).
   - Always emit `LAE\t` and the trailing TAB on every row.
   - **[verified-add]** The vendor wizard canvas rejects any move or resize whose real (rotated) box leaves the label or has width/height < 1 (`WizardForm.cs:4950-4961`, using `GetRealRect`). For a partition, only a Top inside 0..Height is accepted. After each edit it grows the label Width/Height to the largest element extent, capped at 2048×4096 (`WizardForm.cs:4962-4981`).
     Shipped data still breaks this slightly (template 11300 Name box reaches y = −1), so validate on edit, but do not reject a file on load.
   - **[verified-add]** Label 0 must never be sent. Every writer filters to 10..99 except the SuperAdmin file export.

---------------------------------------------------------------------------------------------------------------------------

## 9. Corrections and confirmations for `Beeftown_Can_TMA.html` PART 1

| Belief in the tool | Verdict |
|---|---|
| `type = f[2]` | ✅ Flag1 |
| `text = f[3]` | ✅ Flag2. Note the per-type meaning: text slot for type 3, **field code for type 2** (the tool already uses `e.text` for type 2 ✅), item index for type 1, readable flag for barcode, thickness for border, bitmap ID for bitmap |
| `data = f[4]` | ✅ Flag3: field code for type 1 ✅; barcode format for type 0; feed mm for partitions; sub-option for Sale Info 50/61-64 |
| `cond = f[5]` | ✅ Print. The tool handles only 2/3. It should also hide `0` (Not Print) and treat `9` as "only when a shelf date prints" (a HSD label depends on it) |
| `size = f[7]` | ❌ f[7] = **Align** (the EXAMPLE's last column = align values 0/4/5). Add `angle = f[6]`, `align = f[7] & 0x0F` (keep high bits), `font = f[8]` and size text by the font table instead of `h*0.62` |
| `x,y,w,h = f[9..12]` | ✅ dots, top-left origin. Rotation is ignored today: template 30×40 (Angle 3) would render wrong |
| `textCol(t) = t<16 ? 6+t : 7+t` | ✅ (f[22] = Version/font mode) |
| label size mm, 8 dots/mm | ✅ LAB f[4]/f[5] are mm. A "60×40" template is 54×37 mm printable |
| `activeLabel` via `spec[0]` | ⚠️ only the fallback: honour PLU f[8] (LabelID1) per product, Spec054 (spec/class), Spec005 (sum), and factory formats 1-9 that are absent from the LAB section |
| `cleanText` replaces `\t\r\n` with space | ⚠️ newline should become `\v` (the vendor's multi-line encoding). Tabs must still be removed |
| **[verified-add]** `parseTms` requires line 0 = `ECS VER` | ⚠️ files written by TM-xA begin with an empty line (after the BOM). Skip leading blank lines so that `_ECS.TMS` and PC-made TMS files open |
| **[verified-add]** `cond` weighed/counted test uses `sample.unit === '2'` | ⚠️ use the unit's `Punit` (UNT section, 1 weight / 2 count), see §2.6 |
| **[verified-add]** EXAMPLE label (id 28) | ✅ The 9-tuple is `[Flag1, Flag2, Flag3, Print, Left, Top, Width, Height, Align]`, compared element by element with A_ECS 28 (the last value matches A_ECS's Align in 13 of 14 elements; SubID 15 Payable Unit Price has Align 5 in A_ECS but 0 in EXAMPLE). The geometry is close but not identical (e.g. Name at x 0, h 43 in EXAMPLE vs x 19, h 53 in A_ECS 28), and Font is missing (A_ECS uses fonts 6, 5 and 1) |

---------------------------------------------------------------------------------------------------------------------------

## 10. Unknowns / open questions
1. Meaning of Align high bits 0x40/0x80 (values 192/198 in firmware receipts PF-7/8/9).
2. Item Flag3=38. Sale Info 70/71/72. Print conditions 34/35/36. These are all used only by firmware-resident formats: the codes are newer than this PC software's XML.
3. What the firmware does with Align=0 ("Default"). The PC preview centers it, but the printed result has not been verified.
4. Barcode Flag3 10..29: that it selects BAR format ID n is INFERRED from the value list, not seen in the firmware.
5. Exact Spec054 semantics ("default" vs "Spec" vs "class") — only the option list is confirmed.
6. Whether the scale's own USB export (`JHSCALE\A_000.TMS`) includes factory LABs 1-9 and BMP/FNT sections. There is no real scale export here. B_ECS labels 1-9 suggest that uploads include them.
7. Text overflow behaviour (clip vs wrap vs shrink) and Spec035 interaction. Bitmap clipping to the box. Border stroke inside or outside the box.
8. Maximum lengths the firmware accepts for LAB Text/Name (the DB allows 255).
9. Custom Print (Flag1=7) — no definitions shipped. It may be vendor-specific.

**[verified-add] Status after verification:**
- **#1** still open. New context: 0xC0 replaces "Default" (0) on logo, store name, postil and separator rows; 198 = 0xC0|Middle Right. See §2.7.
- **#2** still open. Captions confirmed from PF-7 texts:
  - Print 34 ↔ Text26 "Orignal Total:" + Sale 71 and Text27 "Saved:" + Sale 72.
  - Print 35 ↔ Text28 "JKY Pay:" + Sale 70.
  - Print 36 ↔ Text14 "Balance:" + Sale 48.
  - Sale 67/68/69 go with Print 32 "Cloud Pay Print".
- **#4** weakened further: Manual V3.04A says barcode Flag3 "blank means no effect", and all data has Flag3 = 0 (§3.4).
- **#6** unchanged. B_ECS holding PF-1..9 and a truncated Name for label 27 shows that a scale upload returns LABs 1-9. Whether the USB export `A_000.TMS` does the same is unproven.
- **#7** partly narrowed: no Border elements exist in any data, so border rendering cannot be checked from data.
- **#8** first hint: Name was cut to 49 characters on a scale round trip (INFERRED, §6.2).
- **#9** unchanged. The FlagDesigner (menu, `MainForm.cs:1316`) lets a SuperAdmin add codes to `LabelItem.xml`, but the startup merge overwrites root edits.
- **New unknown: code 38.** Its caption slot (Text4) is empty in PF-7/8/9 (§3.1).

Helper used for decoding (scratch): `scratchpad\work-label\decode.py` (`python decode.py <DB> <LabelID…>`).

---------------------------------------------------------------------------------------------------------------------------

## Verification log

Adversarial re-check done by a second agent against the decompiled source, the vendor TMS and the TSV dumps. Scripts are in `scratchpad\verify-label\` (`dec.py`, `cmp.py`, `cmp2.py`, `tmsdb.py`, `stats.py`, `li.py`, `combo.py`, `fonts.py`, `plu.py`).

| # | Claim checked | Evidence | Outcome |
|---|---|---|---|
| 1 | LAB column order `LAB,ID,Name,Sort,W/8,H/8,Text1-16,Version,Text17-32` + trailing TAB | `SaveForm.cs:1097`, `SaveForm.cs:1439`, `NetForm.cs:3510` (writers); `SaveForm.cs:2074-2112`, `NetForm.cs:2916-2958`, `RDS.cs:956-996` (readers, `*8`); TMS: all 33 LAB rows split into 40 fields | CONFIRMED |
| 2 | LAB Name is `\v`-escaped | All 3 writers pass `labelRow.Name` raw; only Text1-32 use `FormatString` (`Program.cs:525-528`) | **WRONG → fixed** (§1.2) |
| 3 | Width/Height in dots in the DB, mm in TMS, "always ×8" | Writers `/8`, readers `*8`. DB default Height = 270 (not ×8). Wizard auto-grow does not round (`WizardForm.cs:4974-4981`). All stored values are ×8 | Units CONFIRMED; "always ×8" **qualified** (§1.1) |
| 4 | LAS order `SubID,Flag1,Flag2,Flag3,Print,Angle,Align,Font,Left,Top,Width,Height` | Writers `SaveForm.cs:1101`, `SaveForm.cs:1443`, `NetForm.cs:3520`; readers `SaveForm.cs:2138-2149`, `RDS.cs:1023-1034`, `NetForm.cs:2984-2995`. Independent: TMS rows = DB named columns for every template in A_en_Default and B_ECS (0 mismatches, `tmsdb.py`) | CONFIRMED (no off-by-one) |
| 5 | Our tool `size=f[7]` is Align; Font = f[8]; Angle = f[6] | Same as #4. The EXAMPLE's 9th value matches A_ECS 28's Align in 13/14 elements | CONFIRMED |
| 6 | `textCol(t) = t<16 ? 6+t : 7+t` | LAB f[22] = Version; Text17 at f[23]. EXAMPLE col 23 = "HSD" = Text17 (Flag2 16) | CONFIRMED |
| 7 | Flag1 enum 0-7 and the Item Flag3 / Sale Flag2 / Flag4 code tables | `LabelForm.cs:34-44`; `en/LabelItem.xml` parsed (8 Flag1, 175 Flag2, 95 Flag3, 52 Flag4 rows); root file = same set; Manual Table 5-8 | CONFIRMED |
| 8 | Font table 0-9 (W×H dots) and preview pt sizes | `Combo.xml` `LabelItem_Font2` Display/Size (Size 9 = 52); zh-CHS/zh-CHT show full-width cells 18×18 … 102×102 | CONFIRMED |
| 9 | Print codes 0-33; 2 weight / 3 count / 9 shelf date | `Combo.xml` `LabelItem_Print` (34 rows); Manual Table 5-7 codes 0-13. es/ru/pt/fa/zh-CHT lack 33 | CONFIRMED (+ language note) |
| 10 | Align 0-9, 0 previewed as centre, high bits fall to top-left | `LabelForm.cs:1515-1554` (`case 0: case 5`), `AlignForm.cs:136-190`; data: 192 × 38 and 198 × 3 only in B_ECS 7/8/9 | CONFIRMED |
| 11 | Rotation model / `GetRealRect` | `LabelForm.cs:2579-2588` (the same in `WizardForm.cs:4211`); GDI+ `RotateTransform` clockwise; all 33 Angle=3 rows are in 11300/12300 | CONFIRMED |
| 12 | Partition semantics (area offset, X repeat, items 100/101, feed mm) | Help `DT-Set/Print Format.htm` text; LabelItem.xml 0..32 mm | CONFIRMED |
| 13 | SubID renumbering when partitions exist | `LabelForm.cs:1183-1301`: permutes the existing SubID values, not 0..n | **Imprecise → fixed** (§2.8) |
| 14 | LAE = terminator only; LAS attach to the last LAB | `SaveForm.cs:1103/1445`, `NetForm.cs:3522`; readers break on LAE; `RDS.cs:1113` ignores it; `RDS.cs` drops LAS when `num == 0` | CONFIRMED (+ detail) |
| 15 | Export filters (1092 file / 1433 / Ethernet) | 1092 = `SaveToFile` (SuperAdmin → all); 1433 = **`SaveToSerial`** (always 10..99); `NetForm.cs:3505` | Mislabelled path → **fixed** (§1.2, §4.1) |
| 16 | Label selection (LabelID1 = PLU f[8], LabelID2 = f[11], Spec000/005/010/015, Spec054 options) | PLU writer arguments parsed (`plu.py`): f[8] LabelID1, f[9] BarT1, f[10] BarF1, f[11] LabelID2, f[14] ClassID, f[67] Bitmap; Manual p.23; Tm.xml Spec054 list (0/1/2 + tens digit); dumps: all PLU LabelID1 = 2 = 0, Spec000 = 1, Spec005 = 4 | CONFIRMED (Spec054 semantics still INFERRED) |
| 17 | Wizard spec writes | `WizardForm.cs:1643-1681`: receipt mode sets Spec000 = Spec005 = receipt | CONFIRMED (+ added detail) |
| 18 | ID ranges 1-9 / 10-99 / 26-29 clone targets / 10000-19999 / 90000-90099 | `app.config` and `TM-xA.exe.Config` (identical values); `WizardForm.cs:3413-3504, 5630-5676` | CONFIRMED |
| 19 | PF-1/2/3/5/6 "identical element for element" to templates | `cmp.py`/`cmp2.py`: PF-1 exact; PF-2/3 same set with different SubIDs; PF-5/6 differ in caption Text1; PF-4 differs geometrically | **Overstated → fixed** (§4.2) |
| 20 | Template list, sizes, element counts | TMS per-LAB count: 11000 22, 11100/11200/11300 18, 12000 35, 12100 15, 12200 23, 12300 15, receipts 91-95, 14000 9, 14001 8; 33 LAB / 2230 LAS / 33 LAE | CONFIRMED |
| 21 | "Templates identical in A_ECS/B_ECS"; A_en_Default as a vendor source | A_en_Default Label/LabelItem = A_ECS byte-for-byte (`cmp`), including user labels 10/11/27/28/90000 | Templates CONFIRMED; Default.mdb **not pristine → added** (§1.4) |
| 22 | 90000 = Vietnamese 60×40 clone (giá / số kg / tiền / ngày bán / thời gian / "ngày dóng gói" with Print 9) | `dec.py B_ECS 90000`, identical in A_ECS; SubIDs 9-11 re-ordered versus 11000 | CONFIRMED; "older 28" marked INFERRED |
| 23 | A_ECS 28 "HSD" layout (14 elements, Shelf Date Flag3 15 Print 1, Text17 "HSD") | `dec.py A_ECS 28` | CONFIRMED |
| 24 | Bitmap pipeline (BitmapConvert args, 432×432 max, threshold 128 / dither 256+k, `~` inversion, `@`-nibbles, 96-byte header, Used formula, IDs 1-255, empty ECS.sbp) | `WizardPicForm.cs:26,153-194,532`; `BitmapForm.cs:521,570`; `Program.cs:125-139`; `BitmapFuc.cs:30-49,203-224`; `SaveForm.cs:1144-1169`; `ECS.sbp` and `Default.sbp` = 0 bytes (both installs) | CONFIRMED (+ one-way, padding) |
| 25 | `LabelItem.xml` copied on a language switch | `Program.cs:649-671, 738-745, 975`: merged and rewritten at **every start** | **Imprecise → fixed** (§2.3) |
| 26 | Vietnamese printable (U+1EA0-1EF9) | "Characters Printable in U Version" rows 784x-789x (decimal code points) | CONFIRMED |
| 27 | Text escaping `\v` ↔ CRLF | `Program.cs:224-227` (ParseString), `525-528` (FormatString) | CONFIRMED |
| 28 | TMT mapping of Sale Info 0/1/17-24/36-43 | `WizardForm.cs:3931-3946, 5247-5264, 1941-1950`; Tm.xml String_Info 0-27 | CONFIRMED |

Not re-verified (outside this pass): the exact PDF page numbers of the Manual citations. The text was matched in `manuals_txt\Printing Serial Scale V3.04A.txt` (lines ~725-737, 2269-2308, 2925-3100), not by page.
Privacy: product and customer texts found in B_ECS/A_ECS label 28 and PLU rows were only looked at and are not reproduced here.
