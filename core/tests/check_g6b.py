#!/usr/bin/env python3
"""Điều kiện đóng G6B (s7 plan), kiểm bằng máy.

  1 · mỗi task khai phạm_vi_ghi, verifiability, tiêu_chí
  2 · phạm_vi_ghi nằm TRONG boundary module (project_map.modules.*.be/fe)
  3 · verifiability hard ⇒ mỗi AC có cmd
  4 · đồ thị phụ thuộc không có vòng
  5 · evidence plan phủ G6C: mọi AC hard của spec có task nào đó sinh ra nó
  6 · task test là đơn vị riêng (R1: đơn vị không phải test thì không chạm file test)
"""
import re, sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[2]
PLAN, MODS = ROOT / "07_plan", ROOT / "06_modules"
mp = yaml.safe_load((ROOT / "project_map.yaml").read_text(encoding="utf-8"))
fails, tasks = [], {}

# `phụ_thuộc:` là một DÒNG NGƯỜI VIẾT, không phải một trường máy sinh. Bản đầu
# lấy nguyên vế sau dấu hai chấm làm MỘT mã, nên ba dạng viết thường gặp đều
# thành "phụ thuộc treo":
#
#   phụ_thuộc: T08-22 · T08-27 · FR-057        → một mã "T08-22 · T08-27 · FR-057"
#   phụ_thuộc: —  (không chờ `FR-047`…)        → một mã "—  (không chờ…)"
#   phụ_thuộc: T08-10 (đã xong — …)            → một mã "T08-10 (đã xong — …)"
#
# Cả năm task bị tố ĐỀU TỒN TẠI. Cổng đỏ oan dạy người ta bỏ qua màu đỏ, nên
# đây là lỗi của cổng, không phải của plan.
_MA = re.compile("((?:T[0-9]{2}|FR|WO)-[0-9]+)")


def _doc_dep(t: str) -> list[str]:
    """Mã phụ thuộc trong các dòng `phụ_thuộc:`. Không có mã ⇒ rỗng.

    Rút MÃ ra khỏi dòng thay vì cắt theo dấu phân cách: người viết dùng `·`,
    dấu phẩy, và cả văn xuôi trong ngoặc. Rút theo khuôn mã thì mọi cách viết
    đều đọc được, và `—` (không phụ thuộc gì) tự nhiên ra rỗng.
    """
    ra = []
    for dong in re.findall(r"phụ_thuộc:\s*(.+)", t):
        ra += _MA.findall(dong)
    return ra

for md in sorted(PLAN.glob("*/tasks/*.md")):
    mod, t = md.parent.parent.name, md.read_text(encoding="utf-8")
    tid = md.stem.split("-")[0] + "-" + md.stem.split("-")[1]
    pv = re.search(r"phạm_vi_ghi:\n((?:\s+- .+\n)+)", t)
    vf = re.search(r"verifiability:\s*(\w+)", t)
    # ID PHẢI DUY NHẤT — và dòng dưới đây là lý do nó phải kiểm ở ĐÂY.
    #
    # `tasks[tid] = …` là một phép gán dict: file thứ hai mang cùng ID GHI ĐÈ file
    # thứ nhất, nên `phạm_vi_ghi` của file bị đè **biến mất khỏi mọi phép kiểm
    # bên dưới**. Không phải "hai phạm vi bị gộp" — là một phạm vi không ai nhìn.
    # R1 đo ở mức ID, nên ID trùng là R1 mất địa chỉ; và `phụ_thuộc: T01-8` ở file
    # khác thành câu không trả lời được: trỏ tới file nào?
    #
    # Đo được: sáu ID từng trùng (T01-8 · T01-9 · T03-10 ×3 · T03-11 ×3 · T03-12
    # · T03-13 · T03-14 · T05-2) qua bốn lượt khác nhau, và cổng này exit 0 mọi
    # lượt. Nó chỉ lộ khi hai file trùng ID tình cờ tạo một VÒNG phụ thuộc — tức
    # lộ vì may, không vì cổng.
    if tid in tasks:
        fails.append(f"{tid}: ID TRÙNG — {tasks[tid]['mod']}/{tasks[tid]['file']} "
                     f"và {mod}/{md.name}; file sau ghi đè file trước nên "
                     f"`phạm_vi_ghi` của một trong hai KHÔNG được kiểm")
    tasks[tid] = dict(mod=mod, file=md.name,
                      scope=[l.strip("- \n") for l in pv.group(1).splitlines()] if pv else [],
                      verif=vf.group(1) if vf else None,
                      cmds=re.findall(r"^\s*cmd:\s*(.+)$", t, re.M),
                      acs=re.findall(r"^\s*- AC\d+:", t, re.M),
                      dep=_doc_dep(t))

