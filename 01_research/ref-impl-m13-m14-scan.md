# Reference implementation scan — M13 + M14 (raw)

> **Raw đợt bốn** · 2026-09-01 · 6 agent (2 track × 2 góc đọc-mã-thật + 1 phản
> biện/track). Khác đợt ba: agent đọc MÃ (fetch file GitHub thật), mỗi pattern
> kèm repo + file/hàm/dòng + số sao/commit cuối + **đánh đổi khi nào KHÔNG hợp
> Grown_news**. Phản biện fetch lại chính file kiểm mã đúng như mô tả: 24 kiểm,
> 23 CONFIRMED · 1 REFUTED (github-slugger — thuật toán đúng nguyên văn nhưng
> repo chết 2023-09, pattern không khai; nội dung vẫn dùng được KÈM cờ đó).
> Pattern là CẤU TRÚC để học, không phải mệnh lệnh — s6 chọn.

## §0 · Bản chưng — điều nhập thẳng vào spec s6

### M13 — tổ hợp lắp được ngay (mọi mảnh có mã đối chiếu)

1. **Schema kiểu `zk` hạ xuống mức chunk**: bảng thường `chunks(id PK, file,
   heading, anchor, line_start, line_end, title, body, checksum)` giữ TOÀN BỘ
   metadata; FTS chỉ `fts5(title, body, content=chunks, content_rowid=id,
   tokenize='unicode61 remove_diacritics 2')` — **bỏ `porter`** của zk (stemming
   tiếng Anh phá tiếng Việt). Không repo nào khảo được chunk-theo-heading sẵn —
   tầng đó Grown_news tự thiết kế (đã biết từ đợt ba: ~100 dòng).
