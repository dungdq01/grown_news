# T03-97 — Tách URL + button menu THEO MODULE (bỏ hướng gom /dot-hai/)

> Chỉ đạo 2026-09-03 (đã vào `.claude/rule.md` mục 5): *"mỗi module cần 1 URL
> và button ở thanh menu riêng như /video/ hay /bai-viet — gom tất cả vào
> /dot-hai/ không phải ý tưởng tốt"*. Đây là đơn vị GIẤY + điều phối: chốt bảng
> route, sửa các task/mock đang theo hướng cũ. Chạy TRƯỚC T03-93/94.

## Bảng route chốt (mỗi module một URL, quản lý nằm DƯỚI url module)

| Module | URL | button menu | gồm |
|---|---|---|---|
| M12 chưng cất | `/chung-cat/` | **Chưng cất** | việc M12 (list · Cần xử lý · chi tiết checkpoint) |
| M12 nháp | `/chung-cat/nhap/` | không (vào từ /chung-cat/ + badge) — khuôn `/bai-viet/nap/` | Hàng đợi nháp FR-046 |
| M13+M14 hỏi kho | `/hoi-kho/` | **Hỏi kho** | chat + lịch sử phiên |
| M15 kênh | `/kenh/` | **Kênh** | adapter + định danh + sự kiện |
| M16 artifact | `/artifact/` | **Artifact** | việc + sản phẩm sinh |

- Mỗi URL vào `man-hinh.json` **cùng lượt dựng màn** (S18) — đợt này chỉ
  `/chung-cat/` + `/chung-cat/nhap/`; ba URL sau vào cùng backend của chúng.
- Badge cần-xử-lý trỏ mục **Chưng cất**.
- Nút ngữ cảnh trong cửa sổ đọc (T03-92) KHÔNG đổi — mặt [N] giữ nguyên.
- Ma trận §2 ("trang quản lý theo loại việc") bị chỉ đạo này ĐÈ một phần:
  ghi chú đè vào ma trận, không xoá lịch sử.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-93-man-xuong.md        # đổi thành màn /chung-cat/
  - 07_plan/M03_web/tasks/T03-94-man-hang-doi-nhap.md # URL /chung-cat/nhap/, menu=false
  - 07_plan/M03_web/tasks/T03-95-khoi-viec-dashboard.md # THIẾU ở bản đầu — xem ghi chú dưới
# T03-96 KHÔNG khai ở đây: tên file chứa chữ `test` nên check_g6b phán
# "chạm file test mà không phải đơn vị test (R1)" — đúng mẫu, sai vật (đó là
# task file). Ghi chú đầy đủ đã nằm TRONG chính T03-96.
  - 05_uiux/ma-tran-module-man.md                     # ghi chú đè §2
  - 05_uiux/prototype/sinh_dot_hai.py + dot-hai/      # sidebar mock đổi theo bảng route (sinh lại)
  - .claude/rule.md                                   # mục 5 (đã ghi)

# ⚠️ HAI THIẾU SÓT của bản đầu, đo 2026-09-03:
#
# 1 · `T03-95` VÀ `T03-96` vẫn theo hướng cũ nhưng KHÔNG có trong `phạm_vi_ghi`.
#     Đo: `grep -lE "Xưởng|xuong" 07_plan/M03_web/tasks/T03-9*.md` → **năm** file
#     (92 · 93 · 95 · 96 · 97), không phải hai. T03-95 khai *"MỘT link mở Xưởng"*
#     + *"badge trên đúng MỘT mục nav (Xưởng)"* — sau bảng route mục nav đó tên
#     **Chưng cất**, và badge trỏ sai mục là badge nói dối. T03-96 khai sở hữu
#     `web/test/xuong.test.js` — tên cổng theo màn đã đổi tên.
#     Sửa ở AC1 dưới: đo NĂM file, không đo hai.
#
# 2 · `/dot-hai/` VẪN SỐNG và bây giờ nó CHỎI rule 5.
#     Đo: `grep -n "dot-hai" core/assets/man-hinh.json` → dòng 114–117, màn còn
#     đăng ký, view `v-dothai` + tab rail còn trong hai shell, `.dh-*` còn trong
#     `prototype.css`. Rule 5 nói *"gom tất cả vào /dot-hai/ không phải ý tưởng
#     tốt"* ⇒ màn đó là **hướng bị bỏ**, nhưng không đơn vị nào tháo nó.
#     Task này KHÔNG khai `man-hinh.json`/shell/css nên nó không tháo được, mà
#     cũng không chỉ định ai tháo. Đây là **quyết định của PM/người**, không phải
#     việc agent tự làm: tháo một màn đang chạy là bỏ công T03-90 vừa nghiệm thu.
#     Ba lối: (a) giữ `/dot-hai/` làm trang overview đợt hai, mỗi module có URL
#     riêng — hai thứ cùng tồn tại, hợp rule 5; (b) tháo hẳn, mở đơn vị riêng;
#     (c) đổi `/dot-hai/` thành trang chuyển hướng. Ô nợ M03 ghi đầy đủ.

