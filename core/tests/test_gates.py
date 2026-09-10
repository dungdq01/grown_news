"""Mỗi test phá đúng một luật và khẳng định cổng tương ứng đóng.

Test ở đây không kiểm "script chạy được" — kiểm "luật có hiệu lực".
Cổng nào mất hiệu lực mà không ai biết là kiểu hỏng nguy hiểm nhất:
mọi file vẫn báo OK trong khi kho đang nhiễm dần.
"""
import json
import re
from pathlib import Path

import pytest
import yaml

from source_distiller.validate import (
    SCHEMA_PATH, check, count_words, normalize_url, split_frontmatter)

GOOD = Path(__file__).parent / "fixtures" / "dat-chuan.md"


@pytest.fixture(scope="session")
def schema():
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def concepts():
    """Danh muc CUA FIXTURE — doc tu chinh ban dat chuan, khong tu kb/ that.

    Ban truoc doc `kb/concepts.yaml`. Hai chuyen hong:

      1 FR-031 xoa sach danh muc that theo yeu cau nguoi dung ⇒ file chi con
        comment ⇒ `yaml.safe_load` tra `None` ⇒ 18 test ERROR bang TypeError.
        Kho rong la trang thai HOP LE; no khong duoc lam bo test sap.
      2 Ngay khi chua rong, danh muc that la du lieu SONG: nguoi dung them mot
        nhan qua web (FR-019) la doi tien de cua 18 test nay. Test dung dan
        khong duoc phu thuoc thu nguoi dung sua hang ngay.

    Danh muc gio DUNG BANG tap id ma `fixtures/dat-chuan.md` khai. Nho vay
    `test_khai_niem_tu_bia_bi_chan` van co rang: no doi mot id thanh id bia,
    va id bia do khong nam trong tap nay.
    """
    m = re.search(r"^concepts:\s*\[([^\]]*)\]", GOOD.read_text(encoding="utf-8"), re.M)
    return {x.strip() for x in (m.group(1).split(",") if m else []) if x.strip()}


@pytest.fixture
def make(tmp_path, schema, concepts):
    """Sinh một file từ bản đạt chuẩn, thay vài chỗ, rồi chạy check."""
    good = GOOD.read_text(encoding="utf-8")

    def _make(*replacements):
        text = good
        for old, new in replacements:
            assert old in text, f"fixture không chứa: {old!r}"
            text = text.replace(old, new)
        p = tmp_path / "t.md"
        p.write_text(text, encoding="utf-8")
        return check(p, schema, concepts)

    return _make


def test_ban_dat_chuan_khong_loi(make):
    errs, warns = make()
    assert errs == [], f"file mẫu phải sạch: {errs}"


def test_claimed_mot_nguon_khong_duoc_thanh_skill(make):
    """Luật cốt lõi của credibility.md — claimed + 1 nguồn thì chỉ là knowledge."""
    errs, _ = make(
        ("credibility_max: plausible", "credibility_max: claimed"),
        ("independent_sources: 2", "independent_sources: 1"),
        ("verdict: DEEPEN", "verdict: NEW"),
        ("credibility: plausible", "credibility: claimed"),
    )
    assert any("claimed" in e for e in errs)


def test_new_thieu_why_now_bi_chan(make):
    errs, _ = make(
        ("    why_now: Pipeline dự báo UNIS đang chia train test theo tỷ lệ ngẫu nhiên\n", ""),
    )
    assert any("why_now" in e for e in errs)


def test_overlap_thieu_ly_do_bi_chan(make):
    """Loại mà không ghi lý do thì cùng loại rác sẽ quay lại mãi."""
    errs, _ = make(("verdict: DEEPEN", "verdict: OVERLAP"))
    assert any("reason_rejected" in e for e in errs)


def test_external_khong_spot_check_bi_chan(make):
    errs, _ = make(("origin: pipeline", "origin: external"))
    assert any("citations_sampled" in e for e in errs)


