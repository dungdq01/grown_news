#!/usr/bin/env python3
"""FR-038/C1 — HAI TẬP khai MỘT nơi: loại nguồn và màn hình.

VÌ SAO CỔNG NÀY TỒN TẠI, bằng số đo:

  `LOAI` (7 giá trị `source_type`) gõ tay ở BỐN nơi —
    core/assets/kho.schema.sql:33-36 · core/tools/xuat_kho.py:37 ·
    core/tools/dung_lai_db.py:42 · web/api/dungchung.mjs:50-51
  Bảng màn gõ tay ở BA nơi —
    web/server.mjs:149 (VIEW_SSR) · web/render/trang.mjs:901 (MAN) ·
    web/plugins/multiwindow/src/scripts/multiwindow.inline.ts:1389 (DUONG)

Và bốn tên cho CÙNG một màn đang khác nhau: slug URL `khai-niem` ≠ id shell
`concepts` ≠ tiêu đề "Danh mục". Đó là chỗ đã trôi, không phải chỗ có thể trôi.

CỔNG THEO DÕI: §3 CỐ Ý ĐỎ tới khi C5 đấu xong consumer. A1 của FR-036 dùng đúng
khuôn này — một cổng chỉ xanh sau khi việc xong là cổng nói được "việc chưa
xong"; một cổng thêm SAU khi xong là cổng chưa bao giờ đỏ.

DDL là NGOẠI LỆ khai rõ: SQL không đọc được JSON, nên `kho.schema.sql` giữ bản
CƯỠNG CHẾ (CHECK) còn `loai-nguon.json` là bản TRA CỨU. Cổng so hai bản khớp
nhau thay vì cấm bản thứ hai.
"""
import json
import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
LOAI_JSON = R / "core" / "assets" / "loai-nguon.json"
MAN_JSON = R / "core" / "assets" / "man-hinh.json"
SCHEMA = R / "core" / "assets" / "frontmatter.schema.json"

loi = []
theo_doi = []          # §3 — cố ý đỏ tới C5, tách khỏi lỗi thật


def ok(dk, ten, ct="", canh=False):
    print(f"  {'ok  ' if dk else ('CHỜ ' if canh else 'FAIL')} {ten}"
          + ("" if dk else f"  {ct}"))
    if not dk:
        (theo_doi if canh else loi).append(ten)


def doc(p):
    if not p.exists():
        loi.append(f"thiếu {p.relative_to(R)}")
        print(f"  FAIL thiếu {p.relative_to(R)}")
        return None
    # Lột `$comment*` — chúng là cho NGƯỜI đọc file khai, không phải dữ liệu.
    def lot(o):
        if isinstance(o, list):
            return [lot(x) for x in o]
        if isinstance(o, dict):
            return {k: lot(v) for k, v in o.items() if not k.startswith("$comment")}
        return o
    return lot(json.loads(p.read_text(encoding="utf-8")))


print("\n1 · loai-nguon.json — một loại thuộc ĐÚNG một module\n")

ln = doc(LOAI_JSON)
if ln:
    mods = ln.get("module") or []
    ok(len(mods) == 3, f"khai đúng 3 module (được {len(mods)})",
       ", ".join(m.get("ten", "?") for m in mods))

    # Một loại thuộc hai module là mâu thuẫn KHÔNG thể giải: định tuyến INSERT
    # sẽ chọn bản đầu tiên, im lặng, và bản ghi vào sai bảng.
    thuoc = {}
    trung = []
    for m in mods:
        for l in m.get("loai", []):
            if l in thuoc:
                trung.append(f"{l} ∈ {thuoc[l]} và {m['ten']}")
            thuoc[l] = m.get("ten")
    ok(not trung, "không loại nào thuộc hai module", " · ".join(trung))

    # Hợp ba module PHẢI bằng enum của schema — đọc TỪ SCHEMA, không gõ 7 giá trị
    # vào cổng. Gõ vào đây là bản thứ năm.
    sch = json.loads(SCHEMA.read_text(encoding="utf-8"))
    enum = set(sch["properties"]["source_type"]["enum"])
    ok(set(thuoc) == enum,
       f"hợp ba module == enum `source_type` của schema ({len(enum)} giá trị)",
       f"thiếu {sorted(enum - set(thuoc))} · thừa {sorted(set(thuoc) - enum)}")

    bangs = [m.get("bang") for m in mods]
    ok(len(set(bangs)) == len(bangs), "mỗi module một bảng riêng", ", ".join(map(str, bangs)))
    ok(all(m.get("nhan") for m in mods), "mỗi module có nhãn hiển thị")

