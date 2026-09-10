# FR-007 — Quartz v5, không phải v4

mở_bởi: s8 T03-1, 2026-08-19
tới: s4 (ADR-01)
mức: chặn cả 4 task của M03_web
trạng_thái: ĐÃ THI HÀNH

## Vấn đề

ADR-01 (s4) chốt **Quartz v4**. Cài thử:

```
npm install @jackyzha0/quartz
→ 404 Not Found — không có trên npm registry
```

Quartz **không phát hành qua npm** — nó cài bằng cách clone repo. Và bản hiện
hành là **v5**, không phải v4.

## Kiểm tài liệu chính thức trước khi đổi — không đoán

F1 (quyết định giữ Quartz) dựa trên **bốn** khẳng định kỹ thuật. Kiểm lại từng
cái trên tài liệu v5:

| F1 khẳng định | v5 | Chữ ký chính thức |
|---|---|---|
| filter đọc frontmatter tuỳ ý | ✅ còn | `shouldPublish(ctx: BuildCtx, content: ProcessedContent): boolean` |
| emitter nhận **toàn bộ** content | ✅ còn | `emit(ctx, content: ProcessedContent[], resources): Promise<FilePath[]>` |
| SPA routing giữ DOM state | ✅ còn | sự kiện `nav`, `prenav` |
| chống rò listener | ✅ còn | `window.addCleanup()` |

**Không khẳng định nào của F1 gãy.** v5 còn thêm sự kiện `render` cho trường hợp
DOM cập nhật tại chỗ.

⇒ Ba custom part vẫn viết được đúng như spec M03 §2.1. Ước 125 dòng của F1 giữ nguyên.

## Quyết

Dùng **v5**. Không phải đảo ADR-01 — lý do *chọn Quartz thay vì tự viết Next.js*
không đổi chút nào; chỉ số phiên bản trong ADR lạc hậu so với thượng nguồn.

### Vì sao không cố tìm v4

v4 vẫn clone được từ tag cũ, nhưng: không nhận bản vá bảo mật, tài liệu online đã
chuyển sang v5, và mọi câu hỏi tra được sau này đều trả lời cho v5. Pin vào bản
cũ để khớp một con số trong ADR là để tài liệu điều khiển hiện thực.

## Thi hành

| Chỗ | Đổi |
|---|---|
| `04_system/adr.md` ADR-01 | v4 → v5 + ghi bằng chứng đã kiểm 4 API |
| `project_map.modules.M03_web.stack` | `quartz-v4` → `quartz-v5` |
| `06_modules/M03_web/spec.md` §2.4 | nhắc `render` event ngoài `nav` |
| cách cài | clone repo, **không** `npm install` |

## Đổi thì

v6 ra mà đổi chữ ký `emit()` thành mỗi-file-một-lần ⇒ `mergeBySource` phải dựng
chỉ mục riêng. Đó là lúc cân lại F1, không phải bây giờ.
