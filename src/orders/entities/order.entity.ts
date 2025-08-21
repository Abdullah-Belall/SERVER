import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderItemsEntity } from './order-items.entity';
import { PaymentsEntity } from './payments.entity';
import { ReturnEntity } from './return.entity';
import { CarsEntity } from 'src/cars/entities/car.entity';

@Entity({ name: 'orders' })
export class OrdersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column({ type: 'int' })
  short_id: number;

  @ManyToOne(() => CarsEntity, (car) => car.orders)
  car: CarsEntity;

  @OneToMany(() => OrderItemsEntity, (item) => item.order, { cascade: true })
  order_items: OrderItemsEntity[];

  @Column({ type: 'decimal' })
  total_price_after: number;

  @Column({ type: 'decimal', default: '0' })
  tax: string;

  @Column({ type: 'decimal', default: 0 })
  discount: number;

  @Column({ type: 'decimal', nullable: true })
  additional_fees: number;

  @OneToOne(() => PaymentsEntity, (payment) => payment.order)
  @JoinColumn()
  payment: PaymentsEntity;

  @OneToOne(() => ReturnEntity, (ret) => ret.order, {
    cascade: true,
  })
  @JoinColumn()
  return: ReturnEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
