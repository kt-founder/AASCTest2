// Đã sửa toàn bộ logic nổ bóng, di chuyển và spawn để đảm bảo hoạt động chính xác
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Game } from './game.entity'
import { Ball } from './ball.entity'

@Injectable()
export class Line98Service {
  private readonly BOARD_SIZE = 9;
  private readonly MIN_SEQUENCE = 5;
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(Ball)
    private ballRepository: Repository<Ball>,
  ) {}

  async createGame(playerName: string, session: any): Promise<Game> {
    const game = new Game()
    game.board = JSON.stringify(this.generateBoard())
    game.currentPlayer = playerName

    const savedGame = await this.gameRepository.save(game)
    session.gameId = savedGame.id

    for (let i = 0; i < 2; i++) {
      await this.spawnBall(savedGame.id)
    }

    const finalGame = await this.gameRepository.findOne({
      where: { id: savedGame.id },
    })
    return finalGame || savedGame
  }

  async restartGame(gameId: number): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } })
    if (!game) throw new BadRequestException('Game not found')

    const board = this.generateBoard()
    game.board = JSON.stringify(board)
    game.undoState = null

    await this.ballRepository.delete({ game: { id: gameId } })
    await this.gameRepository.save(game)

    for (let i = 0; i < 2; i++) {
      await this.spawnBall(game.id)
    }
  }

  async getGameBySession(session: any): Promise<Game> {
    const gameId = session.gameId
    if (!gameId) throw new BadRequestException('No gameId in session')

    const game = await this.gameRepository.findOne({ where: { id: gameId } })
    if (!game) throw new BadRequestException('Game not found')
    return game
  }

  private generateBoard(): (string | null)[][] {
    return Array(this.BOARD_SIZE)
      .fill(null)
      .map(() => Array(this.BOARD_SIZE).fill(null))
  }

  private generateBallColor(): string {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  async spawnBall(gameId: number): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } })
    if (!game) throw new BadRequestException('Game not found')

    const board: (string | null)[][] = JSON.parse(game.board)
    let count = 0
    const maxAttempts = 100
    let attempts = 0

    while (count < 3 && attempts < maxAttempts) {
      const x = Math.floor(Math.random() * this.BOARD_SIZE)
      const y = Math.floor(Math.random() * this.BOARD_SIZE)
      if (!board[x][y]) {
        const color = this.generateBallColor()
        board[x][y] = color

        // Kiểm tra nếu sinh bóng gây nổ thì bỏ bóng đó và thử lại
        if (this.willExplode(board, x, y, color)) {
          board[x][y] = null
          attempts++
          continue
        }
        const ball = new Ball()
        ball.color = color
        ball.x = x
        ball.y = y
        ball.game = game

        await this.ballRepository.save(ball)
        count++
      }
      attempts++
    }

    game.board = JSON.stringify(board)
    await this.gameRepository.save(game)
  }
  private willExplode(
    board: (string | null)[][],
    x: number,
    y: number,
    color: string,
  ): boolean {
    const directions = [
      { dx: 1, dy: 0 }, // hàng
      { dx: 0, dy: 1 }, // cột
      { dx: 1, dy: 1 }, // chéo chính
      { dx: 1, dy: -1 }, // chéo phụ
    ]

    for (const { dx, dy } of directions) {
      const sequence = this.getSequence(board, x, y, color, dx, dy)
      if (sequence.length >= this.MIN_SEQUENCE) {
        return true
      }
    }
    return false
  }

  async moveBall(
    gameId: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): Promise<{ path: [number, number][] }> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) throw new BadRequestException('Game not found');

    let board: (string | null)[][] = JSON.parse(game.board);
    await this.saveUndoState(game, board);

    const path = this.findShortestPath(board, x1, y1, x2, y2);
    console.log(path)
    if (path.length === 0)
      throw new BadRequestException('No valid path to move');

    board[x2][y2] = board[x1][y1];
    board[x1][y1] = null;

    game.board = JSON.stringify(board);
    await this.gameRepository.save(game);

    const exploded = this.checkForExplosions(board);

    if (exploded) {
      game.board = JSON.stringify(board);
      await this.gameRepository.save(game);
      return { path };
    }

    const hasEmpty = board.some((row) => row.some((cell) => cell === null));
    if (!hasEmpty)
      throw new BadRequestException('Game over: No more space to spawn balls');

    await this.spawnBall(game.id);

    const updatedGame = await this.gameRepository.findOne({ where: { id: game.id } });
    if (updatedGame != null) {
      board = JSON.parse(updatedGame.board);
      game.board = updatedGame.board;
    }

    game.board = JSON.stringify(board);
    await this.gameRepository.save(game);

    return { path };
  }


  private findShortestPath(
    board: (string | null)[][],
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): [number, number][] {
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];
    const queue = [[startX, startY]];
    const parent = new Map<string, [number, number] | null>();
    parent.set(`${startX},${startY}`, null);

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      if (x === endX && y === endY) {
        const path: [number, number][] = [];
        let current: [number, number] | null = [x, y];
        while (current) {
          path.push(current);
          current = parent.get(`${current[0]},${current[1]}`) || null;
        }
        return path.reverse();
      }

      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 &&
          nx < this.BOARD_SIZE &&
          ny >= 0 &&
          ny < this.BOARD_SIZE &&
          board[nx][ny] === null &&
          !parent.has(`${nx},${ny}`)
        ) {
          queue.push([nx, ny]);
          parent.set(`${nx},${ny}`, [x, y]);
        }
      }
    }
    return [];
  }


  private checkForExplosions(board: (string | null)[][]): boolean {
    let exploded = false
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        const color = board[i][j]
        if (color && this.checkAndExplode(board, i, j, color)) {
          exploded = true
        }
      }
    }
    return exploded
  }

  private checkAndExplode(
    board: (string | null)[][],
    x: number,
    y: number,
    color: string,
  ): boolean {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
    ]

    for (const { dx, dy } of directions) {
      const sequence = this.getSequence(board, x, y, color, dx, dy)
      if (sequence.length >= this.MIN_SEQUENCE) {
        sequence.forEach(([px, py]) => (board[px][py] = null))
        return true
      }
    }
    return false
  }

  private getSequence(
    board: (string | null)[][],
    x: number,
    y: number,
    color: string,
    dx: number,
    dy: number,
  ): [number, number][] {
    const sequence: [number, number][] = [[x, y]];

    // Check backward
    let i = 1;
    while (
      x - i * dx >= 0 &&
      x - i * dx < this.BOARD_SIZE &&
      y - i * dy >= 0 &&
      y - i * dy < this.BOARD_SIZE &&
      board[x - i * dx][y - i * dy] === color
      ) {
      sequence.unshift([x - i * dx, y - i * dy]);
      i++;
    }

    // Check forward
    i = 1;
    while (
      x + i * dx >= 0 &&
      x + i * dx < this.BOARD_SIZE &&
      y + i * dy >= 0 &&
      y + i * dy < this.BOARD_SIZE &&
      board[x + i * dx][y + i * dy] === color
      ) {
      sequence.push([x + i * dx, y + i * dy]);
      i++;
    }

    return sequence;
  }


  private async saveUndoState(game: Game, board: (string | null)[][]): Promise<void> {
    const boardClone = board.map(row => [...row]); // clone đúng từng dòng
    game.undoState = {
      board: JSON.stringify(boardClone),
      gameId: game.id,
    };
    await this.gameRepository.save(game);
  }

  async undoMove(gameId: number): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } })
    if (!game || !game.undoState)
      throw new BadRequestException('No previous move to undo')

    const restoredBoard: (string | null)[][] = JSON.parse(game.undoState.board)
    game.board = JSON.stringify(restoredBoard)
    await this.gameRepository.save(game)
  }

  async helpMove(gameId: number): Promise<{ path: [number, number][], from: [number, number], to: [number, number] }> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) throw new BadRequestException('Game not found');

    const board = JSON.parse(game.board);
    await this.saveUndoState(game, board);

    const moves: {
      from: [number, number];
      to: [number, number];
      path: [number, number][];
      priority: number;
      pathLength: number;
    }[] = [];

    for (let x1 = 0; x1 < this.BOARD_SIZE; x1++) {
      for (let y1 = 0; y1 < this.BOARD_SIZE; y1++) {
        const color = board[x1][y1];
        if (!color) continue;

        for (let x2 = 0; x2 < this.BOARD_SIZE; x2++) {
          for (let y2 = 0; y2 < this.BOARD_SIZE; y2++) {
            if (board[x2][y2] !== null) continue;

            const path = this.findShortestPath(board, x1, y1, x2, y2);
            if (path.length === 0) continue; // Không đi được thì bỏ

            const simulatedBoard = board.map(row => [...row]);
            simulatedBoard[x2][y2] = color;
            simulatedBoard[x1][y1] = null;

            let priority = 5; // Mặc định thấp nhất
            if (this.checkAndExplode(simulatedBoard, x2, y2, color)) {
              priority = 1; // Nếu nổ được ngay lập tức
            } else {
              const directions = [
                [1, 0], [0, 1], [1, 1], [1, -1]
              ];
              let maxSequence = 1;
              for (const [dx, dy] of directions) {
                const count = this.getSequence(simulatedBoard, x2, y2, color, dx, dy).length;
                maxSequence = Math.max(maxSequence, count);
              }
              if (maxSequence >= 4) {
                priority = 2; // 4 bóng liên tiếp
              } else if (maxSequence === 3) {
                priority = 3; // 3 bóng
              } else if (maxSequence === 2) {
                priority = 4; // 2 bóng gần nhau
              }
            }

            moves.push({
              from: [x1, y1],
              to: [x2, y2],
              path,
              priority,
              pathLength: path.length
            });
          }
        }
      }
    }

    if (moves.length === 0) throw new BadRequestException('No valid move found');

    // 1. Sắp xếp ưu tiên theo: priority -> pathLength
    moves.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.pathLength - b.pathLength; // Ưu tiên đường đi ngắn nhất nếu cùng priority
    });

    const bestMove = moves[0];

    // Gọi moveBall để thực hiện move thực tế
    const { path } = await this.moveBall(gameId, bestMove.from[0], bestMove.from[1], bestMove.to[0], bestMove.to[1]);

    return { path, from: bestMove.from, to: bestMove.to };
  }

}