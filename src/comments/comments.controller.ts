import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetUser } from '@common/dicorators/get-user.decorator';
import { User } from '@prisma/client';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('posts/:postId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post()
    async createComment(
        @Param('postId') postId: string,
        @Body() createCommentDto: CreateCommentDto,
        @GetUser() user: User,
    ) {
        return this.commentsService.create(postId, user.id, createCommentDto);
    }

    @Get()
    async getComments(@Param('postId') postId: string) {
        return this.commentsService.findAll(postId);
    }

    @Put(':commentId')
    async updateComment(
        @Param('commentId') commentId: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @GetUser() user: User,
    ) {
        return this.commentsService.update(commentId, user.id, updateCommentDto);
    }

    @Delete(':commentId')
    async deleteComment(@Param('commentId') commentId: string, @GetUser() user: User) {
        return this.commentsService.delete(commentId, user.id);
    }
}
