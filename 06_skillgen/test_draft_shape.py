#!/usr/bin/env python3
"""AC của T06-3.

  (không tham số)   AC1 · nháp có đủ 4 phần
  -k than_rong      AC2 · thân RỖNG — chống chính module này phình vai (M06-R2)
"""
import json, re, sys, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from draft import TODO, sinh  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = max((ROOT / "05_uiux/contracts").glob("analyses.sample.v*.json"),
             key=lambda p: [int(x) for x in p.stem.split(".v")[-1].split(".")])
A = json.loads(SAMPLE.read_text(encoding="utf-8"))["analyses"]
KQ = sinh(A)
loi = []


def ok(dk, ten, ct=""):
    print(f"  {'ok  ' if dk else 'FAIL'} {ten}" + (f"  {ct}" if not dk else ""))
    if not dk:
        loi.append(ten)


def bon_phan():
    print("\nAC1 · nháp có đủ 4 phần\n")
    ok(len(KQ) == 4, f"sinh 4 nháp từ 4 ứng viên priority>=25", f"được {len(KQ)}")

    for k in KQ:
        t, n = k["noi_dung"], k["name"]
        ok(t.startswith("---\n"), f"{n}: có frontmatter")
        fm = t.split("---")[1]
        ok(f"name: {n}" in fm, f"{n}: frontmatter khai name")
        ok("description:" in fm and len(fm.split("description:")[1].strip()) > 5,
           f"{n}: description không rỗng — đây là phần máy làm TỐT")
        ok("## Khi nào dùng" in t, f"{n}: có mục Khi nào dùng")
        ok("## Nguồn" in t and ("kb/" in t), f"{n}: có con trỏ ngược về bản .md nguồn")
        ok(str(k["priority"]) in t, f"{n}: ghi priority để người biết vì sao được sinh")

    # ghi thật ra thư mục tạm
    with tempfile.TemporaryDirectory() as d:
        r = sinh(A, dich=d, ghi=True)
        co = sorted(p.parent.name for p in Path(d).rglob("SKILL.md"))
        ok(co == sorted(k["name"] for k in r), "ghi ra đúng <name>/SKILL.md", f"được {co}")


def than_rong():
    print("\nAC2 · thân RỖNG — chống chính module này phình vai (M06-R2)\n")
    for k in KQ:
        t, n = k["noi_dung"], k["name"]
        # Mục "Cách làm" và "Dè chừng" chỉ được chứa đúng dòng TODO
        for muc in ("## Cách làm", "## Dè chừng"):
            khoi = t.split(muc)[1].split("##")[0].strip() if muc in t else None
            ok(khoi == TODO, f"{n}: mục {muc.strip('# ')!r} chỉ có dòng TODO",
               f"được {khoi!r}")

        # Không có khối code — dấu hiệu rõ nhất của "sinh luôn cho tiện"
        ok("```" not in t, f"{n}: không khối code nào",
           "có code block ⇒ máy đang chép nguồn")

        # Không có bullet hướng dẫn ngoài phần khung
        than = t.split("## Cách làm")[1] if "## Cách làm" in t else ""
        buoc = re.findall(r"^\s*(?:\d+\.|[-*])\s+\S", than, re.M)
        ok(not buoc, f"{n}: không bước hướng dẫn nào trong thân", f"có {len(buoc)} bullet")

    # Ứng viên dưới ngưỡng và OVERLAP/OUT_OF_SCOPE KHÔNG được sinh
    ten = {k["name"] for k in KQ}
    ok("cost-estimation" not in ten, "cost-estimation (p=4.5) KHÔNG sinh nháp")
    ok("skill-authoring" not in ten, "skill-authoring (OVERLAP) KHÔNG sinh nháp")
    ok("prompt-cache-tuning" not in ten, "prompt-cache-tuning (OUT_OF_SCOPE) KHÔNG sinh")


k = sys.argv[sys.argv.index("-k") + 1] if "-k" in sys.argv else None
if not k or k == "bon_phan":
    bon_phan()
if not k or k == "than_rong":
    than_rong()
print()
sys.exit(f"{len(loi)} lỗi" if loi else 0)
