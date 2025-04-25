// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as session from 'express-session';  // Import express-session

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cấu hình Template Engine Handlebars

  // Cấu hình session
  app.use(
    session({
      secret: 'your-secret-key',  // Secret để mã hóa session
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Đặt secure = true nếu đang sử dụng HTTPS
        httpOnly: true, // Cài đặt cookie chỉ có thể truy cập từ server
      },
    }),
  );
  app.setViewEngine('hbs');
  app.setBaseViewsDir(path.join(__dirname, '..', 'views'));  // Đường dẫn đến thư mục views

  // Cấu hình CORS nếu cần
  app.enableCors({
    origin: 'http://localhost:3000',  // Địa chỉ frontend của bạn
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
    credentials: true,
  });

  await app.listen(3000);
}

bootstrap();
