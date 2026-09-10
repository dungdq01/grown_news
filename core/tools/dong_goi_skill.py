#!/usr/bin/env python3
"""Đóng gói skill `source-distiller` TỪ REPO rồi cài vào ~/.claude/skills/.

VÌ SAO CÓ FILE NÀY
------------------
Skill cài ở `~/.claude/skills/source-distiller/` là thứ THẬT SỰ viết bài cho
kho này — nhưng nó là bản CHÉP TAY. Không bước đóng gói, không cổng canh, và
nằm ngoài cây git nên không `git diff` nào thấy nó trôi.

Hệ quả đã xảy ra: bundle từng giữ một `scripts/validate.py` lạc hậu từ trước
FR-034 — bản validator THỨ TƯ trong hệ. Bài skill viết ra bị cổng thật trả về,
và lỗi hiện Ở CHỖ NGƯỜI DÙNG chứ không ở CI. Đó là dạng trôi đắt nhất: cái sai
nằm ở bản đang chạy, còn repo thì xanh.

BA THỨ FILE NÀY *KHÔNG* LÀM — mỗi cái là một răng, không phải bỏ sót
-------------------------------------------------------------------
1. KHÔNG tự chạy. Người gõ lệnh mới cài (M06-R4 vế 1: "máy đề xuất, NGƯỜI
   quyết định cài"). Không hook, không import từ server.
2. KHÔNG ghi đè im lặng bản người đã sửa (M06-R4 vế 2). Mỗi lần cài ghi
   `.nguon.json` — sha256 của thứ VỪA CÀI. Lần sau, file nào trên đĩa lệch
   manifest nghĩa là có người sửa tay ⇒ DỪNG, đòi `--ghi-de`.
3. KHÔNG coi gói `.skill` là backup. Nó gitignore (`.gitignore:13 *.skill`) —
   `git ls-files --error-unmatch source-distiller.skill` trả "did not match".
   Gói chỉ để PHÂN PHỐI. Backup là `core/skill-src/**` trong git.

CHÉP THEO BYTE, không theo dòng: repo dùng CRLF, bundle cũng vậy; đọc/ghi text
sẽ "chuẩn hoá" xuống LF và mọi phép so byte sau đó lệch vĩnh viễn.
"""
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
CAI = Path.home() / ".claude" / "skills" / "source-distiller"
MANIFEST = ".nguon.json"

# ── BẢNG NGUỒN — DANH SÁCH ĐÓNG ─────────────────────────────────────────────
#
# `đường trong bundle` -> `đường nguồn trong repo`.
#
# Đóng theo CẢ HAI CHIỀU và đó là chủ đích:
#   · nguồn không có đích  ⇒ file thừa trong repo, không ai cài
#   · đích không có nguồn  ⇒ MỒ CÔI — đúng lớp lỗi file này sinh ra để chặn.
#     7 file (~40 KB) từng ở tình trạng đó, trong đó bốn `references/` là CHIỀU
#     SÂU GIAO THỨC (không phải bản sao của thứ gì): mất là mất thật.
#
# Thêm một file vào skill ⇒ phải sửa bảng này, tức có người đọc lại luật.
BANG_NGUON = {
    "SKILL.md":                       "core/skill-src/source-distiller.SKILL.md",
    "README.md":                      "core/skill-src/README.md",
    "references/format.md":           "core/skill-src/format.md",
    "references/web-spec.md":         "core/skill-src/web-spec.md",
    "references/source-types.md":     "core/skill-src/source-types.md",
    "references/archetypes.md":       "core/skill-src/archetypes.md",
    "references/credibility.md":      "core/skill-src/credibility.md",
    "references/skill-gap.md":        "core/skill-src/skill-gap.md",
    "references/intake.md":           "core/skill-src/intake.md",
    "examples/mau-dat-chuan.md":      "core/skill-src/mau-dat-chuan.md",
    "assets/concepts.seed.yaml":      "core/skill-src/concepts.seed.yaml",
    # Ba file dưới KHÔNG có bản riêng ở skill-src: chúng là CHÍNH thứ repo dùng.
    # Một bản sao thứ hai trong skill-src là chỗ để trôi — mà trôi ở đây nghĩa là
    # skill kiểm bài bằng luật khác với luật cổng thật. Đọc thẳng, không sao chép.
    "assets/frontmatter.schema.json": "core/assets/frontmatter.schema.json",
    "assets/khung-than-bai.json":     "core/assets/khung-than-bai.json",
    "scripts/validate.py":            "core/src/source_distiller/validate.py",
    "scripts/khung.py":               "core/src/source_distiller/khung.py",
}


