import { IsOptional, IsString } from 'class-validator';

export class CreateCrmDateDto {
  @IsString()
  @IsOptional()
  note: string;
}
