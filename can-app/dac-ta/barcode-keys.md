# TM-xA v3.10 reverse-engineering spec: barcode formats (BAR) and shortcut keys (SCP / Face)

Area key: `barcode-keys`. Target: our own Vietnamese tool for the JHScale TM-A label scale at Beeftown
(replacement / improvement of `C:\Beeftown\cong-cu\Beeftown_Can_TMA.html`).

Tags used below:
- **CONFIRMED**: seen directly in decompiled code, shipped XML/TSV data, or the vendor manual/help.
- **INFERRED**: deduced from names, UI text or consistency; must be verified with a test print / scan on the real scale.

Abbreviations for evidence paths:
- `SRC\` = `...\scratchpad\tmxa-src\` (decompiled C#). Main files: `SRC\ECS\BarcodeForm.cs`, `SRC\MyBarItemBox\BarItemBox.cs`,
  `SRC\ECS\FaceForm.cs`, `SRC\ECS\FaceAutoFilterForm.cs`, `SRC\ECS\RDS.cs` (TMS reader), `SRC\ECS\SaveForm.cs` (TMS / serial writer),
  `SRC\ECS\NetForm.cs` (Ethernet), `SRC\ECS\WizardForm.cs`, `SRC\ECS\PluForm.cs`, `SRC\ECS\Program.cs`, `SRC\ECS\ECSDataSet.cs`, `SRC\app.config`.
- `INST\` = `C:\Users\khanh\Downloads\tma co hsd2\tma co hsd2\` (read-only install). `Combo.xml`, `Tm.xml`, `Lang.xml`, `LabelItem.xml`,
  `ScPLU\*.xml|jpg`, `Config\en\_ECS.TMS`.
- `DUMP\` = `...\scratchpad\mdb\dump\` (TSV dumps of the Access DBs).
- `MAN304` = `INST\Document\User Manual\Printing Serial Scale V3.04A.pdf` (page = PDF page).
- `CHM` = `INST\en\TM-xA.chm` (extracted copy at `...\scratchpad\work-label\chm\`), pages `DT-Set/Barcode.htm`, `TM-Set/Shortcut Key.htm`.

---------------------------------------------------------------------------------------------------

## 0. Executive summary (answers in one screen)

1. **BAR line** = `BAR<TAB>BarID<TAB>Name<TAB>Format<TAB>Check<TAB>Num1<TAB>Num2<TAB>TChar<TAB>` (CONFIRMED `SaveForm.cs:1078`, `RDS.cs:933-955`).
   `TChar` is a mini-language: a list of 6..32 **elements**, each normally 4 chars `<SourceLetters><Length><Shift><Overflow>`
   (e.g. `B201` = Spec Flag, 2 digits, shift 0, overflow "cut off"). Sources A..Z,BA..BP = 0..41 (base-26 letters).
2. **Formats** (Combo.xml): 0 Default(auto), 1 EAN13, 2 EAN8, 3 UPC-A, 4 UPC-E, 5 EAN-128C(number), 6 Code-128C(number), 7 ITF25,
   8 PDF417, 9 EAN-128(char), 10 Code-128(char), 11 QR, 12 Code39-Std, 13 Code39-Ext, 14 Code93. No "EAN-18" format ID exists:
   the "18-digit" barcodes are 17 data digits + auto check digit printed as Code-128C/EAN-128 (Wizard types 25551 etc.).
3. **Vietnamese "20 + 5-digit code + 5-digit value + check"** = factory barcode **ID 2** `B201F501K500` (flag from Spec2 = `20`,
   5-digit **Item Code**, 5-digit **total price**, EAN-13 check). It is the factory default (Spec1 = 2, Spec2 = 20).
   For **weight** instead of total there is no factory ID: create a user ID 10..99 with `B201F501J500A000A000A000`
   (exactly what the vendor Wizard writes as ID 28 "QS-Item", `DUMP\A_en_Default\Barcode.tsv`).
4. **PLU barcode choice**: `BarT1`/`BarT2` = barcode **format number** (BarID) for **Bill 1 / Bill 2**; `BarF1`/`BarF2` = barcode **flag
   number** for Bill 1 / Bill 2. 0 = use system (Spec1/Spec2 for item label, Spec6/Spec7 for sum label). "Bill 1/Bill 2" are two
   independent print documents (e.g. label on gap paper vs receipt on plain paper, Spec56). It is NOT weighed-vs-counted and NOT front/back.
5. **SCP line** = `SCP<TAB>PageID<TAB>KeyID<TAB>PLUID<TAB>` (CONFIRMED `RDS.cs:788-804`, `SaveForm.cs:1006`).
   PageID 0 = first layer (no Shift), 1 = Shift layer (manual shows `scPLU 0-01` for SC1 and `1-01` for Shift+SC1), 2 = third layer
   (exists in PC data; access method on the scale not documented). KeyID = number printed on the key (1..63 on KA/KAB). PLUID = PLU
   **number** (not item code); **negative PLUID = function key** (-41 = Shift, -15 = Cash/Print ...); 0 = empty.
   **[verified-add]** The physical keyboards also number their programmable function-area keys, continuing after the letter keys:
   pole keyboard (KAB, 63 letter keys) has **SC64..SC73** = Shift, Auto Mode, Manual Weight, Paper Type, Re-Print, -%, -Num, @Price,
   T-Sale, Drawer; bench keyboard (KAD, 40 letter keys) has **SC41..SC48** = @Price, T-Sale, ±%, Auto Mode, CCard, Drawer, Shift, Re-Print
   (CONFIRMED from the V3.04A manual keyboard pictures, extracted as `...\scratchpad\manuals_img\kb_pole.png` / `kb_bench.png`, PDF p.12;
   manual p.13: "【SCxx】on the right side are preset shortcut keys for additional functions"). This explains the page-0 KeyIDs 64..73 in
   `DUMP\B_ECS\Face.tsv`. The PC editor (ScPLU XMLs) cannot address them, but a TMS SCP row can: never write `SCP 0 64..73` by accident
   (it would remap Shift/Drawer...).
6. **Our tool's KEY_LABELS** (1..26 = A..Z, 27 SP, 28 `<` ... 63 IME) is CONFIRMED for the 63-key keyboards **KA and KAB** with one
   correction: **key 58 is `_` (underscore)**, not an em dash. It is WRONG for the 40/30/10-key keyboards (KAD, KB, KC, KD, KE, KF), see 2.5.
7. **Decode for inventory**: split the digits by the TChar field lengths, verify the GS1 mod-10 check, then
   `weight_kg = int / 10^Spec208`, `money = int * 10^shift / 10^Spec209`, `count = int / 10^Spec196`. Factory Spec208 = 3, Spec209 = 2,
   Spec196 = 3. For Beeftown (prices entered in thousands of VND with 3 decimals) `VND = money * 1000`. The factory 5-digit total overflows at
   1,000,000 VND (with Spec209 = 2) and the barcode is then NOT printed (overflow code 0).
   **[verified-fix]** "the barcode is then NOT printed" is INFERRED, not CONFIRMED: the only sources are Combo "0 Not Print", MAN304 p.63
   "0: not print" and the CHM advice; whether the whole symbol or only the field is dropped is untested (see section 4).
   **[verified-fix]** "verify the GS1 mod-10 check" only holds for EAN/UPC and for odd-length data in Code-128C/EAN-128/ITF: MAN304 p.62
   Note 2 says a check digit is auto-added to Formats 5/6/7 only "if length of number is odd number". An even-length 128 payload (e.g.
   `B201F501J500K600` = 18 data digits) is therefore INFERRED to carry **no** check digit; the decoder must know the layout's data length.

---------------------------------------------------------------------------------------------------

## 1. Barcode formats (BAR section, Barcode table)

### 1.1 Barcode record: DB columns and TMS line (CONFIRMED)

DB table `Barcode` (`SRC\ECS\ECSDataSet.cs:265-293`):

| # | Column | Type | Default | Notes |
|---|--------|------|---------|-------|
| 1 | BarID  | int, PK, AutoIncrementSeed 10 | - | 0..99. 0 = "System Default"; 1..9 factory; 10..99 user (`app.config` minUserBarcodeID = 10, maxBarcodeID = 99; `BarcodeForm.cs:253-264, 283-291, 774`). |
| 2 | Name   | string(255) | "" | PC-side label only ("Barcode names would usually not be printed", MAN304 p.62). |
| 3 | Format | int | 0 | Symbology, see 1.2. |
| 4 | Check  | int | 0 | Check-digit policy, see 1.3. |
| 5 | Num1   | int | 0 | "Constant 1", 0..999,999,999 (`BarcodeForm.cs:793`), printed by source C. |
| 6 | Num2   | int | 0 | "Constant 2", 0..999,999,999 (`BarcodeForm.cs:783`), printed by source D. |
| 7 | TChar  | string | `A000A000A000A000A000A000` | Data-format description (element list), see 1.4. |

TMS line (all three writers are identical: TMS file `SaveForm.cs:1078`, serial `SaveForm.cs:1421`, Ethernet `NetForm.cs:3479`, Wizard `WizardForm.cs:1904`):

```
BAR\t{BarID}\t{Name}\t{Format}\t{Check}\t{Num1}\t{Num2}\t{TChar}\t
```

Sample (`INST\Config\en\_ECS.TMS` lines 28-39, UTF-8 BOM, CRLF, trailing tab on every row):
```
DWL	BAR	
BAR	0	System Default	0	0	0	0	A000A000A000A000A000A000	
BAR	1	Barcode-1	0	0	0	0	B201E500K500A000A000A000	
BAR	2	Barcode-2	0	0	0	0	B201F501K500A000A000A000	
...
BAR	9	B-Sum 3	0	0	0	0	B501L700A000A000A000A000	
END	BAR	
```
Section rules (CONFIRMED): optional `CLR\tBAR\t` + `CLR\tEND\t` before `DWL\tBAR\t` when the user ticks "clear" (`SaveForm.cs:1067-1071`,
`NetForm.cs:3465-3466`). When the PC runs with "User" rights (`flag`/`protect`), rows with BarID < 10 are neither written
(`SaveForm.cs:1074`) nor imported (`RDS.cs:950`).
**[verified-fix]** That filter is dead code in v3.10: the variable is hard-coded `false` at every call site - `bool flag = false;` in
`SaveToFile` (`SaveForm.cs:935`) and `SaveToSerial` (`SaveForm.cs:1243`), `bool protect = false;` in `OpenFromFile` (`SaveForm.cs:1609`),
and `Args[0] = false` for every Ethernet download (`NetForm.cs:860, 1033, 5789, 6180`, read as `flag2` at `NetForm.cs:3241`). So the PC
**always** writes and imports BAR rows 0..9 (including row 0 "System Default"). The reader parses `TChar = array[7]` **raw** (no `\v`->newline conversion,
`RDS.cs:945`), so a TChar may legally contain `0x0B` (vertical tab) bytes (see element type `>`). Keep TChar bytes verbatim.
**[verified-add]** Real data proves it: `DUMP\B_ECS\Barcode.tsv` row 28 "QS-Item" (Format 0, Check 0, Num1 0) has TChar made only of six
Const-Text elements, `>82<0x0B>>40027<0x0B>>0<0x0B>>0<0x0B>>00<0x0B>>09<0x0B>` (checked with `od -c`: each element ends in a raw `\v`).
Note the asymmetry: BAR `Name` is written raw (`SaveForm.cs:1078`) but read through `Program.ParseString` (`\v` -> CRLF, `Program.cs:224`),
while `TChar` is read raw - if TChar went through ParseString the `>` terminators would be destroyed.
**[verified-add]** The sample `INST\Config\en\_ECS.TMS` has **no SCP section**, and its section order (DPT, CLS, PLU, UNT, BAR, LAB, SAL, TMS, TMT,
`END ECS`) differs from `SaveToFile` (TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB, SAL, FNT, BMP, VIP; `SaveForm.cs:947-1198`, no UNT), so it was
not produced by this PC writer; section order is evidently not significant.

On the scale itself (MAN304 p.52 menu table, p.61-62 example): `P25 BAR.00 NoSet` (number), `BAR.01 Name`, `BAR.02 Type` (=Format), `BAR.03 Check`,
`BAR.04 NCon1`, `BAR.05 NCon2`, `BAR.06 Des` (= TChar, "edit a text with the length of 24").

### 1.2 Format codes (CONFIRMED `INST\Combo.xml` `<Barcode_Format>` from line 439; identical in `INST\en\Combo.xml`)

| Format | Symbology | Notes |
|---|---|---|
| 0 | Default | "auto select the most reasonable barcode format according to valid number digit" (MAN304 p.62 Note 1): 12 digits -> EAN13, 7 -> EAN8, 11 -> UPC-A, 6 -> UPC-E (suggested digit counts from MAN304 Table 5-1). Other lengths: INFERRED Code-128C/EAN-128. |
| 1 | EAN13 | 12 data digits + check |
| 2 | EAN8 | 7 + check |
| 3 | UPC A | 11 + check |
| 4 | UPC E | 6 |
| 5 | EAN-128C (Number Mode) | numeric GS1-128; odd length -> one EAN/UPC-style check digit auto-appended (MAN304 p.62 Note 2). **[verified-add]** even length -> no check digit (INFERRED from the same note) |
| 6 | Code-128C (Number Mode) | same rule as 5 |
| 7 | ITF25 | same rule as 5 |
| 8 | PDF417 | 2D |
| 9 | EAN-128 (CHAR Mode) | alphanumeric |
| 10 | Code-128 (CHAR Mode) | alphanumeric |
| 11 | QR | 2D; Spec456 = QR version (0..31), Spec457 = QR bar size (0..6, 0 = default 3) (`INST\Tm.xml`) |
| 12 | Code39-Std | |
| 13 | Code39-Ext | |
| 14 | Code93 | |

Discrepancy: the 2008 CHM (`DT-Set/Barcode.htm`) lists an old numbering (1 EAN8, 2 EAN13, 5 ITF-6, 6 ITF-14, 7 EAN-128, 8 Code128).
It is obsolete; the software Combo.xml and the V3.04A manual Table 5-1 (1 = EAN13, 2 = EAN8) agree. Use Combo.xml.

**"EAN-18"**: no such format ID. The vendor Wizard's 18-digit types (25551, 26451, 24651, 16551, 15651: flag + code + value + value +
check) produce 17 data digits; with Format 0 the scale prints them as a 128-type code and appends the check digit (Note 2). INFERRED that
Default chooses Code-128C/EAN-128 for 17 digits; set Format 6 (or 5) explicitly to be safe.
**[verified-add]** The vendor Wizard itself writes **Format 0** for every "cash-register" type, including the 17-digit ones
(`barcodeRow.Format = 0;` `WizardForm.cs:1808`), so the vendor relies on Default auto-selection producing a scannable 18-digit symbol; which
symbology it is (128C vs EAN-128 vs ITF) is still not documented.

### 1.3 Check codes

- Combo.xml `<Barcode_Check>` (line 499): **0 = "Try to Add Check Digit"**, **3 = "Never Add Check Digit"** (only these two in the PC UI). CONFIRMED.
- MAN304 p.63 Table 5-2 (older firmware wording): 0 All checks, 1 End check, 2 Middle check, 3 Not check; "EAN13 is verified by End Check no
  matter which kind of check is selected". CONFIRMED text.
- Spec139 "EAN/UCC CRC" 0 Standard / 1 Non-standard (`INST\Tm.xml`); the Wizard also writes 2 = "Character '0'" (`WizardForm.cs:1749`,
  `Lang.xml pw_Character_0_`). Meaning of 1/2: INFERRED (1 = vendor-specific checksum, 2 = check position filled with literal '0').
  Use 0.

### 1.4 TChar grammar (CONFIRMED `SRC\MyBarItemBox\BarItemBox.cs:300-455`)

TChar = concatenation of elements. The PC shows `BarNum` = 6..32 elements (`BarcodeForm.cs:856-859`, `BI_Max = 32`); on load it shows
max(6, index of last non-"not print" element) (`BarcodeForm.cs:432-448`); on save it concatenates exactly `BarNum` elements
(`BarcodeForm.cs:489-501`). Unused elements are `A000`.

Element encodings (`StringOut`, `BarItemBox.cs:410-455`; parser `StringIn_Ori`, `BarItemBox.cs:300-395`):

| First char | Kind | Encoding | Size |
|---|---|---|---|
| `A`..`Z` | numeric data source 0..41 | `<letters><N2 length 0-9><N3 shift 0-9><N4 overflow 0-9>` | 4 chars (5 chars for sources >= 26) |
| (source 39) | Measure char | `BN<c><w>0` if count-char `c` is a digit, else `BN-<c><w>` | 5 chars |
| `>` | Const Text (source -3) | `>` + literal text + `\v` (0x0B terminator) | variable |
| `?` | Custom (source -2) | `?` + 3-digit number 000..999 ("Detail") | 4 |
| `@` | Text (source -1) | `@` + group digit (0..3) + 2-digit item **index** | 4 |
| `=` | Symbol (source -4) | `=` + group digit (0..2) + 2-digit item **index** | 4 |

Letters are base-26 with A = 0 (`BarItemBox.cs:432-441`, parser loop `BarItemBox.cs:356-361`): 0 `A`, 1 `B`, ... 25 `Z`, 26 `BA`,
27 `BB` ... 41 `BP`. The prefix chars equal `(char)(65 + source)` for negative sources (`BarItemBox.cs:476-479`: -1 `@`, -2 `?`, -3 `>`, -4 `=`).

Numeric element fields (Lang.xml / CHM / MAN304 p.63 Table 5-3):
- **N2 Length** ("Length:", max `maxBarcodeLength` = 9, `BarItemBox.cs:610`): number of digits printed.
- **N3 Shift** ("Shift:", max `maxBarcodeShift` = 9, `BarItemBox.cs:589`): "The digit abandoned in the right side of the data ... source data
  is 499. Print 499 if the shift is 0 while print 49 if shift is 1" (CHM `DT-Set/Barcode.htm`). CONFIRMED = integer division by 10^shift.
- **N4 Overflow** (Combo.xml `<Barcode_Over>` line 399): 0 Not Print, 1 Cut Off Print, 2 Fill With 0, 3 Fill With 9, 4 Extend, 5..9 Reserved.
  CHM: "We suggest ... '0 - don't print' to important information such as U.Price, T.Price, weight and amount in order to prevent unnecessary
  losses" -> 0 suppresses the barcode (INFERRED: whole barcode, not only the field). Which end "Cut Off" keeps: INFERRED low-order digits.
  "Extend": INFERRED prints all digits (variable length, only sensible for 128/QR).
- Zero left-padding to N2 digits: INFERRED (required for fixed-length EAN; consistent with all factory layouts summing to 12 digits).
- UI shows N2/N3/N4 only for sources 1..29, 38, >= 40 (`BarItemBox.cs:176`); the "(Decimal)" sources 30..37 still serialize three digits.
  **[verified-add]** Because those controls are hidden but still serialized (`StringOut`, `BarItemBox.cs:452`), a PC-made Decimal element is
  normally `BE000`..`BL000` (length 0). The firmware must therefore print (Decimal) sources as variable-length text with a decimal point
  (INFERRED); a decoder cannot split them by fixed length (only usable in CHAR-mode 128 / QR with separators).
- **[verified-add]** Element parse/serialize are index-based for N4 too: the parser sets `N4_ComboBox.SelectedValue` but `StringOut` writes
  `N4_ComboBox.SelectedIndex` (`BarItemBox.cs:385, 452`); harmless because `<Barcode_Over>` values 0..9 are in index order (Combo.xml:399-438).

Firmware compatibility (CONFIRMED `BarcodeForm.cs:471-487`, `BarItemBox.cs:239-246`, Lang `pw_SupportbydeviceafterV238A` =
"Support by device after V2.38A"): more than 6 elements, any source >= 26, or any `>`/`=` element needs firmware >= V2.38A.
Beeftown firmware V3.14E8 / V3.15 is fine.

#### 1.4.1 Numeric data sources (CONFIRMED Combo.xml `<Barcode_Source>` line 215; letters from the rule above; MAN304 p.63)

| Val | Letters | Source | Val | Letters | Source |
|---|---|---|---|---|---|
| 0 | A | Not Print | 21 | V | Print Time: Second |
| 1 | B | Spec Flag | 22 | W | SID |
| 2 | C | Const Num 1 (Barcode.Num1) | 23 | X | Device Number |
| 3 | D | Const Num 2 (Barcode.Num2) | 24 | Y | PLU Tax |
| 4 | E | PLU Number (PLUID) | 25 | Z | Sale T.Tax |
| 5 | F | PLU Item Code (PLU.Remark, PLU col 2) | 26 | BA | Shelf Term |
| 6 | G | PLU Index Barcode (PLU.Index, col 3) | 27 | BB | Shelf Date: Year |
| 7 | H | PLU Flag | 28 | BC | Shelf Date: Month |
| 8 | I | PLU U.Price | 29 | BD | Shelf Date: Day |
| 9 | J | PLU Weight/Pcs | 30 | BE | (Decimal) PLU U.Price |
| 10 | K | PLU T.Price (this item's total) | 31 | BF | (Decimal) PLU Weight/Pcs |
| 11 | L | Sale T.Price (transaction total) | 32 | BG | (Decimal) PLU T.Price |
| 12 | M | Sale T.Count | 33 | BH | (Decimal) Sale T.Price |
| 13 | N | Sale T.Weight | 34 | BI | (Decimal) Sale T.Count |
| 14 | O | Add-up Times | 35 | BJ | (Decimal) Sale T.Weight |
| 15 | P | Salesman No. | 36 | BK | (Decimal) PLU Tax |
| 16 | Q | Print Date: Year | 37 | BL | (Decimal) Sale T.Tax |
| 17 | R | Print Date: Month | 38 | BM | FID (bill serial number, = Report.mdb Log.FID) |
| 18 | S | Print Date: Day | 39 | BN | Measure: Count / Weight character |
| 19 | T | Print Time: Hour | 40 | BO | Price without Tax |
| 20 | U | Print Time: Minute | 41 | BP | Total Price without Tax |

Notes: MAN304 Table 5-3 misprints "L Add-up Times" (it is O = 14). "Spec Flag" (B) = the flag number of the barcode slot being printed
(Spec2 for Bill-1 item, Spec7 for Bill-1 sum, Spec12/17 for Bill 2, Spec352/357 for PTR) - INFERRED from the factory layouts
(`B201` with Spec2 = 20 prints "20"; `B701` with Spec7 = 2099999 prints "2099999"). "PLU Flag" (H) is INFERRED to be PLU.BarF1/BarF2
(the only per-PLU "barcode flag"; PLU.Flag col 65 is a bit field for measure/fixed-weight/percent-tare, `PluForm.cs:2261-2293`).
Source 39 prints one character telling whether the item was sold by count or by weight (UI labels "Count" / "Weight" from the Display
string "Measure:Count|Weight", `BarItemBox.cs:184-209`) - the character values are user-chosen. Sources 30..37 (Decimal) INFERRED print
the value with its decimal separator (for CHAR-mode 128 / QR).
**[verified-add]** Source X "Device Number" = Spec40 (0..9999999, Tm.xml). Format 7 (ITF25) has its own frame settings: Spec36 "ITF25 frame
mode" (0 none / 1 up-down / 2 around), Spec37 frame width, Spec38 left/right blank width (Tm.xml).

#### 1.4.2 Sub-tables for `@` (Text) and `=` (Symbol) elements (CONFIRMED Combo.xml SimCombo lines 1184-1244)

The 1-digit group and the 2-digit item are **list indexes** (`C2_ComboBox.SelectedIndex`, `C3_ComboBox.SelectedIndex`,
`BarItemBox.cs:420-427`), not the list "values".

- `@` Text groups ("All Text"): 0 PLU Text {0 PLU Name, 1..7 Text1..Text7, 8 Index Barcode}; 1 System String / "Global Text" {0 Store Name,
  1 Device Name, 2 Prefix of Money Unit, 3 Suffix, 4..11 Device Postil 1..8, 12/13 Reserved, 14 Industry Mark, 15 Wireless SSID,
  16 Wireless Password, 17/18 Reserved, 19 Server's Domain Name, 20..27 Custom Text 1..8}; 2 Print Format Text {0..15 Text 0..15};
  3 Other Text {0 Salesman Name, 1 Serviceman Name, 2..5 Custom Info 1..4, 6 MAC}.
  Example: Wizard "special barcode" writes `@008` = PLU Index Barcode as text (`WizardForm.cs:1877`).
- `=` Symbol groups ("All Symbol"): 0 Partition {0 Normal area flag, 1 Loop area flag, 2 Loop quit flag}; 1 Checksum {index 0 "EAN/UPC Auto",
  1..31 "EAN/UPC n+1", **32..35 = Pre-PCDV4, Post-PCDV4, Pre-PCDV5, Post-PCDV5** (list values 50..53, but the index is what is stored)};
  2 Unreadable bytes {0 Enter(\r\n), 1 Enter(\r), 2 Enter(\n)}.
  INFERRED meanings: "Loop area" repeats the enclosed elements once per sold item (used for QR sum codes); "EAN/UPC n+1" appends a GS1
  mod-10 digit computed over the previous n digits; PCDV = GS1 price-check-digit variants for 4/5-digit prices.

### 1.5 Factory and vendor-Wizard barcodes (CONFIRMED data)

Factory IDs 0..9 (identical in `DUMP\A_ECS`, `DUMP\A_en_Default`, `INST\Config\en\_ECS.TMS`; names differ in B_ECS; the manual
Table 5-4 p.63-64 shows overflow 0 instead of 1 on the item-code field for IDs 2/3 = older firmware):
**[verified-fix]** The manual differs on **IDs 2, 3, 5 and 6** (`B201F500K500`, `F700K500`, `B201F400K600`, `F600K600`: every item-code
element has overflow 0), and it names them "B-Item 1..6" (MAN304 p.63-64), not "Barcode-1..6".
**[verified-add]** The factory set also differs per region: `INST\Config\es|zh-CHS|zh-CHT\_ECS.TMS` ship IDs 1..6 with **L (Sale T.Price)
instead of K** and overflow 0 on the key (`B201E500L500`, `B201F500L500`, `F700L500` ...), while `pt`/`ru` equal `en`. So the firmware's
built-in IDs 1..9 on the Beeftown scale are not guaranteed to match the PC table; define the barcode you rely on as a user ID 10..99.

| ID | Name | TChar | Digits (flag + key + value) | Use |
|---|---|---|---|---|
| 0 | System Default | A000 x6 | nothing | - |
| 1 | Barcode-1 | `B201E500K500` | 2 flag + 5 PLU number + 5 PLU T.Price | item |
| 2 | Barcode-2 | `B201F501K500` | 2 flag + 5 item code + 5 PLU T.Price | item (factory default Spec1 = 2) |
| 3 | Barcode-3 | `F701K500` | 7 item code + 5 T.Price | item |
| 4 | Barcode-4 | `B201E400K600` | 2 flag + 4 PLU number + 6 T.Price | item |
| 5 | Barcode-5 | `B201F401K600` | 2 flag + 4 item code + 6 T.Price | item |
| 6 | Barcode-6 | `F601K600` | 6 item code + 6 T.Price | item |
| 7 | B-Sum 1 | `B701L500` | 7 flag + 5 Sale T.Price | sum (factory default Spec6 = 7, Spec7 = 2099999) |
| 8 | B-Sum 2 | `B601L600` | 6 flag + 6 Sale T.Price | sum |
| 9 | B-Sum 3 | `B501L700` | 5 flag + 7 Sale T.Price | sum |

All have Format 0 (-> EAN-13, 12 data digits) and Check 0. Manual guidance (MAN304 p.23): pick 1/2/3 (5-digit price) or 4/5/6 (6-digit price)
to match the POS; "x... is the flag code which is reserved for scale in POS system" and in-store prefixes must be 20-29 (MAN304 p.46 §4.10.2).

Vendor Wizard (`WizardForm.cs:1473-1635, 1745-1910`) writes user IDs **28 "QS-Item"** and **29 "QS-Sum"** and sets Spec1/6 = 28/29:
**[verified-fix]** Precisely (`WizardForm.cs:1745-1789`): in "cash-register" mode (Barcode_Main 0) it writes TMS 139, **Spec1 = 28**, Spec2 = item flag,
optionally 209/208/196; then **Spec6 = 28** and Spec7 = item flag when not in Prepack mode; **Spec6 = 29** only in Prepack mode with more than
one item (Spec7 = item flag if QR or "sum uses item flag", else the sum flag; Spec456 = QR version when QR). In the "special" (Main 1:
`@0ii` PLU text or `>const\v`) and "manual edit" (Main 2: raw TChar) modes it writes Spec1 = Spec6 = 28 and only ID 28, with Check = 3 when
"Try to add check digit" is off. ID 28 `Num1` = the Wizard's "Constant" value even when source C is unused (hence `Num1 = 99999` in
`DUMP\A_ECS` / `A_en_Default` rows 28/29; harmless). `DUMP\A_ECS` row 28 is `B201F501K500` (total), `A_en_Default` row 28 is `B201F501J500`
(weight): both are Wizard outputs with different options.
- Types (`WizardForm.cs:2485-2525`, names = digit counts of flag/key/value/value/check): 2551 (2+5+5+1), 2641, 2461, 1651, 1561 (EAN-13) and
  25551, 26451, 24651, 16551, 15651 (17 data digits + 1 check = 18 digits, Code-128 family).
  Built as `B<n>01` + (`F<n>01` item code | `E<n>00` PLU no | `C<n>00` constant Num1) + (`J<n>00` weight/pcs | `K<n>00` total) [+ 4th part].
  Example A_en_Default ID 28 = `B201F501J500A000A000A000` (2 flag + 5 item code + 5 weight).
- Sum as EAN (`GetBarcode_SumEAN`): flag length += key length, key -> `A000`, K -> L (sale total), J -> M (total count) or N (total weight).
  **[verified-fix]** The flag/key merge happens only when `Barcode_CR_Flag_SumUsingItem` is false (`WizardForm.cs:1598`); the Wizard default is
  **true** (`WizardForm.cs:2037`), in which case the sum barcode keeps the item layout (e.g. `B201F501L500...`) and Spec7 = the item flag.
  When merged, only chars 4-5 change (`ct[4]='A'`, `ct[5]='0'`), so the key becomes `A001` for an item-code key (still "not print").
  Also the Wizard default sum barcode is **QR** (`Barcode_CR_QR = true`, QR version 5, `WizardForm.cs:2042-2044`).
- Sum as QR (`GetBarcode_SumQR`, Format 11): `=001` + item elements + `=100` + [`=002`] + `=200` + `=000`, e.g.
  `=001B201F501J500=100=200=000` (A_en_Default ID 29): per sold item one line "flag+code+value+EAN check" followed by CRLF; option
  "Last Enter do not output" inserts `=002` (loop-quit) before the CRLF (`WizardForm.cs:1589-1593`, Lang `pw_LastEnterDoNotIncluded`).
  Semantics INFERRED; string CONFIRMED.
- Wizard defaults (`WizardForm.cs:2033-2055`): type 2551, item flag 20, sum flag 2099999, money decimals 2, weight decimals 3, pcs decimals 3.
  **[verified-add]** Only the money decimals are written by default (`Barcode_CR_Decimal_Money_Use = true`, weight/pcs `_Use = false`), i.e. a
  Wizard run writes `TMS 209 2`. Wizard preview confirms the conversions: money label `1234 / 10^dec`, weight `255 / 10^dec`, and "1 pcs" shown as
  `10^PcsDecimal` (`WizardForm.cs:7699-7704`).

### 1.6 How the scale fills a numeric element (per-element pipeline)

1. Take the source value in its display unit (money with Spec202/203 decimals, weight in kg with Spec201 decimals, count in pcs).
2. Convert to an integer by the barcode decimal specs (CONFIRMED MAN304 p.93 and `WizardForm.cs:7699-7704` preview):
   - money (I, K, L, Y, Z, BO, BP): `int = value * 10^Spec209` ("Decimal Point of Money In Barcode Print", factory 2);
   - weight (J for weighed PLU, N): `int = value * 10^Spec208` (factory 3; "For number 1.533, if number here is 2, print 153 ... If 3, print 1533");
   - count (J for counted PLU, M): `int = value * 10^Spec196` (factory 3, i.e. 1 pcs -> `1000`; set 0 to print plain pieces).
   Rounding vs truncation of the fractional remainder: UNKNOWN (the manual example is ambiguous).
3. Drop `shift` rightmost digits (integer divide by 10^shift). CONFIRMED (CHM).
4. If the integer has more digits than `length` -> overflow rule N4 (1.4). Else left-pad with zeros to `length` (INFERRED).
5. Concatenate all elements (non-numeric elements add their text/symbol output).
6. Symbology by Format (0 = auto by digit count), check digit by Check (0 = add when the symbology needs / odd 128 length), Spec139.
7. The label element that draws the barcode is LabelItem **Flag1 = 0** (`INST\LabelItem.xml`: Flag2 0 "Readable Code" / 1 "No Readable Code";
   **Flag3 0 = "System"** (use the barcode selected by PLU/Class/Spec, see 1.7) or **10..29 = force that BarID** on this label element).
   Bar geometry: Spec31 narrow bar dots (0..9), Spec32 wide bar dots (0..19), Spec33 readable-text font (0..2); PTR equivalents 411..413.

### 1.7 How a PLU chooses its barcode (BarT/BarF)

CONFIRMED structure:
- PLU TMS columns (0-based field index in the `PLU` line, `RDS.cs:867-872`, `SaveForm.cs:1060`): **8 LabelID1, 9 BarT1, 10 BarF1, 11 LabelID2,
  12 BarT2, 13 BarF2**, 14 ClassID. Same six fields exist on Class (`CLS` line: ClassID, Name, DeptID, LabelID1, BarT1, BarF1, LabelID2, BarT2,
  BarF2 - `RDS.cs:829-837`, `SaveForm.cs:1041`).
- UI meaning (`PluForm.cs:1086-1116`, Combo.xml `PLU_Col`, MAN304 p.50 "P23 PLU.08 BarT1: Barcode number of 1st bill; PLU.09 BarF1: Barcode flag
  of 1st bill; PLU.11 BarT2; PLU.12 BarF2"): BarT = combo box bound to the Barcode table (`ValueMember = BarID`, `PluForm.cs:2964-2970`),
  BarF = NumericUpDown 0..9999 (`PluForm.cs:3388, 3430`). The Bill-2 columns are hidden unless setting `Enable_PLU_Bill2` (default False,
  `app.config:653`).
- System slots (Tm.xml Spec_Info, values from `INST\Config\en\_ECS.TMS` / `DUMP\*\Spec.tsv`):

| Spec | Meaning | Factory |
|---|---|---|
| 0 / 5 | Bill 1 item / sum print format | 1 / 4 |
| **1** | Bill 1: Item Barcode Format (0 = none) | **2** |
| **2** | Bill 1: Item Barcode Flag | **20** |
| 6 | Bill 1: Sum Barcode Format | 7 |
| 7 | Bill 1: Sum Barcode Flag | 2099999 |
| 11 / 12 | Bill 2 item barcode format / flag | 0 / 0 |
| 16 / 17 | Bill 2 sum barcode format / flag | 0 / 0 |
| 351/352, 356/357 | PTR (network printer) item/sum barcode format/flag | 0 |
| 54 | Print Format and Barcode Select: 0 default/default, 1 Spec fmt+default bc, 2 class fmt+default bc, 10 default fmt+Spec bc, 11 Spec/Spec, 12 class fmt+Spec bc, 20 default fmt+class bc, 21 Spec fmt+class bc, 22 class/class | 0 |
| 56 | Print Function: 0 all as setting, 1 Bill 1, 2 Bill 2, 3 PTR, 4 forbidden, 5 bill 1 if gap paper / bill 2 if plain, 6 reverse | 0 |
| 196 / 208 / 209 | decimals of count / weight / money in barcode | 3 / 3 / 2 |

- Precedence (INFERRED from MAN304 p.23 "If sale PLU has been set for a specific print format (not 0), system would use the print format. If ...
  0, the print format would be Spec000", and the Spec54 wording): with Spec54 = 0 ("default"), a non-zero PLU BarT1 wins, otherwise Spec1 (item
  label) / Spec6 (sum label). Spec54 = 1x forces Spec, 2x forces Class values. Same for BarF vs Spec2/Spec7 (INFERRED).
- **[verified-add]** Spec54 is a two-digit code: **tens digit = barcode source, units digit = print-format source**, each 0 "default" /
  1 "Spec" / 2 "class" (all nine values listed in `INST\Tm.xml` Spec_Info 54; e.g. 1 = "Use Spec print format, default barcode", 10 = "Use
  default print format, Spec barcode"). Spec54 is not documented in MAN304 at all, so what "default" means (PLU-then-Spec) stays INFERRED.
- **[verified-add]** Ranges: MAN304 p.84-85 gives Spec2/7/12/17 = 0~9999999 (factory Spec7 = 2099999, 7 digits) although `Tm.xml` labels them
  "(0~99999)"; PTR flags 352/357 and internal-scan flags 123..129 are labelled 0~9999999. The PC limits PLU/Class BarF to **0..9999**
  (`PluForm.cs:3388, 3430`), so a per-PLU flag can be at most 4 digits. BarT combo lists the whole Barcode table incl. row 0 "System Default"
  (`PluForm.cs:2965-2970, 3377-3384`).
- Beeftown today: every PLU line written by our tool has BarT1 = BarF1 = 0 (`PLU_TEMPLATE` in `Beeftown_Can_TMA.html`), so the scale prints
  whatever Spec1/Spec2 say (factory: ID 2 + flag 20). All PLUs in all DB dumps also have 0 (`DUMP\*\PLU.tsv`).
- Weighed vs counted is not a BarT1/BarT2 split: J prints weight for weight PLUs and pieces for count PLUs, label items can be conditional
  (LabelItem Print 2 "Weight Item Print", 3 "Count Item Print", Combo.xml `LabelItem_Print`), and source 39 can mark which one it is.

### 1.8 The Vietnamese in-store weighed-item barcode

EAN-13 = 12 data digits + 1 check. In-store prefixes 20..29 (MAN304 p.46).

| Wanted layout | How to get it | TChar |
|---|---|---|
| `20` + 5 item code + 5 **total price** + check | **Factory ID 2** (default): Spec1 = 2, Spec2 = 20..29 | `B201F501K500A000A000A000` |
| `20` + 5 PLU number + 5 total + check | Factory ID 1 | `B201E500K500...` |
| `20` + 5 item code + 5 **weight** + check | user ID (10..99), Format 1 or 0, Check 0; set Spec1 = that ID | `B201F501J500A000A000A000` |
| `2` + 5 item code + 6 total + check | user ID; Spec2 = 2 (1-digit flag) | `B101F501K600A000A000A000` |
| `2` + 6 item code + 5 total + check | user ID | `B101F601K500A000A000A000` |
| 18-digit: `20` + 5 code + 5 weight + 5 total + check (Code-128C) | user ID, Format 6 | `B201F501J500K500A000A000` |
| 18-digit: `2` + 5 code + 5 weight + 6 total + check | user ID, Format 6 (Wizard "15651"-like) | `B101F501J500K600A000A000` |

**[verified-fix]** The Wizard's "15651" is 1 flag + 5 key + **6** (3rd part) + **5** (4th part) digits (`WizardForm.cs:1534-1539` sets
`array[9]='6'`, `array[13]='5'`), i.e. `B101F501J600K500` (weight option) or `B101F501K600J500` (total option). The row above
(`B101F501J500K600`, weight 5 + total 6) is a valid user layout but is not what the Wizard's 15651 produces.

Worked examples (check digits computed with GS1 mod-10; values assume Beeftown pricing: unit price 845.000 = 845,000 VND/kg,
weight 0.215 kg, total 181.675 = 181,675 VND, item code 10001; assumes rounding of 18167.5 to 18168, which is UNKNOWN):

| Case | Specs | Data digits | Printed |
|---|---|---|---|
| Factory ID 2 | Spec209 = 2 | `20 10001 18168` | `2010001181682` (decodes to 181.68 -> 181,680 VND) |
| Weight ID | Spec208 = 3 | `20 10001 00215` | `2010001002154` (0.215 kg) |
| `B101F501K600` | Spec2 = 2, Spec209 = 2 | `2 10001 018168` | `2100010181688` |
| ID 2 with Spec209 = 1 | 100-VND units | `20 10001 01817` | `2010001018179` |
| 18-digit weight+total | Spec208 = 3, Spec209 = 2 | `20 10001 00215 18168` | `201000100215181684` |
| Sum label ID 7 | Spec7 = 2099999 | `2099999 18168` | `2099999181683` |

Overflow warning (Beeftown sells premium beef): with the factory ID 2 and Spec209 = 2 the 5-digit total holds at most 999.99 money units =
999,990 VND. A 1.2 kg pack at 876,000 VND/kg (1,051,200 VND) needs 6 digits -> overflow code 0 -> no barcode (INFERRED consequence).
Options: (a) 6-digit total (`B101F501K600`, max 9,999,990 VND at Spec209 = 2); (b) keep ID 2 but Spec209 = 1 (100-VND units, max 9,999,900 VND)
together with Spec100 rounding "Common Rounding For Last 2 Digits" so the printed total equals the barcode total; (c) 18-digit Code-128 with both
weight and total (best for inventory).

**[verified-add]** (d) Because Beeftown money has 3 decimals of a 1,000-VND unit, a total such as 181.675 is a whole number of VND. Setting
**Spec209 = 3** (which is also what MAN304 p.93 recommends: "Generally suggest Spec208=Spec201, Spec209=Spec203") makes the barcode money
field equal to **exact VND** (`181675`) with no rounding question, but needs 6 digits (`K600`, max 999,999 VND) or 7 (`K700`, max
9,999,999 VND): e.g. EAN-13 `B101F501K600` (max 999,999 VND) or `F501K700` (no flag, not recommended for in-store) or 18-digit
`B201F501J500K600` (even length, see the check-digit note in 0.7). Conversely, a technician who followed that manual advice with the factory
5-digit ID 2 would get overflow above 99,999 VND, i.e. **almost no beef label would carry a barcode** - check Spec209 on the real scale first.
(Arithmetic CONFIRMED; firmware rounding/overflow behaviour still INFERRED.)

---------------------------------------------------------------------------------------------------

## 2. Shortcut keys (SCP section, Face / FaceList tables, ScPLU layouts)

### 2.1 Tables (CONFIRMED `ECSDataSet.cs:2672-2684`, `ECSDataSet.cs:12213-12220`, DUMP)

- **FaceList** (ScaleID string(255) PK, Layout string(50), PageMode string(50)). One row per named key map. "ScaleID" is only a **name**
  (default "Default", created by `Program.Public_Cal_NewSCP`, `Program.cs:614-630`; `RDS.cs:1276-1283` creates it if the table is empty).
  Layout = `ScPLU_KA|KAB|KAD|KB|KC|KD|KE|KF`, PageMode = `Page 1|D-Page-TB|D-Page-BT|T-Page-TB|T-Page-BT`.
  All dumps: `Default  ScPLU_KA  Page 1` (`DUMP\A_ECS\FaceList.tsv`).
- **Face** (ScaleID, KeyID int, PageID int, PLUID int; PK = ScaleID+KeyID+PageID). New face = 128 rows: PageID 0..1 x KeyID 0..63, PLUID 0
  (`Program.cs:621-629`). Rows for page 2 are added on demand when a key is assigned in a T-Page mode (`FaceForm.cs:663-673`).
  `DUMP\B_ECS\Face.tsv` also has page-0 keys 64..73 and page-2 keys 1..63 (imported from somewhere; see Unknowns).
- **Which face is active**: none is tied to a device. The PC keeps the last selected face name in setting `ScFile_ScaleID` (user.config;
  `FaceForm.cs:583-590`, `INST\user_config.bck` = "Default"). The Save-to-TMS dialog, the Ethernet dialog and the Face editor each have a
  face combo box; only Face rows whose ScaleID equals the selected name are sent (`SaveForm.cs:1004`, `NetForm.cs:1012, 3350`).
  **Layout and PageMode are PC-only** (used to draw the overlay and map clicks); they are never written to the TMS/scale.

### 2.2 SCP line and write rules (CONFIRMED)

```
DWL\tSCP\t
SCP\t{PageID}\t{KeyID}\t{PLUID}\t
END\tSCP\t
```
- Reader: `RDS.cs:788-804` (array[1] = PageID, [2] = KeyID, [3] = PLUID). Serial / Ethernet upload from the scale use the same columns
  (`SaveForm.cs:1835-1848`, `NetForm.cs:2605-2636`, command `UPL\tSCP\t`).
  **[verified-add]** SCP rows are imported only when a face name is chosen (`if (sface.Length > 0)`, `RDS.cs:789`) and are stored under that
  name, whatever face produced them. Uploaded rows go into a fresh DataSet that is then `Merge`d into the DB (`NetForm.cs:3129`), so keys the
  scale returns but the PC never created (e.g. KeyID 64..73, page 2) are simply added - which is how `DUMP\B_ECS\Face.tsv` ends up with
  page 0 = keys 0..73, page 1 = 0..63, page 2 = 1..63 (key 0 only on the PC-created pages 0/1). That pattern is consistent with a scale table of
  page 0 keys 1..73 and pages 1/2 keys 1..63 (INFERRED; origin of the B_ECS rows not recorded).
- Writers: TMS file `SaveForm.cs:995-1010` and Ethernet `NetForm.cs:3339-3359`: **no `CLR SCP`**; if "clear" is ticked every row of the face is
  written (including PLUID 0), otherwise only rows with PLUID != 0. Serial writer adds `CLR\tSCP\t` + `CLR\tEND\t` when "clear" is ticked
  (`SaveForm.cs:1337-1341`). INFERRED consequence: rows that are not sent keep their old value on the scale, so to empty a key write
  `SCP\tp\tk\t0\t` explicitly.
- Section order written by the PC: TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB, ... (`SaveForm.cs:940-1100`).
- PLUID is the **PLU number** (PLU col 1), not the item code. Manual: "The number of input PLU must exist" (MAN304 p.29 §3.2).
- **Negative PLUID = function key** `-code` (CONFIRMED `FaceForm.cs:637-656` resolves `-PLUID` in "Shortcut Fuction"; `SelForm.cs:524, 552`
  stores `-(int)Fuction_ComboBox.SelectedValue`). Function codes (Combo.xml SimCombo "Shortcut Fuction" line 1244 = MAN304 §7.4 p.99):
  1..10 Number 0..9, 11 "00", 68 "000", 12 Clear, 13 Cancel, 14 Accu/Confirm, 15 Cash/Print, 16 PLU, 17 F-Prog, 18..21 V1..V4, 22 Amend, 23 ×,
  24 Feed, 25 SetZero, 26 SetTare, 27 Sale, 28 Prog, 29 Account, 30 Time, 31 -%, 32 -Num, 33 @Price, 34 TSale, 35 CashBox, 38 Manual Weight,
  39 Paper Type, 40 Pre/Re Print, 41 Shift, 44 Print2, 45 CCard, 46 MoveDot, 47 U.W. Sample, 48 Weight Accu, 49 Division, 50 UnitChange,
  51 Lock Tare, 52 Auto Mode, 53 Normal Mode, 54 Batch Mode, 55 PrePack Mode, 56 LockPLU Mode, 57 AutoPrint Mode, 58 Service Fee, 59 ←V→,
  60 Mode, 62 On/Off, 63..65 Payment 1..3, 66 VIP, 67 Other Transactions, 69 BuyBack: FID, 70 Weight Sensor, 71 Store Payment,
  76..79 Custom Info 1..4. (On the scale this is P15 "scFuc", MAN304 §5.3.5.)
- KeyID 0 exists in the default rows but no layout cell maps to it (every `Data_Offset` starts at 1): ignore key 0.

### 2.3 Layers (PageID)

- PageID 0 = first layer (direct press), 1 = Shift layer. CONFIRMED by MAN304 p.29 / p.56: `【SC1】 -> "scPLU 0-01"`, `【Shift】【SC1】 -> "scPLU 1-01"`
  (display format `page-key PLU`), and `【Shift】: Shift key used for extending PLU shortcut key` (MAN304 p.14).
- PageID 2 = third layer: exists in the PC (T-Page modes use Data_Page 2) and in B_ECS data; how the operator reaches it on the scale is not
  documented (INFERRED: Shift pressed twice / a second shift function). Treat as optional.
- Spec81 "ScPLU Fast-Prog" 0 forbidden / 1 allowed (F-Prog + SCxx on the scale); Spec88 "Dummy PLU Shortcut".
- **[verified-add]** Spec88 meaning: `Tm.xml` "Dummy PLU Shortcut(0=Disable,Other=PLU in 1st Shortcut,firmware>V2.50E)"; MAN304 p.88 (older
  0/1 form): "【SC1】refer to PLU101, 【Shift】【SC1】refer to PLU201". So with Spec88 != 0 the scale can map keys to PLUs arithmetically
  without SCP rows (INFERRED: SCk -> Spec88 + k - 1, Shift layer offset +100); it is a second, independent confirmation that page 1 = Shift.
  Factory value 0 in every dump. On the scale, PLU keys and function keys are programmed in separate menus (P14 "scPLU", P15 "scFuc", both
  addressed `page-key`, MAN304 p.56-57); the PC merges both into SCP with functions as negative values.

### 2.4 Keyboard models and key numbering (CONFIRMED `INST\ScPLU\*.xml`, `*_SL.jpg`, Combo.xml `ScPLU_Layout` line 1127)

KeyID of a cell = `Data_Offset + col + row * Num_X` inside each `<ScPLU_Section>`; PageID = `Data_Page` (`FaceForm.cs:345-356, 714-730`).

| Layout | Combo.xml description | Keys / layer | Grid (SL image) | KeyID numbering |
|---|---|---|---|---|
| ScPLU_KA | 08's Bar Code Printing Scale | 63 | two blocks: 5x7 (keys 1..35) + 4x7 (36..63) | left block row-major 1..35, then right block 36..63 |
| ScPLU_KAB | 12's/15's/17's Bar Code Printing Scale (Pole) | 63 | one 9x7 block drawn as 5 + 4 columns | same as KA (row 1 = 1,2,3,4,5,36,37,38,39) |
| ScPLU_KAD | 12's/15's Bar Code Printing Scale (No Pole) | 40 | 8x5 | row-major 1..40 |
| ScPLU_KB | Price Printing Scale | 30 | 6x5 | row-major |
| ScPLU_KC | Cash Register Scale | 40 | 10x4 | row-major |
| ScPLU_KD | Cash Register | 30 | 6x5 | row-major |
| ScPLU_KE | A1 Indicator | 10 | 2x5 | row-major |
| ScPLU_KF | A2 Indicator | 40 | 8x5 | row-major |

Position formula for KA/KAB (row r = 0..6, visual column c = 0..8): `key = c < 5 ? 1 + 5r + c : 36 + 4r + (c - 5)`.

**[verified-add]** Numbered function-area keys (not in any ScPLU XML, CONFIRMED from MAN304 p.12 keyboard pictures):

| Keyboard (manual picture) | ScPLU layout | Letter/PLU keys | Numbered function keys (preset legend) |
|---|---|---|---|
| Picture 1-1 "barcode label printing scale (Pole)" | KAB (9 contiguous columns) | SC1..SC63 | SC64 Shift, SC65 Auto Mode, SC66 Manual Weight, SC67 Paper Type, SC68 Re-Print, SC69 -%, SC70 -Num, SC71 @Price, SC72 T-Sale, SC73 Drawer |
| Picture 1-2 "(Bench)" | KAD (8x5) | SC1..SC40 | SC41 @Price, SC42 T-Sale, SC43 ±%, SC44 Auto Mode, SC45 CCard, SC46 Drawer, SC47 Shift, SC48 Re-Print |

Un-numbered keys (Sale, Prog, Account, Time, Feed, F-Prog, Zero, Tare, digits, V1..V4, PLU, Cash/Print, Back, Cancel, Accu/Confirm, Amend, ×)
are fixed. INFERRED: a numbered function key keeps its printed function while its SCP value is 0 (B_ECS keys 64..73 are all 0) and can be
re-assigned with a negative function code or, possibly, a PLU. MAN304 p.13 says the right-side presets are "not available for user to change
... now", so treat SC64+ as read-only in our tool.
Direct PLU keys = keys/layer x layers used (PageMode): Page 1 = 1 layer, D-Page = 2, T-Page = 3 (e.g. KAB: 63 / 126 / 189).
Page modes (Combo.xml `ScPLU_Page` line 1159): each physical key cell is split horizontally into 2 or 3 stripes on the printed overlay;
`-TB` = page 0 in the top stripe, `-BT` = page 0 in the bottom stripe (Start_Y values in the XML). Single page uses `*_SL.jpg` (key numbers
and letters), multi-page uses the blank `*_DL.jpg` grid. PC defaults: `defaultSCP = ScPLU_KA`, `defaultSCP_Page = Page 1` (`app.config:196, 226`).

### 2.5 Key legends per model (read from the `*_SL.jpg` images) and check of our KEY_LABELS

- **KA / KAB (63 keys)**: 1..26 = a/A..z/Z, 27 SP, 28 `<`, 29 `=`, 30 `>`, 31 `!`, 32 `?`, 33 `.`, 34 `,`, 35 `;`, 36 `+`, 37 `-`, 38 `*`, 39 `/`,
  40 `(`, 41 `)`, 42 `{`, 43 `}`, 44 `[`, 45 `]`, 46 `‘`, 47 `“`, 48 `@`, 49 `#`, 50 `&`, 51 `$`, 52 `%`, 53 `^`, 54 `` ` ``, 55 `:`, 56 `|`, 57 `\`,
  **58 `_`**, 59 `~`, 60 End, 61 Delete, 62 Insert, 63 IME.
  -> `KEY_LABELS` in `Beeftown_Can_TMA.html` (line ~586) matches except index 58 (`'—'` should be `'_'`; index 37 uses U+2212 minus, cosmetic).
