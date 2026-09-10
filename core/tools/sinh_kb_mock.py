"""Tach kho mock ra thu muc rieng: kb-mock/

HIEN TAI hai vai lan nhau:
  05_uiux/contracts/analyses.sample.v5.json
    vai 1  HOP DONG G5 — test doc _expected_render de kiem so lieu
    vai 2  KHO BAI MAU — web doc de dung ban /mock/

Vai 1 la hop dong FROZEN, sua phai qua FR. Vai 2 la du lieu de xem giao dien,
sua thoai mai. Gop lam mot nghia la: them mot bai mau => dung contract => FR.

TACH:
  kb/         du lieu THAT     — .md, nguoi nap qua Claude Code
  kb-mock/    du lieu MAU      — .md, sinh tu contract, xem duoc bang mat
  contract    HOP DONG         — chi test doc, khong phai nguon web

kb-mock/ dung DUNG dinh dang kb/ (.md + frontmatter) — khong phai JSON.
Vi sao: bat ky thu gi doc duoc kb/ deu doc duoc kb-mock/ ma khong sua mot dong.
Muon them bai mau thi viet mot file .md, khong phai sua JSON contract.
"""
import json
import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
SRC = R / "05_uiux" / "contracts" / "analyses.sample.v5.json"
DICH = R / "kb-mock"

# DUNG LAI count_words cua M01, khong viet ban thu hai (cung ly do M05-R3):
# hai ban dem se lech nhau im lang, va sua cong o M01 thi ban copy van sai.
sys.path.insert(0, str(R / "core" / "src"))
from source_distiller.validate import count_words as dem_tu  # noqa: E402
from source_distiller.validate import (  # noqa: E402
    phan_giai, split_frontmatter, tach_dia_chi)

# Thân bài dựng TỪ KHUNG KHAI (core/assets/khung-than-bai.json), không gõ tay.
# Bản trước gõ cứng 9 mục ở đây, và tên mục nó dùng LỆCH với tên trong form —
# hai bộ tên cùng qua cổng vì cổng chỉ ép SỐ mục. Cổng canh: check_khung.py.
from source_distiller.khung import than_mau  # noqa: E402

d = json.loads(SRC.read_text(encoding="utf-8"))


def than_cua(r):
    """Overview = one_liner của bản ghi; §3.2 dài để thân đủ chữ mà đọc được."""
    return than_mau({
        "1": r.get("one_liner", "—"),
        "2": "Vấn đề tồn tại trước khi có nguồn này.",
        "3.1": "Đầu vào của nguồn.",
        "3.2": "Chi tiết cách nó hoạt động [nguon.py:10-40]. "
               + "Thêm chữ cho thân bài đủ dày. " * 8,
        "3.3": "Kết quả đo được [nguon.py:41-50].",
        "4": "Dùng được vào việc gì [nguon.py:51-60].",
        "5": "Chỗ chưa ai tái lập, và hướng đi tiếp.",
    })


n = 0
for r in d["analyses"]:
    than = than_cua(r)

    # word_count phai tinh tu THAN THAT, khong chep tu contract (FR-015).
    #
    # Contract khai word_count cua bai GOC (380-1800 tu). Than o day la TEMPLATE
    # ~130 tu dung chung cho moi ban. Chep nguyen so cua contract vao => moi file
    # lech, va `validate --strict` do 14 loi.
    #
    # Truoc FR-015 toi sua bang `validate --fix` — nhung lan sinh lai NAO cung
    # de nguoc lai. Sua o day la sua tan goc: word_count la du lieu DAN XUAT
    # (M01-R2), nen noi sinh ra than phai la noi tinh no.
    ban = dict(r)
    ban["word_count"] = dem_tu(than)

    fm = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}"
                   for k, v in ban.items() if not k.startswith("_"))
    p = DICH / r["source_type"] / f"{r['slug']}.md"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(f"---\n{fm}\n---\n\n{than}\n", encoding="utf-8")
    n += 1

