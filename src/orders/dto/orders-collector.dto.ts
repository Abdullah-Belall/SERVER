import { IsJSON } from 'class-validator';

export class OrdersCollectorDto {
  @IsJSON()
  ids: any;
}
