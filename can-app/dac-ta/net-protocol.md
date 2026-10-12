# TM-xA scale: Ethernet/LAN protocol (from TM-xA Management Program v3.10)

Scope: the network link between the PC program (`NetForm`, the "Ethernet" window) and the TM-A/TM-xA
label scale, reconstructed from the ILSpy-decompiled C# source, the install's config/XML files, the
scale manuals and the logs. Nothing was executed and no network connection was opened.

Legend: **[C]** CONFIRMED (seen in code or data, with a citation). **[I]** INFERRED (a reasoned guess,
not proven). **[?]** UNKNOWN.

Source root below = `scratchpad\tmxa-src\` (for example `ECS\NetForm.cs:2044`).
Install root = `C:\Users\khanh\Downloads\tma co hsd2\tma co hsd2\`.

---

## 0. Short answer

* **There is no binary framing.** The network link carries the same tab-separated TMS text as the USB
  file `JHSCALE\A_000.TMS`. One record per line, ended with CRLF. Encoding is UTF-8 for this install.
  There are no length fields, command codes, CRC/checksum, sequence numbers or per-line ACK/NAK.
  Reliability comes from TCP. Two things act as checks: the PC reads its own write back with
  `UPL\tTIM\t`, and it asks for the sales logs twice and compares the answers.
  [C] `ECS\NetForm.cs:119-147` (StreamReader/StreamWriter on the NetworkStream), `:3444` (PLU line), `:3772-3809` (barrier), `:3920-3990` (sales logs asked twice).
  * **[verified-fix]** "Reads its own write back" overstates it. The barrier (`:3772-3809`) sends
    `UPL\tTIM\t` and reads only the clock line, then throws the value away (`:3801`). It never
    reads back the rows it wrote. At best it is an *ordering* barrier ("the scale has consumed the
    stream up to here", [I]). It does not check content. To check content, run `UPL\t<SEC>\t` and
    compare.
* **The scale is the TCP server, on port 33581.** The PC connects to it as a client. Discovery works
  like this: the PC sends a UDP broadcast `UDP\t\r\n` to port **33583**, and the scale answers
  `UDP\t<tcpPort>\t…` to the PC's UDP port **33584**. The scale can also run in "client mode" and
  connect to the PC on port **33582**. [C] `app.config:112-126`, `ECS\NetForm.cs:4046-4093, 4112-4131, 4288-4332`, Tm.xml Spec 43/166-169.
* **The same keywords go in both directions.**
  * `DWL\t<SEC>\t` … `END\t<SEC>\t` means PC → scale ("download to device").
  * `CLR\t<SEC>\t` + `CLR\tEND\t` erases a whole table on the scale.
  * `UPL\t<SEC>\t` asks the scale to send a table. The scale streams lines until a line that starts
    with `END`. The PC then sends `UPL\tEND\t`.
  * The scale can also push `ASK\t…` lines on its own at any time.
* **There is no login, password or handshake** beyond reading the MAC and the device info
  (`UPL\tMAC\t`, `UPL\tINF\t`).
* **"Success: N FID" in `LogInfo.txt`** means one sales-log pull (`UPL\tREP\t…`) was parsed without
  error. N is the number of new sales transactions imported. FID is the scale's transaction (receipt)
  serial number, not a file id. [C] `ECS\RDS.cs:2594-2596`, `:2066-2072`.
* For our tool, the simplest way to upload is: open TCP to `scale:33581` and send `\r\n`. Then send
  the edited TMS sections, using `DWL`, never the `TIM`/`REP`/`INF` sections of an old export. Then
  send `UPL\tTIM\t` and wait for a line that starts with `END`. The original program does exactly
  this with its "TMS File" option: it copies the file's text onto the socket as it is.
  [C] `ECS\NetForm.cs:3667-3689`.

---

## 1. Transport overview

### 1.1 Ports and roles [C]

| Port | Proto | Listener | Purpose | PC setting (`app.config`) | Scale spec (Tm.xml / manual) |
|---|---|---|---|---|---|
| 33581 | TCP | **scale** | Scale in server mode (Spec43=1, the default). The PC connects to it. | `tcpClientPort`=33581 (`app.config:112-114`) | Spec166 "Server Mode Socket" = 33581 |
| 33582 | TCP | **PC** | Scale in client mode (Spec43=2). The scale connects to the PC. | `tcpServerPort`=33582 (`:115-117`) | Spec167 "Client Mode Socket" = 33582. PC IP is in Spec154-157, or the domain name is in TMT19. |
| 33583 | UDP | **scale** | Receives the discovery probe | `udpBroadcastPort`=33583 (`:118-120`) | Spec168 "UDP Listen Socket" = 33583 |
| 33584 | UDP | **PC** | Receives the discovery replies | `udpRecvPort`=33584 (`:121-123`) | Spec169 "UDP Broadcast Socket" = 33584 |

Broadcast address: `udpBroadIP` = `255.255.255.255` (`app.config:124-126`). An optional
`manualBroadcast`=False (`:211-213`) replaces the broadcast with a unicast sweep of .1–.254.

The spec defaults are the same in every dumped database (`mdb\dump\*_ECS\Spec.tsv`): 43=1 (server),
44=30, 45=1, 48=10, 49=0, 50=0, 153=0 (DHCP), 166=33581, 167=33582, 168=33583, 169=33584. They
also match the manual table in `work\Printing Serial Scale V3.04A.pdf.txt:4127-4148, 4535-4576`.

`LogInfo.txt` confirms the normal case. For example `2026-05-14 16:45:32 Success: 3 FID,
MAC=0023F01AECB1, IP=192.168.2.30:33581`. The remote endpoint is `scale-IP:33581`, so the PC was
the TCP client.

### 1.2 Connection kinds the PC keeps (`LinkType`, `ECS\NetForm.cs:25-31`, icons `:4334-4344`)

* `TcpClient` (blue flag): the PC connected to a saved or manually added `IP:port`. The Add Device
  dialog accepts ports 1024–65535 and defaults to 33581 (`ECS\AddressForm.cs:84-87`).
* `UdpClient` (green flag): the PC connected after a UDP discovery reply.
* `TcpServer` (red flag): the scale connected to the PC's listener on 33582 (`:4112-4131`).
* `TcpOffline` (gray flag): a saved device that is not connected. At startup the program tries each
  saved `ipList` entry once (`:1835-1884`). The same retry happens when you press "Find Device"
  (`:4480-4516`).
* **[verified-add]** Only `TcpClient` and `TcpOffline` rows are written back to `ipList` when the
  window closes (`:2013-2020`). A scale found only by UDP is **not** remembered. The saved format is
  `IP:port\n<<shop>>\n<<machine>>\n<<no>>\n<<model>>\n<<MAC>>`, where `<<…>>` is `FXP_Offline`
  (`app.config:241-243`). When a saved offline row reconnects through UDP or the server socket,
  `AddLink` forces its type to `TcpClient` (`:4214`).
* **[verified-add] Identify scales by MAC, not IP.** The factory default is DHCP (Spec153=0, manual
  "Direction of Ethernet Connection" p.2). The same MAC `0023F01B20EE` appears at `.25`, `.105` and
  `.37` in `LogInfo.txt`, and twice in `user_config.bck` ipList. A saved `IP:33581` therefore goes
  stale. Rediscover with UDP, then confirm the MAC with `UPL\tMAC\t`.

The protocol is the same for all kinds, and the PC always drives it. When the scale is the TCP
client, only the direction of the TCP connect is reversed [C] (every kind goes through `AddLink`,
`:4176-4222`).

### 1.3 Text encoding [C]

* `MyTag.Enc = Program.GetEncoding()` (`ECS\NetForm.cs:218`) = `Encoding.GetEncoding(Settings.configEncoding)`
  (`ECS\Program.cs:105-108`).
* `configEncoding` = `utf-8` in `user_config.bck`, and in `Config\Config.xml` for every language.
  The scale reports its own encoding in the `INA` line (see §4.2). The PC switches if the two differ
  (`ECS\NetForm.cs:2109-2156`).
* The saved device list shows the model string `TM-xA UA006 V3.15C5(UTF-8)` (`user_config.bck`,
  ipList). The `(UTF-8)` part is built from the INA fields (`:1233-1236`). So these scales run UTF-8.
* Exception: the Wi-Fi SSID (TMT 15) is always written with a separate UTF-8 writer when the link
  encoding is not UTF-8 (`:3319-3324`).

### 1.4 Line rules [C]

* The writer is `StreamWriter(stream, Enc)` with `AutoFlush=true` and `NewLine = "\r\n"` (the .NET
  default). Every command line ends with `0D 0A`. (`ECS\NetForm.cs:124-135`)
* Each record is `KEYWORD \t field1 \t field2 \t … fieldN \t CRLF`. The line always ends with a tab
  before CRLF, so `line.Split('\t')` gives N+2 elements and the last one is empty (for example the
  PLU line splits into 69 elements, see §7).
* The reader is `StreamReader.ReadLine()`, which accepts CR, LF or CRLF. Empty lines are ignored
  (`:161-175`), and so are lines the current operation does not expect.
* **[verified-fix] "A line that starts with END" is imprecise everywhere in this spec.** Every loop
  tests `line.Split('\t')[0] == "END"` (e.g. `:2053`, `:2505`, `:3793`, `:3939`). That matches
  `END`, `END\t…` and `END\tPLU\t`, but **not** `ENDX…`. Our client should use the same exact
  field-0 test. Inside a `UPL\tLAB\t` answer, the inner loop waits for `LAE` and ignores `END`
  (`:2966-3002`). A label without `LAE` therefore hangs until the 30 s timeout.
* Inside text fields:
  * A line break is sent as `\v` (0x0B): `FormatString` replaces CRLF with `\v`, and `ParseString`
    does the reverse (`ECS\Program.cs:224-228, 525-528`).
  * A TAB inside a value is **not** escaped, so it would shift every later column. Strip tabs, CR
    and LF from all values.
* Decimal fields use the format `mantissa,decimals`. See `FormatDecimal` (`ECS\Program.cs:530-557`)
  and `ParseDecimal` (`:229-251`):

  ```csharp
  // FormatDecimal: round (Price → Settings.Format_Price=2, Weight → Format_Weight=3), then
  if (d > 9999999m || d < -9999999m) return "0,0";          // out of range → silently 0
  int num = 0; decimal num2 = d;
  while (num2 <= 999999.9m && num2 >= -999999.9m && num2 != decimal.Round(num2, 0) && num < 7)
  { num2 *= 10m; num++; }
  return $"{Convert.ToInt32(num2)},{num}";                  // 845 → "845,0", 110.5 → "1105,1"
  ```

  `ParseDecimal("1105,1")` = 1105 / 10¹ = 110.5. A value with no comma is read as an integer.
  (Format_Price / Format_Weight are set at `app.config:296-300`.)

### 1.5 BOM at the start of the stream [I, high confidence]

The .NET Framework `StreamWriter` writes the encoding preamble on its first flush when the stream is
not seekable, and a `NetworkStream` is not seekable. `Encoding.GetEncoding("utf-8")` has the preamble
`EF BB BF`. So when a link opens (`Client_RW`, `:119-137`) the PC's first bytes are most likely
**`EF BB BF 0D 0A`**. The PC sends this again each time it re-creates the writer after changing the
encoding.

The USB file that the PC writes also starts with `EF BB BF 0D 0A` (`Config\en\_ECS.TMS` begins
`357 273 277 \r \n E C S \t V E R…`, checked with `od -c`). So the scale's parser accepts the BOM.
A clone can send the BOM or leave it out. Sending `EF BB BF 0D 0A` copies the original most exactly.

**[verified-add]** Why the confidence is high: the program targets `net20` (`TM-xA.csproj:7`;
`app.config:737-738` allows the v2.0 and v4.0 CLR). In the .NET Framework `StreamWriter`, the
preamble is skipped only when `stream.CanSeek && stream.Position > 0`. `NetworkStream.CanSeek` is
always false, so the first `Flush` (AutoFlush on the first `WriteLine()`) writes the preamble.
`Encoding.GetEncoding("utf-8")` returns the BOM-emitting UTF-8 instance, and it is reference-equal
to `Encoding.UTF8`. That is also why `swutf` stays `null` on a UTF-8 link (`:126-133`). This is
framework semantics, not a wire capture.

### 1.6 Binary payloads (font, firmware, bitmaps) [C]

Bytes are sent as text, one character per 4-bit nibble. Each nibble becomes the character `'@'+nibble`
(0x40–0x4F), high nibble first (`ECS\NetForm.cs:3582-3586, 3649-3653`; `ECS\Program.cs:125-139`):

```csharp
char hi = (char)(64 + b / 16);  char lo = (char)(64 + b % 16);   // 0x1F → "AO", 0xA5 → "JE", 0xFF → "OO"
```

Multi-byte integers inside the bitmap header are little-endian (`getByte_multi` writes the LSB first).

### 1.7 No checksum, no block size [C]

* `sendBufSize`=1024 (`app.config:202-203`) only sets how often the progress bar updates
  (`:3587, 3654, 3679`). It does not split the data into blocks.
* `recvBufSize` is never used.
* There is no CRC or checksum function anywhere in `NetForm.cs`. (The only CRC-32 in the project is
  our own zip helper in `Beeftown_Can_TMA.html`.)

---

## 2. Discovery (UDP)

### 2.1 Probe (PC → broadcast) [C] `ECS\NetForm.cs:4288-4332`

```csharp
using UdpClient u = new UdpClient();
u.ExclusiveAddressUse = false;
u.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
u.Client.Bind(new IPEndPoint(IPAddress.Any, 33584));        // the source port is 33584, too
byte[] bytes = Program.GetEncoding().GetBytes("UDP\t\r\n"); // 55 44 50 09 0D 0A (6 bytes, no BOM)
u.EnableBroadcast = true;
for (k = 0; k < 5; k++) u.Send(bytes, bytes.Length, new IPEndPoint(IPAddress.Parse("255.255.255.255"), 33583));
```

* If `manualBroadcast=True`: for every local IPv4 address a.b.c.X, the PC sends the same 6 bytes
  5 times to each a.b.c.1–254 (except X) on port 33583.
* The probe runs when the window opens (`:1891`) and when you click "Find Device" (`:4482`).
* The probe carries no MAC, model or version.

### 2.2 Reply (scale → PC:33584) [C for the parsing, I/? for the rest] `ECS\NetForm.cs:4046-4093`

```csharp
udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, 33584));  // ReuseAddress, a thread that is always listening
byte[] array = udpClient.Receive(ref remoteEP);
string text = Program.GetEncoding().GetString(array);
int num = text.IndexOf("UDP"); if (num < 0) continue;       // junk before "UDP" is allowed
string[] a = text.Substring(num).Split('\t');
if (a.Length >= 3 && a[0] == "UDP") {
    int port = int.Parse(a[1]);                             // the scale's TCP server port
    var ep = new IPEndPoint(remoteEP.Address, port);        // IP = the UDP sender's IP
    if (!HasItem(ep)) new Thread(UdpTcpClientThread).Start(ep);   // TCP connect → AddLink(UdpClient)
}
```

* The reply therefore has the form **`UDP\t<tcpPort>\t…`**. At least 3 fields must survive
  `Split('\t')`, for example `UDP\t33581\t\r\n`.
* [?] What comes after the port (MAC, model, IP?) is unknown. The PC ignores it.
* The PC's own probe `UDP\t\r\n` splits into only 2 fields, so the listener ignores it.
* MAC, model, firmware and names are **not** read over UDP. They come over TCP (§4.1).
* [I] The listener runs the whole time the window is open, so a scale that sends
  `UDP\t33581\t` by itself (for example at boot or after DHCP) would also be picked up. Spec169 is
  named "UDP Broadcast Socket", which suggests this happens. Not proven.
* **[verified-add] The reply port is fixed by the scale, not by the probe's source port.** The
  V3.04A manual names Spec168 "Scale's UDP local port" = 33583 and Spec169 "Scale's UDP **remote**
  port" = 33584 (`work\Printing Serial Scale V3.04A.pdf.txt:4575-4576`). So the scale sends its
  reply to port 33584, whatever port the probe came from. A client **must** bind UDP 33584 (Windows
  firewall rule needed). It cannot probe from an ephemeral port and wait there. Whether the reply is
  unicast to the prober or broadcast is still [?].
* **[verified-add]** The original binds 33584 **twice**: the always-on listener (`:4054`) and the
  short-lived probe socket in `BroadCast()` (`:4295`), both with `ReuseAddress`. Windows delivers a
  unicast datagram to only one of two sockets that share a port. The probe socket closes right after
  sending (`using`), so the listener normally gets the reply. A clone should send and receive on a
  single socket, as §8 does. If TM-xA.exe is running on the same PC, it can take the replies.

### 2.3 Setting the IP remotely (Set IP button) [C]

This does not use UDP. It needs an open TCP link and writes specs with an ordinary `DWL\tTMS\t`
block (§5.5). There is no MAC-addressed UDP "set IP" command, so a scale whose IP is not reachable
from the PC's subnet cannot be moved from the PC. Use the keypad or a USB file instead.

---

## 3. Connection lifecycle

### 3.1 Sequence when a link comes up [C]

`AddLink` (`ECS\NetForm.cs:4176-4222`):

1. It sets `client.ReceiveTimeout = recvTimeOut (30000 ms)` and
   `client.SendTimeout = sendTimeOut (30000 ms)` (`:4183-4184`, `app.config:220-225`).
2. If this `IP:port` already has a live link, the new socket is closed (`:4209-4213`).
3. `Client_RW()` creates the reader and writer and **writes one empty line** (`sw.WriteLine()`),
   which puts `[EF BB BF] 0D 0A` on the wire (`:119-137`).
4. It starts the **UploadInfo** action (`:4220`). This is the "handshake" (§4.1/§4.2): `UPL\tMAC\t`,
   then `UPL\tINF\t`, then `UPL\tEND\t`. If the scale reports a different encoding, the reader and
   writer are rebuilt and the handshake repeats (`:2207-2209`, `:2211-2223`).
5. The handshake fails in two cases. If the INF machine-number field is not an integer, the PC first
   tries ASCII encoding, and if it still fails it throws `IOException` and drops the link
   (`:2197-2206, 2218-2221`). The link is also dropped if a read times out.
   * **[verified-add]** The test is `ParseInt(a[3], -1) == -1` (`:2167`, `:2197`), so a *valid*
     machine number of **-1** also counts as failure. The Rename dialog allows −999999…999999
     (`ECS\NetRenameForm.cs:82-83`). A scale renamed to number −1 would be dropped on every
     connect. Other uncaught failures also drop the link: a non-numeric byte in the `MAC` line
     (`int.Parse` throws a `FormatException`, and only `IndexOutOfRangeException` is caught,
     `:2059-2066`), or an `INA` encoding name that `Encoding.GetEncoding` does not know (`:2134`).
6. `UpdateInfo` (`:1214-1300`) builds the identity. It looks up the MAC in `Report.mdb:Device`, may
   auto-attach the device to stock group 1, and shows a balloon tip.
7. The "Online" follow-up chain (`BW_RunWorkerCompleted`, `:1355-1404`) runs next:
   * Every `AutoTask.xml` row with `Due=2` ("Online") runs in order. The shipped `AutoTask.xml` has
     Task 4 = "Time Synchronization", so **every new link immediately pushes the PC clock to the
     scale** (§5.3).
   * Then, if `gen_Ask && gen_AskLogs` (both True by default, `app.config:578-586`), the PC pulls
     the sales logs (`UPL\tREP\t…`, §5.10).
   * Finally `UpdateAsk` writes `TMS 58` (§5.7).
8. From then on:
   * Background reader: with `gen_Ask`, a background thread reads lines continuously
     (`BGW_GetLines`, `:1119-1170`, `ReceiveTimeout=0`).
     * `ASK\t…` lines are queued and handled when the link is idle.
     * Other lines are kept only while an action is running (`RxMFucing`).
     * When the socket closes, the thread sleeps 3 s and removes the link (`:1164-1169`).
   * Periodic tasks: `AutoTask.xml` row 0 = Task 3 "Link Test", `Due=1`, `Repeat`, every 30 s. It
     sends `UPL\tTIM\t` to every fully initialised device (`:5134-5159, 5174-5192, 5194-5258`;
     Combo.xml `Network_Task`/`Network_Due`; install `AutoTask.xml`).
   * **[verified-add]** "Fully initialised" means list columns 1–4 are **all non-empty**: shop,
     machine name, number and model (`:5183`). A scale whose Store Name (TMT 0) or Device Name
     (TMT 1) is blank never gets the periodic link test. [I] Such a scale would then be dropped by
     its own Spec48 idle timeout.
   * **[verified-add]** Timed AutoTasks call `BeginNetworkAction(item, task)` with `naArgs = null`
     (`:5188`). For "Upload data" (5) and "Download data" (6), the arguments are therefore taken from
     the **current checkboxes in the Ethernet window** (`:1004-1062`), including "Clear old data".
     A scheduled "Download data" with that box ticked would re-send `CLR` every time. A scheduled
     "Rename" (2) would crash, because `naArgs[0]` is null (`:981`). The shipped `AutoTask.xml` has
     neither.

Task and Due numbers (Combo.xml): Task 1=Initialize(UploadInfo), 2=Rename(DownloadInfo),
3=Link Test(UploadTime), 4=Time Synchronization(DownloadTime), 5=Upload data(UploadECS),
6=Download data(DownloadECS), 7=Upload report, 8/9=Upload/Download database (FTP of the .mdb, not the
scale). Due 0=Immediately, 1=Date and Time, 2=Online. These equal the `NetworkAction` enum values
(`ECS\NetForm.cs:39-53`).

### 3.2 Keep-alive and timeouts [C unless marked]

| Item | Value | Where |
|---|---|---|
| PC receive timeout (synchronous reads) | 30 000 ms | `recvTimeOut`, `:4183` |
| PC async read wait | polls every 100 ms, gives up after `recvTimeOut` (30 s), then closes the link | `:177-188` |
| PC send timeout | 30 000 ms | `sendTimeOut`, `:4184` |
| Wait for the scale to finish storing a download (barrier) | 30 s | `:3773-3782` |
| Link test (keep-alive) | `UPL\tTIM\t` every 30 s | `AutoTask.xml` row 0 |
| Retries when pulling sales logs | up to 11 reads, sleeping `n*100` ms between them | `:3984-3989` |
| TCP connect | one synchronous `TcpClient.Connect` (OS timeout). Repeated only at startup or on "Find Device". | `:4133-4150` |
| Scale "Ethernet Overtime Interval" Spec48 | default 10 s. Manual: "single overtime seconds, over 5 times overtime, Ethernet will disconnect". [I] So the scale drops a link after ~50 s of silence, which is why the PC sends the 30 s link test. | manual txt `:4144-4145` |
| Scale client-mode reconnect Spec44 | default 30 s | manual txt `:4128` |

### 3.3 One scale vs many [C]

* Each device has its own `TcpClient` and `BackgroundWorker`. Different scales run in parallel, but
  each scale runs only one action at a time (`if (itemTag.BW.IsBusy) return false;`, `:952-955`).
* Downloads to many ticked scales start together (`:4632-4636`).
* Sales-log pulls follow `gen_AskLogs_ExDevice`=16, `gen_AskLogs_SameTime`=16 and
  `gen_AskLogs_ExInterval`=30 s:
  * with fewer than 16 online scales, a pull starts immediately;
  * otherwise the pull is queued and served by `reportTimer` (`:7059-7083`);
  * with `gen_AskLogs_OnlyIdle`, nothing is pulled while the user touched the PC in the last 30 s.
* Dual interface. One scale can be online twice, over cable and Wi-Fi (Spec50 4–7). `INM` field 3
  (`P1S2`: 1 = primary, 2 = secondary) tells the two apart. The second link is shown as "IP Address
  (Backup)". Two links with the same MAC and the same P1S2 count as a duplicate, and the older one is
  closed (`:1238-1267`).
  * **[verified-fix]** The rule is wider. The older link is also closed when **either** link has
    P1S2 = 0 (`:1245`: `P1S2 == 0 || other.P1S2 == 0 || P1S2 == other.P1S2`). P1S2 is 0 when the
    scale sends no `INM` line, because `Args[8]` is reset to 0 at `:2071`.
* [I] Whether the scale accepts more than one TCP client at a time is unknown. The original program
  opens a connection automatically to every scale it can find, runs the link test and pulls logs by
  itself. Close TM-xA.exe on every PC before our tool connects.

---

## 4. Identification ("handshake") messages

### 4.1 `UPL\tMAC\t` [C] `ECS\NetForm.cs:2041-2069`

PC → `55 50 4C 09 4D 41 43 09 0D 0A`.

Scale → one line `MAC\t<b0>\t<b1>\t<b2>\t<b3>\t<b4>\t<b5>\t…`, where each byte is a **decimal**
number, then a line that starts with `END`. The PC builds the id like this:

```csharp
myTag.Args[7] = int.Parse(a[1]).ToString("X2") + int.Parse(a[2]).ToString("X2") + … + int.Parse(a[6]).ToString("X2");
// e.g. "MAC\t0\t35\t240\t26\t236\t177\t" → "0023F01AECB1"
```

The PC resends `UPL\tMAC\t` after every END until a MAC line arrives. It does **not** send
`UPL\tEND\t` after MAC on the network path, although the serial path does (`ECS\ReportForm.cs:6164`).

### 4.2 `UPL\tINF\t` [C] `ECS\NetForm.cs:2070-2196`

PC → `UPL\tINF\t`. The scale answers with lines in any order, then `END…`. The PC then sends
`UPL\tEND\t` (`:2196`).

| Line | Fields as parsed |
|---|---|
| `INF\t<shop>\t<machine>\t<no>\t<model>\t` | `[1]` shop name (= TMT 0 "Store Name"), `[2]` machine name (= TMT 1 "Device Name"), `[3]` machine number (= Spec40). **Must parse as int.** `[4]` model/version, for example `TM-xA UA006 V3.14E8`, split on spaces: `tVersion`=first word, `cVersion`=second-to-last, `nVersion`=last. (`:2163-2192`; the TMT0/TMT1/Spec40 mapping is in `ECS\ReportForm.cs:5529-5556`) |
| `INA\t<enc1>\t<enc2>\t<n>\t<memData>\t<memFont>\t` | Link encoding: use `enc2` when `enc1` is empty or equal to it, otherwise `enc1`. The name goes to `Encoding.GetEncoding(...)`, for example `UTF-8`. `[3]` = int of unknown meaning. `[4]`,`[5]` = memory sizes (`mem_DATA`, `mem_FONT`), which the PC stores but never uses. (`:2109-2156`) |
| `INM\t<?>\t<MAC hex>\t<P1S2>\t` | **[verified-add]** Conflict: the USB-file importer keys `Report.mdb` by `INM[1]` (`ReportForm.cs:5584`, then `:4896-4919` `FindByMAC(mac)`), while the network path keys it by `INM[2]` (`NetForm.cs:2100`). If the two ever differ, for example after "New MAC", logs imported by USB and by LAN land under different devices. `[2]` = the 12-hex-digit MAC. If it starts with `ZZZZ`, the scale has no MAC and the PC uses `000000000000`. `[3]` = interface number (1 = primary, 2 = secondary). When present it overrides the MAC from §4.1. [?] `[1]`: in USB log files the PC reads `INM[1]` as the MAC and `INM[2]` as the "original MAC" (`ECS\ReportForm.cs:5581-5596`), so `[1]` is probably the current/assigned MAC. |

Version gates taken from INF (all [C]):

* `nVersion >= "V2.49A"`: the PC writes the ASK flags in Spec58 (`:1452-1462`).
* The third space-separated word, characters 1–4 (for example `"3.15"`), `>= 2.38`: `MinusUpload`
  turns on (a `-` sign in `UPL\tREP`) (`:1227-1232`).
* `nVersion >= "V3.00A"` (with `gen_CostFromDevice`): cost comes from the scale (`:4026`).
* **[verified-fix]** On the first gate: `UpdateAsk` writes `DWL\tTMS\t` / `TMS\t58\t<n>\t` /
  `END\tTMS\t` for **every** firmware (`:1463-1465`). The `V2.49A` comparison only decides whether
  `n` gets the flag bits. Below V2.49A, the PC still writes **58=0**.
* **[verified-add]** The `MinusUpload` test uses `decimal.TryParse(s.Substring(1,4))` with the
  PC's **current culture** (`:1230`). On a vi-VN or de-DE Windows, `"3.15"` parses as 315 because
  `.` is the group separator. The result is still ≥ 2.38, so every V3.x scale gets the `-` form
  either way. A clone should parse with `CultureInfo.InvariantCulture` and accept that the original
  can misjudge old 2.xx firmware on such locales.
* **[verified-add]** Firmware versions seen in real data are V3.13E8, V3.14E8, V3.14H, V3.15B8,
  V3.15C5 and V3.15D (`mdb\dump\*\LogItem.tsv`, Type 1254 Text1; `user_config.bck`). All are
  ≥ V3.00A, so all three gates are "on" for every scale this shop is likely to have.

Real samples:

* INF line of our own scale, from the test fixture made from the real file:
  `INF\tFactory\tFactory Device\t0\tTM-xA UA006 V3.14E8\t` (`C:\Beeftown\supabase\test\test-kho-can.mjs:64`).
* Device list from the technician's PC: `TM-xA UA006 V3.15C5(UTF-8)`, `TM-xA UA006 V3.15D(UTF-8)` (`user_config.bck`).

---

## 5. Command catalogue (everything `NetForm` can do)

"Download" in this program means PC → scale, and "Upload" means scale → PC. Every PC → scale action
starts by writing one empty line `0D 0A` (`myTag.sw.WriteLine()`).

The download commands (5.3–5.8) are fire-and-forget: the PC reads **nothing** back, except when it
sends the `UPL\tTIM\t` barrier at the end of "Download data". [C]

### 5.1 Link test = `UPL\tTIM\t` (UploadTime) [C] `:2327-2375`

```
PC   → UPL\tTIM\t
scale→ TIM\t<YY>\t<M>\t<D>\t<h>\t<m>\t<s>\t        (YY = year-2000; the PC adds 2000)
scale→ END…
PC   → UPL\tEND\t
```

This reads the clock only. Used for "Link Test" and "Find Device" on connected scales.

### 5.2 Read clock

Same as 5.1.

### 5.3 Set clock = `DWL\tTIM\t` (DownloadTime / "Time Synchronization") [C] `:2314-2325`

```csharp
sw.WriteLine();
sw.WriteLine("DWL\tTIM\t");
sw.WriteLine("TIM\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t", dt.Year % 100, dt.Month, dt.Day, dt.Hour, dt.Minute, dt.Second);
sw.WriteLine("END\tTIM\t");
```

* Numbers are not zero-padded. Example for 2026-09-29 14:05:09:
  `44 57 4C 09 54 49 4D 09 0D 0A 54 49 4D 09 32 36 09 39 09 32 39 09 31 34 09 35 09 39 09 0D 0A 45 4E 44 09 54 49 4D 09 0D 0A`.
* No reply. To check it worked, send 5.1.
* **[verified-add] The "Time" toolbar button does nothing.** `timeToolStripButton_Click` is an
  empty method (`:4657-4659`), and no other code starts `DownloadTime`. In the original program the
  clock is set **only** by AutoTask Task 4: the shipped `AutoTask.xml` row 1 (`Due=2`, "Online")
  fires on each new link, or a timed AutoTask row. The value is `DateTime.Now` at the time the
  action starts (`:1001`), so the scale gets the PC's **local** time.

### 5.4 Rename = `DWL\tINF\t` (DownloadInfo) [C] `:2292-2312`, dialog `ECS\NetRenameForm.cs`

```
\r\n
DWL\tINF\t
INF\t<shop>\t<machine>\t<number>\txxx\t      ← the literal "xxx" fills the model field
END\tINF\t
```

After this the PC runs §4.1/§4.2 again. [I] The scale stores the values as TMT0, TMT1 and Spec40
(see §4.2). The machine number range in the dialog is ±999999.

**[verified-add]** A second caller sends the same block without a dialog. In the Report tab,
"Attach automatically" (`TabledAuto_Button_Click`, `:6227-6261`) with "Change machine number"
ticked sends `DWL\tINF\t` to every unattached online scale whose machine number is 0. It gives
each one the first free number `n` for which `★shop★machine★n` is not yet in `Report.mdb:Device`.
Tm.xml gives Spec40 the range 0~9999999, so negative numbers from the Rename dialog are outside
the scale's own range (see §3.1 step 5 for −1).

### 5.5 Set IP = `DWL\tTMS\t` with 12 network specs (DownloadIP) [C] `:2225-2253`, dialog `ECS\NetSetIPForm.cs`

The dialog has three boxes, whose meaning was checked against control positions in `ECS.NetSetIPForm.resx`:

* `ipTextBox1` = IP address. It defaults to the current IP.
* `ipTextBox2` = subnet mask, default 255.255.255.0.
* `ipTextBox3` = gateway, default a.b.c.1.

If you choose DHCP, the PC sets the IP's last byte to 0 (`:185-188`). The Args order is IP, gateway,
mask (`ECS\NetForm.cs:5694-5698`).

```csharp
if (P1S2 <= 1)  for (i = 0; i < 12; i++) sw.WriteLine("TMS\t{0}\t{1}\t", ((i >= 4) ? 154 : 150) + i, Args[i]);
else /*==2*/    for (j = 0; j < 12; j++) sw.WriteLine("TMS\t{0}\t{1}\t", 430 + j, Args[j]);
```

So the PC sends:

* Primary interface: Spec150–153 = IP (153=0 means DHCP), Spec158–161 = gateway, Spec162–165 = mask.
* Secondary interface: Spec430–433 = IP, 434–437 = gateway, 438–441 = mask.

All of these match the names in `Tm.xml`. There is no reply and no reboot command. With Spec45=1
(the default) the scale applies the new network settings immediately (manual: "Ethernet config apply
immediately"), so expect the TCP link to drop.

**[verified-add]** Tm.xml calls Spec45 "Ethernet Auto Reboot if Configure Changed" (0 Disable,
1 Enable). The V3.04A manual (`:4133-4135`) says "0: Disable, only reset change Ethernet config.
1: Enable, Ethernet config apply immediately". So with 45=1, writing *any* network spec restarts the
scale's Ethernet stack by itself. That restart is the only remote "reboot" there is. Box mapping,
from the constructor defaults (`ECS\NetSetIPForm.cs:153-159`): `ipTextBox1` = IP, `ipTextBox2` =
mask (preset 255.255.255.0), `ipTextBox3` = gateway (preset a.b.c.1). `Args` = IP1, IP3 (gateway),
IP2 (mask) (`NetForm.cs:5694-5698`), which confirms 158–161 = gateway and 162–165 = mask. In DHCP
mode the PC still sends 150–152 and the gateway and mask boxes.

### 5.6 New MAC = `DWL\tMAC\t` (DownloadMAC) [C] `:2255-2290`, `:6926-6942`

```
\r\n
DWL\tMAC\t
MAC\t0\t35\t240\t255\t<rnd0-255>\t<rnd0-255>\t      (= 00:23:F0:FF:xx:xx)
END\tTMS\t                                           ← END TMS, not END MAC (as written in the code)
```

The PC then repeats §4.1/§4.2. The button only appears when the MAC is `000000000000` or the user is
SuperAdmin (`:4714-4719`). **Dangerous**: it changes the scale's identity (§9).

**[verified-add]** There is also a "Restore MAC" button (`MACr_ToolStripButton`, Lang
`pw_RestoreMAC`). It is always hidden (`:4688`, `:4715`) and its click handler is empty
(`:6944-6946`). The PC has **no** way to undo "New MAC". Before the button runs, a Yes/No box
appears whose default is **No** (`:6929`).

### 5.7 Ask flags = `DWL\tTMS\t` / `TMS\t58\t<flags>\t` (UpdateAsk) [C] `:1445-1466`

```csharp
int num = 0;
if (string.Compare(myTag.nVersion, "V2.49A") >= 0) { if (gen_AskLogs) num++; if (gen_AskPLU) num += 2; }
sw.WriteLine("DWL\tTMS\t"); sw.WriteLine("TMS\t{0}\t{1}\t", 58, num); sw.WriteLine("END\tTMS\t");
```

* Spec58 is hidden: it is not in `Tm.xml` or in the manuals, and the databases hold 58=0.
* Bit 0 asks the scale to push `ASK\tREP` when new sales exist. Bit 1 asks it to push `ASK\tPLU`
  requests (§5.11). With the default settings the PC writes **58=1**.
* [I] The value stays on the scale after the PC disconnects.
* **[verified-add]** Turning the feature off on the PC does **not** clear it on the scale.
  `UpdateAsk` and `UpdateAskAll` return at once when `gAsk` is false (`:1427-1430`, `:1447-1450`).
  `MenuParameterForm.cs:1548-1568` calls `UpdateAskAll()` only while the Ask box stays ticked. A
  scale that once got 58=1 from TM-xA keeps pushing `ASK\tREP` to any client, including ours.
  To stop it, our tool sends `\r\n DWL\tTMS\t / TMS\t58\t0\t / END\tTMS\t` itself (same block
  format; the effect on the scale is [I]).

### 5.8 "Download data" = DownloadECS (PC → scale, all sections) [C] `:3211-3816`

This is the order of the blocks. Every block is optional. `CLR` is sent only when "Clear old data"
(`clearCheckBox`) is ticked.

| # | Block (exact lines) | Row format (`sw.WriteLine` format string) | Code |
|---|---|---|---|
| 0 | `\r\n` | – | `:3270` |
| 1 | [`CLR\tTMS\t` `CLR\tEND\t`] `DWL\tTMS\t` … `END\tTMS\t` | `TMS\t{SpecID}\t{Value}\t` (only rows with Valid=true) | `:3272-3300` |
| 2 | [`CLR\tTMT\t`…] `DWL\tTMT\t` … `END\tTMT\t` | `TMT\t{StringID}\t{Value}\t` (id 15 is written as UTF-8) | `:3301-3338` |
| 3 | `DWL\tSCP\t` … `END\tSCP\t` (never cleared) | `SCP\t{PageID}\t{KeyID}\t{PLUID}\t`, one keyboard layout (ScaleID). Keys with PLU=0 are sent only when clearing. | `:3339-3365` |
| 4 | [`CLR\tDPT\t`…] `DWL\tDPT\t` … | `DPT\t{DeptID}\t{Name}\t` | `:3366-3394` |
| 5 | [`CLR\tCLS\t`…] `DWL\tCLS\t` … | `CLS\t{ClassID}\t{Name}\t{DeptID}\t{LabelID1}\t{BarT1}\t{BarF1}\t{LabelID2}\t{BarT2}\t{BarF2}\t` | `:3395-3423` |
| 6 | [`CLR\tPLU\t`…] `DWL\tPLU\t` … `END\tPLU\t` | 67-field PLU line (§7). Either all rows, only Valid rows (checkbox in the Indeterminate state), or one PLU (`Args[19]`). | `:3424-3460` |
| 7 | [`CLR\tBAR\t`…] `DWL\tBAR\t` … | `BAR\t{BarID}\t{Name}\t{Format}\t{Check}\t{Num1}\t{Num2}\t{TChar}\t` | `:3461-3489` |
| 8 | [`CLR\tLAB\t`…] `DWL\tLAB\t` … `END\tLAB\t` | For each label: one `LAB` line with 38 fields (`{LabelID}\t{Name}\t{Sort}\t{Width/8}\t{Height/8}\t{Text1..16}\t{Version}\t{Text17..32}\t`), then its `LAS\t{SubID}\t{Flag1}\t{Flag2}\t{Flag3}\t{Print}\t{Angle}\t{Align}\t{Font}\t{Left}\t{Top}\t{Width}\t{Height}\t` lines, then `LAE\t`. Only LabelID 10..99 are sent (`minUserLabelID`/`maxLabelID`). Width and height are in mm (the database stores dots, so the PC divides by 8). | `:3490-3531` |
| 9 | [`CLR\tSAL\t`…] `DWL\tSAL\t` … | `SAL\t{ID}\t{Name}\t{Password}\t{Discount_Low}\t{Discount_High}\t{RightFB}\t{Code}\t` | `:3532-3560` |
| 10 | [`CLR\tFNT\t`…] `DWL\tFNT\t`, then `FNT\t` + nibble-encoded `Binary\Font.bin` (or `Binary\Font\<name>.Bin`) + `\t\r\n`, then `END\tFNT\t` | one long line | `:3561-3600` |
| 11 | [`CLR\tBMP\t`…] `DWL\tBMP\t` … | `BMP\t{ID}\t{hdr+pixels}\t`. The header is nibble-encoded: ID (4 bytes LE), width (2 LE), height (2 LE), 88 zero bytes, so 96 bytes = 192 chars. Pixels are 1 bpp, rows top→bottom, `(w+7)/8` bytes per row, inverted (1 = black), nibble-encoded (`ECS\WizardPicForm.cs:170-178`). | `:3601-3635` |
| 12 | `DWL\tVER\t`, then `VER\t` + nibble-encoded **firmware .bin** + `\t\r\n`, then `END\tVER\t` | firmware upgrade | `:3636-3666` |
| 13 | **raw TMS file**: `File.ReadAllText(path, Enc)` written character by character, with no wrapping (the BOM is removed by ReadAllText) | whatever the file holds | `:3667-3689` |
| 14 | [`CLR\tVIP\t`…] `DWL\tVIP\t` … | `VIP\t{BAR/1e9}\t{BAR%1e9}\t{PH/1e9}\t{PH%1e9}\t{Point or -1,0}\t{Discount}\t` | `:3690-3730` |
| 15 | Custom1-4 tables (Custom.xml is empty in this install): [`CLR\t<kw>\t`…] `DWL\t<kw>\t`, `<kw>\t<fields…>\t`, `END\t<kw>\t` | – | `:5286-5335` |
| 16 | Config Wizard text `Program.sWizard`: `DWL\tTMS/TMT/BAR/PAS` blocks. `PAS\t<0..5>\t<password>\t` sets the Admin/Sale/Prog/Account/Drawer/PriceFProg passwords. | – | `:3763-3771`, `ECS\WizardForm.cs:1912-1953` |
| 17 | **Barrier** (see below) | – | `:3772-3809` |

The barrier at the end:

```
\r\n
UPL\tTIM\t
(read lines until one starts with "END"; give up after 30 s → the action fails and the link is dropped)
UPL\tEND\t
```

[I] The scale handles the stream in order, so its `TIM` answer means everything before it has been
stored. The PC never clears its receive queue before the barrier. That only works if the scale sends
**no** replies to `DWL`/`CLR` blocks, so the scale is silent on downloads.

**[verified-fix]** "So the scale is silent" is an inference, not a consequence of the code. While a
`DownloadECS` runs, `RxMFucing` is true, so any line from the scale is queued (`:1140-1143`). The
barrier stops at the **first** queued line whose field 0 is `END`. If the scale acknowledged each
block with an `END…` line, the barrier would stop early and the PC would never notice. The original
program works either way. A clone should read the `TIM` line **and then** its `END`, so that it
knows the `END` belongs to the barrier and not to a stale acknowledgement. It should also check the
data afterwards with `UPL`.

**[verified-add] What "Global Spec" really sends.** Only rows with `Valid = true` are written
(`:3288`). In every dumped database (`A_ECS`, `B_ECS`, `A_en_Default`), all network specs
(43–50, 150–169) and 58 have `Valid = False`. `A_ECS` has only 104, 105 and 106 valid, and `B_ECS`
has none. So a normal "Download data → Global Spec" does **not** touch the network setup unless
someone marks those rows Valid. The same filter applies to TMT: no String row is Valid in any dump.

**[verified-add] Cancel truncates a table.** "Cancel" (`:4836-4847`) calls `BW.CancelAsync()`.
The row loop `break`s (e.g. `:3437-3440`), the block's `END\t<SEC>\t` line is **still written**
(`:3454`; for FNT and VER the closing `\t` + `END` too, `:3592-3593`), and then the action
`return`s (`:3456-3459`) **without the barrier**. The block is well-formed but holds only part of
the table. After a `CLR` that means a partial PLU or label table on the scale, and the PC reports
nothing. Our tool should not offer cancel between `CLR` and the end of the matching `DWL` block.

**[verified-add] Envelope lines on TCP.** The "TMS File" option (row 13) sends the file exactly as
it is, so the scale receives the USB envelope `ECS\tVER\t100\t` … `END\tECS\t` (from
`SaveForm.cs:946-947, 1224`) and any `UNT` block over TCP. [I] The scale therefore tolerates these
lines on the network too. An `END\tECS\t` inside the stream is harmless for the barrier, because the
barrier is sent after it.

Units (`UNT`) are **not** sent over the network: `Args[7]` is never read, and the Unit checkbox is
hidden (`:1592-1596`). The USB file does contain a `UNT` section.

**[verified-add] Bitmap storage units.** Bitmap IDs are slot numbers of **8192 nibble chars
(= 4096 bytes)** each. A picture takes `Used = (PicString.Length + 192 + 8191) / 8192` consecutive
IDs (`ECS\BitmapFuc.cs:205`, `:228`), and 192 chars is the header. The UI calls this the "Block
Quantity" (`WizardPicForm.cs:178-179`). `PicSize` = pixels/8 "mm" (`BitmapFuc.cs:219`, `:257`), which
independently confirms **8 dots = 1 mm** (203 dpi) and so the `LAB` Width/8, Height/8 = mm rule.

**[verified-add] The vendor's own "upsert only the PLUs" path.** The Ethernet window has a
"Custom File" (TXT) tab and an "Excel/CSV File" tab. Both load a file into the in-memory PLU table
and replace its contents (`Common.ArithmeticFile_Read` starts with `eSet.Clear()`,
`Common.cs:581-584`; Excel: `ecsDataSet.PLU.Clear()` then `Merge`, `NetForm.cs:6113-6114`). They
then start `DownloadECS` on the ticked scales with **only PLU checked and Clear = false**
(`:5789-5812`, `:6180-…`). On the wire this is `\r\n DWL\tPLU\t` + the file's rows only +
`END\tPLU\t` + barrier, with no `CLR`. Their "Clear PLU before operation" box empties the
**PC database** (`pLUTableAdapter.DeleteQuery()`, `:5773`, `:6119`), **not** the scale. With "Auto
Running" (FileSystemWatcher plus a delay, `:6322-6580`, `:6644-6924`), the push repeats every time
the file changes. So the vendor relies on partial PLU upserts being accepted, which is exactly our
minimal-client pattern (§8 b1).

### 5.9 "Upload data" = UploadECS (scale → PC) [C] `:2377-3209`

For each ticked table, in this order: TMS `:2493`, TMT `:2548`, SCP `:2603`, DPT `:2644`, CLS `:2685`,
PLU `:2733`, BAR `:2847`, LAB `:2893`, SAL `:3010`, VIP `:3056`, then Custom.

```
PC   → UPL\t<SEC>\t
scale→ lines …   (the PC keeps only lines whose field 0 == <SEC>; anything else is ignored until END)
scale→ END…
PC   → UPL\tEND\t
```

* The row layouts are the same as in §5.8.
* LAB is special: after each `LAB` line the PC reads `LAS` lines until `LAE` (`:2966-3002`), and
  multiplies Width and Height by 8.
* PLU: a repeated PLUID is ignored.
* [I] The scale probably wraps each answer like the USB file (`DWL\t<SEC>\t` … `END\t<SEC>\t`). The
  PC tolerates either form.

### 5.10 Sales logs = `UPL\tREP\t` (UploadReport) [C] `:3889-4044`, `ECS\RDS.cs:2308-2607`

The pull only runs when the scale's MAC is in `Report.mdb:Device` and attached to a stock group
(GID≠0) (`:3891-3896`). That is a rule of the PC database, not of the protocol.

The request:

```csharp
string text2 = "UPL\tREP\t";
if (myTag.MinusUpload) text2 += '-';                                  // firmware ≥ 2.38 (§4.2)
text2 = (!sendAll && device.FIDed > 0) ? text2 + (device.FIDed + 1) + "\t" : text2 + "1\t";
// V3.14E8 scale, last FID stored 4  →  "UPL\tREP\t-5\t"  = 55 50 4C 09 52 45 50 09 2D 35 09 0D 0A
```

* `FIDed` = the last FID already imported for this MAC (`Device.tsv` column `FIDed`).
* "Send all (Very Slow)" asks from FID 1.
* The number is the **first FID wanted**. [?] The meaning of the `-` sign is unknown. It depends only
  on the firmware version (≥2.38 → `-`).
* The serial-port code uses `FIDed` without +1, and `-1` for "all" (`ECS\ReportForm.cs:6206`), so
  both signs clearly mean "starting FID".
* **[verified-fix]** "Clearly" was too strong. The serial code alone cannot tell "≥ N" from "> N",
  because re-fetching `FIDed` just yields a duplicate that is skipped. The **data** settles the
  `-N` form (the one our V3.x scales get). It is **inclusive**: `UPL\tREP\t-N\t` returns FIDs
  ≥ N. [C by data]
  * Scale `0023F01B20EE` (V3.15D, so `-` form) was pulled 9 times over LAN
    (`LogInfo.txt`: 2+1+0+4+0+5+1+0+3 = 16). Its FIDs in `mdb\dump\A_Report\Log.tsv` are
    **2…17 with no gap**, and `Device.FIDed` = 17.
  * All 11 scales in all Report dumps have gap-free FID runs, and each `FIDed` equals the sum of
    that MAC's "Success: N" lines (e.g. `0023F01AECB1`: 3 → FIDs 2–4, `FIDed` 4).
  * No `LogError.txt` or `Report\LogError\` exists in either install copy. `RDS.Log_Error` would
    have written "Lost: FID = …" there on any gap (`RDS.cs:2074-2080`, `:2427-2430`).
  * If `-(FIDed+1)` meant "after FIDed+1", every incremental pull would have lost one FID.
  * Unexplained: the first pull (`-1`) never returns FID 1. Every scale's first imported FID is 2
    (two scales start at 3), and it is always a Type 1254 "E9.98-Firmware Upgrade" event.
  * The meaning of the positive form (firmware < 2.38) is still [?].

The answer (lines until `END…`) has the same layout as the `REP` section of the USB export. Real
sample from our own file: `C:\Beeftown\supabase\test\test-kho-can.mjs:59-60`.

| Line | Fields (split index) | Check |
|---|---|---|
| `REP` header, one per transaction | `[1]YY [2]MM [3]DD [4]hh [5]mm [6]ss [7]FID [8]SID [9]Salesman`. Example: `REP\t26\t9\t25\t15\t16\t46\t29\t1\t0\t` | ≥10 fields, else "Parse Error" and the whole pull is thrown away |
| `RES` item | `[1]SubID [2]Price(total,dec) [3]PLU [4]Class [5]Dept [6]Cost [7]Amount(kg/qty) [8]Unit [9]Type [10]Tax [11..14]Text1..4 [15]UnitPrice [16]CoFID [17]PLUName`. Example: `RES\t1\t16000,3\t6\t9\t9\t0,3\t16,2\t3\t0\t0,3\t\t\t\t\t100000,3\t0\t<name>\t` | ≥18 fields |
| `REE` | end of one transaction | – |

Meaning of the RES lines (from `ECS\RDS.cs:2447-2590`, types from `A_Report\rLogsType.tsv`):

* `SubID ≥ 1`: a sold item, numbered 1, 2, 3… with no gaps (a gap is a parse error).
* `SubID = 0`: a payment or adjustment line, keyed by PLU code:
  * 9999996 = discount/rounding;
  * 9999997 = service fee;
  * 9999995 = card;
  * 9999994/93/92 = other payments 1–3;
  * 9999981 = Alipay, 9999982 = WeChat, 9999983–88 = Epay2–7.
* `SubID = 0` with `Type ≥ 255`: an **event record**, for example Type 1254 "E9.98-Firmware Upgrade"
  with Text1 = the new firmware string, 308 "A52" (clear all), 257 "FID Lost".
* `Type` for sold items: 0 Sale, 1 Buy Back, 10 Inbound, 11 Outbound, and so on.

The consistency loop (the "error check") at `:3920-3990`:

```
prev = "" ; prevCount = 0 ; tries = 0
loop:
  send REQUEST
  cur = all lines up to END (each validated) ; count = number of RES lines
  send "UPL\tEND\t"
  if (count == prevCount && cur == prev)                               → accept prev, stop
  if (count > prevCount && prevCount > 0 && cur.StartsWith(prev))      → accept prev, stop   (new sales arrived meanwhile)
  prev = cur ; prevCount = count ; tries++ ; if tries > 10 → fail ; sleep(tries*100 ms)
