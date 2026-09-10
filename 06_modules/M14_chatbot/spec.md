# M14_chatbot — spec

> **Vùng THỢ.** Câu hỏi + phạm vi → câu trả lời mà **mọi khẳng định kèm địa chỉ**.
> Nguồn: `spec_overview.md#M14_chatbot` · `research_summary.md` §11 (M14) ·
> `memory/decisions.md` 2026-09-01 · `BRD B-A5`.
>
> ⚠️ **Mọi `cmd` dưới đây trỏ vào lệnh CHƯA TỒN TẠI** — `chatbot/` chưa có dòng mã
> nào. `hard` nói *"kiểm được bằng máy"*, không nói *"đã kiểm"*.

## 1 · Quyết định kiến trúc quan trọng nhất của đợt hai

> **M14 là service có API. Web là client THỨ NHẤT, không phải chủ sở hữu.**

Chatbot mọc trong `web/` thì mỗi kênh thêm vào là **viết lại nó**. Tách ra thì thêm
kênh chỉ là thêm một adapter mỏng — đó là toàn bộ lý do *"core xong trước thì
integration rẻ"*.

Hai metric bắt được nếu làm sai: **M7.4** (`curl` vào API trả JSON, không qua web)
· **M8.2** (kênh thứ hai tốn ≤ 20% công kênh thứ nhất).

> **AC-1.1** · `curl -X POST 127.0.0.1:8788/hoi` — payload gồm `bot` hoặc
> `nguon[]` (xem §8.1) — trả **JSON hợp lệ** mà **không** cần `web` chạy.
> Web tắt hẳn ⇒ API vẫn trả lời.
> `hard` · `cmd: python chatbot/tests/check_api_doc_lap.py`

> **AC-1.2** · `chatbot/` không chứa một file `.html`/`.css` nào, và không sinh
> HTML trong phản hồi — trả **dữ liệu**, không trả trình bày (`Z7`).
> `hard` · `cmd: python chatbot/tests/check_tra_du_lieu_khong_trinh_bay.py`

> **AC-1.3** · Trần kích thước: `chatbot/` ≤ **2.000 dòng** mã (tiền lệ khảo được:
> epistemic.technology ~1.600 dòng / 9 file). Vượt ⇒ đỏ.
> `hard` · `cmd: python chatbot/tests/check_tran_kich_thuoc.py`

## 2 · Hợp đồng JSON — mô phỏng format Anthropic citations

```
{
  "blocks": [
    { "text": "...",
      "citations": [ { "doc_id": "slug", "anchor": "muc-2",
                       "cited_text": "nguyên văn", "start": 0, "end": 42 } ],
      "trang_thai": "da-xac-minh" | "chua-xac-minh"
    }
  ],
  "tu_choi": null | { "ly_do": "<enum>", "dia_chi": ["slug#anchor", ...] }
}
```

`ly_do` là **enum ba giá trị**: `khong-co-trong-kho` · `co-nhung-mau-thuan` ·
`ngoai-pham-vi`.

> **AC-2.1** · Mô phỏng format của Anthropic **KHÔNG** thừa hưởng bảo đảm
> *"valid pointers"* của họ (đó là validate server-side). Mọi `citations[]` phải
> qua cổng verify của ta trước khi ra khỏi M14.
> `hard` · `cmd: python chatbot/tests/check_verify_bat_buoc.py`

> **AC-2.2** · Block khẳng định có `citations` **rỗng** không bao giờ ra khỏi M14 ở
> `trang_thai: da-xac-minh`.
> `hard` · `cmd: python chatbot/tests/check_verify_bat_buoc.py`

> **AC-2.3** · `ly_do` ngoài ba giá trị enum ⇒ phản hồi bị chặn tại M14.
> `hard` · `cmd: python chatbot/tests/check_enum_tu_choi.py`

## 3 · Verify đặt SAU PARSE, TRƯỚC RENDER

`research_summary` §11 M14-1: **mọi repo khảo được đều drop-IM-LẶNG** citation
hỏng. Grown_news đổi chính sách: **từ chối có phân loại**.

