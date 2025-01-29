import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationQueryDto } from './dto/paginations-commets.dto';

// Импортируем DTO для пагинации

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) {}

    // Вынести проверку существования комментария
    private async checkCommentExists(commentId: string, userId: string): Promise<any> {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });
        if (!comment) {
            throw new NotFoundException('Comment not found.');
        }
        if (comment.authorId !== userId) {
            throw new ForbiddenException('You are not authorized to modify or delete this comment.');
        }
        return comment;
    }

    // Создание комментария
    async create(postId: string, userId: string, createCommentDto: CreateCommentDto) {
        return this.prisma.comment.create({
            data: {
                content: createCommentDto.content,
                postId,
                authorId: userId,
            },
        });
    }

    // Получение всех комментариев для поста с пагинацией
    async findAll(postId: string, paginationQuery: PaginationQueryDto) {
        const { page, limit } = paginationQuery;
        const skip = (page - 1) * limit;

        const comments = await this.prisma.comment.findMany({
            where: { postId },
            skip, // Пропускаем количество комментариев, соответствующее предыдущим страницам
            take: limit, // Берем количество комментариев на текущей странице
            orderBy: { createdAt: 'asc' }, // Сортируем по дате создания
            include: { likes: true },
        });

        const totalComments = await this.prisma.comment.count({
            where: { postId },
        });

        return {
            comments: comments.map((comment) => ({
                ...comment,
                likesCount: comment.likes.length,
            })),
            meta: {
                totalComments,
                totalPages: Math.ceil(totalComments / limit),
                currentPage: page,
            },
        };
    }

    // Обновление комментария
    async update(commentId: string, userId: string, updateCommentDto: UpdateCommentDto) {
        await this.checkCommentExists(commentId, userId); // Проверяем, существует ли комментарий и права доступа

        return this.prisma.comment.update({
            where: { id: commentId },
            data: updateCommentDto,
        });
    }

    // Удаление комментария
    async delete(commentId: string, userId: string) {
        await this.checkCommentExists(commentId, userId); // Проверяем, существует ли комментарий и права доступа

        await this.prisma.comment.delete({
            where: { id: commentId },
        });

        return { message: 'Comment deleted' };
    }
}
