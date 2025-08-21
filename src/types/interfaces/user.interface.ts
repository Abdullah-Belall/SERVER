import { Request } from 'express';
import { ProductSortsEntity } from 'src/products/entities/product-sort.entity';
import { RoleEnum } from '../enums/user.enum';

export interface WorkerTokenInterface {
  id: string;
  user_name: string;
  role: RoleEnum;
  tenant_id: string;
}

export interface CustomRequest extends Request {
  user?: WorkerTokenInterface;
}
export interface CustomProductSortsInterface extends ProductSortsEntity {
  orders_count?: number;
}