def test_muc_tinh_tuy_van_doi_locator(make):
    """WO-038 · luat §6 (du 5 dong bullet) DA BO — muc tinh tuy la van xuoi.

    Test cu doi: bo dong `- **Chuyen giao:**` thi phai do. Nay dong do chi la
    van, bo no khong sai gi, nen phep kiem cu do OAN.

    Nhung test KHONG bi xoa trang — no doi DICH. Cai con phai dung vung la luat
    §7: muc tinh tuy VAN can dia chi. Xoa trang mot test la mat luon phep canh
    chieu nguoc, va chieu nguoc moi la cho mot lan don dep lam hong thu khong
    ai xin don."""
    # Muc 3.4 cua fixture co BA locator; bo mot cai thi §7 van xanh — dung.
    # Phai bo CA BA, khong thi test do chinh no chu khong do luat.
    errs, _ = make(
        ("rò rỉ xảy ra ở bước tính đặc trưng trượt chứ không ở bước chia tập, nên kiểm tra tỷ lệ train test không phát hiện được [§3.4]",
         "ro ri xay ra o buoc tinh dac trung truot"),
        ("- **Bằng chứng:** [§3.4] [§4.1]", "- Bang chung: khong dia chi"),
    )
    # C1/T01-43 đổi chữ trong thông báo: "locator" -> "địa chỉ" (ngôn ngữ của
    # B-A5). Luật KHÔNG đổi — mục 3.4 vẫn phải có địa chỉ. Sửa phép so cho
    # khớp chữ mới, không nới điều kiện.
    assert any("địa chỉ" in e for e in errs), errs


def test_khai_niem_tu_bia_bi_chan(make):
    """concepts chỉ được lấy từ danh mục kiểm soát."""
    errs, _ = make(("data-leakage]", "khai-niem-tu-bia]"))
    assert any("khai-niem-tu-bia" in e for e in errs)


def _voi_category(tmp_path, gia_tri):
    """Fixture đạt chuẩn KHÔNG khai category (di sản enum rỗng) — chèn vào."""
    text = GOOD.read_text(encoding="utf-8").replace(
        "concepts_proposed: []", f"concepts_proposed: []\ncategory: [{gia_tri}]")
    p = tmp_path / "t.md"
    p.write_text(text, encoding="utf-8")
    return p


def test_chu_de_ngoai_danh_muc_bi_chan(tmp_path, schema, concepts):
    """FR-034 — category kiểm bằng cổng --categories (gương cổng concepts),
    không còn enum trong schema. RỖNG = danh mục đóng ⇒ mọi category bị chặn."""
    p = _voi_category(tmp_path, "chu-de-thu")
    errs, _ = check(p, schema, concepts, categories={"chu-de-thu"})
    assert not any("category" in e for e in errs), f"catalog có chu-de-thu thì phải sạch: {errs}"
    errs, _ = check(p, schema, concepts, categories=set())
    assert any("category" in e and "chu-de-thu" in e for e in errs), \
        "danh mục rỗng mà category vẫn lọt — cổng 5b không có răng"


def test_chu_de_cong_tat_khi_none(tmp_path, schema, concepts):
    """categories=None = cổng TẮT — mọi test cũ gọi check() 3 tham số phải
    sống nguyên trạng (FR-034 khai điều này là điều kiện của thiết kế)."""
    p = _voi_category(tmp_path, "chu-de-thu")
    errs, _ = check(p, schema, concepts)
    assert not any("category" in e for e in errs)


def test_word_count_khai_sai_bi_chan(make):
    errs, _ = make(("word_count: 202", "word_count: 260"))
    assert any("word_count" in e for e in errs)


def test_thieu_muc_bi_chan(make):
    # `## 55.` không khớp `^##\s+(\d)\.` (một chữ số rồi dấu chấm) ⇒ §5 biến mất.
    errs, _ = make(("## 5. Rủi ro và tầm nhìn", "## 55. Rủi ro và tầm nhìn"))
    assert any("Thiếu mục: 5" in e for e in errs), errs


def test_thieu_muc_con_bi_chan(make):
    """§3 có bốn mục con khai trong khung — thiếu một cái là thiếu mục."""
    errs, _ = make(("### 3.3 Output", "### 3.9 Output"))
    assert any("Thiếu mục: 3.3" in e for e in errs), errs


def test_dan_nhap_phinh_bi_chan(make):
    """Phần dẫn nhập vượt trần = đang viết lại phần dẫn nhập thay vì đọc thật.

    Bản trước đo SÀN trên mục 5+6. Khung 5 mục làm sàn đó vô nghĩa (§3 hút cả
    bốn mục cũ nên nó luôn ~70%), nên cổng đảo thành TRẦN trên §1+§2.
    """
    padding = " thêm chữ độn" * 200
    errs, _ = make(("## 2. Bối cảnh\nNgắn gọn.", f"## 2. Bối cảnh\n{padding}"))
    assert any("Mục 1+2 chiếm" in e for e in errs), errs


