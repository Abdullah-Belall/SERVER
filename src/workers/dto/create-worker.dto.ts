import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

enum RoleEnum {
  READER = 'reader',
  OWNER = 'owner',
  ADMIN = 'admin',
}
export default class CreateWorkerDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(15)
  user_name: string;
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  password: string;
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  @IsOptional()
  role: RoleEnum;
  @IsNumber()
  @Min(1)
  @IsOptional()
  salary: number;
}
