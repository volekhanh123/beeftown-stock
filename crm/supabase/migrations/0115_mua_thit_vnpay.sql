-- =============================================================================
-- 0115 · MUA THỊT VỀ: KHÁCH TRẢ TRƯỚC QUA VNPAY TRÊN WEBSITE (Khánh 12/11/2026)
-- =============================================================================
-- PHẢI CHẠY SAU 0114 (một mình — vai may_vnpay), 0113 (don_mua_thit, don_mua_thit_danh_sach, don_mua_thit_duoc_xem),
-- 0090 (thân suc_khoe_so_lieu mới nhất), 0001 (co_vai_tro, tu_dong_cap_nhat_updated_at).
--
-- Khánh 12/11/2026: "Đặt hàng đơn của bạn xác nhận là sai rồi, chưa link với VNPay để mở ra cổng thanh toán" — chọn
-- "Khách trả VNPay ở Mua thịt về" và "Giá gói đã gồm phí giao". Đặt hàng xong (tao_don_mua_thit, 0113 — không đổi)
-- website mở cổng VNPay cho đúng tổng tiền gói; VNPay báo kết quả về website (IPN), đơn hiện "Đã trả" ở hộp thư.
-- Website nối thẳng VNPay bằng Terminal riêng của website (không qua Zalo như Mini App).
--
-- Ai làm gì:
--   · anon (Worker, ngay sau khi tao_don_mua_thit trả mã đơn): mua_thit_mo_vnpay(ma_gui) — mở MỘT LẦN TRẢ cho đơn,
--     trả mã giao dịch (vnp_TxnRef) và số tiền. Database quyết định số tiền (= tạm tính của đơn, giá đã gồm phí giao),
--     không bao giờ trang. ma_gui là mã chống gửi hai lần trang dựng ngẫu nhiên cho mỗi lần hiện form (0113): chỉ trình
--     duyệt đã gửi đơn biết nó — người khác không mở được lần trả cho đơn của khách.
--   · may_vnpay (Worker, sau khi đã kiểm chữ ký HMAC-SHA512 của VNPay — database không giữ khóa bí mật):
--       vnpay_ghi_ipn — VNPay báo kết quả (IPN): đúng thứ tự kiểm của VNPay — không thấy giao dịch → sai số tiền →
--                       đã có kết quả → ghi. Kết quả 'khong_thay' | 'sai_tien' | 'da_xac_nhan' | 'da_ghi' thành
--                       RspCode 01 / 04 / 02 / 00 ở web/src/lib/vnpay-hook.ts.
--       vnpay_ghi_ve  — khách được VNPay đưa về trang kết quả (Return URL): chỉ ghi DẤU "khách đã về, VNPay báo mã …",
--                       KHÔNG BAO GIỜ đổi trạng thái lần trả (tài liệu VNPay: chỉ IPN cập nhật kết quả). Dấu đó cho đèn
--                       sức khỏe biết "khách trả xong mà VNPay chưa báo về" — IPN hỏng thì chủ thấy ngay.
--   · chủ, quản lý, thu ngân: don_mua_thit_danh_sach thêm số tiền đã trả, lúc trả, mã giao dịch VNPay.
--
-- Không có câu delete. Chỉ chạy lên production SAU khi PR được gộp, bằng SQL Editor hoặc psql (không dùng
-- apply_migration của Supabase MCP), 0114 trước và một mình, rồi `npm run doi-chieu` phải báo KHỚP. Chạy migration
-- trước, deploy web sau: web cũ vẫn chạy với migration mới (hộp thư cũ bỏ qua cột mới, không ai gọi hàm mới).
--
-- File này:
--   1 · Bảng thanh_toan_vnpay_web (mỗi lần mở cổng VNPay một dòng).
--   2 · mua_thit_mo_vnpay — hàm anon.
--   3 · vnpay_ghi_ipn, vnpay_ghi_ve — hàm máy may_vnpay.
--   4 · don_mua_thit_danh_sach — thêm tiền đã trả (đổi kiểu trả về nên drop rồi tạo lại, cùng tham số).
--   5 · suc_khoe_so_lieu — ô vnpay cho đèn "Thanh toán VNPay".
--   6 · Mô tả mới của hai khóa (hien_mua_thit_ve, mua_thit_giao_hang).
--   7 · Quyền.
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG thanh_toan_vnpay_web
-- =============================================================================
-- Một dòng một lần mở cổng VNPay. Khách hủy trên trang VNPay rồi trả lại, bấm đúp, mở lại từ trang kết quả: mỗi lần
-- một mã giao dịch mới (VNPay không nhận lại mã đã dùng). ma_giao_dich = mã đơn (6 ký tự) + số lần (2 chữ số).
--   cho      — đã mở cổng, VNPay chưa báo kết quả (khách đang trả, bỏ dở, hay VNPay chưa gọi IPN).
--   da_tra   — IPN: vnp_ResponseCode = 00 và vnp_TransactionStatus = 00.
--   that_bai — IPN báo mã khác (khách hủy, sai OTP, không đủ tiền…). Đơn vẫn chờ, khách trả lại được.
create table thanh_toan_vnpay_web (
  ma_giao_dich   text primary key,
  don_id         uuid not null references don_mua_thit(id),
  lan            smallint not null,
  so_tien        bigint not null,
  trang_thai     text not null default 'cho',
  ma_phan_hoi    text,
  trang_thai_gd  text,
  ma_vnpay       text,
  ngan_hang      text,
  tra_luc        timestamptz,
  ipn_luc        timestamptz,
  ve_luc         timestamptz,
  ve_ma_phan_hoi text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint thanh_toan_vnpay_web_lan_duy_nhat unique (don_id, lan),
  constraint thanh_toan_vnpay_web_ma check (ma_giao_dich ~ '^[0-9A-Z]{6}[0-9]{2}$'),
  constraint thanh_toan_vnpay_web_lan check (lan between 1 and 10),
  constraint thanh_toan_vnpay_web_so_tien check (so_tien > 0),
  constraint thanh_toan_vnpay_web_trang_thai check (trang_thai in ('cho', 'da_tra', 'that_bai')),
  constraint thanh_toan_vnpay_web_ma_phan_hoi check (ma_phan_hoi is null or ma_phan_hoi ~ '^[0-9A-Z]{2}$'),
  constraint thanh_toan_vnpay_web_trang_thai_gd check (trang_thai_gd is null or trang_thai_gd ~ '^[0-9A-Z]{2}$'),
  constraint thanh_toan_vnpay_web_ma_vnpay check (ma_vnpay is null or ma_vnpay ~ '^[0-9]{1,20}$'),
  constraint thanh_toan_vnpay_web_ngan_hang check (ngan_hang is null or ngan_hang ~ '^[A-Za-z0-9_]{1,20}$'),
  constraint thanh_toan_vnpay_web_ve_ma check (ve_ma_phan_hoi is null or ve_ma_phan_hoi ~ '^[0-9A-Z]{2}$'),
  -- Có kết quả thì có lúc IPN ghi; còn chờ thì chưa có.
  constraint thanh_toan_vnpay_web_ipn check ((trang_thai = 'cho') = (ipn_luc is null))
);

