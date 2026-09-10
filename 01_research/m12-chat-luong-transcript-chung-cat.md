# M12 — chất lượng transcript + chưng cất so với mẫu ChatGPT

> s1 · 2026-09-09. Yêu cầu gốc: `original_request.md` §2026-09-09-b.
> Hai mẫu đối chứng chủ dự án đưa: `transcript_exam_review.pdf` (6 trang) và
> `tom_tat_buoi_on_thi.pdf` (4 trang) — cùng một video `thay_on_bai_thi_final.mp4`,
> ~28 phút, tiếng Anh. Bản ghi ấy **có trong kho ta** (`_recycle/video/thay-on-bai-thi-final.1.md`)
> nên so được trên cùng nguồn.

Ba nhãn dùng xuyên suốt: **[F]** fact có nguồn/đo được · **[S]** suy luận · **[G]** giả định chưa đo.

---

## 1 · Mẫu ChatGPT — đọc ra gì

### 1.1 Transcript (`transcript_exam_review.pdf`)

| thuộc tính | mẫu | nguồn |
|---|---|---|
| đầu trang | tên file · thời lượng · ngôn ngữ · **model** ("Whisper turbo + Silero VAD") · cảnh báo tên riêng | [F] trang 1 |
| đơn vị | đoạn **~30–35 giây**, mốc `[mm:ss]` ở đầu đoạn | [F] đo 6 trang: 28 phút ⇒ ~60 đoạn |
| câu | có dấu chấm, viết hoa, giữ filler ("you know", "Okay") — verbatim | [F] |
| typeset | Computer Modern, lề rộng, đánh số trang | [F] nhìn |

### 1.2 Chưng cất (`tom_tat_buoi_on_thi.pdf`)

| thuộc tính | mẫu | nguồn |
|---|---|---|
| đầu trang | file gốc · thời lượng · ngôn ngữ · **bối cảnh 3 dòng** (ai, bao nhiêu người, hoàn cảnh) | [F] |
| khung mục | **7 mục sinh từ NỘI DUNG**: cấu trúc đề · bảng bài toán→kỹ thuật · công cụ · thời gian · cách ôn · tóm syllabus · 3 điều mất điểm | [F] |
| bảng | **3 bảng** (điểm từng phần · bài toán→kỹ thuật · phân bổ thời gian) | [F] |
| trích dẫn | câu giảng viên trong ngoặc kép, **không** mốc giờ, **không** `[slug:p.N]` | [F] |
| cảnh báo | ⚠️ cho điều dễ mất điểm | [F] |

**[S]** Thứ làm mẫu "đọc được" không phải model — là ba phép **hậu xử lý**: gộp
đoạn ~30 s, header metadata, và khung mục **theo nội dung** thay vì theo khuôn.

---

## 2 · M12 hôm nay — đo trên máy này

### 2.1 Transcript

| | M12 | nguồn |
|---|---|---|
| ASR | **Gemini qua cửa** (`gemini-2.5-flash-lite` mặc định), chunk **300 s**, lối `cua-asr` `uu_tien 1` | [F] `model.json`, `nguong.json:giay_moi_doan_asr` |
| prompt ASR | `_YEU_CAU`: chỉ đòi JSON `{tu,den,text}` — **không** đòi dấu câu, ngôn ngữ, hay độ dài đoạn | [F] `asr_cua.py` |
| output | `text/vtt`, **213 cue / ~13 phút** ⇒ cue 1–9 s | [F] `kb/_media/0f23…vtt` |
| màn | tab Transcript: `<ol class="tr">`, **mỗi cue một dòng** | [F] `cctab.inline.ts:2213` |
| xuất | `.vtt` · `.txt` (chỉ **lột mốc giờ**, không gộp) · `.docx` (npm `docx`, lột markdown) | [F] `xuat-cua.mjs:86,108` |
| header | **không** — không tên file, thời lượng, ngôn ngữ, model | [F] |
| PDF | **không có đường nào** | [F] |
| độ tin cửa | đo 2026-09-05: 3 lần gọi cùng clip, **1 thành công**; stream cắt ở ~175 s; "bản phiên âm cụt" phải retry | [F] `nguon-transcript.json` `$vi_sao_*`, `asr_cua.PhienAmCut` |
| ASR local | `faster-whisper` **chưa cài** (`ModuleNotFoundError`); máy **56 nhân CPU, không GPU** | [F] đo |

