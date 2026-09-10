#!/usr/bin/env python3
r"""FR-072 T1 · T13-1 AC5 — MỘT hợp đồng, một schema: đối chiếu HAI CHIỀU tập trường
`ket_qua[]` giữa `05_uiux/contracts/truyhoi.sample.v3.json` (fixture) và hợp đồng viết trong
`06_modules/M13_truyhoi/spec.md §1a` (FROZEN; `model_flow.md §2` trỏ về đó, không liệt lại tên).

Vì sao đo spec §1a chứ không model_flow §2: đo 2026-09-10 — `model_flow.md` không chứa tên
10 trường (grep `heading_path` ⇒ 0), nó viết *"hình dạng FR-072 §1.1, xem spec §1a"*. So với
một bảng không có tên là so với rỗng — cổng xanh vô căn cứ. Cổng vẫn kiểm model_flow §2 CÓ
trỏ về spec §1a, để hai tài liệu không trôi khỏi nhau.

Một trường có ở sample mà thiếu ở spec ⇒ đỏ, và ngược lại. Cả `ket_qua[]` lẫn khoá gốc
request (`cau_hoi` · `pham_vi` · `nguon` · `k`) và response (`ket_qua` · `so_ban_ghi_trong_pham_vi` · `tong`).
Sample phải giữ `version: 3` và khoá `chunks` (trang.mjs soDotHai đếm nó — không đổi shape).

ĐỎ_KHI  lệch một chiều · model_flow không trỏ spec §1a · sample mất `chunks`/`version`
XANH_KHI hai tập bằng nhau, hai chiều
--tu-kiem: bản chép tmp của sample bỏ một trường ở MỘT phía ⇒ đỏ, nêu trường + chiều.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402

CONG = "check_hop_dong_v3.py"
SAMPLE = K.R / "05_uiux" / "contracts" / "truyhoi.sample.v3.json"
SPEC = K.R / "06_modules" / "M13_truyhoi" / "spec.md"
MODEL_FLOW = K.R / "06_modules" / "M13_truyhoi" / "model_flow.md"


def truong_spec(spec_txt: str) -> tuple[set, set, set]:
    """(khoá request, khoá response gốc, khoá ket_qua[]) từ khối POST /truy-hoi trong spec §1a."""
    khoi = re.search(r"POST /truy-hoi(.*?)```", spec_txt, re.S)
    if not khoi:
        return set(), set(), set()
    k = khoi.group(1)
    req = set(re.findall(r'^\s*\{?\s*"(\w+)":', k, re.M)) - {"ket_qua", "so_ban_ghi_trong_pham_vi", "tong"}
    kq = re.search(r'"ket_qua":\s*\[\s*\{(.*?)\}\s*\]', k, re.S)
    ket_qua = set(re.findall(r'"(\w+)"', kq.group(1))) if kq else set()
    resp = set(re.findall(r'"(ket_qua|so_ban_ghi_trong_pham_vi|tong)"', k))
    return req, resp, ket_qua


def truong_sample(d: dict) -> tuple[set, set, set]:
    req, resp, kq = set(), set(), set()
    for tv in d.get("truy_van_mau", []):
        yc = tv.get("yeu_cau", {})
        if "$tu" in yc or "$ma" in tv.get("tra_ve", {}):
            continue
        req |= {k for k in yc if not k.startswith("$")}
        tr = tv.get("tra_ve", {})
        resp |= {k for k in tr if not k.startswith("$")}
        for x in tr.get("ket_qua", []):
            kq |= {k for k in x if not k.startswith("$")}
    return req, resp, kq


def lech(a: set, b: set, ten_a: str, ten_b: str) -> list[str]:
    return [f"`{x}` có ở {ten_a}, thiếu ở {ten_b}" for x in sorted(a - b)] + [f"`{x}` có ở {ten_b}, thiếu ở {ten_a}" for x in sorted(b - a)]


if K.TU_KIEM:
    print("\ntu-kiem · bỏ một trường ở MỘT phía (bản chép tmp) ⇒ đỏ nêu trường + chiều\n")
    d = json.loads(SAMPLE.read_text(encoding="utf-8"))
    sp = SPEC.read_text(encoding="utf-8")
    K.kiem(lech(truong_sample(d)[2], truong_spec(sp)[2], "sample", "spec") == [], "sample thật ↔ spec thật: 0 lệch (nền)", " · ".join(lech(truong_sample(d)[2], truong_spec(sp)[2], "sample", "spec")))
    d2 = json.loads(json.dumps(d))
    for tv in d2["truy_van_mau"]:
        for x in tv.get("tra_ve", {}).get("ket_qua", []):
            x.pop("heading_path", None)
    l1 = lech(truong_sample(d2)[2], truong_spec(sp)[2], "sample", "spec")
    K.kiem(l1 == ["`heading_path` có ở spec, thiếu ở sample"], "sample bỏ heading_path ⇒ nêu đúng trường + chiều", str(l1))
    sp2 = sp.replace('"nguon_van_ban", "bm25"', '"bm25"', 1)
    l2 = lech(truong_sample(d)[2], truong_spec(sp2)[2], "sample", "spec")
    K.kiem(l2 == ["`nguon_van_ban` có ở sample, thiếu ở spec"], "spec (bản tmp) bỏ nguon_van_ban ⇒ chiều ngược cũng đỏ", str(l2))
    K.tu_kiem_xong(CONG, 3)

print("\n1 · sample v3 parse, version 3, giữ `chunks`\n")
d = json.loads(SAMPLE.read_text(encoding="utf-8"))
K.kiem(d.get("version") == 3 and "chunks" in d, "version == 3 và có khoá `chunks` (trang.mjs soDotHai)")

print("\n2 · hai chiều: sample ↔ spec §1a\n")
sp = SPEC.read_text(encoding="utf-8")
rq_s, rs_s, kq_s = truong_sample(d)
rq_p, rs_p, kq_p = truong_spec(sp)
K.kiem(len(kq_p) == 10, "spec §1a khai đúng 10 trường ket_qua[]", str(sorted(kq_p)))
l = lech(kq_s, kq_p, "sample", "spec")
K.kiem(not l, "ket_qua[]: hai tập bằng nhau, hai chiều", " · ".join(l))
l = lech(rq_s, rq_p, "sample", "spec")
K.kiem(not l, "request: cau_hoi · pham_vi · nguon · k — hai chiều", " · ".join(l))
l = lech(rs_s, rs_p, "sample", "spec")
K.kiem(not l, "response gốc: ket_qua · so_ban_ghi_trong_pham_vi · tong — hai chiều", " · ".join(l))
K.kiem(all("nguon" in tv["yeu_cau"] for tv in d["truy_van_mau"] if "$ma" not in tv.get("tra_ve", {})),
       "mọi request mẫu hợp lệ đều CÓ khoá `nguon` (FR-072 T8 — null khai tường minh)")
cs = [x for tv in d["truy_van_mau"] for x in tv.get("tra_ve", {}).get("ket_qua", [])]
K.kiem(all(set(x) == kq_p for x in cs), "mọi phần tử ket_qua[] trong sample mang ĐÚNG 10 khoá, kể cả chunk cue (null tường minh)")

print("\n3 · model_flow §2 trỏ về spec §1a (không liệt tên lần hai, không trôi)\n")
mf = MODEL_FLOW.read_text(encoding="utf-8")
K.kiem("spec §1a" in mf and "FR-072 §1.1" in mf, "model_flow §2 dẫn `spec §1a` + `FR-072 §1.1`")

K.chot("sample v3 ↔ spec §1a khớp hai chiều · model_flow trỏ đúng")
