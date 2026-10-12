NOT WRITTEN TO DISK. The harness refused to create C:\Users\khanh\AppData\Local\Temp\claude\C--Users-khanh-OneDrive---C-NG-TY-C--PH-N-GREEN-SPEED-Desktop-FnB-Investment-FnB-Investment\f0b976db-1ff9-4083-8510-3b806a492229\scratchpad\spec\reports-sales.md ("Subagents should return findings as text, not write report files"). The complete spec (markdown) follows; save it to that path if a file is needed. Scratch artefacts that do exist: scratchpad\work-rep\rep2csv.py (reference parser), scratchpad\work-rep\ban-can-mau.csv (its output, names masked), and scratchpad\mdb\dump\{A_Old_2000_2023,A_Old_2023_2025,A_Bak_20260514,B_Bak_20260929} (archive and backup DBs copied to scratch first, then dumped).

# TM-xA scale: sales logs, reports and stock (from TM-xA Management Program v3.10)

Area: how sales records leave the TM-A label scale, how TM-xA stores and reports them, what its "Stock" function does, and a CSV layout that can feed the Beeftown kho (inventory) system.

Sources: the decompiled C# (`scratchpad\tmxa-src`), the Access dumps (`scratchpad\mdb\dump\*`), the install folders (read only), the scale manuals (text in `scratchpad\work\*.txt`), and one real USB export from the Beeftown scale (`scratchpad\khoi-phuc\sao-luu-truoc-kiem-thu\A_000.TMS`, firmware V3.14E8, MAC 0023F019CFCA). Nothing was executed and no device was contacted. Product names from other customers' test data are shown as `<name>`.

