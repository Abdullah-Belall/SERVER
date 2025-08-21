import { ClientsEntity } from 'src/clients/entities/client.entity';
import { CrmEntity } from 'src/crm/entities/crm.entity';
import { OrdersEntity } from 'src/orders/entities/order.entity';
import { CarType } from 'src/types/enums/product.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'cars' })
export class CarsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => ClientsEntity, (client) => client.cars)
  client: ClientsEntity;
  @OneToMany(() => OrdersEntity, (order) => order.car, { cascade: true })
  orders: OrdersEntity[];
  @OneToMany(() => CrmEntity, (crm) => crm.car, { cascade: true })
  crm: CrmEntity[];
  @Column()
  mark: string;
  @Column({ type: 'enum', enum: CarType, nullable: true })
  type: CarType;
  @Column({ nullable: true })
  plate: string;
  @Column({ nullable: true })
  chassis: string;
  @Column({ nullable: true })
  color: string;
  @Column({ nullable: true })
  model: number;
  @Column({ nullable: true })
  category: number;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