create trigger thanh_toan_vnpay_web_updated_at
  before update on thanh_toan_vnpay_web
  for each row execute function tu_dong_cap_nhat_updated_at();

create index thanh_toan_vnpay_web_don_idx on thanh_toan_vnpay_web (don_id);
create index thanh_toan_vnpay_web_tao_idx on thanh_toan_vnpay_web (created_at desc);

-- Khóa kín như don_mua_thit: không policy — anon và authenticated không đọc, không ghi thẳng. Chỉ qua hàm definer.
alter table thanh_toan_vnpay_web enable row level security;
revoke all on table thanh_toan_vnpay_web from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table thanh_toan_vnpay_web from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table thanh_toan_vnpay_web from authenticated';
  end if;
end
$$;

comment on table thanh_toan_vnpay_web is
  'Mỗi lần website mở cổng VNPay cho một đơn mua thịt về một dòng (0115). ma_giao_dich = vnp_TxnRef = mã đơn + số lần. Trạng thái chỉ IPN đổi (vnpay_ghi_ipn, máy may_vnpay); trang kết quả chỉ ghi dấu khách đã về (vnpay_ghi_ve). Không lưu số thẻ, tên chủ thẻ hay gì của ngân hàng ngoài mã ngân hàng và mã giao dịch VNPay. Khóa kín: chỉ qua hàm definer.';
comment on column thanh_toan_vnpay_web.so_tien is
  'Số tiền (đồng) database chốt lúc mở cổng = tạm tính của đơn (giá gói đã gồm phí giao, Khánh 12/11/2026). IPN phải báo đúng số này (vnp_Amount / 100), không thì "sai_tien".';
comment on column thanh_toan_vnpay_web.ve_ma_phan_hoi is
  'vnp_ResponseCode trên đường dẫn khách được đưa về (chữ ký đã kiểm ở Worker). Chỉ là dấu cho đèn sức khỏe và hộp thư — không bao giờ quyết định đã trả hay chưa.';


