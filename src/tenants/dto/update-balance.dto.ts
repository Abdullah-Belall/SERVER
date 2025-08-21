import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PeriodsEnum } from 'src/types/enums/product.enum';

export class UpdateBalanceDto {
  @IsString()
  @IsNotEmpty()
  balance: number;

  @IsNotEmpty()
  @IsEnum(PeriodsEnum)
  period: PeriodsEnum;
}