Cổng quote-có-thật: `re.finditer(re.escape(quote))` (kiểu `instructor`), normalize
hai phía kiểu `danswer` — lower + xoá whitespace/dấu câu **ASCII**, an toàn với chữ
Việt có dấu.

**Chính sách khi verify trượt** (chủ dự án chốt 2026-09-01): **gắn cờ TỪNG khẳng
định**, câu trả lời vẫn hiện.

| lựa chọn | tại sao KHÔNG chọn |
|---|---|
| bỏ im lặng | cách mọi repo đang làm; không ai biết có thứ đã bị bỏ — chỗ hệ RAG lừa người dùng |
| từ chối cả câu trả lời | đúng luật, nhưng chatbot im lặng tới mức người ta quay về Google ⇒ mất cả thứ định bảo vệ |

> **AC-3.1** · Quote model trả về mà **không tìm thấy nguyên văn** trong nguồn ⇒
> block đó ra với `trang_thai: chua-xac-minh`, **không** bị xoá.
> `hard` · `cmd: python chatbot/tests/check_gan_co_tung_khang_dinh.py`

> **AC-3.2** · **Không** block nào bị **bỏ im lặng**: số block model sinh = số
> block ra khỏi M14. Chênh một cái ⇒ đỏ.
> `hard` · `cmd: python chatbot/tests/check_gan_co_tung_khang_dinh.py`

> **AC-3.3** · Verify chạy **sau parse, trước khi trả**; đảo thứ tự ⇒ đỏ (một
> block chưa parse thì không có gì để verify).
> `hard` · `cmd: python chatbot/tests/check_verify_bat_buoc.py`

> **AC-3.4** · Phép normalize hai phía **không** làm mất dấu tiếng Việt: quote
> `"kiểm chứng chéo"` khớp nguồn có đúng chuỗi đó, và **không** khớp
> `"kiem chung cheo"` nếu nguồn không có dạng không dấu.
> `hard` · `cmd: python chatbot/tests/check_normalize_hai_phia.py`

⚠️ **Cờ mà không ai nhìn thì bằng không.** Cổng phải đo **HÀNH VI**: một block
`chua-xac-minh` không được render cùng kiểu với block đã xác minh. Nhưng render là
việc của M03 — nên `AC-3.1` chỉ bảo đảm **cờ có mặt trong dữ liệu**; việc cờ được
*nhìn thấy* là một AC của M03, và ghi ở `ui_flow.md` §3.

## 4 · Từ chối HAI TẦNG — và một nhánh không có tiền lệ

`research_summary` §11 M14-3, kiểu `paper-qa`:

| tầng | ai quyết | lý do nào |
|---|---|---|
| **CODE** | máy | `khong-co-trong-kho` — khi M13 trả **0 hàng** |
| **CODE** | máy | `ngoai-pham-vi` — câu hỏi ngoài facet đang chọn |
| **MODEL** | model tự khai | `co-nhung-mau-thuan` |

**Đừng đặt ngưỡng tuyệt đối trên bm25 thô** — `ragflow` tự tắt threshold khi điểm
là term-only. 0 hàng thì code biết; "điểm thấp" thì không ai biết ngưỡng đúng.

### 4.1 · `co-nhung-mau-thuan` — chỗ chỏi luật gốc, và cách thu hẹp

Chủ dự án chốt: **model tự khai**. Tôi đã nói ra chỗ nó chỏi và không đảo quyết
định đó:

> Model vừa sinh câu trả lời vừa tự phán *"nguồn mâu thuẫn nên tôi không trả lời"*
> — nó **sở hữu thước đo của chính nó**, và một lần từ chối SAI trông y hệt một lần
> từ chối ĐÚNG.

Thu hẹp chỗ nó tự do, thay vì bỏ nhánh: model được **KHAI**, nhưng phải khai kèm
**≥2 địa chỉ**, và **code kiểm điều kiện cần**.

