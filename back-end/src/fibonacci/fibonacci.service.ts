// src/fibonacci/fibonacci.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class FibonacciService {
  // Hàm tính Fibonacci chính xác với BigInt
  getFibonacciNumber(n: number): bigint {
    let a = 0n,
      b = 1n,
      c = 0n
    for (let i = 2; i <= n; i++) {
      c = a + b
      a = b
      b = c
    }
    return c
  }

  // Hàm tính Fibonacci sử dụng số học ma trận (Matrix Exponentiation)
  matrixMultiply(a: number[][], b: number[][]): number[][] {
    return [
      [
        a[0][0] * b[0][0] + a[0][1] * b[1][0],
        a[0][0] * b[0][1] + a[0][1] * b[1][1],
      ],
      [
        a[1][0] * b[0][0] + a[1][1] * b[1][0],
        a[1][0] * b[0][1] + a[1][1] * b[1][1],
      ],
    ]
  }

  matrixPower(matrix: number[][], n: number): number[][] {
    let result = [
      [1, 0],
      [0, 1],
    ] // Ma trận đơn vị
    let base = matrix

    while (n > 0) {
      if (n % 2 === 1) {
        result = this.matrixMultiply(result, base)
      }
      base = this.matrixMultiply(base, base)
      n = Math.floor(n / 2)
    }

    return result
  }

  fibonacciMatrix(n: number): number {
    if (n <= 1) return n
    const matrix = [
      [1, 1],
      [1, 0],
    ]
    const result = this.matrixPower(matrix, n - 1)
    return result[0][0]
  }

  // Hàm tính Fibonacci và đo thời gian thực hiện
  calculateFibonacci(n: number): { result: string; time: string } {
    console.time('FibonacciTime') // Bắt đầu đo thời gian

    const start = performance.now() // Lưu thời gian bắt đầu
    const result = this.getFibonacciNumber(n) // Tính Fibonacci
    const end = performance.now() // Lưu thời gian kết thúc

    console.timeEnd('FibonacciTime') // Kết thúc đo thời gian và hiển thị

    const timeTaken = end - start // Tính thời gian thực hiện (ms)

    if (timeTaken > 0.2) {
      return {
        result: 'Timeout: Time exceeded 0.2ms',
        time: `${timeTaken.toFixed(3)}ms`,
      }
    }

    return { result: result.toString(), time: `${timeTaken.toFixed(3)}ms` }
  }
}
