import {
    Controller,
    Post,
    Body,
    Delete,
    Param,
    BadRequestException,
    Put,
    ValidationPipe,
    Query,
    Get,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatedPostDto } from './dto/updated-post.dto';
import { PostsService } from './posts.service';
import { GetUser } from '@common/dicorators/get-user.decorator';
import { User } from '@prisma/client';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new post' })
    @ApiBody({ type: CreatePostDto })
    @ApiResponse({ status: 201, description: 'The post has been successfully created.' })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    async createPost(@Body(new ValidationPipe()) createPostDto: CreatePostDto, @GetUser() user: User) {
        return this.postsService.create(createPostDto, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a post' })
    @ApiResponse({ status: 200, description: 'The post has been successfully deleted.' })
    @ApiResponse({ status: 400, description: "You can't delete a post that doesn't belong to you." })
    async delete(@Param('id') postId: string, @GetUser() user: User) {
        const isDelet = await this.postsService.delete(postId, user.id);

        // Проверка, если пост не существует или не принадлежит пользователю
        if (!isDelet) {
            throw new BadRequestException("You can't delete a post that doesn't belong to you.");
        }

        return { message: 'Deleted post' };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a post' })
    @ApiBody({ type: UpdatedPostDto })
    @ApiResponse({ status: 200, description: 'The post has been successfully updated.' })
    @ApiResponse({ status: 400, description: "You can't update posts that don't belong to you." })
    async updatedPost(
        @Param('id') postId: string,
        @Body(new ValidationPipe()) updatedPostDto: UpdatedPostDto,
        @GetUser() user: User,
    ) {
        // Обновление поста через сервис
        const updatedPost = await this.postsService.update(postId, updatedPostDto, user.id);

        // Если пост не найден или не принадлежит пользователю, выбрасываем ошибку
        if (!updatedPost) {
            throw new BadRequestException("You can't update posts that don't belong to you.");
        }

        return updatedPost; // Возвращаем обновленный пост
    }

    @Get()
    @ApiOperation({ summary: 'Get all posts with pagination' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Limit number of posts per page' })
    @ApiResponse({ status: 200, description: 'List of posts' })
    async getAllPosts(@Query() paginationQuery: PaginationQueryDto) {
        const { page, limit } = paginationQuery;
        return this.postsService.findAll(page, limit);
    }

    @Get('user')
    @ApiOperation({ summary: 'Get posts by user with pagination' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Limit number of posts per page' })
    @ApiResponse({ status: 200, description: 'List of posts by the user' })
    async getPostsByUser(@Query() paginationQuery: PaginationQueryDto, @GetUser() user: User) {
        const { page, limit } = paginationQuery;
        return this.postsService.findAllByUser(user.id, page, limit);
    }
}
