import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CarType } from 'src/types/enums/product.enum';

export class CreateCarDto {
  @IsString()
  mark: string;
  @IsOptional()
  @IsEnum(CarType)
  type: CarType;
  @IsString()
  @IsOptional()
  plate: string;
  @IsString()
  @IsOptional()
  chassis: string;
  @IsString()
  @IsOptional()
  color: string;
  @IsOptional()
  @IsNumber()
  model: number;
  @IsOptional()
  @IsNumber()
  category: number;
}
