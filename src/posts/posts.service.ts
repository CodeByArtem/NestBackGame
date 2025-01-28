import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatedPostDto } from './dto/updated-post.dto';

@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createPostDto: CreatePostDto, userId: string) {
        const cooldownMinutes = 30;

        // Получаем последний пост пользователя
        const lastPost = await this.prisma.post.findFirst({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
        });

        // Проверяем, можно ли создать новый пост
        if (lastPost) {
            const cooldownEnd = new Date(lastPost.createdAt.getTime() + cooldownMinutes * 60 * 1000);
            const currentTime = new Date();

            if (currentTime < cooldownEnd) {
                const timeLeft = Math.ceil((cooldownEnd.getTime() - currentTime.getTime()) / (60 * 1000));
                throw new BadRequestException(
                    `You can create a new post in ${timeLeft} minutes. Please wait until ${cooldownEnd.toLocaleTimeString()}.`,
                );
            }
        }

        // Создаем пост, если кулдаун закончился
        return this.prisma.post.create({
            data: {
                ...createPostDto,
                authorId: userId,
            },
        });
    }

    async delete(postId: string, userId: string): Promise<boolean> {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post || post.authorId !== userId) {
            return false;
        }

        await this.prisma.post.delete({
            where: { id: postId },
        });
        return true;
    }

    async update(postId: string, updatedPostDto: UpdatedPostDto, userId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post || post.authorId !== userId) {
            return null;
        }
        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: updatedPostDto,
        });
        return updatedPost;
    }

    async findAll(page: number, limit: number) {
        const skip = (page - 1) * limit;

        const posts = await this.prisma.post.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const totalPosts = await this.prisma.post.count();

        return {
            posts,
            meta: {
                totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
                currentPage: page,
            },
        };
    }

    async findAllByUser(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const posts = await this.prisma.post.findMany({
            where: { authorId: userId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const totalPosts = await this.prisma.post.count({
            where: { authorId: userId },
        });

        return {
            posts,
            meta: {
                totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
                currentPage: page,
            },
        };
    }
}
