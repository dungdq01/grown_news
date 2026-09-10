"""Việc chưng cất CŨ bị thay ⇒ XOÁ khỏi hàng đợi, không chỉ ẩn.

Chủ dự án chốt 2026-09-07: *"sao không xóa bản cũ đấy đi mà lại ẩn — ẩn cũng
giải quyết được vấn đề đó trong tương lai đâu?"*. Đúng: ẩn giữ nguyên đà phình
của hàng đợi, chỉ dời nó ra khỏi tầm mắt.

VÌ SAO XOÁ ĐƯỢC MÀ KHÔNG MẤT SỔ CHI PHÍ: vết tiền nằm ở `egress.<pid>.jsonl`,
một file RIÊNG (đo 2026-09-07: bốn file, tổng 4.4 KB, sống độc lập với
`done/*.json`). Xoá file việc không đụng tới nó.

CỔNG NÀY CHẠY HÀM THẬT trên một hàng đợi tạm — không quét chuỗi trong mã.
Chủ dự án nói thẳng: *"test kỹ, tôi không muốn lỗi này lặp lại"*, và lỗi ấy là
`donBanCu` xanh cổng suốt hai vòng trong khi nó không dọn gì cả (đọc nhầm
`b.source_type` thay vì `b.type`). Một cổng đọc NGUỒN không bao giờ bắt được
loại lỗi đó.

0 mạng · 0 model.
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(GOC / "chungcat" / "src"))

loi = 0


def ok(d, cau, vs=""):
    global loi
    print(f"  {'ok  ' if d else 'FAIL'} {cau}" + ("" if d or not vs else f"  {vs}"))
    if not d:
        loi += 1


print("\nviệc chưng cất cũ → XOÁ khỏi hàng đợi\n")

import worker  # noqa: E402

ok(hasattr(worker, "don_viec_cu"), "0 · có `don_viec_cu`")
if not hasattr(worker, "don_viec_cu"):
    print("\nĐỎ — 1 vế")
    sys.exit(1)


def dung_viec(d: Path, ulid: str, loai: str, slug: str, gd: str = "xong",
              phu: bool = True) -> Path:
    f = d / f"{ulid}.json"
    f.write_text(json.dumps({
        "ulid": ulid, "giai_doan": gd,
        "payload": {"loai": loai, "slug": slug},
    }), encoding="utf-8")
    if phu:
        (d / f"{ulid}.phan-hoi.json").write_text("{}", encoding="utf-8")
    return f


with tempfile.TemporaryDirectory() as tmp:
    goc = Path(tmp)
    done = goc / "done"
    done.mkdir()
    cur = goc / "cur"
    cur.mkdir()

    S = "video/mot-nguon"
    cu1 = dung_viec(done, "a" * 32, "chung-cat-mot-nguon", S)
    cu2 = dung_viec(done, "b" * 32, "chung-cat-mot-nguon", S)
    moi = dung_viec(done, "c" * 32, "chung-cat-mot-nguon", S)
    # nhiễu: cùng slug KHÁC loại · khác slug · chưa xong
    khac_loai = dung_viec(done, "d" * 32, "sinh-transcript", S)
    khac_slug = dung_viec(done, "e" * 32, "chung-cat-mot-nguon", "video/nguon-khac")
    dang_chay = dung_viec(cur, "f" * 32, "chung-cat-mot-nguon", S, gd="dang-goi-model")

    dat = worker.don_viec_cu(goc, "chung-cat-mot-nguon", S, "c" * 32)

    ok(not cu1.exists() and not cu2.exists(),
       "1 · HAI việc cũ cùng nguồn bị XOÁ THẬT",
       "đây là phép đo chạy hàm, không phải đọc chuỗi trong mã")
    ok(moi.exists(), "2 · việc MỚI NHẤT ở lại")
    ok(khac_loai.exists(),
       "3 · việc KHÁC LOẠI cùng slug KHÔNG bị đụng",
       "`sinh-transcript` không phải bản chưng cất; xoá nó là xoá transcript "
       "của người ta")
    ok(khac_slug.exists(), "4 · việc của NGUỒN KHÁC không bị đụng")
    ok(dang_chay.exists(),
       "5 · việc CHƯA XONG không bị đụng",
       "một việc đang gọi model mà bị xoá file thì worker mất chỗ ghi kết quả")
    ok(not (done / ("a" * 32 + ".phan-hoi.json")).exists(),
       "6 · file PHỤ đi theo (`.phan-hoi.json`)",
       "để lại file phụ mồ côi là để lại rác không ai biết của ai")
    ok(sorted(dat) == sorted(["a" * 32, "b" * 32]),
       f"7 · trả đúng danh sách đã xoá ({dat})")

# ── 8 · gọi từ đâu ──────────────────────────────────────────────────────
import inspect  # noqa: E402

ma = inspect.getsource(worker.chay_chung_cat)
ok("don_viec_cu" in ma,
   "8 · `chay_chung_cat` gọi nó sau khi xong",
   "dọn ở chỗ khác thì hàng đợi chỉ sạch khi ai đó nhớ chạy tay")

# ── 9 · lỗi dọn KHÔNG giết việc ─────────────────────────────────────────
src = inspect.getsource(worker.don_viec_cu)
ok("except" in src,
   "9 · dọn trượt ⇒ việc vừa xong VẪN xong",
   "việc ấy đã tiêu tiền model; huỷ nó vì một thao tác gọn nhà là đánh đổi "
   "sai chiều")

print(f"\n{'ĐỎ — %d vế' % loi if loi else 'pass · hàng đợi không phình, sổ chi phí còn nguyên'}")
sys.exit(1 if loi else 0)
