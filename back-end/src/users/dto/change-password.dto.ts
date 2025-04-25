// src/users/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The old password of the user' })
  readonly oldPassword: string;

  @ApiProperty({ description: 'The new password of the user' })
  readonly newPassword: string;
}
