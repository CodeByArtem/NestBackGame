import { Controller, Post, Body, Get, Param, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { GetUser } from '@common/dicorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Likes')
@Controller('like')
export class LikeController {
    constructor(private readonly likeService: LikeService) {}

    @ApiOperation({ summary: 'Toggle like for post or comment' })
    @ApiBody({ type: CreateLikeDto })
    @ApiResponse({ status: 200, description: 'Like toggled successfully' })
    @Post('toggle')
    async toggleLike(@Body() createLikeDto: CreateLikeDto, @GetUser() user: User) {
        try {
            return await this.likeService.toggleLike(user.id, createLikeDto);
        } catch (error) {
            throw new InternalServerErrorException(error.message || 'Error toggling like');
        }
    }

    @ApiOperation({ summary: 'Get like count for all posts' })
    @ApiResponse({ status: 200, description: 'Likes count for all posts' })
    @Get('/posts/likes-count')
    getLikesForAllPosts() {
        return this.likeService.getLikesForAllPosts();
    }

    @ApiOperation({ summary: 'Get like count for a single post' })
    @ApiResponse({ status: 200, description: 'Likes count for the specified post' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    @Get('/posts/:postId/likes-count')
    async getLikesForSinglePost(@Param('postId') postId: string) {
        const likesData = await this.likeService.getLikesForSinglePost(postId);

        if (!likesData) {
            throw new NotFoundException('Post not found');
        }

        return likesData;
    }

    @ApiOperation({ summary: 'Get like count for all comments' })
    @ApiResponse({ status: 200, description: 'Likes count for all comments' })
    @Get('/comments/likes-count')
    getLikesForAllComments() {
        return this.likeService.getLikesForAllComments();
    }

    @ApiOperation({ summary: 'Get like count for a single comment' })
    @ApiResponse({ status: 200, description: 'Likes count for the specified comment' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    @Get('/comments/:commentId/likes-count')
    async getLikesForSingleComment(@Param('commentId') commentId: string) {
        const likesData = await this.likeService.getLikesForSingleComment(commentId);

        if (!likesData) {
            throw new NotFoundException('Comment not found');
        }

        return likesData;
    }
}
