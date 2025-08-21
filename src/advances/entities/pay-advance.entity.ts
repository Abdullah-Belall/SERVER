import { CostsEntity } from 'src/products/entities/good-costs.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdvanceEntity } from './advance.entity';

@Entity({ name: 'pay_advance' })
export class PayAdvanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => AdvanceEntity, (adv) => adv.pay_bills)
  advance: AdvanceEntity;
  @Column({ type: 'int' })
  amount: number;
  @Column({ nullable: true })
  note: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
