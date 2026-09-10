#!/usr/bin/env python3
r"""Cổng MỘT CỬA EGRESS — `M12-R3` · `AC-6.1` · `AC-6.2` · `AC-6.3`.

VÌ SAO CỔNG NÀY TỒN TẠI
`FR-043` bậc 4 là hợp đồng với chủ dự án về việc dữ liệu rời máy. Hợp đồng đó
chỉ có nghĩa nếu **ĐẾM ĐƯỢC**, và đếm được chỉ khi có ĐÚNG MỘT chỗ đi ra.

Và thứ tự log↔gửi không phải chi tiết: **log SAU khi gửi là log của những lần
THÀNH CÔNG**. Đúng những lần thất bại — timeout, bị chặn giữa đường — là lúc ta
cần biết nhất mà lại không có dòng nào.

Đo thứ tự bằng `seq`, KHÔNG bằng đồng hồ (`spec §6`): cửa cấp một số nguyên
tăng dần cho mỗi lần gửi; dòng log mang `seq`, và **payload gửi đi cũng mang
`seq` đó**. So hai thứ ta tự cấp là so một SỰ KIỆN; so timestamp của ta với
timestamp của request là so hai đồng hồ khác nhau.

ĐỎ_KHI  đích ngoài allowlist vẫn mở socket · vượt trần mà đã băm/đã ghi log ·
        transport ném mà KHÔNG có dòng log · sha256 dựng lại từ log ra số khác ·
        có chỗ thứ hai gọi `.post`
XANH_KHI bốn chiều đúng và grep toàn module ra đúng một cửa
"""

import ast
import hashlib
import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parent.parent.parent
SRC = R / "chungcat" / "src"
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(SRC))

import _nap  # noqa: E402

loi = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


class NemNgay(Exception):
    """Transport chết giữa đường — ca mà log-SAU-khi-gửi sẽ mất dòng."""


