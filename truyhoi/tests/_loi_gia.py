#!/usr/bin/env python3
r"""LÕI GIẢ — một `127.0.0.1:8895–8899` tối thiểu phục vụ đúng bốn cửa M13 đọc.

Vì sao không dùng LÕI thật (`:8787`): đó là server của chủ dự án đang chạy trên
kho THẬT; cổng M13 cần "sửa một bài rồi chưa re-index" (AC-1.2), "xoá một bài"
(mồ côi), "bản ghi không có hiện vật" (AC-2.5 edge 4) — gieo được trong một
dict, không gieo được trên kho thật (CLAUDE.md: không sửa file thật để thử cổng).

Kho là một dict trong RAM — SỬA DICT = SỬA KHO. Hình dạng phản hồi chép theo
LÕI thật (`web/api`): `kho-delta` năm trường (T08-35) · `articles/<loai>/<slug>`
{frontmatter, body, etag} · `xuat/<loai>/<slug>?dang=goc` = file .md kèm
frontmatter · `articles/media/<sha>` = byte + mime.
"""

from __future__ import annotations

import hashlib
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

CONG_GIA = range(8895, 8900)   # KHÔNG 8787 (LÕI thật) · KHÔNG 8791 (M13 thật)


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def frontmatter_yaml(fm: dict) -> str:
    """YAML phẳng đủ cho fixture (chuỗi, số, list chuỗi). Không cần pyyaml ở đây."""
    ra = []
    for k, v in fm.items():
        if isinstance(v, list):
            ra.append(f"{k}: [{', '.join(json.dumps(x, ensure_ascii=False) for x in v)}]")
        elif isinstance(v, bool):
            ra.append(f"{k}: {'true' if v else 'false'}")
        elif v is None:
            ra.append(f"{k}: null")
        elif isinstance(v, (int, float)):
            ra.append(f"{k}: {v}")
        else:
            ra.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
    return "\n".join(ra)


def ghep_goc(fm: dict, body: str) -> str:
    return "---\n" + frontmatter_yaml(fm) + "\n---\n" + body


