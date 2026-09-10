#!/usr/bin/env python3
"""Validate file .md của source-distiller.

    python3 validate.py kb/                     # kiểm cả thư mục
    python3 validate.py kb/paper/abc.md         # kiểm một file
    python3 validate.py kb/ --json              # output cho CI
    python3 validate.py kb/ --strict            # cảnh báo cũng tính là lỗi

Phụ thuộc: pyyaml, jsonschema
Cài như pre-commit hook trong kho kb/.
"""

import argparse, json, re, sys
from pathlib import Path

try:
    import yaml
    from jsonschema import Draft202012Validator
except ImportError:
    sys.exit("Thiếu phụ thuộc: pip install pyyaml jsonschema")

HERE = Path(__file__).resolve().parent
# HAI layout, cùng một schema (xem `khung.py` — cùng lý do):
#   repo   core/src/source_distiller/  ->  core/assets/
#   bundle <skill>/scripts/            ->  <skill>/assets/
# Bản bundle ở `~/.claude/skills/source-distiller/` là thứ THẬT SỰ viết ra bài;
# một đường dẫn chỉ đúng ở repo nghĩa là nó nổ ở chỗ người dùng, không ở CI.
SCHEMA_PATH = next(
    (p for p in (HERE.parent.parent / "assets" / "frontmatter.schema.json",
                 HERE.parent / "assets" / "frontmatter.schema.json") if p.exists()),
    HERE.parent.parent / "assets" / "frontmatter.schema.json")

# Khung thân bài KHAI Ở MỘT NƠI — core/assets/khung-than-bai.json. Trước đây
# khung 9 mục gõ tay ở sáu chỗ và đã trôi thành HAI bộ tên khác nhau mà không
# cổng nào bắt (cổng chỉ ép SỐ mục, không đọc tên). Cổng canh: check_khung.py.
try:
    from .khung import (  # noqa: E402
        CAN_LOCATOR, CON, DAN_NHAP, SO_MUC, TRAN_DAN_NHAP,
        TRAN_TU_CUNG, TRAN_TU_MEM,
        TRAN_TU_THU_VIEN,
    )
except ImportError:
    # Chạy TRỰC TIẾP (`python core/src/source_distiller/validate.py`) — đó là
    # cách `dungchung.mjs:chayValidate` và Makefile gọi nó, nên import tương
    # đối một mình là hỏng đường chính. Cùng khuôn với `dung_lai_db.py:31`.
    sys.path.insert(0, str(HERE.parent))
    from source_distiller.khung import (  # noqa: E402
        CAN_LOCATOR, CON, DAN_NHAP, SO_MUC, TRAN_DAN_NHAP,
        TRAN_TU_CUNG, TRAN_TU_MEM,
        TRAN_TU_THU_VIEN,
    )

WORD_CAP_HARD = TRAN_TU_CUNG

SECTION_RE = re.compile(r"^##\s+(\d)\.\s+(.+)$", re.M)
SUB_RE = re.compile(r"^###\s+(\d)\.(\d)\s+(.+)$", re.M)

# LOCATOR_RE cũ đã BỎ (C1/T01-43): nó khớp mọi ngoặc vuông nên `[2, 1, 0.5]`
# và một công thức Taylor đều qua. Thay bằng `_DANG` đọc từ dia-chi.json.

def _hien_vat(fm) -> list[dict]:
    """MOI hien vat cua mot frontmatter (FR-052 — `media` la MANG).

    Chap nhan CA HAI hinh dang:
      dict  — ban truoc FR-052; ban ghi chua di tru van doc duoc
      list  — FR-052 cach 1

    Khong doc duoc ban cu thi doi schema thanh mot NGAY CO: moi ban ghi phai
    di tru cung luc voi moi doan ma, va bat ky thu tu nao cung co mot khoang
    thoi gian he thong tu choi du lieu cua chinh no.
    """
    m = (fm or {}).get("media")
    if isinstance(m, dict):
        return [m]
    if isinstance(m, list):
        return [x for x in m if isinstance(x, dict)]
    return []


# Loại nguồn được phép đặt `ho_so: thu-vien` — khai ở `media-mime.json` cùng chỗ
# với bảng mime và host video, vì cả ba trả lời cùng một câu: "thư viện gồm gì".
# Hai layout như `khung.py`: repo `core/assets/`, bundle `<skill>/assets/`.
_MM = next((p for p in (HERE.parent.parent / "assets" / "media-mime.json",
                        HERE.parent / "assets" / "media-mime.json") if p.exists()), None)
LOAI_THU_VIEN = (json.loads(_MM.read_text(encoding="utf-8"))["loai_thu_vien"]
                 if _MM else ["tai-lieu", "video"])


# ══ ĐỊA CHỈ ═══════════════════════════════════════════════════════════════
# B-A5 + B-A6. Trước đây `LOCATOR_RE` khớp MỌI ngoặc vuông 2-80 ký tự, nên
# một dãy số và một công thức Taylor cũng được tính là 'có địa chỉ'. Bảng
# khai ở `core/assets/dia-chi.json` — hai layout như `khung.py`.
_DC = next((p for p in (HERE.parent.parent / "assets" / "dia-chi.json",
                        HERE.parent / "assets" / "dia-chi.json") if p.exists()), None)
DANG_DIA_CHI = (json.loads(_DC.read_text(encoding="utf-8"))["dang"] if _DC else [])
_DANG = [(d["ten"], re.compile(d["mau"]), d["manh"]) for d in DANG_DIA_CHI]
_BAT_GAY = {d["ten"] for d in DANG_DIA_CHI if d.get("bat_link_gay")}

# `[text](url)` là link markdown, `[^1]` là footnote — cả hai KHÔNG phải địa
# chỉ. Không loại chúng thì mọi nhãn link thành một 'slug' không phân giải
# được, và `citations_verified` tụt xuống vì lý do sai.
_NGOAC = re.compile(r"\[([^\]\n]{1,120})\](?!\()")


