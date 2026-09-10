# Lăng kính theo archetype

Cùng một repo, đọc bằng lăng kính sai sẽ ra bản phân tích vô dụng. Phân tích một framework bằng lăng kính library sẽ cho ra một danh sách API và bỏ mất điều quan trọng nhất — vòng đời mà nó áp đặt.

Mỗi mục dưới đây gồm: trọng tâm, chỗ nên bỏ qua, và "tinh túy" thường nằm ở đâu.

---

## 1. Library / SDK

**Trọng tâm**
- Bề mặt API công khai: đâu là ranh giới giữa public và internal, và ranh giới đó được bảo vệ bằng gì.
- Điểm mở rộng: chỗ người dùng được phép cắm vào. Nếu không có, đó là một quyết định thiết kế đáng chú ý.
- Kỷ luật phiên bản: đọc CHANGELOG tìm breaking change. Cách xử lý deprecation cho biết mức độ trưởng thành thật.
- Xử lý lỗi: exception hierarchy hay error code. Người dùng phân biệt lỗi của mình với lỗi của library bằng cách nào.

**Bỏ qua** — chi tiết implement của internal helper, cấu hình CI, tooling nội bộ.

**Tinh túy thường nằm ở** cách API được thiết kế để khó dùng sai. Tìm những chỗ tác giả cố tình làm cho một thao tác nguy hiểm trở nên khó gọi.

---

## 2. Application / Service

**Trọng tâm**
- Ranh giới hệ thống: nó nói chuyện với cái gì bên ngoài. Vẽ được đường biên là hiểu được nửa hệ thống.
- Luồng dữ liệu từ khi vào tới khi bền vững hóa.
- Mô hình trạng thái: gì nằm trong bộ nhớ, gì trong DB, gì trong cache, và cái nào là nguồn chân lý khi lệch nhau.
- Vận hành: health check, migration, rollback, config theo môi trường.
- Điều gì xảy ra khi phụ thuộc ngoài chết. Timeout, retry, circuit breaker có hay không.

**Bỏ qua** — code UI trừ khi UI chính là sản phẩm, seed data, script tiện ích.

**Tinh túy thường nằm ở** cách xử lý trạng thái không nhất quán và các đường thất bại. Đọc kỹ chỗ có retry và idempotency key.

---

## 3. Framework

**Trọng tâm**
- Đảo ngược điều khiển: framework gọi code người dùng ở những điểm nào. Liệt kê vòng đời đầy đủ.
- Hợp đồng mà người dùng phải tuân theo, và chuyện gì xảy ra khi họ phá vỡ nó.
- Mô hình plugin: đăng ký thế nào, cô lập ra sao, thứ tự thực thi quyết định bởi cái gì.
- Ranh giới magic: chỗ nào dùng metaprogramming, reflection, decorator. Đây là chỗ dễ dùng nhất và cũng khó debug nhất.
- Escape hatch: khi framework không đủ, người dùng thoát ra bằng cách nào.

**Bỏ qua** — code ví dụ, template scaffold.

**Tinh túy thường nằm ở** những đánh đổi mà framework áp đặt lên người dùng, và nó đổi lấy được gì. Framework nào cũng lấy đi sự tự do; câu hỏi là lấy đúng thứ tự do nào.

---

## 4. Infra / Tooling

**Trọng tâm**
- Quy trình thủ công mà nó thay thế. Không hiểu quy trình cũ thì không hiểu tool.
- Mô hình cấu hình: khai báo hay lệnh, và có idempotent không.
- Tính chất về trạng thái: chạy hai lần có an toàn không, dừng giữa đường thì để lại gì.
- Chế độ hỏng: hỏng an toàn hay hỏng bừa. Có dry-run không.
- Điểm tích hợp: hook vào CI, cloud API, hệ điều hành ở đâu.

**Bỏ qua** — logic parse tham số CLI, format bảng đầu ra.

**Tinh túy thường nằm ở** cách nó bảo đảm tính idempotent và cách phục hồi sau khi bị ngắt giữa chừng.

---

## 5. Research / Paper code

**Trọng tâm**
- Ý tưởng thuật toán, tách khỏi phần kỹ thuật quanh nó. Thường nằm trong dưới 200 dòng, phần còn lại là hạ tầng thí nghiệm.
- Điểm khác biệt so với baseline. Đọc code baseline nếu có — chênh lệch chính là đóng góp.
- Giả định ngầm: phân phối dữ liệu, kích thước, phần cứng. Đây là nơi kết quả hay sụp khi đem ra thực tế.
- Khả năng tái lập: seed có cố định không, hyperparameter ở đâu, script eval có khớp bảng số trong bài không.
- Chỗ code lệch với mô tả trong bài. Rất hay xảy ra và rất đáng ghi lại.

**Bỏ qua** — script vẽ hình, code sinh bảng LaTeX, tiện ích tải dataset.

**Tinh túy thường nằm ở** phần lõi thuật toán cộng với danh sách giả định ngầm. Danh sách giả định thường có giá trị thực tiễn cao hơn cả thuật toán.

---

## 6. Agent / AI system

**Trọng tâm**
- Kiến trúc prompt: prompt tĩnh, phần lắp động, và cái gì quyết định phần lắp đó.
- Tool schema: cách mô tả tool cho model, cách validate tham số, cách trả lỗi về cho model.
- Quản lý ngữ cảnh: cắt gì khi tràn, nén thế nào, cái gì được ưu tiên giữ lại. Đây thường là phần khó nhất và ít được viết tài liệu nhất.
- Vòng lặp điều khiển: điều kiện dừng, trần số bước, xử lý khi model gọi tool sai.
- Trạng thái và bộ nhớ: cái gì sống qua một lượt, cái gì sống qua một phiên, cái gì bền vững.
- Eval: có bộ đo hồi quy không, hay chỉ chạy bằng cảm giác.

**Bỏ qua** — code UI chat, lớp bọc streaming.

**Tinh túy thường nằm ở** chiến lược quản lý ngữ cảnh và cách xử lý output sai định dạng của model. Hai chỗ này phân biệt hệ thống chạy được trong production với demo.

---

## Khi archetype lai

Nhiều repo lai hai loại — ví dụ một framework kèm CLI, hoặc một service kèm SDK client. Chọn archetype chính theo *cái mà phần lớn code phục vụ*, rồi bổ sung 2–3 câu hỏi từ lăng kính thứ hai. Đừng chạy đủ hai lăng kính, sẽ loãng.

Dấu hiệu chọn sai lăng kính: tới Pass 3 mà không tìm được đường truy vết nào đáng kể. Khi đó quay lại Pass 0 đổi archetype thay vì cố đi tiếp.