send "UPL\tEND\t"   (a second time)
```

So an empty answer is accepted at once. Any non-empty answer is read at least twice, and the
**older** of two matching reads is imported.

How the result is stored (`ECS\RDS.cs:2308-2607`):

* Rows older than `History_DT` are skipped.
* An FID already in the database is skipped.
* A gap in the FIDs is logged as "Lost: FID = a ~ b".
* FID 0 is a "Collision" error.
* On success it logs **`Success: <N> FID, MAC=<mac>, IP=<ip:port>`**, where N = the number of new
  transactions, and writes that line to `LogInfo.txt` (`:2594-2596`, `:2066-2072`, format
  `pw_cInfo_SingleDevice` = "MAC={0}, IP={1}" in Lang.xml).
* Lines like `Success: 0 FID` are pulls that found nothing new, for example the automatic pull at
  connect time.

There is **no** network command to clear or delete the logs on the scale. The scale keeps about 8000
records and deletes the oldest itself (manual txt `:1908`). Clearing is done on the keypad
(A51/A52/A53, code 9958).

### 5.11 Messages the scale pushes by itself = `ASK` [C] `:821-890`, `:1136-1157`

* `ASK\tREP…`: the scale has new sales. The PC runs §5.10 at once, or queues it (§3.3).
* `ASK\tPLU\t<PLUID>\t<Remark(code)>\t<Index(barcode)>\t`: the scale asks the PC for a PLU. The PC
  looks the PLU up by number, then code, then index barcode (`:794-819`), and answers with a
  one-PLU DownloadECS: `\r\n DWL\tPLU\t PLU\t…\t END\tPLU\t`, then the barrier.
* ASK lines are handled only when the background reader is on (`gen_Ask`). Otherwise
  `AsyReadLine` drops any line that starts with `ASK\t` (`:174`).
* **[verified-add]** `ask_fuc_plu_find` reads `items[2]`, `[3]` and `[4]` without checking the
  length (`:796-810`), so an `ASK\tPLU` line needs at least 5 tab fields. `ASK\tPLU` is off by
  default (`gen_AskPLU` = False, `app.config:581-583`), so 58 = 1, not 3. When the background
  reader is on but no action is running, non-ASK lines are **dropped**, not queued
  (`:1140`, `RxMFucing` false). Stray lines between actions therefore do not pollute the next
  answer.

### 5.12 Other buttons in the Ethernet window

These buttons send nothing, or nothing to the scale:

* "Close Device" only closes the local socket (`:4398-4405`, `:4234-4286`). **There is no reboot
  command.**
* "Delete Device" removes the saved entry.
* "Database" tab: FTP upload/download of `ECS.mdb`/`Report.mdb` through `WebClient`. This talks to a
  server, not the scale (`:4950-5032`).
* Deleting one PLU: there is no delete command. The only way is `CLR\tPLU\t` followed by resending
  every PLU.
* **[verified-add]** "Time" (`:4657-4659`) and "Restore MAC" (`:6944-6946`) have empty click
  handlers. "Cancel" only stops the PC's worker (§5.8 note). No other code in the project touches a
  socket: a grep for `TcpClient|UdpClient|Sockets|WebClient|SerialPort` finds only `NetForm.cs`
  (LAN and FTP) plus `SaveForm.cs` and `ReportForm.cs` (RS-232 only).
* **[verified-add] RS-232 comparison** (the same text protocol). The serial "Download"
  (`SaveForm.cs:1262-1285`) first sends `UPL\tTIM\t` and waits up to **3 s** for >10 bytes as a
  presence check. It reads until `END`, sends `UPL\tEND\t`, then streams the blocks with **no**
  closing barrier. The serial log pull (`ReportForm.cs:6206`) sends `UPL\tREP\t<FIDed>\t`, with
  no `-` and no +1, or `-1` for all.

---

## 6. Framing summary

```
stream      := [EF BB BF] CRLF { item }                 ; PC side
item        := block | request | ask | CRLF
block       := "DWL" TAB SEC TAB CRLF { row } "END" TAB SEC TAB CRLF       ; PC→scale data
             | "CLR" TAB SEC TAB CRLF "CLR" TAB "END" TAB CRLF              ; PC→scale erase SEC
