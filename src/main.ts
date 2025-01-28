import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true, // автоматическое преобразование типов (например, строка -> число)
            whitelist: true, // удаление невалидных свойств из запроса
        }),
    );
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
