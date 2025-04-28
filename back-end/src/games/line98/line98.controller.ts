import { Controller, Post, Body, Param, Get, Render, Req, HttpStatus, HttpException, Res } from '@nestjs/common'
import { Line98Service } from './line98.service';
import { Game } from './game.entity'

@Controller('line98')
export class Line98Controller {
  private readonly BOARD_SIZE = 9;
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

      const { path, gameOver } = await this.line98Service.moveBall(
        gameId,
        moveData.x1,
        moveData.y1,
        moveData.x2,
        moveData.y2
      );

      const game = await this.line98Service.getGameBySession(req.session);
      const board = JSON.parse(game.board);
      return {
        success: true,
        message: 'Move successful',
        playerName,
        game: {
          ...game,
          board: board,
        },
        path: path, // đây chính là mảng JSON như bạn yêu cầu
        gameOver: gameOver,
      };

    } catch (error) {
      const game = await this.line98Service.getGameBySession(req.session);

      return {
        success: false,
        error: error.message || 'Could not complete the move',
        playerName,
        game: {
          ...game,
          board: JSON.parse(game.board),
        },
      };
    }
  }

  // Kiểm tra tọa độ hợp lệ
  private isValidCoordinates(x: number, y: number): boolean {
    return x >= 0 && x < this.BOARD_SIZE && y >= 0 && y < this.BOARD_SIZE;
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
      const { path, from, to } = await this.line98Service.helpMove(gameId);

      return res.json({
        success: true,
        message: 'Help move successful',
        path,
        from,
        to
      });
    } catch (error) {
      console.error('Help move error:', error.message);
      return res.json({
        success: false,
        error: error.message || 'Failed to perform help move'
      });
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
