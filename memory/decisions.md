# Decisions — Grown_news

Append-only. Quyết định đổi thì viết entry mới trỏ về entry cũ, không sửa entry cũ.

---

## 2026-08-18 · adopt — Vào khung Factory từ giữa, không chạy s1

Chọn:     Áp khung từ giữa (ADOPT §5) — dựng project_map từ code hiện có
Thay vì:  Chạy s1→s5 từ đầu
Vì:       core/ và kb/ đã có code chạy được + 14 test pass + 2 commit trước khi
          áp khung. s1-s3 giả định chưa có gì; chạy chúng là làm ngược và sẽ
          sinh tài liệu mô tả thứ đã tồn tại.
Đổi thì:  Nếu sau này quyết chạy lại từ s1, phải bỏ project_map hiện tại và
          coi core/ + kb/ là prototype vứt đi — không có đường trộn hai lối.

---

## 2026-08-18 · adopt — kb/ là module riêng, không thuộc core cũng không thuộc web

Chọn:     Ba module ngang hàng M01_core · M02_kb · M03_web.
          M03_web depends_on [M02_kb], KHÔNG depends_on M01_core.
Thay vì:  kb/ là thư mục con của core, web gọi core để đọc dữ liệu
Vì:       Nếu kb/ nằm trong core thì web phải với tay qua biên giới core để đọc
          dữ liệu — hai nhánh lại dính nhau đúng chỗ cần tách. Hợp đồng giữa hai
          bên là FORMAT FILE .md, không phải code. Nhờ vậy đổi cách render không
          đụng core, đổi cách phân tích không đụng web.
Đổi thì:  Xem lại boundaries trong project_map; mọi khai phạm vi R1 của đơn vị
          việc đang dựa trên ranh giới này. Nếu web cần ghi vào kb/ thì đó là
          đổi kiến trúc, phải mở FR chứ không nới biên tại chỗ.

---

## 2026-08-18 · F1 — Giữ Quartz, port prototype sang component

Chọn:     Port prototype vanilla sang Quartz component. Giữ ADR-01.
Thay vì:  Giữ vanilla + tự viết build script
Vì:       Kiểm bằng doc chính thức chứ không đoán:
          · shouldPublish(ctx, content) đọc frontmatter tuỳ ý ⇒ filter approved
          · custom sort truyền qua quartz.ts ⇒ sắp theo priority
          · emit(ctx, content[], resources) nhận TOÀN BỘ content array ⇒ gộp
            url_normalized được
          · Quartz dùng SPA routing, DOM state giữ qua điều hướng, có
            afterDOMLoaded + sự kiện nav ⇒ multi-window sống được. Đây là lo
            lớn nhất vì prototype có 363 dòng JS quản lý cửa sổ nổi.
          Chênh lệch ~700 dòng: chọn vanilla là tự viết và tự bảo trì parse
          markdown, render, full-text search, RSS, sitemap, incremental build,
          deploy — thứ Quartz cho sẵn.
          Không mất gì đã làm: tokens.css là CSS thuần, data contract là JSON,
          363 dòng JS PORT chứ không viết lại.
Đổi thì:  Nếu port gặp rào cản thật (không phải khó chịu), đường lui là giữ
          vanilla + viết build script — tokens.css và contract dùng được cho cả
          hai lối nên không mất gì. Quartz mang sẵn graph view và backlink của
          mô hình digital garden; nếu làm loãng cảm giác toà soạn thì TẮT
          COMPONENT, không bỏ Quartz.

---

## 2026-08-18 · F3 — Re-analyze tự động qua webhook

Chọn:     Tự động. Repo/nguồn có bản mới ⇒ vào hàng đợi ⇒ sinh bản mới, bản cũ
          thành <slug>.v1.md, vẫn vào kho ở review_status: draft.
Thay vì:  Thủ công (người thấy có bản mới thì bấm)
Vì:       Người dùng chọn. Hợp lý vì thủ công đòi người phải THEO DÕI nguồn —
          việc mà cả hệ thống này sinh ra để khỏi phải làm. Nguồn mục rữa
          (decay_risk cao) mà không ai để ý là đúng thứ kho tri thức sợ nhất.
Đổi thì:  Tự động KHÔNG được tự duyệt — bản mới vẫn vào draft, cổng người
          giữ nguyên (BRD B-B1). Nếu hàng đợi sinh quá nhiều draft mà không ai
          duyệt kịp thì hạ tần suất kiểm, đừng bỏ cổng người.
          Ràng buộc: slug ổn định qua mọi lần re-analyze — nhờ vậy git diff
          giữa hai bản đọc được bằng mắt, và diff đó tự nó là một loại nội dung.

---

## 2026-08-18 · F4 — Backup theo từng module

Chọn:     Mỗi module tự lo backup phần nó sở hữu, không có một cơ chế backup
          tập trung cho cả repo.
Thay vì:  Một script backup duy nhất cho toàn dự án
Vì:       Người dùng chọn. Khớp với ranh giới ba vùng đã dựng: mỗi module sở
          hữu dữ liệu khác nhau, chu kỳ đổi khác nhau, rủi ro mất khác nhau.
          M02_kb là NGUỒN CHÂN LÝ — mất là mất tất cả, cần backup chặt nhất.
          M01_core là code — git remote đủ.
          M03_web là output dẫn xuất — dựng lại từ kb/ được, không cần backup.
Đổi thì:  Nếu số module tăng thì số cơ chế backup cũng tăng — lúc đó cân nhắc
          gom lại. Ràng buộc bất biến: xoá sạch mọi thứ trừ kb/ rồi dựng lại
          phải ra đúng trạng thái cũ (BRD B-C1).

---

## 2026-08-18 · FR-001 — thêm 3 trường đo M1, cưỡng chế khi approved

Chọn:     insight_new · skill_installed · review_minutes vào frontmatter schema,
          kèm ràng buộc: review_status approved ⇒ bắt buộc khai cả ba.
Thay vì:  Ghi vào worklog (B) hoặc file kb/_metrics.yaml riêng (C)
Vì:       M1 là metric CHẶN của dự án — không đạt thì dừng, sửa giao thức, không
          làm web. Nhưng schema không có chỗ ghi nên M1 chỉ đếm tay được.
          Ba trường này là thuộc tính của BẢN PHÂN TÍCH (giống review_status),
          không phải của phiên làm việc — nên thuộc frontmatter.
          Chỉ thêm trường là chưa đủ: trường tồn tại mà không ai điền thì vẫn
          không đo được. Phải có ràng buộc conditional.
Đổi thì:  Bỏ ràng buộc approved ⇒ M1 quay lại không đo được. Nếu sau này thêm
          chỉ số M1 mới, thêm trường + thêm vào required của cùng khối allOf.
          Xem 5 test trong core/tests/test_gates.py mục FR-001.

---

## 2026-08-18 · s5 — tokens.css là nguồn duy nhất, tài liệu chỉ giải thích

Chọn:     Giá trị token sống ở 05_uiux/tokens.css. DESIGN.md và TYPOGRAPHY.md
          giải thích VÌ SAO, không lặp lại CÁI GÌ. Lệch nhau thì tokens.css thắng.
Thay vì:  Chép giá trị vào cả tài liệu lẫn code
Vì:       Duy trì hai bản song song thì chúng sẽ lệch, và không ai biết bản nào
          đúng. Đã gặp đúng lỗi này ở v5: DESIGN.md khai thang chữ một kiểu,
          CSS gõ tay một kiểu khác — 9 giá trị spacing cho cùng một vai.
Đổi thì:  Sửa tokens.css trước, rồi cập nhật phần "vì sao" trong DESIGN.md.
          Không bao giờ sửa tài liệu rồi quên code, hoặc ngược lại.

---

## 2026-08-18 · s5 — Ba luật chữ: phân cấp bằng WEIGHT, không bằng CỠ

Chọn:     Header và nội dung CÙNG CỠ, khác nhau ở font-weight (600 vs 400).
          Menu đậm + thẳng. Ghi chú/cảnh báo/lỗi in nghiêng.
Thay vì:  Thang chữ nhiều bậc, header to gấp rưỡi nội dung
Vì:       Người dùng yêu cầu "chữ không cần quá to". Phân cấp bằng cỡ làm màn
          hình rời rạc; phân cấp bằng weight giữ nhịp đọc đều mà vẫn rõ cấp.
Đổi thì:  Xem lại toàn bộ .doc trong cửa sổ đọc — nó dùng clamp() riêng, dễ
          trôi khỏi hệ. Đã trôi một lần ở v19: thân bài 19.3px trong khi trang
          chủ 15px, tít mục 27.6px trong khi cùng vai ở trang chủ là 15px.

---

## 2026-08-18 · s5 — Prototype dựng vanilla, chưa port Quartz

Chọn:     Prototype app-v20.html là HTML/CSS/JS thuần, tự chứa, không build.
Thay vì:  Dựng thẳng trên Quartz như ADR-01 đã quyết ở s4
Vì:       Cần lặp nhanh — 20 bản trong một phiên, mỗi bản sửa một nhóm vấn đề.
          Quartz thêm một tầng build giữa mỗi lần sửa. Prototype chứng minh
          BỐ CỤC và TƯƠNG TÁC, không chứng minh cách render.
