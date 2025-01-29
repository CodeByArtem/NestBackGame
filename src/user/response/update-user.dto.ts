import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ description: 'The user email', example: 'user@example.com' })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ description: 'The user name', example: 'John Doe' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'The user password', example: 'newpassword123' })
    @IsString()
    @IsOptional()
    password?: string;
}
