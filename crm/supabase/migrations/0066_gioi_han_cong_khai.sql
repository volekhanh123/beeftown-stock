-- =============================================================================
-- BEEFTOWN CRM — 0066 · GIỚI HẠN TẦN SUẤT CỦA CÁC HÀM CÔNG KHAI
-- =============================================================================
-- Khoá anon là CÔNG KHAI theo thiết kế: trang nào cũng mang nó, ai cũng gọi
-- thẳng PostgREST được với tham số tự chọn — kể cả p_ip. Nên mọi giới hạn phải
-- nằm trong database. Rà soát nợ kỹ thuật 11/10/2026 tái hiện được trên PGlite:
--
--   · tao_dat_ban (0062) không giới hạn gì: lời gọi anon với số điện thoại mới
--     mỗi lần chiếm hết bàn một khung giờ — khách thật nhận "đã hết bàn" — và
--     mỗi lời gọi đổ một dòng rác vào khach_hang.
--   · xin_phieu_tai_cv (0012) và nop_ho_so_ung_tuyen (0026) chỉ đếm khi p_ip
--     khác null: bỏ p_ip là không giới hạn. Một vé tải CV cho tải bao nhiêu file
--     cũng được trong 15 phút (ve_con_hieu_luc chỉ hỏi "vé còn hạn, chưa dùng")
--     → đầy Storage.
--   · tra_cuu_dat_ban (0013) chỉ khoá khi có IP, mà nơi gọi duy nhất
--     (web/src/lib/messenger-anon.ts) luôn truyền null → khoá là mã chết. Khoá
--     lại đếm dòng do NGƯỜI GỌI tự ghi qua ghi_nhat_ky_tra_cuu — kẻ dò mã không
--     ghi là không bao giờ bị đếm. huy_dat_ban không khoá.
--   · ghi_nhat_ky_tra_cuu chèn một dòng mỗi lần gọi, không giới hạn — còn ghi
--     được dòng "sai" giả để khoá tra cứu của IP người khác. ghi_su_kien_web
--     khoá theo p_phien do người gọi tự chọn: đổi p_phien (hay bỏ trống) mỗi lần
--     là không giới hạn.
--
-- GIỚI HẠN TỪ BẢN NÀY
--
--   Hàm                    Xô đếm                          Trần   Cửa sổ   Khi chạm
--   ---------------------  ------------------------------  -----  -------  ----------------
--   tao_dat_ban            số điện thoại: yêu cầu còn      3      —        câu SĐT (mới)
--   (chỉ lời gọi KHÔNG       chờ, ngày từ hôm nay (VN)
--   phiên — website,       IP (p_ip khác null)              5      1 giờ    câu mạng (mới)
--   Messenger)             chi nhánh                        30     1 giờ    câu bận (mới)
--   tra_cuu_mot_dat_ban    IP (p_ip khác null): lần sai     6      15 phút  câu khoá 0013
--   + huy_dat_ban          số điện thoại: lần sai           5      15 phút  câu khoá 0013
--   (chung một sổ)         toàn cục: mọi lần                100    15 phút  câu khoá 0013
--   xin_phieu_tai_cv       IP — null đếm như MỘT IP         10     1 giờ    câu 0012 / câu bận
--                          toàn cục                         30     1 giờ    câu bận
--                          toàn cục                         100    24 giờ   câu bận
--   vé tải CV              một vé                           1 file hạn vé  storage từ chối
--   nop_ho_so_ung_tuyen    IP — null đếm như MỘT IP         5      1 giờ    câu 0012 / câu bận
--                          toàn cục                         30     1 giờ    câu bận
--                          số điện thoại: một vị trí một ngày — chỉ mục ho_so_khong_trung_idx (0012)
--   ghi_su_kien_web        phiên — null đếm như MỘT phiên   60     1 phút   bỏ qua, không lỗi
--                          toàn cục                         300    1 phút   bỏ qua
--                          toàn cục                         3000   1 giờ    bỏ qua
--
-- Ba câu mới (web dịch ở web/src/lib/chu.ts cho trang en / ko, ở
-- web/src/lib/cau-noi-bo.ts cho nội bộ):
--   câu SĐT  'Số điện thoại này đã có nhiều yêu cầu đặt bàn đang chờ nhà hàng
--             xác nhận, vui lòng gọi nhà hàng'
--   câu mạng 'Mạng bạn đang dùng đã gửi quá nhiều yêu cầu đặt bàn, vui lòng thử
--             lại sau hoặc gọi nhà hàng'
--   câu bận  'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc
--             liên hệ trực tiếp với nhà hàng'
-- Trần toàn cục và xô IP null dùng câu bận, không dùng "Bạn đã gửi…": người chạm
-- trần có thể là một khách thật chưa gửi lần nào. Câu raise exception cũ giữ
-- nguyên từng chữ. Thêm một câu chỉ storage thấy (trigger mục 4): 'Vé tải CV
-- này đã có một file'.
--
-- VÌ SAO NHIỀU LỚP — VÀ VÌ SAO IP NULL KHÔNG PHẢI MỘT XÔ Ở ĐẶT BÀN, TRA CỨU
--
-- Giới hạn theo IP chỉ là lớp MỎNG: website truyền CF-Connecting-IP (Cloudflare
-- tự đặt, khách không giả được — web/src/lib/phien.ts), nhưng kẻ gọi thẳng
-- PostgREST tự bịa p_ip mỗi lần. Lớp chặn thật là số điện thoại, chi nhánh và
-- toàn cục — chúng không đọc p_ip: kẻ đổi cả IP lẫn số điện thoại vẫn chỉ lấy
-- được tới trần chi nhánh (30 yêu cầu / giờ) — có hạn, không còn vô hạn.
--
-- IP null: ở vé tải CV, hồ sơ, sự kiện web thì null đếm như MỘT IP — website
-- luôn có IP, không ai thật gọi bằng null. Ở tao_dat_ban, tra_cuu_dat_ban,
-- huy_dat_ban thì KHÔNG có xô IP null: nơi gọi thật duy nhất với null là bot
-- Messenger (đã giới hạn theo từng khách ở mess_xin_dat_ban / mess_ghi_tra_cuu,
-- 0053). Một xô chung cho null chỉ cho kẻ phá một công tắc tắt bot của MỌI khách
-- bằng 20 lời gọi, trong khi chính kẻ đó thoát xô bằng cách bịa IP. Lời gọi
-- null vẫn bị đếm đủ theo số điện thoại, chi nhánh, toàn cục.
--
-- Trần chung là con dao hai lưỡi: ai cố tình đốt hết trần thì khách thật cũng
-- nhận câu bận / câu khoá cho tới hết cửa sổ; ai biết số điện thoại của một
-- khách thì khoá được tra cứu của khách đó 15 phút một lần. Câu đó nói đúng sự
-- thật và chỉ đường gọi nhà hàng; khung giờ không bị lấp vô hạn, bảng không
-- đầy, mã đặt bàn không dò được. Chặn hẳn kẻ gọi thẳng cần thứ database không
-- tự làm được (Cloudflare Turnstile trên form, hay giữ chỗ riêng cho yêu cầu
-- đã xác nhận) — để Khánh quyết, ghi trong PR.
--
-- CHỈ ĐẾM LƯỢT ĐƯỢC NHẬN
--
-- Lượt lấy ở gioi_han_lay_luot() ghi cùng giao dịch với việc chính: việc chính
-- ném lỗi (hết bàn, sai số, form đóng…) là dòng sổ hủy theo. Gửi lại Y HỆT (0062)
-- trả mã cũ TRƯỚC bước giới hạn — yêu cầu đó đã được ghi, chặn nó là nói sai.
-- Phiên đăng nhập (quản lý, thu ngân ghi hộ khách gọi điện) đi đường cũ, không
-- đếm: quy tắc 0045 trong tim_hoac_tao_khach() đã chặn vai khác.
--
-- HAI LƯỢT CÙNG LÚC
--
-- Đếm rồi ghi mà không khoá thì 50 lượt song song cùng đếm thấy 0 và cùng lọt.
-- Mỗi câu đếm đứng SAU một khoá: tao_dat_ban có khoá dòng chi_nhanh (0062) và
-- khoá theo số điện thoại; các hàm còn lại dùng pg_advisory_xact_lock — tự nhả
-- khi giao dịch kết thúc. Ở READ COMMITTED câu đếm sau khoá chụp ảnh mới, thấy
-- dòng lượt trước vừa commit. Thứ tự lấy khoá cố định (chi nhánh → số điện thoại
-- → xô IP → xô chi nhánh) nên không có vòng chờ. Hàm có bảng riêng (vé, hồ sơ,
-- nhật ký tra cứu, sự kiện web) đếm thẳng trên bảng đó, MỘT lần quét theo
-- created_at cho mọi xô (count … filter); chỉ tao_dat_ban cần sổ riêng (mục 1).
-- Vé tải CV: storage-api kiểm policy trong một savepoint rồi hủy — khoá ở đó
-- nhả trước khi dòng commit — nên chặn song song nằm ở trigger (mục 4).
--
-- GIỜ: mọi cửa sổ là now() - interval — một khoảng thời gian, không phải ngày,
-- nên không phụ thuộc múi giờ phiên. "Ngày từ hôm nay" của số điện thoại dùng
-- hom_nay_vn().
--
-- KHÔNG ĐỔI chữ ký, tham số mặc định, cột trả về của hàm công khai nào.
-- tra_cuu_dat_ban đổi STABLE → VOLATILE để tự ghi nhật ký (PostgREST chạy hàm
-- STABLE trong giao dịch chỉ đọc), và anon / authenticated thôi gọi nó: hàm trả
-- bảng cho người gọi tự hủy giao dịch của lần sai (mục 3). Anon tra cứu qua hàm
-- MỚI tra_cuu_mot_dat_ban (trả jsonb) — web đổi tên lời gọi, giữ cách đọc.
-- ghi_nhat_ky_tra_cuu ở lại nhưng thu quyền của anon và authenticated:
-- tra_cuu_dat_ban / huy_dat_ban tự ghi.
--
-- Kiểm thử: crm/test/test-cong-khai-gioi-han.mjs.
-- =============================================================================


