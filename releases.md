# SuperStock Release Notes 

### Demo: https://superstock.github.io/stockboard/

### Source code: https://github.com/superstock/stockboard (branch refactor)

## Build SS-20160826-02

**Các tính năng trong build này:**

* Bảng Tổng hợp

* Bảng Đầy đủ

* Cố định Mã CP cho các bảng

* Login FB

* Sort tất cả các fields

* Filter data 

* Filter Tín hiệu ngắn hạn

* Filter Ngành

* Saved filter theo từng người dùng

* Add GA tracker

* Highlight row khi hover hoặc click lên row đó

* Search theo mã CP

* Bộ lọc có sẵn

* Format màu các ô theo rule

* Format datetime, number

* Show charts

* Format màu của các ô trong bảng Tổng hợp theo rule

* Bổ sung một số cột mới
 
* Tổng hợp

```
Vượt Đỉnh giá, 

Điểm mua số 1, 

Mã, 

Điểm mua số 2
```

* Đầy đủ 
```
KI, 

Biến động 5 phiên, 

Biến động 20 phiên, 

Giá cao nhất 30 phiên, 

Tăng giá C2, 

Tăng giá C1, 

Canslim, 

sideway, 

Đỉnh giá, 

Điểm mua 1, 

Mã, 

Điểm mua số 2

```

* Thêm tính năng Tắt/Mở Filter

* Update lại Bộ lọc `Cơ bản tốt` (MaVol30 = 30,000)

* Update style (in đậm text)

* Chỉnh màu tím = `#9900FF` (giống V6)

**Các tính năng chưa có trong build này**

* Hiện số người online (pending)

* Xem thời hạn sử dụng bảng giá còn bao lâu

* Bảng Tổng hợp trả về vẫn còn thiếu 1 cột `Báo Bán`

* STT cho bảng

## Lưu ý

* Danh sách cột các bảng tổng hợp, đầy đủ phụ thuộc vào server trả về

* Trong phần sort, nếu cột nào server trả về mà không define rõ là datetime, percentage hay number thì mặc định sẽ sort theo text

* Trong phần format datetime hoặc number, nếu server ko define rõ cột đó là number hay datetime, percentage hay number thì mặc định nó là text

* Filter: danh sách các cột cần filter lấy từ server

* Những cột nào rỗng khi filter theo số sẽ không được hiển thị, Ví dụ: mặc định Point filter là 1, các row nào có Point = rỗng sẽ không được hiển thị

* Bộ lọc có sẵn hiện tại chỉ đưa có 1 bộ lọc
