import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsNumber, IsNumberString } from 'class-validator';
import {
  InstallmentTypeEnum,
  PaidStatusEnum,
  PaymentMethodsEnum,
} from 'src/types/enums/product.enum';
class CreateOrderDto {
  @IsNotEmpty()
  @IsEnum(PaymentMethodsEnum)
  payment_method: PaymentMethodsEnum;
  @IsNotEmpty()
  @IsEnum(PaidStatusEnum)
  paid_status: PaidStatusEnum;
  @IsNumberString()
  tax: string;
  @IsNumber()
  additional_fees: number;
  @IsNumber()
  client_balance: number;
  @IsNumber()
  discount: number;
  @IsEnum(InstallmentTypeEnum)
  installment_type: InstallmentTypeEnum;
}
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
