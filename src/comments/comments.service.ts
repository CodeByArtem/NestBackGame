import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(postId: string, userId: string, createCommentDto: CreateCommentDto) {
        return this.prisma.comment.create({
            data: {
                content: createCommentDto.content,
                postId,
                authorId: userId,
            },
        });
    }

    async findAll(postId: string) {
        return this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(commentId: string, userId: string, updateCommentDto: UpdateCommentDto) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment || comment.authorId !== userId) {
            throw new NotFoundException("'Comment not found or access denied.'");
        }
        return this.prisma.comment.update({
            where: { id: commentId },
            data: updateCommentDto,
        });
    }

    async delete(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment || comment.authorId !== userId) {
            throw new NotFoundException("'Comment not found or access denied.'");
        }
        await this.prisma.comment.delete({
            where: { id: commentId },
        });
        return { message: 'Comment deleted' };
    }
}
