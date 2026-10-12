# TM-xA PLU record, HSD (shelf / use-by date) and Excel/CSV import — spec

Reverse-engineered from **TM-xA Management Program v3.10.60** (JHScale, .NET 2.0, x86; `tmxa-src/Properties/AssemblyInfo.cs:11`, `TM-xA.csproj:7-8`).
Goal: let our own tool (`C:\Beeftown\cong-cu\Beeftown_Can_TMA.html`) read/write PLU lines, HSD settings and spreadsheets that are 100 % compatible with the vendor software and the TM-A scale.

## 0. Evidence key

| Tag | Where |
|---|---|
| `SRC/x.cs:N` | decompiled source `scratchpad\tmxa-src\ECS\x.cs`, line N (`TA/x.cs` = `tmxa-src\ECS.ECSDataSetTableAdapters\x.cs`, `PROP/Settings.cs` = `tmxa-src\ECS.Properties\Settings.cs`) |
| `INST/…` | `C:\Users\khanh\Downloads\tma co hsd2\tma co hsd2\…` (read only) |
| `DUMP/<db>/<T>.tsv` | `scratchpad\mdb\dump\…` (A_ECS = install A `ECS.mdb`, B_ECS = nested copy, A_en_Default = `Config\en\Default.mdb`) |
| `MAN p.N` | `INST\Document\User Manual\Printing Serial Scale V3.04A.pdf`, PDF page N (text extracted to `scratchpad\work-plu\*.txt`) |
| `CHM:<topic>` | `INST\en\TM-xA.chm` (copy decompiled with Windows `hh.exe -decompile` into `scratchpad\work-plu\chm\`) |
| `Combo:<tag>` / `Tm:<SpecID>` / `LabelItem.xml` / `Lang:<key>` | UI definition XMLs in `INST\` (top-level = merged copy of `INST\en\*` + `INST\Config\Lang.xml`; semantic diff shows **no HSD-specific UI change** — only XML re-serialisation and the merged key `pw_PLUIE_Value`) |

Status tags: **[C]** CONFIRMED in code/data/manual, **[I]** INFERRED, **[?]** UNKNOWN.
No product names or label texts from the technician's other customers are reproduced here; only structure.

---

## 1. Short answers (TL;DR)

1. A PLU in a TMS file is one line: `PLU<TAB>` + **67 values, each followed by `<TAB>`** → `split('\t')` gives **69 items**, `[0]="PLU"`, `[1..67]` = fields, `[68]=""`. [C] `SRC/SaveForm.cs:1060`, `SRC/NetForm.cs:3444`; readers use `array[1]..array[67]` `SRC/RDS.cs:856-926`, `SRC/NetForm.cs:2758-2828`.
2. **"TMS index = DB column position + 1" is FALSE.** The MDB column order (PLUID, Valid, Remark, …) differs from the TMS order. The TMS order equals the scale-menu order `P23 PLU.nn` of the manual: **TMS index = nn + 1** (checked for PLU.00…PLU.57, `MAN p.49-52`). It also equals the order of `Lang:pw_PLUIE_Value` (minus ALPHA). Only PLUID (1) and BarT2 (12) coincide by chance. [C] (table §3).
   **[verified-add]** Re-checked all 67 writer arguments (`SRC/SaveForm.cs:1060`) against the TSV header: for the tail block TaxType…Bitmap the rule is TMS# = DB# − 1 (because PC-only `Valid` is DB#2), e.g. TaxType DB#58 → TMS 57, Bitmap DB#68 → TMS 67. There are **four** identical PLU writers (USB file `SaveForm.cs:1060`, RS-232 `SaveForm.SaveToSerial` `:1403`, Ethernet `NetForm.cs:3444` all-PLU and `:3452` single-PLU; argument lists compared programmatically, identical) and three readers with the same indices (`RDS.cs:856-926`, `NetForm.cs:2758-2828`, `SaveForm.OpenFromSerial` `SaveForm.cs:1938-2008` RS-232 upload, e.g. `:1968` PS_UD=array[27], `:1973` PC_UD=array[32]).
3. **HSD = PS_UD + PC_UD.** `PS_UD` (TMS[27]) is a *print switch* 0/1; `PC_UD` (TMS[32]) is a *relative number of days* 0…999 counted **from the day of printing** (scale clock). HSD printed = print date + PC_UD; PC_UD = 0 with PS_UD = 1 prints today's date. Same pattern for sale date (PS_SD[23]/PC_SD[28]) and pack date (PS_PD[25]/PC_PD[30]); time fields PS_ST/PS_PT are 0 = off, 1 = print the fixed time PC_ST/PC_PT (HHMM, 0…2359), 2 = print current time. [C] `MAN p.50`, `CHM:DT-Set/PLU`, `Combo:PLU_PS_Date/PLU_PS_Time`, `SRC/PluForm.cs:3651,3661,3671,3681,3691`.
4. The label must contain item **Flag1=1 (Item), Flag2=0 (X), Flag3=15 "Shelf Date"** (13 = Package Date, 11 = Sale Date). Date format = **Spec 104**; shelf-date policy = **Spec 105** (0 = use PLU setting) and **Spec 106** (global days). [C] `LabelItem.xml`, `Tm:104-106`.
5. What the technician's "co hsd" build really changed: spec rows 104/105/106 marked **Valid** (= sent to the scale) with value 0 in install A (`DUMP/A_ECS/Spec.tsv`, invalid in B), an Excel import mapping `PLUID, Name, Price, UnitID, Remark, PS_UD, PC_UD_Plus` (`DUMP/A_ECS/Excel.tsv`), and sample PLUs with `PS_UD=1, PC_UD=30`. No code change (same v3.10 program). [C]
   **[verified-fix]** The Excel mapping is **not** an A-vs-B difference: `DUMP/B_ECS/Excel.tsv` holds the identical 7-row mapping (only `Default_ECS` is empty). The HSD-specific differences of install A (and of `Config\en\Default.mdb` = `A_en_Default`, which is identical in all three respects) versus the nested copy B are: (a) Spec 104/105/106 Valid=True (B: all 500 spec rows Valid=False); (b) **label 28** has the HSD items SubID 27 (Item Flag3=15 Shelf Date) + SubID 28 (const Text17 "HSD"), whereas B's label 28 has only the "Ngày đóng gói" caption (SubID 20) + Print Date (SubID 26) and no shelf-date item (`DUMP/*/LabelItem.tsv`, LabelID 28); (c) PLUs 1-2 with PS_UD=1/PC_UD=30 (B: all PS_UD=0).
6. Excel/CSV import is **positional, no header** (`HDR=NO`): spreadsheet column *i* ↔ *i*-th row of table `Excel` (ordered by ID). A header row is harmless (it fails numeric parsing and is skipped). Pseudo-field `PC_UD_Plus` sets PC_UD and auto-sets PS_UD = (PC_UD ≥ 1). [C] `SRC/ExcelForm.cs:508-582, 651-709`.
   **[verified-add]** A header row is harmless only because the first mapped column (PLUID) is numeric; a header in a mapping that starts with `UnitID` would be *accepted* (the exception is swallowed). More important for our exporter: a **blank numeric cell drops the whole row**, and an import overwrites **every** field of an existing PLU, including HSD, with the sheet or default values (§6.1). On this PC CSV is Windows-1252 and `.xlsx` needs a 32-bit ACE that is not installed, so use `.xls`.
7. Our tool's column map `{NO:1, CODE:2, UNIT:4, PRICE:5, NAME:15, ALIAS:64}` and its 69-field `PLU_TEMPLATE` defaults are **exactly** what the vendor writes. [C] (defaults `SRC/ECSDataSet.cs:4191-4266`). Corrections needed elsewhere: see §8.

---

## 2. The PLU line on the wire (TMS / USB file / Ethernet)

### 2.1 Framing
- Section: `DWL<TAB>PLU<TAB>` … PLU lines … `END<TAB>PLU<TAB>`. Optional **clear block before it**: `CLR<TAB>PLU<TAB>` + `CLR<TAB>END<TAB>` written when "Clear Data" (`Lang:pw_ClearData`) is ticked (`SRC/SaveForm.cs:1045-1053`, same over Ethernet `SRC/NetForm.cs:3426-3431`). [C]
- [I] Without CLR, DWL only adds/overwrites PLUs; PLUs that are simply omitted from the file stay on the scale. (Vendor offers CLR precisely for replacing the whole table.)
  **[verified-add]** Strong circumstantial evidence: the vendor's Ethernet "Excel/CSV file" and "Custom TXT file" monitors load **only the file's rows** and push them with PLU checked and Clear=false, i.e. a partial `DWL PLU` block without `CLR` (`SRC/NetForm.cs:6110-6124`; see `spec/net-protocol.md` §5.8). That feature would wipe every other PLU if the firmware deleted absent PLUs, so the vendor clearly relies on DWL = upsert. Still not observed on a real scale. Note also that the PC's own TMS reader ignores `CLR` lines (they fall into the `default:` branch, `SRC/RDS.cs:1092-1109`).
- **[verified-add]** The PC writer ends the file with `END<TAB>ECS<TAB>` (`SRC/SaveForm.cs:1224`). `TIM` (clock) is written **only over Ethernet** (`DownloadTime`, `SRC/NetForm.cs:2314-2324`: blank line, `DWL TIM`, `TIM yy M d h m s`, `END TIM`); neither the USB-file writer nor the RS-232 writer ever emits `TIM`, so whether the scale honours a `TIM` block inside `A_000.TMS` is unverified.
- File written by the PC (`SRC/SaveForm.cs:945-947`): encoding `Program.GetEncoding()` = `Settings.configEncoding` (`SRC/Program.cs:105-108`; `INST/user_config.bck` → `utf-8`, i.e. UTF-8 **with BOM**), CRLF (`StreamWriter.WriteLine`), and **an empty first line** before `ECS<TAB>VER<TAB>100<TAB>`. Real sample: `INST/Config/en/_ECS.TMS` starts `EF BB BF 0D 0A 45 43 53 09 56 45 52 09 31 30 30 09`. [C]
  **[verified-fix]** `_ECS.TMS` is **not** a SaveForm output: it is the factory data file read by `RDS.cs:1225` (reset to defaults), its section order is DPT, CLS, PLU (empty), UNT (empty), BAR, LAB, SAL, TMS, TMT (SaveForm writes TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB, SAL…), and it has a blank line between every section. It does share the BOM + blank first line + `END ECS` ending, so it still illustrates what our parser must tolerate: **blank lines anywhere, including line 0**. The empty-first-line claim itself is confirmed by code (`SaveForm.cs:946`, `:1287` serial, `NetForm.cs:2320`).
- Which PLUs are exported: PLU check box is three-state; *Checked* = all PLUs, *Indeterminate* = only rows with `Valid=True` (`SRC/SaveForm.cs:1058`, `SRC/NetForm.cs:3257,3442`). Over Ethernet a "protect" flag also drops `PLUID < minUserPLUID` (`SRC/NetForm.cs:3241,3442`); in the USB/TMS-file writer the same filter exists but is hard-wired off (`bool flag = false`, `SRC/SaveForm.cs:935,1054`). [C]

### 2.2 Value encodings [C]
| Kind | Write | Read |
|---|---|---|
| int | invariant decimal ASCII | `int.TryParse`, invalid/empty → 0 (`SRC/Program.cs:168-185`) |
| decimal "M,E" | `FormatDecimal` (`SRC/Program.cs:530-557`): round to `Format_Price` (Price, Cost, DA_Num*) or `Format_Weight` (Tare, DF_DN, DF_UN, DA_Dn*, DA_Up*); if \|d\| > 9 999 999 → **"0,0" (silently zero!)**; else multiply by 10 until integer, \|x\|>999 999.9 or 7 steps → `"{int},{steps}"`. Ex: 845→`845,0`, 27.9→`279,1`, 0.005→`5,3`, 0→`0,0` | `ParseDecimal` (`SRC/Program.cs:229-251`): M / 10^E; `"845"` without comma also accepted; error → 0 |
| text (Name, Text1-7) | `FormatString`: CRLF → `\v` (0x0B) (`SRC/Program.cs:525-528`). **[verified-add]** Only the exact pair CR LF (`Environment.NewLine`) is replaced; a lone LF or CR is written raw and splits the TMS line. Excel in-cell line breaks (Alt+Enter) are LF-only and the Excel importer stores them untouched (`SetField` only trims, `SRC/ExcelForm.cs:468,478`), so a multi-line name imported from Excel yields a corrupt PLU line from the vendor tool. Our tool should map `\r\n`, `\r` and `\n` all to `\v`. | `ParseString`: `\v` → CRLF (`SRC/Program.cs:224-227`) |
| text (Index, ALPHA) | written raw (no FormatString) (`SRC/SaveForm.cs:1060`) | ParseString |
| TAB inside any text | **never escaped** → would shift all following fields | — |

Settings used by the writer: `Format_Price` default 2, `Format_Weight` default 3 (`PROP/Settings.cs:211,225`; `INST/TM-xA.exe.Config:296-300`). The wizard sets `Format_Price = Spec202` ("update software", `SRC/WizardForm.cs:6905-6908`).
**[verified-add]** On the user's PC neither `INST/user_config.bck` nor the live `%LOCALAPPDATA%\JHScale\TM-xA.exe_Url_…\3.10.60.31060\user.config` overrides `Format_Price`/`Format_Weight` (both only override `configEncoding`=utf-8, plus folder/IP settings), so the vendor tool currently rounds prices to **2** decimals when it writes TMS.
**[verified-add]** `FormatDecimal` edge: once |x| > 999 999.9 the ×10 loop stops and `Convert.ToInt32` rounds (banker's rounding), so a value ≥ 1 000 000 loses its decimals (1 234 567.89 → `1234568,0`). Irrelevant for Beeftown's thousands-of-VND prices (< 1 000 000).
Short lines are tolerated by the PC reader: missing trailing fields keep defaults (`IndexOutOfRangeException` swallowed, `SRC/RDS.cs:929-932`). Duplicate PLUID in one file: first wins (`SRC/RDS.cs:857-860`).

---

## 3. Master table — every PLU column

TMS# = index after `split('\t')` ([0]="PLU"). DB# = 1-based position in the MDB/TSV (`DUMP/A_ECS/PLU.tsv` header). Manual = scale menu `P23 PLU.nn` (`MAN p.49-52`). Default = `SRC/ECSDataSet.cs:4191-4266` (typed DataTable). UI range = NumericUpDown limits in `SRC/PluForm.cs` designer (Minimum is 0 unless stated). UI label = `Program.GetLang(key)` in `SRC/PluForm.cs:944-1052` → English text from `INST/Lang.xml`.

| TMS# | Column | DB# | Manual | Type → TMS | Default | Range (PC UI) | UI label (Lang key) | Meaning / notes |
|---|---|---|---|---|---|---|---|---|
| 1 | PLUID | 1 | PLU.00 NoSet | int32 (PK, AutoIncrement seed 1) | auto | 0…9 999 999 (`:3130`); user 1…9 999 990 (`minUserPLUID`/`maxUserPLUID`) | Number (`pw_Number`) | PLU number. 9 999 991…9 999 999 are system PLUs (`Combo:SimCombo "PLU Default"`: 9999999 T-Weight, 9999998 T-Count, 9999997 Service Fee, 9999996 Discount&Rounding, 9999995 Card Payment, 9999991 Store Payments). [C] |
| 2 | Remark | 3 | PLU.01 ICode | int32 | 0 | 0…99 999 999 (`:3219`) | Item Code (`pw_ItemCode`) | Item code. Barcode data source **F** "PLU Item Code" (`Combo:Barcode_Source` value 5; factory barcodes e.g. `B201F501K500` = 2-digit flag + 5-digit item code + 5-digit price, `DUMP/A_ECS/Barcode.tsv`); label Item Flag3=10; Spec253 can call PLU by item code. **Not unique** (4 PLUs share one Remark in `DUMP/B_ECS/PLU.tsv` rows 9,11,12,13). Integer → no leading zeros. [C] |
| 3 | Index | 4 | PLU.02 Index | string ≤255, raw | "" | free text | Index Barcode (`pw_IndexBarcode`) | "Index for exterior barcode" (`MAN p.49`): external/EAN code to call the PLU by scanner; barcode source **G**; label Flag3=9. [C] |
| 4 | UnitID | 5 | PLU.03 Unit | int32 | 1 (new rows: `defaultUnitID`=1, `SRC/PluForm.cs:1593-1601`) | 1…9 | Unit (`pw_Unit`) | 1 Weight (= scale's default weight unit, kg), 2 pcs (default count unit), 3 kg, 4 g, 5 ton, 6 lb, 7 500g, 8 100g, 9 1/4lb (`SRC/RDS.cs:509-532`, `MAN p.50,61`). Price is per this unit. §5.1 [C] |
| 5 | Price | 6 | PLU.04 Price | decimal (Access Currency) → M,E @Format_Price | 0 | 0…9 999 999, 2 dp (`:3168-3171`) | U.Price (`pw_UPrice`) | Unit price. Scale shows it with Spec202 decimals (§5.2). [C] |
| 6 | Cost | 7 | PLU.05 Cost | decimal → M,E @Format_Price | 0 | 0…9 999 999, 2 dp (`:3173-3176`) | Cost (`pw_Cost`) | Cost for profit statistics (`MAN p.28`). [C] |
| 7 | Tare | 8 | PLU.06 Tare | decimal → M,E @Format_Weight | 0 | 0…9 999, 3 dp (`:3118-3121`) | Tare (`pw_Tare`) | Preset tare (kg). With Flag bit 2 on a weight PLU the same field holds the **fixed weight** (`SRC/PluForm.cs:2203-2211`). [C] |
| 8 | LabelID1 | 13 | PLU.07 Lab-1 | int | 0 | Label IDs (combo) | Print Format (`pw_PrintFormat`) | Bill-1 print format; 0 = Default (then Class, then Spec000/Spec005) (`CHM:DT-Set/PLU`). [C] |
| 9 | BarT1 | 11 | PLU.08 BarT1 | int | 0 | Barcode IDs | Barcode (`pw_Barcode`) | Bill-1 barcode format; 0 = default. [C] |
| 10 | BarF1 | 9 | PLU.09 BarF1 | int | 0 | 0…9 999 (`:3388`) | Barcode Flag (`pw_BarcodeFlag`) | Per-PLU "PLU Flag" digits in the barcode (source **H**; `Lang:pw_PLUIE_Display` "PLU Flag in Barcode in bill 1"). [C] |
| 11 | LabelID2 | 14 | PLU.10 Lab-2 | int | 0 | | Bill 2-Print Format | Bill 2 (hidden unless `Enable_PLU_Bill2`, default False, `SRC/PluForm.cs:1086-1117`). [C] |
| 12 | BarT2 | 12 | PLU.11 | int | 0 | | Bill 2-Barcode | idem [C] |
| 13 | BarF2 | 10 | PLU.12 | int | 0 | 0…9 999 (`:3430`) | Bill 2-Barcode Flag | idem [C] |
| 14 | ClassID | 15 | PLU.13 Class | int | **9** | combo shows ClassID ≥ 8 (`SRC/PluForm.cs:1225`) | Affiliated Class (`pw_AffiliatedClass`) | Statistics class. Classes 1-5 system, 9 "Default", user 10… (`DUMP/A_ECS/Class.tsv`). [C] |
| 15 | Name | 50 | PLU.14 Name | string (no MaxLength on PLU DataTable), FormatString | "" | multiline textbox, **no length check** | Name (`pw_Name`) | Goods name (label Flag3=0; 30 = "PLU No and Name"). Editing it regenerates ALPHA (§5.6). [C] **[verified-add]** The typed-dataset generator emitted `MaxLength=255` for Index/Text1-7 and 16 for ALPHA but nothing for Name, so Name is most likely an Access Memo column (unlimited on the PC) [I]. |
| 16-22 | Text1…Text7 | 51-57 | PLU.15-21 Des-1…7 ("Goods postil") | string ≤255, FormatString | "" | multiline | Text 1…Text 7 (`pw_Text1..7`) | Extra printable lines (label Flag3=16…22). Text7 doubles as the **measure word** of a count PLU (Flag bit 1, §5.3); Text6 becomes "Lot" (max 12) in the "Ramuza" language socket (`SRC/PluForm.cs:916-939`). Also selectable as display source (Tm:194/195) and log text (Tm:290-293). [C] |
| 23 | PS_SD | 16 | PLU.22 PS-SD | int | 0 | 0 Not Print / 1 Print (`Combo:PLU_PS_Date`) | Print Sale Date (`pw_PrintSaleDate`) | Print sale (sell-by) date switch. §4 [C] **[verified-fix]** switch semantics [C]; the gloss "sell-by" is an interpretation [I]. The vendor only says "Sale date print" / "Number of days after current day" (`MAN p.50`), and factory labels print their "Sale Date" caption with the Sale-info **Print Date** (today), not with Item Flag3=11. |
| 24 | PS_ST | 17 | PLU.23 PS-ST | int | 0 | 0 Not Print / 1 Print Input Time / 2 Print Current Time (`Combo:PLU_PS_Time`) | Print Sale Time | [C] |
| 25 | PS_PD | 18 | PLU.24 PS-PD | int | 0 | 0/1 | Print Package Date (`pw_PrintPackageDate`) | Pack date switch (NĐG). [C] |
| 26 | PS_PT | 19 | PLU.25 PS-PT | int | 0 | 0/1/2 | Print Package Time | [C] |
| 27 | **PS_UD** | 20 | PLU.26 PS-UD | int | 0 | 0/1 | Print Shelf Date (`pw_PrintShelfDate`) | **HSD switch**. [C] |
| 28 | PC_SD | 21 | PLU.27 PC-SD | int days | 0 | 0…999 (`:3651`) | Sale Days (`pw_SaleDays`) | Sale date = print day + N. [C] |
| 29 | PC_ST | 22 | PLU.28 PC-ST | int HHMM | 0 | 0…2359 (`:3661`) | Sale Time (`pw_SaleTime`) | Fixed ("appointed") time printed when PS_ST=1. [C] **[verified-fix]** "Appointed time" and the 0…2359 range are [C]. The HHMM encoding is [I-strong]: it is inferred from Max=2359 on a single box named `pC_ST_HNumericUpDown` and from the manual's HHMM rule for time discounts (`MAN p.51`). The CHM still describes an older UI with separate hour and minute boxes. Same for PC_PT. |
| 30 | PC_PD | 23 | PLU.29 PC-PD | int days | 0 | 0…999 (`:3671`) | Package Days (`pw_PackageDays`) | Pack date = print day + N. [C] |
| 31 | PC_PT | 24 | PLU.30 PC-PT | int HHMM | 0 | 0…2359 (`:3681`) | Package Time (`pw_PackageTime`) | Fixed pack time when PS_PT=1. [C] |
| 32 | **PC_UD** | 25 | PLU.31 PC-UD | int days | 0 | 0…999 (`:3691`) | Shelf Days (`pw_ShelfDays`) | **HSD days**: HSD = print day + N; 0 = same day ("intraday valid", `MAN p.28`). [C] **[verified-add]** The manual's PLU-edit example says PS-UD "0: Don't print, PLU 31 invalid", so PC_UD is ignored when PS_UD=0. The scale's quick-edit menu P31 edits PS-UD with "Attached: PLU.31" (`work-plu/Printing Serial Scale V3.04A.txt` lines 962-964, 2351-2352). |
| 33 | DF_D | 27 | PLU.32 DF-D | int | 0 | 0 System Default / 1 No Lower Limit / 2 First Price / 3 Setting Number (`Combo:PLU_DF_D`) | Lower Limit: (Manual Discount) | Manual-discount lower-limit mode (`MAN p.50`: 2 = original cost…, 3 = use DF_DN). [C] |
| 34 | DF_U | 26 | PLU.33 DF-U | int | 0 | same list (`Combo:PLU_DF_U`) | Upper Limit: | upper-limit mode (2 = original U.Price). [C] |
| 35 | DF_DN | 29 | PLU.34 DF-DN | decimal → M,E **@Format_Weight** | 0 | 0…9 999 999, 2 dp, enabled only if DF_D=3 (`:4267-4270`, `SRC/PluForm.cs:1476-1484`) | (value box) | Lower-limit value. [C] |
| 36 | DF_UN | 28 | PLU.35 DF-UN | idem | 0 | idem (`:4262-4265`) | | Upper-limit value. [C] **[verified-fix]** "idem" is wrong for the enabling condition. DF_UN is enabled when **DF_U = 3** (`SRC/PluForm.cs:1250,1478`), DF_DN when DF_D = 3 (`:1251,1483`). The manual says "Activated when DF_D=3" for both, which is a typo. The manual's P31 quick-edit list also swaps the names ("PLU.32 DF-U … Attached PLU.34"); the P23 list and the code agree on TMS 33 = DF_D, 34 = DF_U. |
| 37 | DA_Sort1 | 30 | PLU.36 DA-S0 | int | 0 | 0…10 (`Combo:PLU_DA_Sort`: 0 Inefficacy, 1 Amount, 2 Time, 3 Total Forbidden-1, 4-7 VIP A-D, 8/9 Amount Forbidden-1/2, 10 Total Forbidden-2) | Auto Discount 1 | Auto-discount rule type. [C] |
| 38 | DA_Day1 | 31 | PLU.37 DA-W0 | int bitmask | **127** | 0…127 (`:4010`) | Active Day: | bit0 Sun … bit6 Sat, 127 = every day (`SRC/Program.cs:253-312`, `MAN p.51`). [C] |
| 39 | DA_Dn1 | 33 | PLU.38 DA-D0 | decimal @Format_Weight | 0 | 0…99 999, 3 dp (`:4057-4060`) | Value Field (lower, inclusive) | weight/count, or HHMM for time discount. [C] **[verified-add]** The UI decimals depend on DA_Sort (`SRC/PluForm.cs:1603-1681`): sort 1, 8 and 9 use Format_Weight (weight/count); sort 2 uses 0 dp (HHMM); sort 3 and 10 ("Total Forbidden") use **Format_Price** (a money threshold); sorts 4-7 (VIP) hide Dn/Up. The TMS writer always rounds Dn/Up to Format_Weight. |
| 40 | DA_Up1 | 32 | PLU.39 DA-U0 | decimal @Format_Weight | 0 | idem (`:4043-4046`) | Value Field (upper, exclusive) | [C] |
| 41 | DA_Num1 | 34 | PLU.40 DA-N0 | decimal @Format_Price | 0 | −99 999…99 999, 2 dp (`:4073-4077`) | Discount U.Price: | ≥0 new unit price; negative = subtract from U.Price. [C] |
| 42-46 | DA_Sort2, DA_Day2, DA_Dn2, DA_Up2, DA_Num2 | 35,36,38,37,39 | PLU.41-45 | as above | 0,127,0,0,0 | | Auto Discount 2 | [C] |
| 47-51 | …3 | 40,41,43,42,44 | PLU.46-50 | | | | Auto Discount 3 | [C] |
| 52-56 | …4 | 45,46,48,47,49 | PLU.51-55 | | | | Auto Discount 4 | [C] |
| 57 | TaxType | 58 | PLU56 Tax-S | int | 0 | 0 No Tax / 1 Exclude Tax / 2 Exclude Tax, price after tax / 3 Include Tax (`Combo:PLU_TaxType`) | Tax Type (`pw_TaxType`; hidden, `Enable_PLU_Tax`=False) | Manual: 0 = follow global Spec116/117 (`MAN p.52`). [C] |
| 58 | Tax | 59 | PLU.57 Tax-D | int | 0 | textbox | Tax Rate (`pw_TaxRate`) | Rate in 0.01 % (1700 = 17 %) (`MAN p.52`). Note `Combo:PLU_Col` swaps the two display names (Tax→"Tax Sort", TaxType→"Tax Rate"). [C] |
| 59-62 | SspValue1…4 | 60-63 | — | int | 0 | 0…10 000 (`:3253`) | SSP Value 1…4 (hidden unless `Enable_PLU_UselessSSP`) | Row ID into Custom1…4 ("Custom Info") when `INST/Custom.xml` maps Ssp=n (`SRC/PluForm.cs:791-827`); `Custom.xml` is empty → unused. [C] |
| 63 | SType | 64 | — | int | 0 | 0 Normal, 1 Tare Only, 2-5 Custom Info 1-4, 6 Custom Info Common (`Combo:SimCombo "PLU SType"`) | Special Mode (hidden) | Special PLU type; 1…6 disable price/date/label fields (`SRC/PluForm.cs:1839-1997`). [C] |
| 64 | ALPHA | 65 | — | string, **MaxLength 16** (`SRC/ECSDataSet.cs:4263`), raw | "" | auto from Name | Alpha search (`pw_AlphaSearch`) | Alphabetic search key (§5.6). [C] (use on scale [I]) |
| 65 | Flag | 66 | — | int bitmask | 0 | via check boxes | Measure word / Save as weight / Fixed weight / Percent tare | bit1 measure word (count PLU, Text7), bit2 save-as-weight (count PLU) or fixed weight (weight PLU), bit4 percent tare (weight PLU) (`SRC/PluForm.cs:2261-2295`). Changing UnitID resets Flag to 0 (`:2249-2253`). [C] **[verified-fix]** "bit1/bit2/bit4" means **mask values** 1/2/4 (= bit 0/1/2), not bit positions: `(num & 1)` measure word, `(num & 2)` save-as-weight or fixed weight, `(num & 4)` percent tare (`SRC/PluForm.cs:2266-2269, 2276-2288`; same masks in `SRC/RDS.cs:2133,2139,2147`). Excel import of an unknown unit name writes Flag = 1 = measure word (`SRC/ExcelForm.cs:531`). |
| 66 | Flag_Value | 67 | — | int | 0 | 0…99 when percent tare (`SRC/PluForm.cs:2221-2226`) | "%" | Percent-tare value. [C] |
| 67 | Bitmap | 68 | — | int | 0 | Bitmap IDs | Bitmap (`pw_Bitmap`) | Picture printed by label Item Flag3=33. [C] |
| — | Valid | 2 | — | bool | True | check box | Import/Export (`pw_Import_Export`) | **PC-only**, not in TMS. Marks rows for "valid-only" export; automatically set True whenever the row is edited (`SRC/PluForm.cs:1283-1292`). [C] |

DB-only extras in other typed tables: `PLUwUnit` adds `UnitName`, `Punit` (`SRC/ECSDataSet.cs:13076-13078`) for joins; not stored in PLU. [C]

---

## 4. HSD — dates on the label

### 4.1 Fields [C]
| Printed item | Switch (TMS#) | Data (TMS#) | Data meaning | Label item |
|---|---|---|---|---|
| Sale date (sell-by) | PS_SD [23] 0/1 | PC_SD [28] | days after print day, 0…999 | Flag1=1, Flag3=11 |
| Sale time | PS_ST [24] 0/1/2 | PC_ST [29] | HHMM fixed time (used when PS_ST=1) | Flag3=12 |
| Pack date (Ngày đóng gói / NĐG) | PS_PD [25] 0/1 | PC_PD [30] | days after print day | Flag3=13 |
| Pack time | PS_PT [26] 0/1/2 | PC_PT [31] | HHMM | Flag3=14 |
| **Shelf / use-by date (HSD)** | **PS_UD [27] 0/1** | **PC_UD [32]** | **days after print day, 0…999** | **Flag3=15** |
| Print date / print time (no PLU field) | — | — | scale clock at printing | Flag1=2, Flag2=3 / 4 |

Sources: `MAN p.50` ("PLU 26: Shelf date print 0: not print, 1: print"; "PLU 31: Shelf days data — Number of days after current day"; "PLU 23 … 1: print at appointed time, 2: print printing time"; "PLU 28 … Appointed time for print"), `MAN p.28` ("Shelf days. 0 means intraday valid … If all cargo for one scale use same shelf days, use Spec105 & Spec106"), `CHM:DT-Set/PLU` ("The data content is the number of days counting from the day to print"; time = hour+minute), `Combo:PLU_PS_Date` (0 Not Print, 1 Print), `Combo:PLU_PS_Time` (0 Not Print, 1 Print Input Time, 2 Print Current Time), `Lang:pw_PLUIE_Display` ("Print Shelf Data state: 0 for not print, 1 for print", "Print Shelf Data data: number of shelf days").
Naming: PS_ = "print switch", PC_ = "print content/data" [I from usage]. PC_* are **never absolute dates** [C].
**[verified-add] HSD in the barcode.** `Combo:Barcode_Source` also has 26 "Shelf Term", 27 "Shelf Date: Year", 28 "Shelf Date: Month" and 29 "Shelf Date: Day" (TChar codes `BA`…`BD`, see `spec/barcode-keys.md`), so the use-by date or the number of shelf days can be encoded in the label barcode. The existence of a "Shelf Term" source supports the inference that Spec105 "days mode" (4-6) prints the number of days instead of a date [I].

### 4.2 How the scale computes the dates
- printed date = scale RTC date at the moment of printing + PC_xx days [C wording `MAN p.50`, `CHM`]. HSD is counted from the print day, **not** from the pack date; if PC_PD ≠ 0 the HSD is still today + PC_UD [I].
- PS_UD=1, PC_UD=0 → HSD = today [C `MAN p.28`].
- Global overrides, `Tm:105` "Shelf Day Print": 0 Using PLU setting (due-date mode) · 1 use Spec106 if the PLU does not set shelf day · 2 always Spec106 · 3 never print shelf date · 4/5/6 = 0/1/2 in "days mode" (4-6 exist only in Tm.xml; `MAN p.89` lists 0~2, default 0). "Days mode" presumably prints a number of days instead of a date [I/?]. What "PLU does not set shelf day" tests (PS_UD=0 or PC_UD=0) [?].
- `Tm:106` Shelf Days 0…999 ("Shelf life days after intraday, 0 means only for intraday", `MAN p.89`, default 0).
- Date format `Tm:104` DateTime Type: 0 YYYY.MM.DD, 1 YY.MM.DD, 2 MM/DD/YY, 3 MM-DD-YY, **4 DD/MM/YY**, 5 DD-MM-YY, 6-10 Persian; +100 = same with 12 h clock. `Tm:265` month printed as digits (0) or two characters (1). `Tm:266` screen date display (0 default, 1 use 104/265). Default 0 everywhere (`MAN p.89`, `INST/Config/en/_ECS.TMS` rows `TMS 104 0`, `105 0`, `106 0`, `265 0`, `266 0`). Spec 104 applies to all printed dates [I].
- Clock: `DWL TIM` / `TIM<TAB>YY<TAB>M<TAB>D<TAB>h<TAB>m<TAB>s<TAB>` / `END TIM` (`SRC/NetForm.cs:2318-2323`). HSD is only right if the scale clock is right. [C]

### 4.3 Label side [C]
- LAS line: `LAS<TAB>SubID<TAB>Flag1<TAB>Flag2<TAB>Flag3<TAB>Print<TAB>Angle<TAB>Align<TAB>Font<TAB>Left<TAB>Top<TAB>Width<TAB>Height<TAB>` (`SRC/SaveForm.cs:1101`; `MAN p.53` LAS.04 Print, .05 Angle, .06 Grid(=Align), .07 CFont).
- Codes (`INST/LabelItem.xml`, `MAN p.65-66`): Flag1 1 = Item info, Flag2 0 = "X" (the current/all items), Flag3 11 Sale Date, 12 Sale Time, 13 Package Date, 14 Package Time, 15 Shelf Date. Flag1 2 = Sale info, Flag2 3 Print Date, 4 Print Time. Flag1 3 = Const text, Flag2 = text slot k → LAB field Text(k+1).
- Print condition (`Combo:LabelItem_Print`, `MAN p.65`): 0 Not Print, 1 Always, **7 Sale Date Print, 8 Pack Date Print, 9 Shelf Date Print** ("Print with shelf date") — the item prints only for PLUs that print that date [I from names].
- Factory item labels (`DUMP/A_en_Default/LabelItem.tsv`, LabelID 10, 11, 11000, 11100, 11200, 11300, 90000): const-text caption "Shelf Date" **and** the Item Flag3=15 value both use Print = 9; a "Sale Date" caption is paired with Sale-info Print Date (Print = 1). So on factory labels the "sale date" shown is simply the print date.
  **[verified-fix]** Label **90000** is the exception. Its captions are Vietnamese: SubID 14 = Text5 "ngày bán" (Print 1) and SubID 16 = Text7 "ngày dóng gói" [sic] (Print 9). So in that label the Shelf Date value (SubID 19, Flag3=15, Print 9) is captioned **"packing date"**. Anyone using label 90000 who wants "packing date = today" would have to set PS_UD=1, PC_UD=0, which is a trap if HSD is also wanted. The other six labels are confirmed as stated (same in A_ECS and B_ECS).
- The technician's HSD label (`DUMP/A_ECS` LabelID 28, 464×320 dots = 58×40 mm — the same layout as the `EXAMPLE.label` id 28 in our tool): SubID 20 const text 4 ("Ngày đóng gói") + SubID 26 Sale-info Print Date; SubID 28 const text 16 ("HSD") + SubID 27 Item Flag3=15 Shelf Date; all Print = 1 (always).
  **[verified-add]** Checked against `DUMP/A_ECS/Label.tsv`: Flag2=4 → Text5 = "Ngày đóng gói", Flag2=16 → Text17 = "HSD", Flag2=1 → Text2 = "Trọng Lượng", which confirms "const slot k → LAB Text(k+1)". Our tool's `EXAMPLE` stores the same items at slightly different coordinates (e.g. SubID 0 is 408×43 vs 408×53 in the DB), so it is the same design but not byte-identical. **Practical consequence:** PLUs created by the current tool get `PS_UD=0, PC_UD=0` from `PLU_TEMPLATE`, while label 28 prints the "HSD" caption and the Shelf Date item with Print=1. New products would therefore show an "HSD" caption with no date, or whatever the firmware prints for "no shelf date" [I]. The tool needs an HSD column, or label 28 should use Print=9 on SubID 27/28.

### 4.4 Recipe — "print pack date = today and HSD = today + N"

**Per PLU (TMS line):**
| TMS# | Field | Value |
|---|---|---|
| 27 | PS_UD | `1` |
| 32 | PC_UD | `N` (1…999; `0` = HSD today) |
| 25 / 30 | PS_PD / PC_PD | leave `0`/`0` if the label shows pack date as *Print Date* (Beeftown label 28); set `1`/`0` if the label uses Item Flag3=13 |

Example (Beeftown demo product, 3-day HSD, scale with 3 price decimals; `→` = TAB):
```
PLU→1→10001→→1→845,0→0,0→0,0→0→0→0→0→0→0→9→Lõi vai bò Mỹ→→→→→→→→0→0→0→0→1→0→0→0→0→3→0→0→0,0→0,0→0→127→0,0→0,0→0,0→0→127→0,0→0,0→0,0→0→127→0,0→0,0→0,0→0→127→0,0→0,0→0,0→0→0→0→0→0→0→0→loivaibomy→0→0→0→
```
(verified: 69 split items, `[27]=1`, `[32]=3`; differs from our `PLU_TEMPLATE` only in [27] and [32].)

**Label (the item label actually used: PLU LabelID1 ≠ 0, else Class, else Spec000):**
- value item `LAS … 1 0 15 <Print> …` (Item / X / Shelf Date) — required;
- pack date: either `2 3 0` (Sale-info Print Date, Print 1) — what label 28 does — or `1 0 13` (Item Package Date) together with PS_PD=1, PC_PD=0;
- captions = const text items (`3 k 0`) with LAB Text(k+1) = "NĐG:"/"HSD:";
- recommended: Print = **9** on both the "HSD" caption and the Shelf-Date value (and 8 on pack-date items if Item 13 is used) so products with PS_UD=0 print no dangling "HSD" line [I].

**Specs (only if you want to change them; send `TMS<TAB>id<TAB>value<TAB>` lines in `DWL TMS`):** 105 = 0 (default), 106 irrelevant, 104 = 4 for DD/MM/YY (test-print first) [I].
**Global alternative:** every product same HSD → Spec105 = 2, Spec106 = N, no PLU change; mixed → Spec105 = 1 [I on the "not set" test].
**Spreadsheet alternative:** see §6.6 (`PC_UD_Plus`).

---

## 5. Units, prices, texts, ALPHA

### 5.1 Units [C]
| UnitID | Name (`Lang:pw_AllUnitMeasure`) | Punit (1 weight / 2 count, `Combo:Unit_Type`) | Pack |
|---|---|---|---|
| 1 | Weight (scale's default weight unit; "measure unit of the scale", `MAN p.61`) | 1 | 1 |
| 2 | pcs (default count unit) | 2 | 1 |
| 3 kg · 4 g · 5 ton · 6 lb · 7 500g · 8 100g · 9 1/4lb | | 1 | 1000 · 1 · 1 000 000 · 453.592 · 500 · 100 · 113.398 (grams per unit) |
Source `SRC/RDS.cs:509-532`, `DUMP/A_ECS/Unit.tsv`. Manual: 9…19 reserved, 20…99 user (`MAN p.61`), but **v3.10 never exports units** (unit checkbox forced hidden `SRC/SaveForm.cs:690-694`; no `UNT` writer), so only 1…8(9) are meaningful. U.Price is per unit (UnitID 8 → per 100 g). System units vs display: Spec 210/211/212 [C Tm]. Beeftown: UnitID 1 for weighed meat, 2 for pieces.

### 5.2 Price and decimals
- Stored as Access Currency (4 dp) (`TA/PLUTableAdapter.cs:203`), UI 2 dp, TMS `M,E` rounded to `Format_Price` [C]. There is **no per-unit decimal**: decimals of U.Price on the scale = Spec202, total price = Spec203, tare = Spec200, weight = Spec201 (`Tm:200-203`) [C]. Kilo separator / decimal comma: Spec181/180 [C Tm].
- Beeftown convention (our tool, consistent with vendor data `DUMP/A_ECS/PLU.tsv` prices like 120, 115, 530 and `DUMP/B_ECS` 27.9): price stored in thousands of VND and shown with 3 decimals, so `845,0` shows "845.000" = 845 000 đ [I, consistent].
- PC export rounds to `Format_Price` (2 unless the wizard copied Spec202) → with 3-decimal VND-thousands a price like 27.925 would be rounded to 27.93 by the vendor tool; our tool writes exact values [C code / I impact].
- Hard cap: value > 9 999 999 → written as `0,0` (§2.2). Scale U.Price window width: Spec188 "Unit Price Length (0 auto, 1~7)" [C Tm]; our 6-digit limit (999 999 đ) is a display assumption [?].

### 5.3 Tare / Flag bits [C] (`SRC/PluForm.cs:2146-2295`, `SRC/RDS.cs:2128-2160`)
- UnitID 2 (count): Flag bit1 = **measure word** (Text7 is the unit word, e.g. "hộp"); bit2 = save-as-weight.
- Weight units: bit2 = **fixed weight** (weight kept in Tare), bit4 = **percent tare** (Flag_Value 0…99 %), otherwise Tare = normal preset tare.
- Excel import of an unknown unit name → UnitID 2, Text7 = that name, Flag = 1 (`SRC/ExcelForm.cs:520-531`).
- Label items: 24 Measure Unit, 32 Weight of by-count PLU, 34/35/36 tare-from-package/percent/percent number (`LabelItem.xml`).

### 5.4 Name / text length [C/?]
- PC code enforces **no length** on Name/Text (Text columns MaxLength 255, Name none; textboxes have no MaxLength except Text6 "Lot" = 12). Newlines allowed (multiline boxes, `tmxa-src/ECS.PluForm.resx` `nameTextBox.Multiline = True`, same for text1…7), transported as `\v`.
- Scale side: Spec249 "PLU Storage Mode (PLU Text Length ≈ Total Length − 150)": 0 default, 1 = 256 B, 2 = 512 B, 3 = 1024 B, 4 = 2048 B per PLU (`Tm:249`, `MAN p.94`) → Name + Text1…7 (+Index/ALPHA?) share ≈ total−150 **bytes**. In UTF-8 Vietnamese letters cost 2-3 bytes. Real per-firmware name limit [?]; our `MAX_NAME=40`/`LONG_NAME=24` are not from vendor code.
- Sample data: longest name in the dumps 32 chars / 37 UTF-8 bytes (`DUMP/A_ECS/PLU.tsv` PLUID 1).

### 5.5 Text1…7 usage [C]
Extra descriptive lines ("Goods postil 1-7", `MAN p.50`; "assistant words … often used to print", `CHM:DT-Set/PLU`) — ingredients, origin, storage instructions, etc. They print only if the label has Item Flag3 16…22. Text7 = measure word (§5.3). Also usable for the 5-window display (Spec194/195) and log texts (Spec290-293).

### 5.6 ALPHA vs our `aliasOf()`
Vendor `Program.GetAlpha` (`SRC/Program.cs:491-523`, `GetFirstPY` `:314-489`), called on every Name edit (`SRC/PluForm.cs:2141-2144`, grid `:1550-1557`) and on import when ALPHA is empty and `PLUImportAlphaAG`=True (`SRC/RDS.cs:2302-2305`):
1. ASCII letters kept; 2. other printable ASCII `!`…`}` (digits, punctuation) kept **only after the first kept char**; 3. space and every non-ASCII char → pinyin initial only if it is a GB2312 Chinese character, otherwise **dropped** (Vietnamese `ơ ư ă â ê ô đ` and all toned vowels are dropped; `ChnCharInfo` throws for non-Chinese); 4. stop at **14** chars; 5. lowercase.
E.g. "Lõi vai bò Mỹ" → vendor `livaibm`, ours `loivaibomy`.
Data check (script, no names shown): all 7 A_ECS rows and B_ECS PLU 1 equal GetAlpha(Name); B_ECS 9-13 match neither (stale or empty) [C].
**[verified-add]** ALPHA auto-generation on import runs only in `RDS.NL_PLUImportKeep`, which is called by the Excel dialog (`SRC/ExcelForm.cs:680,701`) and TXT import (`SRC/Common.cs:641`). It is **not** called by the TMS-file reader (`RDS.DataSet_ReadTMS`), the Ethernet upload (`NetForm.cs:2755-2839`) or the Ethernet Excel monitor (`NetForm.cs:6079,6103`). PLUs arriving through those paths keep whatever ALPHA they carry, possibly empty, which fits B_ECS PLUs 11-13 having an empty ALPHA. Verified by re-implementing GetAlpha in Python over the dumps: A_ECS 7/7 and A_en_Default 7/7 match; B_ECS 1/5 match.
`aliasOf()` = NFD strip marks, đ→d, lowercase, keep `[a-z0-9]`, slice 16. Differences: keeps accented letters' base (better for Vietnamese search), keeps leading digits, drops punctuation, 16 not 14. PC accepts ≤16 (a longer ALPHA would throw in the PC TMS reader: `MaxLength 16` + only `IndexOutOfRangeException` caught, `SRC/RDS.cs:923-932`). **[verified-add]** The resulting exception is not an IndexOutOfRange, so it escapes to `DataSet_ReadTMS`'s outer `catch (Exception)` (`SRC/RDS.cs:1204-1207`), which returns the error before `oldData.Merge` at `:1130`. The **whole** TMS import is aborted, not just that PLU [I on the exact throw point: detached-row set or `AddPLURow`; either way the outer catch applies]. Recommendation: keep aliasOf but `.slice(0, 14)` to stay within what the vendor ever sends [I].

---

## 6. Excel / CSV import-export (File → Import & Export → Excel)

### 6.1 Mechanism [C] (`SRC/ExcelForm.cs`)
- Mapping table `Excel(ID, Field)` in ECS.mdb, read `ORDER BY ID` (`TA/ExcelTableAdapter.cs:159`). **Spreadsheet column i ↔ i-th mapping row** (positional, IDs may have gaps). Field values = `Combo:PLU_Col` Field names; an empty Field ("(NULL)") skips that column (`:516-518`).
- Defaults table `ExcelDefault(ID, Field, Default)`: sets `DataColumn.DefaultValue` for all imported rows (PLUID excluded, filter `:319`) (`:584-644`). Special: Field `UnitID` with `|` → translation table `text|id|text|id|…|defaultId` (`:603-607`, used `:548-571`); Field `[Unit].[Name]` → default unit by name.
- Import providers (`:659-708`): `.xls` Jet 4.0 `Excel 8.0;HDR=NO;IMEX=1`; `.xlsx` ACE 12.0 `Excel 12.0;HDR=NO;IMEX=1` (needs Access Database Engine x86; the app is x86); `.csv` (any other extension) Jet Text `FMT=Delimited;HDR=NO;IMEX=1` (ANSI code page unless a schema.ini says otherwise [I] → Vietnamese names in CSV are risky; prefer .xls). Sheets: all tables ending with `$` (or the only one).
  **[verified-add] Measured on the user's PC (read-only registry query):** `HKLM\SOFTWARE\WOW6432Node\Microsoft\Jet\4.0\Engines\Text` has CharacterSet=**ANSI**, Format=CSVDelimited, MaxScanRows=25. The system ANSI code page is **1252** and the culture is en-GB (decimal ".", group ","). CSV import and export here are therefore Windows-1252: ơ ư ă đ and most toned Vietnamese vowels cannot survive. The Jet Excel engine has TypeGuessRows=8 and ImportMixedTypes=Text. `Microsoft.ACE.OLEDB.12.0` is registered **only in the 64-bit registry view** (its CLSID `{3BE786A0-…}` is missing under WOW6432Node), and TM-xA is x86 (`TM-xA.csproj` `PlatformTarget x86`), so `.xlsx` import will almost certainly fail with "provider not registered" [I-strong]. **Use `.xls` (BIFF8).**
  **[verified-add]** Every worksheet whose name ends with `$` is imported, so a workbook with a notes or instructions sheet imports those rows too. They are only skipped if they fail parsing.
- Per row: `NewPLURow()` (defaults + auto-increment PLUID seed 1) → `FillFields` → accept if FillFields true **and** PLUID ≥ minUserPLUID **and** PLUID not already imported from this file (`:677-682`) → `RDS.NL_PLUImportKeep` (§6.4) → finally `ecsDataSet.Merge()` into the full PLU table and Update (`:709-712`): **existing PLUs with the same number are overwritten, including unmapped fields reset to defaults/ExcelDefault** unless "PLU import keep" options are set [I from .NET Merge semantics].
  **[verified-fix] upgraded from [I] to [C code path]; not run.** The target PLU table is filled from the DB just before import (`ExcelForm.cs:871-872`). Imported rows are added with their full ItemArray, all 68 columns, with unmapped ones at their DataTable/ExcelDefault defaults (`:681`, `:702`). `DataSet.Merge(ds)` uses preserveChanges=false; the documented .NET behaviour is that incoming values overwrite the current values of the row with the same primary key, so the row becomes Modified. `PLUTableAdapter.UpdateCommand` then writes **every** column `WHERE PLUID = ?` (`TA/PLUTableAdapter.cs:269`). Consequences: (1) a sheet without HSD columns **resets PS_UD/PC_UD of existing PLUs to 0**, and likewise LabelID1, Texts, ClassID→9 and so on; (2) every imported row gets `Valid=True` (column default, `ECSDataSet.cs:4256`), so it is included in a "valid-only" export.
  **[verified-add] Empty and odd cells.** `SetField` does `int.Parse(text)`/`decimal.Parse(text)` with no empty-cell handling. An **empty cell in any mapped int or decimal column** (Price, Remark, PS_UD, PC_UD_Plus…) makes FillFields return false, and the **whole row is silently skipped**. In the special `UnitID` branch (`:548-571`) a blank or non-numeric unit cell throws inside the loop. The exception is swallowed by `catch (Exception)` at `:578-580` and FillFields returns **true**, so the row **is imported but every column after UnitID is left at default**. With the technician's mapping that means Remark, PS_UD and PC_UD_Plus are lost. Our exporter must write 0 rather than blanks, and a numeric UnitID. There are no range checks on import: e.g. PC_UD=1500 or UnitID=42 is stored as-is, and only the PLU form's NumericUpDown limits would object later [I on how the form reacts]. The CHM "Excel File" topic (`work-plu/chm/Import & Export/Excel File.htm`) describes an older UI (8 pull-downs, "Auto number" 10~5999). v3.10 has no auto-number option: without a PLUID mapping the number comes from the temp table's AutoIncrement (seed 1) [I on the exact sequence].
- `SetField` (`:466-506`): int `int.Parse`, string trimmed, decimal `decimal.Parse(text.TrimStart('$'), NumberStyles.Currency)` in the **current Windows culture** (vi-VN uses `,` as decimal separator [I]), bool 1/0/true/false. A failed SetField → row skipped; but an exception inside the special branches (e.g. unknown unit text with no table) is swallowed and the row is **still imported** with the remaining fields at default (`:578-581`).
- Header rows: a text header fails the first numeric field → row skipped. [C by logic]

### 6.2 Field names (`Combo:PLU_Col` Field → export header "Display") [C]
`PLUID` Number · `Name` Name · `Price` Price · `UnitID` Unit · `[Unit].[Name]` Unit Name · `Cost` Cost · `Tare` Tare · `ClassID` Class Number · `Index` Index Barcode · `Remark` Item Code · `BarF1`/`BarF2` Barcode flag of 1st/2nd bill (**[verified-fix]** exact Display strings: "Barcode flag of bill 1st bill" / "Barcode flag of bill 2nd bill"; identical in `INST/Combo.xml` and `INST/en/Combo.xml`) · `BarT1`/`BarT2` Barcode number … · `LabelID1`/`LabelID2` Print format number … · `Bitmap` · `Tax` "Tax Sort"(sic) · `TaxType` "Tax Rate"(sic) · `PS_SD` "Sale time print"(sic) · `PS_ST` Sale time print · `PS_PD` Packing date print · `PS_PT` Packing time print · `PS_UD` Shelf date print · `PC_SD` Sale date data · `PC_ST` Sale time data · `PC_PD` Packing date data · `PC_PT` Packing time data · `PC_UD` Shelf date data · **`PC_UD_Plus` Shelf date data(+print)** · `DF_U`, `DF_D`, `DF_UN`, `DF_DN` · `Text1`…`Text7` · `SspValue1`…`4` · `DA_Sort1`, `DA_Day1`, `DA_Dn1`, `DA_Up1`, `DA_Num1` … `DA_*4`.
Not mappable in Excel: `ALPHA` (auto-generated), `SType`, `Flag`, `Flag_Value`, `Valid` (defaults only via ExcelDefault if the column exists).

Pseudo-fields (`SRC/ExcelForm.cs:520-571`, same copy in `SRC/NetForm.cs:5943-5956` used by the Ethernet "Excel file monitor", `SRC/NetForm.cs:6654-6710`):
**[verified-fix]** The NetForm copy (`FillFields`, `SRC/NetForm.cs:5920-5990`) is **not** identical. An unknown `[Unit].[Name]` gives **UnitID = 0** there (`:5940`), with no Text7 and no Flag. The monitor never calls `NL_PLUImportKeep`, so there is no ALPHA generation and keep options are ignored. It merges into the PC DB with `preserveChanges: true` after optionally deleting **all** PC PLUs (`excelPage_clear_checkbox` → `pLUTableAdapter.DeleteQuery()`, `:6113-6127`; the TXT monitor does the same at `:5773-5779`, and so do the auto-run copies at `:6421-6427` and `:6741-6747`). The `PC_UD_Plus` rule is the same.
- `[Unit].[Name]`: unit name looked up in the 9 built-in units (names from `pw_AllUnitMeasure`: Weight, pcs, kg, g, ton, lb, 500g, 100g, 1/4lb); unknown → UnitID 2 + Text7 = name + Flag 1.
- `PC_UD_Plus`: PC_UD = value; **PS_UD = 1 if PC_UD ≥ 1 else 0** (a 0 cannot mean "HSD today").
- `UnitID` + ExcelDefault translation table (see 6.1).

### 6.3 Export [C] (`SRC/ExcelForm.cs:763-844`)
Only `.xls` or `.csv`: `SELECT <fields> INTO [Excel 8.0;Database=f].[Sheet1]` / `[TEXT;Database=dir].[file]` `FROM PLU INNER JOIN Unit … WHERE PLUID >= minUserPLUID ORDER BY PLUID` (Jet writes a header row with the Display names). Decimals via `CDbl`, bool via `IIF(…,1,0)`. `PC_UD_Plus` exports as `PC_UD` (header "Shelf date data"). Quirks: PLUs whose UnitID has no Unit row are silently omitted (INNER JOIN); empty mapping rows in the middle are skipped, shifting later columns versus the import mapping; a leading `PC_UD_Plus` is not translated.
**[verified-fix]** Precision on the last quirk: when `PC_UD_Plus` is the *first* non-empty mapping, `GetField("PC_UD_Plus", …)` does `ecsDataSet.PLU.Columns["PC_UD_Plus"].DataType` on a null column (`SRC/ExcelForm.cs:751-752`). This raises NullReferenceException, so the **export fails** with "Operation failed" rather than writing an untranslated column. **[verified-add]** On this PC the CSV export is written by Jet Text in ANSI 1252 (see §6.1), and PLUs below `minUserPLUID` are excluded (`:814,828`). Exported numbers are raw DB values (`CDbl`), not rounded to Format_Price.

### 6.4 Import "keep" options and ALPHA [C] (`SRC/RDS.cs:2082-2306`, UI `SRC/MenuParameterForm.cs:1203-1214`)
`Settings.PLUImportKeep` = 36 chars '0'/'2'; for an existing PLU, flagged items keep the old value: 0 Name(+ALPHA), 1 ItemCode, 2 Index, 3 Class, 4 UnitID (5 Tare, 6 PercentTare, 7 FixedWeight, 8 MeasureWord), 9 Price, 10 Cost, 11 Tax, 12-15 SSP1-4, 16 SType, 17 Label1, 18 Barcode1, 19 Label2, 20 Barcode2, 21 Bitmap, 22-28 Text1-7, 29 SD, 30 ST, 31 PD, 32 PT, **33 UD (PC_UD+PS_UD)**, 34 manual discount, 35 auto discount. Default `""` = keep nothing (`INST/TM-xA.exe.Config`). Then ALPHA = GetAlpha(Name) if empty and `PLUImportAlphaAG` (default True).

### 6.5 TXT ("compatible text format") import/export [C] (`SRC/Common.cs:75-1200`, `SRC/TXTForm.cs`)
Template string `FILE_PLU#op#op…`, ops e.g. `S<sep>` split, `L<n>` fixed width, `@Field` assign, `f`/`d`/`T a|b|…|default` value maps, `/100`, `*`, `+`, `-`. Field keywords = `Lang:pw_PLUIE_Value` (Number, ItemCode, Index, Unit, Price, Cost, Tare, B1_Print, B1_Bar, B1_BarFlag, B2_…, Class, Name, Text1-7, PS_SaleDate, PS_SaleTime, PS_PackDate, PS_PackTime, PS_ShelfDate, PC_SaleDate … PC_ShelfDate, DF_LowerSort, DF_UpperSort, DF_LowerNumber, DF_UpperNumber, DA1_Sort, DA1_Day, DA1_LowerLimit, DA1_UpperLimit, DA1_Number …, TaxType, TaxRate, SspValue1-4, SType, Flag, Flag_Value, Bitmap; plus ALPHA in code). Built-in templates for other brands exist only in `INST/zh-CHS/Combo.xml` (`TXTForm_Type`); they all encode HSD as `…#@PC_ShelfDate#T0|0|1|1#@PS_ShelfDate` = PS_UD = (days ≠ 0) — same convention as `PC_UD_Plus`.

### 6.6 The technician's mapping and a compatible layout for our tool [C data / recommendation]
`DUMP/A_ECS/Excel.tsv` (also B_ECS, A_en_Default): ID0 `PLUID`, 1 `Name`, 2 `Price`, 3 `UnitID`, 4 `Remark`, 5 `PS_UD`, 6 `PC_UD_Plus`; `ExcelDefault` empty.
Recommended sheet for Beeftown (import into TM-xA without re-mapping):

| Col | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| Header (optional, ignored) | Number | Name | Price | Unit | Item Code | Shelf date print | Shelf date data |
| Content | PLU no. | name | price in the scale's unit (VND/1000 if Spec202=3) | 1 weight / 2 pcs | item code | 0/1 (overwritten by G) | HSD days (≥1 ⇒ print) |

Write `.xls` (BIFF8) for Unicode names without extra drivers; `.xlsx` needs ACE; CSV is ANSI [I]. Numbers as numeric cells (avoid culture parsing of text).
**[verified-add] Exporter rules for our tool, from the code above.** (1) Never leave a numeric cell blank: write `0` for Item Code, Shelf print and Shelf days. A blank cell drops the row (A, C, E, F, G) or silently drops the columns after it (D). (2) Column D must be the numeric UnitID (1/2), because this mapping has no translation table in `ExcelDefault`. (3) Column G = HSD days; `0` means "no HSD", because `PC_UD_Plus` forces PS_UD=0. The "HSD = today" case (PS_UD=1, PC_UD=0) cannot be expressed through this mapping. (4) Put only one sheet in the workbook. (5) Replace line breaks in names with a space, or accept that the vendor tool would corrupt its own TMS output (§2.2). (6) Remember that an import overwrites all unmapped fields of existing PLUs (§6.1).
**[verified-add]** `StockExcelForm.cs` (the task's suggested starting point) is **not** a PLU import. It imports stock movements (PLU, movement type, unit, amount, unit or total price) from user-chosen column numbers (`SetPara`, `StockExcelForm.cs:796-836`; parser `:924-1007`). Rows for PLUs that do not exist are skipped (`:940-944`), and unit ≤ 1 falls back to `Report_DefaultWeight` (`:978-981`). Its mapping table `Excel` in Report.mdb is empty in all dumps.

---

## 7. Validation rules enforced by the vendor PC software [C]

| Rule | Where |
|---|---|
| PLUID unique (DataTable PK) — duplicate → "Operation failed" box, edit cancelled | `SRC/ECSDataSet.cs:4186-4190`, `SRC/PluForm.cs:1459-1474` |
| PLUID > maxPLUID (9 999 999) rejected; for normal users also > maxUserPLUID (9 999 990) or < minUserPLUID (1) | `SRC/PluForm.cs:1268-1282` |
| Grid shows only PLUID in [minUserPLUID, maxUserPLUID] | `SRC/PluForm.cs:1224` |
| Numeric limits via NumericUpDown: PLUID ≤9 999 999; Remark ≤99 999 999; Price/Cost ≤9 999 999 (2 dp); Tare ≤9 999 (3 dp); BarF ≤9 999; PC_SD/PD/UD ≤999; PC_ST/PT ≤2359 (no minute check); DA_Day ≤127; DA_Up/Dn ≤99 999; DA_Num ±99 999; DF_UN/DN ≤9 999 999; SspValue ≤10 000; percent tare ≤99; all ≥0 except DA_Num | designer lines in §3 |
| No check: Remark uniqueness, Name/Text length, tabs in text, Index format | (absence; data `DUMP/B_ECS/PLU.tsv`) |
| ALPHA ≤16 chars (DataColumn) | `SRC/ECSDataSet.cs:4263` |
| Any edit sets Valid = True (unless the Valid box itself was clicked) | `SRC/PluForm.cs:1283-1292` |
| New PLU: UnitID = defaultUnitID (1); changing unit resets Flag to 0 | `SRC/PluForm.cs:1593-1601, 2249-2253` |
| SType 1…6 lock fields (price, dates, labels, texts) | `SRC/PluForm.cs:1839-1997` |
| Imports: TMS — skip dup PLUID in file, protect PLUID < minUser; Excel — skip rows with parse failure / PLUID < minUser / dup in file; TXT — PLUID in [minUser, maxPLUID], no dup | `SRC/RDS.cs:857-860,1116`; `SRC/ExcelForm.cs:678,699`; `SRC/Common.cs:639` |
| Time tab only shows the HSD pair by default (`Enable_PLU_TimeUD`=True, SD/ST/PD/PT False) | `PROP/Settings.cs:2557-2618`, `INST/TM-xA.exe.Config:704-717`, `SRC/PluForm.cs:1063-1081` |
| **[verified-add]** The setup wizard's PLU page also shows "Print Shelf Date" (combo) + "Shelf Days" columns next to Number/Name/Unit/Price/Item Code/Index by default (`saveConfig.PLU_PS_UD = true`) | `SRC/WizardForm.cs:2064, 6237, 6272, 10537-10546` |
| **[verified-add]** No range or format checks in any import path (Excel/TXT/TMS/Ethernet upload): only int/decimal parse success, PLUID ≥ minUserPLUID (TXT also ≤ maxPLUID) and no duplicate in the file. The PLU form saves every row change to the DB immediately | `SRC/ExcelForm.cs:466-506`; `SRC/Common.cs:639`; `SRC/RDS.cs:856-926`; `SRC/PluForm.cs:1293-1296` |
| **[verified-add]** Shortcut-key picker: a key's stored PLUID < 0 means a **function key** (−function code), > 0 a PLU, 0 empty. Our tool's `keyOfPlu` correctly ignores values ≤ 0 | `SRC/SelForm.cs:510-525, 547-553` |

---

## 8. Our tool's PART 1 beliefs — confirmed / corrected

| Belief in `Beeftown_Can_TMA.html` | Verdict |
|---|---|
| UTF-8, TAB-separated, CRLF | [C] for the PC writer (UTF-8+BOM from `configEncoding`; encoding is configurable per language, `INST/Config/Config.xml`). |
| Section = `DWL<TAB>NAME<TAB>` … `END<TAB>NAME<TAB>` | [C]. Add: `CLR<TAB>NAME<TAB>`+`CLR<TAB>END<TAB>` clear blocks; PC-made files start with an **empty line** before `ECS VER` → `parseTms` (`lines[0]` must be `ECS`) rejects TM-xA-exported TMS files; skip leading blank lines. **[verified-add]** Re-checked `Beeftown_Can_TMA.html:377-393`: `lines[0].split('\t')` must be `ECS`/`VER`, so the rejection is confirmed. Its section detector accepts any 3-field line whose `f[0] !== f[1]`, so `CLR<TAB>PLU<TAB>` is taken as the PLU section start and the later `DWL PLU` is ignored. PLU rows are still collected correctly (harmless), but the section's `start` points at the CLR line. |
| Old firmware uses `XD1` | [?] not present in v3.10 code. |
| Price "mantissa,decimals", `845,0`=845, `1105,1`=110,5 | [C] `SRC/Program.cs:229-251,530-557`. Display with Spec202 decimals [C Tm / I behaviour]. |
| `COL = {NO:1, CODE:2, UNIT:4, PRICE:5, NAME:15, ALIAS:64}` | [C] exactly TMS[1], [2], [4], [5], [15], [64]. |
| 69-column PLU line for V3.14E8 | [C] = vendor format (tag + 67 fields + trailing empty). |
| `PLU_TEMPLATE` defaults | [C] identical to vendor DataTable defaults (ClassID 9, DA_Day 127, rest 0 / `0,0` / empty). |
| `aliasOf()` for ALPHA | Differs from vendor GetAlpha (§5.6) — fine and better for Vietnamese; cap at 14 recommended. |
| MAX_NAME 40 / LONG_NAME 24 | Not vendor rules [?]; real constraint = Spec249 byte budget + label box width. |
| PLU 1…9999, item code ≤5 digits | Stricter than vendor (PLUID ≤ 9 999 990, Remark ≤ 99 999 999) but matches 5-digit item code in default barcodes → keep as policy. |
| `cleanText` turns newlines into spaces | Vendor supports multi-line Name/Text as `\v` (0x0B); decode `\v`→newline for display and encode back instead of showing raw 0x0B. **[verified-add]** `cleanText` (`Beeftown_Can_TMA.html:337`) only replaces `[\t\r\n]`, so an existing `\v` in a name read from the scale is shown raw and written back unchanged. That is byte-safe but looks odd; decode it for display. |
| Deleting a product = dropping its line | [I] does **not** delete it on the scale; needs a `CLR PLU` block (then the file must contain every PLU) or deletion on the scale (P33). |
| `parseLas`: `size = f[7]` | f[7] is **Align/Grid**, font is f[8] (`SRC/SaveForm.cs:1101`, `MAN p.53`); e.g. label 28 SubID 0 has Font 6, Align 5 and the tool's EXAMPLE stores 5. |

New capabilities the tool can add safely from this spec: HSD column (writes [27]/[32]), optional pack-date column ([25]/[30]), Spec 104/105/106 editor, Text1…7 editor, spreadsheet import/export in the §6.6 layout.

---

## 9. Unknowns
- Exact firmware behaviour of Spec105 "days mode" (4-6) and what counts as "PLU does not set shelf day" (PS_UD=0 vs PC_UD=0).
- Whether print conditions 7/8/9 test only PS_xx or also Spec105 (e.g. shelf printing forced by Spec105=2 with PS_UD=0).
- Per-firmware maximum Name/Text length and how Spec249 splits bytes between Name/Text1-7/Index/ALPHA; whether the scale counts UTF-8 bytes or characters.
- Whether the scale deletes PLUs absent from a `DWL PLU` block (believed not) and whether V3.14E8 honours `CLR PLU` from a USB file.
- Whether Spec104 also changes the on-screen date and the Print Date item (believed yes for printing).
- ALPHA maximum accepted by the firmware (vendor never sends >14; PC accepts 16).
- Jet Text driver code page for CSV import on the user's PC (no schema.ini found).

**[verified-add] Status of these unknowns after verification:**
- Spec105 "not set" test / days mode: still unknown. New evidence: the manual says PC_UD is "invalid" when PS_UD=0, and barcode source 26 "Shelf Term" exists; both point to days mode printing N days [I].
- Print conditions 7/8/9: still unknown (no PC-side emulation of print conditions exists in LabelForm/CustomDesigner/FlagDesigner; grep for `.Print ==` found none).
- Name length and Spec249: still unknown (the PC has no limit; Name is probably Memo).
- DWL without CLR = upsert: **strengthened**. The vendor's own Excel/TXT Ethernet monitor pushes partial PLU blocks without CLR (§2.1).
- Spec104 and the screen: the screen follows 104/265 only if **Spec266 = 1** (`Tm:266` "0 Default / 1 Using Spec104 and 265", `MAN` line 4804). The effect on the Print Date item still needs a test print.
- ALPHA max on firmware: still unknown.
- **CSV code page: RESOLVED** for this PC: Jet Text CharacterSet=ANSI, ACP 1252, culture en-GB (§6.1). Also: ACE 12.0 is 64-bit only, so `.xlsx` import from x86 TM-xA will fail [I-strong].
- **Merge semantics: RESOLVED by code path** (§6.1): all 68 columns of an existing PLU are replaced by the imported row, subject to PLUImportKeep; not executed.

---

## Verification log

Adversarial re-check, 2026-09-29. Everything was read from the decompiled source, the TSV dumps, the install XMLs/TMS (read only), the extracted manual text and a read-only registry query. Nothing from the install was executed, and no device was contacted. Scratch script: `scratchpad/verify-plu/check1.py`.

| # | Claim checked | Method / evidence | Outcome |
|---|---|---|---|
| 1 | TMS order ≠ DB order, TMS# = manual `PLU.nn` + 1 | Mapped all 67 `{n}` args of `SaveForm.cs:1060` to the `PLU.tsv` header and to `MAN` P23 PLU.00-57 (text lines 2094-2250) | CONFIRMED. Only PLUID and BarT2 coincide; TaxType…Bitmap = DB# − 1 (added) |
| 2 | 69 split items, `[68]=""` | Format string ends with `{66}\t`; recipe line re-split in Python: 69 items, `[27]=1`, `[32]=3` | CONFIRMED |
| 3 | All writers/readers use the same layout | Programmatic comparison of `SaveForm.cs:1060`, `:1403`, `NetForm.cs:3444`, `:3452` argument lists (identical); readers `RDS.cs:856-926`, `NetForm.cs:2758-2828`, `SaveForm.cs:1938-2008` | CONFIRMED (4 writers, 3 readers; serial path added) |
| 4 | DataTable defaults (ClassID 9, DA_Day 127, Valid True, ALPHA MaxLength 16, Index/Text MaxLength 255, Name none) | `ECSDataSet.cs:4186-4266` | CONFIRMED |
| 5 | `PLU_TEMPLATE` = vendor defaults | Built the vendor default line from the DataTable defaults + `FormatDecimal(0)`="0,0" and diffed it with the tool template (`Beeftown_Can_TMA.html:329`) | CONFIRMED (0 differences outside placeholders) |
| 6 | `FormatDecimal`/`ParseDecimal`/`FormatString`/`ParseString` | `Program.cs:224-251, 525-557` | CONFIRMED. Added: lone LF is not converted; ≥ 1e6 loses decimals |
| 7 | PS_* 0/1 (dates), 0/1/2 (times); PC_* days 0-999 / time 0-2359 | `Combo.xml` PLU_PS_Date/PLU_PS_Time; `PluForm.cs:3651-3691`; `MAN` P23 list; manual example lines 962-972 | CONFIRMED. HHMM downgraded to I-strong; "sell-by" gloss marked [I]; "PC_UD invalid when PS_UD=0" added |
| 8 | Label codes Item Flag3 11-15, Sale-info Flag2 3/4, Print 7/8/9 | `LabelItem.xml` (Flag1=1 Flag3=11..15, Flag1=2 Flag2=3/4), `Combo.xml` LabelItem_Print, `MAN` line 2982 | CONFIRMED |
| 9 | Label 28 layout (A) and const slot k → Text(k+1) | `DUMP/A_ECS/LabelItem.tsv` + `Label.tsv` (Text5 "Ngày đóng gói", Text17 "HSD") | CONFIRMED. Added that B's label 28 has **no** HSD item |
| 10 | Factory labels: Shelf Date caption + value both Print 9 | Python scan of LabelItem/Label in A_en_Default, A_ECS, B_ECS | CONFIRMED for 10/11/11000/11100/11200/11300. **FIXED** for 90000 (caption is "ngày dóng gói") |
| 11 | "co hsd" differences | Spec.tsv Valid flags, Excel.tsv, LabelItem 28, PLU.tsv in A_ECS/B_ECS/A_en_Default | **FIXED**: the Excel mapping is identical in B, so it is not a difference; label 28 HSD items are one (added) |
| 12 | Tm 104/105/106/249/265/266/202/188 texts | Parsed `INST/Tm.xml` Spec_Info | CONFIRMED |
| 13 | Excel import: HDR=NO, positional, PC_UD_Plus rule, header skipped | `ExcelForm.cs:466-582, 651-712, 846-876` | CONFIRMED. Added: blank numeric cell ⇒ row dropped; bad UnitID ⇒ later columns dropped; all sheets imported; Valid=True |
| 14 | Merge overwrites unmapped fields [I] | PLU table pre-filled (`ExcelForm.cs:871-872`), rows added with full ItemArray (`:681`), `Merge` preserveChanges=false, UpdateCommand sets all columns `WHERE PLUID=?` (`TA/PLUTableAdapter.cs:269`) | UPGRADED to C (code path; not executed) |
| 15 | NetForm FillFields "same copy" | `NetForm.cs:5920-5990` vs `ExcelForm.cs:508-582` | **FIXED**: unknown unit → UnitID 0; no NL_PLUImportKeep/ALPHA |
| 16 | Excel export quirks | `ExcelForm.cs:741-844` | CONFIRMED. **FIXED**: a leading PC_UD_Plus crashes the export (NullReferenceException), it is not just "untranslated" |
| 17 | PLU_Col Display names | Parsed `INST/Combo.xml` and `INST/en/Combo.xml` (identical, 66 rows) | CONFIRMED. Minor wording fix for BarF1/BarF2 |
| 18 | Flag bits | `PluForm.cs:2261-2295`, `RDS.cs:2133-2160` | **FIXED** wording: masks 1/2/4 |
| 19 | DF_UN/DF_DN enabling | `PluForm.cs:1250-1251, 1476-1484` | **FIXED**: DF_UN depends on DF_U=3 |
| 20 | Validation (PLUID range, Valid auto-set, dup PK) | `PluForm.cs:1224-1225, 1262-1301, 1459-1474`; `Settings.cs` maxPLUID 9999999, minUserPLUID 1, minClassID 9; `TM-xA.exe.Config` maxUserPLUID 9999990 | CONFIRMED |
| 21 | GetAlpha rule and data match | `Program.cs:314-523` read; Python re-implementation over dumps (A 7/7, A_en_Default 7/7, B 1/5) | CONFIRMED. Added which import paths skip ALPHA generation |
| 22 | Encoding / BOM / blank first line | `Program.cs:105-108`, `Config/Config.xml` (all utf-8), `user_config.bck` + live user.config (utf-8), `SaveForm.cs:945-947`; hexdump of `Config/*/_ECS.TMS` | CONFIRMED. **FIXED** provenance: `_ECS.TMS` is the factory reset file, not a SaveForm export |
| 23 | Tool beliefs (`parseTms` rejects a leading blank line; `parseLas` size=f[7]=Align) | `Beeftown_Can_TMA.html:377-393, 445-448, 598-605`; `SaveForm.cs:1101`; `RDS.cs:1023-1032` | CONFIRMED. Added the CLR-as-section-start quirk |
| 24 | Units table | `RDS.cs:509-532`, `DUMP/A_ECS/Unit.tsv` | CONFIRMED |
| 25 | Unit export disabled | `SaveForm.cs:681-700` (checkbox forced hidden), no `"UNT` writer in the source | CONFIRMED |
| 26 | Jet/ACE environment (unknown #7) | Read-only registry: Jet Text CharacterSet=ANSI; ACP 1252; culture en-GB; ACE 12.0 CLSID only in the 64-bit view; `TM-xA.csproj` x86 | RESOLVED (added) |
| 27 | TIM clock | `NetForm.cs:2314-2324`; no TIM in SaveForm | Added: Ethernet only |
| 28 | StockExcelForm / SelForm / FilterForm | Read `StockExcelForm.cs:796-1076`, `SelForm.cs:433-560`, `FilterForm.cs` (generic grid filter) | Added: stock import is not a PLU import; negative SCP value = function key |

Not verifiable offline, left as unknowns: firmware behaviour of Spec105 modes and print conditions 7/8/9, firmware Name/ALPHA length limits, whether V3.14E8 honours `CLR`/`TIM` from a USB file, and how Spec104 affects the printed Print Date.
