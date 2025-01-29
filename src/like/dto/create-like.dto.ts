import { IsString, ValidateIf, IsNotEmpty } from 'class-validator';

export class CreateLikeDto {
    @ValidateIf((o) => !o.commentId) // Если commentId нет, проверяем postId
    @IsString()
    @IsNotEmpty()
    postId?: string;

    @ValidateIf((o) => !o.postId) // Если postId нет, проверяем commentId
    @IsString()
    @IsNotEmpty()
    commentId?: string;
}
