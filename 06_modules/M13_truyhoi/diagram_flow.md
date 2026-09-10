# M13_truyhoi — diagram flow

> Khớp diagram tổng `04_system/` (ba vùng). M13 ở **THỢ**, nhưng khác M12 ở một
> điểm quan trọng: nó **không có mũi tên nào ra Internet** (`M13-R5`).

## 1 · Hai đường, chạy độc lập

```mermaid
flowchart TD
    subgraph A["Đường DỰNG — chạy khi kho đổi"]
        KB["kb/ · ban_ghi<br/>(chỉ đọc qua API)"] --> P["parse ##/###<br/>→ chunk"]
        P --> AN["anchor = ASCII-fold<br/>CÙNG luật slugGoiY"]
        P --> LN["line_start / line_end<br/>lấy miễn phí lúc parse"]
        AN --> CH["chunks<br/>(bảng thường)"]
        LN --> CH
        CH --> NR["tim = chuan_hoa(body)"]
        NR --> FTS["chunks_fts<br/>unicode61 remove_diacritics 2"]
    end

    subgraph B["Đường HỎI — chạy mỗi truy vấn"]
        Q["câu hỏi + phạm vi facet"] --> QN["chuan_hoa(câu hỏi)<br/>CÙNG hàm"]
        QN --> M["MATCH + JOIN WHERE facet<br/>MỘT query"]
        FTS --> M
        M --> RK["ORDER BY bm25(w_title, 1.0)<br/>rank càng ÂM càng khớp"]
        RK --> BD["lấy body ĐẦY ĐỦ qua rowid<br/>KHÔNG dùng snippet()"]
        BD --> OUT["{đoạn, địa_chỉ, điểm}<br/>+ số bản ghi trong phạm vi"]
    end

    style NR fill:#dfd,stroke:#4a4,stroke-width:3px
    style QN fill:#dfd,stroke:#4a4,stroke-width:3px
    style BD fill:#ffd,stroke:#a80,stroke-width:2px
```

**Hai khối xanh là CÙNG MỘT HÀM** — đó là toàn bộ `M13-R1`. Vẽ chúng hai chỗ vì
chúng chạy ở hai thời điểm; nhưng nếu chúng thành hai *hàm*, hệ không báo lỗi, nó
chỉ trả ít kết quả hơn và không ai biết đã mất gì.

**Khối vàng** — `snippet()` trần 64 token nên chỉ làm preview; bằng chứng trích dẫn
lấy `body` đầy đủ (`M13-R4`).

## 2 · Re-index tăng dần — ba trigger và một cái bẫy

```mermaid
flowchart LR
    F["file .md"] --> MT{"mtime<br/>đổi ?"}
    MT -->|"không"| SK["0 ghi"]
    MT -->|"có"| SH["sha256(nội dung)"]
    SH --> CS{"khác<br/>checksum ?"}
    CS -->|"không"| SK
    CS -->|"có"| TX["MỘT transaction:<br/>DELETE theo file + INSERT"]
    TX --> TR["trigger _ai / _ad / _au<br/>đồng bộ chunks_fts"]
    TR --> OP["optimize sau bulk"]

    style TX fill:#ffd,stroke:#a80,stroke-width:2px
```

**Cái bẫy, chép nguyên mẫu `sqlite.org/fts5.html#external_content_tables`**: xoá
khỏi FTS external-content phải dùng `INSERT ... VALUES('delete', old.rowid, old.…)`
— FTS5 cần **GIÁ TRỊ CŨ**, không phải rowid. Viết `DELETE FROM chunks_fts` thẳng
thì bảng thường và FTS **lệch nhau IM LẶNG**: không báo lỗi, chỉ trả kết quả sai.

## 3 · Chiều CẤM

```mermaid
flowchart LR
    T["truyhoi<br/>THỢ"] -.->|"❌ M13-R3"| KB2["ghi kb/**"]
    T -.->|"❌ M13-R5: FR-043<br/>không có bậc nào cho truy hồi"| NET["embedding API"]
    T -.->|"❌ M13-R4"| SN["snippet() làm<br/>bằng chứng trích dẫn"]
    T -.->|"❌ Z7"| UI["giao diện"]

    style KB2 fill:#fdd,stroke:#a44
    style NET fill:#fdd,stroke:#a44
    style SN fill:#fdd,stroke:#a44
    style UI fill:#fdd,stroke:#a44
```

Mũi tên thứ hai đáng đọc kỹ: M13 **được** phép egress vì nó ở THỢ. Điều bị cấm
không phải "gọi ra ngoài" mà là **gọi ra ngoài theo một đường `FR-043` chưa khai
bậc nào** — tức không được log, không ai đếm. Muốn dùng thì mở FR, không phải thêm
một `import`.

## 4 · Điểm rẽ hybrid — vẽ trước, chưa dựng

```mermaid
flowchart TD
    S["truy hồi FTS5<br/>ĐANG DÙNG"] --> TH{"tín hiệu vận hành ?<br/>0 kết quả · gõ lại ≥2 lần"}
    TH -->|"chưa"| S
    TH -->|"có"| V["+ bảng vec0<br/>sqlite-vec pin v0.1.9<br/>bge-m3"]
    V --> RRF["query RRF SQL-thuần<br/>rrf_k=60 · weights 1/1<br/>FULL OUTER JOIN"]
    RRF --> OUT2["cùng hình dạng output"]

    style TH fill:#ffd,stroke:#a80,stroke-width:3px
    style V stroke-dasharray: 5 5
    style RRF stroke-dasharray: 5 5
```

Nét đứt = **chưa dựng**. Điều kiện tiên quyết **đã đạt** (đo 2026-09-01: SQLite
3.50.4, `FULL OUTER JOIN` chạy thật), nên khi rẽ thì chỉ thêm một bảng + một query,
**không đổi kiến trúc**. Điểm rẽ đo bằng tín hiệu vận hành, **không** bằng số bài
— và hai tín hiệu đó phải được **đếm và ghi** (`AC-7.1`), vì không có số thì không
ai biết đã tới lúc rẽ.
