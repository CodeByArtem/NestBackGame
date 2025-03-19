import { Controller, Post, Body, Delete, Get, Param, NotFoundException } from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { GetUser } from '@common/dicorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Likes')
@Controller('like')
export class LikeController {
    constructor(private readonly likeService: LikeService) {}

    /**
     * Создание лайка для поста или комментария
     * @param createLikeDto Данные для создания лайка
     * @param user Пользователь, который ставит лайк
     * @returns Результат создания лайка
     */
    @ApiOperation({ summary: 'Create a like' })
    @ApiBody({ type: CreateLikeDto })
    @ApiResponse({ status: 201, description: 'Like created successfully' })
    @Post()
    async createLike(@Body() createLikeDto: CreateLikeDto, @GetUser() user: User) {
        try {
            return await this.likeService.create(user.id, createLikeDto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Удаление лайка для поста или комментария
     * @param createLikeDto Данные для удаления лайка
     * @param user Пользователь, который удаляет лайк
     * @returns Результат удаления лайка
     */
    @ApiOperation({ summary: 'Delete a like' })
    @ApiBody({ type: CreateLikeDto })
    @ApiResponse({ status: 200, description: 'Like deleted successfully' })
    @Delete()
    async deleteLike(@Body() createLikeDto: CreateLikeDto, @GetUser() user: User) {
        try {
            return await this.likeService.delete(user.id, createLikeDto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Получить количество лайков для всех постов
     * @returns Список лайков для всех постов
     */
    @ApiOperation({ summary: 'Get like count for all posts' })
    @ApiResponse({ status: 200, description: 'Likes count for all posts' })
    @Get('/posts/likes-count')
    getLikesForAllPosts() {
        return this.likeService.getLikesForAllPosts();
    }

    /**
     * Получить количество лайков для одного поста по ID
     * @param postId ID поста
     * @returns Количество лайков для указанного поста
     */
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
}