print("\n2 · man-hinh.json — bảy màn, và `data_nav` thuần [a-z]\n")

mh = doc(MAN_JSON)
if mh:
    man = mh.get("man") or []
    for khoa in ("path", "id_shell", "data_nav"):
        gt = [m.get(khoa) for m in man if m.get(khoa) is not None]
        ok(len(set(gt)) == len(gt), f"`{khoa}` duy nhất từng cái",
           f"trùng: {[x for x in gt if gt.count(x) > 1]}")

    # `data_nav` PHẢI thuần [a-z]. Đây KHÔNG phải sở thích: hai regex
    # `rail-trai.test.js:137` và `:167` bắt `data-nav="[a-z]+"`. Tên có gạch nối
    # KHÔNG khớp ⇒ nhãn lặng lẽ ra khỏi phép đo, và `soTab >= 4` ở `:172` TỤT
    # xuống rồi ĐỎ. Một phép kiểm tự vô hiệu là thứ tệ hơn một phép kiểm đỏ.
    xau = [m["data_nav"] for m in man
           if m.get("data_nav") and not re.fullmatch(r"[a-z]+", m["data_nav"])]
    ok(not xau, "`data_nav` thuần [a-z] — ràng buộc rail-trai.test.js:137/:167",
       f"có gạch nối/số: {xau}")

    dai = [(m.get("data_nav"), m.get("nhan")) for m in man
           if m.get("nhan") and len(m["nhan"]) > 9]
    ok(not dai, "nhãn ≤ 9 ký tự (rail-trai.test.js:141)", str(dai))

    menu = [m for m in man if m.get("menu")]
    # 7 → 8 (2026-09-05): chủ dự án yêu cầu `/chung-cat/` vào menu — *"Mở menu
    # /chung-cat/ cũng ko thấy trong danh sách?"*. Nó vào nhóm `hethong`, cạnh
    # Kho và Danh mục, nên phép đếm nhóm NỘI DUNG dưới đây KHÔNG đổi: hợp đồng
    # ba-module (Tổng hợp + đúng ba loại) vẫn nguyên.
    ok(len(menu) == 8, f"đúng 8 màn thuộc thanh menu (được {len(menu)})",
       ", ".join(m.get("nhan", "?") for m in menu))

    nhom = {m.get("nhom") for m in menu}
    ok(nhom == {"noidung", "hethong"}, "hai nhóm: noidung · hethong", str(nhom))
    ok(len([m for m in menu if m.get("nhom") == "noidung"]) == 4,
       "nhóm NỘI DUNG có 4 mục — Tổng hợp · Bài viết · Tài liệu · Video")

    tron = [m.get("data_nav") for m in man if m.get("tron")]
    ok(set(tron) >= {"all", "kho"},
       "Tổng hợp và Kho là màn TRỘN (yêu cầu người dùng)", str(tron))
    ktron = [m.get("data_nav") for m in man
             if m.get("nhom") == "noidung" and not m.get("tron")]
    ok(len(ktron) == 3, "ba màn loại KHÔNG trộn", str(ktron))

    # Màn của loại phải trỏ đúng module trong loai-nguon.json
    if ln:
        tenmod = {m.get("ten") for m in (ln.get("module") or [])}
        sai = [m.get("data_nav") for m in man
               if m.get("module") and m["module"] not in tenmod]
        ok(not sai, "`module` của màn loại trỏ đúng loai-nguon.json", str(sai))

