import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCommentDto {
    @IsNotEmpty({ message: 'Content should not be empty.' })
    @IsString({ message: 'Content should be a string.' })
    @Length(3, 500, { message: 'Content should be between 3 and 500 characters.' })
    content: string;
}
