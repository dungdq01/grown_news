#!/usr/bin/env python3
r"""HỢP ĐỒNG adapter — một hình dạng cho mọi nhà. `AC-3.1` · `AC-3.2`.

    (prompt, tai_lieu, cau_hinh)  →  {"text": str, "quotes": [str, ...]}

Thứ riêng của provider nằm **dưới** hợp đồng này, không xuyên qua nó.

VÌ SAO KHÔNG DÙNG MỘT GATEWAY LIB (LiteLLM & co.)
Cả hai lối đều thoả `AC-3.1`, nên quyết định nằm ở chỗ khác. M12 giữ **toàn bộ**
khoá model của dự án và `dich-vu.json` khai nó là **cửa egress duy nhất**. Một
thoả hiệp chuỗi cung ứng ở đây là *mọi khoá* cộng *mọi tài liệu đã gửi* — và
lib gateway phổ biến nhất có **hai sự cố bảo mật mùa xuân 2026** (chuỗi cung ứng
+ CVE SQLi bị khai thác trong 36 giờ). Thêm nữa `M12-R3` đòi **đúng một** hàm ra
Internet và `AC-6.3` đòi allowlist **trước khi mở socket**: với một lib, socket
mở bên trong nó, nên *"một cửa egress"* thành **lời khai**.
Tự viết: ~30 dòng mỗi nhà, không phụ thuộc mới ngoài SDK của nhà đó.

VÌ SAO MODEL KHÔNG ĐƯỢC TRẢ VỊ TRÍ
Model chỉ được yêu cầu trả **quote nguyên văn**. Vị trí do `verify.dinh_vi()`
của TA tính. `Luật gốc`: *"không ai được sở hữu thứ dùng để đánh giá mình —
thước đo của mình"*. Và Citations API của một nhà **không cắm được** vào đây:
đo được nó `Incompatible with output_config.format` ⇒ 400, mà hợp đồng này LÀ
structured output (`FR-053 §2`).
"""

from __future__ import annotations

import importlib
import json

# Nhà nào có adapter — dẫn xuất từ THƯ MỤC, không gõ danh sách lần thứ hai.
# Gõ danh sách ở đây là chỗ thứ hai tên nhà xuất hiện, và `M12-R4` cấm.
from pathlib import Path

_THU_MUC = Path(__file__).resolve().parent


class HinhDangSai(Exception):
    """Adapter trả thứ không đúng hợp đồng."""


def ten_module(nha: str) -> str:
    """`nha-a` → `nha_a` (ví dụ hình dạng; nhà thật: `google` · `deepseek` · `anthropic`). Tên nhà trong bảng khai dùng gạch nối (đọc được);
    tên module Python không cho gạch nối. Quy đổi ở ĐÚNG MỘT chỗ — nếu không
    thì `co_adapter` nói có mà `import` nói không, và lỗi đó chỉ lộ ra giữa job."""
    return nha.replace("-", "_")


BANG_CUA = Path(__file__).resolve().parent.parent.parent / "assets" / "cua.json"


def doc_cua(duong=None) -> dict:
    """Bảng khai CỬA. Đọc như FILE, không import — cùng luật `dia-chi.json`."""
    return json.loads(Path(duong or BANG_CUA).read_text(encoding="utf-8"))


def cua_cua(dong: dict, bang_cua: dict) -> dict:
    """Dòng cửa mà một dòng model đi qua.

    `dong["adapter"]` khai tường minh thì thắng; không thì lấy `mac_dinh` của
    bảng cửa. Cửa lạ ⇒ NÉM, không rơi về mặc định: rơi im lặng nghĩa là gửi
    tài liệu tới một nơi không ai khai.
    """
    ten = dong.get("adapter") or bang_cua["mac_dinh"]
    c = bang_cua["cua"].get(ten)
    if c is None:
        raise HinhDangSai(f"cửa `{ten}` không có trong bảng khai cửa")
    return {**c, "ten": ten}


def go_khung(noi: str) -> str:
    """Bỏ khung markdown ```json … ``` quanh JSON.

    Đo 2026-09-04 trên cửa thật: `gemini-2.5-flash-lite` trả
    ```` ```json\n{...}\n``` ```` **dù** request khai
    `response_format: {"type": "json_object"}`. Đó là hành vi của model.

    Ở ĐÂY chứ không ở mỗi adapter: `openai.py` và `asr_cua.py` đều parse JSON
    từ phản hồi, và bản đầu tôi sửa MỘT chỗ ⇒ lối transcript chết đúng cùng
    một `JSONDecodeError` mười phút sau. Hai bản của một phép gỡ là hai bản
    sẽ lệch nhau.

    KHÔNG phải "sửa hộ nội dung": khung là BAO BÌ, gỡ nó ngang với trim khoảng
    trắng. Cái ta không làm là điền giá trị thiếu.
    """
    t = noi.strip()
    if not t.startswith("```"):
        return t
    t = t[3:]
    if "\n" in t[:20]:               # bỏ nhãn ngôn ngữ (`json`) ở dòng đầu
        t = t.split("\n", 1)[1]
    return t.rsplit("```", 1)[0].strip() if t.rstrip().endswith("```") else t


