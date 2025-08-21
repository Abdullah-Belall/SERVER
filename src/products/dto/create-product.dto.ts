import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsUUID()
  categoryId: string;

  @IsString()
  @IsOptional()
  material: string;

  @IsString()
  @IsOptional()
  note?: string;
}