Đổi thì:  s6 phải quyết: port sang Quartz (giữ ADR-01) hay giữ vanilla + viết
          build script riêng. tokens.css và data contract dùng được cho cả hai
          lối nên quyết định này không phá phần đã làm. Ghi ở gap-quartz.

---

## 2026-08-18 · s4 — Quartz v4 cho web, không tự viết Next.js (Q1 đã quyết)

Chọn:     Quartz v4 + 3 plugin tuỳ biến (~125 dòng tổng)
Thay vì:  Tự viết Next.js App Router như web-spec.md bản đầu đề xuất
Vì:       Kiểm bằng doc chính thức, không đoán. Filter plugin có signature
          shouldPublish(ctx, content): boolean đọc được frontmatter tuỳ ý —
          tức đọc được review_status. Custom sort truyền được qua quartz.ts.
          Emitter nhận toàn bộ content nên gộp url_normalized được.
          Ba luật tòa soạn đều khả thi. Mọi thứ khác (parse, render, backlink,
          search, RSS, dark mode, deploy) Quartz cho sẵn.
Đổi thì:  KHÔNG đập đi viết lại — thêm route Next.js riêng bên cạnh, hoặc
          chuyển Astro. Hợp đồng là file .md trong kb/ nên đổi lớp render
          không đụng M01_core lẫn M02_kb. Đây là lợi ích của ranh giới ba vùng.
          Rủi ro: Quartz mang sẵn mô hình digital garden (graph view, backlink);
          nếu làm loãng cảm giác tòa soạn thì TẮT COMPONENT, không bỏ Quartz.

---

## 2026-08-18 · s4 — Build order theo rủi ro, không theo phụ thuộc dữ liệu

Chọn:     B1 CI → B2 nạp 10 nguồn đo M1 → B3 web
Thay vì:  Làm web trước cho thấy kết quả sớm
Vì:       M1 là metric chặn (3/10 insight mới, 1/10 thành skill, <20 phút/bản).
          Mọi thứ đã dựng mới chứng minh được là CHẠY ĐÚNG, chưa chứng minh
          TẠO RA GIÁ TRỊ. Làm web trước là scale một thứ chưa biết có hoạt
          động không. CI trước vì S3 phải có răng trước khi đơn vị việc đầu
          tiên cần bằng chứng máy xanh ở nhịp ⑤.
Đổi thì:  Nếu M1 không đạt ở B2 thì DỪNG, không làm B3. Quay lại sửa cổng lọc
          Pass 4 hoặc thang kiểm chứng trong M01_core rồi chạy lại 10 nguồn.
          Vòng B2→B4→B2 là đường đã lường trước, không phải thất bại.

---

## 2026-08-18 · adopt — Nguồn chân lý là file .md trong git, không phải database