def test_muc_3_dai_khong_troi_cong_dan_nhap(make):
    """CA ÂM — bộ test cũ không diễn đạt được điều này.

    §3 hút cả bốn mục cũ nên nó DÀI là chuyện bình thường. Cổng dẫn nhập không
    được đỏ vì §3 dài; nếu nó đỏ thì đây là cổng đỏ oan, và cổng đỏ oan là cổng
    sẽ bị tắt.
    """
    padding = "chi tiết cơ chế " * 100
    errs, _ = make(("### 3.2 Process\n", f"### 3.2 Process\n{padding}\n"))
    assert not any("Mục 1+2 chiếm" in e for e in errs), errs


def test_readme_khong_bi_coi_la_ban_phan_tich(tmp_path, schema, concepts):
    """kb/README.md là tài liệu của kho, không phải bản phân tích.
    Quét nhầm nó thì mọi lần chạy đều đỏ và người ta sẽ bỏ qua validator."""
    from source_distiller import validate as v

    (tmp_path / "README.md").write_text("# tài liệu\nkhông có frontmatter", encoding="utf-8")
    (tmp_path / "_nhap.md").write_text("# nháp", encoding="utf-8")
    (tmp_path / "that.md").write_text(GOOD.read_text(encoding="utf-8"), encoding="utf-8")

    kept = [p.name for p in sorted(tmp_path.rglob("*.md"))
            if p.name.lower() != "readme.md" and not p.name.startswith("_")]
    assert kept == ["that.md"]


class TestDemTu:
    """count_words là dữ liệu dẫn xuất — phải ổn định, không đếm phần trang trí."""

    def test_bo_khoi_code(self):
        assert count_words("a b\n```\nx y z q w\n```\n") == 2

    def test_bo_dong_tieu_de(self):
        assert count_words("## 1. Bối cảnh\nmột hai") == 2

    def test_bo_locator(self):
        assert count_words("một hai [retry.py:44-71]") == 2

# ═══ FR-001 · ba trường đo M1 ═══
# M1 là metric CHẶN của dự án. Trường tồn tại mà không ai điền thì vẫn không
# đo được — nên approved BẮT BUỘC khai cả ba.

APPROVED = ("review_status: draft", "review_status: approved")
M1_OK = "word_count: 202\ninsight_new: true\nskill_installed: false\nreview_minutes: 17"


def test_approved_khong_con_doi_truong_M1(make):
    """FR-033 · `approved` KHONG con bat buoc ba truong M1.

    DOI CHIEU so voi FR-001, va ghi lai vi sao.

    Nguoi dung bo han buoc duyet ("bo tat ca thu goi la cho duyet"): bai tao tren
    web len site ngay. Ba truong M1 sinh ra TU buoc duyet — khong con buoc do thi
    khong con dip nao de hoi chung, va mot rang buoc schema doi thu khong ai co
    dip khai la mot cong chan moi lan ghi.

    CAI GIA, noi thang: M1 khong con do duoc tu kho. Do la danh doi nguoi dung
    chon sau khi da duoc neu ro.

    Cai KHONG mat va duoc canh o cho khac: may KHONG BAO GIO tu dien ba truong do
    (`cac-man-con-lai.test.js` muc 5 doc thang `status.mjs`). Tuy chon nghia la
    duoc phep VANG, khong phai duoc phep bia."""
    errs, _ = make(APPROVED)
    assert not any("insight_new" in e or "skill_installed" in e or "review_minutes" in e
                   for e in errs), f"khong duoc doi M1 nua, nhung: {errs}"


def test_approved_du_truong_M1_thi_sach(make):
    errs, _ = make(APPROVED, ("word_count: 202", M1_OK))
    assert errs == [], f"bản approved đủ 3 trường phải sạch: {errs}"


def test_draft_khong_can_truong_M1(make):
    """Chỉ approved mới bắt buộc — draft chưa duyệt nên chưa có gì để đo."""
    errs, _ = make()
    assert errs == [], f"draft không cần 3 trường M1: {errs}"


