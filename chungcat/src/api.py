#!/usr/bin/env python3
r"""API của M12 — bốn cửa, stdlib. `AC-1.2` · `AC-1.4` · `AC-1.5` · `AC-4.6`.

    POST /job          tạo việc, trả `viec_id` NGAY (không giữ kết nối)
    GET  /viec/<id>    hỏi tiến độ
    GET  /model        danh mục chỉ-đọc cho bộ chọn của `web/`
    GET  /health

VÌ SAO `http.server` CỦA STDLIB
Bốn endpoint, người gọi **duy nhất** là LÕI trên loopback (`M12-R7`), không auth
người dùng, không CORS, không WebSocket, không giao diện (`Z7`). FastAPI mua
validation + OpenAPI nhưng kéo theo ba gói và **không giải bài nào của M12**.
Ngược lại `AC-1.2` (*bind đúng `127.0.0.1`, cổng đọc từ bảng khai*) dễ chứng
minh hơn hẳn khi đường bind là một dòng của chính ta.

⚠️ `ADR-05`: việc dài chạy **PHÚT**. `POST /job` trả `viec_id` ngay và KHÔNG giữ
kết nối HTTP — một request 5 phút là một request sẽ chết vì timeout ở đâu đó
giữa đường, và chết theo cách không ai biết đã gửi hay chưa.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

R = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(R / "chungcat" / "src"))

import bang_khai  # noqa: E402
import dinh_tuyen  # noqa: E402
import nhat_ky  # noqa: E402
import vong  # noqa: E402

ASSETS = R / "chungcat" / "assets"
DICH_VU = R / "core" / "assets" / "dich-vu.json"

# Khoá service-to-service. `FR-047 §2.1` luật L3: khoá này phải RIÊNG, không
# dùng chung với session của người dùng — `CVE-2025-41258` (LibreChat, CVSS 8.0)
# là ca dùng CÙNG một secret cho session trình duyệt và cho API nội bộ, nên một
# token session hợp lệ xác thực THẲNG vào dịch vụ nội bộ và đi vòng toàn bộ ACL.
def doc_so(gt, mac_dinh: int, *, tran: int = 500) -> int:
    """Đọc một tham số truy vấn thành số. KHÔNG BAO GIỜ ném.

    `int("abc")` ném `ValueError`, và trong `http.server` một ngoại lệ không
    bắt ở handler **giết luồng đang phục vụ**: đo được 2026-09-07 —
    `GET /viec?n=abc` làm thợ đóng kết nối không trả gì
    (`RemoteDisconnected`), cửa web dịch thành `502 · TypeError`. Một ký tự gõ
    nhầm trong thanh địa chỉ không được phép là một sự cố phía máy chủ.

    Ba phép chặn, mỗi phép một lý do khác nhau:
      không phải số  ⇒ mặc định  (người gõ nhầm, không phải người tấn công)
      số ÂM          ⇒ mặc định  (`n` âm vô nghĩa; để nó đi tiếp là đẩy chỗ
                                  hỏng xuống sâu hơn, nơi khó truy hơn)
      quá TRẦN       ⇒ cắt       (`n=999999` bắt đọc cả hàng đợi vào bộ nhớ
                                  cho MỘT lời gọi)
    """
    try:
        n = int(str(gt).strip())
    except (TypeError, ValueError):
        return mac_dinh
    if n <= 0:
        return mac_dinh
    return min(n, tran)


BIEN_KHOA = "CHUNGCAT_KHOA_LOI"


def co_khoa_cua() -> bool:
    """Khoá của CỬA đang dùng đã có trong env chưa.

    Tên biến sống ở `cua.json` (`bien_khoa`) — MỘT chỗ khai, và cả `api.py` lẫn
    `worker.py` đọc từ đó. Gõ tên biến ở hai chỗ là cách hai chỗ trôi khỏi
    nhau, và lần trôi vừa rồi chặn đúng người đã làm đúng.
    """
    from adapter import hop_dong
    bc = hop_dong.doc_cua()
    return bool(os.environ.get(bc["cua"][bc["mac_dinh"]]["bien_khoa"]))


def cong_tu_bang_khai() -> int:
    """`AC-1.2` — số cổng ĐỌC TỪ `dich-vu.json`, không gõ tay.

    Gõ số ở đây là chỗ thứ hai nó xuất hiện, và `Z6` cấm: *"cổng khai MỘT nơi"*.
    """
    d = json.loads(DICH_VU.read_text(encoding="utf-8"))
    for dv in d["dich_vu"]:
        if dv["thu_muc"] == "chungcat":
            return int(dv["cong"])
    raise RuntimeError("`chungcat` không có trong bảng khai dịch vụ")


class Cua(BaseHTTPRequestHandler):
    hang_doi: vong.HangDoi = None
    bang: dict = None

    # ── hạ tầng nhỏ ──────────────────────────────────────────────────────
    def _tra(self, ma: int, than: dict):
        # Mã trả GHI LẠI để `_ghi_nhat_ky` đọc — đo ở ĐÂY chứ không ở mỗi nhánh
        # định tuyến: một `return self._tra(403, …)` mới thêm sẽ tự vào nhật ký,
        # còn nếu bắt từng nhánh thì nhánh mới nào cũng là một lỗ im lặng.
        self._ma_tra = ma
        b = json.dumps(than, ensure_ascii=False).encode("utf-8")
        self.send_response(ma)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _tu_loi(self) -> bool:
        """`AC-1.4`/`M12-R7` — chỉ lời gọi mang danh tính LÕI được nhận.

        Bốn dịch vụ THỢ cùng nằm trên `127.0.0.1`, nên *"bind loopback"*
        (`AC-1.2`) **không** nói được ai gọi. Khoá là thứ nói.

        ⚠️ HÌNH DẠNG GIỮ SẴN (`spec §1.1`): hôm nay chỉ là so chuỗi hằng. Phép
        so an toàn theo thời-gian và vòng đời khoá là việc của đơn vị sau — ghi
        ra để không ai đọc dòng này rồi tưởng đã đủ.
        """
        mong = os.environ.get(BIEN_KHOA)
        return bool(mong) and self.headers.get("X-Khoa-Loi") == mong

    def log_message(self, *_a):
        pass                      # không rải log HTTP vào stdout của cổng

    # ── NHẬT KÝ VẬN HÀNH ─────────────────────────────────────────────────
    #
    # Chỉ đạo 2026-09-05: *"bật logging để đo timeout, workload và debug"*.
    #
    # Bọc ở `do_GET`/`do_POST` chứ không ở `_tra`: cần đo THỜI GIAN của cả lời
    # gọi, và `_tra` chạy ở CUỐI — lúc đó quãng cần đo đã trôi qua. Bọc ở đây
    # còn bắt được ca `_tra` không bao giờ được gọi (ném giữa đường), tức ca
    # người dùng thấy socket đứt và không có dòng nào giải thích.
    #
    # `han_ms` ĐỌC TỪ BẢNG KHAI (`nguong.json#han_ms_cua_tho`), không gõ ở đây.
    #
    # Hai lẽ. Một: một con số chính sách gõ trong mã là con số không ai review
    # được — cùng luật `nguong_fuzzy` và `tran_payload_byte` đã theo. Hai: đo
    # được — `check_nghe_loopback.py` quét MỌI hằng `int` trong khoảng
    # 1024-65535 của file này để bắt số cổng gõ tay (`Z6`), và `HAN_MS = 2000`
    # làm nó ĐỎ. Cổng đó ĐÚNG: người đọc mã không thể biết `2000` là một
    # timeout hay là một cái port.
    HAN_MS = bang_khai.doc_han_ms(ASSETS / "nguong.json")

    def _chay_co_nhat_ky(self, ham):
        self._ma_tra = 0
        with nhat_ky.Dong("api-tho", han_ms=self.HAN_MS,
                          method=self.command,
                          # `path` KHÔNG mang query: `?job=<ulid>` làm mỗi lời
                          # gọi một nhóm riêng, và phân vị của một mẫu là chính
                          # nó. ULID vào trường riêng nếu cần.
                          duong=self.path.split("?")[0]) as d:
            try:
                ham()
            finally:
                d.them(ma=self._ma_tra)

    # ── định tuyến ───────────────────────────────────────────────────────
    def _chi_dan_mau(self) -> dict:
        """Bảng khai preset. Vắng file ⇒ rỗng, không ném: preset là TIỆN ÍCH,
        và mất tiện ích không được làm chết cửa."""
        try:
            return json.loads((ASSETS / "chi-dan-mau.json")
                              .read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}

    def _tran_chi_dan(self) -> int:
        """Trần ký tự — MỘT nguồn khai (`nguong.json`), cửa và FE cùng đọc."""
        try:
            return int(json.loads((ASSETS / "nguong.json")
                                  .read_text(encoding="utf-8"))
                       .get("tran_chi_dan_ky_tu", 500))
        except (OSError, json.JSONDecodeError, TypeError, ValueError):
            return 500

    def _tran_payload(self) -> int:
        """Trần payload — MỘT nguồn khai, cửa và FE cùng đọc.

        Phiếu chưng cất vẽ một thanh *cỡ nguyên liệu / trần*, và mẫu số phải là
        một con số ĐÃ KHAI. Trần này là thứ `egress.gui(tran=...)` kiểm TRƯỚC
        khi payload rời máy (`AC-6.4`), nên nó đúng là cái trần người cần biết
        mình đang ở đâu so với. Một mẫu số bịa cho thanh trông đẹp thì thanh ấy
        là trang trí đội lốt phép đo.
        """
        try:
            return int(json.loads((ASSETS / "nguong.json")
                                  .read_text(encoding="utf-8"))
                       .get("tran_payload_byte", 0))
        except (OSError, json.JSONDecodeError, TypeError, ValueError):
            return 0

    def _do_GET(self):
        if self.path == "/health":
            return self._tra(200, {"ok": True})
        if self.path == "/model":
            # Danh mục CHỈ-ĐỌC cho bộ chọn của `web/` — nhịp 1 của `FR-053 §1.2`.
            # Sinh TỪ bảng khai; gõ lại danh sách ở đây là chỗ thứ hai tên model
            # xuất hiện, và `M12-R4` cấm.
            # LỌC theo `tac_vu_model`: catalog gateway trộn mọi tác vụ
            # (`dall-e-3` sinh ảnh, `sora-2` video, `whisper-1` phiên âm,
            # `web-search` công cụ). Bày tất là bày 12 lựa chọn bấm vào sẽ chết.
            # Danh sách tác vụ ở BẢNG KHAI — thêm `asr` cho `sinh-transcript`
            # sau này là thêm một chuỗi, 0 dòng mã.
            cho_bay = set(self.bang.get("$tac_vu_cho_chung_cat") or ["van-ban"])
            return self._tra(200, {"dong": [
                # `la_mac_dinh` PHẢI ra: bộ chọn cần biết dòng nào là gợi ý
                # để mở sẵn nó. Thiếu nó thì `web/` mở dòng ĐẦU BẢNG — mà bảng
                # nay 238 dòng đồng bộ từ gateway, nên "dòng đầu" là ngẫu nhiên,
                # và người dùng thấy một model không ai chọn cho họ.
                # Không phải bí mật: nó là một quyết định đã khai, và `FR-053
                # §1.1` nói người chọn THẮNG gợi ý — muốn thắng thì phải thấy.
                {k: r[k] for k in ("nha_cung_cap", "model", "khu_vuc",
                                   "can_key", "kieu_structured", "che_do",
                                   "la_mac_dinh", "mien_phi",
                                   # `ho_tro_audio` — phieu SINH TRANSCRIPT loc theo no.
                                   # 22/100 dong nhan audio, va cai bay o ngay model mac
                                   # dinh: `gemini-2.5-flash-lite` KHONG nhan, con
                                   # `google/gemini-2.5-flash-lite` CO. Bay ca 100 dong la
                                   # moi nguoi bam vao 78 dong se chet — va chet AM THAM,
                                   # vi cua BO QUA phan media roi van tra ve mot thu trong
                                   # nhu ban phien am (`beeknoee-api-guide §2.5`).
                                   "ho_tro_audio")}
                for r in self.bang["dong"]
                if r.get("tac_vu_model", "van-ban") in cho_bay
            ], "$canh_bao_mot_gateway": self.bang.get("$canh_bao_mot_gateway"),
                # `T12-25` · PRESET chỉ dẫn đi kèm, KHÔNG một cửa riêng.
                #
                # FE hỏi hai thứ này ở CÙNG một lúc — lúc mở hộp thoại chưng
                # cất. Tách hai cửa là hai request cho một cú bấm, và là hai
                # chỗ để một cái hỏng mà cái kia im.
                #
                # Trần đi kèm để FE đếm ký tự tại chỗ. Nó KHÔNG thay phép kiểm
                # ở server: FE đếm cho người thấy, server chặn cho thật.
                "chi_dan_mau": [
                    {k: m[k] for k in ("ten", "chi_dan")}
                    for m in (self._chi_dan_mau().get("mau") or [])],
                "tran_chi_dan_ky_tu": self._tran_chi_dan(),
                "tran_payload_byte": self._tran_payload()})
        if self.path == "/viec" or self.path.startswith("/viec?"):
            # Đòi khoá LÕI: danh sách việc mang `slug` của nguồn, tức nó lộ
            # **cái gì đang có trong kho**. `/model` mở được vì nó chỉ có tên
            # model; đường này thì không.
            if not self._tu_loi():
                return self._tra(403, {"loi": "chỉ LÕI được liệt kê việc"})
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            return self._tra(200, self.hang_doi.liet_ke(
                giai_doan=(q.get("giai_doan") or [None])[0],
                n=doc_so((q.get("n") or [None])[0], 50),
                # WO-068 · `rac=1` xem THÙNG RÁC (việc hỏng). Mặc định không kể.
                rac=(q.get("rac") or ["0"])[0] in ("1", "true")))
        if self.path.startswith("/viec/"):
            if not self._tu_loi():
                return self._tra(403, {"loi": "chỉ LÕI được hỏi tiến độ việc"})
            try:
                u = self.path.split("/", 2)[2]
                v = self.hang_doi.doc(u)
            except FileNotFoundError:
                return self._tra(404, {"loi": "không có việc đó"})
            # `tien_do` CHỈ cho `sinh-transcript` (`T12-19`). Job chưng cất
            # không sinh cue nào, và gắn một khoá luôn `null` cho nó là dạy FE
            # đọc một trường không bao giờ có nghĩa.
            # `tai-video` cũng phát tiến độ (`T12-27`) — khác hình dạng
            # (số, không phải VTT) nhưng cùng một cửa và cùng một khoá.
            if (v.get("payload") or {}).get("loai") in ("sinh-transcript", "tai-video"):
                td = self.hang_doi.doc_tien_do(u)
                if td:
                    v = {**v, "tien_do": td}
            return self._tra(200, v)
        return self._tra(404, {"loi": "không có đường đó"})

    def do_DELETE(self):                                # noqa: N802
        """`DELETE /viec/<ulid>` — XOÁ HẲN một việc trong thùng rác (WO-070).

        CHỈ việc ở `rac/`: xoá một việc đang chạy là cướp chỗ ghi kết quả của
        worker, và nó im lặng — worker chạy xong rồi ghi vào một file không còn.

        Sổ `egress.*.jsonl` KHÔNG đụng tới. Vết tiền sống độc lập với file việc
        (cùng lý lẽ `don_viec_cu`), nên câu *"đã tiêu bao nhiêu"* vẫn trả lời
        được sau khi thùng rác trống.
        """
        try:
            if not (self.path.startswith("/viec/") and self.path.count("/") == 2):
                return self._tra(404, {"loi": "không có đường đó"})
            if not self._tu_loi():
                return self._tra(403, {"loi": "chỉ LÕI được xoá việc (M12-R7)"})
            u = self.path[len("/viec/"):]
            try:
                v = self.hang_doi.doc(u)
            except FileNotFoundError:
                return self._tra(404, {"loi": "không có việc đó"})
            if v.get("giai_doan") != "hong":
                return self._tra(409, {
                    "loi": f"việc đang ở `{v.get('giai_doan')}`, chỉ xoá được "
                           f"việc trong thùng rác (`hong`)."})
            n = self.hang_doi.xoa_han(u)
            return self._tra(200, {"ulid": u, "da_xoa": n,
                                   "ghi_chu": "Sổ egress giữ nguyên — vết chi phí "
                                              "không nằm trong file việc."})
        except Exception as e:                          # noqa: BLE001
            return self._tra(500, {"loi": f"{type(e).__name__}: {e}"})

    def _do_POST(self):
        # WO-067 · CHẠY LẠI một việc HỎNG từ đúng chặng hỏng.
        #
        # Trước đó `hong` hiện đúng trên màn kèm câu "chạy lại tiếp từ chỗ
        # hỏng" — mà KHÔNG có đường nào để làm điều đó: THỢ chỉ có POST /job,
        # FE không có nút. Một câu hứa không có nút là một câu nói dối lịch sự.
        # `chay_lai` (vong.py) đã có sẵn và giữ luật `M12-R6` (không reset
        # `lan_gui`, chạm trần thì TỪ CHỐI kèm lý do) — đây chỉ là cửa cho nó.
        if self.path.startswith("/viec/") and self.path.endswith("/lai"):
            if not self._tu_loi():
                return self._tra(403, {"loi": "chỉ LÕI được chạy lại việc (M12-R7)"})
            u = self.path[len("/viec/"):-len("/lai")]
            try:
                v = self.hang_doi.doc(u)
            except FileNotFoundError:
                return self._tra(404, {"loi": "không có việc đó"})
            if v.get("giai_doan") != "hong":
                return self._tra(409, {"loi": f"việc đang ở `{v.get('giai_doan')}`, "
                                              f"chỉ chạy lại được việc `hong`."})
            tu = v.get("giai_doan_hong") or "cho"
            # `chay_lai` tự kéo việc ra khỏi `rac/` — nhưng nói ra ở đây để
            # người đọc route không phải đi tìm.
            try:
                v2 = self.hang_doi.chay_lai(u, tu_giai_doan=tu)
            except vong.TranGui as e:
                return self._tra(409, {"loi": str(e)})
            return self._tra(200, {"ulid": u, "giai_doan": v2.get("giai_doan"),
                                   "lan_gui": v2.get("lan_gui")})
        if self.path != "/job":
            return self._tra(404, {"loi": "không có đường đó"})
        if not self._tu_loi():
            # `L2` của `FR-047 §2.1`: thiếu danh tính ⇒ TỪ CHỐI, không rơi về
            # "người dùng mặc định". Fail-open là hình dạng lỗi lặp lại nhiều
            # nhất trong khảo sát đợt năm.
            return self._tra(403, {"loi": "chỉ LÕI được tạo việc (M12-R7)"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            b = json.loads(self.rfile.read(n) or b"{}")
        except Exception as e:
            return self._tra(400, {"loi": f"thân request không đọc được: {e}"})

        # `AC-1.5` · `nguoi_dung_id` do LÕI gán. Payload khai thì BỎ — không
        # phải từ chối, vì từ chối biến một trường bị lột thành một lỗi người
        # dùng thấy, còn hợp đồng nói nó đơn giản là không được tin.
        b.pop("nguoi_dung_id", None)

        # `T12-25` · CHỈ DẪN của người — kiểm ở CỬA, không ở worker.
        #
        # Cửa là chỗ duy nhất trả lời được người gửi. Worker chạy sau, không
        # đồng bộ, nên một chỉ dẫn quá dài phát hiện ở đó chỉ thành một job
        # hỏng — người bấm đã đi khỏi màn.
        #
        # QUÁ TRẦN thì 422, KHÔNG cắt: một chỉ dẫn bị cắt cụt giữa câu đổi
        # nghĩa của chính nó ("đừng nhấn rủi ro" → "đừng nhấn"), và người gửi
        # không bao giờ biết mình đã yêu cầu một thứ khác.
        if b.get("chi_dan") is not None:
            if not isinstance(b["chi_dan"], str):
                return self._tra(422, {"loi": "`chi_dan` phải là chuỗi."})
            tr = self._tran_chi_dan()
            if len(b["chi_dan"]) > tr:
                return self._tra(422, {
                    "loi": f"`chi_dan` dài {len(b['chi_dan'])} ký tự, trần {tr}. "
                           f"Rút gọn rồi gửi lại — máy KHÔNG cắt hộ, vì một câu "
                           f"bị cắt giữa chừng đổi nghĩa của chính nó."})

        # WO-077 · `boi_canh` — cùng phép kiểm với `chi_dan`, cùng trần.
        # Nhận một trường mà không kiểm kiểu/trần là mở một cửa không ai
        # canh: một `boi_canh` dài vô hạn đẩy thẳng vào prompt là một hoá
        # đơn không trần, và một `boi_canh` không phải chuỗi làm worker ném
        # ở chỗ xa cửa này.
        if b.get("boi_canh") is not None:
            if not isinstance(b["boi_canh"], str):
                return self._tra(422, {"loi": "`boi_canh` phải là chuỗi."})
            trb = self._tran_chi_dan()
            if len(b["boi_canh"]) > trb:
                return self._tra(422, {
                    "loi": f"`boi_canh` dài {len(b['boi_canh'])} ký tự, "
                           f"trần {trb}."})
        nguoi = self.headers.get("X-Nguoi-Dung")

        try:
            # `AC-4.6` · xác thực model TẠI ĐÂY, không tin bộ chọn của `web/`.
            # Bỏ nhịp này thì một `curl` thẳng vào `:8790` đi qua lớp xác thực.
            dong = dinh_tuyen.quyet_dinh(
                self.bang, b.get("tac_vu", "chung-cat"), b.get("mau_text", ""),
                model_nguoi_chon=b.get("model"),
                # TÊN BIẾN KHOÁ đọc từ MỘT chỗ khai (`cua.json.bien_khoa`).
                # Bản đầu gõ `CHUNGCAT_KHOA_MODEL` ở đây và `BEEKNOEE_API_KEY`
                # ở `worker.py` — hai bản của một thứ, và biến thứ nhất KHÔNG
                # TỒN TẠI. Hệ quả đo được: người dùng ĐÃ đặt khoá trong `.env`
                # vẫn bị phép chặn (c) của §4.0b từ chối.
                co_khoa=co_khoa_cua(),
            )
        except Exception as e:
            return self._tra(422, {"loi": str(e)})

        ulid = b.get("ulid") or uuid.uuid4().hex
        ulid, da_co = self.hang_doi.nap(ulid, {
            **b, "nguoi_dung_id": nguoi,
            # `model` = model ĐÃ PHÂN GIẢI ở cửa (kể cả khi client không nêu).
            # `model_nguoi_chon` = ĐÚNG thứ client gửi, có thể `None`.
            #
            # Hai trường vì hai câu hỏi khác nhau. Cửa phân giải theo tác vụ
            # `chung-cat`; một job `sinh-transcript` cần model NHẬN AUDIO, và
            # nếu worker chỉ thấy `model` thì nó không phân biệt được
            # *"người đã chọn"* với *"cửa chọn hộ"* — đo được 2026-09-04: mọi
            # job transcript chết ở phép chặn `ho_tro_audio` vì nó nhận mặc
            # định của tác vụ khác.
            "model": dong["model"],
            "model_nguoi_chon": b.get("model"),
        })
        # `FR-071` — `201 Created` cho một lần KHÔNG tạo gì là một câu nói dối,
        # và `web/` dựng màn theo mã trả về: một `201` cho ca *"việc này đã
        # có"* làm màn báo "đã tạo việc" lần thứ hai, rồi người bấm lại vì
        # tưởng lần đầu trượt. `200` + `da_co` để client nói đúng.
        #
        # KHÔNG dùng `409`: nạp lại không phải một xung đột, nó là một phép
        # idempotent THÀNH CÔNG. `409` đẩy client vào nhánh lỗi cho một chuyện
        # không sai.
        return self._tra(200 if da_co else 201,
                         {"viec_id": ulid, "model": dong["model"],
                          "khu_vuc": dong["khu_vuc"],
                          **({"da_co": True} if da_co else {})})


    # Hai cửa vào THẬT bọc trong nhật ký. Giữ `_do_*` nguyên vẹn: phép bọc
    # không được đổi một dòng nào của định tuyến, không thì nhật ký thành một
    # lần viết lại router — và một lần viết lại router là chỗ một nhánh biến
    # mất mà cổng không thấy.
    def do_GET(self):
        self._chay_co_nhat_ky(self._do_GET)

    def do_POST(self):
        self._chay_co_nhat_ky(self._do_POST)


def chay(goc_hang_doi=None, cong=None):
    """Bind `127.0.0.1` — **không** `0.0.0.0`. `AC-1.2`, và `Z3`: chỉ dịch vụ
    khai `nghe_ngoai: true` mới được nghe ngoài loopback; `chungcat` khai `false`."""
    # `.env` nạp MỘT LẦN ở đây, không trong đường nóng. Env thật thắng file —
    # xem `moi_truong.nap`.
    import moi_truong
    moi_truong.nap()
    # BẬT nhật ký ở ĐIỂM VÀO của dịch vụ. Không bật lúc `import`:
    # cổng kiểm cũng `import` module này, và mỗi lời gọi
    # `dat_giai_doan()` của một hàng đợi fixture sẽ thành một dòng
    # trong nhật ký THẬT — rồi "workload" đo được là workload của
    # chính phép đo. Xem `nhat_ky.bat()`.
    nhat_ky.bat("api-tho")
    # `vong.goc_mac_dinh()` — CÙNG phép phân giải với worker (`CHUNGCAT_HANG_DOI`).
    Cua.hang_doi = vong.HangDoi(goc_hang_doi or vong.goc_mac_dinh())
    Cua.bang = bang_khai.doc_model(ASSETS / "model.json")
    # `cong is not None`, KHÔNG `cong or …` — `0` là FALSY, và `0` là cách
    # POSIX nói *"cho OS chọn một cổng rảnh"*. `WO-042`: mọi cổng kiểm truyền
    # `cong=0` đã bind **cổng THẬT 8790**, tưởng mình cô lập.
    #
    # Và nó im lặng: `HTTPServer.allow_reuse_address = 1`, mà trên Windows
    # `SO_REUSEADDR` cho HAI socket bind cùng một cổng thành công ⇒ bind không
    # raise, `server_address` trả 8790, kết nối có thể vào listener CŨ — listener
    # đọc khoá từ env của NÓ ⇒ 403 cho lời gọi mang đúng khoá fixture.
    # Kết quả của cổng kiểm phụ thuộc "có ai đang giữ 8790 không", tức nó không
    # đo thứ nó khai đo.
    return ThreadingHTTPServer(
        ("127.0.0.1", cong if cong is not None else cong_tu_bang_khai()), Cua)


if __name__ == "__main__":
    chay().serve_forever()
