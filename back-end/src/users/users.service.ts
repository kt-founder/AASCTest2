import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';  // Import bcrypt
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto, LoginResponseDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Kiểm tra mật khẩu hợp lệ (ít nhất 6 ký tự)
  private validatePassword(password: string): void {
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
  }

  // Kiểm tra username không trùng
  private async validateUniqueUsername(username: string): Promise<void> {
    const userWithUsername = await this.usersRepository.findOne({ where: { username } });
    if (userWithUsername) {
      throw new BadRequestException('Username already exists');
    }
  }

  // Kiểm tra nickname không trùng
  private async validateUniqueNickname(nickname: string): Promise<void> {
    const userWithNickname = await this.usersRepository.findOne({ where: { nickname } });
    if (userWithNickname) {
      throw new BadRequestException('Nickname already exists');
    }
  }

  // Mã hóa mật khẩu
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);  // Tạo salt với độ dài 10
    return await bcrypt.hash(password, salt);  // Mã hóa mật khẩu với salt
  }

  // Đăng ký người dùng
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Kiểm tra mật khẩu
    this.validatePassword(createUserDto.password);

    // Kiểm tra username không trùng
    await this.validateUniqueUsername(createUserDto.username);

    // Mã hóa mật khẩu
    const hashedPassword = await this.hashPassword(createUserDto.password);

    // Tạo người dùng với mật khẩu đã mã hóa
    const user = this.usersRepository.create({ ...createUserDto, password: hashedPassword });
    return this.usersRepository.save(user);
  }

  // Đăng nhập người dùng
  async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const { username, password } = loginUserDto;
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Kiểm tra mật khẩu đã mã hóa
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      username: user.username,
    };
  }

  // Cập nhật thông tin người dùng
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');  // Nếu không tìm thấy người dùng, ném lỗi
    }

    // Kiểm tra nickname không trùng
    if (updateUserDto.nickname) {
      const existingUser = await this.usersRepository.findOne({ where: { nickname: updateUserDto.nickname } });
      if (existingUser?.id != id) {
        throw new Error('Nickname already exists');
      }
    }

    // Cập nhật thông tin người dùng
    await this.usersRepository.update(id, updateUserDto);

    // Lấy lại thông tin người dùng sau khi cập nhật
    return this.usersRepository.findOne({ where: { id } });
  }

  // Đổi mật khẩu người dùng
  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<User> {
    // Kiểm tra mật khẩu cũ
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    // Kiểm tra mật khẩu cũ
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Mã hóa mật khẩu mới
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Cập nhật mật khẩu mới
    user.password = hashedNewPassword;
    await this.usersRepository.save(user);

    return user;
  }

  // Tìm người dùng theo ID
  async findById(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
