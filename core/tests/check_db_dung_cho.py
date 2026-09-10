#!/usr/bin/env python3
"""Rang cho M08-R6 + M18-R2 (ve cho o) — ADR-06, 2026-09-02.

Ba ve, va CHI ba ve. Cong nay kiem CHO O cua du lieu, khong kiem hanh vi runtime.

  1 · kho.schema.sql KHONG duoc khai mot bang du lieu GOC
  2 · moi file .sqlite/.db phai nam trong thu muc cua backend so huu no
  3 · ba bang phai-xuat co duong export; hai bang khong-xuat thi KHONG

Ve 3 chi kiem duoc KHI bang da ton tai. Hom nay chua co bang nao trong nam, nen
no BO QUA CO THONG BAO — khong xanh im lang. Mot cong xanh vi "chua co gi de
kiem" ma khong noi ra la dung thu M17 AC-3.4 goi la CONG XANH RONG: no lam
nguoi ta tin.

Vi sao ve 1 ton tai (ADR-06):
  dung_lai_db.py:139-140 XOA kb/_kho.sqlite roi dung lai TU FILE — docstring cua
  chinh no: "DB khong co lich su". Nen mot bang du lieu GOC nam trong do la mot
  bang BI XOA SACH moi lan chay lenh do, va lenh do khong hiem: _api.mjs goi
  trong test, B-C1 khai no la duong file->DB duy nhat, va no la buoc 2 cua T02-4.
  Hau qua: 5 tai khoan + moi chat_id da buoc + moi phien + moi ban nhap dang do
  -> mat, IM LANG.

Chay `--tu-kiem` de cong tu chung minh no DO DUOC: no dung schema gia trong thu
muc TAM va doi chinh minh do tren do. Khong sua file that de thu mot cong
(CLAUDE.md CAM) — thao tac *hoan tac* la cho mat du lieu.
"""
import json
import re
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Bang DU LIEU GOC: khong dung lai duoc tu file .md/.yaml.
# Nguon: FR-045 (bon bang) + FR-046 (nhap_chung_cat) + ADR-06 bang chu.
DU_LIEU_GOC = {
    "nguoi_dung": "M18_nguoidung",
    "ma_moi": "M18_nguoidung",
    "dinh_danh_kenh": "M18_nguoidung",
    "phien": "M18_nguoidung",
    "nhap_chung_cat": "M12_chungcat",
}

# ADR-06 (c) — ba bang PHAI xuat ra file, hai bang KHONG xuat trang thai.
PHAI_XUAT = {"nguoi_dung", "dinh_danh_kenh", "nhap_chung_cat"}
KHONG_XUAT = {"ma_moi", "phien"}

loi = []
bo_qua = []


def bang_trong(schema_sql: str) -> set[str]:
    """Ten bang/view khai trong mot file schema."""
    return {
        m.group(1)
        for m in re.finditer(
            r"CREATE\s+(?:TABLE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)",
            schema_sql,
            re.I,
        )
    }


# ═══ 1 · kho.schema.sql khong duoc khai bang du lieu GOC ═══════════════
def ve1(schema_path: Path) -> list[str]:
    if not schema_path.exists():
        return [f"khong tim thay {schema_path}"]
    co = bang_trong(schema_path.read_text(encoding="utf-8"))
    return [
        f"`{t}` (chu: {DU_LIEU_GOC[t]}) khai trong {schema_path.name} — "
        f"dung_lai_db.py XOA DB do roi dung lai TU FILE, nen bang nay BI XOA SACH"
        for t in sorted(co & set(DU_LIEU_GOC))
    ]


# ═══ 2 · .sqlite phai nam trong thu muc backend so huu no ══════════════
# LUOT DAU TOI VIET SAI VE NAY, va no DO OAN tren repo dung.
#   Toi lay tap thu muc hop le tu `dich-vu.json` (bay dich vu). Nhung `kb/`
#   KHONG phai mot dich vu — no la nha cua M02_kb, mot module DU LIEU khong co
#   tien trinh nao. Ket qua: cong bao kb/_kho.sqlite "sai cho", trong khi
#   ADR-06 noi thang no la vi du cua chuyen DUNG cho.
#   => Chu cua mot DB la mot MODULE, khong phai mot DICH VU. Nguon dung la
#      project_map.modules.*.be. dich-vu.json chi phu bay dich vu co tien trinh.
def _goc(mau: str) -> str:
    """`kb/**` -> `kb` · `web/api/**` -> `web` · `06_modules/Mxx/**` -> bo qua."""
    return mau.split("/", 1)[0]