def tach_dia_chi(text):
    """[(nguyên_văn, tên_dạng, mạnh, match)] — thứ KHÔNG khớp dạng nào thì
    BỎ QUA, không báo lỗi (B-A5). Công thức toán viết thoải mái."""
    ra = []
    for m in _NGOAC.finditer(text):
        noi = m.group(1).strip()
        if noi.startswith("^"):
            continue
        for ten, rx, manh in _DANG:
            k = rx.match(noi)
            if k:
                ra.append((noi, ten, manh, k))
                break
    return ra


def _ban_ghi(kho, slug):
    """File .md của một slug trong kho, hoặc None. Kho là chân lý — không
    gọi ra ngoài để tìm (B-E2)."""
    for p in sorted(Path(kho).glob(f"*/{slug}.md")):
        return p
    return None


def _so_trang_pdf(f):
    """Số trang thật. Trả None khi không đọc được — gọi phải phân biệt
    'không có trang đó' với 'không đọc được', hai thứ khác nhau."""
    try:
        import pypdf
        return len(pypdf.PdfReader(str(f)).pages)
    except Exception:
        return None


def phan_giai(ten, manh, k, kho):
    """Địa chỉ có trỏ vào thứ KHO CÓ không. `manh: khong` không bao giờ
    phân giải được — nguồn nằm ngoài kho thì không có gì đối chiếu."""
    if kho is None or manh == "khong":
        return False
    kho = Path(kho)
    if ten == "slug":
        return _ban_ghi(kho, k.group(1)) is not None
    if ten == "slug-trang":
        p = _ban_ghi(kho, k.group(1))
        if p is None:
            return False
        raw, _ = split_frontmatter(p.read_text(encoding="utf-8"))
        try:
            fm = normalize_yaml(yaml.safe_load(raw) or {}) if raw else {}
        except yaml.YAMLError:
            return False
        # FR-052 · `media` la MANG. Doc CA HAI hinh dang: mot ban ghi chua di
        # tru van phai doc duoc, khong thi doi schema la mot ngay co.
        for md in _hien_vat(fm):
            if "pdf" not in str(md.get("mime", "")):
                continue
            f = kho / "_media" / f"{md.get('sha256')}.pdf"
            if f.exists():
                break
        else:
            return False
        n = _so_trang_pdf(f)
        return n is not None and 1 <= int(k.group(2)) <= n
    if ten == "slug-moc":
        p = _ban_ghi(kho, k.group(1))
        return p is not None and p.parent.name == "video"
    if ten == "file-dong":
        f = kho / k.group(1)
        if not f.exists():
            return False
        het = int(k.group(3) or k.group(2))
        return het <= len(f.read_text(encoding="utf-8", errors="replace").splitlines())
    return False


def normalize_yaml(obj):
    """YAML tự chuyển ngày không đóng ngoặc thành date — ép về chuỗi ISO."""
    import datetime
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: normalize_yaml(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize_yaml(v) for v in obj]
    return obj


def friendly(err):
    """Dịch thông báo jsonschema khó đọc sang tiếng người."""
    if err.validator == "not" and "credibility" in str(err.schema):
        return ("ứng viên skill có credibility claimed/conflicted mà chỉ 1 nguồn độc lập "
                "thì không được NEW hay DEEPEN")
    # (FR-034 — nhánh dịch lỗi enum category đã gỡ: enum rời schema, thành viên
    # danh mục kiểm ở cổng --categories trong check(), thông báo tự nói rõ.)
    return err.message[:160]


def split_frontmatter(text):
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    return text[3:end], text[end + 4:]


def count_words(text):
    """Đếm từ văn xuôi. Bỏ những gì không phải nội dung người đọc:
    khối code, dòng tiêu đề (cố định ở mọi file nên không so sánh được),
    locator, và ký tự phân cách bảng."""
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^\s*#{1,6}\s.*$", "", text, flags=re.M)      # dòng tiêu đề
    text = re.sub(r"^\s*\|[\s|:-]+\|\s*$", "", text, flags=re.M)  # dòng kẻ bảng
    text = re.sub(r"\[[^\]]{1,80}\]", " ", text)                  # locator
    text = re.sub(r"[>|*_`~-]", " ", text)
    return len(text.split())


def sections(body):
    """Trả về {số mục: nội dung}. Cắt từ ĐẦU dòng tiêu đề — `count_words` strip
    trọn dòng tiêu đề, nên cắt giữa dòng sẽ tính tên mục thành từ nội dung."""
    marks = [(m.start(), int(m.group(1))) for m in SECTION_RE.finditer(body)]
    out = {}
    for i, (pos, num) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(body)
        out[num] = body[pos:stop]
    return out


def sub_sections(text):
    """{"n.m": nội dung} — cắt theo `### n.m`.

    `#### n.m.k` KHÔNG khớp `SUB_RE` (nó đòi đúng hai `#` rồi khoảng trắng ở
    đầu dòng), nên các mục tinh túy nằm TRONG khối `### n.m` của chúng — đúng
    thứ cổng tinh túy cần.
    """
    marks = [(m.start(), f"{m.group(1)}.{m.group(2)}") for m in SUB_RE.finditer(text)]
    out = {}
    for i, (pos, dc) in enumerate(marks):
        stop = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        out[dc] = text[pos:stop]
    return out



# ═══ url_normalized — ĐƠN VỊ ĐẾM NGUỒN ĐỘC LẬP ═══════════════════════════════
# Đếm theo `url` thô thì thêm ?utm_source= là ra "nguồn độc lập" mới, và hệ số
# kiểm chứng chéo bị thổi phồng bằng một thao tác copy link. Hệ số đó đi thẳng
# vào priority, và priority quyết định có sinh skill điều khiển agent hay không.

