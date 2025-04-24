// src/users/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'The username of the user' })
  readonly username: string;

  @ApiProperty({ description: 'The email address of the user' })
  readonly email: string;

  @ApiProperty({ description: 'The password of the user' })
  readonly password: string;
}
