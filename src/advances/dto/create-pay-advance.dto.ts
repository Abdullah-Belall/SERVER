import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePayAdvanceDto {
  @IsNumber()
  amount: number;
  @IsString()
  @IsOptional()
  note: string;
}