print(f"1 · {len(tasks)} task — khai đủ ba mục bắt buộc\n")
for tid, v in sorted(tasks.items()):
    l = []
    if not v["scope"]: l.append("thiếu phạm_vi_ghi")
    if v["verif"] not in ("hard", "soft"): l.append(f"verifiability={v['verif']!r}")
    if not v["acs"]: l.append("không AC nào")
    if v["verif"] == "hard" and len(v["cmds"]) < len(v["acs"]):
        l.append(f"hard: {len(v['acs'])} AC nhưng {len(v['cmds'])} cmd ⇒ R3 hạ soft")
    print(f"  {'ok  ' if not l else 'FAIL'} {tid:<7} {v['mod']:<13} {v['verif']:<5} "
          f"{len(v['acs'])} AC/{len(v['cmds'])} cmd" + (f"  {'; '.join(l)}" if l else ""))
    fails += [f"{tid}: {x}" for x in l]

print("\n2 · phạm_vi_ghi nằm trong boundary module\n")
for tid, v in sorted(tasks.items()):
    m = mp["modules"].get(v["mod"], {})
    # be/fe có thể là str HOẶC list (M04_ci sau FR-003 có 2 path)
    bound = []
    for k in ("be", "fe"):
        pv = m.get(k)          # KHÔNG dùng tên v — nó là biến của vòng lặp ngoài
        bound += pv if isinstance(pv, list) else ([pv] if pv else [])
    bound += ["07_plan/**", ".factory/**", "core/tests/**", "05_uiux/contracts/**"]
    # FR-058 lớp B · artifact HỆ THỐNG không nhận chủ module — đọc TỪ MAP, không
    # gõ danh sách ở đây: gõ ở đây là bản thứ hai của một bảng khai, và nó lạc
    # hậu im lặng đúng ngày ai đó thêm một đường vào map.
    bound += mp.get("he_thong", {}).get("duong", [])
    ngoai = [s for s in v["scope"]
             if not any(s.startswith(b.replace("/**", "").rstrip("/")) for b in bound)]
    print(f"  {'ok  ' if not ngoai else 'CHÚ Ý'} {tid:<7} {', '.join(v['scope'])[:58]}"
          + (f"  NGOÀI: {ngoai}" if ngoai else ""))
    for s in ngoai:
        fails.append(f"{tid}: ghi {s} ngoài boundary {v['mod']} ({m.get('be')}/{m.get('fe')})")

print("\n3 · đồ thị phụ thuộc không có vòng\n")
seen, stack = set(), set()
def di(n, path):
    if n in stack: fails.append(f"VÒNG: {' → '.join(path + [n])}"); return
    if n in seen or n not in tasks: return
    seen.add(n); stack.add(n)
    for d in tasks[n]["dep"]: di(d, path + [n])
    stack.discard(n)
for tid in tasks: di(tid, [])
# FR/WO KHÔNG nằm trong `tasks` — chúng là artifact của `.factory/`, không phải
# task file. Tra chúng ở đúng thư mục của chúng; tra trong `tasks` thì mọi task
# phụ thuộc một FR đều "treo", kể cả khi FR đó có thật và đã duyệt.
_FR = {f.stem.split("-")[0] + "-" + f.stem.split("-")[1]
       for d in ((ROOT / ".factory" / "fr"), (ROOT / ".factory" / "wo"))
       if d.is_dir() for f in d.glob("*.md")}
thieu = [(t, d) for t, v in tasks.items() for d in v["dep"]
         if d not in tasks and d not in _FR]
for t, d in thieu: fails.append(f"{t}: phụ thuộc {d} không tồn tại")
print(f"  {'ok   không vòng' if not any('VÒNG' in f for f in fails) else 'FAIL có vòng'}"
      + (f", {len(thieu)} phụ thuộc treo" if thieu else ""))

