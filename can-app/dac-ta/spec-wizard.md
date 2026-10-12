# TM-xA spec reference: system parameters (TMS), global texts (TMT), units, dept/class/salesman/VIP/passwords, configuration wizard

Scope: TM-xA Management Program v3.10 (JHScale, .NET WinForms, decompiled with ILSpy) and the TM-A label scale data it exchanges. Written for building an improved Beeftown tool (`C:\Beeftown\cong-cu\Beeftown_Can_TMA.html`).

Evidence conventions
- `X.cs:N` = decompiled source under `scratchpad\tmxa-src\ECS\` (or `ECS.ECSDataSetTableAdapters\`).
- `Tm.xml`, `Lang.xml`, `Combo.xml`, `TM-xA.exe.Config` = files in the install root `C:\Users\khanh\Downloads\tma co hsd2\tma co hsd2\` (read only). The root `Tm.xml` is semantically identical to `en\Tm.xml` (all 411 entries compared, 0 differences); the 2026-05 timestamps come from the program rebuilding these files at every start from `<culture>\X.xml` plus `Config\<lang>\X.xml` overlays (`Program.MergeXML`, `Program.cs:649-670`), not from a technician edit.
- `_ECS.TMS` = `Config\en\_ECS.TMS` (factory seed file). `Default.mdb/A_ECS/B_ECS` = TSV dumps in `scratchpad\mdb\dump\`.
- `Manual` = `Document\User Manual\Printing Serial Scale V3.04A.pdf` (page numbers are the printed page numbers; text extract in `scratchpad\work\Printing Serial Scale V3.04A.txt`).
- `Wizard.BIN` decoded with `scratchpad\work\nrbf.py` (a .NET BinaryFormatter reader written for this task); outputs `scratchpad\work\wizA.txt` (install A) and `wizB.txt` (nested install B).
- **CONFIRMED** = seen in code or data. **INFERRED** = reasoned from names/labels/behaviour, not proven.

---

## 0. Short answers

1. **`spec[202]` = "Decimal Point: U.Price (0~5)"; `spec[203]` = "Decimal Point: T.Price (0~5)". CONFIRMED** (Tm.xml SpecID 202/203; the wizard writes `MISC_UPPoint`→202 and `MISC_TPPoint`→203, `WizardForm.cs:1702-1703`). Using 202 for the unit-price column is right. Correction to keep in mind: the PLU price column in a TMS file is **value based**, not scaled by 202. `Program.FormatDecimal` writes `mantissa,exp` where value = mantissa / 10^exp and exp is the smallest that represents the value, capped at 7 (`Program.cs:530-557`; parsed back by `Program.ParseDecimal`, `Program.cs:229-250`). Spec 202 only decides how many decimals the scale **shows**. So "845,0" is the number 845, which a 3-decimal scale shows as `845.000`. The tool's `rawToVnd(raw, dec)` works because of the Vietnamese "thousand-dong" convention (section 5). 203 is a reasonable fallback only because the wizard never lets T.Price decimals exceed U.Price decimals (`WizardForm.cs:6942-6956`, `P4_PointEnableCheck`). They are normally equal.
2. **`spec[0]` = "Bill 1: Item Print Format (0~99)"** is the *default* item-label format for bill 1 (the scale's own printer). It is the label actually used **only when the PLU's own `LabelID1` (TMS PLU field 8) is 0** (Manual p.12: "If sale PLU has been set for a specific print format (not 0), system would use the print format… (0)… the print format would be Spec000"). It can also be overridden by Spec054 "Print Format and Barcode Select" (class or Spec source) and gated by Spec056 "Print Function". Value 0 means "do not print". Related: `spec[5]` is the sum (total) label, `spec[10]/[15]` are bill 2, and `spec[350]/[355]` are the network printer. The wizard clones the chosen template to label **28** (item), **29** (sum), **27** (receipt) and writes that id into spec 0/5 (section 9). So finding the label with `LabelID == spec[0] && Sort == 1` is correct as a default. For each product, prefer PLU field 8 when it is non-zero.
3. **The technician did not change a single Spec value in the PC databases.** All 500 rows of `A_ECS`, `B_ECS` and `Default.mdb` are identical to `_ECS.TMS`. The only difference is that `B_ECS` has `Valid=False` on 104/105/106. **[verified-fix]** The direction is the other way round. The factory seed makes all 500 rows Valid=False (`RDS.cs:749, 1226-1227`), so B_ECS is the factory state. `A_ECS` and install A's `Config\en\Default.mdb` (a technician profile dated 2026-01-30, not a factory file) have 104/105/106 **ticked** (value 0). Also, the PC keeps a value read from a scale only for ids that are already ticked, so these databases **cannot** reveal the scale's specs at all (section 1). The technician's settings live in **`Wizard.BIN`** (the wizard's saved answers plus the exact TMS text it sends; section 8). For the nested install B (the Vietnamese one): **U.Price/T.Price decimals = 3**, **money suffix "VND"**, no prefix, units printed on weight, unit price and total, no rounding, item label 28, gap paper, darkness 9, "one item bill only, print on [Accu]" (Spec250=1), 5-window A17 scale. **The date format was NOT set**, so it stays at Spec104=0 (`YYYY.MM.DD 24H`) unless someone changed it on the scale keypad.
4. Wizard presets are described in section 9.

---

## 1. The TMS text protocol as used for specs

CONFIRMED from `SaveForm.cs:928-1239` (USB file writer), `SaveForm.cs:1241+` (serial), `NetForm.cs:2495-2596` (Ethernet upload), `RDS.cs:712-850` (file reader):

```
<BOM><CRLF>                       <- StreamWriter(Encoding.GetEncoding("utf-8")) emits a BOM, then WriteLine() writes an empty first line (SaveForm.cs:945-946)
ECS<TAB>VER<TAB>100<TAB>          <- SaveForm.cs:947
[CLR<TAB>TMS<TAB>                 <- only when the "clear" box is ticked (SaveForm.cs:950-954)
 CLR<TAB>END<TAB>]
