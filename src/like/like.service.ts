import { ForbiddenException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikeService {
    constructor(private readonly prismaService: PrismaService) {}

    private async checkLikeExists(userId: string, postId?: string, commentId?: string) {
        if (!postId && !commentId) {
            throw new ForbiddenException('Either postId or commentId must be provided');
        }

        // Проверка существования лайка для поста или комментария
        let like;
        if (postId) {
            like = await this.prismaService.like.findFirst({
                where: { userId, postId },
            });
        } else if (commentId) {
            like = await this.prismaService.like.findFirst({
                where: { userId, commentId },
            });
        }

        return like;
    }

    async create(userId: string, createLikeDto: CreateLikeDto) {
        const { postId, commentId } = createLikeDto;

        if (!postId && !commentId) {
            throw new ForbiddenException('You must provide either postId or commentId');
        }

        const existingLike = await this.checkLikeExists(userId, postId, commentId);
        if (existingLike) {
            throw new ForbiddenException('You already liked this post or comment');
        }

        try {
            return await this.prismaService.like.create({
                data: {
                    userId,
                    postId,
                    commentId,
                },
            });
        } catch (error) {
            // Используем InternalServerErrorException вместо базовой ошибки
            throw new InternalServerErrorException('Error creating like: ' + error.message);
        }
    }

    async delete(userId: string, createLikeDto: CreateLikeDto) {
        const { postId, commentId } = createLikeDto;

        if (!postId && !commentId) {
            throw new ForbiddenException('You must provide either postId or commentId');
        }

        const like = await this.checkLikeExists(userId, postId, commentId);
        if (!like) {
            throw new NotFoundException('Like not found');
        }

        try {
            return await this.prismaService.like.delete({
                where: { id: like.id },
            });
        } catch (error) {
            // Используем InternalServerErrorException вместо базовой ошибки
            throw new InternalServerErrorException('Error deleting like: ' + error.message);
        }
    }
}