def test_review_minutes_am_bi_chan(make):
    errs, _ = make(APPROVED, ("word_count: 202",
                              M1_OK.replace("review_minutes: 17", "review_minutes: -5")))
    assert any("review_minutes" in e or "-5" in e for e in errs)


def test_insight_new_sai_kieu_bi_chan(make):
    errs, _ = make(APPROVED, ("word_count: 202",
                              M1_OK.replace("insight_new: true", "insight_new: co")))
    assert any("insight_new" in e for e in errs)

# ═══ T01-1 · url_normalized ═══════════════════════════════════════════════
# Đơn vị đếm nguồn độc lập. Đếm theo url thô thì thêm ?utm_source= là ra
# "nguồn độc lập" mới, và hệ số kiểm chứng chéo bị thổi phồng bằng một thao
# tác copy link. Hệ số đó đi vào priority, priority quyết định sinh skill.

class TestUrlNormalized:
    def test_bo_tracking_param(self):
        from source_distiller.validate import normalize_url
        a = normalize_url("https://github.com/vd/repo")
        b = normalize_url("https://github.com/vd/repo?utm_source=x&utm_campaign=y")
        assert a == b == "github.com/vd/repo", f"{a!r} vs {b!r}"

    def test_bo_www_va_scheme(self):
        from source_distiller.validate import normalize_url
        assert (normalize_url("http://www.vd.blog/bai")
                == normalize_url("https://vd.blog/bai/")
                == "vd.blog/bai")

    def test_youtu_be_quy_ve_youtube(self):
        from source_distiller.validate import normalize_url
        assert (normalize_url("https://youtu.be/abc123")
                == normalize_url("https://www.youtube.com/watch?v=abc123&t=42s")
                == "youtube.com/watch?v=abc123")

    def test_arxiv_pdf_quy_ve_abs(self):
        from source_distiller.validate import normalize_url
        assert (normalize_url("https://arxiv.org/pdf/2411.00002v2")
                == normalize_url("https://arxiv.org/abs/2411.00002")
                == "arxiv.org/abs/2411.00002")

    def test_giu_param_that(self):
        """Chỉ bỏ tracking. ?page=2 là nội dung khác, không được gộp."""
        from source_distiller.validate import normalize_url
        assert normalize_url("https://vd.blog/bai?page=2") == "vd.blog/bai?page=2"

    def test_param_dao_thu_tu_van_bang_nhau(self):
        from source_distiller.validate import normalize_url
        assert (normalize_url("https://x.io/a?b=1&a=2")
                == normalize_url("https://x.io/a?a=2&b=1"))

    def test_url_rong_khong_no(self):
        from source_distiller.validate import normalize_url
        for x in ("", None, "   ", 42):
            assert normalize_url(x) == ""


def test_url_normalized_khai_sai_bi_chan(make):
    """Trường dẫn xuất khai tay sai ⇒ chặn. Không chặn thì hai bản cùng nguồn
    đếm thành hai nguồn độc lập, và hệ số kiểm chứng chéo bị thổi phồng.

    Fixture không có url_normalized (trường tuỳ chọn), nên test tự thêm một giá
    trị SAI — đó là cách duy nhất phá đúng luật này."""
    cu = "url: https://arxiv.org/abs/2411.00002"
    errs, _ = make((cu, cu + chr(10) + "url_normalized: arxiv.org/pdf/2411.00002v2"))
    assert any("url_normalized" in e for e in errs), f"phải chặn, nhưng: {errs}"


def test_url_normalized_khai_dung_thi_sach(make):
    cu = "url: https://arxiv.org/abs/2411.00002"
    errs, _ = make((cu, cu + chr(10) + "url_normalized: arxiv.org/abs/2411.00002"))
    assert not any("url_normalized" in e for e in errs), errs


# ═══ T01-2 · --fix chỉ sửa dữ liệu dẫn xuất ═══════════════════════════════
# M01-R2: --fix có lý do tồn tại vì word_count là PHÉP TÍNH. credibility là
# QUYẾT ĐỊNH. Sửa tự động một quyết định là bịa có hệ thống — và bịa đi thẳng
# qua mọi cổng còn lại vì nó "hợp lệ về hình thức".