# QUYẾT PM 2026-09-03 cho mục 2 (ba lối a/b/c): chọn **(b)-TRỄ** — tháo hẳn
# /dot-hai/, nhưng Ở CUỐI đợt FE (đơn vị T03-98), sau khi /chung-cat/ sống:
# chỉ đạo gốc nói thẳng "không phải ý tưởng tốt" nên không giữ làm overview (a);
# tháo NGAY (b-sớm) thì mất mock đang xem được trước khi có gì thay; chuyển
# hướng (c) là giữ một URL chết có trang trí. T03-98 đã viết.

verifiability: hard
tiêu_chí:
  # ⚠️ BA `cmd` của bản đầu KHÔNG ĐO ĐƯỢC AC của chúng (`#cổng-không-đỏ-được`):
  #   AC1/AC3 → `check_g6b.py` đo `phạm_vi_ghi` + AC/cmd, nó KHÔNG đọc chữ trong
  #             task file và KHÔNG đọc `.claude/rule.md` ⇒ hai vế đó xanh vô căn
  #             cứ: sửa hay không sửa, cổng vẫn xanh.
  #   AC2     → `sinh_dot_hai.py` là lệnh SINH, không phải lệnh ĐO. Nó xanh khi
  #             chạy xong, kể cả khi sidebar sinh ra vẫn theo nhóm gom.
  # Thay bằng lệnh đọc được kết quả, mỗi lệnh có `đỏ_khi` rõ.
  - AC1: NĂM task file (92·93·94·95·96) hết chữ "Xưởng"/URL cũ và khai đúng
      bảng route; cấu trúc plan vẫn hợp lệ
    cmd: 'grep -lE "Xưởng|/dot-hai/xuong" 07_plan/M03_web/tasks/T03-9[2-6]-*.md; python core/tests/check_g6b.py'  # loại 97 (chứa chữ đó trong ghi-chú-đo lịch sử) + 98
    đỏ_khi: grep in ra bất kỳ tên file nào, hoặc check_g6b thêm lỗi M03
    xanh_khi: grep im lặng (exit 1, 0 file) và check_g6b không có lỗi M03 mới
  - AC2: mock dot-hai/ sinh lại — sidebar theo module, KHÔNG còn nhóm gom
    cmd: 'python 05_uiux/prototype/sinh_dot_hai.py && grep -c "chung-cat" 05_uiux/prototype/dot-hai/xuong.html'
    đỏ_khi: sinh xong mà sidebar không có mục nào trỏ `/chung-cat/` (count 0)
    xanh_khi: count ≥ 1 và không mục nào trỏ đường gom cũ
  - AC3: rule.md mục 5 tồn tại nguyên văn "URL RIÊNG"
    cmd: 'grep -n "URL RIÊNG" .claude/rule.md'
    đỏ_khi: grep exit 1 — mục 5 bị xoá hoặc viết lại mất cụm đó
    xanh_khi: in ra đúng một dòng của mục 5
