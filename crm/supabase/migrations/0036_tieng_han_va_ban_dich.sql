-- =============================================================================
-- BEEFTOWN CRM — 0036 · TIẾNG HÀN VÀ BẢN DỊCH TỰ ĐỘNG
-- =============================================================================
-- (Số 0029–0035 thuộc nhánh kho giai đoạn 4–5 đang mở cùng lúc — PR #9 — nên
-- file này là 0036. Trên project Supabase nó đã chạy với tên lịch sử
-- 0029_tieng_han_va_ban_dich, đặt trước khi thấy PR #9; nội dung y hệt file.
-- Không phụ thuộc gì vào 0029–0035, và khối chốt quyền cuối file có cùng danh
-- sách anon với chúng, nên chạy trước hay sau chúng đều ra cùng một kết quả.)
--
-- VẤN ĐỀ
--
-- Trang công khai có hai thứ tiếng, và bản tiếng Anh phải gõ tay vào ô riêng.
-- Hệ quả quen thuộc: sửa mô tả công việc bằng tiếng Việt xong, bản tiếng Anh
-- vẫn nói chuyện cũ — và không ai được báo. Thêm tiếng Hàn nữa thì cách gõ
-- tay ba lần cho mỗi câu không còn đứng được.
--
-- CÁCH LÀM
--
-- Tiếng Việt vẫn là bản gốc DUY NHẤT người ta soạn. Bản tiếng Anh và tiếng Hàn
-- do máy dịch mỗi khi câu gốc đổi (Gemini, gọi từ Worker của web — xem
-- web/src/lib/ban-dich.ts). File này lo phần database:
--
--   1. Cột _ko cạnh mỗi cột _en. Những cột trước đây chỉ có tiếng Việt mà vẫn
--      hiện lên trang — ca làm, cấp bậc, cảnh báo món, khẩu phần, chú thích
--      ảnh — có thêm cả _en lẫn _ko.
--   2. Sổ bản dịch: cột ban_dich (jsonb) trên từng dòng, ghi mỗi ô dịch được
--      dịch TỪ CÂU GỐC NÀO (băm md5), bằng máy hay bằng tay, kết quả ra sao.
--   3. Hàm công khai nhận thêm 'ko' và lùi ko → en → vi.
--   4. v_viec_dich: danh sách ô đang cần dịch, để web biết phải làm gì.
--   5. ghi_ban_dich(): đường ghi của máy dịch. Kiểm băm câu gốc NGAY TRONG câu
--      UPDATE, nên không bao giờ ghi bản dịch của một câu vừa bị sửa.
--
-- LUẬT CỦA MỘT Ô DỊCH
--
--   · Một bản dịch là bản dịch của MỘT câu tiếng Việt cụ thể. Câu gốc đổi thì
--     bản dịch hết hiệu lực — kể cả bản người ta sửa tay. Giữ bản tiếng Anh cũ
--     cạnh câu tiếng Việt mới chính là cái lỗi file này sinh ra để sửa.
--   · Sửa tay thắng máy, cho tới khi câu gốc đổi. Ai sửa ô tiếng Anh/Hàn —
--     bằng form nội bộ hay trong Supabase Studio — thì trigger ghi đó là bản
--     tay, và máy không đè lên.
--   · Bản dịch dính chữ cấm thì KHÔNG lên trang: ô để trống, trang lùi về
--     ngôn ngữ kế tiếp, sổ ghi 'bi_chan' kèm lý do để người thật xem.
--
-- VÌ SAO DỊCH Ở WORKER MÀ KHÔNG Ở DATABASE
--
--   · Khóa API nằm trong secret của Cloudflare. Đưa vào database là thêm một
--     chỗ giữ bí mật, cộng một extension http có quyền gọi ra Internet.
--   · Web không có khóa service_role (web/README.md). Máy dịch ghi bằng chính
--     phiên đăng nhập của người vừa bấm lưu, nên RLS vẫn là luật duy nhất: ai
--     không sửa được tin thì cũng không ghi được bản dịch của tin đó.
--
-- NỘI DUNG CÔNG BỐ LÀ NGOẠI LỆ
--
-- noi_dung_cong_bo chỉ ghi thêm (0010): dòng đã công bố là bất biến. Nên bản
-- dịch của một dữ kiện đi CÙNG phiên bản — web dịch trước rồi mới gọi
-- dat_noi_dung() với đủ ba thứ tiếng. Không có đường sửa bản dịch của một dòng
-- đang sống tại chỗ, và ghi_ban_dich() từ chối bảng này.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT MỚI
-- =============================================================================
alter table vi_tri_tuyen_dung
  add column ten_ko       text,
  add column mo_ta_ko     text,
  add column yeu_cau_ko   text,
  add column quyen_loi_ko text,
  -- Hai cột này hiện NGUYÊN VĂN trên trang tiếng Anh từ trước tới giờ: câu
  -- "Kiêm thao tác POS tại quầy" nằm giữa một trang toàn tiếng Anh.
  add column ca_lam_en    text,
  add column ca_lam_ko    text,
  add column cap_bac_en   text,
  add column cap_bac_ko   text,
  add column ban_dich     jsonb not null default '{}'::jsonb;

alter table nhom_mon
  add column ten_ko   text,
  add column mo_ta_ko text,
  add column ban_dich jsonb not null default '{}'::jsonb;

alter table mon_an
  add column ten_ko       text,
  add column mo_ta_ko     text,
  -- Cảnh báo món sống là câu khách nước ngoài CẦN đọc được nhất trên cả trang.
  add column canh_bao_en  text,
  add column canh_bao_ko  text,
  add column khau_phan_en text,
  add column khau_phan_ko text,
  add column ban_dich     jsonb not null default '{}'::jsonb;

alter table tep_anh
  add column alt_ko       text,
  -- Chú thích là lời khai nguồn ("ảnh minh họa") — bắt buộc với ảnh không
  -- phải anh_that (0009). Lời khai chỉ có tiếng Việt thì với khách đọc tiếng
  -- Anh hay tiếng Hàn là không khai.
  add column chu_thich_en text,
  add column chu_thich_ko text,
  add column ban_dich     jsonb not null default '{}'::jsonb;