request     := "UPL" TAB SEC [TAB arg] TAB CRLF  → scale replies { row } "END" … CRLF ; PC then "UPL" TAB "END" TAB CRLF
ask         := "ASK" TAB kind { TAB field } TAB CRLF    ; scale→PC, unsolicited
row         := KEY { TAB field } TAB CRLF               ; field: no TAB/CR/LF; newline inside text = 0x0B
SEC/KEY     := TMS TMT SCP DPT CLS PLU BAR LAB(+LAS/LAE) SAL VIP FNT BMP VER TIM INF MAC PAS REP(+RES/REE) UNT
numbers     := decimal ASCII, integer or "mantissa,decimals"
binary      := one char per nibble, '@'+nibble, high nibble first; header ints little-endian
```

There is no length, command code, byte-order-sensitive integer, checksum, CRC, ACK/NAK or end
marker other than the `END` lines. "FID" means *transaction (receipt) serial number*.

---

## 7. PLU line (67 data fields) [C]

The format string is at `ECS\NetForm.cs:3444`, the parser at `:2758-2828`, the DB columns in
`mdb\dump\A_ECS\PLU.tsv`. `PLU\t` + 67 fields + `\t`, so `Split('\t')` gives **69** elements, which
matches our tool's "69 columns for V3.14E8". Format: `P` = FormatDecimal(Price) (2 dp),
`W` = FormatDecimal(Weight) (3 dp), `S` = FormatString (CRLF → `\v`).

| idx | field | fmt | idx | field | fmt |
|---|---|---|---|---|---|
| 1 | PLUID (PLU number) | int | 33 | DF_D | int |
| 2 | Remark (item **code**, e.g. 10001, the one in the barcode) | int | 34 | DF_U | int |
| 3 | Index (index/EAN barcode for lookup) | str | 35 | DF_DN | W |
| 4 | UnitID | int | 36 | DF_UN | W |
| 5 | Price | P | 37-41 | DA_Sort1, DA_Day1, DA_Dn1(W), DA_Up1(W), DA_Num1(P) | |
| 6 | Cost | P | 42-46 | DA set 2 (same layout) | |
| 7 | Tare | W | 47-51 | DA set 3 | |
| 8 | LabelID1 | int | 52-56 | DA set 4 | |
| 9 | BarT1 | int | 57 | TaxType | int |
| 10 | BarF1 | int | 58 | Tax | int |
| 11 | LabelID2 | int | 59-62 | SspValue1..4 | int |
| 12 | BarT2 | int | 63 | SType | int |
| 13 | BarF2 | int | 64 | ALPHA (search alias, sent **without** FormatString) | str |
| 14 | ClassID | int | 65 | Flag | int |
| 15 | Name | S | 66 | Flag_Value | int |
| 16-22 | Text1..Text7 | S | 67 | Bitmap | int |
| 23-27 | PS_SD, PS_ST, PS_PD, PS_PT, PS_UD | int | 68 | (empty, after the trailing tab) | |
| 28-32 | PC_SD, PC_ST, PC_PD, PC_PT, PC_UD | int | | | |

Example line built from our tool's `PLU_TEMPLATE` (ours, not customer data):
`PLU\t1\t10001\t\t1\t845,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\tLõi vai bò Mỹ\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\tloivaibomy\t0\t0\t0\t`

---

## 8. Minimal client (pseudocode, C#-flavoured; nothing here has been run)

```csharp
const int SCALE_TCP = 33581, SCALE_UDP = 33583, PC_UDP = 33584;
Encoding ENC = new UTF8Encoding(false);                // we write the BOM ourselves
byte[] CRLF = { 0x0D, 0x0A };