-- =============================================================================
-- 1 · SỔ GIỚI HẠN — lượt đã nhận của những việc không có bảng riêng để đếm
-- =============================================================================
-- Hiện chỉ tao_dat_ban dùng: dat_ban không lưu IP (và không nên lưu mãi — 0013
-- chỉ giữ IP ở nơi là bằng chứng đồng ý), cũng không phân biệt dòng do khách web
-- hay nhân viên tạo. Các hàm khác đếm thẳng trên bảng của chúng (phieu_tai_len,
-- ho_so_ung_tuyen, nhat_ky_tra_cuu, su_kien_web), như 0012 / 0013 vẫn làm.
--
-- khoa: 'ip:<địa chỉ>', 'cn:<id chi nhánh>'.
-- Dòng quá 1 ngày tự dọn dần ở mỗi lượt lấy (cửa sổ dài nhất là 1 giờ).
-- RLS bật, không policy, thu mọi quyền: không ai đọc / ghi thẳng.
create table gioi_han_luot (
  id         bigint generated always as identity primary key,
  viec       text not null,
  khoa       text not null,
  created_at timestamptz not null default now()
);

create index gioi_han_luot_khoa_idx on gioi_han_luot (viec, khoa, created_at desc);
create index gioi_han_luot_tao_idx  on gioi_han_luot (created_at);

alter table gioi_han_luot enable row level security;
revoke all on gioi_han_luot from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on gioi_han_luot from anon, authenticated';
  end if;
end
$$;

comment on table gioi_han_luot is
  'Lượt đã nhận của các hàm công khai không có bảng riêng để đếm (0066). Chỉ gioi_han_lay_luot() ghi. Không ai đọc / ghi thẳng.';


-- -----------------------------------------------------------------------------
-- Lấy một lượt trong xô (p_viec, p_khoa): còn dưới p_toi_da lượt trong p_cua_so
-- thì ghi một lượt và trả true; hết thì false, không ghi gì.
--
-- KHÔNG security definer: chỉ hàm definer của database gọi nó (chạy dưới quyền
-- chủ bảng); anon / authenticated bị thu quyền gọi ở cuối file.
-- -----------------------------------------------------------------------------
create or replace function gioi_han_lay_luot(
  p_viec    text,
  p_khoa    text,
  p_toi_da  integer,
  p_cua_so  interval
)
returns boolean
language plpgsql
volatile
set search_path = public
as $$
declare
  v_dem integer;
