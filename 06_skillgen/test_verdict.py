#!/usr/bin/env python3
"""AC của T06-2 — test viết từ SPEC, không đọc code rồi chép đáp án.

  -k cong_cung     AC1 · cổng cứng thắng mọi cổng khác
  -k alias         AC2 · khớp qua alias, không chỉ tên chính
  -k chi_approved  AC3 · chỉ đọc bản approved

Chạy không tham số: cả ba.
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from verdict import Manifest, cham, quet, sinh_nhap_khong  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
MF = Manifest()
loi = []


def ok(dieu_kien, ten, chi_tiet=""):
    print(f"  {'ok  ' if dieu_kien else 'FAIL'} {ten}" + (f"  {chi_tiet}" if not dieu_kien else ""))
    if not dieu_kien:
        loi.append(f"{ten} {chi_tiet}")


def ban(**kw):
    return {"id": "t", "independent_sources": 2, "tags": [], "review_status": "approved", **kw}


# ═══ AC1 · cổng cứng ═══════════════════════════════════════════════════
def cong_cung():
    print("\nAC1 · CỔNG CỨNG thắng mọi cổng khác\n")

    # claimed + 1 nguồn ⇒ OUT_OF_SCOPE, dù capability CHƯA phủ (đáng lẽ NEW)
    v, ly_do, _ = cham({"capability": "thu-hoan-toan-moi", "credibility": "claimed"},
                       ban(independent_sources=1), MF)
    ok(v == "OUT_OF_SCOPE", "claimed + 1 nguồn ⇒ OUT_OF_SCOPE dù capability chưa phủ",
       f"được {v}")

    # conflicted + 1 nguồn, capability ĐÃ phủ nông (đáng lẽ DEEPEN)
    v, _, _ = cham({"capability": "context-management", "credibility": "conflicted"},
                   ban(independent_sources=1), MF)
    ok(v == "OUT_OF_SCOPE", "conflicted + 1 nguồn ⇒ OUT_OF_SCOPE dù capability phủ nông",
       f"được {v}")

    # cùng capability, 2 nguồn ⇒ cổng cứng KHÔNG fire
    v, _, _ = cham({"capability": "context-management", "credibility": "claimed"},
                   ban(independent_sources=2), MF)
    ok(v == "DEEPEN", "claimed + 2 nguồn ⇒ cổng cứng KHÔNG fire, xuống cổng 4",
       f"được {v}")

    # verified + 1 nguồn ⇒ không fire (chỉ claimed/conflicted mới fire)
    v, _, _ = cham({"capability": "context-management", "credibility": "verified"},
                   ban(independent_sources=1), MF)
    ok(v == "DEEPEN", "verified + 1 nguồn ⇒ cổng cứng KHÔNG fire", f"được {v}")

    # THỨ TỰ: cổng cứng chạy TRƯỚC cổng domain. Ứng viên vừa ngoài domain vừa
    # dính cổng cứng phải ra lý do của CỔNG CỨNG, không phải lý do domain.
    _, ly_do, _ = cham({"capability": "game development engine", "credibility": "claimed"},
                       ban(independent_sources=1), MF)
    ok("nguồn độc lập" in (ly_do or ""),
       "cổng cứng chạy TRƯỚC cổng domain (M06-R1)", f"lý do: {ly_do}")


# ═══ AC2 · alias ═══════════════════════════════════════════════════════
def alias():
    print("\nAC2 · khớp qua ALIAS, không chỉ tên chính\n")

    # Đúng lỗi s6: khớp tên chính thì bỏ sót, ra NEW thay vì DEEPEN
    v, _, target = cham({"capability": "context-truncation-strategy",
                         "credibility": "verified"}, ban(), MF)
    ok(v == "DEEPEN" and target == "agent-builder",
       "context-truncation-strategy → context-management (agent-builder)",
       f"được {v}/{target}")

    # alias của capability depth 4 ⇒ vẫn OVERLAP
    v, _, _ = cham({"capability": "skill-packaging", "credibility": "verified"}, ban(), MF)
    ok(v == "OVERLAP", "skill-packaging → skill-authoring depth 4 ⇒ OVERLAP", f"được {v}")

    # không phân biệt hoa thường, bỏ gạch nối
    for bien_the in ("Context_Management", "CONTEXTMANAGEMENT", "context management"):
        v, _, _ = cham({"capability": bien_the, "credibility": "verified"}, ban(), MF)
        ok(v == "DEEPEN", f"biến thể {bien_the!r} vẫn khớp", f"được {v}")

    # capability thật sự không có ⇒ NEW
    v, _, _ = cham({"capability": "thu-chua-ai-lam-bao-gio", "credibility": "verified"},
                   ban(), MF)
    ok(v == "NEW", "capability không có trong manifest ⇒ NEW", f"được {v}")


# ═══ AC3 · chỉ approved ════════════════════════════════════════════════
def chi_approved():
    print("\nAC3 · chỉ đọc bản approved (M06-R3)\n")

    A = [
        {"id": "a", "review_status": "approved", "independent_sources": 2,
         "skill_candidates": [{"capability": "x-moi", "credibility": "verified",
                               "priority": 30}]},
        {"id": "d", "review_status": "draft", "independent_sources": 2,
         "skill_candidates": [{"capability": "y-moi", "credibility": "verified",
                               "priority": 30}]},
        {"id": "r", "review_status": "rejected", "independent_sources": 2,
         "skill_candidates": [{"capability": "z-moi", "credibility": "verified",
                               "priority": 30}]},
    ]
    ids = {k["id"] for k in quet(A, MF)}
    ok(ids == {"a"}, "draft và rejected không sinh ứng viên nào", f"được {ids}")

    # ngưỡng priority
    ok(not sinh_nhap_khong({"priority": 24.9}, "NEW"), "priority 24.9 ⇒ KHÔNG sinh nháp")
    ok(sinh_nhap_khong({"priority": 25}, "NEW"), "priority 25 ⇒ sinh nháp")
    ok(not sinh_nhap_khong({"priority": 99}, "OVERLAP"),
       "OVERLAP dù priority cao ⇒ KHÔNG sinh nháp")
    ok(not sinh_nhap_khong({"priority": 99}, "OUT_OF_SCOPE"),
       "OUT_OF_SCOPE dù priority cao ⇒ KHÔNG sinh nháp")


# ═══ khớp sample thật ══════════════════════════════════════════════════
def sample():
    print("\nĐối chiếu sample v3 — verdict tính ra phải khớp verdict khai\n")
    p = max((ROOT / "05_uiux/contracts").glob("analyses.sample.v*.json"),
            key=lambda x: [int(i) for i in x.stem.split(".v")[-1].split(".")])
    kq = quet(json.loads(p.read_text(encoding="utf-8"))["analyses"], MF)
    lech = [k for k in kq if not k["khop"]]
    ok(not lech, f"{len(kq)}/{len(kq)} ứng viên khớp",
       f"lệch: {[(k['id'], k['verdict_khai'], k['verdict']) for k in lech]}")
    phu = {k["verdict"] for k in kq}
    ok(phu >= {"NEW", "DEEPEN", "OVERLAP", "OUT_OF_SCOPE"},
       "sample phủ đủ 4 verdict", f"chỉ có {sorted(phu)}")


CHON = {"cong_cung": cong_cung, "alias": alias, "chi_approved": chi_approved,
        "sample": sample}
k = sys.argv[sys.argv.index("-k") + 1] if "-k" in sys.argv else None
for ten, fn in CHON.items():
    if not k or k == ten:
        fn()
print()
sys.exit(f"{len(loi)} lỗi" if loi else 0)