- **KAD, KC, KF (40 keys)**: 1..26 a..z, 27 SP, 28 `<(`, 29 `>)`, 30 `=$`, 31 `+-`, 32 `*/`, 33 `:“`, 34 `.%`, 35 `,;`, 36 `!?`, 37 End, 38 Del,
  39 Insert, 40 IME.
- **KB (30 keys)**: 1..26 a..z, 27 End, 28 Delete, 29 Insert, 30 IME.
- **KD (30 keys)**: 1..26 a..z, 27 SP, 28 Del, 29 Insert, 30 IME.
- **KE (10 keys)**: 1..6 a..f, 7 End, 8 Del, 9 Insert, 10 IME.
Our tool's belief "SCP level 0 = first layer" is CONFIRMED; "key 1..63 -> A..Z etc." is CONFIRMED only for KA/KAB.
The tool reads only page-0 rows and the first key per PLU, skipping PLUID <= 0 and key 0 - correct behaviour.
**[verified-add]** Re-checked against the images: KA and KAB `_SL.jpg` legends are identical (58 = `_`, 37 = ASCII `-`), and all 40/30/10-key
legends above match the `KAD/KB/KC/KD/KE/KF_SL.jpg` images. `KEY_LABELS` has 64 entries (index 0..63), so a PLU found on SC64..SC73 would show
"—"; if the tool ever writes SCP rows it must refuse KeyID > 63 (pole) / > 40 (bench) or it may overwrite the Shift/Drawer function keys.

