import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@user/user.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@auth/interfaces';
import { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        configService: ConfigService,
        private readonly userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        const user: User = await this.userService.findOne(payload.id).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (!user || user.isBlocked) {
            throw new UnauthorizedException();
        }
        return payload;
    }
}