print("\n4 · evidence plan phủ AC hard của spec (W5)\n")
import subprocess
import sys
plan_all = {c.strip() for v in tasks.values() for c in v["cmds"]}
norm = lambda s: re.sub(r"\s+", " ", s.replace("python3", "python")).strip()
# ── W5 · MỘT module đã bắt đầu dựng MÃ chưa? ─────────────────────────────
#
# `co_plan` cũ hỏi *"module này có task nào chưa"*, và câu đó TRỘN hai trạng
# thái khác hẳn nhau:
#
#   (a) module đang được DỰNG  ⇒ AC của spec phải có cổng, thiếu là ĐỎ
#   (b) module vừa có một task GIẤY (áp một FR, sửa một câu spec, lập plan)
#       ⇒ chưa dòng mã nào, nên chưa có gì để AC đo
#
# Đo 2026-09-07 trên M18: `T18-1` khai `phạm_vi_ghi` đúng HAI file —
# `06_modules/M18_nguoidung/spec.md` và `rules.md`. Không `core/`, không `web/`.
# Nó tồn tại để `FR-066` có một đơn vị trỏ về. Nhưng vì nó là "một task", W5
# lật M18 từ MIỄN TOÀN BỘ sang 5 lỗi hard trong một nhịp — và cả 5 lỗi ấy đòi
# cổng cho mã KHÔNG AI ĐANG VIẾT.
#
# Vì sao KHÔNG chọn hai lối kia:
#   · xếp lượt build M18 ngay ⇒ dựng phần tài khoản/phiên/thu-hồi cho vừa một
#     cổng xanh. M18 là phần bảo mật; làm nó vì gate là đúng cách làm sai nó.
#   · gỡ `T18-1` ⇒ làm cổng xanh bằng cách XOÁ THỨ BÁO. Đó là bên bị đánh giá
#     cầm bút ghi vào thứ đánh giá mình — luật gốc cấm đúng chuyện này. Và nó
#     mất luôn chủ quyền giấy tờ mà `T18-1` vừa lập.
#
# Lối này KHÔNG thêm cờ miễn cho ai bấm. Nó đọc BẰNG CHỨNG đã khai:
# `phạm_vi_ghi`. Muốn "được hoãn" thì phải khai phạm vi TOÀN GIẤY — mà khai
# vậy rồi viết mã là vi phạm `R1`, đã có cổng riêng bắt. Và nợ KHÔNG BIẾN MẤT:
# nó in ra, đếm được, có tổng ở cuối, và ô backlog vẫn mở.

# Đường ARTIFACT — thứ s1…s7 sinh ra, không phải thứ AC của spec đo.
GOC_GIAY = ("01_research/", "02_proposal/", "03_docs/", "04_system/",
            "05_uiux/", "06_modules/", "07_plan/", ".factory/", "memory/",
            "FROZEN.lock", "RUNNING.md", "project_map.yaml")


def la_duong_giay(dong: str) -> bool:
    """Một dòng `phạm_vi_ghi` trỏ vào artifact, không vào mã?

    Cắt chú thích TRƯỚC khi so: một dòng `phạm_vi_ghi` là
    `<đường> # <chú thích>`, và chú thích là văn xuôi có thể nhắc `core/` hay
    `web/` ở bất kỳ đâu. So cả dòng thì một lời giải thích TỐT làm module bị
    coi là đang dựng mã.
    """
    d = dong.split("#", 1)[0].strip().strip("`").lstrip("./")
    return bool(d) and d.startswith(GOC_GIAY)


def dang_dung_ma(cac_scope) -> bool:
    """Có ÍT NHẤT MỘT dòng phạm vi trỏ ra ngoài vùng artifact ⇒ đang dựng mã."""
    return any(not la_duong_giay(s) for s in cac_scope)


