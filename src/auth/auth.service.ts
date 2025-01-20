import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from '@user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { Token, User } from '@prisma/client';
import { compareSync } from 'bcrypt';
import { add } from 'date-fns';
import { v4 } from 'uuid';
import { Tokens } from './interfaces';
import { LoginDto, RegisterDto } from '@auth/dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService.name');

    constructor(
        private readonly useService: UserService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
    ) {}

    async refreshTokens(refreshToken: string, agent: string): Promise<Tokens> {
        const token = await this.prismaService.token.findUnique({
            where: { token: refreshToken },
        });
        if (!token) {
            throw new UnauthorizedException();
        }
        await this.prismaService.token.delete({
            where: { token: refreshToken },
        });
        if (new Date(token.exp) < new Date()) {
            throw new UnauthorizedException();
        }
        const user = await this.useService.findOne(token.userId);
        return this.generateTokens(user, agent);
    }

    async register(dto: RegisterDto) {
        const user: User = await this.useService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (user) {
            throw new ConflictException('Пользователь с таким email уже зарегистрирован');
        }
        return this.useService.save(dto).catch((err) => {
            this.logger.error(err);
            return null;
        });
    }

    async login(dto: LoginDto, agent: string): Promise<Tokens> {
        const user: User = await this.useService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });
        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Не верный логин или пароль');
        }
        return this.generateTokens(user, agent);
    }

    private async generateTokens(user: User, agent: string): Promise<Tokens> {
        const accessToken =
            'Bearer ' +
            this.jwtService.sign({
                id: user.id,
                email: user.email,
                roles: user.roles,
            });
        const refreshToken = await this.getRefreshToken(user.id, agent);
        return { accessToken, refreshToken };
    }

    private async getRefreshToken(userId: string, agent: string): Promise<Token> {
        const _token = await this.prismaService.token.findFirst({
            where: {
                userId,
                userAgent: agent,
            },
        });
        const token = _token?.token ?? '';
        return this.prismaService.token.upsert({
            where: { token },
            update: {
                token: v4(),
                exp: add(new Date(), { months: 1 }),
            },
            create: {
                token: v4(),
                exp: add(new Date(), { months: 1 }),
                userId,
                userAgent: agent,
            },
        });
    }
}