> **AC-4.1** · `ly_do: khong-co-trong-kho` do **CODE** quyết, và chỉ khi M13 trả
> **0 hàng**. Model khai lý do này mà M13 có hàng ⇒ lời khai bị bỏ.
> `hard` · `cmd: python chatbot/tests/check_tu_choi_hai_tang.py`

> **AC-4.2** · `ly_do: co-nhung-mau-thuan` **bắt buộc** kèm `dia_chi` **≥2**, và
> code kiểm: cả hai địa chỉ **phân giải được**, và chúng thuộc **hai bản ghi khác
> nhau**. Không đủ ⇒ **không phải** `co-nhung-mau-thuan`.
> `hard` · `cmd: python chatbot/tests/check_mau_thuan_can_hai_dia_chi.py`

> **AC-4.3** · Ghi log **HAI ca, phân biệt được**: (a) lần bắn `co-nhung-mau-thuan`
> **được chấp nhận**, và (b) lần model **định** khai nó nhưng **bị bỏ** vì thiếu
> điều kiện của `AC-4.2`. Thiếu một trong hai ⇒ đỏ.
> `hard` · `cmd: python chatbot/tests/check_mau_thuan_can_hai_dia_chi.py`

⚠️ **Ca (b) thêm vào 2026-09-02 vì phép thử s6.** Bản đầu chỉ nói *"mọi lần bắn"*,
đọc được thành "chỉ lần thành công". Nhưng con số quan trọng hơn là **số lần model
ĐỊNH lạm dụng** — không có nó thì ba tháng sau ta biết nhánh này bắn bao nhiêu lần,
mà **không** biết nó bị chặn bao nhiêu lần. Nhánh này không có tiền lệ mã nguồn mở
nào, nên hai con số đó là thứ duy nhất cho biết luật có đang giữ được không.

> **AC-4.4** · **Không** ngưỡng tuyệt đối nào trên bm25 thô trong mã; grep một số
> so sánh với điểm ⇒ đỏ.
> `hard` · `cmd: python chatbot/tests/check_khong_nguong_bm25.py`

⚠️ **`co-nhung-mau-thuan` KHÔNG có tiền lệ mã nguồn mở nào** (`research_summary`
§11 M14-3). Nên AC + testcase của nhánh này là **tự thiết kế** — không có bản đối
chiếu, và đó là lý do `AC-4.3` (log mọi lần bắn) quan trọng hơn nó trông.

## 5 · Citation-first, không generate-then-cite

`research_summary` §11: **57%** citation kiểu generate-then-cite là
**post-rationalization** (2025) — model viết xong rồi mới đi tìm chỗ đỡ. Nên
prompt phải **citation-first**: lấy đoạn trước, viết sau, và mỗi câu buộc trỏ về
đoạn đã lấy.

> **AC-5.1** · Prompt đưa **đoạn trước**, và mọi block trong phản hồi trỏ về một
> `doc_id` **có trong** tập đoạn M13 trả về. Trỏ ra ngoài tập đó ⇒ đỏ.
> `hard` · `cmd: python chatbot/tests/check_citation_first.py`

> **AC-5.2** · M14 **không** tự gọi M13 lần thứ hai để "tìm chỗ đỡ" sau khi model
> đã viết; một lời gọi M13 cho một lượt hỏi.
> `hard` · `cmd: python chatbot/tests/check_citation_first.py`

## 6 · Multi-turn — giai đoạn đầu KHÔNG condense

`research_summary` §11 M14-5: nhét history vào **một** user message (0 model call
phụ, kiểu `epistemic`). Chỉ nâng lên condense khi có **tín hiệu vận hành**; lúc đó
chép prompt `Onyx` (thiên vị **giữ nguyên** câu hỏi) + fallback `'0'` → câu gốc.

> **AC-6.1** · Một lượt hỏi = **một** lời gọi model. Thêm một lời gọi condense ⇒
> đỏ ở giai đoạn này.
> `hard` · `cmd: python chatbot/tests/check_mot_luot_mot_goi.py`

> **AC-6.2** · Session của mỗi tài khoản **độc lập** (`FR-045`): hai `phien` khác
> nhau không thấy lịch sử của nhau.
> `hard` · `cmd: python chatbot/tests/check_phien_doc_lap.py`

