import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@user/user.module';
import { options } from '@auth/config';
import { STRTAGIES } from '@auth/strategies';
import { GUARDS } from '@auth/guard';

@Module({
    controllers: [AuthController],
    providers: [AuthService, ...STRTAGIES, ...GUARDS],
    imports: [PassportModule, JwtModule.registerAsync(options()), UserModule],
})
export class AuthModule {}
