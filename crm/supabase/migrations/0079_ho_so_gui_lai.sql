-- =============================================================================
-- BEEFTOWN CRM — 0079 · NỘP HỒ SƠ HAI LẦN NHẬN LẠI ĐÚNG MÃ CŨ
-- =============================================================================
-- Chỉ mục ho_so_khong_trung_idx (0012) cho mỗi số điện thoại một hồ sơ / vị trí /
-- ngày nộp. Nên lần gọi thứ hai của CÙNG hồ sơ không tạo dòng thứ hai — nhưng ném
-- 23505, và website nói "Chưa gửi được hồ sơ. Thông tin của bạn CHƯA được ghi
-- nhận. Vui lòng thử lại." trong khi hồ sơ ĐÃ vào. Ứng viên thử lại, lại nghe
-- "chưa ghi nhận", rồi bỏ. Bốn đường gọi lần hai (rà soát 11/10/2026):
--
--   · bấm đúp khi tắt JavaScript (script chặn bấm đúp ở TrangTuyenDung.astro chỉ
--     là bổ trợ), hoặc trình duyệt gửi lại POST;
--   · ứng viên gửi lại sau câu "KHÔNG CHẮC đã ghi nhận" — database đã ghi xong rồi
--     mạng mới đứt (lib/xu-ly-form.ts);
--   · hai lượt cùng lúc: lượt sau đợi ở chỉ mục rồi ném 23505.
--
-- TỪ BẢN NÀY: lời gọi không phiên gửi lại Y HỆT nhận lại mã hồ sơ cũ, không ghi
-- gì thêm. "Y hệt" là mọi thứ ứng viên gõ, SAU khi bỏ các trường tin không hỏi
-- (0026):
--
--   vị trí · số điện thoại (đã chuẩn hóa) · họ tên (đã cắt dấu cách) · email ·
--   năm sinh · giới thiệu · kinh nghiệm · ca làm được · đã tích đồng ý
--
-- và hồ sơ cũ chưa ẩn danh, cùng ngày nộp theo giờ Việt Nam — đúng khóa của chỉ
-- mục 0012 — hoặc tạo trong 10 phút (lượt gửi 23:59 mà lần gửi lại rơi sau nửa
-- đêm: ngày nộp đã khác, chỉ mục không chặn, sẽ thành hai hồ sơ).
--
-- Biết trước: lần đầu tải CV được mà mất câu trả lời, lần gửi lại tải CV hỏng —
-- hồ sơ cũ CÓ CV nhưng website vẫn kèm câu "nộp không kèm CV" (nop-ho-so.ts không
-- biết hồ sơ cũ có gì; hàm chỉ trả mã). Cần ba sự cố liền nhau; câu sai theo
-- hướng an toàn (ứng viên gửi CV lại khi được gọi).
--
-- Không so: IP (điện thoại đổi mạng giữa hai lần gửi), nguồn utm, số giây trên
-- form. CV: lần gửi lại KHÔNG kèm CV khớp với hồ sơ cũ có hay không có CV; lần
-- gửi lại CÓ kèm CV chỉ khớp hồ sơ cũ ĐÃ có CV — hồ sơ cũ chưa có CV thì đi
-- đường cũ (chỉ mục 0012 chặn, như trước bản này). Lần gửi lại không bao giờ gắn
-- file vào hồ sơ cũ: chỉ cần biết vị trí, số điện thoại và họ tên của một ứng
-- viên là gắn được file của mình vào hồ sơ người đó (rà soát PR này). Vé của lần
-- gửi lại không bị dùng, tự hết hạn sau 15 phút (file đã tải lên nằm lại trong
-- kho, không hồ sơ nào trỏ tới — như vé của tin không hỏi CV ở 0026).
--
-- Khác bất kỳ trường nào thì đi đường cũ: chỉ mục 0012 vẫn chặn hồ sơ thứ hai
-- cùng ngày, câu lỗi không đổi. (Ứng viên SỬA hồ sơ rồi gửi lại cùng ngày vẫn
-- nhận "chưa ghi nhận" — việc riêng, không thuộc bản này.)
--
-- CHỈ ÁP DỤNG CHO LỜI GỌI KHÔNG PHIÊN (anon) — website luôn gọi như vậy, như
-- tao_dat_ban() ở 0062: một phiên đăng nhập gửi đúng nội dung hồ sơ không nhận
-- được mã của ứng viên.
--
-- THỨ TỰ ĐỔI:
--   · Tìm vị trí dời lên trước bước đếm IP, rồi lấy KHÓA TƯ VẤN theo (vị trí, số
--     điện thoại) — pg_advisory_xact_lock, nhả khi giao dịch xong. Hai lượt gửi
--     chồng nhau của cùng một người xếp hàng ở khóa này; ở READ COMMITTED, câu
--     tìm hồ sơ cũ đứng sau khóa chụp ảnh mới, nên lượt sau thấy dòng lượt trước
--     vừa ghi. Không khóa dòng vị_tri_tuyen_dung: lưu lượng bot (kể cả lượt sắp
--     bị chặn ở bước đếm IP) không làm ứng viên khác và người sửa tin phải xếp hàng.
--   · Bỏ trường tin không hỏi (0026) dời lên theo, vì khóa so sánh cần nó.
--   · Tìm hồ sơ cũ đứng TRƯỚC đếm IP, kiểm hạn nộp, kiểm vé CV: đã đủ 5 hồ sơ / IP
--     / giờ, tin vừa hết hạn, hay vé vừa hết hạn thì lần gửi lại vẫn nhận đúng mã
--     cũ — hồ sơ ĐÃ được ghi — chứ không phải "quá nhiều", "hết hạn".
--   · Bẫy bot và công tắc cổng tuyển dụng vẫn đứng đầu, như cũ.
-- Mọi câu raise exception giữ nguyên từng chữ (test khớp theo chữ tiếng Việt).
-- Chữ ký, tham số mặc định, kiểu trả về giữ nguyên — web không đổi gì.
-- Không bảng, cột, chỉ mục mới: ho_so_khong_trung_idx (vi_tri_id, sdt, ngay_nop)
-- phủ câu tìm. Không hàm mới: CREATE OR REPLACE giữ nguyên quyền gọi của hàm
-- cũ (anon gọi được), nên không cần khối CHỐT QUYỀN — như 0065. Khối đó thu hết
-- quyền anon rồi cấp lại theo danh sách: chạy sau một migration khác cấp thêm
-- hàm cho anon thì thu nhầm hàm ấy.
--
-- Kiểm thử: crm/test/test-tuyen-dung-gui-lai.mjs.
-- =============================================================================

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
  v_phieu  phieu_tai_len;
  v_ma     text;
  v_duong_dan text;
  v_cu     ho_so_ung_tuyen;
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

  -- 0079: dời lên từ sau bước đếm IP.
  select * into v_vi_tri from vi_tri_tuyen_dung
  where ma = p_vi_tri_ma and trang_thai = 'da_cong_bo';
  if not found then
    raise exception 'Không tìm thấy vị trí tuyển dụng %', p_vi_tri_ma
      using errcode = 'foreign_key_violation';
  end if;

  -- 0026: trường tin này không hỏi thì không lưu, dù có gửi lên. Form chỉ ẩn
  -- bằng CSS, nên trình duyệt cũ vẫn thấy và vẫn gửi. (0079: dời lên theo.)
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

  v_sdt := chuan_hoa_sdt(p_sdt);

  -- ---- 0079 · Gửi lại y hệt → trả lại hồ sơ cũ ------------------------------
  if not co_phien_dang_nhap() and p_dong_y then
    -- Hai lượt gửi chồng nhau của cùng một người xếp hàng ở đây; lượt sau thấy
    -- hồ sơ lượt trước vừa ghi. Khóa nhả khi giao dịch xong.
    perform pg_advisory_xact_lock(hashtextextended(v_vi_tri.id::text || '|' || coalesce(v_sdt, ''), 0));

    select h.* into v_cu
    from ho_so_ung_tuyen h
    where h.vi_tri_id = v_vi_tri.id
      and h.sdt = v_sdt
      and not h.da_an_danh
      and (h.ngay_nop = hom_nay_vn() or h.created_at > now() - interval '10 minutes')
      and h.ho_ten = btrim(p_ho_ten)
      and h.email is not distinct from nullif(btrim(p_email), '')
      and h.nam_sinh is not distinct from p_nam_sinh
      and h.gioi_thieu is not distinct from p_gioi_thieu
      and h.kinh_nghiem is not distinct from p_kinh_nghiem
      and h.ca_lam_duoc is not distinct from p_ca_lam_duoc
      -- Có kèm CV thì chỉ khớp hồ sơ đã có CV — không gắn file vào hồ sơ cũ (xem đầu file).
      and (p_ma_tai_len is null or h.duong_dan_cv is not null)
    order by h.created_at desc
    limit 1;

    if found then
      return v_cu.ma_ho_so;
    end if;
  end if;
  -- ---- Hết phần 0079 — từ đây là nguyên văn 0026 (trừ hai bước đã dời lên) ----

  if p_ip is not null then
    select count(*) into v_dem from ho_so_ung_tuyen
    where ip = p_ip and created_at > now() - interval '1 hour';
    if v_dem >= 5 then
      raise exception 'Bạn đã nộp quá nhiều hồ sơ, vui lòng liên hệ trực tiếp với nhà hàng'
        using errcode = 'check_violation';
    end if;
  end if;

  if v_vi_tri.han_nop is not null and v_vi_tri.han_nop < hom_nay_vn() then
    raise exception 'Vị trí này đã hết hạn nhận hồ sơ'
      using errcode = 'check_violation';
  end if;

  if not p_dong_y then
    raise exception 'Chưa đồng ý cho Beeftown xử lý thông tin ứng tuyển'
      using errcode = 'check_violation';
  end if;

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

comment on function nop_ho_so_ung_tuyen is
  'API công khai cho form nộp hồ sơ. SECURITY DEFINER. Bẫy bot, công tắc cổng tuyển dụng, 5 hồ sơ / IP / giờ, trường tin không hỏi thì không lưu (0026). Từ 0079: lời gọi không phiên gửi lại Y HỆT (vị trí, số điện thoại, họ tên, email, năm sinh, giới thiệu, kinh nghiệm, ca, đồng ý) cùng ngày nộp hoặc trong 10 phút nhận lại đúng mã hồ sơ cũ — không ghi gì thêm (kèm CV thì chỉ khớp hồ sơ đã có CV).';
