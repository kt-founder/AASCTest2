// src/users/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()  // Khóa chính tự động
  id: number;

  @Column()  // Cột username
  username: string;

  @Column()  // Cột email
  email: string;

  @Column()  // Cột password
  password: string;
}