// ---------- helpers ----------
void SendLine(Stream s, string line) {                 // line WITHOUT CRLF
    if (line.IndexOfAny(new[]{'\r','\n'}) >= 0) throw new ArgumentException("CR/LF inside line");
    var b = ENC.GetBytes(line); s.Write(b, 0, b.Length); s.Write(CRLF, 0, 2);
}
string Row(string key, params object[] f) => key + "\t" + string.Join("\t", f.Select(Clean)) + "\t";
string Clean(object v) => (v?.ToString() ?? "").Replace("\t", " ").Replace("\r\n", "\v").Replace("\r"," ").Replace("\n"," ");
string Dec(decimal d, int round) {                     // FormatDecimal clone
    d = Math.Round(d, round); if (d > 9999999m || d < -9999999m) throw new ArgumentOutOfRangeException();
    int n = 0; while (d <= 999999.9m && d >= -999999.9m && d != decimal.Round(d, 0) && n < 7) { d *= 10; n++; }
    return $"{(int)d},{n}";
    // [verified-fix] the original ends with Convert.ToInt32(num2) (Program.cs:556), which ROUNDS
    // half-to-even; (int)d TRUNCATES. They differ when the loop stops on |d| > 999999.9 with a
    // fraction left (e.g. 1000001.5 → original "1000002,0", this clone "1000001,0").
    // Use: return $"{Convert.ToInt32(d)},{n}";   (JS: banker's-round, not Math.trunc)
}
// Line reader: read bytes up to LF, drop CR, decode UTF-8, skip empty lines.
// Handle "ASK\t…" lines separately: log them or queue a sales-log pull. Do not treat them as data.
string ReadLine(Stream s, TimeSpan timeout) { … }
List<string> ReadUntilEnd(Stream s, TimeSpan t) { var L = new List<string>();
    for (;;) { var l = ReadLine(s, t); if (l.StartsWith("ASK\t")) continue; if (l.Split('\t')[0] == "END") return L; L.Add(l); } }