TRACKING = re.compile(
    r"^(utm_\w+|fbclid|gclid|msclkid|mc_[ce]id|ref|ref_src|source|si|feature|igshid|"
    r"spm|_ga|yclid|twclid|trk|trkCampaign|sc_channel|sc_campaign|at_\w+)$", re.I)


def normalize_url(url):
    """Quy URL về dạng so sánh được. Trả chuỗi rỗng nếu không parse nổi.

    Bốn phép, theo spec M02 §2.3:
      bỏ tracking param · bỏ www. · youtu.be/X → youtube.com/watch?v=X
      · arxiv.org/pdf/X → arxiv.org/abs/X
    """
    if not url or not isinstance(url, str):
        return ""
    u = url.strip()
    if not u:
        return ""

    # Bỏ scheme và fragment — http/https cùng một nguồn, #section là vị trí đọc
    u = re.sub(r"^[a-z][a-z0-9+.-]*://", "", u, flags=re.I)
    u = u.split("#", 1)[0]

    duong, _, truy_van = u.partition("?")
    duong = duong.rstrip("/")

    # www. là tiền tố hiển thị, không phải danh tính
    duong = re.sub(r"^www\.", "", duong, flags=re.I)
    chu = duong.lower().split("/", 1)[0]
    con = duong[len(duong.split("/", 1)[0]):]

    tham = [kv for kv in truy_van.split("&")
            if kv and not TRACKING.match(kv.split("=", 1)[0])]

    # youtu.be/X → youtube.com/watch?v=X (cùng video, hai cách viết)
    if chu == "youtu.be" and con:
        vid = con.lstrip("/").split("/")[0]
        if vid:
            return f"youtube.com/watch?v={vid}"

    # tiktok.com/@handle/video/ID → tiktok.com/video/ID  (FR-036/B2)
    #
    # `@handle` KHÔNG phải danh tính của video — id mới là. Hai người chia sẻ
    # cùng một video qua hai handle (repost, đổi tên tài khoản) phải chuẩn hoá về
    # MỘT, không thì hệ số kiểm chứng chéo bị thổi phồng bằng một lần đổi tên —
    # đúng lớp lỗi mà `url_normalized` sinh ra để chặn cho `?utm_source=`.
    #
    # `vm.tiktok.com/<short>` là redirect phía SERVER, không giải được offline.
    # Không bịa một id: trả host+path và để cổng nói ra. Form nạp phải nhắc người
    # dùng dán link đầy đủ — bịa id ở đây là bịa một danh tính.
    if chu.endswith("tiktok.com"):
        m = re.search(r"/video/(\d+)", con)
        if m:
            return f"tiktok.com/video/{m.group(1)}"

    # arxiv.org/pdf/X(.pdf|vN) → arxiv.org/abs/X — bản pdf và abs là một bài
    if chu.endswith("arxiv.org"):
        m = re.search(r"/(?:pdf|abs)/([^/?]+)", con)
        if m:
            ma = re.sub(r"(\.pdf|v\d+)$", "", m.group(1))
            return f"arxiv.org/abs/{ma}"

    # youtube.com: chỉ giữ v= — playlist/timestamp không đổi danh tính video
    if chu.endswith("youtube.com") and con.startswith("/watch"):
        v = next((kv for kv in tham if kv.lower().startswith("v=")), None)
        if v:
            return f"youtube.com/watch?{v}"

    goc = chu + con
    return goc + ("?" + "&".join(sorted(tham)) if tham else "")


