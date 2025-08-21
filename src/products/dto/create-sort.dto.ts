import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSortDto {
  @IsString()
  @IsOptional()
  size: string;
  @IsString()
  @IsOptional()
  name: string;
  @IsString()
  @IsNotEmpty()
  supplier: string;
  @IsString()
  @IsOptional()
  color: string;
  @IsNumber()
  qty: number;
  @IsNumber()
  unit_price: number;
  @IsNumber()
  costPrice: number;
  @IsOptional()
  @IsString()
  note?: string;
  @IsOptional()
  @IsNumber()
  initial_amount: number;
}