> **AC-6.3** · M14 **KHÔNG** đọc/ghi bảng `phien` (`FR-045` U6) — session là **dữ
> liệu**, và dữ liệu ở LÕI. M14 nhận `ngu_canh` từ người gọi.
> `hard` · `cmd: python chatbot/tests/check_phien_doc_lap.py`

## 7 · Egress — bậc 4, cùng luật M12

M14 gọi model ⇒ nó là egress. Mọi lời gọi RA đi qua **một** hàm, log `sha256`
payload **trước khi** gửi (`FR-043` bậc 4).

> **AC-7.1** · Một cửa egress; log trước khi gửi; dựng lại payload từ log rồi băm
> lại ra cùng `sha256`.
> `hard` · `cmd: python chatbot/tests/check_mot_cua_egress.py`

> **AC-7.2** · Định tuyến model đọc từ **bảng khai** — dùng lại `model.json` của
> M12 hay bảng riêng thì s7 quyết, nhưng **không gõ tên model trong mã**.
> `hard` · `cmd: python chatbot/tests/check_bang_khai_model.py`

## 8 · Knowledge — bot nào thấy tài liệu nào *(chỉ đạo 2026-09-02)*

Spec bản đầu (09-01) mặc định **một** con bot đọc **cả kho**, và `pham_vi` chỉ là
bộ lọc lúc hỏi. Chỉ đạo bổ sung thêm một **trục thứ hai**:

> *"Chatbot nên có tính năng Knowledge — nạp tài liệu **được chọn** thay vì ôm tất
> cả tài liệu để trả lời. Chatbot của admin có tất cả tri thức; chatbot customize
> thì giống custom GPT — theo **rule + tài liệu được chọn** ⇒ chatbot riêng cho
> từng bài học, lớp học và user sau này."*

**Hai thứ này KHÁC nhau, và trộn chúng là lỗi đắt:**

| | là gì | ai đặt |
|---|---|---|
| `pham_vi` | **bộ lọc LÚC HỎI** (facet) | người hỏi, mỗi lượt |
| **Knowledge** | **tập tài liệu GẮN VÀO một con bot** | người dựng bot, một lần |

Chủ dự án đã chốt rõ: bài học **KHÔNG** thay `pham_vi`. Hai trục đứng cạnh nhau.

**Bốn hạng bot:**

| hạng | Knowledge | đợt |
|---|---|---|
| **admin** | cả kho | đợt hai |
| **customize** | rule + tài liệu được chọn | upgrade 2 |
| **theo bài học** | tài liệu của bài học đó | upgrade 2 |
| **theo lớp học / user** | tài liệu được cấp | upgrade 2 |

### 8.1 · Đợt hai KHÔNG thi công Knowledge — nhưng phải giữ HÌNH DẠNG MỞ

Đây là chỗ duy nhất của chỉ đạo này có việc phải làm **ngay**. Nếu để hợp đồng
`POST /hoi` không nhận được định danh bot, thì đợt sau phải sửa ở **tầng sâu nhất**
— nguồn của truy hồi — chứ không phải thêm một tham số.

> **AC-8.1** · `POST /hoi` nhận `bot` (định danh) **hoặc** `nguon[]` (tập nguồn
> tường minh). Ba ca, cả ba khai tường minh:
> · thiếu **cả hai** ⇒ mặc định `bot: admin` (cả kho), và mặc định đó phải là **một
>   dòng khai trong mã**, không phải một nhánh vắng;
> · có **một** trong hai ⇒ dùng cái đó;
> · có **CẢ HAI** ⇒ **`nguon[]` thắng**, và M14 **ghi một dòng log** — hai thứ cùng
>   có là dấu hiệu người gọi đang nhầm, và im lặng chọn một bên thì lần sau họ nhầm
>   tiếp.
> `hard` · `cmd: python chatbot/tests/check_hop_dong_nhan_bot.py`

