import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Ball {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  color: string;  // Màu của quả bóng (ví dụ: "red", "green", "blue", "yellow", "purple")

  @Column()
  x: number;  // Vị trí x của quả bóng trên bảng (0-9)

  @Column()
  y: number;  // Vị trí y của quả bóng trên bảng (0-9)

  @ManyToOne(() => Game, game => game.balls)
  game: Game;  // Liên kết với bảng Game
}
