// Đã sửa toàn bộ logic nổ bóng, di chuyển và spawn để đảm bảo hoạt động chính xác
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Game } from './game.entity'
import { Ball } from './ball.entity'

@Injectable()
export class Line98Service {
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
    return Array(5)
      .fill(null)
      .map(() => Array(5).fill(null))
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
      const x = Math.floor(Math.random() * 5)
      const y = Math.floor(Math.random() * 5)
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
      if (sequence.length >= 3) {
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
  ): Promise<void> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } })
    if (!game) throw new BadRequestException('Game not found')

    let board: (string | null)[][] = JSON.parse(game.board)
    await this.saveUndoState(game, board)

    const path = this.findShortestPath(board, x1, y1, x2, y2)
    if (path.length === 0)
      throw new BadRequestException('No valid path to move')

    board[x2][y2] = board[x1][y1]
    board[x1][y1] = null



    game.board = JSON.stringify(board)
    await this.gameRepository.save(game)

    const exploded = this.checkForExplosions(board)

    if (exploded) {
      game.board = JSON.stringify(board)
      await this.gameRepository.save(game)
      return
    }

    const hasEmpty = board.some((row) => row.some((cell) => cell === null))
    if (!hasEmpty)
      throw new BadRequestException('Game over: No more space to spawn balls')

    await this.spawnBall(game.id)

    const updatedGame = await this.gameRepository.findOne({
      where: { id: game.id },
    })
    if (updatedGame != null) {
      board = JSON.parse(updatedGame.board)
      game.board = updatedGame.board
    }

    game.board = JSON.stringify(board)

    await this.gameRepository.save(game)

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
    ]
    const queue = [[startX, startY]]
    const parent = new Map<string, [number, number] | null>()
    parent.set(`${startX},${startY}`, null)

    while (queue.length > 0) {
      const [x, y] = queue.shift()!
      if (x === endX && y === endY) {
        const path: [number, number][] = []
        let current: [number, number] | null = [x, y]
        while (current) {
          path.push(current)
          current = parent.get(`${current[0]},${current[1]}`) || null
        }
        return path.reverse()
      }

      for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy
        if (
          nx >= 0 &&
          nx < 5 &&
          ny >= 0 &&
          ny < 5 &&
          !board[nx][ny] &&
          !parent.has(`${nx},${ny}`)
        ) {
          queue.push([nx, ny])
          parent.set(`${nx},${ny}`, [x, y])
        }
      }
    }
    return []
  }

  private checkForExplosions(board: (string | null)[][]): boolean {
    let exploded = false
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
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
      if (sequence.length >= 3) {
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
      x - i * dx < 5 &&
      y - i * dy >= 0 &&
      y - i * dy < 5 &&
      board[x - i * dx][y - i * dy] === color
      ) {
      sequence.unshift([x - i * dx, y - i * dy]);
      i++;
    }

    // Check forward
    i = 1;
    while (
      x + i * dx >= 0 &&
      x + i * dx < 5 &&
      y + i * dy >= 0 &&
      y + i * dy < 5 &&
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

  async helpMove(gameId: number): Promise<void> {

    const game = await this.gameRepository.findOne({ where: { id: gameId } });

    if (!game) throw new BadRequestException('Game not found');

    const board = JSON.parse(game.board);
    await this.saveUndoState(game, board)
    const moves: {
      from: [number, number],
      to: [number, number],
      priority: number
    }[] = [];

    for (let x1 = 0; x1 < 5; x1++) {
      for (let y1 = 0; y1 < 5; y1++) {
        const color = board[x1][y1];
        if (!color) continue;

        for (let x2 = 0; x2 < 5; x2++) {
          for (let y2 = 0; y2 < 5; y2++) {
            if (board[x2][y2] !== null) continue;
            const path = this.findShortestPath(board, x1, y1, x2, y2);
            if (path.length === 0) continue;

            const simulatedBoard = board.map(row => [...row]);
            simulatedBoard[x2][y2] = color;
            simulatedBoard[x1][y1] = null;

            let priority = 3; // mặc định thấp nhất
            if (this.checkAndExplode(simulatedBoard, x2, y2, color)) {
              priority = 1; // nổ ngay
            } else {
              // Kiểm tra xem có tạo gần 3 không
              const seq = this.getSequence(simulatedBoard, x2, y2, color, 1, 0).length +
                this.getSequence(simulatedBoard, x2, y2, color, 0, 1).length +
                this.getSequence(simulatedBoard, x2, y2, color, 1, 1).length +
                this.getSequence(simulatedBoard, x2, y2, color, 1, -1).length;
              if (seq >= 2) priority = 2; // tạo cơ hội tạo hàng
            }

            moves.push({ from: [x1, y1], to: [x2, y2], priority });
          }
        }
      }
    }

    moves.sort((a, b) => a.priority - b.priority);
    const best = moves[0];
    if (best) {
      await this.moveBall(gameId, best.from[0], best.from[1], best.to[0], best.to[1]);
    }
  }
}