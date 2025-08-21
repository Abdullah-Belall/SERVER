import { IsOptional, IsString } from 'class-validator';

export class CreateAbsenceDto {
  @IsOptional()
  @IsString()
  reason: string;
}