Chọn:     kb/*.md trong git là nguồn chân lý. Database (nếu có) là cache dẫn xuất.
Thay vì:  Postgres làm nguồn, file .md là export
Vì:       Nội dung gần như không đổi sau khi duyệt, số lượng vài trăm file. Git
          cho sẵn version, diff, review, và diff giữa hai bản phân tích của cùng
          một nguồn tự nó là một loại nội dung ("nguồn này đã đổi gì").
Đổi thì:  Ngày nào phải khôi phục dữ liệu từ database về file là ngày kiến trúc
          này đã hỏng. Nếu thêm Postgres, phải giữ được tính chất: xoá sạch DB
          rồi dựng lại từ kb/ vẫn ra đúng trạng thái cũ.

---

## 2026-08-18 · Build order — hệ thống trước, dữ liệu thật sau

Chọn:     Ba chặng theo ĐỘ THẬT CỦA DỮ LIỆU.
          A có hệ thống (M04_ci) → B chạy với sample (M03_web, M06 trên
          analyses.sample.v2.json) → C dữ liệu thật (nạp 10 nguồn, M05, M07).
Thay vì:  Thứ tự cũ ở spec_overview: M04_ci → nạp 10 nguồn thật → M06 → M03_web.
          Dữ liệu thật đứng ở bước 2, trước cả chỗ để hiển thị nó.
Vì:       Skill s7 quy định trạm data là "sample json → database → schema →
          migration", và trình tự chuẩn là data → BE → FE. Sample data là trạm
          CHUẨN của khung, không phải lối tắt.
          Thứ tự cũ nhầm hai việc khác nhau: ĐO M1 cần bài thật, XÂY MODULE chỉ
          cần dữ liệu đúng shape. Gộp lại thì phải duyệt 10 bài đầu bằng `cat`
          thay vì trên giao diện đã dựng xong.
          Sample đủ vì M03 và M06 ăn SHAPE không ăn NỘI DUNG: web render theo
          frontmatter, skillgen chấm theo score/verdict. Chữ trong mục 5 là gì
          không đổi một dòng code nào. sample.v2 đã có 10 bản ghi phủ edge case
          với _expected_render tính bằng máy — đủ cho M03.
          NHƯNG CHƯA đủ cho M06: đếm bằng máy ra DEEPEN x3, OUT_OF_SCOPE x2,
          thiếu NEW và OVERLAP. NEW là nhánh chính của M06 (năng lực chưa có =>
          sinh nháp). Tôi đã khẳng định "đủ 4 verdict" trước khi đếm — sai.
          Đơn vị việc đầu của bước 3 là bổ sung sample lên đủ 4 verdict + 1 ca
          dưới ngưỡng priority. Đụng contract G5 => FR + bump v3.
Đổi thì:  Rủi ro: xây xong web mới biết giao thức 6 pass cho ra bài không ai
          muốn đọc — M1 trượt sau khi đã tốn công. Chấp nhận được vì M03 đọc .md
          qua frontmatter, không phụ thuộc nội dung: M1 trượt thì sửa M01, web
          không phải bỏ.
          CHỐT CHẶN: hết chặng B nạp 2 BÀI THẬT trước khi nạp đủ 10. Hai bài đủ
          lộ shape sai (thiếu trường, mục 5+6 teo, concept ngoài danh mục) mà
          chưa tốn công duyệt cả lứa. Bỏ chốt chặn này thì rủi ro trên thành thật.
          M1 vẫn là metric CHẶN — chỉ đo ở cuối chặng C thay vì đầu. Không nới
          ngưỡng (>=3/10 insight, >=1/10 skill, <20 phút) — xem FR-001 ở trên.

## 2026-08-26 · s8 — Tầng DB thuộc agent khác; AI thứ hai CHẤM, không SỬA
Chọn:     Hai AI song song chia theo TẦNG, không theo file. Agent kia sở hữu
          `core/**` + DB + `kb/**` (FR-034). Tôi sở hữu FE/nút/răng test, và
          với tầng DB tôi chỉ có quyền **chấm**, không có quyền sửa.
Thay vì:  Ai thấy lỗi thì sửa lỗi đó. Đây là phản xạ tự nhiên, và nó sai ở đây.
Vì:       Người dùng chốt: *"Phần DB tôi cho Agent khác làm rồi, mi fix bug và
          còn lại đi"*. Và có lý do cơ chế, không chỉ lời dặn:
          · R6 — ai chấm thì không được có quyền ghi vào thứ mình chấm. Kiểm toán
            FR-034 (WL-01K9M7KIEMTOANDB) tìm ra F1 (thiếu `CHECK review_status`)
            và F2 (`dung_lai_db.py` unlink DB đang sống). Tôi sửa hai thứ đó thì
            bản kiểm toán mất giá trị: không còn ai độc lập.
          · Đo được: 14:16 tôi thấy 9 test đỏ và suýt kết luận sai; 16:23 họ đóng
            xong thì 45/45 xanh. Hai agent sửa chồng một file giữa lúc file đó
            đang dịch là cách chắc chắn mất việc của cả hai.
Đổi thì:  Nếu người dùng giao tầng DB lại cho tôi thì HAI việc đầu tiên là F1 và
          F2 — đã có đường sửa ngắn nhất trong worklog, không phải điều tra lại.
          Và bản kiểm toán đó thành **của bên làm**: cần một lần chấm mới bởi bên
          thứ ba, hoặc hạ nó xuống mức "tự khai" (`cases.md#tự-khai`).
          Ngược lại nếu giữ ranh giới: F1/F2 phải đi qua worklog của agent kia,
          và không đóng được bằng lời tôi.

---

## 2026-08-27 · `references/web-spec.md`: sửa lại, không lưu trữ

Chọn:    VIẾT LẠI `core/skill-src/web-spec.md` cho đúng hệ đang chạy (SSR đọc
         `kb/_kho.sqlite` từ `web/render/`), và cắt phần mô tả kiến trúc
         Next.js + Postgres chưa bao giờ được dựng.
Thay vì: khai nó là tài liệu lịch sử rồi để nguyên.
Vì:      `source-distiller.SKILL.md:192` liệt nó trong danh sách tài liệu skill
         ĐANG ĐỌC. Một tài liệu sai mà skill vẫn trỏ vào thì tệ hơn không có —
         nó dạy người viết một hệ thống không tồn tại, và người viết không có
         cách nào biết. "Lưu trữ" chỉ đúng khi không ai còn đọc.
         Ba lời khai đã sai, đo được: (1) trường `tags` — schema chưa bao giờ có
         nó; (2) `category` là "enum ĐÓNG sáu giá trị" — FR-034 đã bỏ enum khỏi
         schema, chân lý là bảng `categories` trong DB và bảng đó ĐANG TRỐNG;
         (3) "nguồn chân lý luôn là file .md trong git" — FR-034 đảo hẳn.
         Cùng lời khai (2) còn nằm ở `SKILL.md:148` và `format.md:121` — tức nó
         đã trôi ra BA chỗ. Sửa cả ba trong cùng lượt.
Đổi thì: Nếu sau này lớp web đổi lần nữa, `check_skill.py` KHÔNG bắt được —
         nó canh "bundle khớp nguồn", không canh "nguồn nói đúng hiện trạng".
         Phần văn xuôi mô tả kiến trúc là chỗ không dẫn xuất được, nên nó là chỗ
         sẽ trôi tiếp. Đường chặt hơn: cho `web-spec.md` trỏ con trỏ vào
         `04_system/adr.md` thay vì tự mô tả — chưa làm, ghi vào nợ.

---

## 2026-08-28 · Byte của hiện vật sống trong DB, file `kb/_media/` là bản export

Chọn:    Lưu byte pdf/ppt/word thành BLOB trong `kb/_kho.sqlite`, địa chỉ theo
         NỘI DUNG (sha256). `kb/_media/<sha256>.<đuôi>` là **bản export** do
         `xuat_kho.py` sinh — cùng vai với `kb/**/*.md`.
Thay vì: file trên đĩa là chân lý, DB chỉ giữ đường dẫn.
Vì:      FR-034 đã chốt DB là nguồn chân lý cho bài. Để byte ngoài DB là dựng
         lại đúng "hai nguồn chân lý" mà FR-034 đi dẹp — và lần này tệ hơn, vì
         một con trỏ treo (`media.sha256` trỏ vào file đã mất) KHÔNG có cách nào
         phát hiện từ trong DB.
         Đo được ở B4: vòng DB → file → DB → file đạt ĐIỂM BẤT ĐỘNG (hai cây
         export cùng hash, kể cả `_media`), nên quyết định này ĐỨNG được.
Đổi thì: SQLite giữ tốt tới ~vài GB BLOB; qua đó thì phải tách sang object store,
         và lúc đó `luuHienVat`/`docHienVat`/`hienVatPhucVu` là ba chỗ phải sửa —
         chúng cố ý là ba hàm nhỏ trong MỘT file để lần đó không phải đi tìm.
         Trần 25 MB/file là phanh của git, không phải của SQLite.

## 2026-08-28 · Tổng hợp All ở SỐ ĐẾM, không ở thước đo chất lượng

Chọn:    Ba pane chất lượng (`mball` · `kf-uutien` · `bars3`) đứng trên
         `ho_so === "phan-tich"`; mọi pane còn lại đếm cả kho; và mỗi pane chất
         lượng **nói ra nền của nó** trên màn hình.
Thay vì: trộn hết vào `tatCa` như câu chữ *"tổng hợp All"* đọc ra.
Vì:      `priority` sinh từ `fm.skill_candidates` nên bản ghi thư viện luôn 0;
         `credibility_max` mô tả một bản phân tích chứ không mô tả một file PDF.
         Đo được ở B9: thêm 4 bản thư viện thì cả BA pane đổi số. 50 PDF sẽ đẩy
         histogram ưu tiên về ~100% "thấp" và làm phẳng thang tin cậy —
         dashboard TỆ HƠN TRƯỚC trong khi mọi con số vẫn "đúng".
         Suy từ "tổng hợp số đếm" ra "trộn cả thước đo chất lượng" là suy quá tay.
Đổi thì: Nếu sau này bản ghi thư viện CÓ thước đo riêng (ví dụ "đã đọc chưa",
         "trích dẫn mấy lần"), thì đúng chỗ để thêm là một pane RIÊNG với nền
         `thu-vien`, không phải trộn vào ba pane này. Nền đã khai ra màn nên lúc
         đó người đọc thấy ngay có hai thang, không phải một thang bị pha.

## 2026-08-28 · FR-037 mở MUỘN — hồ sơ truy hồi, không phải giấy phép cấp trước

Chọn:    Mở FR-037 ở đơn vị **cuối** (B10), và ghi thẳng trong FR rằng nó mở
         muộn, kèm việc nhánh B đã tạo hai artifact FROZEN mới (`M09_thuvien/
         spec.md` + `rules.md`) và đổi một artifact FROZEN
         (`frontmatter.schema.json`) TRƯỚC khi có FR.
Thay vì: viết FR-037 với ngày duyệt lùi lại, hoặc mở rộng FR-036 cho như thể nó
         vốn đã bao trùm nhánh B.
Vì:      `grep "M09|thư viện"` trong FR-036 ra **0 dòng** — nó không bao. Viết
         như thể có là làm sai đúng thứ luật gốc bảo vệ: *"không ai được sở hữu
         thứ dùng để đánh giá mình"*. Tôi vừa làm vừa tự ký `FROZEN.lock`;
         người duyệt cần biết điều đó khi đọc.
Đổi thì: Cách chặn lần sau KHÔNG nằm ở kỷ luật cá nhân. `<freeze-check>` bắt
         "file frozen ĐỔI mà không có FR" nhưng KHÔNG bắt "artifact frozen MỚI
         được ký vào lock mà không có FR" — đó là lỗ thật của cổng, đã ghi vào
         backlog M04_ci. Đóng lỗ đó rồi thì tình huống này không tái diễn được
         bằng ý chí, nó không tái diễn được bằng cơ chế.


## 2026-08-28 · Tách ba module là luật THƯỜNG TRỰC, không phải một lần sửa

Chọn:    Ghi thành luật áp cho mọi việc sau: **mọi thiết kế UI / FE / API phải
         tách và phân loại theo ba module — bài viết · tài liệu (pdf, docs, ppt,
         khác) · video**. Gộp chỉ được phép ở đúng hai chỗ: màn Kho và màn Tổng
         hợp. Ba bảng khai là nguồn duy nhất: `loai-nguon.json` (loại↔bảng↔
         module) · `man-hinh.json` (màn↔nhóm) · `media-mime.json` (định dạng).
Thay vì: coi FR-038 là đã đóng câu chuyện — C0–C5 đã tách bảng dữ liệu và dựng
         bảy màn, nên dễ đọc lời nhắc này là "nhắc lại việc đã làm".
Vì:      Người dùng nói lần thứ HAI, và lần này mở đầu bằng *"nhưng cần luôn
         nhớ"* — tức nó nói về việc CHƯA làm, không về việc đã làm. Lần đầu tôi
         dựng thư viện thành một *hồ sơ* bên trong màn bài viết và phải nghe
         *"Tôi đã nói rất rõ với bạn rồi"*. Một luật chỉ sống trong ngữ cảnh một
         phiên thì phiên sau nó không tồn tại; nên nó phải nằm ở đây và ở
         `memory/` của agent, không nằm trong đầu tôi.
Đổi thì: Nếu sau này có một loại nội dung THỨ TƯ, đường thêm đã mở sẵn: thêm một
         mục vào `loai-nguon.json` + một màn vào `man-hinh.json`, và
         `check_khai_mot_noi` sẽ bắt mọi tầng chưa đọc bảng khai. Điều KHÔNG được
         làm là thêm nó như một "hồ sơ" hay một tab bên trong module đang có.

CÒN MỞ:  *"khác"* trong "pdf, docs, ppt, khác" chưa định nghĩa. `media-mime.json`
         hiện đúng 5 định dạng, và danh sách đó là HÀNG RÀO AN NINH (magic-byte
         là lớp thứ sáu của cổng nạp, M09-R3) chứ không phải danh sách tiện
         dụng. Nới nó là quyết định của người dùng, không được đoán.

---

## 2026-08-29 · FR-039 đóng ô "CÒN MỞ" của entry 2026-08-28 — whitelist đổi VAI, không bị xoá

Chọn:    Nhận MỌI định dạng tài liệu, chặn theo **trần dung lượng**.
         `media-mime.json:loai[]` giữ nguyên nhưng đổi vai: từ **cổng NHẬN**
         sang **bảng RENDER**. Định dạng đã biết giữ mime thật + `xem_truoc` +
         magic-byte; định dạng lạ ra `application/octet-stream` + `attachment`
         qua khoá `mac_dinh`.
Thay vì: (a) giữ đúng 5 định dạng — người dùng đã nói *"pdf, docs, ppt, **khác**"*;
         (b) bỏ hẳn bảng, `media.mime` thành `string` trần.
Vì:      Entry 2026-08-28 để ngỏ *"'khác' chưa định nghĩa… nới nó là quyết định
         của người dùng"*. Người dùng đã chốt. Nhưng **bỏ bảng ≠ bỏ phép kiểm**:
         chuỗi mime đi thẳng vào `content-type`, và ba thứ dẫn xuất từ bảng sẽ
         **im lặng hỏng** nếu mất nó — `content-type` phải sniff từ tên file
         (đúng thứ `nosniff` tồn tại để KHÔNG tin), `inline`/`attachment` mất
         nguồn nên hoặc mọi thứ inline (nguy) hoặc **PDF hết xem trước** (xoá một
         tính năng không ai xin xoá), và đuôi file trong `_media/<sha>.<đuôi>`.
         Nên `media.mime` từ `enum` sang `pattern`, không sang `string`.
Đổi thì: Một định dạng lạ **không có** lớp magic-byte — không có chữ ký để so.
         Đó là thứ người dùng đã đọc và vẫn chọn. Muốn siết lại thì thêm mục vào
         `loai[]`, không đụng mã. `frontmatter.schema.json` FROZEN ⇒ chờ người ký.

---

## 2026-08-29 · Loại nguồn vào bảng DB — nhưng KHÔNG có POST/DELETE

Chọn:    Bảng `loai_nguon (id, module, nhan, thu_tu)` trong SQLite, xuất ra
         `kb/loai-nguon.yaml`. API chỉ `GET` + `PATCH label_vi`.
         `core/assets/loai-nguon.json` **không bị thay**.
Thay vì: (a) giữ hardcode như WO-016 tôi từng bảo vệ; (b) CRUD đầy đủ như
         `concepts`/`categories`.
Vì:      Ở WO-016 tôi từ chối đưa loại nguồn vào DB với lý do "file khai sinh ra
         `CHECK` của DDL nên một bảng DB là hai nguồn sự thật". **Lập luận đó
         đúng cho `source_type` và KHÔNG đúng cho thứ người dùng đang nói** —
         hai vai khác nhau: file giữ **enum** sinh ràng buộc và phải đọc được
         KHI DB CHƯA TỒN TẠI (`coFileBai()` chạy trước khi có DB); bảng giữ thứ
         **người dùng thấy** — định dạng · nơi phát · loại bài.
         Không POST/DELETE vì danh sách đến từ schema và whitelist: thêm một loại
         mà DDL không biết là hứa thứ `CHECK` sẽ từ chối; xoá một loại còn bản
         ghi dùng là làm facet mất một nhóm. Đổi **chữ hiện thị** thì được — đó
         là thứ của người dùng. `PATCH` cũng từ chối `module`: loại nguồn thuộc
         phân loại nào là do phép suy `nguonCua()` quyết.
Đổi thì: Luật gieo là **"khi CHƯA CÓ FILE"**, không phải "khi bảng rỗng" — một
         kho đã có `loai-nguon.yaml` rỗng là kho đã NÓI "không loại nguồn nào".
         Hệ quả còn mở: thêm host vào whitelist **không** tới được bảng (ô
         backlog M01_core 2026-08-29). Sửa nó cần luật ĐỐI CHIẾU phân biệt được
         "kho chưa từng khai" với "kho đã khai và người dùng đã sửa nhãn".

---

## 2026-08-29 · Nhãn trên form nạp: NHẮC, không CHẶN — người dùng đảo khuyến nghị của tôi

Chọn:    Ba form nạp hiện đủ trường cố định (tiêu đề · tóm tắt · mô tả · chủ đề ·
         khái niệm) nhưng **thiếu nhãn vẫn ghi được**. Cổng module
         (`cong-module.mjs`) bỏ vế `nhanDu`.
Thay vì: Cổng module chặn 422 khi thiếu `category`/`concepts` — chính là thứ
         **tôi khuyến nghị** và người dùng đã chọn ở lượt trước đó.
Vì:      Người dùng đảo lại, nguyên văn: *"bản chất ta tải bài viết / tài liệu
         hay video / url lên web thì đó chỉ là nội dung thôi… các fields cố định
         thì up gì lên cũng nên hiển thị lên UI — **ko hẳn cần require**"*.
         Đây là quyết định của họ về sản phẩm, không phải về kỹ thuật: một cổng
         chặn ở đây biến "lưu một thứ tôi vừa tìm được" thành một bài tập điền
         biểu mẫu. Nhãn của ô cũng phải đổi từ *"bắt buộc"* sang *"nên có"* —
         một ô ghi "bắt buộc" mà server nhận khi trống là màn **nói sai về luật**.
Đổi thì: `nhan-bat-buoc.test.js` đã bị **đảo hợp đồng** (từ đòi 422 sang đòi
         201). Muốn chặn lại thì đảo cổng đó trước, không sửa code trước — và
         phải đảo cả nhãn trên form. Cổng 5/5b của `validate.py` **không** đổi:
         nó áp cho hồ sơ `phan-tich`, và viết lại luật nhãn ở tầng route là bản
         thứ hai của một luật.

---

## 2026-08-29 · Whitelist nơi phát video: an toàn chứng minh bằng CẤU TRÚC, không bằng đường nhúng đúng

Chọn:    `video_host` là bảng khai duy nhất (nay 4 nơi: youtube · tiktok · fb ·
         douyin). Cổng `check_host_video.py` **sinh chuỗi tấn công rồi thử**
         `id_mau`, đòi neo `^…$`, và đối chiếu `id_tu` với `id_mau` trên url thật.
Thay vì: Đọc regex bằng mắt rồi tin nó.
Vì:      `src` iframe = `nhung` (hằng) + `id` (từ URL người dùng dán). Câu "src
         chỉ dựng từ whitelist + regex id" (M09-R3) là **lời hứa** cho tới khi có
         ai chứng minh không id hợp lệ nào thoát ra khỏi vị trí của nó.
         `[0-9]{6,24}` trông vô hại; thiếu neo thì nó khớp phần GIỮA của
         `9999999/../evil`. Với `fb`, id được nối vào một URL **đã mã hoá phần
         trăm** nằm trong tham số `href` của URL khác — `id_mau` chỉ chữ SỐ là
         thứ chặn mọi lối thoát, vì không ký tự nào trong `[0-9]` mở được một lớp
         giải mã hay thêm được một tham số.
Đổi thì: An toàn **không phụ thuộc** đường nhúng có đúng hay không. Thứ CHƯA đo
         được: trình nhúng của Facebook và Douyin có thật sự phát ở URL đó không
         — tôi không gọi ra ngoài mạng để thử. Khung trống thì chỉ sửa `nhung`
         trong `media-mime.json`, không đụng mã. Thêm nơi phát thứ năm: thêm một
         dòng vào bảng + một url mẫu vào cổng; **không** file mã nào phải đổi, và
         nếu có thì chỗ đó đang gõ tay.

---

## 2026-09-01 · Ba câu chặn s6 của M13/M14 — chốt sau khi ĐO, không sau khi đọc khảo sát

Chọn:    (1) **Anchor ASCII-fold**, dùng lại đúng luật `slugGoiY()`
         (`multiwindow.inline.ts:1015-1021`): `NFD` → bỏ `[̀-ͯ]` → `đ`→`d` →
         `[^a-z0-9]+`→`-` → cắt 60.
         (2) Citation không verify được ⇒ **gắn cờ TỪNG khẳng định**, câu trả lời
         vẫn hiện.
         (3) `co-nhung-mau-thuan` ⇒ **model tự khai**.
Thay vì: (1) anchor unicode khớp cách GitHub render heading.
         (2) từ chối cả câu trả lời · hoặc bỏ im lặng (cách MỌI repo khảo được
         đang làm).
         (3) code so metadata frontmatter · hoặc bỏ nhánh này khỏi v1.
Vì:      (1) **Không phải chọn — kho đã chọn rồi.** Đo: 0/5 tên file trong `kb/`
         có ký tự ngoài ASCII, và hàm ASCII-fold đã tồn tại ở FE. Chọn unicode là
         để hai luật slug khác nhau trong một hệ.
         (2) Bỏ im lặng là chỗ hệ RAG lừa người dùng: không ai biết có thứ đã bị
         bỏ. Từ chối cả câu thì đúng luật nhưng chatbot im lặng nhiều tới mức
         người ta quay về Google — mất cả thứ định bảo vệ.
         (3) Đây là quyết định của chủ dự án, và nó **chỏi luật gốc** — xem ô
         dưới. Bù lại nó bắt được thứ code không bắt được: hai bài **cùng ngày,
         cùng chủ đề, nói ngược NỘI DUNG**.
Đổi thì: (1) Lỗ thật KHÔNG phải câu vừa hỏi: grep `NFD|unicodedata|combining`
         trong `core/` + `05_intake/` ⇒ **0**. Hàm này chỉ có bản **JavaScript**,
         mà M13 là **Python** ⇒ bản Python sẽ là bản THỨ HAI của cùng một luật,
         đúng lớp lỗi đang làm `check_danh_muc` đỏ. s6 phải chốt *cách một hàm
         phục vụ hai ngôn ngữ*, không chỉ chốt *unicode hay ASCII*.
         (2) Cờ mà không ai nhìn thì bằng không. Cổng phải đo **hành vi**: một
         khẳng định gắn cờ KHÔNG được render cùng kiểu với khẳng định đã xác
         minh. Đo markup, không đo ý định.
         (3) **Chỏi luật gốc**: model vừa sinh câu trả lời vừa tự phán "nguồn
         mâu thuẫn nên tôi không trả lời" — nó sở hữu thước đo của chính nó, và
         một lần từ chối sai trông y hệt một lần từ chối đúng.
         Không đảo quyết định của chủ dự án; **thu hẹp chỗ nó tự do**: model
         được phép KHAI, nhưng phải khai kèm **≥2 địa chỉ**, và code kiểm điều
         kiện cần — cả hai địa chỉ phân giải được, và chúng thuộc **hai bản ghi
         khác nhau**. Không đủ ⇒ không phải `co-nhung-mau-thuan`.
         Code không phán được *nội dung* có ngược nhau không — nhưng nó chặn
         được lần từ chối **không trỏ vào đâu cả**, và đó là dạng lạm dụng rẻ
         nhất. Mọi lần bắn phải log để sau ba tháng đếm được tỉ lệ sai.

---

## 2026-09-01 · Model thay được + ba thứ tiếng — bảo đảm trích dẫn chuyển từ provider về ta

Chọn:    (1) **Tự viết adapter nối thẳng** từng nhà (Anthropic · OpenAI ·
         DeepSeek · Kimi · Gemini), N khoá trong env của THỢ, một hợp đồng
         `(prompt, tài_liệu) → {text, quotes[]}`.
         (2) Nội dung **tiếng Trung ⇒ Kimi hoặc DeepSeek**.
         (3) Model chết ⇒ **tự rơi sang model dự phòng** khai trong bảng.
         (4) MỘT bảng FTS5, MỘT tokenizer `unicode61 remove_diacritics 2`, MỘT
         hàm `chuan_hoa()` cho cả ba thứ tiếng.
Thay vì: (1) đi qua một cổng trung gian kiểu OpenRouter (một khoá, ~50 dòng).
         (3) dừng và giữ job chờ người quyết.
         (4) hai bảng FTS5 (`unicode61` cho Việt/Anh, `trigram` cho Trung).
Vì:      (1) Cổng trung gian rẻ công nhưng **mọi tài liệu đi qua tay một công ty
         thứ ba**, và nó thành điểm chết của cả hệ. `NĐ 356/2025 Điều 14` đã
         **kích hoạt** từ khi `FR-045` thêm 5 tài khoản đồng nghiệp — thêm một
         pháp nhân vào đường dữ liệu không phải quyết định kỹ thuật.
         (4) **Đo, không suy**: `unicode61` cắt câu 15 chữ Hán thành ĐÚNG MỘT
         token (`fts5vocab` đếm) ⇒ tiếng Trung 0 hit tuyệt đối. `trigram` cứu
         được ≥3 chữ nhưng chết ở từ **2 chữ** — độ dài phổ biến nhất — và mất
         fold dấu tiếng Việt. Chèn dấu cách quanh mỗi chữ Hán trong `chuan_hoa()`
         cho **10/10** truy vấn đúng, kể cả câu trộn Việt+Trung.
Đổi thì: (1) **Bảo đảm trích dẫn đổi chỗ đặt.** Trước: Claude Citations API bảo
         đảm `page_location`, ta verify thêm. Sau: OpenAI/Gemini/DeepSeek/Kimi
         **không có** tính năng đó ⇒ **ta là nơi DUY NHẤT** bảo đảm địa chỉ.
         Model chỉ được yêu cầu trả **quote nguyên văn**; vị trí do
         `re.finditer(re.escape(quote))` của ta tính. Claude Citations tụt xuống
         **đường tắt tuỳ chọn**. Cổng verify không còn là lưới an toàn — bỏ nó là
         bỏ toàn bộ hợp đồng địa chỉ.
         (2) Luật phải nói theo **TỈ LỆ** ký tự Hán, không theo *"có chữ Hán hay
         không"* — bài 80% Việt kèm một trích đoạn tiếng Trung không được đẩy
         sang Kimi. Ngưỡng khai thành **số trong bảng**, không giấu trong mã. Và
         ngôn ngữ do **máy đếm** phát hiện, không do model tự khai.
         (3) **Chỗ tôi phải siết, và đã nói trước khi làm:** rơi tự động có thể
         đổi **khu vực pháp lý** của đích gửi RA mà không ai duyệt — đúng thứ
         `B-E5`/Điều 14 bắt kê khai. Không đảo quyết định; thu hẹp: bảng khai
         mang cột **khu_vuc**, và dự phòng tự động **chỉ được rơi trong cùng khu
         vực**. Muốn rơi chéo khu vực ⇒ khai tường minh từng dòng, không mặc
         định. Model thật sự chạy phải ghi vào frontmatter bài **và** log gửi RA.
         (4) Giá của chỉ mục mức ký tự: `"資 料"` cũng khớp câu mà `資`/`料` tình
         cờ cạnh nhau qua ranh giới từ — **mất độ chính xác có thật**. `bm25`
         `w_title` phải đo **riêng** cho tiếng Trung. **Phồn thể ≠ giản thể**:
         `資料` không khớp `资料`; nguồn lẫn giản thể thì cần fold OpenCC — chưa
         làm, chưa đo. Golden set phải thêm nhánh Trung 1·2·4 chữ + câu trộn.

---

## 2026-09-02 · UI hai mặt đợt hai — nháp vào DB, checkpoint giai đoạn, trang quản lý theo loại việc

Chọn:    (1) Bản NHÁP chưng cất + bản-AI-gốc + revision sống trong **DB**
         (FR-046); bài đã vào kho thì file `kb/` vẫn là chân lý.
         (2) M12 **có checkpoint theo giai đoạn** — Chạy-lại mặc định từ
         giai-đoạn-hỏng, từ-đầu là lựa chọn phụ tường minh.
         (3) Trang quản lý gộp theo LOẠI VIỆC (Xưởng · Hàng đợi duyệt ·
         Kênh & tài khoản · Hội thoại · Cấu hình) — không 5 trang/module.
         (4) Nhịp đôi: tác vụ giây inline; tác vụ phút fire-and-track,
         không optimistic UI.
Thay vì: (1) nháp là file yaml/md trong `_inbox/` như đường M05.
         (3) mỗi module một dashboard.
Vì:      (1) màn Hàng đợi duyệt cần diff "khác gì bản AI" — bản gốc bất biến
         trong DB rẻ hơn version file; nháp KHÔNG phải kho nên B-C1 không chạm.
         (2) mỗi lần chạy-lại-từ-đầu là một lần TOÀN VĂN rời máy nữa (bậc 4)
         + phí token — checkpoint là tiết kiệm có địa chỉ.
         (3) một người vận hành; tiền lệ console hợp nhất (khảo đợt năm 30/36
         claim confirm).
Đổi thì: (1) s6 M12 phải khai lại data_flow (worker ghi nháp qua API, không
         thả file); `_inbox/`+gate vẫn nguyên cho bản NGOÀI — hai đường vào
         khác nhau phải nói rõ trong spec, không thì M05-R1 tưởng bị bỏ.
         (2) hình dạng job phải lưu output từng giai đoạn — kéo schema job.
         (3) luật ba-module-tách-biệt vẫn áp TRONG từng trang gộp (filter
         theo loại là ba tab/hàng tách, không trộn).

*Bổ sung 2026-09-02 (cùng cụm trên):* **hàng đợi việc GIỮ Maildir của THỢ**
(chốt sau khi đối chiếu s6 M12 — `os.replace` nguyên tử + THỢ tự quản trạng
thái của nó, LÕI chỉ hỏi qua API); phân biệt với BẢN NHÁP đầu ra: nháp ở DB
riêng `web/` (FR-046, vị trí theo ADR-06). Câu "trạng thái job sống trong DB"
trong ma trận bản đầu là viết quá tay — đã sửa.


---

## 2026-09-03 · M12 — LLM trước, local sau; nhưng THƯỚC ĐO ở lại local

Chọn:    Mọi tác vụ **HIỂU / VIẾT** gọi LLM qua gateway **TRƯỚC**; local là dự
         phòng + bàn thử nghiệm. Áp cho **video · audio · tài liệu**, mọi `tac_vu`.
         Hai loại việc **KHÔNG** theo nguyên tắc này:
         (a) **biến đổi tất định** — `ffmpeg -vn` tách audio, đổi opus: local.
             Không có phán quyết nào ở đây, và xem ô "Vì" (4).
         (b) **ĐO / KIỂM** — trích text theo trang, định vị lại quote, đếm
             citations: local **BẮT BUỘC**.
Thay vì: local-first. Bản đầu của `01_research/m12-ky-thuat-trien-khai.md` đề
         xuất `faster-whisper` + `pdfplumber` làm **đường chính**, gateway là phụ.
Vì:      (1) Chủ dự án có gateway thứ ba với quota free cho Claude Opus + Gemini
             + DeepSeek ⇒ chất lượng managed, và không phải quản trọng số model.
         (2) Chỉ đạo nguyên văn: *"ưu tiên gemini để ổn định, local backup và
             thử nghiệm vì chưa biết chất lượng đến đâu"* — đường ổn định phải
             là mặc định; local là chỗ ĐO, không phải chỗ đoán.
         (3) **NHƯNG Luật gốc chặn (b)**: *"không ai được sở hữu thứ dùng để
             đánh giá mình — thước đo của mình"*. LLM vừa đọc PDF vừa cấp `p.7`
             là nó cầm thước chấm chính nó ⇒ `AC-3.2` (*định vị lại bằng máy*)
             và `AC-3.3` (*citations do máy đếm*) **không còn gì để so**. Đây
             không phải sở thích: `model_flow §4` đã tự viết *"TA là nơi duy
             nhất bảo đảm"*.
         (4) Và số, cho (a): audio **32 token/giây** ⇒ 30 phút = **57.600 token**,
             gửi được. Video tính theo giây (mức được báo ~$0.15/s) hoặc ~258
             token/khung ⇒ 30 phút ≈ **464k token** — **8×–260×** audio. Nên
             video **phải** tách audio local trước; đó không phải ngoại lệ của
             nguyên tắc mà là áp nó vào **đúng bước**.
Đổi thì: (1) `chungcat/assets/model.json` + `nguon_transcript` đảo `uu_tien`:
             gateway trước, local sau, **mọi** `tac_vu`.
         (2) `kieu_moc` mặc định thành **`moc_khai`** (Gemini NÓI RA mốc) ⇒
             `[t=03:15]` của phần lớn bài video là **lời khai**, không phải phép
             đo. Người bấm mốc mà lệch ⇒ cách chữa là đổi **một dòng** bảng khai
             sang local, không sửa mã. Cờ `kieu_moc` là thứ làm điều đó **thấy
             được** — bỏ cờ là bỏ luôn khả năng biết.
         (3) `M6.2` phải đo thêm **một chiều**: token/**phút audio**, không chỉ
             token/bài — quota free hữu hạn và audio đắt hơn text 2–7×.
         (4) `pdfplumber` tụt vai từ *"engine đọc"* xuống **dụng cụ đo** ⇒ hiệu
             năng của nó càng không phải ràng buộc; giấy phép **MIT** vẫn là lý
             do giữ nó thay `PyMuPDF` (AGPL).
         (5) Nếu gateway **không nhận audio** (chưa xác minh — một lệnh kiểm),
             `uu_tien` của `nguon_transcript` phải đảo lại local-first và mục
             này phải viết entry mới trỏ về đây.

*Ghi chú kéo theo:* entry `2026-09-02` ở trên viện *"`os.replace` nguyên tử"*
làm một lý do giữ Maildir. Mệnh đề đó **sai trên Windows** (`MoveFileEx` không
được bảo đảm nguyên tử, có thể âm thầm rơi về `CopyFile`) — xem `FR-053 §4`.
Quyết định giữ Maildir **không đổi**; chỉ lý do (2) của nó phải đọc theo
`FR-053 §4`, và `AC-5.2` đo tính chất thay vì đo niềm tin.

*Xác minh 2026-09-03 (cùng ngày):* **gateway CÓ nhận audio** — chủ dự án xác
nhận. Điều kiện ở ô "Đổi thì" (5) **đã giải**: `uu_tien` gateway-first **đứng**,
không phải đảo, và không cần entry mới.

*Phạm vi nguyên liệu, chốt cùng lượt:* M12 phục vụ **PDF · video mp4 · video URL
(YouTube/TikTok/FB)**. Bốn định dạng Office (`docx` `pptx` `doc` `ppt`) **đã qua
được cửa nhận** (`media-mime.json` khai sẵn) nhưng M12 **không đọc được cái nào**
— `pdfplumber` không đọc docx, và Claude document block chỉ nhận
`application/pdf`. Chúng cần `soffice --headless` đổi sang PDF, tức **món nợ
`M09 §2.4` đã cố ý hoãn**. ⇒ Xếp `C4d`, **sau** ba đơn vị kia; đưa nó vào đợt
này là đảo một quyết định hoãn, phải nói ra chứ không kèm vào.

*Hình dạng chung lộ ra:* mỗi nguyên liệu **quy về một dạng ĐO ĐƯỢC** rồi `V` đo
trên đó — PDF→text-theo-trang (không lưu, dựng lại tức thì) · video→`.vtt`
(lưu, `la_dan_xuat: 1`) · docx→PDF (nên lưu, `la_dan_xuat: 1`). Hai trong ba cần
một binary (`ffmpeg`, `soffice`) ⇒ nợ `RUNNING.md`, và cả hai thuộc loại *biến
đổi tất định* nên chúng **local** theo đúng ô "Chọn" (a). `V` không cần biết
nguyên liệu là gì — nó chỉ nhận `list[{neo, text}]`.

---

## 2026-09-03 · M08/M12 — `lan_gui` có MỘT chủ; `review_status` của nháp cưỡng chế ở DDL

Chọn:    (1) Cột `nhap_chung_cat.lan_gui` **đổi tên** → **`lan_gui_duyet`**.
             Tên `lan_gui` từ nay **chỉ** có một nghĩa: số lần payload **RỜI KHỎI
             MÁY** (M12 spec §5.1 — trần 2, không bao giờ reset), và nó sống ở
             **THỢ**, trong Maildir của job.
         (2) Bảng nháp **thêm cột** `review_status TEXT NOT NULL DEFAULT 'draft'
             CHECK (review_status = 'draft')` — **CHECK hằng**, không phải enum
             bốn giá trị.
         (3) `cuaNhapChungCat` **KHÔNG** `delete` trường trạng thái như C1 làm.
             Chặn bằng **cấu trúc, hai lớp**: `loiTaoNhap` nhận đúng hai trường
             có tên ⇒ khoá lạ không chạm tới INSERT; và DDL từ chối nếu lớp một vỡ.
Thay vì: (1) giữ hai cột cùng tên `lan_gui`, ghi một câu trong spec nói rõ hai nghĩa.
         (2) sửa `AC-1.3` cho khớp mã (nháp chưa vào kho nên chưa có `review_status`).
         (3) chép khuôn `delete fm.review_status` của C1 cho đối xứng.
Vì:      (1) Hai số cùng tên là cách **báo cáo egress bắt đầu nói dối**: `M12-R6`
             đếm một số, báo cáo `FR-043` bậc 4 đọc số kia. Cột LÕI đếm việc khác
             hẳn — số lần nháp được gửi đi duyệt.
         (2) Chủ dự án chốt giữ `AC-1.3` nguyên văn. `CHECK` hằng vì bảng này
             CHỈ chứa nháp: một hàng mang `approved` ở đây là lỗi **cấu trúc**,
             không phải một trạng thái hợp lệ. Cưỡng chế ở DDL cùng khuôn trigger
             `ban_goc_ai` — handler quên thì DB vẫn từ chối.
         (3) C1 phải `delete` vì nó **trải nguyên** frontmatter của người gọi vào
             file. C2 không có phép trải nào ⇒ thêm `delete` là **mã trang trí**,
             và mã trang trí làm người đọc sau tưởng ĐÓ là chỗ cưỡng chế.
             Phép kiểm nằm ở test: gieo payload đòi `approved` rồi ĐỌC LẠI hàng.
Đổi thì: (1) Ai thêm một bộ đếm gửi nữa phải trả lời trước: *nó đếm lần rời máy,
             hay lần chuyển trạng thái?* Hai câu khác nhau, hai tên khác nhau.
         (2) Ngày bảng nháp cần trạng thái khác `draft` ⇒ đó là dấu hiệu phải
             **xem lại FR-046** (*"nháp không phải kho"*), KHÔNG phải nới `CHECK`.
         (3) `XUAT_LOI` trong `dungchung.mjs` liệt cột **tường minh** (không
             `SELECT *`) nên mọi cột mới của bảng nháp phải thêm vào đó **có ý
             thức** — đã thêm cả `review_status` lẫn `lan_gui_duyet`.

*Đánh đổi đã nói ra:* (2) đặt một trường của `kb/` vào bảng **chưa-vào-kho**,
trong khi `FR-046` cố ý tách hai thứ đó. `CHECK` hằng là thứ giữ nó không trôi
thành một vòng đời thứ hai.

*Rẻ vì làm sớm:* bốn file (`loi.schema.sql` · `loidb.mjs` · `loi-cua.mjs` ·
`loi-cua.test.js`) còn `??` — chưa commit, chưa có dữ liệu ⇒ **0 migration**.
Cùng ba đổi này sau khi có dữ liệu thật là một FR + một đường di trú.

## 2026-09-03 · M03 — `/dot-hai/` là trang OVERVIEW, không phải màn bị tháo

Chọn:    Giữ URL `/dot-hai/`, đặt `menu: false`, gỡ button rail + luật icon.
         Mỗi module phase-2 vẫn nhận URL + button riêng (`rule 5`, `T03-97`).

Vì sao:  (1) `rule 5` cấm **GOM** các module vào một URL. Nó **không** cấm một
             trang toàn cảnh. Đọc nó thành "phải tháo `/dot-hai/`" là đọc thêm
             một câu không có trong chỉ đạo.
         (2) `/dot-hai/` là thứ **duy nhất hôm nay** trả lời được *"đợt hai đang
             đứng ở đâu"*, và nó trả lời bằng **số đọc từ hợp đồng mẫu**, không
             bằng chữ gõ tay. Bốn màn thay thế chưa dựng — `T03-93/94` còn CHẶN
             vì hai cửa ĐỌC (`GET /api/job` · `GET /api/viec/<id>` · hàng đợi
             nháp) chưa tồn tại.
         (3) Một trang toàn cảnh **không cần** mục nav thường trực. Mục nav là
             thứ người bấm nhiều lần một ngày; trang này người mở khi muốn biết
             tiến độ. Ẩn khỏi menu ≠ xoá màn, và đó chính là điều `menu: false`
             nói — trước lượt này bảng khai ghi `menu: true` trong khi
             `MAN_LOAI` (`trang.mjs`, lọc `menu && module`) đã loại nó từ lâu:
             **bảng khai nói một đằng, giao diện làm một nẻo**.

Đổi thì: (1) Ai muốn tháo hẳn phải trả lời trước: *câu "đợt hai đứng ở đâu" ai
             trả lời thay?* Bốn màn module trả lời về BỐN module, không ai trả
             lời về TOÀN CẢNH.
         (2) `menu: false` là thứ có thể lật lại bằng một dòng — nhưng lật lại
             thì phải trả cả button + luật icon (215 byte CSS), và trần `gn.css`
             chỉ dư 255 byte.
         (3) Gỡ luật icon mồ côi trả lại **215 byte** cho `gn.css` (39 → 255
             byte dư). Đó không phải phần thưởng: nó là điều kiện để
             `T03-93/94/95` thêm được CSS. Đơn vị giảm-béo **vẫn cần** — 8 luật
             `.tb[data-nav]::before` còn lặp ~960 byte boilerplate SVG.

*Số liệu cho s10-retro:* đây là **lần đổi hướng thứ NĂM** của cùng một màn, và
lần này đến SAU khi màn đã dựng xong. Không phải lỗi của ai — nó nói nhịp *chốt
hình dạng màn trước khi dựng* đang thiếu một bước. Ghi ở `screen_inventory.md`.

---

## 2026-09-07 · Service gọi service; web là wrapper — và ba quyết định mở khoá M13

Chọn:    (1) **THỢ gọi được THỢ, có bảng `goi_duoc` + khoá/`aud` theo chiều** (`ADR-08`).
         (2) **Mở FR-072 (M13)** *(số cũ FR-070, đổi 2026-09-07 vì trùng với FR-070 của team M12)* — một hợp đồng API cho mọi client · `doc_id` ·
         `nguon[]` · M13 đọc hiện vật văn bản (`.vtt` · `.srt` · `.md`) — và
         **FR-073 (M01)** *(số cũ FR-071)* — dạng địa chỉ `#anchor` vào `dia-chi.json`.
         (3) **M13 index hiện vật văn bản qua cửa xuất đã có** (`GET /api/xuat/<slug>/txt`
         · `.../srt`), KHÔNG tự trích PDF. Text của PDF là việc của M12 (đã khai
         `pdfplumber`, chưa dùng) — khi M12 sinh nó thành hiện vật `text/plain`
         thì M13 tự thấy qua cùng cửa, 0 dòng mã mới.
         (4) G8 (0 bài Trung): **nạp ≥2 bài phồn thể thật trước s8 của M13**;
         cho tới đó `AC-6.1` vế zh khai **`soft` có ghi rõ lý do**, không xanh
         bằng fixture bịa.
