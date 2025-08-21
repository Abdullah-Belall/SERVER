import { PeriodsEnum } from 'src/types/enums/product.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TelegramBotEntity } from './telegram.entity';
@Entity({ name: 'tenants' })
export class TenantsEntity {
  @PrimaryGeneratedColumn('uuid')
  tenant_id: string;
  @Column({ unique: true })
  domain: string;
  @Column()
  company_title: string;
  @Column()
  company_logo: string;
  @Column({ nullable: true, type: 'int' })
  balance: number;
  @Column({ nullable: true, type: 'enum', enum: PeriodsEnum })
  period: PeriodsEnum;
  @OneToMany(() => TelegramBotEntity, (telegram) => telegram.tenant)
  chat_ids: TelegramBotEntity[];
  @Column({ nullable: true })
  bill_path: string;
  @Column({ nullable: true })
  //* myLight,mdDark,myHover,myDark
  theme: string;
  @Column({ nullable: true })
  phone: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
