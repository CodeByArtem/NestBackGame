import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Настройка Swagger
    const config = new DocumentBuilder()
        .setTitle('API documentation') // Название API
        .setDescription('The API description') // Описание API
        .setVersion('1.0') // Версия API
        .addTag('User')
        .addTag('Posts')
        .addTag('Comments')
        .addTag('Like') // Теги для группировки API
        .addTag('Authentication')
        .addTag('Password-reset')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document); // Маршрут для доступа к Swagger UI

    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true, // автоматическое преобразование типов (например, строка -> число)
            whitelist: true, // удаление невалидных свойств из запроса
        }),
    );
    app.enableCors();
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