def test_fix_chi_dan_xuat_doi_dung_word_count(tmp_path):
    """So frontmatter TRƯỚC và SAU --fix: đúng một khoá đổi."""
    import subprocess, sys
    import yaml as _yaml
    from source_distiller.validate import split_frontmatter

    goc = GOOD.read_text(encoding="utf-8")
    p = tmp_path / "t.md"
    p.write_text(goc.replace("word_count: 202", "word_count: 999"), encoding="utf-8")

    truoc = _yaml.safe_load(split_frontmatter(p.read_text(encoding="utf-8"))[0])
    # encoding + errors: validate.py in tiếng Việt, mặc định Windows là cp1252
    # ⇒ UnicodeDecodeError. Cùng loại lỗi đã vá cho CI bằng PYTHONUTF8.
    r = subprocess.run([sys.executable, "-m", "source_distiller.validate",
                        str(p), "--fix", "--no-concepts"],
                       capture_output=True, text=True,
                       encoding="utf-8", errors="replace",
                       cwd=str(Path(__file__).resolve().parents[1] / "src"))
    sau = _yaml.safe_load(split_frontmatter(p.read_text(encoding="utf-8"))[0])

    doi = {k for k in set(truoc) | set(sau) if truoc.get(k) != sau.get(k)}
    # C6b · tap DAN XUAT gio hai khoa: `word_count` va `url_normalized`. Ca hai
    # deu la du lieu tinh duoc tu noi dung, va `--fix` ton tai dung de dien
    # chung. Rang KHONG doi: khoa nao NGOAI tap nay ma doi thi la bia — do la
    # dieu M01-R2 cam, va phep so `<=` giu nguyen y do.
    # C1/B-A6 · them ba khoa. Ly do TUNG khoa, khong gop:
    #   citations_sampled  — so dia chi nhan dang duoc: MAY DEM
    #   citations_verified — so phan giai duoc: MAY DEM
    #   unverifiable_citations — "khong cai nao phan giai duoc": mot SU KIEN
    #     suy tu hai so tren, khong phai mot quyet dinh cua nguoi.
    # M01-R2 cam `--fix` sua mot QUYET DINH. Ba khoa nay khong phai quyet
    # dinh — do la ca ly do B-A6 ton tai. `credibility_max` thi LA quyet
    # dinh, va no KHONG duoc vao tap nay.
    DAN_XUAT = {"word_count", "url_normalized", "citations_sampled",
                "citations_verified", "unverifiable_citations"}
    assert doi <= DAN_XUAT, (
        f"--fix chi duoc doi {sorted(DAN_XUAT)}, nhung doi: {sorted(doi)}. "
        f"Sua tu dong mot quyet dinh la bia co he thong (M01-R2). out={r.stdout[:200]}")
    assert sau["word_count"] == 202, f"phải tính lại đúng, được {sau.get('word_count')}"


def test_fix_khong_dung_truong_phan_doan(tmp_path):
    """credibility_max, review_status, concepts: --fix KHÔNG được chạm."""
    import subprocess, sys
    import yaml as _yaml
    from source_distiller.validate import split_frontmatter

    p = tmp_path / "t.md"
    p.write_text(GOOD.read_text(encoding="utf-8").replace("word_count: 202", "word_count: 1"),
                 encoding="utf-8")
    truoc = _yaml.safe_load(split_frontmatter(p.read_text(encoding="utf-8"))[0])
    subprocess.run([sys.executable, "-m", "source_distiller.validate",
                    str(p), "--fix", "--no-concepts"],
                   capture_output=True, encoding="utf-8", errors="replace",
                   cwd=str(Path(__file__).resolve().parents[1] / "src"))
    sau = _yaml.safe_load(split_frontmatter(p.read_text(encoding="utf-8"))[0])

    for k in ("credibility_max", "review_status", "concepts", "skill_candidates",
              "independent_sources", "corroboration_factor", "origin"):
        assert truoc.get(k) == sau.get(k), f"--fix đã sửa {k} — đó là quyết định, không phải phép tính"

# ══ FR-036/B2 · HỒ SƠ `thu-vien` ═══════════════════════════════════════════
# Bản ghi thư viện là HIỆN VẬT + NHÃN, không phải bản phân tích. Nó được miễn
# cổng mục/dẫn nhập/tinh túy/locator — nhưng MỘT cửa ghi giữ nguyên, và nhánh
# mới KHÔNG được nuốt cổng của hồ sơ cũ. Ca âm dưới đây canh đúng điều đó.


