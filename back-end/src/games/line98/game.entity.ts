import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Ball } from './ball.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  board: string;  // Lưu trữ trạng thái của bảng game dưới dạng chuỗi JSON (ma trận 10x10)

  @Column()
  currentPlayer: string;  // Người chơi hiện tại (Player1 hoặc Player2)

  @OneToMany(() => Ball, ball => ball.game)
  balls: Ball[];  // Liên kết với bảng bóng (balls)
}
