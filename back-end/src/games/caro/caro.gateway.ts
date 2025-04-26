// src/games/caro/caro.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CaroService } from './caro.service';

@WebSocketGateway()
export class CaroGateway {
  @WebSocketServer() server: Server;
  private waitingPlayers: { name: string; socketId: string }[] = [];
  private gameRooms = new Map<number, Set<string>>(); // gameId -> Set of socket IDs
  private restartVotes = new Map<number, Set<string>>(); // gameId -> Set<socketId>
  private waitingRooms = new Map<string, { playerName: string, socketId: string }>();

  constructor(private readonly caroService: CaroService) {}

  // Lắng nghe sự kiện 'joinRandomGame' để tham gia chơi ngẫu nhiên
  @SubscribeMessage('joinRandomGame')
  async handleRandomGame(@MessageBody() playerName: string, @ConnectedSocket() client: Socket) {
    if (this.waitingPlayers.length > 0) {
      // Người chơi thứ 2 (O) vào
      const firstPlayer = this.waitingPlayers.pop();
      if (firstPlayer) {
        const game = await this.caroService.startGame(firstPlayer.name, playerName);
        
        // Tạo game room và thêm cả 2 người chơi vào
        const roomSet = new Set<string>([firstPlayer.socketId, client.id]);
        this.gameRooms.set(game.id, roomSet);

        // Thông báo cho người chơi X (vào trước)
        this.server.to(firstPlayer.socketId).emit('gameStarted', {
          gameId: game.id,
          player: firstPlayer.name,
          symbol: 'X',
          currentTurn: game.currentTurn
        });

        // Thông báo cho người chơi O (vào sau)
        this.server.to(client.id).emit('gameStarted', {
          gameId: game.id,
          player: playerName,
          symbol: 'O',
          currentTurn: game.currentTurn
        });
      }
    } else {
      // Người chơi đầu tiên (X) vào hàng chờ
      this.waitingPlayers.push({ name: playerName, socketId: client.id });
      this.server.to(client.id).emit('waitingForOpponent', { message: 'Waiting for an opponent...' });
    }
  }

  // Lắng nghe sự kiện 'joinWithFriend' để tạo game cùng bạn
  @SubscribeMessage('joinWithFriend')
  async handleJoinWithFriend(@MessageBody() data: { playerName: string, gameId: string }, @ConnectedSocket() client: Socket) {
    // Tạo game với bạn
    const game = await this.caroService.startGame(data.playerName, 'Friend');  // Bạn có thể nhận thêm dữ liệu từ bạn bè
    this.server.to(client.id).emit('gameStarted', { gameId: game.id, player: data.playerName });
    this.server.emit('gameStarted', { gameId: game.id, player: 'Friend' });
  }