begin
  -- Hai lượt cùng xô xếp hàng ở đây; lượt sau đếm SAU khi lượt trước commit.
  perform pg_advisory_xact_lock(hashtext('gioi_han_luot:' || p_viec || ':' || p_khoa));

  select count(*) into v_dem
  from gioi_han_luot
  where viec = p_viec and khoa = p_khoa and created_at > now() - p_cua_so;

  if v_dem >= p_toi_da then
    return false;
  end if;

  insert into gioi_han_luot (viec, khoa) values (p_viec, p_khoa);

  -- Dọn dần, mỗi lượt tối đa 50 dòng cũ. skip locked: hai lượt dọn cùng lúc
  -- không chờ nhau (và không thể khoá chéo nhau).
  delete from gioi_han_luot
  where id in (select g.id from gioi_han_luot g
               where g.created_at < now() - interval '1 day'
               order by g.created_at
               limit 50
               for update skip locked);

  return true;
end;
$$;

comment on function gioi_han_lay_luot(text, text, integer, interval) is
  'NỘI BỘ (0066): lấy một lượt trong xô (việc, khoá) nếu còn dưới p_toi_da lượt trong p_cua_so — true và ghi một dòng; hết lượt thì false. Khoá advisory theo xô trước khi đếm.';


-- =============================================================================
-- 2 · TẠO ĐẶT BÀN — giới hạn lời gọi không phiên
-- =============================================================================
-- Chép nguyên văn 0062, chỉ thêm khối 0066 ngay trước bước tạo khách.
-- =============================================================================
create or replace function tao_dat_ban(
  p_chi_nhanh_ma text,
  p_sdt          text,
  p_ho_ten       text,
  p_ngay         date,
  p_gio          time,
  p_so_khach     smallint,
  p_dip          text default null,
  p_ghi_chu      text default null,
  p_dong_y       boolean default false,
  p_utm_source   text default null,
  p_utm_medium   text default null,
  p_utm_campaign text default null,
  p_trang_gioi_thieu text default null,
  p_ip           inet default null
)
returns table (
  dat_ban_id uuid,
  ma_dat_ban text,
  con_trong  integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cn     chi_nhanh;
  v_khach  khach_hang;
  v_trong  integer;
  v_dat    dat_ban;
  v_sdt    text;
  v_dem    integer;
begin
  if not cong_tac_bat('form_dat_ban_dang_mo') then
    raise exception 'Form đặt bàn đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  select * into v_cn from chi_nhanh
  where lower(ma) = lower(p_chi_nhanh_ma) and dang_hoat_dong;
  if not found then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_ma
      using errcode = 'foreign_key_violation';
  end if;

  -- 0062: dời lên từ sau bước kiểm ngày giờ — hai lượt gửi chồng nhau xếp hàng
  -- ở đây, lượt sau thấy dòng lượt trước vừa ghi.
  perform 1 from chi_nhanh where id = v_cn.id for update;

  -- ---- 0062 · Gửi lại y hệt trong 10 phút → trả lại dòng cũ ---------------
  if not co_phien_dang_nhap() then
    select d.* into v_dat
    from dat_ban d
    join khach_hang k on k.id = d.khach_hang_id
    where d.chi_nhanh_id = v_cn.id
      and d.ngay = p_ngay
      and d.gio = p_gio
      and d.trang_thai = 'cho_xac_nhan'
      and d.created_at > now() - interval '10 minutes'
      and k.sdt = chuan_hoa_sdt(p_sdt)
      and d.so_khach = p_so_khach
      and d.dip is not distinct from p_dip
      and d.ghi_chu is not distinct from p_ghi_chu
      and d.dong_y_nhan_tin = p_dong_y
    order by d.created_at desc
    limit 1;

    if found then
      return query
      select v_dat.id, v_dat.ma_dat_ban,
             so_ban_con_trong(v_cn.id, p_ngay, p_gio);
      return;
    end if;
  end if;
  -- ---- Hết phần 0062 — từ đây là nguyên văn 0013 --------------------------

  if p_ngay < hom_nay_vn() then
    raise exception 'Không thể đặt bàn cho ngày trong quá khứ'
      using errcode = 'check_violation';
  end if;

  if p_ngay = hom_nay_vn() and p_gio <= gio_vn() then
    raise exception 'Khung giờ % hôm nay đã qua', p_gio
      using errcode = 'check_violation';
  end if;

  v_trong := so_ban_con_trong(v_cn.id, p_ngay, p_gio);
  if v_trong <= 0 then
    raise exception 'Khung giờ % ngày % đã hết bàn', p_gio, p_ngay
      using errcode = 'check_violation';
  end if;

  -- ---- 0066 · Giới hạn tần suất cho lời gọi không phiên ---------------------
  -- Đứng sau mọi bước kiểm: yêu cầu sai (ngày qua, hết bàn) nhận đúng câu của
  -- nó và không tốn lượt. Lượt lấy ở đây hủy theo nếu bước sau ném lỗi.
  if not co_phien_dang_nhap() then
    v_sdt := chuan_hoa_sdt(p_sdt);

    -- Theo số điện thoại: yêu cầu còn chờ xác nhận, từ hôm nay trở đi. Khoá
    -- theo số trước khi đếm — hai lượt cùng số ở hai chi nhánh không cùng lọt.
    if v_sdt is not null then
      perform pg_advisory_xact_lock(hashtext('dat_ban_sdt:' || v_sdt));
      select count(*) into v_dem
      from dat_ban d
      join khach_hang k on k.id = d.khach_hang_id
      where k.sdt = v_sdt
        and d.trang_thai = 'cho_xac_nhan'
        and d.ngay >= hom_nay_vn();
      if v_dem >= 3 then
        raise exception 'Số điện thoại này đã có nhiều yêu cầu đặt bàn đang chờ nhà hàng xác nhận, vui lòng gọi nhà hàng'
          using errcode = 'check_violation';
      end if;
    end if;

    -- Theo IP. p_ip do người gọi truyền — lớp mỏng. Null (bot Messenger) không
    -- có xô riêng: xem đầu file.
    if p_ip is not null
       and not gioi_han_lay_luot('tao_dat_ban', 'ip:' || host(p_ip), 5, interval '1 hour') then
      raise exception 'Mạng bạn đang dùng đã gửi quá nhiều yêu cầu đặt bàn, vui lòng thử lại sau hoặc gọi nhà hàng'
        using errcode = 'check_violation';
    end if;

    -- Theo chi nhánh: lớp kẻ gọi thẳng không lách được.
    if not gioi_han_lay_luot('tao_dat_ban', 'cn:' || v_cn.id::text, 30, interval '1 hour') then
      raise exception 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng'
        using errcode = 'check_violation';
    end if;
  end if;
  -- ---- Hết phần 0066 -----------------------------------------------------------

  v_khach := tim_hoac_tao_khach(p_sdt, p_ho_ten, v_cn.id,
                                p_utm_source, p_utm_medium, p_utm_campaign);

  insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach,
                       dip, ghi_chu, dong_y_nhan_tin, ma_dat_ban,
                       utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (v_cn.id, v_khach.id, p_ngay, p_gio, p_so_khach,
          p_dip, p_ghi_chu, p_dong_y, sinh_ma_dat_ban(),
          p_utm_source, p_utm_medium, p_utm_campaign, p_trang_gioi_thieu)
  returning * into v_dat;

  if p_dong_y then
    insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung, ip)
    values (v_khach.id, true, 'web',
            'Tôi đồng ý để Beeftown liên hệ xác nhận đặt bàn và gửi thông tin ưu đãi qua số điện thoại này. Có thể huỷ nhận tin bất cứ lúc nào.',
            p_ip);
  end if;

  return query
  select v_dat.id, v_dat.ma_dat_ban,
         so_ban_con_trong(v_cn.id, p_ngay, p_gio);
