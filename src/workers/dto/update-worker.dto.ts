import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RoleEnum } from 'src/types/enums/user.enum';

class CreateWorkerDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(15)
  user_name: string;
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  role: RoleEnum;
  @IsNumber()
  @Min(1)
  salary: number;
}
export class UpdateWorkerDto extends PartialType(CreateWorkerDto) {}
