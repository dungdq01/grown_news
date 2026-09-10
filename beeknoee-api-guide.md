# Beeknoee API — Hướng dẫn sử dụng cho Agent Code

> Tài liệu tham chiếu nội bộ. Nguồn: https://platform.beeknoee.com/docs (cập nhật 09/2026).
> Gói đang dùng: **Basic** (499.000đ/tháng) — mọi endpoint bên dưới đều dùng được, kể cả Management API.

---

## 1. Thông tin cốt lõi

| Mục                      | Giá trị                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Base URL (AI)             | `https://platform.beeknoee.com/v1`                                                                                                           |
| Base URL (Management)     | `https://platform.beeknoee.com/v1/management`                                                                                                |
| API Key                   | `sk-bee-xxx` — **một key dùng cho tất cả** endpoint                                                                               |
| Auth header               | `Authorization: Bearer sk-bee-xxx`                                                                                                           |
| Chuẩn API                | OpenAI-compatible (`/v1/chat/completions`), hỗ trợ thêm `/v1/messages` (Anthropic-style, cho Claude Code) và `/v1/responses` (Codex) |
| Tỷ giá                  | 1 USD = 27.500đ (cố định), trừ tiền bằng VND                                                                                            |
| Rate limit Management API | 60 req/phút — khi 429, đọc header`Retry-After`                                                                                           |

**Thứ tự trừ tiền mỗi request:** Free Quota (Antigravity/Codex/Gemini/Claude Code) → Gói Token đã mua → Ví VND.

**Discount theo gói:** mỗi model có % giảm riêng theo plan (Free / **Basic** / Advanced+ / Ultra). Ví dụ Claude Sonnet 4.6: Basic giảm 15%, Advanced+ giảm 30%. Xem discount thực tế qua `GET /v1/management/models/text`.

---

## 2. Quy tắc chung cho Agent (BẮT BUỘC ĐỌC)

1. **Luôn dùng `stream: true`** với model reasoning (Claude Opus/Sonnet, GPT high-reasoning, DeepSeek R1, Gemini Pro). Model có thể "suy nghĩ" >120s → non-streaming sẽ dính Cloudflare Error 524.
2. **Claude Opus 4.7+**: KHÔNG gửi `temperature` / `top_p` / `top_k` → lỗi `400 invalid_request_error`.
3. **Claude Sonnet/Haiku 4.x**: chỉ được gửi MỘT trong `temperature` HOẶC `top_p`, không cả hai.
4. **Nguyên tắc an toàn**: nếu không cần chỉnh sampling → đừng gửi các field đó.
5. **Multimodal**: Audio/Video/PDF chỉ chạy trên model **Gemini**. GPT/Claude/DeepSeek chỉ nhận image. Gửi media tới model không hỗ trợ → phần media bị bỏ qua âm thầm.
6. **Management API**: bắt buộc gửi header `User-Agent: YourApp/1.0`, thiếu sẽ bị Cloudflare chặn (Error 1010).
7. **Lấy danh sách model ID**: `GET /v1/models` (cột `providerModelId`).
8. **Combo**: gọi `model: "combo/<tên>"` như model thường; phí tính theo model thực tế trả lời.

---

## 3. Setup client (dùng chung cho mọi provider)

Vì Beeknoee OpenAI-compatible, chỉ cần **một client duy nhất**, đổi tên model để chuyển provider:

```python
# Python
from openai import OpenAI

client = OpenAI(
    api_key="sk-bee-YOUR_KEY",                      # nên đọc từ env: os.environ["BEEKNOEE_API_KEY"]
    base_url="https://platform.beeknoee.com/v1",
)
```

```javascript
// Node.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.BEEKNOEE_API_KEY,
  baseURL: "https://platform.beeknoee.com/v1",
});
```

```bash
# cURL template
curl https://platform.beeknoee.com/v1/chat/completions \
  -H "Authorization: Bearer $BEEKNOEE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "<MODEL_ID>", "messages": [{"role":"user","content":"..."}], "stream": true}'
```

---

## 4. Ví dụ theo từng Provider

### 4.1. OpenAI (GPT)