Labels: **[C]** = confirmed in code or data (file:line given). **[I]** = inferred. **[?]** = unknown. Paths are relative to `scratchpad\tmxa-src\ECS\` unless another folder is given.

The Access database password is hard-coded in the source (`ReportForm.cs:5252`, `Program.cs:842-843, 977-983`). It is deliberately not reproduced here.

---

## 0. Short answers

1. **One sale = one FID.** The scale numbers every record with an FID (transaction serial number, never reused while the memory lasts). It also gives confirmed sales an SID (receipt number of the day; it resets daily on this scale). Every record has a header (`REP`), one or more item lines (`RES`) and an end marker (`REE`). TM-xA copies the header into `Log` and the items into `LogItem`, keyed by (MAC, FID[, SubID]). [C] `RDS.cs:2308-2607`
2. **The same REP/RES/REE text travels over every channel.** It comes as a `DWL\tREP\t … END\tREP\t` section inside the scale's USB file `JHSCALE\A_xxx.TMS`, as the answer to `UPL\tREP\t…` on the LAN, and over RS232. The file is UTF-8, tab separated, with CRLF line ends. Numbers use the form `mantissa,decimals`. [C] real file lines 642-766; `NetForm.cs:3889-4044`; `ReportForm.cs:6041-6281`
3. **Pulling logs never clears the scale.** No code path sends a log-clear command. The scale keeps roughly 6 000–10 000 records and drops the oldest first. Only the keypad clears them: A52 "Clear All" with code 9958, or a factory reset (P52x). **"Reset Report" in TM-xA only empties the PC database** (Log, LogItem, Stock, StockItem, Device, SGroup) after copying `Report.mdb`. The next pull then fetches everything the scale still holds. [C] `MainForm.cs:1554-1568`; manual `Printing Serial Scale V3.04A.txt:842-846, 1906-1909, 3540-3543, 3765-3769`
4. **The PLU name in a RES line is not historical.** The scale looks it up in its *current* PLU table when it outputs the log. Weight, unit, unit price and total *are* stored at sale time. Proof: FID 5 and FID 6 of the Beeftown scale reached TM-xA in 2024 with the names of that time (`B_Report\LogItem.tsv`). The 2026 USB export of the same FIDs carries the names that PLU 1 and PLU 2 have now, while every number is unchanged. **The item code (mã cân) is not in the log at all**, unless Spec 290–293 "Log Text" is set to 9 = Item Code. Today it is 0 on the scale. [C]
5. **Most records on the Beeftown scale are not sales.** Of 41 records, 15 have Type 2 "Unconfirmed": weighed and priced, but no label printed. The scale records them because Spec 283 = 1. An inventory import must count only Type 0 (Sale), minus Type 1 (Buy Back = customer return). [C] real file lines 642-766
6. **TM-xA's PC reports:** a "Bill Report" per scale (counts and money by payment kind), a "PLU Total Report" by log type, and a "PLU List Report" by PLU and type. All three can be filtered by time, stock group, scale, PLU and free field expressions. A configurable column export writes an .xls file (Jet "Excel 8.0"). The scale prints its own reports: total, department, class, PLU, salesman and sale list. [C] `ECS.Query_A4.rdlc`; `ReportForm.cs:4960-5058, 5285-5349`; manual `:3515-3548`
7. **"Stock" is a PC-side running balance per (stock group, PLU).** Every imported sale moves it, and so do manual documents: inbound, outbound, stocktaking, order and spoilage. It also has automatic "produce" (recipe) and "unpack" (box→pieces) rules. It has no link to the scale's own A6 stock report. [C] `RDS.cs:1427-1891, 2609-2959`

---

## 1. Where the data lives (PC side)

| Item | What it is | Evidence |
|---|---|---|
| `Report.mdb` (next to TM-xA.exe) | Report DB (Access, password-protected) with the tables in §2. Lock: `Program.reportLock`. | `Program.cs:92-103` |
| `Report\Backup\yyyyMMdd.mdb` | At **every program start**, Report.mdb is compacted into the day's backup, then copied back. Backups older than 32 days are deleted. | `Program.cs:987-1003`; files `Report\Backup\20260421.mdb`, `20260514.mdb`, and `tma co hsd2\Report\Backup\20260929.mdb` |
| `Report\OldLogs\<start>_<end>.mdb` | "Delete old logs" (`gen_RDRD` days, default 366, minimum 3). When the span between the oldest and the newest Log date is more than gen_RDRD days, rows older than `newest − gen_RDRD×2/3` days (Log, LogItem, StockItem) move to an archive file and a `History` row is written. | `Program.cs:1032-1118`; `app.config:674-676`; `MenuParameterForm.cs:1200, 1259-1267, 1503-1507`; `A_Report\History.tsv` |
| `History` table | `FileName="this"` holds the current DB's `Start`. The other rows name archives. **Imports skip any record older than `this.Start`** (`History_DT`). | `RDS.cs:1241-1242, 2375-2379` |
| `LogInfo.txt` / `LogError.txt` | One line per pull: `yyyy-MM-dd HH:mm:ss Success: <N> FID, MAC=<mac>, IP=<ip:port>`, where N = new transactions. Errors look like `Parse Error: …`, `Lost: FID = a ~ b, …` and `Collision: FID = 0, …`. Only written when `FXP_Logs_Report` = True (the default). | `RDS.cs:2066-2080, 2594`; `Program.cs:600-612`; `LogInfo.txt` (35 lines) |
| `Report\LogError\yyMMddHHmmss_<MAC>.txt` | The **raw wire text** of a LAN pull that failed to parse. It is a useful capture format for tests. None exist in either install. | `NetForm.cs:3953-3955, 3965-3967, 4032-4034` |
| `*.tmbck` (menu Report → Backup/Restore Report) | Text dump of SGroup, Device, Log, LogItem, Stock and StockItem, UTF-8, encrypted with Rijndael-ECB-PKCS7 under a fixed 32-byte key embedded at `Program.cs:82` (not reproduced). It is not needed for our tool. | `MainForm.cs:1570-1690, 1823-1849` |
| `Report_yyMMddHHmmss.mdb` | Copy made just before "Reset Report" or "Restore Report" wipes the tables. | `MainForm.cs:1556-1567, 1635-1645` |

The data dumped for this study:

* `A_Report` (install A, 19 logs, 2 scales, 2025-10 … 2026-03)
* `B_Report` (install B, 29 logs, 6 scales, 2024-04 … 2025-02; this includes **FIDs 2–6 of the Beeftown scale 0023F019CFCA**)
* `A_Old_2000_2023` (59 logs, 2021)
* `A_Old_2023_2025`, `A_Bak_20260514` and `B_Bak_20260929` (archive and backup copies, copied to scratch first, then dumped)

---

## 2. Report DB schema: every table and column

Schema: `ReportDataSet.cs` (typed dataset). SQL: `ECS.ReportDataSetTableAdapters\*.cs`. PK = primary key.

### 2.1 `Log`: one row per transaction (FID). PK (MAC, FID) [C] `ReportDataSet.cs:1369`

| Column | Type | Meaning | Source in NL_Log_Get |
|---|---|---|---|
| MAC | String(50) | Scale MAC, 12 hex digits, e.g. `0023F019CFCA`. For manual PC stock documents: `PC-<GID>`. | USB `INM[1]`; LAN MAC; `RDS.cs:1462-1465` |
| FID | Int32 | Scale transaction serial number (1 per label/receipt/event), increasing | `REP[7]` |
| DateTime | DateTime | Scale local time (no time zone), year = 2000+YY | `REP[1..6]` |
| SID | Int32 | Receipt number of the day (Spec 140 = 2 daily). **0 for records that are not confirmed sales** (types 2 and 3, events). | `REP[8]` |
| Salesman | Int32 | Salesman number. It is 0 everywhere, because Spec 135 = 0 ("Disable, Save with Salesman=0"). | `REP[9]` |
| DisRound | Decimal | Discount and rounding: Σ (Price − Tax) over the SubID 0 lines with PLU 9999996 | `RDS.cs:2458-2462` |
| Sfee | Decimal | Service fee: SubID 0 lines with PLU 9999997 | `RDS.cs:2463-2466` |
| Payment_Card | Decimal | = −Price of PLU 9999995 | `RDS.cs:2467-2469` |
| Payment_Other_1..3 | Decimal | "Payment 1/2/3" = −Price of PLU 9999994 / 93 / 92 | `RDS.cs:2470-2478` |
| Payment_Total | Decimal | "Grand Total" = Σ Price of item lines of types 0, 1, 10 and 11, plus the DisRound and Sfee lines | `RDS.cs:2460, 2465, 2577-2582` |
| Tax / Cost | Decimal | Σ over the counted item lines (Tax also from 9999996) | same |
| SubNo | Int32 | "Accumulated" = number of LogItem rows stored (items plus events) | `RDS.cs:2507, 2540` |
| Alipay, WXpay, Epay2..7 | Decimal | = −Price of PLU 9999981…9999988 | `RDS.cs:2479-2502` |

### 2.2 `LogItem`: one row per stored RES line. PK (MAC, FID, SubID) [C] `ReportDataSet.cs:1824`

| Column | Type | Meaning | RES index |
|---|---|---|---|
| MAC, FID | | Parent Log | – |
| SubID | Int32 | 1..n = items, strictly consecutive (a gap aborts the import). 0 = event (Type ≥ 255). Payment lines also carry SubID 0, but they are not stored. | [1] |
| Price | Decimal | **Line money total**, signed, historical | [2] |
| PLU | Int32 | PLU number at sale time; special numbers in §4 | [3] |
| Class / Dept | Int32 | CLS / DPT numbers (9 = Default; T-Weight 1, T-Count 2) | [4] / [5] |
| Cost | Decimal | From the scale (V3.00A+ and `gen_CostFromDevice`), otherwise PC PLU.Cost × Amount | [6], `RDS.cs:2569-2576` |
| Amount | Decimal | Quantity in Unit (kg for 3, pcs for 2). Signed, historical. | [7] |
| Unit | Int32 | 2 = pcs, 3 = kg (observed). Ids ≥ 20 are treated as pcs [I]. | [8], `RDS.cs:1655-1658` |
| Type | Int32 | Log type, §3 | [9] |
| Tax | Decimal | Tax money | [10] |
| Text1..4 | String(255) | Chosen by Spec 290–293 "Log Text": 0 empty, 1 PLU name, 2–8 PLU Text1–7, **9 Item Code**, 10 Barcode Index, 11–14 custom info, 15 card number. For events, Text1 holds the detail (e.g. `UA006 V3.14E8`). All 0 on the Beeftown scale. | [11..14]; `Tm.xml:1728+` |
| UnitPrice | Decimal | Price per Unit, historical | [15] |
| CoFID | Int32 | "Related FID" (关联FID). [I] Original FID for a return made from an existing log. 0 in all data seen. | [16] |
| PLUName | String(255) | Name sent **at output time** (not historical) | [17] |
| DateTime | DateTime | Copy of Log.DateTime | – |

### 2.3 Other tables

| Table | PK | Columns and meaning | Evidence |
|---|---|---|---|
| Device | MAC | `Name` = `★shop★device name★machine no.`; `GID` = stock group (0 = "No Sale": never pulled and never reported); `FIDed` = **last FID imported** (the next LAN pull asks from FIDed+1) | `ReportForm.cs:4911, 5634`; `NetForm.cs:3893, 3916`; `Device.tsv` |
| SGroup | GID | Stock group: 0 = No Sale, 1 = Default, more in Multi-Stock mode | `RDS.cs:1243-1275, 1906-1959` |
| History | FileName | FileName, Start, End (§1) | `Program.cs:1091-1115` |
| Stock | (GID, PLU) | Running balance, §9 | `ReportDataSet.cs:2554` |
| StockItem | KID autoinc | Stock journal, §9 | `ReportDataSet.cs:2939` |
| rLogsType | TypeID | Log type names, rebuilt at each start from Combo.xml "Logs Type Full" | `RDS.cs:1286-1309`; `Combo.xml:1228` |
| rStockType | TypeID | The 11 stock-moving types ("Stock Type Full") | `RDS.cs:1310-1332`; `Combo.xml:1224` |
| rPLU | PLUID | **Copy of ECS.mdb PLU** made before each report or export, plus the special PLUs from "PLU Default". `Remark` = Item Code, `Index` = Index Barcode. The report and Excel "PLU Name" come from here, i.e. the **current PC name**. | `ReportForm.cs:5227-5283`; `StockItemForm.cs:1070-1074` |
| rUnit | UnitID | 1 Weight(system), 2 pcs, 3 kg (Pack 1000), 4 g, 5 ton, 6 lb, 7 500g, 8 100g, 9 1/4lb. Punit 1 = weight, 2 = count. | `RDS.cs:509-532` |
| rType | – | Empty and unused | – |
| Expr | ID | Saved filter rows: Not, AndOr, Field, Op (=, <>, >, <, >=, <=, BETWEEN), Expr1, Expr2, Display | `ReportForm.cs:5107-5186, 5402-5461` |
| Excel | ID | Ordered list of the columns chosen for the Excel export | `ReportForm.cs:5285-5390` |
| In memory: AllLogs, AllStocks, ResultLog, ResultLogItem (+ Count, Weight), StockMultiItem, StockExcelItem | | Grids and report datasets | adapters |

Relations: SGroup→Device, SGroup→Stock, SGroup→StockItem (GID); Device→Log (MAC); Log→LogItem (MAC, FID) [C] `ReportDataSet.cs:18474-18483`.

---

## 3. Log type codes (`rLogsType`: 33 rows)

Names are from `Combo.xml:1228` and zh-CHS. "PC counts" = added to `Payment_Total` (types 0, 1, 10, 11: `RDS.cs:2454, 2577`). "PC stock" = passed to the Stock journal (`RDS.cs:1600`).

| Type | Name (en / zh) | Meaning | PC counts | PC stock | Seen | Beeftown kho |
|---|---|---|---|---|---|---|
| −1 | NULL / 无操作 | Filter placeholder | – | – | never | – |
| 0 | Sale / 销售 | Confirmed sale, label printed; SID ≥ 1 | yes | yes (−) | yes | **sale (stock out)** |
| 1 | Buy Back / 退货 | Return. Spec 74 bits: +1 mark an existing log ("-RT-"), +2 new return, +4 mix, +8/+16 switches. [I] Arrives negative. | yes | yes (+) | no | **return (stock back)** |
| 2 | Unconfirmed / 未确认 | Weighed and priced, not confirmed. Spec 283 = 1. SID 0. Amount can be negative (FID 25: −0.06 kg). | no | no | **15 of 41** | ignore; audit |
| 3 | Deleted / 清除 | Removed from the sale buffer (Amend), recorded when Spec 118 = 1 or 3 (Beeftown 3). SID 0. | no | no | A_Report FID 14, 17 | ignore; audit |
| 4 | Hangup / 挂单 | Suspended bill (Spec 279; Beeftown 0) | no | no | no | ignore |
| 5 | Auto Mode / 自动模式 | [I] Sale in batch, prepack, lock or auto mode when a Spec 264 bit is set (Beeftown 0). **TM-xA ignores it in totals and stock.** | no | no | no | treat as 0 if 264 ≠ 0 |
| 6–9, 15 | SP06–09, SP15 | Reserved | no | no | no | ignore |
| 10 / 11 | Inbound / Outbound (入库 / 出库) | Stock in / out | yes | yes (+/−) | no | stock document |
| 12 | Stocktaking / 盘库 | Count: sets the balance | no | yes | no | stocktake |
| 13 | Order / 订单 | Quantity on order | no | yes (Order) | no | ignore |
| 14 | Spoilage / 折损 | Loss | no | yes (−) | no | loss |
| 252 | Produce / 生产 | PC-made recipe consumption | no | yes | no | – |
| 253 / 254 | Unpacking(+/−) / 拆箱 | PC-made box→pieces | no | yes | no | – |
| 255 / 256 | Error / Unknown Error | Event | – | – | no | event |
| 257 | FID Lost | Event; expect a FID gap | – | – | no | event |
| 258 | FID Repeat | Event | – | – | no | event |
| 259 | IlleageBoot / 非法重启 | Event: abnormal reboot | – | – | no | event |
| 308 | A52 | Event: "Clear All reports and records" done | – | – | no | event; FIDs may restart [I] |
| 451 (zh list only) | E1.95 云支付结果未知 | Event: cloud-payment result unknown | – | – | no | event |
| 777–780 | P521–P524 | Event: factory-default recovery (manual `:3494-3502`) | – | – | no | event; FIDs may restart [I] |
| 1249 | E9.93 | Event | – | – | no | event |
| 1253 | E9.97 Flash ReInit | Event | – | – | no | event |
| 1254 | E9.98 Firmware Upgrade | Event, Text1 = firmware. It is the **first record of every scale seen**. | – | – | yes | event |

**Event decoding rule [C by arithmetic over the whole list]:** Type = 256 + code.

* 257–259 = 256 + 1..3
* 308 = 256+52 → A52
* 777–780 = 256+521..524 → P521–P524
* 1249/1253/1254 = 256+993/997/998 → E9.93/E9.97/E9.98
* 451 = 256+195 → E1.95

So an unknown event can be shown as `E{code/100}.{code%100:00}`.

---

## 4. Special PLU numbers

From `Combo.xml:1240` "PLU Default" and `RDS.cs:2456-2502`.

* **9999999** T-Weight: temporary weighed sale, Class/Dept 1, no item code.
* **9999998** T-Count: Spec 094 default; Class/Dept 2.
* **9999997** Service Fee → Sfee.
* **9999996** Discount and Rounding → DisRound (Spec 98/99 = 3 on Beeftown).
* **9999995** Card → Payment_Card.
* **9999994 / 93 / 92** Payment 1 / 2 / 3.
* **9999991** Store Payments: [I] not handled by NL_Log_Get.
* **9999981 / 82 / 83–88** Alipay / WeChat / Epay2–7.

---

## 5. Wire and USB format of sales records

### 5.1 Channels [C]

| Channel | How the text arrives | Evidence |
|---|---|---|
| USB stick | File `JHSCALE\A_xxx.TMS`, written by the scale in P41 "U-Disk" (manual `:3237-3361`). **[Amend] = save all working data**: DPT, CLS, PLU, UNT, BAR, LAB, SAL, **REP**, SCP, TMS, TMT, INF (with INA/INM/INF lines) and TIM. REP holds **every record still in memory**: the Beeftown file has FIDs 2…42, from 2024-04 to 2026-09. **[PLU] = "un-uploaded sale list"**; **[F-Prog]+[PLU] = "all un-deleted sale list (PC software's repeat upload)"**. | real file; manual `:3324-3361` |
| LAN (TCP 33581) | `UPL\tREP\t[-]<first FID>\t` → REP/RES/REE lines, then a line starting with `END`. The PC reads until two reads agree, then sends `UPL\tEND\t`. See `net-protocol.md` §5.10. | `NetForm.cs:3889-3991` |
| RS232 | `UPL\tINF`, `UPL\tMAC`, then `UPL\tREP\t<FIDed>\t` or `-1` for "Re-Upload", reading until two reads are identical | `ReportForm.cs:6041-6281` |

The scale also pushes `ASK\tREP…` when Spec 58 bit 0 = 1 (TM-xA writes it; Beeftown TMS 58 = 1). [C] `NetForm.cs:830-850, 1445-1466`

### 5.2 Encoding and line rules [C]

* The scale-written file is UTF-8 **without BOM**: byte 0 is `ECS\tVER\tV3.14E8\t`, and `INA[2] = UTF-8`. The PC-written `_ECS.TMS` has `EF BB BF`.
* Lines end in CRLF. Each line is `KEY\t` + fields + `\t`, so `split('\t')` gives one trailing empty element.
* Inside text, `\v` means a line break (`Program.cs:224-227`).
* Numbers are `mantissa,decimals` = mantissa / 10^decimals; with no comma the value is an integer. The mantissa is parsed as int32, and a bad value silently becomes 0 (`Program.cs:229-251`). Trailing zeros are dropped: 0.070 kg → `7,2`.
* **VND on the Beeftown scale:** VND = mantissa × 10^(S − d), with S = Spec 202 (unit-price decimals) for UnitPrice and S = Spec 203 (total decimals) for Price, Cost and Tax. Both are 3 here. So `59150,3` = 59 150 đ and `845000,3` = 845 000 đ. The TM-xA DB stores the plain decimal (28.8 for 28 800 đ). Weight: kg = mantissa / 10^d (Spec 201 = 3).

### 5.3 Record layout [C] `RDS.cs:2329-2361, 2375-2385, 2447-2567`

```
DWL<TAB>REP<TAB>                        (USB only; the LAN reply ends at a line starting "END")
REP<TAB>YY<TAB>MM<TAB>DD<TAB>hh<TAB>mm<TAB>ss<TAB>FID<TAB>SID<TAB>Salesman<TAB>
RES<TAB>SubID<TAB>Price<TAB>PLU<TAB>Class<TAB>Dept<TAB>Cost<TAB>Amount<TAB>Unit<TAB>Type<TAB>Tax<TAB>Text1<TAB>Text2<TAB>Text3<TAB>Text4<TAB>UnitPrice<TAB>CoFID<TAB>PLUName<TAB>
REE<TAB>
END<TAB>REP<TAB>
```

* A REP line needs ≥ 10 split fields and a RES line ≥ 18, otherwise "Parse Error … seg 10/18" and **the whole import is refused**.
* Real lines (`A_000.TMS` lines 643-765; names masked):

```
REP 24 4 1 7 57 23 2 0 0                       (FID 2, event 1254, Text1 "UA006 V3.14E8")
REP 26 9 25 17 17 1 31 3 0
RES 1 59150,3 1 9 9 0,3 7,2 3 0 0,3 . . . . 845000,3 0 <name>   (0.07 kg × 845 000 = 59 150 đ, Sale)
REP 26 9 26 18 10 21 32 0 0 / RES 1 126750,3 1 9 9 0,3 15,2 3 2 …   (Type 2 Unconfirmed, SID 0)
REP 26 9 25 15 17 35 30 2 0 / RES 1 0,3 9999999 1 1 0,3 9000,3 3 0 … 0,3 0 T-Weight PLU
```

* Cross-check: `B_Report` holds FIDs 2–6 of the same MAC, pulled over the LAN in 2024-06 (`LogInfo.txt`). Date, SID, Price, Amount, Unit, UnitPrice, Class and Dept match the 2026 export exactly (FID 5: DB 28.8 / 0.48 / 3 / 60 = wire `28800,3` / `48,2` / `3` / `60000,3`). **Only PLUName differs.** FIDs 11–14 were sold as pcs at 22 000 đ, while PLU 3 is now a by-weight item.

### 5.4 How TM-xA turns the text into Log/LogItem: `RDS.NL_Log_Get` [C] `RDS.cs:2308-2607`

1. The Device row must exist. For USB it is added to group 1 when the file is listed (`ReportForm.cs:5612-5646`); for the LAN it also needs GID ≠ 0.
2. Pass 1 validates the field counts and finds min/max FID, then loads the existing Logs in that range for dedupe.
3. Pass 2, for each REP:
   * Build the DateTime; **skip it if older than History_DT**.
   * FID 0 → "Collision": the whole import is refused.
   * Already stored → skipped, so re-importing the same USB file is safe.
   * Update FIDed; a jump logs "Lost: FID = a ~ b".
4. For each RES until REE:
   * SubID 0 and Type ∈ {0, 1, 10, 11} → payment or adjustment into Log columns only.
   * SubID 0 and Type ≥ 255 → event LogItem.
   * SubID 0 with any other type → dropped silently.
   * SubID ≥ 1 must equal SubNo+1 (else the import is refused) → LogItem; Cost is optionally taken from the PC; types 0, 1, 10 and 11 are added to the totals; `Stock_Add` is called.
5. If ≥ 1 new FID: Log, LogItem, Device, Stock and StockItem are saved and "Success: N FID" is logged.
6. [I] Weakness: a refused import does not roll back the in-memory `Device.FIDed`, Stock or StockItem changes. The next successful import saves them (`RDS.cs:1343-1365, 2415-2432`). Our tool should use one DB transaction per file.
7. [I] Weakness: dedupe is by (MAC, FID) and the pull asks from FIDed+1. If FIDs restart (A52, P52x, E9.97), TM-xA skips the new low FIDs.
8. [I] RS232 quirk: lines are joined with `\n` but split on `\r\n` (`ReportForm.cs:6231, 6252`). Not relevant to Beeftown.

### 5.5 Does downloading clear the scale? ("Reset Report")

* **No.** No PC code deletes logs on the scale; `CLR\t<sec>\t` exists only for data tables (`SaveForm.cs:529-530, 952-953…`; no `CLR\tREP`). The 2026 export still contains FIDs 2–6 that were pulled in 2024.
* **Reset Report** (`MainForm.cs:1813-1821` → `:1554-1568`; "All logs and stocks will clear.") copies `Report.mdb` to `Report_yyMMddHHmmss.mdb`, deletes all rows of StockItem, Stock, LogItem, Log, Device and SGroup, and restarts. The scale is untouched. With FIDed gone, the next pull re-imports from FID 1.
* **On the scale** (manual `:3527-3548, 3609-3690`):
  * A51 clears the manual-report totals only.
  * **A52 (code 9958) clears all reports and records**, irreversibly, and leaves event 308.
  * A53 clears the stock report; A54 resets the SID.
  * The log store holds 6000–10000 records, FIFO (`:842-846, :3765-3769`, "close to 8000" `:1906-1909`); E7.30 = storage full (`:3988`).
* [?] The "un-uploaded" USB save implies a per-record uploaded mark. It is unknown whether a LAN pull sets it.

---

## 6. Scale settings that shape the log (Beeftown values from the real export)

* **91** Account Function = 0 (on); **96** E-Log = 0.
* **283** Record of Unconfirmed Data = 1 → Type 2 rows.
* **118** Amend Mode = 3 (Record) → Type 3 rows.
* **74** Buy Back = 0 → no returns.
* **264** = 0 → prepack sales stay Type 0.
* **279** Hangup = 0.
* **98/99** = 3 → discount/rounding recorded independently.
* **135** = 0 → Salesman 0.
* **140** = 2 → SID resets daily (seen: 2026-09-21 FIDs 23–28 have SID 1–5; 09-25 starts at 1 again).
* **143** = 6 → FID/SID printed 6 digits; a label can carry FID (label item 25) and SID (26), manual `:3071-3072`.
* **290–293** Log Text 1–4 = 0 → **set 290 = 9 (Item Code)**. [I] The text is stored at sale time; the "card number" option only makes sense per transaction.
* **58** = 1 (ASK REP; set by TM-xA).
* **201/202/203** = 3/3/3 (decimals).
* **0/1/2** = 28/28/20 (label format / barcode format / barcode flag).
* **208** = 3 (weight in the barcode in grams).

---

## 7. How the Beeftown export reads

* 41 records: 1 event (FID 2, type 1254), 25 Type 0 and 15 Type 2.
* One item per FID (label scale): SubNo = 1 everywhere, and there are no payment lines.
* FIDs 2–28 were made under the old vendor/test PLU table; FIDs 29–42 follow the Beeftown catalogue load (2026-09-25).
* The reference parser `scratchpad\work-rep\rep2csv.py` checks the item code with the unit price and unit (both historical). With that check, the PLU table in the same file **fails to match 21 of the 38 item lines**. A naive PLU→today's-code join would book 2024 sales of other goods as Beeftown beef.

---

## 8. Reports and exports in TM-xA

**Tabs** (`ReportForm.cs:4163-4480`):

* **Import**: files, folders or drag-and-drop `*.tms`, with MAC (INM), group, shop, machine, number and TIM. Also "Import from RS232" with "Upload Report" and "Re-Upload".
* **Logs**: Log/LogItem master-detail grids; devices and groups.
* **List**: `AllLogs` = the latest 1024 item lines, `ORDER BY DateTime DESC`; `AllStocks` = latest 4096; a column chooser (`MFR_L_*`/`MFR_R_*`).
* **Report → Filter**: time, stock group, device, PLU, one field + operator, and free `Expr` rows with AND/OR/NOT over the `Report_Col` fields.
* **Report → Report**: ReportViewer (below).
* **Report → Import/Export**: Excel export (below).
* **Stock**: §9.

**RDLC `ECS.Query_A4.rdlc`** (datasets `RS_Log` and `RS_LogItem`; the filter always adds `Device.GID >= 1`; titles from Combo.xml "Report Title"; parameters set at `ReportForm.cs:5012-5050`):

1. Header: title, filter, time range.
2. **Bill Report** (`Tablix11`, per MAC and "All Devices"):
   * Bill Count, Total Discount and Rounding, Total Service Fee, Total Tax, Total Cost
   * Total Profit = Payment_Total − Tax − Cost; Total Income = Payment_Total
   * Card, Payment 1–3, Alipay, WXpay, Epay2–7
   * Total not-Cash; Total Cash = Income − not-cash
3. **PLU Total Report** (`Tablix10`, by Type): Add-up Time (item lines with SubID > 0), Total Count, Total Weight, Income, Tax, Cost, Profit.
4. **PLU List Report** (`Tablix6`, by PLU, then Type): PLU No, PLU Name (current, from `rPLU`), and "Actual Sales" (Type ≤ 1) with count, weight, money, tax, cost and profit.

Weights are converted to one unit using `Pack` (`ReportForm.cs:4976-5010`).

There is **no dedicated department, class, salesman or time report on the PC**; use filters instead. **The scale prints** A1x Total, A2x Dept, A3x Class, A4x PLU (first 1000 PLUs), A8x Salesman (each daily / monthly / quarterly / manual), A6 stock, and A71 sale list (manual `:3515-3548`).

**Excel export:** `SELECT <cols> INTO [Excel 8.0;Database=<file>].[Sheet1] FROM Log⋈LogItem⋈Device⋈SGroup⟕rPLU⟕rUnit WHERE <filter> ORDER BY MAC, FID, SubID` → an .xls file (BIFF8); money is cast with CDbl (`ReportForm.cs:5206-5349`). The 25 selectable columns (`Combo.xml:971-1078`):

* Stock Group, Stock Name, MAC, Device, Date and Time, FID, SID, Salesman Number
* Sub ID, PLU Number, PLU Name (`[rPLU].[Name]`, current), Dept No, Class No, Unit Number, Unit Name
* Price (line money), Cost, Tax, Weight/Pcs (Amount), Type, Related FID (CoFID)
* Text 1–4, Unit Price

Stock tab exports, one sheet per group named `GID.Name` (`ReportForm.cs:6525-6674`):

* **Stock**: PLU No, PLU Name, Last Stocktaking, Amount In Stock, Unit No/Name, Spoilage, <+>Amount Balance, [S: book], <+>Money Balance, Safety Stock, Low Stock, Order.
* **StockItem journal**: Device Name, MAC, FID, Type, DateTime, PLU No/Name, Unit Price, Amount, Unit No/Name, Money.

---

## 9. The Stock function (PC side only) [C] `RDS.cs:1427-1891, 2609-2959`

**What it is.** A perpetual inventory per **stock group** (`SGroup`) and PLU. Each scale belongs to one group. Every imported item line whose Type is in {0, 1, 10, 11, 12, 13, 14, 252, 253, 254} becomes a `StockItem` journal row (KID; GID, MAC or `PC-<GID>`, FID, SubID, DateTime, Type, PLU, **signed Amount**, Unit, UnitPrice, Price) and updates the `Stock` balance.

**`Stock` columns:**

* **Amount / Unit**: current stock in the PLU's unit (Unit 1 → `Report_DefaultWeight` = 3 kg).
* **STakingTime**: last Type 12 count. Movements dated before it go to Spoilage.
* **In_Amount** ("<+> Amount Balance"): Σ movements since "Clear <+>".
* **Spoilage** ("<->"): count differences, Type 14, and late-dated movements.
* **AmountSP / UnitSP / In_AmountSP / SpoilageSP / Sped**: second book for movements in a unit of another physical kind (`RDS.cs:1663-1778`).
* **In_Money**: Σ Price.
* **SafetyStock / LowStock** (LowStock = Amount < SafetyStock).
* **Order**: Σ Type 13.
* **KID / KID_Time**: last journal row; PC time.

**Sign rules** (`RDS.cs:1432-1460, 1612-1616`):

* The journal amount is negated for types 0, 11, 1, 10, 14, 252, 253 and 254.
* PC-entered types 1 and 10 are made negative first, so Inbound and Buy Back increase stock and Sale and Outbound decrease it.
* Type 12 sets the counted value; Type 13 adds to Order; Type 14 decreases Amount and increases Spoilage.

**Automatic rules:**

* **Produce (252)**: if the sold PLU is a "Product" in `CoPLU_ProMat` (Multi = material per unit; materials must be by-weight PLUs), each material is reduced by amount × Multi and the money is split by material cost (`RDS.cs:1542-1598`). This is the reverse of Beeftown's "pha lóc" breakdown.
* **Unpack (253/254)**: when a by-count PLU goes negative, `CoPLU_BoxPcs` books box −n and pieces +n×Multi (`RDS.cs:1834-1891`).

**Manual documents:**

* **Edit Stock** (`StockItemForm`): type 0–99, PLU (search by number, item code, index barcode or name), unit, amount, and unit price. The price defaults to the PLU **price** for 0/1 and the PLU **cost** for 10/11; for type 12 the form shows the expected stock (`StockItemForm.cs:245-512`).
* **Multi Stock Items**: one grid row per PLU, with keep/remove zero rows (`RDS.cs:2665-2735`).
* **Excel/CSV Import** (`StockExcelForm.cs:924-1053`): .xls, .xlsx or .csv without a header. The user maps the columns for PLU, type (number or name), unit, amount, and price (0, PLU cost, PLU price, unit-price column, or total-price column).
* PC documents of types 0, 1, 10 and 11 also create a synthetic Log/LogItem under device `PC-<GID>`, which then appears in the sales reports (`RDS.cs:1466-1541`).
* Buttons: Clear <S>, Clear <+>, Clear <Order>, Clear <->, Safety Stock (`RDS.cs:2798-2959`).
* The scale's own A6 stock and A62 audit are separate [I].

---

## 10. Recommended minimal data model and CSV for the Beeftown kho

### 10.1 Principles

1. Import the whole REP section (USB [Amend] export or LAN pull) every time, and dedupe. Never trust "since last FID".
2. **Key = MAC + FID + SubID + transaction time (to the second).** Adding the time makes the key survive a FID restart.
3. Stock effect only for **Type 0 (+1 out)** and **Type 1 (−1 back)**, SubID ≥ 1, and a known item. Keep Types 2 and 3 as audit rows and events separately. Treat Type 5 as a sale only if Spec 264 ≠ 0.
4. **Item code** (`ma_can` = `kho_mat_hang.ma_can` = PLU col 2 = `PLU.Remark`):
   * (a) set **Spec 290 = 9** and read `RES[11]`;
   * (b) otherwise keep a **PLU history** written whenever our tool loads PLUs to the scale, and map by (PLU, sale time);
   * (c) last resort: use the PLU table of the same export, and **accept the match only if unit price and unit kind are equal**.
   * Never trust `RES[17]` (the name) as historical.
5. Money as integer VND (§5.2), weight as kg with 3 decimals, and keep the raw RES line.
6. **Clock:** the transaction time comes from the scale's RTC. Warn when the export's TIM and the PC time drift apart, and never write an old TIM back.
7. **A label is not yet a payment.** iPOS scans the label at the till, so Type 0 means "cut, weighed and labelled". The reconstructed barcode lets the kho match scale lines to iPOS later.

### 10.2 Tables (minimal)

```sql
can_may(mac text primary key, so_may int, ten_cua_hang text, ten_may text, phien_ban text,
  so_le_don_gia int, so_le_thanh_tien int, so_le_kg int, co_ma_vach text, lan_nhap_cuoi timestamptz);