print("\n3 · KHÔNG bản gõ tay thứ hai  (cố ý CHỜ tới C5)\n")

if ln:
    tap_loai = sorted(thuoc)
    # Ba file CODE không được liệt tập loại. DDL là ngoại lệ — so khớp, không cấm.
    for f in ("core/tools/xuat_kho.py", "core/tools/dung_lai_db.py",
              "web/api/dungchung.mjs"):
        p = R / f
        t = p.read_text(encoding="utf-8") if p.exists() else ""
        # Đếm: file có liệt ĐỦ 7 giá trị trên một dòng/khối liền nhau?
        co = sum(1 for l in tap_loai if f'"{l}"' in t or f"'{l}'" in t)
        ok(co < len(tap_loai),
           f"{f} không liệt cả {len(tap_loai)} loại",
           f"thấy {co}/{len(tap_loai)} — phải đọc loai-nguon.json", canh=True)

    ddl = (R / "core" / "assets" / "kho.schema.sql")
    if ddl.exists():
        dt = ddl.read_text(encoding="utf-8")
        # DDL PHẢI liệt (CHECK là bản cưỡng chế) — nhưng phải KHỚP bảng khai.
        trong_ddl = {l for l in tap_loai if f"'{l}'" in dt}
        ok(trong_ddl == set(tap_loai),
           "DDL liệt ĐÚNG tập loại của bảng khai (bản cưỡng chế, khớp bản tra cứu)",
           f"lệch: {sorted(set(tap_loai) ^ trong_ddl)}")

if mh:
    tap_nav = sorted(m["data_nav"] for m in man if m.get("data_nav"))
    for f in ("web/server.mjs", "web/render/trang.mjs",
              "web/plugins/multiwindow/src/scripts/multiwindow.inline.ts"):
        p = R / f
        t = p.read_text(encoding="utf-8") if p.exists() else ""
        co = sum(1 for v in tap_nav if f'"{v}"' in t or f"'{v}'" in t)
        ok(co < len(tap_nav), f"{f} không liệt cả {len(tap_nav)} màn",
           f"thấy {co}/{len(tap_nav)} — phải đọc man-hinh.json", canh=True)

print()
print("4 · Chiều NGƯỢC — mỗi tầng phải ĐỌC bảng khai")

# Vì sao cần chiều này: §3 chỉ hỏi "có gõ tay không". Ba phép kiểm về MÀN ở §3
# đang xanh VÔ CĂN CỨ — chúng xanh vì màn mới CHƯA TỒN TẠI, không vì ai đó đọc
# bảng khai. Một phép kiểm xanh vì đối tượng chưa có là phép kiểm chưa được thử.
for f, ten_bang in (
    ("core/tools/xuat_kho.py", "loai-nguon.json"),
    ("core/tools/dung_lai_db.py", "loai-nguon.json"),
    ("05_intake/gate.py", "loai-nguon.json"),
    ("web/api/dungchung.mjs", "loai-nguon.json"),
    ("web/server.mjs", "man-hinh.json"),
    ("web/render/trang.mjs", "man-hinh.json"),
):
    p2 = R / f
    t2 = p2.read_text(encoding="utf-8") if p2.exists() else ""
    # Tên bảng khai phải nằm trên một dòng CŨNG CÓ lệnh mở file. Trước đây phép
    # kiểm này là `ten_bang in t2` — tìm chuỗi trên CẢ FILE — nên một dòng bình
    # luận `// bảng màn khai ở core/assets/man-hinh.json` làm nó xanh mà không ai
    # đọc gì. Một phép kiểm không phân biệt được bình luận với lệnh đọc thì vô
    # dụng đúng lúc nó cần có tác dụng.
    doc_that = [d for d in t2.splitlines()
                if ten_bang in d
                and any(x in d for x in ("readFileSync", "join(", "read_text"))]
    ok(bool(doc_that), f"{f} ĐỌC `{ten_bang}`",
       ("có nhắc tên nhưng không nằm trong biểu thức đường dẫn — bình luận không "
        "phải lệnh đọc") if ten_bang in t2 else
       "chưa đọc — consumer đấu ở C2/C3/C5", canh=True)

