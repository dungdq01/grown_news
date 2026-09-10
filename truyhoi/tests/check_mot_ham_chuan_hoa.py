#!/usr/bin/env python3
r"""AC-3.1 · AC-3.4 · M13-R1 — MỘT hàm `chuan_hoa_tim`, gọi ở ĐÚNG hai chỗ (dựng chỉ mục ·
nhận truy vấn); 0 import từ `chungcat/`; dải Hán đọc từ `core/assets/dai-han.json`, 0 regex
gõ tay; thiếu bảng khai ⇒ đỏ NÓI TÊN FILE, không rơi về dải mặc định (FR-077 H3 · H5).

Đo bằng AST trên `truyhoi/src` (đã lột comment/docstring):
  · đúng 1 `def chuan_hoa_tim`
  · số call-site `chuan_hoa_tim(` ngoài file định nghĩa = 2 (indexer · rank/api)
  · 0 `import chungcat` / `from chungcat`
  · 0 literal dải Hán: `0x4E00`, `0x3400`, `一`, `一-龥`, `鿿` …
  · bản thứ hai của phép chuẩn hoá (một hàm khác gọi `normalize("NFC"` + `.lower(`) ⇒ đỏ
Runtime: chạy `python -c "import chuan_hoa"` với `TRUYHOI_DAI_HAN` trỏ file KHÔNG tồn tại
⇒ exit ≠ 0 và stderr nêu đường dẫn đó.

ĐỎ_KHI  bất kỳ vế nào trên sai
XANH_KHI cả năm vế AST + vế runtime đúng
--tu-kiem: gieo cây mã tạm có `from chungcat.verify import chuan_hoa`, một regex `[一-鿿]`,
           và một def chuẩn hoá thứ hai ⇒ soi ra đúng ba lỗi.
"""
import ast
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _khung as K  # noqa: E402
import _nap  # noqa: E402

CONG = "check_mot_ham_chuan_hoa.py"
LITERAL_HAN = re.compile(r"0x4[Ee]00|0x3400|0x[Ff]900|0x20000|\\u4[Ee]00|\\u9[Ff][Ff][Ff]|\\u3400|\\U00020000|[一-鿿]-|-[一-鿿]")


def soi(nguon: dict[str, str], cay: dict[str, ast.Module]) -> dict:
    kq = {"def": [], "goi": [], "import_chungcat": [], "literal_han": [], "ban_thu_hai": []}
    for f, mod in cay.items():
        for node in ast.walk(mod):
            if isinstance(node, ast.FunctionDef) and node.name == "chuan_hoa_tim":
                kq["def"].append(f)
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                ten = [a.name for a in node.names] + ([node.module] if isinstance(node, ast.ImportFrom) and node.module else [])
                if any(t and t.split(".")[0] == "chungcat" for t in ten):
                    kq["import_chungcat"].append(f"{f}:{node.lineno}")
            if isinstance(node, ast.Call) and getattr(node.func, "id", getattr(node.func, "attr", "")) == "chuan_hoa_tim":
                kq["goi"].append(f"{f}:{node.lineno}")
            # bản thứ hai: một def KHÁC tên vừa NFC vừa .lower() vừa đ→d — đúng ba bước của
            # chuan_hoa_tim. `anchor.slug` dùng NFD (luật slug, mục đích khác) nên KHÔNG tính.
            if isinstance(node, ast.FunctionDef) and node.name != "chuan_hoa_tim":
                src = ast.unparse(node)
                if "'NFC'" in src and ".lower()" in src and "'đ'" in src:
                    kq["ban_thu_hai"].append(f"{f}:{node.lineno} def {node.name}")
    for f, txt in nguon.items():
        for i, dong in enumerate(txt.splitlines(), 1):
            if LITERAL_HAN.search(dong):
                kq["literal_han"].append(f"{f}:{i}")
    return kq


if K.TU_KIEM:
    print("\ntu-kiem · soi mã phải ĐỎ ĐƯỢC trên cây mã cố-tình-hỏng\n")
    with K.tam("gn_m13_r1_") as tmp:
        (tmp / "a.py").write_text(
            'import unicodedata\nfrom chungcat.verify import chuan_hoa\n'
            'def chuan_hoa_tim(s):\n    return unicodedata.normalize("NFC", s).lower().replace("đ", "d")\n'
            'def chuan_hoa_khac(s):\n    return unicodedata.normalize("NFC", s).lower().replace("đ", "d")\n'
            'HAN = "[\\u4e00-\\u9fff]"\n', encoding="utf-8")
        (tmp / "b.py").write_text('from a import chuan_hoa_tim\nx = chuan_hoa_tim("a")\ny = chuan_hoa_tim("b")\nz = chuan_hoa_tim("c")\n', encoding="utf-8")
        kq = soi(K.nguon_src(tmp), K.cay_ast(tmp))
        K.kiem(kq["import_chungcat"], "import chungcat ⇒ bắt được", str(kq))
        K.kiem(kq["literal_han"], "regex Hán gõ tay ⇒ bắt được")
        K.kiem(kq["ban_thu_hai"] and "chuan_hoa_khac" in kq["ban_thu_hai"][0], "bản chuẩn hoá thứ hai ⇒ bắt được, nêu tên")
        K.kiem(len(kq["goi"]) == 3, "đếm được 3 call-site (≠2 ⇒ đỏ ở phần chính)", str(kq["goi"]))
    K.tu_kiem_xong(CONG, 4)

