import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { RequestResetPasswordDto } from '@auth/dto/request-reset-password.dto';
import { ResetPasswordDto } from '@auth/dto/reset-password-dto';
import { PrismaService } from '@prisma/prisma.service';
import { EmailService } from '../../../libs/common/email/email.service';

@Injectable()
export class PasswordResetService {
    private readonly logger = new Logger(PasswordResetService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) {}

    async requestPasswordReset(requestDto: RequestResetPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: requestDto.email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Обновляем пользователя с токеном и временем истечения
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpiration: new Date(Date.now() + 3600000), // 1 час
            },
        });

        await this.emailService.sendEmail(
            requestDto.email,
            'Password Reset Request',
            `To reset your password, click the following link: 
         http://localhost:3000/reset-password?token=${resetToken}`,
        );

        this.logger.log(`Password reset token generated for user ${user.id}`);
        return { message: 'Password reset link sent' };
    }

    async resetPassword(resetDto: ResetPasswordDto) {
        const hashedToken = crypto.createHash('sha256').update(resetDto.token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpiration: { gt: new Date() }, // Проверяем, что токен не истёк
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired token');
        }

        const hashedPassword = await bcrypt.hash(resetDto.newPassword, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null, // Убираем токен после успешного сброса
                resetPasswordTokenExpiration: null,
            },
        });

        this.logger.log(`Password successfully reset for user ${user.id}`);
        return { message: 'Password successfully reset' };
    }
}
