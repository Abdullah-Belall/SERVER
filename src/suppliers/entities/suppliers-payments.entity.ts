import { CostsEntity } from 'src/products/entities/good-costs.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'suppliers_payments' })
export class SuppliersPaymentsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => CostsEntity, (cost) => cost.pay_bills)
  cost: CostsEntity;
  @Column({ type: 'int' })
  amount: number;
  @Column({ nullable: true })
  note: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
