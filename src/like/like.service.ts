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

        return await this.prismaService.like.findFirst({
            where: {
                userId,
                ...(postId ? { postId } : {}),
                ...(commentId ? { commentId } : {}),
            },
        });
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
                data: { userId, postId, commentId },
            });
        } catch (error) {
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
            throw new InternalServerErrorException('Error deleting like: ' + error.message);
        }
    }

    async getLikesForAllPosts() {
        try {
            const likesData = await this.prismaService.like.groupBy({
                by: ['postId'],
                _count: { postId: true },
            });

            return likesData.map((like) => ({
                postId: like.postId,
                likes: like._count.postId,
            }));
        } catch (error) {
            throw new InternalServerErrorException('Error fetching likes data: ' + error.message);
        }
    }

    async getLikesForSinglePost(postId: string) {
        try {
            const postExists = await this.prismaService.post.findUnique({
                where: { id: postId },
            });

            if (!postExists) {
                throw new NotFoundException('Post not found');
            }

            const likesCount = await this.prismaService.like.count({
                where: { postId },
            });

            return { postId, likes: likesCount };
        } catch (error) {
            throw new InternalServerErrorException('Error fetching like data: ' + error.message);
        }
    }
}
