import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockChecksItemsEntity } from './stock-checks-items.entity';

@Entity('stock_checks')
export class StockChecksEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column()
  type: 'equipments' | 'sorts';
  @OneToMany(() => StockChecksItemsEntity, (item) => item.stock_check, {
    cascade: true,
  })
  items: StockChecksItemsEntity[];
  @Column({ nullable: true })
  note: string;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
