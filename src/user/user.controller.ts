import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Put,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { UserService } from '@user/user.service';
import { UserResponse } from '@user/response';
import { CurrentUser, Roles } from '@common/dicorators';
import { JwtPayload } from '@auth/interfaces';
import { RolesGuard } from '@auth/guard/role.guard';
import { JwtAuthGuard } from '@auth/guard/jwt-auth.guard';
import { Role, User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto } from '@user/response/update-user.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    // ✅ Получение данных авторизованного пользователя
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @ApiOperation({ summary: 'Get current logged-in user' })
    @Get('me')
    async getProfile(@CurrentUser() user: JwtPayload) {
        const userData = await this.userService.findOne(user.id);
        return new UserResponse(userData);
    }

    // ✅ Только админ может получить данные любого пользователя по ID или email
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(ClassSerializerInterceptor)
    @ApiOperation({ summary: 'Get user by ID or email (Admin only)' })
    @ApiParam({ name: 'idOrEmail', description: 'User ID or email' })
    @Get(':idOrEmail')
    async findOneUser(@Param('idOrEmail') idOrEmail: string) {
        const user = await this.userService.findOne(idOrEmail);
        return new UserResponse(user);
    }

    // ✅ Удаление: юзер может удалить только себя, админ — любого
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete a user by ID' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @Delete(':id')
    async deleteUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
        return this.userService.delete(id, user);
    }

    // ✅ Обновление данных (может делать сам пользователь)
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @ApiOperation({ summary: 'Update user' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @Put()
    async updateUser(@Body() body: Partial<User>, @CurrentUser() user: JwtPayload) {
        const updatedUser = await this.userService.save({ ...body, id: user.id });
        return new UserResponse(updatedUser);
    }
}
