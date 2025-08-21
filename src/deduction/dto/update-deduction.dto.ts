import { PartialType } from '@nestjs/mapped-types';
import { CreateDeductionDto } from './create-deduction.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { DeductionStatusEnum } from 'src/types/enums/user.enum';

export class UpdateDeductionDto extends PartialType(CreateDeductionDto) {
  @IsOptional()
  @IsEnum(DeductionStatusEnum)
  status: DeductionStatusEnum;
}
