import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';
import {
  InstallmentTypeEnum,
  PaidStatusEnum,
  PaymentMethodsEnum,
} from 'src/types/enums/product.enum';
import { IsValidProductSorts } from 'src/vaildator/json.vaildator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  car_id: string;
  @IsNotEmpty()
  @IsString()
  @Validate(IsValidProductSorts)
  product_sorts: string;
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
  @IsNumber()
  @IsOptional()
  additional_fees: number;
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
