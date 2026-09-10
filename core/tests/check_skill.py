#!/usr/bin/env python3
"""Bản skill ĐÃ CÀI phải là bản SINH RA từ repo — lệch một byte là đỏ.

VÌ SAO CẦN CỔNG NÀY
-------------------
`check_khung.py` canh văn xuôi bên trong repo. `check_danh_muc.py` tooth 2 ép
hai bản `frontmatter.schema.json` khớp nhau. Cả hai chỉ với tới thứ nằm TRONG
cây git.

Skill cài ở `~/.claude/skills/` nằm NGOÀI. Không diff nào thấy nó, không CI nào
chạm nó — nên nó trôi mà mọi cổng vẫn xanh. Đã xảy ra: bundle giữ một
`validate.py` lạc hậu từ trước FR-034, bài viết ra bị cổng thật trả về, và lỗi
hiện ở chỗ NGƯỜI DÙNG.

BỐN ĐIỀU CANH — và điều thứ ba là thứ hay bị bỏ
-----------------------------------------------
  1 mọi nguồn khai trong `BANG_NGUON` có thật
  2 mọi file bundle KHỚP nguồn từng byte
  3 KHÔNG file mồ côi trong bundle (file không có nguồn nào) — chiều này hay bị
    bỏ vì nó không làm gì hỏng ngay; nhưng mồ côi CHÍNH LÀ trạng thái ban đầu
    (7 file, ~40 KB), và mất chúng là mất thật
  4 mỗi mode tự chứng minh đỏ được VÀ không đỏ oan

CHÉP THEO BYTE: repo dùng CRLF. Đọc text sẽ chuẩn hoá xuống LF rồi mọi phép so
sau đó lệch vĩnh viễn — bug này đã bắt được lúc dựng cổng.
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(GOC / "core" / "tools"))
import dong_goi_skill as dg  # noqa: E402

# NGOẠI LỆ — danh sách ĐÓNG, mỗi mục kèm lý do. Thêm một dòng ⇒ phải sửa file
# này, tức có người đọc lại luật thay vì lặng lẽ nới.
MIEN_TRU = {
    "core/skill-src/frontmatter.schema.json":
        "Bản sao THỨ HAI của core/assets/frontmatter.schema.json — bundle cài từ "
        "core/assets/, nên file này KHÔNG ai đọc và sẽ trôi. Đúng ra phải xoá, "
        "nhưng nó nằm trong danh sách cấm chạm của phiên song song (FR-036 nhánh "
        "B). Để nguyên + in CHÚ Ý mỗi lần chạy, chờ chủ sở hữu quyết.",
}

loi = []


def ok(dieu, chu, them=""):
    print(f"  {'ok  ' if dieu else 'FAIL'} {chu}" + ("" if dieu else f"  <- {them}"))
    if not dieu:
        loi.append(chu)


def kiem_nguon():
    """Mode cho CI — máy runner KHÔNG có skill cài, và đó không phải lỗi.

    Chạy cổng đầy đủ ở đó thì nó đỏ vì "chưa cài", tức ĐỎ OAN — và cổng đỏ oan
    là cổng sẽ bị `|| true` trong ba tháng. Nên CI chỉ hỏi phần CI trả lời được:
    mọi nguồn khai có thật trong repo không.

    Phần "bản cài khớp nguồn" do máy CÓ cài skill trả lời, bằng mode mặc định.
    """
    print(f"\nNguồn của skill đủ trong repo (mode CI)\n")
    t = thieu_nguon_wrap()
    ok(not t, f"{len(dg.BANG_NGUON)} nguồn đều nằm trong git",
       "; ".join(t[:5]))
    ngoai = [f.relative_to(dg.GOC).as_posix()
             for f in (dg.GOC / "core" / "skill-src").rglob("*") if f.is_file()]
    khai = set(dg.BANG_NGUON.values()) | set(MIEN_TRU)
    thua = sorted(x for x in ngoai if x not in khai)
    for x, ly_do in MIEN_TRU.items():
        if (dg.GOC / x).is_file():
            print(f"  CHÚ Ý miễn trừ · {x}")
            print(f"         {ly_do}")
    ok(not thua, f"không file nào trong `core/skill-src/` bị bỏ ngoài bảng nguồn",
       ", ".join(thua) + " — file không ai cài là file sẽ trôi mà không ai biết")


def thieu_nguon_wrap():
    return dg.thieu_nguon()


def cong_chinh(goc_cai=None):
    goc_cai = goc_cai or dg.CAI
    print("\n1 · Mọi nguồn khai trong bảng có thật\n")
    t = dg.thieu_nguon()
    ok(not t, f"{len(dg.BANG_NGUON)} nguồn đều có trên đĩa",
       "; ".join(t[:4]) + (f" (+{len(t) - 4})" if len(t) > 4 else ""))

    print("\n2 · Bản đã cài khớp nguồn từng byte\n")
    if not goc_cai.is_dir():
        ok(False, "skill đã được cài", f"{goc_cai} không tồn tại — chạy dong_goi_skill.py")
        return
    kq = dg.so_sanh(goc_cai)
    ok(not kq["thieu"], f"không file nào THIẾU trong bản cài ({len(kq['khop'])} khớp)",
       ", ".join(kq["thieu"][:5]))
    ok(not kq["lech"], "không file nào LỆCH nguồn", ", ".join(kq["lech"][:5]))

    print("\n3 · Không file mồ côi — mọi thứ trong bundle có nguồn\n")
    ok(not kq["mo_coi"],
       f"mọi file bundle có nguồn khai ({len(kq['mo_coi'])} mồ côi)",
       ", ".join(kq["mo_coi"][:6])
       + " — mồ côi nghĩa là nội dung sống NGOÀI git, mất là mất thật")

    print("\n4 · Không ai sửa tay bản đã cài (M06-R4 vế 2)\n")
    tay = dg.nguoi_sua_tay(goc_cai)
    ok(not tay, "bản cài không bị sửa ngoài đường đóng gói",
       ", ".join(tay[:5]) + " — chạy lại packager sẽ NUỐT các sửa đó")


def _kho_gia(tmp: Path) -> Path:
    """Dựng một bản cài GIẢ, đúng nguồn — để thử cả hai chiều mà không đụng bản thật."""
    for dich in dg.BANG_NGUON:
        f = tmp / dich
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(dg.doc_nguon(dich))
    return tmp


def tu_kiem():
    """Chứng minh CẢ HAI chiều: đỏ khi lệch, và KHÔNG đỏ oan khi khớp.

    Cổng chỉ chứng minh chiều đỏ là cổng chưa ai biết nó có đỏ oan không — và
    cổng đỏ oan thì sẽ bị tắt.
    """
    print("\nTự kiểm — cổng phải đỏ ĐƯỢC và không đỏ OAN\n")
    if dg.thieu_nguon():
        ok(False, "đủ nguồn để dựng bản giả", "thiếu nguồn — chạy mục 1 trước")
        return
    with tempfile.TemporaryDirectory() as d:
        tmp = _kho_gia(Path(d) / "sd")

        kq = dg.so_sanh(tmp)
        ok(not (kq["lech"] or kq["thieu"] or kq["mo_coi"]),
           "bản dựng ĐÚNG nguồn ⇒ XANH (không đỏ oan)",
           f"lệch={kq['lech']} thiếu={kq['thieu']} mồ côi={kq['mo_coi']}")

        # (a) một byte lệch
        f = tmp / "SKILL.md"
        f.write_bytes(f.read_bytes() + b"x")
        ok("SKILL.md" in dg.so_sanh(tmp)["lech"], "lệch MỘT byte ⇒ ĐỎ, nêu đích danh")
        f.write_bytes(dg.doc_nguon("SKILL.md"))

        # (b) thiếu file
        f = tmp / "references" / "intake.md"
        giu = f.read_bytes()
        f.unlink()
        ok("references/intake.md" in dg.so_sanh(tmp)["thieu"], "thiếu một file ⇒ ĐỎ")
        f.write_bytes(giu)

        # (c) mồ côi quay lại — chính trạng thái ban đầu
        (tmp / "references" / "lac-loai.md").write_bytes(b"# khong co nguon\n")
        ok("references/lac-loai.md" in dg.so_sanh(tmp)["mo_coi"],
           "file không có nguồn ⇒ ĐỎ (chống mồ côi quay lại)")
        (tmp / "references" / "lac-loai.md").unlink()

        ok(not any(dg.so_sanh(tmp)[k] for k in ("lech", "thieu", "mo_coi")),
           "hoàn nguyên xong lại XANH — ba ca trên không để lại vết")


def ca_am_ghi_de():
    """M06-R4 vế 2: sửa tay bản cài rồi chạy lại packager ⇒ phải DỪNG."""
    print("\nCa âm — không ghi đè im lặng bản người đã sửa\n")
    if dg.thieu_nguon():
        ok(False, "đủ nguồn để thử", "thiếu nguồn")
        return
    with tempfile.TemporaryDirectory() as d:
        tmp = _kho_gia(Path(d) / "sd")
        dg.ghi_manifest(tmp)
        ok(not dg.nguoi_sua_tay(tmp), "vừa cài xong ⇒ không ai sửa tay")

        f = tmp / "references" / "format.md"
        f.write_bytes(f.read_bytes() + b"\n<!-- nguoi sua tay -->\n")
        ok("references/format.md" in dg.nguoi_sua_tay(tmp),
           "sửa tay MỘT file ⇒ phát hiện được")

        ma, _ = dg.cai(tmp, ghi_de=False)
        ok(ma != 0, "cài lại KHÔNG có --ghi-de ⇒ DỪNG (mã khác 0)")
        ok(f.read_bytes().endswith(b"<!-- nguoi sua tay -->\n"),
           "bản người sửa còn NGUYÊN sau lần dừng đó",
           "dừng mà vẫn ghi mất một phần thì lời hứa là giả")

        ma, _ = dg.cai(tmp, ghi_de=True)
        ok(ma == 0 and not dg.so_sanh(tmp)["lech"],
           "có --ghi-de ⇒ cài đè và khớp nguồn trở lại")


def trong_ci():
    print("\nCổng nằm trong CI, và không nuốt lỗi (M04-R1)\n")
    y = (GOC / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    ok("core/tests/check_skill.py" in y, "`ci.yml` có chạy `check_skill.py`")
    d = [l for l in y.splitlines() if "check_skill.py" in l]
    ok(d and not any("|| true" in l or "continue-on-error" in l for l in d),
       "bước đó không `|| true`, không `continue-on-error`", "; ".join(d))


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--kiem-nguon" in a:
        kiem_nguon()
    elif "--tu-kiem" in a:
        tu_kiem()
    elif "--ca-am-ghi-de" in a:
        ca_am_ghi_de()
    elif "--trong-ci" in a:
        trong_ci()
    else:
        cong_chinh()
    print("\n" + "-" * 56)
    if loi:
        for x in loi:
            print("  -", x)
        sys.exit(f"CHECK_SKILL ĐỎ — {len(loi)} lỗi")
    print("check_skill: bản đã cài là bản sinh ra từ repo")
