import { Injectable, Logger, UnauthorizedException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { compareSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { Token, Tokens } from './types';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly prismaService: PrismaService,
    ) {}

    async refreshTokens(refreshToken: string, agent: string): Promise<Tokens> {
        const token = await this.prismaService.token.findUnique({ where: { token: refreshToken } });

        if (!token || new Date(token.exp) < new Date()) {
            if (token) await this.deleteRefreshToken(refreshToken);
            throw new UnauthorizedException();
        }

        const user = await this.userService.findOne(token.userId);
        return this.generateTokens(user, agent);
    }

    async register(dto: RegisterDto) {
        const user = await this.userService.findOne(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (user) {
            throw new ConflictException('Пользователь с таким email уже зарегистрирован');
        }

        return this.userService.save(dto).catch((err) => {
            this.logger.error(err);
            return null;
        });
    }

    async login(dto: LoginDto, agent: string): Promise<Tokens> {
        const user = await this.userService.findOne(dto.email, true).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        return this.generateTokens(user, agent);
    }

    private async generateTokens(user: any, agent: string): Promise<Tokens> {
        const accessToken = this.jwtService.sign({
            id: user.id,
            email: user.email,
            roles: user.roles,
        });

        const refreshToken = await this.getRefreshToken(user.id, agent);

        return { accessToken, refreshToken };
    }

    private async getRefreshToken(userId: string, agent: string): Promise<Token> {
        const existingToken = await this.prismaService.token.findFirst({
            where: { userId, userAgent: agent },
        });

        if (existingToken) {
            return existingToken;
        }

        const newToken = {
            token: uuidv4(),
            exp: add(new Date(), { months: 1 }),
            userId,
            userAgent: agent,
        };

        await this.prismaService.token.create({ data: newToken });

        return newToken;
    }

    async deleteRefreshToken(token: string) {
        await this.prismaService.token.delete({ where: { token } }).catch(() => null);
    }

    async providerAuth(email: string, agent: string, provider: string) {
        let user = await this.userService.findOne(email);

        if (!user) {
            user = await this.userService.save({ email, provider }).catch((err) => {
                this.logger.error(err);
                return null;
            });

            if (!user) {
                throw new HttpException(
                    `Не удалось создать пользователя с email ${email} в Google auth`,
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        return this.generateTokens(user, agent);
    }
}

