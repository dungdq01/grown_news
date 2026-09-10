# M18_nguoidung — rules

> Sáu rule: **ba `S3`** (có lệnh, đỏ được) và **một `S4`** (hậu kiểm bằng mắt).
>
> **Vòng đời của `M18-R1` và `M18-R3` trong một ngày** — ghi ra vì nó là ví dụ
> gọn nhất của `R3` chạy đúng:
>
> | | |
> |---|---|
> | khai `S3` lúc viết spec | lệnh chưa tồn tại ⇒ **rule nói sai về chính nó** |
> | `T04-6` bật răng cho `check_rule_surfaces` | cổng **đỏ đúng hai rule này** |
> | hạ xuống `S4` | *"`hard` mà không có lệnh chạy được ⇒ **nó là `soft`**"* |
> | `T08-11` dựng DDL, `T08-12` dựng thao tác | thứ cần đo **có thật** |
> | promote lại `S3` | lệnh `cd web && node test/loi-cua.test.js` **chạy được** |
>
> Điểm đáng giữ: hạ xuống `S4` **không phải nới lỏng** — nó là bước làm cho
> `rules.md` ngừng nói dối, và nó tạo ra một nghĩa vụ có địa chỉ thay vì một
> lời hứa. Không có bước hạ thì hai rule đó sẽ ở lại `S3` với một lệnh không
> tồn tại, và **không cổng nào biết**.

