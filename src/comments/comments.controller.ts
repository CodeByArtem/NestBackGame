import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetUser } from '@common/dicorators/get-user.decorator';
import { User } from '@prisma/client';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationQueryDto } from './dto/paginations-commets.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Comments')
@Controller('posts/:postId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @ApiOperation({ summary: 'Create a comment' })
    @ApiParam({ name: 'postId', description: 'ID of the post' })
    @ApiBody({ type: CreateCommentDto })
    @ApiResponse({ status: 201, description: 'Comment created successfully' })
    @Post()
    async createComment(
        @Param('postId') postId: string,
        @Body() createCommentDto: CreateCommentDto,
        @GetUser() user: User,
    ) {
        return this.commentsService.create(postId, user.id, createCommentDto);
    }

    @ApiOperation({ summary: 'Get comments for a post' })
    @ApiParam({ name: 'postId', description: 'ID of the post' })
    @ApiQuery({ type: PaginationQueryDto })
    @ApiResponse({ status: 200, description: 'List of comments' })
    @Get()
    async getComments(@Param('postId') postId: string, @Query() paginationQuery: PaginationQueryDto) {
        return this.commentsService.findAll(postId, paginationQuery);
    }

    @ApiOperation({ summary: 'Update a comment' })
    @ApiParam({ name: 'commentId', description: 'ID of the comment' })
    @ApiBody({ type: UpdateCommentDto })
    @ApiResponse({ status: 200, description: 'Comment updated successfully' })
    @Put(':commentId')
    async updateComment(
        @Param('commentId') commentId: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @GetUser() user: User,
    ) {
        return this.commentsService.update(commentId, user.id, updateCommentDto);
    }

    @ApiOperation({ summary: 'Delete a comment' })
    @ApiParam({ name: 'commentId', description: 'ID of the comment' })
    @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
    @Delete(':commentId')
    async deleteComment(@Param('commentId') commentId: string, @GetUser() user: User) {
        return this.commentsService.delete(commentId, user.id);
    }
}
