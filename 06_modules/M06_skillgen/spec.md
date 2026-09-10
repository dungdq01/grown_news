# M06_skillgen — spec

> Module duy nhất làm **M1.2** đo được: *"đã sinh skill thật VÀ cài vào agent VÀ
> output agent đổi theo hướng tốt hơn"*, ngưỡng ≥1/10 bản đầu.
>
> Không có module này thì M1.2 chắc chắn bằng 0 và một trong ba metric chặn của
> dự án tự động trượt.

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | thuật toán chấm verdict, `skill-manifest.json`, mẫu `SKILL.md` nháp |
| **Không sở hữu** | `Analysis` (M02) · `priority` **có** ở đây (§3) |
| **Vào** | `kb/**/*.md` ở `approved` — **chỉ đọc** · `skill-manifest.json` |
| **Ra** | `~/.claude/skills/<name>/SKILL.md` dạng **nháp** — **ngoài repo** |
| **Ghi được** | `06_skillgen/**` trong repo · `~/.claude/skills/**` ngoài repo |

## 2 · Business logic

### 2.1 · Chấm verdict — thứ tự cổng không đổi được

Năm cổng, chạy **đúng thứ tự này**, cổng trên thắng cổng dưới:

| # | Cổng | Điều kiện | Verdict |
|---|---|---|---|
| 1 | **CỔNG CỨNG** | `credibility` ∈ {claimed, conflicted} **và** `independent_sources == 1` | `OUT_OF_SCOPE` |
| 2 | ngoài domain | chủ đề thuộc `$out_of_scope` | `OUT_OF_SCOPE` |
| 3 | đã phủ sâu | khớp capability (kể cả alias) và `depth ≥ 4` | `OVERLAP` |
| 4 | đã phủ nông | khớp capability và `depth ≤ 3` | `DEEPEN` |
| 5 | chưa phủ | không khớp, thuộc domain | `NEW` |

**Vì sao thứ tự là một phần của luật**: lượt kiểm đầu tôi chạy sai — kiểm domain
trước cổng cứng — và cho ra `NEW` cho hai ứng viên mà **schema đã cấm**. Sai thứ
tự không tạo lỗi kiểu, nó tạo kết quả *trông hợp lệ*.

> **AC-2.1.1** · Cổng cứng thắng mọi cổng khác.
> `hard` · `cmd: python 06_skillgen/test_verdict.py -k cong_cung`

> **AC-2.1.2** · Khớp capability qua **alias**, không chỉ tên chính.
> `hard` · cùng lệnh.
> Lượt đầu bỏ sót `context-truncation-strategy` ≈ `context-management` vì khớp
> đúng tên. 23 capability nay đều có `aliases`.

### 2.2 · Sinh NHÁP, không sinh đủ (quyết định trung tâm)

Một skill cần hai thứ có độ tin cậy khác hẳn nhau:

| Phần | Máy làm | Vì sao |
|---|---|---|
| **Trigger** | ✅ tốt | `draft_trigger` có sẵn trong frontmatter — cụm người dùng thật sẽ gõ |
| **Nội dung** | ❌ dở | Sinh từ **một** nguồn thì chỉ chép lại nguồn đó |

Skill thật cần thứ học được sau khi đọc 3 nguồn và va một lần thất bại. Sinh đủ
nội dung tạo ra thứ **trông như** skill mà cài vào làm agent tệ hơn — và người
dùng không phát hiện ngay vì output vẫn trôi chảy.

**Nháp gồm đúng bốn phần**:
1. frontmatter `name` + `description` — lấy từ `draft_trigger`
2. mục "Khi nào dùng"
3. **con trỏ ngược** về bản `.md` nguồn kèm số dòng
4. thân để trống, đánh dấu `<!-- TODO: viết sau khi có nguồn thứ 2 -->`

> **AC-2.2.1** · Nháp sinh ra có đủ 4 phần và thân **rỗng**.
> `hard` · `cmd: python 06_skillgen/test_draft_shape.py`

> **AC-2.2.2** · Không nháp nào có nội dung thân > 0 dòng thật.
> `hard` · cùng lệnh. Đây là AC chống **chính module này** phình vai.

### 2.3 · Ngưỡng sinh