// ---------- (a) discover ----------
List<IPEndPoint> Discover(TimeSpan wait) {
    var u = new UdpClient { ExclusiveAddressUse = false, EnableBroadcast = true };
    u.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
    u.Client.Bind(new IPEndPoint(IPAddress.Any, PC_UDP));          // Windows Firewall: allow UDP 33584 inbound
    var probe = new byte[] { 0x55, 0x44, 0x50, 0x09, 0x0D, 0x0A }; // "UDP\t\r\n"
    for (int k = 0; k < 5; k++) u.Send(probe, 6, new IPEndPoint(IPAddress.Broadcast, SCALE_UDP));
    // also send to each subnet-directed broadcast (e.g. 192.168.2.255), since some routers drop 255.255.255.255
    var found = new List<IPEndPoint>(); var until = DateTime.Now + wait;
    while (DateTime.Now < until) { if (!u.Client.Poll(200_000, SelectMode.SelectRead)) continue;
        IPEndPoint r = null; var t = ENC.GetString(u.Receive(ref r)); int i = t.IndexOf("UDP"); if (i < 0) continue;
        var a = t.Substring(i).Split('\t');
        if (a.Length >= 3 && a[0] == "UDP" && int.TryParse(a[1], out var p)) found.Add(new IPEndPoint(r.Address, p)); }
    return found.Distinct().ToList();
}

