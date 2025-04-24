// src/users/users.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('users')  // Đánh dấu controller này thuộc về nhóm 'users'
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new user' })  // Mô tả cho API này
  @ApiResponse({ status: 201, description: 'The user has been successfully created.' })  // Mô tả phản hồi thành công
  @ApiResponse({ status: 400, description: 'Bad Request' })  // Mô tả phản hồi lỗi
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
