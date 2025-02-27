import { Module } from '@nestjs/common';
import { UserService } from '@user/user.service';
import { UserController } from '@user/user.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    providers: [UserService],
    exports: [UserService],
    controllers: [UserController],
    imports: [CacheModule.register()],
})
export class UserModule {}
