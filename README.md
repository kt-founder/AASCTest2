# AASCTest2 - Hướng Dẫn Chạy Ứng Dụng NestJS

## Tổng quan

Dự án thực hành NestJS theo bài kiểm tra Vòng 2:

- Bài 1: Nghiên cứu framework NestJS.
- Bài 2: Thuật toán Fibonacci nhanh (matrix và BigInt).
- Bài 3: Server game online (Line 98 và Caro).

## Yêu cầu hệ thống

- Node.js >= 18.x
- npm hoặc yarn
- MySQL server đang chạy

## Cài đặt và chạy ứng dụng

### 1. Clone dự án

```bash
git clone https://github.com/kt-founder/AASCTest2.git
cd AASCTest2
```

### 2. Cài package

```bash
npm install
```

### 3. Cấu hình database MySQL

Trong `src/app.module.ts`:

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'your_mysql_password',
  database: 'aasctest2',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
}),
```

> Tạo database trống:
> 
> ```sql
> CREATE DATABASE aasctest2;
> ```

### 4. Chạy server

```bash
npm run start
```

Mở địa chỉ: `http://localhost:3000/`

## Hướng dẫn chi tiết các bài

### Bài 1: Nghiên cứu NestJS

- Chuẩn MVC Module-Controller-Service-Entity
- Sử dụng ValidationPipe, DTO, Exception Handling
- View Engine Handlebars (.hbs)
- Websocket Gateway cho game online
- Kết nối MySQL bằng TypeORM

### Bài 2: Thuật toán Fibonacci

- Matrix nhanh: `http://localhost:3000/fibonacci/matrix`
- BigInt: `http://localhost:3000/fibonacci/calculate`
- Chi tiết trong file Bai2.txt trong src

> Kết quả thời gian chạy in trong **console** server bằng `console.time()` và `console.timeEnd()`.

### Bài 3: Server game online

#### Game Line 98

- Đường dẫn: `http://localhost:3000/line98`
- Logic di chuyển, nổ bóng
- Sinh bóng mới sau mỗi lượt

#### Game Cờ Caro

- Đường dẫn: `http://localhost:3000/games/caro`
- Cách chơi:
  - Người chơi 1 là **X**, người chơi 2 là **O**.
  - Cần chờ lượt người kia xong mới được đi.
  - Bàn cờ 15x15.
- Test:
  - Mở 2 trình duyệt khác nhau hoặc 2 tab ẩn danh.
  - Chọn "Chơi ngẫu nhiên".
  - Hệ thống tự ghép đối và chuyển trang vào game.

#### Công nghệ Socket.IO

- Gửi nhận lượt đi realtime.
- Giao tiếp WebSocket chuẩn trong NestJS.

## Cấu trúc thư mục

```
![image](https://github.com/user-attachments/assets/feb55f7f-5b4f-4838-b5f1-8151f9abc5e5)

```

## Công nghệ sử dụng

- NestJS
- TypeORM
- MySQL
- Socket.IO
- Handlebars (.hbs)
- TailwindCSS

## Lưu ý

- `synchronize: true` tự động tạo lại bảng khi start.
- Kiểm tra console server khi test Fibonacci.