**Điểm mạnh:** multimodal native, prompt caching, general-purpose production.
**Model ID ví dụ:** `gpt-5.5` (kiểm tra ID hiện hành qua `GET /v1/models`).

#### Chat cơ bản + streaming

```python
stream = client.chat.completions.create(
    model="gpt-5.5",
    messages=[
        {"role": "system", "content": "Bạn là trợ lý lập trình, trả lời ngắn gọn."},
        {"role": "user", "content": "Viết hàm Python đọc file JSON an toàn."},
    ],
    max_tokens=2000,
    temperature=0.3,     # GPT nhận temperature bình thường
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
```

#### Vision (gửi ảnh)

```python
import base64

with open("screenshot.png", "rb") as f:
    img = base64.b64encode(f.read()).decode()

resp = client.chat.completions.create(
    model="gpt-5.5",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Ảnh này có lỗi UI gì?"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img}"}},
        ],
    }],
    stream=True,
)
```

> ⚠️ GPT trên Beeknoee **không nhận** audio/video/PDF — cần các loại này thì chuyển sang Gemini (mục 4.3).

#### Node.js

```javascript
const stream = await client.chat.completions.create({
  model: "gpt-5.5",
  messages: [{ role: "user", content: "Giải thích event loop trong Node.js" }],
  stream: true,
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}
```

---

### 4.2. Anthropic (Claude)

**Điểm mạnh:** reasoning sâu, coding, tài liệu dài, tiếng Việt tốt, extended thinking.
**Model ID ví dụ:** `claude-sonnet-4-6` (production), Claude Opus (reasoning khó).

#### Chat cơ bản — LƯU Ý SAMPLING

```python
# ✅ ĐÚNG — Sonnet 4.x: chỉ gửi MỘT trong temperature/top_p, hoặc không gửi gì
resp = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[
        {"role": "system", "content": "Bạn là senior engineer, review code kỹ lưỡng."},
        {"role": "user", "content": "Review đoạn code sau và chỉ ra bug:\n```python\n...\n```"},
    ],
    max_tokens=4000,
    stream=True,          # BẮT BUỘC với Claude — có thể think >120s
)

# ❌ SAI với Opus 4.7+ — sẽ lỗi 400:
# client.chat.completions.create(model="claude-opus-...", temperature=0.7, ...)

# ❌ SAI với Sonnet 4.x — gửi cả hai:
# client.chat.completions.create(model="claude-sonnet-4-6", temperature=0.7, top_p=0.9, ...)
```

#### Phân tích tài liệu dài (use case mạnh nhất của Claude)

```python
with open("contract.txt", encoding="utf-8") as f:
    doc = f.read()   # Claude context ~200K tokens

resp = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[
        {"role": "user", "content": f"Tóm tắt các điều khoản rủi ro trong hợp đồng sau:\n\n{doc}"},
    ],
    max_tokens=8000,
    stream=True,
)
```

#### Vision với Claude

```python
resp = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Trích xuất số liệu từ bảng trong ảnh, trả về JSON."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}},
        ],
    }],
    stream=True,
)
```

> ⚠️ Claude nhận **image**, không nhận audio/video/PDF qua endpoint này.

#### Dùng với Claude Code CLI

Beeknoee expose thêm `/v1/messages` (Anthropic-format) để cắm thẳng Claude Code:

```bash
export ANTHROPIC_BASE_URL="https://platform.beeknoee.com"
export ANTHROPIC_AUTH_TOKEN="sk-bee-YOUR_KEY"
# Chi tiết: https://platform.beeknoee.com/docs/claude-code
```

---

### 4.3. Google (Gemini)

**Điểm mạnh:** multimodal mạnh nhất (image + audio + video + PDF), context tới ~1M tokens.
**Model ID ví dụ:** `gemini-3.5-flash` (nhanh/rẻ), Gemini Pro (reasoning).
**Tham số riêng:** `media_resolution` (`LOW`/`MEDIUM`/`HIGH`), `thinking_level` (`LOW`/`MEDIUM`/`HIGH`, Gemini 3+).

#### Chat + thinking level