alter table noi_dung_cong_bo
  add column gia_tri_text_ko text,
  add column ban_dich        jsonb not null default '{}'::jsonb;

comment on column vi_tri_tuyen_dung.ban_dich is
  'Sổ bản dịch: {"<ô>": {"en"|"ko": {bam, cach: may|tay, tt: ok|bi_chan|loi, ly_do, luc}}}. bam = bam_nguon(câu gốc lúc dịch). Trigger ghi_so_ban_dich() giữ sổ này đúng.';


-- =============================================================================
-- 2 · DANH SÁCH Ô DỊCH VÀ HÀM PHỤ
-- =============================================================================
-- Trigger, view và hàm ghi đều đọc CÙNG một danh sách. Thêm một ô dịch mới là
-- thêm đúng một dòng ở đây, và test-ban-dich.mjs kiểm mọi cột nó nhắc tới đều
-- có thật — gõ nhầm tên cột là test đỏ, không phải một ô lặng lẽ không dịch.
--
-- Quy ước tên: ô <cot> có câu gốc ở cột <nguon>, bản dịch ở <cot>_en, <cot>_ko.
-- -----------------------------------------------------------------------------
create or replace function cot_ban_dich()
returns table (bang text, cot text, nguon text)
language sql
immutable
as $$
  select * from (values
    ('vi_tri_tuyen_dung', 'ten',          'ten_vi'),
    ('vi_tri_tuyen_dung', 'mo_ta',        'mo_ta_vi'),
    ('vi_tri_tuyen_dung', 'yeu_cau',      'yeu_cau_vi'),
    ('vi_tri_tuyen_dung', 'quyen_loi',    'quyen_loi_vi'),
    ('vi_tri_tuyen_dung', 'ca_lam',       'ca_lam'),
    ('vi_tri_tuyen_dung', 'cap_bac',      'cap_bac'),
    ('nhom_mon',          'ten',          'ten_vi'),
    ('nhom_mon',          'mo_ta',        'mo_ta_vi'),
    ('mon_an',            'ten',          'ten_vi'),
    ('mon_an',            'mo_ta',        'mo_ta_vi'),
    ('mon_an',            'canh_bao',     'canh_bao'),
    ('mon_an',            'khau_phan',    'khau_phan'),
    ('tep_anh',           'alt',          'alt_vi'),
    ('tep_anh',           'chu_thich',    'chu_thich'),
    ('noi_dung_cong_bo',  'gia_tri_text', 'gia_tri_text')
  ) as d(bang, cot, nguon)
$$;

comment on function cot_ban_dich is
  'Danh sách đóng các ô được dịch. Câu gốc ở cột nguon, bản dịch ở <cot>_en và <cot>_ko.';

-- Chuẩn hóa trước khi so hay băm: bỏ \r và khoảng trắng hai đầu, chuỗi rỗng
-- thành null. Trình duyệt gửi xuống dòng trong textarea là \r\n, còn máy dịch
-- và SQL tay ghi \n. Không chuẩn hóa thì chỉ cần mở form rồi bấm Lưu — không
-- sửa chữ nào — là mọi bản dịch bị tính là "đã sửa tay" và câu gốc "đã đổi".
create or replace function chuan_ban_dich(t text)
returns text
language sql
immutable
as $$ select nullif(btrim(replace(coalesce(t, ''), E'\r', '')), '') $$;

create or replace function bam_nguon(t text)
returns text
language sql
immutable
as $$ select md5(coalesce(chuan_ban_dich(t), '')) $$;

comment on function bam_nguon is
  'Dấu vân tay của câu gốc: md5 sau khi chuẩn hóa. Bản dịch có bam khác bam_nguon(câu gốc hiện tại) là bản dịch của một câu cũ.';

-- Chọn chữ theo ngôn ngữ trang. Tiếng Hàn lùi về tiếng Anh trước rồi mới tới
-- tiếng Việt: khách Hàn ở Quận 1 đọc tiếng Anh dễ hơn nhiều so với tiếng Việt.
-- Ô rỗng tính là thiếu — bản cũ dùng coalesce nên một chuỗi '' lọt qua được và
-- trang tiếng Anh hiện một khoảng trống thay vì câu tiếng Việt.
create or replace function chon_ngon_ngu(p_ngon_ngu text, p_vi text, p_en text, p_ko text)
returns text
language sql
immutable
as $$
  select case
    when p_ngon_ngu = 'ko' and chuan_ban_dich(p_ko) is not null then p_ko
    when p_ngon_ngu in ('en', 'ko') and chuan_ban_dich(p_en) is not null then p_en
    else p_vi
  end
$$;


-- =============================================================================
-- 3 · KHỞI TẠO SỔ CHO BẢN DỊCH ĐANG CÓ
-- =============================================================================
-- Mọi bản tiếng Anh đang nằm trong database đều do người gõ tay, và gõ cho
-- câu tiếng Việt đang có. Ghi nhận đúng như vậy: bản tay, của câu gốc hiện
-- tại. Không có bước này thì máy sẽ coi chúng là "bản dịch không rõ nguồn" và
-- dịch đè — xóa mất công người ta đã gõ.
--
-- Chạy TRƯỚC khi thay trigger của noi_dung_cong_bo ở mục 4: bản 0016 chưa coi
-- ban_dich là giá trị bất biến, nên ghi sổ lên dòng đang sống lúc này là hợp lệ.
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in select * from cot_ban_dich() loop
    execute format($f$
      update %1$I
         set ban_dich = jsonb_set(
               ban_dich, array[%2$L],
               coalesce(ban_dich -> %2$L, '{}'::jsonb)
                 || jsonb_build_object('en', jsonb_build_object(
                      'bam', bam_nguon(%3$I), 'cach', 'tay', 'tt', 'ok', 'luc', now())))
       where chuan_ban_dich(%4$I) is not null
         and not la_van_ban_tam(%3$I)
    $f$, r.bang, r.cot, r.nguon, r.cot || '_en');
  end loop;
end
$$;


-- =============================================================================
-- 4 · NỘI DUNG CÔNG BỐ — ô tiếng Hàn theo cùng luật với ô tiếng Anh
-- =============================================================================
alter table noi_dung_cong_bo drop constraint cong_bo_dung_kieu;

