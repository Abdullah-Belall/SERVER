import { IsDateString, IsString } from 'class-validator';

export class CreateCrmDto {
  @IsString()
  name: string;
  @IsDateString()
  next_call_date: Date;
}
