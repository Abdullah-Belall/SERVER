import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDeductionDto {
  @IsNumber()
  amount: number;
  @IsString()
  @IsOptional()
  note: string;
}
