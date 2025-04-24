// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { FibonacciService } from './fibonacci/fibonacci.service';
import { FibonacciController } from './fibonacci/fibonacci.controller';
import { FibonacciModule } from './fibonacci/fibonacci.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',  // Loại cơ sở dữ liệu là MySQL
      host: 'localhost',  // Địa chỉ của MySQL server
      port: 3306,  // Cổng MySQL mặc định
      username: 'root',  // Tên người dùng MySQL
      password: 'tcgkhanh170502',  // Mật khẩu MySQL
      database: 'game_server',  // Tên cơ sở dữ liệu
      entities: [__dirname + '/**/*.entity{.ts,.js}'],  // Các Entity
      synchronize: true,  // Tự động đồng bộ hóa cơ sở dữ liệu (dành cho môi trường phát triển)
    }),
    UsersModule,
    FibonacciModule,  // Import UsersModule vào AppModule
  ],

})
export class AppModule {}
