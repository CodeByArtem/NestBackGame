import { Provider, Role, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResponse implements User {
    id: string;
    email: string;
    resetPasswordToken: string;
    resetPasswordTokenExpiration: Date;

    @Exclude()
    password: string;

    @Exclude()
    createdAt: Date;

    @Exclude()
    provider: Provider;

    @Exclude()
    isBlocked: boolean;

    updatedAt: Date;
    roles: Role[];

    constructor(user: User) {
        Object.assign(this, user);
    }
}
