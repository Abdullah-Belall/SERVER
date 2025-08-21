import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrdersEntity } from './order.entity';
import { ReturnsItemsEntity } from './returns-items.entity';

@Entity({ name: 'return' })
export class ReturnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column({ type: 'int' })
  short_id: number;
  @OneToOne(() => OrdersEntity, (order) => order.return)
  order: OrdersEntity;
  @OneToMany(() => ReturnsItemsEntity, (ret) => ret.return)
  returns_items: ReturnsItemsEntity[];
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