### 2.2 Chưng cất

| | M12 | nguồn |
|---|---|---|
| khung | **cố định 5 mục**: Overview · Bối cảnh · Nội dung (3.1–3.4) · Ý nghĩa · Rủi ro | [F] `worker._PROMPT` |
| ràng buộc | mục 1+2 ≤ ¼ chữ; mọi mục từ 3.1 phải có `[slug:p.N]`; quote nguyên văn, verify fuzzy ≥ 88 | [F] `_PROMPT`, `nguong.json` |
| bảng | prompt **không nhắc**; FE `md()` **có** render `<table>` | [F] `multiwindow.inline.ts:272` |
| header | frontmatter đủ (slug, url, analyzed_at…) — nhưng **không in** thời lượng/ngôn ngữ/model | [F] |
| chất văn | bản `xgboost-taylor-bac-hai` đọc **tốt**, có công thức, có `[§II.6.1]` | [F] `_inbox/…da-vao-kho.md` |

**[S]** Điểm khác cốt lõi với mẫu KHÔNG phải model yếu. Là **thiết kế**: M12 chọn
khung cố định + citation để **verify được** (`M12-R2`, `verify.py`); ChatGPT chọn
khung theo nội dung + không citation để **đọc sướng**. Với **tài liệu kỹ thuật**
khung M12 hợp; với **buổi học / talkshow**, "3.1 Đầu vào · 3.2 Process · 3.3 Output"
là gượng — không có "đầu vào" cho một buổi ôn thi.

---

## 3 · Khảo giải pháp

### 3.1 ASR — ba đường

| đường | được | thiếu | giá |
|---|---|---|---|
| **A · giữ Gemini, sửa prompt + hậu xử lý** | 0 gói mới; đòi dấu câu + gộp đoạn ~30 s trong prompt hoặc code | không sửa được **cửa chập chờn** (1/3 thành công) | 0 |
| **B · `faster-whisper large-v3-turbo` local** | lối `ytdlp-asr-local` **đã khai** trong bảng (`uu_tien 3`) và **module `asr.py` tồn tại** (WhisperModel INT8, `vad_filter=True`); VAD Silero tích hợp, `word_timestamps`, `BatchedInferencePipeline` [F¹]; 0 egress, chạy offline; đúng model mẫu dùng | ⚠️ **worker KHÔNG nối tới `asr.py`** — `_chon_loi` trả lối `uu_tien` thấp nhất ⇒ luôn `cua-asr`, và `worker.py` không `import asr` [F, đo `grep`]. Tức đây là **dòng bảng khai chưa có mã chạy**, không phải "chỉ thiếu cài gói". Gói cũng chưa cài. CPU 56 nhân INT8 — **[G]** tốc độ chưa đo | mã nối + RAM + CPU |
| **C · Gemini 3.5 Transcribe / model STT chuyên** | "reframes transcription as reasoning": tự sửa nói lắp, format, phân người nói [S²] | chưa có trong `model.json`; qua cửa nên vẫn chập chờn | theo cửa |

