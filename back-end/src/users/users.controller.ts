// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, Render, Req, Res, HttpStatus } from '@nestjs/common'
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginUserDto } from './dto/login-user.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Đăng ký người dùng
  // Hiển thị trang đăng ký
  @Get('register')
  @Render('register')  // Render view register.hbs
  async showRegisterPage() {
    return {};  // Trả về dữ liệu nếu cần cho trang đăng ký (không cần truyền gì trong trường hợp này)
  }
  // Đăng ký người dùng
  @Post('register')
  @Render('register')  // Render lại trang đăng ký nếu có lỗi
  async register(@Body() createUserDto: CreateUserDto, @Req() req: any, @Res() res) {
    try {
      const user = await this.usersService.create(createUserDto);

      // Sau khi đăng ký thành công, lưu thông tin người dùng vào session
      req.session.user = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,  // Nếu chưa có nickname, sử dụng username
      };

      // Chuyển hướng về trang chủ hoặc trang khác sau khi đăng ký thành công
      return res.redirect('/');  // Chuyển hướng về trang chủ sau khi đăng ký thành công
    } catch (error) {
      // Trả về thông báo lỗi và render lại trang đăng ký với thông báo
      return { message: error.message };  // Truyền thông báo lỗi vào view
    }
  }

  // Hiển thị trang đăng nhập
  @Get('login')
  @Render('login')  // Render view login.hbs
  async showLoginPage() {
    return {};  // Trả về dữ liệu cần thiết cho trang đăng nhập nếu cần
  }

  // Đăng nhập người dùng
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto, @Req() req: any, @Res() res) {
    try {
      const user = await this.usersService.login(loginUserDto);
      if (!req.session.user) {
        req.session.user = {};  // Khởi tạo đối tượng user trong session nếu chưa có
      }

      // Lưu thông tin người dùng vào session
      req.session.user = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username, // Nếu chưa có nickname, sử dụng username
      };

      return res.redirect('/');  // Chuyển hướng về trang chủ sau khi đăng nhập thành công
    } catch (error) {
      return res.render('login', { message: error.message});
    }
  }

  // Đăng xuất người dùng
  @Get('logout')
  logout(@Res() res) {
    res.clearCookie('connect.sid'); // Xóa cookie session
    res.redirect('/');  // Chuyển hướng về trang chủ
  }

  // Hiển thị thông tin người dùng
  @Get('profile/:id')
  @Render('profile')  // Render view profile.hbs
  async getUserProfile(@Param('id') id: number) {
    const user = await this.usersService.findById(id);
    return { user };  // Truyền dữ liệu người dùng vào view
  }

  @Get('update/:id')
  @Render('update-profile')  // Render view update-profile.hbs
  async showUpdate(@Param('id') id: number) {
    const user = await this.usersService.findById(id);
    return { user };  // Truyền thông tin người dùng vào view
  }
  // Cập nhật thông tin người dùng
  @Post('update/:id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto, @Res() res) {
    try {
      // Cập nhật thông tin người dùng
      await this.usersService.update(id, updateUserDto);
      // Chuyển hướng về trang profile sau khi cập nhật thành công
      return res.redirect(`/users/profile/${id}`);
    } catch (error) {
      // Trả về thông báo lỗi và render lại trang cập nhật với thông báo lỗi
      return res.render('update-profile', { message: error.message, user: updateUserDto });  // Truyền thông báo lỗi vào view
    }
  }
  @Get('change-password/:id')
  @Render('change-password')
  async changePasswordView(@Param('id') id: number, @Body() changePasswordDto: ChangePasswordDto) {
    return{user:{id: id}};
  }

  // Thay đổi mật khẩu người dùng
  @Post('change-password/:id') // Render view change-password.hbs
  async changePassword(@Param('id') id: number, @Body() changePasswordDto: ChangePasswordDto, @Res() res) {
    try {
      const updatedUser = await this.usersService.changePassword(id, changePasswordDto.oldPassword, changePasswordDto.newPassword);
      return res.redirect(`/users/profile/${id}`); // Truyền dữ liệu vào view
    } catch (error) {
      return res.render('change-password', { message: error.message, user: { id } });  // Nếu có lỗi, truyền thông báo lỗi vào view
    }
  }
}