alter table noi_dung_cong_bo add constraint cong_bo_dung_kieu check (
  case kieu
    when 'ngay' then gia_tri_ngay is not null
                 and gia_tri_text is null and gia_tri_text_en is null
                 and gia_tri_text_ko is null
                 and gia_tri_so is null and gia_tri_bool is null
                 and gia_tri_tep_id is null
    when 'bool' then gia_tri_bool is not null
                 and gia_tri_text is null and gia_tri_text_en is null
                 and gia_tri_text_ko is null
                 and gia_tri_ngay is null and gia_tri_so is null
                 and gia_tri_tep_id is null
    when 'so'   then gia_tri_so is not null
                 and gia_tri_text is null and gia_tri_text_en is null
                 and gia_tri_text_ko is null
                 and gia_tri_ngay is null and gia_tri_bool is null
                 and gia_tri_tep_id is null
    when 'tep'  then gia_tri_tep_id is not null
                 and gia_tri_text is null and gia_tri_text_en is null
                 and gia_tri_text_ko is null
                 and gia_tri_ngay is null and gia_tri_so is null
                 and gia_tri_bool is null
    when 'url'  then gia_tri_text ~ '^https://[^ ]+$'
                 and gia_tri_text_en is null and gia_tri_text_ko is null
                 and gia_tri_ngay is null and gia_tri_so is null
                 and gia_tri_bool is null and gia_tri_tep_id is null
    when 'sdt'  then sdt_hop_le(chuan_hoa_sdt(gia_tri_text))
                 and gia_tri_text_en is null and gia_tri_text_ko is null
                 and gia_tri_ngay is null and gia_tri_so is null
                 and gia_tri_bool is null and gia_tri_tep_id is null
    when 'van_ban' then not la_van_ban_tam(gia_tri_text)
                 and (gia_tri_text_en is null or not la_van_ban_tam(gia_tri_text_en))
                 and (gia_tri_text_ko is null or not la_van_ban_tam(gia_tri_text_ko))
                 and gia_tri_ngay is null and gia_tri_so is null
                 and gia_tri_bool is null and gia_tri_tep_id is null
  end);

-- Chép nguyên văn bản 0016, chỉ thêm hai dòng vào danh sách bất biến:
-- gia_tri_text_ko (lý do y hệt gia_tri_text_en) và ban_dich — sổ ghi bản dịch
-- của phiên bản nào thuộc về phiên bản đó, sửa sau khi công bố là viết lại
-- lịch sử.
create or replace function noi_dung_cong_bo_kiem_tra()
returns trigger
language plpgsql
as $$
declare
  v_khoa khoa_cong_bo;
begin
  select * into v_khoa from khoa_cong_bo where khoa = new.khoa;

  if tg_op = 'INSERT' then
    if new.trang_thai <> 'nhap' and co_phien_dang_nhap() then
      raise exception 'Dòng mới phải bắt đầu ở trạng thái nhap'
        using errcode = 'check_violation';
    end if;
    if new.trang_thai = 'da_cong_bo' then
      new.cong_bo_luc := coalesce(new.cong_bo_luc, now());
    end if;
    return new;
  end if;

  if old.trang_thai = 'da_cong_bo' then
    if new.khoa <> old.khoa
       or new.kieu <> old.kieu
       or new.gia_tri_text    is distinct from old.gia_tri_text
       or new.gia_tri_text_en is distinct from old.gia_tri_text_en
       or new.gia_tri_text_ko is distinct from old.gia_tri_text_ko
       or new.gia_tri_ngay    is distinct from old.gia_tri_ngay
       or new.gia_tri_so      is distinct from old.gia_tri_so
       or new.gia_tri_bool    is distinct from old.gia_tri_bool
       or new.gia_tri_tep_id  is distinct from old.gia_tri_tep_id
       or new.ban_dich        is distinct from old.ban_dich then
      raise exception 'Không sửa được giá trị đã công bố. Hãy thu hồi rồi thêm dòng mới.'
        using errcode = 'restrict_violation';
    end if;
  end if;

  if new.trang_thai <> old.trang_thai then
    if not (
         (old.trang_thai = 'nhap'       and new.trang_thai = 'da_duyet')
      or (old.trang_thai = 'da_duyet'   and new.trang_thai = 'da_cong_bo')
      or (old.trang_thai = 'da_duyet'   and new.trang_thai = 'nhap')
      or (old.trang_thai = 'da_cong_bo' and new.trang_thai = 'da_thu_hoi')
    ) then
      raise exception 'Không chuyển được trạng thái từ % sang %', old.trang_thai, new.trang_thai
        using errcode = 'check_violation';
    end if;

    if new.trang_thai = 'da_cong_bo' then
      if co_phien_dang_nhap() then
        if v_khoa.chi_chu_so_huu then
          if not la_chu_so_huu() then
            raise exception 'Khóa % chỉ chủ sở hữu mới được công bố', new.khoa
              using errcode = 'insufficient_privilege';
          end if;
        elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
          raise exception 'Không có quyền công bố nội dung'
            using errcode = 'insufficient_privilege';
        end if;
      end if;
      new.cong_bo_luc := coalesce(new.cong_bo_luc, now());
    end if;

    if new.trang_thai = 'da_duyet' then
      new.duyet_luc := coalesce(new.duyet_luc, now());
    end if;

    if new.trang_thai = 'da_thu_hoi' then
      -- MỤC 2 CỦA 0016. Gỡ một dữ kiện khỏi trang là hành vi có hệ quả ra bên
      -- ngoài y như đưa nó lên, nên nó qua cùng một cửa. Không có khối này thì
      -- marketing tắt được form đặt bàn và gỡ được hotline.
      if co_phien_dang_nhap() then
        if v_khoa.chi_chu_so_huu then
          if not la_chu_so_huu() then
            raise exception 'Khóa % chỉ chủ sở hữu mới được gỡ khỏi trang', new.khoa
              using errcode = 'insufficient_privilege';
          end if;
        elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
          raise exception 'Không có quyền gỡ nội dung khỏi trang'
            using errcode = 'insufficient_privilege';
        end if;
      end if;
      new.thu_hoi_luc := coalesce(new.thu_hoi_luc, now());
    end if;
  end if;

  return new;
end;
$$;


