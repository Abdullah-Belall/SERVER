import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;
  @IsString()
  @IsOptional()
  tax_num: string;
  @IsNumber()
  @IsOptional()
  balance: number;
}
