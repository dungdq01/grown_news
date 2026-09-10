#!/usr/bin/env python3
r"""Khung dùng chung cho 20 cổng `truyhoi/tests/check_*.py` (T13-1).

Ba việc, và chỉ ba:
  1 · `kiem()` / `chot()` — in `ok`/`FAIL` một kiểu, exit 1 khi có FAIL.
  2 · `--tu-kiem` — mỗi cổng PHẢI chứng minh mình ĐỎ ĐƯỢC trên fixture cố-tình-hỏng
      ở thư mục tạm, TRƯỚC khi đụng mã thật (khuôn `check_rule_surfaces.py --tu-kiem`).
      Lần đầu làm phép này ở `nhip-sinh`, 2/5 ca xanh oan — nên nó không phải tuỳ chọn.
  3 · hạ tầng chạy thật: KB_DIR tạm cho `index.sqlite`, LÕI giả (`_loi_gia.py`),
      service M13 thật bind cổng 0, và `goi()` HTTP tối thiểu (stdlib, 0 dep).

KHÔNG import mã của `chungcat/` hay `core/` — hai bảng khai (`dia-chi.json`,
`dai-han.json`) đọc như FILE (model_flow §2).
"""

from __future__ import annotations

import ast
import contextlib
import json
import os
import re
import shutil
import sys
import tempfile
import threading
import urllib.error
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

R = Path(__file__).resolve().parents[2]
SRC = R / "truyhoi" / "src"
TESTS = R / "truyhoi" / "tests"
ASSETS = R / "core" / "assets"
TU_KIEM = "--tu-kiem" in sys.argv

loi: list[str] = []


def kiem(dieu, chu, vi_sao=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + (f"   {vi_sao}" if not dieu and vi_sao else ""))
    if not dieu:
        loi.append(chu)


def chot(cau_xanh):
    print("\n" + "-" * 62)
    if loi:
        for x in loi:
            print("  -", x)
        sys.exit(f"ĐỎ — {len(loi)} vế")
    print("XANH · " + cau_xanh)


def tu_kiem_xong(ten_cong, so_ca):
    """Kết phần --tu-kiem: mọi ca phải ĐỎ được. Exit 0 nếu đủ, không chạy phần chính."""
    print("\n" + "-" * 62)
    if loi:
        for x in loi:
            print("  -", x)
        sys.exit(f"tu-kiem SAI — {len(loi)}/{so_ca} ca KHÔNG đỏ được; phần chính của {ten_cong} không đáng tin")
    print(f"tu-kiem · {so_ca}/{so_ca} ca cố-tình-hỏng đều ĐỎ — {ten_cong} đỏ được")
    sys.exit(0)


@contextlib.contextmanager
def tam(prefix="gn_m13_"):
    d = Path(tempfile.mkdtemp(prefix=prefix))
    try:
        yield d
    finally:
        shutil.rmtree(d, ignore_errors=True)


@contextlib.contextmanager
def env_tam(**kv):
    """Đặt biến môi trường trong một khối, trả lại nguyên trạng sau."""
    cu = {k: os.environ.get(k) for k in kv}
    for k, v in kv.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = str(v)
    try:
        yield
    finally:
        for k, v in cu.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


# ── mã nguồn M13 để soi bằng AST/grep — bỏ comment và docstring ─────────────
def nguon_src(thu_muc: Path | None = None) -> dict[str, str]:
    """{đường tương đối: mã đã lột docstring/comment} cho mọi .py trong truyhoi/src."""
    goc = thu_muc or SRC
    ra = {}
    if not goc.exists():
        return ra
    for p in sorted(goc.rglob("*.py")):
        txt = p.read_text(encoding="utf-8", errors="replace")
        ra[str(p.relative_to(goc)).replace("\\", "/")] = lot_ma(txt)
    return ra


def lot_ma(txt: str) -> str:
    """Bỏ docstring + comment, giữ mã. Soi CODE, không soi lời kể."""
    try:
        cay = ast.parse(txt)
    except SyntaxError:
        return txt
    dong = txt.splitlines()
    bo = set()
    for node in ast.walk(cay):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Module)):
            d = ast.get_docstring(node, clean=False)
            if d and node.body and isinstance(node.body[0], ast.Expr):
                n0 = node.body[0]
                for i in range(n0.lineno - 1, n0.end_lineno):
                    bo.add(i)
    ra = []
    for i, l in enumerate(dong):
        if i in bo:
            continue
        ra.append(re.sub(r"(?<!['\"])#.*$", "", l))
    return "\n".join(ra)


def cay_ast(thu_muc: Path | None = None) -> dict[str, ast.Module]:
    goc = thu_muc or SRC
    ra = {}
    if goc.exists():
        for p in sorted(goc.rglob("*.py")):
            try:
                ra[str(p.relative_to(goc)).replace("\\", "/")] = ast.parse(
                    p.read_text(encoding="utf-8", errors="replace"))
            except SyntaxError:
                pass
    return ra


# ── HTTP tối thiểu (stdlib) ──────────────────────────────────────────────────
def goi(cong: int, method: str, duong: str, than=None, headers=None, timeout=10):
    """Trả (mã, json|None, header dict). Không ném khi 4xx/5xx."""
    du = None if than is None else json.dumps(than, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(f"http://127.0.0.1:{cong}{duong}", data=du, method=method)
    req.add_header("content-type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read()
            hd = dict(r.headers.items())
            ma = r.status
    except urllib.error.HTTPError as e:
        b = e.read()
        hd = dict(e.headers.items()) if e.headers else {}
        ma = e.code
    try:
        j = json.loads(b.decode("utf-8")) if b else None
    except json.JSONDecodeError:
        j = None
    return ma, j, hd


# ── service M13 thật, cổng 0, trong tiến trình test ─────────────────────────
def bat_service(api_mod, **env):
    """`api.chay(cong=0)` trong thread daemon. Trả (server, cổng). `env` đặt TRƯỚC khi chạy."""
    for k, v in env.items():
        os.environ[k] = str(v)
    s = api_mod.chay(cong=0)
    t = threading.Thread(target=s.serve_forever, daemon=True)
    t.start()
    return s, s.server_address[1]


def dung_service(s):
    try:
        s.shutdown()
        s.server_close()
    except Exception:
        pass


# ── bảng khai đọc như FILE ───────────────────────────────────────────────────
def doc_json(p: Path):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def dang_dia_chi() -> list[tuple[str, re.Pattern]]:
    """[(tên dạng, regex)] từ core/assets/dia-chi.json — cổng đọc bảng, không gõ dạng."""
    return [(d["ten"], re.compile(d["mau"])) for d in doc_json(ASSETS / "dia-chi.json")["dang"]]


def khop_dang(dia_chi: str) -> str | None:
    for ten, rx in dang_dia_chi():
        if rx.match(dia_chi):
            return ten
    return None


def dai_han() -> list[tuple[int, int]]:
    return [(int(d["tu"]), int(d["den"])) for d in doc_json(ASSETS / "dai-han.json")["dai"]]


def la_han(ch: str, dai=None) -> bool:
    o = ord(ch)
    return any(a <= o <= b for a, b in (dai or dai_han()))


def co_han(s: str, dai=None) -> bool:
    d = dai or dai_han()
    return any(la_han(c, d) for c in s)
