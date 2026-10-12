# TM-A scale: operation facts, PC-software feature inventory, HSD/date facts

Area key: `manuals`. Written for later translation into a Vietnamese guide (shop staff + manager)
and for deciding which TM-xA features the Beeftown tool must replicate.

## 0. Sources and citation conventions

| Tag | Source | Notes |
|---|---|---|
| **UM p.N** | `Document\User Manual\Printing Serial Scale V3.04A.pdf` (2017.4), *printed* page N | PDF page = N + 11 (printed p.1 = PDF p.12). V2.50A of the same manual is textually the same apart from pagination; not cited separately. |
| **EM §n** | `Easy Manual V2.36L.pdf` (2 pages, key icons rendered as images) | Section numbers of the Easy Manual; p.1 = §1–4, p.2 = §4–13. |
| **ED p.i–vi** | `Direction of Ethernet Connection.pdf` | |
| **CU p.N** | `Characters Printable in U Version.pdf` | Unicode table of the "U" (UTF-8 font) firmware. |
| **CHM:topic** | `en\TM-xA.chm`, decompiled with `C:\Windows\hh.exe -decompile` into `scratchpad\chm\out\` | Old help (mentions V1.60, PLU 10–5999); still useful for PC screens. |
| **file.cs:line** | decompiled source `scratchpad\tmxa-src\ECS\` | |
| **Tm.xml:line / Combo.xml:line / Lang.xml / LabelItem.xml** | top-level XMLs of the install (customised 2026-05) | Tm.xml = the PC software's Spec dictionary. It is newer than the manual; where they differ, see §1.14. |
| Rendered page images | `scratchpad\manuals_img\*.png` (keyboards `kb_pole.png`, `kb_bench.png`, display p16/p17, paper p19–21, menu tree p48, Easy Manual p1/p2, Ethernet p1–6) | |

Tags used below: **CONFIRMED** = seen verbatim in a manual, code or data file. **INFERRED** = my reading or combination of the sources, still to be checked on the real scale.

The ECR manual (`Electronic Cash Register V2.50A.pdf`) has the same structure for the cash-register model. It adds nothing for a label scale and is not cited.

---

## 1. Operating the scale

### 1.1 Safety, environment, daily care (UM p.i; UM p.7–8)
- Use a 3-pin plug with a working earth wire. If you use an extension board, it must be 3-pin too. Do not touch the plug with wet hands. (UM p.i)
- Do not lean on the scale, drop goods on the tray or shock the load cell. Do not exceed the maximum capacity. (UM p.i)
- Keep water off the scale: no rain, no washing. If water gets on it, wipe with a dry cloth. Do not use organic solvents on the case or the panel. For a meat counter: never hose or wet-wipe the scale; use a dry or barely damp cloth (INFERRED advice). (UM p.i)
- Keep the scale away from very cold, hot or wet places. Specs: operation 0–40 °C, storage −20~70 °C, humidity 15–85 %RH, power AC 200–240 V, 47–53 Hz. (UM p.7)
- Do not reach into the label exit: mains voltage is inside. Do not open the scale or its power supply; the capacitors hold charge. Repairs are for the service agent only. (UM p.i)
- Thermal head: never touch it with fingers or sharp tools; clean it only with the cleaning tools supplied. The vendor recommends their own thermal paper, because poor paper leaves deposits and shortens head life. (UM p.i)
- At power-on the tray must be empty and still, otherwise E0.01/E0.02 appears. No key may be held at power-on, otherwise E7.01 appears (UM p.70, p.72). The one exception is the deliberate Feed-hold used for label calibration (§1.9).
- Capacity / division (class III): 6 kg/2 g, 15 kg/5 g, 30 kg/10 g at 1/3000 (UM p.8). Business mode allows 1/6000 (1/7500 for 15 kg) (UM p.11); higher precisions are industrial only and print "*" (Spec213, UM p.12, p.82).

### 1.2 Keyboard (UM p.1–4; images `kb_pole.png`, `kb_bench.png`)
Two TM-A barcode-label layouts exist (UM p.1, Pictures 1-1 and 1-2).

**Pole model** (display on a pole; 12's/15's/17's): 
- Left block: 63 character/shortcut keys, **SC1–SC63**, 9 columns × 7 rows. The number is printed in the key corner. SC1–SC35 are a/A…z/Z plus symbols; SC60–63 are End, Del, Insert, IME.
- Right block, row 1: Sale, Prog, Account, Time, Feed, F-Prog.
- Row 2: Shift(64), Auto Mode(65), Manual Weight(66), Paper Type(67), Re-Print(68), Zero.
- Row 3: -%(69), -Num(70), @Price(71), T-Sale(72), Drawer(73), Tare.
- Rows 4–7: 7 8 9 × **V1/↑** Amend · 4 5 6 **V2/←** **V3/↓** **V4/→** · 1 2 3 PLU Cash/Print · 0 00 Back Cancel Accu/Confirm.

**Bench model** (no pole):
- Left block: 40 keys, **SC1–SC40** (a/A…x/X, y/Y, z/Z, SP, <(, >), =$, +-, */, :", .%, ,;, !?, End, Del, Insert, IME).
- Right block: Sale Prog Account Time Feed Tare Zero F-Prog · @Price(41) T-Sale(42) 7 8 9 × V1/↑ Amend · ±%(43) Auto Mode(44) 4 5 6 V2/← V3/↓ V4/→ · CCard(45) Drawer(46) 1 2 3 PLU Cash/Print · Shift(47) Re-Print(48) 0 00 Back Cancel Accu/Confirm.
- The bench model has **no Paper Type, Manual Weight, Mode or -Num keys** (CONFIRMED from the image). Paper type must therefore be changed with Spec021 (INFERRED consequence).

**Key functions** (UM p.2–4):
- **Sale / Prog / Account**: enter that mode. **Mode**: cycles the three modes, on layouts that have it. The Easy Manual says to press Mode once to get "P1" and twice to get "A1" when a layout has no Prog or Account key (EM §1 note 1, §11 note).
- **Time**: show the clock; press again to go back. **Zero**: re-zero within the allowed range.
- **Tare**: take the current weight as tare. If a number is typed first and the tray is empty, the number is used as tare. Hold 4 s = Lock Tare. (UM p.3)
- **Shift**: gives the second page of PLU shortcut keys, and switches case when typing text. Held (or F-Prog+Shift) while entering a decimal number, it moves the decimal point. (UM p.3)
- **Auto Mode / Pre-Pack / Batch-Print / Auto print / Lock PLU**: special sale modes (§1.5). Hold Auto Mode to open the mode menu; this needs an empty buffer. (UM p.3)
- **Manual Weight**: type a weight; the label then prints "ManWT". Needs Spec077. (UM p.3, p.34)
- **Paper Type** (hold): toggles gap-label / plain paper and changes Spec021. (UM p.3, p.10–11)
- **Re-print**: repeats the last print of the current buffer. It is not stored as a sale and can be forbidden (Spec065). (UM p.3)
- **Feed**: feeds paper. Unprinted buffer data is cleared. (UM p.3)
- **-% / ±%**: percent discount. Watch the decimals: 5 % = 500 with 2 decimals, 5000 with 3. (UM p.3, p.26)
- **-Num**: subtract an amount. **-@ / @Price**: set a fixed price. **@Price** is also the quick "save new default price" key (Spec083). (UM p.3, p.20)
- **T-Sale**: typed number = unit price of a temporary by-weight item. With Spec073=1 it converts a 500 g price into a kg price. (UM p.3, p.22)
- **×**: quantity for by-count items, or a temporary by-count sale. In Prog, × + number + Confirm jumps straight to step number N. (UM p.3, p.38)
- **Amend**: edit the sale buffer in Sale mode; save in Prog. Held in Sale = sale-record inquiry. (UM p.3, p.33)
- **V1–V4**: four customer buffers. **The same keys are the arrows ↑ ← ↓ →** used in Prog and Account menus (CONFIRMED from the images). The Easy Manual moves to the next step with **V4/→** (EM §1.2).
- **Back**: delete the last digit. **PLU**: recall a PLU by the typed number. **Cash/Print**: pay and print. **Cancel**: clear or go back. **Accu/Confirm**: add to the buffer, or confirm. **Drawer**: open the cash drawer. **CCard**: reserved.
- **F-Prog**: works like Ctrl/Alt, held together with another key (UM p.2–3). F-Prog+PLU = PLU quick edit; F-Prog+SCxx = assign a shortcut; F-Prog+Prog = Spec quick edit; F-Prog+Tare = show gross; F-Prog+Amend (in record inquiry) = mark as return; F-Prog+Confirm (stock) = subtract.
- **Beeps**: one short beep = OK. One long + two short = error, and the display shows Ex.xx. For a "long press", hold 4 s until the second beep. (UM p.2, p.29)
- **Text entry** (UM p.4–5): SC keys type letters. Amend = save text; Cancel = leave without saving; Confirm = pick a character in UTF8/pinyin IME; End = delete from the cursor to the end (the manual advises pressing End before retyping a name); Del; Insert toggles insert/overwrite; IME cycles En-1 (lower case) / En-2 (upper case) / UTF8 (U firmware: type the Unicode number, then Confirm) / Code (machine code); ←/→ move the cursor. The display shows four windows: IME, position, neighbouring characters, input.
- **PLU shortcut numbering on the scale**: `scPLU p-kk`, where p = shift page (0 = no Shift, 1 = Shift) and kk = key number (UM p.18, p.45). This matches the TMS `SCP` rows our tool reads with `f[1]==='0'` (Beeftown_Can_TMA.html:428; CONFIRMED consistent).
  - [verified-add] TMS row layout is `SCP<TAB>PageID<TAB>KeyID<TAB>PLUID<TAB>` (SaveForm.cs:1006). PageID 0 = the page reachable without Shift: the single-page layout "Page 1" in `ScPLU\ScPLU_KAB.xml` / `ScPLU_KA.xml` / `ScPLU_KAD.xml` uses only `Data_Page` 0, and the factory PC DB maps page 0 keys 1..N to PLU 1..N (`mdb\dump\A_en_Default\Face.tsv`). A third page (PageID 2) exists in "triple page" mode (`T-Page-*` sections; B_ECS Face.tsv has 63 rows with PageID 2). CONFIRMED.
  - [verified-add] Caution for the guide: the Easy Manual screenshot shows `F14 SCPLU 1-01` for an un-shifted a/A key (EM §2, image `Easy_Manua_p1.png`), while UM p.18/p.45 show `0-01` for SC1 and `1-01` for Shift+SC1. The on-screen page digit therefore differs between firmware generations; the TMS PageID is 0-based either way. Tell staff to read the key number (the part after the dash), not the page digit.
  - [verified-add] Key numbering on the pole keyboard is NOT row-major across 9 columns: SC1–SC35 fill the left 5×7 block row by row (1–5, 6–10, …, 31–35) and SC36–SC63 fill the right 4×7 block (36–39, 40–43, …, 60–63) (`kb_pole.png`; `ScPLU_KAB.xml` sections `Num_X=5,Num_Y=7,Data_Offset=1` and `Num_X=4,Num_Y=7,Data_Offset=36`). The bench keyboard is a plain 8×5 grid, SC1–SC40 row-major (`ScPLU_KAD.xml` `Num_X=8,Num_Y=5`). The tool's `KEY_LABELS` (Beeftown_Can_TMA.html:586–587) follows the **pole / 08's 63-key** labels (36 '+', 37 '−', … 60 End); key 58 is printed '_' (underscore) on the keycap, the tool shows '—'.
- **Function-key remap (P15 scFuc)**: any SC key can be given a function code from UM p.88 §7.4, for example 76 = Custom Info 1 (UM p.46). The full code list is in UM p.88 and `Combo.xml:1245` ("Shortcut Fuction"): 1–11 digits, 12 Clear, 13 Cancel, 14 Accu/Confirm, 15 Cash/Print, 16 PLU, 17 F-Prog, 18–21 V1–V4, 22 Amend, 23 ×, 24 Feed, 25 SetZero, 26 SetTare, 27 Sale, 28 Prog, 29 Account, 30 Time, 31 -%, 32 -Num, 33 @Price, 34 TSale, 35 CashBox, 38 Manual Weight, 39 Paper Type, 40 Pre/Re Print, 41 Shift, 44 Print2, 46 MoveDot, 50 UnitChange, 51 Lock Tare, 52 Auto Mode, 53–57 Normal/Batch/PrePack/LockPLU/AutoPrint mode, 58 Service Fee, 59 ←V→, 60 Mode, 66 VIP, 67 Other Transactions, 68 "000", 76–79 Custom Info 1–4, and others.
  - [verified-fix] Off-by-one in the digit codes: code **1 = digit 0**, 2 = digit 1 … **10 = digit 9**, 11 = "00", and **68 = "000"** (`Combo.xml:1245` "1|Number:0|2|Number:1|…|10|Number:9|11|Number:00|68|Number:000"). So "1–11 digits" means the keys 0–9 and 00, shifted by one. Other codes in the same list not named above: 45 CCard, 47 U.W. Sample, 48 Weight Accu, 49 Division, 62 On/Off, 69 Buy Back: FID, 70 Weight Sensor, 71 Store Payment.

### 1.3 Display (UM p.5–7; images p16, p17, EM)
- Four numeric windows: **Tare | Weight/Pcs | Change/Unit Price | Total Price**. In Prog these show *F/P-menu | step (e.g. PLU.04) | step name (e.g. PriCE) | value* (EM screenshots).
- Indicators: Zero, Stable, Lock Tare, Lock PLU, Auto Mode, Manual Weight, Gap Paper, NET, Shift, Sale, Prog, Account, Change, Unit Price, V1–V4, Discount, Single, Sum (UM p.6).
- Idle sale screen = **Sale + Sum** lit. A PLU recalled = **Sale + Single** lit. Quick-edit menus should be started from idle (UM p.16).
- Five-window models add a 160×32 dot-matrix LCD. It shows the time, an advert or the accumulation when idle, and the PLU name when a PLU is recalled. Spec190–195 control it (UM p.7, p.81).
- The 7-segment digits can only show A–Z, 0–9 and '-'. Other characters show as an underline; an overline means an extended character; three bars are the calibration prompt (UM p.7).

### 1.4 Modes (UM p.2–3, p.36, p.64)
Sale (idle / PLU / accumulated), Prog (menus P1–P5), Account (menus A1–A8). **The manual has no P6–P9.** A Prog menu has only P1–P5, and Account has A1–A8. **P15** (function-key remap) sits under P1 but is not drawn in the menu tree (UM p.46).

### 1.5 Special sale modes (UM p.29–31; Spec078/079/277)
- Mode 0 **Normal**.
- Mode 1 **Batch print**: print N copies of one item label; enter N after pressing Print.
- Mode 2 **Prepack**: by-weight only. PLU locked; a label prints automatically each time the weight is stable; weight must go back to zero between items.
- Mode 3 **Lock PLU**: the PLU stays after the sale; no accumulation.
- Mode 4 **Auto print**: prints when the weight is stable.

A single press of Auto Mode goes to the mode set in Spec078 (default 2 = Prepack); press again to go back to normal. Holding Auto Mode shows "Mode 0 Normal"; type 0–4 or use ←/→ and Confirm. Spec079 enables that menu; Spec277 sets the mode at power-on.
**Beeftown relevance:** prepack mode is the natural mode for weighing and labelling meat trays in bulk (INFERRED).

### 1.6 Complete Prog / Account menu tree

**Navigation** (UM p.36–38): Prog shows "P1 TMSet". Press 1–5 to jump to P1–P5, or use ←/→ and Confirm. Inside a menu: →/← = next/previous step; ↑/↓ = next/previous valid value (and, where no value is being edited, the same as ←/→); × then a number then Confirm = jump to step N; digits enter values; Back deletes a digit. **Amend = save and go up one level** (in DTSet, save and go back to step 0 ready for the next number). **Cancel = go up without saving.** Sale returns to selling.

```
Prog
├─ P1 TMSet (scale parameters)
│  ├─ P11 Time        YYYY MM DD hh mm ss W-n (W-0 = Sunday); ←/→ move cursor, digits, Amend (UM p.44; EM §12)
│  ├─ P12 Spec        SP.000…SP.249 (+ higher: 250–457); ←/→ only visits "level 0" Specs; × + number reaches level 1;
│  │                  levels 2–3 (measurement/hardware) cannot be reached (UM p.19–20, p.44)
│  ├─ P13 String      ST.000 ShopN, ST.001 ScaleN, ST.002 MnyPre, ST.003 MnySuf, ST.004–011 bill texts 1–8,
│  │                  ST.012–019 special texts (14 industry mark, 15 Wi-Fi SSID, 16 Wi-Fi password, 19 server domain),
│  │                  ST.020–027 custom texts 1–8 (UM p.38, p.88)
│  ├─ P14 scPLU       press SCxx (or Shift+SCxx), type the PLU number, Confirm, next key…, Amend (UM p.45)
│  └─ P15 scFuc       press SCxx, type a function code (UM p.88), Amend (UM p.46)
├─ P2 DTSet (working data)
│  ├─ P21 Dept        DPT.00 number (user range 10–99), DPT.01 name (UM p.38, p.46)
│  ├─ P22 Class       CLS.00 number (10–99), CLS.01 name, CLS.02 dept (UM p.38, p.47)
│  ├─ P23 PLU         PLU.00…PLU.57, see the field list below (UM p.38–41, p.47–49)
│  ├─ P24 Unit        UNT.00 number (20–99 user), UNT.01 name, UNT.04/05 "Not Open" (UM p.41, p.49–50)
│  ├─ P25 Barcode     BAR.00 number (1–9 factory, 10–99 user), 01 name, 02 type, 03 check, 04/05 constants,
│  │                  06 24-character description (UM p.41, p.50–53)
│  ├─ P26 Print format PST.00 number (1–9 factory, 10–29/39 user), 01 name, 02 sort, 03/04 size, 05–20 texts 1–16,
│  │                  21 font mode, 22 print items LAS.00–11 (UM p.41–42, p.53–56); "very hard on the scale, use the PC"
│  └─ P27 Salesman    SAL.00 number, 01 name, 02 password (UM p.42, p.56)
├─ P3 DTAss (data assistant)
│  ├─ P31 SK-PLU      mark each PLU step Prog/Skip for full PLU edit (UM p.42, p.57)
│  ├─ P32 SKFPLU      the same for the F-Prog quick edit (UM p.57–58)
│  └─ P33 Delete      **asks for code 9958**; 1 Dept, 2 Class, 3 PLU, 4 Unit, 5 Barcode, 6 Print format, 7 Salesman;
│                     then start and end number (end = 0 → only the start) (UM p.43, p.58)
├─ P4 Commu
│  ├─ P41 U-Disk      USB load/save (see §1.8.6)
│  ├─ P42 Ethnet      Ethernet monitor: download/upload counters, × switches between them; Wi-Fi status (UM p.60–61; ED p.i)
│  ├─ P43 RS-232      must be entered before RS232 transfer (UM p.61)
│  └─ P44 USlave / PTR  USB-slave "Not Open"; network printer (UM p.43)
└─ P5 HWAss (hardware assistant) — **asks for the ADMIN password (factory <factory default>)** (UM p.43, p.61–62)
   ├─ P51 Set-PW      P511 Admin, P512 Sale, P513 Prog, P514 Account, P515 Drawer (type the new password twice)
   └─ P52 TMS-DF (factory default; **asks for code 9958**)
      ├─ P521 Fac-Set  scale parameters (P1x) back to factory; **passwords reset too**
      ├─ P522 Base-DT  default working data (P2x)
      ├─ P523 EraseDT  erase all working data (P2x)
      └─ P524 Fac-All  everything, all user data deleted; passwords reset (UM p.62–63; EM §13)