```yaml
- id: M18-R1
  vi_phạm: "đánh dấu ma_moi đã dùng bằng SELECT rồi UPDATE (hai câu), thay vì một câu UPDATE...WHERE dung_luc IS NULL + changes()"
  bề_mặt: S3
  lệnh: cd web && node test/loi-cua.test.js
  đỏ_khi: "hai request dùng CÙNG một mã đồng thời mà CẢ HAI thành công; hoặc grep thấy một SELECT ma_moi đứng trước một UPDATE ma_moi trong cùng handler mà không có BEGIN IMMEDIATE"
  xanh_khi: "hai request đồng thời => đúng MỘT thành công, và dung_luc mang thời điểm của lần thành công đó"
  why: >
    SELECT roi UPDATE la hai cau, va giua hai cau co mot khe. Voi 5 tai khoan
    thi khe do gan nhu khong bao gio trung — VA DO CHINH LA DIEU LAM NO NGUY
    HIEM: no khong do trong test tay, chi do vao dung ngay hai nguoi bam cung luc.
    Hau qua khong phai "mot loi dang nhap": mot ma moi dung duoc HAI lan la hai
    chat_id buoc vao cung mot tai khoan, tuc mot nguoi la doc duoc ca kho.
    Cung hinh dang voi phep dem changes() da dung o M08 (chuyenSangRac).

- id: M18-R2
  vi_phạm: "một dòng audit_log chứa giá trị bí mật — mã mời đã thử, hoặc phien.id"
  bề_mặt: S3
  lệnh: python core/tests/check_db_dung_cho.py
  đỏ_khi: "tìm thấy giá trị cột ma của bảng ma_moi, hoặc phien.id, trong kb/_audit.jsonl hoặc trong bất kỳ file export nào"
  xanh_khi: "audit_log ghi SU KIEN (ai · lúc nào · thành công hay không) mà KHÔNG kèm giá trị bí mật; và ba bảng phải-xuất đều có đường export còn hai bảng ma_moi/phien thì KHÔNG"
  why: >
    ADR-06 (c). Log KHONG HET HAN, con ma thi co. Chep ma vao log la bien mot bi
    mat ngan han thanh mot bi mat vinh vien — va la mot bi mat nam trong git.
    Vach chinh: TRANG THAI ("ma X con hieu luc") khong xuat; SU KIEN ("14:03 tai
    khoan 3 dung mot ma moi") thi xuat. Log ton tai de phat hien DANG BI DO,
    khong phai de luu bi mat.
    Ve thu hai cua cung rule: mot bang GOC khong co duong export la mot bang MAT
    khi o cung hong — B-C1 giai backup bang export-vao-git, nen khong export
    nghia la khong backup.

- id: M18-R3
  vi_phạm: "đọc cột nguoi_dung.vai để quyết định ở NHIỀU HƠN MỘT chỗ, hoặc đưa `duyet-bai` vào bảng quyền"
  bề_mặt: S3
  lệnh: cd web && node test/phan-quyen.test.js
  đỏ_khi: "đếm chỗ đọc `.vai` trong web/api/** khác 1; hoặc `duyet-bai` xuất hiện trong bảng QUYEN; hoặc một `viec` chưa khai quyền mà vẫn làm được"
  xanh_khi: "đúng MỘT chỗ đọc `.vai` (trong dungchung.mjs), `duyet-bai` KHÔNG có trong bảng QUYEN, và `viec` chưa khai ⇒ DENY"
  why: >
    DOI VAI 2026-09-02 (FR-051). Ban cu: "cam dung `vai` lam cong chan" — dung
    khi `vai` la mot cot TRONG. FR-051 chot ma tran nen `vai` CO tac dung, va
    rule cu phai doi thay vi bi xoa.
    Ve CON LAI, va no la ve quan trong hon: mot chokepoint. Neu phep kiem quyen
    rai thanh nhieu `if (vai)` thi khong ai tra loi duoc "ai lam duoc gi" bang
    mot lan doc file, va mot cho quen kiem la mot lo khong ai thay.
    Ve THU HAI: `duyet-bai` KHONG duoc vao bang quyen. B-B1 phai o MA. Dieu nay
    quan trong hon khi chi dao "phan quyen thanh setting on/off sua duoc tren
    web" (FR-051 §7) duoc thi cong: luc do bang QUYEN thanh DU LIEU, va moi thu
    trong no thanh SUA DUOC TU MOT FORM. `duyet-bai` khong o trong bang nghia la
    no khong thanh sua-duoc.
    Ve THU BA: DENY mac dinh. Them mot thao tac moi ma quen khai quyen => no
    KHONG CHAY DUOC, chu khong phai AI CUNG CHAY DUOC. Chieu nguoc cua
    CVE-2026-47713.
    Fail-open nay bi cam bang CAU TRUC: vai NOT NULL DEFAULT 'dong_nghiep' +
    CHECK enum => ca `vai = null` KHONG DUNG DUOC NUA.
    M17-R6 van song va khong bi thay: no chan theo DUONG, duocLam chan theo
    NGUOI. Hai lop, hai chieu.

- id: M18-R4
  vi_phạm: "một đơn vị việc của M18 khai phạm_vi_ghi trỏ vào file mã, thay vì theo boundary của module chủ"
  bề_mặt: S4
  why: >
    M18 la module NGANG — cung hinh dang M09/M10/M11. No KHONG so huu file ma
    nao: be = 06_modules/M18_nguoidung/**, fe = null. DDL + bay cua o M08_api
    (FR-047), xac thuc bien o M17_cong, man admin o M03_web.
    Nen moi don vi viec phai khai pham_vi_ghi theo boundary cua MODULE CHU, va
    check_g6b kiem dieu do. Khai theo M18 thi pham_vi_ghi tro vao mot thu muc
    chi chua tai lieu — R1 do o muc nhanh se KHONG THAY diff that nam o dau.
    S4 chu khong S3: bien theo VIEC, khong phai theo path tinh, nen may khong
    tu quyet duoc — reviewer doc task file va doi chieu.

- id: M18-R5
  vi_phạm: "một khoá setting ghi được mà KHÔNG có trong allowlist O_SUA_DUOC; hoặc `duyet-bai`/`vai` xuất hiện trong tập ô sửa được; hoặc cửa ghi setting nhận một object"
  bề_mặt: S3
  lệnh: cd web && node test/cai-dat.test.js
  đỏ_khi: "gieo mot khoa la ma tao duoc hang trong cai_dat; hoac `duyet-bai` co trong QUYEN/O_SUA_DUOC; hoac cua ghi nhan object thay vi (khoa, gia_tri); hoac gia_tri khong phai boolean"
  xanh_khi: "chi khoa trong O_SUA_DUOC ghi duoc, gia_tri la boolean, cua ghi nhan dung hai tham so, va `duyet-bai`/`vai` KHONG o dau trong tap sua duoc"
  why: >
    ADR-07 + B-B6 + security_baseline §9. Bon ve, moi ve mot CVE co that:
    (1) CVE-2024-3283 — mot cua SETTING doi co `multi_user_mode` (che do xac
        thuc) => TAO DUOC MOT ADMIN. Ba tang khac nhau, MOT cua.
    (2) CVE-2026-9796 — Keycloak neo luat vao TEN VAI sua duoc; 14 thang sau ra
        TOCTOU doi ten de thang cuoc dua, CONG mot regression pha vai `admin`
        hop phap cua tenant. => enum khoa bang DDL CHECK, khong phai chuoi.
    (3) CVE-2026-31942 — LibreChat mat API key cua MOI NGUOI vi
        `{ userId: req.user.id, ...body }`. Thu tu spread do la ca lo hong.
        => cua ghi KHONG nhan object.
    (4) CVE-2026-17601 — mot o MO RA TAT CA CAC O. => guardrail phai tu neu ten
        minh trong deny cua chinh no.
    ALLOWLIST chu khong denylist: CVE-2018-8007 di vong mot blacklist. Va
    Supabase cho thay co invariant BAT KHA dien dat o tang du lieu ("update hang
    cua minh nhung khong cot nay" khong viet duoc trong RLS) — nen tap o phai
    khai o tang MA.
    VE NEN, re hon ca bon: gia_tri la BOOLEAN. Khong o nao duoc dien giai thanh
    duong dan/lenh/URL/ma. Gia neu lam nguoc: CVE-2024-3104 (9.8),
    CVE-2024-3028/3025 (truong setting => XOA DUOC FILE SQLITE).

- id: M18-R6
  vi_phạm: "`duocLam` tra ve mot thu khac `boolean`, hoac cua ghi setting chi kiem `ai ghi` ma khong kiem `khoa nao` va `gia tri nao`"
  bề_mặt: S3
  lệnh: cd web && node test/cai-dat.test.js
  đỏ_khi: "typeof duocLam(...) !== 'boolean'; hoac cua ghi setting qua voi mot khoa ngoai allowlist khi danh tinh dung"
  xanh_khi: "duocLam tra boolean DONG BO, va cua ghi tra loi CA BA cau: ai ghi · khoa nao · gia tri nao"
  why: >
    HAI ve, hai CVE.
    (a) CVE-2026-77426 (Unleash): mot `await` bi quen bien Promise thanh TRUTHY
        => MOI phep kiem thanh `true`. duocLam hom nay dong bo — nhung DO MAY,
        va cong duy nhat bat duoc la KIEU TRA VE. Mot rule kiem "co goi duocLam
        khong" se XANH tren ca do.
    (b) LiteLLM CO chokepoint nhung no gac ROUTE, khong gac TRUONG. "Mot
        chokepoint" la dieu kien CAN, khong DU. duocLam hom nay tra dung mot
        cau ("ai ghi hang nao"); rule nay doi hai cau con lai.
    Ghi ra vi day la lop loi TOI DA MAC: dong FR-051 khai "phan quyen chay"
    trong khi 0 route goi duocLam. Cong Y3 dem so cho DOC `.vai` = 1 — dung,
    nhung do la do SU TON TAI cua chokepoint, khong do HIEU LUC cua no.
```

## Quan hệ với rule tầng trên

`M18-R2` là **hình chiếu của `M08-R6`** xuống đúng bốn bảng M18 sở hữu. `M08-R6`
nói *"dữ liệu gốc không vào `kb/_kho.sqlite`, và ba bảng phải-xuất phải có đường
export"*; `M18-R2` thêm vế **không được ghi bí mật ra ngoài**. Hai rule cùng một
lệnh — cố ý: một cổng đọc một bảng khai thì rẻ hơn hai cổng đọc hai bảng khai.

`M18-R3` **không thay** `M17-R6`. `M17-R6` lột `review_status` khỏi payload ở
**biên**; `M18-R3` cấm dựng một lớp phân quyền **giả** ở trong. Bỏ `M17-R6` thì
`M18-R3` không cứu được gì.

## Cái M18 KHÔNG có rule cho

**Đăng nhập bằng mật khẩu** — không có mật khẩu trong hệ này. Đường vào là mã
mời + `chat_id` đã buộc (`FR-045`). Ghi ra để không ai đi tìm rule băm mật khẩu
rồi tưởng nó bị quên.