can_plu_lich_su(mac text, plu int, ma_can text, ten text, don_vi smallint, gia_vnd bigint,
  hieu_luc_tu timestamptz, hieu_luc_den timestamptz, primary key (mac, plu, hieu_luc_tu));
can_dong(ma_dong text primary key, mac text, fid int, sub_id int, thoi_gian timestamp, sid int,
  nhan_vien int, loai_ma int, plu int, ma_can text, ma_can_nguon text, ten_hang text, don_vi smallint,
  so_luong numeric(12,3), don_gia_vnd bigint, thanh_tien_vnd bigint, gia_von_vnd bigint, thue_vnd bigint,
  text1 text, text2 text, text3 text, text4 text, fid_lien_quan int, ma_vach text, nguon text,
  dong_goc text, nhap_luc timestamptz default now());
```

Posting to the kho: group the rows with tinh_kho ≠ 0 and a known ma_can per day and item, then write a `ban_hang` document → `kho_so_cai.loai = 'ban'`, `so_kg = −Σkg`, `so_goi = −number of labels` (fits `C:\Beeftown\supabase\migrations\0020_kho_so_cai_nhap.sql:283-316`).

### 10.3 CSV `ban-can_<MAC>_<yyyymmdd-HHMMSS>.csv`

UTF-8 with BOM, comma separated, RFC 4180 quoting, CRLF, one header row, `.` as the decimal point, no thousands separators. **One row per RES line with SubID ≥ 1.** Events and payment lines go to an optional `su-kien-can_*.csv`.

Columns:

1. `ma_dong` (MAC-FID-SubID-yyyymmddHHMMSS)
2. `thoi_gian` (ISO, +07:00)
3. `ngay`
4. `may_can` (MAC)
5. `so_may` (TMS 40 / INF[3])
6. `fid`
7. `sid`
8. `sub_id`
9. `nhan_vien`
10. `loai_ma` (Type)
11. `loai` (ban / tra_hang / chua_xac_nhan / da_xoa / treo_don / che_do_tu_dong / nhap / xuat / kiem_ke / dat_hang / hao_hut / su_kien)
12. `tinh_kho` (+1 / −1 / 0)
13. `plu`
14. `ma_can`
15. `ma_can_nguon` (text1 / lich_su_plu / plu_cung_file / khong_ro)
16. `ten_hang` (name at export time)
17. `don_vi` (kg / goi)
18. `so_kg` (3 dp, signed)
19. `so_goi`
20. `don_gia_vnd` (RES[15] × 10^(S202 − d))
21. `thanh_tien_vnd` (RES[2] × 10^(S203 − d))
22. `ma_vach` (reconstructed EAN-13 or empty)
23. `nguon` (usb:<file>@<TIM> or lan:<ip>)
24. `dong_goc` (raw RES, optional)

Example rows (real FIDs 31, 32 and 42; names from the Beeftown catalogue in `C:\Beeftown\supabase\test\test-kho-can.mjs`):

```csv
ma_dong,thoi_gian,ngay,may_can,so_may,fid,sid,sub_id,nhan_vien,loai_ma,loai,tinh_kho,plu,ma_can,ma_can_nguon,ten_hang,don_vi,so_kg,so_goi,don_gia_vnd,thanh_tien_vnd,ma_vach,nguon,dong_goc
0023F019CFCA-31-1-20260925171701,2026-09-25T17:17:01+07:00,2026-09-25,0023F019CFCA,0,31,3,1,0,0,ban,1,1,10001,plu_cung_file,Lõi vai bò Mỹ,kg,0.070,,845000,59150,2010001000709,usb:A_000.TMS@2026-09-26T20:25:43,
0023F019CFCA-32-1-20260926181021,2026-09-26T18:10:21+07:00,2026-09-26,0023F019CFCA,0,32,0,1,0,2,chua_xac_nhan,0,1,10001,plu_cung_file,Lõi vai bò Mỹ,kg,0.150,,845000,126750,,usb:A_000.TMS@2026-09-26T20:25:43,
0023F019CFCA-42-1-20260926201906,2026-09-26T20:19:06+07:00,2026-09-26,0023F019CFCA,0,42,3,1,0,0,ban,1,2,10002,plu_cung_file,Sườn bò Hàn Quốc,kg,0.040,,876000,35040,2010002000401,usb:A_000.TMS@2026-09-26T20:25:43,
```

### 10.4 Rebuilding the label barcode [I, strong]

The log has no barcode string, and no Log Text option produces one (option 10 is the PLU Index field). It can be rebuilt from the same export:

* Spec 1 = 28 → `BAR\t28\tQS-Item\t…\tB201F501J500A000A000A000` = 2-digit flag + 5-digit item code + 5-digit weight + automatic check digit.
* Spec 2 = 20 is the flag; Spec 208 = 3 prints the weight in grams.

So `ma_vach = EAN13("20" + zfill5(ma_can) + zfill5(round(kg × 1000)))`. For 0.070 kg of 10001 that gives `2010001000709`. This matches the kho reader's default `2XCCCCCWWWWWK` (`C:\Beeftown\web\src\lib\kho\ma-vach.ts:1-21`). PLU `BarT1`/`BarF1` (cols 9–10, 0 here) would override it. Verify against one physical label.

### 10.5 Import algorithm

```
strip BOM → split CRLF/LF → UTF-8
read INM[1], INF[1..4], TMS{0,1,2,40,201,202,203,208,264,283,290..293}, TIM, PLU{no→code,unit,price}
for each REP (≥10 fields):
  for each RES until REE (≥18 fields):
    SubID 0 and Type in {0,1,10,11}  → payment line → su-kien file
    Type ≥ 255                       → event (code = Type − 256)
    else                             → item row; tinh_kho = {0:+1, 1:−1, 5:+1 if Spec264≠0}.get(Type, 0)