tmp = Path(tempfile.mkdtemp(prefix="m12-egress-"))
try:
    try:
        egress = _nap.nap("egress")
    except (_nap.ThieuMa, _nap.ThieuGoi) as e:
        _nap.bao_do_va_thoat(e, "check_mot_cua_egress.py", "T12-4")


    LOG = tmp / "egress.jsonl"
    ALLOW = ["api.vi-du.com"]
    TRAN = 1024  # trần fixture, KHÔNG phải trần thật — trần thật ở bảng khai

    def doc_log():
        if not LOG.exists():
            return []
        return [json.loads(x) for x in LOG.read_text(encoding="utf-8").splitlines() if x.strip()]

    # ══ AC-6.3 · đích ngoài allowlist ⇒ chặn TRƯỚC khi mở socket ═══════════
    da_goi = []
    try:
        egress.gui({"a": 1}, "https://ke-la.com/v1", allowlist=ALLOW, tran=TRAN,
                   log=LOG, chuyen=lambda *_a, **_k: da_goi.append(1))
        kiem(False, "đích ngoài allowlist bị TỪ CHỐI")
    except Exception as e:
        kiem("allowlist" in type(e).__name__.lower() or "allow" in str(e).lower()
             or "đích" in str(e).lower(),
             "đích ngoài allowlist bị TỪ CHỐI", f"ném: {type(e).__name__}: {e}")
    kiem(not da_goi, "KHÔNG mở socket khi đích ngoài allowlist")
    kiem(not doc_log(), "KHÔNG ghi dòng log nào cho lần gửi bị chặn ở allowlist")

    # ══ AC-6.2b · vượt trần ⇒ chặn TRƯỚC sha256 và TRƯỚC log ══════════════
    try:
        egress.gui({"to": "x" * (TRAN * 3)}, "https://api.vi-du.com/v1",
                   allowlist=ALLOW, tran=TRAN, log=LOG,
                   chuyen=lambda *_a, **_k: da_goi.append(1))
        kiem(False, "payload vượt trần bị TỪ CHỐI")
    except Exception as e:
        kiem(True, "payload vượt trần bị TỪ CHỐI", f"ném: {type(e).__name__}")
    kiem(not doc_log(),
         "vượt trần ⇒ KHÔNG dòng log nào — log không được ghi một lần gửi KHÔNG BAO GIỜ xảy ra")

    # ══ AC-6.1 · log TRƯỚC khi gửi — chứng minh bằng ca transport NÉM ══════
    payload = {"prompt": "xin chào", "tai_lieu": ["trang 1", "trang 2"]}
    try:
        egress.gui(dict(payload), "https://api.vi-du.com/v1", allowlist=ALLOW,
                   tran=TRAN, log=LOG, chuyen=lambda *_a, **_k: (_ for _ in ()).throw(NemNgay()))
    except NemNgay:
        pass
    d = doc_log()
    kiem(len(d) == 1,
         "transport NÉM mà dòng log VẪN CÒN — đây là ca log-sau-khi-gửi sẽ mất",
         f"có {len(d)} dòng")

    # ══ AC-6.1b · `seq` do TA cấp, và payload GỬI ĐI mang đúng `seq` đó ════
    gui_di = {}
    egress.gui(dict(payload), "https://api.vi-du.com/v1", allowlist=ALLOW, tran=TRAN,
               log=LOG, chuyen=lambda url, body, **_k: gui_di.update(body=body))
    d = doc_log()
    kiem(len(d) == 2, "lần gửi thành công ghi thêm ĐÚNG một dòng", f"có {len(d)}")
    kiem([x["seq"] for x in d] == sorted(x["seq"] for x in d),
         "`seq` tăng dần, do TA cấp")
    kiem(gui_di.get("body", {}).get("_seq") == d[-1]["seq"],
         "payload GỬI ĐI mang đúng `seq` của dòng log — so sự kiện, không so đồng hồ",
         f"payload._seq={gui_di.get('body', {}).get('_seq')} vs log.seq={d[-1]['seq']}")

    # ══ AC-6.2 · sha256 dựng lại từ log ra CÙNG số ════════════════════════
    lai = hashlib.sha256(egress.canon(gui_di["body"]).encode("utf-8")).hexdigest()
    kiem(lai == d[-1]["sha256"],
         "dựng lại payload rồi băm lại ra CÙNG sha256 (AC-6.2)",
         f"{lai[:16]}… vs {d[-1]['sha256'][:16]}…")
    kiem(egress.canon({"b": 1, "a": 2}) == egress.canon({"a": 2, "b": 1}),
         "`canon` ổn định theo thứ tự khoá — nếu không, AC-6.2 trượt vì dict order")

    # ══ AC-6.5 · đúng MỘT chỗ gọi `.post` trong toàn module ═══════════════
    # ══ T12-18 · KHOÁ không được vào dòng log ═════════════════════════════
    #
    # Adapter gửi khoá API qua `headers`, và `gui()` đổ mọi `kw` lạ vào dòng
    # log. Một dòng `egress.jsonl` mang khoá là một khoá trong file mà `ADR-06`
    # không bao giờ cho phép xuất — và log này CÓ đường ra (bản lùi).
    KHOA_THU = "sk-bee-khoa-thu-cho-cong"
    egress.gui({"a": 1}, "https://api.vi-du.com/v1", allowlist=ALLOW, tran=TRAN,
               log=LOG, headers={"Authorization": f"Bearer {KHOA_THU}"},
               chuyen=lambda *_a, **_k: {"ok": True})
    tatLog = LOG.read_text(encoding="utf-8")
    kiem(KHOA_THU not in tatLog, "khoá API KHÔNG có trong `egress.jsonl`")
    kiem("Authorization" not in tatLog, "và cả tên header cũng không vào log")

    # ══ T12-18 · STREAM gom về CÙNG hình dạng, và không phá AC-6.1/6.2 ════
    #
    # `stream: true` là bắt buộc với model reasoning (cửa cắt ở 524 sau 120s).
    # Nó đổi ĐƯỜNG ỐNG, không được đổi hợp đồng: `_boc` của adapter phải đọc
    # được cùng một hình dạng, và log vẫn ghi TRƯỚC khi gửi.
    truocStream = len(doc_log())
    daGui = []

    def _sse(url, body, **kw):
        daGui.append(body)
        return {"choices": [{"message": {"content": "ghép từ ba chunk"}}]}

    kq = egress.gui({"x": 1, "stream": True}, "https://api.vi-du.com/v1",
                    allowlist=ALLOW, tran=TRAN, log=LOG, chuyen=_sse)
    kiem(kq["choices"][0]["message"]["content"] == "ghép từ ba chunk",
         "phản hồi stream về đúng hình dạng `choices[0].message.content`")
    kiem(daGui and daGui[0].get("stream") is True,
         "cờ `stream` ĐI TỚI transport — nếu bị lột thì cửa vẫn cắt ở 524")
    kiem(len(doc_log()) == truocStream + 1,
         "một lời gọi stream = ĐÚNG một dòng log, không phải một dòng mỗi chunk")
    dongCuoi = doc_log()[-1]
    kiem("sha256" in dongCuoi and "seq" in dongCuoi,
         "dòng đó vẫn mang `seq` + `sha256` của PAYLOAD GỬI ĐI (AC-6.1/6.2)")

    # ══ AC-6.4 · trần 32 MB là SỐ CÓ KHAI, không phải một fixture ═════════
    #
    # Cổng này vốn chỉ dùng `TRAN = 1024` và trỏ về "bảng khai" — mà đo được:
    # `grep 33554432 chungcat -r` = 0. Trần 32 MB tồn tại trong `spec §AC-6.4`
    # và KHÔNG tồn tại trong máy: `egress.gui(tran=...)` là tham số bắt buộc
    # không default, và `goi_qua_adapter` truyền thẳng `None` xuống.
    #
    # Fixture 1024 vẫn giữ (chạy nhanh, đo đúng NHÁNH `>`), nhưng nó không nói
    # được trần THẬT là bao nhiêu — nên bốn vế dưới đo con số đã khai.
    bang_khai = _nap.nap("bang_khai")
    NGUONG_JSON = R / "chungcat" / "assets" / "nguong.json"
    tran_khai = bang_khai.doc_tran_payload(NGUONG_JSON)
    kiem(tran_khai == 32 * 1024 * 1024,
         "bảng khai có `tran_payload_byte` = 32 MB (AC-6.4)", f"khai {tran_khai}")

    # Số phải ở BẢNG KHAI, không gõ trong mã — cùng luật `M12-R4` với tên model.
    goc_ma = [f"{f.relative_to(R)}:{n.lineno}"
              for f in SRC.rglob("*.py")
              for n in ast.walk(ast.parse(f.read_text(encoding="utf-8")))
              if isinstance(n, ast.Constant) and n.value == tran_khai]
    kiem(not goc_ma, "số trần KHÔNG gõ cứng trong `chungcat/src/**`", f"thấy {goc_ma}")

    # Và đường THẬT phải LẤY được số đó — không truyền `tran` thì nó đọc bảng
    # khai, chứ không để `None` đi tiếp (`len(...) > None` là TypeError giữa job).
    import inspect
    hd = _nap.nap("adapter.hop_dong")
    kiem("tran" in inspect.signature(hd.goi_qua_adapter).parameters,
         "`goi_qua_adapter` CÓ tham số `tran` — không có thì trần không tới được "
         "`egress.gui`, và AC-6.4 chỉ sống trong spec")
    kiem(Path(hd.NGUONG).resolve() == NGUONG_JSON.resolve(),
         "và nó đọc ĐÚNG file bảng khai khi `tran` không được truyền",
         f"trỏ {hd.NGUONG}")

    # `google.goi` KHÔNG được có `tran=None`: một default `None` đi thẳng vào
    # `len(...) > None` ⇒ TypeError GIỮA JOB, sau khi tài liệu đã đọc xong.
    gg = _nap.nap("adapter.google")
    kiem(inspect.signature(gg.goi).parameters["tran"].default is inspect.Parameter.empty,
         "`google.goi` đòi `tran` TƯỜNG MINH — không default `None`")

    cho_post = []
    for f in SRC.rglob("*.py"):
        for n in ast.walk(ast.parse(f.read_text(encoding="utf-8"))):
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) \
               and n.func.attr in ("post", "request", "send"):
                cho_post.append(f"{f.relative_to(R)}:{n.lineno}")
    kiem(len(cho_post) <= 1,
         "đúng MỘT chỗ trong chungcat/src/** gọi ra mạng",
         f"thấy {len(cho_post)}: {cho_post}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print("\n" + "-" * 62)
if loi:
    for x in loi:
        print("  -", x)
    sys.exit(f"{len(loi)} chỗ chưa đạt — M12-R3 chưa có răng")

# ── T12-23 AC3 · N tiến trình ⇒ N sổ, gộp không trùng ───────────────────
#
# `seq` do TA cấp bằng cách đọc dòng cuối. Một sổ chung cho N tiến trình là
# cuộc đua trên chính phép cấp số — và nó vỡ IM LẶNG: hai dòng cùng `seq`,
# `AC-6.2` (dựng lại từ log ra cùng con số) sai, chỉ lộ khi ai đó đọc sổ nhiều
# tháng sau.
def _kiem_so_theo_worker():
    import os
    import tempfile
    goc = Path(tempfile.mkdtemp())
    cu = os.environ.get("CHUNGCAT_WORKER_ID")
    try:
        duong = []
        for wid in ("w1", "w2"):
            os.environ["CHUNGCAT_WORKER_ID"] = wid
            d = egress.duong_log(goc)
            duong.append(d)
            d.write_text("".join(
                json.dumps({"seq": i, "sha256": f"{wid}{i}"}) + chr(10)
                for i in (1, 2, 3)), encoding="utf-8")
        kiem(len(set(duong)) == 2,
             "AC3 · hai `CHUNGCAT_WORKER_ID` ⇒ HAI file sổ khác nhau",
             f"{[d.name for d in duong]}")
        moi = egress.doc_moi_so(goc)
        kiem(len(moi) == 6, "AC3 · đọc gộp thấy đủ dòng của MỌI sổ",
             f"{len(moi)} dòng")
        cap = {(d["worker_id"], d["seq"]) for d in moi}
        kiem(len(cap) == 6, "AC3 · gộp theo (worker_id, seq) KHÔNG trùng",
             f"{len(cap)} cặp / 6 dòng")
        kiem(len({d["seq"] for d in moi}) == 3,
             "AC3 · `seq` trùng nhau giữa hai sổ là ĐÚNG — nó liên tục "
             "trong TỪNG sổ, không toàn cục")
    finally:
        if cu is None:
            os.environ.pop("CHUNGCAT_WORKER_ID", None)
        else:
            os.environ["CHUNGCAT_WORKER_ID"] = cu
        __import__("shutil").rmtree(goc, ignore_errors=True)


_kiem_so_theo_worker()

print("một cửa · log TRƯỚC gửi · seq khớp · sha256 dựng lại được — M12-R3 có răng")