# ── citations_* + unverifiable_citations: DAN XUAT, cung luat word_count ──
#
# Contract khai `citations_sampled: 0` con than TEMPLATE mang 4 dia chi, nen
# sau C1 (B-A6) moi file lech va `validate --strict` do. Sua bang
# `validate kb-mock/ --fix` thi LAN SINH LAI NAO CUNG DE NGUOC LAI — dung
# bai hoc da ghi o dong 65 cho `word_count`.
#
# LUOT THU HAI, khong tinh trong vong tren: `phan_giai` tra loi cau 'dia chi
# nay co tro vao thu KHO CO khong', ma kho chi day du SAU khi moi file da
# duoc ghi. Tinh trong vong la de mot ban ghi phu thuoc thu tu vong lap.
for p in sorted(DICH.glob('*/*.md')):
    raw, than_f = split_frontmatter(p.read_text(encoding='utf-8'))
    if raw is None:
        continue
    ds = tach_dia_chi(than_f)
    mau = len(ds)
    that = sum(1 for _, ten, manh, k in ds if phan_giai(ten, manh, k, DICH))
    dong = {'citations_sampled': mau, 'citations_verified': that}
    if mau and not that:
        dong['unverifiable_citations'] = True
    moi_raw = raw
    for k, v in dong.items():
        gt = json.dumps(v)
        if re.search(rf'^{k}:', moi_raw, re.M):
            moi_raw = re.sub(rf'^{k}:.*$', f'{k}: {gt}', moi_raw, flags=re.M)
        else:
            moi_raw = moi_raw.rstrip(chr(10)) + f'{chr(10)}{k}: {gt}'
    if moi_raw != raw:
        p.write_text(f'---{moi_raw}{chr(10)}---{than_f}', encoding='utf-8')


# Ban luu tru sau re-analyze — phai bi loai khoi site (M03 AC-2.2.1)
goc = next(r for r in d["analyses"] if r["review_status"] == "approved")
luu = DICH / goc["source_type"] / f"{goc['slug']}.v1.md"
luu.write_text((DICH / goc["source_type"] / f"{goc['slug']}.md").read_text(encoding="utf-8"),
               encoding="utf-8")

# ═══ HAI BAN GHI THU VIEN — khai O DAY, khong trong contract (FR-036/B8a) ═════
#
# `05_uiux/contracts/analyses.sample.v5.json` la hop dong G5 FROZEN, va
# `expected-render.test.js` dung `Ban` THANG TU contract de so `_expected_render`.
# Them ban ghi vao do la bump 5 hash + mo FR cho mot thu chi de XEM giao dien.
#
# Vi sao mock CAN chung: man `/mock/` phai demo duoc loi thu vien MA KHONG CAN
# API. Khong co chung thi moi cong FE cua B8b chi do duoc tren kho tam co server,
# va nguoi xem giao dien khong thay gi.
#
# `media` viet FLOW JSON (`json.dumps` cho ca dict) — parser YAML tu che cua
# `docTuDia` doc duoc block LIST va flow JSON nhung KHONG doc duoc block MAPPING
# (do o WL-01K9N9FR036B7A). Viet block style la ban mock im lang mat `media`.
#
# `ho_so: thu-vien` mien cong muc/dan nhap/tinh tuy, nen `than` la MOT CAU —
# dung nhu ban ghi thu vien that: hien vat + nhan, khong phai ban phan tich.
THU_VIEN = [
    {
        "id": "src_mocktailieu01",
        "slug": "bao-cao-chi-phi-suy-luan",
        "source_type": "tai-lieu",
        "url": "kho://tai-lieu/bao-cao-chi-phi-suy-luan",
        "protocol_version": "2.0",
        "analyzed_at": "2026-08-20",
        "title": "Báo cáo chi phí suy luận 2026",
        "one_liner": "Bảng chi phí suy luận theo tháng, dùng làm nền so sánh khi chọn mô hình.",
        "credibility_max": "plausible",
        "review_status": "approved",
        "origin": "manual",
        "conformance": "B",
        "ho_so": "thu-vien",
        # Hai danh muc DANG RONG (FR-031 xoa sach theo yeu cau nguoi dung).
        # Nen ban ghi mau KHONG duoc tro vao mot nhan khong ton tai — do la
        # dung loi ma cong 5/5b chan. Nhan du dinh di vao `concepts_proposed`,
        # dung duong ma M02-R3 khai cho "chua co nhan phu hop".
        "concepts": [],
        "concepts_proposed": ["chi-phi-suy-luan"],
        # FR-052 · MANG. Mot ban ghi giu duoc NHIEU hien vat — M16 sinh slide
        # + giong doc + video cho MOT bai. Mock giu MOT phan tu: du de UI hien,
        # va khong bia ra hien vat khong co byte nao.
        "media": [{
            # sha256 cua mot file KHONG co trong kho mock: kho mock khong co DB
            # nen khong co byte nao. Day la con tro de XEM GIAO DIEN, va nut tai
            # ve nam trong `.api-only` nen no an khi chua co may chu.
            "sha256": "3f2a" + "0" * 60,
            "mime": "application/pdf",
            "ten_goc": "chi-phi-suy-luan-2026.pdf",
            "so_byte": 812_344,
        }],
        "than": "Bản PDF gốc, giữ nguyên trong kho. Số liệu theo tháng, không tổng hợp lại.",
    },
    {
        "id": "src_mockvideo001",
        "slug": "hoi-thao-context-engineering",
        "source_type": "video",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "url_normalized": "youtube.com/watch?v=dQw4w9WgXcQ",
        "protocol_version": "2.0",
        "analyzed_at": "2026-08-22",
        "title": "Hội thảo: quản lý ngữ cảnh cho agent",
        "one_liner": "Bản ghi hội thảo, đăng ký URL thay vì tải file — video 200 MB không vào kho.",
        "credibility_max": "plausible",
        "review_status": "approved",
        "origin": "manual",
        "conformance": "B",
        "ho_so": "thu-vien",
        "concepts": [],
        "concepts_proposed": ["quan-ly-ngu-canh"],
        "than": "Đăng ký URL. Người đọc bấm mới nhúng — mở trang không gọi ra ngoài.",
    },
]