end;
$$;

comment on function tao_dat_ban is
  'API công khai cho website và Messenger. SECURITY DEFINER. Kiểm tra chỗ trống nguyên tử và chặn khung giờ đã qua theo giờ Việt Nam. Từ 0062: lời gọi không phiên gửi lại Y HỆT trong 10 phút nhận lại đúng dòng cũ. Từ 0066: lời gọi không phiên bị giới hạn — 3 yêu cầu còn chờ mỗi số điện thoại, 5 / giờ mỗi IP (p_ip khác null), 30 / giờ mỗi chi nhánh.';


-- =============================================================================
-- 3 · TRA CỨU VÀ HỦY ĐẶT BÀN — một sổ, một khoá, hàm tự ghi
-- =============================================================================
-- nhat_ky_tra_cuu thêm sdt_bam: md5 của số điện thoại đã chuẩn hóa, để đếm lần
-- sai theo số mà bảng không hiện số thô cho người đọc lướt. KHÔNG phải ẩn danh —
-- 10 chữ số dò ngược được; bảng chỉ chủ sở hữu đọc (0013). Từ bản này mọi lần
-- tra đều ghi, nên dòng quá 90 ngày tự dọn dần (như su_kien_web, 0013) — đủ dài
-- để làm bằng chứng nếu có ai dò mã, không giữ IP và số điện thoại mãi.
alter table nhat_ky_tra_cuu add column sdt_bam text;

create index nhat_ky_tra_cuu_tao_idx on nhat_ky_tra_cuu (created_at);

comment on column nhat_ky_tra_cuu.sdt_bam is
  'md5 của số điện thoại đã chuẩn hóa người tra gõ (0066) — để khoá dò mã theo số. Không phải ẩn danh. Dòng quá 90 ngày tự dọn.';


-- -----------------------------------------------------------------------------
-- Khoá tra cứu: ném 'Tra cứu bị tạm khoá…' (câu 0013) khi một trong ba xô đã
-- đầy trong 15 phút. Chỉ đếm — tra_cuu_dat_ban / huy_dat_ban ghi dòng sau đó
-- (ghi_lan_tra_cuu). Một lần quét: trần toàn cục giữ cửa sổ ≤ 100 dòng.
-- Khoá advisory chung cho mọi lượt tra và hủy: lượt cùng lúc đếm lần lượt.
-- KHÔNG security definer: chỉ hai hàm definer trên gọi nó.
-- -----------------------------------------------------------------------------
create or replace function kiem_khoa_tra_cuu(p_ip inet, p_sdt_bam text)
returns void
language plpgsql
volatile
set search_path = public
as $$
declare
  v_sai_ip  integer;
  v_sai_sdt integer;
  v_tat_ca  integer;
begin
  perform pg_advisory_xact_lock(hashtext('nhat_ky_tra_cuu'));

  select count(*) filter (where p_ip is not null and ip = p_ip and not thanh_cong),
         count(*) filter (where p_sdt_bam is not null and sdt_bam = p_sdt_bam and not thanh_cong),
         count(*)
    into v_sai_ip, v_sai_sdt, v_tat_ca
  from nhat_ky_tra_cuu
  where created_at > now() - interval '15 minutes';

  -- IP: 6 lần sai như 0013 (null — bot Messenger — không có xô riêng: đầu file).
  -- Số điện thoại: dò mã của MỘT khách từ nhiều IP. Toàn cục, mọi lần (đúng
  -- cả): đổi IP lẫn số mỗi lần cũng không dò được mã, không làm đầy bảng.
  if v_sai_ip >= 6 or v_sai_sdt >= 5 or v_tat_ca >= 100 then
    raise exception 'Tra cứu bị tạm khoá, vui lòng gọi nhà hàng'
      using errcode = 'check_violation';
  end if;
end;
$$;

comment on function kiem_khoa_tra_cuu(inet, text) is
  'NỘI BỘ (0066): khoá tra cứu / hủy đặt bàn — 15 phút: 6 lần sai mỗi IP (p_ip khác null), 5 lần sai mỗi số điện thoại, 100 lần mọi người. Ném câu khoá của 0013.';


-- Ghi một lần tra / hủy và dọn dần dòng quá 90 ngày (tối đa 50 dòng mỗi lần,
-- skip locked như gioi_han_lay_luot). KHÔNG security definer: chỉ tra_cuu_dat_ban
-- và huy_dat_ban gọi.
create or replace function ghi_lan_tra_cuu(p_ip inet, p_ma text, p_thanh_cong boolean, p_sdt_bam text)
returns void
language plpgsql
volatile
set search_path = public
as $$
begin
  insert into nhat_ky_tra_cuu (ip, ma_thu, thanh_cong, sdt_bam)
  values (p_ip, left(coalesce(p_ma, ''), 12), coalesce(p_thanh_cong, false), p_sdt_bam);

  delete from nhat_ky_tra_cuu
  where id in (select n.id from nhat_ky_tra_cuu n
               where n.created_at < now() - interval '90 days'
               order by n.created_at
               limit 50
               for update skip locked);
end;
$$;

comment on function ghi_lan_tra_cuu(inet, text, boolean, text) is
  'NỘI BỘ (0066): ghi một dòng nhat_ky_tra_cuu (kèm sdt_bam) và dọn dần dòng quá 90 ngày. Chỉ tra_cuu_dat_ban / huy_dat_ban gọi.';


