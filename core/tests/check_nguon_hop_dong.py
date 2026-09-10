"""T01-47 · `nguon` là hợp đồng thật, không phải trường ghi-rồi-bỏ (`WO-056`).

Đo bằng CHÍNH `jsonschema` trên schema thật, không so chuỗi trên file: phép so
chuỗi xanh khi ai đó khai `nguon` ở nhánh sai của `if/then`, và đó đúng là chỗ
dễ khai sai nhất.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
S = R / "core" / "assets" / "frontmatter.schema.json"

try:
    import jsonschema
except ImportError:                                            # pragma: no cover
    print("BỎ QUA — thiếu `jsonschema`")
    raise SystemExit(0)

loi: list[str] = []


def bao(ok: bool, cau: str, them: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {cau}{('  — ' + them) if them else ''}")
    if not ok:
        loi.append(cau)


SCHEMA = json.loads(S.read_text(encoding="utf-8"))
V = jsonschema.Draft202012Validator(SCHEMA)


def hop_le(fm: dict) -> bool:
    return not list(V.iter_errors(fm))


def _nen(**them) -> dict:
    """Frontmatter tối thiểu ĐỦ 11 trường `required` — nền cho mọi ca thử.

    Dựng từ `required` của chính schema, không gõ tay danh sách: gõ tay thì
    thêm một trường bắt buộc là cổng này đỏ vì lý do KHÔNG liên quan.
    """
    d = {
        "id": "src_abc123", "slug": "phan-tich-x", "source_type": "article",
        "url": "kho://article/phan-tich-x", "protocol_version": "2.0",
        "analyzed_at": "2026-09-06", "one_liner": "một câu",
        "credibility_max": "claimed", "review_status": "draft",
        "origin": "pipeline", "conformance": "C",
    }
    thieu = [k for k in SCHEMA.get("required", []) if k not in d]
    assert not thieu, f"cổng chưa biết trường bắt buộc mới: {thieu}"
    d.update(them)
    return d


def main() -> int:
    print("T01-47 · `nguon` là hợp đồng")

    # ── AC1 · khai, kiểu mảng chuỗi, khuôn có tiền tố loại ────────────────
    p = SCHEMA.get("properties", {}).get("nguon")
    bao(isinstance(p, dict), "AC1 · schema KHAI `nguon`",
        "không khai ⇒ không kiểu, không khuôn, không ai bắt được ghi sai")
    bao(bool(p) and p.get("type") == "array", "AC1 · `nguon` là MẢNG")
    bao(not hop_le(_nen(nguon="article/x")),
        "AC1 · chuỗi trần bị TỪ CHỐI — `nguon` không phải một slug đơn")
    bao(not hop_le(_nen(nguon=["khong-co-tien-to"])),
        "AC1 · slug KHÔNG tiền tố loại bị từ chối",
        "`article/x` định danh một bản ghi; `x` thì không")
    bao(hop_le(_nen(nguon=["tai-lieu/linux-foundation"])),
        "AC1 · slug có tiền tố loại được nhận")

    # ── AC2 · KHÔNG bắt buộc ở tầng schema — quyết định ĐO ĐƯỢC ─────────
    #
    # Bản đầu bắt buộc `nguon` khi `origin: pipeline`. Phép đo bác nó: SÁU chỗ
    # trong dự án dùng `pipeline` với nghĩa rộng *không-do-người-gõ*
    # (`web/test/_api.mjs` · `api-crud` · `canh-bao-khong-chan-ghi` ·
    # `route-theo-module` · `vong-doi-bai` · fixture `dat-chuan.md` mang URL
    # arxiv). Chỉ `worker.py` dùng nó với nghĩa *chưng cất từ bản ghi trong
    # kho*. Áp `required` theo `origin` là áp một nghĩa trường ấy KHÔNG mang,
    # và cái giá là sáu fixture phải đeo một `nguon` BỊA.
    #
    # Vế dưới giữ quyết định ấy đứng yên: ai thêm lại nhánh `required` thì cổng
    # đỏ và phải đọc đoạn này trước khi làm.
    bao(hop_le(_nen()),
        "AC2 · `origin: pipeline` KHÔNG bị schema đòi `nguon`",
        "áp lại `required` ⇒ sáu fixture phải đeo nguồn bịa")
    bao(not any("FR-067" in str(x.get("$comment", ""))
                for x in SCHEMA.get("allOf", [])),
        "AC2b · không nhánh `allOf` nào của FR-067 bắt buộc `nguon`")

    # ── AC2c · cưỡng chế nằm ở BÊN SINH RA VẬT ──────────────────────────
    #
    # Bỏ vế schema KHÔNG có nghĩa không ai canh. `_dung_nhap` là chỗ DUY NHẤT
    # sinh bản chưng cất, và nó biết vật ấy đến từ đâu — nghĩa không mập mờ.
    cong = R / "chungcat" / "tests" / "check_ke_thua_nhan.py"
    bao(cong.exists() and "nguon" in cong.read_text(encoding="utf-8"),
        "AC2c · cổng bên SINH RA vật canh `nguon` (`check_ke_thua_nhan`)",
        "bỏ vế schema mà không ai canh ⇒ trường lại thành ghi-rồi-bỏ")

    # ── AC3 · mảng rỗng cũng là mồ côi ───────────────────────────────────
    bao(not hop_le(_nen(nguon=[])),
        "AC3 · `nguon: []` ⇒ TỪ CHỐI",
        "mồ côi mang hình dạng hợp lệ TỆ HƠN vắng trường — nó qua được cổng")

    # ── AC4 · KHÔNG đỏ oan bài nạp tay ───────────────────────────────────
    #
    # Vế giữ chiều ngược. Một `required` toàn cục làm AC2/AC3 xanh ngay, và
    # làm mọi bài người tự viết đỏ — bài ấy KHÔNG chưng cất từ gì cả.
    # Ca THẬT trong kho: `kb/docs/xgboost-taylor-bac-hai.md` — `ho_so` vắng
    # (⇒ `phan-tich`) nhưng `origin: external` với URL ngoài. Bản phân tích nạp
    # từ ngoài, đúng khi không có `nguon`. Khoá `if/then` vào `ho_so` sẽ tố oan
    # đúng bài này — phép đo trước khi áp đã bắt được, nên vế dưới giữ nó lại.
    # `citations_*` đi kèm vì `origin: external` + `phan-tich` ĐÃ có luật
    # riêng đòi chúng (luật CŨ, không liên quan `nguon`). Không thêm thì vế này
    # đỏ vì một lý do khác, và cổng sẽ nói sai chỗ.
    ngoai = dict(origin="external", ho_so="phan-tich",
                 citations_sampled=2, citations_verified=2)
    bao(hop_le(_nen(**ngoai)),
        "AC4 · `origin: external` + `ho_so: phan-tich` KHÔNG bị đòi `nguon`",
        "ca THẬT: kb/docs/xgboost-taylor-bac-hai.md")
    bao(hop_le(_nen(origin="manual", citations_sampled=2, citations_verified=2)),
        "AC4 · `origin: manual` không bị đòi")
    bao(hop_le(_nen(origin="external", ho_so="thu-vien",
                    citations_sampled=2, citations_verified=2)),
        "AC4 · `thu-vien` nạp ngoài không bị đòi")

    print("XANH" if not loi else f"ĐỎ — {len(loi)} vế")
    return 1 if loi else 0


if __name__ == "__main__":
    raise SystemExit(main())
