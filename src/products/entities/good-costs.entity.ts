import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductSortsEntity } from './product-sort.entity';
import { SuppliersEntity } from 'src/suppliers/entities/supplier.entity';
import { SuppliersPaymentsEntity } from 'src/suppliers/entities/suppliers-payments.entity';

@Entity({ name: 'good_costs' })
export class CostsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column({ type: 'int' })
  short_id: number;
  @Column({ type: 'int' })
  qty: number;
  @Column({ type: 'decimal' })
  price: number;
  @ManyToOne(() => ProductSortsEntity, (sort) => sort.costs)
  sort: ProductSortsEntity;
  @ManyToOne(() => SuppliersEntity, (cost) => cost.bills)
  supplier: SuppliersEntity;
  @OneToMany(() => SuppliersPaymentsEntity, (sp) => sp.cost)
  pay_bills: SuppliersPaymentsEntity[];
  @Column({ type: 'boolean', default: false })
  is_paid: boolean;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
