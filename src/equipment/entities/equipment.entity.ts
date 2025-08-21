import { StockChecksItemsEntity } from 'src/stock-checks/entities/stock-checks-items.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'equipments' })
export class EquipmentsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column()
  name: string;
  @Column({ type: 'int' })
  qty: number;
  @Column({ type: 'decimal' })
  unit_price: number;
  @OneToMany(() => StockChecksItemsEntity, (stChks) => stChks.equipment, {
    cascade: true,
  })
  stock_checks_items: StockChecksItemsEntity[];
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
