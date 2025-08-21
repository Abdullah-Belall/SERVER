import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAdvanceDto {
  @IsNumber()
  @Min(1)
  amount: number;
  @IsString()
  @IsOptional()
  note: string;
}