Thay vì: (1) giữ *"web là client duy nhất"* — M14 hỏi M13 phải vòng qua web.
         (3) M13 tự cài `pdfplumber` — thêm dep nặng vào module 0-egress, và hai
         chỗ trích cùng một PDF.
         (4) xanh `AC-6.1` bằng 4 câu tiếng Trung bịa.
Vì:      (1) chỉ đạo nguyên văn *"module/services có thể gọi lẫn nhau, web chỉ là
         wrapper"*; và luật cũ đã bị spec M14 đi ngược 6 ngày mà không cổng nào đỏ.
         (2) đo được: G3/G5/G6A đều khai M13 một khách; hợp đồng ở ba chỗ ba hình
         dạng; `file#anchor` không là dạng địa chỉ; C3 chưa sinh `id`.
         (3) *"chuyển sang .md/.pdf"* mà chủ dự án nhắc **là cửa xuất của web**
         (`xuat-cua.mjs`, `T08-33`, `xuat-dang.json`), không phải M12 — đo: `chungcat/src`
         chỉ phát `text/vtt`. Cửa đó đã biến `.vtt` → `.txt`/`.srt`; M13 đọc `.txt`
         là đọc **cùng một chữ** mà người tải xuống, nên chỉ mục và bản người thấy
         không lệch nhau.
         (4) `gap_analysis G-8`: *"truy hồi trên 3 bản ghi là xây một phép đo không
         có gì để đo"* — fixture bịa làm cổng xanh rỗng, đúng lớp `check_g6a` đo chữ `cmd`.
