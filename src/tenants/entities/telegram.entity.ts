import { TenantsEntity } from 'src/tenants/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'telegram_bot' })
export class TelegramBotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column()
  chat_id: string;
  @ManyToOne(() => TenantsEntity, (tenant) => tenant.chat_ids)
  tenant: TenantsEntity;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
