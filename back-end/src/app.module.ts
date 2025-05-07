import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ⚠️ thêm ConfigModule

import { UsersModule } from './users/users.module';
import { FibonacciModule } from './fibonacci/fibonacci.module';
import { Line98Module } from './games/line98/line98.module';
import { CaroModule } from './games/caro/caro.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    // ✅ Đặt ở trên cùng để đảm bảo các module sau dùng được
    ConfigModule.forRoot({
      isGlobal: true, // Dùng ở mọi nơi không cần import lại
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: +config.getOrThrow<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),

    UsersModule,
    FibonacciModule,
    Line98Module,
    CaroModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