DWL<TAB>TMS<TAB>
TMS<TAB>{SpecID}<TAB>{Value}<TAB> <- one row per spec with Valid=True (SaveForm.cs:957-963). Value is always a signed Int32
END<TAB>TMS<TAB>
DWL<TAB>TMT<TAB>
TMT<TAB>{StringID}<TAB>{text}<TAB>
END<TAB>TMT<TAB>
... SCP, DPT, CLS, PLU, BAR, LAB/LAS/LAE, SAL, FNT, BMP, VIP, custom tables ...
... wizard text (Program.sWizard) is appended here when exported from the wizard (SaveForm.cs:1220-1223) ...
END<TAB>ECS<TAB>                  <- SaveForm.cs:1224
```

- **Partial TMS blocks are normal.** The wizard sends only the IDs it manages (for example 13 rows) and splits them into several `DWL TMS … END TMS` blocks interleaved with `DWL TMT` blocks (`WizardForm.cs:1709-1714, 1738-1742`). The scale therefore accepts any subset of IDs, and one file can contain the TMS section **several times**. INFERRED from the fact that the vendor tool does this: IDs that are not listed keep their current value on the scale.
- `CLR<TAB>XXX<TAB>` followed by `CLR<TAB>END<TAB>` clears a table before download. INFERRED: for TMS this resets the specs, so never emit it.
- Upload (scale→PC) is `UPL<TAB>TMS<TAB>`. The scale answers with `TMS` rows and ends with a line starting `END` (`NetForm.cs:2495-2542`).
- USB file name: `JHSCALE\A_{n:000}.TMS`, or `JHSCALE\A_xxx.TMS` when "Boot File" is ticked (`SaveForm.cs:485-494`; `Lang.xml` `pw_BootFile` = "Boot File"; n = 0-999). ~~INFERRED: n matches Spec040 "Device Number", so the tool's `A_000.TMS` belongs to a scale whose device number is 0.~~ **[verified-fix]** `nnn` is **not** Spec040. The manual calls it the "file serial number" that the operator types on the keypad in menu **P41 Commu U-Disk** (the display starts at `000`). 【Confirm】 loads that file into the scale and 【Amend】 saves the scale's data to it. `A_xxx.TMS` (literally "xxx") is the **auto-update file**, selected with 【×】 in P41. The scale also loads it by itself at power-on when Spec042 "USB-Disk Auto Update" = 1, which is the factory setting (Manual p.59-60, §5.6.1, text lines 3239-3244, Examples 5-13/5-14). So `A_000.TMS` is just file number 000, the keypad default. It is not tied to a device number. **[verified-add]** In the PC's USB export dialog the "Boot File" box is **ticked by default** (`SaveForm.cs:279` `updateCheckBox.Checked = true`), and the number box is disabled until it is unticked (`SaveForm.cs:856`, resx `numericUpDown.Enabled=False`). So TM-xA writes `A_xxx.TMS` by default. The scale's load screen counts "Number of Error Data / Number of Right Data" per row (Manual p.59, Example 5-13), so it accepts or rejects each row separately.
- **Tool robustness issue (CONFIRMED against `_ECS.TMS`):** a PC-generated file begins with BOM + empty line. `Beeftown_Can_TMA.html` `parseTms()` requires `lines[0]` to be `ECS<TAB>VER`, so it would reject any file produced by TM-xA. It also stores only the **last** `DWL TMS` block (`sec[open.name] = open`), so specs in earlier blocks are lost. Fix: skip leading empty lines and merge every block of the same name.

### How the PC stores and shows specs
- Table `Spec(SpecID Int32, Value Int32, Valid Boolean)`, 500 rows, ids 0-499 (`SpecTableAdapter.cs:132-162`).
- `Valid` is the "Import/Export" check box (`SpecForm.cs:179`). **Only rows with Valid=True are exported** (`SaveForm.cs:959`). When reading from a scale or file, **only rows already Valid are overwritten**; a new id is added with Valid=False (`NetForm.cs:2519-2532`, `RDS.cs:739-752`). `Default.mdb` has Valid=True only on 104, 105 and 106 (the date/shelf-life trio). "Import/Export All" is visible to SuperAdmin only (`SpecForm.cs:182-184`).
  - **[verified-fix]** That Valid pattern is **not factory**. Seeding from `_ECS.TMS` into an empty DB always gives Valid=False: `DataSet_Init` passes an empty `oldData` (`RDS.cs:1226-1227`), so every id takes the "new id → Valid=False" branch (`RDS.cs:749`). `Config\en\Default.mdb` in install A is a **technician-saved data profile**, last written 2026-01-30 13:39:04. Its size (888,832 B) and timestamp match install A's `ECS2.mdb`, while `_ECS.TMS` and `Config\_ECS.mdb` date from 2018-08-21. So ticking 104/105/106 was a technician action in install A (the "co hsd" build). Install B, with all Valid=False, is the untouched factory state.
  - **[verified-add]** Because of this Valid gating, **a PC database can never show the scale's spec values** unless the rows were ticked before the upload. B_ECS has no ticked rows, so any upload from a scale was silently dropped for all 500 specs. Identical-to-factory values in B_ECS are therefore **not evidence** that the scale is at factory settings. B_ECS did receive departments/classes 6, 7, 8 named "Reserved 6/7/8" (`B_ECS/Dept.tsv`, `Class.tsv`). The PC never creates those names; they appear only in `Combo.xml` "Global Text", not in `_ECS.TMS`. This is INFERRED evidence that install B uploaded DPT/CLS from a real scale (`NetForm.cs:2644-2724` accepts ids < 10 when not protected).
  - **[verified-add]** The Import/Export-All toggle only touches rows that pass the grid filter `"Visible"` (`SpecForm.cs:330-334, 444`), so hidden ids stay unexported even for SuperAdmin.
- Descriptions come from `Tm.xml` → `UIDataSet.Spec_Info(SpecID, Type, Display, Visible)`, read in `SpecForm.cs:185-186`:
  - `Type 0` = integer text box. `Type 1` = combo box whose `Display` is `Name|v1|label1|v2|label2|…` (parsed in `SpecForm.cs:264-279`). `Type 2` = check box (unused in Tm.xml). `Type 3` = decimal packed into the int as **`value = mantissa*8 + decimals`** (`Program.DecimalInInt/IntInDecimal`, `Program.cs:570-599`); only Spec297 "Second Currency Exchange" uses it.
  - `Visible`: `TRUE` = everyone, `admin` = Admin and SuperAdmin, `FALSE` = SuperAdmin only (`SpecForm.cs:128-150`). **IDs missing from Tm.xml are hidden from everyone** (the `num == -1 → false` branch runs before the SuperAdmin check). On load, hidden rows are forced to Valid=False and saved (`SpecForm.cs:188-201`), so the PC can never export them. Spec138 is the exception: the wizard writes it directly.
- On first run with an empty DB the program seeds Spec/String/Dept/Class/PLU/Barcode/Label from `Config\<lang>\_ECS.TMS` (`RDS.cs:1221-1232`). That is why `Default.mdb` equals `_ECS.TMS` (500/500 identical, checked). [verified-fix: identical in **values** only; the Valid flags on 104-106 were ticked later, see above.]
- **[verified-add] PC import rejects repeated spec ids.** `DataSet_ReadTMS` adds every `TMS` row with `newData.Spec.AddSpecRow` (`RDS.cs:1124-1125`), and SpecID is the primary key. A second row for the same id throws a ConstraintException, which the outer `catch` turns into a failed import (`RDS.cs:1204-1207`). The wizard itself emits `250` twice in "one item, not print-on-confirm" mode, so TM-xA cannot re-import such a file. Our tool should never repeat an id inside one file.
- **[verified-add] Other PC writers of TMS rows** (not SpecForm):
  - The Ethernet "set IP" action writes 12 rows: `150-153` (IP), then `158-165` (gateway, mask). The formula is `((i >= 4) ? 154 : 150) + i`, which skips the PC-IP rows 154-157 (`NetForm.cs:2235-2241`). The secondary-network variant writes `430-441` (`NetForm.cs:2245-2251`).
  - On every Ethernet connection to firmware ≥ V2.49A, `UpdateAsk` writes **`TMS 58`** = (+1 if "ask logs", +2 if "ask PLU") (`NetForm.cs:1445-1466`; settings `gen_AskLogs=True`, `gen_AskPLU=False` in `TM-xA.exe.Config`, so normally 58=1). The scale then pushes `ASK REP` (new sales logs) or `ASK PLU` requests to the PC (`NetForm.cs:821-870`). USB users never send it.
  - After a `UPL` section finishes, the PC sends `UPL<TAB>END<TAB>` (`NetForm.cs:2542`).
- Regional factory differences in `Config\<lang>\_ECS.TMS`: `es` sets 104=3 (MM-DD-YY), 265=1, gray 9, plus several metrology changes. `zh-CHS/zh-CHT` set 69=2, 207=2, 213=0, 227=0, 268=1. `pt` and `ru` are identical to `en`. No Vietnamese preset exists.
- Menu levels on the scale (Manual p.19, "Fast-Prog of Spec"): level 0 items can be edited with 【F-Prog】+【Prog】. Level 1 needs 【×】 plus a number. Levels 2 and 3 (metrology) cannot be reached from the keypad.

---

## 2. Specs that matter for Beeftown (curated)

Suggested Vietnamese labels are for the new tool. "Beeftown value" = what the technician's wizard sent (B) or the recommended value.

| ID | Meaning | Values | Factory | Beeftown value | Nhãn gợi ý (VI) |
|---:|---|---|---|---|---|
| 0 | Default item-label id (bill 1). Used when PLU field 8 (LabelID1) = 0 | 0 = no print, 1-99 = LAB id | 1 | **28** (B wizard) | Mẫu tem mặc định |
| 1 | Item barcode format (BAR id) | 0-99 | 2 | **28** (B wizard) | Kiểu mã vạch |
| 2 | Item barcode flag (leading digits) | 0-9999999 | 20 | not sent in B (manual-barcode mode) | Số đầu mã vạch |
| 3 | Item print copies | 0-99 (0 = no auto print) | 1 | 1 | Số tem in |
| 5 / 6 / 7 | Sum label / sum barcode / sum flag | as 0/1/2 | 4 / 7 / 2099999 | B: 6=28 | Tem tổng |
| 21 | Paper type | 0 plain, 1 gap (label) | 1 | 1 | Loại giấy |
| 22 / 23 | Print darkness, gap / plain paper | 0-15 | 7 / 7 | **9 / 9** (B) | Độ đậm in |
| 20 | Print speed slow-down % | 0-99 | 33 | - | Giảm tốc in |
| 40 | Device number (also INFERRED as the `A_nnn.TMS` number) | 0-9999999 | 0 | 0 | Số máy |
| 42 | USB disk auto update | 0/1 | 1 | 1 | Tự nạp USB |
| 54 | Print-format/barcode source (Spec vs class vs default) | 0,1,2,10,11,12,20,21,22 | 0 | 0 | - |
| 56 | Print function (bill 1/2/PTR/forbidden) | 0-6 | 0 | 0 | - |
| 69 | Zero-return before next weigh sale | 0-4 | 1 | 1 | Về 0 giữa 2 lần cân |
| 83 | Quick price change on the scale | 0-4 | 1 | 1 (long press 【@Price】) | Sửa giá nhanh |
| 100 / 101 | Rounding, single item / sum total | 0-11 | 0 / 0 | 0 / 0 (B). 2 = round to 100 đ with 3 dp | Làm tròn |
| 104 | **Date/time format** | 0-10, 100-110 | 0 = YYYY.MM.DD 24H | **4 = DD/MM/YY 24H recommended** (never sent by the technician) | Định dạng ngày |
| 105 / 106 | Shelf-life printing / shelf days | 0-6 / 0-999 | 0 / 0 | 0 (use per-PLU shelf days) | Hạn dùng |
| 118 | Amend/clear of accumulation buffer | 0-3 (wizard also 4 = forbidden) | 3 | 3 | - |
| 131 | Auto accumulate/print after zero-return | 0-6 | 0 | **1** in B (see 9.4 note). [verified-add] Manual p.14 says value 1 = "auto **record** after zero-return … scale still records the transaction in un-print condition, convenient to check and audit" (text line 825; table p.79-80: "1: Auto record after Zero-return, can press 【Cancel】"). So in B, a weighed PLU that is taken off without printing is **logged as a sale** unless 【Cancel】 is pressed (INFERRED effect on reports). Use 0 for none, 3/4 for auto print | Tự in khi về 0 |
| 180 | Decimal mark shown/printed | 0 dot, 1 comma | 0 | 0 (dot works as a VN thousands separator) | - |
| 181 | Thousands separator printed | 0 none, 1 dot, 2 comma, 3 quote | 0 | 0 | - |
| 185 / 186 / 187 | Print unit after weight / unit price / money | 0/1 | 0/0/0 | **1/1/1** (B) | In đơn vị |
| 188 / 189 | Unit-price / total-price display length | 0 auto, 1-7 | 6 / 7 | 6 / 7 → max 999.999 (999,999 đ/kg) and 9,999.999 | - |
| 200 / 201 | Tare / weight decimals | 0-3 | 3 / 3 | 3 / 3 | - |
| **202** | **Unit-price decimals** | 0-5 | 2 | **3** (B) | Số lẻ đơn giá |
| **203** | **Total-price decimals** | 0-5 (≤ 202 via wizard) | 2 | **3** (B) | Số lẻ thành tiền |
| 206 / 207 | Keep U.Price / T.Price decimals fixed | 0-3 / 0-2 | 3 / 1 | same | - |
| 208 / 209 / 196 | Decimals of weight / money / count inside the barcode | 0-5 | 3 / 2 / 3 | B did not send them (manual barcode) | Số lẻ trong mã vạch |
| 210 / 211 / 212 | T-Sale unit / system U.Price unit / system weight unit | 0,3-8 (unit ids) | 0 / 0 / 3 (kg) | 0 / 0 / 3 | Đơn vị |
| 213 | Weight precision (division) | 0-3 | 1 | 1 | - |
| 250 | Accumulation mode | 0 normal, 1 【Accu】=【Print】, 2 accumulate once | 0 | **1** (B, one-item bill + print direct) | Chế độ in từng tem |
| 265 / 266 | Month as 2 letters / use 104+265 on the display | 0/1 | 0 / 0 | 0 / **1** if the display should follow 104 | - |
| 277 | Default working mode (normal/batch/prepack/lock/auto) | 0-4 | 0 | 0 | - |
| 190-195 | 5-window display content (A17 5w model) | see table | 0,1,0,0,0,1 | B: 190=0, 191=1, 192=0, 193=0, 194=0, 195=1 | Màn hình phụ |
| 247 | Keep password after entry | 0-3 | 0 | 0 | Nhớ mật khẩu |
| 260 | Operations that need the Admin password (bitmask) | 0-31 | 0 | 0 | - |
| 138 | "Admin in charge" bitmask (wizard only) | 0-4095 | 0 | 0 (B, Full right) | - |

---

## 3. Complete Spec list (all 500 ids)

Columns: Kind `num` = free integer (Tm.xml Type 0), `enum` = combo (Type 1), `decimal` = Type 3 packed decimal. "Default" = `Config\en\Default.mdb` value, which is identical to `Config\en\_ECS.TMS`. The **scale firmware may hold different values**: the manual itself says "Default values are different via different version" (Manual p.73). Always read the scale's own export. "Wizard page" = the wizard step that writes the id (section 9). "Vis" = Tm.xml Visible (TRUE / admin / FALSE; `-` = not in Tm.xml, so the PC UI hides it).

Tm.xml defines 383 ids. 11 more come from the manual (or are undefined with a non-zero default). 106 ids are undefined. **[verified-fix]** 105 are undefined. **Spec058 is defined by the PC code**: the "ask" flags for the Ethernet link, see section 1 and the row added under Q.

**[verified-add] Tm.xml ranges are not enforced and are sometimes wrong.** Spec030 "Feed Sensor Position (0~255)" has factory value **270**. Spec007 "(0~99999)" has factory value 2099999, and the manual gives 0~9999999. Spec133/134 have factory value 2, which is outside their 0/1 option lists. Do not clamp to the Tm.xml text. The 'es' factory file also sets undefined id 286=1 and 228=3 (Tm.xml lists 0-2 for 228).

Conflicts between Tm.xml (newer, v3.10) and Manual V3.04A (older): 91 (Tm.xml "Account Function" vs manual "Log record function"), 96 (Tm.xml "E-Log Function", hidden, vs manual "dummy PLU number for Discount & Rounding"), 54 and 56 (Tm.xml has more options), 131 (Tm.xml 0-6 vs manual 0-4), 272 (Tm.xml adds 10/11/12 desk/platform/hanging, which replaces manual Spec299), 74 (Tm.xml bitmask 0-31, wizard uses bits up to 512). Trust Tm.xml for v3.x firmware.

### A. Label/receipt selection (Bill 1, Bill 2, print function)

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 0 | Bill 1: Item Print Format(0~99) | num | 0~99 | 1 | OperationMode (+PT_1/2/3 choose label id) | TRUE |
| 1 | Bill 1: Item Barcode Format(0~99) | num | 0~99 | 2 | Barcode | TRUE |
| 2 | Bill 1: Item Barcode Flag(0~99999) | num | 0~99999 | 20 | Barcode | TRUE |
| 3 | Bill 1: Item Print Times(0~99) | num | 0~99 | 1 |  | TRUE |
| 4 | Bill 1: Item Print Reversed | enum | 0=Normal; 1=Reversed | 0 (Normal) |  | TRUE |
| 5 | Bill 1: Sum Print Format(0~99) | num | 0~99 | 4 | OperationMode (+PT_1/2/3 choose label id) | TRUE |
| 6 | Bill 1: Sum Barcode Format(0~99) | num | 0~99 | 7 | Barcode | TRUE |
| 7 | Bill 1: Sum Barcode Flag(0~99999) | num | 0~99999 | 2099999 | Barcode | TRUE |
| 8 | Bill 1: Sum Item Print Times(0~99) | num | 0~99 | 1 |  | TRUE |
| 9 | Bill 1: Sum Print Reversed | enum | 0=Normal; 1=Reversed | 0 (Normal) |  | TRUE |
| 10 | Bill 2: Item Print Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 11 | Bill 2: Item Barcode Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 12 | Bill 2: Item Barcode Flag(0~99999) | num | 0~99999 | 0 |  | TRUE |
| 13 | Bill 2: Item Print Times(0~99) | num | 0~99 | 0 |  | TRUE |
| 14 | Bill 2: Item Print Reversed | enum | 0=Normal; 1=Reversed | 0 (Normal) |  | TRUE |
| 15 | Bill 2: Sum Print Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 16 | Bill 2: Sum Barcode Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 17 | Bill 2: Sum Barcode Flag(0~99999) | num | 0~99999 | 0 |  | TRUE |
| 18 | Bill 2: Sum Item Print Times(0~99) | num | 0~99 | 0 |  | TRUE |
| 19 | Bill 2: Sum Print Reversed | enum | 0=Normal; 1=Reversed | 0 (Normal) |  | TRUE |
| 54 | Print Format and Barcode Select | enum | 0=Use default print format and barcode; 1=Use Spec print format, default barcode; 2=Use class print format, default barcode; 10=Use default print format, Spec barcode; 11=Use Spec print format and barcode; 12=Use class print format, Spec Barcode; 20=Use default print format, class barcode; 21=Use Spec print format, class barcode; 22=Use class print format and Barcode | 0 (Use default print format and barcode) |  | TRUE |
| 55 | PLU Filter with Class(0~99) | num | 0~99 | 0 |  | TRUE |
| 56 | Print Function | enum | 0=Print All as setting; 1=Print Bill 1; 2=Print Bill 2; 3=Print in PTR; 4=Print Forbidden; 5=Print bill 1 if gap paper, print bill 2 if plain paper; 6=Print bill 1 if plain paper, print bill 2 if gap paper | 0 (Print All as setting) |  | TRUE |
| 65 | Reprint Function | enum | 0=Reprint Forbidden; 1=Print Bill 1; 2=Print Bill 2; 3=Print in PTR; 4=Print All as setting; 5=Print bill 1 if gap paper, print bill 2 if plain paper; 6=Print bill 1 if plain paper, print bill 2 if gap paper | 4 (Print All as setting) |  | TRUE |
| 256 | Pre-Print Function | enum | 0=Pre-Print Forbidden; 1=Print Bill 1; 2=Print Bill 2; 3=Print in PTR; 4=Print All as setting | 0 (Pre-Print Forbidden) |  | TRUE |
| 278 | Hangup Bill Print Format(0~99,0 for default) | num | 0~99,0 for default | 0 |  | TRUE |
| 289 | Other Transaction Print Format(0~99) | num | 0~99 | 0 |  | TRUE |

### B. Printer hardware: paper, darkness, speed, barcode bar widths

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 20 | Print Speed Slow Down(0~99) | num | 0~99 | 33 |  | TRUE |
| 21 | Paper Type | enum | 0=Plain Paper; 1=Gap Paper | 1 (Gap Paper) | OperationMode (+PT_1/2/3 choose label id) | TRUE |
| 22 | Gray Level of Gap Paper(0~15) | num | 0~15 | 7 | OperationMode (+PT_1/2/3 choose label id) | TRUE |
| 23 | Gray Level of Plain Paper(0~15) | num | 0~15 | 7 | OperationMode (+PT_1/2/3 choose label id) | TRUE |
| 24 | Plain Paper: Interval of Each Print(0~99mm) | num | 0~99mm | 5 |  | TRUE |
| 25 | Plain Paper: Cut-off Position(0~99mm) | num | 0~99mm | 35 |  | TRUE |
| 26 | Plain Paper: Pre-feed Distance(0~1999, Device is reverse feed if number > 1000) | num | 0~1999, Device is reverse feed if number > 1000 | 16 |  | TRUE |
| 27 | Wide of Report Printing(0~99mm) | num | 0~99mm | 54 |  | TRUE |
| 28 | Font for Report Print | enum | 0=10*18; 1=18*26; 2=26*34 | 1 (18*26) |  | TRUE |
| 29 | Heat Protect(0~30s) | num | 0~30s | 0 |  | TRUE |
| 30 | Feed Sensor Position(0~255) | num | 0~255 | 270 |  | TRUE |
| 31 | Narrow Bar Dot Number of Barcode(0~9,0 means default) | num | 0~9,0 means default | 0 |  | TRUE |
| 32 | Wide Bar Dot Number of Barcode(0~19,0 means default) | num | 0~19,0 means default | 0 |  | TRUE |
| 33 | Font of Barcode readable character(0~2) | num | 0~2 | 0 |  | TRUE |
| 34 | Weighing's Anti-shake while Printing(0~19, Hardware Attribute) | num | 0~19, Hardware Attribute | 3 |  | TRUE |
| 35 | Auto New Line Mode | enum | 0=Forbidden; 1=Allowed | 0 (Forbidden) |  | TRUE |
| 36 | ITF25 frame mode | enum | 0=No frame; 1=Up and down frame; 2=Around frame | 1 (Up and down frame) |  | TRUE |
| 37 | ITF25 frame width(0~31) | num | 0~31 | 8 |  | TRUE |
| 38 | ITF25 left and right blank width(0~31) | num | 0~31 | 20 |  | TRUE |
| 39 | Gap Paper: Pre-feed Distance(0~1999, Device is reverse feed if number > 1000) | num | 0~1999, Device is reverse feed if number > 1000 | 0 |  | TRUE |
| 244 | Ignore Print Error(Part 1) | enum | 0=No Ignore; 1=Ignore PBS(E7.12) | 0 (No Ignore) |  | TRUE |
| 245 | Ignore Print Error(Part 2) | enum | 0=No Ignore; 1=Ignore PDS(E7.11); 2=Ignore Cooling Down(E7.18); 3=Ignore PDS(E7.11) and Cooling Down(E7.18) | 0 (No Ignore) |  | TRUE |
| 246 | Ignore Print PPS Sensor | enum | 0=No Ignore; 1=Ignore | 0 (No Ignore) |  | TRUE |
| 269 | Print Forbidden | enum | 0=Default; 1=Forbidden | 0 (Default) |  | TRUE |
| 236 | Print in Battery Mode | enum | 0=Print; 1=Not print | 0 (Print) |  | TRUE |
| 240 | Wide of Thermal Header(mm:0~64) | num | mm:0~64 | 54 |  | FALSE |

### C. Device, communication, network, Wi-Fi

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 40 | Device Number(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 41 | RS232 Baud Rate | enum | 0=300; 1=600; 2=1200; 3=2400; 4=4800; 5=9600; 6=19200; 7=38400; 8=57600; 9=115200 | 5 (9600) |  | TRUE |
| 42 | USB-Disk Auto Update | enum | 0=No Update; 1=Auto Update | 1 (Auto Update) |  | TRUE |
| 43 | Ethernet Connect | enum | 0=No connect; 1=Server Mode; 2=Client Mode | 1 (Server Mode) |  | TRUE |
| 44 | Ethernet Auto Re-connect(0~65535) | num | 0~65535 | 30 |  | TRUE |
| 45 | Ethernet Auto Reboot if Configure Changed | enum | 0=Disable; 1=Enable | 1 (Enable) |  | TRUE |
| 46 | Latency Time of USB Linking(0~99,Each 10 for 1s,0 for Default) | num | 0~99,Each 10 for 1s,0 for Default | 0 |  | TRUE |
| 47 | USB Power Always ON | enum | 0=Disable; 1=Enable | 0 (Disable) |  | TRUE |
| 48 | Ethernet Overtime Interval(0~31s) | num | 0~31s | 10 |  | TRUE |
| 49 | Password Authorization | enum | 0=Local operation only; 1=Communication operation allowed | 0 (Local operation only) |  | TRUE |
| 50 | Ethernet Type | enum | 0=Cable network only, Wi-Fi stop work; 1=Wi-Fi network on STA mode, cable stop work; 2=Wi-Fi network on AP mode, cable stop work; 3=Cable/Wi-Fi both stop work; 4=Cable network primary, Wi-Fi STA network secondary; 5=Wi-Fi STA network primary, Cable network secondary; 6=Wi-Fi AP network primary, Cable network secondary; 7=Cable network primary, Wi-Fi AP network secondary | 0 (Cable network only, Wi-Fi stop work) |  | TRUE |
| 51 | Security Mode | enum | 0=No Security; 1=WEP; 2=WPA/WPA2 | 2 (WPA/WPA2) |  | TRUE |
| 52 | Security Option | enum | 0=Open System; 1=Shared Key | 0 (Open System) |  | FALSE |
| 53 | Domain Type | enum | 0=FCC; 1=IC; 2=ETSI; 3=Spain; 4=France; 5=JapanA; 6=JapanB | 0 (FCC) |  | TRUE |
| 57 | POS protocol(0~99) | num | 0~99 | 0 |  | TRUE |
| 179 | Custom Protocol | enum | 0=None; 1=Dahua China; 2=METTLER TOLEDO(RL00); 3=Taico China(ACS-FB); 4=ACLAS; 5=Digi SM-80 | 0 (None) |  | TRUE |
| 150 | Ethernet IP 1(0~255) | num | 0~255 | 192 |  | TRUE |
| 151 | Ethernet IP 2(0~255) | num | 0~255 | 168 |  | TRUE |
| 152 | Ethernet IP 3(0~255) | num | 0~255 | 0 |  | TRUE |
| 153 | Ethernet IP 4(0~255, 0 means DHCP mode) | num | 0~255, 0 means DHCP mode | 0 |  | TRUE |
| 154 | PC's Ethernet IP 1(0~255, effective only in client mode) | num | 0~255, effective only in client mode | 0 |  | TRUE |
| 155 | PC's Ethernet IP 2(0~255, effective only in client mode) | num | 0~255, effective only in client mode | 0 |  | TRUE |
| 156 | PC's Ethernet IP 3(0~255, effective only in client mode) | num | 0~255, effective only in client mode | 0 |  | TRUE |
| 157 | PC's Ethernet IP 4(0~255, effective only in client mode) | num | 0~255, effective only in client mode | 0 |  | TRUE |
| 158 | Gateway IP 1(0~255) | num | 0~255 | 192 |  | TRUE |
| 159 | Gateway IP 2(0~255) | num | 0~255 | 168 |  | TRUE |
| 160 | Gateway IP 3(0~255) | num | 0~255 | 0 |  | TRUE |
| 161 | Gateway IP 4(0~255) | num | 0~255 | 1 |  | TRUE |
| 162 | Mask IP 1(0~255) | num | 0~255 | 255 |  | TRUE |
| 163 | Mask IP 2(0~255) | num | 0~255 | 255 |  | TRUE |
| 164 | Mask IP 3(0~255) | num | 0~255 | 255 |  | TRUE |
| 165 | Mask IP 4(0~255) | num | 0~255 | 0 |  | TRUE |
| 166 | Server Mode Socket(0~65535) | num | 0~65535 | 33581 |  | TRUE |
| 167 | Client Mode Socket(0~65535) | num | 0~65535 | 33582 |  | TRUE |
| 168 | UDP Listen Socket(0~65535) | num | 0~65535 | 33583 |  | TRUE |
| 169 | UDP Broadcast Socket(0~65535) | num | 0~65535 | 33584 |  | TRUE |
| 170 | Primary DNS 1(0~255) | num | 0~255 | 8 |  | TRUE |
| 171 | Primary DNS 2(0~255) | num | 0~255 | 8 |  | TRUE |
| 172 | Primary DNS 3(0~255) | num | 0~255 | 8 |  | TRUE |
| 173 | Primary DNS 4(0~255) | num | 0~255 | 8 |  | TRUE |
| 430 | Secondary Ethernet IP 1(0~255) | num | 0~255 | 192 |  | TRUE |
| 431 | Secondary Ethernet IP 2(0~255) | num | 0~255 | 168 |  | TRUE |
| 432 | Secondary Ethernet IP 3(0~255) | num | 0~255 | 0 |  | TRUE |
| 433 | Secondary Ethernet IP 4(0~255, 0 means DHCP mode) | num | 0~255, 0 means DHCP mode | 0 |  | TRUE |
| 434 | Secondary Gateway IP 1(0~255) | num | 0~255 | 192 |  | TRUE |
| 435 | Secondary Gateway IP 2(0~255) | num | 0~255 | 168 |  | TRUE |
| 436 | Secondary Gateway IP 3(0~255) | num | 0~255 | 0 |  | TRUE |
| 437 | Secondary Gateway IP 4(0~255) | num | 0~255 | 1 |  | TRUE |
| 438 | Secondary Mask IP 1(0~255) | num | 0~255 | 255 |  | TRUE |
| 439 | Secondary Mask IP 2(0~255) | num | 0~255 | 255 |  | TRUE |
| 440 | Secondary Mask IP 3(0~255) | num | 0~255 | 255 |  | TRUE |
| 441 | Secondary Mask IP 4(0~255) | num | 0~255 | 0 |  | TRUE |
| 271 | Auto Upgrade | enum | 0=Disable; 1=Enable | 1 (Enable) |  | TRUE |
| 320 | Weight Sensor | enum | 0=Inner; 1=RS232 Model | 0 (Inner) |  | TRUE |

### D. Cash / drawer / payment

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 59 | Sale Log Auto Save (0~1; 1 = auto-save sale log to USB disk in Account) [manual p.75] | num |  | 0 |  | - |
| 60 | Cashing Mode | enum | 0=No Cashing Mode; 1=Cashing Mode With Zero Change Default, No Display For Zero Change; 2=Cashing Mode With Zero Change Default, Always Display For Zero Change; 3=Cashing Mode Without Zero Change Default | 1 (Cashing Mode With Zero Change Default, No Display For Zero Change) |  | TRUE |
| 61 | Sale Operation | enum | 0=Not Open Drawer; 1=Open Drawer 1; 2=Open Drawer 2; 3=Open Drawer 1 and 2; 4=Warnning of Forbidden; 5=Four-relay-board interface | 3 (Open Drawer 1 and 2) |  | TRUE |
| 62 | Sale Mode: Press【Drawer】 | enum | 0=Not Open Drawer; 1=Open Drawer 1; 2=Open Drawer 2; 3=Open Drawer 1 and 2; 4=Warnning of Forbidden | 3 (Open Drawer 1 and 2) |  | TRUE |
| 63 | Prog Mode: Press【Drawer】 | enum | 0=Not Open Drawer; 1=Open Drawer 1; 2=Open Drawer 2; 3=Open Drawer 1 and 2 | 3 (Open Drawer 1 and 2) |  | TRUE |
| 64 | Account Mode: Press【Drawer】 | enum | 0=Not Open Drawer; 1=Open Drawer 1; 2=Open Drawer 2; 3=Open Drawer 1 and 2 | 3 (Open Drawer 1 and 2) |  | TRUE |
| 66 | Quit Change Display (0: Push Any Key For Quit; 1~99: Auto Quit For Specified Second) | num | 0: Push Any Key For Quit; 1~99: Auto Quit For Specified Second | 0 |  | TRUE |
| 239 | Open Time of Drawer(ms:0~9999) | num | ms:0~9999 | 100 |  | TRUE |
| 282 | Payment Operation Forbidden(0~63,0 for all enable,+2:Card Forbidden,+4:Other Payment 1 Forbidden,+8:Other Payment 2 Forbidden,+16:Other Payment 3 Forbidden,+32:Store Payments Forbidden) | num | 0~63,0 for all enable,+2:Card Forbidden,+4:Other Payment 1 Forbidden,+8:Other Payment 2 Forbidden,+16:Other Payment 3 Forbidden,+32:Store Payments Forbidden | 0 | SaleOperation | TRUE |
| 297 | Second Currency Exchange | decimal (value = mantissa*8 + dp) |  | 0 |  | TRUE |
| 298 | Second Currency Decimal Dot | enum | 0=0; 1=0.0; 2=0.00; 3=0.000; 4=0.0000; 5=0.00000 | 2 (0.00) |  | TRUE |
| 330 | Card Payment Protocol | num |  | 0 |  | admin |
| 332 | Card Payment Server IP 1(0~255) | num | 0~255 | 0 |  | admin |
| 333 | Card Payment Server IP 2(0~255) | num | 0~255 | 0 |  | admin |
| 334 | Card Payment Server IP 3(0~255) | num | 0~255 | 0 |  | admin |
| 335 | Card Payment Server IP 4(0~255) | num | 0~255 | 0 |  | admin |
| 336 | Card Payment Server Port(0~65535) | num | 0~65535 | 0 |  | admin |

### E. Weighing sale behaviour, tare, zero-return, T-Sale, special modes

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 67 | Number Tare | enum | 0=Forbidden; 1=Input Value Tare; 2=Floating-point Value Tare | 1 (Input Value Tare) |  | TRUE |
| 68 | Tare selection | enum | 0=Manual Tare Only; 1=Manual Tare First; 2=PLU Tare First; 3=PLU Tare Only | 1 (Manual Tare First) |  | TRUE |
| 69 | Zero-Return For Weight Sale | enum | 0=Always Zero-Return; 1=Zero-Return if Weight Changed; 2=No Zero-Return(Print "Ind:" Before Weight, So It is only used by Industry application); 3=Zero-Return for new by-weight PLU; 4=Keep at Zero for new by-weight PLU | 1 (Zero-Return if Weight Changed) | Management | TRUE |
| 70 | Allowed Zero Purchase | enum | 0=Forbidden; 1=Allowed | 0 (Forbidden) |  | TRUE |
| 71 | No Weigh Sale for Weight PLU | enum | 0=Forbidden; 1=Allowed, 1 pc only; 2=Allowed, multi pcs allowed | 0 (Forbidden) |  | TRUE |
| 72 | Clear Sale Buffer if Press【Sale】 | enum | 0=Not Clear; 1=Clear | 0 (Not Clear) |  | TRUE |
| 73 | Think【T-Sale】As【U.Price Convert】 | enum | 0=Forbidden; 1=Allowed | 0 (Forbidden) |  | TRUE |
| 74 | Buy Back(0~31, 0 for disable all, +1 for exist log buy back, +2 for new input buy back, +4 for mix allowed with sale, +8 for amount swith, +16 for price swith) | num | 0~31, 0 for disable all, +1 for exist log buy back, +2 for new input buy back, +4 for mix allowed with sale, +8 for amount swith, +16 for price swith | 0 | SaleOperation | TRUE |
| 75 | PLU forbidden | enum | 0=No forbidden; 1=Weight PLU forbidden; 2=Count PLU forbidden; 3=All PLU forbidden | 0 (No forbidden) |  | TRUE |
| 76 | T-Sale PLU forbidden | enum | 0=No forbidden; 1=T-Sale Weight PLU forbidden; 2=T-Sale Count PLU forbidden; 3=All T-Sale PLU forbidden | 0 (No forbidden) |  | TRUE |
| 77 | Manual Weight Entry | enum | 0=No manual weight entry; 1=Manual weight entries enable and batch print in auto mode; 2=Manual weight entries enable and prepack in auto mode; 3=Manual weight entries enable but not in auto mode | 0 (No manual weight entry) |  | TRUE |
| 78 | 【Auto mode】Get into Special Sale Mode | enum | 0=Auto mode forbidden; 1=Swith to batch print mode; 2=Swith to prepack print mode; 3=Swith to lock PLU mode; 4=Swith to auto print mode | 2 (Swith to prepack print mode) |  | TRUE |
| 79 | Sale mode select | enum | 0=Forbid; 1=Allow | 1 (Allow) |  | TRUE |
| 85 | Stable Waiting: Set Zero(0~99, Each 10 for 1 Second) | num | 0~99, Each 10 for 1 Second | 20 |  | TRUE |
| 86 | Stable Waiting: Sale(0~99, Each 10 for 1 Second) | num | 0~99, Each 10 for 1 Second | 20 |  | TRUE |
| 131 | Auto Print/Accumulate after Zero-return | enum | 0=Not enable; 1=Auto Accumulate after Zero-return; 2=Forced Auto Accumulate after Zero-return; 3=Auto Print after Zero-return; 4=Forced Auto Print after Zero-return; 5=Auto Accumulate and Print after Zero-return; 6=Forced Auto Accumulate and Print after Zero-return | 0 (Not enable) | SaleOperation | TRUE |
| 214 | Default Measure Sort | enum | 0=By-Weight Mode; 1=By-Count Mode | 0 (By-Weight Mode) |  | TRUE |
| 226 | Tare can Overrun First Range of Weight | enum | 0=Forbidden; 1=Allowed | 0 (Forbidden) |  | TRUE |
| 227 | Tare Update | enum | 0=Allow add only; 1=Forbidden; 2=Allowed | 1 (Forbidden) |  | TRUE |
| 228 | Price Convert betweent Different Weight Unit | enum | 0=Allowed; 1=Only Default Weight Allowed; 2=Forbidden | 0 (Allowed) |  | TRUE |
| 229 | Weight Switch | enum | 0=Not Allowed; 1=Long Press to Switch; 2=Single Press to Switch | 1 (Long Press to Switch) |  | TRUE |
| 231 | Zero forbidden in PLU Mode | enum | 0=Allowed; 1=Forbidden | 0 (Allowed) |  | TRUE |
| 233 | Zero back is necessary for fast weight unit switch | enum | 0=No need; 1=Need | 0 (No need) |  | TRUE |
| 234 | Degrees of Zero back(0~31) | num | 0~31 | 0 |  | TRUE |
| 250 | Accumulation Mode | enum | 0=Normal Accu Mode; 1=【Accu】is Doing Same Operation as【Print】; 2=Can only accumulate 1 time | 0 (Normal Accu Mode) | OperationMode (+PT_1/2/3 choose label id) | TRUE |
| 259 | Mode Auto Quit(0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print) | num | 0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print | 0 |  | TRUE |
| 261 | By-Weight PLU Forbidden in Certain Mode(0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print) | num | 0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print | 0 |  | TRUE |
| 262 | By-Count PLU Forbidden in Certain Mode(0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print) | num | 0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print | 0 |  | TRUE |
| 264 | Special mode is recording as Auto Mode(0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print) | num | 0~15: +1: Batch Print, +2:PrePack, +4:Lock PLU, +8:Auto Print | 0 |  | TRUE |
| 268 | Auto Tare Lock | enum | 0=Default; 1=Auto Lock | 0 (Default) |  | TRUE |
| 270 | Weight Display Hidden | enum | 0=Default; 1=When No PLU; 2=When No Price | 0 (Default) |  | TRUE |
| 277 | Default Working Mode | enum | 0=Normal; 1=Batch Print; 2=PrePack; 3=Lock PLU; 4=Auto Print | 0 (Normal) |  | TRUE |
| 283 | Record of Unconfirmed Data | enum | 0=Disable; 1=Record Priced Operation; 2=Record Priced/Weighted Operation | 1 (Record Priced Operation) | Management | TRUE |

### F. Fast-programming, dummy PLU, PLU call

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 80 | PLU Fast-Prog | enum | 0=Forbidden; 1=Allowed with authentication; 2=Allowed | 1 (Allowed with authentication) |  | TRUE |
| 81 | ScPLU Fast-Prog | enum | 0=Forbidden; 1=Allowed | 1 (Allowed) |  | TRUE |
| 82 | Spec Fast-Prog | enum | 0=Forbidden; 1=Allowed with authentication; 2=Allowed | 1 (Allowed with authentication) |  | TRUE |
| 83 | Fast-Pro of PLU Price | enum | 0=Forbidden; 1=Long Push【@Price】(or【-@】)to Modify PLU Price; 2=Push【@Price】(or【-@】)to Modify PLU Price; 3=Push【@Price】(or【-@】)to Modify PLU Price, and Long Push to Modify PLU Name; 4=Modify PLU Price automatically after confirm. | 1 (Long Push【@Price】(or【-@】)to Modify PLU Price) | SaleOperation | TRUE |
| 87 | Dummy PLU | enum | 0=Disable; 1=Enable | 0 (Disable) |  | TRUE |
| 88 | Dummy PLU Shortcut(0=Disable,Other=PLU in 1st Shortcut,firmware>V2.50E) | num | 0=Disable,Other=PLU in 1st Shortcut,firmware>V2.50E | 0 |  | TRUE |
| 89 | Step-skip of PLU Fast-Prog Equal to PLU Prog(P32 Equal to P31) | enum | 0=Disable; 1=Enable | 1 (Enable) |  | TRUE |
| 90 | Account Calculating Background | enum | 0=Forbidden; 1=Allowed | 1 (Allowed) |  | TRUE |
| 91 | Account Function | enum | 0=Enable; 1=Enable Log only, no report; 2=Disable | 0 (Enable) |  | TRUE |
| 92 | Dummy Number | enum | 0=Disable; 1=PLU Dummy; 2=Salesman Dummy; 3=PLU and Salesman Dummy | 1 (PLU Dummy) |  | TRUE |
| 93 | Dummy PLU number for temporary by-weight PLU (manual default 9999999) [manual p.77] | num |  | 0 |  | - |
| 94 | Dummy PLU number for temporary by-count PLU (manual default 9999998) [manual p.77] | num |  | 0 |  | - |
| 95 | Dummy PLU number for Service Charge PLU (manual default 9999997) [manual p.77] | num |  | 0 |  | - |
| 96 | E-Log Function | enum | 0=Enable; 1=Enable without upload; 2=Disable | 0 (Enable) |  | FALSE |
| 97 | Barcode Index function by Key Input | enum | 0=Forbidden; 1=Number Index Only; 2=Number and Character | 1 (Number Index Only) |  | TRUE |
| 149 | Pickup Single-Key from Multi-Key | enum | 0=Forbidden; 1=Enable for Number-Key only; 2=Enable for all function keys(Keys except shortcut-key); 3=Enable for all | 1 (Enable for Number-Key only) |  | TRUE |
| 249 | PLU Storage Mode(PLU Text Length≈Total Length-150) | enum | 0=System default mode; 1=256 Bytes Mode; 2=512 Bytes Mode; 3=1024 Bytes Mode; 4=2048 Bytes Mode | 0 (System default mode) |  | TRUE |
| 253 | Call PLU by "ItemCode" when Press 【PLU】 | enum | 0=Based on PLU number; 1=Based on PLU ItemCode | 0 (Based on PLU number) |  | TRUE |
| 254 | Auto【PLU】Function | enum | 0=Disable; 1=Enable in idle mode; 2=Enable in PLU mode; 3=Enable in all mode | 0 (Disable) |  | TRUE |
| 255 | How Auto【PLU】Work | enum | 0=Disable; 1=1 digit PLU; 2=2 digits PLU; 3=3 digits PLU; 4=4 digits PLU; 5=5 digits PLU; 6=6 digits PLU; 7=7 digits PLU; 8=All PLU immediately; 9=All PLU 1 second delay; 10=All PLU 2 second delay; 11=All PLU 3 second delay | 0 (Disable) |  | TRUE |
| 263 | Call PLU in Idle Mode(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 274 | Maximum PLU Number(0~9999999) | num | 0~9999999 | 9999990 |  | TRUE |

### G. Rounding, discount, tax, service fee, VIP

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 98 | Single Item Sale: Report Account Method of Discount And Rounding | enum | 0=Not Record; 1=Independent Record Discount, No Rounding; 2=Separate Record Discount, No Rounding; 3=Independent Record Discount and Rounding; 4=Independent Record Discount, Separate Record Rounding; 5=Separate Record Discount and Rounding | 3 (Independent Record Discount and Rounding) |  | TRUE |
| 99 | Multi Item Sale: Report Account Method of Discount And Rounding | enum | 0=Not Record; 1=Independent Record Discount, No Rounding; 2=Separate Record Discount, No Rounding; 3=Independent Record Discount and Rounding; 4=Independent Record Discount, Separate Record Rounding; 5=Separate Record Discount and Rounding | 3 (Independent Record Discount and Rounding) |  | TRUE |
| 100 | Rounding Method for Single Total | enum | 0=Common Rounding For Redundancy Digit; 1=Common Rounding For Last Digit; 2=Common Rounding For Last 2 Digits; 3=Banker's Rounding For Redundancy Digit; 4=Banker's Rounding For Last Digit; 5=Banker's Rounding For Last 2 Digits; 6=Rounding Down For Redundancy Digit; 7=Rounding Down For Last Digit; 8=:Rounding Down For Last 2 Digits; 9=Rounding to 0/5 For Last Digit; 10=Rounding to 0/5 For Last 2 Digits; 11=Rounding to 0/5 For Last 3 Digits | 0 (Common Rounding For Redundancy Digit) | Unit (UnitAndDisplay) | TRUE |
| 101 | Rounding Method for Sum Total | enum | 0=Common Rounding For Redundancy Digit; 1=Common Rounding For Last Digit; 2=Common Rounding For Last 2 Digits; 3=Banker's Rounding For Redundancy Digit; 4=Banker's Rounding For Last Digit; 5=Banker's Rounding For Last 2 Digits; 6=Rounding Down For Redundancy Digit; 7=Rounding Down For Last Digit; 8=Rounding Down For Last 2 Digits; 9=Rounding to 0/5 For Last Digit; 10=Rounding to 0/5 For Last 2 Digits; 11=Rounding to 0/5 For Last 3 Digits | 0 (Common Rounding For Redundancy Digit) | Unit (UnitAndDisplay) | TRUE |
| 102 | Print with Accumulated Data | enum | 0=Enable; 1=Disable | 0 (Enable) |  | TRUE |
| 103 | Equal Reparation of Tare,Net and Gross | enum | 0=No Reparation, rounding independently; 1=Tare=Gross-Net; 2=Net=Gross-Tare; 3=Gross=Net+Tare | 3 (Gross=Net+Tare) |  | TRUE |
| 107 | Number of Sale Buffers(0~,0 means default) | num | 0~,0 means default | 0 |  | TRUE |
| 108 | Number of Maximum Accumulate(0~65535,0 means default) | num | 0~65535,0 means default | 0 |  | TRUE |
| 109 | Divide Operation of PLU Price | enum | 0=Normal Operation; 1=Divide Operation | 0 (Normal Operation) |  | TRUE |
| 110 | Manual Discount: Forbidden | enum | 0=All Allowed; 1=Forbidden U.Price Discount; 2=Forbidden T.Price Discount; 3=Forbidden All Discount | 0 (All Allowed) | Management | TRUE |
| 111 | Manual Discount: Lower Limit(0~255, Percent) | num | 0~255, Percent | 0 |  | TRUE |
| 112 | Manual Discount: Upper Limit(0~255, Percent) | num | 0~255, Percent | 0 |  | TRUE |
| 113 | Percent Discount Arithmetic | enum | 0=Subtract Percent; 1=Add Percent; 2=To Percent | 0 (Subtract Percent) |  | TRUE |
| 114 | Auto Percent Discount Rate(0: No Automatic, 1~99: Automatic Rate) | num | 0: No Automatic, 1~99: Automatic Rate | 0 |  | TRUE |
| 115 | Auto Discount: Price Lock | enum | 0=No Auto Discount; 1=Price Lock if Auto Discount Is Effective; 2=Price Lock If Auto Discount Is Setting; 3=Price Lock for All PLU | 1 (Price Lock if Auto Discount Is Effective) |  | TRUE |
| 116 | Global Tax Sort | enum | 0=No Global Tax Sort; 1=Tax Excluded Mode; 2=Tax Excluded Mode,PLU's Price is aftertax; 3=Tax Include Mode | 0 (No Global Tax Sort) |  | TRUE |
| 117 | Global Tax Rate(One per ten thousand ‱,0~9999) | num | One per ten thousand ‱,0~9999 | 0 |  | TRUE |
| 251 | Discount Menu of Unit Price | enum | 0=Disable discount menu; 1=nable, default mode is based on【Key】; 2=Enable, default mode is PERCENT mode; 3=Enable, default mode is MINUS mode; 4=Enable, default mode is FIX mode | 0 (Disable discount menu) |  | TRUE |
| 252 | Discount Menu of Total Price | enum | 0=Disable discount menu; 1=nable, default mode is based on【Key】; 2=Enable, default mode is PERCENT mode; 3=Enable, default mode is MINUS mode; 4=Enable, default mode is FIX mode | 0 (Disable discount menu) |  | TRUE |
| 287 | non-VIP Discount Percent Off(0~99) | num | 0~99 | 0 |  | TRUE |
| 288 | VIP Default Discount Percent Off(0~99,0 means same as Spec287) | num | 0~99,0 means same as Spec287 | 0 |  | TRUE |
| 300 | Item Service Fee | enum | 0=Forbidden; 1=Allowed, not collect total percent again; 2=Allowed, collect total percent again | 0 (Forbidden) |  | TRUE |
| 301 | Item Service Fee: Default Method | enum | 0=Unit Price Mode; 1=Total Price Mode; 2=Percent Mode | 0 (Unit Price Mode) |  | TRUE |
| 302 | Total Service Fee: Input Method | enum | 0=Manually Call, Price Input; 1=Manually Call, Percent Input; 2=Manually Call, Auto Price; 3=Manually Call, Auto Percent; 4=Auto Call, Auto Price; 5=Auto Call, Auto Percent | 0 (Manually Call, Price Input) |  | TRUE |
| 303 | Total Service Fee: Auto collect based number(‱ or price number) | num | ‱ or price number | 0 |  | TRUE |
| 304 | Service Fee: Percent Collection based Number | enum | 0=Pre-Tax; 1=After-Tax | 0 (Pre-Tax) |  | TRUE |
| 305 | Tax Sort of Service Fee | enum | 0=No Service Fee Tax Sort; 1=Tax Excluded Mode; 2=Tax Excluded Mode,PLU's Price is aftertax; 3=Tax Include Mode | 0 (No Service Fee Tax Sort) |  | TRUE |
| 306 | Tax Rate of Service Fee(One per ten thousand ‱,0~9999) | num | One per ten thousand ‱,0~9999 | 0 |  | TRUE |
| 307 | Service Fee Permission | enum | 0=Forbidden; 1=Allowed | 1 (Allowed) |  | TRUE |
| 308 | Service Fee Re-Input | enum | 0=Forbidden; 1=Allowed | 1 (Allowed) |  | TRUE |
| 318 | Auto Discount: Start Day(0 means always, format: YYMMDD) | num | 0 means always, format: YYMMDD | 0 |  | TRUE |
| 319 | Auto Discount: Last Day(format: YYMMDD) | num | format: YYMMDD | 0 |  | TRUE |

### H. Date / time / shelf life

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 104 | DateTime Type | enum | 0=YYYY.MM.DD 24H; 1=YY.MM.DD 24H; 2=MM/DD/YY 24H; 3=MM-DD-YY 24H; 4=DD/MM/YY 24H; 5=DD-MM-YY 24H; 6=Persian Calendar(-2) 24H; 7=Persian Calendar(-1) 24H; 8=Persian Calendar 24H; 9=Persian Calendar(+1) 24H; 10=Persian Calendar(+2) 24H; 100=YYYY.MM.DD 12H; 101=YY.MM.DD 12H; 102=MM/DD/YY 12H; 103=MM-DD-YY 12H; 104=DD/MM/YY 12H; 105=DD-MM-YY 12H; 106=Persian Calendar(-2) 12H; 107=Persian Calendar(-1) 12H; 108=Persian Calendar 12H; 109=Persian Calendar(+1) 12H; 110=Persian Calendar(+2) 12H | 0 (YYYY.MM.DD 24H) |  | TRUE |
| 105 | Shelf Day Print | enum | 0=Using PLU setting(Due date mode); 1=Shelf Printing based-on Spec106 if PLU Do not set Shelf Day(Due date mode); 2=Shelf Printing based-on Spec106(Due date mode); 3=Not Print Shelf; 4=Using PLU setting(Days mode); 5=Shelf Printing based-on Spec106 if PLU Do not set Shelf Day(Days mode); 6=Shelf Printing based-on Spec106(Days mode) | 0 (Using PLU setting(Due date mode)) |  | TRUE |
| 106 | Shelf Days(0~999) | num | 0~999 | 0 |  | TRUE |
| 140 | SID Auto Clear | enum | 0=No Clear; 1=Half Day(12:00和0:00); 2=Daily; 3=Each Sunday; 4=Each Monday; 5=Monthly; 6=Quarterly | 2 (Daily) |  | TRUE |
| 265 | Date Print Mode:Month | enum | 0=Digits; 1=Two Characters | 0 (Digits) |  | TRUE |
| 266 | Date Display Mode | enum | 0=Default; 1=Using Spec104 and 265 | 0 (Default) |  | TRUE |

### I. Accumulation, amend, scanner, internal barcode, salesman

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 118 | Amend Mode in Sale | enum | 0=Manual Operation (Not Record); 1=Clear All (Record); 2=Clear All (Not Record); 3=Manual Operation (Record) | 3 (Manual Operation (Record)) | Management | TRUE |
| 119 | Scanner checkout | enum | 0=Not checkout, ignore redundant information; 1=Checkout, ignore redundant information; 2=Checkout, not ignore redundant information | 2 (Checkout, not ignore redundant information) |  | TRUE |
| 120 | Scanned Barcode | enum | 0=Do nothing; 1=Deal with External Barcode(Index mode); 2=Deal with Internal Barcode(ItemCode mode); 3=Deal with all mode | 3 (Deal with all mode) |  | TRUE |
| 121 | Deal method with ItemCode=0 | enum | 0=Search User PLU; 1=Deal with By-Weight T-Sale PLU; 2=Deal with By-Count T-Sale PLU | 1 (Deal with By-Weight T-Sale PLU) |  | TRUE |
| 122 | Internal Barcode 1: Format Number(0~99) | num | 0~99 | 0 |  | TRUE |
| 123 | Internal Barcode 1: Flag Number(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 124 | Internal Barcode 2: Format Number(0~99) | num | 0~99 | 0 |  | TRUE |
| 125 | Internal Barcode 2: Flag Number(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 126 | Internal Barcode 3: Format Number(0~99) | num | 0~99 | 0 |  | TRUE |
| 127 | Internal Barcode 3: Flag Number(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 128 | Internal Barcode 4: Format Number(0~99) | num | 0~99 | 0 |  | TRUE |
| 129 | Internal Barcode 4: Flag Number(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 130 | Total Price Masked before Printing | enum | 0=Not enable; 1=Enable | 0 (Not enable) |  | TRUE |
| 132 | Accu Mode: Transferring PLU by Key Input | enum | 0=Disable; 1=Enable | 0 (Disable) |  | TRUE |
| 133 | Accu Mode: Transferring PLU by External Barcode | enum | 0=Disable; 1=Enable | 2 ((value not in option list)) |  | TRUE |
| 134 | Accu Mode: Transferring PLU by Internal Barcode | enum | 0=Disable; 1=Enable | 2 ((value not in option list)) |  | TRUE |
| 135 | Salesman Login | enum | 0=Disable, Save with Salesman=0; 1=Disable, Save with Salesman=1~4 in V1~V4; 2=Enable, V1~V4 Controlled by Same Salesman; 3=Enable, V1~V4 Controlled by Different Salesman; 4=Enable, V1~V4 Controlled by Same Salesman, Pass=0 Salsman Cannot login; 5=Enable, V1~V4 Controlled by Different Salesman, Pass=0 Salsman Cannot login; 6=Enable, Logout while V1~V4 switch, Pass=0 Salsman Cannot login | 0 (Disable, Save with Salesman=0) |  | TRUE |
| 136 | Waiter Mode | enum | 0=Disable; 1=Enable, forbidden dummy personnel; 2=Enable, allowed dummy personnel | 0 (Disable) |  | TRUE |
| 137 | Waiter Memory Mode | enum | 0=Always clear; 1=Memory last one; 2=Memory in buffer | 0 (Always clear) |  | TRUE |
| 138 | Right of Default Salesman / "Admin in charge" bitmask (0~65535). Written ONLY by the wizard (Management page). Bits: 1 Re-print, 2 Pre-print, 4 By-weight T-Sale, 8 By-count T-Sale, 16 PLU quit, 32 Amend, 64 Hang-up bill, 128 Load-back bill, 256 F-Prog of price, 512 Buy-back/Other transactions, 1024 Drawer, 2048 Illegal reboot (set bit = needs Admin password) [WizardForm.cs:1686, 6567; manual p.80] | num |  | 0 | Management | - |
| 139 | EAN/UCC CRC | enum | 0=Standard; 1=Non-standard | 0 (Standard) | Barcode | TRUE |
| 141 | Stock Report | enum | 0=Disable(A44 Report Enable); 1=Enable(A44 Report Disable) | 1 (Enable(A44 Report Disable)) |  | TRUE |
| 142 | Unit Mode of Stock Amend | enum | 0=Only PLU's Unit Allowed; 1=Default By-Weight Unit and By-Count Unit Allowed; 2=All System Unit Allowed | 1 (Default By-Weight Unit and By-Count Unit Allowed) |  | TRUE |
| 143 | FID/SID Print Mode(0:Print as number; 1~9:Print in specified length with ’#’) | num | 0:Print as number; 1~9:Print in specified length with ’#’ | 6 |  | TRUE |
| 144 | Each item has identify FID (0 forbidden / 1 enable) [manual p.80] | num |  | 0 |  | - |
| 145 | Print extra info in report bitmask (+1 picture 1, +2 global text 0, +4 global text 1 ...) [manual p.80] | num |  | 0 |  | - |
| 279 | Hangup and Loadback | enum | 0=Forbidden; 1=Only hangup bill can be load once; 2=Only hangup bill can be load, no times limit; 3=All bill can be load | 0 (Forbidden) | SaleOperation | TRUE |
| 280 | Salesman authorization | enum | 0=Forbidden; 1=Enable | 0 (Forbidden) |  | TRUE |
| 290 | Log Text 1 | enum | 0=Disable; 1=PLU Name; 2=Text 1; 3=Text 2; 4=Text 3; 5=Text 4; 6=Text 5; 7=Text 6; 8=Text 7; 9=Item Code; 10=Barcode Index; 11=Custom Info 1; 12=Custom Info 2; 13=Custom Info 3; 14=Custom Info 4; 15=Card Number in Card Payment | 0 (Disable) |  | TRUE |
| 291 | Log Text 2 | enum | 0=Disable; 1=PLU Name; 2=Text 1; 3=Text 2; 4=Text 3; 5=Text 4; 6=Text 5; 7=Text 6; 8=Text 7; 9=Item Code; 10=Barcode Index; 11=Custom Info 1; 12=Custom Info 2; 13=Custom Info 3; 14=Custom Info 4; 15=Card Number in Card Payment | 0 (Disable) |  | TRUE |
| 292 | Log Text 3 | enum | 0=Disable; 1=PLU Name; 2=Text 1; 3=Text 2; 4=Text 3; 5=Text 4; 6=Text 5; 7=Text 6; 8=Text 7; 9=Item Code; 10=Barcode Index; 11=Custom Info 1; 12=Custom Info 2; 13=Custom Info 3; 14=Custom Info 4; 15=Card Number in Card Payment | 0 (Disable) |  | TRUE |
| 293 | Log Text 4 | enum | 0=Disable; 1=PLU Name; 2=Text 1; 3=Text 2; 4=Text 3; 5=Text 4; 6=Text 5; 7=Text 6; 8=Text 7; 9=Item Code; 10=Barcode Index; 11=Custom Info 1; 12=Custom Info 2; 13=Custom Info 3; 14=Custom Info 4; 15=Card Number in Card Payment | 0 (Disable) |  | TRUE |
| 294 | Keep Custom Info | enum | 0=Disable; 1=Keep Custom Info 1; 2=Keep Custom Info 2; 3=Keep Custom Info 1&2; 4=Keep Custom Info 3; 5=Keep Custom Info 1&3; 6=Keep Custom Info 2&3; 7=Keep Custom Info 1&2&3; 8=Keep Custom Info 4; 9=Keep Custom Info 1&4; 10=Keep Custom Info 2&4; 11=Keep Custom Info 1&2&4; 12=Keep Custom Info 3&4; 13=Keep Custom Info 1&3&4; 14=Keep Custom Info 2&3&4; 15=Keep Custom Info 1&2&3&4 | 0 (Disable) |  | TRUE |
| 295 | Custom Info Call as PLU | enum | 0=Disable; 1=Custom Info 1 Call as PLU; 2=Custom Info 2 Call as PLU; 3=Custom Info 1&2 Call as PLU; 4=Custom Info 3 Call as PLU; 5=Custom Info 1&3 Call as PLU; 6=Custom Info 2&3 Call as PLU; 7=Custom Info 1&2&3 Call as PLU; 8=Custom Info 4 Call as PLU; 9=Custom Info 1&4 Call as PLU; 10=Custom Info 2&4 Call as PLU; 11=Custom Info 1&2&4 Call as PLU; 12=Custom Info 3&4 Call as PLU; 13=Custom Info 1&3&4 Call as PLU; 14=Custom Info 2&3&4 Call as PLU; 15=Custom Info 1&2&3&4 Call as PLU | 0 (Disable) |  | TRUE |

### J. Number format, money units, price/weight decimals, units

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 180 | Display and Printing of Decimal Point | enum | 0=Dot; 1=Comma | 0 (Dot) |  | TRUE |
| 181 | Printing of Kilocharacter | enum | 0=No printing; 1=Dot; 2=Comma; 3=Quotation Mark | 0 (No printing) |  | TRUE |
| 182 | Display of Kilocharacter | enum | 0=Not display; 1=Display based on Spec181 | 0 (Not display) |  | FALSE |
| 185 | Unit Printing of Weight | enum | 0=No printing; 1=Printing | 0 (No printing) | Unit (UnitAndDisplay) | TRUE |
| 186 | Unit Printing of Unit Price | enum | 0=No printing; 1=Printing | 0 (No printing) | Unit (UnitAndDisplay) | TRUE |
| 187 | Unit Printing of Money | enum | 0=No printing; 1=Printing | 0 (No printing) | Unit (UnitAndDisplay) | TRUE |
| 188 | Unit Price Length(0:Automatic, 1~7) | num | 0:Automatic, 1~7 | 6 |  | TRUE |
| 189 | Total Price Length(0:Automatic, 1~7) | num | 0:Automatic, 1~7 | 7 |  | TRUE |
| 196 | Decimal Point of Count In Barcode Print(0~5) | num | 0~5 | 3 | Barcode | TRUE |
| 200 | Decimal Point: Tare(0~3) | enum | 0=0; 1=0.0; 2=0.00; 3=0.000 | 3 (0.000) |  | TRUE |
| 201 | Decimal Point: Weight(0~3) | enum | 0=0; 1=0.0; 2=0.00; 3=0.000 | 3 (0.000) |  | TRUE |
| 202 | Decimal Point: U.Price(0~5) | enum | 0=0; 1=0.0; 2=0.00; 3=0.000; 4=0.0000; 5=0.00000 | 2 (0.00) | Unit (UnitAndDisplay) | TRUE |
| 203 | Decimal Point: T.Price(0~5) | enum | 0=0; 1=0.0; 2=0.00; 3=0.000; 4=0.0000; 5=0.00000 | 2 (0.00) | Unit (UnitAndDisplay) | TRUE |
| 204 | Decimal Point Fix: Tare | enum | 0=No Fix; 1=Fix | 0 (No Fix) |  | TRUE |
| 205 | Decimal Point Fix: Weight | enum | 0=No Fix; 1=Fix | 0 (No Fix) |  | TRUE |
| 206 | Decimal Point Fix: U.Price | enum | 0=No Fix; 1=Fix for Discount; 2=Fix for PLU Call Out; 3=Always Fix | 3 (Always Fix) |  | TRUE |
| 207 | Decimal Point Fix: T.Price | enum | 0=No Fix; 1=Fix based on Spec100; 2=Common rounding before fix based on Spec100 | 1 (Fix based on Spec100) |  | TRUE |
| 208 | Decimal Point of Weight In Barcode Print(0~5) | num | 0~5 | 3 | Barcode | TRUE |
| 209 | Decimal Point of Money In Barcode Print(0~5) | num | 0~5 | 2 | Barcode | TRUE |
| 210 | T-Sale Unit | enum | 0=System Default; 3=Kg Unit; 4=g unit; 5=ton Unit; 6=lb Unit; 7=500g Unit; 8=100g Unit | 0 (System Default) |  | TRUE |
| 211 | System U.Price Unit | enum | 0=System Default; 3=Kg Unit; 4=g unit; 5=ton Unit; 6=lb Unit; 7=500g Unit; 8=100g Unit | 0 (System Default) |  | TRUE |
| 212 | System Weight Unit | enum | 0=System Default; 3=Kg Unit; 4=g unit; 5=ton Unit; 6=lb Unit; 7=500g Unit; 8=100g Unit | 3 (Kg Unit) |  | TRUE |
| 213 | Weight Precision | enum | 0=Precision 0; 1=Precision 1; 2=Precision 2; 3=Precision 3 | 1 (Precision 1) |  | TRUE |
| 232 | Floating-point of weight | enum | 0=Always based on low capability; 1=Based on current capability, low is priority; 2=Based on current capability, high is priority | 0 (Always based on low capability) |  | TRUE |
| 267 | Fast Switch with Weight Unit | enum | 0=Default; 1=Forbidden Non-Standard | 0 (Default) |  | TRUE |
| 275 | Uniscribe Script | enum | 0=Disable; 1=RTL in LTR(Suggest); 2=LTR in RTL | 1 (RTL in LTR(Suggest)) |  | TRUE |
| 285 | Number | enum | 0=English Number; 1=Arabic Number; 2=Persian Number | 0 (English Number) |  | TRUE |

### K. 5-window scale / LCD display

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 190 | 5-Windows Scale: PLU Information Display | enum | 0=Auto Fix; 1=Font 1 Display; 2=Font 0 Display; 3=2-Line Mode | 0 (Auto Fix) | W5th (5-window display) | TRUE |
| 191 | 5-Windows Scale: AD-Message display | enum | 0=Auto Fix; 1=Font 1 Display; 2=Font 0 Display; 3=2-Line Mode | 1 (Font 1 Display) | W5th (5-window display) | TRUE |
| 192 | 5-Windows Scale: Display in Idle Mode | enum | 0=Display Time; 1=Reserved; 2=Reserved; 3=Reserved; 4=Store Name; 5=Device Name; 6=Prefix of Money Unit; 7=Suffix of Money Unit; 8=Device Postil 1; 9=Device Postil 2; 10=Device Postil 3; 11=Device Postil 4; 12=Device Postil 5; 13=Device Postil 6; 14=Device Postil 7; 15=Device Postil 8; 16=Reserved 1; 17=Reserved 2; 18=Industry Mark; 19=Wireless SSID; 20=Wireless Password; 21=Reserved 6; 22=Reserved 7; 23=Server's Domain Name; 24=Custom Text 1; 25=Custom Text 2; 26=Custom Text 3; 27=Custom Text 4; 28=Custom Text 5; 29=Custom Text 6; 30=Custom Text 7; 31=Custom Text 8 | 0 (Display Time) | W5th (5-window display) | TRUE |
| 193 | 5-Windows Scale: Source of Display in Idle mode | enum | 0=Display Accumulation Information(Display Total Pcs); 1=Display AD-Message; 2=Display Accumulation Information(Display Accumulated Times) | 0 (Display Accumulation Information(Display Total Pcs)) | W5th (5-window display) | TRUE |
| 194 | 5-Windows Scale: Source of PLU Information 1 | enum | 0=PLU Name; 1=Text 1; 2=Text 2; 3=Text 3; 4=Text 4; 5=Text 5; 6=Text 6; 7=Text 7 | 0 (PLU Name) | W5th (5-window display) | TRUE |
| 195 | 5-Windows Scale: Source of PLU Information 2 | enum | 0=PLU Name; 1=Text 1; 2=Text 2; 3=Text 3; 4=Text 4; 5=Text 5; 6=Text 6; 7=Text 7 | 1 (Text 1) | W5th (5-window display) | TRUE |
| 230 | Interval of Weight Display(0~7) | num | 0~7 | 1 |  | TRUE |
| 281 | Pause Menu | enum | 0=Disable; 1=Enable; 2=Enable - Reserved; 3=Enable - Reserved; 4=Enable - Display Store Name; 5=Enable - Display Device Name; 6=Enable - Display Prefix of Money Unit; 7=Enable - Display Suffix of Money Unit; 8=Enable - Display Device Postil 1; 9=Enable - Display Device Postil 2; 10=Enable - Display Device Postil 3; 11=Enable - Display Device Postil 4; 12=Enable - Display Device Postil 5; 13=Enable - Display Device Postil 6; 14=Enable - Display Device Postil 7; 15=Enable - Display Device Postil 8; 16=Enable - Display Reserved 1; 17=Enable - Display Reserved 2; 18=Enable - Display Industry Mark; 19=Enable - Display Wireless SSID; 20=Enable - Display Wireless Password; 21=Enable - Display Reserved 6; 22=Enable - Display Reserved 7; 23=Enable - Display Server's Domain Name; 24=Enable - Display Custom Text 1; 25=Enable - Display Custom Text 2; 26=Enable - Display Custom Text 3; 27=Enable - Display Custom Text 4; 28=Enable - Display Custom Text 5; 29=Enable - Display Custom Text 6; 30=Enable - Display Custom Text 7; 31=Enable - Display Custom Text 8 | 0 (Disable) |  | FALSE |
| 340 | Dot matrix LCD's contrast(0~7) | num | 0~7 | 4 |  | TRUE |
| 341 | Dot matrix LCD's brightness(0~31) | num | 0~31 | 13 |  | TRUE |

### L. Weighing hardware / metrology (mostly hidden)

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 197 | Fast Track of Weighing(0:Default level, 1~4:the bigger, the faster) | num | 0:Default level, 1~4:the bigger, the faster | 0 |  | TRUE |
| 198 | Zero Judgment Delay(0~19) | num | 0~19 | 4 |  | TRUE |
| 199 | Stable Judgment Delay(0~19) | num | 0~19 | 0 |  | TRUE |
| 215 | Hardware Info: Maxium Overflow Degree(0~99) | num | 0~99 | 9 |  | TRUE |
| 216 | Hardware Info: Maximum Underflow Degree(0~99) | num | 0~99 | 9 |  | TRUE |
| 217 | Hardware Info: Minimum Sale Degree(0~99) | num | 0~99 | 4 |  | TRUE |
| 218 | Hardware Info: Zero Tracking Degree(0~99) | num | 0~99 | 0 |  | FALSE |
| 219 | Hardware Info: Tare Range(0~99, No Limit if Specified Number is 0) | num | 0~99, No Limit if Specified Number is 0 | 0 |  | FALSE |
| 220 | Hardware Info: Range of the Initial Zero(0~99, Percentage Number, No Limit if Specified Number is 0) | num | 0~99, Percentage Number, No Limit if Specified Number is 0 | 18 |  | FALSE |
| 221 | Hardware Info: Range of the Single Manual Zero(0~99, Percentage Number, No Limit if Specified Number is 0) | num | 0~99, Percentage Number, No Limit if Specified Number is 0 | 2 |  | FALSE |
| 222 | Hardware Info: Range of the Accumulative Manual Zero(0~99, Percentage Number, No Limit if Specified Number is 0) | num | 0~99, Percentage Number, No Limit if Specified Number is 0 | 2 |  | FALSE |
| 223 | Hardware Info: Zero Flag Range(0~99, Percentage Number, No Limit if Specified Number is 0) | num | 0~99, Percentage Number, No Limit if Specified Number is 0 | 4 |  | FALSE |
| 224 | Hardware Info: Zero Tracking Range(0~99, Percentage Number, No Limit if Specified Number is 0) | num | 0~99, Percentage Number, No Limit if Specified Number is 0 | 4 |  | FALSE |
| 225 | Hardware Info: Stable Flag Range(0~99, Percent Number, No Limit if Specified Number is 0) | num | 0~99, Percent Number, No Limit if Specified Number is 0 | 5 |  | FALSE |
| 235 | Power Detect Module | enum | 0=Enable; 1=Disable | 0 (Enable) |  | TRUE |
| 237 | Interval of Key Scanner(0~4) | num | 0~4 | 0 |  | FALSE |
| 238 | Anti-shake of Key Scanner(0~4) | num | 0~4 | 0 |  | FALSE |
| 241 | Weight Unit Allowed | enum | 0=Forbidden; 1=Allowed | 0 (Forbidden) |  | FALSE |
| 257 | Temperature compensation | enum | 0=Disable; 1=Zero Offset; 2=Gain Offset; 3=Whole Offset | 3 (Whole Offset) |  | FALSE |
| 272 | Filter Mode | enum | 0=Default; 1=Multi-Average; 2=Suited-Average; 3=Mid-Track; 10=Desktop Scale; 11=Platform Scale; 12=Hanging Scale | 0 (Default) |  | TRUE |
| 299 | Default stable arithmetic 0~3 (0 default, 1 desk, 2 platform, 3 hanging) [manual p.85; superseded by Spec272 values 10/11/12 in Tm.xml] | num |  | 0 |  | - |

### M. Password / security

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 247 | Password Hold Function | enum | 0=Disable; 1=Hold Drawer Password Only; 2=Hold Passwords except Admin; 3=Hold All Passwords | 0 (Disable) |  | TRUE |
| 260 | Need Admin Password In Certain Mode(0~31: +1: Sale, +2:Prog, +4:Account, +8:Drawer, +16:Unit Price) | num | 0~31: +1: Sale, +2:Prog, +4:Account, +8:Drawer, +16:Unit Price | 0 |  | TRUE |

### N. Network printer (PTR)

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 350 | PTR: Item Print Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 351 | PTR: Item Barcode Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 352 | PTR: Item Barcode Flag(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 353 | PTR: Item Print Times(0~99) | num | 0~99 | 1 |  | TRUE |
| 354 | PTR: Item Print Reversed | enum | 0=Normal; 1=Reversed | 0 (Normal) |  | TRUE |
| 355 | PTR: Sum Print Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 356 | PTR: Sum Barcode Format(0~99) | num | 0~99 | 0 |  | TRUE |
| 357 | PTR: Sum Barcode Flag(0~9999999) | num | 0~9999999 | 0 |  | TRUE |
| 358 | PTR: Sum Item Print Times(0~99) | num | 0~99 | 1 |  | TRUE |
| 359 | PTR: Sum Print Reversed | enum | 0=Normal; 1=Reversed | 0 (Normal) |  | TRUE |
| 360 | PTR: Network Print Function | enum | 0=Disable; 1=Enable, wait till printing finished; 2=Enable, wait till printing started; 3=Enable, wait till data sending finished | 1 (Enable, wait till printing finished) |  | TRUE |
| 361 | PTR: Printer Status Clew | enum | 0=No operation; 1=Online/offline clew; 2=Online/offline clew, alarm when there is no rating printing; 3=Online/offline clew, error when there is no rating printing | 1 (Online/offline clew) |  | TRUE |
| 362 | PTR: Rating of PTR number(0~20) | num | 0~20 | 1 |  | TRUE |
| 363 | PTR: Check Interval(0~65535 s) | num | 0~65535 s | 10 |  | TRUE |
| 364 | PTR: 1st IP: 1(0~255) | num | 0~255 | 0 |  | TRUE |
| 365 | PTR: 1st IP: 2(0~255) | num | 0~255 | 0 |  | TRUE |
| 366 | PTR: 1st IP: 3(0~255) | num | 0~255 | 0 |  | TRUE |
| 367 | PTR: 1st IP: 4(0~255) | num | 0~255 | 0 |  | TRUE |
| 368 | PTR: 2nd IP: 1(0~255) | num | 0~255 | 0 |  | TRUE |
| 369 | PTR: 2nd IP: 2(0~255) | num | 0~255 | 0 |  | TRUE |
| 370 | PTR: 2nd IP: 3(0~255) | num | 0~255 | 0 |  | TRUE |
| 371 | PTR: 2nd IP: 4(0~255) | num | 0~255 | 0 |  | TRUE |
| 372 | PTR: 3rd IP: 1(0~255) | num | 0~255 | 0 |  | TRUE |
| 373 | PTR: 3rd IP: 2(0~255) | num | 0~255 | 0 |  | TRUE |
| 374 | PTR: 3rd IP: 3(0~255) | num | 0~255 | 0 |  | TRUE |
| 375 | PTR: 3rd IP: 4(0~255) | num | 0~255 | 0 |  | TRUE |
| 376 | PTR: Server Socket(0~65535) | num | 0~65535 | 33591 |  | TRUE |
| 377 | PTR: Client Socket(0~65535) | num | 0~65535 | 33592 |  | TRUE |
| 378 | PTR: UDP Local Socket(0~65535) | num | 0~65535 | 33593 |  | TRUE |
| 379 | PTR: UDP Remote Socket(0~65535) | num | 0~65535 | 33594 |  | TRUE |
| 400 | PTR: Print Speed Slow Down(0~99) | num | 0~99 | 0 |  | TRUE |
| 401 | PTR: Paper Type | enum | 0=Plain Paper; 1=Gap Paper | 0 (Plain Paper) |  | TRUE |
| 402 | PTR: Gray Level of Gap Paper(0~15) | num | 0~15 | 0 |  | TRUE |
| 403 | PTR: Gray Level of Plain Paper(0~15) | num | 0~15 | 0 |  | TRUE |
| 404 | PTR: Plain Paper: Interval of Each Print(0~99mm) | num | 0~99mm | 0 |  | TRUE |
| 405 | PTR: Plain Paper: Cut-off Position(0~99mm) | num | 0~99mm | 0 |  | TRUE |
| 406 | PTR: Plain Paper: Pre-feed Distance(0~99mm) | num | 0~99mm | 0 |  | TRUE |
| 407 | PTR: Wide of Report Printing(0~99mm) | num | 0~99mm | 0 |  | TRUE |
| 408 | PTR: Default Font(0~9) | num | 0~9 | 0 |  | TRUE |
| 409 | PTR: Heat Protect(0~30s) | num | 0~30s | 0 |  | TRUE |
| 410 | PTR: Feed Sensor Position(0~255) | num | 0~255 | 0 |  | TRUE |
| 411 | PTR: Narrow Bar Dot Number of Barcode(0~9,0 means default) | num | 0~9,0 means default | 0 |  | TRUE |
| 412 | PTR: Wide Bar Dot Number of Barcode(0~19,0 means default) | num | 0~19,0 means default | 0 |  | TRUE |
| 413 | PTR: Font of Barcode readable character(0~2) | num | 0~2 | 0 |  | TRUE |
| 415 | PTR: Auto New Line Mode | enum | 0=Forbidden; 1=Allowed | 0 (Forbidden) |  | TRUE |
| 416 | PTR: ITF25 frame mode | enum | 0=No frame; 1=Up and down frame; 2=Around frame | 1 (Up and down frame) |  | TRUE |
| 417 | PTR: ITF25 frame width(0~31) | num | 0~31 | 8 |  | TRUE |
| 418 | PTR: ITF25 left and right blank width(0~31) | num | 0~31 | 20 |  | TRUE |
| 419 | PTR: Gap Paper: Pre-feed Distance(0~1999, Device is reverse feed if number > 1000) | num | 0~1999, Device is reverse feed if number > 1000 | 0 |  | TRUE |
| 420 | PTR: Ignore PBS Sensor | enum | 0=No Ignore; 1=Ignore | 0 (No Ignore) |  | TRUE |
| 421 | PTR: Ignore PDS Sensor | enum | 0=No Ignore; 1=Ignore | 0 (No Ignore) |  | TRUE |
| 422 | PTR: Ignore PPS Sensor | enum | 0=No Ignore; 1=Ignore | 1 (Ignore) |  | TRUE |

### O. 2D barcode (PDF417 / QR)

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 450 | PDF417: Checksum Level(0~9, 9: System default level) | num | 0~9, 9: System default level | 9 |  | TRUE |
| 451 | PDF417: Columns Number(0~30, 0:Auto sizing) | num | 0~30, 0:Auto sizing | 0 |  | TRUE |
| 452 | PDF417: Rows Number(0~90, 0:Auto sizing) | num | 0~90, 0:Auto sizing | 0 |  | TRUE |
| 453 | PDF417: Bar Width(0~6, 0: Default 3) | num | 0~6, 0: Default 3 | 2 |  | TRUE |
| 454 | PDF417: Bar Height(0~18, 0: Default 6) | num | 0~18, 0: Default 6 | 6 |  | TRUE |
| 455 | QR: Check Level(0~3) | num | 0~3 | 1 |  | TRUE |
| 456 | QR: Version(0~31) | num | 0~31 | 0 | Barcode | TRUE |
| 457 | QR: Bar Size(0~6, 0 Means Default，Default is 3) | num | 0~6, 0 Means Default，Default is 3 | 0 |  | TRUE |

### P. Special-version / undefined

| ID | Name (Tm.xml / manual) | Kind | Allowed values / options | Default (Default.mdb = _ECS.TMS) | Wizard page | Vis |
|---:|---|---|---|---|---|---|
| 480 | Special Version Spec: 0 | num |  | 0 |  | TRUE |
| 481 | Special Version Spec: 1 | num |  | 0 |  | TRUE |
| 482 | Special Version Spec: 2 | num |  | 0 |  | TRUE |
| 483 | Special Version Spec: 3 | num |  | 0 |  | TRUE |
| 484 | Special Version Spec: 4 | num |  | 0 |  | TRUE |
| 485 | Special Version Spec: 5 | num |  | 0 |  | TRUE |
| 486 | Special Version Spec: 6 | num |  | 0 |  | TRUE |
| 487 | Special Version Spec: 7 | num |  | 0 |  | TRUE |
| 488 | Special Version Spec: 8 | num |  | 0 |  | TRUE |
| 489 | Special Version Spec: 9 | num |  | 0 |  | TRUE |
| 490 | Special Version Spec: 10 | num |  | 0 |  | TRUE |
| 491 | Special Version Spec: 11 | num |  | 0 |  | TRUE |
| 492 | Special Version Spec: 12 | num |  | 0 |  | TRUE |
| 493 | Special Version Spec: 13 | num |  | 0 |  | TRUE |
| 494 | Special Version Spec: 14 | num |  | 0 |  | TRUE |
| 495 | Special Version Spec: 15 | num |  | 0 |  | TRUE |
| 496 | Special Version Spec: 16 | num |  | 0 |  | TRUE |
| 497 | Special Version Spec: 17 | num |  | 0 |  | TRUE |
| 498 | Special Version Spec: 18 | num |  | 0 |  | TRUE |
| 499 | (undefined; default 1522729470 = Unix time 2018-04-03 04:24:30 UTC -> probably a factory/config stamp, INFERRED) | num |  | 1522729470 |  | - |
| 243 | (undefined in Tm.xml and manual; default 1) | num |  | 1 |  | - |
| 258 | Maximum Characters Take Over to NewLine(0~31) | num | 0~31 | 3 |  | FALSE |
| 273 | (undefined in Tm.xml and manual; default 1) | num |  | 1 |  | - |

### Q. Undefined ids


Undefined IDs (no Tm.xml entry, no manual entry; default 0 unless noted; PC UI hides them and never exports them): 58, 84, 146-148, 174-178, 183-184, 242, 248, 276, 284, 286, 296, 309-317, 321-329, 331, 337-339, 342-349, 380-399, 414, 423-429, 442-449, 458-479.

**[verified-fix] Spec058 is not undefined.**

| ID | Name (from code) | Kind | Allowed values | Default | Written by | Vis |
|---:|---|---|---|---|---|---|
| 58 | PC "Ask" link flags: +1 = scale pushes `ASK REP` (new sales logs) to the PC, +2 = scale sends `ASK PLU` lookups to the PC | num (bitmask) | 0-3 | 0 | Ethernet form on every connection to firmware ≥ V2.49A (`NetForm.cs:1445-1466`, handler `NetForm.cs:821-870`); PC settings `gen_AskLogs`/`gen_AskPLU` in MenuParameterForm (`MenuParameterForm.cs:1236-1237`) | - |

**[verified-add]** Manual V3.04A disagrees with Tm.xml on a few more ids:
- 140 value 3: manual "Each Saturday clear", Tm.xml "Each Sunday".
- 188 range: manual 0~6 with default 0, Tm.xml 0~7, factory file 6.
- 250: manual V3.04A lists only 0~1 ("No-Accumulation Mode").
- 50: manual has only 0/1 (wire/wireless).
- 54/55: absent from manual V3.04A (the table jumps 53 → 56).

The zh-CHS/zh-CHT Tm.xml lists 270 options 3 ("no unit price, or no paper") and 4 ("no unit price or paper") that the English file lacks. It also drops 227 option 2 and hides 285.

---

## 4. TMT: global texts (28 strings)

CONFIRMED line format: `TMT<TAB>{StringID}<TAB>{text}<TAB>` (`SaveForm.cs:966-994`). Line breaks inside a text are encoded as **`\v` (0x0B)** (`Program.FormatString`, `Program.cs:525-528`; decoded by `Program.ParseString`). **[verified-fix]** For TMT this holds only on the **reading** side (`RDS.cs:781`, `NetForm.cs:2587` call `ParseString`). Every TMT **writer** writes the value raw, with no `FormatString`: `SaveForm.cs:983/989/1323/1329`, `NetForm.cs:3322/3327`, `WizardForm.cs:1711-1712/1740/1948`. The PC therefore never emits `\v` in TMT, and its String grid is single-line. For our tool: strip CR/LF from global texts, or write `\v` for a line break (INFERRED that the firmware accepts `\v` here as it does in PLU/LAB texts). String 15 (Wi-Fi SSID) is always written in UTF-8, even when the file encoding is different (`SaveForm.cs:979-986`). The PC stores the strings in table `String(StringID, Value, Valid)` and exports only Valid rows. All 28 rows are Valid=False in every DB, so a plain "Global text" export sends nothing unless boxes are ticked. The wizard, however, writes TMT rows directly (section 9).

| ID | Tm.xml name | Manual hint / print position (Manual p.88) | Factory value (`_ECS.TMS` lines 2847-2874) | Notes |
|---:|---|---|---|---|
| 0 | Store Name | ShopN, bill header centre | `Factory` | Idle display option (Spec192=4). Wizard: label items with Flag1=2, Flag2=0 mark it as used |
| 1 | Device Name | ScaleN, not printed | `Factory Device` | Spec192=5 |
| 2 | Prefix of Money Unit | MnyPre | `$` | Wizard Unit page writes TMT2 (B: empty) |
| 3 | Suffix of Money Unit | MnySuf | empty | Wizard Unit page writes TMT3 (B: `VND`). Printed when Spec186/187=1 |
| 4-11 | Device Postil 1-8 | Strg-1..8: bill texts (4 header centre, 5 header left, 6 header centre, 7 header left, 8 end centre, 9 end left, 10 end centre, 11 end left) | TMT8 = `Thank You`, others empty | Label items Flag1=2, Flag2=17..24 map to TMT4..11 (`WizardForm.cs:3939-3942`) |
| 12-13 | Reserved 1-2 | SpSt-1/2 special texts | empty | Spec192=16 shows TMT12. The wizard writes the custom idle text into TMT12 (`WizardForm.cs:1735-1742`). Label Flag2=36..43 map to TMT12..19 |
| 14 | Industry Mark | Ind-MK | `*` | Printed before weight in "industry" precision |
| 15 | Wireless SSID | W-SSID | `JHSCALE` | Always UTF-8 |
| 16 | Wireless Password | W-PASS | empty | |
| 17-18 | Reserved 6-7 | SpSt-6/7 | empty | |
| 19 | Server's Domain Name | Domain | empty | |
| 20-27 | Custom Text 1-8 | Cstr-1..8 | empty | Spec192 values 24-31 show them |

Rule used in Spec192 and Spec281: option value v ≥ 4 means "show TMT(v-4)". CONFIRMED by the Tm.xml option lists (4 = Store Name … 31 = Custom Text 8).

"TMT" = TM **T**ext and "TMS" = TM **S**pec (INFERRED from the names; the PC calls them "Global Text" and "Global Spec", `Lang.xml` `pw_GlobalText` / `pw_GlobalSpec`).

---

## 5. Prices, decimals and the Vietnamese "thousand-dong" convention

- CONFIRMED: prices, costs and tares are written as `mantissa,exp` decimals (`Program.cs:530-557`). The PC first rounds to its own `Settings.Format_Price` (default 2) or `Format_Weight` (default 3). The wizard's **"Update software"** button copies the scale's U.Price decimals into `Format_Price` (`WizardForm.cs:6905-6912`), so the PC rounds to the same precision as the scale.
- CONFIRMED (Wizard.BIN B): the Vietnamese setup is 202=203=**3**, suffix `VND`, 185/186/187=1, rounding 0.
- INFERRED (strongly: it is the only way VND fits in the 6-digit unit-price window, Spec188=6): prices are entered in **thousands of đồng** and shown with 3 decimals, so `845` → display `845.000` → the customer reads "845.000 đ" (Vietnamese uses "." for thousands). Totals keep 1 đ resolution: 0.523 kg × 845.000 = `441.935`. Consequences:
  - Maximum unit price = `999.999` → **999,999 đ/kg** (Spec188=6). Maximum total = `9,999.999` → 9,999,999 đ (Spec189=7). Beef above 999,999 đ/kg does not fit unless Spec188=7 (Tm.xml allows 1-7; the physical window may have only 6 digits, UNKNOWN).
  - Rounding choices (wizard labels at 3 dp, `WizardForm.cs:7026-7043`): Spec100/101 = 0 → 1 đ, 9 → 5 đ, 1 → 10 đ, 10 → 50 đ, 2 → **100 đ**, 11 → 500 đ (0/5 on the last 3 digits). No option gives plain 1,000 đ rounding.
  - Barcode money decimals (Spec209): the barcode prints the money with that many decimals ("for 1.533 with 2, print 153", Manual p.82). With 3 dp prices, 209=3 puts exact đồng in the barcode, 209=0 puts thousands. The B wizard did not send 209, so the scale keeps its own value (factory 2) → money in the barcode would be in units of 10 đ. INFERRED; verify with the scale export.
- `spec[180]=1` (comma decimal) would print `845,000`, which reads wrongly in Vietnamese. Keep 0.
- **[verified-add] Limits of the `mantissa,exp` encoder** (`Program.FormatDecimal`, `Program.cs:530-557`; same loop in `DecimalInInt`, `Program.cs:570-588`):
  - Any value above 9,999,999 (or below −9,999,999) is written as **`0,0`**, so the price is silently zeroed. The config also has `maxPLUPrice = 9999999`, but no code reads it.
  - The loop multiplies by 10 only while |mantissa| ≤ 999,999.9 and exp < 7. So at most about 7 significant digits survive, and `Convert.ToInt32` rounds half to even for the rest.
  - For the thousand-đồng convention this is harmless: 999.999 becomes `999999,3`. If someone keyed full đồng with 0 decimals, 9,999,999 đ would be the hard ceiling.
- **[verified-add] PC rounding pitfall.** TM-xA rounds every exported price to `Settings.Format_Price` before encoding. The default is **2** (`TM-xA.exe.Config`), and this PC's `%LOCALAPPDATA%\JHScale\TM-xA.exe_Url_…\3.10.60.31060\user.config` does not override it. Only the wizard's "Update software" button raises it to the scale's 202 (`WizardForm.cs:6905-6912`). Unless that button was pressed, TM-xA exports 3-decimal VND prices **rounded to 0.01 = 10 đ**, for example 123.455 → `12346,2`. Our tool writes prices itself, so it avoids this.

---

## 6. Units (UNT)

CONFIRMED facts
- The PC table `Unit(UnitID, Amount, Pamount, Name, Punit, Pack, FlagP, FlagA)` is **re-initialised from a hard-coded list on every start** (`RDS.cs:509-532`, called at `RDS.cs:1228/1235`; names from `Lang.xml` `pw_AllUnitMeasure` = `Weight|pcs|kg|g|ton|lb|500g|100g|1/4lb`):

| UnitID | Name | Punit (base type, Combo.xml `Unit_Type`) | Pack (grams or pieces per unit) | Pamount (display) |
|---:|---|---|---:|---|
| 1 | Weight | 1 = Weight | 1 | `1 - Weight` (the system default weight unit, Spec212, normally kg) |
| 2 | pcs | 2 = Count | 1 | `2 - pcs` |
| 3 | kg | 1 | 1000 | |
| 4 | g | 1 | 1 | |
| 5 | ton | 1 | 1000000 | |
| 6 | lb | 1 | 453.592 | |
| 7 | 500g | 1 | 500 | |
| 8 | 100g | 1 | 100 | |
| 9 | 1/4lb | 1 | 113.398 | |

- **TM-xA v3.10 never writes a `UNT` section.** The Unit export check box is forced hidden and unchecked (`SaveForm.cs:690-694`, `SaveForm.cs:2386`; same in `NetForm.cs:1592-1594, 5509`). `_ECS.TMS` has an empty `DWL UNT` / `END UNT` block. Units are **fixed in firmware**. The PC table exists only to name `PLU.UnitID` and to convert quantities in stock reports.
- Unit ids 3-8 are the same codes used by Spec210 (T-Sale unit), Spec211 (system U.Price unit) and Spec212 (system weight unit): 3 kg, 4 g, 5 ton, 6 lb, 7 500g, 8 100g (Tm.xml).
- The PLU unit is TMS PLU field 4 (`SaveForm.cs:1060`, `RDS.cs:863`). The Beeftown tool uses `1` (weigh, system unit) and `2` (count).
- Conversion formula (CONFIRMED in the PC stock code `RDS.cs:1677, 1718`): `qty_in_A = qty_in_B × Pack_B / Pack_A`; `unitprice_A = unitprice_B × Pack_A / Pack_B` (same Punit only).
- On the scale (Manual p.13): "set PLU U.Price to 10.00, the unit is 500 gram and unit displayed is kg. When transfer PLU, unit price is displayed as 20.00", so the price is converted into the displayed unit with the same Pack ratio. Spec228 controls whether price conversion between weight units is allowed (0 allowed, 1 only default weight, 2 forbidden). Spec073=1 with Spec210=7 lets a T-Sale price be keyed per 500 g and shown per kg.
- For Beeftown, selling "per 100 g" means PLU unit 8 with the price per 100 g. INFERRED: the scale then shows the price per kg (×10) unless Spec211=8 or Spec228=2. Test before use.
- **[verified-add] PC quirk.** Unit 1 "Weight" has `Pack = 1` in the hard-coded list (`RDS.cs:513`), the same as unit 4 "g". The PC stock code converts with `Pack` ratios (`RDS.cs:1677-1718`), so mixing unit 1 and unit 3 (kg) in stock reports would be off by ×1000. This is PC-only and does not affect the scale. The PC also allows user units ≥ 10 (`UnitForm.cs:146, 171`; `minUserUnitID=10`, `maxUnitPack=10000`), but they are never exported.
- **[verified-add] Probable UNT row layout (INFERRED).** The manual's keypad menu P24 "Unit" edits steps `UNT.00` number, `UNT.01` name, `UNT.04` PUnit (1 = weight, 2 = count; "Not Open") and `UNT.05` Pack (grams per unit when weighing, pcs per pack when counting) (Manual V3.04A text lines 2241-2252; also V2.50A). The same manual numbers PLU steps exactly like the TMS placeholders: `PLU.03 Unit` = `{3}`, `PLU.07 Lab-1` = `{7}` (`SaveForm.cs:1060`). By analogy a UNT row would be `UNT<TAB>{0 id}<TAB>{1 name}<TAB>{2 ?}<TAB>{3 ?}<TAB>{4 PUnit}<TAB>{5 Pack}<TAB>`. Unverified: there is no writer and no sample.

---

## 7. Other tables: line formats (CONFIRMED writers in `SaveForm.cs`; readers in `RDS.cs:805-850` and `NetForm.cs:2646-2726`)

| Section | Line format | Notes |
|---|---|---|
| DPT (departments) | `DPT<TAB>{DeptID}<TAB>{Name}<TAB>` (`SaveForm.cs:1024`) | ids 1-9 are system (1 T-Weight, 2 T-Count, 3 Service Charge, 4 Discount & Rounding, 5 Not Cash Payment, 9 Default; `_ECS.TMS` lines 5-10). User ids 10-99 (`TM-xA.exe.Config` `minUserDeptID=10`, `maxDeptID=99`). A_ECS added dept 10 (empty name). B_ECS added 6/7/8 "Reserved 6-8" |
| CLS (classes) | `CLS<TAB>{ClassID}<TAB>{Name}<TAB>{DeptID}<TAB>{LabelID1}<TAB>{BarT1}<TAB>{BarF1}<TAB>{LabelID2}<TAB>{BarT2}<TAB>{BarF2}<TAB>` (`SaveForm.cs:1041`) | Same reserved 1-9 as DPT; user 10-999. LabelID/BarT/BarF are the class-level print format, barcode format and flag for bill 1/2 (used when Spec054 selects "class"). The 2018 `_ECS.TMS` uses the old 3-field form `CLS<TAB>1<TAB>T-Weight<TAB>1<TAB>` and the reader tolerates missing fields (`RDS.cs:826-841`). Class form offers only labels 0-29 (`ClassForm.cs:612, 655`) |
| SAL (salesmen) | `SAL<TAB>{ID}<TAB>{Name}<TAB>{Password}<TAB>{Discount_Low}<TAB>{Discount_High}<TAB>{RightFB}<TAB>{Code}<TAB>` (`SaveForm.cs:1120`) | RightFB bitmask, **set bit = forbidden**: 1 Re-print, 2 Pre-print, 4 By-weight T-Sale, 8 By-count T-Sale, 16 PLU quit, 32 Amend, 64 Hang-up, 128 Load-back, 256 F-Prog price, 512 Buy-back/other transactions, 1024 Drawer, 2048 Illegal reboot (`SalesmanForm.cs:750-770`). Discount_Low/High = price-change % limits, lower priority than Spec110-112 (`Lang.xml` `pw_UppertwoarelowerprioritythenSpec110_112`). Login behaviour: Spec135 |
| VIP | `VIP<TAB>{BAR div 1e9}<TAB>{BAR mod 1e9}<TAB>{PH div 1e9}<TAB>{PH mod 1e9}<TAB>{Point m,e or -1}<TAB>{Discount%}<TAB>` (`SaveForm.cs:1170-1199`) | Card barcode and phone are each split into two 9-digit halves. Point = `-1,0` unless "send points" is ticked (keeps the scale's points). Specs 287/288 = non-VIP / VIP default discount |
| PAS (scale passwords) | `PAS<TAB>{n}<TAB>{password}<TAB>`, n: 0 Admin, 1 Sale, 2 Prog, 3 Account, 4 Drawer, 5 Price-F-Prog (`WizardForm.cs:1912-1940`) | Sent only by the wizard's Management page for ticked boxes. The Manual (p.61, P51x) lists Admin/Sale/Prog/Account/Drawer. Password 0 = none, and an Admin password of 0 opens everything. The manual gives the scale's factory admin password as <factory default> (Manual text line 2383). Related specs: 49, 247, 260 |
| Password (PC table, not sent) | `Password(ID, Pass)`: ID −1 = DB schema check (must equal `VALIDCHECK_Database = 11`, `Program.cs:74`); 0 = PC "admin" login; 1 = PC "user" login (`ManagerForm.cs:157-205`, `PasswordForm.cs:148-155`) | Factory: admin `<factory default>`, user blank (documented in Manual p.15). A hard-coded SuperAdmin login also exists (`ManagerForm.cs:~205`); SuperAdmin sees Visible=FALSE specs and "Import/Export All" |
| Custom1-4 | `DWL<TAB>{keyword}` then `{keyword}<TAB>{field…}<TAB>` rows; fields are defined in `Custom.xml` (`SaveForm.cs:523-564`) | `Custom.xml` is empty and all Custom tables are empty, so they are unused |
| UNT | none written by v3.10 (section 6) | |

**[verified-add] Field-numbering convention (avoid off-by-one).** In this document, "PLU field n" means the index after splitting the line on TAB, with the tag `PLU` at index 0. That is also the index `COL.*` uses in `Beeftown_Can_TMA.html`: UNIT=4, PRICE=5, NAME=15. The manual's keypad step `PLU.nn` and the `{nn}` placeholder in `SaveForm.cs:1060` are one lower. So "field 8 = LabelID1" is manual `PLU.07 Lab-1`, and "field 4 = UnitID" is `PLU.03 Unit`. The same shift applies to CLS, SAL and VIP.

---

## 8. What the technician changed (diffs)

### 8.1 PC databases
- `A_ECS/Spec.tsv` vs `A_en_Default/Spec.tsv`: **identical** (values and Valid).
- `B_ECS/Spec.tsv` vs default: values identical. Only `Valid` changed on 104, 105 and 106 (True → False). Exporting "Global Spec" from install B therefore sends **nothing**, while install A would send 104=0, 105=0, 106=0. **[verified-fix]** "True → False" is backwards. All-False is the factory seed state (B). A_ECS and A's `Default.mdb` profile (2026-01-30) are the ones where 104-106 were **ticked** (False → True). Their values stay 0 (YYYY.MM.DD, "use PLU setting", 0 days). So install A actively sends `104=0`, which **forces YYYY.MM.DD** on the scale whenever a "Global Spec" export is done from A.
- `String` (TMT) tables: identical to factory in A and B (`$` prefix, empty suffix, all Valid=False).
- Units: factory (hard-coded). Dept/Class: A added id 10 (class 10 → label 10); B added reserved 6-8. Salesman/VIP: empty.
- Conclusion: **the Spec tables do not show the Vietnamese setup.** It lives in Wizard.BIN (below) and on the scale.

### 8.2 Wizard.BIN (BinaryFormatter `ECS.SaveConfig`, `SaveConfig.cs`), decoded

| Field | A (install root, 2026-05-14) | **B (nested copy, 2026-02-26)** | Spec/TMT it produces |
|---|---|---|---|
| Device / window | A12, 4-window | **A17, 5-window** | (not sent) enables the W5th page |
| OpMain + pages | First config: label/barcode, PLU, shortcut | First config: **all** (label/barcode, management, sale op, unit & display, PLU, shortcut) | wcStep A = [1,1,1,1,1,0,1,0,0,0,0,1,1,1]; B = [1,1,1,1,0,0,1,1,1,1,1,1,1,1] |
| Mode | label print, accumulate allowed, gap 60×40, gray 7 | **label print, one-item-only, print on confirm, gap 60×40, gray 9** | A: 250=0, 5=10, 0=28, 21=1, 22=23=7. **B: 250=1, 0=28, 21=1, 22=23=9** |
| Labels | item 28, sum 10 | item 28, sum 28 (unused) | spec 0 = 28 |
| Management | Full right (defaults) | Full right | B: 138=0, 110=0, 118=3, 283=1, 69=1 |
| Sale op | defaults | defaults (price F-Prog 1, zero-return value 1) | B: 83=1, 74=0, **131=1**, 282=0, 279=0 |
| Unit & display | 2 dp, prefix `$` (not sent) | **3 dp, prefix "", suffix `VND`, print units on** | **B: 202=3, 203=3, 100=0, 101=0, 185=1, 186=1, 187=1; TMT2="", TMT3="VND"** |
| 5-window | - | PLU info auto font, source1 = name, source2 = Text1, idle = time | B: 190=0, 194=0, 195=1, 191=1, 193=0, 192=0 |
| Barcode | cash-register EAN "25501" (flag 2 + code 5 + price 5 + check), flag 20, sum as QR v5, money dp 2 | **Manual-edit barcode** `>82\v>40027\v>0\v>0\v>00\v>09\v` | A: 139=0, 1=28, 2=20, 209=2, 6=29, 7=20, 456=5; BAR 28/29. **B: 1=28, 6=28; `BAR 28 QS-Item 0 0 0 0 >82>40027>0>0>00>09`** |
| Passwords | none ticked (admin text <factory default>) | none ticked | no PAS section |
| Global texts | TMT0 "Factory", TMT1 "Factory Device" sent | none sent | |

Exact B output (`Program.sWizard`, what the scale received; CR/LF and trailing tabs omitted):
```
DWL TMS | 250 1 | 0 28 | 21 1 | 22 9 | 23 9 | 138 0 | 110 0 | 118 3 | 283 1 | 69 1 | 83 1 | 74 0 | 131 1 | 282 0 | 279 0 | 202 3 | 203 3 | 100 0 | 101 0 | 185 1 | 186 1 | 187 1 | END TMS
DWL TMT | 2 "" | 3 "VND" | END TMT
DWL TMS | 190 0 | 194 0 | 195 1 | 191 1 | 193 0 | 192 0 | 1 28 | 6 28 | END TMS
DWL BAR | 28 QS-Item 0 0 0 0 >82\v>40027\v>0\v>0\v>00\v>09\v | END BAR
DWL TMT | END TMT
```

What this implies for a Vietnamese shop (Beeftown)
- **Currency**: suffix `VND` printed after unit price and total (185-187=1), no prefix. Prices keyed in thousands with 3 decimals (section 5).
- **Decimals 3** for both U.Price and T.Price → the tool's `dec = spec[202]` = 3 matches.
- **Date format was not set by the technician.** The PC default and factory `_ECS.TMS` value is 104=0 → `YYYY.MM.DD`. Vietnamese style needs **104=4 (DD/MM/YY 24H)** or 5 (DD-MM-YY). **No DD/MM/YYYY option exists**; only option 0 has a 4-digit year. To make the scale display follow 104 as well, set **266=1**. Read the scale's real 104 from `A_000.TMS` first.
- **One label per weighing**: 250=1 makes 【Accu】 behave like 【Print】. Spec131=1 ("Auto accumulate after zero-return") comes from the wizard's default `MG_ZeroReturn=1`: the Sale page radios only map 0/3/4, so an untouched page still writes 1 (`WizardForm.cs:2085, 7105-7120`). Treat 131=1 as unintended. For "auto print when the meat is removed" use 131=3, or 4 (cannot cancel). **[verified-add]** How it leaks: `GetSetting_RadioButton(1, …, {0,3,4})` finds no matching radio and checks none (`WizardForm.cs:2399, 6840-6861`). No designer default is checked either, so `P5_ZeroReturn_x_radioButton_CheckedChanged` never fires, and the saved 1 is written (`WizardForm.cs:1696`). The radio captions are 0 "Forbidden", 3 "Auto print", 4 "Auto print, can't cancel" (`WizardForm.cs:2910-2912`). Per the manual, value 1 **records unprinted weighings as transactions** (see the 131 row in section 2). With Beeftown's one-label-per-weighing workflow this can add unprinted sales to the scale's logs. Recommend 131=0 unless the owner wants auto-print (3).
- **Barcode**: B's manual barcode string is made only of constants (`>xxx\v` = constant segment; compare `WizardForm.cs:1881`). INFERRED: every label would carry the same number ("82 40027 0 0 00 09" + check digit), which looks like a technician test or placeholder. Confirm on a printed label. The barcode analysis belongs to the barcode/label work item.
- LogInfo shows several customer scales (MACs 0023F0…) served from install A. **Which Wizard.BIN belongs to Beeftown's scale is not provable from the files** (see Unknowns).

---

## 9. Configuration wizard

### 9.1 Steps (enum `WizardConfigStep`, `WizardForm.cs:71-88`; `wcStep[]` index = enum value)
| # | Step | Panel title (Lang) | Writes |
|---:|---|---|---|
| 0 | DoWhat | "What to do": First config / Edit working data only / Export config and data directly (`OpMain`) | chooses steps |
| 1 | Device | Select device: A = bar-code printing scale (A08/A12/A15/A17 = 2008/2012/2015/2017 models; 4w/5w/np = 4-window, 5-window, no pole), B = price-printing scale, C = cash-register scale (C11/C15), D = cash register, E/F = A1/A2 indicator | nothing (enables pages: label mode only for A/F; W5th only for 5w/np/E/F, `WizardForm.cs:3842-3849`) |
| 2 | OperationMode | Label print mode vs cash-register mode, one-item-only, print-once-on-confirm, gap/plain paper size, gray | **250, 0, 5, 21, 22, 23** (`WizardForm.cs:1642-1683`) |
| 3/4/5 | PT_1 / PT_2 / PT_3 | print format of item label / sum label / receipt | picks `PT_ItemLabel/PT_SumLabel/PT_Receipt` (`WizardForm.cs:5312-5326`) used for spec 0/5. Also exports LAB rows, and TMT rows for the global texts used by the label (`WizardForm.cs:3918-3961, 1941-1952`) |
| 6 | Barcode | cash-register EAN builder / special barcode / manual edit | **139, 1, 2, 208, 209, 196, 6, 7, 456** + BAR 28 (and 29) (`WizardForm.cs:1745-1911`) |
| 7 | Management | rights preset, admin-in-charge, unit/total price change, buffer clear, unconfirmed record, zero-back, passwords | **138, 110, 118, 283, 69** + PAS 0-5 (`WizardForm.cs:1684-1691, 1912-1940`) |
| 8 | SaleOpConfig | price F-Prog, other transactions, auto print after zero return, payments, hang-up | **83, 74, 131, 282, 279** (`WizardForm.cs:1692-1699`) |
| 9 | Unit | radix points, rounding, money prefix/suffix, print units | **202, 203, 100, 101, 185, 186, 187** + TMT 2, 3 (`WizardForm.cs:1700-1715`) |
| 10 | W5th | display of the 5th window | **190, 194, 195, 191, 193, 192** (+TMT12) (`WizardForm.cs:1716-1744`) |
| 11 | PLU | PLU grid (exports PLU table) | - |
| 12 | Face | shortcut keys (exports SCP) | - |
| 13 | TMSout | export via Ethernet or USB | builds `Program.sWizard` and saves Wizard.BIN (`WizardForm.cs:1953-1957`) |

Only steps that are enabled and visited are written (`wcStep_Enable && wcStep_Enable_Plus`, `WizardForm.cs:3645-3656`). The export then sends Label (if step 2), PLU (step 11), SCP (step 12) and BMP (if a label uses a bitmap), plus the wizard text (`WizardForm.cs:3695-3702`).

**[verified-add] Enabling rules and quirks** (`WizardForm.cs:3830-3962`):
- The **Barcode step (6)** needs `wcStep_Enable_Plus[6]`. In label mode it is set only when the chosen label contains a barcode element (`LabelItem.Flag1 == 0`). In cash-register mode it is set only when "Scan barcode printed by scales" is ticked. The same condition sets `Barcode_ED`, which gates the barcode TMS rows (`WizardForm.cs:1745`) independently of `wcStep[6]`.
- **PT_2** (sum label) is enabled only in label mode with "One item bill only" unticked. **PT_3** (receipt) is enabled only in cash-register mode.
- Global texts sent as TMT come from label elements:
  - `Flag1==2`, `Flag2` 0-1 → TMT0-1.
  - `Flag2` 17-24 → TMT4-11.
  - `Flag2` 36-43 → TMT12-19.
  - Quirk: any **bitmap** element (`Flag1==6`) also marks `PT_GlobalText_ED[Flag2]`, which re-sends the TMT whose index equals the bitmap number (`WizardForm.cs:3948-3951`).
- **Device**: choosing A17 forces 5-window and disables 4w and "np" (`WizardForm.cs:1345-1352`). A15 disables 4w, and A08 disables np. The device also picks the shortcut-key layout: A08 → `ScPLU_KA`, `np` → `ScPLU_KAD`, other A models → **`ScPLU_KAB`** (B's A17 5w), C → KC, D → KD, E → KE, F → KF (`WizardForm.cs:3600-3625`). The "2008/2012/2015/2017 models" reading of A08-A17 is INFERRED from the names only.
- Option captions:
  - Page 2: "One item bill only (No accumulate allowed)" and "Print once press [Confirm]" (= `Mode_PrintDirect`, `Lang.xml` `pw_Oneitembillonly_Noaccumulateallowed_`, resx `Mode_PrintDirect_checkBox.Text`).
  - Barcode CRC: the radio for 139 is enabled only for Admin/SuperAdmin, or when 139 is already 1 or 2 (`WizardForm.cs:2271`).

### 9.2 Page 2 logic: "BarcodeScale" vs "CashRegister" presets (`WizardForm.cs:1642-1683, 1414-1471`)
- **Label print mode ("bar-code scale")**, `Mode_Prepack=true`:
  - one-item-only + print direct → `250=1` (【Accu】 = 【Print】), `0=item label`
  - one-item-only, not direct → `250=1`, a new `DWL TMS`, then `250=2` (accumulate once). INFERRED: this is a fallback for firmware that rejects value 2. [verified-add: supporting evidence. Manual V3.04A defines Spec250 only as 0~1 (text line 4754), so value 2 is newer. The scale's loader counts right and error rows separately (Manual p.59), so an older scale would reject `250=2` and keep `250=1`. The repeated id makes the file un-importable by TM-xA itself (section 1).]
  - accumulation allowed → `250=0`, `5=sum label`, `0=item label`
- **Cash-register mode**: `250=0`, `0 = 5 = receipt format`. "Scan barcode printed by scales" enables the Barcode page.
- Paper: `21=1` gap (label) or `0` plain. `22=23=gray` (the same darkness is written for both paper types).
- Label templates offered by paper size (`WizardForm.cs:3413-3500`): item 11000-11099 (60×40), 11100 (40×30), 11200 (60×30), 11300 (30×40); sum 12000-12399; receipt 13000 (57 mm), 13100 (40 mm), 13200 (60 mm). A chosen template is **cloned to user id 28 (item), 29 (sum), 27 (receipt) or 26 (generic)** (`suggestUserLabelID=29` in `TM-xA.exe.Config`; `WizardForm.cs:3416, 3447, 3478, 3504, 5628-5705`). A label already at that id is moved to "Recycled" 90000-90099. **[verified-add]** No clone happens when the chosen label is already a user label **10-29** (`minUserLabelID=10`, `maxUserLabelID=29`; `PT_Clone`, `WizardForm.cs:5635-5638`). Its own id then goes into spec 0/5. That is why install A's Wizard.BIN has sum label **10** (`5=10`). Only ids 10-99 are exported (`SaveForm.cs:1092`). Ids 1-9 are the firmware's built-in formats (B_ECS shows PF-1..PF-9: 1-3 item labels 58×40/40×30/58×30, 4-6 sum labels, 7-9 receipts; Manual p.11 table matches: 58×40 → Spec000=1, Spec005=4).

### 9.3 Page 7 "Management" presets (`WizardForm.cs:6628-6707`)
| Preset | 110 (bit1 U.Price change forbidden, bit2 total change forbidden) | 283 (unconfirmed record) | 118 (buffer clear) | 138 (admin-in-charge bits) | 69 (zero-back) |
|---|---|---|---|---|---|
| Full right (default) | 0 | 1 (priced ops) | 3 (manual, record) | 0 | `pw_ZeroReturnForWeightSale_Value` = 1 |
| Limited right | 3 | 1 | 3 | 3342 = pre-print, both T-Sales, F-Prog price, drawer, illegal reboot | 3 |
| No right | 3 | 2 (priced + weighed) | 3 | 4094 = everything except re-print | 3 |
| Custom | user choice | | 0-4 (4 = forbidden, wizard only) | user choice | user choice 0-4 |
138 bits (`WizardForm.cs:1960-1974`): 1 Re-print, 2 Pre-print, 4 By-weight T-Sale, 8 By-count T-Sale, 16 PLU quit, 32 Amend, 64 Hang-up bill, 128 Load-back bill, 256 F-Prog price, 512 Buy-back/other transactions, 1024 Drawer, 2048 Illegal reboot. A set bit means the operation needs the Admin password. This is the same bit layout as salesman `RightFB`.

### 9.4 Page 8 "Sale" (`WizardForm.cs:7100-7200`)
- 83 price F-Prog: 0 forbidden, 1 long press 【@Price】, 2 press, 3 press + long press for name, 4 save automatically after the transaction.
- 74 "Other transactions" bitmask: 1 buy-back from an existing log, 2 new-input buy-back, 4 mix with sale, 8 amount switch, 16 price switch, 32 inbound, 64 outbound, 128 stock-taking, 256 order, 512 spoilage (labels `Lang.xml` pw_Existlogbuyback…pw_Spoilage; Tm.xml documents only bits 1-16).
- 131 auto print after zero-return: radios 0 / 3 / 4 only (the default 1 leaks through, see 8.2).
- 282 payments **forbidden** bitmask (unticked = forbidden): 1 cash, 2 card (PLU 9999995), 4 other-pay 1 (9999994), 8 other-pay 2 (9999993), 16 other-pay 3 (9999992), 32 store payments (9999991). **Bug**: unticking other-pay 2 ORs 5 instead of 8 (`WizardForm.cs:7185`).
- 279 hang-up/load-back 0-3.

### 9.5 Page 9 "Unit" and page 10 "5th window"
- 202 and 203 radix radios. Picking a U.Price radix also sets the total radix, and total radix options above the U.Price radix are disabled (`WizardForm.cs:6931-6956`).
- 100/101 rounding radios map to values `[0, 9, 1, 10, 2]` (`WizardForm.cs:7092, 7097`); the displayed text depends on the total radix (section 5).
- Prefix → TMT2, suffix → TMT3. Check boxes → 185/186/187.
- 190 PLU-info font (0 self-adapting, 1 font 1, 2 font 0, 3 two-line). 194/195 PLU info sources (0 name, 1-7 Text1-7; "Double source" makes them differ). 191 idle font. 193 accumulated display (0 total pcs, 1 same as idle, 2 accumulated times). 192 idle: 0 time, 4 store name (TMT0), 5 device name (TMT1), 16 custom text (writes TMT12).

### 9.6 "Presets" as named by the teaching videos (`Document\Teaching Video\*.exe`, not executed)
| Video | Wizard path | Specs written |
|---|---|---|
| A001 ConfigWizard-BarcodeScale | Device A → Label print mode → PT_1 (+PT_2) → Barcode | 250, 0, (5), 21=1, 22, 23 (+139, 1, 2, 208/209/196, 6, 7, 456, BAR 28/29) |
| A002 ConfigWizard-CashRegister | Device A/C → Cash-register mode → PT_3 → (Barcode if scanning scale barcodes) | 250=0, 0=5=receipt, 21, 22, 23 |
| A003 ConfigWizard-Barcode | Barcode page | 139, 1, 2, 208, 209, 196, 6, 7, 456 + BAR |
| A004 ConfigWizard-Management | Management page | 138, 110, 118, 283, 69 + PAS |
| A005 ConfigWizard-Sale | Sale-operation page | 83, 74, 131, 282, 279 |
| A006 ConfigWizard-UnitAndDisplay | Unit page (+W5th for 5-window) | 202, 203, 100, 101, 185, 186, 187, TMT2/3 (+190-195, TMT12) |
| B007 ConfigWizard-PrintFormat | PT pages | chooses and clones labels → spec 0/5 values + LAB rows + TMT used by labels |

Default wizard answers when no Wizard.BIN exists (`WizardForm.cs:2002-2111`): device A12/4w (or the value from `pw_Z_ConfigWizard_DeviceMenu`), label mode, gap 60×40, gray 7, EAN type 25501, flag item 20, flag sum 2099999, sum barcode in QR v5, money dp 2 in barcode, U/T price dp 2, rounding 0, prefix/suffix taken from TMT2/3, Full right, accu clear 3, unconfirmed 1, price F-Prog 1, zero-return 1, PC admin password text "<factory default>".

---

## 10. MenuParameterForm and other PC-only settings (do not affect the scale)
- `MenuParameterForm.cs`: menu enable switches, fonts, the **PC's own date/time display** (`gen_dtType_Date` = `yyyy.MM.dd` / `yy.MM.dd` / `MM/dd/yy` / `MM-dd-yy` / `dd/MM/yy` / `dd-MM-yy`; `gen_dtType_Time` 12h/24h, `MenuParameterForm.cs:1351-1382, 1509-1536`), payment names (`Text_Payment1..3` = CreditCard/PayPal/Voucher), and which PLU columns to keep on Excel import. None of these are written to TMS.
- `ConfigForm.cs:108-124`: language/config folder selection (`Config\Config.xml`: en/es/pt/ru/zh-CHS/zh-CHT, all `utf-8`); sets `configFolder`/`configEncoding` (the TMS file encoding, `Program.cs:105-108`) and restarts. Data profiles `Config\<lang>\<name>.mdb` are copied over `ECS.mdb` by `ChangeFilename` (`PasswordForm.cs`, `ManagerForm.cs`); `Default.mdb` is the 'Default' profile.
- `GuiderForm.cs`: start page (Wizard / Ethernet / Report / Advanced / TXT / USB / Excel buttons).
- `TM-xA.exe.Config` ranges: labels user 10-99 (wizard suggests 26-29) [verified-fix: user-editable labels are **10-29** (`maxUserLabelID=29`; LabelForm message `pw_CustomIDmustbetween10_29`, `LabelForm.cs:1091`; the Class form also offers only 0-29, `ClassForm.cs:612, 655`). 10-99 (`maxLabelID=99`) is only the non-SuperAdmin **export filter** (`SaveForm.cs:1092`)], templates 10000-19999, recycled 90000-90099; barcodes user 10-99; dept 10-99; class 10-999; unit ids ≤ 99; PLU 1-9999990 (9999991-9999999 are payment/temporary dummy PLUs); `Format_Price=2`, `Format_Weight=3`.

---

## 11. Recommendations for the Beeftown tool
1. Parse TMS robustly: skip a leading BOM and empty lines, accept multiple blocks per section and merge them (last one wins per id).
2. Keep `dec = spec[202]`. If 202 is absent, fall back to 203, then to 3 with a warning. Show and validate the ceiling `999.999` (`10^(Spec188) − 1` counted in the smallest unit) → 999,999 đ/kg.
3. Active label per product: `PLU[8] (LabelID1) != 0 ? PLU[8] : spec[0]`. Ignore Spec054=1x/2x (class/spec source) unless Beeftown uses classes; current PLUs use class 9 "Default".
4. Offer a small "Cài đặt cân" panel that appends one extra `DWL TMS … END TMS` block (the scale accepts partial blocks). Candidates: 104 (date format, recommend 4), 266=1, 22/23 darkness, 3 (copies), 100/101 rounding (2 = 100 đ), 131 (0/3/4), 185-187, TMT0 store name, TMT3 `VND`. Never emit `CLR TMS`.
5. Warn when 104 is 0 (YYYY.MM.DD) because Vietnamese customers read dd/mm.
6. Units: expose 1 (kg, system weight unit), 2 (pcs), and optionally 8 (100 g) with a note about price conversion.
7. **[verified-add]** File naming and loading. The scale auto-loads **`A_xxx.TMS`** at power-on (Spec042=1), not `A_000.TMS`. `A_000.TMS` is loaded by hand: 【Prog】【4】【1】, keep `000`, then 【Confirm】 (Manual p.59). The tool's tip at `Beeftown_Can_TMA.html:298` ("the scale will auto-load A_000.TMS if the USB stays plugged in at power-on") is therefore probably wrong. The real risk is a leftover `A_xxx.TMS` on the stick. Offer "save as A_xxx.TMS (auto-update)" as an option.
8. **[verified-add]** Never repeat a spec id within one output file (TM-xA's own import aborts on duplicates, `RDS.cs:1125`). Never clamp values to the Tm.xml range text (factory 30=270 exceeds "0~255"). Keep unknown ids as they are.
9. **[verified-add]** If the tool shows or edits global texts (TMT), note that TMT values are written raw by the vendor. Strip TAB/CR/LF, or map line breaks to `\v`.
10. **[verified-add]** Recommend `131=0`, which undoes the wizard's accidental 1 (section 8.2), and consider sending `0=28` only when the file's LAB section really contains label 28.

---

## 12. Unknowns / to verify on the real scale
- The **actual spec values inside Beeftown's scale** (read TMS rows from the scale's own `JHSCALE\A_000.TMS`). The PC DBs never held the Vietnamese values, and the Wizard.BIN files cannot be tied to Beeftown's scale MAC with certainty. `user_config.bck` lists V3.15C5/V3.15D scales (MACs 0023F01AD114, 0023F01B20EE, 0023F01B20D6); `LogInfo.txt` lists many customer MACs.
- The exact firmware meaning of "default" in Spec054=0 (PLU → class → Spec000 chain?), and whether Spec054 exists in firmware V3.14E8.
- Whether the unit-price window really holds only 6 digits (Spec188 accepts 7 in Tm.xml, 6 in the manual) → affects the 999,999 đ/kg ceiling.
- The scale's real Spec209 (money decimals in the barcode) and whether B's constant manual barcode (`>82…>09`) is what Beeftown prints.
- The meaning of undefined ids 243, 273 (default 1) and 499 (default 1522729470, looks like a Unix timestamp); ids 146-148, 174-178, 183-184, 309-317, 321-329, 380-399 etc.
- Why the wizard writes `250=1` and then `250=2` in a separate block (firmware-compatibility fallback is only a guess). [verified-add: now strongly supported. Manual V3.04A allows only 0~1 for 250, and the loader accepts rows one by one. Still INFERRED.]
- Whether `A_nnn.TMS` really uses Spec040 (device number) as `nnn`, and how the firmware treats `A_xxx.TMS` ("Boot File"). [verified-fix: **RESOLVED**. `nnn` is a keypad-chosen file serial number (P41, default 000), and `A_xxx.TMS` is the auto-update file loaded at power-on when Spec042=1 (Manual p.59-60).]
- The UNT line format: v3.10 has no writer. Older firmware may accept `UNT` rows, but none exist in the samples. [verified-add: partial. A probable layout `UNT id name ? ? PUnit Pack` is INFERRED from the manual's P24 step numbers (section 6).]
- The option-2 meaning of Spec139 (wizard label "Character '0'"; Tm.xml lists only 0/1). [still unknown. All three manuals list only 0/1. The wizard exposes 2 only to Admin/SuperAdmin (`WizardForm.cs:2271`).]
- [verified-add] Spec058: **RESOLVED**. It holds the PC Ethernet "ask" flags (+1 logs, +2 PLU), written by `NetForm.cs:1463-1464`.
- [verified-add] Which install belongs to Beeftown: install B's DB received firmware-named departments/classes 6-8 from a scale, but no MAC or name links it to Beeftown. All device rows in A_Report/B_Report are named `★<TMT0>★<TMT1>★<number>` (`ReportForm.cs:4911`), and most still carry the factory `Factory`/`Factory Device`. Setting TMT0 (store name) on Beeftown's scale would make it identifiable in future.

---

## Verification log

An adversarial re-check of this spec against the decompiled source, the install data files and the TSV dumps (2026-09-29). Helper scripts are in `scratchpad\verify\` (`diffspec.py`, `tmxml.py`, `tmall.py`, `tmcmp.py`, `chktable.py`, `regional.py`). Outcomes: **OK** = claim holds; **FIXED** = claim was wrong and is corrected in place ([verified-fix]); **ADDED** = missed fact added ([verified-add]).

| # | Claim checked | Evidence | Outcome |
|---:|---|---|---|
| 1 | Section 3 table: every default equals `_ECS.TMS`; Vis equals Tm.xml `Visible`; Kind equals Tm.xml `Type`; option values equal the Tm.xml `v`/`label` pairs | `verify\chktable.py` parsed all 394 table rows: 0 mismatches. The union of table ids and the undefined list covers 0-499 exactly, and every undefined id has factory value 0 | OK |
| 2 | Tm.xml has 383 Spec_Info and 28 String_Info entries; Type 2 unused; only 297 is Type 3; Visible counts | `verify\tmxml.py`: 383 specs (TRUE 359, FALSE 18, admin 6); types 0:214, 1:168, 3:1 (id 297); all copies at root/en/es/fa/pt/ru/zh-* have the same 383 ids; the `Config\<lang>\Tm.xml` files are 275-byte empty overlays | OK |
| 3 | `spec[202]`/`[203]` are U.Price/T.Price decimals; wizard writes them from `MISC_UPPoint`/`MISC_TPPoint` | `WizardForm.cs:1702-1703`; Tm.xml 202/203 option lists 0-5 | OK |
| 4 | T.Price decimals can never exceed U.Price decimals in the wizard; total rounding never finer than item rounding | `WizardForm.cs:6931-6968` (`P4_PointEnableCheck` enables total option k only if the U.Price/item choice ≥ k) | OK |
| 5 | Rounding radio → spec value map `[0,9,1,10,2]` and the 3-dp captions 0.001/0.005/0.010/0.050/0.100 | `WizardForm.cs:7026-7043, 7092, 7097` | OK |
| 6 | Management presets: Full 0/1/3/0/zero-back 1; Limited 3/1/3/3342/3; No 3/2/3/4094/3 | `WizardForm.cs:6628-6707`; 3342 = 2+4+8+256+1024+2048, 4094 = 4095−1; `Lang.xml` `pw_ZeroReturnForWeightSale_Value` = 1 | OK |
| 7 | 131=1 leaks from the untouched Sale page | `WizardForm.cs:2085, 2399, 6840-6861, 7105-7120`; no designer default checked (`grep` of `P5_ZeroReturn_*_radioButton.Checked` finds only runtime code) | OK. ADDED: manual meaning "auto **record** unprinted weighing" (Manual text 825, 4470-4485) |
| 8 | Payment bug `num \|= 5` for other-pay 2 | `WizardForm.cs:7183-7186` | OK |
| 9 | XMLSerialize page→spec mapping incl. split blocks and PAS rows | `WizardForm.cs:1637-1958` read in full | OK. ADDED: barcode rows are gated by `Barcode_ED`, not `wcStep[6]`; enabling rules `WizardForm.cs:3830-3962` |
| 10 | Wizard.BIN decode (B: 202=203=3, suffix VND, 250=1, 0=28, 1=6=28, 22=23=9, 131=1; A: 5=10, 209=2, 456=5) | Re-ran `work\nrbf.py` on both files: output byte-identical to `wizA.txt`/`wizB.txt`. Raw bytes of B's Wizard.BIN contain `TMS\t202\t3\t` at offset 2953 and `VND` at 2428 | OK |
| 11 | DB diffs: A_ECS/B_ECS/Default.mdb specs equal `_ECS.TMS`; String tables equal factory, all Valid=False | `verify\diffspec.py` (all 10 dumps; only A_ECS, A_en_Default, B_ECS, Default_ECS hold Spec) and an inline String diff | OK for values. FIXED: the direction of the Valid change (factory seed = all False, `RDS.cs:749, 1226-1227`); `Default.mdb` is a technician profile dated 2026-01-30, the same size and time as A's `ECS2.mdb` |
| 12 | USB file `A_nnn`: n = Spec040 (INFERRED) | `SaveForm.cs:485-494, 279, 856`; Manual p.59-60 (text 3239-3244) | FIXED: `nnn` is a keypad file serial number; `A_xxx` = auto-update file; the PC ticks "Boot File" by default |
| 13 | TMT line breaks encoded with `\v` via `FormatString` | Writers `SaveForm.cs:983/989/1323/1329`, `NetForm.cs:3322/3327`, `WizardForm.cs:1711-1712/1740/1948` write raw; only readers use `ParseString` | FIXED |
| 14 | Spec058 undefined | `NetForm.cs:1445-1466` writes `TMS 58` (ask flags); `NetForm.cs:821-870` handles `ASK REP`/`ASK PLU` | FIXED (row added) |
| 15 | `Program.FormatDecimal` = mantissa,exp with exp capped at 7 | `Program.cs:530-557` | OK. ADDED: >9,999,999 → `0,0`; mantissa cap 999,999.9; PC `Format_Price=2` rounding pitfall (this PC's `user.config` has no override) |
| 16 | Type 3 packing `mantissa*8+dp` | `Program.cs:570-598` | OK |
| 17 | SpecForm visibility (ids missing from Tm.xml hidden even for SuperAdmin; hidden rows forced Valid=False) | `SpecForm.cs:128-150, 185-201`; Import/Export All limited to rows passing filter `"Visible"` (`SpecForm.cs:330-334, 444`) | OK |
| 18 | Reader keeps a spec only if the row is already Valid; upload `UPL TMS` … `END` | `RDS.cs:730-758`, `NetForm.cs:2495-2542` | OK. ADDED: duplicate ids abort a PC import (`RDS.cs:1124-1125, 1204`); PC sends `UPL END` |
| 19 | Line formats DPT/CLS/SAL/VIP/PAS | `SaveForm.cs:1024, 1041, 1120, 1196`; `WizardForm.cs:1912-1940`; readers `RDS.cs:805-847`, `NetForm.cs:2644-2724`; RightFB polarity `SalesmanForm.cs:750-770` (checkbox checked = bit clear = allowed) | OK |
| 20 | Unit list (ids 1-9, Punit, Pack) and conversion formula | `RDS.cs:509-532`; `Unit.tsv` in 3 DBs identical to the code list; `RDS.cs:1677-1718` | OK. ADDED: unit 1 has Pack 1 (PC stock quirk); INFERRED UNT layout from Manual P24 |
| 21 | No UNT writer in v3.10 | `SaveForm.cs:690-694, 2386`; `NetForm.cs:1592-1594, 5509`; no `"UNT"` literal in any `.cs` | OK |
| 22 | Clone targets 28/29/27/26 and template ranges by paper size | `WizardForm.cs:3413-3504, 5628-5705` | OK. ADDED: no clone when the chosen label is a user label 10-29 (explains A's `5=10`); user label range is 10-29, not 10-99 (`maxUserLabelID=29`, `LabelForm.cs:1091`) |
| 23 | Regional `_ECS.TMS` differences | `verify\regional.py`: es 33 diffs incl. 104=3, 265=1, 22/23=9, 286=1; zh-* 69=2, 207=2, 213=0, 227=0, 268=1; pt/ru specs identical to en | OK |
| 24 | Tool parser problems (BOM + blank line rejected; only the last block per section kept) | `Beeftown_Can_TMA.html:372-393`: the BOM is stripped, but `lines[0]` is then `''` → rejected; `sec[open.name] = open` overwrites earlier blocks. `_ECS.TMS` starts `EF BB BF 0D 0A` and also has blank lines between sections | OK. ADDED: a `CLR<TAB>TMS<TAB>` line would also open the section in the tool's detector (harmless). The tool's power-on auto-load tip is probably wrong (recommendation 7) |
| 25 | Password facts: PC admin <factory default> / user blank; scale admin <factory default>; admin 0 opens all | Manual V3.04A text 869-870, 2382-2383, 3420-3446; `ManagerForm.cs:158-219`; Password id −1 = 11 in all three DBs (`VALIDCHECK_Database`, `Program.cs:74`) | OK (DB password values not printed) |
| 26 | Teaching-video preset names | `Document\Teaching Video\A-Basic\A001…A006`, `B-Details\B007-ConfigWizard-PrintFormat.exe` exist (not executed) | OK |
| 27 | `Program.MergeXML` rebuilds root `Tm.xml` | `Program.cs:649-670` | OK |
| 28 | PC date formats in MenuParameterForm do not reach the scale | `MenuParameterForm.cs:1351-1382, 1509-1539` only set `Settings.gen_dtType_*` | OK |

Not re-verified here (owned by other spec files): barcode `TChar` grammar (the `>…\v` constant segment agrees with `barcode-keys.md` §`>`), LAB/LAS geometry, and the PLU 69-column layout beyond the field-numbering note.