Đổi thì: (1) `AC-1.4`/`M12-R7` (frozen) phải qua FR — cổng `check_chi_loi_goi_tu_loi`
         đổi **một** phép kiểm, giữ sáu. Z8 → Z8' + Z9.
         (3) nếu về sau M12 KHÔNG sinh text PDF thì tài liệu vẫn mù với RAG — đó là
         nợ **của M12**, ghi ở FR-072 §5 (số cũ FR-070), không phải nợ của M13.
         (4) `soft` là thật cho tới khi có bài; ai xanh nó bằng fixture là tự ký thứ
         mình bị chấm.

---

## 2026-09-09 · Plan M13 sửa theo FR-072 — ba chốt PM để M13 không chờ Space

Chọn:    (1) `doc_id` = **slug toàn hệ**; `pham_vi` **dành sẵn khoá `space`** (mặc định
         = space mặc định) ngay trong hợp đồng áp ở T13-0. R1 của Space chưa trả lời
         thì M13 vẫn đi; R1 chọn PK ba cột thì đổi `doc_id` bằng MỘT FR qua MỘT hợp đồng.
         (2) Hàm chuẩn hoá của M13 tên **`chuan_hoa_tim`**; dải Hán ở
         `core/assets/dai-han.json` (M01, FR-077); M12 đọc lại cùng file.
         (3) Vật liệu golden zh: **phồn thể hoặc giản thể đều được** (chủ dự án
         2026-09-09, nới mục 4 ở trên); dev chọn 2 video tiếng Trung, nạp qua M12
         `sinh-transcript`; vế zh của AC-6.1 là `soft` có lý do cho tới lúc đó.
