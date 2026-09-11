1. luôn cập nhật các backlog + worklog mới của từng module vào worklog và project-map.yaml
2. Mọi design UI / FE / API cần tách biệt và phân loại : bài viết , tài liệu (pdf, docs, ppt , khác ) , video.
3. không được tùy tiện chỉnh sửa database.
4. Không được tự ý xóa file, chạy ác lệnh rm remove nếu ko có sự kiểm định và cho phép từ tôi.
5. Mỗi module phase-2 (chưng cất, hỏi kho, kênh, artifact...) phải có URL RIÊNG
   + button RIÊNG trên thanh menu — như /video/ hay /bai-viet/. KHÔNG gom nhiều
     module vào một URL tổng kiểu /dot-hai/. (chỉ đạo 2026-09-03; trang quản lý
     nào phục vụ một module thì nằm DƯỚI url module đó, khuôn /bai-viet/nap/)
6. Sau mỗi lần implement hay fix bug : cần và chạy test cần kill port và build & run lại
7. Yêu cầu các trạng thái và keyword tiếng việt cần viết có dấu.
8. CÁCH ĐO R5 trên cây làm việc chung (chốt 2026-09-04, chủ dự án duyệt):
   "đỏ trước" chứng minh bằng BẰNG CHỨNG trong worklog — output cổng ĐỎ chạy tại
   mốc trước-code + XANH sau, cùng entry (object = SHA/mốc giờ) — KHÔNG bằng
   trạng thái suite trên cây chung. Suite chung chỉ cần xanh lúc BÀN GIAO.
   Cổng viết-trước sống ở thư mục task (07_plan/**/T*.test.js), dời vào
   web/test/ + đăng ký npm test CÙNG LƯỢT với mã. nut-song §5 giữ nghĩa gốc.
9. CẤP ID TASK khi nhiều agent song song (chốt 2026-09-04): trước khi tạo file
   task mới phải `ls` thư mục tasks lấy số LỚN NHẤT hiện có +1, và ghi tên file
   vào worklog NGAY khi tạo. Hai agent cùng plan một module ⇒ chia dải trước
   (nhắn một dòng), không tạo trùng rồi sửa sau.
10. Luôn đảm bảo format text chuyên nghiệp và dễ nhìn nhất và ko hiển thị các exception text quá dài  - dạng comment.
11. Những thứ riêng tư, key cá nhân , private cần đưa vào .env
12. Các module / services ĐƯỢC gọi lẫn nhau; web chỉ là WRAPPER (UI + chuẩn hoá
    output cho người). Mỗi cặp gọi (từ → tới) khai trong `dich-vu.json` (`goi_duoc`),
    mỗi chiều một khoá + `aud` riêng; bên NHẬN cưỡng chế. (chỉ đạo 2026-09-07 — ADR-08;
    đảo ADR-05 luật 2 / Z8)
13. HAI PM SONG SONG (chốt 2026-09-09): PM-Space chủ trì Space (proposal-4 ·
    spike R1-R6 · ADR-09 · FR cho artifact frozen bị Space chạm); PM-M13 chủ
    trì M13. Dải ID chống va (đã va 3 lần tuần này): PM-Space lấy **T##-90+**
    ở mọi module và **FR-080+**; PM-M13 giữ dải hiện hành. HAI ĐIỂM NỐI khoá:
    `pham_vi.space` (FR-072/T13-0) và cột `space` của `kho-delta` (T08-35) —
    đổi phải qua FR VÀ báo PM kia. Ai lấy số nào ghi worklog NGAY lúc tạo file.
14. MỖI MODULE/SERVICE MỘT THƯ MỤC RIÊNG ở gốc repo (chốt 2026-09-10): mã của
    service sống trong thư mục mang tên nó — `chungcat/` · `truyhoi/` · `chatbot/` ·
    `artifact/` · `kenh/` · `cong/` — đúng cột `thu_muc` của `core/assets/dich-vu.json`
    (7/7 đã có). Không đặt mã service vào `web/`, `core/`, hay thư mục của service
    khác. Bảng khai dùng chung (dải Hán, địa chỉ, dịch vụ) ở `core/assets/`, không
    ở thư mục một service — hai THỢ đọc một bảng ở LÕI, không THỢ nào sở hữu luật
    của THỢ kia.
15. MÃ FE CỦA MỖI MODULE MỘT THƯ MỤC RIÊNG TRONG `web/plugins/<module>/` (chốt
    2026-09-10). Đo lúc chốt: `multiwindow.inline.ts` **4 167 dòng**, `cctab` 2 387,
    `chungcat` 1 850 — ba file gánh việc của nhiều module. Từ nay: module mới ⇒
    `web/plugins/<module>/src/<module>.inline.ts` (khuôn `chungcat/` · `napvideo/`),
    chunk nạp riêng; chỉ ĐỂ LẠI trong `multiwindow` một MÓC (một dòng gọi qua cầu
    `__GN_MW__`), không để logic. Sửa file 4k dòng ⇒ tách phần sửa ra thư mục
    module trước rồi mới sửa — không cộng thêm dòng vào đó.