⚠️ **Ca "cả hai" thêm vào 2026-09-02 vì phép thử s6**: bản đầu chỉ nói *"`bot`
**hoặc** `nguon[]`"* và bỏ ngỏ ca cả hai. Viết testcase cho nó buộc tôi phải **bịa
một luật ưu tiên**, mà bịa luật trong testcase đúng là thứ s6 cấm.

> **AC-8.2** · M14 truyền tập nguồn xuống M13 như một **tham số**; M13 không được
> giả định "cả kho". Gọi M13 mà không nêu tập nguồn ⇒ đỏ.
> `hard` · `cmd: python chatbot/tests/check_hop_dong_nhan_bot.py`

> **AC-8.3** · Bot **không phải** `admin` mà trả lời từ một tài liệu **ngoài**
> Knowledge của nó ⇒ đỏ. Đây là ranh giới nhiều-người-dùng: một bot của lớp học
> không được trả lời từ tài liệu ngoài lớp, **kể cả khi kho có**.
> `soft` · chưa thi công ở đợt hai; cổng bật khi có hạng bot thứ hai

⚠️ **`AC-8.3` là `soft` có chủ ý.** Nó không kiểm được hôm nay (chỉ có một hạng
bot), nhưng viết ra bây giờ vì nó là **lý do** `AC-8.1`/`AC-8.2` tồn tại.

### 8.2 · Năm luật CẤU TRÚC — học từ bốn CVE, kiểm được NGAY

Khảo sát 2026-09-02 (`research_summary` §14 · `chatbot-pham-vi-tri-thuc.md`) đo
được một điều đổi hẳn cách viết `AC-8.3`:

> **Mọi rò rỉ đã tài liệu hoá đều ở TẦNG TRUY HỒI. Không cái nào ở prompt.**

Bốn CVE, bốn hệ, cùng một tầng. Nên năm AC dưới đây **không** chờ hạng bot thứ
hai — chúng nói về **hình dạng mã**, và grep được hôm nay.

> **AC-8.4** · **MỘT chokepoint.** Đúng **một** hàm giải `bot → tập doc_id`, và
> mọi đường truy hồi đi qua nó. Hai đường query kho ⇒ đỏ.
> *Vì sao*: `CVE-2026-44560` — Open WebUI có **năm** đường chạy, **ba** đường query
> không kiểm quyền gì. Hậu quả nguyên văn: *"thu hồi quyền VÔ HIỆU với nội dung
> RAG"*. Và bản vá **bị phá lại** ở `CVE-2026-54019`.
> `hard` · `cmd: python chatbot/tests/check_mot_chokepoint.py`

> **AC-8.5** · **Tập nguồn do SERVER giải, KHÔNG nhận từ caller.** Payload không
> có trường nào cho phép người gọi nêu tên collection / doc_id / bảng. Có ⇒ đỏ.
> *Vì sao*: cùng CVE — ba đường đó truyền **tên collection do client gửi**, và tên
> đó **đoán được** (`file-<file_id>`, UUID của KB).
> `hard` · `cmd: python chatbot/tests/check_khong_nhan_scope_tu_caller.py`

> **AC-8.6** · **DENY khi thiếu danh tính**, không nới. Thiếu `bot` **và** thiếu
> danh tính ⇒ **từ chối**; không được rơi về "cả kho".
> *Vì sao*: `CVE-2026-47713` — AnythingLLM cài cách ly thành một nhánh điều kiện
> (`user ? whereWithUser(user) : where({})`), nên **vị từ WHERE biến mất** khi
> danh tính vắng. Device token cũ vẫn hợp lệ sau khi di trú sang nhiều-người-dùng.
> `hard` · `cmd: python chatbot/tests/check_deny_khi_thieu_danh_tinh.py`

> **AC-8.7** · **PRE-filter, không POST-filter.** Ràng buộc tập nguồn là một `AND`
> **vô điều kiện** trong **cùng câu SQL** với `FTS5 MATCH` — không lọc sau khi đã
> có kết quả. Lọc sau ⇒ đỏ.
> *Vì sao*: lọc sau nghĩa là kho **đã** được đọc; một lỗi ở tầng lọc là một lần rò,
> không phải một lần thiếu kết quả. Onyx chứng minh vế ngược: bảng liên kết chỉ được
> **OR** vào query, nên *"không khai gì = thấy tất cả"*.
> `hard` · `cmd: python chatbot/tests/check_pre_filter.py`