def bam(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()[:16]


def doc_nguon(dich: str) -> bytes:
    return (GOC / BANG_NGUON[dich]).read_bytes()


def thieu_nguon() -> list:
    """Nguồn khai trong bảng mà không có thật trên đĩa."""
    return [f"{d} <- {s} (KHÔNG CÓ)" for d, s in BANG_NGUON.items()
            if not (GOC / s).is_file()]


def so_sanh(goc_cai: Path = CAI) -> dict:
    """So bản CÀI với nguồn. Trả bốn nhóm — không nhóm nào được im lặng."""
    kq = {"lech": [], "thieu": [], "mo_coi": [], "khop": []}
    if not goc_cai.is_dir():
        kq["thieu"] = sorted(BANG_NGUON)
        return kq
    for dich in sorted(BANG_NGUON):
        f = goc_cai / dich
        # Nguồn chưa có ⇒ BỎ QUA ở đây, không nổ. Mục 1 của cổng đã nêu đích
        # danh nó rồi; một cổng ném traceback thì người đọc mất cả phần nó
        # đo ĐƯỢC — bản đầu của hàm này nổ đúng như vậy.
        if not (GOC / BANG_NGUON[dich]).is_file():
            continue
        if not f.is_file():
            kq["thieu"].append(dich)
        elif f.read_bytes() != doc_nguon(dich):
            kq["lech"].append(dich)
        else:
            kq["khop"].append(dich)
    khai = set(BANG_NGUON)
    for f in goc_cai.rglob("*"):
        if f.is_file():
            ten = f.relative_to(goc_cai).as_posix()
            if ten not in khai and ten != MANIFEST:
                kq["mo_coi"].append(ten)
    kq["mo_coi"].sort()
    return kq


def nguoi_sua_tay(goc_cai: Path = CAI) -> list:
    """File trên đĩa lệch MANIFEST ⇒ ai đó sửa tay sau lần cài cuối (M06-R4).

    Khác `so_sanh`: `so_sanh` hỏi "bản cài có khớp nguồn không" (nguồn có thể
    vừa đi tới trước — đó là cập nhật bình thường). Hàm này hỏi "bản cài có bị
    sửa NGOÀI đường đóng gói không" — thứ ghi đè lên là mất công biên tập.
    """
    mf = goc_cai / MANIFEST
    if not mf.is_file():
        return []          # chưa từng cài bằng công cụ này ⇒ không có gì để so
    cu = json.loads(mf.read_text(encoding="utf-8")).get("files", {})
    ra = []
    for dich, bam_cu in cu.items():
        f = goc_cai / dich
        if f.is_file() and bam(f.read_bytes()) != bam_cu:
            ra.append(dich)
    return sorted(ra)


def ghi_manifest(goc_cai: Path = CAI) -> None:
    """Ghi sha256 của thứ VỪA CÀI — cơ sở để lần sau biết ai sửa tay."""
    (goc_cai / MANIFEST).write_text(json.dumps({
        "$comment": "Sinh bởi core/tools/dong_goi_skill.py. ĐỪNG sửa tay: đây là "
                    "mốc để biết bản cài có bị sửa ngoài đường đóng gói không.",
        "files": {d: bam((goc_cai / d).read_bytes())
                  for d in sorted(BANG_NGUON) if (goc_cai / d).is_file()},
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def cai(goc_cai: Path = CAI, ghi_de: bool = False):
    """Cài bundle. Trả (mã thoát, dòng báo).

    KHÔNG xoá thư mục cũ rồi tạo lại: `~/.claude/skills/` là nơi DUY NHẤT skill
    nạp được, và một lần xoá hụt là skill biến mất khỏi agent. Ghi đè từng file,
    và chỉ những file có trong bảng.
    """
    t = thieu_nguon()
    if t:
        return 1, ["THIẾU NGUỒN — không đóng gói được:"] + [f"  {x}" for x in t]

    tay = nguoi_sua_tay(goc_cai)
    if tay and not ghi_de:
        return 1, [
            "DỪNG — bản đã cài bị sửa TAY sau lần đóng gói cuối (M06-R4):",
            *[f"  {x}" for x in tay],
            "Ghi đè là nuốt công biên tập đó im lặng. Chọn một:",
            "  · đưa phần sửa về core/skill-src/ rồi chạy lại (đúng hướng), hoặc",
            "  · chấp nhận mất: chạy lại với --ghi-de",
        ]

    ra = []
    for dich in sorted(BANG_NGUON):
        f = goc_cai / dich
        noi_dung = doc_nguon(dich)
        f.parent.mkdir(parents=True, exist_ok=True)
        if not f.is_file() or f.read_bytes() != noi_dung:
            f.write_bytes(noi_dung)
            ra.append(f"  ghi  {dich}")
    ghi_manifest(goc_cai)
    ra.append(f"  {len(BANG_NGUON)} file · {len(ra)} file đổi · {goc_cai}")
    return 0, ra


def tu_kiem_chay(goc_cai: Path = CAI):
    """Bản CÀI chạy được thật — validator của bundle ăn được bài mẫu của bundle.

    Khớp từng byte mới chỉ nói "đúng bản". Câu này hỏi "bản đúng đó có CHẠY
    không" — đó là thứ bug validator-lạc-hậu thoát khỏi: nó khớp một nguồn nào
    đó, chỉ là nguồn sai.
    """
    r = subprocess.run(
        [sys.executable, str(goc_cai / "scripts" / "validate.py"),
         str(goc_cai / "examples" / "mau-dat-chuan.md"),
         "--no-concepts", "--no-categories"],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def dong_goi_zip() -> Path:
    """Gói `.skill` để PHÂN PHỐI — KHÔNG phải backup (nó gitignore)."""
    f = GOC / "source-distiller.skill"
    with zipfile.ZipFile(f, "w", zipfile.ZIP_DEFLATED) as z:
        for dich in sorted(BANG_NGUON):
            z.writestr(dich, doc_nguon(dich))
    return f


def main() -> int:
    a = sys.argv[1:]
    if "--kiem" in a:
        kq = so_sanh()
        t = thieu_nguon()
        for nhan, ds in (("THIẾU NGUỒN", t), ("LỆCH", kq["lech"]),
                         ("THIẾU trong bản cài", kq["thieu"]), ("MỒ CÔI", kq["mo_coi"])):
            for x in ds:
                print(f"  {nhan}: {x}")
        xau = t or kq["lech"] or kq["thieu"] or kq["mo_coi"]
        print(f"  {len(kq['khop'])}/{len(BANG_NGUON)} khớp")
        return 1 if xau else 0
    if "--tu-kiem" in a:
        ma, ra = tu_kiem_chay()
        print(ra.strip()[:800])
        print(f"  validator của bundle trên bài mẫu của bundle: mã {ma}")
        return ma
    if "--goi" in a:
        f = dong_goi_zip()
        print(f"  {f} — CHỈ để phân phối. KHÔNG phải backup: file này gitignore.")
        print("  Backup là core/skill-src/** trong git.")
        return 0
    ma, ra = cai(ghi_de="--ghi-de" in a)
    for d in ra:
        print(d)
    return ma


if __name__ == "__main__":
    sys.exit(main())