// ---------- connect + identify ----------
(Stream s, ScaleInfo info) Open(IPEndPoint ep) {
    var c = new TcpClient(); c.Connect(ep); c.ReceiveTimeout = c.SendTimeout = 30000; var s = c.GetStream();
    s.Write(new byte[]{0xEF,0xBB,0xBF,0x0D,0x0A}, 0, 5);                  // same as StreamWriter preamble + WriteLine()
    SendLine(s, "UPL\tMAC\t");
    foreach (var l in ReadUntilEnd(s, 30s)) { var f = l.Split('\t'); if (f[0]=="MAC") mac = string.Concat(f.Skip(1).Take(6).Select(x => int.Parse(x).ToString("X2"))); }
    SendLine(s, "UPL\tINF\t");
    foreach (var l in ReadUntilEnd(s, 30s)) { var f = l.Split('\t');
        if (f[0]=="INF") { shop=f[1]; machine=f[2]; no=int.Parse(f[3]); model=f[4]; }   // model e.g. "TM-xA UA006 V3.14E8"
        if (f[0]=="INA") enc = (f[1]=="" || f[1]==f[2]) ? f[2] : f[1];                  // expect "UTF-8"; refuse anything else
        if (f[0]=="INM" && f.Length>2 && f[2]!="") mac = f[2].StartsWith("ZZZZ") ? "000000000000" : f[2]; }
    SendLine(s, "UPL\tEND\t");
    return (s, info);
}

// ---------- barrier (proves the scale has processed everything sent so far) ----------
void Barrier(Stream s) { SendLine(s, ""); SendLine(s, "UPL\tTIM\t"); ReadUntilEnd(s, TimeSpan.FromSeconds(60)); SendLine(s, "UPL\tEND\t"); }

// ---------- (b1) upload only PLUs (upsert; no CLR) ----------
void UploadPlu(Stream s, IEnumerable<Plu> plus) {
    SendLine(s, ""); SendLine(s, "DWL\tPLU\t");
    foreach (var p in plus) SendLine(s, p.ToLine());       // 67 fields, §7; Name ≤ 40 chars, no tabs
    SendLine(s, "END\tPLU\t");
    Barrier(s);
    // verify: UPL PLU and compare (§b3), because nothing reports per-line errors
}
// full replace (deletes PLUs missing from the list); do this only after a verified backup (b3):
//   SendLine(s,"CLR\tPLU\t"); SendLine(s,"CLR\tEND\t"); then UploadPlu(...)

// ---------- (b2) upload an edited A_000.TMS ----------
void UploadTmsFile(Stream s, byte[] file) {
    // 1 strip UTF-8 BOM; 2 split on CRLF/LF; 3 DROP the ECS/VER header, END ECS, and the TIM, REP, INF, MAC blocks;
    // 4 rewrite a leading "XD1" opener to "DWL" (this program only ever sends DWL); 5 send the rest line by line
    SendLine(s, "");
    foreach (var line in FilteredLines(file)) SendLine(s, line);
    Barrier(s);
}

// ---------- (c1) download data ----------
List<string> Upl(Stream s, string sec) { SendLine(s, "UPL\t" + sec + "\t"); var L = ReadUntilEnd(s, 30s); SendLine(s, "UPL\tEND\t"); return L; }
// PLU: Upl(s,"PLU").Where(l => l.StartsWith("PLU\t")); LAB: keep LAB/LAS/LAE; also TMS, TMT, SCP, DPT, CLS, BAR, SAL, VIP

// ---------- (c2) download sales logs ----------
List<string> PullLogs(Stream s, string model, int lastFid) {
    string v = model.Split(' ').ElementAtOrDefault(2) ?? "";                    // "V3.14E8"
    bool minus = v.Length >= 6 && decimal.Parse(v.Substring(1, 4), CultureInfo.InvariantCulture) >= 2.38m;
    // [verified-fix] use decimal.TryParse (the original never throws here, NetForm.cs:1230); a
    // non-numeric version string must give minus=false, not an exception.
    string req = "UPL\tREP\t" + (minus ? "-" : "") + (lastFid > 0 ? lastFid + 1 : 1) + "\t";
    string prev = ""; int prevN = 0;
    for (int tries = 0; ; ) {
        SendLine(s, req); var cur = ReadUntilEnd(s, 30s); SendLine(s, "UPL\tEND\t");
        string curS = string.Join("\n", cur); int n = cur.Count(l => l.StartsWith("RES\t"));
        // [verified-fix] the original compares StringBuilder.AppendLine output, so every line,
        // including the last, ends with "\r\n" (NetForm.cs:3943, 3980). Its StartsWith therefore
        // always matches on a line boundary. Build curS the same way:
        //   string curS = string.Concat(cur.Select(l => l + "\r\n"));
        // (With Join, prev "…\tREE\t" would also "prefix-match" a cur line "…\tREE\tX".)
        if ((n == prevN && curS == prev) || (n > prevN && prevN > 0 && curS.StartsWith(prev))) break;
        prev = curS; prevN = n; if (++tries > 10) throw new IOException("unstable REP"); Thread.Sleep(tries * 100);
    }
    SendLine(s, "UPL\tEND\t");
    return prev.Split('\n').Where(x => x != "").ToList();   // parse REP/RES/REE (§5.10); dedupe by (MAC,FID); remember max FID
}

