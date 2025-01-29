import { Controller, Post, Body, Delete } from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { GetUser } from '@common/dicorators/get-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Like')
@Controller('like')
export class LikeController {
    constructor(private readonly likeService: LikeService) {}

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
}