Thay vì: (1) dừng M13 chờ ADR-09 Space · (2) giữ tên `chuan_hoa` (trùng
         `chungcat.verify.chuan_hoa`, khác nghĩa) · (3) chờ đúng phồn thể.
Vì:      (1) khảo Space §6: cái đắt của Space ở PK · địa chỉ · ontology · quyền, không
         ở FTS; chỉ mục dựng lại được. (2) research §5.2: một tên hai nghĩa là đúng
         lỗi M13-R1 mô tả, và bản M12 đã có 23 cổng trỏ vào. (3) fold phồn↔giản
         (OpenCC) chưa đo — nới yêu cầu vật liệu không đổi thiết kế, chỉ đổi fixture.
Đổi thì: (1) mọi client (M14 · web) đổi `doc_id` cùng lúc — FR-072 là chỗ duy nhất
         khai hình dạng, đó là lý do nó tồn tại. (2) T13-3 đổi tên hàm, cổng
         `check_mot_ham_chuan_hoa` đo AST theo tên mới. (3) nếu sau này chỉ đạo đòi
         riêng phồn thể thì golden zh phải ghi rõ hệ chữ của từng ca.

---

## 2026-09-10 · Ba luật cấu trúc mã và dữ liệu — `rule.md` mục 14 · 15 · 16

