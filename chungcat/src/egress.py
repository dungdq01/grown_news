#!/usr/bin/env python3
r"""MỘT CỬA ra Internet của M12. `M12-R3` · `FR-043` bậc 4.

Mọi byte của kho rời khỏi máy đi qua **đúng hàm `gui()` này**. Không phải vì
gọn — vì `FR-043` bậc 4 là một hợp đồng **đếm được**, và đếm được chỉ khi có
một chỗ đi ra.

BA THỨ TỰ KHÔNG ĐƯỢC ĐẢO, và mỗi cái có một lý do đã trả giá:

  1. allowlist TRƯỚC mọi thứ   — chặn trước khi mở socket, không phải bắt lỗi sau
  2. trần TRƯỚC băm và log     — vượt trần là 400; ghi log trước đó nghĩa là log
                                  ghi một lần gửi KHÔNG BAO GIỜ XẢY RA, và con số
                                  egress nói dối theo chiều phóng đại
  3. log + fsync TRƯỚC post    — log SAU khi gửi là log của những lần THÀNH CÔNG.
                                  Đúng lúc timeout/bị chặn là lúc cần biết nhất.

`seq` là số nguyên tăng dần **do TA cấp**. Dòng log mang nó, và payload gửi đi
cũng mang nó. Cổng đối chiếu hai thứ ta tự cấp — đó là so một **sự kiện**. So
timestamp của ta với timestamp của request là so hai đồng hồ khác nhau.

`chuyen` là tham số để cổng tiêm transport giả — nhờ nó cổng chạy **không cần
mạng**. Mặc định là `httpx`, nạp LƯỜI: import ở tầng module thì cổng cũng phải
cài `httpx` mới chạy được, và một cổng đỏ vì thiếu phụ thuộc là đỏ sai lý do.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from urllib.parse import urlsplit


class DichKhongKhai(Exception):
    """Đích không có trong allowlist của bảng khai."""


class VuotTran(Exception):
    """Payload lớn hơn trần đã khai."""


def canon(payload: dict) -> str:
    """Dạng chuẩn để băm. Ổn định theo thứ tự khoá.

    Không có phép này thì `AC-6.2` (*dựng lại từ log rồi băm ra cùng số*) trượt
    vì thứ tự khoá dict — một lỗi chỉ lộ ra khi ai đó đọc lại log sau nhiều
    tháng, tức đúng lúc không sửa được nữa.
    """
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def duong_log(goc) -> Path:
    """Đường sổ egress của TIẾN TRÌNH NÀY — `egress.<worker_id>.jsonl`.

    Mỗi tiến trình một file, KHÔNG một file chung có khoá (`T12-23`).

    `seq` do TA cấp và cấp bằng cách đọc dòng cuối của sổ. N tiến trình cùng
    ghi một file là một cuộc đua trên chính phép cấp số: hai bên đọc cùng "dòng
    cuối" rồi cùng ghi `seq` ấy, và `AC-6.2` (*dựng lại từ log ra cùng con số*)
    vỡ — mà nó vỡ IM LẶNG, chỉ lộ khi có người đọc lại sổ nhiều tháng sau.

    Không dùng khoá file chung: khoá chéo tiến trình trên Windows là ổ bug, và
    một khoá giữ qua `fsync` biến mọi lần gửi thành hàng một.

    Đánh đổi phải nói ra: `seq` chỉ còn liên tục TRONG một file. Người đọc sổ
    phải gộp theo `(worker_id, seq)`, và `worker_id` nằm trong chính tên file.
    Đó là đổi một dòng thời gian toàn cục lấy N dòng thời gian không đua nhau —
    và một dòng thời gian toàn cục SAI thì tệ hơn N dòng đúng.
    """
    import os
    wid = os.environ.get("CHUNGCAT_WORKER_ID") or str(os.getpid())
    return Path(goc) / f"egress.{wid}.jsonl"


def doc_moi_so(goc):
    """Mọi dòng của MỌI sổ egress dưới `goc`, kèm `worker_id` từ tên file.

    Công cụ đọc và cổng kiểm đi qua đây thay vì mở thẳng `egress.jsonl` — nếu
    không, thêm tiến trình thứ hai là con số báo cáo lặng lẽ thiếu một nửa.
    """
    import json as _j
    ra = []
    for f in sorted(Path(goc).glob("egress*.jsonl")):
        wid = f.stem.split(".", 1)[1] if "." in f.stem else "0"
        for dong in f.read_text(encoding="utf-8").splitlines():
            if dong.strip():
                d = _j.loads(dong)
                d.setdefault("worker_id", wid)
                ra.append(d)
    return ra


def _seq_ke_tiep(log: Path) -> int:
    """`seq` nối tiếp dòng cuối. Đọc lại từ log để nó bền qua khởi động lại."""
    if not log.exists():
        return 1
    cuoi = 0
    for dong in log.read_text(encoding="utf-8").splitlines():
        if dong.strip():
            cuoi = max(cuoi, json.loads(dong).get("seq", 0))
    return cuoi + 1


def _ghi_ben(log: Path, dong: dict) -> None:
    """Append + `fsync`. Không `fsync` thì dòng nằm trong buffer, và một crash
    giữa hai lệnh xoá đúng thứ `M12-R3` sinh ra để giữ."""
    log.parent.mkdir(parents=True, exist_ok=True)
    with open(log, "a", encoding="utf-8") as f:
        f.write(json.dumps(dong, ensure_ascii=False) + "\n")
        f.flush()
        os.fsync(f.fileno())


def _httpx_post(url: str, body: dict, **kw):
    import httpx  # nạp LƯỜI — xem docstring đầu file
    if body.get("stream"):
        return _httpx_stream(url, body, **kw)
    # Nhánh KHÔNG-stream: trả `dict` cùng hình dạng nhánh stream, và mang theo
    # `headers`.
    #
    # Bản đầu bỏ qua `headers` và trả thẳng `Response`. Cả hai lỗi ẩn được vì
    # mọi lối đang dùng đều khai `stream: true` — nhánh này chưa ai đi. Lối
    # `cua-asr` bỏ stream (phản hồi là MỘT tài liệu JSON) là lần đầu nó chạy,
    # và nó chết ngay: mất `Authorization` ⇒ 401, rồi `Response` không phải
    # dict ⇒ `TypeError` ba tầng sâu.
    r = httpx.post(url, json=body, timeout=kw.get("timeout", 600),
                   headers=kw.get("headers"))
    r.raise_for_status()
    return r.json()


class KhongCoNoiDung(Exception):
    """Cửa trả 200 nhưng stream không có một ký tự nội dung nào.

    Lớp RIÊNG, không dùng lại `HinhDangSai`: *"không trả gì"* và *"trả thứ sai
    hình dạng"* có hai nguyên nhân khác nhau và hai cách sửa khác nhau. Gộp
    chúng là đẩy người sửa đi tìm một JSON hỏng không tồn tại.
    """


def _httpx_stream(url: str, body: dict, **kw):
    """SSE → CÙNG hình dạng như phản hồi thường.

    Vì sao stream: model reasoning có thể "suy nghĩ" quá 120 giây, và
    non-streaming thì Cloudflare cắt ở 524 — tức job chết vì HẠ TẦNG, không vì
    model. Bật stream đổi ĐƯỜNG ỐNG, không đổi hợp đồng.

    Và nó KHÔNG đổi `AC-6.1`/`AC-6.2`: log ghi TRƯỚC khi gửi, `sha256` băm
    PAYLOAD GỬI ĐI. Phản hồi tới theo mấy chunk không liên quan tới hai vế đó.

    Gom về `{"choices":[{"message":{"content": …}}]}` để `_boc` của adapter
    không phải biết mình đang đọc stream hay không — một hàm bóc rẽ hai nhánh
    là hai đường về cùng một hợp đồng, và một trong hai sẽ mục.
    """
    import json as _json

    import httpx
    manh = []
    # Vì sao thu ba thứ này: xem `KhongCoNoiDung` dưới đây.
    loi_cua: list[str] = []
    ly_do: set[str] = set()
    # `so_chunk` phải TĂNG THẬT. Bản đầu khai `= 0` rồi không đụng tới nữa, nên
    # mọi câu `KhongCoNoiDung` đều nói `chunk=0` — kể cả khi cửa đã gửi hàng
    # trăm chunk. Chính dòng đó dẫn phép chẩn đoán sang giả thuyết SAI ("thân
    # request quá lớn") và đẻ ra `tran_than_cua_byte`, trong khi nguyên nhân
    # thật là tiền tố `data:` URI. Một cổng chẩn đoán nói dối tốn nhiều hơn
    # một cổng vắng: cổng vắng thì người đi tìm, cổng nói dối thì người tin.
    so_chunk = 0
    with httpx.stream("POST", url, json=body,
                      timeout=kw.get("timeout", 600),
                      headers=kw.get("headers")) as r:
        r.raise_for_status()
        for dong in r.iter_lines():
            if not dong or not dong.startswith("data:"):
                continue
            phan = dong[5:].strip()
            if phan == "[DONE]":
                break
            so_chunk += 1        # ĐẾM ở đây, trên chunk `data:` THẬT nhận được.
            try:
                g = _json.loads(phan)
            except ValueError:
                # Chunk không parse được thì BỎ QUA chunk đó, không giết cả job:
                # một số cửa chèn dòng keep-alive giữa các `data:`.
                continue
            # Lỗi cửa gửi TRONG stream (HTTP đã 200): giữ lại để nói ra.
            if isinstance(g.get("error"), (dict, str)):
                loi_cua.append(str(g["error"])[:200])
            for ch in g.get("choices") or []:
                x = (ch.get("delta") or {}).get("content")
                if x:
                    manh.append(x)
                if ch.get("finish_reason"):
                    ly_do.add(str(ch["finish_reason"]))
    noi = "".join(manh)
    if not noi:
        # KHÔNG trả `content: ""` cho người gọi.
        #
        # Đo được 2026-09-05: cửa trả 200 + stream RỖNG, adapter nhận `''`, và
        # câu lỗi tới tay người là *"phản hồi không phải JSON sau khi gỡ khung:
        # ''"* — nó tố sai chỗ (như thể model trả JSON hỏng) trong khi model
        # không trả gì cả. Một câu lỗi chỉ sai chỗ thôi cũng đủ để mất một buổi.
        #
        # Ba dữ kiện dưới đây là toàn bộ những gì stream nói, và mỗi cái loại
        # trừ một nguyên nhân khác nhau:
        #   `so_chunk = 0`      → cửa không gửi gì (auth, model sai, hết tiền)
        #   `finish_reason`     → cửa CẮT (`length`, `content_filter`)
        #   `error` trong chunk → cửa nói lý do, chỉ nói ở tầng SSE chứ không
        #                          ở mã HTTP
        raise KhongCoNoiDung(
            f"cửa trả 200 nhưng 0 ký tự nội dung "
            f"(chunk={so_chunk}"
            + (f", finish_reason={sorted(ly_do)}" if ly_do else "")
            + (f", lỗi cửa: {loi_cua[:2]}" if loi_cua else "")
            + ")")
    return {"choices": [{"message": {"content": noi}}]}


def gui(payload: dict, dich: str, *, allowlist, tran: int, log,
        chuyen=None, **kw):
    """Gửi `payload` tới `dich`. Trả về thứ `chuyen` trả về.

    `tieu_egress` KHÔNG phải tham số ở đây: hàm này là cửa của **mọi** lời gọi
    ra Internet, gồm cả lối `tai_ve` (tải audio) vốn không gửi dữ liệu của ta
    đi. Cột đó thuộc bảng khai `nguon_transcript` và người gọi truyền xuống qua
    `kw` để nó vào dòng log — trộn hai nghĩa của chữ *egress* vào một cột là
    cách con số này bắt đầu nói dối (`FR-054 §1.5`).
    """
    log = Path(log)

    # 1 · allowlist — TRƯỚC khi mở socket, trước cả khi dựng payload.
    host = urlsplit(dich).hostname or ""
    if host not in set(allowlist):
        raise DichKhongKhai(f"đích `{host}` không có trong allowlist của bảng khai")

    # 2 · trần — TRƯỚC băm, TRƯỚC log.
    than = canon(payload)
    if len(than.encode("utf-8")) > tran:
        raise VuotTran(f"payload {len(than.encode('utf-8'))} byte > trần {tran}")

    # 3 · seq → payload → log(+fsync) → gửi. Đảo bất kỳ hai bước nào là mất
    #     một tính chất mà `AC-6.1`/`AC-6.2` đang dựa vào.
    seq = _seq_ke_tiep(log)
    payload["_seq"] = seq
    than = canon(payload)
    # `headers` KHÔNG vào dòng log: nó chứa khoá API, và một dòng log mang khoá
    # là một khoá trong file mà `ADR-06` không bao giờ cho phép xuất.
    _ghi_ben(log, {
        "seq": seq,
        "sha256": hashlib.sha256(than.encode("utf-8")).hexdigest(),
        "dich": dich,
        "so_byte": len(than.encode("utf-8")),
        **{k: v for k, v in kw.items() if k not in ("timeout", "headers")},
    })
    return (chuyen or _httpx_post)(dich, payload, **kw)
