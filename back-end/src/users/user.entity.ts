// src/users/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(["username"])  // Đảm bảo username là duy nhất
@Unique(["nickname"])  // Đảm bảo nickname là duy nhất
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;  // Thêm trường name cho người dùng

  @Column({ nullable: true })
  age: number;   // Thêm age cho người dùng

  @Column({ nullable: true })
  nickname: string;  // Thêm nickname cho người dùng
}