-- =============================================================================
-- 2 · mua_thit_mo_vnpay — HÀM ANON: MỞ MỘT LẦN TRẢ CHO ĐƠN VỪA ĐẶT
-- =============================================================================
-- Gọi ngay sau tao_don_mua_thit, với cùng ma_gui. Cùng ma_gui gửi lại (F5, bấm đúp, trang kết quả bấm "Trả lại") →
-- cùng đơn, lần trả MỚI. Đơn đã trả đủ → không mở lần nào nữa, trả da_tra = true (khách không trả hai lần vì bấm lại).
-- Thứ tự kiểm (câu lỗi là câu khách đọc — bản en, ko ở cauLoiDatabase của web/src/lib/chu.ts):
--   thiếu mã → không thấy đơn → đơn đã hủy / đã giao → đã trả đủ (không lỗi) → quá 10 lần.
-- Trả jsonb {ma_don, so_tien, da_tra, ma_giao_dich (null khi da_tra), ngon_ngu} — không bảng (0084).
create or replace function mua_thit_mo_vnpay(p_ma_gui uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_don    don_mua_thit;
  v_da_tra bigint;
  v_lan    int;
  v_ma     text;
begin
  if p_ma_gui is null then
    raise exception 'Thiếu mã đơn — tải lại trang rồi đặt lại.' using errcode = 'check_violation';
  end if;

  -- Khóa dòng đơn: hai lượt cùng ma_gui (bấm đúp) xếp hàng ở đây, không lấy trùng số lần.
  select * into v_don from don_mua_thit where ma_gui = p_ma_gui for update;
  if not found then
    raise exception 'Không thấy đơn để trả tiền, vui lòng gọi quán' using errcode = 'no_data_found';
  end if;
  if v_don.trang_thai = 'da_huy' then
    raise exception 'Đơn này đã hủy, không trả tiền được nữa' using errcode = 'check_violation';
  end if;
  if v_don.trang_thai = 'da_giao' then
    raise exception 'Đơn này đã giao xong, không cần trả tiền qua website nữa' using errcode = 'check_violation';
  end if;

  select coalesce(sum(t.so_tien), 0) into v_da_tra
  from thanh_toan_vnpay_web t where t.don_id = v_don.id and t.trang_thai = 'da_tra';
  if v_da_tra >= v_don.tam_tinh then
    return jsonb_build_object('ma_don', v_don.ma_don, 'so_tien', v_don.tam_tinh, 'da_tra', true,
                              'ma_giao_dich', null, 'ngon_ngu', v_don.ngon_ngu);
  end if;

  select coalesce(max(t.lan), 0) + 1 into v_lan from thanh_toan_vnpay_web t where t.don_id = v_don.id;
  if v_lan > 10 then
    raise exception 'Đơn này đã mở trang trả tiền quá nhiều lần, vui lòng gọi quán' using errcode = 'check_violation';
  end if;

  v_ma := v_don.ma_don || lpad(v_lan::text, 2, '0');
  insert into thanh_toan_vnpay_web (ma_giao_dich, don_id, lan, so_tien)
  values (v_ma, v_don.id, v_lan, v_don.tam_tinh);

  return jsonb_build_object('ma_don', v_don.ma_don, 'so_tien', v_don.tam_tinh, 'da_tra', false,
                            'ma_giao_dich', v_ma, 'ngon_ngu', v_don.ngon_ngu);
end;
$$;

comment on function mua_thit_mo_vnpay(uuid) is
  'CÔNG KHAI (0115): mở một lần trả VNPay cho đơn mua thịt về có ma_gui này (mã chống gửi hai lần trang dựng ngẫu nhiên — chỉ trình duyệt đã gửi đơn biết). Số tiền = tạm tính của đơn (giá gói đã gồm phí giao). Đơn đã trả đủ → da_tra = true, không mở lần mới. Đơn đã hủy / đã giao, quá 10 lần → lỗi. Trả {ma_don, so_tien, da_tra, ma_giao_dich, ngon_ngu}.';


-- =============================================================================
-- 3 · HÀM MÁY may_vnpay
-- =============================================================================
-- Worker đã kiểm chữ ký vnp_SecureHash (HMAC-SHA512, khóa bí mật chỉ ở Worker) và IP nguồn trước khi gọi. Database
-- kiểm vai trước mọi thứ khác: vai khác, không phiên → 42501.
--
-- vnpay_ghi_ipn: đúng thứ tự của code mẫu VNPay — giao dịch có không (01) → số tiền đúng không (04) → đã có kết quả
-- chưa (02) → ghi (00). Gọi lại với cùng giao dịch (VNPay gửi lại IPN) → 'da_xac_nhan', không ghi lần hai.
create or replace function vnpay_ghi_ipn(
  p_ma_giao_dich  text,
  p_so_tien       bigint,
  p_ma_phan_hoi   text,
  p_trang_thai_gd text,
  p_ma_vnpay      text,
  p_ngan_hang     text,
  p_tra_luc       timestamptz
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tt  thanh_toan_vnpay_web;
  v_tra boolean;
begin
  if not co_vai_tro(array['may_vnpay']::vai_tro[]) then
    raise exception 'Không có quyền ghi kết quả thanh toán VNPay' using errcode = 'insufficient_privilege';
  end if;
  if p_ma_phan_hoi is null or p_ma_phan_hoi !~ '^[0-9A-Z]{2}$'
     or (p_trang_thai_gd is not null and p_trang_thai_gd !~ '^[0-9A-Z]{2}$') then
    raise exception 'Mã phản hồi VNPay không hợp lệ' using errcode = 'check_violation';
  end if;

  select * into v_tt from thanh_toan_vnpay_web where ma_giao_dich = p_ma_giao_dich for update;
  if not found then
    return 'khong_thay';
  end if;
  if p_so_tien is distinct from v_tt.so_tien then
    return 'sai_tien';
  end if;
  if v_tt.trang_thai <> 'cho' then
    return 'da_xac_nhan';
  end if;

  -- Trạng thái giao dịch thường có; thiếu thì theo mã phản hồi (có thì phải là 00) — như trang thử của máy chủ đơn.
  v_tra := p_ma_phan_hoi = '00' and coalesce(p_trang_thai_gd, '00') = '00';
  update thanh_toan_vnpay_web set
    trang_thai    = case when v_tra then 'da_tra' else 'that_bai' end,
    ma_phan_hoi   = p_ma_phan_hoi,
    trang_thai_gd = p_trang_thai_gd,
    ma_vnpay      = case when p_ma_vnpay ~ '^[0-9]{1,20}$' then p_ma_vnpay end,
    ngan_hang     = case when p_ngan_hang ~ '^[A-Za-z0-9_]{1,20}$' then p_ngan_hang end,
    tra_luc       = case when v_tra then coalesce(p_tra_luc, now()) end,
    ipn_luc       = now()
  where ma_giao_dich = v_tt.ma_giao_dich;
  return 'da_ghi';
end;
$$;

comment on function vnpay_ghi_ipn(text, bigint, text, text, text, text, timestamptz) is
  'MÁY may_vnpay (0115): ghi kết quả VNPay báo về (IPN) cho một lần trả. Worker kiểm chữ ký trước. Thứ tự của VNPay: khong_thay (RspCode 01) → sai_tien (04) → da_xac_nhan (02, VNPay gửi lại) → da_ghi (00). Đã trả = vnp_ResponseCode 00 và vnp_TransactionStatus 00.';

-- vnpay_ghi_ve: khách về trang kết quả với chữ ký đúng. Chỉ lần về ĐẦU TIÊN được ghi (F5 trang kết quả không đổi gì);
-- trạng thái lần trả không bao giờ đổi ở đây. Trả cho trang biết database đã nhận tiền chưa:
--   {thay: false} | {thay: true, ma_don, trang_thai, so_tien, don_da_tra}
--   don_da_tra: tổng đã trả của cả đơn (lần khác có thể đã trả) ≥ tạm tính.
create or replace function vnpay_ghi_ve(p_ma_giao_dich text, p_ma_phan_hoi text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tt  thanh_toan_vnpay_web;
  v_don don_mua_thit;
  v_tra bigint;
begin
  if not co_vai_tro(array['may_vnpay']::vai_tro[]) then
    raise exception 'Không có quyền ghi kết quả thanh toán VNPay' using errcode = 'insufficient_privilege';
  end if;

  update thanh_toan_vnpay_web set
    ve_luc         = coalesce(ve_luc, now()),
    ve_ma_phan_hoi = coalesce(ve_ma_phan_hoi, case when p_ma_phan_hoi ~ '^[0-9A-Z]{2}$' then p_ma_phan_hoi end)
  where ma_giao_dich = p_ma_giao_dich
  returning * into v_tt;
  if not found then
    return jsonb_build_object('thay', false);
  end if;

  select * into v_don from don_mua_thit where id = v_tt.don_id;
  select coalesce(sum(t.so_tien), 0) into v_tra
  from thanh_toan_vnpay_web t where t.don_id = v_tt.don_id and t.trang_thai = 'da_tra';
  return jsonb_build_object('thay', true, 'ma_don', v_don.ma_don, 'trang_thai', v_tt.trang_thai,
                            'so_tien', v_tt.so_tien, 'don_da_tra', v_tra >= v_don.tam_tinh);
end;
$$;

comment on function vnpay_ghi_ve(text, text) is
  'MÁY may_vnpay (0115): khách được VNPay đưa về trang kết quả (Worker đã kiểm chữ ký). Ghi dấu lần về đầu tiên (ve_luc, ve_ma_phan_hoi) — không đổi trạng thái lần trả (chỉ IPN đổi). Trả {thay, ma_don, trang_thai, so_tien, don_da_tra} để trang nói đúng: database đã nhận tiền hay còn chờ VNPay báo.';


-- =============================================================================
-- 4 · HỘP THƯ: THÊM TIỀN ĐÃ TRẢ
-- =============================================================================
-- Thân 0113 nguyên văn, thêm năm cột trả tiền (0115). Kiểu trả về đổi nên phải drop rồi tạo lại — cùng tham số, cùng
-- quyền (mục 6). Web cũ đọc theo tên cột nên không vướng cột mới.
--   da_tra        — tổng đã trả qua VNPay (đồng); 0 = chưa trả. Lớn hơn tam_tinh = khách trả hai lần → hoàn lại.
--   tra_luc       — lúc trả của lần trả gần nhất (giờ VNPay báo).
--   ma_vnpay      — mã giao dịch VNPay của lần trả gần nhất (đối chiếu trên trang quản lý của VNPay).
--   so_lan_mo     — số lần khách mở cổng VNPay.
--   khach_ve_da_tra — khách về trang kết quả với mã 00 mà VNPay CHƯA báo về (IPN): tiền có thể đã trừ, xem trên VNPay.
drop function if exists don_mua_thit_danh_sach(text);

create or replace function don_mua_thit_danh_sach(p_loc text default 'cho')
returns table (
  id          uuid,
  ma_don      text,
  created_at  timestamptz,
  updated_at  timestamptz,
  ho_ten      text,
  sdt         text,
  dia_chi     text,
  ghi_chu     text,
  dong        jsonb,
  tam_tinh    bigint,
  ngon_ngu    text,
  trang_thai  text,
  nguoi_xu_ly text,
  -- 0115 · trả tiền qua VNPay
  da_tra          bigint,
  tra_luc         timestamptz,
  ma_vnpay        text,
  so_lan_mo       int,
  khach_ve_da_tra boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_loc text := case when p_loc in ('cho', 'dang', 'xong', 'tat_ca') then p_loc else 'cho' end;
begin
  if not don_mua_thit_duoc_xem() then
    raise exception 'Không có quyền xem đơn mua thịt' using errcode = 'insufficient_privilege';
  end if;
  return query
  select d.id, d.ma_don, d.created_at, d.updated_at, d.ho_ten, d.sdt, d.dia_chi, d.ghi_chu, d.dong, d.tam_tinh,
         d.ngon_ngu, d.trang_thai, ns.ho_ten,
         -- 0115 · trả tiền qua VNPay
         coalesce(tt.da_tra, 0)::bigint, tt.tra_luc, tt.ma_vnpay, coalesce(tt.so_lan_mo, 0)::int,
         coalesce(tt.khach_ve_da_tra, false)
  from don_mua_thit d
  left join nhan_su ns on ns.id = d.nguoi_xu_ly
  left join lateral (
    select sum(t.so_tien) filter (where t.trang_thai = 'da_tra') as da_tra,
           max(t.tra_luc) as tra_luc,
           (array_agg(t.ma_vnpay order by t.tra_luc desc) filter (where t.trang_thai = 'da_tra'))[1] as ma_vnpay,
           count(*) as so_lan_mo,
           bool_or(t.trang_thai = 'cho' and t.ve_ma_phan_hoi = '00') as khach_ve_da_tra
    from thanh_toan_vnpay_web t
    where t.don_id = d.id
  ) tt on true
  where d.chi_nhanh_id = any (crm_cn_duoc())
    and case v_loc
          when 'cho'  then d.trang_thai = 'cho_xac_nhan'
          when 'dang' then d.trang_thai = 'da_xac_nhan'
          when 'xong' then d.trang_thai in ('da_giao', 'da_huy') and d.created_at > now() - interval '30 days'
          else d.trang_thai in ('cho_xac_nhan', 'da_xac_nhan') or d.created_at > now() - interval '30 days'
        end
  order by d.created_at desc
  limit 200;
end;
$$;

comment on function don_mua_thit_danh_sach(text) is
  'Hộp thư đơn mua thịt website (0113, 0115 thêm trả tiền VNPay): chủ, quản lý, thu ngân đang làm, đơn của chi nhánh mình (crm_cn_duoc). p_loc cho | dang | xong | tat_ca. Mới nhất trước, tối đa 200. da_tra: tổng đã trả qua VNPay (lớn hơn tam_tinh = trả hai lần); khach_ve_da_tra: khách về trang kết quả với mã 00 mà VNPay chưa báo về.';


-- =============================================================================
-- 5 · SỨC KHỎE: Ô vnpay
-- =============================================================================
-- Thân 0090 NGUYÊN VĂN, chỉ thêm ô vnpay (cả thương hiệu — một Terminal VNPay cho cả website). Đèn "Thanh toán VNPay"
-- ở web/src/lib/suc-khoe.ts:
--   lan_mo_30_ngay — số lần mở cổng 30 ngày qua (0 và chưa có IPN nào → "Chưa dùng").
--   ipn_cuoi       — lần VNPay báo kết quả về gần nhất.
--   ve_chua_ipn    — khách về trang kết quả với mã 00 (chữ ký đúng) quá 10 phút mà VNPay chưa báo về, trong 24 giờ
--                    qua → ĐỎ: IPN hỏng (sai địa chỉ IPN, danh sách IP, tài khoản máy), đơn đã trả mà hộp thư ghi chưa.
create or replace function suc_khoe_so_lieu(p_chi_nhanh_ids uuid[], p_lech jsonb default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_z    zalo_cau_hinh;
  v_m    mess_cau_hinh;
  v_cn   record;
  v_ipos jsonb;
  v_ch   kho_ipos_cau_hinh;
  v_lech jsonb;
  v_bd   bao_dong_trang_thai;
  v_ds   jsonb := '[]'::jsonb;
begin
  v_lech := coalesce(p_lech, suc_khoe_lech_so_kho());

  -- Chi nhánh đã ngừng hoạt động không nhận đặt bàn (tao_dat_ban lọc dang_hoat_dong) — không báo gì.
  for v_cn in
    select c.id, c.ma, c.ten
    from chi_nhanh c
    where c.dang_hoat_dong
      and c.id = any(p_chi_nhanh_ids)
    order by c.ten
  loop
    v_ipos := kho_ipos_trang_thai_goc(v_cn.id);
    v_ch := null;
    select * into v_ch from kho_ipos_cau_hinh where chi_nhanh_id = v_cn.id;

    v_ds := v_ds || jsonb_build_array(jsonb_build_object(
      'id',  v_cn.id,
      'ma',  v_cn.ma,     -- trang kho chọn chi nhánh bằng ?cn=<ma>
      'ten', v_cn.ten,

      'ipos', jsonb_build_object(
        'co_cau_hinh',     v_ipos -> 'co_cau_hinh',
        'bat',             v_ipos -> 'bat',
        'cau_hinh_du',     v_ipos -> 'cau_hinh_du',
        'den',             v_ipos -> 'den',
        'mat_ket_noi',     v_ipos -> 'mat_ket_noi',
        'loi_tu_luc',      v_ch.loi_tu_luc,
        'nhan_hd_luc',     v_ipos -> 'nhan_hd_luc',
        'gio_mat_ket_noi', v_ipos -> 'gio_mat_ket_noi',
        'dang_tru_kho',    (v_ipos ->> 'nguon_so_ban') = 'ipos' and (v_ipos ->> 'ipos_tu_luc') is not null,
        'cho_xu_ly',       v_ipos -> 'cho_xu_ly',
        'dong_loi',        v_ipos -> 'dem' -> 'loi',
        'bat_luc',         v_ch.bat_luc,
        -- Lượt tự chạy xong: có giờ kết thúc, và kết thúc trước khi bị lượt sau đóng hộ
        -- (kho_ipos_bat_dau đóng lượt treo quá 10 phút với lỗi "Quá 10 phút không xong").
        'cron_cuoi',       (select max(l.bat_dau_luc) from kho_ipos_lan_chay l
                            where l.chi_nhanh_id = v_cn.id and l.nguon = 'cron'
                              and l.ket_thuc_luc is not null
                              and l.ket_thuc_luc < l.bat_dau_luc + interval '10 minutes')),

      -- Tin hỏng không bao giờ có gui_luc, và lần thử cuối không được ghi lại: "hỏng lúc
      -- nào" tính theo lúc ĐẾN HẠN (gui_sau — tin nhắc hẹn xếp từ nhiều ngày trước), không
      -- theo lúc tạo. Web nói đúng như vậy: "tin đến hạn trong 24 giờ qua đã hỏng".
      'tin_zalo', (
        select jsonb_build_object(
          'that_bai_24h', count(*) filter (
             where t.ket_qua in ('that_bai', 'bi_tu_choi')
               and coalesce(t.gui_luc, t.gui_sau, t.created_at) > now() - interval '24 hours'),
          'cho_qua_han', count(*) filter (
             where t.ket_qua = 'cho_gui'
               and t.loai_tin is distinct from 'cham_soc'
               and greatest(coalesce(t.gui_sau, t.created_at),
                            coalesce(t.thu_lai_luc, '-infinity'::timestamptz)) < now() - interval '30 minutes'
               -- 0063: tin máy gửi không được lấy (đặt bàn chưa xác nhận) đang chờ đúng luật.
               and not exists (select 1 from dat_ban d where d.id = t.dat_ban_id and d.trang_thai = 'cho_xac_nhan')))
        from nhat_ky_tin t
        where t.chi_nhanh_id = v_cn.id
          and (t.ket_qua = 'cho_gui' or coalesce(t.gui_luc, t.gui_sau, t.created_at) > now() - interval '24 hours')),

      -- Ba nhóm không chồng nhau: qua giờ hẹn > chờ quá 24 giờ > chờ quá 2 giờ.
      'dat_ban', (
        select jsonb_build_object(
          'form_mo',        cong_tac_bat('form_dat_ban_dang_mo'),
          'so_ban',         (select count(*) from ban_an b where b.chi_nhanh_id = v_cn.id and b.dang_dung),
          'cho',            count(*),
          'qua_gio_hen',    count(*) filter (where d.ngay + d.gio < bay_gio_vn()),
          'cho_qua_24_gio', count(*) filter (where d.ngay + d.gio >= bay_gio_vn()
                                               and d.created_at < now() - interval '24 hours'),
          'cho_qua_2_gio',  count(*) filter (where d.ngay + d.gio >= bay_gio_vn()
                                               and d.created_at >= now() - interval '24 hours'
                                               and d.created_at < now() - interval '2 hours'))
        from dat_ban d
        where d.chi_nhanh_id = v_cn.id and d.trang_thai = 'cho_xac_nhan'),

      -- Hai nhóm không chồng nhau: quá 7 ngày > quá 2 ngày (tới 7 ngày).
      'tuyen_dung', (
        select jsonb_build_object(
          'moi',            count(*),
          'moi_qua_7_ngay', count(*) filter (where h.created_at < now() - interval '7 days'),
          'moi_qua_2_ngay', count(*) filter (where h.created_at >= now() - interval '7 days'
                                               and h.created_at < now() - interval '2 days'))
        from ho_so_ung_tuyen h
        where h.chi_nhanh_id = v_cn.id and h.trang_thai = 'moi'),

      'so_kho', jsonb_build_object(
        'co_kho', exists (select 1 from kho_vi_tri v where v.chi_nhanh_id = v_cn.id),
        'lech',   coalesce((v_lech ->> v_cn.id::text)::int, 0)),

      -- 0061: đèn "Beeftown Cân" — máy quầy báo về kho (kho_may_can_bao). Không câu lỗi, không người.
      'can', jsonb_build_object(
        'gio_mo_cua',  coalesce(v_ch.gio_mo_cua, 10),
        'gio_dong_cua', coalesce(v_ch.gio_dong_cua, 23),
        'may', (select coalesce(jsonb_agg(jsonb_build_object(
                          'bao_luc', mc.bao_luc, 'giu_ket_noi', mc.giu_ket_noi, 'can_tra_loi_luc', mc.can_tra_loi_luc,
                          'tu_gui', mc.tu_gui, 'lech_so', mc.lech_so, 'lech_tu', mc.lech_tu, 'gui_loi', mc.gui_loi,
                          -- 0090: lần gửi gần nhất cân chưa xác nhận, từ lúc nào.
                          'chua_xac_nhan', mc.chua_xac_nhan, 'chua_xac_nhan_tu', mc.chua_xac_nhan_tu)
                        order by mc.bao_luc), '[]'::jsonb)
                from kho_may_can mc
                where mc.chi_nhanh_id = v_cn.id and mc.bao_luc > now() - interval '14 days'))
    ));
  end loop;

  select * into v_z from zalo_cau_hinh where id = 1;
  select * into v_m from mess_cau_hinh where id = 1;
  select * into v_bd from bao_dong_trang_thai where id = 1;

  return jsonb_build_object(
    'luc', now(),
    'zalo', jsonb_build_object(
      'dang_bat',      coalesce(v_z.dang_bat, false),
      'che_do',        v_z.che_do,
      'bat_luc',       v_z.bat_luc,
      'lan_chay_cuoi', v_z.lan_chay_cuoi,
      'co_loi',        v_z.loi_cuoi is not null),
    'messenger', jsonb_build_object(
      'dang_bat',      coalesce(v_m.dang_bat, false),
      'bat_luc',       v_m.bat_luc,
      'lan_nhan_cuoi', v_m.lan_nhan_cuoi,
      'loi_cuoi_luc',  v_m.loi_cuoi_luc,
      'loi_7_ngay',    (select coalesce(sum(t.dem), 0) from mess_thong_ke_ngay t
                        where t.loai = 'loi' and t.ngay > hom_nay_vn() - 7)),
    'dich', (
      select jsonb_build_object(
        'cho', count(*) filter (where v.ly_do in ('thieu', 'cu')),
        'loi', count(*) filter (where v.ly_do = 'thu_lai'))
      from v_viec_dich v
      where v.bang <> 'noi_dung_cong_bo'),
    -- 0060: việc chạy nền báo động — đèn "Báo động" của bảng (web/src/lib/suc-khoe.ts).
    'bao_dong', jsonb_build_object(
      'lan_chay_cuoi', v_bd.lan_chay_cuoi,
      'kenh',          coalesce(v_bd.kenh, 'khong'),
      'co_loi',        v_bd.loi_cuoi is not null,
      'lan_gui_cuoi',  v_bd.lan_gui_cuoi),
    -- 0074: đèn "Dọn dữ liệu cá nhân" — việc dọn chỉ chạy khi chủ bấm (0012), đèn nói khi nào phải bấm.
    -- Hai nhóm hồ sơ không chồng nhau: quá hạn hơn 7 ngày > quá hạn 1–7 ngày.
    'don_dep', jsonb_build_object(
      'ho_so_qua_han',        (select count(*) from ho_so_ung_tuyen h
                               where not h.da_an_danh and h.luu_den < hom_nay_vn() and h.luu_den >= hom_nay_vn() - 7),
      'ho_so_qua_han_7_ngay', (select count(*) from ho_so_ung_tuyen h
                               where not h.da_an_danh and h.luu_den < hom_nay_vn() - 7),
      've_qua_han',           (select count(*) from phieu_tai_len p
                               where not p.da_dung and p.het_han < now() - interval '7 days'),
      'su_kien_qua_han',      exists (select 1 from su_kien_web s where s.ngay < hom_nay_vn() - 97)),
    -- 0115 · đèn "Thanh toán VNPay" — đơn mua thịt về trả trước trên website (cả thương hiệu, một Terminal).
    'vnpay', (
      select jsonb_build_object(
        'lan_mo_30_ngay', count(*) filter (where t.created_at > now() - interval '30 days'),
        'ipn_cuoi',       max(t.ipn_luc),
        've_chua_ipn',    count(*) filter (where t.trang_thai = 'cho' and t.ve_ma_phan_hoi = '00'
                                             and t.ve_luc > now() - interval '24 hours'
                                             and t.ve_luc < now() - interval '10 minutes'))
      from thanh_toan_vnpay_web t),
    'chi_nhanh', v_ds);
end;
$$;

comment on function suc_khoe_so_lieu(uuid[], jsonb) is
  'NỘI BỘ (0060, 0061 thêm ô can, 0063 cho_qua_han bỏ tin đặt bàn chưa xác nhận — máy gửi không lấy, 0074 thêm ô don_dep — đèn Dọn dữ liệu cá nhân, 0090 thêm chua_xac_nhan vào máy của ô can, 0115 thêm ô vnpay — đèn Thanh toán VNPay): số liệu bảng sức khỏe cho các chi nhánh ĐANG HOẠT ĐỘNG trong danh sách, không kiểm vai. p_lech: đối soát sổ kho đã có (null = quét). Chỉ gọi từ suc_khoe_he_thong() (chủ / quản lý) và bao_dong_bat_dau_luot() (máy báo động). Không ai đăng nhập gọi thẳng được.';


-- =============================================================================
-- 6 · MÔ TẢ HAI KHÓA — ĐÚNG VỚI LUỒNG CÓ VNPAY
-- =============================================================================
-- Màn /noi-bo/noi-dung đọc mo_ta; bản tiếng Anh cùng PR ở MO_TA_KHOA_EN (web/src/lib/cau-noi-bo.ts). Website chỉ thu
-- tiền khi Worker đã cài VNPay (bí mật VNPAY_*, web/README.md mục "VNPay cho Mua thịt về"); chưa cài thì trang chạy
-- như 0113. Cờ chỉ chủ, kiểu, nhóm, thứ tự giữ nguyên.
update khoa_cong_bo set mo_ta =
  'Mở trang Mua thịt về và mục của nó trên thanh điều hướng: khách chọn gói, điền họ tên, số điện thoại, địa chỉ giao và đặt hàng ngay trên website; đơn vào hộp thư Đơn mua thịt ở /noi-bo. Chỉ giao tận nơi. Website đã cài VNPay thì đặt xong khách trả trước qua VNPay đúng tổng tiền gói (giá gói đã gồm phí giao), hộp thư ghi Đã trả, nhân viên gọi khách hẹn giờ giao; chưa cài VNPay thì website không thu tiền, nhân viên gọi khách xác nhận tổng tiền, phí giao và giờ giao. Trang CHỈ mở khi công tắc này bật VÀ có ít nhất một sản phẩm Đang bán, kênh website, đã được chủ chốt giá ở Bán lẻ. Trang hiện giá gói đã chốt; giá mỗi kg ở Kho đổi thì trang vẫn giữ giá đã chốt cho tới khi chủ chốt lại. Chỉ bật khi có người xem hộp thư và gọi khách trong giờ mở cửa, đã chốt ai giao hàng, và đã có ý kiến luật sư về cách ghi định lượng gói giá cố định.'
where khoa = 'hien_mua_thit_ve';

update khoa_cong_bo set mo_ta =
  'Khu vực giao và cách tính phí giao của đơn mua thịt về, như khách đọc (trang chỉ giao tận nơi). Website đã cài VNPay thì giá gói đã gồm phí giao: chỉ ghi khu vực giao. Chưa công bố thì trang ghi: phí giao đã gồm trong giá gói (đã cài VNPay), hoặc quán báo phí giao khi gọi xác nhận đơn (chưa cài). Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.'
where khoa = 'mua_thit_giao_hang';


-- =============================================================================
-- 7 · QUYỀN
-- =============================================================================
-- anon: đúng một hàm mới (mua_thit_mo_vnpay) — xếp vào DUOC_PHEP của crm/test/test-an-toan.mjs.
-- authenticated: hai hàm máy (tự kiểm vai may_vnpay) và hộp thư (tạo lại — cấp lại như 0113).
-- suc_khoe_so_lieu: hàm nội bộ, rút khỏi authenticated như 0090.
revoke execute on function mua_thit_mo_vnpay(uuid) from public;
revoke execute on function vnpay_ghi_ipn(text, bigint, text, text, text, text, timestamptz) from public;
revoke execute on function vnpay_ghi_ve(text, text) from public;
revoke execute on function don_mua_thit_danh_sach(text) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function mua_thit_mo_vnpay(uuid) to anon';
    execute 'revoke execute on function vnpay_ghi_ipn(text, bigint, text, text, text, text, timestamptz) from anon';
    execute 'revoke execute on function vnpay_ghi_ve(text, text) from anon';
    execute 'revoke execute on function don_mua_thit_danh_sach(text) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function mua_thit_mo_vnpay(uuid) from authenticated';
    execute 'grant execute on function vnpay_ghi_ipn(text, bigint, text, text, text, text, timestamptz) to authenticated';
    execute 'grant execute on function vnpay_ghi_ve(text, text) to authenticated';
    execute 'grant execute on function don_mua_thit_danh_sach(text) to authenticated';
    execute 'revoke execute on function suc_khoe_so_lieu(uuid[], jsonb) from authenticated';
  end if;
end
$$;
