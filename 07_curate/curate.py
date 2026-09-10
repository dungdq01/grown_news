#!/usr/bin/env python3
"""M07_curate — quét kho theo nhịp, ĐỀ XUẤT chứ không tự sửa.

Ba thứ hỏng dần mà không ai báo. Cả ba là *không có ai làm*, không phải *làm
sai* — đó là lý do phải có module chứ không phải "nhớ làm định kỳ".

  bài chết       decay_risk: high quá ngưỡng ngày ⇒ nguồn có thể đã lỗi thời
  draft đọng     nạp 5 bài một tối, duyệt 2, ba bài nằm draft mãi
  concepts phình 22 mục thành 80 mục trùng nghĩa ⇒ bộ lọc mất tác dụng

KHÔNG GHI VÀO kb/ (M07-R1). kb/ vừa là nguồn chân lý vừa là thứ M1 đo — module
tự sửa thì số M1 mất nghĩa: không biết phần nào do người, phần nào do máy.

NGƯỠNG đọc từ thresholds.yaml (M07-R2), không hardcode: kho đang 0 bài nên mọi
ngưỡng hiện tại là phỏng đoán và sẽ sai.
"""
import re
import sys
from datetime import date, datetime
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
NGUONG = Path(__file__).resolve().parent / "thresholds.yaml"
KB = ROOT / "kb"


def doc_nguong(p=NGUONG):
    return yaml.safe_load(p.read_text(encoding="utf-8"))


def _tuoi(analyzed_at, hom_nay):
    """Tuổi tính từ analyzed_at, KHÔNG từ mtime.

    mtime đổi mỗi lần git checkout, git clone, hay copy thư mục — dùng nó thì
    sau một lần clone MỌI bài đều "mới", và báo cáo im lặng đúng lúc cần nhất.
    """
    if not analyzed_at:
        return None
    try:
        d = datetime.strptime(str(analyzed_at)[:10], "%Y-%m-%d").date()
    except ValueError:
        return None
    return (hom_nay - d).days


def doc_kho(kb=KB):
    """Đọc MỌI bản ghi, kể cả draft và rejected — khác M03 và M06.
    Phải thấy draft đọng mới nhắc được."""
    ra = []
    if not kb.exists():
        return ra
    for p in sorted(kb.rglob("*.md")):
        if p.name.lower() == "readme.md" or p.name.startswith("_"):
            continue
        txt = p.read_text(encoding="utf-8")
        m = re.match(r"^---\r?\n(.*?)\r?\n---", txt, re.S)
        if not m:
            continue
        try:
            fm = yaml.safe_load(m.group(1)) or {}
        except yaml.YAMLError:
            continue
        if not isinstance(fm, dict) or "review_status" not in fm:
            continue
        fm["_path"] = str(p.relative_to(kb.parent)).replace("\\", "/")
        ra.append(fm)
    return ra


def _chuan(ten):
    """Chuẩn hoá tên khái niệm để GỢI Ý gộp. Chỉ gợi ý — quyết định là của người:
    `rag` và `rag-pipeline` chuẩn hoá gần nhau nhưng có thể là hai khái niệm."""
    t = re.sub(r"[^a-z0-9]", "", str(ten).lower())
    return re.sub(r"(s|es|ing)$", "", t)


def quet(ban_ghi, nguong, hom_nay):
    bai_chet, draft_dong = [], []
    for b in ban_ghi:
        tuoi = _tuoi(b.get("analyzed_at"), hom_nay)
        if tuoi is None:
            continue
        if b.get("decay_risk") == "high" and tuoi > nguong["decay_stale_days"]:
            bai_chet.append((b, tuoi))
        if b.get("review_status") == "draft" and tuoi > nguong["draft_stale_days"]:
            draft_dong.append((b, tuoi))

    nhom = {}
    for b in ban_ghi:
        for c in b.get("concepts_proposed") or []:
            nhom.setdefault(_chuan(c), set()).add(str(c))
    gop = {k: sorted(v) for k, v in nhom.items()
           if len(v) >= nguong["concept_merge_min"]}

    return {
        "bai_chet": sorted(bai_chet, key=lambda x: -x[1]),
        "draft_dong": sorted(draft_dong, key=lambda x: -x[1]),
        "gop_concept": gop,
        "tong": len(ban_ghi),
        "draft": sum(1 for b in ban_ghi if b.get("review_status") == "draft"),
        "decay_high": sum(1 for b in ban_ghi if b.get("decay_risk") == "high"),
    }


