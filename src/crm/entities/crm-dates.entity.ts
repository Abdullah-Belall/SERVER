import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CrmEntity } from './crm.entity';

@Entity({ name: 'crm_dates' })
export class CrmDatesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => CrmEntity, (crm) => crm.crm_dates)
  crm: CrmEntity;
  @Column({ type: 'varchar' })
  note: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
