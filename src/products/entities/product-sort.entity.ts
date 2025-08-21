import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductsEntity } from './product.entity';
import { OrderItemsEntity } from 'src/orders/entities/order-items.entity';
import { CostsEntity } from './good-costs.entity';
import { StockChecksItemsEntity } from 'src/stock-checks/entities/stock-checks-items.entity';

@Entity({ name: 'product_sorts' })
export class ProductSortsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => ProductsEntity, (product) => product.sorts)
  product: ProductsEntity;

  @Column({ nullable: true })
  name: string;
  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  size: string;

  @Column()
  qty: number;

  @Column({ type: 'decimal' })
  unit_price: number;
  @Column({ nullable: true })
  note: string;
  @OneToMany(() => OrderItemsEntity, (order) => order.sort, {
    cascade: true,
  })
  order_items: OrderItemsEntity[];
  @OneToMany(() => CostsEntity, (cost) => cost.sort, {
    cascade: true,
  })
  costs: CostsEntity[];
  @OneToMany(() => StockChecksItemsEntity, (stChks) => stChks.sort, {
    cascade: true,
  })
  stock_checks_items: StockChecksItemsEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