def bao_cao_tuan(kq, hom_nay, nguong):
    """Nhịp tuần: việc phải làm NGAY, danh sách ngắn.

    KHÔNG có đề xuất gộp concept (M07-R3) — nhắc quá thường thì người ta tắt
    thông báo, và mất luôn cả nhắc quan trọng.
    """
    iso = hom_nay.isocalendar()
    d = [f"# Tuần {iso[1]} · {iso[0]}", ""]

    if not kq["bai_chet"] and not kq["draft_dong"]:
        d += ["Không có gì phải làm.", ""]
    else:
        if kq["draft_dong"]:
            d += [f"## Draft đọng quá {nguong['draft_stale_days']} ngày", ""]
            d += [f"- `{b['_path']}` — {t} ngày · {b.get('title', b.get('slug', ''))}"
                  for b, t in kq["draft_dong"]] + [""]
        if kq["bai_chet"]:
            d += [f"## Nghi lỗi thời — quá {nguong['decay_stale_days']} ngày", ""]
            d += [f"- `{b['_path']}` — {t} ngày · xếp hàng chờ re-analyze"
                  for b, t in kq["bai_chet"]] + [""]

    d += [f"kho: {kq['tong']} bài · {kq['draft']} draft · "
          f"{kq['decay_high']} bài decay_risk high", ""]
    return "\n".join(d)


def bao_cao_thang(kq, hom_nay, nguong):
    """Nhịp tháng: quyết định cần nhìn nhiều dữ liệu."""
    d = [f"# Tháng {hom_nay.month:02d} · {hom_nay.year}", ""]

    if kq["gop_concept"]:
        d += ["## Đề xuất gộp khái niệm", "",
              "Chuẩn hoá gần nhau. **Máy chỉ gợi ý — người chốt.**", ""]
        for k, v in sorted(kq["gop_concept"].items()):
            d.append(f"- `{k}` ← {', '.join(f'`{x}`' for x in v)}")
        d.append("")
    else:
        d += ["Không có đề xuất gộp nào.", ""]

    d += ["## Kho", "",
          f"- {kq['tong']} bản ghi · {kq['draft']} draft",
          f"- {kq['decay_high']} bài `decay_risk: high`", ""]
    return "\n".join(d)


def chay(nhip, kb=KB, hom_nay=None, out=None):
    hom_nay = hom_nay or date.today()
    nguong = doc_nguong()
    kq = quet(doc_kho(kb), nguong, hom_nay)

    if nhip == "week":
        noi = bao_cao_tuan(kq, hom_nay, nguong)
        ten = f"{hom_nay.isocalendar()[0]}-W{hom_nay.isocalendar()[1]:02d}.md"
    else:
        noi = bao_cao_thang(kq, hom_nay, nguong)
        ten = f"{hom_nay.year}-{hom_nay.month:02d}.md"

    thu_muc = Path(out) if out else Path(__file__).resolve().parent / "reports"
    thu_muc.mkdir(parents=True, exist_ok=True)
    p = thu_muc / ten
    p.write_text(noi, encoding="utf-8")
    return p, noi, kq


def main():
    nhip = sys.argv[1] if len(sys.argv) > 1 else "week"
    if nhip not in ("week", "month"):
        sys.exit("dùng: python -m curate week|month")
    p, noi, _ = chay(nhip)
    print(noi)
    print(f"--> {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
