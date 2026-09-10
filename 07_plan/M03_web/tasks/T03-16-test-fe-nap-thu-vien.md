# T03-16 — FR-036/B7b: cổng cho lối nạp thư viện (đơn vị TEST)

> Tách khỏi T03-15 vì R1. Viết TRƯỚC code, phải ĐỎ trước.
>
> Cổng soi **bundle đã build**, không soi `.ts`: thứ chạy trên trình duyệt là
> bundle, và một helper đúng trong `.ts` mà esbuild inline sai thì `.ts` vẫn
> xanh (bài học `duong-api-khop-route.test.js`).

phạm_vi_ghi:
  - web/test/thu-vien-nap.test.js
  - web/test/cac-man-con-lai.test.js   # phep kiem 3/2/1 het thoa duoc voi 4 loi
  - web/package.json
  - web/test/WORKLOG.md
  - web/WORKLOG.md
  - web/styles/WORKLOG.md      # so dong prototype.css
  - web/plugins/WORKLOG.md     # so ky tu shell.html

verifiability: hard
tiêu_chí:
  - AC1: tab thứ tư có ở hai `shell.html`, hai file khớp nhau ở khối nạp, và
      `data-naptab` mới có nhánh xử lý trong bundle — hai chiều như `nut-song §1`
    cmd: cd web && node test/thu-vien-nap.test.js
  - AC2: bảng mime tới được bundle (đủ 5 mime + `tran_byte`), và KHÔNG chuỗi mime
      nào gõ tay trong `.ts` nguồn
    cmd: cd web && node test/thu-vien-nap.test.js
  - AC3: **`file.size` kiểm TRƯỚC `fetch`** — đo bằng vị trí trong thân hàm, không
      bằng "có tồn tại chuỗi". Đây là bài học B5: 413 không tới được client giữa
      lúc upload
    cmd: cd web && node test/thu-vien-nap.test.js
  - AC4: file test trong chuỗi `npm test`, được nhắc trong `test/WORKLOG.md`, số
      liệu `web/WORKLOG.md` khớp
    cmd: cd web && node test/nut-song.test.js
phụ_thuộc: T03-15
