/**
 * MẪU CHỮ VỀ ĐỊA ĐIỂM — một bộ luật dùng chung cho mọi phép thử gác địa điểm
 * ==========================================================================
 *
 * Điều đã biết về địa điểm của quán (Khánh quyết ngày 07/10 và 09/10/2026; có thang máy: Khánh
 * xác nhận ngày 11/10/2026): Tầng 3, 63 Hồ Tùng Mậu · lối vào riêng ngay cạnh GS25 · khách đi
 * thang máy lên tầng 3. Ngoài mấy điều đó trang không được nói gì thêm về đường đến.
 *
 * File này chỉ chứa MẪU TÌM CHỮ SAI. Ba nơi dùng:
 *   · crm/test/test-cong-khai-cau-chu.mjs nhóm 7 — chữ khách đọc, đọc từ mã nguồn;
 *   · crm/test/test-cong-khai-dia-diem.mjs      — mã nguồn của trang công khai, kể cả chú thích;
 *   · web/kiem-tra/trinh-duyet.mjs              — trang đã dựng, mở bằng trình duyệt thật.
 * Một bộ mẫu, một bảng câu thử (CAU_THU bên dưới): sửa mẫu ở đây là cả ba nơi đổi theo, và
 * test-cong-khai-cau-chu.mjs chạy bảng câu thử để mẫu không bắt nhầm câu đúng, không bỏ sót câu sai.
 *
 * Chữ MONG ĐỢI (địa chỉ đúng, câu chỉ đường, dòng pháp nhân) thì KHÔNG để ở đây: mỗi phép thử tự
 * chép tay, để sửa nhầm một ký tự ở mã nguồn là có phép thử đỏ.
 *
 * Mỗi luật là { ten, tim(chu) }: tim trả về đoạn chữ khớp đầu tiên, hoặc null. Có luật cần cả mẫu
 * phân biệt hoa thường ("P.", "Q.1") lẫn mẫu không phân biệt, có luật cần hai điều kiện cùng lúc
 * (số đo thời gian chỉ sai khi câu đang nói về đường đi), nên luật là danh sách mẫu — biểu thức
 * hoặc hàm (chu) → đoạn khớp | null — chứ không phải một biểu thức.
 */

/** Gom nhiều mẫu thành một luật. */
function luat(ten, ...mau) {
  return {
    ten,
    mau,
    tim(chu) {
      const s = String(chu ?? '');
      for (const m of mau) {
        const thay = typeof m === 'function' ? m(s) : s.match(m)?.[0];
        if (thay) return thay;
      }
      return null;
    },
  };
}

/**
 * TÊN ĐƯỜNG, TÊN KHU của hai mặt bằng đã khai trước, và phường của chúng khi viết như một vế địa
 * chỉ. Toàn là tên riêng nên tìm được cả trong mã nguồn và HTML thô. "Sài Gòn" đứng một mình thì
 * KHÔNG bắt — "Bia Sài Gòn", "Sài Gòn Thương Tín" là chữ đúng.
 *
 * Cùng luật này giữ địa chỉ PHÁP NHÂN (giấy chứng nhận đăng ký địa điểm kinh doanh, sửa 26/10/2026)
 * ở đúng một chỗ: dòng pháp nhân ở chân trang. Ở mọi chỗ khác nó là "một địa chỉ khác 63 Hồ Tùng
 * Mậu" — khách đọc thành địa chỉ quán. "An Khánh" đứng một mình thì KHÔNG bắt (tên người), chỉ khi
 * viết như một vế phường.
 */
export const TEN_DIA_CHI_KHAC = luat(
  'ghi tên đường hay tên phường của một địa chỉ khác 63 Hồ Tùng Mậu',
  /Hàm\s*Nghi|Ham\s*Nghi|H%C3%A0m\+Nghi|함\s*응이/iu,
  /Nguyễn\s*Thái\s*Học|Nguyen\s*Thai\s*Hoc|Cầu\s*Ông\s*Lãnh|Cau\s*Ong\s*Lanh/iu,
  /phường\s+Sài\s*Gòn|(?:Sài\s*Gòn|Sai\s*Gon|Saigon)\s+Ward|사이공\s*동/iu,
  /(?<![\p{L}\d])P\.\s?Sài\s*Gòn/u,
  /Võ\s*Trường\s*Toản|Vo\s*Truong\s*Toan|V%C3%B5(?:\+|%20)Tr%C6%B0%E1%BB%9Dng/iu,
  /phường\s+An\s*Khánh|An\s*Kh[aá]nh\s+Ward|(?<![\p{L}\d])P\.\s?An\s*Khánh/iu,
);

