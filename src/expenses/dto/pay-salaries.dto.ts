import { IsJSON, IsNotEmpty } from 'class-validator';

export class PaySalariesDto {
  @IsNotEmpty()
  @IsJSON()
  data: any;
}
