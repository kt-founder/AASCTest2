// src/fibonacci/fibonacci.controller.ts
import { Controller, Get } from '@nestjs/common';
import { FibonacciService } from './fibonacci.service';

@Controller('fibonacci')
export class FibonacciController {
  constructor(private readonly fibonacciService: FibonacciService) {}

  @Get('calculate')
  calculateFibonacci(): { result: string; time: string } {
    return this.fibonacciService.calculateFibonacci(100);  // Tính số Fibonacci thứ 100
  }

  // Controller sử dụng thuật toán ma trận
  @Get('matrix')
  fibonacciMatrix(): { result: string; time: string } {
    console.time('MatrixFibonacci');
    const result = this.fibonacciService.fibonacciMatrix(100); // Tính Fibonacci thứ 100
    console.timeEnd('MatrixFibonacci');
    return { result: result.toString(), time: 'Matrix calculation time' };
  }

}