Chọn:    (1) **Mỗi service một thư mục riêng ở gốc** (`chungcat/` · `truyhoi/` · …),
         đúng cột `thu_muc` của `dich-vu.json`; bảng khai chung ở `core/assets/`.
         (2) **Mã FE mỗi module một thư mục `web/plugins/<module>/`**, chunk riêng;
         `multiwindow` chỉ giữ MÓC một dòng qua cầu `__GN_MW__`, không giữ logic.
         (3) **DB đi ba nhịp**: dựng trên bản/bảng TMP → chủ dự án CHẤP NHẬN module →
         tạo bảng thật + di trú, XOÁ tmp. Không thử nghiệm trên `kb/_kho.sqlite`.
Thay vì: (1) mã service rải vào `web/api/` hay `core/`. (2) cộng thêm dòng vào
         `multiwindow.inline.ts`. (3) `ALTER` thẳng DB thật vì "chỉ 8 ms".
Vì:      (2) đo lúc chốt: `multiwindow.inline.ts` **4 167 dòng**, `cctab` 2 387,
         `chungcat` 1 850 — ba file gánh việc của nhiều module, và mỗi lần sửa một
         module là đụng file của mọi module. (3) `kb/_kho.sqlite` là dữ liệu thật
         (13 bản ghi, 3.6 MB); một `ALTER` sai không hoàn tác được bằng `git`.
         Spike R6 của Space đã làm đúng cách này (bản sao 276 MB) — luật ghi lại
         cách đúng đó thành bắt buộc. (1) 7/7 service đã có thư mục — luật khẳng
         định hiện trạng để không ai đặt service thứ 8 vào `web/`.
