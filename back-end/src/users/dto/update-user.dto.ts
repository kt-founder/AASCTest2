// src/users/update-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'The name of the user', required: false })
  readonly name?: string;

  @ApiProperty({ description: 'The age of the user', required: false })
  readonly age?: number;

  @ApiProperty({ description: 'The nickname of the user', required: false })
  readonly nickname?: string;

  @ApiProperty({ description: 'The email of the user', required: false })
  readonly email?: string;
}
