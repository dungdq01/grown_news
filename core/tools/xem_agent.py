#!/usr/bin/env python3
"""XEM WORKFLOW/SUBAGENT ĐANG LÀM GÌ — chúng chạy ẩn, nhưng ghi hết ra đĩa.

Mỗi agent của một workflow để lại `agent-<id>.jsonl` trong thư mục transcript của
lần chạy; workflow để lại `journal.jsonl` (một dòng `result` cho mỗi agent xong).
Lệnh này đọc chúng và in ra dạng người đọc được.

    python core/tools/xem_agent.py                 # lần chạy MỚI NHẤT, tóm tắt
    python core/tools/xem_agent.py --ds            # liệt kê mọi lần chạy
    python core/tools/xem_agent.py --chay wf_abc   # chỉ định lần chạy
    python core/tools/xem_agent.py --agent a120cb  # đổ nguyên một agent
    python core/tools/xem_agent.py --theo          # BÁM ĐUÔI, in cái mới

VÌ SAO CẦN: "chạy nền" và "không quan sát được" là hai chuyện khác nhau, nhưng
mặc định chúng trùng nhau — và một tác nhân không quan sát được thì mọi báo cáo
của nó là LỜI KHAI. Đây là công cụ để đọc bản ghi gốc thay vì tin bản tóm tắt.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Thư mục phiên do Claude Code cấp; suy từ biến môi trường nếu có, không thì
# dò theo tên dự án. KHÔNG gõ cứng một đường dẫn tuyệt đối vào đây.
def goc_phien() -> Path:
    env = os.environ.get("CLAUDE_PROJECT_DIR") or os.environ.get("CLAUDE_SESSION_DIR")
    if env and Path(env).exists():
        p = Path(env)
        if p.name == "workflows":
            return p
        for c in (p / "subagents" / "workflows", p):
            if c.exists():
                return c
    du = Path.home() / ".claude" / "projects"
    ung = sorted(du.glob("*/*/subagents/workflows"), key=lambda d: d.stat().st_mtime)
    if not ung:
        sys.exit(f"khong tim thay thu muc workflow nao duoi {du}")
    return ung[-1]


def cac_lan_chay(goc: Path):
    return sorted((d for d in goc.iterdir() if d.is_dir()),
                  key=lambda d: d.stat().st_mtime)


def chu(o) -> str:
    """Rút phần chữ người đọc được từ một dòng transcript."""
    m = o.get("message") or {}
    c = m.get("content")
    if isinstance(c, str):
        return c
    ra = []
    for k in c or []:
        if not isinstance(k, dict):
            continue
        t = k.get("type")
        if t == "text":
            ra.append(k.get("text", ""))
        elif t == "thinking":
            ra.append("[nghĩ] " + (k.get("thinking") or "")[:400])
        elif t == "tool_use":
            ten = k.get("name", "?")
            vao = json.dumps(k.get("input", {}), ensure_ascii=False)
            ra.append(f"→ {ten}({vao[:220]})")
        elif t == "tool_result":
            noi = k.get("content")
            if isinstance(noi, list):
                noi = " ".join(str(x.get("text", "")) for x in noi
                               if isinstance(x, dict))
            ra.append("← " + str(noi)[:300])
    return "\n".join(x for x in ra if x)


def nhan(d: Path, aid: str) -> str:
    """Nhãn của agent = câu đầu prompt của nó."""
    try:
        with open(d / f"agent-{aid}.jsonl", encoding="utf-8") as f:
            for l in f:
                o = json.loads(l)
                if o.get("type") == "user":
                    return (chu(o).strip().splitlines() or [""])[0][:70]
    except Exception:
        pass
    return "?"


def tom_tat(d: Path):
    files = sorted(d.glob("agent-*.jsonl"), key=lambda f: f.stat().st_mtime)
    xong = set()
    jr = d / "journal.jsonl"
    if jr.exists():
        for l in jr.read_text(encoding="utf-8").splitlines():
            try:
                o = json.loads(l)
            except Exception:
                continue
            if o.get("type") == "result" and o.get("agentId"):
                xong.add(o["agentId"])
    print(f"\n{d.name} — {len(files)} agent, {len(xong)} đã trả kết quả\n")
    now = time.time()
    for f in files:
        aid = f.stem[len("agent-"):]
        tuoi = now - f.stat().st_mtime
        trang = "xong " if aid in xong else ("CHẠY " if tuoi < 90 else "treo?")
        print(f"  {trang} {aid[:12]}  {f.stat().st_size // 1024:4d}KB  "
              f"{int(tuoi):4d}s trước  {nhan(d, aid)}")
    print()


def do_agent(d: Path, tien: str):
    hop = [f for f in d.glob("agent-*.jsonl") if tien in f.stem]
    if not hop:
        sys.exit(f"khong co agent nao khop {tien!r}")
    for f in hop:
        print(f"\n{'=' * 70}\n{f.name}\n{'=' * 70}")
        for l in f.read_text(encoding="utf-8").splitlines():
            try:
                o = json.loads(l)
            except Exception:
                continue
            if o.get("type") not in ("user", "assistant"):
                continue
            t = chu(o).strip()
            if t:
                print(f"\n[{o.get('type')}] {t}")


def theo_duoi(d: Path):
    """Bám đuôi: in phần MỚI của mọi agent, 2 giây một nhịp."""
    vt = {}
    print(f"bám đuôi {d.name} — Ctrl+C để dừng\n")
    while True:
        for f in sorted(d.glob("agent-*.jsonl")):
            cu = vt.get(f, 0)
            kt = f.stat().st_size
            if kt <= cu:
                continue
            with open(f, encoding="utf-8", errors="replace") as fh:
                fh.seek(cu)
                moi = fh.read()
            vt[f] = kt
            aid = f.stem[len("agent-"):][:12]
            for l in moi.splitlines():
                try:
                    o = json.loads(l)
                except Exception:
                    continue
                if o.get("type") not in ("user", "assistant"):
                    continue
                t = chu(o).strip()
                if t:
                    print(f"[{aid}] {t[:400]}\n")
        time.sleep(2)


ap = argparse.ArgumentParser()
ap.add_argument("--ds", action="store_true", help="liệt kê mọi lần chạy")
ap.add_argument("--chay", help="tên lần chạy (wf_...)")
ap.add_argument("--agent", help="tiền tố id agent — đổ nguyên transcript")
ap.add_argument("--theo", action="store_true", help="bám đuôi thời gian thực")
a = ap.parse_args()

goc = goc_phien()
lan = cac_lan_chay(goc)
if not lan:
    sys.exit(f"chua co lan chay nao trong {goc}")

if a.ds:
    for d in lan:
        n = len(list(d.glob("agent-*.jsonl")))
        print(f"  {d.name}  {n:3d} agent  "
              f"{time.strftime('%m-%d %H:%M', time.localtime(d.stat().st_mtime))}")
    sys.exit()

d = next((x for x in lan if a.chay and a.chay in x.name), lan[-1])
if a.agent:
    do_agent(d, a.agent)
elif a.theo:
    theo_duoi(d)
else:
    tom_tat(d)