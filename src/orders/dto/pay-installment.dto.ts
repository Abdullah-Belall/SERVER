import { IsNotEmpty, IsNumber } from 'class-validator';

export class PayInstallmentDto {
  @IsNotEmpty()
  @IsNumber()
  installment: number;
}