for r in THU_VIEN:
    ban = {k: v for k, v in r.items() if k != "than"}
    ban["word_count"] = dem_tu(r["than"])
    fm = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in ban.items())
    p2 = DICH / r["source_type"] / f"{r['slug']}.md"
    p2.parent.mkdir(parents=True, exist_ok=True)
    p2.write_text(f"---\n{fm}\n---\n\n{r['than']}\n", encoding="utf-8")
    n += 1

# Danh muc nhan — kho mock CUNG CAN ca hai, giong kb/ that.
#
# Vi sao ca hai: emitter doc vocab tu CHINH kho no dung (docDanhMucFile(kho, ...)).
# Thieu categories.yaml thi ban /mock/ mat nhan tieng Viet — sidebar hien `agent-llm`
# thay vi `Agent va LLM`. Do la thu do duoc: ban that hien nhan, ban mock hien id.
for ten in ("concepts.yaml", "categories.yaml"):
    src = R / "kb" / ten
    if src.exists():
        (DICH / ten).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")

(DICH / "README.md").write_text('''# `kb-mock/` — kho bài MẪU

Dữ liệu để xem giao diện khi `kb/` còn rỗng. **Không phải dữ liệu thật.**

| | Thư mục | Ai ghi |
|---|---|---|
| Thật | `kb/` | M01_core (skill 6 pass) · M05_intake |
| Mẫu | `kb-mock/` | sinh từ contract, hoặc viết tay |

## Vì sao tách khỏi contract

Trước đó web đọc thẳng `05_uiux/contracts/analyses.sample.v3.json`. File đó có
**hai vai lẫn nhau**:

- **hợp đồng G5** — test đọc `_expected_render` để kiểm số liệu, **frozen**, sửa phải qua FR
- **kho bài mẫu** — web đọc để dựng bản `/mock/`, sửa thoải mái

Gộp làm một nghĩa là: thêm một bài mẫu ⇒ đụng contract ⇒ mở FR. Vô lý.

## Vì sao dùng `.md` chứ không phải JSON

`kb-mock/` dùng **đúng định dạng `kb/`**: `.md` + frontmatter. Bất kỳ thứ gì đọc
được `kb/` đều đọc được `kb-mock/` mà không sửa một dòng — validator, web, quét
kho, sinh skill.

Thêm bài mẫu = viết một file `.md`, không phải sửa JSON.

## Sinh lại

```bash
python core/tools/sinh_kb_mock.py
```

Đọc contract v5, sinh {n} bản ghi + 1 bản lưu trữ `.v1.md` (để kiểm luật
"bản lưu trữ không lên site").

## Kho này KHÔNG phải nguồn chân lý

Không đo M1 trên đây. Không sinh skill từ đây. Nó chỉ để nhìn.
'''.replace("{n}", str(n)), encoding="utf-8")

print(f"sinh {n} ban ghi + 1 ban luu tru -> kb-mock/")
for p in sorted(DICH.iterdir()):
    print("  ", p.name)
