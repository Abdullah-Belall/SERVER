import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  InstallmentTypeEnum,
  PaidStatusEnum,
  PaymentMethodsEnum,
} from 'src/types/enums/product.enum';

export class CreateOrderNoSortDto {
  @IsUUID()
  @IsNotEmpty()
  car_id: string;
  @IsNotEmpty()
  @IsEnum(PaymentMethodsEnum)
  payment_method: PaymentMethodsEnum;
  @IsNotEmpty()
  @IsEnum(PaidStatusEnum)
  paid_status: PaidStatusEnum;
  @IsOptional()
  @IsNumberString()
  tax: string;
  @IsNumber()
  @IsOptional()
  discount: number;
  @IsString()
  additional_fees: number;
  @IsString()
  additional_band: string;
  @IsEnum(InstallmentTypeEnum)
  @IsOptional()
  installment_type: InstallmentTypeEnum;
  @IsNumber()
  @IsOptional()
  installment: number;
  @IsNumber()
  @IsOptional()
  down_payment: number;
}