def check(path, schema, concepts, categories=None, kho=None):
    errs, warns = [], []
    text = path.read_text(encoding="utf-8")
    raw_fm, body = split_frontmatter(text)

    # 1 — frontmatter tồn tại và parse được
    if raw_fm is None:
        return ["Không có frontmatter YAML — mức C hoặc D, xem intake.md"], []
    try:
        fm = normalize_yaml(yaml.safe_load(raw_fm) or {})
    except yaml.YAMLError as e:
        return [f"Frontmatter không parse được: {str(e)[:120]}"], []

    # 2 — khớp schema
    for e in sorted(Draft202012Validator(schema).iter_errors(fm), key=lambda x: list(x.path)):
        loc = ".".join(str(p) for p in e.path) or "(gốc)"
        errs.append(f"schema · {loc}: {friendly(e)}")

    # 3 — word_count khai báo khớp thực tế, và dưới trần cứng
    actual = count_words(body)
    declared = fm.get("word_count")
    if declared is not None and abs(declared - actual) > max(15, actual * 0.05):
        errs.append(f"word_count khai {declared} nhưng đếm được {actual}")
    if actual > WORD_CAP_HARD:
        errs.append(f"Vượt trần cứng: {actual} từ (tối đa {WORD_CAP_HARD})")
    elif actual > TRAN_TU_MEM:
        warns.append(f"Vượt trần mềm: {actual} từ")

    # ═══ HỒ SƠ KIỂM — FR-036/B2 ═══════════════════════════════════════════
    #
    # `thu-vien` là kho NGUYÊN LIỆU: hiện vật + nhãn. Nó không có thân bài để
    # kiểm hình dạng, nên bốn cổng dưới (thiếu mục · trần dẫn nhập · tinh túy ·
    # locator) KHÔNG áp. Bù lại nó có ba cổng riêng ở nhánh dưới.
    #
    # THIẾU TRƯỜNG ⇒ `phan-tich`. Nhờ vậy không file nào trong kho phải sửa vì
    # FR này, và một bài cũ vô tình mất trường không tự nhiên được miễn cổng.
    #
    # MỘT CỬA GHI GIỮ NGUYÊN: `ghiSauValidate` không đổi một dòng. Đây là một
    # nhánh trong `check()`, không phải một validator thứ hai — hai validator là
    # đúng thứ M05-R3 cấm.
    ho_so = fm.get("ho_so") or "phan-tich"

    if ho_so == "thu-vien":
        # HỒ SƠ THƯ VIỆN CHỈ ÁP CHO HAI LOẠI NGUỒN.
        #
        # Lỗ này do ca âm `check_ci_teeth` bắt được, không do tôi nghĩ ra: bản
        # đạt chuẩn (202 từ, `source_type: paper`) dán thêm một dòng
        # `ho_so: thu-vien` thì thoát CẢ BỐN cổng hình dạng — 202 < trần 400 nên
        # cổng "thân dài" không bắn, và `paper` không phải `tai-lieu`/`video` nên
        # hai cổng kia cũng không.
        #
        # Gốc là tôi cho hồ sơ này áp cho mọi loại nguồn. Nhưng một `paper`,
        # `repo`, `article`, `docs`, `announcement` LÀ một bản phân tích theo
        # định nghĩa của chính loại nó — thư viện giữ tài liệu và video, không
        # giữ "paper". Chặn ở đây đóng lỗ bằng một mệnh đề về NGHĨA, không phải
        # bằng một ngưỡng đoán.
        if fm.get("source_type") not in LOAI_THU_VIEN:
            errs.append(
                f"ho_so: thu-vien chỉ áp cho {' hoặc '.join(LOAI_THU_VIEN)} — "
                f"source_type '{fm.get('source_type')}' là một bản phân tích, "
                f"đặt ho_so: phan-tich")
        # Thân dài nghĩa là đây là bản PHÂN TÍCH đặt sai hồ sơ. Nói ra thay vì
        # im lặng miễn cổng cho nó — im lặng ở đây là cách một bản phân tích
        # trốn hết cổng hình dạng bằng một dòng frontmatter.
        if actual > TRAN_TU_THU_VIEN:
            errs.append(
                f"hồ sơ thu-vien nhưng thân {actual} từ (trần {TRAN_TU_THU_VIEN}) "
                f"— đây là bản phân tích, đặt ho_so: phan-tich")
        # Miễn thân thì phải có thứ THAY THẾ, không thì đây là bản ghi rỗng.
        if fm.get("source_type") == "tai-lieu" and not _hien_vat(fm):
            errs.append("source_type tai-lieu nhưng không khai media "
                        "— không có hiện vật thì không có bản ghi")
        # T01-45 quyết 2 · media NGHE/XEM thuộc bản ghi `video`.
        #
        # Lỗ `MP4-lạc-bảng` (backlog M12): mp4 vào kho được qua ô file của TÀI
        # LIỆU — ô đó không lọc gì — nên một video nằm ở bảng tài liệu và không
        # màn video nào thấy nó. Nó không sai schema, không sai magic; nó chỉ ở
        # sai bảng, và đó là loại lỗi không cổng nào bắt.
        #
        # So bằng TIỀN TỐ `video/`|`audio/`, không bằng một danh sách mime: danh
        # sách ở đây là bản sao thứ hai của `media-mime.json`, và thêm một dòng
        # mime ở đó sẽ âm thầm không được luật này bao.
        #
        # ⚠️ LUẬT HẸP HƠN CÂU CHỮ CỦA QUYẾT 2, và phải nói vì sao.
        #
        # Đọc quyết 2 theo nghĩa rộng — *"tai-lieu mang bất kỳ media video/audio
        # ⇒ đỏ"* — thì nó **đá chính ca mà `FR-052` nêu làm lý do tồn tại**:
        # *"M16 sinh slide + giọng đọc + video cho MỘT bài"*. Đo được: ca âm
        # `test_thu_vien_HAI_hien_vat_di_qua` (pdf + mp3) đỏ ngay.
        #
        # Hai quyết định đã ký chỏi nhau, nên phải tìm nghĩa bao được cả hai. Lỗ
        # THẬT mà quyết 2 đóng là *"MP4 lạc bảng"*: một bản ghi mà hiện vật
        # CHÍNH là video, lọt vào bảng tài liệu qua ô file không lọc. Bản ghi đó
        # **không có hiện vật tài liệu nào**.
        #
        # ⇒ Đỏ khi media CHỈ có nghe/xem. Giọng đọc kèm slide vẫn qua.
        #   Chỗ này chờ chủ dự án xác nhận — `FR-063`.
        if fm.get("source_type") == "tai-lieu" and isinstance(fm.get("media"), list):
            mimes = [str(md.get("mime", "")) for md in fm["media"]
                     if isinstance(md, dict)]
            nghe_xem = [m for m in mimes if m.startswith(("video/", "audio/"))]
            if mimes and len(nghe_xem) == len(mimes):
                errs.append(
                    f"source_type tai-lieu nhưng media CHỈ có {', '.join(sorted(set(nghe_xem)))} "
                    f"— không có hiện vật tài liệu nào thì đây là bản ghi video, "
                    f"đổi source_type hoặc nạp lại ở màn video")
        if fm.get("source_type") == "video" and not fm.get("media") \
                and not fm.get("url_normalized"):
            errs.append("video hồ sơ thu-vien phải khai url_normalized "
                        "— đó là đơn vị đếm nguồn độc lập")
    # Bốn cổng HÌNH DẠNG dưới đây chỉ áp cho `phan-tich`. Không tách thành hàm
    # riêng: ca âm `test_ho_so_phan_tich_van_bi_chan_khi_thieu_muc` đã canh việc
    # nhánh mới nuốt cổng cũ, và một hàm nữa chỉ để "cho gọn" là một tầng gián
    # tiếp không ai đọc.
    secs, subs = {}, {}
    """WO-094 · BẢN MÁY SINH không bị ép KHUNG 5 MỤC."""
    # Chủ dự án 2026-09-10: *"ko áp phan-tich (ép 5 mục) cho chưng cất, mọi thứ
    # để tự nhiên — người và model LLM quyết"* (`FR-036a`, duyệt và thu hẹp).
    #
    # Nhận diện bằng `origin: pipeline` — đúng sự thật (`worker.py:504` ghi nó
    # cho mọi bản máy sinh) và KHÔNG đụng `ho_so`, vốn FROZEN và chỉ có hai nấc:
    # nấc còn lại (`thu-vien`) bỏ luôn trần 400 từ, nên một bản chưng cất 6000
    # từ sẽ trượt ở đó.
    #
    # MIỄN ĐÚNG BA phép về HÌNH DẠNG — thiếu mục · trần dẫn nhập · locator theo
    # mục. Mọi phép còn lại (trần từ · nhãn trong danh mục · schema) VẪN chạy:
    # `pipeline` là miễn khung, không phải một đường vòng qua mọi cổng.
    #
    # Bản `origin: manual` KHÔNG được miễn — người viết tay vẫn theo khung. Đó
    # là khác biệt giữa NỚI một cổng và BỎ một cổng.
    tu_do_khung = str(fm.get("origin") or "") == "pipeline"
    if ho_so != "thu-vien" and not tu_do_khung:
        # Thiếu mục — MỘT append cho cả mục và mục con. Tách thành hai append thì
        # `check_rule_surfaces.py` đòi thêm một test tương ứng, và số cổng khai ở
        # M01_core/spec.md lệch với số append thật.
        secs = sections(body)
        subs = {dc: t for m, ds in CON.items() if m in secs
                for dc, t in sub_sections(secs[m]).items() if dc in ds}
        missing = ([str(n) for n in SO_MUC if n not in secs]
                   + [dc for ds in CON.values() for dc in ds if dc not in subs])
        if missing:
            errs.append(f"Thiếu mục: {', '.join(missing)}")

        # 4 — phần DẪN NHẬP không được quá trần
        #
        # Bản trước là "mục 5+6 ≥35%" — một SÀN trên phần lõi. Khung 5 mục làm nó
        # VÔ NGHĨA: §3 hút cả bốn mục cũ (3,4,5,6) nên nó ~70% thân bài kể cả khi
        # phần dẫn nhập phình ra. Ý định không đổi — chặn người viết viết lại phần
        # dẫn nhập thay vì đọc thật — nên đo ở CHỖ BỊ LẠM DỤNG: TRẦN trên §1+§2.
        #
        # Guard là `if actual:` chứ KHÔNG phải `if 1 in secs and 2 in secs` — đó là
        # lỗ của cổng cũ: xoá mục là cổng tự tắt. Mục vắng thì góp 0 từ, và cổng
        # "thiếu mục" ở trên đã lo việc nó vắng.
        if actual:
            dan_nhap = sum(count_words(secs[n]) for n in DAN_NHAP if n in secs)
            ratio = dan_nhap / actual
            if ratio > TRAN_DAN_NHAP:
                ten_dn = "+".join(str(n) for n in DAN_NHAP)
                errs.append(
                    f"Mục {ten_dn} chiếm {ratio:.0%} (trần {TRAN_DAN_NHAP:.0%}) "
                    f"— dấu hiệu đang viết lại phần dẫn nhập thay vì đọc thật")

    # 5 — concepts phải nằm trong danh mục kiểm soát
    if concepts is not None:
        for c in fm.get("concepts") or []:
            if c not in concepts:
                errs.append(f"concepts · '{c}' không có trong concepts.yaml — đưa vào concepts_proposed")
    if fm.get("concepts_proposed"):
        warns.append(f"{len(fm['concepts_proposed'])} khái niệm chờ duyệt danh mục")

    # 5b — category cũng vậy (FR-034 — trước là enum trong schema; enum rời
    # schema để giết đường ghi-schema-kép, cổng chuyển về đây, gương cổng 5).
    # categories=None nghĩa là cổng TẮT — giữ 30 test cũ gọi 3 tham số nguyên.
    if categories is not None:
        for c in fm.get("category") or []:
            if c not in categories:
                errs.append(
                    f"category · '{c}' không có trong danh mục chủ đề — "
                    f"thêm qua POST /api/categories trước, hoặc bỏ khỏi bài")

    # 6 — ĐÃ BỎ (WO-038). Luật cũ đòi mỗi bài có `#### 3.4.x` và mỗi mục đủ
    # cả 5 dòng bullet (Không hiển nhiên vì · Chuyển giao · Tin cậy · Bằng
    # chứng · Loại).
    #
    # Người dùng chốt mục tinh túy là MỘT ô văn xuôi như mọi ô khác. Giữ luật
    # này mà bỏ ô con thì form sinh ra bài mà chính kho từ chối — 422 trên
    # đường đi của người dùng, do hai đầu nói hai hợp đồng.
    #
    # Cái MẤT, nói thẳng: tinh túy thôi được máy kiểm. Không còn gì ép người
    # viết trả lời "bằng chứng đâu" và "loại gì". Đó là đánh đổi đã chọn,
    # không phải chỗ quên.
    #
    # Luật §7 (locator) VẪN áp cho mục này — xem `CAN_LOCATOR`.

    # 7 — mọi mục nội dung phải có locator hoặc [suy đoán].
    # `CAN_LOCATOR` là danh sách ĐỊA CHỈ ("3.2", "4") vì sau khung 5 mục thì mục
    # cần locator nằm cả ở cấp mục con. Ánh xạ 1:1 với tập (4,5,6) cũ, cộng §4
    # mới (nó đòi "một ví dụ thực tế" — ví dụ không có địa chỉ là ví dụ bịa).
    for dc in CAN_LOCATOR:
        khoi = subs.get(dc) if "." in dc else secs.get(int(dc))
        if khoi is not None and not tach_dia_chi(khoi):
            goi = " · ".join(d["vi_du"] for d in DANG_DIA_CHI) or "(bảng khai trống)"
            errs.append(f"Mục {dc} không có địa chỉ nào máy hiểu — "
                        f"mọi khẳng định phải có địa chỉ. Dạng nhận: {goi}")

    # 7b — `citations_*` là DỮ LIỆU DẪN XUẤT (B-A6). Cùng nhóm `word_count`
    # và `url_normalized`: máy đếm, khai lệch thì đỏ. Trước C1 hai trường này
    # đọc bằng `fm.get()` và KHÔNG dòng nào tính chúng — một agent ghi
    # `sampled: 5 / verified: 5` rồi rải `[§II.4]` là qua sạch bộ máy chống bịa.
    #
    # Cổng TẮT khi `kho is None` — giữ nguyên mọi lời gọi ba/bốn tham số.
    ds = tach_dia_chi(body)
    dem_mau = len(ds)
    dem_that = sum(1 for _, ten, manh, k in ds if phan_giai(ten, manh, k, kho))
    # Địa chỉ được phép báo LINK GÃY — khai ở `bat_link_gay`, KHÔNG suy từ
    # `manh`. Trộn hai thứ đó là đỏ oan: `[backend]` trong một ví dụ
    # `category: [backend]` khớp dạng `slug` y hệt một địa chỉ thật.
    dem_kha_thi = sum(1 for _, ten, _m, _k in ds if ten in _BAT_GAY)
    dem_gay = sum(1 for _, ten, manh, k in ds
                  if ten in _BAT_GAY and not phan_giai(ten, manh, k, kho))
    if kho is not None:
        for ten_truong, may in (("citations_sampled", dem_mau),
                                ("citations_verified", dem_that)):
            khai = fm.get(ten_truong)
            if khai is not None and int(khai) != may:
                errs.append(f"{ten_truong} khai {khai} nhưng máy đếm {may} — "
                            f"đây là dữ liệu dẫn xuất, không phải lời khai")

        # 7c — có địa chỉ nhưng KHÔNG cái nào phân giải được. Không loại bài:
        # ép cờ, và schema đã cấm cờ này đi cùng `credibility_max: verified`.
        # Nên `[§II.4]` vẫn vào kho được nhưng vĩnh viễn không đoạt `verified`.
        # Vắng cũng đỏ, không chỉ khai false: schema chỉ cấm
        # `credibility_max: verified` khi cờ này CÓ và true. Vắng thì luật đó
        # không bao giờ bắn, và cả việc này thành trang trí. `--fix` điền được.
        co_hien = fm.get("unverifiable_citations")
        if dem_mau and not dem_that and co_hien is not True:
            errs.append(f"{dem_mau} địa chỉ, KHÔNG cái nào phân giải được ⇒ "
                        f"unverifiable_citations phải là true "
                        f"(đang là {co_hien!r}) — chạy `--fix`")

    # 8 — file từ ngoài: spot-check và trạng thái
    if fm.get("origin") == "external":
        # C1: khi cổng địa chỉ bật, dùng số MÁY ĐẾM. Đọc `fm.get` ở đây là
        # để lời khai quyết định một cổng chống-lời-khai.
        sampled = dem_mau if kho is not None else fm.get("citations_sampled", 0)
        verified = dem_that if kho is not None else fm.get("citations_verified", 0)
        if sampled < 2:
            errs.append(f"origin external nhưng citations_sampled={sampled} (cần ≥2)")
        # C1: luật này viết cho thời số TỰ KHAI — khai `verified < sampled`
        # là tự nhận thất bại. Với số MÁY ĐẾM, `verified < sampled` là ca
        # BÌNH THƯỜNG của mọi bài trích nguồn ngoài kho. Giữ nguyên là biến
        # quyết định "gắn cờ, không loại bài" (2026-09-01) thành "đỏ cứng".
        # Nên khi cổng địa chỉ BẬT, chỉ đỏ khi một địa chỉ LẼ RA phân giải
        # được mà không được — đó là link gãy, thật sự là lỗi.
        if kho is not None:
            if dem_gay:
                errs.append(f"{dem_gay}/{dem_kha_thi} địa chỉ có cú pháp trỏ thẳng "
                            f"vào kho nhưng KHÔNG phân giải được — link gãy")
        # T01-44 · nhánh này chạy khi `kho` TẮT (phucHoi, validate một file), tức
        # `citations_*` trong file là thứ duy nhất đọc được. Luật cũ còn răng cho
        # ca GỐC của nó: một bản viết tay khai `2/5` mà không khai gì thêm.
        #
        # BỎ QUA khi bản ghi đã khai `unverifiable_citations: true`: lúc đó
        # `verified < sampled` là điều nó đã NÓI RA, không phải điều bị phát hiện.
        # Không có vế này thì mọi bản ghi mà `--fix` vừa điền số máy đếm (0/4) bị
        # loại ở đường PHỤC HỒI — đo được: danh-muc-phan-trang-ep-xoa 422.
        elif verified < sampled and fm.get("unverifiable_citations") is not True:
            errs.append(f"Spot-check trượt: {verified}/{sampled} locator khớp — loại cả bản")
        if fm.get("unverifiable_citations") and fm.get("credibility_max") == "verified":
            errs.append("unverifiable_citations=true thì credibility_max không thể là verified")

    # 9 — url_normalized là DỮ LIỆU DẪN XUẤT, phải khớp hàm tính
    # Khai tay thì hai bản cùng nguồn đếm thành hai nguồn độc lập, và hệ số
    # kiểm chứng chéo bị thổi phồng. M02 §2.3.
    if fm.get("url") and fm.get("url_normalized"):
        dung = normalize_url(fm["url"])
        if dung and fm["url_normalized"] != dung:
            errs.append(
                f"url_normalized khai '{fm['url_normalized']}' nhưng chuẩn hoá "
                f"'{fm['url']}' ra '{dung}'")

    if fm.get("review_status") == "rejected" and not fm.get("reject_reason"):
        errs.append("Loại bản phân tích thì bắt buộc ghi reject_reason")

    return errs, warns


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target", type=Path)
    ap.add_argument("--schema", type=Path, default=SCHEMA_PATH)
    ap.add_argument("--concepts", type=Path, default=None,
                    help="Mặc định tìm concepts.yaml cạnh target")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true", help="Cảnh báo cũng tính là lỗi")
    ap.add_argument("--no-concepts", action="store_true",
                    help="Tắt tường minh cổng danh mục khái niệm. Không có cờ này mà "
                         "thiếu concepts.yaml thì báo lỗi, không im lặng bỏ qua.")
    ap.add_argument("--categories", type=Path, default=None,
                    help="FR-034 — danh mục chủ đề. Mặc định tìm categories.yaml cạnh target")
    ap.add_argument("--no-categories", action="store_true",
                    help="Tắt tường minh cổng danh mục chủ đề — cùng luật --no-concepts")
    ap.add_argument("--kho", type=Path, default=None,
                    help="Gốc kho để phân giải địa chỉ (B-A5). Mặc định: chính "
                         "target khi target là THƯ MỤC. File lẻ phải khai tường minh.")
    ap.add_argument("--no-kho", action="store_true",
                    help="Tắt tường minh cổng địa chỉ (B-A5/B-A6) — cùng luật --no-concepts")
    ap.add_argument("--fix", action="store_true",
                    help="Ghi lại word_count cho đúng số đếm được")
    a = ap.parse_args()

    # Console Windows mặc định cp1252 không in được dấu tiếng Việt.
    # Không sửa thì script crash ở dòng tổng kết SAU khi đã validate xong,
    # và CI đọc traceback thành "fail" kể cả khi 0 lỗi.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    schema = json.loads(a.schema.read_text(encoding="utf-8"))

    cpath = a.concepts
    if cpath is None:
        root = a.target if a.target.is_dir() else a.target.parent
        for cand in (root / "concepts.yaml", root.parent / "concepts.yaml"):
            if cand.exists():
                cpath = cand
                break
    concepts = None
    if cpath and cpath.exists():
        # `or []` — danh mục RỖNG khác danh mục THIẾU.
        #
        # Một concepts.yaml chỉ còn comment (mọi mục đã xoá) parse ra `None`, và
        # `{c["id"] for c in None}` sập bằng TypeError giữa lúc validate — người
        # dùng thấy traceback chứ không thấy câu nào nói kho họ đang sai chỗ nào.
        #
        # Rỗng phải nghĩa là "danh mục đóng, chưa có mục nào" ⇒ mọi `concepts`
        # trong bài đều bị chặn, đúng luật M02-R3. Còn "thiếu file" mới là cổng
        # TẮT, và `catalog_missing` bên dưới lo ca đó. Gộp hai thứ này thành một
        # là biến một kho rỗng hợp lệ thành một tai nạn.
        concepts = {
            c["id"] for c in (yaml.safe_load(cpath.read_text(encoding="utf-8")) or [])
        }

    # FR-034 — danh mục chủ đề, cùng khuôn resolution với concepts:
    # RỖNG (file toàn comment) = danh mục đóng chưa có mục ⇒ mọi category bị
    # chặn; THIẾU file = cổng tắt ⇒ catalog_missing báo lỗi kho.
    tpath = a.categories
    if tpath is None:
        root = a.target if a.target.is_dir() else a.target.parent
        for cand in (root / "categories.yaml", root.parent / "categories.yaml"):
            if cand.exists():
                tpath = cand
                break
    categories = None
    if tpath and tpath.exists():
        categories = {
            c["id"] for c in (yaml.safe_load(tpath.read_text(encoding="utf-8")) or [])
        }

    # C1 (B-A5/B-A6) — GỐC KHO để phân giải địa chỉ. Cùng khuôn resolution
    # với concepts/categories, nhưng khác một điểm: kho là THƯ MỤC, không
    # phải file. Kiểm một file lẻ thì gốc là thư mục cha của thư mục chứa
    # nó (`kb/docs/x.md` -> `kb/`), vì địa chỉ `[slug]` tra ở `kb/*/slug.md`.
    kho = None
    if not a.no_kho:
        # CHỈ tự động khi target là THƯ MỤC. Bản đầu đoán
        # `target.parent.parent` cho file lẻ rồi bật cổng nếu thư mục đó có
        # bất kỳ `*/*.md` nào — trong tmp của pytest, một thư mục anh em của
        # test KHÁC làm điều kiện đó đúng, và cổng tự bật. Một cổng bật/tắt
        # theo bố cục thư mục xung quanh thì không đoán được, mà không đoán
        # được thì không tin được. File lẻ muốn bật: khai `--kho`.
        kho = a.kho if a.kho else (a.target if a.target.is_dir() else None)

    catalog_missing = concepts is None and not a.no_concepts
    category_catalog_missing = categories is None and not a.no_categories

    # README.md và file bắt đầu bằng _ là tài liệu của kho, không phải bản phân tích.
    def is_analysis(p):
        # Xét CẢ THƯ MỤC, không chỉ tên file.
        #
        # `kb/_media/` chứa byte NGƯỜI TẢI LÊN, đặt tên theo `sha256`. Từ khi
        # `.md`/`.txt` được nhận làm nguyên liệu (`T03-111`), một file upload
        # tên `cd31…c55c.md` lọt qua phép lọc cũ — tên nó không bắt đầu bằng
        # `_`, chỉ thư mục cha mới bắt đầu bằng `_`. Hệ quả: tải lên MỘT file
        # `.md` là `validate.py kb/ --strict` đỏ, và nó nằm trong `RUNNING.md`
        # nên kéo `check_running` đỏ theo.
        #
        # Bản upload thô không có frontmatter là ĐÚNG — nó chưa được chưng cất.
        if any(x.startswith("_") for x in p.relative_to(a.target).parts[:-1]):
            return False
        return p.name.lower() != "readme.md" and not p.name.startswith("_")

    files = ([f for f in sorted(a.target.rglob("*.md")) if is_analysis(f)]
             if a.target.is_dir() else [a.target])
    results, n_err, n_warn = [], 0, 0

    if a.fix:
        for f in files:
            txt = f.read_text(encoding="utf-8")
            raw, body = split_frontmatter(txt)
            if raw is None:
                continue
            n = count_words(body)
            new = re.sub(r"^word_count:\s*\d+\s*$", f"word_count: {n}", raw, flags=re.M)
            if new == raw and "word_count:" not in raw:
                new = raw.rstrip("\n") + f"\nword_count: {n}\n"
            noi = [f"word_count = {n}"] if new != raw else []

            # ── citations_* + unverifiable_citations (B-A6) ──────────────
            #
            # KHÁC `url_normalized` ngay dưới ở một điểm, và điểm đó là cả ý
            # nghĩa của B-A6: `url_normalized` chỉ điền KHI VẮNG vì ghi đè một
            # lời khai là xoá bằng chứng. `citations_*` thì NGƯỢC — chúng là số
            # MÁY ĐẾM, nên lời khai cũ chính là thứ phải bị thay.
            if kho is not None:
                ds_f = tach_dia_chi(body)
                mau_f = len(ds_f)
                that_f = sum(1 for _, t, m, k in ds_f if phan_giai(t, m, k, kho))
                for ten_f, gt in (("citations_sampled", mau_f),
                                  ("citations_verified", that_f)):
                    truoc = new
                    new = re.sub(rf"^{ten_f}:\s*\d+\s*$", f"{ten_f}: {gt}",
                                 new, flags=re.M)
                    if new == truoc and f"{ten_f}:" not in new:
                        new = new.rstrip("\n") + f"\n{ten_f}: {gt}\n"
                    if new != truoc:
                        noi.append(f"{ten_f} = {gt}")
                if mau_f and not that_f:
                    truoc = new
                    new = re.sub(r"^unverifiable_citations:.*$",
                                 "unverifiable_citations: true", new, flags=re.M)
                    if new == truoc and "unverifiable_citations:" not in new:
                        new = new.rstrip("\n") + "\nunverifiable_citations: true\n"
                    if new != truoc:
                        noi.append("unverifiable_citations = true")

            # ── url_normalized — DỮ LIỆU DẪN XUẤT, cùng nguyên tắc word_count ──
            #
            # VÌ SAO ĐIỀN Ở ĐÂY chứ không ở FE: cổng `:289` đòi video hồ sơ
            # `thu-vien` khai trường này, nên đường nạp video phải có nó. Tính
            # bằng JS là bản THỨ HAI của `normalize_url()` — đúng lớp lỗi "hai
            # công thức, không ai đối chiếu" đã trúng ở `dongBoThe`. MỘT công
            # thức, chạy MỘT nơi, và FE chỉ gửi `url` thô.
            #
            # CHỈ khi VẮNG. Ghi đè một lời khai có sẵn là xoá bằng chứng của
            # cổng 9 (`:383`) — cổng đó tồn tại để bắt lời khai LỆCH hàm tính,
            # và một `--fix` ghi đè làm nó không bao giờ đỏ được nữa.
            if not re.search(r"^url_normalized:[ \t]*\S", new, flags=re.M):
                m_url = re.search(r"^url:[ \t]*[\"']?([^\"'\n]+)", new, flags=re.M)
                chuan = normalize_url(m_url.group(1).strip()) if m_url else None
                # Rỗng thì KHÔNG ghi: khai một trường không có nội dung là khai
                # một lời rỗng, và host lạ trả về đúng chuỗi rỗng đó.
                if chuan:
                    dong = 'url_normalized: "' + chuan + '"'
                    if re.search(r"^url_normalized:[ \t]*$", new, flags=re.M):
                        new = re.sub(r"^url_normalized:[ \t]*$", dong, new,
                                     count=1, flags=re.M)
                    else:
                        new = new.rstrip("\n") + "\n" + dong + "\n"
                    noi.append("url_normalized = " + chuan)

            if new != raw:
                f.write_text("---" + new + "\n---" + body, encoding="utf-8")
                print(f"fix   {f} · " + " · ".join(noi))

    for f in files:
        errs, warns = check(f, schema, concepts, categories, kho)
        n_err += len(errs)
        n_warn += len(warns)
        results.append({"file": str(f), "errors": errs, "warnings": warns})

    catalog_err = []
    if catalog_missing:
        catalog_err.append(
            "Không tìm thấy concepts.yaml — cổng chống tự sinh khái niệm đang TẮT. "
            "Chép assets/concepts.seed.yaml thành kb/concepts.yaml, hoặc chạy với --no-concepts "
            "để tắt tường minh.")
        n_err += 1
    if category_catalog_missing:
        catalog_err.append(
            "Không tìm thấy categories.yaml — cổng danh mục chủ đề đang TẮT (FR-034). "
            "Chạy `python core/tools/xuat_kho.py` để export từ DB, hoặc --no-categories "
            "để tắt tường minh.")
        n_err += 1

    if a.json:
        print(json.dumps({"files": results, "error_count": n_err, "warning_count": n_warn,
                          "catalog_errors": catalog_err}, ensure_ascii=False, indent=2))
    else:
        for r in results:
            if not r["errors"] and not r["warnings"]:
                print(f"OK    {r['file']}")
                continue
            print(f"\n{'FAIL ' if r['errors'] else 'WARN '} {r['file']}")
            for e in r["errors"]:
                print(f"   ✗ {e}")
            for w in r["warnings"]:
                print(f"   ! {w}")
        for e in catalog_err:
            print(f"\n✗ KHO · {e}")
        if concepts is None and a.no_concepts:
            print("\n! Cổng danh mục khái niệm đã tắt tường minh (--no-concepts)")
        if categories is None and a.no_categories:
            print("\n! Cổng danh mục chủ đề đã tắt tường minh (--no-categories)")
        print(f"\n{len(files)} file · {n_err} lỗi · {n_warn} cảnh báo")

    sys.exit(1 if n_err or (a.strict and n_warn) else 0)


if __name__ == "__main__":
    main()
