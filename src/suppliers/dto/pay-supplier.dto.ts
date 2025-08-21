import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class PaySupplierDto {
  @IsString()
  @IsUUID()
  cost_id: string;
  @IsNumber()
  installment: number;
  @IsString()
  @IsOptional()
  note?: string;
}