print("\n1 · AST — một hàm, hai chỗ gọi, 0 chungcat, 0 regex Hán tay, 0 bản thứ hai\n")
nguon, cay = K.nguon_src(), K.cay_ast()
K.kiem(bool(cay), "truyhoi/src có mã", "T13-3 chưa dựng")
kq = soi(nguon, cay)
K.kiem(len(kq["def"]) == 1, "đúng MỘT `def chuan_hoa_tim`", str(kq["def"]))
K.kiem(len(kq["goi"]) == 2 and len({g.split(":")[0] for g in kq["goi"]}) == 2,
       "gọi ở đúng HAI chỗ, hai file (dựng chỉ mục · nhận truy vấn)", str(kq["goi"]))
K.kiem(not kq["import_chungcat"], "0 import từ chungcat/ (hai hàm khác nghĩa — M13-R1)", str(kq["import_chungcat"]))
K.kiem(not kq["literal_han"], "0 literal dải Hán trong mã — dải đọc từ dai-han.json (FR-077 H3)", str(kq["literal_han"]))
K.kiem(not kq["ban_thu_hai"], "0 bản thứ hai của phép chuẩn hoá", str(kq["ban_thu_hai"]))

try:
    chuan_hoa = _nap.nap("chuan_hoa")
except (_nap.ThieuMa, _nap.ThieuGoi) as e:
    _nap.bao_do_va_thoat(e, CONG, "T13-3")

print("\n2 · hành vi: NFC → lower → đ→d → cách quanh Hán → gom space\n")
f = chuan_hoa.chuan_hoa_tim
# Dấu thanh GIỮ NGUYÊN — fold dấu là việc của tokenizer (`remove_diacritics 2`); hàm chỉ lo
# `đ` (tokenizer không fold được) và chữ Hán. Bản đầu của vế này mong `duong ong` — sai spec §3.
K.kiem(f("Đường  Ống") == "dường ống", "`Đường  Ống` ⇒ `dường ống` (lower · đ→d · gom space · dấu GIỮ)", repr(f("Đường  Ống")))
K.kiem(f("é") == f("é") == "é", "NFD → NFC (dấu giữ, không bỏ — tokenizer lo fold dấu)", repr(f("é")))
K.kiem(f("Kết hợp 資料管線 với pipeline") == "kết hợp 資 料 管 線 với pipeline", "chèn cách quanh MỖI chữ Hán", repr(f("Kết hợp 資料管線 với pipeline")))
K.kiem(f("ひらがな") == "ひらがな", "Hiragana KHÔNG bị chèn cách (không phải Hán — FR-077 H4)", repr(f("ひらがな")))
K.kiem(f("𠀀x") == "𠀀 x", "chữ ngoài BMP (Ext B) vẫn được chèn cách", repr(f("𠀀x")))

print("\n3 · thiếu dai-han.json ⇒ đỏ NÓI TÊN FILE, không dải mặc định (H5)\n")
vang = str(Path(K.R) / "core" / "assets" / "KHONG-CO-dai-han.json")
r = subprocess.run([sys.executable, "-c", "import chuan_hoa; print(chuan_hoa.chuan_hoa_tim('資料'))"],
                   cwd=str(K.SRC), env={**os.environ, "TRUYHOI_DAI_HAN": vang, "PYTHONIOENCODING": "utf-8"},
                   capture_output=True, text=True, encoding="utf-8")
K.kiem(r.returncode != 0, "tiến trình đỏ khi bảng khai vắng", f"exit {r.returncode}, stdout={r.stdout.strip()!r}")
K.kiem("dai-han.json" in (r.stderr or ""), "stderr nêu tên file bảng khai", (r.stderr or "")[-200:])

K.chot("một hàm chuan_hoa_tim · hai chỗ gọi · dải Hán từ bảng khai · thiếu bảng thì đỏ nói tên")