if "--tu-kiem" in sys.argv:
    print("check_g6b --tu-kiem · W5 phan biet plan-GIAY voi plan-dung-MA")
    print()
    _xau = 0
    for _ten, _sc, _mong in [
        ("chi spec + rules (ca THAT cua T18-1)",
         ["06_modules/M18_nguoidung/spec.md   # AC-6.1",
          "06_modules/M18_nguoidung/rules.md"], False),
        ("co mot file core/ ⇒ DANG dung ma",
         ["06_modules/M18_nguoidung/spec.md", "core/src/x.py"], True),
        ("co mot file web/ ⇒ DANG dung ma",
         ["07_plan/M03_web/tasks/x.md", "web/api/y.mjs"], True),
        ("chu thich chua chu core/ ma duong la giay ⇒ VAN giay",
         ["06_modules/M18_nguoidung/spec.md   # se can core/tests/ sau"], False),
        ("pham vi rong ⇒ chua dung ma", [], False),
        ("duong co ./ o dau ⇒ van nhan ra la giay",
         ["./07_plan/M18_nguoidung/README.md"], False),
        ("chungcat/ khong nam trong GOC_GIAY ⇒ la MA",
         ["chungcat/src/worker.py"], True),
    ]:
        _that = dang_dung_ma(_sc)
        _dat = _that == _mong
        print(f"  {'ok  ' if _dat else 'FAIL'} {_ten:<50} "
              f"mong {_mong} · duoc {_that}")
        _xau += not _dat
    print()
    if _xau:
        sys.exit(f"{_xau} ca tu-kiem SAI — W5 khong dang tin")
    print("pass · W5 doc BANG CHUNG (pham_vi_ghi), khong doc mot co mien")
    sys.exit(0)



def da_xanh(cmd):
    """AC đã xanh sẵn thì không cần task sinh lại — W5 đòi evidence CÓ THẬT,
    không đòi làm lại thứ đang chạy. Chỉ hỏi được với lệnh python."""
    if not cmd.startswith("python") or "*" in cmd:
        return None
    try:
        # `sys.executable`, KHÔNG chữ "python" của bảng khai. Đo 2026-09-04:
        # `python` trần trên PATH là interpreter HỆ THỐNG, thiếu `pyyaml`/
        # `jsonschema` ⇒ `check_reject_reason.py` trả 1 với *"Thiếu phụ thuộc"*
        # và W5 báo "chưa xanh" cho một cổng ĐANG XANH dưới `.venv`.
        # Một cổng đỏ vì SAI INTERPRETER là cổng đỏ oan, và nó dạy người đọc
        # bỏ qua dòng W5 — mất đúng thứ W5 canh.
        lenh = [sys.executable, *cmd.split()[1:]]
        return subprocess.run(lenh, cwd=ROOT, capture_output=True,
                              timeout=60).returncode == 0
    except Exception:
        return None

hoan = []
for d in sorted(x for x in MODS.iterdir() if x.is_dir()):
    st = (d / "spec.md").read_text(encoding="utf-8")
    ac_cmd = {c.strip().strip("`") for c in re.findall(r"`cmd:\s*([^`]+)`", st)}
    ac_cmd = {c for c in ac_cmd if "*" not in c}   # bỏ glob trong ghi chú §2.6
    co_plan = any(v["mod"] == d.name for v in tasks.values())
    dung_ma = dang_dung_ma([s2 for v in tasks.values() if v["mod"] == d.name
                            for s2 in v["scope"]])
    thieu, xanh = [], []
    for a in ac_cmd:
        # tìm trong TOÀN BỘ plan: task nằm ở module SỞ HỮU FILE, có thể khác
        # module sở hữu AC (vd T01-3 của M01 sinh AC-2.3.1 của M04)
        if any(norm(a).split("-k")[0] in norm(p2) or norm(p2).split("-k")[0] in norm(a)
               for p2 in plan_all):
            continue
        (xanh if da_xanh(a) else thieu).append(a)
    # NHÃN phải nói đúng phán quyết. Trước 2026-09-07 dòng này in `FAIL` cho
    # MỌI module còn `thieu` — kể cả module chưa có plan, thứ mà `if` bên dưới
    # KHÔNG tính là lỗi. Một dòng `FAIL` không vào danh sách lỗi dạy người đọc
    # rằng `FAIL` ở đây không có nghĩa gì, và đó là cách mất một cổng.
    nhan = "FAIL" if thieu and (dung_ma or xanh) else ("hoãn" if thieu else "ok  ")
    print(f"  {nhan} {d.name:<14} spec {len(ac_cmd)} cmd"
          + (f" · {len(xanh)} đã xanh sẵn" if xanh else "")
          + ("  (chưa có plan)" if not co_plan and not xanh else "")
          # HOÃN, không MIỄN — và chữ in ra phải nói đúng chữ ấy. Một nợ lặng
          # lẽ biến mất là thứ lối này bắt buộc KHÔNG được tạo ra.
          + (f"  (plan TOÀN GIẤY — {len(thieu)} cmd chưa đến hạn)"
             if thieu and co_plan and not dung_ma and not xanh else "")
          + (f"  KHÔNG ai sinh: {len(thieu)}"
             if thieu and (dung_ma or xanh) else ""))
    if thieu and co_plan and not dung_ma and not xanh:
        hoan.append((d.name, sorted(thieu)))
    if dung_ma or xanh:
        fails += [f"{d.name}: AC hard `{c}` không task nào sinh và chưa xanh (W5)"
                  for c in thieu]