-- =============================================================================
-- 5 · TRIGGER GIỮ SỔ BẢN DỊCH
-- =============================================================================
-- Sổ phải đúng BẤT KỂ người ta sửa bằng đường nào: form nội bộ, Supabase
-- Studio, hay một câu SQL tay. Nên luật nằm ở trigger, không nằm ở web.
--
--   · Ô dịch đổi mà KHÔNG phải do máy dịch ghi → đó là bản tay, của câu gốc
--     hiện tại. Máy dịch bật cờ beeftown.ghi_ban_dich trong giao dịch của nó
--     (ghi_ban_dich, dat_noi_dung) để trigger không nhầm nó với người.
--   · Ô dịch có chữ mà chưa có sổ → bản tay. Ô dịch trống mà sổ nói 'ok' →
--     xóa sổ, để v_viec_dich thấy ô đó cần dịch lại.
--   · Câu gốc bị xóa hẳn → bản dịch đi theo. Không có nhánh này thì xóa cấp
--     bậc bằng tiếng Việt xong, trang tiếng Hàn vẫn hiện cấp bậc cũ.
--   · Câu gốc đổi mà ô dịch giữ nguyên → KHÔNG làm gì. Sổ vẫn mang băm của câu
--     cũ, và chính sự lệch băm đó là tín hiệu "cần dịch lại" cho v_viec_dich.
--
-- Tên trigger bắt đầu bằng "so_" để chạy SAU noi_dung_cong_bo_kiem_tra_trigger
-- (Postgres chạy trigger BEFORE theo thứ tự tên): luật bất biến phải xét đúng
-- thứ người gọi định sửa, trước khi trigger này điền phần còn thiếu của sổ.
--
-- Cờ beeftown.ghi_ban_dich ai cũng bật được. Không sao: người bật nó vẫn phải
-- qua RLS để sửa được dòng, và người đã sửa được dòng thì vốn đã ghi được bất
-- kỳ chữ nào vào ô dịch. Cờ chỉ quyết định sổ ghi "máy" hay "tay".
-- -----------------------------------------------------------------------------
create or replace function ghi_so_ban_dich()
returns trigger
language plpgsql
as $$
declare
  r        record;
  l        text;
  v_moi    jsonb := to_jsonb(new);
  v_cu     jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  v_may    boolean := coalesce(current_setting('beeftown.ghi_ban_dich', true), '') = 'on';
  v_so_cot jsonb;
  v_so     jsonb;
  v_ban    text;
  v_xoa    jsonb := '{}'::jsonb;
begin
  new.ban_dich := coalesce(new.ban_dich, '{}'::jsonb);

  for r in select c.cot, c.nguon from cot_ban_dich() c where c.bang = tg_table_name loop
    if tg_op = 'UPDATE'
       and chuan_ban_dich(v_cu ->> r.nguon) is not null
       and chuan_ban_dich(v_moi ->> r.nguon) is null then
      v_xoa := v_xoa || jsonb_build_object(r.cot || '_en', null, r.cot || '_ko', null);
      new.ban_dich := new.ban_dich - r.cot;
      continue;
    end if;

    v_so_cot := coalesce(new.ban_dich -> r.cot, '{}'::jsonb);

    foreach l in array array['en', 'ko'] loop
      v_ban := chuan_ban_dich(v_moi ->> (r.cot || '_' || l));
      v_so  := v_so_cot -> l;

      if tg_op = 'UPDATE' and not v_may
         and v_ban is distinct from chuan_ban_dich(v_cu ->> (r.cot || '_' || l)) then
        v_so := case when v_ban is null then null
                     else jsonb_build_object('cach', 'tay', 'tt', 'ok') end;
      end if;

      if v_ban is not null and v_so is null then
        v_so := jsonb_build_object('cach', 'tay', 'tt', 'ok');
      elsif v_ban is null and v_so ->> 'tt' = 'ok' then
        v_so := null;
      end if;

      if v_so is null then
        v_so_cot := v_so_cot - l;
      else
        if v_so ->> 'bam' is null then
          v_so := v_so || jsonb_build_object('bam', bam_nguon(v_moi ->> r.nguon));
        end if;
        if v_so ->> 'luc' is null then
          v_so := v_so || jsonb_build_object('luc', now());
        end if;
        v_so_cot := v_so_cot || jsonb_build_object(l, v_so);
      end if;
    end loop;

    if v_so_cot = '{}'::jsonb then
      new.ban_dich := new.ban_dich - r.cot;
    else
      new.ban_dich := jsonb_set(new.ban_dich, array[r.cot], v_so_cot);
    end if;
  end loop;

  if v_xoa <> '{}'::jsonb then
    new := jsonb_populate_record(new, v_xoa);
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- MÁY DỊCH KHÔNG TÍNH LÀ "SỬA TIN"
-- -----------------------------------------------------------------------------
-- Màn soạn tin chống hai người cùng sửa bằng updated_at (ô phien_ban). Bản
-- dịch chạy nền vài giây SAU khi bấm Lưu; nếu nó đẩy updated_at lên thì lần
-- bấm Lưu kế tiếp của chính người đó bị báo "tin vừa được người khác sửa" —
-- trong khi chẳng ai sửa gì. Nên dưới cờ beeftown.ghi_ban_dich, updated_at
-- đứng yên. Ngoài cờ đó hàm chạy y như bản 0001 cho mọi bảng đang dùng nó.
--
-- Mặt còn lại của cùng vấn đề nằm ở web: form soạn chỉ ghi ô dịch nào người
-- dùng THẬT SỰ sửa (lib/tin-tuyen-dung.ts), nên chữ cũ còn nằm trong form
-- không đè lên bản dịch vừa về.
-- -----------------------------------------------------------------------------
create or replace function tu_dong_cap_nhat_updated_at()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('beeftown.ghi_ban_dich', true), '') = 'on' then
    return new;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger so_ban_dich_trigger
  before insert or update on vi_tri_tuyen_dung
  for each row execute function ghi_so_ban_dich();
create trigger so_ban_dich_trigger
  before insert or update on nhom_mon
  for each row execute function ghi_so_ban_dich();
create trigger so_ban_dich_trigger
  before insert or update on mon_an
  for each row execute function ghi_so_ban_dich();
create trigger so_ban_dich_trigger
  before insert or update on tep_anh
  for each row execute function ghi_so_ban_dich();
