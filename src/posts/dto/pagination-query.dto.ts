import { IsInt, IsPositive, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Transform(({ value }) => parseInt(value, 10)) // Преобразуем строку в число
    page: number = 1;

    @IsOptional()
    @IsInt()
    @IsPositive()
    @Transform(({ value }) => parseInt(value, 10)) // Преобразуем строку в число
    limit: number = 10;
}
