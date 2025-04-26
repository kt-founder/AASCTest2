// src/games/caro/move.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Caro } from './caro.entity';

@Entity()
export class Move {
  @PrimaryGeneratedColumn()
  id: number;

  // Trạng thái của ô: 'X' hoặc 'O'
  @Column()
  symbol: 'X' | 'O';

  // Vị trí (x, y) của bước di chuyển trên bảng
  @Column()
  x: number;

  @Column()
  y: number;

  // Mối quan hệ với game Caro
  @ManyToOne(() => Caro, (caro) => caro.moves)
  game: Caro;
}
