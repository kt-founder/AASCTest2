import { Controller, Post, Body, Param, Get, Render, Req, HttpStatus, HttpException, Res } from '@nestjs/common'
import { Line98Service } from './line98.service';
import { Game } from './game.entity'

@Controller('line98')
export class Line98Controller {
  constructor(private readonly line98Service: Line98Service) {}

  // Tạo trò chơi mới với tên người chơi và lưu gameId vào session
  @Post('create')
  @Render('game-line98')
  async createGame(@Body() body: { playerName: string }, @Req() req: any) {
    const { playerName } = body;
    const game = await this.line98Service.createGame(playerName, req.session);
    return {
      game: {
        ...game,
        board: JSON.parse(game.board),
      },
      playerName,
      message: 'Game started'
    };
  }

  // Hiển thị giao diện trò chơi
  @Get()
  @Render('game-line98')
  async showGamePage(@Req() req: any) {
    let playerName = req.session.user?.nickname || 'Player1';

    let game;
    try {
      if (req.session.gameId) {
        game = await this.line98Service.getGameBySession(req.session);
      }
    } catch (err) {
      console.warn('[SESSION RESET] gameId not found, creating new game...');
      game = await this.line98Service.createGame(playerName, req.session);
    }

    if (!game) {
      game = await this.line98Service.createGame(playerName, req.session);
    }

    return {
      game: {
        ...game,
        board: JSON.parse(game.board),
      },
      playerName,
    };
  }

  // Di chuyển bóng và kiểm tra đường đi ngắn nhất
  @Post('move/:gameId')
  @Render('game-line98')
  async moveBall(
    @Param('gameId') gameId: number,
    @Body() moveData: { x1: number, y1: number, x2: number, y2: number },
    @Req() req: any
  ) {
    let playerName = req.session.user?.nickname || 'Player1';

    try {
      if (!this.isValidCoordinates(moveData.x1, moveData.y1) || 
          !this.isValidCoordinates(moveData.x2, moveData.y2)) {
        throw new HttpException('Invalid coordinates', HttpStatus.BAD_REQUEST);
      }

      await this.line98Service.moveBall(
        gameId,
        moveData.x1,
        moveData.y1,
        moveData.x2,
        moveData.y2
      );

      const game = await this.line98Service.getGameBySession(req.session);
      const board = JSON.parse(game.board);

      return {
        game: {
          ...game,
          board: board,
        },
        playerName,
        message: 'Move successful'
      };

    } catch (error) {
      const game = await this.line98Service.getGameBySession(req.session);
      return {
        game: {
          ...game,
          board: JSON.parse(game.board),
        },
        playerName,
        error: error.message || 'Could not complete the move'
      };
    }
  }

  // Kiểm tra tọa độ hợp lệ
  private isValidCoordinates(x: number, y: number): boolean {
    return x >= 0 && x < 5 && y >= 0 && y < 5;
  }

  // Undo (quay lại trạng thái trước đó)
  @Post('undo/:gameId')
  @Render('game-line98')
  async undoMove(@Param('gameId') gameId: number, @Req() req: any) {
    let playerName = req.session.user?.nickname || 'Player1';

    try {
      await this.line98Service.undoMove(gameId);
      
      const game = await this.line98Service.getGameBySession(req.session);
      const board = JSON.parse(game.board);

      return {
        game: {
          ...game,
          board: board,
        },
        playerName,
        message: 'Undo successful'
      };
    } catch (error) {
      const game = await this.line98Service.getGameBySession(req.session);
      return {
        game: {
          ...game,
          board: JSON.parse(game.board),
        },
        playerName,
        error: 'Could not undo the move'
      };
    }
  }

  // Tính năng trợ giúp (giúp di chuyển bóng tối ưu)
  @Post('help/:gameId')
  async helpMove(@Param('gameId') gameId: number, @Req() req, @Res() res) {
    try {
      await this.line98Service.helpMove(gameId);
      return res.redirect('/line98');
    } catch (error) {
      console.log(error);
      return res.redirect('/line98');
    }
  }
  @Post('restart/:gameId')
  @Render('game-line98')
  async restart(@Param('gameId') gameId: number, @Req() req: any) {
    const playerName = req.session.user?.nickname || 'Player1';
    await this.line98Service.restartGame(gameId);
    const game = await this.line98Service.getGameBySession(req.session);
    return { game, playerName };
  }


}
