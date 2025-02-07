import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { genSaltSync, hashSync } from 'bcrypt';
import { JwtPayload } from '@auth/interfaces';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { convertToSecondsUtil } from '@common/utils';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly configService: ConfigService,
    ) {}

    async save(user: Partial<User>) {
        const existingUser = await this.prismaService.user.findUnique({
            where: { email: user.email },
        });

        let hashedPassword = existingUser?.password; // Оставляем старый пароль, если его не передают

        if (user.password) {
            hashedPassword = this.hashPassword(user.password); // Хешируем новый пароль
        }

        if (!hashedPassword) {
            throw new Error('Cannot save user without a password');
        }

        const savedUser = await this.prismaService.user.upsert({
            where: { email: user.email },
            update: {
                email: user.email, // Чтобы email обновился
                password: hashedPassword, // Оставляем старый или обновленный пароль
                provider: user?.provider ?? undefined,
                roles: user?.roles ?? undefined,
                isBlocked: user?.isBlocked !== undefined ? user.isBlocked : false,
            },
            create: {
                email: user.email,
                password: hashedPassword,
                provider: user?.provider,
                roles: ['USER'],
            },
        });

        await this.cacheManager.set(savedUser.id, savedUser);
        return savedUser;
    }

    async findOne(idOrEmail: string, isReset = false): Promise<User> {
        if (isReset) {
            await this.cacheManager.del(idOrEmail);
        }

        let user = await this.cacheManager.get<User>(idOrEmail);

        if (!user) {
            user = await this.prismaService.user.findFirst({
                where: {
                    OR: [{ id: idOrEmail }, { email: idOrEmail }],
                },
            });

            if (!user) return null;

            await this.cacheManager.set(user.id, user, convertToSecondsUtil(this.configService.get('JWT_EXP')));
            await this.cacheManager.set(user.email, user, convertToSecondsUtil(this.configService.get('JWT_EXP')));
        }

        return user;
    }

    async delete(id: string, user: JwtPayload) {
        if (user.id !== id && !user.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('You can only delete your own account.');
        }

        const existingUser = await this.prismaService.user.findUnique({ where: { id } });
        if (existingUser) {
            await this.cacheManager.del(existingUser.id);
            await this.cacheManager.del(existingUser.email);
        }

        return this.prismaService.user.delete({ where: { id }, select: { id: true } });
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
