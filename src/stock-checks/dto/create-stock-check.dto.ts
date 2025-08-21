import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStockCheckDto {
  @IsString()
  @IsOptional()
  note: string;
  @IsNotEmpty()
  data: any;
  @IsIn(['sorts', 'equipments'])
  type: 'sorts' | 'equipments';
}
