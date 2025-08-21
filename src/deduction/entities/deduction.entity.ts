import { DeductionStatusEnum } from 'src/types/enums/user.enum';
import { WorkersEntity } from 'src/workers/entities/worker.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'deduction' })
export class DeductionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => WorkersEntity, (dedu) => dedu.deductions)
  worker: WorkersEntity;
  @Column({ type: 'decimal' })
  amount: number;
  @Column({
    type: 'enum',
    enum: DeductionStatusEnum,
    default: DeductionStatusEnum.PENDING,
  })
  status: DeductionStatusEnum;
  @Column({ nullable: true })
  note: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
