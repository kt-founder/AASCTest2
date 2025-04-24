// src/fibonacci/fibonacci.module.ts
import { Module } from '@nestjs/common';
import { FibonacciService } from './fibonacci.service';
import { FibonacciController } from './fibonacci.controller';

@Module({
  providers: [FibonacciService],
  controllers: [FibonacciController],
})
export class FibonacciModule {}