create trigger so_ban_dich_trigger
  before insert or update on noi_dung_cong_bo
  for each row execute function ghi_so_ban_dich();


-- =============================================================================
-- 6 · HÀM CÔNG KHAI — nhận 'ko', lùi ko → en → vi
-- =============================================================================
-- Chữ ký và danh sách cột trả về giữ NGUYÊN, nên create or replace giữ luôn
-- quyền EXECUTE của anon. Thân hàm chép từ bản mới nhất (0010, 0011, 0028),
-- chỉ đổi phần chọn ngôn ngữ.
-- -----------------------------------------------------------------------------
create or replace function noi_dung_cong_khai(p_ngon_ngu text default 'vi')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(k.khoa, v.gia_tri), '{}'::jsonb)
  from khoa_cong_bo k
  left join lateral (
    select case n.kieu
             when 'ngay' then to_jsonb(n.gia_tri_ngay)
             when 'bool' then to_jsonb(n.gia_tri_bool)
             when 'so'   then to_jsonb(n.gia_tri_so)
             when 'tep'  then jsonb_build_object(
                                'url',       t.duong_dan,
                                'bucket',    t.bucket,
                                'alt',       chon_ngon_ngu(p_ngon_ngu, t.alt_vi, t.alt_en, t.alt_ko),
                                'chu_thich', chon_ngon_ngu(p_ngon_ngu, t.chu_thich,
                                                           t.chu_thich_en, t.chu_thich_ko),
                                'nguon',     t.nguon_that,
                                'rong',      t.rong,
                                'cao',       t.cao)
             when 'van_ban' then to_jsonb(chon_ngon_ngu(p_ngon_ngu, n.gia_tri_text,
                                                         n.gia_tri_text_en, n.gia_tri_text_ko))
             else to_jsonb(n.gia_tri_text)
           end as gia_tri
    from noi_dung_cong_bo n
    left join tep_anh t on t.id = n.gia_tri_tep_id
    where n.khoa = k.khoa
      and n.trang_thai = 'da_cong_bo'
      and now() >= coalesce(n.hien_tu,  '-infinity'::timestamptz)
      and now() <  coalesce(n.hien_den, 'infinity'::timestamptz)
    limit 1
  ) v on true;
$$;

