# WO-031 — bản ghi ĐƯỢC TẠO mà màn báo "máy chủ chưa chạy"

loại: bug — báo sai, và hai lỗi kèm ở đường tài liệu
module: **M03_web** (`web/plugins/multiwindow/**`)
mức: người dùng báo trực tiếp — *"tôi thấy create file .md rồi nhưng hệ thống báo lỗi"*

## Nguyên nhân — HỒI QUY CỦA CHÍNH TÔI Ở WO-028

WO-028 xoá dòng khai `const oS = G("vd-slug")` nhưng **để sót**
`if (oS) oS.value = ""` — và dòng đó nằm **SAU** lời gọi POST:

```js
const r = await fetch("/api/video", …)   // 201, file .md ĐƯỢC TẠO
kqTV(`Đã ghi ${d.path} vào kho.`, "ok")
if (oU) oU.value = ""
if (oS) oS.value = ""                    // ReferenceError: oS is not defined
```

`try/catch` của chính hàm nuốt lỗi rồi báo *"Không gọi được /api/video — máy
chủ chưa chạy?"*. Bản ghi có thật; câu báo đổ cho máy chủ.

Cả `ghiVideo` **và** `ghiBanGhiThuVien` đều sót.

## Vì sao không cổng nào bắt

`node --check` chỉ bắt **cú pháp**; đây là lỗi **lúc chạy**. Và tôi vừa ĐỌC
chính đoạn đó khi sửa WO-028 mà không thấy. Mọi cổng FE của dự án đều đọc mã
hoặc đọc markup — **không cổng nào GỌI hàm**.

## Hai lỗi kèm, lộ ra khi cổng mới chạy thật hàm gửi

**1 · `ghiBanGhiThuVien` POST vào `/api/articles`, không vào `/api/tai-lieu`.**
Bí danh vẫn tạo được bản ghi nên tính năng **trông** đúng — mà **cổng riêng của
module tài liệu không chạy**. Đúng cái bẫy `nap-video.test.js` đã ghi cho video.

**2 · Nhánh PUT đặt `title` làm tuỳ chọn của `fetch`**, không nằm trong `body`:

```js
await fetch(duong, {
  method: "PUT", headers: {…},
  title: G("tv-title")?.value.trim() || null,   // ← fetch BỎ QUA
  body: JSON.stringify({ frontmatter: {…} }),    // ← không có title
})
```

`fetch` bỏ qua khoá lạ **không cảnh báo gì** ⇒ **sửa một tài liệu là mất tiêu
đề, im lặng**.

## Bằng chứng — TRÌNH DUYỆT THẬT, đúng URL người dùng dán

Server riêng cổng 8801, `KB_DIR` kho tạm. Điền form `/video/nap/` rồi bấm nút:

```
kết quả trên màn : "Đã ghi video/thien-duong-chuot-…-tien-tri-d.md vào kho."
url              : https://youtu.be/85kbC_s8Ldg?si=LXtwqOQ14N8wqn8U
url_normalized   : youtube.com/watch?v=85kbC_s8Ldg      ← CHỮ HOA còn nguyên
category/concepts: ["aitalkshow"] / ["talkshow"]
```