### 2.6 PC editor behaviour worth copying / avoiding

- Click a cell -> SelForm: pick a PLU, a function (negative), or Clear (writes 0) (`FaceForm.cs:705-744`).
- "Auto Allocation" (`FaceForm.cs:797-908`): clears the face, then fills cells in XML section order (page 0 block by block, then page 1 ...)
  with PLUs in table order; filters from FaceAutoFilterForm: all / PLU-number range / item-code range (PLU.Remark) / class / dept.
  Quirks: the filter dialog only opens when there are >= 2 faces (`FaceForm.cs:804`); "Dept" sets Sort = 3 (class filter) instead of 4
  (`FaceAutoFilterForm.cs:500-505`), so dept filtering is broken.
- "Picture"/"Print" render the overlay with PLU names (optionally PLU numbers) at `Rect_X x Rect_Y` per cell (`FaceForm.cs:328-363`) for
  printing and sliding under the key membrane - a useful feature for our tool (print Vietnamese names on the key sheet).

---------------------------------------------------------------------------------------------------

## 3. Decoding the printed barcode in Beeftown's POS / inventory app

### 3.1 What the decoder must know (per scale, read from the scale's TMS export)

1. The barcode actually used: Spec54, PLU BarT1 (col 9) / Class BarT1, else Spec1 (item) and Spec6 (sum); the matching `BAR` row TChar
   (factory IDs 1..9 are in firmware even if the TMS has no BAR section).