def ly_do_dung(tra) -> str:
    """`finish_reason` của phản hồi, hoặc "" nếu cửa không trả.

    Ở ĐÂY chứ không ở mỗi adapter, cùng lý lẽ `go_khung`: `openai.py` và
    `google.py` bóc cùng một hình dạng `choices[0]`, và bản đầu của WO-084 sửa
    một chỗ thì chỗ kia im lặng tiếp.

    Thiếu trường KHÔNG phải lỗi — không phải cửa nào cũng trả nó.
    """
    if not isinstance(tra, dict):
        return ""
    ds = tra.get("choices") or []
    if not ds or not isinstance(ds[0], dict):
        return ""
    return str(ds[0].get("finish_reason") or "")


def _hai_dau(noi: str, moi_ben: int = 220) -> str:
    """Đầu VÀ đuôi của phản hồi.

    WO-084 · Bản cũ in `noi[:300]`. Với một phản hồi bị cắt cụt thì 300 ký tự
    ĐẦU là cửa sổ vô dụng nhất có thể chọn: phần đầu luôn hợp lệ, chỗ vỡ luôn ở
    cuối. Job thật 2026-09-10 in ra đúng 300 ký tự mở đầu đẹp đẽ, và không ai
    đọc được từ đó rằng nó thiếu `quotes`.
    """
    if len(noi) <= moi_ben * 2 + 40:
        return repr(noi)
    return f"{noi[:moi_ben]!r} … […bỏ {len(noi) - moi_ben * 2} ký tự…] … {noi[-moi_ben:]!r}"


def doc_json(noi, *, cho: str, ly_do: str = "") -> dict:
    """Phản hồi model → dict. Ném kèm NGUYÊN VĂN nếu không parse được.

    `cho` là tên chỗ gọi — một `JSONDecodeError` trần ba tầng sâu chỉ nói
    *"Expecting value line 1 column 1"*, và người sửa không có cách nào biết
    model đã trả cái gì.

    `ly_do` là `finish_reason` của cửa. WO-084: khi nó là `length`, phản hồi
    KHÔNG sai hình dạng — nó **bị cắt**, và hai bệnh ấy chữa ở hai chỗ khác
    nhau (nâng trần chữ vs. sửa prompt/hợp đồng). Nói sai tên bệnh là gửi
    người sửa đi sai hướng, và job thật 2026-09-10 đã đi đúng đường sai ấy.

    Ngược lại KHÔNG được quy mọi lỗi parse cho việc bị cắt: `stop` + JSON hỏng
    vẫn phải được gọi đúng tên. Một chẩn đoán chỉ có giá trị khi nó biết nói
    KHÔNG.
    """
    if not isinstance(noi, str):
        return noi
    try:
        return json.loads(go_khung(noi))
    except ValueError as e:
        if str(ly_do) == "length":
            raise HinhDangSai(
                f"[{cho}] cửa CẮT phản hồi giữa chừng — `finish_reason: "
                f"length`, nhận được {len(noi)} ký tự và JSON chưa đóng. "
                f"Không phải model trả sai hình dạng: nâng `tran_chu_chung_cat` "
                f"trong `chungcat/assets/nguong.json`, hoặc bớt yêu cầu trong "
                f"prompt. Nội dung: {_hai_dau(noi)}") from e
        raise HinhDangSai(
            f"[{cho}] phản hồi không phải JSON sau khi gỡ khung"
            + (f" (`finish_reason: {ly_do}`)" if ly_do else "")
            + f": {_hai_dau(noi)}") from e


def adapter_cua(dong: dict, mac_dinh: str) -> str:
    """Tên adapter một dòng bảng khai cần — FR-059.

    Trả tên MODULE adapter — tức `phuong_ngu` của cửa, không phải tên cửa:
    nhiều cửa cùng nói một phương ngữ (`beeknoee` và `openai` gốc đều nói
    `openai`), và file adapter đặt tên theo phương ngữ. Nhờ vậy thêm một gateway
    nói tiếng OpenAI = 1 dòng `cua.json` + 0 file.

    `mac_dinh` KHÔNG có default — tên cửa là dữ liệu của bảng khai, và một tên
    cửa gõ trong mã là đúng thứ `M12-R4` cấm.
    """
    ten = dong.get("adapter") or mac_dinh
    try:
        return doc_cua()["cua"][ten]["phuong_ngu"]
    except (KeyError, OSError):
        # Cửa chưa khai ⇒ trả CHÍNH tên cửa. `co_adapter` sẽ nói KHÔNG, và phép
        # chặn (b) từ chối kèm tên đọc được — thay vì ném một lỗi khác loại ở
        # giữa một hàm mà người gọi chỉ chờ một cái tên.
        return ten