if hoan:
    n = sum(len(k) for _, k in hoan)
    print(f"\n  HOÃN · {n} AC hard của {len(hoan)} module có plan TOÀN GIẤY "
          f"(chưa một dòng mã) ⇒ CHƯA ĐẾN HẠN, không phải được miễn:")
    for m, cs in hoan:
        print(f"         {m}  ({len(cs)} cmd) — nợ vẫn mở ở "
              f"06_modules/{m}/backlog.md")
        for c in cs:
            print(f"           · {c}")
    print(f"         Task đầu tiên của module chạm MÃ ⇒ cả {n} AC này thành ĐỎ.")

print("\n5 · task chạm file test phải là đơn vị test (R1)\n")
for tid, v in sorted(tasks.items()):
    # `06_modules/*/testcases.md` KHÔNG phải file test — nó là ARTIFACT s6, bản
    # đặc tả nghiệm thu của module, và `s6` khai nó trong danh sách chín artifact.
    # Luật `R1` ở đây nói về *"đơn vị viết mã không được viết thước chấm chính
    # mình"*, tức file CỔNG chạy được. Một phép so chuỗi con `"test" in path`
    # nuốt luôn `testcases.md` và tố oan mọi task s6 — mà đỏ oan thì dạy người
    # ta bỏ qua màu đỏ, đúng thứ nguy hiểm hơn một cổng thiếu.
    # So trên ĐƯỜNG DẪN, không so trên cả dòng: một dòng `phạm_vi_ghi` là
    # `<đường> # <chú thích>`, và chú thích là văn xuôi tiếng Việt có chữ
    # "test" ở khắp nơi ("đăng ký cổng nếu sinh test mới"). So cả dòng thì một
    # lời giải thích TỐT làm task đỏ, tức cổng phạt người viết chú thích rõ.
    cham = [s for s in v["scope"]
            if "test" in s.split("#", 1)[0].lower()
            and "testcases.md" not in s.split("#", 1)[0].lower()]
    # Đơn vị test nhận diện bằng PHẠM VI, không bằng TÊN.
    #
    # Tên là thứ đổi được mà không đổi gì thật: một task ghi cả mã lẫn cổng chỉ
    # cần thêm chữ "test" vào tên file là qua được, còn một task mà TOÀN BỘ sản
    # phẩm là một cổng (`T04-6` răng thật cho rule-surface, `T08-23` cổng
    # db-dùng-chỗ) thì bị tố oan vì tên nó không có chữ ấy.
    #
    # `R1` nói: người viết mã không cầm bút viết thước chấm chính mình. Vậy
    # phép đo đúng là *"đơn vị này có viết mã nào ngoài cổng không?"* — tức
    # phạm vi ghi CHỈ gồm file cổng. Đó là thứ không đổi được bằng cách đặt tên.
    duong = [x.split("#", 1)[0].strip() for x in v["scope"]]
    chi_cong = bool(duong) and all("test" in x.lower() for x in duong if x)
    la_test = ("test" in v["file"].lower() or "test" in tid.lower()
               or chi_cong)
    if cham and not la_test:
        print(f"  CHÚ Ý {tid:<7} chạm {cham} mà tên không phải đơn vị test")
        fails.append(f"{tid}: chạm file test mà không phải đơn vị test (R1)")
print("  ok   không task nào vi phạm" if not any("R1" in f for f in fails) else "")

print("\n" + "-" * 56)
if fails:
    for f in fails: print("  -", f)
    sys.exit(f"G6B CHƯA ĐÓNG — {len(fails)} lỗi")
print(f"G6B: 5 điều kiện đạt trên {len(tasks)} task")
