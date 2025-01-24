import { Module } from '@nestjs/common';
import { UserModule } from '@user/user.module';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/guard/jwt-auth.guard';

import { PostsModule } from './posts/posts.module';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { CommentsModule } from './comments/comments.module';

@Module({
    imports: [
        UserModule,
        PrismaModule,
        AuthModule,
        ConfigModule.forRoot({ isGlobal: true }),
        PostsModule,
        CommentsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        CommentsService,
    ],
    controllers: [CommentsController],
})
export class AppModule {}
