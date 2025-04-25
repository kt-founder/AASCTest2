// src/users/login-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ description: 'The username of the user' })
  readonly username: string;

  @ApiProperty({ description: 'The password of the user' })
  readonly password: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'The user ID' })
  readonly id: number;

  @ApiProperty({ description: 'The user nickname' })
  readonly nickname: string;

  @ApiProperty({ description: 'The username of the user' })
  readonly username: string;

}