> **AC-8.8** · **Không có đường THỨ HAI tới kho.** M14 không có công cụ nào (tool,
> plugin, đường tải file) chạm kho ngoài chokepoint ở `AC-8.4`.
> *Vì sao*: khảo sát ghi rõ — *bất kỳ công cụ nào chạm được kho đều phá scope*, nên
> giới hạn tải file của nền tảng **không phải** một ranh giới cách ly.
> `hard` · `cmd: python chatbot/tests/check_mot_chokepoint.py`

⚠️ **Luật thứ sáu KHÔNG thuộc M14, và nó là luật nặng nhất** — ghi ra đây vì đây
là chỗ phát hiện nó: **khoá xác thực service-to-service phải RIÊNG**, không dùng
chung với khoá session của người dùng. `CVE-2025-41258` — LibreChat dùng **cùng
một** JWT secret cho session trình duyệt và cho RAG API, không validate `aud`, nên
token session hợp lệ **xác thực trực tiếp** vào dịch vụ truy hồi và **đi vòng toàn
bộ ACL một lúc** — gồm cả **GHI** (`I:H/A:H`, CVSS 8.0).
Đối chiếu thẳng vào ta: `M17_cong` cấp danh tính, `M14`/`M13` là THỢ. Ba chỗ dùng
chung một bí mật thì ranh giới LÕI/THỢ/BIÊN **sập bằng một dòng cấu hình**.
⇒ **FR tới M08/M17**, không phải một AC của M14.

### 8.3 · Hai mặc định của tiền lệ đều SAI cho ta

| hệ | mặc định của họ | ta phải |
|---|---|---|
| Onyx | `is_public` = **True** — persona hiện với cả tổ chức trừ khi đặt private | **private** trừ khi khai công khai |
| AnythingLLM | `chatMode` = `automatic` — **không từ chối** khi phạm vi không khớp | **từ chối** khi không khớp (`AC-4.1`) |

### 8.4 · Chỗ KHÔNG có tiền lệ — và giới hạn của bản khảo

**Không hệ nào** trong tám hệ được chứng minh cưỡng chế scope trong index **từ
vựng**. Mọi điểm cưỡng chế đã xác minh đều là **vector**: YQL filter (Onyx) ·
namespace (AnythingLLM) · collection ACL (Open WebUI). ⇒ **`AC-8.7` không có bản
đối chiếu nào** — tự thiết kế, tự viết AC.

⚠️ Nhưng phải nói đúng mức: agent dò chính khoảng trống đó **đã CHẾT** giữa đường,
và **bốn** hệ không được khảo (Khoj · RAGFlow · Morphik · SurfSense) — đúng nhóm dễ
có tiền lệ lexical nhất. Nên *"không có tiền lệ"* là **chưa dò xong**, không phải
đã dò và không thấy.

Hai chỗ **UNKNOWN**, và chúng là unknown chứ không phải ngược lại: **Custom GPT**
(cả hai claim bị refute 0-3, gồm claim "20 file / 512 MB" ⇒ **không được trích số
đó**) · **Claude Projects** (0 claim sống sót).

## 9 · Cái CỐ Ý không có

| | vì sao |
|---|---|
| giao diện | `Z7`; web là client, và nó chuẩn hoá output |
| ghi kho | M14 chỉ đọc qua M13; một cửa ghi ở LÕI |
| bảng `phien` | `FR-045` U6 — session là dữ liệu, ở LÕI |
| ngưỡng bm25 | `AC-4.4` — không ai biết ngưỡng đúng; 0 hàng thì code biết |
| condense multi-turn | `AC-6.1` — chờ tín hiệu vận hành |
| "tôi không chắc" dạng văn xuôi | từ chối phải **phân loại** được (enum), không phải một câu lịch sự |