// ---------- (d) clock ----------
void SetClock(Stream s, DateTime t) {
    SendLine(s, ""); SendLine(s, "DWL\tTIM\t");
    SendLine(s, $"TIM\t{t.Year % 100}\t{t.Month}\t{t.Day}\t{t.Hour}\t{t.Minute}\t{t.Second}\t");
    SendLine(s, "END\tTIM\t");
    Barrier(s);   // the TIM answer inside the barrier also lets us read the clock back
}
// Keep-alive while a link stays open: Upl(s,"TIM") at least every 30 s (the scale drops idle links after ~5×Spec48 s).
// [verified-add] Stop unsolicited ASK pushes left over from TM-xA (58 persists, §5.7):
//   SendLine(s,""); SendLine(s,"DWL\tTMS\t"); SendLine(s,"TMS\t58\t0\t"); SendLine(s,"END\tTMS\t"); Barrier(s);
// [verified-add] Barrier(): read until you have seen a "TIM" line AND THEN a field-0 "END" line.
//   An END that arrives before the TIM line is not the barrier's (§5.8 note).
```

PowerShell sketch of the read-only first step (discovery + identity; not run):

```powershell
$u = New-Object Net.Sockets.UdpClient; $u.ExclusiveAddressUse = $false
$u.Client.SetSocketOption('Socket','ReuseAddress',$true); $u.Client.Bind([Net.IPEndPoint]::new([Net.IPAddress]::Any,33584))
$u.EnableBroadcast = $true; $p = [byte[]](0x55,0x44,0x50,0x09,0x0D,0x0A)
1..5 | % { [void]$u.Send($p,$p.Length,[Net.IPEndPoint]::new([Net.IPAddress]::Broadcast,33583)) }
$u.Client.ReceiveTimeout = 3000; $ep = $null
try { while ($true) { $b = $u.Receive([ref]$ep); "$($ep.Address): " + [Text.Encoding]::UTF8.GetString($b) } } catch {}
$c = [Net.Sockets.TcpClient]::new('192.168.x.y',33581); $s = $c.GetStream(); $c.ReceiveTimeout = 30000
$w = [IO.StreamWriter]::new($s,[Text.UTF8Encoding]::new($true)); $w.NewLine = "`r`n"; $w.AutoFlush = $true
$r = [IO.StreamReader]::new($s,[Text.Encoding]::UTF8)
$w.WriteLine(); $w.WriteLine("UPL`tMAC`t"); do { $l = $r.ReadLine(); $l } until ($l -like 'END*')
$w.WriteLine("UPL`tINF`t"); do { $l = $r.ReadLine(); $l } until ($l -like 'END*'); $w.WriteLine("UPL`tEND`t"); $c.Close()
```

---

## 9. Risks, version checks, things that can erase or lock

1. **`CLR\t<SEC>\t` erases a whole table**: PLU, LAB, BAR, CLS, DPT, SAL, VIP, BMP, FNT. `CLR\tTMS\t`
   and `CLR\tTMT\t` [I] probably reset **all** specs and strings to defaults, including the network
   specs, the decimal-point specs and the label/barcode selection. There is no undo, no confirmation
   from the scale and no transaction. If the link drops after a CLR, the scale keeps a partial table.
   Always pull and save a backup (`UPL` of every section, or a USB export) first. Prefer upserts
   without CLR.
2. **Network specs can take the scale off the network** until someone fixes it on the keypad or with
   a USB file:
   * Spec43 (0 = Ethernet off, 2 = client mode);
   * Spec50 (cable or Wi-Fi; needs a reboot);
   * Spec150–173, 166–169 (ports), 430–441.

   With Spec45=1 the change takes effect immediately. Never send these from our tool, and filter
   them out of any TMS block that comes from a file.
3. **`DWL\tTIM\t` from an old export sets the clock back.** Sale dates, FIDs and **printed
   packing/expiry dates (HSD)** would all be wrong. Remove the `TIM` block from uploads (our tool
   already does this with keepClock) and sync the clock on purpose (§8d). Note that the original
   program does this automatically on every connect (AutoTask "Online").
4. **Do not send the `REP` block of an export back to the scale.** [?] What the scale does with a
   `DWL\tREP` block is unknown (duplicate logs? ignore?). The same applies to `INF` (it renames the
   scale) and `MAC`.
5. **`DWL\tMAC\t` changes the scale's identity.** `Report.mdb` is keyed by MAC, so the history
   splits. The randomly generated MAC is 00:23:F0:FF:xx:xx.
6. **`DWL\tVER\t` = firmware flash.** The PC checks nothing: no model, no version, no size. A wrong
   file can brick the scale. The same goes for **`DWL\tFNT\t`**: a wrong font breaks the display and
   the labels (Vietnamese glyphs!).
7. **`DWL\tPAS\t` (Config Wizard) sets the scale passwords** (0 Admin … 5 PriceFProg), so it can
   lock people out of Prog/Sale. Spec49 "Password Authorization" (0 = device only,
   1 = communication allowed) [I] probably controls whether this is accepted over the link.
8. **Firmware version checks in the PC**: only `V2.38` (sign of `UPL REP`), `V2.49A` (Spec58 ASK
   flags) and `V3.00A` (cost from the scale). There is no check on the PLU layout: the PC always
   sends 67 fields. That matches V3.14E8/V3.15x exports (69 split fields). Other firmware may differ,
   so compare with a fresh `UPL\tPLU\t` before writing.
9. **Silent value limits**:
   * a price above 9 999 999 becomes `0,0`;
   * a TAB or newline inside a name shifts columns;
   * only LabelID 10–99 are sent;
   * PLU names over the scale's limit (40 in our tool) [?] are probably cut.

   Errors are only counted on the scale's P42 Ethernet monitor ("Number of Error Data"), never sent
   back.
10. **Concurrency with the original software.** TM-xA.exe auto-connects to every scale, runs a link
    test every 30 s, pushes the clock and Spec58, and pulls logs when the scale sends `ASK`. Running
    both at once can interleave streams on the same scale [I] or be refused. Close TM-xA.exe first.
    Only one of the two can receive UDP 33584 replies reliably.
11. **Sales logs are not deleted by pulling**, so they are safe to read. But FIDs can restart (A52
    clear all, factory reset). A tool that trusts `lastFid+1` would then wait forever. Watch for event
    records 308/1253/1254 and for a newest FID lower than the stored one.
12. **Spec58 persists.** After our tool (or TM-xA) writes 58=1, the scale keeps sending `ASK\tREP`.
    Our reader must ignore those lines.
13. **[verified-add] `CLR\tFNT\t` without a font.** With "Clear old data" and "Font" ticked, the PC
    sends `CLR\tFNT\t` + `CLR\tEND\t` **before** it checks that the font file exists
    (`:3563-3569`). If `Binary\Font.bin` is missing, the scale's font area is cleared and nothing
    replaces it. For a Vietnamese shop this means garbled names and labels until a font is
    reloaded.
14. **[verified-add] Machine number −1** (allowed by the Rename dialog) makes TM-xA drop that scale
    on every connect (§3.1 step 5). Never send `INF\t…\t-1\t…`.
15. **[verified-add] Scheduled "Download data" reuses the UI checkboxes**, including "Clear old
    data" (§3.1). A TM-xA left running with such an AutoTask would periodically wipe and re-send
    tables behind our tool's back. Check `AutoTask.xml` on any PC that runs TM-xA.
16. **[verified-add] Cancel mid-download leaves a truncated table**, closed with `END` and without
    the barrier (§5.8). After a `CLR` the scale keeps only the rows sent so far. Our tool must not
    stop between a `CLR` and the end of its `DWL` block.
17. **[verified-add] Mitigation that already exists.** The PC sends only `Valid` spec and string
    rows, and every dumped DB has the network specs marked `Valid = False` (§5.8). Keep the same
    rule in our tool: an explicit allow-list of spec IDs, never "all rows".

---

## 10. Checking the current tool's beliefs (`C:\Beeftown\cong-cu\Beeftown_Can_TMA.html` PART 1)

* TAB-separated, CRLF, sections open with `DWL\t<NAME>\t` and close with `END\t<NAME>\t`: **Confirmed.**
  This is the exact same grammar on the network.
* `XD1` opener (the comment calls it "đời cũ", old generation): **Corrected.** This PC program (v3.10)
  never writes or reads `XD1`. `DWL` is the only opener it knows (grep of all sources). The
  test-fixture header `ECS\tVER\tV3.15C5\tUTF-8\t` with `XD1` suggests that `XD1` comes from
  **newer** firmware exports. Always send `DWL` over the network.
  * **[verified-fix]** That fixture is **synthetic**. `test-kho-can.mjs:10-13` says it does not
    use the real file, and `:187` builds the XD1 variant with our own `taoFile(...)`. It is not
    evidence about which firmware writes `XD1`. "Old" (our tool's comment) against "newer" (this
    spec) is still [?]. What is confirmed: the real V3.14E8 USB export starts with
    `ECS\tVER\tV3.14E8\t` (the firmware version, fixture default `:48`), while the PC's own export
    writes `ECS\tVER\t100\t` (`SaveForm.cs:947`). The `VER` value therefore tells a
    scale-written file from a PC-written one.
* Prices use `mantissa,decimals` (`845,0`, `1105,1`): **Confirmed** (`FormatDecimal`/`ParseDecimal`).
  Values ≥ 10 000 000 become `0,0`.
* PLU line has 69 columns (V3.14E8): **Confirmed.** It is `PLU` + 67 fields + an empty element, and
  the column map is in §7: 1 = number, 2 = code (Remark), 3 = index barcode, 4 = unit, 5 = price,
  15 = name, 64 = alias.
* LAB/LAS/LAE layout: **Confirmed.** LAB column 22 = Version, and text t sits at column 6+t (t < 16)
  or 7+t: matches `textCol`. One small correction: in `parseLas`, LAS column 7 is **Align** and
  column 8 is **Font** (`:2990-2991`), so the tool's `size: f[7]` reads Align. It is not used
  anywhere yet.
* SCP rows are `SCP\t<page>\t<key>\t<PLU>\t`: **Confirmed.**
* TIM row is `TIM\tYY\tM\tD\th\tm\ts\t` (YY = year − 2000): **Confirmed.**
* INF row, where f[4] = model/version: **Confirmed.** f[1..3] are shop name, machine name and
  machine number.
* A UTF-8 BOM may be present: **Confirmed** as harmless. The PC itself writes a BOM at the start of
  files and, [I], of streams.

---

## 11. Unknowns / how to settle them safely

1. The exact UDP reply after `UDP\t<port>\t`, and whether the scale announces itself on its own.
   Capture it with Wireshark while the **original** program does "Find Device" (the user runs this).
2. The first field of `INM`, the INA int field `[3]`, and the units of `mem_DATA`/`mem_FONT`.
3. The meaning of the `-` in `UPL\tREP\t-N\t`, and whether `UPL\tEND\t` after REP tells the scale
   "received" (it does not seem to delete anything).
4. Whether the scale sends anything (for example `DWL\t<SEC>\t` wrappers, or a BOM) around `UPL`
   answers, and which line ending it uses. The PC tolerates all of them.
5. What `CLR\tTMS\t`/`CLR\tTMT\t` reset to, and what the scale does with a `DWL\tREP`/`DWL\tINF` block.
6. Whether the scale allows two TCP clients at once, and what happens to the first one.
7. How long the scale needs to store a large PLU set. The PC waits 30 s after it finishes sending,
   while TCP back-pressure pauses the sender. Allow 60 s or more.
8. How Spec49 affects `PAS` and other writes.

The best single check: run TM-xA.exe on the shop PC once while Wireshark captures `tcp.port==33581 ||
udp.port in {33583 33584}`. This must be done by the user, because we do not execute the vendor
binaries.

**[verified-add] Status after verification:**
* #1: **partly resolved.** The reply's destination port is fixed at the scale's Spec169
  "UDP remote port" = 33584 (manual `:4576`), so a client must bind 33584. Payload after the port,
  unicast or broadcast, and self-announcement are still unknown.
* #2: **partly.** The USB importer treats `INM[1]` as the current MAC and `INM[2]` as the
  "original" MAC (`ReportForm.cs:5581-5592`). The LAN path uses `INM[2]`. The INA `[3]` field and
  the units of `mem_DATA`/`mem_FONT` are still unknown. (Bitmap memory is counted in 4096-byte
  slots, §5.8, but that is a PC-side rule.)
* #3: **resolved for the `-` form.** `-N` means "from FID N inclusive" (data, §5.10). The meaning
  of the sign itself and of the positive form are unknown. `UPL\tEND\t` after REP deletes nothing:
  the same FIDs can be re-read with "Send all", and the scale keeps about 8000 records (manual
  `:1908`).
* #4: unknown.
* #5 (PC BOM): **near-certain** from framework semantics (§1.5).
* #6, #7, #8: unknown.
* #9: unknown. The barrier's 30 s clock starts when the last byte has been handed to the socket
  (`:3773` runs after all writes, and `SendTimeout` is 30 s per write).

---

## 12. Evidence index (decompiled source unless noted)

* **Enums and state**:
  * `ECS\NetForm.cs:25-53` LinkType/TableType/NetworkAction.
  * `:59-220` MyTag: Enc `:218`, `Client_RW` `:119-147`, `AsyReadLine` `:161-189`.
* **Actions**:
  * Argument layouts: `BeginNetworkAction` `:941-1117`.
  * Worker dispatch: `BW_DoWork` `:1172-1212`.
  * Online chain: `:1315-1423`.
  * UpdateAsk `:1445-1466`.
  * UploadInfo_Part `:2036-2209`, DownloadIP `:2225-2253`, DownloadMAC `:2255-2290`,
    DownloadInfo `:2292-2312`, DownloadTime `:2314-2325`, UploadTime `:2327-2375`.
  * UploadECS `:2377-3209`, DownloadECS `:3211-3816` (PLU line `:3444`, barrier `:3772-3809`),
    UploadReport `:3889-4044`.
* **Sockets**:
  * UDP listener `:4046-4093`, TCP server `:4112-4131`, TCP clients `:4133-4169`, AddLink `:4176-4222`.
  * BroadCast `:4288-4332`, Find Device `:4480-4516`.
  * Startup (ipList, threads, AutoTask, reportTimer) `:1629-1927`.
* **ASK handling**: `:794-890`, `:1119-1170`.
* **Buttons**: rename `:5666-5682`, Set IP `:5684-5700`, New MAC `:6926-6942`,
  auto tasks `:5134-5258`, reportTimer `:7059-7083`.
* **Program.cs**:
  * encoding `:105-108`, nibble encoder `:125-139`;
  * Parse* `:168-251`, FormatString/FormatDecimal `:525-557`;
  * log writer `:600-612`.
* **Other code**:
  * `ECS\RDS.cs:2066-2080` (LogInfo/LogError), `:2308-2607` (REP/RES/REE parser, "Success: N FID").
  * `ECS\ReportForm.cs:6060-6240` (the same protocol over RS232), `:5499-5605` (reading a USB log file).
  * `ECS\SaveForm.cs:945-947, 1224` (USB file envelope `ECS\tVER\t100\t` … `END\tECS\t`).
  * `ECS\NetSetIPForm.cs:149-189` + resx positions; `ECS\NetRenameForm.cs:33-47`; `ECS\AddressForm.cs:84-87`.
  * `ECS\AutoTaskForm.cs:460-527`; `ECS\WizardForm.cs:1912-1953` (PAS); `ECS\WizardPicForm.cs:170-178` (bitmap bits).
* **Config**: `app.config:112-126` (ports), `:199-203` (buffers), `:211-225` (broadcast mode, timeouts),
  `:250-263` (AskLogs), `:296-300` (decimals), `:578-586` (gen_Ask*).
  The install `TM-xA.exe.Config` is identical to `app.config` in both copies (diff).
* **Install data**:
  * `Tm.xml` (Spec43-53, 150-173, 430-441; TMT15/16/19; Spec58 absent);
  * `Combo.xml` (Network_Task/Network_Due);
  * `AutoTask.xml` (Link Test every 30 s; Time Sync when Online);
  * `LogInfo.txt` (35 lines in copy A, all `…:33581`);
  * `user_config.bck` (ipList with model `…(UTF-8)`);
  * `Config\en\_ECS.TMS` (BOM + CRLF + `ECS\tVER\t100\t` envelope).
* **Manuals**:
  * `Document\User Manual\Direction of Ethernet Connection.pdf` (Spec43/44/45/150-173/50-53, DHCP, client mode, WAN);
  * Printing Serial Scale V3.04A (text extract `work\Printing Serial Scale V3.04A.pdf.txt:4127-4148, 4535-4576, 3363-3408, 3607-3690`).
* **Databases**:
  * `mdb\dump\A_Report\Device.tsv` (MAC, Name, GID, FIDed), `rLogsType.tsv` (log types);
  * `A_ECS\PLU.tsv` header, `*_ECS\Spec.tsv` (network defaults).

---

## Verification log

An adversarial re-check against the decompiled source, the install data and the TSV dumps.
Nothing was executed and no socket was opened. "OK" means the claim held as written.

| # | Claim checked | Evidence | Outcome |
|---|---|---|---|
| 1 | Ports 33581/33582/33583/33584, broadcast IP, 30 s timeouts, sendBufSize 1024 | `app.config:112-126, 199-203, 211-225`; install `TM-xA.exe.Config` identical (diff) | OK |
| 2 | Probe = `UDP\t\r\n` ×5 from :33584 to 255.255.255.255:33583; reply parsed as `UDP\t<port>\t…` (≥3 fields); TCP to sender IP | `NetForm.cs:4288-4332`, `:4046-4093` | OK. Added: the reply port is the scale's Spec169 "UDP remote port" (manual `:4575-4576`); 33584 is double-bound |
| 3 | `Client_RW` writes an empty line first; BOM likely | `:119-137`; net20 target `TM-xA.csproj:7` | OK; confidence raised with framework reasoning |
| 4 | Handshake order MAC → INF → `UPL\tEND\t`; no `UPL END` after MAC; MAC decimal→hex | `:2036-2209` | OK. Added: −1 machine number = failure; uncaught FormatException |
| 5 | INF/INA/INM field indices; encoding switch rule | `:2088-2193`, `:1233-1236` | OK. Added: USB importer keys by INM[1], LAN by INM[2] (`ReportForm.cs:5581-5592`) |
| 6 | Version gates V2.38 / V2.49A / V3.00A | `:1227-1232`, `:1452`, `:4026` | **Fixed**: 58 is written for all firmware (0 below V2.49A). Added: culture-dependent TryParse |
| 7 | PLU line = 67 fields, 69 split elements, column map (off-by-one check) | send `:3444`, parse `:2758-2828`, tool `PLU_TEMPLATE` and the spec §7 example split in Python (69/69, all 68 names aligned) | OK, no off-by-one |
| 8 | LAB 38 fields, Width/Height ÷8 (mm), LAS 12 fields, LAS[7]=Align, [8]=Font | `:3510`, `:3520`, `:2918-2995`; `_ECS.TMS` LAB NF=40, LAS NF=14 (awk, incl. trailing CR) | OK. Added independent proof of 8 dots/mm (`BitmapFuc.cs:219`) |
| 9 | FormatDecimal/ParseDecimal behaviour; Price 2 dp, Weight 3 dp | `Program.cs:229-251, 530-557`; `app.config:296-300` | OK. **Fixed** §8 clone: `(int)` truncates, original `Convert.ToInt32` rounds half-to-even |
| 10 | Nibble encoding `'@'+nibble`, high first; bitmap header 4+2+2+88 bytes LE = 192 chars | `:3582-3586`, `:3617-3625`; `Program.cs:125-139` | OK. Added: 4096-byte bitmap slots |
| 11 | No CRC/checksum anywhere | grep `crc|checksum|MD5|SHA1|0xEDB88320|0x1021|0xA001` over `ECS\*.cs` finds only barcode check-digit UI | OK |
| 12 | DownloadECS block order, CLR pairs, SCP never cleared, units never sent, labels 10..99 | `:3270-3771`; `app.config` minUserLabelID=10, maxLabelID=99 | OK. Added: only `Valid` spec/string rows (network specs Valid=False in all dumps); CLR FNT sent before the file-exists check; Cancel truncates the table (END still written, no barrier) |
| 13 | Barrier = `\r\n UPL\tTIM\t`, 30 s deadline, no queue clear | `:3772-3809` | OK. **Fixed**: "scale is silent" is only an inference; "reads its write back" overstated |
| 14 | DownloadIP spec numbers and box mapping (IP / gateway / mask) | `:2225-2253`, `:5694-5698`, `NetSetIPForm.cs:149-189`; Tm.xml 150-165, 430-441 | OK. Added: Tm.xml name of Spec45 = "Auto Reboot if Configure Changed" |
| 15 | DownloadMAC `00:23:F0:FF:rnd:rnd` + `END\tTMS\t` | `:2255-2290`, `:6926-6942` | OK. Added: "Restore MAC" is hidden and empty |
| 16 | DownloadTime format; "Time" button | `:2314-2325`; hex example re-derived by hand | OK. Added: the Time button handler is empty (`:4657-4659`) |
| 17 | UploadReport request, `-` rule, double-read loop, 11 tries | `:3889-4044` | OK. **Fixed** §8 prefix compare (AppendLine semantics) |
| 18 | "Success: N FID" = number of newly added transactions | `RDS.cs:2308-2607` (`num3++` per new REP), `:2066-2072`; `LogInfo.txt` sums against `Device.FIDed` for 3 MACs | OK |
| 19 | Meaning of the FID argument | Log.tsv FID runs for 11 MACs across 6 Report dumps; no LogError.txt | **Resolved**: `-N` is inclusive; the old "clearly" wording fixed |
| 20 | REP/RES/REE indices; payment PLU codes; event types | `RDS.cs:2330-2590`; `rLogsType.tsv` (257, 308, 1253, 1254); fixture `test-kho-can.mjs:59-60` (19 elements, 0.16 kg × 100.000 = 16.000) | OK |
| 21 | AutoTask: Link Test every 30 s (Due=1), Time Sync on Online (Due=2); enum = Combo.xml | install `AutoTask.xml`; `Combo.xml` Network_Task/Due; `NetForm.cs:39-53`, `:5134-5258` | OK. Added: tasks need non-empty shop/machine/no/model; timed tasks use the live UI checkboxes |
| 22 | Online chain: Due=2 tasks → UploadReport (if <16 online) → UpdateAsk | `:1355-1404`; `app.config:250-258, 578-586, 632-634` | OK |
| 23 | ASK handling; gen_AskPLU default False | `:821-890`, `:1119-1170`, `app.config:581-583` | OK. Added: turning Ask off does not reset 58 on the scale |
| 24 | Network specs default values (43=1, 44=30, 45=1, 48=10, 49=0, 50=0, 153=0, 166-169) | `mdb\dump\{A_ECS,B_ECS,A_en_Default}\Spec.tsv`; manual `:4127-4148` | OK (all `Valid=False`) |
| 25 | Only NetForm touches the LAN | grep for socket, web and serial classes | OK (plus RS-232 in `SaveForm`/`ReportForm`) |
| 26 | `XD1` never appears in the PC program | grep `XD1` over `tmxa-src` = 0 hits | OK. **Fixed**: the "newer firmware" inference rested on a synthetic fixture |
| 27 | "35 lines, all :33581" in LogInfo copy A | `wc -l` = 35; `grep -v :33581` = empty; copy B has 25 lines, a prefix of A | OK |
| 28 | Missed features | TXT/Excel tabs (`:5748-5822`, `:6052-6226`), TabledAuto rename (`:6227-6261`), ipList save rule (`:2013-2020`) | Added to §5.4, §5.8, §1.2 |

Still unknown after this pass (a user-run Wireshark capture of TM-xA would settle most):
* the UDP reply payload after the port, and self-announcement;
* INM[1] versus INM[2] on the wire, INA[3], and the mem_* units;
* the meaning of the `-` sign itself and of the positive `UPL\tREP\tN\t` form, and why FID 1 is
  never returned;
* whether the scale wraps UPL answers, sends a BOM, or acknowledges DWL blocks;
* what `CLR\tTMS\t` and `CLR\tTMT\t` reset to, and how the scale treats `DWL` of REP/INF/TIM/MAC;
* concurrent TCP clients;
* Spec49 gating;
* storage time for large sets.