Account (the scale first recalculates records)
├─ A1 Total   A11 Daily, A12 Monthly, A13 Quarterly, A14 Manual
├─ A2 Dept    A21–A24 (same four periods)
├─ A3 Class   A31–A34
├─ A4 PLU     A41–A44 (A44 disabled when the stock report is on: Spec141)
├─ A5 Clear   A51 clear manual report (no code!), A52 clear ALL reports and records (**9958**),
│             A53 clear stock (**9958**), A54 reset SID counter to 0 (no code)
├─ A6 Stock   A61 print stock (PLU range), A62 stock audit (Amend = set, Confirm = add, F-Prog+Confirm = subtract)
├─ A7 List    A71 print sale list (today, or × for a time range)
└─ A8 Sales   A81–A84 salesman reports (UM p.64–69)
```
[verified-fix] Notes on the tree above:
- P12 range: the manual's Spec table ends at **457** (QR bar size, UM p.87), but the PC dictionary `Tm.xml` has 383 Spec rows with IDs up to **498** (480–498 = "Special Version Spec 0–18"). So "250–457" should read "250–498 (480–498 only for special firmware)".
- The manual's Spec table has a last column "Permission" = the edit level. Examples useful for the guide: Spec104 (date format) = level **1** (reach it only with × 104 Confirm, not with the arrows); Spec105/106 (shelf) = level 0; Spec042 (USB auto update) = 0; Spec043 = 0; Spec110/202/203/260/265/266 = 1 (UM p.75–84). The manual also warns that defaults differ between firmware versions and the list is "for reference only" (UM p.73).
- P41 "U-Disk": UM p.36–37 notes that the P4 entries depend on the hardware and a basic scale has only P41.
- A51 and A54 act immediately after the digit is pressed (the display shows dashes, "wait a few seconds"): there is no confirm step and no code (UM p.66–67, Ex.6-2, Ex.6-5). CONFIRMED.
- Spec140 "SID auto clear" (0 disable, 1 half-day, 2 daily, 3 Saturday, 4 Monday, …; UM p.80 area) can reset the SID counter automatically, so staff never need A54 (INFERRED recommendation).

The scale's own log records destructive actions. The PC log-type table includes `308:A52`, `777:P521`, `778:P522`, `779:P523`, `780:P524`, `259:IlleageBoot` and `1254:E9.98-Firmware Upgrade` (`Combo.xml:1229`, "Logs Type Full"). **CONFIRMED** that these operations are auditable after upload.

**P23 PLU step list** (UM p.38–41):
- 00 number (1–9 999 999; user range 10–9 999 996 when Spec092=1)
  - [verified-fix] UM p.48 table: user PLUs are **1–9 999 996** when Spec092=1 (new numbering) and **10–5 999** when Spec092=0 (old numbering); 9 999 997–9 999 999 are system PLUs. The PC also treats 1 as the first user PLU (`app.config` `minUserPLUID`=1). Beeftown's PLU 1, 2, 3, 5 are therefore valid only with Spec092=1. Note that `Tm.xml` renames Spec092 to "Dummy Number" (0 disable / 1 PLU dummy / 2 salesman dummy / 3 both), so its meaning on V3.14E8 is not certain (INFERRED). The manual says the scale stores 5 990 PLUs, extendable to 10 000 (UM p.11).
- 01 ICode (item code, printed in the barcode); 02 Index (external EAN)
- 03 Unit: 0/1 default weight unit, 2 default count unit, 3 kg, 4 g, 5 ton, 6 lb, 7 500 g, 8 100 g
- 04 Price; 05 Cost; 06 Tare
- 07/08/09 bill-1 print format / barcode / barcode flag; 10/11/12 the same for bill 2
- 13 Class; 14 Name; 15–21 Des-1…7 (Text 1–7)
- 22 PS-SD, 23 PS-ST, 24 PS-PD, 25 PS-PT, 26 PS-UD (print flags); 27 PC-SD, 28 PC-ST, 29 PC-PD, 30 PC-PT, 31 PC-UD (values). See §3.
- 32/33 manual-discount lower/upper-limit mode; 34/35 limit values
- 36–55 four auto-discount groups (sort / weekday mask 1 = Sun … 64 = Sat, 127 = every day / lower / upper / price)
- 56 Tax-S; 57 Tax-D (0.01 % units)

The manual lists 32 = DF-D (lower) and 33 = DF-U in the P23 table, but reverses them in the P31 table. The TMS order is DF_D then DF_U (SaveForm.cs:1060).

**Reserved numbers** (UM p.46–48, p.21):
- Dept/Class 1 = unset weight, 2 = unset count, 8 = error, 9 = default; users edit 10–99.
- PLU 9999999 = temporary weight (T-Sale), 9999998 = temporary count, 9999997 = service charge; Spec093–096 set these. `Combo.xml:1241` adds 9999996 discount+rounding, 9999995 card payment, 9999991–4 store/other payments.
- Units 1–8 factory, 9–19 reserved, 20–99 user.

### 1.7 Staff how-tos (Sale mode)
All start from idle (Sale+Sum lit). Press Sale, or Cancel a few times, to get there (UM p.16).
1. **Zero**: with the tray empty, check that the Zero lamp is on. If not, press Zero (EM §3.1).
2. **Sell by weight** (UM p.22 Ex.4-8; EM §3.4): type the PLU number and press PLU, or press its shortcut key. Put the meat on, wait for Stable, press **Cash/Print**. The label prints.
   - Between two prints the weight must go back to zero (Spec069 default 1 = only if the weight changed; otherwise E1.12).
   - If the weight is not stable, the scale waits up to Spec086 (0.1 s units) before erroring. The manual text says "Spec151" here, which is a typo; Tm.xml:642 = Spec086 "Stable Waiting: Sale".
3. **Sell by piece** (UM p.23 Ex.4-9; EM §4.2): recall a count PLU, press **×** and type the quantity (skip if 1), press Cash/Print.
4. **Temporary item** with no PLU (UM p.22; EM §3.3/§4.1): type the unit price and press **T-Sale** (by weight), or type the unit price, press × and type the quantity (by count).
5. **Change the price for one sale only** (EM §5): recall the PLU, type the new unit price (it replaces the shown price), weigh, press Cash/Print. For a count PLU, type the price before ×. The scale's default price does not change.
6. **Tare**:
   - Container: put it on, press Tare, then put the meat in. To clear: empty the tray and press Tare again (UM p.28; EM §3.2).
   - Typed tare: type the value and press Tare. Only works if Spec067 = 1 or 2; the default 0 forbids it (UM p.28).
     - [verified-add] The PC-side databases and the sample file carry Spec067 = **1** ("Input Value Tare", Tm.xml), not 0 (`Config\en\_ECS.TMS` `TMS 67 1`; `mdb\dump\A_ECS\Spec.tsv`). A scale loaded from the PC may therefore already allow typed tare. The manual also lists Spec268 "Auto Tare Lock" with default 1 (UM p.84), so on some firmware the tare may stay locked without the 4-second press (INFERRED).
   - Preset PLU tare: PLU.06, applied when the PLU is recalled (Spec068).
   - Hold Tare 4 s = **Lock Tare**: the tare stays after each sale. Hold again to unlock (UM p.29).
   - NET lamp = net weight shown; F-Prog+Tare shows the gross (UM p.6).
7. **Several items on one ticket / change** (UM p.24–25; EM §6): after each item press **Accu/Confirm** instead of Cash/Print. At the end, optionally type the cash received, then press Cash/Print. The scale shows the change (cashing modes: Spec060).
8. **Remove from the ticket** (UM p.32; EM §7): press Amend then Accu/Confirm to clear the whole ticket. Or press Amend, use V2/V4 (←/→) to pick an item, press Accu/Confirm to remove just that item.
9. **Serve several customers** (UM p.31): V1–V4 switch buffers. A lit V-lamp means that buffer holds items; a flashing one is the active buffer.
10. **Label vs receipt** (UM p.11–12, p.53):
    - One item sold directly prints the **item label** (Spec000; a PLU-specific format overrides it).
    - An accumulated ticket prints the **sum label/receipt** (Spec005).
    - Copies: Spec003/008 (0 = print nothing). Factory formats: 1–3 item label 58×40 / 40×30 / 58×30; 4–6 total label at the same sizes; 7–9 receipt 58/40/48 mm plain paper.
11. **Reprint**: press Re-print. It repeats the last print and is not counted as a sale (Spec065; E2.04 if forbidden) (UM p.3, p.71).
12. **Look up past sales / mark a return** (UM p.33–34): hold Amend to browse records (←/→, ↓ for more fields, × + number + Confirm to jump). F-Prog+Amend marks a record as a return (Spec074); "-RT-" shows. About 6 000–8 000 records are kept; the oldest are deleted first (FIFO).
13. **Discounts** (UM p.25–27): -Num subtracts, -@/@Price sets a fixed price, ±% applies a percentage. With no PLU recalled, the discount applies to the ticket total. Limits: Spec110–112 and PLU.32–35; errors E1.23–E1.25. A beef shop may want to forbid staff discounts (Spec110=3) or require the admin password for price changes (Spec260 +16) (INFERRED recommendation).
14. **Recall a PLU**:
    - By number: digits then PLU (UM p.21). Spec253=1 makes the PLU key look up the item code instead.
    - Spec254/255 = recall automatically after N digits.
    - By shortcut key: press SCxx; for page 2 press Shift then SCxx (UM p.18, p.21).
    - By scanner: an EAN scanned into the Index field (UM p.34).
    - Unknown numbers: Spec087 dummy PLU.

### 1.8 Manager how-tos

**1.8.1 Create or edit a PLU on the scale** (UM p.16–18, p.47–49; EM §1)
Press F-Prog+PLU (quick edit; Spec080) or Prog 2 3. Type the PLU number, then use →/V4 to step through: ICode → Unit → Price → (Cost, Tare) → Name. For the name: Confirm, End (clears the old text), type, then **Amend saves the text only**. Continue → PS-UD → PC-UD → … and press **Amend again to save the PLU**. Cancel leaves. E1.01 = invalid value. Steps hidden by P31/P32 are skipped.

**1.8.2 Assign a shortcut key** (UM p.18; EM §2): F-Prog + the SC key, type the PLU number, press Amend. For several keys: press Confirm after each, then Amend at the end. Spec081 enables this.

**1.8.3 Change a default price quickly** (UM p.20; EM §8): recall the PLU, type the new price, **hold @Price (-@) until the second beep**. With Spec083=2 a single press saves it without the range check. Tm.xml:630 adds option 3 (long press = edit name) and option 4 (save automatically after each sale).
  - [verified-fix] Option 3 is already in the manual (UM p.76–77: Spec083 range 0~3, "3: press -@ change default price, long press to enter PLU name edit"). Only option **4** ("Modify PLU Price automatically after confirm", Tm.xml:632) is new. Manual default = 1 (long press). Option 4 is dangerous for a shop: any one-off price typed at the counter would become the new default (INFERRED).

**1.8.4 Edit a Spec** (UM p.19, p.44; EM §9): F-Prog+Prog or Prog 1 2. Press ×, type the Spec number, press Confirm, type the value, press Amend. Window 3 shows the old value; window 4 the new one. Spec082 enables this. Read the definition before changing anything.

**1.8.5 Shop name and label texts** (UM p.45; EM §10): Prog 1 3. ST.000 = store name. Press Confirm, End, type, Amend. Use → to reach ST.004… (bill texts / "Device Postil").

**1.8.6 USB import / export** (UM p.59–60; EM none; SaveForm.cs:487–494)
- Folder **`JHSCALE`** on the USB stick. Two kinds of file:
  - **`A_xxx.TMS`**: the *auto-update* file. The literal letters "xxx" are part of the name; SaveForm.cs:489 writes `JHSCALE\A_xxx.TMS`.
  - **`A_000.TMS` … `A_999.TMS`**: numbered files (SaveForm.cs:493 `A_{n:d3}.TMS`).
- With Spec042=1 (factory default, UM p.75) the scale loads `A_xxx.TMS` automatically when it is switched on with the stick inserted (UM p.59).
  - [verified-add] In the PC software the checkbox that selects `A_xxx.TMS` is labelled **"Boot File"** (SaveForm.cs:724, `Lang.xml` `pw_BootFile`) and it is **ticked by default** (SaveForm.cs:279–280); the file-number box is only enabled when it is unticked (SaveForm.cs:854–857). The old CHM calls it "Update when start" (CHM "TMS File"). So any TMS a technician exports with default settings is the power-on auto-load file. CONFIRMED.
  - [verified-add] The scale itself can also create `A_xxx.TMS`: in P41, pressing × before Amend selects the auto file (UM p.60 Ex.5-14 remark "Press × to select auto-update file"). A staff member who presses × by mistake while saving creates a file that will auto-load at the next power-on with the stick inserted. Our tool could avoid the whole risk by writing `TMS 42 0` (Spec042 = no auto update) (INFERRED recommendation).
- The stick must be FAT12/16/32, not NTFS, and partitioned as "FDD", not HDD/ZIP (E8.12, UM p.73). Spec046 lengthens the wait for slow sticks.
- Keys: **Prog, 4** (goes straight to "P41 Commu U-Disk"), **1** (or Confirm), which shows the file number "000". Then:
  - Type a number to choose `A_nnn`, or press × to choose the auto file `A_xxx`.
  - **Accu/Confirm = LOAD** the file into the scale.
  - **Amend = SAVE** the scale's parameters and data to the file.
  - **PLU = save the not-yet-uploaded sale list**; **F-Prog+PLU = save every sale record still held** (UM p.60 Ex.5-15).
- Progress display: error count | good count | bytes | state (Dw-Data/Up-Data → **Finish** or **Error**). The error count should be 0. Any key exits; Cancel aborts (UM p.59).
- Spec059=1 = sale log saved to USB automatically in Account (UM p.75).

**1.8.7 Set date and time**: Prog 1 1, digits, V2/V4 to move the cursor, Amend (EM §12; UM p.44). The PC can also sync time over Ethernet (NetForm "Time Synchronization"). The TMS `TIM` section also sets the clock; our tool's "keep clock" option strips it.
  - [verified-add] The PC's TMS writer never emits a `TIM` section (SaveForm.cs:945–1180 writes only TMS/TMT/SCP/DPT/CLS/PLU/BAR/LAB/SAL/FNT/BMP/VIP). `TIM`, `INF` and `INM` rows appear only in files **saved by the scale**; the PC reads them when importing a sale-list file: `TIM<TAB>YY<TAB>MM<TAB>DD<TAB>hh<TAB>mm<TAB>ss` with a **2-digit year** (+2000), `INF<TAB>shop name<TAB>device name<TAB>device number<TAB>"<model> <firmware version>"`, `INM<TAB>MAC[<TAB>original MAC]` (ReportForm.cs:5520–5597). Whether the scale re-applies `TIM` when it loads a file is not shown by any source; the tool's "keep clock" is a sensible precaution (INFERRED).

**1.8.8 Network / IP** (UM p.14–15, p.80–81; ED p.i–vi)
- Spec043 connection mode: 0 off, 1 server (default), 2 client.
- **DHCP is the default**: Spec153 = 0 means DHCP.
- Fixed IP:
  - Spec150–153 = IP. The first three parts must match the PC; the last part must be unique.
  - Spec158–161 = gateway (the same as the PC's; for a direct crossover cable, use the PC's IP).
  - Spec162–165 = mask (keep 255.255.255.0).
  - Spec154–157 = PC IP, client mode only. Spec170–173 = DNS. String 19 = server domain name for client mode.
- **Ports 33581–33584** (Spec166–169). **Do not change them.** LogInfo.txt shows a device at port 33581.
  - [verified-add] `LogInfo.txt` is the technician's multi-customer log: it lists **14 different MACs** from 2021-10-25 to 2026-05-14 on subnets 192.168.100.x and 192.168.2.x, all on port 33581 ("Success: N FID" = N sale records uploaded). The PC report DB names devices "★shop★device★number" (`mdb\dump\A_Report\Device.tsv`). The last MAC (…1AECB1, 2026-05-14) is absent from the 2026-05-14 backup (`A_Bak_20260514\Device.tsv`) and present in `A_Report\Device.tsv`, so it was first connected that day, the same month the XMLs were customised. It is a candidate for the Beeftown scale, but its shop name is still the default ("Factory"), so this is not proven (INFERRED). Sample `_ECS.TMS` confirms defaults `TMS 150–153 = 192 168 0 0` (DHCP) and `TMS 166–169 = 33581–33584`.
- Wi-Fi models: Spec050=1, Spec051 security mode, String 15/16 = SSID/password, then reboot. Status: Prog 4 2 Confirm Confirm → "Link Success", "AP Not Found", "Failed Join/Authent/…" (ED p.i).
- Cables: straight-through to a router/hub; crossover for a direct PC link (ED p.ii–vi).
- Errors: E7.62 means no wired module (then set Spec043=0); E7.63 means no wireless module (UM p.73).
- The PC can also set the scale IP remotely: NetForm "Set IP" dialog, with "Obtain automatically" or a fixed IP and gateway (NetSetIPForm, `form_labels.txt`).

**1.8.9 Reports ("X" and "Z")** (UM p.64–69; EM §11)
The scale does not use X/Z names. Mapping (INFERRED):
- **X (read, no reset)** = print A11 Daily with report numbers 0…0. Report 0 = today; the last 32 statistical days are kept and roll over automatically.
- **Z (close the period)** = A51 "clear manual report". It moves the manual-report buffers down one slot and starts a new period. It asks for **no code**.
- A52 = wipe **all** reports and records (9958, cannot be undone).

Easy-Manual key sequences, CONFIRMED from the images:
- Today's total: **Account, Accu/Confirm ×4**.
- Today's list of sales: **Account 7 1 Accu/Confirm**.
- Today's PLU report: **Account 4 1, Accu/Confirm ×2**.
- Clear all reports: **Account 5 2, 9958, Accu/Confirm**.

Inside A11: press × to print the list of report buffers with their dates; type start and end numbers to print a range (UM p.65). A71 prints a list of individual sales for today, or for a time range entered after × (UM p.68–69). Storage-full alarm E7.30: go to Account, let it calculate, then clear (UM p.72).

**1.8.10 Stock on the scale** (UM p.67–68): A6x covers only the first 1 000 PLUs. A62 = type the PLU number, then the quantity, then Amend (set) / Confirm (add) / F-Prog+Confirm (subtract). A53 clears stock (9958). Low relevance for Beeftown; stock is better kept in the PC or back office (INFERRED).

**1.8.11 Passwords** (UM p.61–62): P5, enter the admin password, then 1 → 1–5 choose which password (admin / sale / prog / account / drawer); type it twice.
- Password 0 = none.
- If the admin password is 0, nothing is protected. To protect Prog or Account, first change the admin password from the factory value, then set the Prog/Account password.
- Spec247 remembers entered passwords until restart. Spec260 forces the admin password for Sale / Prog / Account / Drawer / unit-price change (+1/+2/+4/+8/+16).

**1.8.12 Factory reset**: Prog 5, admin password, Accu/Confirm, 2 4, 9958, Accu/Confirm (EM §13). **Wipes everything, including PLUs, labels and passwords.** For the service agent only.

### 1.9 Paper and labels (UM p.8–12, p.53, p.73–75)
- **Load a label roll** (UM p.8–9, Pictures 1-11…1-16, `Printing_S_p19/p20.png`). Two mechanisms: side drawer ("08's") and top cover ("12's").
  1. Open the door.
  2. Raise the print head / move the hook.
  3. Fit the roll, with the LIMIT guide turned out of the way.
  4. Thread the paper through.
  5. Peel the first labels and wind the backing on the take-up spool with the **U-spring** clip.
  6. Close the head.
  7. Set the LIMIT height.
  8. Close the door.
  9. Press **Feed**.
- To remove used backing: pull the spring out (UM p.9).
- Plain (receipt) paper needs no U-spring: pass it through the paper sensor and leave the tear-off end outside (UM p.9).
- **Paper type** must match what is loaded: the Gap Paper lamp is on for labels. Change it by holding Paper Type (Spec021: 1 = gap, 0 = plain). **The bench keyboard has no Paper Type key, so use Spec021 instead** (INFERRED) (UM p.10–11, p.74).
- **Label-gap sensor calibration** (UM p.10 §1.5.5). Use it when labels feed continuously, stop after one label, or print across the gap.
  1. Check the paper type.
  2. Load the labels so that the edge does not pass the print head (keep the paper-out sensor clear).
  3. Switch off, **hold Feed while switching on**, and keep holding through the self-check.
  4. The scale feeds about 50 mm and calibrates. No alarm means OK; **E7.10** means calibration failed (check the roll is label paper, then retry).
  5. Press Feed to print a test label.
- Print-window codes during printing: "E7.1x" error in the Tare window; copies left in the Weight window; "P1-02" (document and page) in the Price window; "Print" in the Total window (UM p.10).
- Darkness: Spec022 gap, Spec023 plain (0–15; lighter = longer head life). Spec020 slows the print speed. Spec039 gap-paper pre-feed (stop/tear position) and Spec026 plain pre-feed (values >1000 = reverse feed). Spec024/025 plain spacing and cut-off. Spec030 feed-sensor position (**hardware, do not touch**). Spec029 overheat protection (**do not touch**) (UM p.74–75).
- The manual's label-size and Spec table is internally inconsistent (UM p.11 vs p.53 notes). CONFIRMED values from the p.11 table: 58×40 → Spec000=1, Spec005=4, Spec027=50; 40×30 → 2 / 5 / 36; 58 mm plain receipt → 7 / 7 / 50; 40 mm plain → 8 / 8 / 36.
  - [verified-add] Units: **Spec027 is the report print width in mm** ("Wide of Report Printing", UM p.74; Tm.xml "0~99mm"), not a label size. **Spec039 / Spec026 pre-feed are in printer dots** (UM p.75 "Unit of setting number is dot"; 8 dots = 1 mm, INFERRED from label geometry below); Spec024/025 are in mm (Tm.xml). Label formats store size in dots: LAB width/height in the TMS = dots ÷ 8 = mm (SaveForm.cs:1097 `Width / 8`); PC DB label 28 is 464×320 dots = **58×40 mm** (`mdb\dump\A_en_Default\Label.tsv`), and the tool's example label is 58×40 (Beeftown_Can_TMA.html:598). Sample `_ECS.TMS` "Item Label: 60*40mm" is stored as 54×37 (printable area).
  - [verified-add] The factory numbering of user print formats: UM p.41 says 10–29, UM p.53 says 10–39; the PC exports formats 10–**99** (`app.config` `minUserLabelID`=10, `maxLabelID`=99; SaveForm.cs:1092). PC IDs such as 11000 are PC-side templates (`maxLabelID_Template`=19999) and are not sent to the scale by a normal user.
- The PC Config Wizard offers gap 30×40, 40×30, 60×30, 60×40 and plain 40 / 57 / 60 mm (WizardForm, `form_labels.txt`).

### 1.10 Error codes and fixes (UM p.70–73)

| Code | Meaning | Fix |
|---|---|---|
| E0.01 | Weight unstable at start-up | Empty the tray and keep it still; otherwise the load cell may be faulty. |
| E0.02 | Start-up zero out of range | Empty the tray and seat it properly. |
| E1.01 | Invalid programming value | Re-enter. |
| E1.02 | The two password entries differ | Re-enter. |
| E1.03 | Print format does not exist | Choose a valid format. |
| E1.10 | Zero-price sale forbidden | Spec070. |
| E1.11 | Price over the maximum | |
| E1.12 | Weight must return to zero | Empty the tray (Spec069). |
| E1.13 | Accumulation limit reached | |
| E1.14 | Buffer has data, cannot print a single item | Print the buffer first or switch buffer. |
| E1.15 / E1.16 / E1.17 | Cashing mode not allowed / payment required / payment too small | Spec060. |
| E1.18 / E1.19 | Cannot accumulate or switch buffer while PLU is locked | Exit lock/auto mode. |
| E1.20 | No-weight sale of a weight PLU forbidden | Spec071. |
| E1.21 / E1.22 | Under minimum / over maximum sale weight | |
| E1.23 / E1.24 | Discount outside the limits | |
| E1.25 | Discount forbidden | Spec110. |
| E1.26 / E1.27 | Manual weight forbidden / tray not at zero | |
| E1.28 | T-Sale forbidden | Spec076. |
| E1.29 | Weight or count PLU forbidden | Spec075. |
| E1.30 | PLU conflicts with the special mode | |
| E1.31 | Forced auto-print pending | |
| E1.32 | Cannot switch buffer while accumulating | |
| E1.33 | Mode switch forbidden | Spec079. |
| E1.34 | Scanned barcode not recognised | |
| E1.35 | Tare renew forbidden | |
| E1.36 / E1.37 | Salesman does not exist / password 0 not allowed | |
| E1.38 | Service charge forbidden | |
| E1.5x | Custom-firmware alarms | |
| E2.01–E2.03 | Quick edit of PLU / shortcut / Spec forbidden | Spec080–082. |
| E2.04 | Reprint forbidden | Spec065. |
| E2.05 | [verified-fix] Leaving a menu by pressing Sale / Prog / Account is forbidden | Press **Cancel** several times to go back (UM p.71). |
| E2.06 / E2.07 | A44 / A6 report disabled | Spec141. |
| E2.09 | Illegal reboot | Spec138. |
| E6.10–E6.21 | Same list for the network printer (PTR) | |
| E7.01 | Key held at power-on | The display shows column-row of the key and the calibration count. |
| **E7.10** | **Label sensor calibration failed** | Redo §1.9. |
| E7.11 | Label not removed | Take it off (Spec245 can ignore the sensor; not advised). |
| E7.12 | Print head not closed | Spec244. |
| E7.13 | Printer busy | |
| E7.14 / E7.15 | Out of plain / label paper, or wrong type | Spec246. |
| E7.16 / E7.17 | Gap not found | Wrong type or roll empty; recalibrate. |
| E7.18 | Overheated | Wait. |
| E7.19 / E7.20 | Printer not responding / timeout | |
| E7.23 | PDS calibration failed, ignored | Harmless. |
| **E7.30** | **Sales-record memory full** | Account → calculate → clear. |
| E7.40 | Clock error | Main-board battery. |
| E7.50–E7.53 | Hardware fault | Return to the factory. |
| E7.54 | Font file error | Re-download the font from the PC. |
| E7.61 | No MAC address | Service. |
| E7.62 / E7.63 | Wired / wireless network module missing | Spec043=0 / Spec050=0. |
| E7.70 | AD converter or load cell fault | |
| E7.81 / E7.82 | DC voltage low / high | Spec235=1 disables the check. |
| E8.11 | No USB port | |
| **E8.12** | **USB stick not found** | Use FAT, "FDD" boot type. |
| **E8.13** | **File not on the stick** | Check `JHSCALE\A_nnn.TMS`. |

The PC log table also knows E9.93, E9.97 (flash re-initialised) and E9.98 (firmware upgrade) (`Combo.xml:1229`). These are not in the manual.

### 1.11 Codes and passwords (all factory defaults, as printed in the manual)
- **Validate code 9958** (fixed; UM p.61) is asked before: P33 Delete, P52x factory reset, A52 clear all, A53 clear stock (UM p.43, p.58, p.63, p.66).
- **Scale admin password <factory default>** (P5; also Sale, Prog and Account if set; UM p.43, p.61; EM §13).
- Sale / Prog / Account / Drawer passwords default to 0 (none).
- **PC software**: user "user" with a blank password; admin "admin" / <factory default> (UM p.15; CHM "Select and Login of Data File"). Code has the roles User / Admin / Super Admin (MainForm.cs labels list).
- None of these equal the Access database password (checked by boolean comparison only; the DB password is not reproduced).

### 1.12 What staff must NOT touch
- **Prog 5 (P5 Hardware Assistant)**: passwords and factory reset. **Prog 3 3 (P33 Delete)**. **Account 5 (A5 Clear)**. A51 and A54 act **without** asking 9958, so they are the easiest to hit by accident. A52 and A53 ask 9958.
- **Any time the scale asks "Input Code", answer Cancel** unless you are the manager and intend to delete something.
- Calibration is not reachable from the menus; the three-bar display at start-up is the calibration prompt (UM p.7). Level 2–3 Specs (measurement) cannot be reached (UM p.20).
- Do not edit these Specs: 029/030/034/230/237/238 (hardware), 166–169 (ports), 213 (precision), 218–225 (zero/stable ranges), 235 (power detect), 244–246 (ignore sensors), 045/050 (network hardware) (UM p.73–83).
- Do not use the PC software's "Upgrade" (firmware .bin/.1v3), "New MAC/Restore MAC" or "Initialize" in the Ethernet window (NetForm labels).

### 1.13 Checking our current tool's key sequences (C:\Beeftown\cong-cu\Beeftown_Can_TMA.html)
- **Step 1** (line 186) "Prog, ↓V3 to P4, Accu/Confirm, Accu/Confirm, Amend" = save to USB. **Consistent** with UM p.59–60: Confirm enters P4 (P41), Confirm enters U-Disk ("000"), Amend saves to `A_000.TMS`. A shorter equivalent is **Prog, 4, 1, Amend**.
- **Step 3** (line 194) "Prog, ↓V3 to P4, Accu/Confirm, Accu/Confirm" = load. **Likely one Accu/Confirm short.** The same two presses stop at the "000" file-number screen (that is where step 1 presses Amend); loading needs a **third Accu/Confirm** (UM p.59 Ex.5-13 "Load files 【Confirm】"). Then wait for "Finish" with 0 errors. INFERRED; verify on the scale.
- **Note** (line 298) "Do not leave the USB in at power-on: the scale will auto-load A_000.TMS". Per UM p.59 and SaveForm.cs:487–494, power-on auto-update applies to **`A_xxx.TMS`**, not the numbered `A_000.TMS`. The warning is harmless but its reason is probably wrong. It is valid if someone saves an `A_xxx.TMS` (for example with the PC software's "Update at once" box ticked).
- **Note** (line 299) "don't enter P3 › Delete and P5 › Hardware Asst; if the scale asks 9958 press Cancel". **CONFIRMED**, with nuances: P5 asks the **admin password** (<factory default>) first; 9958 appears later at P52x; 9958 is also asked at A52/A53; A51/A54 need no code (UM p.43, p.62, p.66–67).
- "↓ V3" as the arrow: **CONFIRMED** that V3 carries ↓. In the Prog menu the manual moves between P-menus with ←/→ (V2/V4). ↑/↓ act the same "when no data is being amended" (UM p.36–38).
- [verified-fix] On the line-298 note: "for example with the PC software's 'Update at once' box ticked" → the box is called **"Boot File"** and is **ticked by default** (SaveForm.cs:279–280, 724), so PC-made files are `A_xxx.TMS` unless the technician unticks it. The scale also writes `A_xxx.TMS` if × is pressed in P41 before Amend (UM p.60).
- [verified-add] **Deletions and renumbering probably do not reach the scale.** The tool removes a PLU simply by leaving its line out (Beeftown_Can_TMA.html:488–490) and never writes a `CLR` line. The PC software removes old data on the scale only when "Clear Data" is ticked, by writing `CLR<TAB>PLU<TAB>` + `CLR<TAB>END<TAB>` before `DWL<TAB>PLU<TAB>` (SaveForm.cs:1047–1053; same pattern for every section). UM p.59 describes loading as updating the scale's data. So a PLU deleted in the tool, or the old number of a renumbered PLU, most likely stays on the scale (INFERRED; verify on the scale). Fix options: emit the `CLR PLU` pair when the product list lost rows (the scale's own export is a full dump, so replacing the whole table is safe), or tell the manager to delete the range with P33 (needs 9958).
- [verified-add] The tool rejects PC-made TMS files: it requires `ECS<TAB>VER` on line 1 (Beeftown_Can_TMA.html:380–382), but the PC writes an empty first line before `ECS<TAB>VER<TAB>100<TAB>` (SaveForm.cs:946–947; `Config\en\_ECS.TMS` starts with bytes `EF BB BF 0D 0A 45 43 53`). A file the technician makes with TM-xA would show "not a scale file". CONFIRMED by code reading; scale-made files are presumably fine (the tool was built from one).
- [verified-add] The tool's `parseLas` reads `size` from field 7 (Beeftown_Can_TMA.html:447). In a LAS row field 7 is **Align/Grid** (snap position 0–9) and field 8 is **Font** (SaveForm.cs:1101 order: SubID, Flag1, Flag2, Flag3, Print, Angle, Align, Font, Left, Top, Width, Height; UM p.42 LAS.06 Grid, LAS.07 CFont). Sample rows use Align 4/5/6 and Font 0/1/2 (`_ECS.TMS` LAB 11000). The preview's "size" is therefore really the alignment. CONFIRMED.
- [verified-add] The tool's built-in example label (id 28, 58×40, html:597–605) matches PC DB label 28 structurally (`mdb\dump\A_ECS\LabelItem.tsv` and `A_en_Default\LabelItem.tsv`, LabelID 28: same Flag codes, near-identical coordinates; that DB label carries another shop's texts, which must not be reused). In it the "HSD" caption (Const Text 16 = LAB Text17) and the Shelf Date item (Flag1=1, Flag3=15) both use print condition **1 = always**, not 9. The "Ngày đóng gói" caption (Const Text 4 = Text5) is followed by **Sale Info 3 "Print Date"** (always today's date), not by the Package Date item (Flag3=13). See §3.4.

### 1.14 Where the manual (V3.04A) and Tm.xml (current PC dictionary) disagree
Tm.xml is the source used by the PC software, so it matches newer firmware such as the Beeftown V3.14E8 better (INFERRED).

| Spec | Tm.xml | Manual |
|---|---|---|
| 065 Reprint | 0 forbid, 1 bill 1, 2 bill 2, 3 PTR, 4 all, 5/6 by paper type (Tm.xml:522) | 3 = each of bill 1 and 2 |
| 068 | "Tare selection": 0 manual only … 3 PLU tare only (Tm.xml:540) | 0–7 resume-tare table |
| 069 | Adds 3 "zero-return for new by-weight PLU" and 4 "keep at zero…" (Tm.xml:546) | |
| 080/082 | Adds "allowed with authentication" | |
| 080/082 [verified-fix] | Values are **renumbered**, not only extended: 0 Forbidden, **1 Allowed with authentication**, **2 Allowed** (Tm.xml:626 for 082; same text for 080). 081 stays 0/1. | 0 Forbid, **1 Allow**, default 1 (UM p.76). So a value 1 copied from the manual may mean "needs password" on newer firmware (INFERRED). |
| 088 [verified-add] | "Dummy PLU Shortcut (0=Disable, Other=PLU in 1st Shortcut, firmware>V2.50E)" | "Dummy ScPLU 0~1": SC1 → PLU101, Shift+SC1 → PLU201 (UM p.77). A way to get fixed key→PLU mapping without programming SCP rows (INFERRED usefulness). |
| 092 [verified-add] | "Dummy Number": 0 disable, 1 PLU dummy, 2 salesman dummy, 3 both | "Dummy PLU number": 0 old PLU range 10–5999, 1 PLU 1–9 999 999 (UM p.77) |
| 083 | Adds 4 "save price automatically after confirm" (Tm.xml:630) | |
| 104 | Adds Persian calendars and 12-hour variants 100–110 (Tm.xml:732) | |
| 105 | Adds 3 "not print shelf" and 4–6 "days mode" (Tm.xml:738) | See §3 |
| 131 | Adds 5/6 auto accumulate and print | |
| 135 | Adds 6 | |
| 250 | Adds 2 "only 1 accumulation" | |

---

## 2. TM-xA PC software (v3.10) feature inventory

Menu structure: MainForm.cs:1971–2134; labels: Lang.xml via MainForm.cs:465–516; per-form labels in `scratchpad\form_labels.txt`.
Relevance for **one beef shop with one TM-A label scale, USB or LAN**: **H** = must have / replicate; **M** = useful later; **L** = rarely needed; **—** = irrelevant.

### 2.1 Start panel "Guider" (GuiderForm.cs:245–251; Resources\Guider_*.png are icon pairs _1 normal / _2 hover)

| Button | What it does | Rel. |
|---|---|---|
| Config Wizard | Guided device set-up | M |
| Dock [Ethernet] | Keep the Ethernet window running in the background | L |
| Dock [Report] | Keep the Report window running in the background | L |
| Advanced Setting | Software options | L |
| Custom File | TXT import | L |
| TMS File | USB export/import | **H** |
| Excel/CSV File | Spreadsheet import/export | **H** |

### 2.2 File menu

| Item | What it does (evidence) | Rel. |
|---|---|---|
| Import/Export → **TMS File** | Choose what to export: All/Spec/String/Shortcut/Dept/Class/PLU/Print Format/Unit/Barcode/Salesman/VIP/Bitmap/Font/Boot file/Config Wizard/"Clear data first". Writes `JHSCALE\A_xxx.TMS` ("Update at once") or `A_nnn.TMS`, and imports TMS back (SaveForm.cs:487–494, 1045–1153; CHM "TMS File"). [verified-fix] "Boot file" is not a data type: it is the checkbox that chooses `A_xxx.TMS` (power-on auto-load) instead of a numbered file; it is ticked by default (SaveForm.cs:279–280, 724). "Clear Data" writes `CLR <section>` + `CLR END` before each section so the scale wipes that table first (SaveForm.cs:1047–1051). Only Specs and Strings whose "Import/Export" tick (`Valid`) is set are written (SaveForm.cs:959, 977); the factory DB ticks only Spec104/105/106 (`mdb\dump\A_en_Default\Spec.tsv`). | **H** (the core of our tool) |
| Import/Export → **Excel/CSV File** | PLU-only mapping of spreadsheet columns to fields (`Combo.xml` PLU_Col, 66 fields, including `PC_UD_Plus` = shelf days and auto-print). Import, export, auto-number, overwrite option (ExcelForm; CHM "Excel File"). [verified-add] Pitfall to avoid in our copy: a unit-name column whose text is not in the Unit table silently makes the item **by-count** (UnitID=2), puts the text into **Text 7** and sets `Flag`=1 (ExcelForm.cs:520–531). Unit IDs in the PC DB: 1 Weight (default), 2 pcs, 3 kg, 4 g, 5 ton, 6 lb, 7 500g, 8 100g, 9 1/4lb (`mdb\dump\A_ECS\Unit.tsv`). | **H** (price-list round trip) |
| Import/Export → **Ethernet** | NetForm: find/add/delete devices, attach tables. Tasks: Initialize, Rename (shop/machine name, number), Link Test, **Time Synchronization**, Upload Data (scale→PC), **Download Data (PC→scale)**, Upload Report, Upload/Download Database, **Set IP**, New/Restore MAC, **Upgrade** firmware (.bin/.1v3), font download, monitor, **Auto Task** scheduler (tasks at a date/time or when online, with repeat), FTP/HTTP auto-fetch of an Excel/Custom file from a URI (NetForm.cs:1893–1914, 4974, 5202–5241; AutoTaskForm; `Combo.xml` Network_Task/Network_Due). | M (live push, time sync, sales pull; our offline HTML cannot open raw sockets) |
| Import/Export → **Custom File** | TXT importer with a small parse "script" editor: read until char, convert decimal, write field… (TXTForm/TXTEditorForm). | L |
| Import/Export → **Report** | Opens the Report window (see 2.5). | M |
| Config Wizard | See 2.6. | M |
| Login | Pick a data file (.mdb), log in as user/admin; create or delete data files (ManagerForm; CHM "Select and Login"). | L |
| ChangePassword | Change the user or admin password. | L |
| Language | Choose the UI language. | — (ours is Vietnamese only) |
| Advanced Setting | MenuParameterForm: tray icon, real-time sync, delete logs older than N days, "use cost from device", multi-stock mode, which menus and PLU fields are shown, payment names 1–3, date format, font. | L |
| Prompt Save When Exit, Exit | | — |

### 2.3 Parameter (TM-Set) menu

| Item | What it does | Rel. |
|---|---|---|
| **Spec** | Grid of all Specs with description, value and "Import/Export" tick; only ticked rows are sent (CHM "Spec"; SpecForm; Tm.xml 383 Spec_Info rows). | **H** for a small curated subset: 000/005 formats, 021–023 paper, 042 USB, 043/150–165 network, 069, 083, 104–106 dates/HSD, 110/260 price control, 202/203 decimals |
| **Global Text** (String) | ST 0–27: store name, device name, money prefix/suffix, bill texts, Wi-Fi, custom texts (StringForm; Tm.xml String_Info). | **H** (shop name, phone, address) |
| **Shortcut Key** (Face) | Visual keyboard. Pick a layout (08's / 12-15-17 pole / no pole / price scale / cash register / indicators: `Combo.xml` ScPLU_Layout; ScPLU_K*.xml plus _DL/_SL overlay images) and a page mode (single/double/triple). Click a key to assign a PLU; Auto Allocation; Clear all. **Print or save a picture of the overlay** for the keyboard (FaceForm; CHM "Shortcut Key"; WizardForm.cs:3594–3625 maps device A08→KA, A no-pole→KAD, other A→KAB). | **H** (key map plus a printable sticker with Vietnamese names) |

### 2.4 Database (DT-Set) menu

| Item | What it does | Rel. |
|---|---|---|
| Dept | Top reporting level, 10–99 (DeptForm; CHM "Dept."). | L |
| Class | Second level, linked to a Dept; per-class default bill formats and barcodes (ClassForm). | L–M (group cuts for reports) |
| **PLU** | Tabs: **Basic Info** (number, name, item code, index barcode, class, unit, price, cost, tare, alpha search, measure word, "save as weight", percent tare, fixed weight, bitmap, special mode, SSP values); **Print Info** (bill 1/2 print format, barcode, flag); **Text Info** (Text 1–7); **Time Info** (print sale/pack/shelf date and time, plus day/time values); **Discount Info** (manual limits, 4 auto-discount groups with weekdays), tax type/rate; Clone; Filter; per-tab Import/Export tick (PluForm; CHM "PLU"). | **H** (basic + text + time/HSD); discount/tax L |
| Other → Pieces in Package | Package PLU made of N piece PLUs, both by count (Co_BoxPcsForm). | — |
| Other → Material in Product | Product PLU made from a by-weight material PLU, for stock deduction (Co_ProMatForm). | L |
| **Print Format** | Label/receipt designer. Format list (number, sub ID, sort: Item Label / Sum Label / Receipt / List, `Combo.xml:507`). Items with x/y/w/h, print condition (34 options incl. "Shelf Date Print", "Re-Print", "Pre-Print"; `Combo.xml` LabelItem_Print), angle, font, snap; Clone; area and page flags (LabelForm; CHM "Print Format"; LabelItem.xml). | **H** (Beeftown label layout with HSD/packing date/logo) |
| Unit | Units 1–8 fixed, user 20–99, name printed as the unit (UnitForm). | L |
| **Barcode** | Formats 1–9 fixed, 10–99 user; type EAN13/EAN8/UPC/ITF/EAN128/Code128/QR; check; constants; 6 data parts: source (46 sources incl. PLU no., item code, T.Price, weight, **shelf date Y/M/D**), length, shift, overflow (BarcodeForm; `Combo.xml` Barcode_Source; UM p.51–53). | M (must match the POS that scans the label) |
| Salesman | Staff 1–99 with password, plus a rights table: price change high/low %, drawer, price F-Prog, hang-up/load-back, PLU quit, pre-print/re-print, T-Sale by weight/count, buy-back, illegal reboot (SalesmanForm). | L (M if price overrides by staff must be locked down) |
| VIP | Loyalty members: primary/assist ID, discount %, points (VIPForm). | — |
| Bitmap | JPEG logos converted into memory blocks for printing on labels (BitmapForm; TMS `BMP` section SaveForm.cs:1153). | M (Beeftown logo on the label) |
| (custom tables) | Extra tables defined in Custom.xml via Tool→Custom Designer. | — |

### 2.5 Report window (ReportForm; `Combo.xml` Report Title / Logs Type Full / Stock Type Full)
- Tabs: Logs | Report | Device Logs | Stock | Excel/CSV Import.
- Sources: Upload Report over Ethernet, **Import from File (TMS sale list saved from the scale's USB, P41 + PLU key)**, Import from RS232, re-upload.
- Reports: Bill report, PLU total report, PLU list report. Totals: count, weight, tax, cash, card, payments, discount/rounding, service fee, cost, profit. Per device or all devices.
- Filters with date expressions (Today, current week/month/quarter/year); export to Excel.
- Log types: Sale, Buy Back, Unconfirmed, Deleted, Hangup, Auto Mode, stock movements, errors, and **audit entries for A52/P521–P524/illegal boot/firmware upgrade**.
- Stock: stock tables, amount in stock, last stocktaking, spoilage, safety/low stock, order.
- **Rel. M**: daily sales per cut is valuable, but Beeftown's back office (Supabase) may already cover sales. The USB sale-list import path is the cheapest to replicate (INFERRED).

### 2.6 Config Wizard (WizardForm; teaching videos A001–A006, B007)
Steps:
1. What to do?: first set-up / edit working data only / export directly.
2. Select Device: barcode scale 2008's/2012's/2015's/2017's, cash-register scale, price-printing scale, cash register, A1/A2 indicators, 4/5 windows, no pole.
3. Operation Mode: label print mode (barcode scanned by a POS) / cash-register mode (receipt, accumulate) / one item per bill / print on Confirm.
4. Print format of item label / sum label / receipt: gap 30×40, 40×30, 60×30, 60×40; plain 40/57/60 mm; gray level; rotate 180°.
5. Barcode for the cash register: item code or PLU number, flag, digits, checksum, sum barcode EAN13/128/QR.
6. Display of the 5th window.
7. Shortcut key.

Further pages:
- **Management**: "Admin in charge" rights (full/limited/no right) for Sale/Prog/Account/Price F-Prog.
- **Sale Operation**: zero-return, hang-up/load-back, payments, price F-Prog modes, record unconfirmed, buffer clear, auto print.
- **Unit and Display**: money prefix/suffix, decimal places, rounding, print unit with weight/price/money.

Export goes to the device over Ethernet or to a TMS file. "Needs device ≥ V2.49A".
**Rel. M–H as a concept**: Beeftown needs a one-click "Beeftown preset" (label size, date format, HSD, barcode, rights) rather than a generic wizard (INFERRED).

### 2.7 Tool menu

| Item | What it does | Rel. |
|---|---|---|
| Font Builder | Starts `Binary\FontBuilder.exe` (MainForm.cs:1168–1178) to build `Font.bin` from `Unicode.Cfg`. Fonts go to the scale in the TMS `FNT` section (SaveForm.cs:1124–1130) or over Ethernet. E7.54 = bad font. | M (only if Vietnamese glyphs print wrongly) |
| Custom Designer | Defines custom tables and menus (developer). | — |
| Lable Designer (FlagDesigner) | Edits the dictionary of print-item codes in LabelItem.xml (developer). | — |
| Report → Backup / Restore / Reset Report | Reset clears **all PC logs and stock** (MainForm prompt text). | L |
| Startup Config | Auto-start minimised, auto-login, run the Excel/Custom file in Ethernet mode (StartUpForm). | L |

### 2.8 Window / Help
Cascade/tile/tray; Help → Manual (CHM), About. **—**

### 2.9 Update.txt (Config\Update.txt, V2.41A change log)
Auto-refresh between menus; automatic download of TXT/Excel files and tray mode; scales identified by MAC; several shortcut-key layouts; print-format editor with multi-select and arrow-key moves; stock function (beta); separate Clear/Cancel in the shortcut PLU picker; "Menu Parameter" (Advanced Setting) added.

### 2.10 Teaching videos (Document\Teaching Video; `.exe` self-players, not run)
- A-Basic: A000 Firewall (Win7-8), A001 ConfigWizard-BarcodeScale, A002 -CashRegister, A003 -Barcode, A004 -Management, A005 -Sale, A006 -UnitAndDisplay.
- B-Details: B004 Import PLU from xls or csv, B005 Export logs to Excel, B006 PLU Edition, B007 ConfigWizard-PrintFormat, B008 AdvancedSetting, B009 Spec Editing, B010 VIP Editing, B011 Stock Function, B012 Custom Info application, B013 Reset Report, B014 Dept & Class.
- C-System&Hardware: C001 BarcodeScanner Setting.

These topics match the Beeftown priorities: B004, B006, B007, B009 and A001 are the ones to mirror in our guide (INFERRED).

### 2.11 What our tool should replicate (summary, INFERRED)
- **Must have**:
  - PLU basic editing: number, key, item code, name, unit, price.
  - Shelf-life fields PS_UD/PC_UD and packing date.
  - Global texts: store name, phone.
  - Shortcut-key map with a printable overlay.
  - A small Spec panel: date format, shelf mode/days, paper and darkness, decimals, price-change lock, USB auto-update.
  - Label layout editing, or at least choosing between vetted Beeftown templates.
  - TMS round trip.
  - Excel/CSV import/export of the price list.
- **Nice to have**: logo bitmap; import of the sale list from the scale's USB for a daily sales-by-cut report; time sync.
- **Skip**: VIP, salesman, service fee, tax, stock tables, packages/materials, custom tables, flag designer, firmware upgrade, MAC tools, RS232.

---

## 3. HSD (use-by / shelf-life) and date formats

### 3.1 PLU fields (UM p.39, p.17, p.48–49; PluForm.cs:3631–3691; SaveForm.cs:1060; `Combo.xml:3–22`)

| Manual step | TMS field # (SaveForm.cs:1060) | Meaning | Values |
|---|---|---|---|
| PLU.22 PS-SD | 23 | Print sale date | 0 no / 1 yes |
| PLU.23 PS-ST | 24 | Print sale time | 0 no / 1 print the preset time (PC-ST) / 2 print the current time |
| PLU.24 PS-PD | 25 | Print **packing date** | 0/1 |
| PLU.25 PS-PT | 26 | Print packing time | 0/1/2 as for PS-ST |
| **PLU.26 PS-UD** | **27** | **Print shelf (use-by) date** | 0/1 |
| PLU.27 PC-SD | 28 | Sale date = today + N days | |
| PLU.28 PC-ST | 29 | Preset sale time **HHMM** | max 2359 (PluForm.cs:3661) |
| PLU.29 PC-PD | 30 | Packing date = today + N days | |
| PLU.30 PC-PT | 31 | Preset packing time HHMM | |
| **PLU.31 PC-UD** | **32** | **Shelf days**: expiry = today + N; "0 means valid only today" | 0–999 (PluForm.cs:3691) |

- Field numbers count tab-separated fields of the `PLU` line with field 0 = "PLU". This matches our tool's 69-field template, which currently writes 0 in fields 23–32 (Beeftown_Can_TMA.html:329). **Result: the tool currently turns HSD printing off for every PLU it creates** (INFERRED from the template; CONFIRMED that those positions are PS_*/PC_*).
  - [verified-add] Re-counted: in `PLU_TEMPLATE` (Beeftown_Can_TMA.html:329) fields 16–22 are empty (Text1–7), fields 23–34 are `0` (PS_SD…PC_UD, DF_D, DF_U), 35–36 `0,0` (DF_DN/DF_UN), 37/38 = `0`/`127` (DA_Sort1/DA_Day1) — exactly the SaveForm.cs:1060 order (field *n* = format slot {*n*−1}). Only **new** rows use the template; an edited existing PLU keeps its own fields (html:475 copies the original row), so existing HSD settings survive price/name edits. With Spec105=2 the global Spec106 would still apply to new PLUs (INFERRED).
- The Easy Manual example sets Shelf Date Print = 1 and Shelf Days = 3 (EM §1.2). The UM example sets PS-UD 1 and PC-UD 3 (UM p.17, p.49).
- Excel import column **"Shelf date data(+print)" (`PC_UD_Plus`)** sets PC_UD and, if it is at least 1, also PS_UD=1 (ExcelForm.cs:533–541; NetForm.cs:5943–5951). This is a good behaviour to copy: typing an HSD of N days switches printing on (CONFIRMED).
  - [verified-fix] The same code also sets **PS_UD=0 when the value is 0** (ExcelForm.cs:543–546; NetForm.cs:5953–5955). So through that column, "0 = valid today only" cannot be printed; it switches the HSD off. Our tool should keep a separate "print HSD" switch if same-day use-by is ever needed.
  - [verified-add] Real data example of an HSD PLU: in the technician's DB 2 of 7 PLUs have `PS_UD=1, PC_UD=30` (30-day shelf life) while all other date fields are 0 (`mdb\dump\A_ECS\PLU.tsv`; structure only). PLU Class defaults to 9 in both DBs, matching the tool template's field 14 = 9.
  - [verified-fix] "Sale Time (hour and minute boxes)" is the old CHM screenshot. In v3.10 each preset time is **one number box HHMM, 0–2359** (`pC_ST_HNumericUpDown` / `pC_PT_HNumericUpDown`, PluForm.cs:3659–3661, 3679–3681); the day boxes PC_SD / PC_PD / PC_UD are 0–999 (PluForm.cs:3651, 3671, 3691).
- PC PLU window, "Time Info" tab: Print Sale Date / Sale Time / Package Date / Package Time / Shelf Date combos, plus Sale Date, Sale Time (hour and minute boxes), Package Date, Package Time, Shelf Date day boxes (CHM "PLU" screenshot `PLU.files\image010.jpg`).

### 3.2 Global shelf-life Specs
- **Spec105 "Shelf Day Print"**: 0 = use the PLU setting; 1 = use Spec106 when the PLU has no shelf days; 2 = always use Spec106 (UM p.78).
- Tm.xml:738 adds, for newer firmware:
  - 0/1/2 are "(Due date mode)";
  - 3 = do not print shelf information;
  - 4/5/6 = the same three choices in "(Days mode)".
  - INFERRED: due-date mode prints the calculated date, days mode prints the number of days.
- **Spec106 "Shelf Days"** 0–999, days after today; 0 = today only (UM p.78).
- The manual advises Spec105/106 when every item on one scale has the same shelf life (UM p.17, p.49).
- Sample `Config\en\_ECS.TMS`: `TMS 104 0`, `TMS 105 0`, `TMS 106 0` (factory defaults).
- [verified-add] **Export trap:** in the factory PC database, and in the technician's install A, Spec104, 105 and 106 are the only Specs ticked for export, all with value 0 (`mdb\dump\A_en_Default\Spec.tsv`, `A_ECS\Spec.tsv`: `104 0 True`, `105 0 True`, `106 0 True`; every other Spec `False`). The writer sends only ticked Specs (SaveForm.cs:957–962). A "Spec" export from a default TM-xA database therefore resets the scale to date format `YYYY.MM.DD` and shelf mode "use PLU setting", undoing a DD/MM/YY setup (CONFIRMED mechanics; INFERRED effect on the scale). Install B has no Spec ticked (`B_ECS\Spec.tsv`).
- [verified-add] No code in TM-xA interprets Spec104–106 (no references in `tmxa-src\ECS\*.cs`; the label preview does not compute dates), so "due date mode" vs "days mode" can only be settled on the scale. There is no separate "shelf days" print item in LabelItem.xml (Item Info Flag3 0–36; only 15 "Shelf Date"), which supports the reading that days mode prints the number of days in the same Shelf Date slot (INFERRED).

### 3.3 Date and time format Specs
- **Spec104 "Date Type"** (UM p.78): 0 `YYYY.MM.DD` (default), 1 `YY.MM.DD`, 2 `MM/DD/YY`, 3 `MM-DD-YY`, **4 `DD/MM/YY`**, **5 `DD-MM-YY`**.
  - Tm.xml:732 labels these "24H" and adds 100–105 for 12-hour clocks, plus Persian calendars 6–10 and 106–110.
  - **No `DD/MM/YYYY` option exists.** The only day-first formats have 2-digit years. For Vietnam the best choice is **4 (DD/MM/YY)** (INFERRED; whether 2-digit years meet local labelling rules is not covered by these sources).
  - [verified-add] Spec104 has edit level 1 (UM p.78, last column), so on the scale it is reached with **Prog 1 2, ×, 104, Confirm** (or F-Prog+Prog, ×, 104, Confirm), not with the arrow keys; Spec105/106 are level 0. Manual range is 0–5; the 12-hour and Persian values exist only in Tm.xml:734 (CONFIRMED).
- **Spec265** month printed as 0 = digits or 1 = "two characters" (letters) (UM p.84; Tm.xml:1602).
- **Spec266** date on the scale display: 0 default, 1 follow Spec104/265 (UM p.84; Tm.xml:1608).
- Scale clock display format: `YYYY MM DD hh mm ss W-n` (UM p.44). Clock battery failure = E7.40.

### 3.4 Making the date appear on the label (UM p.54–55; LabelItem.xml; `Combo.xml` LabelItem_Print)
- A print item must exist in the print format: Flag1 = 1 "Item Info", Flag3 = **11 Sale Date, 12 Sale Time, 13 Package Date, 14 Package Time, 15 Shelf Date** (UM p.55; LabelItem.xml:343–363). "Sale Info" Flag2 3/4 = Print Date/Time, which is always the current date.
- A constant caption such as "HSD:" can be given the print condition **9 "Shelf Date Print"** so it only prints when the PLU prints a shelf date. Conditions 7 and 8 do the same for sale and packing date (UM p.54; `Combo.xml:61`). Our tool's label texts include `'HSD'` and `'Ngày đóng gói'` (Beeftown_Can_TMA.html:599). Their LAS rows should use these conditions (INFERRED).
  - [verified-add] What the factory PC templates do: the English item-label templates put condition **9** on both the "Shelf Date" caption and the Shelf Date item (`Config\en\_ECS.TMS` LAB 11000: `LAS 16 3 6 0 9 …` caption = Const Text 6 "Shelf Date"; `LAS 19 1 0 15 9 …` = item Shelf Date; same in PC DB labels 10 and 11, `mdb\dump\A_en_Default\LabelItem.tsv`). CONFIRMED.
  - [verified-add] What the Beeftown-style label 28 does (the tool's example, html:600–605, and PC DB label 28): "HSD" caption = `LAS 3 16 0 1` and Shelf Date item = `LAS 1 0 15 1`, i.e. condition **1 (always)**. With PS_UD=0 the caption "HSD" will still print, and the date slot is probably blank (INFERRED; check a real label). Changing the Print field of both rows from 1 to 9 hides the caption on items without HSD.
  - [verified-add] "Ngày đóng gói" on label 28 is followed by Sale Info Flag2=3 **Print Date** (`LAS 2 3 0 1`), which is always the date of printing. The PLU packing-date fields PS_PD/PC_PD do not affect this label; they would need a Flag1=1 Flag3=13 "Package Date" item (LabelItem.xml:350–354).
- The barcode can carry dates:
  - Barcode_Source 16–18 = print date Y/M/D; **26 Shelf Term, 27–29 Shelf Date Y/M/D** (`Combo.xml:337–349`).
  - Old manual table: Q/R/S = sale year/month/day (UM p.52).
- **To print HSD** (INFERRED recipe, to verify on the scale):
  1. The label format has a Shelf Date item.
  2. Either PS_UD=1 and PC_UD=N days on the PLU, or Spec105=2 and Spec106=N for all PLUs.
  3. Spec104=4 for day-first dates.
  4. The scale clock is correct (P11).

---

## 4. Glossary (suggested Vietnamese terms for the guide)
PLU = mã hàng / mặt hàng; shortcut key (SCxx) = phím tắt (phím chữ); Item Code = mã hàng in trong mã vạch; Index barcode = mã vạch ngoài (EAN); U.Price = đơn giá; T.Price = thành tiền; Tare = trừ bì; Zero = về 0; Accu/Confirm = cộng dồn / xác nhận; Cash/Print = tính tiền / in; Amend = sửa / lưu; Cancel = huỷ / thoát; Feed = đẩy giấy; gap paper = giấy tem (decal có khe); plain paper = giấy in hoá đơn; label = tem; receipt = hoá đơn; shelf date = hạn sử dụng (HSD); packing date = ngày đóng gói (NĐG); Spec = thông số cài đặt; String / Global Text = chữ chung (tên cửa hàng…); validate code 9958 = mã xác nhận xoá; Hardware Assistant = cài đặt phần cứng; buffer V1–V4 = giỏ khách 1–4; report = báo cáo; manual report = báo cáo theo kỳ (chốt ca).

---

## Verification log

Adversarial re-check of this file against the decompiled source (`scratchpad\tmxa-src\ECS`), the install XMLs, the sample `Config\en\_ECS.TMS`, the TSV dumps (`scratchpad\mdb\dump`), the manual text (`scratchpad\manuals_txt`, page markers) and the rendered images. Other customers' names, addresses and phone numbers seen in the dumps (PLU names, label texts, device names) were deliberately **not** copied here; only structure is cited.

| # | Claim checked | Evidence | Outcome |
|---|---|---|---|
| 1 | Printed page N = PDF page N+11 | `manuals_txt\Printing Serial Scale V3.04A.txt`: "===== PAGE 12 =====" is followed by printed "1", PAGE 70 by "59" | CONFIRMED |
| 2 | PS_UD = TMS PLU field 27, PC_UD = field 32; template writes 0 in 23–32 | SaveForm.cs:1060 (field *n* = slot {*n*−1}); Beeftown_Can_TMA.html:329 re-counted | CONFIRMED (+ note: only new PLUs affected) |
| 3 | Manual step PLU.nn = TMS field nn+1; DF_D before DF_U in TMS; P31 table swaps them | UM p.39 vs p.43; SaveForm.cs:1060; `Combo.xml` PLU_Col lists DF_U before DF_D (Excel order only) | CONFIRMED |
| 4 | `A_xxx.TMS` literal auto file vs `A_nnn.TMS` | SaveForm.cs:487–494; UM p.59; CHM "TMS File" | CONFIRMED; label "Update at once" was wrong → "Boot File", ticked by default (SaveForm.cs:279–280, 724) [verified-fix] |
| 5 | Load needs a third Accu/Confirm after "000" | UM p.59 Ex.5-13 (Prog, 4, 1 → "000", × or number, **Confirm** = load); save flow Ex.5-14 uses Amend at the same point | CONFIRMED as manual behaviour; still to test on V3.14E8 |
| 6 | 9958 at P33, P52x, A52, A53; none at A51, A54 | UM p.43, p.58, p.61, p.66–67 (Ex.6-2…6-5); EM §11.4, §13 images | CONFIRMED; A51/A54 run immediately with no confirm |
| 7 | Admin password <factory default> guards P5; PC admin/<factory default>, user/blank | UM p.15, p.43, p.61; EM §13 image | CONFIRMED |
| 8 | Spec104 options; no DD/MM/YYYY | UM p.78; Tm.xml:732–734 | CONFIRMED; added edit level 1 [verified-add] |
| 9 | Spec105 options 0–6 with "Due date"/"Days" modes; Spec106 0–999 | Tm.xml:738–740; UM p.78; no code uses them (grep of `ECS\*.cs`) | CONFIRMED text; meaning of the modes still INFERRED |
| 10 | Print condition 9 = "Shelf Date Print"; 34 conditions | `Combo.xml:59–62`; 34 `<LabelItem_Print>` entries; UM p.54 (0–13) | CONFIRMED |
| 11 | Flag3 11–15 = Sale Date / Sale Time / Package Date / Package Time / Shelf Date | LabelItem.xml:340–364; UM p.55 | CONFIRMED; no separate "shelf days" item exists |
| 12 | Barcode sources 26 Shelf Term, 27–29 Shelf Date Y/M/D; 46 sources | `Combo.xml:335–350`; 46 `<Barcode_Source>` entries | CONFIRMED |
| 13 | Excel `PC_UD_Plus` sets PS_UD=1 | ExcelForm.cs:533–547; NetForm.cs:5943–5955 | CONFIRMED, but it also sets PS_UD=0 when the value is 0 [verified-fix] |
| 14 | PC_ST/PC_PT max 2359, PC_UD 0–999 | PluForm.cs:3651, 3661, 3671, 3681, 3691 | CONFIRMED; CHM "hour and minute boxes" outdated [verified-fix] |
| 15 | Manual "Spec151" in the stable-wait note is a typo for Spec086 | UM p.23 (text), UM p.80 (151 = IP octet 2), Tm.xml:642–644 | CONFIRMED |
| 16 | Spec083 options | UM p.76–77 (0~3 incl. option 3); Tm.xml:632 (adds 4) | Partly wrong: option 3 is in the manual [verified-fix] |
| 17 | Shortcut function codes | `Combo.xml:1245` | Off-by-one: 1 = digit 0 … 10 = digit 9, 11 = 00, 68 = 000 [verified-fix] |
| 18 | Log type codes 259, 308, 777–780, 1249/1253/1254 | `Combo.xml:1229` | CONFIRMED |
| 19 | Pole = SC1–63 incl. Paper Type/Manual Weight/-Num; bench = SC1–40 without them | `kb_pole.png`, `kb_bench.png`; `ScPLU_KAB.xml`, `ScPLU_KAD.xml` section sizes | CONFIRMED; key-number layout added [verified-add] |
| 20 | Wizard device → keyboard layout map | WizardForm.cs:3594–3625; `Combo.xml` ScPLU_Layout names | CONFIRMED |
| 21 | DHCP when Spec153=0; ports 33581–33584 | UM p.14, p.80–81; Tm.xml Spec153 "0 means DHCP mode"; `_ECS.TMS` TMS 150–153/166–169 | CONFIRMED |
| 22 | Spec range "250–457" | UM p.87 ends at 457; Tm.xml has 383 rows, max ID 498 | Incomplete → 480–498 added [verified-fix] |
| 23 | PLU user range "10–9 999 996 when Spec092=1" | UM p.48 table; UM p.77 Spec092; `app.config` minUserPLUID=1 | Wrong → 1–9 999 996 (Spec092=1) / 10–5 999 (Spec092=0) [verified-fix] |
| 24 | E2.05 "Leave the menu with Cancel" | UM p.71 | Imprecise → forbidden to leave with Sale/Prog/Account; use Cancel [verified-fix] |
| 25 | Label-size table p.11 (Spec000/005/027) | UM p.11; UM p.74 (Spec027 = report width mm); UM p.75 (Spec039 in dots) | CONFIRMED; units added [verified-add] |
| 26 | Guider buttons, FontBuilder launch, 66 Excel fields, 383 Specs, Wizard label sizes | GuiderForm.cs:245–251; MainForm.cs:1168–1178; `Combo.xml` 66 `<PLU_Col>`; Tm.xml; `form_labels.txt` WizardForm (30×40, 40×30, 60×30, 60×40; 40/57/60 mm) | CONFIRMED |
| 27 | Tm.xml line citations (522, 540, 546, 630, 642, 732, 738, 1602, 1608) | Each points at the `<SpecID>` line; `<Display>` is 2 lines below | CONFIRMED |
| 28 | Spec080/082 "adds allowed with authentication" | Tm.xml:626 and Spec080 text vs UM p.76 | Understated: values renumbered (1 = with authentication, 2 = allowed) [verified-fix] |
| 29 | SCP page 0 = no Shift | SaveForm.cs:1006; `ScPLU_*.xml` "Page 1" uses Data_Page 0 only; `A_en_Default\Face.tsv` | CONFIRMED; EM shows "1-01" on screen (firmware display difference) [verified-add] |

**Missed facts added** (all marked [verified-add] in the text): Boot File default; scale can itself write A_xxx via ×; deletions without `CLR` probably do not reach the scale; PC-made TMS files start with a blank line and are rejected by the tool; tool's LAS "size" is really Align; label 28 uses condition 1 (always) for HSD caption and date, and "Ngày đóng gói" prints the print date; export trap (default DB exports only Spec104–106 = 0); TIM/INF/INM row formats (2-digit year; INF field 4 = "model firmware"); LogInfo is a 14-scale technician log; Excel unknown-unit pitfall; Spec088 dummy shortcut; Spec067 = 1 in PC data; Spec140 SID auto-clear; Spec104 edit level 1; key-number layout of both keyboards.

**Stated unknowns, status after this pass**
- Pole or bench keyboard: **still open**. The tool's key labels assume the 63-key pole/08's layout; both technician DBs use `ScPLU_KA` (08's, 63 keys) as the default face (`A_ECS\FaceList.tsv`, `B_ECS\FaceList.tsv`). Fastest check: field 4 of the `INF` line in a real `A_000.TMS` holds the model and firmware string (ReportForm.cs:5557–5575), or look at whether the keyboard has a Paper Type key.
- Third Accu/Confirm for loading: manual supports it (row 5); still test once on the scale.
- Auto-load only `A_xxx.TMS`: **strengthened** (manual, CHM "Update when start", PC "Boot File" default); not testable offline.
- Spec105 due-date vs days mode: **still open**; no code interprets it; days mode most likely prints the day count in the Shelf Date slot.
- Whether Spec105=1/2 needs PS_UD=1: **still open** (manual wording for 2, "based on Spec106", suggests not).
- Whether the Beeftown label has a Shelf Date item with condition 9: **partly resolved**. The tool's example / PC label 28 has the item and the "HSD" caption, both with condition 1 (always). The real scale's format still needs a real export.
- Beeftown Spec104/105/106 values: **still open**; note the export trap above.
- 'U' font firmware: **still open**; read the INF firmware string from a real export.
- Label size: **likely 58×40** (label 28 = 464×320 dots; tool example 58×40). INFERRED.
- DD/MM/YY acceptability for Vietnamese labelling: not covered by any source.
- LogInfo MAC: **resolved as not attributable**. The log covers 14 scales from 2021 to 2026. The MAC …1AECB1 (first seen 2026-05-14) is only a candidate.
- CHM age: confirmed outdated in at least two places (PLU time boxes; "Update when start" became "Boot File").
