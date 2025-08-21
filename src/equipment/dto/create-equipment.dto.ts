import { IsNumber, IsString, Min } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  name: string;
  @IsNumber()
  @Min(1)
  qty: number;
  @IsNumber()
  @Min(1)
  unit_price: number;
}