def thu_muc_so_huu(mp: dict, root: Path) -> set[str]:
    """Moi THU MUC goc ma mot module khai la `be` cua no.

    Loc hai thu: `06_modules` (chi chua tai lieu) va moi mau tro toi mot FILE
    (`Makefile`, `FROZEN.lock`). Khong loc thi tap "hop le" phinh ra va cong
    thanh gan nhu khong tu choi gi — mot cong khong tu choi duoc la mot cong
    khong ton tai.
    """
    ra = set()
    for m in mp.get("modules", {}).values():
        be = m.get("be") or []
        for mau in [be] if isinstance(be, str) else be:
            g = _goc(str(mau))
            if g and g != "06_modules" and (root / g).is_dir():
                ra.add(g)
    return ra


def ve2(root: Path, thu_muc_hop_le: set[str]) -> list[str]:
    ra = []
    for f in sorted(root.rglob("*.sqlite")) + sorted(root.rglob("*.db")):
        if "node_modules" in f.parts or ".git" in f.parts:
            continue
        rel = f.relative_to(root)
        if not rel.parts or rel.parts[0] not in thu_muc_hop_le:
            ra.append(
                f"`{rel.as_posix()}` khong nam trong thu muc cua mot backend da "
                f"khai (hop le: {', '.join(sorted(thu_muc_hop_le))})"
            )
    return ra


# ═══ 3 · duong export — chi kiem duoc KHI bang da ton tai ══════════════
def ve3() -> tuple[list[str], list[str]]:
    """Tra (loi, bo_qua). Bang chua ton tai => bo qua CO THONG BAO."""
    # HAI exporter, khong mot. xuat_kho.py xuat tu kb/_kho.sqlite; DB cua LOI
    # la mot DB KHAC nen co duong xuat rieng (T08-13, web/api/dungchung.mjs).
    xk = ROOT / "core/tools/xuat_kho.py"
    dc = ROOT / "web/api/dungchung.mjs"
    thieu_file = [str(f) for f in (xk, dc) if not f.exists()]
    if thieu_file:
        return ([f"khong tim thay {', '.join(thieu_file)}"], [])

    # Do KHOI KHAI EXPORT, khong grep ca file.
    #
    # Luot dau toi grep ten bang tren TOAN BO noi dung hai file va no DO OAN:
    # dungchung.mjs nhac `ma_moi` va `phien` o cac thao tac C6/C7 — do la CUA
    # TRA, khong phai duong XUAT. "Ten xuat hien trong file exporter" khong
    # dong nghia "bang duoc xuat"; voi xuat_kho.py phep do do dung vi file do
    # CHI la exporter, con voi dungchung.mjs thi sai vi no lam moi thu.
    m = re.search(r"XUAT_LOI\s*=\s*\[(.*?)^\]", dc.read_text(encoding="utf-8"),
                  re.S | re.M)
    khai_loi = m.group(1) if m else ""
    txt = xk.read_text(encoding="utf-8") + "\n" + khai_loi

    # Bang nao DA TON TAI? Gop schema cua ca hai DB — kho (core/assets) va
    # DB rieng cua LOI (web/api/loi.schema.sql, T08-11).
    schema_tat: set[str] = set()
    for sp in [ROOT / "core/assets/kho.schema.sql", *sorted((ROOT / "web").rglob("*.schema.sql"))]:
        if sp.exists():
            schema_tat |= bang_trong(sp.read_text(encoding="utf-8"))

    e, bq = [], []
    for t in sorted(PHAI_XUAT):
        if t not in schema_tat:
            bq.append(f"`{t}` — bang CHUA TON TAI, chua kiem duoc duong export")
        elif not re.search(rf"\b{t}\b", txt):
            e.append(f"`{t}` PHAI xuat ra file (ADR-06 c) nhung KHONG exporter nao khai")
    for t in sorted(KHONG_XUAT):
        if t not in schema_tat:
            bq.append(f"`{t}` — bang CHUA TON TAI, chua kiem duoc la no khong bi xuat")
        elif re.search(rf"\b{t}\b", txt):
            e.append(
                f"`{t}` KHONG duoc xuat trang thai ra file (ADR-06 c) nhung mot "
                f"exporter co khai — ma la bi mat, phien la session"
            )
    return e, bq