```python
resp = client.chat.completions.create(
    model="gemini-3.5-flash",
    messages=[{"role": "user", "content": "Phân tích thuật toán sắp xếp nào tối ưu cho dữ liệu gần-sorted?"}],
    stream=True,
    extra_body={"thinking_level": "HIGH"},   # chỉ Gemini 3+
)
```

#### Gửi PDF (chỉ Gemini làm được)

```python
import base64

with open("invoice.pdf", "rb") as f:
    pdf = base64.b64encode(f.read()).decode()

resp = client.chat.completions.create(
    model="gemini-3.5-flash",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Trích xuất: số hóa đơn, ngày, tổng tiền. Trả về JSON."},
            {"type": "file", "file": {
                "url": f"data:application/pdf;base64,{pdf}",
                "mime_type": "application/pdf",
            }},
        ],
    }],
    stream=True,
)
```

#### Gửi Audio (transcribe/analyze)

```python
with open("meeting.mp3", "rb") as f:
    audio = base64.b64encode(f.read()).decode()

resp = client.chat.completions.create(
    model="gemini-3.5-flash",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Phiên âm và tóm tắt action items."},
            {"type": "input_audio", "input_audio": {
                "data": f"data:audio/mpeg;base64,{audio}",
                "format": "mp3",
            }},
        ],
    }],
    stream=True,
)
```

#### Gửi Video

```python
with open("demo.mp4", "rb") as f:
    video = base64.b64encode(f.read()).decode()

resp = client.chat.completions.create(
    model="gemini-3.5-flash",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Video này demo tính năng gì? Liệt kê các bước."},
            {"type": "file", "file": {
                "url": f"data:video/mp4;base64,{video}",
                "mime_type": "video/mp4",
            }},
        ],
    }],
    stream=True,
)
```

#### Multi-turn với Thinking (Gemini 3+)

Khi response có `thought_signature`, gửi lại nó trong message `assistant` ở lượt sau để Gemini nhớ mạch suy nghĩ (không gửi vẫn chạy nhưng think lại từ đầu → tốn token hơn).

**Giới hạn file:** tối đa ~75MB/file (base64), tổng body ≤ 100MB. File >15MB tự upload qua Google Files API (trong suốt với client).

---

## 5. Bảng chọn model nhanh cho Agent

| Task                         | Model đề xuất          | Lý do                                |
| ---------------------------- | ------------------------- | ------------------------------------- |
| Coding, code review          | Claude Sonnet             | Reasoning + coding tốt nhất         |
| Reasoning khó, kiến trúc  | Claude Opus, GPT flagship | Suy luận sâu                        |
| Đọc PDF / audio / video    | Gemini Flash/Pro          | Duy nhất hỗ trợ đủ 4 loại media |
| Tài liệu cực dài (>200K) | Gemini Pro                | Context ~1M                           |
| High-volume, rẻ             | DeepSeek, Qwen            | Chi phí thấp                        |
| Test / prototype             | GLM (Z.AI)                | Miễn phí trên Beeknoee             |
| Tiếng Việt                 | Claude, Qwen              | Chất lượng tiếng Việt tốt       |

---

## 6. Combo — tăng độ ổn định cho Agent

Tạo combo trong dashboard (API Keys → Model Combos), rồi gọi như model thường:

```python
resp = client.chat.completions.create(
    model="combo/smart-fallback",   # ví dụ: Claude Sonnet → GPT → DeepSeek
    messages=[{"role": "user", "content": "..."}],
    stream=True,
)
```

4 chiến lược: **Fallback** (model lỗi → nhảy sang model sau), **Round Robin**, **Weighted**, **Capacity Auto** (tự chọn model theo loại media). Không tính thêm phí; chỉ tính theo model thực trả lời.

> ⚠️ Combo chỉ chứa model text. Đổi tên combo → mọi lời gọi `combo/<tên-cũ>` trong code sẽ gãy.

---

## 7. Xử lý lỗi — retry logic cho Agent

| HTTP | Code                         | Xử lý                                                                             |
| ---- | ---------------------------- | ----------------------------------------------------------------------------------- |
| 400  | `invalid_request_error`    | Thường do gửi`temperature`/`top_p` cho Claude — bỏ field đi, KHÔNG retry |
| 401  | `invalid_api_key`          | Key sai/bị thu hồi — dừng, báo user                                            |
| 403  | `insufficient_permissions` | Không retry                                                                        |
| 429  | `rate_limit_exceeded`      | Đọc header`Retry-After`, sleep đúng số giây rồi retry                      |
| 524  | Cloudflare timeout           | Chuyển sang`stream: true`                                                        |