2. **Ba trigger `_ai/_ad/_au`** chép nguyên mẫu sqlite.org/fts5.html
   #external_content_tables — mấu chốt: xoá bằng `INSERT ... VALUES('delete',
   old...)` (FTS5 cần GIÁ TRỊ CŨ), chạy `optimize` sau bulk. Re-index tăng dần:
   mtime khác → mới sha256 → sha khác → MỘT transaction DELETE-theo-file + INSERT.
3. **`đ` KHÔNG fold được bằng tokenizer** — bằng chứng chạy thật: cả unicode61
   lẫn trigram đều không fold U+0111 (đ là chữ cái riêng, không phải ký tự dấu).
   Phải có `normalize_vi()` tầng ứng dụng áp cho CẢ cột index lẫn query — cùng
   một hàm, đây là loại bug âm thầm nhất (Joplin từng dính NUL phá FTS).
4. **bm25 weights**: bắt đầu `w_title=5..10` rồi đo — đừng chép 1000/500/1 của zk
   (số đó cho filename-là-tiêu-đề). Rank càng ÂM càng khớp. `snippet()` trần 64
   token — chỉ làm preview; bằng chứng trích dẫn lấy body đầy đủ qua rowid.
5. **Điểm rẽ hybrid đã có hợp đồng sẵn**: query RRF SQL-thuần của Alex Garcia
   (rrf_k=60, weights 1/1, FULL OUTER JOIN) lưu vào docs — khi rẽ chỉ thêm bảng
   vec0 + 1 query. **Kiểm NGAY**: SQLite trong Python-Windows của dự án ≥ 3.39?
6. **Golden set**: `golden.yaml {query, expect_trong_top_k: [file#anchor], k}` —
   expect ĐỊA CHỈ không expect điểm; bộ ca dấu tiếng Việt theo danh mục 7 ca của
   Pagefind (có dấu↔không dấu hai chiều, NFC↔NFD, riêng ca đ/Đ).

### M14 — bốn mảnh ghép + hai lỗ không có tiền lệ

1. **Verify đặt SAU PARSE, TRƯỚC RENDER** — khung normalizer của SurfSense (một
   lượt re.sub, code-region carve-out, registry.resolve) NHƯNG đổi chính sách:
   mọi repo khảo được đều **drop-im-lặng** citation hỏng; Grown_news đổi thành
   TỪ CHỐI có phân loại. Cổng quote-có-thật: `re.finditer(re.escape(quote))` kiểu
   instructor + normalize hai phía kiểu danswer (lower + xoá whitespace/dấu câu
   ASCII — an toàn với chữ Việt có dấu).
2. **Tự mô phỏng format Anthropic thì KHÔNG thừa hưởng bảo đảm "valid pointers"**
   (đó là validate server-side của họ) — cổng verify tự cài là bắt buộc, ghi
   thẳng vào spec.
3. **Refusal 2 tầng kiểu paper-qa**: tầng CODE quyết `khong-co-trong-kho` khi FTS5
   trả 0 hàng (đừng đặt ngưỡng tuyệt đối trên bm25 thô — ragflow tự tắt threshold
   khi điểm term-only); tầng MODEL quyết phần còn lại qua enum trong JSON + sentinel
   phrase kiểm bằng regex. **Nhánh `co-nhung-mau-thuan` KHÔNG có tiền lệ OSS** —
   tự viết AC + testcase, log mọi lần bắn để chỉnh.
4. **Trần kích thước có tiền lệ**: epistemic.technology ~1.600 dòng / 9 file
   (api · orchestration · db · documents · llm) — M14 không có lý do vượt 2.000 dòng.
5. **Multi-turn giai đoạn đầu KHÔNG condense**: nhét history vào 1 user message
   (0 model call phụ, kiểu epistemic); chỉ nâng condense khi có tín hiệu vận hành,
   lúc đó chép prompt Onyx (thiên vị giữ nguyên câu hỏi) + fallback '0'→câu gốc.
6. Repo tình trạng: onyx 31.9k★ sống · surfsense 16k★ sống · khoj 36.8k★ sống
   nhưng KHÔNG inline citation · morphik citation-bằng-prompt không verify ·
   open-notebooklm CHẾT (2024-12).

### Câu phải NGƯỜI chốt trước khi viết mã (không repo nào trả lời hộ)

- **Anchor giữ unicode** (`hướng-dẫn`, khớp GitHub render) **hay ASCII-fold**
  (`huong-dan`, khớp tên file kho hiện có)? Một hàm dùng cả indexer + renderer —
  chốt trước, đổi sau là link chết hàng loạt.
- Heading đổi tên ⇒ anchor chết ⇒ trích dẫn cũ của chatbot gãy — có cần bảng
  `anchor_alias` không?
- Citation không verify được: từ chối CẢ câu trả lời hay gắn cờ TỪNG khẳng định?
  (không tiền lệ mã thật)
- `co-nhung-mau-thuan` quyết bằng model tự khai (chỏi luật "không ai sở hữu thước
  đo mình") hay code so metadata frontmatter?


## M13_truyhoi — search SQLite-thuần trong mã thật

### Góc A — khuyến nghị

Cho M13 của Grown_news, lắp theo tổ hợp sau. (1) Schema kiểu zk nhưng hạ xuống mức chunk: bảng thường `chunks(id INTEGER PK, file, heading, anchor, line_start, line_end, title, body, checksum)` — mọi metadata phục vụ file#anchor nằm ở đây; FTS chỉ `fts5(title, body, content=chunks, content_rowid=id, tokenize='unicode61 remove_diacritics 2')` — bỏ `porter` của zk (stemming tiếng Anh, phá tiếng Việt). (2) Ba trigger _ai/_ad/_au chép nguyên mẫu sqlite.org/fts5.html #external_content_tables — nhớ cú pháp INSERT...VALUES('delete', old...) và chạy 'optimize' sau bulk-index. (3) Xếp hạng: `ORDER BY bm25(chunks_fts, w_title, 1.0)` — bắt đầu w_title=5..10 rồi đo, đừng chép 1000/500/1 của zk (số đó cho filename-là-tiêu-đề); rank càng âm càng tốt. (4) Trích dẫn: snippet(chunks_fts, 1, marker-tự-đặt, ..., 20) cho preview, nhưng câu trả lời chatbot lấy body đầy đủ từ bảng `chunks` qua rowid — snippet bị trần 64 token, không đủ làm bằng chứng trích dẫn. (5) Chuẩn hoá đầu vào theo 5 bước của Joplin (NUL, whitespace lạ, HTML entity, lowercase) áp cho CẢ document lẫn query bằng cùng một hàm — đây là loại bug âm thầm nhất. (6) Điểm rẽ hybrid: giữ file query RRF của Alex Garcia (rrf_k=60, weights 1/1) trong docs như hợp đồng sẵn — nó là SQL thuần trên cùng file SQLite, khi tín hiệu vận hành bật thì chỉ thêm bảng vec0 + 1 query, không đổi kiến trúc; điều kiện tiên quyết phải kiểm NGAY BÂY GIỜ là bản SQLite trong Python-Windows của dự án ≥ 3.39 (FULL OUTER JOIN). Việc kiểm 'đ'→'d' của remove_diacritics và w_title phải là test chạy thật (fixture ở thư mục tạm), không phán bằng tài liệu.

### Góc A — patterns (5)

#### Schema external-content: metadata ở bảng thường, FTS chỉ giữ cột cần tìm (zk)

zk (Zettelkasten CLI, Go) tách hai tầng: bảng thường `notes` giữ TOÀN BỘ metadata — id INTEGER PK AUTOINCREMENT, path, sortable_path, title, lead, body, raw_content, word_count, checksum, created, modified, UNIQUE(path) — kèm index thường trên checksum và path. FTS chỉ index 3 cột: `CREATE VIRTUAL TABLE notes_fts USING fts5(path, title, body, content = notes, content_rowid = id, tokenize = "porter unicode61 remove_diacritics 1 tokenchars '''&/'")`. Truy vấn join ngược: `JOIN notes_fts fts_match ON n.id = fts_match.rowid ... WHERE fts_match.notes_fts MATCH ?`. Trả lời câu hỏi 1: metadata (file, checksum, thời gian) nằm HOÀN TOÀN ở bảng thường; FTS chỉ chứa text cần match; path được đưa vào FTS vì zk muốn match cả tên file. sqlite-utils xác nhận cùng pattern: enable_fts() sinh `CREATE VIRTUAL TABLE {table}_fts USING FTS5({columns}, content={table})` rồi populate bằng `INSERT INTO {table}_fts(rowid, {cols}) SELECT rowid, {cols} FROM {table}` — và search_sql() dựng CTE lọc WHERE trên bảng thường TRƯỚC rồi mới `join {fts} on original.rowid = {fts}.rowid where {fts} match :query order by {fts}.rank`.

- **nguồn**: https://github.com/zk-org/zk (đối chiếu: https://github.com/simonw/sqlite-utils)
- **file/dòng**: zk: internal/adapter/sqlite/db.go dòng 88-127 (schema notes + notes_fts trong migration 1); internal/adapter/sqlite/note_dao.go dòng 550-553 (join + MATCH). sqlite-utils: sqlite_utils/db.py — enable_fts() dòng 3754-3845, populate_fts() dòng ~3848, search_sql() dòng 3939-4017
- **độ tin**: zk: 2.779 sao, commit cuối 2026-08-31 (sống). sqlite-utils: 2.163 sao, commit cuối 2026-08-14 (sống), tác giả Simon Willison/Datasette
- **đánh đổi**: External content tiết kiệm ~50% dung lượng (không nhân đôi body) nhưng FTS và bảng thường có thể LỆCH NHAU im lặng nếu ghi bảng thường mà quên trigger/populate — corruption không báo lỗi, chỉ trả kết quả sai. zk index CẢ NOTE một dòng FTS — Grown_news cần chunk theo heading để ra file#anchor thì bảng thường phải là bảng `chunks` (file, heading, anchor, line_start) chứ không phải bảng `articles`; không repo nào ở đây làm sẵn tầng chunk đó. Tokenize `porter` của zk là stemming tiếng Anh — KHÔNG hợp tiếng Việt, chỉ giữ `unicode61 remove_diacritics 2`.

#### Bộ ba trigger đồng bộ FTS5 external-content (mẫu chuẩn tài liệu SQLite + hai repo dùng thật)

Tài liệu SQLite §External Content Tables cho mẫu chuẩn nguyên văn: `CREATE TRIGGER t1_ai AFTER INSERT ON t1 BEGIN INSERT INTO fts_idx(rowid, b, c) VALUES (new.a, new.b, new.c); END;` — `CREATE TRIGGER t1_ad AFTER DELETE ON t1 BEGIN INSERT INTO fts_idx(fts_idx, rowid, b, c) VALUES('delete', old.a, old.b, old.c); END;` — `CREATE TRIGGER t1_au AFTER UPDATE ON t1 BEGIN` chạy 'delete' với old rồi INSERT với new. Điểm mấu chốt: xoá KHÔNG dùng DELETE FROM mà dùng INSERT đặc biệt `VALUES('delete', old.rowid, <old values>)` — FTS5 cần GIÁ TRỊ CŨ để gỡ token khỏi index ngược. zk dùng đúng nguyên mẫu (trigger_notes_ai/ad/au). sqlite-utils sinh đúng nguyên mẫu bằng template khi create_triggers=True (hậu tố _ai, _ad, _au). Sau bulk-insert, chạy `INSERT INTO fts(fts) VALUES('optimize')` (thấy trong blog Alex Garcia sau khi populate).

- **nguồn**: https://sqlite.org/fts5.html (đối chiếu mã thật: https://github.com/zk-org/zk và https://github.com/simonw/sqlite-utils)
- **file/dòng**: sqlite.org/fts5.html anchor #external_content_tables. zk: internal/adapter/sqlite/db.go dòng 129-138. sqlite-utils: sqlite_utils/db.py dòng ~3811-3844 (khối triggers trong enable_fts)
- **độ tin**: Tài liệu chính thức SQLite (nguồn gốc của pattern); hai repo sống 2026 dùng nguyên văn
- **đánh đổi**: Trigger chỉ bắt được ghi QUA SQL — nếu Grown_news import bài bằng script bỏ qua bảng nguồn hoặc chỉnh file .md rồi re-scan, phải tự đảm bảo mọi đường ghi đi qua bảng `chunks`. UPDATE trigger với giá trị old SAI (đã lệch từ trước) sẽ làm index hỏng thêm — Joplin từng dính bug NUL character phá FTS (issue #9775). Trigger làm mỗi INSERT chậm hơn (tokenize ngay lúc ghi) — với corpus vài trăm bài, không đáng kể; với bulk re-index thì DROP trigger, nạp, populate lại nhanh hơn.

#### Hybrid FTS5 + sqlite-vec trong MỘT file, RRF viết bằng SQL thuần (Alex Garcia — tác giả sqlite-vec)

Query RRF nguyên văn từ blog (đã chạy trên 14.500 headline NBC News): `with vec_matches as (select article_id, row_number() over (order by distance) as rank_number, distance from vec_articles where headline_embedding match lembed(:query) and k = :k), fts_matches as (select rowid, row_number() over (order by rank) as rank_number, rank as score from fts_articles where headline match :query limit :k), final as (select articles.id, articles.headline, vec_matches.rank_number as vec_rank, fts_matches.rank_number as fts_rank, (coalesce(1.0 / (:rrf_k + fts_matches.rank_number), 0.0) * :weight_fts + coalesce(1.0 / (:rrf_k + vec_matches.rank_number), 0.0) * :weight_vec) as combined_rank, vec_matches.distance, fts_matches.score from fts_matches full outer join vec_matches on vec_matches.article_id = fts_matches.rowid join articles on articles.rowid = coalesce(fts_matches.rowid, vec_matches.article_id) order by combined_rank desc) select * from final;` — tham số dùng thật: rrf_k=60, weight_fts=1.0, weight_vec=1.0, k=10. Schema đi kèm: `fts_articles USING fts5(headline, content='articles', content_rowid='id')` + `vec_articles USING vec0(article_id integer primary key, headline_embedding float[768])`. Bài còn trình bày 2 biến thể rẻ hơn: keyword-first (UNION ALL, FTS trước, vector đắp sau) và re-rank-by-semantics (chỉ re-order kết quả FTS bằng khoảng cách vector).

- **nguồn**: https://alexgarcia.xyz/blog/2024/sqlite-vec-hybrid-search/index.html (repo: https://github.com/asg017/sqlite-vec)
- **file/dòng**: alexgarcia.xyz/blog/2024/sqlite-vec-hybrid-search/index.html — mục 'Reciprocal Rank Fusion (RRF)' (query nguyên văn ở trên), mục schema đầu bài
- **độ tin**: Tác giả chính sqlite-vec (repo 8.063 sao, commit cuối 2026-05-18 — chú ý: chậm ~3.5 tháng, dự án tuyên bố pre-v1). Bài được Simon Willison trích ngày 2024-10-04 (simonwillison.net/2024/Oct/4/hybrid-full-text-search-and-vector-search-with-sqlite/)
- **đánh đổi**: `full outer join` đòi SQLite ≥ 3.39 (2022) — phải kiểm bản sqlite3 đóng gói trong Python trên Windows của dự án. RRF làm mất khả năng dùng cú pháp query nâng cao của FTS5 (NEAR, cột-cụ thể) trộn với vector, và không highlight được match vector. Chính tác giả ghi rõ chưa có metadata filtering tốt trong vec0 thời điểm đó. Với Grown_news: quyết định đã chốt là FTS5+BM25 thuần — pattern này chỉ chép về làm SẴN cho điểm rẽ hybrid, KHÔNG cài bây giờ; vì query RRF hoàn toàn là SQL thuần trên cùng file SQLite, điểm rẽ chỉ tốn thêm 1 bảng vec0 + 1 query, không đổi kiến trúc — đúng triết lý không-framework.

#### snippet() + bm25() weights trong mã thật (zk)

zk dùng nguyên văn: cột snippet = `snippet(fts_match.notes_fts, 2, '<zk:match>', '</zk:match>', '…', 20)` — tham số: 2 = chỉ số cột body (0=path, 1=title, 2=body; index từ 0), marker mở/đóng là tag TỰ ĐẶT có namespace `<zk:match>` để tầng render phân biệt với markup của nội dung, '…' cho chỗ cắt, 20 = số token tối đa của đoạn trích (doc SQLite cho phép 1–64; truyền -1 cho cột thì FTS5 tự chọn cột tốt nhất). Xếp hạng: `bm25(fts_match.notes_fts, 1000.0, 500.0, 1.0)` — trọng số theo THỨ TỰ CỘT khai trong fts5: path=1000, title=500, body=1, tức match trên tên file mạnh hơn title 2 lần, title mạnh hơn body 500 lần; ORDER BY giá trị này tăng dần vì bm25 của SQLite trả số ÂM, càng âm càng khớp (doc: 'lower/more negative = better'). Ràng buộc thực chiến từ Joplin: hai bảng FTS muốn trộn điểm BM25 phải CÙNG SỐ CỘT — Joplin tự kiểm và throw nếu notes_fts và items_fts lệch số field (JoplinDatabase.ts:334-337).

- **nguồn**: https://github.com/zk-org/zk (đối chiếu doc: https://sqlite.org/fts5.html; ràng buộc: https://github.com/laurent22/joplin)
- **file/dòng**: zk: internal/adapter/sqlite/note_dao.go dòng 549 (snippet), dòng 551 (bm25 weights), dòng 553 (MATCH ?). Joplin: packages/lib/JoplinDatabase.ts dòng 334-337
- **độ tin**: zk 2.779 sao, commit cuối 2026-08-31; sqlite.org là spec gốc
- **đánh đổi**: Trọng số 1000/500/1 của zk là chọn cho Zettelkasten (tên file = slug tiêu đề, rất đặc trưng) — Grown_news có frontmatter title riêng nên tỷ lệ phải tự thí nghiệm, đừng chép số. snippet() bị trần 64 token — trích dẫn dài cho chatbot phải tự cắt từ body ở bảng thường theo offset, hoặc dùng highlight() trả nguyên cột. Marker dạng tag phải escape khi bơm vào HTML nếu nội dung người dùng có thể chứa chuỗi trùng.

#### Bảng shadow chuẩn hoá (bỏ dấu) trước khi vào FTS — pattern của Joplin, đáng giá cho tiếng Việt

Joplin KHÔNG build FTS trực tiếp trên bảng notes mà qua bảng trung gian: `CREATE TABLE notes_normalized (...)` chứa bản text đã chuẩn hoá, rồi `CREATE VIRTUAL TABLE notes_fts USING fts4(content="notes_normalized", notindexed="id", id, title, body)`; trigger đồng bộ gắn trên notes_normalized (notes_after_insert/update: `INSERT INTO notes_fts(docid, id, title, body) SELECT rowid, id, title, body FROM notes_normalized WHERE new.rowid = notes_normalized.rowid`). Hàm chuẩn hoá normalizeText_() làm đúng 5 việc theo thứ tự: (1) String.normalize() unicode, (2) gỡ ký tự NUL (NUL phá FTS — issue #9775), (3) decode HTML entities, (4) thay mọi \s (gồm nonbreaking space, CRLF — tokenizer FTS không hiểu) bằng space thường, (5) toLowerCase() + removeDiacritics(). Query cũng được normalize CÙNG HÀM trước khi MATCH, nhưng term GỐC (còn dấu) giữ riêng cho highlighting (comment dòng 593-598 giải thích rõ).

- **nguồn**: https://github.com/laurent22/joplin
- **file/dòng**: packages/lib/JoplinDatabase.ts dòng 626-662 (notes_normalized + notes_fts fts4 + triggers, migration); packages/lib/services/search/SearchEngine.ts dòng 627-642 (normalizeText_), dòng 593-605 (normalize query nhưng giữ term gốc cho highlight)
- **độ tin**: 56.181 sao, commit cuối 2026-08-31 (rất sống); pattern tồn tại qua nhiều năm migration
- **đánh đổi**: Nhân đôi dung lượng text trong DB (bảng normalized + index FTS) — với corpus vài trăm bài của Grown_news thì vô nghĩa về dung lượng nhưng thêm một tầng đồng bộ nữa có thể lệch. Joplin dùng FTS4 (cũ, không có bm25()/snippet() builtin — họ tự cài BM25 ngoài); Grown_news dùng FTS5 thì TRƯỚC HẾT thử `tokenize='unicode61 remove_diacritics 2'` ngay trong FTS5 — nếu đủ cho tiếng Việt thì KHÔNG cần bảng shadow. Chỉ rẽ sang pattern Joplin khi remove_diacritics của unicode61 hụt (nghi vấn lớn nhất: chữ 'đ' không phải combining diacritic nên unicode61 KHÔNG quy về 'd' — cần test thật). Điểm chép được vô điều kiện: gỡ NUL + chuẩn hoá whitespace + normalize query bằng CÙNG hàm với normalize document, giữ term gốc cho highlight.

### Góc A — câu hỏi mở

- Không repo nào trong 4 nguồn chunk dưới mức note/article — tầng chunk-theo-heading (sinh anchor, xử lý heading trùng tên, chunk quá dài) Grown_news phải tự thiết kế; có repo nào 2024-2026 làm chunk-by-heading trên SQLite thật không (track riêng)?
- unicode61 remove_diacritics 2 có quy 'đ'→'d' không (nghi là KHÔNG vì đ là chữ cái riêng, không phải combining mark) — nếu không, người gõ 'dong bo' sẽ hụt 'đồng bộ': cần fixture test thật trước khi chốt tokenizer, và nếu hụt thì rẽ sang pattern bảng normalized của Joplin
- Bản SQLite biên dịch trong python3 trên Windows của dự án là bao nhiêu — FULL OUTER JOIN (query RRF) cần ≥3.39, snippet/bm25 FTS5 cần build có ENABLE_FTS5 (bản Python chính thức có, nhưng phải xác nhận bằng lệnh)?
- Trọng số bm25 cho title vs body trên corpus tiếng Việt nhỏ (3→vài trăm bài): đo bằng thước gì — cần một bộ query vàng (query → chunk đúng) tối thiểu bao nhiêu cặp để so w_title=1/5/10 không tự lừa?
- sqlite-vec commit cuối 2026-05-18 và vẫn pre-v1 — nếu điểm rẽ hybrid bật sau 1-2 năm nữa, có nên chuẩn bị phương án vector thay thế (vd bảng BLOB + brute-force cosine bằng Python thuần, đủ cho vài trăm bài) để không phụ thuộc extension?

### Góc B — khuyến nghị

Bốn quyết định chép được ngay, mỗi cái có mã nguồn đối chiếu: (1) RE-INDEX — chép luồng zk nhưng nâng diff lên 2 tầng: bảng notes(path, mtime, checksum, modified); walk thư mục, mtime khác mới sha256, sha khác mới parse; ghi bằng MỘT transaction 'DELETE chunks WHERE path=? rồi INSERT mới' (đơn giản hơn UPDATE từng cột của zk vì Grown_news chunk theo heading, số chunk đổi theo nội dung); FTS đồng bộ bằng 3 trigger external-content chép nguyên văn từ zk db.go, BỎ chữ 'porter'. (2) TOKENIZER — unicode61 remove_diacritics 2, và bắt buộc một hàm normalize_vi() tầng ứng dụng fold đ→d (bằng chứng chạy thật: cả unicode61 lẫn trigram đều không fold U+0111) áp cho cả cột index lẫn query; trigram để dành làm điểm rẽ vận hành, không làm bây giờ. (3) SLUGIFY — một hàm duy nhất trong vùng LÕI: NFC → đ/Đ→d/D → NFKD → ascii-ignore → lowercase → gộp '-'; dedup bằng object có state kiểu BananaSlug với vòng while và hậu tố '-1' (chọn dash theo github-slugger, không '_1' của Python-Markdown, vì file kho hiện tại như chi-phi-that-cua-mot-lan-retry.md đã theo lối ascii-dash); indexer và renderer cùng import hàm này, cấm cài hai bản. (4) GOLDEN SET — file 07/kiểm: golden.yaml gồm {query, expect_trong_top_k: [duong-dan#anchor], k}, chạy pytest parametrize theo kiểu github/docs (expect địa chỉ, không expect điểm), thêm ca 'A trên B' kiểu sqlite-utils, và bộ ca dấu tiếng Việt bám đúng danh mục 7 file diacritics của Pagefind (có dấu↔không dấu hai chiều, NFC↔NFD, riêng ca đ/Đ). Đây là lệnh gate chạy được, đỏ được, không đỏ oan.

### Góc B — patterns (8)

#### zk: luồng re-index tăng dần walk → Diff(mtime) → Add/Update/Remove

Luồng 3 tầng. (1) internal/core/note_index.go: indexTask.execute() gọi paths.Diff(source, target, force, callback) — source = walk filesystem, target = metadata đã lưu trong DB; callback nhận từng DiffChange: Added → parse file → index.Add(note), Modified → parse → index.Update(note), Removed → index.Remove(path); cuối cùng index.BatchUpdateLinks(addedNotes, addedPaths) gom một lần. (2) internal/util/paths/diff.go: hai channel đã sort theo path, so từng cặp; dòng quyết định: `if forceModified || p.source.Modified != p.target.Modified { change = &DiffChange{p.source.Path, DiffModified} }` — tức CHỈ so mtime. (3) internal/adapter/sqlite/note_dao.go: Add = `INSERT INTO notes (path, sortable_path, filename, title, lead, body, raw_content, word_count, metadata, checksum, created, modified) VALUES (?,...)`; Update = `UPDATE notes SET title=?, lead=?, body=?, raw_content=?, word_count=?, metadata=?, checksum=?, modified=? WHERE path=?`; Remove = `DELETE FROM notes WHERE id=?` (tra id theo path trước). mtime lưu ở cột `modified`, checksum cũng lưu.

- **nguồn**: https://github.com/zk-org/zk
- **file/dòng**: internal/core/note_index.go (indexTask.execute) · internal/util/paths/diff.go (diffPair.diff) · internal/adapter/sqlite/note_dao.go (Add/Update/Remove)
- **độ tin**: 2779 sao, push cuối 2026-08-31 (đang sống, API GitHub xác nhận)
- **đánh đổi**: mtime-only: nhanh, không đọc nội dung file chưa đổi — nhưng copy/restore/git checkout giữ nguyên mtime sẽ BỎ SÓT thay đổi; zk lưu checksum trong DB mà diff không dùng đến (dư thừa nửa vời). Với Grown_news trên Windows (mtime granularity có thể thô), nên làm 2 tầng: mtime khác → mới so checksum → mới re-parse (pattern 3 tầng này có ở rust-file-system-indexer nhưng repo đó ít sao). KHÔNG hợp nếu muốn phát hiện đổi nội dung mà mtime không đổi.

#### zk: FTS5 external-content + 3 trigger đồng bộ (schema chép được nguyên văn)

Schema: `CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(path, title, body, content = notes, content_rowid = id, tokenize = "porter unicode61 remove_diacritics 1 tokenchars '''&/'")`. Ba trigger: trigger_notes_ai AFTER INSERT → `INSERT INTO notes_fts(rowid, path, title, body) VALUES (new.id, ...)`; trigger_notes_ad AFTER DELETE → `INSERT INTO notes_fts(notes_fts, rowid, path, title, body) VALUES('delete', old.id, old.path, old.title, old.body)` (nghi thức xoá đặc thù của external-content FTS5); trigger_notes_au AFTER UPDATE → chạy lệnh 'delete' với old rồi INSERT với new. Nhờ vậy DAO chỉ đụng bảng notes, FTS tự theo.

- **nguồn**: https://github.com/zk-org/zk
- **file/dòng**: internal/adapter/sqlite/db.go (migration version 1: notes_fts + trigger_notes_ai/ad/au)
- **độ tin**: 2779 sao, push cuối 2026-08-31
- **đánh đổi**: Trigger = một cửa duy nhất, không quên đồng bộ — nhưng logic nằm trong DB, khó test đơn vị và khó thấy khi đọc code Python. Nghi thức ('delete', old...) sai một ly là FTS index rác IM LẶNG (không lỗi, chỉ kết quả sai) — cần một câu lệnh kiểm `INSERT INTO notes_fts(notes_fts) VALUES('integrity-check')` trong golden test. Lưu ý: zk dùng porter stemmer — stemmer tiếng Anh, VÔ NGHĨA với tiếng Việt, Grown_news không chép phần `porter`.

#### unicode61 remove_diacritics 2 chạy được với tiếng Việt NHƯNG không fold đ→d (kiểm chứng chạy thật)

Chạy thật trên máy này, SQLite 3.53.1: `CREATE VIRTUAL TABLE t USING fts5(body, tokenize='unicode61 remove_diacritics 2')`, nạp 'kiểm thử tiếng Việt: đường đi, ưu tiên, hướng dẫn'. Kết quả: 'kiem'→khớp, 'uu'→khớp, 'huong dan'→khớp, 'tieng viet'→khớp, 'đuong'→khớp, NHƯNG 'duong'→KHÔNG khớp 'đường'. Lý do: dấu thanh/mũ/móc là combining mark nên bị remove_diacritics gỡ, còn đ (U+0111) là CHỮ CÁI riêng không có decomposition — cả unicode61 lẫn trigram đều giữ nguyên. Hệ quả cấu trúc: phải có một hàm normalize tầng ứng dụng fold đ→d, Đ→D, áp cho CẢ cột index lẫn chuỗi query (không sửa được bằng option tokenizer). Script bằng chứng: fts_test.py trong scratchpad phiên này.

- **nguồn**: https://sqlite.org/fts5.html + kiểm chứng local: C:\Users\Admin\AppData\Local\Temp\claude\c--Users-Admin-Downloads-Grown-news\99acdf40-67e2-43f8-8947-ce2a91b605ef\scratchpad\fts_test.py
- **file/dòng**: fts5.html mục 'unicode61 tokenizer' (option remove_diacritics 0/1/2; mức 2 xử lý đúng codepoint ngoài BMP, có từ SQLite 3.27) + output lệnh python fts_test.py ở trên
- **độ tin**: Tài liệu chính chủ sqlite.org + output máy chạy thật sqlite 3.53.1 (không phải lời khai)
- **đánh đổi**: remove_diacritics làm index MẤT phân biệt dấu: 'ma/má/mã' thành một token — tiếng Việt vốn phân nghĩa bằng dấu, nên recall tăng (gõ không dấu vẫn tìm ra) đổi lấy precision giảm (nhiều kết quả nhiễu, BM25 phải gánh). Với corpus vài trăm bài thì nhiễu chấp nhận được; nếu sau này precision tệ, điểm rẽ là index HAI cột (body_raw + body_folded) và cho MATCH cột folded, rank ưu tiên khớp raw.

#### trigram remove_diacritics 1 (SQLite ≥3.45) — khi nào đáng dùng

Forum SQLite: user chạy `CREATE VIRTUAL TABLE fts5_T USING fts5(a, content='T', tokenize="trigram remove_diacritics 1")` lỗi trên 3.44.2; Dan Kennedy (dev SQLite) trả lời tính năng vào bản 3.45. Ràng buộc trong tài liệu: remove_diacritics 1 chỉ hợp lệ khi case_sensitive 0. Kiểm chứng chạy thật trên máy (3.53.1, cùng file fts_test.py): với 'kiểm thử đường đi hướng dẫn' — 'uong' (giữa từ) → khớp, 'huong' → khớp, 'kiem thu' → khớp, 'duong' → KHÔNG (vẫn vướng đ). Trigram cho substring match + chịu lỗi gõ, không cần tách từ.

- **nguồn**: https://sqlite.org/forum/forumpost/fa267e228dba5d892cf34efeb112600cd6090a6d5846d12f857d2fd9d2840767
- **file/dòng**: forum post trên (trích CREATE VIRTUAL TABLE + trả lời của Dan Kennedy) + fts_test.py phần db2
- **độ tin**: Forum chính chủ sqlite.org, người trả lời là core dev; đã tái hiện chạy thật local
- **đánh đổi**: Index trigram to hơn nhiều lần (mỗi vị trí ký tự một token) và BM25 trên trigram gần như mất nghĩa 'từ' — điểm số khó giải thích, mà hợp đồng chatbot Grown_news cần trích dẫn giải thích được. KHÔNG dùng ở giai đoạn FTS5+BM25 thuần hiện tại; chỉ rẽ sang khi tín hiệu vận hành cho thấy nhiều truy vấn substring/sai chính tả — đúng triết lý 'điểm rẽ = tín hiệu vận hành' đã chốt.

#### github-slugger: occurrences map + hậu tố -1/-2 (thuật toán dedup chuẩn de-facto của anchor GitHub)

index.js, class BananaSlug: state `this.occurrences = {}` reset được bằng reset(); slug(value): nếu maintainCase=false thì value.toLowerCase(), rồi value.replace(regex, '') (regex.js chứa dải ký tự punctuation bị xoá), space→'-'; dedup: `while (own.call(self.occurrences, result)) { self.occurrences[originalSlug]++; result = originalSlug + '-' + self.occurrences[originalSlug] }` — vòng while (không phải if) nên chống được cả trường hợp heading thật tên 'foo-1' đã chiếm chỗ. Hàm slug() export rời là bản KHÔNG state — tài liệu tự ghi 'not recommended'. Bài học cấu trúc cho Grown_news: dedup phải là OBJECT có state theo từng file (reset mỗi file), không phải hàm thuần — và indexer với renderer phải cùng đi qua object này theo CÙNG thứ tự heading.

- **nguồn**: https://github.com/Flet/github-slugger
- **file/dòng**: index.js — BananaSlug.prototype.slug, vòng while occurrences (trích nguyên văn ở trên)
- **độ tin**: 411 sao nhưng là dependency của remark/Docusaurus/marked (hàng chục triệu download/tuần qua npm); push cuối 2023-09-30 — QUÁ 18 THÁNG không commit: đóng băng kiểu 'xong việc', vẫn phải ghi nhận là repo không còn bảo trì
- **đánh đổi**: Giữ nguyên unicode trong slug (anchor kiểu 'hướng-dẫn-cài-đặt') — khớp hành vi GitHub render .md, đẹp cho tiếng Việt; nhưng anchor có ký tự ngoài ASCII sẽ bị percent-encode khi copy URL, xấu và dễ lệch giữa các client. Lưu ý trung thực: nội dung regex.js tôi CHƯA đọc nguyên văn (fetch chỉ thấy `value.replace(regex, '')`), khẳng định 'giữ unicode' suy từ hành vi anchor GitHub thực tế — nếu chép nguyên thuật toán thì phải mở regex.js đọc trước.

#### Python-Markdown toc.py: slugify + unique() — VÀ bằng chứng ASCII-fold phá chữ đ

markdown/extensions/toc.py, chép nguyên văn: `def slugify(value, separator, unicode=False)`: NFKD normalize → encode('ascii','ignore') → `re.sub(r'[^\w\s-]','',value).strip().lower()` → gộp khoảng trắng thành separator. `def unique(id, ids: MutableSet[str])`: `while id in ids or not id:` — nếu id khớp IDCOUNT_RE (đuôi _N) thì tăng N, không thì gắn '_1'; xong ids.add(id). Chạy thật hàm này trên máy (slug_test.py): 'Hướng dẫn cài đặt' → 'huong-dan-cai-at' (đặt→at!), 'Đường đi ngắn nhất' → 'uong-i-ngan-nhat' (mất sạch đ/Đ vì U+0111 không decompose ra ASCII, bị 'ignore' nuốt luôn). Bản unicode=True giữ nguyên dấu: 'đường-đi-ngắn-nhất'.

- **nguồn**: https://github.com/Python-Markdown/markdown
- **file/dòng**: markdown/extensions/toc.py — hàm slugify(), slugify_unicode(), unique() + IDCOUNT_RE; bằng chứng chạy thật: scratchpad\slug_test.py
- **độ tin**: 4245 sao, push cuối 2026-08-30 (sống); là engine markdown Python phổ biến nhất
- **đánh đổi**: unique() dùng hậu tố '_1' (gạch DƯỚI) — LỆCH với github-slugger '-1': hai hệ sinh anchor khác nhau cho cùng tài liệu. Vì Grown_news bắt buộc MỘT hàm cho indexer + renderer, nếu render bằng Python-Markdown thì phải override slugify qua config toc (tham số `slugify=` nhận callable) chứ không dùng mặc định. ASCII-fold mặc định CẤM dùng thẳng cho tiếng Việt khi chưa vá đ→d (bằng chứng máy ở trên); bản vá đúng: thay đ/Đ→d/D TRƯỚC bước NFKD.

#### Pagefind: golden test mỗi-file-một-kịch-bản .toolproof.yml (fixture dựng trong test, không đụng file thật)

Thư mục pagefind/integration_tests/ chia theo feature: diacritics/, exact_phrase/, stemming/, multilingual/, sorting/... Mỗi file .toolproof.yml = một kịch bản, ví dụ diacritics/pagefind-matches-accented-content-with-unaccented-query.toolproof.yml: steps YAML — (1) đặt env dir 'public', (2) TẠO fixture HTML ngay trong test: file public/cafe/index.html chứa '<h1>Visit our café for great coffee</h1>', (3) chạy indexer qua macro + assert stdout, (4) assert file index sinh ra không rỗng, (5) serve rồi chạy search 'cafe' trong browser, (6) assert mảng URL kết quả == ['/cafe/']. Cùng thư mục có 7 file diacritics: accented↔unaccented hai chiều, NFD decomposed, non-latin, arabic — đúng danh sách ca kiểm Grown_news cần cho tiếng Việt.

- **nguồn**: https://github.com/Pagefind/pagefind
- **file/dòng**: pagefind/integration_tests/diacritics/pagefind-matches-accented-content-with-unaccented-query.toolproof.yml (+ 6 file cùng thư mục, liệt kê đủ tên ở phiên này)
- **độ tin**: 5432 sao, push cuối 2026-08-26 (rất sống)
- **đánh đổi**: Mỗi kịch bản tự dựng fixture → test độc lập, chạy được từng file, hợp luật 'fixture ở thư mục tạm' của factory; giá phải trả: chậm (dựng site + indexer mỗi test) và KHÔNG đo ranking tương đối (chỉ assert tập URL đúng). Với Grown_news nên giữ dạng assert-tập-kết-quả này cho cổng gác, đừng assert điểm BM25 tuyệt đối (giòn, đổi version SQLite là đỏ oan).

#### github/docs: test search bằng cặp (query literal → expected url/title) + kiểm thứ hạng tương đối

src/search/tests/api-search.ts: `sp.set('query','foo'); const res = await get('/api/search/v1?'+sp)` rồi `expect(hit.url).toBe('/en/foo'); expect(hit.title).toBe('Foo')` — expected là địa chỉ trang cụ thể, không phải điểm số. Bổ trợ từ simonw/sqlite-utils tests/test_fts.py (test_search_include_rank): sau khi enable_fts FTS5, assert `results[0]['rank'] < results[1]['rank']` — tức chỉ kiểm THỨ TỰ TƯƠNG ĐỐI của rank BM25 (rank càng âm càng tốt), rank tuyệt đối để ANY. Cấu trúc chép cho Grown_news: golden.yaml = danh sách {query, expect_trong_top_k: [path#anchor], k}, pytest parametrize đọc file này, cộng một ca kiểm 'A phải đứng trên B'.

- **nguồn**: https://github.com/github/docs (+ https://github.com/simonw/sqlite-utils)
- **file/dòng**: src/search/tests/api-search.ts (2 đoạn trích ở trên) · sqlite-utils tests/test_fts.py hàm test_search_include_rank
- **độ tin**: github/docs: 20765 sao, push cuối 2026-08-31; sqlite-utils sống, tác giả Simon Willison
- **đánh đổi**: Assert title/url literal → test giòn khi đổi nội dung bài; giảm giòn bằng cách expect theo path#anchor (id ổn định) thay vì title. Kiểm 'rank[0] < rank[1]' chỉ có nghĩa khi golden set đủ nhỏ để người đọc từng cặp — với corpus vài trăm bài, 20–40 truy vấn vàng là trần quản được cho một người.

### Góc B — câu hỏi mở

- Anchor giữ unicode (hướng-dẫn, khớp GitHub render) hay ASCII-fold (huong-dan, khớp tên file kho hiện có)? Hai hệ không sống chung được vì MỘT hàm dùng cả indexer lẫn renderer — cần người chốt trước khi viết hàm.
- Heading đổi tên là anchor chết → mọi trích dẫn cũ của chatbot thành link gãy. Có cần bảng anchor_alias (anchor cũ → anchor mới) trong SQLite, hay chấp nhận trích dẫn chỉ đúng tại thời điểm trả lời?
- mtime trên Windows: copy/restore và một số thao tác git giữ nguyên mtime — tầng checksum bắt được, nhưng NFC/NFD trong TÊN file (mã hoá path khác nhau giữa lần walk) có thể làm diff tưởng là remove+add. Cần một ca golden riêng cho path có dấu trên Windows.
- BM25 của FTS5 tách token theo khoảng trắng nên 'hướng dẫn' là 2 token rời — từ ghép tiếng Việt không được trọng số như một đơn vị. Chưa thấy repo nào giải bằng cấu hình thuần FTS5; câu hỏi: golden set đo được độ tệ thực tế bao nhiêu trước khi bàn tách từ (VnCoreNLP/underthesea sẽ kéo dependency nặng, chỏi triết lý mỏng)?
- github-slugger ngừng commit từ 2023-09 (quá 18 tháng): thuật toán chép về thì sống trong kho mình, nhưng nếu renderer JS phía web muốn dùng npm package này thì đang phụ thuộc gói không bảo trì — chép thuật toán vào LÕI hay cài package?

### Phản biện (12 pattern được kiểm bằng fetch lại mã)

| phán quyết | pattern | lý do |
|---|---|---|
| **REFUTED** | 10. github-slugger: occurrences map + hậu tố -1/-2 | Mã đúng nguyên văn (index.js: this.occurrences, reset(), vòng while own.call(self.occurrences, result) với result = originalSlug + '-' + count, toLowerCase khi maintainCase=false, replace(regex,'') rồi space→'-') NHƯNG repo chết — push cuối 2023-09-30 (~35 tháng trước hôm nay 2026-09-01, quá ngưỡng  |
| **CONFIRMED** | 1. Schema external-content zk: metadata ở bảng thường, FTS chỉ 3 cột | Đọc raw db.go nhánh main: bảng notes đúng nguyên văn từng cột (id AUTOINCREMENT, path, sortable_path, title, lead, body, raw_content, word_count, checksum, created, modified, UNIQUE(path)) ở dòng 89-127, index checksum/path dòng 103-104, notes_fts chỉ index path/title/body với content=notes, content |
| **CONFIRMED** | 2. Bộ ba trigger đồng bộ FTS5 external-content (doc SQLite + zk + sqlite-utils) | fts5.html §External Content Tables cho đúng nguyên văn 3 trigger t1_ai/t1_ad/t1_au như trích; zk db.go có trigger_notes_ai/ad/au đúng tại dòng 129-138 như khai; sqlite-utils db.py có khối 3 trigger _ai/_ad/_au trong enable_fts tại dòng 3820-3826 (nằm trong khoảng ~3811-3844 đã khai). |
| **CONFIRMED** | 3. Hybrid FTS5 + sqlite-vec một file, RRF bằng SQL thuần (Alex Garcia) | Fetch blog thật: mục 'Hybrid approach #2: Reciprocal Rank Fusion (RRF)' chứa đúng query CTE vec_matches (row_number() over order by distance, lembed(:query), k = :k), dataset 14.500+ headline NBC News, schema đầu bài có vec_articles float[768] + fts_articles; repo sqlite-vec sống (push 2026-05-18, 8 |
| **CONFIRMED** | 4. snippet() + bm25() weights trong zk | note_dao.go dòng 549 đúng nguyên văn snippet(fts_match.notes_fts, 2, '<zk:match>', '</zk:match>', '…', 20), dòng 551 bm25 weights 1000.0/500.0/1.0, dòng 553 MATCH ? — cột 2=body khớp thứ tự khai báo fts5(path, title, body); tham chiếu Joplin JoplinDatabase.ts dòng 334-337 cũng đúng (ràng buộc notes_ |
| **CONFIRMED** | 5. Bảng shadow chuẩn hoá trước khi vào FTS (Joplin) | JoplinDatabase.ts (nhánh dev) migration targetVersion 18 tại đúng khoảng dòng 626-662: CREATE TABLE notes_normalized + fts4 content="notes_normalized" notindexed="id" + 4 trigger gắn trên notes_normalized; SearchEngine.ts có normalizeText_ (lowercase + removeDiacritics) và comment nói rõ giữ term gố |
| **CONFIRMED** | 6. zk: luồng re-index tăng dần walk → Diff(mtime) → Add/Update/Remove | note_index.go: indexTask.execute gọi paths.Diff(source, target, force, callback) với DiffAdded→t.index.Add(*note), DiffModified→t.index.Update(*note), DiffRemoved→t.index.Remove(change.Path) (dòng 169-197); diff.go: diffPair.diff so p.source.Modified != p.target.Modified đúng như mô tả. |
| **CONFIRMED** | 7. zk: FTS5 external-content + 3 trigger (schema chép nguyên văn) | db.go migration 1 chứa đúng nguyên văn CREATE VIRTUAL TABLE notes_fts với tokenize = "porter unicode61 remove_diacritics 1 tokenchars '''&/'" và 3 trigger trigger_notes_ai/ad/au đúng từng chữ (ai: insert new; ad: 'delete' old; au: 'delete' old rồi insert new). |
| **CONFIRMED** | 8. unicode61 remove_diacritics 2 với tiếng Việt, không fold đ→d | Chạy lại fts_test.py trên máy này (SQLite 3.53.1): 'đuong'→khớp 'đường', 'duong'→KHÔNG khớp — tái hiện đúng kết quả khai; fts5.html xác nhận remove_diacritics 2 xử lý đúng codepoint mà mức 1 bỏ sót. |
| **CONFIRMED** | 9. trigram remove_diacritics 1 (SQLite ≥3.45) | Fetch forum post thật: user lỗi 'error in tokenizer constructor' trên 3.44.2 với đúng câu CREATE VIRTUAL TABLE đã trích, Dan Kennedy trả lời 'will be in 3.45'; doc xác nhận remove_diacritics 1 chỉ hợp lệ khi case_sensitive 0; chạy lại phần db2 của fts_test.py trên 3.53.1 tạo bảng trigram thành công, |
| **CONFIRMED** | 11. Python-Markdown toc.py: slugify + unique() — ASCII-fold phá chữ đ | toc.py master: slugify() đúng nguyên văn (NFKD → encode('ascii','ignore') → re.sub(r'[^\w\s-]','').strip().lower() → gộp separator), unique() đúng 'while id in ids or not id:' với IDCOUNT_RE hậu tố _1/_2; chạy lại slug_test.py tái hiện bằng chứng: 'Đường đi ngắn nhất' → 'uong-i-ngan-nhat' (chữ đ bị  |
| **CONFIRMED** | 12. Pagefind: golden test mỗi-file-một-kịch-bản .toolproof.yml | API GitHub liệt kê đúng 7 file .toolproof.yml trong integration_tests/diacritics/ (khớp '1 file nêu tên + 6 file cùng thư mục'); nội dung file nêu tên đúng cấu trúc khai: step đặt env PAGEFIND_SITE=public, step TẠO fixture public/cafe/index.html ngay trong test, macro chạy Pagefind, rồi assert bằng  |


## M14_chatbot — citation contract · refusal · độ mỏng

### Góc A — khuyến nghị

Trạng thái các repo hỏi trong đề: onyx CÒN SỐNG (31.870★, push 2026-08-31); surfsense CÒN SỐNG (16.042★, 2026-08-31); khoj CÒN SỐNG (36.837★, 2026-08-02) nhưng KHÔNG có inline citation; morphik CÒN SỐNG (3.713★, 2026-07-23) nhưng citation-bằng-prompt không verify; open-notebooklm CHẾT (2.594★, commit cuối 2024-12-07, >18 tháng — và vốn là công cụ sinh podcast, không có hợp đồng citation nào để chép). Kiến trúc khuyên cho Grown_news (không stream, corpus vài trăm bài, một người): (1) Hợp đồng JSON mô phỏng đúng TextBlock/CitationCharLocation của SDK Anthropic (text_block.py + citation_char_location.py) như đã chốt — nhưng ghi rõ trong spec: bảo đảm 'valid pointers' của Anthropic là validate server-side, tự mô phỏng thì KHÔNG thừa hưởng, phải tự cài cổng verify trước khi được điền start/end_char_index. (2) Tầng verify đặt SAU PARSE, TRƯỚC RENDER, chạy một lượt trên câu trả lời trọn vẹn — chép khung normalizer của SurfSense (normalizer.py: một lượt re.sub, code-region carve-out, registry.resolve) NHƯNG đổi chính sách drop-im-lặng thành TỪ CHỐI có phân loại: [n] không resolve ⇒ khong-co-trong-kho cho khẳng định đó, đúng luật kho. (3) Cấp số [n] bằng CitationRegistry kiểu SurfSense (find-or-create theo key source_type+locator, bỏ merge), locator = {file, anchor}. (4) Cổng 'quote phải có thật trong nguồn': ghép validator Pydantic kiểu instructor (re.finditer(re.escape(quote), chunk_text), fact rớt quote thì từ chối thay vì vứt im) với bước normalize hai phía của danswer (shared_precompare_cleanup: lower + xóa whitespace/dấu câu ASCII — an toàn với chữ Việt có dấu, nhưng phải tự thêm unicodedata.normalize('NFC') cho tiếng Việt); exact-substring trước, KHÔNG bật fuzzy (danswer đo rồi: quá chậm, và chính onyx đã bỏ cả hướng quote — bắt model nhả SỐ, quote lấy từ kho theo số). (5) Map offset→anchor: chép cơ chế chunk.source_links {offset: link} của danswer qa_utils.py dòng ~137-147 — lúc index mỗi bài, sinh bảng offset-của-heading → #anchor, verify xong tra bảng lấy anchor gần nhất phía trước. (6) Không stream là LỢI THẾ, ghi thành quyết định: toàn bộ máy trạng thái 640 dòng của Onyx và CitationTracker re-scan của R2R tồn tại chỉ để phục vụ stream; không stream thì vị trí citation nằm sẵn trong cấu trúc blocks[] (như Ansari thu gọn lại), và điểm rẽ 'cần stream' nên là một tín hiệu vận hành giống điểm rẽ hybrid đã chốt.

### Góc A — patterns (13)

#### Onyx — DynamicCitationProcessor: buffer giữ-lại token khi stream để không vỡ marker [n]

Generator process_token(token) -> yield (str | CitationInfo). Hai regex: possible_citation_pattern = r"([\[【［]+(?:\d+(?:, ?\d+)*(?:, ?)?)?$)" (neo $ — bắt citation DỞ DANG như '[', '[1,' để GIỮ LẠI segment, chưa yield); citation_pattern = r"([\[【［]{2}\d+[\]】］]{2})|([\[【［]\d+(?:, ?\d+)*[\]】］])" (citation trọn vẹn, cả bracket unicode 【】［］). Thứ tự bước mỗi token: (1) cộng vào curr_segment + llm_out; (2) nếu đang trong code block (đếm ``` chẵn/lẻ, hàm in_code_block dòng 58) thì KHÔNG xử lý citation; (3) với mỗi match trọn vẹn: yield text-trước-match → yield CitationInfo TRƯỚC → yield '[[n]](url)'; (4) phần đuôi khớp possible_pattern thì giữ lại chờ token sau; token None = flush. Comment trong mã ghi rõ lý do inner group viết dạng \d+(?:, ?\d+)* thay vì (?:\d+,? ?)* — tránh catastrophic backtracking O(2^n). VALIDATE Ở ĐÂU: sau parse, ngay trong stream — _process_citation tra num trong dict citation_to_doc; num lạ ⇒ logger.warning 'Citation number %s not found in mapping' rồi BỎ QUA IM LẶNG (dòng 487-494), không fail câu trả lời. 3 chế độ CitationMode: HYPERLINK/KEEP_MARKERS/REMOVE (dòng 27).

- **nguồn**: https://github.com/onyx-dot-app/onyx
- **file/dòng**: backend/onyx/chat/citation_processor.py (nhánh main, đọc 2026-09-01): class DynamicCitationProcessor dòng 69, hai regex dòng 204-213, process_token dòng 248, _process_citation dòng 428, nhánh bỏ-qua num lạ dòng 483-494
- **độ tin**: 31.870 sao, push cuối 2026-08-31 (còn sống, rất nóng)
- **đánh đổi**: Toàn bộ máy trạng thái ~640 dòng này CHỈ tồn tại vì streaming (giữ token dở dang, khoảng trắng trước/sau marker, code-block). Grown_news không stream ⇒ KHÔNG cần chép máy trạng thái; chỉ cần chép 2 regex + bước tra-map trên chuỗi trọn vẹn (một lượt re.finditer). Đánh đổi thứ hai: num lạ bị drop im lặng — chỏi luật Grown_news 'ngoài kho ⇒ TỪ CHỐI có phân loại'; nếu chép phải đổi nhánh warning thành trả lỗi khong-co-trong-kho.

#### Onyx — wire schema CitationInfo tối giản: chỉ (số, document_id), tài liệu gửi kênh riêng

class CitationInfo(BaseObj): type: Literal["citation_info"]; citation_number: int; document_id: str — CHỈ 2 trường. Packet SearchDoc đầy đủ (link, blurb, semantic_identifier) đã gửi trước đó qua packet search-tool riêng; CitationInfo chỉ là con trỏ nối [n] → document_id. Processor cố tình yield CitationInfo TRƯỚC token chứa '[[n]](link)' để frontend có metadata trước khi render marker (comment dòng ~378-381 citation_processor.py). Đây chính là dạng 'trỏ con trỏ, đừng chép' mà CLAUDE.md Grown_news đã có.

- **nguồn**: https://github.com/onyx-dot-app/onyx
- **file/dòng**: backend/onyx/server/query_and_chat/streaming_models.py dòng 141-148 (class CitationInfo)
- **độ tin**: 31.870 sao, push cuối 2026-08-31
- **đánh đổi**: Tách citation khỏi document metadata buộc client tự join theo document_id — hai nguồn phải đồng bộ (mobile/src/chat/citations.ts của chính Onyx phải phòng thủ 'citations whose documents never arrived must not render'). Grown_news trả JSON một cục không stream ⇒ có thể nhét thẳng mảng documents[] + citations[] trong cùng response, khỏi join hai kênh; chỉ giữ nguyên tắc citation-là-con-trỏ.

#### Onyx mobile — selectSources: UI chia 3 ngăn cited / more(tìm thấy nhưng không được trích) / files

selectSources(state) trả {cited, more, files, iconDocs, count, hasSources}: cited = SearchDoc theo THỨ TỰ được trích lần đầu (duyệt state.citations rồi tra documentMap); more = tài liệu retrieval trả về nhưng answer không trích (all - citedIds); count tính từ documents thật chứ không từ citations — comment trong mã: 'citations whose documents never arrived must not render an empty Sources · 0'. Link ra ngoài: domainOf(link) regex ^https?:\/\/([^/?#]+).

- **nguồn**: https://github.com/onyx-dot-app/onyx
- **file/dòng**: mobile/src/chat/citations.ts (63 dòng, hàm selectSources, interface SelectedSources)
- **độ tin**: 31.870 sao, push cuối 2026-08-31
- **đánh đổi**: Ngăn 'more' (tìm thấy nhưng không trích) lộ cho người dùng thấy retrieval trả gì — tốt cho debug một-người-vận-hành như Grown_news, nhưng thêm một khối UI. Không hợp nếu muốn UI tối giản tuyệt đối.

#### SurfSense — CitationRegistry: cấp số [n] kiểu find-or-create, khóa dedup theo (source_type + locator JSON sort_keys)

class CitationRegistry(BaseModel): by_n: dict[int, CitationEntry]; by_key: dict[str, int]; next_n: int = 1. register(source_type, locator, display) -> int: make_key = f"{type}|{json.dumps(locator, sort_keys=True)}" — cùng nguồn hỏi lại trả đúng số cũ, nguồn mới mới mint next_n. resolve(n) -> CitationEntry | None. CitationEntry = {n: int, source_type: StrEnum(kb_chunk|kb_document|connector_item|web_result|chat_turn|anon_chunk|run), locator: dict (danh tính), display: dict (chỉ để UI)}. Có merge(other) thuần (không mutate) cho nhánh agent song song: nguồn trùng giữ n cũ, va số thì re-mint — fold theo n tăng dần để deterministic.

- **nguồn**: https://github.com/MODSetter/SurfSense
- **file/dòng**: surfsense_backend/app/agents/chat/multi_agent_chat/shared/citations/registry.py: make_key dòng 16, register dòng 33, resolve dòng 56, merge dòng 60; models.py: CitationSourceType dòng 11, CitationEntry dòng 23
- **độ tin**: 16.042 sao, push cuối 2026-08-31 (còn sống)
- **đánh đổi**: Registry tách locator (danh tính) khỏi display (UI) rất hợp Grown_news (locator = file#anchor). Nhưng merge() chỉ cần khi có multi-agent song song — Grown_news một luồng thì bỏ hẳn merge, giữ mỗi register/resolve (~30 dòng). Locator dict tự do (không schema) đổi lấy linh hoạt nhưng mất kiểm kiểu.

#### SurfSense — normalizer hậu-parse: viết lại [n] → [citation:payload], số không resolve được thì XÓA im lặng, chừa vùng code

normalize_citations(text, registry) chạy MỘT LƯỢT trên text đã sinh xong (validate ở tầng SAU PARSE, trước render, không phải trong prompt): _ORDINAL = re.compile(r"\[\s*(\d+)\s*\]") sub từng match; rewrite: entry = registry.resolve(int(n)); payload = to_frontend_payload(entry); không resolve/không render được ⇒ trả "" (marker biến mất — docstring: 'a bad citation disappears rather than misleads'). _CODE_REGION = re.compile(r"```[\s\S]*?```|`[^`\n]+`") — chỉ transform ngoài vùng code để arr[1] không thành citation. Comment dài trong mã giải thích vì sao CỐ Ý match cả 'docs[17]' dính liền chữ: bắt buộc non-word trước '[' từng làm rớt citation thật. to_frontend_payload (markers.py) là seam map source_type → payload: kb_chunk→chunk_id, web_result→url, chưa render được→None.

- **nguồn**: https://github.com/MODSetter/SurfSense
- **file/dòng**: surfsense_backend/app/agents/chat/multi_agent_chat/shared/citations/normalizer.py: _ORDINAL dòng 29, normalize_citations dòng 32, rewrite dòng 44; markers.py: to_frontend_payload dòng 16
- **độ tin**: 16.042 sao, push cuối 2026-08-31
- **đánh đổi**: Kiến trúc một-lượt-hậu-parse này CHÍNH LÀ dạng hợp Grown_news nhất (không stream ⇒ không cần buffer kiểu Onyx). Nhưng chính sách 'xóa im lặng' làm câu văn mất chỗ dựa mà người đọc không biết — chỏi ràng buộc 'mọi khẳng định kèm địa chỉ bấm được': với Grown_news, số không resolve nên là tín hiệu TỪ CHỐI/gắn cờ câu đó thay vì xóa marker.

#### danswer (tiền thân Onyx) — match_quotes_to_docs: ép quote khớp nguồn TRƯỚC khi nhận, exact-substring sau normalize, fuzzy có sẵn nhưng tắt

Chữ ký: match_quotes_to_docs(quotes: list[str], chunks: list[InferenceChunk], max_error_percent=QUOTE_ALLOWED_ERROR_PERCENT(=0.05), fuzzy_search=False, prefix_only_length=100) -> DanswerQuotes. Thứ tự bước cho từng quote×chunk: (1) clean_model_quote: strip, bỏ nháy kép bao ngoài, CẮT CÒN 100 KÝ TỰ ĐẦU (chỉ khớp prefix); (2) shared_precompare_cleanup cả quote lẫn chunk: lower() + re.sub(r'\s|\*|\\"|[.,:`"#-]', '', text) — xóa MỌI whitespace và . , : ` " # - * (docstring: LLM hay nắn lại whitespace/ký tự đặc biệt làm hỏng exact match); (3) exact: `if quote_clean not in chunk_clean: continue` rồi offset = chunk_clean.index(quote_clean); nhánh fuzzy: regex.search(r"("+re.escape(quote_clean)+r"){e<="+str(max_edits)+r"}") với max_edits = ceil(len*0.05) — 1 sửa/20 ký tự, comment trong configs ghi 'currently unused due to fuzzy match being too slow'; (4) map offset → link: duyệt chunk.source_links dict {link_offset: link}, lấy link có link_offset <= offset lớn nhất — ĐÂY là cơ chế ra 'địa chỉ bấm được' cấp đoạn giống file#anchor của Grown_news; (5) quote không khớp chunk nào ⇒ không vào DanswerQuotes (bị loại). KHỚP TRÊN VĂN BẢN ĐÃ XÓA DẤU CÂU nên offset là offset của chuỗi đã clean — vẫn dùng được cho source_links vì bảng đó thưa theo section.

- **nguồn**: https://github.com/onyx-dot-app/onyx (mã cũ thời danswer; đọc qua snapshot fork https://github.com/ocean-oo/danswer vì main hiện tại đã xóa)
- **file/dòng**: backend/danswer/one_shot_answer/qa_utils.py: match_quotes_to_docs dòng 103-160; backend/danswer/utils/text_processing.py: shared_precompare_cleanup dòng 71, clean_model_quote ngay trên; backend/danswer/configs/chat_configs.py dòng 49-50: QUOTE_ALLOWED_ERROR_PERCENT = 0.05
- **độ tin**: Mã của repo 31.870 sao NHƯNG là đường ĐÃ CHẾT: onyx main 2026 đã xóa toàn bộ (grep tree main không còn qa_utils/quote) và chuyển hẳn sang citation số [n]; issue #991 ghi nhận quote extraction hay hỏng. Fork snapshot ocean-oo/danswer không rõ ngày đóng băng.
- **đánh đổi**: Bài học kép cho Grown_news: (a) pipeline verify quote = normalize hai phía → substring → offset → tra bảng offset→anchor là khung đáng chép cho cổng 'mọi khẳng định có địa chỉ'; (b) nhưng chính dự án gốc ĐÃ BỎ hướng bắt-LLM-nhả-quote vì mong manh (LLM nắn sửa quote) và fuzzy quá chậm — hướng sống sót là LLM chỉ nhả SỐ [n], còn văn bản trích lấy từ kho theo n. Lưu ý thêm: shared_precompare_cleanup chỉ xóa dấu câu ASCII, KHÔNG đụng chữ có dấu tiếng Việt — dùng được, nhưng phải quyết thêm chuyện normalize NFC/NFD.

#### instructor — exact_citations: validator Pydantic bác fact ngay lúc parse nếu quote không tìm thấy trong context

class Fact(BaseModel): fact: str; substring_quote: List[str]; @model_validator(mode="after") validate_sources(self, info: ValidationInfo): text_chunks = info.context.get("text_chunk"); spans = list(self.get_spans(text_chunks)); self.substring_quote = [text_chunks[s[0]:s[1]] for s in spans] — quote được THAY bằng lát cắt thật từ context. _get_span: for match in re.finditer(re.escape(quote), context): yield match.span() — exact match tuyệt đối (re.escape), không normalize, không fuzzy; không match ⇒ spans rỗng. class QuestionAnswer: validator tầng trên lọc self.answer = [f for f in self.answer if len(f.substring_quote) > 0] — fact mất hết quote bị VỨT khỏi câu trả lời. Context bơm vào lúc gọi: client.create(..., validation_context={"text_chunk": context}). Validate ở tầng PARSE (Pydantic), trước mọi render.

- **nguồn**: https://github.com/567-labs/instructor
- **file/dòng**: docs/examples/exact_citations.md (anchor: class Fact / validate_sources / _get_span / class QuestionAnswer) — là tài liệu ví dụ chính thức của thư viện, không phải module runtime
- **độ tin**: 13.813 sao, push cuối 2026-08-29 (còn sống); nhưng đây là docs example, không có test production đi kèm
- **đánh đổi**: Gọn nhất trong mọi hệ khảo sát (~25 dòng) và đúng tinh thần 'ép quote về nguồn trước khi nhận' — hợp corpus vài trăm bài của Grown_news (re.finditer trên vài trăm KB là rẻ). Đánh đổi: exact tuyệt đối không normalize ⇒ LLM đổi một dấu phẩy là rớt quote (chính là lỗi danswer phải thêm cleanup); và chính sách 'vứt fact im lặng' phải đổi thành từ-chối-có-phân-loại theo luật Grown_news. Kết hợp đúng: validator kiểu instructor + normalize kiểu shared_precompare_cleanup.

#### Anthropic citations API — schema chuẩn char_location + hợp đồng 'server đảm bảo con trỏ hợp lệ'

SDK python (mã sinh từ OpenAPI, là hợp đồng thật): class TextBlock: text: str; citations: Optional[List[TextCitation]]; type: Literal["text"]. class CitationCharLocation: cited_text: str; document_index: int; document_title: Optional[str]; start_char_index: int (0-indexed); end_char_index: int (exclusive); file_id: Optional[str]; type: Literal["char_location"]. Citation là Union discriminated theo 'type': char_location | page_location | content_block_location | web_search_result_location | search_result_location. Docs chính thức khẳng định 2 điều quan trọng cho hợp đồng: 'citations are guaranteed to contain valid pointers to the provided documents' (validate SERVER-SIDE, model nhả format chuẩn nội bộ rồi API parse ra cited_text + location indices) và cited_text KHÔNG tính output token, truyền lại lượt sau cũng không tính input token.

- **nguồn**: https://github.com/anthropics/anthropic-sdk-python + https://platform.claude.com/docs/en/build-with-claude/citations
- **file/dòng**: src/anthropic/types/text_block.py (class TextBlock), src/anthropic/types/citation_char_location.py (class CitationCharLocation), src/anthropic/types/citations_delta.py (Citation TypeAlias + class CitationsDelta); docs anchor 'Example plain text citation' và đoạn 'Better citation reliability'/'Token costs'
- **độ tin**: SDK chính thức Anthropic, cập nhật liên tục (đọc main 2026-09-01)
- **đánh đổi**: Grown_news đã chốt mô phỏng format này — điều PHẢI ghi vào spec: sự 'guaranteed valid' là do server Anthropic validate hộ; khi TỰ mô phỏng schema mà tự sinh citation bằng prompt thì KHÔNG thừa hưởng bảo đảm đó — phải tự cài tầng verify (kiểu instructor/danswer ở trên) mới được quyền ghi start/end_char_index vào response. Mô phỏng đủ trường char_location cho phép sau này đổi sang gọi thẳng citations API mà không đổi hợp đồng FE.

#### Ansari (chatbot Hồi giáo production) — client thật parse citations_delta khi stream: chèn ' [n] ' tại đúng vị trí delta, footer cuối stream

Vòng lặp process_message_history đọc chunk: elif getattr(chunk.delta, "type", None) == "citations_delta": citation = chunk.delta.citation; self.citations.append(citation); citation_ref = f" [{len(self.citations)}] "; assistant_text += citation_ref; yield citation_ref — GIỮ VỊ TRÍ bằng chính thứ tự sự kiện SSE: Anthropic phát citations_delta ngay sau text_delta của đoạn được nó chống lưng (docs: 'Each delta contains a single citation to add to the citations list on the current text content block'), nên chỉ cần chèn marker tại thời điểm delta tới, số n = độ dài list tích lũy. Kết stream, _finish_response render footer: '**Citations**:\n' + từng '[i] {trim_citation_title(document_title)}:\n' + cited_text (kèm xử lý đa ngôn ngữ riêng của họ). Nghĩa là: KHÔNG cần buffer giữ-lại kiểu Onyx vì marker do CLIENT chèn chứ không phải do model nhả ra giữa text.

- **nguồn**: https://github.com/ansari-project/ansari-backend
- **file/dòng**: src/ansari/agents/ansari_claude.py: nhánh citations_delta dòng 827-834, _finish_response dòng 1216-1300 (render footer từ cited_text + document_title)
- **độ tin**: 125 sao nhưng là hệ production thật (ansari.chat), push cuối 2026-08-08 (còn sống)
- **đánh đổi**: Cách đánh số n = len(list) không dedup — cùng một đoạn nguồn bị trích 2 lần sẽ ra [3] và [7] (Onyx dedup bằng recent_cited_documents, SurfSense bằng registry key). Footer text thuần thay vì link bấm được — Grown_news phải thay bằng anchor. Với Grown_news không stream: toàn bộ pattern này thu về 'duyệt blocks[], mỗi citation trong block.citations gắn vào đoạn text của block đó' — vị trí đã nằm sẵn trong cấu trúc response, không phải giữ gì cả; đó là lợi ích cụ thể của việc KHÔNG stream, nên ghi thành quyết định.

#### R2R — CitationTracker: stream bằng cách re-scan text tích lũy + dedup span, ID trích dẫn là chuỗi ngắn thay vì số thứ tự

CITATION_PATTERN = re.compile(r"\[([A-Za-z0-9]{7,8})\]") — model trích bằng short-id 7-8 ký tự (khớp thẳng vào id chunk, ví dụ [abc1234]) thay vì số [1]: số citation tự mang danh tính nguồn, không cần bảng map n→doc theo hội thoại. Streaming: mỗi lần text tích lũy dài ra, gọi find_new_citation_spans(text, tracker) = extract_citation_spans(text) (dict id → list[(start,end)]) rồi lọc qua CitationTracker.is_new_span(cid, span) — tracker giữ processed_spans: dict[str, Set[Tuple[int,int]]] nên span đã phát không phát lại; docstring cảnh báo is_new_span vừa check vừa mark.

- **nguồn**: https://github.com/SciPhi-AI/R2R
- **file/dòng**: py/core/utils/__init__.py: extract_citations dòng 29, CITATION_PATTERN dòng 45, extract_citation_spans dòng 55, class CitationTracker dòng 90, find_new_citation_spans dòng 178; test py/tests/unit/retrieval/test_citations.py
- **độ tin**: 7.984 sao; push cuối 2025-11-07 — ~10 tháng im (chưa quá ngưỡng chết 18 tháng nhưng đang nguội, ghi rõ)
- **đánh đổi**: Short-id hay ở chỗ [id] tự đủ nghĩa (không sợ lệch bảng số), nhưng bắt model chép đúng 7-8 ký tự — corpus lớn dễ sai một ký tự là trật nguồn, và regex [A-Za-z0-9]{7,8} dễ match nhầm text thường. Re-scan toàn văn mỗi delta là O(n²) theo độ dài câu trả lời — chấp nhận được vì câu trả lời ngắn. Grown_news không stream thì chỉ còn giá trị ở ý 'id trích dẫn tự mang danh tính' — tương đương cho model nhả thẳng slug file#anchor, nhưng kinh nghiệm SurfSense/Onyx cho thấy ordinal nhỏ [n] ít bị model chép sai hơn chuỗi dài.

#### Khoj (đối chứng) — references tách rời câu trả lời, không inline citation, không verify

Hệ NotebookLM-alternative lớn nhất còn sống lại KHÔNG làm inline citation: compiled_references là list dict dạng {"compiled": <text đoạn đã ghép>, "file": <đường file>} (thấy rõ ở chỗ dùng: distinct_headings = set([d.get("compiled").split("\n")[0] ...]); distinct_files = set([d["file"] ...])), gom từ kết quả search rồi phát cho client như một sự kiện/trường 'references' TÁCH KHỎI text answer; answer tự do không marker, không tầng validate nào nối khẳng định ↔ nguồn.

- **nguồn**: https://github.com/khoj-ai/khoj
- **file/dòng**: src/khoj/routers/api_chat.py: khai báo compiled_references dòng 740, shape {compiled, file} lộ ở dòng 1123-1125, nạp lại từ hội thoại cũ dòng 990
- **độ tin**: 36.837 sao, push cuối 2026-08-02 (còn sống)
- **đánh đổi**: Đối chứng quan trọng: 'kèm nguồn' kiểu danh-sách-tham-khảo rẻ hơn hẳn (không parser, không validator) nhưng KHÔNG đáp ứng ràng buộc Grown_news 'MỌI khẳng định kèm địa chỉ' — không biết khẳng định nào dựa nguồn nào, không có cơ sở để từ chối có phân loại. Chép Khoj = hạ cấp yêu cầu; ghi vào đây để đừng ai coi 'nhiều sao nhất' là chuẩn đúng.

#### Morphik — CompletionResponse.sources cấp-câu-trả-lời + cờ inline_citations đẩy vào prompt

class ChunkSource(BaseModel): document_id: str; chunk_number: int; score: Optional[float]. class CompletionResponse: completion: Union[str, StructuredCompletion]; usage: Dict[str,int]; finish_reason; sources: List[ChunkSource] = []; metadata. sources = provenance của RETRIEVAL (chunk nào được đưa vào context) chứ không phải của từng khẳng định. CompletionRequest có inline_citations: Optional[bool] = False + chunk_metadata (filename, page) — inline citation làm bằng PROMPT (nhồi metadata để model tự ghi tên file/trang), không có tầng verify sau parse.

- **nguồn**: https://github.com/morphik-org/morphik-core
- **file/dòng**: core/models/completion.py: class ChunkSource, class CompletionResponse, class CompletionRequest (trường inline_citations, chunk_metadata) — dòng 18-54
- **độ tin**: 3.713 sao, push cuối 2026-07-23 (còn sống)
- **đánh đổi**: Minh họa nấc giữa Khoj và Onyx: sources cấp-answer rẻ và trung thực về mặt 'context gồm gì', nhưng inline bằng prompt không verify thì con số/tên file trong câu trả lời là LỜI KHAI của model — đúng loại 'tự khai' mà CLAUDE.md Grown_news cấm dùng làm bằng chứng. Nếu Grown_news có trả sources thì nên trả CẢ HAI: sources (retrieval) và citations (đã verify), đừng lẫn.

#### LibreChat — mã hóa marker bằng Unicode Private Use Area để không đụng cú pháp thường

Thay vì [n] (dễ đụng array-index, phải chừa code-region như SurfSense), LibreChat bắt model nhả marker bằng ký tự PUA:  = anchor đơn, / = mở/đóng nhóm, / = span highlight; anchor có ngữ pháp turn{N}{type}{index} với type ∈ search|image|news|video|ref|file. Regex chịu cả hai dạng (escape literal lẫn ký tự thật) vì model lúc nhả '\\ue202' lúc nhả ký tự U+E202: STANDALONE_PATTERN = /(?:\\ue202|)turn(\d+)(search|image|news|video|ref|file)(\d+)/g; INVALID_CITATION_REGEX xóa anchor mồ côi; CLEANUP_REGEX vét sạch marker khi cần text trơn.

- **nguồn**: https://github.com/danny-avila/LibreChat
- **file/dòng**: client/src/utils/citations.ts (46 dòng: SPAN_REGEX, COMPOSITE_REGEX, STANDALONE_PATTERN, CLEANUP_REGEX, INVALID_CITATION_REGEX + block comment đặc tả ngữ pháp anchor); render tại client/src/components/Web/Citation.tsx
- **độ tin**: ~30k+ sao (repo rất lớn, đang phát triển nóng — push liên tục 2026)
- **đánh đổi**: PUA giải sạch bài toán va chạm cú pháp (không cần code-region carve-out) và span ... còn đánh dấu được ĐOẠN VĂN nào được nguồn chống lưng (gần với cited_text của Anthropic). Giá phải trả: marker vô hình trong log/DB khó debug bằng mắt, model lúc tuân lúc không (bằng chứng là chính họ phải viết regex 2 dạng + regex dọn anchor mồ côi). Với Grown_news một-người-vận-hành, khả năng soi log bằng mắt đáng giá hơn — [n] + carve-out code của SurfSense hợp hơn.

### Góc A — câu hỏi mở

- Chính sách khi MỘT citation trong câu trả lời không verify được: từ chối cả câu trả lời, hay chỉ gắn cờ khẳng định đó và giữ phần còn lại? (Mọi repo khảo sát đều chọn drop-im-lặng — không có tiền lệ mã thật cho 'từ chối có phân loại' cấp-khẳng-định, phải tự thiết kế)
- Normalize tiếng Việt trước khi exact-match: NFC hay NFD, có fold dấu thanh không? shared_precompare_cleanup của danswer chỉ xử lý ASCII — chưa có repo nào khảo sát xử lý CJK/Việt, cần fixture riêng ở thư mục tạm để đo tỉ lệ quote rớt oan
- Bảng offset→anchor sinh ở tầng nào: lúc THỢ index bài vào SQLite (thêm cột source_links JSON kiểu danswer) hay tính lại on-the-fly lúc verify? Corpus vài trăm bài thì on-the-fly có thể đủ rẻ — cần đo
- Mô phỏng Anthropic schema tới đâu: chỉ char_location trên nội dung chunk, hay thêm content_block_location (chunk = block) — nếu sau này gọi thẳng citations API của Anthropic (THỢ đã là nơi duy nhất gọi model) thì content documents với chunk tự cắt sẵn khớp mô hình kho hơn plain-text?
- LLM nhả [n] sai số nhưng verify quote vẫn đậu (số đúng tài liệu, quote thuộc tài liệu khác): có cần verify chéo quote∈chunk-của-chính-n như instructor làm theo từng fact, hay chấp nhận rủi ro? PR onyx #3508 cho thấy ngay cả hệ lớn cũng vật lộn với consistency số citation qua re-ranking

### Góc B — khuyến nghị

Cho M14, ghép 4 mảnh đã có mã thật chống lưng: (1) REFUSAL — làm 2 tầng như paper-qa: tầng code quyết `khong-co-trong-kho` khi FTS5 trả 0 hàng (đừng đặt ngưỡng tuyệt đối trên bm25() thô — chính ragflow search.py:736 tự tắt threshold khi điểm chỉ còn term-only; ngưỡng 0.2 của họ chỉ có nghĩa trên điểm hybrid đã chuẩn hoá); tầng model quyết 'có chunk nhưng không đủ / mâu thuẫn / ngoài phạm vi' bằng trường enum trong JSON output (ép schema kiểu tool-call như azure-demo), kèm sentinel phrase kiểm được bằng regex như CANNOT_ANSWER_PHRASE của paper-qa — nhánh `co-nhung-mau-thuan` không có tiền lệ OSS, phải tự viết AC + testcase, log lại mọi lần nó bắn để chỉnh. (2) KÍCH THƯỚC — lấy epistemic.technology làm trần: ~1.600 dòng / 9 file (api / chatbot-orchestration / db / documents / llm tách riêng), M14 không có lý do vượt 2.000 dòng. (3) MULTI-TURN — giai đoạn đầu làm kiểu epistemic (nhét history vào 1 user message, 0 model call phụ); chỉ nâng lên condense-question khi có tín hiệu vận hành, và khi nâng thì chép prompt Onyx (thiên vị GIỮ NGUYÊN câu hỏi, 4 phép biến đổi) + fallback '0'→câu gốc của azure-demo. (4) ĐIỂM RẼ HYBRID — nếu muốn giữ luật refusal theo ngưỡng thì rẽ theo kiểu ragflow (weighted-sum chuẩn hoá, threshold 0.2 làm mốc khởi điểm) chứ KHÔNG theo RRF của sqlite-rag (rank-only, mất độ lớn điểm), dù SQL một-câu của sqlite-rag là mẫu thi công đẹp nhất cho SQLite.

### Góc B — patterns (7)

#### Refusal hai-nhánh quyết bằng CODE + sentinel phrase quyết bằng MODEL (paper-qa)

Cấu trúc 3 tầng: (1) hằng số sentinel `CANNOT_ANSWER_PHRASE = "I cannot answer"` (prompts.py:28, kèm comment: sentinel phải (a) dẫn tới complete-tool với has_successful_answer=False, (b) dùng được cho unit test); (2) qa_prompt ra lệnh: 'If the context provides insufficient information reply "I cannot answer."' — model quyết trường hợp CÓ chunk nhưng không đủ; (3) nhánh refusal quyết bằng code TRƯỚC khi gọi model: `if len(context_str.strip()) <= EMPTY_CONTEXTS:` trả `f"{CANNOT_ANSWER_PHRASE} this question due to {'having no papers' if not self.docs else 'insufficient information.'}"` — tức HAI lý do phân biệt (kho rỗng ≠ retrieval không ra gì) quyết bằng if/else, không tốn model call. Trạng thái lưu ở `has_successful_answer: bool | None` (types.py:344). Gate evidence: mỗi chunk được LLM chấm `relevance_score` 0–10 (parse chống lỗi ở core.py:27-117, kể cả model trả "8/10"), chỉ giữ `c.score > 0` (docs.py:583).

- **nguồn**: https://github.com/Future-House/paper-qa
- **file/dòng**: src/paperqa/prompts.py:25-28 (CANNOT_ANSWER_PHRASE), prompts.py:52-70 (qa_prompt), src/paperqa/docs.py:649-652 (nhánh refusal 2 lý do), docs.py:583 (filter score>0), src/paperqa/types.py:344 (has_successful_answer), src/paperqa/core.py:27-117 (parse relevance_score)
- **độ tin**: 9.131 sao, push cuối 2026-08-26 (sống)
- **đánh đổi**: Gate evidence bằng LLM = mỗi câu hỏi tốn N model call chấm điểm chunk — đắt và chậm, KHÔNG hợp Grown_news giai đoạn FTS5 thuần (THỢ chỉ nên gọi model 1-2 lần/lượt). Cái chép được là: sentinel phrase + comment thiết kế của nó, và nhánh refusal 2 lý do quyết bằng code trước khi gọi model. Lý do thứ 3 của Grown_news (co-nhung-mau-thuan) KHÔNG có trong mã này lẫn mọi repo đã soi.

#### Ngưỡng từ-chối-vì-không-đủ trên điểm hybrid ĐÃ CHUẨN HOÁ, tự tắt khi chỉ còn BM25 (ragflow)

Chữ ký: `async def retrieval(self, question, embd_mdl, ..., similarity_threshold=0.2, vector_similarity_weight=0.3, ...)` — điểm cuối = 0.7*token_sim + 0.3*cosine, cả hai đã chuẩn hoá về [0,1]. Lọc: `post_threshold = 0.0 if vector_similarity_weight <= 0 else similarity_threshold` rồi `valid_idx = [i for i in sorted_idx if sim_np[i] >= post_threshold]` (search.py:736-740) — comment gốc: 'When vector_similarity_weight is 0, similarity_threshold is not meaningful for term-only scores' — TỰ TẮT ngưỡng khi điểm chỉ còn term/BM25. Refusal: `_empty_response_applies(knowledges, ...)` = retrieval rỗng VÀ không có attachment (dialog_service.py:586-591) → trả `prompt_config["empty_response"]` (câu từ chối do người vận hành cấu hình, dialog_service.py:806-808). Ngưỡng chỉnh per-dialog qua `dialog.similarity_threshold`.

- **nguồn**: https://github.com/infiniflow/ragflow
- **file/dòng**: rag/nlp/search.py:596-604 (chữ ký retrieval, threshold=0.2), search.py:736-740 (lọc + guard term-only), api/db/services/dialog_service.py:586-591 (_empty_response_applies), dialog_service.py:806-808 (nhánh empty_response)
- **độ tin**: 89.762 sao, push cuối 2026-08-31 (rất sống)
- **đánh đổi**: Con số 0.2 CHỈ có nghĩa vì điểm đã chuẩn hoá và có thành phần vector. Chính ragflow thừa nhận trong code: ngưỡng tuyệt đối trên điểm term-only (BM25) là vô nghĩa. Hệ quả trực tiếp cho Grown_news FTS5+BM25 thuần: KHÔNG đặt ngưỡng tuyệt đối trên bm25() thô (âm, không chặn trên, phụ thuộc corpus); luật khả thi là '0 hàng FTS match = khong-co-trong-kho', còn 'có hàng nhưng không đủ' phải để model quyết qua sentinel.

#### Condense-question viết tay không framework, thiên vị GIỮ NGUYÊN câu hỏi (Onyx)

Luồng: `semantic_query_rephrase(...)` (query_expansion.py:71) build messages từ dataclass tự định nghĩa (SystemMessage/UserMessage trong onyx.llm.models — không langchain chain) → 1 model call → nếu rỗng raise RuntimeError. Prompt system: 'You are an assistant that reformulates the last user message into a standalone, self-contained query suitable for semantic search...'. Prompt user chứa quyết định thiết kế đáng chép nhất: 'In most cases, it should be exactly the same as the last user query... in most cases the history and extra context should be ignored', kèm đúng 4 phép biến đổi được phép: (1) chèn ngữ cảnh từ history ('How do I set it up?' → 'How do I set up software Y?'), (2) bỏ phần yêu cầu không phải tìm kiếm ('Can you summarize the calls with X' → 'calls with X'), (3) điền thông tin user, (4) bỏ tên nguồn/app ('Search Google Drive for the SLA doc' → 'SLA doc'). Kết thúc: 'CRITICAL: ONLY provide the standalone query and nothing else.'

- **nguồn**: https://github.com/onyx-dot-app/onyx
- **file/dòng**: backend/onyx/secondary_llm_flows/query_expansion.py:71-151 (semantic_query_rephrase), backend/onyx/prompts/search_prompts.py:15 (SEMANTIC_QUERY_REPHRASE_SYSTEM_PROMPT) và :24 (USER_PROMPT với 4 phép biến đổi)
- **độ tin**: 31.870 sao, push cuối 2026-08-31 (rất sống)
- **đánh đổi**: Thêm 1 model call mỗi lượt chat (độ trễ + tiền). Prompt mặc định 'giữ nguyên câu hỏi' làm giảm rủi ro condense phá query tốt — đây là bài học từ vận hành thật của họ. Với Grown_news corpus vài trăm bài, single-turn không cần bước này; chỉ bật khi có multi-turn thật. Onyx tổng thể RẤT to (không phải hình mẫu kích thước) — chỉ chép đúng flow file này.

#### Query-rewrite qua tool-call + fallback về câu hỏi gốc bằng token '0' (azure-search-openai-demo)

Ba mảnh: (1) prompt few-shot `query_rewrite.system.jinja2`: 'Generate a search query based on the conversation and the new question... If you cannot generate a search query, return just the number 0' + 2 ví dụ mẫu + vòng lặp jinja render history; (2) ép kết quả qua function-calling: `chat_query_rewrite_tools.json` khai đúng 1 function `search_sources{search_query: string}`; (3) fallback trong code: `QUERY_REWRITE_NO_RESPONSE = "0"` (approach.py:231) và `def get_search_query(self, response, default_query): try: return self.extract_rewritten_query(response, default_query, no_response_token=self.NO_RESPONSE) except Exception: return default_query` (chatreadretrieveread.py:107-113) — model trả '0' hoặc lỗi bất kỳ ⇒ dùng nguyên văn câu hỏi user làm query. Ngưỡng điểm: `minimum_search_score`/`minimum_reranker_score` đọc từ overrides mặc định 0.0 (chatreadretrieveread.py:317-318), lọc `(doc.score or 0) >= ... and (doc.reranker_score or 0) >= ...` (approach.py:351-352) — mặc định TẮT, phơi ra config cho người vận hành chỉnh. Refusal chỉ bằng prompt: 'Answer ONLY with the facts listed in the list of sources below. If there isn't enough information below, say you don't know.' (chat_answer.system.jinja2).

- **nguồn**: https://github.com/Azure-Samples/azure-search-openai-demo
- **file/dòng**: app/backend/approaches/prompts/query_rewrite.system.jinja2, prompts/chat_query_rewrite_tools.json, approaches/chatreadretrieveread.py:107-113 (get_search_query) và :317-318, approaches/approach.py:231 (NO_RESPONSE='0') và :351-352 (lọc điểm), prompts/chat_answer.system.jinja2 (refusal + citation [tên-file])
- **độ tin**: 7.750 sao, push cuối 2026-08-27 (sống, repo mẫu chính thức của Azure)
- **đánh đổi**: Tool-call ép được output sạch nhưng cần model hỗ trợ function calling (Anthropic API có — hợp hợp đồng JSON của Grown_news). Ngưỡng mặc định 0.0 = họ KHÔNG dám chọn số cho người dùng, đúng triết lý 'điểm rẽ = tín hiệu vận hành'. Reranker score của họ là thang 0–4 của Azure semantic ranker — con số không mang sang FTS5 được.

#### Hình mẫu kích thước: RAG chat service 1.600 dòng / 9 file, không framework (epistemic.technology)

Đếm thật từ raw (không tính *_test.go): main.go 78 · internal/api/api.go 80 (HTTP handler) · internal/chatbot/chatbot.go 99 (orchestration) · internal/backend/db.go 385 (SQLite+sqlite-vec) · documents.go 298 (nạp+chunk theo đoạn từ thư mục Hugo .md) · embeddings.go 74 · llm.go 47 (client OpenAI trực tiếp, system prompt go:embed từ file .md) · cmd/cli/cli.go 416 · cmd/chat/chat.go 123 = 1.600 dòng Go. Toàn bộ vòng chat trong MỘT hàm: `func Chat(c *ChatBot, userID int, query string, history string) (response string, references []backend.Chunk, sources []backend.Document, err error)` = embed(query) → SimilaritySearch(db, emb, 5) → buildUserQuery(query, history, chunks) ghép '{history}\n\n{docs}\n\n{query}' thành 1 user message → 1 model call → DocumentsFromChunks trả nguồn. Multi-turn = nhét nguyên history vào prompt, KHÔNG condense. Refusal = 1 dòng system prompt ('outside of the scope... politely decline'). Bài viết kèm: https://epistemic.technology/blog/2025-03-31-building-a-chatbot/

- **nguồn**: https://github.com/Epistemic-Technology/epistemic.technology
- **file/dòng**: chatbot-backend/internal/chatbot/chatbot.go (hàm Chat, buildUserQuery), chatbot-backend/internal/backend/llm.go (hàm Chat gọi OpenAI), db.go, documents.go, embeddings.go — cây file + số dòng đếm từ raw ngày 2026-09-01
- **độ tin**: 1 sao (repo cá nhân của tác giả blog), push cuối 2025-09-14 (~12 tháng im — chưa quá mốc chết 18 tháng nhưng gần như ngủ)
- **đánh đổi**: Độ tin theo sao rất thấp — giá trị của nó là BẰNG CHỨNG KÍCH THƯỚC: một người, một blog cá nhân, chatbot RAG đủ chạy production trong 1.600 dòng không framework — đúng cỡ M14 nên nhắm (<2.000 dòng). Tác giả tự khai tradeoff trong bài: 'always return the top five results, regardless of how close' → citation rác khi câu hỏi ngoài phạm vi; refusal chỉ bằng prompt nên không có phân loại lý do. Grown_news phải làm TỐT HƠN đúng hai chỗ đó.

#### Hybrid FTS5+vector bằng MỘT câu SQL RRF — mã sẵn cho điểm rẽ hybrid (sqlite-rag)

`search_documents(self, query_embedding: bytes, fts_query: str, top_k: int)` (engine.py:152) chạy 1 câu SQL: CTE `vec_matches` (sqlite-vec KNN) + CTE `fts_matches` (`FROM chunks_fts WHERE chunks_fts MATCH :query`, query build bằng `" ".join(re.findall(r"\b\w+\b", query.lower())) + "*"` engine.py:138) → `FULL OUTER JOIN` trên chunk_id → điểm = `COALESCE(1.0/(:rrf_k + vec_matches.rank_number),0.0)*:weight_vec + COALESCE(1.0/(:rrf_k + fts_matches.rank_number),0.0)*:weight_fts` (engine.py:196-197). Hằng số: DEFAULT_RRF_K=60 (engine.py:19, comment 'good default'), weight_fts=1.5 > weight_vec=1.0 (settings.py:53-54 — ưu tiên keyword hơn vector!). KHÔNG có ngưỡng tuyệt đối nào trong toàn bộ đường tìm kiếm — RRF chỉ dùng THỨ HẠNG.

- **nguồn**: https://github.com/sqliteai/sqlite-rag
- **file/dòng**: src/sqlite_rag/engine.py:19 (DEFAULT_RRF_K=60), :138 (build fts_query), :152-253 (search_documents với SQL RRF), src/sqlite_rag/settings.py:53-54 (weight_fts=1.5, weight_vec=1.0)
- **độ tin**: 81 sao, push cuối 2025-11-18 (~9,5 tháng im — chưa chết theo mốc 18 tháng nhưng đang nguội; đội SQLite AI chính chủ)
- **đánh đổi**: Đúng khẩu vị Grown_news (mọi thứ trong SQLite, khi rẽ hybrid chỉ thêm 1 CTE, giữ 1 file DB). Nhưng RRF vứt bỏ ĐỘ LỚN điểm, chỉ giữ thứ hạng ⇒ càng không thể dựng ngưỡng 'không có trong kho' trên điểm RRF; nếu Grown_news muốn giữ luật refusal theo ngưỡng khi rẽ hybrid thì phải chọn kiểu ragflow (weighted-sum trên điểm chuẩn hoá) thay vì RRF. Chi tiết weight_fts=1.5>1.0 là dữ kiện ủng hộ quyết định FTS5-trước của dự án.

#### Refusal enum 3 lý do đúng như hợp đồng Grown_news — KHÔNG tìm thấy tiền lệ nguyên khối trong OSS **[giả định]**

Sau khi soi paper-qa, ragflow, onyx, azure-demo, sqlite-rag, epistemic và quét search: không repo nào trả enum lý do từ chối 3 giá trị (không-có / có-nhưng-mâu-thuẫn / ngoài-phạm-vi) trong hợp đồng JSON. Cái tồn tại trong mã thật chỉ là 2 cơ chế: (a) nhánh code khi retrieval rỗng (ragflow empty_response; paper-qa 'having no papers') ↔ khong-co-trong-kho; (b) model tự nói câu từ chối theo prompt, code bắt bằng sentinel/regex (paper-qa CANNOT_ANSWER_PHRASE) ↔ gộp chung 'không đủ'. Riêng phát-hiện-mâu-thuẫn-giữa-các-nguồn: không thấy trong mã sản phẩm nào đã đọc — chỉ có trong giấy tờ benchmark/eval. Grown_news sẽ phải TỰ THIẾT KẾ nhánh co-nhung-mau-thuan (khả dĩ: bắt model khai trường `refusal_reason` trong JSON output — tựa cách azure ép qua tool-call).

- **nguồn**: tổng hợp từ 6 repo đã dẫn ở các pattern trên
- **file/dòng**: không có — đây là kết luận PHỦ ĐỊNH sau khi đọc các file đã liệt kê ở pattern 1, 2, 4
- **độ tin**: giới hạn: chỉ quét được bằng web search + đọc tay 6 repo; GitHub code search và grep.app đều chặn phiên không đăng nhập nên không quét exhaustive được
- **đánh đổi**: Vì là kết luận phủ định nên có rủi ro bỏ sót repo nhỏ. Hệ quả thiết kế: đừng tìm 'chuẩn ngành' để chép cho enum 3 lý do — chuẩn ngành thực tế chỉ có 2 nhánh; nhánh thứ 3 là điểm khác biệt tự chịu, cần AC + testcase riêng khi viết spec M14.

### Góc B — câu hỏi mở

- Nhánh co-nhung-mau-thuan quyết bằng gì khi không có mã tham chiếu: bắt model tự khai trong trường JSON (rẻ, nhưng model tự chấm chính nó — chỏi luật gốc 'không ai sở hữu thước đo mình'), hay so metadata frontmatter (hai bài cùng concept, kết luận ngược) bằng code ở tầng LÕI?
- Sentinel phrase tiếng Việt chọn chuỗi nào để không va chạm nội dung thật trong kho và regex bắt được ổn định (paper-qa ghi chú rõ sentinel phải phục vụ cả unit test)?
- Ngưỡng '0 hàng FTS = khong-co-trong-kho' có quá thô với tiếng Việt không — FTS5 tokenizer mặc định tách tiếng Việt kém, một câu hỏi diễn đạt khác từ vựng có thể ra 0 hàng dù kho CÓ bài; cần đo tỉ lệ từ-chối-oan trên corpus thật trước khi chốt?
- Khi nào tín hiệu vận hành đủ để bật condense-question: đếm bao nhiêu phần trăm lượt hỏi multi-turn thất bại retrieval vì đại từ ('nó', 'cái đó') thì mới đáng thêm 1 model call/lượt?
- Điểm bm25() thô của FTS5 có nên log vào DB ngay từ giờ (cột score trong bảng truy vấn) để 3-6 tháng sau có dữ liệu chọn ngưỡng/chọn kiểu hybrid — chi phí gần 0 nhưng phải vào schema từ đầu?

### Phản biện (12 pattern được kiểm bằng fetch lại mã)

| phán quyết | pattern | lý do |
|---|---|---|
| **CONFIRMED** | 1. Onyx — DynamicCitationProcessor: buffer giữ-lại token khi stream | Fetch raw backend/onyx/chat/citation_processor.py trên main: cả hai regex khớp NGUYÊN VĂN (possible_citation_pattern neo $ bắt citation dở dang, citation_pattern bắt citation hoàn chỉnh), process_token yield str·CitationInfo, _process_citation có nhánh 'if num not in self.citation_to_doc: ... contin |
| **CONFIRMED** | 2. Onyx — wire schema CitationInfo tối giản (số, document_id) | streaming_models.py thật có class CitationInfo(BaseObj) đúng 2 trường nghiệp vụ (citation_number: int, document_id: str) + type Literal; SearchDoc quả thật KHÔNG nằm trong packet này mà import từ onyx.context.search.models và đi qua packet search-tool riêng (SearchToolDocumentsDelta) — class hiện ở  |
| **CONFIRMED** | 3. Onyx mobile — selectSources chia 3 ngăn cited/more/files | File mobile/src/chat/citations.ts tồn tại, interface SelectedSources đủ 6 trường {cited, more, files, iconDocs, count, hasSources}; cited theo thứ tự trích lần đầu (duyệt state.citations), more = all.filter(doc => !isFileDoc(doc) && !citedIds.has(doc.document_id)) — đúng như mô tả, repo Onyx đang số |
| **CONFIRMED** | 4. SurfSense — CitationRegistry find-or-create, khóa dedup (source_type + locator JSON sort_keys) | registry.py thật có CitationRegistry(BaseModel) với by_n/by_key/next_n=1, make_key = f"{type_value}·{json.dumps(locator, sort_keys=True, default=str)}" (thêm default=str so với trích dẫn, không đổi bản chất dedup), register/resolve/merge đều có; repo sống (commit 2026-08-29). |
| **CONFIRMED** | 5. SurfSense — normalizer hậu-parse: [n] → [citation:payload], số không resolve XÓA im lặng, chừa vùng code | normalizer.py thật: _ORDINAL = r"\[\s*(\d+)\s*\]" nguyên văn, rewrite trả '' khi không resolve (xóa im lặng), gọi to_frontend_payload(entry), và có _outside_code chừa fenced block + inline code — đúng cả 4 điểm cấu trúc. |
| **CONFIRMED** | 6. danswer — match_quotes_to_docs: exact-substring sau normalize, fuzzy có sẵn nhưng tắt | Fetch fork snapshot ocean-oo/danswer đúng như nguồn đã khai: chữ ký khớp NGUYÊN VĂN (max_error_percent=QUOTE_ALLOWED_ERROR_PERCENT, fuzzy_search=False, prefix_only_length=100 -> DanswerQuotes), thứ tự bước clean_model_quote cắt 100 ký tự → shared_precompare_cleanup → 'if quote_clean not in chunk_cle |
| **CONFIRMED** | 7. instructor — exact_citations: validator Pydantic bác fact lúc parse | docs/examples/exact_citations.md trên main 567-labs/instructor có đúng class Fact với @model_validator(mode="after") validate_sources đọc info.context.get("text_chunk"), ghi đè substring_quote từ spans, và QuestionAnswer lọc fact có len(substring_quote)>0 — đúng là tài liệu ví dụ chính thức, không p |
| **CONFIRMED** | 8. Anthropic citations API — schema char_location | citation_char_location.py trong anthropic-sdk-python có đủ 6 trường đúng như khai (cited_text, document_index, document_title Optional, start_char_index, end_char_index, type Literal["char_location"]); lưu ý nhỏ: chú thích '0-indexed/exclusive' không nằm trong file SDK mà ở docs — phần docs anchor k |
| **CONFIRMED** | 9. Ansari — parse citations_delta khi stream, chèn ' [n] ' tại vị trí delta, footer cuối stream | ansari_claude.py thật chứa đúng khối 'elif getattr(chunk.delta, "type", None) == "citations_delta": citation = chunk.delta.citation; self.citations.append(citation); citation_ref = f" [{len(self.citations)}] "; assistant_text += citation_ref; yield citation_ref' và _finish_response render footer từ  |
| **CONFIRMED** | 10. R2R — CitationTracker: re-scan text tích lũy + dedup span, ID là chuỗi ngắn 7-8 ký tự | py/core/utils/__init__.py có CITATION_PATTERN = re.compile(r"\[([A-Za-z0-9]{7,8})\]") nguyên văn, extract_citations/extract_citation_spans/CitationTracker (processed_spans + is_new_span dedup) đều có; hai sai lệch nhỏ phải ghi chú: (a) find_new_citation_spans là HÀM đứng ngoài (~dòng 143-165) gọi tr |
| **CONFIRMED** | 11. Khoj (đối chứng) — references tách rời, không inline citation, không verify | api_chat.py thật: compiled_references: List[Any] = [] khởi tạo trong event_generator, shape {compiled, file} lộ đúng ở hai dòng distinct_headings = set([d.get("compiled").split("\n")[0] ...]) và distinct_files = set([d["file"] ...]), nạp lại từ hội thoại cũ qua [ref.model_dump() for ref in last_mess |
| **CONFIRMED** | 12. Morphik — CompletionResponse.sources cấp-câu-trả-lời + cờ inline_citations | core/models/completion.py thật: ChunkSource(document_id, chunk_number, score Optional) dòng ~14-18, CompletionResponse có sources: List[ChunkSource] = [] dòng ~21-28, CompletionRequest có inline_citations: Optional[bool] = False (dòng 44) và chunk_metadata (dòng 43); repo sống (commit 2026-07-23, 3. |
