-- =============================================================================
-- BEEFTOWN CRM — 0078 · KẾT THÚC LƯỢT ZALO GHI LUÔN TIN ĐÃ TỚI ZALO MÀ CHƯA GHI ĐƯỢC
-- =============================================================================
-- Rủi ro còn lại sau PR #71 (web/src/lib/zalo-gui.ts): tin ĐÃ TỚI Zalo mà
-- zalo_ghi_ket_qua(da_gui) hỏng hai lần lúc gửi, rồi hỏng tiếp hai lần thử lại
-- cuối lượt (chờ 1 giây, 3 giây). Máy gọi zalo_ket_thuc_luot (0047) — hàm đó trả
-- MỌI tin cho_gui đang lấy ra mà chưa báo kết quả về hàng chờ (dang_gui_tu =
-- null) → lượt 5 phút sau gửi tin đó cho khách LẦN HAI.
--
-- ĐỔI GÌ
--   zalo_ket_thuc_luot nhận thêm p_da_gui jsonb (mặc định null): mảng
--   [{ "id": uuid, "ma_zalo": text | null }] — tin máy biết chắc đã tới Zalo mà
--   chưa ghi được. Hàm ghi từng tin đó qua ĐÚNG zalo_ghi_ket_qua(id, 'da_gui',
--   ma_zalo) — cùng luật (tin đã ở trạng thái cuối → bỏ qua; tin bị hủy giữa
--   lượt mà Zalo đã gửi → da_gui; tin cho_gui không đang gửi → ok = false) — rồi
--   MỚI trả tin chưa báo về hàng chờ. Tất cả cùng một giao dịch với việc nhả
--   khóa: lời gọi tới được database thì tin đã ghi; không tới thì không gì đổi.
--   Id không có trong bảng → bỏ qua (ok = false, "Không tìm thấy tin <id>").
--   p_da_gui sai dạng (không phải mảng, phần tử thiếu id uuid, ma_zalo không phải
--   chuỗi, quá 200 phần tử — một lô tối đa 200 tin) → 23514, cả lời gọi không
--   chạy: không ghi nửa vời.
--
--   Kết quả thêm hai khóa: "so_ghi_da_gui" (số tin vừa được ghi da_gui) và
--   "da_gui" (câu trả lời của zalo_ghi_ket_qua cho từng phần tử, đúng thứ tự).
--
--   Thêm tham số thì CREATE OR REPLACE đẻ ra bản thứ hai bên cạnh bản (text,
--   integer) — mọi lời gọi zalo_ket_thuc_luot() / (p_loi, p_quota) thành "không
--   duy nhất" và máy không nhả được khóa lượt nào nữa. Vì vậy DROP bản cũ rồi
--   tạo lại: cùng definer + search_path, kiểm vai may_zalo đầu thân hàm, quyền
--   gọi chốt lại ở cuối file (anon, PUBLIC không gọi được; authenticated gọi
--   được — vai do hàm tự kiểm, như mọi RPC máy zalo_*).
--
-- CHỮ KÝ CŨ VẪN GỌI ĐƯỢC: zalo_ket_thuc_luot(), (p_loi, p_quota) — web chưa cập
-- nhật chạy như trước. Web mới chỉ gửi p_da_gui khi có tin như trên, nên lượt
-- bình thường cũng chạy được trên database chưa có file này.
--
-- THỨ TỰ TRIỂN KHAI: file này trước, Worker (zalo-gui.ts) sau. Worker đi trước
-- thì trường hợp hiếm trên (database hỏng bốn lần liền) gọi chữ ký chưa có →
-- lỗi, khóa lượt giữ 10 phút rồi tin bị lấy lại — khách vẫn có thể nhận hai lần,
-- như trước PR này.
--
-- CHẠY CẢ FILE MỘT LẦN. DROP rồi CREATE: chạy rời từng mảnh mà mảnh CREATE không
-- chạy thì máy Zalo không kết thúc được lượt nào — mỗi lượt giữ khóa 10 phút, tin
-- đi chậm và có thể bị gửi lại. SQL Editor (dán cả file) và supabase db push chạy
-- cả file trong một giao dịch. Chạy xong `npm run doi-chieu` phải báo KHỚP.
--
-- Không bảng, cột, chỉ mục mới. Câu raise exception mới (bản tiếng Anh ở
-- web/src/lib/zalo-cau-en.ts):
--   'Danh sách tin đã tới Zalo không đúng dạng (cần mảng tối đa 200 phần tử {id, ma_zalo})'
--
-- Kiểm thử: crm/test/test-zalo.mjs nhóm 0, 8b, 11; crm/test/test-zalo-web.mjs
-- nhóm 9b (client giả), 10b (chạy thật trên PGlite: lượt sau không gửi lại).
-- =============================================================================


-- =============================================================================
-- 1 · KẾT THÚC LƯỢT — ghi tin đã tới Zalo TRƯỚC khi trả tin chưa báo về hàng chờ
-- =============================================================================
drop function zalo_ket_thuc_luot(text, integer);

