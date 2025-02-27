import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
    [x: string]: any;
    async onModuleInit() {
        await this.$connect();
    }

    // Обработчик для корректного завершения работы
    async onApplicationShutdown() {
        await this.$disconnect(); // Правильный метод для отключения Prisma от базы данных
    }
}
