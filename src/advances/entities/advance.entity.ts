import { WorkersEntity } from 'src/workers/entities/worker.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PayAdvanceEntity } from './pay-advance.entity';

@Entity({ name: 'advances' })
export class AdvanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => WorkersEntity, (worker) => worker.advances)
  worker: WorkersEntity;
  @OneToMany(() => PayAdvanceEntity, (pay) => pay.advance)
  pay_bills: PayAdvanceEntity[];
  @Column({ type: 'decimal' })
  amount: number;
  @Column({ nullable: true })
  note: string;
  @Column({ type: 'boolean', default: false })
  is_paid: boolean;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
