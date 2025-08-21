import { CarsEntity } from 'src/cars/entities/car.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CrmDatesEntity } from './crm-dates.entity';

@Entity({ name: 'crm' })
export class CrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @ManyToOne(() => CarsEntity, (car) => car.crm)
  car: CarsEntity;
  @OneToMany(() => CrmDatesEntity, (crm_dates) => crm_dates.crm)
  crm_dates: CrmDatesEntity[];
  @Column()
  name: string;
  @Column({ type: 'timestamptz' })
  next_call_date: Date;
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
