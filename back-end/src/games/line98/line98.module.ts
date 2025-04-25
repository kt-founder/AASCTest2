// src/games/line98.module.ts
import { Module } from '@nestjs/common';
import { Line98Controller } from './line98.controller';
import { Line98Service } from './line98.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './game.entity';  // Import Game entity
import { Ball } from './ball.entity';  // Import Ball entity
import { User } from '../../users/user.entity';  // Import User entity (nếu cần)

@Module({
  imports: [TypeOrmModule.forFeature([Game, Ball, User])], // Import các entity vào module
  controllers: [Line98Controller],
  providers: [Line98Service],
})
export class Line98Module {}