class LoiGia:
    """`kho`: {slug: {loai, updated_at, frontmatter, body, media: {sha: (mime, bytes)}}}"""

    def __init__(self, kho: dict):
        self.kho = kho
        self.nhan: list[dict] = []     # mọi request đã nhận — để đo M13 gọi gì
        self._s = None
        self.cong = None

    # ── phản hồi từng cửa ──────────────────────────────────────────────────
    def kho_delta(self, qs):
        items = [{
            "slug": slug, "loai": d["loai"], "updated_at": d.get("updated_at"),
            "sha_than": sha256(d["body"].encode("utf-8")), "space": d.get("space", "mac-dinh"),
        } for slug, d in sorted(self.kho.items())]
        tong = len(items)
        offset = int((qs.get("offset") or ["0"])[0] or 0)
        lim = (qs.get("limit") or [""])[0]
        if lim == "":
            return 200, {"items": items, "tong": tong, "offset": 0, "limit": None}
        limit = min(int(lim), 500)
        return 200, {"items": items[offset:offset + limit], "tong": tong, "offset": offset, "limit": limit}

    def bai(self, loai, slug):
        d = self.kho.get(slug)
        if not d or d["loai"] != loai:
            return 404, {"loi": "Không có bài này."}
        fm = dict(d["frontmatter"])
        fm.setdefault("slug", slug)
        fm.setdefault("source_type", loai)
        return 200, {"frontmatter": fm, "body": d["body"],
                     "etag": sha256((d["body"]).encode("utf-8"))[:16], "review_status": fm.get("review_status", "approved")}

    def goc(self, loai, slug):
        d = self.kho.get(slug)
        if not d or d["loai"] != loai:
            return 404, None, None
        fm = dict(d["frontmatter"])
        fm.setdefault("slug", slug)
        fm.setdefault("source_type", loai)
        return 200, ghep_goc(fm, d["body"]).encode("utf-8"), "text/markdown; charset=utf-8"

    def media(self, sha):
        for d in self.kho.values():
            m = d.get("media") or {}
            if sha in m:
                mime, b = m[sha]
                return 200, b, mime
        return 404, None, None

    # ── server ─────────────────────────────────────────────────────────────
    def bat(self):
        loi_gia = self

        class Cua(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _tra_json(self, ma, than):
                b = json.dumps(than, ensure_ascii=False).encode("utf-8")
                self.send_response(ma)
                self.send_header("content-type", "application/json; charset=utf-8")
                self.send_header("content-length", str(len(b)))
                self.end_headers()
                self.wfile.write(b)

            def _tra_byte(self, ma, b, mime):
                if b is None:
                    return self._tra_json(ma, {"loi": "không có"})
                self.send_response(ma)
                self.send_header("content-type", mime)
                self.send_header("content-length", str(len(b)))
                self.end_headers()
                self.wfile.write(b)

            def do_GET(self):
                u = urlparse(self.path)
                qs = parse_qs(u.query)
                phan = [x for x in u.path.split("/") if x]
                loi_gia.nhan.append({"method": "GET", "duong": self.path, "headers": dict(self.headers)})
                if phan[:2] == ["api", "kho-delta"] and len(phan) == 2:
                    return self._tra_json(*loi_gia.kho_delta(qs))
                if phan[:3] == ["api", "articles", "media"] and len(phan) == 4:
                    return self._tra_byte(*loi_gia.media(phan[3]))
                if phan[:2] == ["api", "articles"] and len(phan) == 4:
                    return self._tra_json(*loi_gia.bai(phan[2], phan[3]))
                if phan[:2] == ["api", "xuat"] and len(phan) == 4 and (qs.get("dang") or [""])[0] == "goc":
                    return self._tra_byte(*loi_gia.goc(phan[2], phan[3]))
                if phan[:2] == ["api", "index"]:
                    return self._tra_json(200, {"total": len(loi_gia.kho), "articles": [
                        {"slug": f"{d['loai']}/{s}", "type": d["loai"]} for s, d in sorted(loi_gia.kho.items())]})
                return self._tra_json(404, {"loi": "LÕI giả: không có đường này"})

        for cong in CONG_GIA:
            try:
                self._s = ThreadingHTTPServer(("127.0.0.1", cong), Cua)
                break
            except OSError:
                continue
        if self._s is None:
            raise RuntimeError("không cổng nào trống trong 8895–8899")
        self.cong = self._s.server_address[1]
        threading.Thread(target=self._s.serve_forever, daemon=True).start()
        return self

    def url(self) -> str:
        return f"http://127.0.0.1:{self.cong}"

    def dung(self):
        if self._s:
            self._s.shutdown()
            self._s.server_close()
            self._s = None

    def __enter__(self):
        return self.bat()

    def __exit__(self, *a):
        self.dung()


# ── kho MẪU cho cổng — bốn bản ghi, ba loại nguồn văn bản ─────────────────────
VTT_MAU = (
    "WEBVTT\n\n"
    "00:00:01.000 --> 00:00:04.000\nHôm nay ta nói về đường ống dữ liệu.\n\n"
    "00:00:04.500 --> 00:00:09.000\nMột pipeline tốt phải tái tạo được từ đầu.\n\n"
    "00:03:15.000 --> 00:03:20.000\nLời tiên tri nằm ở cấu trúc xã hội, không ở nguồn lực.\n"
)
SHA_VTT = sha256(VTT_MAU.encode("utf-8"))
MD_TAI_LEN = "# Ghi chú hội thảo\n\n## Ba câu hỏi còn lại\n\nRetrieval cần địa chỉ bấm được.\n\n## Kết\n\nHết.\n"
SHA_MD = sha256(MD_TAI_LEN.encode("utf-8"))


def kho_mau() -> dict:
    """Bốn bản ghi: bài Việt có heading (cả `đ`), bài Anh, video có transcript, tài liệu có .md tải lên."""
    return {
        "huong-dan-cai-dat": {
            "loai": "docs", "updated_at": "2026-09-01T00:00:00Z",
            "frontmatter": {"title": "Hướng dẫn cài đặt", "category": ["ai-agent"], "concepts": ["rag"],
                            "review_status": "approved", "url": "https://vd.com/huong-dan"},
            "body": ("## Hướng dẫn cài đặt\n\nBước một: tải bộ khung về máy. Phần cài đặt cần quyền ghi.\n\n"
                     "### Đường ống dữ liệu\n\nĐường ống dữ liệu chạy hai chiều, hướng đi và hướng về.\n\n"
                     "## Hướng dẫn cài đặt\n\nLặp tiêu đề để thử dedup anchor.\n"),
            "media": {},
        },
        "pipeline-basics": {
            "loai": "article", "updated_at": "2026-09-02T00:00:00Z",
            "frontmatter": {"title": "Pipeline basics", "category": ["data"], "concepts": ["pipeline"],
                            "review_status": "approved", "url": "https://vd.com/pipeline"},
            "body": "## Why pipelines\n\nA pipeline must be reproducible from scratch.\n\n## Retry\n\nRetry with backoff, never infinite.\n",
            "media": {},
        },
        "thien-duong-chuot": {
            "loai": "video", "updated_at": "2026-09-03T00:00:00Z",
            "frontmatter": {"title": "Thiên đường chuột", "category": ["ai-x-risk"], "concepts": ["ai-x-risk"],
                            "review_status": "approved", "url": "https://www.youtube.com/watch?v=abc",
                            "media": [{"sha256": SHA_VTT, "mime": "text/vtt", "la_dan_xuat": True, "kieu_moc": "transcript"}]},
            "body": "Ghi chú ngắn về video.",
            "media": {SHA_VTT: ("text/vtt", VTT_MAU.encode("utf-8"))},
        },
        "ghi-chu-hoi-thao-rag": {
            "loai": "tai-lieu", "updated_at": "2026-09-04T00:00:00Z",
            "frontmatter": {"title": "Ghi chú hội thảo RAG", "category": ["rag"], "concepts": ["rag"],
                            "review_status": "approved", "url": "kho://tai-len",
                            "media": [{"sha256": SHA_MD, "mime": "text/markdown", "la_dan_xuat": False}]},
            "body": "Tài liệu tải lên, xem hiện vật.",
            "media": {SHA_MD: ("text/markdown", MD_TAI_LEN.encode("utf-8"))},
        },
    }


def kho_mau_zh() -> dict:
    """Thêm hai bản ghi tiếng Trung (phồn + giản) — CHỈ cho bộ 10 truy vấn tokenizer (AC-3.2).
    KHÔNG dùng để xanh AC-6.3: vế đó phải đếm trên kho THẬT (spec §6)."""
    k = kho_mau()
    k["zi-liao-guan-xian"] = {
        "loai": "docs", "updated_at": "2026-09-05T00:00:00Z",
        "frontmatter": {"title": "資料管線", "category": ["data"], "concepts": ["pipeline"], "review_status": "approved",
                        "url": "https://vd.com/zh1"},
        "body": "## 資料管線設計\n\n資料管線必須可以重建。記憶體最佳化很重要。\n\n## 結合\n\nKết hợp 資料管線 với pipeline.\n",
        "media": {},
    }
    k["shu-ju-jian-ti"] = {
        "loai": "docs", "updated_at": "2026-09-06T00:00:00Z",
        "frontmatter": {"title": "数据管线", "category": ["data"], "concepts": ["pipeline"], "review_status": "approved",
                        "url": "https://vd.com/zh2"},
        "body": "## 数据管线\n\n数据管线需要可重建。\n",
        "media": {},
    }
    return k
