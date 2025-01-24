import { Module } from '@nestjs/common';

import { PostsService } from './posts.service';
import { PrismaModule } from '@prisma/prisma.module';
import { PostController } from './posts.controller';

@Module({
    imports: [PrismaModule], // Привязываем Prisma
    controllers: [PostController], // Контроллер для работы с постами
    providers: [PostsService], // Сервис для логики создания постов
})
export class PostsModule {}
