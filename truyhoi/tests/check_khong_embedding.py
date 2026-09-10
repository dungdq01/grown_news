#!/usr/bin/env python3
r"""AC-7.2 · M13-R5 · T13-4 AC5 — `truyhoi/` KHÔNG gọi embedding API, KHÔNG có lời gọi mạng
nào ngoài `127.0.0.1` (LÕI). M13 là THỢ nên ĐƯỢC egress — nhưng FR-043 chưa khai bậc nào
cho truy hồi, nên một lời gọi ra là một đường dữ liệu rời máy không ai đếm.

Soi mã (đã lột comment/docstring) trong `truyhoi/src`:
  · import/gọi: `httpx` · `requests` · `aiohttp` · `openai` · `anthropic` · `google.generativeai` ·
    `sentence_transformers` · `sqlite_vec` · `embedding` ⇒ đỏ
  · mọi URL literal `http(s)://` phải là `127.0.0.1` hoặc `localhost`
  · `urllib.request.urlopen(` chỉ đi kèm gốc đọc từ `url_loi()` (env/dich-vu.json) — không literal host ngoài

ĐỎ_KHI  ≥1 dòng vi phạm
XANH_KHI 0 dòng; mọi phép tính chạy trên SQLite local
--tu-kiem: gieo `import httpx` + `httpx.post("https://api.openai.com/v1/embeddings")` ⇒ soi ra.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _nap  # noqa: E402

CONG = "check_khong_embedding.py"
RX_GOI = re.compile(r"^\s*(?:from|import)\s+(httpx|requests|aiohttp|openai|anthropic|google\.generativeai|sentence_transformers|sqlite_vec|voyageai|cohere)\b")
RX_TU = re.compile(r"\b(embedding|embeddings|embed\(|sqlite_vec|vec0|bge-m3|text-embedding)\b", re.I)
RX_URL = re.compile(r"https?://([^/\s\"']+)")


def soi(nguon: dict[str, str]) -> list[str]:
    ra = []
    for f, t in nguon.items():
        for i, l in enumerate(t.splitlines(), 1):
            if RX_GOI.search(l):
                ra.append(f"{f}:{i} — import thư viện gọi mạng/embedding")
            if RX_TU.search(l):
                ra.append(f"{f}:{i} — nhắc embedding/vector")
            for host in RX_URL.findall(l):
                if not host.startswith(("127.0.0.1", "localhost")):
                    ra.append(f"{f}:{i} — URL ngoài loopback `{host}`")
    return ra


if K.TU_KIEM:
    print("\ntu-kiem · soi mã phải ĐỎ ĐƯỢC\n")
    xau = {"rank.py": 'import httpx\nr = httpx.post("https://api.openai.com/v1/embeddings", json={})\n'}
    kq = soi(xau)
    K.kiem(len(kq) >= 2 and any("import" in x for x in kq) and any("api.openai.com" in x for x in kq), "httpx + URL ngoài + embeddings ⇒ ≥2 dòng nêu file:dòng", " · ".join(kq))
    K.kiem(soi({"indexer.py": 'import urllib.request\nGOC = "http://127.0.0.1:8787"\n'}) == [], "urllib tới 127.0.0.1 ⇒ sạch")
    K.kiem(soi({"a.py": K.lot_ma("# không dùng embedding ở đây\nx = 1\n")}) == [], "comment nhắc embedding ⇒ không tính")
    K.tu_kiem_xong(CONG, 3)

print("\n1 · soi mã truyhoi/src\n")
nguon = K.nguon_src()
K.kiem(bool(nguon), "truyhoi/src có mã", "T13-2/T13-4 chưa dựng")
vp = soi(nguon)
K.kiem(not vp, "0 import gọi mạng/embedding · 0 URL ngoài loopback · 0 nhắc vector", " · ".join(vp[:5]))

try:
    _nap.nap("indexer", "rank", "api")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-4")

print("\n2 · pyproject: 0 phụ thuộc mạng/vector\n")
pp = K.R / "truyhoi" / "pyproject.toml"
K.kiem(pp.exists(), "truyhoi/pyproject.toml tồn tại", "T13-2")
if pp.exists():
    t = pp.read_text(encoding="utf-8")
    xau = [d for d in ("httpx", "requests", "openai", "anthropic", "sqlite-vec", "sqlite_vec", "sentence-transformers", "faiss") if re.search(rf"[\"']{re.escape(d)}", t)]
    K.kiem(not xau, "dependencies không có thư viện mạng/vector", str(xau))

K.chot("0 lời gọi mạng ngoài loopback · 0 embedding · phụ thuộc sạch")
