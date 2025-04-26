// src/games/caro/caro.controller.ts
import { Controller, Get, Render, Param, Post, Body, HttpException, HttpStatus, Req, Query } from '@nestjs/common'
import { CaroService } from './caro.service';
import { CaroGateway } from './caro.gateway';
import { Inject } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConnectedSocket } from '@nestjs/websockets'

@Controller('games/caro')
export class CaroController {
  constructor(
    private readonly caroService: CaroService,
    @Inject(CaroGateway) private readonly caroGateway: CaroGateway, // Inject gateway để xử lý socket
  ) {}

  // Route hiển thị 2 lựa chọn "Chơi ngẫu nhiên" và "Chơi cùng bạn"
  @Get()
  @Render('caro') // Chuyển tới view caro.hbs
  async showGameOptions(@Req() req) {
    // Kiểm tra session, nếu không có thì yêu cầu đăng nhập
    // if (!req.session.nickname) {
    //   return {message: 'Bạn cần đăng nhập để tiếp tục'}
    // }

    return { message: 'Chọn chế độ chơi' };
  }

  @Get('random')
  @Render('waitingForOpponent')
  async playRandom(@Req() req) {
    if(!req.session) {
      return { message: 'Vui lòng đăng nhập để chơi game' };
    }
    const currentPlayerName = req.session.user.nickname;
    if (!currentPlayerName) {
      return { message: 'Vui lòng đăng nhập để chơi game' };
    }
    
    return { 
      message: 'Đang tìm đối thủ...',
      playerName: currentPlayerName 
    };
  }

  // // Route chơi cùng bạn
  // @Get('with-friend/:gameId')
  // async playWithFriend(@Param('gameId') gameId: number, @Req() req) {
  //   const currentPlayerName = req.session.user.nickname; // Lấy nickname từ session
  //   if (!currentPlayerName) {
  //     throw new HttpException('Bạn cần đăng nhập để chơi', HttpStatus.FORBIDDEN);
  //   }
  //   const game = await this.caroService.startGame(currentPlayerName, 'Friend'); // Tạo game cùng bạn
  //   const joinLink = `/games/caro/${game.id}`; // Tạo link để bạn mời bạn bè vào game
  //   return { gameId: game.id, joinLink };
  // }

  @Get('play-with-friend')
  @Render('play-with-friend')
  async showPlayWithFriend(@Req() req) {
    if(!req.session) {
      return { message: 'Vui lòng đăng nhập để chơi game' };
    }
    const currentPlayerName = req.session.user.nickname;
    if (!currentPlayerName) {
      return { message: 'Vui lòng đăng nhập để chơi game' };
    }
    return { message: 'Chọn cách chơi với bạn',currentPlayerName };
  }

  @Post(':id/restart')
  async restartGame(@Param('id') gameId: number) {
    try {
      const game = await this.caroService.resetGame(gameId);
      return { success: true, game };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Route load game và bắt đầu chơi
  @Get(':id')
  @Render('caro-game') // Chuyển tới view caro-game.hbs
  async loadGame(@Param('id') gameId: number, @Req() req) {
    const game = await this.caroService.findGameById(gameId); // Tìm game theo ID
    if (!game) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }
    const board = this.convertBoardTo2DArray(game.board);
    const currentPlayer = req.session.user.nickname;
    
    return { 
      game, 
      player1: game.players[0], 
      player2: game.players[1], 
      board,
      currentPlayer
    }; // Render game và bắt đầu chơi
  }
  // src/games/caro/caro.controller.ts
  private convertBoardTo2DArray(flatBoard: string[]): string[][] {
    const size = 15; // Kích thước cố định 15x15
    const boardArray: string[][] = [];

    for (let i = 0; i < size; i++) {
      const row: string[] = [];
      for (let j = 0; j < size; j++) {
        row.push(flatBoard[i * size + j] || '');
      }
      boardArray.push(row);
    }

    return boardArray;
  }

  // Route xử lý di chuyển trong game
  @Post(':id/move')
  async makeMove(@Param('id') gameId: number, @Body() moveData: { x: number, y: number, player: 'X' | 'O' }) {
    try {
      const game = await this.caroService.makeMove(gameId, moveData.x, moveData.y, moveData.player);
      return { success: true, game };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