create function zalo_ket_thuc_luot(
  p_loi    text    default null,
  p_quota  integer default null,
  p_da_gui jsonb   default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_muc     jsonb;
  v_id      uuid;
  v_kq      jsonb;
  v_da_gui  jsonb   := '[]'::jsonb;
  v_ghi     integer := 0;
  v_tra_lai integer;
  v_xong    integer;
begin
  if not co_vai_tro(array['may_zalo']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Zalo mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  -- Kiểm cả danh sách trước khi ghi gì: sai một phần tử thì cả lời gọi không chạy.
  -- Hai bước: SQL không hứa tính "or" từ trái sang phải, mà jsonb_array_length /
  -- jsonb_array_elements ném 22023 với thứ không phải mảng.
  if p_da_gui is not null then
    if jsonb_typeof(p_da_gui) <> 'array' then
      raise exception 'Danh sách tin đã tới Zalo không đúng dạng (cần mảng tối đa 200 phần tử {id, ma_zalo})'
        using errcode = 'check_violation';
    end if;
    if jsonb_array_length(p_da_gui) > 200
       or exists (
         select 1 from jsonb_array_elements(p_da_gui) e
         where jsonb_typeof(e) <> 'object'
            or coalesce(e ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            or coalesce(jsonb_typeof(e -> 'ma_zalo'), 'null') not in ('string', 'null'))
    then
      raise exception 'Danh sách tin đã tới Zalo không đúng dạng (cần mảng tối đa 200 phần tử {id, ma_zalo})'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Tin đã tới Zalo mà máy chưa ghi được: ghi da_gui TRƯỚC câu trả tin về hàng chờ
  -- bên dưới — sau câu đó tin không còn "đang gửi" và zalo_ghi_ket_qua sẽ từ chối.
  -- Khóa dòng trước (for update): không ai xóa được giữa lúc tìm và lúc ghi — mất dòng
  -- lúc đó thì zalo_ghi_ket_qua ném lỗi và cả lời kết thúc lượt (nhả khóa) hỏng theo.
  for v_muc in select e from jsonb_array_elements(coalesce(p_da_gui, '[]'::jsonb)) e loop
    v_id := (v_muc ->> 'id')::uuid;
    perform 1 from nhat_ky_tin where id = v_id for update;
    if found then
      v_kq := zalo_ghi_ket_qua(v_id, 'da_gui', v_muc ->> 'ma_zalo');
      if (v_kq ->> 'ok')::boolean and not (v_kq ->> 'bo_qua')::boolean then
        v_ghi := v_ghi + 1;
      end if;
    else
      v_kq := jsonb_build_object('ok', false, 'id', v_id, 'loi', 'Không tìm thấy tin ' || v_id);
    end if;
    v_da_gui := v_da_gui || jsonb_build_array(v_kq);
  end loop;

  update zalo_cau_hinh
  set dang_chay_tu = null, lan_chay_cuoi = now(), loi_cuoi = zalo_sach_loi(p_loi),
      quota_con = coalesce(p_quota, quota_con)
  where id = 1;

  -- Lấy ra mà không báo kết quả: trả lại hàng chờ (lan_thu đã tăng lúc lấy).
  update nhat_ky_tin set dang_gui_tu = null
  where ket_qua = 'cho_gui' and dang_gui_tu is not null;
  get diagnostics v_tra_lai = row_count;

  update chien_dich c set trang_thai = 'hoan_tat', ket_thuc = now()
  where c.trang_thai = 'dang_chay'
    and not exists (select 1 from nhat_ky_tin n where n.chien_dich_id = c.id and n.ket_qua = 'cho_gui');
  get diagnostics v_xong = row_count;

  return jsonb_build_object('ok', true, 'so_tin_tra_lai', v_tra_lai, 'so_chien_dich_xong', v_xong,
                            'so_ghi_da_gui', v_ghi, 'da_gui', v_da_gui);
end;
$$;

comment on function zalo_ket_thuc_luot(text, integer, jsonb) is
  'Máy Zalo: ghi da_gui cho tin đã tới Zalo mà chưa ghi được (p_da_gui, qua zalo_ghi_ket_qua), rồi nhả khóa lượt, ghi lỗi / quota, trả tin chưa báo kết quả về hàng chờ, đóng chiến dịch hết tin — một giao dịch (0047, 0078).';


-- =============================================================================
-- 2 · CHỐT QUYỀN — đúng hàm vừa tạo lại (0008 mục 6)
-- =============================================================================
-- Hàm vừa CREATE có EXECUTE cho PUBLIC (mặc định dựng sẵn của Postgres) — phải thu.
-- File này thu ĐÚNG hàm nó tạo thay vì chạy lại khối "thu hết rồi cấp lại danh sách
-- anon" của 0008: danh sách đó đang được nhánh khác đổi (0074_gioi_han_cong_khai bỏ
-- tra_cuu_dat_ban, ghi_nhat_ky_tra_cuu khỏi anon). Một bản chép cũ chạy SAU nó sẽ mở
-- lại hai hàm đã đóng và đóng hàm tra cứu mới. Kết quả cho hàm này như khối đầy đủ:
-- anon, PUBLIC không gọi được; authenticated giữ quyền mặc định của Supabase — hàm tự
-- kiểm vai may_zalo (test-zalo.mjs nhóm 0, test-an-toan.mjs kiểm).
do $$
begin
  execute 'revoke execute on function zalo_ket_thuc_luot(text, integer, jsonb) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function zalo_ket_thuc_luot(text, integer, jsonb) from anon';
  end if;
end
$$;
