#!/usr/bin/env python3
"""Chấm verdict cho skill_candidates — 5 cổng, đúng thứ tự.

THỨ TỰ LÀ LUẬT, không phải chi tiết cài đặt (M06-R1).

Lượt kiểm bằng tay ở s6 chạy cổng domain TRƯỚC cổng cứng và cho ra NEW cho hai
ứng viên mà schema đã cấm. Sai thứ tự không tạo lỗi kiểu — nó tạo kết quả
*trông hợp lệ*, đi qua mọi cổng còn lại.

  1 CỔNG CỨNG  credibility claimed|conflicted VÀ independent_sources == 1
  2 ngoài domain
  3 khớp capability (kể cả alias) và depth >= 4      ⇒ OVERLAP
  4 khớp capability và depth <= 3                    ⇒ DEEPEN
  5 không khớp, thuộc domain                         ⇒ NEW
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "skill-manifest.json"
NGUONG_SINH_NHAP = 25


def chuan(s):
    """So khớp không phân biệt hoa thường, bỏ gạch nối — theo $matching.match_by."""
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


class Manifest:
    def __init__(self, path=MANIFEST):
        d = json.loads(Path(path).read_text(encoding="utf-8"))
        self.domain = set(d["domain"])
        self.out_of_scope = [chuan(x) for x in d["$out_of_scope"]["examples"]]
        # tên chuẩn hoá -> (skill_id, capability, depth). Alias trỏ về CÙNG capability.
        self.tra = {}
        for s in d["skills"]:
            for c in s["capabilities"]:
                muc = (s["id"], c["name"], c["depth"])
                for ten in [c["name"], *c.get("aliases", [])]:
                    self.tra[chuan(ten)] = muc

    def tim(self, capability):
        """Khớp theo tên HOẶC alias. Lượt kiểm đầu ở s6 chỉ khớp tên chính nên
        bỏ sót context-truncation-strategy ~ context-management."""
        return self.tra.get(chuan(capability))


def cham(ung_vien, ban_ghi, mf):
    """Trả (verdict, ly_do, target_skill). Cổng trên thắng cổng dưới."""
    cap = ung_vien.get("capability", "")
    cred = ung_vien.get("credibility")
    nguon = ban_ghi.get("independent_sources", 1)

    # ── 1 · CỔNG CỨNG. Thắng mọi thứ. Schema cũng cưỡng chế điều này.
    if cred in ("claimed", "conflicted") and nguon == 1:
        return ("OUT_OF_SCOPE",
                f"credibility {cred} + chỉ 1 nguồn độc lập — giữ dạng knowledge, "
                f"không thành skill điều khiển agent", None)

    # ── 2 · ngoài domain
    tho = chuan(cap) + chuan(" ".join(ban_ghi.get("tags") or []))
    for oos in mf.out_of_scope:
        if oos and oos in tho:
            return ("OUT_OF_SCOPE", f"chủ đề ngoài domain ({oos})", None)

    khop = mf.tim(cap)

    # ── 3 · đã phủ sâu
    if khop and khop[2] >= 4:
        return ("OVERLAP",
                f"{khop[0]}.{khop[1]} đã ở depth {khop[2]} — đã xử lý được edge case "
                f"và biết đánh đổi", khop[0])

    # ── 4 · đã phủ nông
    if khop:
        return ("DEEPEN", None, khop[0])

    # ── 5 · chưa phủ
    return ("NEW", None, None)


def sinh_nhap_khong(ung_vien, verdict):
    """priority >= 25 VÀ verdict thuộc {NEW, DEEPEN}. Ngưỡng KHÔNG hạ (M06-R5):
    một loạt NEW đáng ngờ là dấu hiệu manifest thiếu, không phải ngưỡng cao."""
    return verdict in ("NEW", "DEEPEN") and (ung_vien.get("priority") or 0) >= NGUONG_SINH_NHAP


def quet(analyses, mf=None, chi_approved=True):
    """Chấm toàn bộ. chi_approved=True: nháp chỉ sinh từ bản NGƯỜI đã duyệt (M06-R3)."""
    mf = mf or Manifest()
    ra = []
    for r in analyses:
        if chi_approved and r.get("review_status") != "approved":
            continue
        for uv in r.get("skill_candidates") or []:
            v, ly_do, target = cham(uv, r, mf)
            ra.append({
                "id": r["id"], "capability": uv.get("capability"),
                "verdict": v, "verdict_khai": uv.get("verdict"),
                "khop": v == uv.get("verdict"),
                "target_skill": target, "ly_do": ly_do or uv.get("reason_rejected"),
                "priority": uv.get("priority"),
                "sinh_nhap": sinh_nhap_khong(uv, v),
            })
    return ra


if __name__ == "__main__":
    import sys
    sample = max((ROOT / "05_uiux/contracts").glob("analyses.sample.v*.json"),
                 key=lambda p: [int(x) for x in p.stem.split(".v")[-1].split(".")])
    d = json.loads(sample.read_text(encoding="utf-8"))
    kq = quet(d["analyses"])
    print(f"{sample.name} — {len(kq)} ứng viên trong bản approved\n")
    for k in kq:
        dau = "  " if k["khop"] else "≠ "
        nhap = " → sinh nháp" if k["sinh_nhap"] else ""
        print(f"{dau}{k['id']:<12} {k['capability']:<22} {k['verdict']:<13}"
              f"p={k['priority']}{nhap}")
        if k["ly_do"]:
            print(f"    {k['ly_do'][:88]}")
    lech = [k for k in kq if not k["khop"]]
    print(f"\n{len(kq)-len(lech)}/{len(kq)} khớp verdict khai trong sample")
    sys.exit(1 if lech else 0)
