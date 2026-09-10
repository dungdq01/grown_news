# M03_web — tờ báo

Đọc `kb/`, render bằng Quartz v5, deploy **private** (BRD B-D3).

> Hợp đồng UI **đóng băng ở G5**. Module này *nối* `05_uiux/` với `kb/`,
> **không thiết kế lại**. Đổi token ⇒ FR + bump `ui_frozen.version`.

## Dựng lại từ đầu

`web/_quartz/` là repo Quartz thượng nguồn — **không nằm trong git**:

```bash
cd web
git clone --depth 1 https://github.com/jackyzha0/quartz.git _quartz
cd _quartz && npm install && cd ..
cp quartz.config.yaml _quartz/
npm run build
```

## Lệnh

| Lệnh | Làm gì |
|---|---|
| `npm run build` | nối plugin + build `kb/` → `web/site/` |
| `npm run serve` | như trên, kèm máy chủ xem thử |
| `npm run link` | chỉ nối plugin local vào `.quartz/plugins/` |
| `npm run check` | type-check plugin |

**Build ra `web/site/`, không phải `public/`** — `public/` là thư mục **ảnh nền
nguồn** của người dùng (10 file `.jpg` commit từ s5). Quartz xoá sạch thư mục
output trước mỗi lần build, nên trỏ nó vào `public/` là mất ảnh.

## Ba luật tòa soạn — plugin tự viết

| # | Plugin | Kiểu | Luật |
|---|---|---|---|
| 1 | `approved-only` | filter | chỉ `review_status: approved` + chặn `*.v<n>.md` |
| 2 | `merge-by-source` | emitter | gộp bản cùng `url_normalized` |
| 3 | `sort-by-priority` | config | sắp theo `priority`, **không** theo `analyzed_at` |

Plugin sống ở `web/plugins/`, nối vào `.quartz/plugins/` bằng **junction**
(`link-plugins.mjs`) — Windows chặn symlink kiểu `dir` nếu chưa bật Developer Mode,
junction thì không.

## Bốn thứ dễ vấp — đã trả giá

| Vấp | Nguyên nhân | Sửa |
|---|---|---|
| `npm install @jackyzha0/quartz` 404 | Quartz không phát hành qua npm | clone repo (FR-007) |
| Plugin local "không tồn tại" | đường giải theo **CWD lệnh build**, không theo vị trí config | `../plugins/...` |
| `EPERM symlink` | Windows chặn symlink `dir` | junction |
| Filter loại **14/14** file | v5 tách frontmatter transformer ra plugin ngoài; không bật ⇒ `vfile.data.frontmatter` là `undefined` | bật `obsidian-flavored-markdown` + `note-properties` |

Vấp thứ tư nguy hiểm nhất: filter **chạy đúng**, dữ liệu vào rỗng. Build vẫn
`exit 0`.

## Test

```bash
node test/only-approved.test.js     # M03-R1 — dựng kho tạm từ contract, build, so
node test/token-only.test.js        # M03-R4 — không gõ tay giá trị token
node test/no-dangerous-html.test.js # M03-R3 — sanitize + không analytics
```

`test/_seed.mjs` sinh kho tạm từ `analyses.sample.v5.json`. **Không ghi vào `kb/`
thật** — M03 không thuộc `kb_writers`.
