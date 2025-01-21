import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '@common/dicorators'; // Импорт вашей модели ролей

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(), // Проверка метаданных для маршрута
            context.getClass(), // Проверка метаданных для контроллера
        ]);

        if (!requiredRoles) {
            return true; // Если роли не указаны, доступ открыт
        }

        const { user } = context.switchToHttp().getRequest(); // Извлечение пользователя из запроса

        return requiredRoles.some((role) => user?.roles?.includes(role)); // Проверка ролей пользователя
    }
}
