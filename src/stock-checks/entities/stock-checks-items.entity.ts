import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockChecksEntity } from './stock-check.entity';
import { ProductSortsEntity } from 'src/products/entities/product-sort.entity';
import { EquipmentsEntity } from 'src/equipment/entities/equipment.entity';

@Entity('stock_checks_items')
export class StockChecksItemsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => StockChecksEntity, (stockCheck) => stockCheck.items)
  stock_check: StockChecksEntity;
  @ManyToOne(
    () => ProductSortsEntity,
    (productSort) => productSort.stock_checks_items,
  )
  sort: ProductSortsEntity;
  @ManyToOne(() => EquipmentsEntity, (eqp) => eqp.stock_checks_items)
  equipment: EquipmentsEntity;
  @Column({ type: 'int' })
  recorded_quantity: number;
  @Column({ type: 'int' })
  actual_quantity: number;
  @Column({ type: 'int' })
  difference: number;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