/**
 * SỐ NHÀ của mặt bằng trước ("11-21", "11-13-15…"). Chỉ dùng cho CHỮ KHÁCH ĐỌC: trong mã nguồn và
 * HTML thô, nét vẽ SVG cũng có dãy số kiểu đó (d="M3 11-21 5"). Không bắt ngày 2026-11-21.
 */
export const SO_NHA_KHAC = luat(
  'ghi số nhà của một địa chỉ khác (11-21, 11-13-15…)',
  /(?<![\d-])11[-–]21(?![\d-])|(?<![\d-])11[-–]13[-–]15/u,
);

/**
 * MỌI VẾ PHƯỜNG / QUẬN. Phường của 63 Hồ Tùng Mậu chưa có giấy xác nhận, nên chữ khách đọc không
 * được có vế phường hay quận nào — tên gì cũng vậy. Dùng sau khi đã bỏ dòng địa chỉ pháp nhân.
 *   vi: "phường X", "P. X", "P.12", "quận X", "Q.1", "Q1"
 *   en: "… Ward", "District …", "Dist. 1"
 *   ko: "1군", "벤응에동" khi viết kiểu địa chỉ (đứng sau 호치민시 hoặc sau số nhà), "Bến Nghé동", "프엉 …"
 */
export const PHUONG_QUAN = luat(
  'ghi tên phường hay quận (phường của 63 Hồ Tùng Mậu chưa có giấy xác nhận)',
  /(?<![\p{L}])(?:phường|quận)\s+[\p{L}\d]/iu,
  /(?<![\p{L}\d])P\.\s?(?=[\p{Lu}\d])/u,
  /(?<![\p{L}\d])Q\.?\s?\d{1,2}(?![\p{L}\d])/u,
  /\bwards?\b|\bdistricts?\b|\bdist\.\s?\d/iu,
  /\d+\s*군(?!데)|(?:프엉|푸엉|꾸언|꾸안)\s*[\p{L}\d]|[A-Za-zÀ-ỹ]\s?(?:동|군|구)(?![가-힣])/u,
  /호치민시?\s+(?:\S+\s+){0,2}?\S*[\p{L}\d](?:동|군|구)(?=[\s,.]|$)/u,
  /Hồ\s*Tùng\s*Mậu\s*63\s*,?\s+\S*[\p{L}\d](?:동|군|구)(?=[\s,.]|$)/u,
);

/** Khách đi thang máy: chữ về cầu thang bộ, hay câu nói không có thang máy, đều sai. */
export const CAU_THANG = luat(
  'nhắc cầu thang bộ hay nói không có thang máy (khách đi thang máy)',
  /cầu\s*thang|thang\s*bộ|stair|계단/iu,
  /không\s+có\s+thang\s*máy|no\s+(?:guest\s+)?(?:lift|elevator)|(?:lift|elevator)\s+is\s+not|엘리베이터(?:는|가)?\s*없/iu,
);

/** Không gọi 63 Hồ Tùng Mậu là "tòa nhà". "building" là động từ trong "We are building our opening team". */
export const TOA_NHA = luat(
  'gọi 63 Hồ Tùng Mậu là "tòa nhà" / "the building" / "건물"',
  /t[oò][aà]\s*nhà|건물|빌딩|\b(?:the|this|our|a)\s+building\b/iu,
);

/**
 * KỂ CHUYỆN ĐỔI ĐỊA ĐIỂM. Trang chỉ nói địa điểm hiện tại. Mẫu phải gắn với chữ địa chỉ / địa điểm
 * hoặc với chủ ngữ là quán: "đã chuyển tới nhà hàng" (yêu cầu của khách), "chuyển sang Messenger",
 * "trước đây bạn từng hỏi bàn", "information you previously gave us" là câu đúng, không bắt.
 */