def co_adapter(nha: str) -> bool:
    """Nhà này đã có file adapter chưa. Đọc THƯ MỤC, không đọc một danh sách —
    một danh sách ở đây là chỗ thứ hai tên nhà xuất hiện (`M12-R4`)."""
    return (_THU_MUC / f"{ten_module(nha)}.py").exists()


def _kiem_hinh_dang(kq) -> dict:
    if not isinstance(kq, dict) or set(kq) != {"text", "quotes"}:
        raise HinhDangSai(f"hợp đồng là {{text, quotes}}, adapter trả {sorted(kq) if isinstance(kq, dict) else type(kq)}")
    if not isinstance(kq["text"], str) or not isinstance(kq["quotes"], list):
        raise HinhDangSai("`text` phải là chuỗi, `quotes` phải là danh sách")
    if any(not isinstance(q, str) for q in kq["quotes"]):
        raise HinhDangSai("mọi phần tử `quotes` phải là chuỗi NGUYÊN VĂN của nguồn")
    return kq


# Bảng khai ngưỡng — trần payload của cửa egress sống ở đây (`AC-6.4`).
# Đọc như FILE, một chỗ, không gõ số: cùng luật `nguong_fuzzy` đã theo.
NGUONG = Path(__file__).resolve().parent.parent.parent / "assets" / "nguong.json"


def tran_chu() -> int:
    """Trần chữ (`max_tokens`) của lối chưng cất — ĐỌC BẢNG, không gõ số.

    WO-084 · Trước đợt này hai adapter KHÔNG gửi `max_tokens` gì cả, tức trần
    thật là mặc định của cửa — một con số không nằm trong repo, không ai đọc
    được, và là thứ đã cắt job của chủ dự án 2026-09-10.

    Ở `hop_dong` để hai adapter cùng MỘT nguồn. Bảng thiếu khoá ⇒ ném: một
    `or 4096` lặng lẽ ở đây dựng đúng cái bệnh vừa chữa — một trần không ai
    khai và không ai thấy.
    """
    d = json.loads(NGUONG.read_text(encoding="utf-8"))
    v = d.get("tran_chu_chung_cat")
    if not isinstance(v, int) or v < 1:
        raise RuntimeError(
            "`nguong.json` thiếu `tran_chu_chung_cat` — WO-084 khai nó ở bảng "
            "để nâng trần là một quyết định, không phải một lần sửa mã")
    return v


def goi_qua_adapter(ten_adapter: str, *, prompt, tai_lieu, cau_hinh, cua=None,
                    chuyen=None, tran=None, allowlist=None, log=None) -> dict:
    """Gọi một adapter và ép kết quả về đúng hợp đồng.

    `chuyen` cho cổng tiêm transport giả ⇒ cổng chạy **không cần mạng**. Nó đi
    thẳng xuống `egress.gui()`, nơi duy nhất mở socket.

    `tran` — trần byte của `AC-6.4`. **Không truyền thì ĐỌC BẢNG KHAI**, không
    phải để `None` đi tiếp: `egress.gui` so `len(...) > tran`, và `> None` là
    `TypeError` giữa job. Trước 2026-09-04 con số 32 MB không nằm ở đâu cả
    (`grep 33554432 chungcat -r` = 0) và đường này truyền thẳng `None` xuống —
    tức trần tồn tại trong spec chứ không tồn tại trong máy.
    """
    if chuyen is not None:
        return _kiem_hinh_dang(chuyen(prompt=prompt, tai_lieu=tai_lieu, cau_hinh=cau_hinh))
    if tran is None:
        from bang_khai import doc_tran_payload
        tran = doc_tran_payload(NGUONG)
    # `cua` không truyền thì ĐỌC BẢNG KHAI, không để `None` đi tiếp: adapter
    # đọc `cua["bien_khoa"]`, và `None["bien_khoa"]` là `TypeError` GIỮA JOB —
    # cùng lớp lỗi `tran=None` mà `AC-6.4` đã trả giá một lần.
    if cua is None:
        cua = cua_cua(cau_hinh, doc_cua())
    mod = importlib.import_module(f"adapter.{ten_module(ten_adapter)}")
    return _kiem_hinh_dang(mod.goi(
        prompt=prompt, tai_lieu=tai_lieu, cau_hinh=cau_hinh, cua=cua,
        tran=tran, allowlist=allowlist, log=log))
