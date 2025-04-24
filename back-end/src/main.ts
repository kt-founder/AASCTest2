// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('User API')
    .setDescription('The User API description')
    .setVersion('1.0')
    .addTag('users')  // Thêm tag để phân loại các API liên quan đến users
    .build();

  // Tạo tài liệu Swagger
  const document = SwaggerModule.createDocument(app, config);

  // Cấu hình Swagger UI tại đường dẫn /api
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

bootstrap();
