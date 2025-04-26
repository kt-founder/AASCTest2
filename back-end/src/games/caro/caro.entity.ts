// src/games/caro/caro.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Move } from './move.entity'; // Move là entity cho các bước di chuyển

@Entity()
export class Caro {
  @PrimaryGeneratedColumn()
  id: number;

  // Bảng Caro (20x20) lưu trạng thái từng ô: 'X', 'O' hoặc ''
  @Column('simple-array')
  board: string[];

  // Trạng thái người chơi hiện tại: 'X' hoặc 'O'
  @Column()
  currentTurn: 'X' | 'O';

  // Kết quả game: 'X', 'O', 'Draw' hoặc null (game chưa kết thúc)
  @Column({ nullable: true })
  @Column({ type: 'varchar', length: 5, nullable: true })
  winner: 'X' | 'O' | 'Draw' | null;

  // 2 người chơi, lưu tên người chơi
  @Column('simple-array')
  players: string[];

  // Lưu trạng thái undo
  @Column({ nullable: true })
  undoState: string;

  // Thời gian bắt đầu game
  @Column()
  createdAt: Date;

  // Thời gian kết thúc game
  @Column({ nullable: true })
  endedAt: Date;

  // Lưu các bước di chuyển (X, O) trong game
  @OneToMany(() => Move, (move) => move.game)
  moves: Move[];
}