-- Chép 0013; VOLATILE (tự ghi nhật ký), kiểm khoá cho cả IP null, ghi một dòng
-- mỗi lần gọi. Kết quả trả về y như cũ.
create or replace function tra_cuu_dat_ban(
  p_ma  text,
  p_sdt text,
  p_ip  inet default null
)
returns table (
  ma_dat_ban    text,
  chi_nhanh_ten text,
  ngay          date,
  gio           time,
  so_khach      smallint,
  trang_thai    trang_thai_dat_ban,
  ho_ten_che    text,
  sdt_che       text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_sdt  text;
  v_bam  text;
  v_thay boolean;
begin
  v_sdt := chuan_hoa_sdt(p_sdt);
  v_bam := case when v_sdt is null then null else md5(v_sdt) end;

  perform kiem_khoa_tra_cuu(p_ip, v_bam);

  return query
  select
    d.ma_dat_ban,
    c.ten,
    d.ngay,
    d.gio,
    d.so_khach,
    d.trang_thai,
    -- "Nguyễn Văn An" → "Nguyễn V. A"
    regexp_replace(k.ho_ten, '(\S+)\s+(\S)\S*\s+(\S)\S*$', '\1 \2. \3'),
    -- "0912345678" → "09****5678"
    substr(k.sdt, 1, 2) || repeat('*', greatest(length(k.sdt) - 6, 0))
      || substr(k.sdt, length(k.sdt) - 3)
  from dat_ban d
  join chi_nhanh c  on c.id = d.chi_nhanh_id
  join khach_hang k on k.id = d.khach_hang_id
  where upper(d.ma_dat_ban) = upper(btrim(p_ma))
    and k.sdt = v_sdt
    and d.ngay >= hom_nay_vn() - 1;
  v_thay := found;

  -- 0066: tự ghi — không còn trông vào người gọi gọi thêm ghi_nhat_ky_tra_cuu.
  perform ghi_lan_tra_cuu(p_ip, p_ma, v_thay, v_bam);
end;
$$;


-- -----------------------------------------------------------------------------
-- tra_cuu_mot_dat_ban — cửa tra cứu cho anon, trả MỘT giá trị jsonb
-- -----------------------------------------------------------------------------
-- tra_cuu_dat_ban trả BẢNG, và với hàm trả bảng PostgREST cho người gọi tự hủy
-- giao dịch của chính lần gọi: gửi Accept: application/vnd.pgrst.object+json
-- (supabase-js .single()) — 0 dòng thì PostgREST trả 406 VÀ rollback; thêm bộ lọc
-- trên cột kết quả (?trang_thai=not.is.null) để lần sai nào cũng ra 0 dòng. Dòng
-- "lần sai" ghi_lan_tra_cuu vừa ghi hủy theo — khoá ở trên không bao giờ đếm,
-- dò mã vẫn không giới hạn (rà soát bảo mật của bản này, 12/10/2026).
--
-- Hàm trả một giá trị (không phải bảng) thì PostgREST không lọc được kết quả và
-- luôn có đúng một dòng: không có 406, lần sai được ghi. Nên anon gọi hàm này;
-- tra_cuu_dat_ban (giữ chữ ký cũ — không đổi chữ ký hàm công khai) thu quyền anon
-- ở khối CHỐT QUYỀN, authenticated ở mục 7. Thân chỉ gọi tra_cuu_dat_ban: một
-- luật khoá, một chỗ ghi.
-- Trả: null khi không thấy; thấy thì đối tượng cùng các cột tra_cuu_dat_ban
-- (ma_dat_ban, chi_nhanh_ten, ngay, gio, so_khach, trang_thai, ho_ten_che,
-- sdt_che) — đúng hình dạng web đang đọc (DongTraCuu, web/src/lib/messenger.ts).
-- -----------------------------------------------------------------------------
create or replace function tra_cuu_mot_dat_ban(
  p_ma  text,
  p_sdt text,
  p_ip  inet default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_dong jsonb;
begin
  -- ma_dat_ban duy nhất (dat_ban_ma_idx, 0013): nhiều nhất một dòng.
  select to_jsonb(t) into v_dong
  from tra_cuu_dat_ban(p_ma, p_sdt, p_ip) t
  limit 1;
  return v_dong;
end;
$$;

comment on function tra_cuu_mot_dat_ban(text, text, inet) is
  'API công khai (0066): tra cứu đặt bàn theo mã + số điện thoại, trả jsonb (null khi không thấy). Trả một giá trị để PostgREST không hủy được giao dịch của lần sai (406 vnd.pgrst.object+json) — khoá dò mã luôn đếm. Thay tra_cuu_dat_ban cho anon.';


-- Chép 0013; kiểm khoá trước khi tìm, ghi nhật ký kèm sdt_bam.
create or replace function huy_dat_ban(
  p_ma    text,
  p_sdt   text,
  p_ly_do text default null,
  p_ip    inet default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dat dat_ban;
  v_sdt text;
  v_bam text;
begin
  v_sdt := chuan_hoa_sdt(p_sdt);
  v_bam := case when v_sdt is null then null else md5(v_sdt) end;

  -- 0066: hủy là một đường tra mã — cùng khoá, cùng sổ với tra_cuu_dat_ban.
  perform kiem_khoa_tra_cuu(p_ip, v_bam);

  select d.* into v_dat
  from dat_ban d
  join khach_hang k on k.id = d.khach_hang_id
  where upper(d.ma_dat_ban) = upper(btrim(p_ma))
    and k.sdt = v_sdt
    and d.ngay >= hom_nay_vn()
  for update;

  if not found then
    perform ghi_lan_tra_cuu(p_ip, p_ma, false, v_bam);
    return false;
  end if;

  if v_dat.trang_thai in ('da_den', 'khong_den', 'da_huy') then
    raise exception 'Đặt bàn này không huỷ được nữa, vui lòng gọi nhà hàng'
      using errcode = 'check_violation';
  end if;

  update dat_ban
  set trang_thai = 'da_huy',
      ghi_chu = coalesce(ghi_chu || ' · ', '') || 'Khách tự huỷ'
                || coalesce(': ' || p_ly_do, '')
  where id = v_dat.id;

  perform ghi_lan_tra_cuu(p_ip, p_ma, true, v_bam);
  return true;
end;
$$;

comment on function ghi_nhat_ky_tra_cuu(inet, text, boolean) is
  'Từ 0066 không ai bên ngoài gọi được (thu quyền anon, authenticated): tra_cuu_dat_ban và huy_dat_ban tự ghi nhật ký. Giữ lại để bản web cũ gọi nhận lỗi quyền — đã bọc try/catch — thay vì lỗi không có hàm.';


-- =============================================================================
-- 4 · VÉ TẢI CV
-- =============================================================================
create index phieu_tai_len_tao_idx on phieu_tai_len (created_at);

-- Chép 0012; khoá trước khi đếm, IP null đếm như một IP, thêm trần toàn cục.
create or replace function xin_phieu_tai_cv(p_ip inet default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cua_ip int;
  v_gio    int;
  v_ngay   int;
  v_id     uuid;
begin
  if not cong_tac_bat('hien_tuyen_dung') then
    raise exception 'Cổng tuyển dụng đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  -- Vé là quyền ghi vào kho file. Không phát vô tội vạ.
  -- 0066: khoá trước khi đếm; IP null đếm như MỘT IP; trần toàn cục giờ và
  -- ngày (đổi p_ip mỗi lần không lách được). Mỗi vé tối đa 5 MB (file_size_limit
  -- 0014), một file (mục dưới): 100 vé / ngày là ≤ 500 MB / ngày trong kho.
  perform pg_advisory_xact_lock(hashtext('phieu_tai_len'));

  select count(*) filter (where ip is not distinct from p_ip and created_at > now() - interval '1 hour'),
         count(*) filter (where created_at > now() - interval '1 hour'),
         count(*)
    into v_cua_ip, v_gio, v_ngay
  from phieu_tai_len
  where created_at > now() - interval '24 hours';

  if v_cua_ip >= 10 and p_ip is not null then
    raise exception 'Bạn đã thử tải lên quá nhiều lần, vui lòng chờ ít phút'
      using errcode = 'check_violation';
  end if;
  if v_cua_ip >= 10 or v_gio >= 30 or v_ngay >= 100 then
    raise exception 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng'
      using errcode = 'check_violation';
  end if;

  insert into phieu_tai_len (ip) values (p_ip) returning id into v_id;
  return v_id;
end;
$$;


-- -----------------------------------------------------------------------------
-- MỘT VÉ = MỘT FILE. Policy tải CV (0016) gọi ve_con_hieu_luc() dưới vai anon
-- cho từng file. Bản 0016 chỉ hỏi "vé còn hạn, chưa dùng" — vé chỉ thành "đã
-- dùng" lúc nộp hồ sơ, nên trong 15 phút một vé tải bao nhiêu file cũng được
-- (đã thử trên Supabase dựng cục bộ, crm/README.md "Nhật ký kiểm tay kho file").
--
-- Hai chốt, vì storage-api (src/storage/uploader.ts, đọc 12/10/2026) kiểm
-- policy HAI lần:
--   1. ve_con_hieu_luc — lần kiểm trước khi nhận file (testPermission): thư
--      mục của vé đã có file trong kho ho-so-ung-tuyen thì từ chối. Chặn tải
--      lần lượt, trước khi tốn băng thông.
--   2. Trigger ho_so_mot_ve_mot_file — lần ghi dòng thật (completeUpload ghi
--      bằng vai quản trị kho; lần kiểm policy thứ hai nằm trong một savepoint
--      bị hủy, khoá lấy trong policy nhả ra cùng savepoint, TRƯỚC khi dòng
--      commit). Trigger giữ khoá advisory theo vé tới hết giao dịch: hai lượt
--      tải SONG SONG cùng vé — lượt sau chờ, thấy file lượt trước, ném lỗi;
--      storage-api xoá phần file đã nhận (ObjectAdminDelete).
-- So không phân biệt hoa thường: đoạn đầu đường dẫn do người gửi đặt, và regex
-- nhận cả chữ hoa — 'ABCD…/' và 'abcd…/' là cùng một vé.
-- Không có schema storage (PGlite, CI) thì bỏ qua bước tìm file; trigger chỉ
-- gắn khi có schema storage. Thử tay trên Beeftown-thu: ghi trong PR.
-- -----------------------------------------------------------------------------
create or replace function ve_con_hieu_luc(p_doan text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id      uuid;
  v_co_file boolean;
begin
  -- Đoạn đầu đường dẫn do NGƯỜI GỬI đặt. Không ép kiểu thẳng: một đoạn như
  -- 'test' sẽ làm cả câu policy ném lỗi thay vì trả false, và lỗi trong
  -- policy thì hiện ra thành một thông báo khó hiểu ở tầng storage.
  if p_doan is null then return false; end if;
  if p_doan !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  v_id := p_doan::uuid;

  -- Khi lần kiểm nằm ngay trong giao dịch ghi dòng (bản storage-api khác), khoá
  -- này tự xếp hàng hai lượt cùng vé; ở bản hiện tại trigger dưới mới giữ được.
  perform pg_advisory_xact_lock(hashtext('ve_tai_cv:' || v_id::text));

  if not exists (
    select 1 from phieu_tai_len
    where id = v_id
      and not da_dung
      and het_han > now()) then
    return false;
  end if;

  if to_regclass('storage.objects') is not null then
    execute 'select exists (select 1 from storage.objects where bucket_id = $1 and lower(name) like $2)'
      into v_co_file
      using 'ho-so-ung-tuyen', v_id::text || '/%';
    if v_co_file then
      return false;
    end if;
  end if;

  return true;
end;
$$;

comment on function ve_con_hieu_luc is
  'Đoạn đầu đường dẫn kho CV có phải một vé còn hiệu lực VÀ chưa có file nào không (0066: một vé = một file). Chỉ trả boolean — không mở đường đọc nào vào phieu_tai_len.';


-- Trigger BEFORE INSERT trên storage.objects — chốt 2 ở trên. KHÔNG security
-- definer: chạy dưới vai đang ghi dòng — quản trị kho (chủ bảng, thấy mọi
-- dòng) ở lần ghi thật. Ở lần kiểm thử của storage-api (vai anon, bị hủy) vai
-- đó không đọc được storage.objects thì bỏ qua — chốt 1 đã kiểm lúc đó.
create or replace function ho_so_mot_ve_mot_file()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_doan text;
begin
  if new.bucket_id is distinct from 'ho-so-ung-tuyen' then
    return new;
  end if;

  v_doan := lower(split_part(new.name, '/', 1));
  if v_doan !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return new;   -- không phải thư mục vé: policy của kho quyết
  end if;

  if not has_table_privilege('storage.objects', 'select') then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('ve_tai_cv:' || v_doan));

  if exists (select 1 from storage.objects o
             where o.bucket_id = new.bucket_id
               and lower(o.name) like v_doan || '/%'
               and o.name is distinct from new.name) then
    raise exception 'Vé tải CV này đã có một file'
      using errcode = 'unique_violation';
  end if;

  return new;
end;
$$;

comment on function ho_so_mot_ve_mot_file() is
  'Trigger BEFORE INSERT trên storage.objects (0066): thư mục vé tải CV đã có một file thì từ chối file thứ hai — giữ khoá theo vé tới hết giao dịch nên hai lượt tải song song không cùng lọt.';

-- KHỐI STORAGE 0066 — PGlite không có schema storage: bỏ qua, như 0014 / 0016.
-- test-cong-khai-gioi-han.mjs chạy lại nguyên khối này trên bảng storage.objects
-- dựng giả. Changelog Supabase 21/04/2025: trigger trên storage.objects vẫn được
-- phép (chỉ cấm tạo bảng / hàm / chỉ mục trong schema storage).
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'Không có schema storage (đang chạy PGlite) — bỏ qua trigger một vé một file của 0066.';
    return;
  end if;

  execute 'drop trigger if exists ho_so_mot_ve_mot_file on storage.objects';
  execute 'create trigger ho_so_mot_ve_mot_file before insert on storage.objects for each row execute function public.ho_so_mot_ve_mot_file()';

  raise notice '0066: đã gắn trigger một vé một file vào storage.objects.';
end
$$;
-- HẾT KHỐI STORAGE 0066


-- =============================================================================
-- 5 · NỘP HỒ SƠ — chép 0026, chỉ thay khối đếm theo IP
-- =============================================================================
create index ho_so_tao_idx on ho_so_ung_tuyen (created_at);

create or replace function nop_ho_so_ung_tuyen(
  p_vi_tri_ma   text,
  p_ho_ten      text,
  p_sdt         text,
  p_email       text default null,
  p_nam_sinh    smallint default null,
  p_gioi_thieu  text default null,
  p_kinh_nghiem text default null,
  p_ca_lam_duoc text[] default null,
  p_ma_tai_len  uuid default null,
  p_ten_tep     text default null,
  p_dong_y      boolean default false,
  p_bay         text default null,   -- honeypot: bot điền, người không thấy
  p_giay_tren_form int default null,
  p_utm_source   text default null,
  p_utm_campaign text default null,
  p_ip          inet default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vi_tri vi_tri_tuyen_dung;
  v_sdt    text;
  v_dem    int;
  v_tong   int;
  v_phieu  phieu_tai_len;
  v_ma     text;
  v_duong_dan text;
  i        int;
begin
  -- Honeypot và thời gian điền form: bot trượt cả hai. Câu báo lỗi CỐ Ý
  -- chung chung — nói rõ cái nào sai là dạy cho bot cách lách.
  if coalesce(btrim(p_bay), '') <> ''
     or (p_giay_tren_form is not null and p_giay_tren_form < 3) then
    raise exception 'Không gửi được hồ sơ, vui lòng thử lại'
      using errcode = 'check_violation';
  end if;

  if not cong_tac_bat('hien_tuyen_dung') then
    raise exception 'Cổng tuyển dụng đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  -- ---- 0066 · Khoá trước khi đếm; IP null đếm như một IP; trần toàn cục ---
  perform pg_advisory_xact_lock(hashtext('ho_so_ung_tuyen'));

  select count(*) filter (where ip is not distinct from p_ip), count(*)
    into v_dem, v_tong
  from ho_so_ung_tuyen
  where created_at > now() - interval '1 hour';

  if v_dem >= 5 and p_ip is not null then
    raise exception 'Bạn đã nộp quá nhiều hồ sơ, vui lòng liên hệ trực tiếp với nhà hàng'
      using errcode = 'check_violation';
  end if;
  if v_dem >= 5 or v_tong >= 30 then
    raise exception 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng'
      using errcode = 'check_violation';
  end if;
  -- ---- Hết phần 0066 — từ đây là nguyên văn 0026 --------------------------

  select * into v_vi_tri from vi_tri_tuyen_dung
  where ma = p_vi_tri_ma and trang_thai = 'da_cong_bo';
  if not found then
    raise exception 'Không tìm thấy vị trí tuyển dụng %', p_vi_tri_ma
      using errcode = 'foreign_key_violation';
  end if;

  if v_vi_tri.han_nop is not null and v_vi_tri.han_nop < hom_nay_vn() then
    raise exception 'Vị trí này đã hết hạn nhận hồ sơ'
      using errcode = 'check_violation';
  end if;

  -- 0026: trường tin này không hỏi thì không lưu, dù có gửi lên. Form chỉ ẩn
  -- bằng CSS, nên trình duyệt cũ vẫn thấy và vẫn gửi.
  if not v_vi_tri.hoi_email       then p_email       := null; end if;
  if not v_vi_tri.hoi_nam_sinh    then p_nam_sinh    := null; end if;
  if not v_vi_tri.hoi_ca_lam      then p_ca_lam_duoc := null; end if;
  if not v_vi_tri.hoi_gioi_thieu  then p_gioi_thieu  := null; end if;
  if not v_vi_tri.hoi_kinh_nghiem then p_kinh_nghiem := null; end if;
  if not v_vi_tri.hoi_cv then
    -- Vé không bị đánh dấu đã dùng: nó tự hết hạn sau 15 phút.
    p_ma_tai_len := null;
    p_ten_tep    := null;
  end if;

  if not p_dong_y then
    raise exception 'Chưa đồng ý cho Beeftown xử lý thông tin ứng tuyển'
      using errcode = 'check_violation';
  end if;

  v_sdt := chuan_hoa_sdt(p_sdt);
  if not sdt_hop_le(v_sdt) then
    raise exception 'Số điện thoại không hợp lệ: %', p_sdt
      using errcode = 'check_violation';
  end if;

  if la_van_ban_tam(p_ho_ten) then
    raise exception 'Vui lòng điền họ tên'
      using errcode = 'check_violation';
  end if;

  -- Vé tải CV: chỉ nhận vé còn hạn và chưa dùng.
  if p_ma_tai_len is not null then
    select * into v_phieu from phieu_tai_len
    where id = p_ma_tai_len and not da_dung and het_han > now()
    for update;
    if not found then
      raise exception 'Phiếu tải CV đã hết hạn, vui lòng chọn lại file'
        using errcode = 'check_violation';
    end if;
    update phieu_tai_len set da_dung = true where id = p_ma_tai_len;
    v_duong_dan := 'ho-so-ung-tuyen/' || p_ma_tai_len::text || '/'
                   || coalesce(nullif(btrim(p_ten_tep), ''), 'cv');
  end if;

  -- Mã hồ sơ: BT-UV-YYMM-<5 ký tự>. Bỏ 0/O/1/I/L cho dễ đọc qua điện thoại.
  for i in 1..20 loop
    v_ma := 'BT-UV-' || to_char(bay_gio_vn(), 'YYMM') || '-' ||
            string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ',
                              (floor(random() * 31) + 1)::int, 1), '')
      from generate_series(1, 5);
    exit when not exists (select 1 from ho_so_ung_tuyen where ma_ho_so = v_ma);
    v_ma := null;
  end loop;
  if v_ma is null then
    raise exception 'Không sinh được mã hồ sơ, vui lòng thử lại';
  end if;

  insert into ho_so_ung_tuyen (
    ma_ho_so, vi_tri_id, chi_nhanh_id,
    ho_ten, sdt, email, nam_sinh, gioi_thieu, kinh_nghiem, ca_lam_duoc,
    duong_dan_cv,
    dong_y_noi_dung, dong_y_ip,
    luu_den, nguon_utm_source, nguon_utm_campaign, ip, ngay_nop)
  values (
    v_ma, v_vi_tri.id, v_vi_tri.chi_nhanh_id,
    btrim(p_ho_ten), v_sdt, nullif(btrim(p_email), ''), p_nam_sinh,
    p_gioi_thieu, p_kinh_nghiem, p_ca_lam_duoc,
    v_duong_dan,
    'Tôi đồng ý để Beeftown lưu và sử dụng thông tin trong hồ sơ này cho mục đích tuyển dụng, trong vòng 6 tháng kể từ ngày nộp.',
    p_ip,
    hom_nay_vn() + 180, p_utm_source, p_utm_campaign, p_ip, hom_nay_vn());

  return v_ma;
end;
$$;


-- =============================================================================
-- 6 · ĐO LƯỜNG WEBSITE — chép 0013, thêm xô phiên null và trần toàn cục
-- =============================================================================
-- Lượt thừa vẫn bị BỎ QUA IM LẶNG như 0013: đếm lượt mở thực đơn không đáng
-- làm hỏng trang của khách. Trần giờ 3000 dòng ≈ 72.000 dòng / ngày tối đa —
-- dư cho lượng khách thật, và không ai đổ được hàng triệu dòng vào bảng.
create index su_kien_web_tao_idx on su_kien_web (created_at);

create or replace function ghi_su_kien_web(
  p_loai         text,
  p_trang        text default null,
  p_phien        uuid default null,
  p_chi_nhanh_ma text default null,
  p_ngon_ngu     text default null,
  p_ket_qua      text default null,
  p_utm_source   text default null,
  p_utm_medium   text default null,
  p_utm_campaign text default null,
  p_trang_gioi_thieu text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phien int;
  v_phut  int;
  v_gio   int;
  v_cn    uuid;
begin
  -- Trần thô để một trang bị lỗi vòng lặp không làm ngập bảng.
  -- 0066: phiên null đếm như MỘT phiên; p_phien do người gọi chọn — đổi mỗi
  -- lần là lách được, nên thêm trần toàn cục phút và giờ. Một lần quét theo
  -- created_at (≤ 3000 dòng). Không khoá: đây là đếm thô, vượt vài dòng khi
  -- nhiều lượt cùng lúc không hại.
  select count(*) filter (where phien_id is not distinct from p_phien and created_at > now() - interval '1 minute'),
         count(*) filter (where created_at > now() - interval '1 minute'),
         count(*)
    into v_phien, v_phut, v_gio
  from su_kien_web
  where created_at > now() - interval '1 hour';

  if v_phien >= 60 or v_phut >= 300 or v_gio >= 3000 then
    return;
  end if;

  if p_chi_nhanh_ma is not null then
    select id into v_cn from chi_nhanh where lower(ma) = lower(p_chi_nhanh_ma);
  end if;

  insert into su_kien_web (loai, chi_nhanh_id, trang, ngon_ngu, phien_id, ket_qua,
                           utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (p_loai::su_kien_web_loai, v_cn, left(p_trang, 200), left(p_ngon_ngu, 5),
          p_phien, left(p_ket_qua, 20),
          left(p_utm_source, 100), left(p_utm_medium, 100),
          left(p_utm_campaign, 100), left(p_trang_gioi_thieu, 300));
exception
  when invalid_text_representation then
    -- Loại sự kiện lạ thì bỏ qua, không làm hỏng trang của khách.
    return;
end;
$$;


-- =============================================================================
-- 7 · HÀM NỘI BỘ — rút khỏi authenticated (như 0063 mục 5)
-- =============================================================================
-- Khối CHỐT QUYỀN dưới đây thu anon / PUBLIC; authenticated thu ở đây.
-- ghi_nhat_ky_tra_cuu: không ai bên ngoài cần gọi nữa (mục 3) — kể cả tài khoản
-- đăng nhập, vốn chèn được dòng không giới hạn từ 0013.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function gioi_han_lay_luot(text, text, integer, interval) from authenticated';
    execute 'revoke execute on function kiem_khoa_tra_cuu(inet, text) from authenticated';
    execute 'revoke execute on function ghi_lan_tra_cuu(inet, text, boolean, text) from authenticated';
    execute 'revoke execute on function ho_so_mot_ve_mot_file() from authenticated';
    execute 'revoke execute on function ghi_nhat_ky_tra_cuu(inet, text, boolean) from authenticated';
    -- Cùng lý do với anon (mục 3, tra_cuu_mot_dat_ban): hàm trả bảng cho người gọi hủy lần sai.
    execute 'revoke execute on function tra_cuu_dat_ban(text, text, inet) from authenticated';
  end if;
end
$$;

-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- =============================================================================
-- Từ 0066 KHÔNG còn dòng ghi_nhat_ky_tra_cuu, và tra_cuu_dat_ban nhường chỗ cho
-- tra_cuu_mot_dat_ban (mục 3). Migration sau chép khối này, đừng chép khối của
-- 0062 trở về trước.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';

    -- Đặt bàn
    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ma(text,date) to anon';
    execute 'grant execute on function chi_nhanh_cong_khai() to anon';
    execute 'grant execute on function tra_cuu_mot_dat_ban(text,text,inet) to anon';
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
