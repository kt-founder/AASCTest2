// src/games/caro/caro.service.ts
import { Injectable } from '@nestjs/common';
import { Caro } from './caro.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Move } from './move.entity';

@Injectable()
export class CaroService {
  constructor(
    @InjectRepository(Caro)
    private readonly caroRepository: Repository<Caro>,
    @InjectRepository(Move)
    private readonly moveRepository: Repository<Move>,
  ) {}

  // Tạo game với 2 người chơi
  async startGame(player1: string, player2: string): Promise<Caro> {
    const game = new Caro();
    game.players = [player1, player2];
    game.currentTurn = 'X';
    // Khởi tạo bàn cờ 20x20 dưới dạng mảng 1 chiều
    game.board = Array(15*15).fill('');
    game.createdAt = new Date();
    return this.caroRepository.save(game);
  }

  // Tìm game theo ID
  async findGameById(gameId: number): Promise<Caro | null> {
    return this.caroRepository.findOne({ where: { id: gameId } });
  }

  // Xử lý di chuyển của người chơi
  async makeMove(gameId: number, x: number, y: number, player: 'X' | 'O'): Promise<Caro> {
    const game = await this.caroRepository.findOne({ where: { id: gameId } });
    if (!game) throw new Error('Game not found');

    const index = x * 15 + y;
    if (game.board[index] !== '') {
      throw new Error('Cell is already occupied');
    }

    game.board[index] = player;
    game.currentTurn = player === 'X' ? 'O' : 'X';

    // Lưu bước di chuyển
    const move = new Move();
    move.game = game;
    move.symbol = player;
    move.x = x;
    move.y = y;
    await this.moveRepository.save(move);

    // Kiểm tra kết quả game
    const winner = this.checkWinner(game.board);
    if (winner) {
      game.winner = winner;
      game.endedAt = new Date();
    }

    return this.caroRepository.save(game);
  }

  // Kiểm tra người thắng
  private checkWinner(board: string[]): 'X' | 'O' | 'Draw' | null {
    const size = 15;
    // Kiểm tra hàng ngang
    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= size - 5; j++) {
        const index = i * size + j;
        if (board[index] && 
            board[index] === board[index + 1] && 
            board[index] === board[index + 2] &&
            board[index] === board[index + 3] &&
            board[index] === board[index + 4]) {
          return board[index] as 'X' | 'O';
        }
      }
    }

    // Kiểm tra hàng dọc
    for (let i = 0; i <= size - 5; i++) {
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        if (board[index] && 
            board[index] === board[index + size] &&
            board[index] === board[index + size * 2] &&
            board[index] === board[index + size * 3] &&
            board[index] === board[index + size * 4]) {
          return board[index] as 'X' | 'O';
        }
      }
    }

    // Kiểm tra đường chéo chính
    for (let i = 0; i <= size - 5; i++) {
      for (let j = 0; j <= size - 5; j++) {
        const index = i * size + j;
        if (board[index] && 
            board[index] === board[index + size + 1] &&
            board[index] === board[index + (size + 1) * 2] &&
            board[index] === board[index + (size + 1) * 3] &&
            board[index] === board[index + (size + 1) * 4]) {
          return board[index] as 'X' | 'O';
        }
      }
    }

    // Kiểm tra đường chéo phụ
    for (let i = 0; i <= size - 5; i++) {
      for (let j = 4; j < size; j++) {
        const index = i * size + j;
        if (board[index] && 
            board[index] === board[index + size - 1] &&
            board[index] === board[index + (size - 1) * 2] &&
            board[index] === board[index + (size - 1) * 3] &&
            board[index] === board[index + (size - 1) * 4]) {
          return board[index] as 'X' | 'O';
        }
      }
    }

    // Kiểm tra hòa
    if (!board.includes('')) {
      return 'Draw';
    }

    return null;
  }

  // Kết thúc game và trả về kết quả
  async endGame(gameId: number, winner: 'X' | 'O' | 'Draw'): Promise<Caro> {
    const game = await this.caroRepository.findOne({ where: { id: gameId } });
    if (!game) throw new Error('Game not found');
    game.winner = winner;
    game.endedAt = new Date();
    return this.caroRepository.save(game);
  }

  async resetGame(gameId: number) {
    const game = await this.findGameById(gameId);
    if (!game) throw new Error('Game not found');
    game.board = Array(15 * 15).fill('');
    game.winner = null;
    game.currentTurn = 'X';
    return this.caroRepository.save(game);
  }
}