2. The flags: Spec2 (item), Spec7 (sum), or PLU BarF1 (col 10) when used.
3. Decimals: Spec208 (weight), Spec209 (money), Spec196 (count); money meaning: Spec202/203 and Beeftown's convention
   (prices entered as thousands of VND with 3 decimals, e.g. `845,0` = 845.000 = 845,000 VND; see PART 1 of our tool).
4. Rounding: Spec100 (single total) / Spec101 (sum total).

### 3.2 Algorithm (EAN-13 / Code-128 numeric)

```
digits = scanned string (digits only)
verify GS1 mod-10: weights 3,1,3,1... from the rightmost data digit; last digit = (10 - sum%10) % 10
if len==13 and digits[0]=='2': in-store scale barcode (prefixes 20..29), else external EAN -> look up PLU.Index / product master
pos = 0
for element in parse(TChar):                 # grammar of 1.4
    if element.source == A (not print): continue
    field = digits[pos : pos + element.length]; pos += element.length
    n = int(field) * 10**element.shift          # undo shift (low digits lost)
    B/H (flag)      -> must equal the configured flag (e.g. "20"); use it to recognise the format
    E (PLU number)  -> PLU col 1
    F (item code)   -> PLU col 2 (Beeftown "Mã hàng", 5 digits)
    J (weight/pcs)  -> kg = n / 10**Spec208  (count PLU: pcs = n / 10**Spec196)
    K/L (totals), I (unit price) -> money = n / 10**Spec209 ; VND = money * 1000 (Beeftown convention)
    Q/R/S, BB/BC/BD -> dates ; BM -> FID ; X -> device number
check digit is the last digit (not part of any element)
```
**[verified-fix]** "check digit is the last digit" is true for EAN-13/EAN-8/UPC and for odd-length payloads in Formats 5/6/7; for an
even-length Code-128C/EAN-128/ITF payload no check digit is appended (MAN304 p.62 Note 2, INFERRED), and with Check = 3 ("Never Add") none
is added at all. Decode rule: `expected_len = sum(element lengths)`; if `len(scan) == expected_len + 1` verify/strip the GS1 digit, if
`== expected_len` there is none.
**[verified-add]** Overflow sentinels: if a layout uses overflow 3 "Fill With 9", an all-9 field means "value too large", not a real value;
overflow 2 "Fill With 0" gives all zeros. Item code 0 in a scanned internal barcode is special on the scale (Spec121 "Deal method with
ItemCode=0": 0 search user PLU / 1 by-weight T-Sale PLU / 2 by-count T-Sale PLU; factory 1 per MAN304 p.90) - keep Beeftown item codes >= 1.
Sum labels: flag `2099999` (Spec7) + total -> a whole-transaction amount, no item identity.
QR sum (Format 11, `=001...=100=200=000`): split the QR text on CRLF; each line is a flag+code+value+check item string decoded as above.

### 3.3 Recommendations for Beeftown (to verify with a test print)

- **[verified-fix]** `B201F501J500K600` below is 18 data digits (even), so by MAN304 Note 2 it gets **no** check digit (INFERRED); if a check
  digit is wanted use the 17-digit `B201F501J500K500` (5-digit total, max 999.99 money units at Spec209 = 2) or `B101F501J500K600` (1-digit flag).
- Inventory needs **weight per item code**. Best: a user barcode (e.g. ID 10) `B201F501J500K600` + Format 6 (Code-128C), or at least a
  weight EAN-13 `B201F501J500` (price then comes from the POS master). If the POS needs price in the EAN-13, use `B101F501K600` with Spec2 = 2
  or keep ID 2 with Spec209 = 1 + Spec100 rounding to 100 VND.
- Keep item codes at 5 digits and unique; the barcode carries PLU.Remark, never the name.
- Optional traceability: FID (BM) and Device Number (X) can be printed in a Code-128/QR barcode; Report.mdb Log/LogItem are keyed by
  MAC + FID (`DUMP\B_Report\Log.tsv`, `LogItem.tsv`), so a label can be matched to the scale's sale log.
- The scale can read its own internal barcodes back (Spec120 = 3 "deal with all", Spec122..129 = up to 4 internal formats + flags; Spec122 = 0
  -> uses Spec1/Spec2) - the POS must use the same TChar layout.

### 3.4 Implications for `Beeftown_Can_TMA.html`

1. Parse the `BAR` section and Specs 1/2/6/7/54/196/208/209 and show the real barcode digits in the label preview (replace the fake bars).
2. Offer a barcode wizard (the 5 EAN-13 + 5 18-digit presets of 1.5) writing a `BAR` row with ID 10..99, Spec1/Spec2 and optionally PLU cols 9/10.
3. Warn when `max(total) * 10^Spec209` exceeds the price field length (the scale silently prints no barcode).
4. Fix KEY_LABELS[58] = `_`; make legends model-dependent (2.5); allow editing SCP (write explicit `0` to clear; negative = function).
5. Preserve TChar bytes verbatim (may contain 0x0B).

---------------------------------------------------------------------------------------------------

## 4. Unknowns / to verify on the real scale

- Rounding vs truncation when scaling money/weight by 10^Spec20x (18167.5 -> 18167 or 18168?).
- Exact behaviour of overflow codes: does 0 suppress the whole barcode or only the field; which digits "Cut Off" keeps; "Extend".
- Whether source B uses PLU BarF1 when non-zero (vs source H), and the exact precedence rules of Spec54 / PLU / Class.
- Which symbology Format 0 picks for 17 digits (Code-128C vs EAN-128).
- Meaning of Spec139 = 1 ("Non-standard") and 2 ("Character '0'"), of the `?nnn` "Custom" element, and whether firmware reads the Symbol
  Checksum **index** 32..35 as PCDV (the PC stores indexes).
- How to reach SCP page 2 on the keyboard; whether the firmware table has more than 63 keys per page (B_ECS has page-0 keys 64..73).
  **[verified-add] partly resolved:** yes for page 0 - the pole keyboard physically has numbered function keys SC64..SC73 (bench: SC41..SC48),
  see 2.4; page 2 access is still undocumented.
- Which physical keyboard the Beeftown TM-A has (KAB 63 keys vs KAD 40 keys); the INF/model string seen is "TM-xA UA006 V3.15x" (no keyboard id).
  **[verified-add]** Practical test: pole model -> the Shift key carries the small number 64; bench model -> Shift carries 47.
- Whether factory barcode IDs 1..9 can be overwritten by a TMS `BAR` row.
  **[verified-add] partly resolved:** the PC always sends rows 0..9 (the "user rights" filter is hard-coded off, 1.1), and MAN304 p.61 says
  1~9 "User cannot edit them" (on the keyboard). Whether firmware accepts or ignores BAR 1..9 from a TMS is still untested - so use ID 10..99.
- Which symbology Format 0 picks for 17 digits: **[verified-add]** the vendor Wizard writes Format 0 for its 17-digit types (1.2), so Default
  does produce a 128-family/ITF code for them; the exact symbology is still unknown.
- **[verified-add]** Whether an even-length 128C payload really gets no check digit (MAN304 Note 2 wording) - test with a scanner.
- **[verified-add]** Actual Beeftown values of Spec1/2/6/7/54/88/100/203/208/209: only factory values are in the dumps (Spec1 2, Spec2 20,
  Spec6 7, Spec7 2099999, Spec54 0, Spec88 0, Spec100 0, Spec196 3, Spec203 2, Spec208 3, Spec209 2, Spec139 0, Spec120 3 in A_ECS, B_ECS and
  A_en_Default); read them from the scale's own `A_000.TMS` before choosing a layout.

---------------------------------------------------------------------------------------------------

## Verification log

Adversarial re-check (independent re-reading of the decompiled source, install XMLs/images, TSV dumps and the V3.04A manual text).
Outcome codes: OK = claim confirmed; FIX = claim corrected in place ([verified-fix]); ADD = new fact added ([verified-add]).

| # | Claim checked | Evidence re-opened | Outcome |
|---|---|---|---|
| 1 | BAR line = `BAR BarID Name Format Check Num1 Num2 TChar` + trailing tab; reader indexes 1..7 | `SaveForm.cs:1078, 1421`, `NetForm.cs:3479`, `WizardForm.cs:1904`, `RDS.cs:933-955`; `_ECS.TMS` lines 28-39 (`od -c`: BOM + CRLF) | OK |
| 2 | Barcode table columns / defaults (BarID seed 10, TChar default `A000`x6) | `ECSDataSet.cs:265-293`; all 4 `Barcode.tsv` headers | OK |
| 3 | BarID ranges 0 / 1..9 / 10..99; Num1/Num2 max 999,999,999; BarNum 6..32 | `app.config:46,73`, `BarcodeForm.cs:253-291, 774, 783, 793, 856-857`, `BI_Max = 32` (`BarcodeForm.cs:17`) | OK |
| 4 | "User rights" filter hides BAR 0..9 | `SaveForm.cs:935, 1243, 1609`; `NetForm.cs:860, 1033, 5789, 6180, 3241` - flag always `false` | FIX (dead code; rows 0..9 always sent) |
| 5 | Format / Check / Overflow / Source code lists | `Combo.xml:215-398, 399, 439, 499` (all 42 sources + 4 negatives re-listed) | OK |
| 6 | TChar grammar: base-26 letters A=0 (26 = `BA`, 39 = `BN`, 41 = `BP`), `>text\v`, `?nnn`, `@gii`, `=gii`, index-based sub-lists | `BarItemBox.cs:300-395` (parser), `410-455` (serializer), `C2/C3 SelectedIndex`; Combo SimCombo `1184-1219` | OK; ADD N4 index/value note, Decimal sources serialize length 0 |
| 7 | Symbol checksum indexes 32..35 = PCDV (values 50..53) | Combo `Symbol Checksum` list: 32 entries 0..31 then 50..53 | OK |
| 8 | V2.38A gate: >6 elements, source >= 26, `>`/`=` | `BarcodeForm.cs:471-487` (`CheckOld`), `BarItemBox.cs:239-246` (`NewVersionOnly`: ctSource <= -3 or >= 26) | OK |
| 9 | Factory IDs 0..9 TChar | A_ECS / B_ECS / A_en_Default `Barcode.tsv`, `Config\*\_ECS.TMS` | OK; FIX manual diff is IDs 2,3,5,6; ADD es/zh variants use L + overflow 0 |
| 10 | Wizard: IDs 28/29, types, Spec1/6 = 28/29, SumEAN merge | `WizardForm.cs:1473-1600, 1745-1910, 2033-2057, 2485-2525` | FIX Spec6 = 28 unless Prepack multi-item; FIX SumEAN merge only when SumUsingItem = false (default true); FIX "15651" = J600K500 |
| 11 | Real TChar with `\v` in data | `DUMP\B_ECS\Barcode.tsv` row 28 via `od -c` | ADD |
| 12 | PLU TMS columns 8..14 = LabelID1, BarT1, BarF1, LabelID2, BarT2, BarF2, ClassID; CLS columns | `RDS.cs:829-837, 867-874`, `SaveForm.cs:1060` format string counted field by field | OK (no off-by-one) |
| 13 | BarT = combo on BarID, BarF 0..9999, Bill-2 hidden unless `Enable_PLU_Bill2` | `PluForm.cs:1086-1116, 2965-2970, 3377-3388, 3430`, `app.config:653` | OK |
| 14 | Every PLU/Class in dumps has BarT/BarF = 0; tool template writes 0 | PLU.tsv / Class.tsv of 3 DBs (python count); `PLU_TEMPLATE` cols 8-13 in `Beeftown_Can_TMA.html:329` | OK |
| 15 | Spec1/2/6/7/11/12/16/17/54/56/139/196/208/209/456/457 meanings & factory values | `INST\Tm.xml` Spec_Info; `Spec.tsv` x3; MAN304 p.84-85, 93 | OK; ADD Spec54 = 10*barcode + format; ADD Tm.xml "0~99999" label vs 7-digit reality |
| 16 | Spec208 example "1.533 -> 153 / 1533" | MAN304 p.93 | OK (still ambiguous re rounding) |
| 17 | Check-digit arithmetic of all worked examples | recomputed GS1 mod-10 in Python: 2010001181682, 2010001002154, 2100010181688, 2010001018179, 201000100215181684, 2099999181683 | OK |
| 18 | Overflow limits 999,990 / 9,999,990 / 9,999,900 VND | arithmetic | OK; ADD Spec209 = 3 exact-VND option and warning |
| 19 | Check digit always last digit in decoder | MAN304 p.62 Note 2 (odd length only for 5/6/7) | FIX (even-length 128 payloads) |
| 20 | SCP line `SCP Page Key PLU`, reader/writers/upload, no CLR SCP in file/Ethernet writers, serial adds CLR | `RDS.cs:788-804`, `SaveForm.cs:995-1010, 1335-1352, 1825-1850`, `NetForm.cs:2605-2640, 3339-3359` | OK; ADD import only into selected face + Merge behaviour (`NetForm.cs:3129`) |
| 21 | Page 0 = first layer, page 1 = Shift | MAN304 p.29 and p.56 (`scPLU 0-01` / `1-01`), p.88 Spec88 (SC1->PLU101, Shift+SC1->PLU201) | OK (second, independent confirmation added) |
| 22 | Negative PLUID = function; function code list | `SelForm.cs:524, 552`, `FaceForm.cs:460-483, 637-656`, Combo `Shortcut Fuction`, MAN304 §7.4 p.99 | OK (63..65 are "{0}" filled with pw_Payment1..3; manual calls them PayOther-0..2) |
| 23 | Face/FaceList schema, 128 default rows keys 0..63 x pages 0..1, ScFile_ScaleID | `ECSDataSet.cs:2672-2684, 12213-12220`, `Program.cs:614-630`, `WizardForm.cs:7312-7326`, `user_config.bck` | OK |
| 24 | Layout XML geometry, KeyID = Data_Offset + col + row*Num_X, TB/BT stripes | all 8 `ScPLU_*.xml` parsed; `FaceForm.cs:328-363, 705-744` | OK |
| 25 | Key legends per model incl. KEY_LABELS[58] = `_` | viewed `ScPLU_KA/KAB/KAD/KB/KC/KD/KE/KF_SL.jpg`; tool array printed index by index | OK |
| 26 | B_ECS page-0 keys 64..73 "unknown origin" | MAN304 p.12 keyboard pictures (`manuals_img\kb_pole.png`, `kb_bench.png`, zoomed crops in `scratchpad\verify-bk\`) | ADD: SC64..73 (pole) / SC41..48 (bench) numbered function keys |
| 27 | Auto Allocation quirks (filter only with >= 2 faces; Dept uses Sort 3) | `FaceForm.cs:797-908`, `FaceAutoFilterForm.cs:476-515` (Dept -> `Sort = 3`, `P1 = DeptID`, compared to ClassID) | OK |
| 28 | LabelItem barcode element Flag1 0, Flag2 readable/no, Flag3 0 System or 10..29 | `INST\LabelItem.xml` lines 3-121 (Flag3 list = 0,10..29) | OK |

Not re-verifiable offline (left as INFERRED/UNKNOWN in section 4): firmware rounding vs truncation, exact overflow behaviour, B vs H flag
precedence, Spec54 "default" semantics, Spec139 = 1/2, Default symbology for 17 digits, page-2 access, the Beeftown keyboard model and its
real Spec values.