```
priority = (relevance × frequency × durability × corroboration_factor) / cost
```

Sinh nháp khi `priority ≥ 25` **và** verdict ∈ {`NEW`, `DEEPEN`}.

Chỉ đọc bản `approved` — nháp chỉ sinh từ bản **người đã duyệt**.

> **AC-2.3.1** · Bản `draft` không sinh nháp nào.
> `hard` · `cmd: python 06_skillgen/test_verdict.py -k chi_approved`

### 2.4 · Manifest lớn dần, không đoán trước

`skill-manifest.json` là **năng lực hiện có của agent**, không phải danh sách tên
file skill. Chấm `depth` trung thực: cao quá thì không bao giờ đề xuất gì, thấp
quá thì cái gì cũng `NEW`.

Mỗi lần M06 cho ra một loạt `NEW` đáng ngờ ⇒ **dấu hiệu manifest thiếu**, bổ sung
capability chứ đừng hạ ngưỡng.

> **AC-2.4.1** · Mọi capability có `$why` giải thích điểm `depth`.
> `hard` · `cmd: python 06_skillgen/test_manifest.py`

### 2.5 · Sample hiện chưa đủ để kiểm module này

Đếm bằng máy trên `analyses.sample.v2.json`:

| Có | Thiếu |
|---|---|
| `DEEPEN` ×3, `OUT_OF_SCOPE` ×2 | **`NEW`**, **`OVERLAP`** |
| `priority` 50/60/65 (đều ≥25) | ca dưới ngưỡng |

`NEW` là nhánh **chính** của module. Thiếu nó thì chặng B kiểm được đúng một nửa.

> **AC-2.5.1** · Sample phủ đủ 4 verdict + ≥1 ca `priority < 25`.
> `hard` · `cmd: python 06_skillgen/test_sample_coverage.py`
> **Đang ĐỎ.** Đơn vị việc đầu của bước 3: bổ sung sample. Đụng contract G5 ⇒
> **FR + bump v3**, không sửa tại chỗ.

## 3 · Công thức — nhà của `priority`

```
priority = (relevance × frequency × durability × corroboration_factor) / cost

relevance   1-5   nối được với vấn đề có thật? không nối được ⇒ không thể ≥4
frequency   1-5   gặp bao lâu một lần
durability  1-5   6 tháng nữa còn đúng không
corroboration_factor  0.6 | 1.0 | 1.3 | 1.6   theo số nguồn độc lập
cost        1-5   công viết và bảo trì skill
```

Ngưỡng sinh nháp: **≥ 25**.

`cost` ở **mẫu số** là chủ ý: một skill đắt phải *đáng* hơn hẳn mới được sinh.

Ràng buộc schema (M06 không nới được): `verdict` ∈ {NEW, DEEPEN} ⇒ bắt buộc có
`why_now`, `score`, `priority`, `draft_trigger`.

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| Ghi bất cứ gì vào `kb/` | không thuộc `kb_writers` |
| Đọc bản `draft` để sinh nháp | nháp chỉ từ bản người đã duyệt |
| Nới cổng cứng | schema cưỡng chế; nới = khẳng định yếu thành skill điều khiển agent |
| Sinh thân skill có nội dung | §2.2 — thứ trông như skill mà làm agent tệ hơn |
| Tự cài skill vào agent | máy đề xuất, **người quyết định cài** (PRD U7) |

## 5 · Trạng thái

✅ **as-built** — s8 chặng B, 2026-08-19.

| Phần | File | Kiểm |
|---|---|---|
| Chấm verdict 5 cổng | `06_skillgen/verdict.py` | `test_verdict.py` — 18 phép kiểm, 7/7 ứng viên sample khớp |
| Sinh nháp thân rỗng | `06_skillgen/draft.py` | `test_draft_shape.py` — 4 nháp, thân rỗng |
| Manifest | `skill-manifest.json` | `test_manifest.py` — 23 capability đủ `$why` + aliases |

Nợ §2.5 **đã trả**: sample lên v3, đủ 4 verdict + ca dưới ngưỡng (FR-006).

Cả hai bộ test đã kiểm **có đỏ được không** — phá 4 luật mỗi bộ, đều đỏ đúng chỗ.