# FE đọc qua `define` của build-fe (cùng đường đã mở cho __KHUNG__/__MEDIA__),
# nên nó nhắc tên biến chứ không nhắc tên file.
bf = (R / "web" / "build-fe.mjs")
t3 = bf.read_text(encoding="utf-8") if bf.exists() else ""
nhung = {ten: [d for d in t3.splitlines()
               if ten in d and any(x in d for x in ("readFileSync", "join("))]
         for ten in ("loai-nguon.json", "man-hinh.json")}
ok(all(nhung.values()),
   "build-fe.mjs nhúng CẢ HAI bảng vào bundle qua `define`",
   f"chưa nhúng: {[k for k, v in nhung.items() if not v]} — FE đấu ở C5/C6",
   canh=True)

print()
print("5 · Ca ÂM — phá bảng khai thì cổng phải ĐỎ")

# Cổng không tự chứng minh mình bằng cách xanh. Ba ca dưới đây phá bản khai TRONG
# BỘ NHỚ (không ghi file) rồi đòi đúng phép kiểm bắt được.
def thu_am(ten, sua_ln, sua_mh, mong):
    l2 = json.loads(json.dumps(ln)) if ln else None
    m2 = json.loads(json.dumps(mh)) if mh else None
    if sua_ln and l2: sua_ln(l2)
    if sua_mh and m2: sua_mh(m2)
    bat = []
    if l2:
        th = {}
        for m in l2.get("module", []):
            for l in m.get("loai", []):
                if l in th: bat.append("loai-trung")
                th[l] = m["ten"]
    if m2:
        man2 = m2.get("man", [])
        if any(v.get("data_nav") and not re.fullmatch(r"[a-z]+", v["data_nav"])
               for v in man2): bat.append("nav-co-gach")
        if any(v.get("nhan") and len(v["nhan"]) > 9 for v in man2): bat.append("nhan-dai")
        ps = [v.get("path") for v in man2 if v.get("path")]
        if len(set(ps)) != len(ps): bat.append("path-trung")
    ok(mong in bat, f"ca âm `{ten}` bị bắt", f"bắt được: {bat or 'KHÔNG GÌ'}")

thu_am("một loại thuộc hai module",
       lambda d: d["module"][1]["loai"].append("paper"), None, "loai-trung")
thu_am("data_nav có gạch nối", None,
       lambda d: d["man"][2].update(data_nav="bai-viet"), "nav-co-gach")
thu_am("nhãn 10 ký tự", None,
       lambda d: d["man"][0].update(nhan="Dashboard!"), "nhan-dai")
thu_am("hai màn cùng path", None,
       lambda d: d["man"][3].update(path="/bai-viet/"), "path-trung")

print()
print("6 · dai-han.json — dải ký tự Hán khai MỘT nơi (FR-077 H1 · H2 · H4 — T01-52 lượt hai)")
print()

# Tập khai THỨ BA cùng khuôn: hai THỢ (M13 chèn cách khi index · M12 đếm tỉ lệ định tuyến) đọc
# một bảng ở LÕI, không THỢ nào gõ dải riêng (FR-077 §1.2). Bảng giữ dạng SỐ, không regex.
DAI_HAN_JSON = R / "core" / "assets" / "dai-han.json"
KHONG_GOM = ((0x3040, 0x30FF, "Hiragana/Katakana"), (0xAC00, 0xD7AF, "Hangul"))


