// src/app.controller.ts
import { Controller, Get, Render, Req } from '@nestjs/common';

@Controller()
export class AppController {
  // Render trang chủ
  @Get()
  @Render('home')  // Chỉ định file view home.hbs
  getHome(@Req() request: any) {
    // Kiểm tra trạng thái đăng nhập từ session
    const loggedIn = !!request.session.user;  // Kiểm tra nếu có user trong session
    const username = loggedIn ? request.session.user.username : null;  // Nếu đăng nhập, lấy username
    const nickname = loggedIn ? request.session.user.nickname : null;  // Nếu đăng nhập, lấy nickname (nếu có)

    return {
      loggedIn,
      username,
      nickname,
      userId: request.session.user ? request.session.user.id : null,  // Truyền userId nếu người dùng đã đăng nhập
    };
  }
}
