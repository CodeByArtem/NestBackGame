import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { Provider, Token, User } from '@prisma/client';
import { compareSync } from 'bcrypt';
import { add } from 'date-fns';
import { v4 } from 'uuid';
import { Tokens } from './interfaces';
import { LoginDto, RegisterDto } from '@auth/dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger('AuthService');

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
    ) {}

    async refreshTokens(refreshToken: string, agent: string): Promise<Tokens> {
        // Ищем токен без удаления сразу
        const tokenRecord = await this.prismaService.token.findUnique({ where: { token: refreshToken } });
        if (!tokenRecord || new Date(tokenRecord.exp) < new Date()) {
            if (tokenRecord) {
                await this.deleteRefreshToken(refreshToken);
            }
            throw new UnauthorizedException();
        }
        // Удаляем токен, чтобы он не мог быть использован повторно
        await this.deleteRefreshToken(refreshToken);

        const user = await this.userService.findOne(tokenRecord.userId);
        return this.generateTokens(user, agent);
    }

    async register(dto: RegisterDto) {
        const user: User = await this.userService.findOne(dto.email).catch((err) => {
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
        const user: User = await this.userService.findOne(dto.email, true).catch((err) => {
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
        const refreshTokenObj = await this.getRefreshToken(user.id, agent);
        return { accessToken, refreshToken: refreshTokenObj };
    }

    private async getRefreshToken(userId: string, agent: string): Promise<Token> {
        // Пытаемся найти существующий токен для данного пользователя и агента
        const existingToken = await this.prismaService.token.findFirst({
            where: { userId, userAgent: agent },
        });

        if (existingToken) {
            // Обновляем существующий токен: генерируем новое значение и новый срок действия
            return this.prismaService.token.update({
                where: { token: existingToken.token },
                data: {
                    token: v4(),
                    exp: add(new Date(), { months: 1 }),
                },
            });
        }
        // Если не найден, создаем новый токен
        return this.prismaService.token.create({
            data: {
                token: v4(),
                exp: add(new Date(), { months: 1 }),
                userId,
                userAgent: agent,
            },
        });
    }

    deleteRefreshToken(token: string) {
        return this.prismaService.token.delete({ where: { token } });
    }

    async providerAuth(email: string, agent: string, provider: Provider) {
        let user = await this.userService.findOne(email);
        if (!user) {
            user = await this.userService.save({ email, provider }).catch((err) => {
                this.logger.error(err);
                return null;
            });
            if (!user) {
                throw new HttpException(
                    `Не получилось создать пользователя с email ${email} в Google auth`,
                    HttpStatus.BAD_REQUEST,
                );
            }
        }
        return this.generateTokens(user, agent);
    }
}