def soi_dai_han(dai):
    """Danh sách lỗi H1/H2/H4 trên `dai` (list dict đã lột `$comment`, nhưng còn `$vi_sao`)."""
    loi_dh = []
    if len(dai) < 4:
        loi_dh.append(f"H1: chỉ {len(dai)} dải, cần ≥4")
    for i, d in enumerate(dai):
        thieu = [k for k in ("tu", "den", "ten") if k not in d]
        if thieu:
            loi_dh.append(f"H1: dải {i} thiếu {thieu}")
            continue
        if not (isinstance(d["tu"], int) and isinstance(d["den"], int)):
            loi_dh.append(f"H1: dải {i} `tu`/`den` phải là SỐ codepoint, không phải chuỗi regex")
        elif d["tu"] > d["den"]:
            loi_dh.append(f"H1: dải {i} ngược đầu-cuối ({d['tu']:#x} > {d['den']:#x})")
        for a, b, ten in KHONG_GOM:
            if isinstance(d.get("tu"), int) and d["tu"] <= b and d["den"] >= a:
                loi_dh.append(f"H4: dải {i} `{d['ten']}` giao {ten} ({a:#x}–{b:#x}) — không phải chữ Hán")
    sap = [d for d in dai if isinstance(d.get("tu"), int) and isinstance(d.get("den"), int)]
    for x, y in zip(sap, sap[1:]):
        if y["tu"] <= x["den"]:
            loi_dh.append(f"H2: dải `{x['ten']}` và `{y['ten']}` chồng nhau hoặc không sắp tăng")
    return loi_dh


dh_tho = json.loads(DAI_HAN_JSON.read_text(encoding="utf-8")) if DAI_HAN_JSON.exists() else None
dh = doc(DAI_HAN_JSON)
if dh:
    dai = dh.get("dai") or []
    loi_dh = soi_dai_han(dai)
    ok(not loi_dh, f"H1·H2·H4 trên {len(dai)} dải", " · ".join(loi_dh))
    ok(all("$vi_sao" in d for d in (dh_tho or {}).get("dai", [])), "H1: mỗi dải có `$vi_sao`")
    ok("nguong_han" not in dh and "nguong" not in dh, "bảng không chứa ngưỡng tỉ lệ (FR-077 §3.2 — ngưỡng sống ở chungcat/assets)")
    # Ca ÂM trong bộ nhớ — cổng phải ĐỎ ĐƯỢC (không ghi file).
    goc_dai = json.loads(json.dumps(dai))
    nguoc = json.loads(json.dumps(goc_dai)); nguoc[0]["tu"], nguoc[0]["den"] = nguoc[0]["den"], nguoc[0]["tu"]
    ok(any("H1" in x and "ngược" in x for x in soi_dai_han(nguoc)), "ca âm `dải ngược đầu-cuối` bị bắt")
    giao = json.loads(json.dumps(goc_dai)); giao[1]["tu"] = goc_dai[0]["den"] - 1
    ok(any("H2" in x for x in soi_dai_han(giao)), "ca âm `hai dải giao nhau` bị bắt")
    noi = json.loads(json.dumps(goc_dai)); noi.append({"tu": 0x3040, "den": 0x30FF, "ten": "Kana"})
    ok(any("H4" in x for x in soi_dai_han(noi)), "ca âm `nới sang Hiragana` bị bắt (H4)")
    chuoi = json.loads(json.dumps(goc_dai)); chuoi[0]["tu"] = "\\u3400"
    ok(any("SỐ codepoint" in x for x in soi_dai_han(chuoi)), "ca âm `dải ghi bằng chuỗi regex` bị bắt (FR-077 §3.4)")

print()
if theo_doi:
    print(f"CHỜ · {len(theo_doi)} mục — consumer đấu vào ở C2/C3/C5, CỐ Ý đỏ tới đó:")
    for x in theo_doi:
        print("  ·", x)
if loi:
    print(f"\nFAIL · {len(loi)} lỗi THẬT:")
    for x in loi:
        print("  -", x)
    sys.exit(1)
if theo_doi:
    sys.exit(f"\n{len(theo_doi)} mục CHỜ — bảng khai đúng, consumer chưa đấu")
print("pass · hai tập khai một nơi, mọi tầng đọc bảng khai")