export const CHUYEN_DIA_DIEM = luat(
  'kể chuyện đổi địa điểm ("địa chỉ mới", "quán đã chuyển về…", "trước đây quán ở…", "new address", "we have moved", "새 주소"…)',
  /(?:địa\s*(?:chỉ|điểm)|mặt\s*bằng|cơ\s*sở)\s*(?:mới|cũ)/iu,
  /(?:đổi|chuyển|dời)\s+(?:địa\s*(?:chỉ|điểm)|mặt\s*bằng)/iu,
  /(?:quán|nhà\s*hàng|Beeftown|chúng\s*tôi)\s+(?:đã\s+|vừa\s+|sẽ\s+)?(?:chuyển|dời)\s+(?:về|sang|đến|tới|ra|lên|xuống)\s+(?:địa|số|tầng|đường|phố|chỗ|nơi|mặt\s*bằng|\d|Hồ\s|Hàm\s)/iu,
  /trước\s*đây\s+(?:quán|nhà\s*hàng|Beeftown|chúng\s*tôi)?\s*(?:ở|tại|nằm)(?![\p{L}])/iu,
  /\b(?:new|old|former|previous)\s+(?:address|location|premises|venue|home)\b/iu,
  /\b(?:we|beeftown|the\s+restaurant)(?:'ve|\s+have|\s+has|\s+are|\s+is)?\s+(?:just\s+|now\s+)?mov(?:ed|ing)(?:\s+(?:to|from|into|here|house|out)\b|\s*[.!,;]|\s*$)/iu,
  /\brelocat|\b(?:formerly|previously)\s+(?:at|on|in|located)\b/iu,
  /새\s*(?:주소|매장|위치|장소)|예전\s*(?:주소|매장|위치)|주소(?:가|를)?\s*(?:바뀌|변경)/u,
  /(?:매장|가게|식당|Beeftown)(?:을|를|이|가|은|는)?\s*(?:이전|옮)|이전\s*(?:했|하였|합니다|해요)|옮겼/u,
);

/** Chưa xác nhận ở 63 Hồ Tùng Mậu: chỗ gửi xe, lối cho xe lăn. */
export const TIEN_ICH_CHUA_XAC_NHAN = luat(
  'nói chỗ gửi xe hay lối cho xe lăn (chưa xác nhận)',
  /gửi\s*xe|giữ\s*xe|bãi\s*(?:đỗ\s*|đậu\s*)?xe|đỗ\s*xe|đậu\s*xe|xe\s*lăn/iu,
  /\bparking\b|\bvalet\b|car\s*park|wheelchair|step-free|barrier-free/iu,
  /주차|발레|휠체어|무장애/u,
);

/**
 * SỐ ĐO ĐƯỜNG ĐI — chưa ai đo. Hai lớp:
 *   · đơn vị độ dài (mét, m, km, 미터) thì câu nào có cũng sai;
 *   · phút, giây, bước chỉ sai khi CHÍNH CÂU ĐÓ đang nói về đường đi (đi bộ, cách, GS25, lối vào,
 *     thang máy, đường lên…): "Nhà hàng giữ bàn 15 phút", "Chọn bò trong 3 bước" là câu đúng.
 * Chữ đứng sau đơn vị không được là chữ cái: "3 món", "tầng 3 mở cửa", "GS25 mở cửa" là câu đúng
 * (\b coi chữ có dấu là ranh giới nên không dùng). Tiếng Hàn: "2분" là hai phút, "2분께" / "2분들" là
 * hai vị khách.
 */
const NOI_VE_DUONG_DI = /đi\s*bộ|cách\s|quãng|GS25|lối\s*vào|thang\s*máy|đường\s*(?:lên|đến|tới|đi)|(?:tới|đến)\s*(?:quán|nơi|bàn)|từ\s+(?:cửa|lối|thang|đường|phố|ga|bến)|\bwalk|on\s+foot|\baway\b|\bentrance\b|\blift\b|\belevator\b|도보|걸어|거리|입구|엘리베이터|오시는\s*길/iu;
const SO_DO_THOI_GIAN = /\d+[\s-]*(?:phút|giây|bước|minutes?|mins?|seconds?|secs?|steps?)(?![\p{L}])|\d+\s*분(?![께들])|\d+\s*초(?![\p{L}])|\d+\s*걸음/iu;
export const SO_DO_DUONG_DI = luat(
  'ghi số đo đường đi (mét, phút, bước…) — chưa ai đo',
  /\d+[\s-]*(?:mét|km|m)(?![\p{L}])|\d+[\s-]*met(?:er|re)s?(?![\p{L}])|\d+\s*미터/iu,
  chu => (NOI_VE_DUONG_DI.test(chu) ? chu.match(SO_DO_THOI_GIAN)?.[0] ?? null : null),
);

/** Luật cho CHỮ KHÁCH ĐỌC của trang công khai (mã nguồn đã tách thành câu, hoặc chữ của trang đã dựng). */
export const LUAT_CHU_KHACH_DOC = [
  TEN_DIA_CHI_KHAC, SO_NHA_KHAC, PHUONG_QUAN, CAU_THANG, TOA_NHA, CHUYEN_DIA_DIEM, TIEN_ICH_CHUA_XAC_NHAN, SO_DO_DUONG_DI,
];

/** Bỏ dòng địa chỉ pháp nhân khỏi một đoạn chữ — chỗ duy nhất được ghi địa chỉ trên giấy đăng ký. */
export const boPhapNhan = (chu, dongDiaChi) => String(chu ?? '').split(dongDiaChi).join('');

/**
 * BẢNG CÂU THỬ. `bat`: câu sai, luật phải bắt. `khong`: câu đúng, luật không được bắt.
 * Mỗi câu trong `khong` là một lần mẫu từng bắt nhầm, hoặc một câu đang có thật trên trang.
 */
export const CAU_THU = [
  { luat: TEN_DIA_CHI_KHAC,
    bat: ['Tầng 3, 11-21 Hàm Nghi', 'Hàm Nghi 11-21', 'https://maps.google.com/?q=11-21+H%C3%A0m+Nghi', '40–42 Nguyễn Thái Học',
      'P. Cầu Ông Lãnh', 'phường Sài Gòn', 'Phường Sài Gòn', 'P. Sài Gòn', 'Saigon Ward', '사이공동',
      '53 Võ Trường Toản', '53 Vo Truong Toan, An Khanh Ward', 'https://maps.google.com/?q=53+V%C3%B5+Tr%C6%B0%E1%BB%9Dng+To%E1%BA%A3n',
      'https://www.google.com/maps/search/53%20V%C3%B5%20Tr%C6%B0%E1%BB%9Dng%20To%E1%BA%A3n',
      'Phường An Khánh', 'phường An Khánh', 'P. An Khánh', 'An Khánh Ward'],
    khong: ['Tầng 3, 63 Hồ Tùng Mậu, TP.HCM', 'Bia Sài Gòn', 'Sài Gòn Thương Tín', 'ẩm thực Sài Gòn', 'd="M3 11-21 5"',
      'Khánh quyết 26/10/2026', 'Khánh xác nhận ngày 11/10/2026'] },
  { luat: SO_NHA_KHAC,
    bat: ['Tầng 3, 11-21 Hàm Nghi', '11–21', 'Tầng 3, 11-13-15-17-19-21 Hàm Nghi'],
    khong: ['đến ngày 2026-11-21', 'Tầng 3, 63 Hồ Tùng Mậu, TP.HCM', '11-21-2026'] },
  { luat: PHUONG_QUAN,
    bat: ['Beeftown ở tầng 3, 63 Hồ Tùng Mậu, phường Bến Nghé, Quận 1, TP.HCM.', 'Floor 3, 63 Hồ Tùng Mậu, Ben Nghe Ward, District 1',
      'P. Bến Nghé', 'P.12, Q.10', 'Q1, TP.HCM', 'quận 1', 'phường Sài Gòn', 'Saigon Ward', 'Dist. 1',
      '호치민시 1군 Hồ Tùng Mậu 63', '호치민시 벤응에동 Hồ Tùng Mậu 63', 'Hồ Tùng Mậu 63, 사이공동', 'Bến Nghé동', '프엉 벤응에'],
    khong: ['Tầng 3, 63 Hồ Tùng Mậu, TP.HCM', 'Nhà hàng chuyên bò ở tầng 3, 63 Hồ Tùng Mậu, TP.HCM. Chọn bò tại quầy, cùng cả bàn nướng và thưởng thức.',
      'A beef specialty restaurant on Floor 3, 63 Hồ Tùng Mậu, Ho Chi Minh City.', 'We look forward to seeing you.', 'Send your CV to us.',
      '호치민시 Hồ Tùng Mậu 63, 3층에 있는 소고기 전문점이에요. 정육 코너에서 고기를 고르고 테이블에서 함께 구워 드세요.',
      'Beeftown이 호치민시 Hồ Tùng Mậu 63 매장의 오픈 팀을 모집해요: 소고기 정육사, 포장 및 정육 코너 보조 직원, 경력 주방 직원, 파트타임 홀 직원.',
      'Hồ Tùng Mậu 63으로 오세요', 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.', '세 군데', '함께 구워 드세요', '9명 이상 단체는 Beeftown에 직접 연락해 주세요.'] },
  { luat: CAU_THANG,
    bat: ['Khách lên tầng 3 bằng cầu thang bộ', 'by the stairs', '계단으로 올라오셔야 해요', 'không có thang máy cho khách', 'there is no guest lift', '손님용 엘리베이터는 없어요'],
    khong: ['Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.', 'Use our own entrance, right next to GS25, and take the lift to Floor 3.',
      'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.', 'Is there a lift?', '엘리베이터가 있나요?', 'Beeftown ở tầng 3 và có thang máy. Địa chỉ:'] },
  { luat: TOA_NHA,
    bat: ['Tới tòa nhà số', 'toà nhà', 'Come to the building', '건물로 오세요'],
    khong: ['We are building our opening team', 'Beeftown is building its opening team at 63 Hồ Tùng Mậu'] },
  { luat: CHUYEN_DIA_DIEM,
    bat: ['Beeftown có địa chỉ mới', 'Quán đã chuyển về 63 Hồ Tùng Mậu', 'Nhà hàng chuyển sang tầng 3', 'Trước đây quán ở Hàm Nghi', 'Beeftown đổi địa điểm',
      'Our new address', 'We have moved', 'Beeftown has moved to Floor 3', 'formerly at 11-21', 'We are relocating', '새 주소로 오세요', '매장을 이전했어요', '매장이 옮겼어요'],
    khong: ['Yêu cầu của bạn đã chuyển tới nhà hàng.', 'Bạn sẽ được chuyển sang Messenger', 'Nếu trước đây bạn từng hỏi bàn', 'information you previously gave us',
      'Nhà hàng kiểm tra rồi liên hệ để xác nhận với bạn.', 'Your request has been sent to the restaurant.', '이전에 문의하신 적이 있다면', 'We will check and contact you to confirm.',
      'Beeftown chuyển tới đơn vị cung cấp dịch vụ những thông tin cần thiết', 'If we moved your request to another day', 'We are moving your data to a new provider'] },
  { luat: TIEN_ICH_CHUA_XAC_NHAN,
    bat: ['Có chỗ gửi xe máy', 'bãi đỗ xe', 'Free parking', '주차 가능', 'lối cho xe lăn', 'wheelchair access', '휠체어'],
    khong: ['Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.', 'Xem trước đường lên tầng 3 để cả nhóm tìm tới dễ dàng.'] },
  { luat: SO_DO_DUONG_DI,
    bat: ['đi bộ 2 phút', 'Xem trước đường lên tầng 3, đi bộ 2 phút từ GS25.', 'cách 50 m', 'cách GS25 20 mét', 'chỉ 30 bước từ lối vào',
      'Thang máy lên tầng 3 mất 1 phút', '2 phút là tới quán', '3 minutes on foot', '50 m from GS25', 'a 2-minute walk', 'a 50-metre corridor',
      '도보 2분', '도보 2분이에요', '입구에서 50미터', '50미터'],
    khong: ['tầng 3 mở cửa', 'GS25 mở cửa', '3 món', 'giá mỗi 100g', 'Tầng 3, 63 Hồ Tùng Mậu', 'Ba bước tới bàn', 'Three steps to your table',
      'Nhóm từ 9 người trở lên', '9명 이상 단체', 'Floor 3 menu', '어른 2분께 안내해 드려요',
      'Nhà hàng giữ bàn 15 phút.', 'Chọn bò trong 3 bước', 'We hold your table for 15 minutes.', 'Order in 3 steps', '테이블은 15분 동안 잡아 드려요',
      'Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.', 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.'] },
];
