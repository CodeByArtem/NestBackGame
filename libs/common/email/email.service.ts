import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    async sendEmail(to: string, subject: string, html: string) {
        // Настроим SMTP транспорт
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST, // Чтение хоста из переменных окружения
            port: +process.env.SMTP_PORT, // Чтение порта
            secure: false, // Для порта 587 не требуется secure
            auth: {
                user: process.env.SMTP_USER, // Логин из переменных окружения
                pass: process.env.BREVO_SMTP_KEY, // Пароль (или API ключ) из переменных окружения
            },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM, // Адрес отправителя из переменных окружения
            to, // Адрес получателя
            subject, // Тема письма
            html, // Тело письма (HTML)
        };

        try {
            // Отправляем письмо
            await transporter.sendMail(mailOptions);
            this.logger.log(`Email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Error sending email to ${to}: ${error.message}`, error.stack);
        }
    }
}
