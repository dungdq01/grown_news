# T03-5 — đơn vị TEST cho M08_api (R1: test là đơn vị riêng)

phạm_vi_ghi:
  - web/test/**
verifiability: hard
tiêu_chí:
  - AC1: vòng CRUD + ca âm trên kho tạm (không đụng kb/ thật)
    cmd: node web/test/api-crud.test.js
  - AC2: cổng chuyển trạng thái — M1/reject_reason/bảng chuyển
    cmd: node web/test/api-status.test.js
  - AC3: recycle byte-equal + restore
    cmd: node web/test/api-recycle.test.js
  - AC4: guard tĩnh web/api/** — ghi kb chỉ trong ghiSauValidate, có spawn validate --strict, không listen/0.0.0.0/unlink-kb, không default trường quyết định
    cmd: node web/test/api-guard.test.js
  - AC5: bundle tĩnh vẫn read-only, whitelist FE literal đóng — sửa CÓ CHỦ ĐÍCH no-write-path
    cmd: node web/test/no-write-path.test.js
  - AC6: ma trận 16 cặp chuyển trạng thái đúng bảng M02 §2.2; PUT y nguyên trên bài approved KHÔNG hạ trạng thái; DELETE 404/400/412 và file còn nguyên byte; POST chặn source_type/slug từ payload
    cmd: node web/test/luong-day-du.test.js
  - AC7: luồng nạp end-to-end POST /api/inbox → _inbox/ → gate → kb/ — 4 cổng chặn trước khi ghi, traversal không thoát thư mục, nộp trùng tên ⇒ 409 và bản đầu nguyên byte, gate không ghi đè bài đã có trong kho
    cmd: node web/test/luong-nap-bai.test.js
  - AC8: bốn trạng thái đủ bốn — mọi trạng thái BANG_CHUYEN cho → approved đều có nút Duyệt, có mặt ở màn Chờ duyệt, được đếm vào ô "chờ duyệt", có luật CSS riêng; mọi nút hành động có title nói hệ quả
    cmd: node web/test/bon-trang-thai.test.js
  - AC9: (FR-027) hệ kính — bốn thứ của ui_guide §4 đủ cả bốn trên .pn, số lớp backdrop-filter trong ngưỡng khai, mọi blur dùng var(--blur-lift), ảnh nền ≤500 KB không trùng
    cmd: node web/test/he-kinh.test.js
  - AC10: (FR-027c) rail trái 78px — .top là cột fixed, .wrap bù đúng 78px, icon vẽ bằng mask trong CSS không inline HTML, kẹp kéo cửa sổ đổi trục, cả 6 màn cùng khung
    cmd: node web/test/rail-trai.test.js
  - AC11: (FR-027e) Trang chủ đúng cách trình bày đã chốt theo trang-chu.html — khung nội dung HAI lớp (.wrap chỉ bù rail, .mid giới hạn bề rộng), .brk-g ĐÚNG 2 cột + perspective, thẻ nổi bật xếp chồng bằng grid-area, KPI 2×2, khối 3D đủ ba tầng transform và 9 token mặt ở CẢ HAI chế độ; ba quirk của bản tham khảo (gọi reveal lúc load · một cờ hover dùng chung · style-hover bịa) KHÔNG lọt vào; mọi vòng tự chuyển đủ ba chốt (hover · document.hidden · reduced-motion tắt hẳn) và có nút bấm tay
    cmd: node web/test/trang-chu-layout.test.js
  - AC12: (FR-027e) nam man con lai dong bo thang — moi gia tri >=8px va moi font-size di qua token, token-only mien theo GIA TRI <8px khong mien ca file; moi dai .mb nam trong dung man cua no va noi su that RIENG (khong lan cau ky cua dai khac); khoi 3D chi o man co PHAN BO va dung class khong dung id; ba so cua man Nap nguon khop nguon that (9 cong dem lai tu validate.py); ba truong M1 khop status.mjs
    cmd: node web/test/cac-man-con-lai.test.js
  - AC13: (FR-027g) trang chuyen huong /cho-duyet/ KHONG nap CSS/JS va <=1KB — ngoai le duoc KHAI chu khong bi bo qua, vi "trang khong co CSS" cung chinh la trieu chung cua loi ma css-applied sinh ra de bat
    cmd: node web/test/css-applied.test.js
  - AC14: (FR-027h) cua so doc — thanh tien do do .bk-b, rAF throttle, go listener, reduced-motion CHI bo transition (KHONG an vi no la THONG TIN chu khong phai hieu ung); cot neo co 4 truong metadata khong fetch; muc 6 Tinh tuy dung o h2 ke tiep va so ve bang CSS counter; VA phan nen da dung con nguyen (luoi bat doi xung, muc luc dinh, 4 thu cua kinh, chan do dai dong)
    cmd: node web/test/cua-so-doc.test.js
  - AC15: (FR-026 ve B+B2) vong doi mot bai chay LIEN MACH: tao -> sua -> duyet -> sua lai (=> edited) -> duyet lai -> bo duyet (=> draft, M1 BI BO, duyet lai HOI LAI M1) -> loai -> dua lai vao hang cho (reject_reason BI BO) -> chuyen ra thung rac -> chuyen ve kho BYTE-EQUAL. Moi buoc kiem CA ma tra ve VA trang thai tren dia. Va BANG_CHUYEN khong con trang thai nao thieu duong ra.
    cmd: node web/test/vong-doi-bai.test.js
  - AC16: (FR-028b) CRUD danh muc chay that ca bon duong cho CA HAI loai nhan, tren kho tam + schema tam; xoa lan hai khong tra 200; PUT van dong
    cmd: node web/test/danh-muc-crud.test.js
  - AC17: (FR-030) man Danh muc mot thuc the MOT hinh dang — nhan dang dung va chua dung deu la hang .rc-r, va CA HAI ban song sinh (emitter + barCptFE) in cung cau truc, khong ban nao con thanh .bw. Ban emitter dung khong du: nguoi dung them mot nhan la danh sach ve lai tu API, va no se LANG LE quay ve bar
    cmd: node web/test/man-danh-muc.test.js
  - AC18: (FR-030) so hang trong #cb khop so nhan dem duoc, va sap GIAM DAN theo so bai
    cmd: node web/test/filter-counts.test.js
  - AC19: (FR-031) moi duong /api/articles/... trong BUNDLE DA BUILD khop mot hinh dang route doc TU router.mjs; khong duong nao ghep bang `.slug` tran; va server that xac nhan route doi doan `type`. Bug that: FE goi /api/articles/<slug> trong khi route la /api/articles/<type>/<slug> => BON nut bien tap chet im lang, va 41 test xanh vi vong-doi-bai goi API truc tiep bang duong tu go dung
    cmd: node web/test/duong-api-khop-route.test.js
  - AC20: (FR-031) danh muc RONG la trang thai hop le; GET khong `limit` tra DU muc; `?force=1` moi xoa duoc nhan dang dung va tra DANH SACH bai bi bo lai (kem phep kiem chung minh he qua that: bai do PUT => 422); khoi phuc `{slug_moi}` giu ca hai ban va sua `slug` trong frontmatter theo ten file
    cmd: node web/test/danh-muc-phan-trang-ep-xoa.test.js

phụ_thuộc: T08-1

## Nguyên tắc

- Kho tạm ở `os.tmpdir()` (pattern `_seed.mjs` — thư mục trong repo bị gitignore
  nuốt), spawn `node server.mjs` với `KB_DIR`/`RECYCLE_DIR`/`INBOX_DIR`/`API_PORT`
  trỏ tmp, đợi `/api/health`. KHÔNG test nào đụng `kb/`, `_recycle/`, `_inbox/` thật.
- Sửa `no-write-path.test.js` giữ triết lý "nới đúng chỗ + siết chỗ mở":
  whitelist literal đóng /api/inbox · /api/articles · /api/recycle — thêm đường
  thứ tư là đỏ; server.mjs vẫn cấm chữ `kb` ngoài comment; khối plugins nguyên.

## Rule áp vào

Răng S3 của cả 5 rule M08 + M03-R2 bản FR-011.