# ═══ --tu-kiem: cong tu chung minh no DO DUOC ══════════════════════════
def tu_kiem() -> int:
    """Dung fixture trong thu muc TAM. Khong cham mot file that nao."""
    xau = 0
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)

        # ca A — schema khai mot bang du lieu GOC => ve1 PHAI do
        bad = tmp / "kho.schema.sql"
        bad.write_text(
            "CREATE TABLE bai_viet (slug TEXT);\n"
            "CREATE TABLE IF NOT EXISTS nguoi_dung (id INTEGER);\n",
            encoding="utf-8",
        )
        r = ve1(bad)
        print(f"  ca A · schema co `nguoi_dung`      => {len(r)} loi", end="")
        if len(r) == 1 and "nguoi_dung" in r[0]:
            print("  ok")
        else:
            print("  SAI — ve1 khong bat duoc"); xau += 1

        # ca B — schema SACH => ve1 PHAI xanh (chong do oan)
        good = tmp / "sach.schema.sql"
        good.write_text(
            "CREATE TABLE bai_viet (slug TEXT);\n"
            "CREATE VIEW ban_ghi AS SELECT 1;\n",
            encoding="utf-8",
        )
        r = ve1(good)
        print(f"  ca B · schema sach                 => {len(r)} loi", end="")
        print("  ok" if not r else "  SAI — do oan"); xau += bool(r)

        # ca C — .sqlite ngoai thu muc backend => ve2 PHAI do
        (tmp / "linh_tinh").mkdir()
        (tmp / "linh_tinh" / "x.sqlite").write_bytes(b"")
        r = ve2(tmp, {"kb", "web"})
        print(f"  ca C · .sqlite o linh_tinh/        => {len(r)} loi", end="")
        print("  ok" if len(r) == 1 else "  SAI — ve2 khong bat duoc"); xau += len(r) != 1

        # ca D — .sqlite DUNG cho => ve2 PHAI xanh (chong do oan)
        (tmp / "kb").mkdir()
        (tmp / "linh_tinh" / "x.sqlite").unlink()
        (tmp / "kb" / "_kho.sqlite").write_bytes(b"")
        r = ve2(tmp, {"kb", "web"})
        print(f"  ca D · .sqlite o kb/               => {len(r)} loi", end="")
        print("  ok" if not r else "  SAI — do oan"); xau += bool(r)

    return xau


def main() -> int:
    if "--tu-kiem" in sys.argv:
        print("check_db_dung_cho --tu-kiem · cong tu chung minh no DO DUOC\n")
        xau = tu_kiem()
        print()
        if xau:
            return int(sys.exit(f"{xau} ca tu-kiem SAI — cong nay khong dang tin") or 1)
        print("pass · cong do duoc khi phai do, va khong do oan khi khong phai")
        return 0

    import yaml

    mp = yaml.safe_load((ROOT / "project_map.yaml").read_text(encoding="utf-8"))
    thu_muc = thu_muc_so_huu(mp, ROOT)
    # dich-vu.json phu bay dich vu CO TIEN TRINH; project_map phu ca module du
    # lieu (kb/) lan module chua dung (chungcat/ ...). Hop hai nguon vi mot
    # dich vu moi co the duoc khai o dich-vu.json truoc khi co mac trong map.
    dv = json.loads((ROOT / "core/assets/dich-vu.json").read_text(encoding="utf-8"))
    thu_muc |= {d["thu_muc"] for d in dv["dich_vu"]}

    print("1 · kho.schema.sql khong khai bang du lieu GOC\n")
    r = ve1(ROOT / "core/assets/kho.schema.sql")
    loi.extend(r)
    print("  " + ("\n  ".join(r) if r else f"ok · 0/{len(DU_LIEU_GOC)} bang goc trong schema kho"))

    print("\n2 · moi .sqlite nam trong thu muc cua backend so huu no\n")
    r = ve2(ROOT, thu_muc)
    loi.extend(r)
    print("  " + ("\n  ".join(r) if r else f"ok · thu muc hop le: {', '.join(sorted(thu_muc))}"))

    print("\n3 · duong export theo ADR-06 (c)\n")
    e, bq = ve3()
    loi.extend(e); bo_qua.extend(bq)
    for x in e:
        print("  " + x)
    for x in bq:
        print("  BO QUA · " + x)
    if not e and not bq:
        print("  ok · ba bang phai-xuat co duong export, hai bang kia khong")

    print("\n" + "-" * 56)
    if bo_qua:
        print(f"⚠ {len(bo_qua)} ve BO QUA vi bang chua ton tai — cong nay CHUA phu")
        print("  het ADR-06 (c). No se phu khi FR-047 dung DDL nam bang.")
    if loi:
        for x in loi:
            print("FAIL:", x)
        sys.exit(f"{len(loi)} vi pham cho-o du lieu (M08-R6 · M18-R2)")
    print("pass · M08-R6 co rang" + (" (mot phan — xem BO QUA)" if bo_qua else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