create or replace function thuc_don_cong_khai(p_ngon_ngu text default 'vi')
returns table (
  nhom_ma     text,
  nhom_ten    text,
  nhom_loai   loai_nhom_mon,
  xem_gia_tai_quay boolean,
  mon_ma      text,
  ten         text,
  mo_ta       text,
  gia         bigint,
  muc_cay     smallint,
  co_con      boolean,
  la_mon_song boolean,
  canh_bao    text,
  khau_phan   text,
  phien_ban   text,
  cap_nhat_ngay date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.ma,
    chon_ngon_ngu(p_ngon_ngu, g.ten_vi, g.ten_en, g.ten_ko),
    g.loai,
    g.khong_niem_yet_gia,
    m.ma,
    chon_ngon_ngu(p_ngon_ngu, m.ten_vi, m.ten_en, m.ten_ko),
    chon_ngon_ngu(p_ngon_ngu, m.mo_ta_vi, m.mo_ta_en, m.mo_ta_ko),
    -- Thắt đai an toàn chồng lên CHECK: giá chưa duyệt thì trả về null, kể cả
    -- khi bằng cách nào đó một dòng sai lọt qua được ràng buộc.
    case when m.gia_da_duyet then m.gia end,
    case when m.muc_cay_da_duyet then m.muc_cay end,
    m.co_con,
    m.la_mon_song,
    chon_ngon_ngu(p_ngon_ngu, m.canh_bao, m.canh_bao_en, m.canh_bao_ko),
    chon_ngon_ngu(p_ngon_ngu, m.khau_phan, m.khau_phan_en, m.khau_phan_ko),
    pb.ma,
    pb.ngay_hieu_luc
  from nhom_mon g
  join mon_an m on m.nhom_mon_id = g.id
  left join phien_ban_thuc_don pb on pb.dang_dung
  where cong_tac_bat('hien_thuc_don')
    and g.dang_dung
    and m.trang_thai = 'da_cong_bo'
    -- Luật quảng cáo rượu bia có giới hạn riêng. Công tắc tắt thì ẩn đồ uống
    -- có cồn khỏi trang công khai, KHÔNG xóa dữ liệu.
    and (not m.co_con or cong_tac_bat('hien_do_uong_co_con'))
  order by g.thu_tu, m.thu_tu;
$$;

create or replace function tin_tuyen_dung_cong_khai(p_ngon_ngu text default 'vi')
returns table (
  ma            text,
  ten           text,
  bo_phan       bo_phan_tuyen,
  cap_bac       text,
  loai_hop_dong loai_hop_dong,
  so_luong      smallint,
  mo_ta         text,
  yeu_cau       text,
  quyen_loi     text,
  ca_lam        text,
  luong_tu      bigint,
  luong_den     bigint,
  luong_don_vi  don_vi_luong,
  han_nop       date,
  hoi_email       boolean,
  hoi_nam_sinh    boolean,
  hoi_ca_lam      boolean,
  hoi_gioi_thieu  boolean,
  hoi_kinh_nghiem boolean,
  hoi_cv          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.ma,
    chon_ngon_ngu(p_ngon_ngu, v.ten_vi, v.ten_en, v.ten_ko),
    v.bo_phan,
    chon_ngon_ngu(p_ngon_ngu, v.cap_bac, v.cap_bac_en, v.cap_bac_ko),
    v.loai_hop_dong,
    v.so_luong,
    chon_ngon_ngu(p_ngon_ngu, v.mo_ta_vi, v.mo_ta_en, v.mo_ta_ko),
    chon_ngon_ngu(p_ngon_ngu, v.yeu_cau_vi, v.yeu_cau_en, v.yeu_cau_ko),
    chon_ngon_ngu(p_ngon_ngu, v.quyen_loi_vi, v.quyen_loi_en, v.quyen_loi_ko),
    chon_ngon_ngu(p_ngon_ngu, v.ca_lam, v.ca_lam_en, v.ca_lam_ko),
    -- Ràng buộc bảng đã đảm bảo hai cột này chỉ có giá trị khi đã duyệt.
    v.luong_tu,
    v.luong_den,
    -- Đơn vị thì không có ràng buộc đó (cột not null), nên tự che ở đây.
    case when v.luong_da_duyet then v.luong_don_vi end,
    v.han_nop,
    v.hoi_email,
    v.hoi_nam_sinh,
    v.hoi_ca_lam,
    v.hoi_gioi_thieu,
    v.hoi_kinh_nghiem,
    v.hoi_cv
  from vi_tri_tuyen_dung v
  where cong_tac_bat('hien_tuyen_dung')
    and v.trang_thai = 'da_cong_bo'
    and (v.han_nop is null or v.han_nop >= hom_nay_vn())
  order by v.bo_phan, v.ten_vi;
$$;


-- =============================================================================
-- 7 · ĐẶT NỘI DUNG — nhận thêm bản tiếng Hàn và sổ bản dịch
-- =============================================================================
-- Tham số mới đứng CUỐI nên lời gọi cũ theo vị trí vẫn đúng. Bản 9 tham số
-- phải bỏ hẳn: để hai phiên bản song song thì một lời gọi không có p_text_ko
-- khớp cả hai, và PostgREST báo "không chọn được hàm" ngay trên màn công tắc.
--
-- Vẫn là security invoker, vẫn một giao dịch — mọi lý do ở đầu 0015 còn nguyên.
-- -----------------------------------------------------------------------------
drop function if exists dat_noi_dung(text, text, text, date, bigint, boolean, uuid, text, boolean);

create function dat_noi_dung(
  p_khoa     text,
  p_text     text    default null,
  p_text_en  text    default null,
  p_ngay     date    default null,
  p_so       bigint  default null,
  p_bool     boolean default null,
  p_tep_id   uuid    default null,
  p_ly_do    text    default null,
  p_cong_bo  boolean default false,  -- false = chỉ lưu nháp; true = đưa lên trang
  p_text_ko  text    default null,
  -- Sổ bản dịch do web lập: ô nào máy dịch, ô nào bị bộ lọc chặn và vì sao.
  -- null = người gọi không phải máy dịch → trigger coi ô có chữ là bản tay.
  p_ban_dich jsonb   default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_khoa khoa_cong_bo;
  v_toi  nhan_su;
  v_id   uuid;
begin
  select * into v_khoa from khoa_cong_bo where khoa = p_khoa;
  if not found then
    -- Sổ đăng ký là danh sách đóng. Gõ sai tên khóa phải là lỗi ngay bây giờ,
    -- không phải một ô trống im lặng trên trang chủ ba tuần sau.
    raise exception 'Không có khóa công bố tên %', p_khoa
      using errcode = 'foreign_key_violation';
  end if;

  v_toi := nhan_su_hien_tai();

  if p_ban_dich is not null then
    -- Web đã tự lập sổ. Bật cờ để ghi_so_ban_dich() tin sổ đó, thay vì đoán
    -- "ô có chữ là bản tay". Cờ chỉ sống tới hết giao dịch này.
    perform set_config('beeftown.ghi_ban_dich', 'on', true);
  end if;

  -- Thu hồi bản đang sống TRƯỚC, vì chỉ số cong_bo_dang_song_idx chỉ cho
  -- phép một bản da_cong_bo cho mỗi khóa. Nằm trong cùng giao dịch nên nếu
  -- bước công bố bên dưới hỏng, câu này cũng bị cuốn ngược lại.
  if p_cong_bo then
    update noi_dung_cong_bo
       set trang_thai = 'da_thu_hoi',
           ly_do = coalesce(ly_do, 'Thay bằng bản mới')
     where khoa = p_khoa and trang_thai = 'da_cong_bo';
  end if;

  insert into noi_dung_cong_bo (
    khoa, kieu,
    gia_tri_text, gia_tri_text_en, gia_tri_text_ko,
    gia_tri_ngay, gia_tri_so, gia_tri_bool, gia_tri_tep_id,
    ban_dich, trang_thai, ly_do, nguoi_tao)
  values (
    p_khoa, v_khoa.kieu,
    case when v_khoa.kieu in ('van_ban','url','sdt') then p_text end,
    case when v_khoa.kieu = 'van_ban' then nullif(btrim(p_text_en), '') end,
    case when v_khoa.kieu = 'van_ban' then nullif(btrim(p_text_ko), '') end,
    case when v_khoa.kieu = 'ngay' then p_ngay end,
    case when v_khoa.kieu = 'so'   then p_so   end,
    case when v_khoa.kieu = 'bool' then p_bool end,
    case when v_khoa.kieu = 'tep'  then p_tep_id end,
    case when v_khoa.kieu = 'van_ban' then coalesce(p_ban_dich, '{}'::jsonb)
         else '{}'::jsonb end,
    'nhap', nullif(btrim(p_ly_do), ''), v_toi.id)
  returning id into v_id;

  if p_cong_bo then
    -- Hai bước rời nhau vì trigger chỉ cho đi từng nấc một. Ai không đủ
    -- quyền sẽ dừng đúng ở đây, và cả giao dịch bị hủy.
    update noi_dung_cong_bo
       set trang_thai = 'da_duyet', nguoi_duyet = v_toi.id
     where id = v_id;
    update noi_dung_cong_bo
       set trang_thai = 'da_cong_bo'
     where id = v_id;
  end if;

  return v_id;
end;
$$;

comment on function dat_noi_dung is
  'Đặt giá trị cho một khóa công bố trong MỘT giao dịch: thu hồi bản cũ, thêm bản mới, duyệt, công bố. Bản dịch đi cùng phiên bản. Chạy dưới quyền người gọi — RLS và trigger của 0010 vẫn là luật duy nhất.';

-- Thêm cột vào CUỐI view (create or replace view chỉ cho thêm ở cuối).
-- security_invoker khai lại tường minh — xem giải thích ở 0015 mục 3.
create or replace view v_bang_cong_tac as
select
  k.khoa,
  k.kieu,
  k.nhom,
  k.mo_ta,
  k.bat_buoc,
  k.chi_chu_so_huu,
  k.thu_tu,
  n.id              as ban_id,
  n.gia_tri_text,
  n.gia_tri_text_en,
  n.gia_tri_ngay,
  n.gia_tri_so,
  n.gia_tri_bool,
  n.gia_tri_tep_id,
  n.cong_bo_luc,
  n.ly_do,
  (n.id is not null) as dang_song,
  n.gia_tri_text_ko,
  n.ban_dich
from khoa_cong_bo k
left join noi_dung_cong_bo n
       on n.khoa = k.khoa and n.trang_thai = 'da_cong_bo';

alter view v_bang_cong_tac set (security_invoker = true);


-- =============================================================================
-- 8 · VIỆC CẦN DỊCH
-- =============================================================================
-- Một dòng = một ô, một thứ tiếng, đang thiếu hoặc đang lỗi thời. Web đọc
-- view này sau mỗi lần lưu (lọc theo đúng dòng vừa lưu) và khi có người mở
-- trang nội bộ (dịch bù những chỗ sửa thẳng trong Studio).
--
-- ly_do: 'thieu'  — chưa từng có bản dịch
--        'cu'     — có bản dịch nhưng của một câu gốc khác
--        'thu_lai'— lần trước máy dịch lỗi, đã quá thời gian chờ
--
-- KHÔNG liệt kê:
--   · câu gốc rỗng hoặc còn [ngoặc vuông] — ghi chú biên tập, không phải chữ
--     cho khách, dịch ra chỉ tốn tiền và lộ ghi chú ra ba thứ tiếng;
--   · ô bị bộ lọc chặn với ĐÚNG câu gốc hiện tại — dịch lại cũng ra chừng đó,
--     phải chờ người sửa câu gốc hoặc gõ tay;
--   · ô vừa lỗi trong 15 phút — mất mạng hay hết hạn mức thì mỗi lần mở trang
--     nội bộ không nên đốt thêm một lượt gọi hỏng.
--
-- Nội dung công bố CÓ trong view (để màn nội bộ đếm được "còn thiếu bản dịch")
-- nhưng web không dịch bù nó tự động: bản dịch của nó đi cùng phiên bản, nên
-- chỉ dịch khi người ta lưu lại dữ kiện đó (xem đầu file).
--
-- security_invoker: view đi qua RLS của từng bảng, nên mỗi người chỉ thấy việc
-- của những dòng mình vốn đọc được.
-- -----------------------------------------------------------------------------
create view v_viec_dich with (security_invoker = true) as
with dong as (
  select 'vi_tri_tuyen_dung'::text as bang, v.id, to_jsonb(v) as d
  from vi_tri_tuyen_dung v
  where v.trang_thai <> 'da_thu_hoi'
  union all
  select 'nhom_mon', g.id, to_jsonb(g)
  from nhom_mon g
  where g.dang_dung
  union all
  select 'mon_an', m.id, to_jsonb(m)
  from mon_an m
  where m.trang_thai <> 'da_thu_hoi'
  union all
  select 'tep_anh', t.id, to_jsonb(t)
  from tep_anh t
  where t.trang_thai <> 'da_thu_hoi'
  union all
  select 'noi_dung_cong_bo', n.id, to_jsonb(n)
  from noi_dung_cong_bo n
  where n.trang_thai = 'da_cong_bo' and n.kieu = 'van_ban'
),
o as (
  select dong.bang,
         dong.id as dong_id,
         c.cot,
         l.ngon_ngu,
         dong.d ->> c.nguon as nguon,
         bam_nguon(dong.d ->> c.nguon) as bam,
         chuan_ban_dich(dong.d ->> (c.cot || '_' || l.ngon_ngu)) as ban,
         dong.d -> 'ban_dich' -> c.cot -> l.ngon_ngu as so
  from dong
  join cot_ban_dich() c on c.bang = dong.bang
  cross join (values ('en'), ('ko')) as l(ngon_ngu)
)
select
  bang,
  dong_id,
  cot,
  ngon_ngu,
  nguon,
  bam,
  case
    when so ->> 'tt' = 'loi' and so ->> 'bam' = bam then 'thu_lai'
    when ban is null and (so is null or so ->> 'bam' = bam) then 'thieu'
    else 'cu'
  end as ly_do
from o
-- coalesce(..., false) ở hai vế sau là BẮT BUỘC: ô chưa có sổ thì so ->> 'bam'
-- là null, "null = bam" là null, và "not null" cũng là null — WHERE coi null
-- là sai, nên thiếu coalesce thì chính những ô CHƯA TỪNG DỊCH biến mất khỏi
-- view. Đúng loại ô cần dịch nhất (test-ban-dich.mjs bắt được, đã thử gỡ).
-- Vế đầu tự an toàn nhờ "ban is not null" — ô trống kéo cả vế thành false —
-- nhưng vẫn bọc coalesce để người sửa sau không phải nhớ chi tiết đó.
where not la_van_ban_tam(nguon)
  and not coalesce(so ->> 'bam' = bam and so ->> 'tt' = 'ok' and ban is not null, false)
  and not coalesce(so ->> 'bam' = bam and so ->> 'tt' = 'bi_chan', false)
  and not coalesce(so ->> 'bam' = bam and so ->> 'tt' = 'loi'
                   and (so ->> 'luc')::timestamptz > now() - interval '15 minutes', false);

comment on view v_viec_dich is
  'Các ô đang cần máy dịch: thiếu, lỗi thời so với câu gốc, hoặc lỗi lần trước đã quá 15 phút.';


-- =============================================================================
-- 9 · GHI BẢN DỊCH CỦA MÁY
-- =============================================================================
-- p_muc là mảng các ô:
--   [{ "cot": "mo_ta", "ngon_ngu": "ko", "bam": "<bam câu gốc đã đem dịch>",
--      "tt": "ok" | "bi_chan" | "loi", "noi_dung": "...", "ly_do": "..." }]
--
-- ĐIỀU QUAN TRỌNG NHẤT: điều kiện bam_nguon(câu gốc) = bam nằm TRONG câu
-- UPDATE. Gọi máy dịch mất vài giây; nếu trong vài giây đó người ta sửa câu
-- gốc thì bản dịch vừa về là bản dịch của câu cũ. Kiểm trước rồi mới ghi là
-- để hở đúng khe đó — ở đây ô ấy đơn giản là không được ghi (hàm trả về ít
-- hơn số ô gửi lên), và lần dịch sau sẽ dịch câu mới.
--
-- Ô không 'ok' thì bản dịch bị XÓA chứ không giữ bản cũ: đã tới lúc dịch
-- nghĩa là bản cũ (nếu có) thuộc về một câu gốc khác.
--
-- security invoker: RLS của bảng quyết định ai ghi được, y như khi họ sửa tin.
-- Tên bảng kiểm theo danh sách đóng, tên cột lấy từ cot_ban_dich(), nên
-- format(%I) ở đây không nhận chuỗi nào do người gọi tự đặt.
-- -----------------------------------------------------------------------------
create or replace function ghi_ban_dich(p_bang text, p_dong_id uuid, p_muc jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_muc   jsonb;
  v_nguon text;
  v_tt    text;
  v_ban   text;
  v_so    jsonb;
  v_dem   integer;
  v_tong  integer := 0;
begin
  if p_bang not in ('vi_tri_tuyen_dung', 'nhom_mon', 'mon_an', 'tep_anh') then
    -- noi_dung_cong_bo cố ý vắng mặt: bản dịch của nó đi cùng phiên bản,
    -- qua dat_noi_dung(). Xem đầu file.
    raise exception 'Bảng % không nhận bản dịch qua hàm này', p_bang
      using errcode = 'invalid_parameter_value';
  end if;
  if jsonb_typeof(p_muc) is distinct from 'array' then
    raise exception 'p_muc phải là một mảng' using errcode = 'invalid_parameter_value';
  end if;

  perform set_config('beeftown.ghi_ban_dich', 'on', true);

  for v_muc in select * from jsonb_array_elements(p_muc) loop
    select c.nguon into v_nguon
    from cot_ban_dich() c
    where c.bang = p_bang and c.cot = v_muc ->> 'cot';
    if v_nguon is null then
      raise exception 'Ô % không nằm trong danh sách dịch của bảng %', v_muc ->> 'cot', p_bang
        using errcode = 'invalid_parameter_value';
    end if;
    if (v_muc ->> 'ngon_ngu') is null or (v_muc ->> 'ngon_ngu') not in ('en', 'ko') then
      raise exception 'Ngôn ngữ dịch phải là en hoặc ko' using errcode = 'invalid_parameter_value';
    end if;
    if (v_muc ->> 'bam') is null then
      raise exception 'Thiếu bam của câu gốc' using errcode = 'invalid_parameter_value';
    end if;

    v_tt := coalesce(v_muc ->> 'tt', 'ok');
    if v_tt not in ('ok', 'bi_chan', 'loi') then
      raise exception 'Trạng thái bản dịch không hợp lệ: %', v_tt
        using errcode = 'invalid_parameter_value';
    end if;

    v_ban := case when v_tt = 'ok' then chuan_ban_dich(v_muc ->> 'noi_dung') end;
    if v_tt = 'ok' and v_ban is null then
      -- Máy trả về chuỗi rỗng là máy hỏng, không phải một bản dịch.
      v_tt := 'loi';
    end if;

    v_so := jsonb_strip_nulls(jsonb_build_object(
      'bam',   v_muc ->> 'bam',
      'cach',  'may',
      'tt',    v_tt,
      'ly_do', case when v_tt = 'loi' and v_ban is null and (v_muc ->> 'ly_do') is null
                    then 'Máy dịch trả về chuỗi rỗng'
                    else left(v_muc ->> 'ly_do', 500) end,
      'luc',   now()));

    execute format($f$
      update %1$I
         set %2$I = $1,
             ban_dich = jsonb_set(ban_dich, array[$2],
                          coalesce(ban_dich -> $2, '{}'::jsonb) || jsonb_build_object($3, $4))
       where id = $5
         and bam_nguon(%3$I) = $6
    $f$, p_bang, (v_muc ->> 'cot') || '_' || (v_muc ->> 'ngon_ngu'), v_nguon)
    using v_ban, v_muc ->> 'cot', v_muc ->> 'ngon_ngu', v_so, p_dong_id, v_muc ->> 'bam';

    get diagnostics v_dem = row_count;
    v_tong := v_tong + v_dem;
  end loop;

  return v_tong;
end;
$$;

comment on function ghi_ban_dich is
  'Đường ghi của máy dịch cho các bảng sửa được tại chỗ. Chỉ ghi khi câu gốc vẫn đúng là câu đã đem dịch. Trả về số ô đã ghi.';


-- =============================================================================
-- CHỐT QUYỀN — chép từ 0028, KHÔNG từ file cũ hơn 0025 (xem đầu 0025)
-- =============================================================================
-- Hàm mới của file này — cot_ban_dich, chuan_ban_dich, bam_nguon,
-- chon_ngon_ngu, ghi_so_ban_dich, ghi_ban_dich, dat_noi_dung bản mới — đều
-- KHÔNG có mặt trong danh sách anon. chon_ngon_ngu chạy bên trong các hàm
-- công khai security definer, tức dưới quyền chủ hàm, nên anon không cần
-- EXECUTE trên nó.
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';

    -- Đặt bàn
    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ma(text,date) to anon';
    execute 'grant execute on function chi_nhanh_cong_khai() to anon';
    execute 'grant execute on function tra_cuu_dat_ban(text,text,inet) to anon';
    execute 'grant execute on function ghi_nhat_ky_tra_cuu(inet,text,boolean) to anon';
    execute 'grant execute on function huy_dat_ban(text,text,text,inet) to anon';

    -- Nội dung
    execute 'grant execute on function noi_dung_cong_khai(text) to anon';
    execute 'grant execute on function thuc_don_cong_khai(text) to anon';

    -- Tuyển dụng
    execute 'grant execute on function tin_tuyen_dung_cong_khai(text) to anon';
    execute 'grant execute on function xin_phieu_tai_cv(inet) to anon';
    execute 'grant execute on function nop_ho_so_ung_tuyen(text,text,text,text,smallint,text,text,text[],uuid,text,boolean,text,int,text,text,inet) to anon';
    -- Không phải để website gọi: policy tải CV trên storage.objects gọi nó
    -- dưới vai anon. Xem 0025.
    execute 'grant execute on function ve_con_hieu_luc(text) to anon';

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';
  end if;
end
$$;