upsert by ma_dong in ONE transaction
report: new rows, duplicates, unknown ma_can, FID gaps, FID going down, clock drift
```

The working reference parser is `scratchpad\work-rep\rep2csv.py`.

---

## 11. Checking the current tool's beliefs (`C:\Beeftown\cong-cu\Beeftown_Can_TMA.html` PART 1, lines 313-518)

* **UTF-8 / tab / CRLF / `DWL`…`END` sections:** confirmed; REP follows the same rule.
* **Prices = `mantissa,decimals`, VND = value × 10^Spec202:** confirmed for unit prices. **Correction:** RES totals (`Price`, `Cost`, `Tax`) should use Spec 203. Both are 3 on this scale, so results are the same today.
* **`SECTION_NAMES` includes REP:** correct.
* **Writing back "untouched lines byte-for-byte":** this is a **risk**. `buildTms` copies REP, INF (and TIM unless the clock option is on) back to the scale. `khoi-phuc\sao-luu-truoc-kiem-thu\da-gui\20260928-000207.TMS` is byte-identical to the scale export and contains `DWL\tREP` (lines 642-766), `DWL\tINF` and `DWL\tTIM`. [?] The scale's behaviour on `DWL\tREP` is unknown. **Drop REP, INF and TIM from files sent to the scale.** The minimal 2026-09-29 file (PLU, LAB, SCP, TMS only) is the right shape.
* **The PLU name in the file is what the scale shows:** true for the PLU section, false for history (RES names are looked up at export time).
* **Test sample `test-kho-can.mjs:59-60`:** confirmed; it equals real FID 28.

---

## 12. Unknowns and safe tests

1. **Does Spec 290 = 9 put the item code into RES[11] at sale time?** Set it, print one label, export with [Amend]; then change that PLU's code and export again.
2. **What the scale does with `DWL\tREP`.** Do not test this on the shop scale; strip REP instead.
3. **Whether FIDs restart after A52, P52x or E9.97** (events 308, 777–780, 1253). The time-based dedupe key is safe either way.
4. **The "uploaded" mark:** does a LAN `UPL REP` (with or without `-`) or a [PLU] USB save set it?
5. **Sign and CoFID of Type 1 returns.** Returns are disabled on Beeftown (Spec 74 = 0); enable them on a test scale only.
6. **Whether the scale's A62 stock audit writes Type 10, 11 or 12 log records.**
7. **Exact meaning of Types 4 and 5 and of P521–P524**, and whether Class/Dept are historical (always 9/9 in the data).
8. **The BAR `TChar` letter codes** (belongs to the barcode spec).
9. **`INA[4..7]`** (8388608, 7).

---

## 13. Evidence index

* **Parsing and stock:** `RDS.cs:45-68, 1215-1333, 1427-1891, 2066-2080, 2308-2607, 2609-2959`
* **Channels:** `NetForm.cs:830-850, 1228-1232, 1445-1466, 3889-4044`; `ReportForm.cs:4888-4932, 5499-5605, 5976-6007, 6041-6281`
* **Reports:** `ReportForm.cs:4960-5058, 5107-5186, 5206-5349, 5227-5283, 6525-6674`; `tmxa-src\ECS.Query_A4.rdlc`; `Combo.xml:971-1078, 1224-1248`; `zh-CHS\Combo.xml`
* **Lifecycle:** `Program.cs:224-251, 600-612, 824-855, 987-1003, 1032-1118`; `MainForm.cs:1554-1690, 1813-1849`; `app.config:238-676`
* **SQL:** `ECS.ReportDataSetTableAdapters\*.cs` (Log `:148-269`, LogItem `:145-236`, Stock `:143-218`, StockItem `:137-216`)
* **Settings:** `Tm.xml` SpecIDs 2 (`:156`), 74 (`:576`), 91 (`:672`), 96 (`:684`), 98 (`:696`), 118 (`:816`), 135 (`:918`), 140 (`:942`), 141 (`:948`), 202 (`:1242`), 208 (`:1278`), 264 (`:1596`), 283 (`:1698`), 290 (`:1728`)
* **Data:**
  * `scratchpad\mdb\dump\{A_Report, B_Report, A_Old_2000_2023, A_Old_2023_2025, A_Bak_20260514, B_Bak_20260929}`
  * install `LogInfo.txt`
  * real export `scratchpad\khoi-phuc\sao-luu-truoc-kiem-thu\A_000.TMS` (REP 642-766, INF 1504-1508, TIM 1510-1512, BAR line 49)
* **Manual:** `scratchpad\work\Printing Serial Scale V3.04A.txt` `:842-846`, `:1850-1909`, `:3071-3072`, `:3237-3361`, `:3494-3502`, `:3515-3548`, `:3609-3690`, `:3726-3769`, `:3988`
* **Beeftown:** `C:\Beeftown\cong-cu\Beeftown_Can_TMA.html:313-518`; `C:\Beeftown\supabase\test\test-kho-can.mjs:24-66`; `C:\Beeftown\web\src\lib\kho\ma-vach.ts:1-21`; `C:\Beeftown\supabase\migrations\0020_kho_so_cai_nhap.sql:283-316`; `0019_kho_danh_muc.sql:300-330, 542-566`