def _thu_vien(**kw):
    """Frontmatter một bản ghi thư viện tối thiểu, thân RỖNG."""
    import json
    fm = {
        "id": "src_tl0001", "slug": "tai-lieu-thu", "source_type": "tai-lieu",
        "url": "kho://tai-lieu/tai-lieu-thu", "url_normalized": "tai-lieu/tai-lieu-thu",
        "protocol_version": "2.0", "analyzed_at": "2026-08-27",
        "one_liner": "Mot cau ta hien vat nay.",
        "credibility_max": "claimed", "conformance": "C",
        "review_status": "approved", "origin": "manual",
        "ho_so": "thu-vien",
        # FR-052 cach 1 — MANG. Truoc do la mot object, va M16 sinh ba hien vat
        # cho mot bai nen khong co cho de dat cai thu hai.
        "media": [{"sha256": "a" * 64, "mime": "application/pdf",
                   "ten_goc": "bao-cao.pdf", "so_byte": 4823914}],
    }
    fm.update(kw)
    return fm


def _ghi(tmp_path, fm, than=""):
    p = tmp_path / "tl.md"
    thu = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False)
    p.write_text(f"---\n{thu}---\n\n{than}", encoding="utf-8")
    return p


def test_thu_vien_than_rong_di_qua(tmp_path, schema, concepts):
    """Hiện vật không có thân bài — đó là điểm của hồ sơ này."""
    errs, _ = check(_ghi(tmp_path, _thu_vien()), schema, concepts)
    assert errs == [], errs


def test_thu_vien_media_dict_cu_BI_TU_CHOI(tmp_path, schema, concepts):
    """FR-052 · hinh dang CU (`media` la object) nay KHONG hop le nua.

    Day la hop dong thuc cua FR-052: schema ep MANG cho ban ghi MOI. Cac ham
    DOC van chap nhan dict (`_hien_vat`, `tro_media`) — nhung do la de di tru,
    khong phai de cho phep ghi tiep hinh dang cu.
    Hai tang khac nhau, va tron chung lai la de hinh dang cu song mai.
    """
    fm = _thu_vien()
    fm["media"] = {"sha256": "b" * 64, "mime": "application/pdf",
                   "ten_goc": "cu.pdf", "so_byte": 100}
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert errs, "media dang object phai bi tu choi sau FR-052"


def test_thu_vien_HAI_hien_vat_di_qua(tmp_path, schema, concepts):
    """Ly do FR-052 ton tai: M16 sinh slide + giong doc + video cho MOT bai."""
    fm = _thu_vien()
    fm["media"] = [
        {"sha256": "a" * 64, "mime": "application/pdf", "ten_goc": "slide.pdf", "so_byte": 10},
        {"sha256": "c" * 64, "mime": "audio/mpeg", "ten_goc": "doc.mp3", "so_byte": 20},
    ]
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert errs == [], errs


def test_thu_vien_media_mang_RONG_bi_chan(tmp_path, schema, concepts):
    """`media: []` la trang thai vo nghia — ho so thu-vien doi CO hien vat."""
    fm = _thu_vien()
    fm["media"] = []
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert errs, "media rong phai bi chan (minItems 1)"


def test_thu_vien_than_dai_bi_chan(tmp_path, schema, concepts):
    """Thân >400 từ nghĩa là đây là bản PHÂN TÍCH đặt sai hồ sơ."""
    errs, _ = check(_ghi(tmp_path, _thu_vien(), "chu " * 500), schema, concepts)
    assert any("thu-vien" in e or "hồ sơ" in e for e in errs), errs


def test_thu_vien_tai_lieu_thieu_media_bi_chan(tmp_path, schema, concepts):
    fm = _thu_vien()
    del fm["media"]
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert any("media" in e for e in errs), errs


# ── T01-45 quyết 2 · MP4 không lạc sang bản ghi TÀI LIỆU ────────────────────
# Lỗ `MP4-lạc-bảng` (backlog M12): mp4 vào kho được qua ô file của tài liệu,
# vốn không lọc gì, nên một video nằm ở bảng tài liệu và không màn video nào
# thấy nó. Quyết 2 (chủ dự án 2026-09-04): media `video/*`|`audio/*` thuộc bản
# ghi **video**.
#
# BA ca, không một ca: chiều âm (tai-lieu + mp4 ⇒ đỏ), chiều dương (video +
# mp4 ⇒ xanh), và ca KHÔNG ĐƯỢC VỠ (tai-lieu + pdf ⇒ xanh). Chỉ viết ca âm thì
# `mime.startswith("video")` đổi thành `return True` vẫn xanh.


