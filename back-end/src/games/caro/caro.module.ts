import { Module } from '@nestjs/common';
import { CaroService } from './caro.service';
import { CaroController } from './caro.controller';
import { CaroGateway } from './caro.gateway';
import { TypeOrmModule } from '@nestjs/typeorm'
import { Caro } from './caro.entity'
import { Move } from './move.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Caro, Move])],
  providers: [CaroService, CaroGateway],
  controllers: [CaroController]
})
export class CaroModule {}