16. DATABASE: THỬ TRÊN TMP, CHỦ DỰ ÁN CHẤP NHẬN, RỒI MỚI BẢNG THẬT (chốt 2026-09-10):
    mọi thay đổi DDL/di trú/bảng mới đi ba nhịp — (1) dựng trên BẢN TẠM (bản sao
    `kb/_kho.sqlite` ở `KB_DIR` tạm, hoặc bảng `tmp_<ten>` cạnh bảng thật) và chạy
    đủ cổng ở đó; (2) chủ dự án xem kết quả thật và CHẤP NHẬN module; (3) mới tạo
    bảng thật + di trú, rồi XOÁ bản/bảng tmp — kho sạch, không để tmp sống qua đêm.
    `kb/_kho.sqlite` (3.6 MB, 13 bản ghi) là dữ liệu thật của chủ dự án: KHÔNG
    `ALTER`/`INSERT` thử nghiệm lên nó, kể cả "chỉ 8 ms". Chỉ mục dẫn xuất
    (`truyhoi/index.sqlite`) không phải DB chính nhưng vẫn dựng ở thư mục tạm khi
    test. Khớp mục 3 (không tùy tiện chỉnh DB) — mục này nói CÁCH được phép chỉnh.
17. MỖI MODULE MỘT NHÁNH + MỘT WORKTREE, `main` CHỈ NHẬN MERGE (chốt 2026-09-10):
    tên nhánh `m<NN>` theo số module (`m13`, `m12`, `m03`…; `space` là ngoại lệ vì
    không đánh số), worktree `../gn-<tên>` (`../gn-m13`, `../gn-space`). Mọi commit
    của module đi vào nhánh của nó và ĐƯỢC PUSH lên remote khi có; `main` không nhận
    commit trực tiếp — chỉ merge sau CI xanh + reviewer là vai khác nhánh đó, một
    nhánh một lúc. Vì sao: cùng cây `main` đã GOM commit của người khác 2 lần trong
    một ngày (242431f · f611550 — `git add -A` quét cả bàn) và va ID 4 lần trong
    tuần. Không tạo nhánh thứ hai cho cùng module (vd `M13-gn` cạnh `m13`) — hai
    nhánh một module là hai chỗ sẽ lệch. Đo lúc chốt: `m13` đã có 2 commit đúng
    cách. **Cập nhật 2026-09-11**: remote ĐÃ CÓ —
    `https://github.com/dungdq01/grown_news.git`; `main` và `m13` đã push. Dev
    push nhánh của mình (`git push -u origin m<NN>`) — không cần xin, vì nó
    không đụng `main`. Đừng để commit dồn nhiều ngày trên một máy.
18. TỪ M12 VỀ TRƯỚC GIỮ NGUYÊN — KHÔNG ĐỔI GÌ NỮA (chủ dự án chốt 2026-09-10, nguyên
    văn *"chúng ta chốt lại từ m12 về trước giữ nguyên, ko đổi gì nữa"*): M01–M12 đóng
    băng PHẠM VI. Không mở task tính năng mới, không đổi hợp đồng/spec, không đòi team
    M12 đổi quy trình đang chạy (họ commit thẳng `main` — mục 17 KHÔNG áp ngược cho
    việc đã xong; áp từ M13 và Space trở đi). Còn được: sửa BUG qua WO (PATCH đủ
    10 bước), và áp FR đã duyệt trước mốc này (FR-078 · FR-079 vẫn thuộc team M12,
    làm khi họ rảnh — không phải nợ của M13). Việc mới cho M12 ⇒ mở FR, chủ dự án
    quyết lại mốc này. Mục 14–16 vẫn áp cho mã MỚI viết trong M01–M12 khi sửa bug.
19. KHÔNG BAO GIỜ ĐẨY FILE DB LÊN GIT (chốt 2026-09-10, chủ dự án: *"chặn push các
    file .db lên git"*). `.gitignore` chặn bằng **MẪU**, không liệt tên:
    `*.db` · `*.sqlite` · `*.sqlite-*` · `*.sqlite.*` · `*.db-*` · `*.db.*`
    (ngoại lệ `!Thumbs.db`). Export `.md`/`.yaml` của kho vẫn vào git như cũ
    (FR-034, một chiều DB→file) — mẫu chỉ chặn chính file DB.
    **Vì sao là MẪU chứ không phải danh sách tên**: ba dòng liệt tên cũ che
    `kb/_kho.sqlite` nhưng KHÔNG che `kb/_kho.sqlite.truoc-di-tru-*` và
    `web/_loi.sqlite.hong*` — hai biến thể lọt vào lịch sử, một bản **135 MB**.
    GitHub chặn CỨNG file > 100 MB ⇒ repo không push được, và `.gitignore` KHÔNG
    gỡ được blob đã nằm trong commit. Giá phải trả: bỏ toàn bộ 141 commit, dựng
    lại một commit gốc (2026-09-10, backup ở `Downloads/grown_news-BACKUP-*.bundle`).
    Một danh sách TÊN không che được các biến thể của TÊN.
    Ba việc kèm theo: (a) thấy file DB trong `git status` ⇒ DỪNG, `git rm --cached`,
    **không** commit rồi xoá sau — blob vẫn ở lại; (b) `web/_loi.sqlite.hong*` là DB
    của LÕI và nó HỎNG nên không ai kiểm chứng được có `ten`/`chat_id` — đúng thứ
    `FR-050` cấm; (c) file > 10 MB bất kỳ ⇒ hỏi trước khi add.
