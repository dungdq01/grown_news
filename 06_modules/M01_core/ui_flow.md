# M01_core — ui flow

**Không có màn.** Module chạy bằng CLI và trong phiên chat với agent.

| Thao tác | Ở đâu | Ra gì |
|---|---|---|
| Nạp nguồn | chat với Claude Code | file `.md` draft |
| Kiểm kho | `python -m source_distiller.validate kb/` | danh sách lỗi trên terminal |
| Sửa dẫn xuất | `... validate kb/ --fix` | ghi đè `word_count` |
| Duyệt | **editor**, không phải web | đổi `review_status` |

Màn *Chờ duyệt* (`SCR-02`, thuộc M03_web) chỉ **hiện** danh sách draft. Nó không
đổi được trạng thái — web không bao giờ ghi `kb/` (BRD B-C3).

Ghi trống có chủ ý, không phải quên.