def test_tai_lieu_mang_media_video_BI_CHAN(tmp_path, schema, concepts):
    fm = _thu_vien(media=[{"sha256": "b" * 64, "mime": "video/mp4",
                           "ten_goc": "hoi-thao.mp4", "so_byte": 51234567}])
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert any("video" in e and "tai-lieu" in e for e in errs), errs


def test_tai_lieu_mang_media_audio_BI_CHAN(tmp_path, schema, concepts):
    fm = _thu_vien(media=[{"sha256": "c" * 64, "mime": "audio/mpeg",
                           "ten_goc": "ghi-am.mp3", "so_byte": 8123456}])
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert any("video" in e and "tai-lieu" in e for e in errs), errs


def test_ban_ghi_video_mang_media_video_DI_QUA(tmp_path, schema, concepts):
    """Chiều DƯƠNG — đây là chỗ mp4 được phép sống."""
    fm = _thu_vien(source_type="video", slug="video-thu",
                   url="https://youtu.be/dQw4w9WgXcQ",
                   url_normalized="youtube.com/watch?v=dQw4w9WgXcQ",
                   media=[{"sha256": "d" * 64, "mime": "video/mp4",
                           "ten_goc": "hoi-thao.mp4", "so_byte": 51234567}])
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert errs == [], errs


def test_tai_lieu_mang_pdf_VAN_DI_QUA(tmp_path, schema, concepts):
    """Ca KHÔNG ĐƯỢC VỠ — cổng mới không được đá cả tài liệu bình thường."""
    errs, _ = check(_ghi(tmp_path, _thu_vien()), schema, concepts)
    assert errs == [], errs


def test_thu_vien_video_thieu_url_normalized_bi_chan(tmp_path, schema, concepts):
    fm = _thu_vien(source_type="video", url="https://youtu.be/dQw4w9WgXcQ")
    del fm["media"]
    del fm["url_normalized"]
    errs, _ = check(_ghi(tmp_path, fm), schema, concepts)
    assert any("url_normalized" in e for e in errs), errs


def test_ho_so_phan_tich_van_bi_chan_khi_thieu_muc(make):
    """CA ÂM QUAN TRỌNG NHẤT của B2.

    Thêm một nhánh hồ sơ rất dễ thành "bọc cả cổng cũ vào một if không bao giờ
    chạy". Bài phân tích thiếu mục PHẢI vẫn đỏ — nếu không, nhánh mới đã nuốt
    cổng cũ và không phép kiểm nào khác thấy.
    """
    errs, _ = make(("## 5. Rủi ro và tầm nhìn", "## 55. Rủi ro và tầm nhìn"))
    assert any("Thiếu mục" in e for e in errs), errs


def test_ho_so_vang_mac_dinh_la_phan_tich(make):
    """Bài cũ không khai `ho_so` phải được xử như bản phân tích — không file nào
    trong kho phải sửa vì FR-036/B2."""
    errs, _ = make(("## 3. Nội dung", "## 33. Nội dung"))
    assert any("Thiếu mục" in e for e in errs), errs


# ── TikTok trong normalize_url ──────────────────────────────────────────────

def test_tiktok_dang_day_du_chuan_hoa_ve_id():
    """`@handle` KHÔNG phải danh tính — id mới là. Hai URL cùng video khác handle
    phải chuẩn hoá về một, không thì hệ số kiểm chứng chéo bị thổi bằng một lần
    đổi tên tài khoản."""
    a = normalize_url("https://www.tiktok.com/@nguoi.a/video/7123456789012345678")
    b = normalize_url("https://tiktok.com/@nguoi.b/video/7123456789012345678?is_from_webapp=1")
    assert a == b, (a, b)
    assert "7123456789012345678" in a


def test_tiktok_link_rut_gon_khong_bia_id():
    """`vm.tiktok.com/<short>` là redirect phía server — KHÔNG giải được offline.
    Cổng không được BỊA một id; nó phải trả host+path và để người nạp dán link đầy đủ."""
    u = normalize_url("https://vm.tiktok.com/ZMabcdef1/")
    assert "video/" not in u, u
