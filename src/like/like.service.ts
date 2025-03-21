import { ForbiddenException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikeService {
    constructor(private readonly prismaService: PrismaService) {}

    async checkLikeExists(userId: string, postId?: string, commentId?: string) {
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

    async toggleLike(userId: string, createLikeDto: CreateLikeDto) {
        const { postId, commentId } = createLikeDto;

        if (!postId && !commentId) {
            throw new ForbiddenException('You must provide either postId or commentId');
        }

        const existingLike = await this.checkLikeExists(userId, postId, commentId);

        if (existingLike) {
            if (existingLike.userId !== userId) {
                throw new ForbiddenException('You can only remove your own likes');
            }

            await this.prismaService.like.delete({ where: { id: existingLike.id } });
            const count = await this.prismaService.like.count({ where: { postId, commentId } });
            return { liked: false, likesCount: count };
        } else {
            await this.prismaService.like.create({ data: { userId, postId, commentId } });

            const count = await this.prismaService.like.count({ where: { postId, commentId } });
            return { liked: true, likesCount: count };
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
            const postExists = await this.prismaService.post.findUnique({ where: { id: postId } });

            if (!postExists) {
                throw new NotFoundException('Post not found');
            }

            const likesCount = await this.prismaService.like.count({ where: { postId } });
            return { postId, likes: likesCount };
        } catch (error) {
            throw new InternalServerErrorException('Error fetching like data: ' + error.message);
        }
    }

    async getLikesForAllComments() {
        try {
            const likesData = await this.prismaService.like.groupBy({
                by: ['commentId'],
                _count: { commentId: true },
            });

            return likesData.map((like) => ({
                commentId: like.commentId,
                likes: like._count.commentId,
            }));
        } catch (error) {
            throw new InternalServerErrorException('Error fetching comments likes data: ' + error.message);
        }
    }

    async getLikesForSingleComment(commentId: string) {
        try {
            const commentExists = await this.prismaService.comment.findUnique({ where: { id: commentId } });

            if (!commentExists) {
                throw new NotFoundException('Comment not found');
            }

            const likesCount = await this.prismaService.like.count({ where: { commentId } });
            return { commentId, likes: likesCount };
        } catch (error) {
            throw new InternalServerErrorException('Error fetching comment like data: ' + error.message);
        }
    }
}