  // Lắng nghe sự kiện 'makeMove' để người chơi di chuyển
  @SubscribeMessage('makeMove')
  async handleMove(@MessageBody() moveData: { gameId: number, x: number, y: number, player: 'X' | 'O' }, @ConnectedSocket() client: Socket) {
    try {
      const game = await this.caroService.makeMove(moveData.gameId, moveData.x, moveData.y, moveData.player);
      
      // Lấy room của game và gửi cho tất cả người chơi trong room
      const roomSet = this.gameRooms.get(moveData.gameId);
      if (roomSet) {
        this.server.to(`caro-game-${moveData.gameId}`).emit('moveMade', {
          gameId: game.id,
          board: game.board,
          currentTurn: game.currentTurn,
          lastMove: { x: moveData.x, y: moveData.y, player: moveData.player }
        });

        if (game.winner) {
          this.server.to(`caro-game-${moveData.gameId}`).emit('gameEnded', {
            gameId: game.id,
            winner: game.winner,
            board: game.board
          });
        }
      }
    } catch (error) {
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }

  // Kết thúc game
  @SubscribeMessage('endGame')
  async handleEndGame(@MessageBody() data: { gameId: number, winner: 'X' | 'O' | 'Draw' }) {
    const game = await this.caroService.endGame(data.gameId, data.winner);
    const roomSet = this.gameRooms.get(data.gameId);
    if (roomSet) {
      roomSet.forEach(socketId => {
        this.server.to(socketId).emit('gameEnded', {
          gameId: game.id,
          winner: game.winner,
          board: game.board
        });
      });
      // Xóa room khi game kết thúc
      this.gameRooms.delete(data.gameId);
    }
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(
    @MessageBody() data: { gameId: number, playerName: string, symbol: 'X' | 'O' },
    @ConnectedSocket() client: Socket
  ) {
    // Thêm socket vào room
    client.join(`caro-game-${data.gameId}`);
    // Đánh dấu socket thuộc game này (nếu muốn quản lý thêm)
    // Gửi lại xác nhận cho client
    client.emit('joinedGame', { gameId: data.gameId });
  }

  @SubscribeMessage('restartGame')
  async handleRestartGame(
    @MessageBody() data: { gameId: number },
    @ConnectedSocket() client: Socket
  ) {
    // Lưu vote
    if (!this.restartVotes.has(data.gameId)) {
      this.restartVotes.set(data.gameId, new Set());
    }
    this.restartVotes.get(data.gameId)!.add(client.id);

    // Đếm số người đã đồng ý
    const roomSet = this.gameRooms.get(data.gameId);
    const votes = this.restartVotes.get(data.gameId)!;
    if (roomSet && votes.size >= roomSet.size) {
      // Đủ 2 người đồng ý
      const game = await this.caroService.resetGame(data.gameId);
      this.server.to(`caro-game-${data.gameId}`).emit('gameRestarted', {
        gameId: game.id,
        board: game.board,
        currentTurn: game.currentTurn,
        winner: null
      });
      this.restartVotes.delete(data.gameId); // Reset vote
    } else {
      // Thông báo cho room ai đã đồng ý
      this.server.to(`caro-game-${data.gameId}`).emit('restartVote', {
        gameId: data.gameId,
        votes: Array.from(votes)
      });
    }
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() data: { playerName: string },
    @ConnectedSocket() client: Socket
  ) {
    // Tạo mã phòng ngẫu nhiên 6 ký tự
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Lưu thông tin người tạo phòng
    this.waitingRooms.set(roomCode, {
      playerName: data.playerName,
      socketId: client.id
    });

    // Gửi mã phòng cho người tạo
    client.emit('roomCreated', { roomCode });

    // Set timeout 5 phút để tự hủy phòng nếu không có người tham gia
    setTimeout(() => {
      if (this.waitingRooms.has(roomCode)) {
        this.waitingRooms.delete(roomCode);
        client.emit('roomExpired', { roomCode });
      }
    }, 5 * 60 * 1000);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomCode: string, playerName: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = this.waitingRooms.get(data.roomCode);
    if (!room) {
      client.emit('error', { message: 'Phòng không tồn tại hoặc đã hết hạn' });
      return;
    }

    try {
      // Tạo game mới với 2 người chơi
      const game = await this.caroService.startGame(room.playerName, data.playerName);
      if (!game) {
        throw new Error('Không thể tạo game');
      }
      
      // Tạo game room và thêm cả 2 người chơi vào
      const roomSet = new Set<string>([room.socketId, client.id]);
      this.gameRooms.set(game.id, roomSet);

      // Thông báo cho người chơi X (người tạo phòng)
      this.server.to(room.socketId).emit('gameStarted', {
        gameId: game.id,
        player: room.playerName,
        symbol: 'X',
        currentTurn: game.currentTurn
      });

      // Thông báo cho người chơi O (người tham gia)
      client.emit('gameStarted', {
        gameId: game.id,
        player: data.playerName,
        symbol: 'O',
        currentTurn: game.currentTurn
      });

      // Xóa phòng khỏi danh sách chờ
      this.waitingRooms.delete(data.roomCode);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('cancelRoom')
  handleCancelRoom(
    @MessageBody() data: { roomCode: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = this.waitingRooms.get(data.roomCode);
    if (room && room.socketId === client.id) {
      this.waitingRooms.delete(data.roomCode);
      client.emit('roomCancelled', { roomCode: data.roomCode });
    }
  }
}
