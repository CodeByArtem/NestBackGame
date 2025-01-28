import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetUser } from '@common/dicorators/get-user.decorator';
import { User } from '@prisma/client';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationQueryDto } from './dto/paginations-commets.dto';

// Импортируем DTO для пагинации

@Controller('posts/:postId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    // Создание комментария
    @Post()
    async createComment(
        @Param('postId') postId: string,
        @Body() createCommentDto: CreateCommentDto,
        @GetUser() user: User,
    ) {
        return this.commentsService.create(postId, user.id, createCommentDto);
    }

    // Получение комментариев с пагинацией
    @Get()
    async getComments(
        @Param('postId') postId: string,
        @Query() paginationQuery: PaginationQueryDto, // Используем пагинацию
    ) {
        return this.commentsService.findAll(postId, paginationQuery);
    }

    // Обновление комментария
    @Put(':commentId')
    async updateComment(
        @Param('commentId') commentId: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @GetUser() user: User,
    ) {
        return this.commentsService.update(commentId, user.id, updateCommentDto);
    }

    // Удаление комментария
    @Delete(':commentId')
    async deleteComment(@Param('commentId') commentId: string, @GetUser() user: User) {
        return this.commentsService.delete(commentId, user.id);
    }
}
