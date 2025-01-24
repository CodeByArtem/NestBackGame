import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdatedPostDto {
    @IsString()
    @IsNotEmpty({ message: 'Title cannot be empty' })
    @MaxLength(100, { message: 'Title cannot be longer than 100 characters' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'Content cannot be empty' }) // Контент не может быть пустым
    content: string;
}