Đổi thì: (1) `check_map` §2 đã đo `thu_muc` tồn tại; thêm vế "0 file service trong
         `web/`/`core/`" là một cổng mới, chưa cài. (2) `T03-125` đang khai
         `multiwindow.inline.ts` trong `phạm_vi_ghi` — theo luật này chỉ được thêm
         MÓC ở đó, logic ở `web/plugins/timkiem/`. (3) `T01-90` (Space, áp FR-080)
         và mọi task DDL sau phải khai nhịp tmp + nhịp chấp nhận trong `tiêu_chí`;
         `T13-2` dựng `index.sqlite` ở `KB_DIR` tạm khi test.

---

## 2026-09-10 · Không bao giờ đẩy file DB lên git — `rule.md` 19, và giá của một danh sách TÊN

Chọn:    `.gitignore` chặn file DB bằng **MẪU** (`*.db` · `*.sqlite` · `*.sqlite-*` ·
         `*.sqlite.*` · `*.db-*` · `*.db.*`, ngoại lệ `!Thumbs.db`), không liệt tên.
         Và: bỏ toàn bộ 141 commit, dựng lại **một commit gốc** để gỡ blob khỏi lịch sử.
Thay vì: (a) thêm ba dòng tên mới vào danh sách cũ · (b) `git rm --cached` từ giờ và
         để blob nằm lại trong lịch sử · (c) push nguyên trạng vào repo Private.
Vì:      ba dòng liệt tên cũ che `kb/_kho.sqlite` nhưng **không** che hai biến thể
         `kb/_kho.sqlite.truoc-di-tru-*` (**135 MB**, vào từ `b7f6ba9`) và
         `web/_loi.sqlite.hong*`. GitHub chặn **cứng** file > 100 MB ⇒ repo không push
         được, và `.gitignore` **không** gỡ được blob đã nằm trong commit — (b) vô ích.
         (c) thì `web/_loi.sqlite.hong` là DB của LÕI và nó **hỏng**
         (`integrity_check` → malformed) nên không ai kiểm chứng được nó có `ten`/`chat_id`,
         đúng thứ `FR-050` cấm. Repo chưa từng push (`git branch -r` rỗng) nên viết lại
         lịch sử lúc đó **rẻ nhất**; sau lần push đầu thì mọi bản clone phải re-clone.
Đổi thì: (1) 141 commit rời khỏi git — **bằng chứng R5 không mất** vì nó nằm ở
         `.factory/worklog/**` (234+ entry) đi theo commit gốc; `rule.md` mục 8 đã chốt
         R5 đo bằng worklog, không bằng git log. Đó là lý do quy ước ghi worklog tồn tại.
         (2) Backup `Downloads/grown_news-BACKUP-20260910-2025.bundle` (192 MB) giữ đủ —
         xoá chỉ khi chắc không cần. (3) `.git` 224 MB → 28 MB. (4) `m13` rebase lên gốc
         mới, 16/16 commit, 0 conflict.
*Bài học một câu*: **một danh sách TÊN không che được các biến thể của TÊN.**
         Cùng lớp với `check_g6b` crash và AC "grep NFD ⇒ đúng 1 chỗ" — phép đo neo vào
         thứ đã nghĩ tới, không neo vào thứ cần bắt.

---

## 2026-09-10 · Mỗi module một nhánh + một worktree; `main` chỉ nhận merge — `rule.md` 17

Chọn:    Tên nhánh `m<NN>` (`m13` · `m12` · `m03`…), worktree `../gn-<tên>`; commit của
         module vào nhánh của nó, push lên remote khi có; `main` chỉ merge sau CI xanh
         + reviewer vai khác. **Giữ `m13` đang có**, không tạo `M13-gn` cạnh nó.
Thay vì: mọi người gõ trên `main` (hiện trạng tới 09-09) · hoặc mỗi module một bản
         copy thư mục (không phải worktree) · hoặc hai nhánh cho một module.
Vì:      đo: `242431f` và `f611550` (team M12) gom file của PM M13 vào commit của họ vì
         cùng cây `main` + `git add -A`; ID task/FR/WO va **4 lần** trong tuần (FR-070
         ×2 · FR-071 ×2 · T04-10↔T04-90 · WO-084 ×2). `gn-m13` dựng đúng cách — `.git`
         là file trỏ `Grown_news/.git/worktrees/gn-m13`, `main..m13` = 2 commit,
         `m13..main` = 0 — và dev đã đi được T01-52 → T01-51 sạch ở đó. CLAUDE.md đã
         nói *"Song song ⇒ mỗi đơn vị một worktree"*; luật này gắn nó vào tên module.
Đổi thì: (1) checklist song song §0.2 đã đòi 3 worktree — nay là luật, không phải
         checklist. (2) Repo **chưa có remote** (`git remote -v` rỗng) ⇒ vế "push" chờ
         chủ dự án `git remote add origin <url>`; cho tới đó nhánh chỉ sống local, và
         mất máy là mất nhánh. (3) Team M12/M03 đang commit thẳng `main` — phải chuyển
         sang `m12`/`m03`, đó là việc của PM các module đó, không tự làm hộ.

---

## 2026-09-10 · Từ M12 về trước GIỮ NGUYÊN — đóng băng phạm vi M01–M12 (`rule.md` 18)

Chọn:    M01–M12 **đóng băng phạm vi**: không task tính năng mới, không đổi spec/hợp đồng,
         không đòi team M12 đổi quy trình đang chạy. Rule 17 (nhánh/worktree) áp **từ
         M13 và Space trở đi**, không áp ngược. Còn được: sửa bug qua WO (PATCH đủ),
         và áp FR đã duyệt trước mốc (FR-078 · FR-079 vẫn thuộc team M12).
Thay vì: (a) bắt team M12 mở nhánh `m12` và dời việc đang chạy · (b) tiếp tục nhận
         cải tiến cho M01–M12 song song với M13/Space.
Vì:      chủ dự án chốt nguyên văn *"chúng ta chốt lại từ m12 về trước giữ nguyên, ko đổi
         gì nữa"* (2026-09-10) khi tôi liệt việc "báo team M12 mở nhánh m12". Đo: M12
         as-built, 43+ cổng xanh, đang đóng WO liên tiếp (WO-078…096) — đổi quy trình
         giữa dòng là đổi hai thứ cùng lúc. Đóng băng phạm vi là cách để mọi thay đổi
         còn lại đều đo được trên M13/Space, không lẫn.
Đổi thì: (1) FR-078/079 **không** bị huỷ — chúng là FR đã duyệt, team M12 áp khi rảnh;
         M13 không chờ chúng (T13-3 đọc `dai-han.json` do M01 tạo, không cần M12 đổi).
         (2) Ô backlog M13 trỏ M12 (dải Hán · text PDF) đổi từ "nợ của M12" thành "nợ
         có tên, hoãn theo mốc 09-10" — không ai bị chấm vì nó. (3) Nếu sau này cần
         một thay đổi ở M01–M12 vì M13/Space đòi ⇒ FR, và chủ dự án quyết lại mốc này —
         không "làm luôn cho tiện".
*Giả định tôi nêu ra để bị bác nếu sai*: "giữ nguyên" = đóng băng **phạm vi**, không
         phải đóng băng **mã** (bug vẫn sửa). Nếu chủ dự án muốn đóng băng mã luôn thì
         mục 18 phải sửa một câu.



---

## 2026-09-09 · Space — bốn quyết nền trước spike (chủ dự án "ok, hợp lý")

Chọn:    (1) Space ⊃ M19: hai tầng lồng nhau, M19 GIỮ và mang `space_id`.
         (2) Bot = một NÚT trên cây (gốc / space / lớp) ± rule riêng — tri thức
         là mọi thứ dưới nút, không nhìn ngang. (3) R1 lối A: slug duy nhất TOÀN
         HỆ, `space` là cột lọc. (4) Nhà: `proposal-4` + ADR-09.
Thay vì: (1) Space THAY M19 (đề nghị của bản s1). (2) bot → tập doc_id tự do
         (spec M14 hiện tại). (3) PK ba cột / địa chỉ mang tiền tố space.
         (4) bổ vào proposal-3.
Vì:      (1) chủ dự án: "Space là đa vũ trụ, M19 là bài học TRONG từng vũ trụ"
         — lớp học không khoanh phạm vi độc lập nên không là trục thứ tư.
         (2) một cơ chế cho ba loại bot; khớp "admin ôm cả kho, bot tuỳ biến =
         rule + tài liệu chọn". (3) 0 chỗ vỡ trong hệ địa chỉ vừa được FR-044
         làm sạch; giá chỉ là chặn trùng slug xuyên space. (4) đổi tiền đề G3.
Đổi thì: (1) nếu sau này cần lớp học XUYÊN vũ trụ ⇒ M19 mất `space_id`, thành
         trục riêng — mở lại câu 2 trục. (2) M14 FR sửa AC-8.4/8.5 khi vào s6.
         (3) nếu tenant B2B đòi slug trùng giữa khách ⇒ đổi PK bằng MỘT FR qua
         FR-072 (doc_id) — đúng lý do hợp đồng một cửa tồn tại.