```python
import time, requests

def call_with_retry(payload, max_retries=3):
    for attempt in range(max_retries):
        r = requests.post(
            "https://platform.beeknoee.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            json=payload, stream=payload.get("stream", False),
        )
        if r.status_code == 429:
            time.sleep(int(r.headers.get("Retry-After", 15)))
            continue
        if r.status_code == 400:
            raise ValueError(r.json())   # lỗi request — sửa payload, đừng retry
        r.raise_for_status()
        return r
    raise RuntimeError("Hết lượt retry")
```

Mỗi lỗi có `request_id` — dán vào ticket support (Zalo/Messenger/Support Chat) để trace log.

---

## 8. Management API — monitor chi phí (mọi gói, kể cả Basic)

Base: `https://platform.beeknoee.com/v1/management` — dùng chung key, **bắt buộc có `User-Agent`**.

| Endpoint                                                  | Trả về                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GET /me`                                               | Số dư ví (`totalVND`/`realVND`/`bonusVND`), plan, hạn gói                                    |
| `GET /usage?limit=50`                                   | Log từng request (model, tokens,`costVND`, discount) — dùng `completedAt`, không dùng `date` |
| `GET /usage/daily?days=7`                               | Thống kê ngày (max 365)                                                                              |
| `GET /usage/models`                                     | Chi phí theo model                                                                                     |
| `GET /usage/stats`                                      | Tổng quan all-time + 7 ngày                                                                           |
| `GET /savings`                                          | Tiết kiệm từ free quota / cache / discount                                                           |
| `GET /cliproxy-quota`                                   | Quota free Antigravity & Codex còn lại                                                                |
| `GET /models/text` `/image` `/video` `/embedding` | Bảng giá + % discount theo plan của bạn                                                             |
| `GET /models/:model_id`                                 | Chi tiết 1 model                                                                                       |

```python
import requests

H = {"Authorization": f"Bearer {API_KEY}", "User-Agent": "MyAgent/1.0"}
BASE = "https://platform.beeknoee.com/v1/management"

def check_balance(min_vnd=50_000):
    me = requests.get(f"{BASE}/me", headers=H).json()
    bal = me["balance"]["totalVND"]
    if bal < min_vnd:
        raise RuntimeError(f"Ví còn {bal:,}đ — cần nạp thêm!")
    return bal

def spend_last_7_days():
    s = requests.get(f"{BASE}/usage/stats", headers=H).json()
    return s["last7DaysCostVND"], s["last7DaysTokens"]
```

**Pattern khuyên dùng cho agent:** gọi `check_balance()` khi khởi động session; nếu ví thấp thì chuyển sang model rẻ/free (DeepSeek, GLM) thay vì fail giữa chừng. Data phía Beeknoee cache 5 phút nên gọi định kỳ không tạo thêm load.

---

## 9. Checklist tích hợp

- [ ] Key lưu trong env var (`BEEKNOEE_API_KEY`), không hardcode
- [ ] `stream: true` cho mọi model reasoning
- [ ] Không gửi `temperature`/`top_p` cho Claude trừ khi thật cần (và chỉ một trong hai với Sonnet 4.x)
- [ ] Media route: PDF/audio/video → Gemini; image → bất kỳ model vision
- [ ] Retry 429 theo `Retry-After`; không retry 400/401/403
- [ ] `User-Agent` header cho Management API
- [ ] Kiểm tra ví trước session dài; log `costVND` từ `/usage` để đối soát
- [ ] Cân nhắc combo Fallback cho production




## Khoá

KHÔNG để trong file này. Khoá sống ở `.env` (đã `.gitignore`), tên biến
`BEEKNOEE_API_KEY` — xem `.env.example`.

File này là TÀI LIỆU và đáng commit; một khoá trong nó là một khoá trong
git, và `git rm` sau đó không xoá được thứ đã vào lịch sử.