¹ [faster-whisper](https://github.com/SYSTRAN/faster-whisper): Silero VAD mặc định
bỏ im lặng > 2 s, `word_timestamps=True`, batched pipeline.
[whisper-large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo):
decoder **32 → 4 lớp**, 809M vs 1550M tham số, MIT, WER 7.83 / RTFx 200 trên
open-asr-leaderboard, "minor quality degradation".
² [orcarouter](https://www.orcarouter.ai/blog/gemini-3-5-transcribe-vs-whisper-large-v3-turbo),
[codesota 2026](https://www.codesota.com/guides/speech-recognition) chấm Whisper 9.2 vs
Gemini Flash STT 8.6 cho "finished transcript". **[S]** — bài so sánh thương mại, không
phải benchmark độc lập; con số đo được của TA (1/3 thành công) nặng hơn.

**[S] Gộp đoạn là hậu xử lý, không phải việc của model.** Luật xác định:
gộp cue liên tiếp tới khi ≥ 30 s **hoặc** gặp dấu kết câu sau ≥ 20 s; mốc = `tu`
của cue đầu. 0 lời gọi, chạy được trên **mọi** `.vtt` đã có trong kho — kể cả
213 cue hiện tại. Đây là thứ rẻ nhất mua được nhiều nhất.

### 3.2 Chưng cất — khung theo loại nguồn

| hướng | được | mất |
|---|---|---|
| **giữ 5 mục** | verify giữ nguyên, 0 đổi | bài giảng đọc gượng |
| **model tự đề xuất mục** (như ChatGPT) | đọc sướng | `_than_theo_khung` và verify mất neo; `M12-R2` yếu đi |
| **bảng khai KHUÔN theo `loai_noi_dung`** — `ky-thuat` (5 mục hiện tại) · `bai-giang` (cấu trúc · bảng khái niệm · điều cần nhớ · lỗi hay gặp) · `talkshow` (người nói · luận điểm · tranh cãi · trích) | đọc đúng thể loại, verify **giữ** (mỗi khuôn vẫn buộc 2 mục neo: *Tinh túy* + *Rủi ro/Lưu ý*, vẫn `[slug:p.N]`) | thêm một bảng khai + một cột chọn khuôn (người chọn hoặc model gợi ý) |

**[S]** Hướng ba là hướng của dự án: *"thêm một thứ là thêm một dòng bảng khai"*.
Và bảng biểu: chỉ cần thêm một câu vào prompt — *"liệt kê ≥ 3 cặp thì dùng bảng
Markdown"* — FE đã render được.

**[S]** Header (file gốc · thời lượng · ngôn ngữ · model · bối cảnh): dữ liệu **đã
có** — `media.ten_goc`, cue cuối `.den`, `model_asr` trong `phan-hoi.json`, frontmatter.
Chỉ chưa ai in ra. Bối cảnh 3 dòng là một mục prompt.

### 3.3 In ra PDF

Máy đo 2026-09-09: **không** pandoc · TeX · LibreOffice · weasyprint · reportlab.
Có: npm `docx`, `pypdfium2` (chỉ đọc).

| máy in | cài | chất | tiếng Việt | nguồn |
|---|---|---|---|---|
| **Typst** | **một binary ~vài chục MB**; `pandoc --pdf-engine=typst` **27× nhanh hơn xelatex** (356 ms vs 9.65 s) | typeset thật; font nhúng **New Computer Modern** — cùng họ với font của mẫu ChatGPT | **[F]** NCM phủ dấu tiếng Việt — **ĐO 2026-09-10: đủ 100%**. `typst 0.15.1`, biên dịch 0 cảnh báo; trích chữ khỏi PDF bằng `pypdf` và đối chiếu 74 ký tự (65 thường + 9 HOA, gồm `Ầ Ắ Ẵ Ệ Ộ Ợ Ữ Ỹ Đ`) — **không thiếu ký tự nào**, SVG không có `.notdef`. Gap này ĐÓNG | [slhck 2025-10](https://slhck.info/software/2025/10/25/typst-pdf-generation-xelatex-alternative.html), [typst docs](https://typst.app/docs/reference/text/text/) |
| TeX Live | vài GB | chuẩn | có | — |
| LibreOffice headless | ~700 MB | vừa | có | — |
| **HTML + print CSS** (trình duyệt in) | **0** | phụ thuộc client, ngắt trang kém | có | — |

**[S]** Typst gọi thẳng từ THỢ bằng `subprocess` — **cùng khuôn `ffmpeg`/`yt-dlp`**
đã có (`egress` không dính vì không ra mạng). Không cần pandoc: Typst có markup
riêng, và ta **đã sinh Markdown có cấu trúc** nên chuyển Markdown → Typst là một hàm
nhỏ, hoặc dùng pandoc nếu chấp nhận thêm binary thứ hai.

### 3.4 MCP — có ích ở đâu, không ở đâu

Khảo: [mcp-pandoc](https://github.com/vivekVells/mcp-pandoc) (PDF **cần TeX Live**),
[mcp-md-pdf](https://github.com/sham-devs/mcp-md-pdf) (PDF **cần LibreOffice/Word**),
[md-pdf-mcp](https://glama.ai/mcp/servers/@kareemaly/md-pdf-mcp). **[F]** Cả ba là
vỏ bọc quanh một binary bên dưới — không server nào tự in được.

**[S]** Nên MCP **không** phải câu trả lời cho *runtime* của M12:
- `M12-R3` một cửa egress + THỢ đã là hàng đợi việc — thêm MCP server là thêm một
  tiến trình, một cổng, một hợp đồng, để làm việc `subprocess.run(["typst", …])` làm được.
- MCP có ích ở **phía dev** (Claude Code gọi tool lúc làm việc), không ở phía app.

**[S]** Chỗ MCP đáng cân nhắc thật: nếu về sau muốn **Claude Code đọc/sửa bản chưng
cất trong kho** như một tool (đọc `.md`, gọi `POST /api/job`), một MCP server mỏng
bọc LÕI `:8787` là hợp lý — nhưng đó là việc của M13/M14, không của bài này.

---

## 4 · Đối chiếu — cái gì mua được bao nhiêu

| khoảng cách với mẫu | sửa ở | gọi model? | cỡ |
|---|---|---|---|
| đoạn 1–9 s thay vì ~30 s | hậu xử lý `.vtt` → đoạn (LÕI xuất + tab Transcript) | **không** | nhỏ |
| không header | in frontmatter + `den` cuối + `model_asr` | **không** | nhỏ |
| không dấu câu đều | prompt ASR thêm "câu đầy đủ, có dấu" | có (đã gọi sẵn) | nhỏ |
| không PDF | Typst binary + hàm md→typ trong THỢ | **không** | vừa |
| khung 5 mục gượng cho bài giảng | bảng khai khuôn theo loại | có (đã gọi sẵn) | vừa |
| không bảng | một câu prompt | có (đã gọi sẵn) | nhỏ |
| cửa ASR chập chờn 1/3 | `faster-whisper` local — lối **đã khai, module đã có, worker chưa nối** | **không** — 0 egress | vừa–lớn: nối `_chon_loi`→`asr.py` + cài gói + đo CPU |

**[S]** Bốn hàng đầu **không cần model** và mua được phần lớn cảm giác "như ChatGPT".
Hàng cuối mua độ tin cậy — đường dự án đã vẽ từ `FR-054`, nhưng **chưa thi công
đoạn nối**: bản đầu của khảo sát này viết "chỉ thiếu cài gói" và đó là sai — đo
`grep` cho thấy `worker.py` không tham chiếu `asr` ở đâu.

---

## 5 · Không làm — ghi để khỏi trôi lại

- **Không bỏ citation `[slug:p.N]`** để giống mẫu — nó là `M12-R2`, là thứ làm bản
  chưng cất kiểm được. Mẫu ChatGPT không kiểm được.
- **Không thêm MCP server vào runtime** vì lý do ở §3.4.
- **Không đổi `text/vtt`** làm định dạng lưu — gộp đoạn là bản **xuất**, cue là bản **gốc**
  (`research §15` đã chốt).

## 6 · Giới hạn của khảo sát này

- Chưa chạy `faster-whisper` trên máy này ⇒ tốc độ CPU 56 nhân là **[G]**.
- Chưa render một trang Typst tiếng Việt ⇒ phủ dấu là **[G]**.
- Chưa so WER Gemini vs Whisper trên **cùng** audio của kho — chỉ có nguồn thương mại [S].
- Ba việc đo ấy là ba việc s2/PM nên cho làm **trước** khi chốt hướng ASR.