import { Module } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from '@prisma/prisma.service';
import { EmailService } from '../../../libs/common/email/email.service'; // Подключаем PrismaService для работы с БД

@Module({
    controllers: [PasswordResetController],
    providers: [PasswordResetService, PrismaService, EmailService], // Подключаем сервисы
})
export class PasswordResetModule {}
