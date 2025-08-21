import {
  InstallmentTypeEnum,
  PaidStatusEnum,
  PaymentMethodsEnum,
} from 'src/types/enums/product.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrdersEntity } from './order.entity';
import { InstallmentsEntity } from './intallments.entity';

@Entity({ name: 'payments' })
export class PaymentsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @OneToOne(() => OrdersEntity, (order) => order.payment)
  order: OrdersEntity;

  @Column({ type: 'enum', enum: PaymentMethodsEnum })
  payment_method: PaymentMethodsEnum;

  @Column({ type: 'enum', enum: PaidStatusEnum })
  status: PaidStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at: Date;

  @Column({ type: 'decimal', nullable: true })
  client_balance: number;

  @Column({ type: 'enum', enum: InstallmentTypeEnum, nullable: true })
  installment_type: InstallmentTypeEnum;

  @Column({ type: 'decimal', nullable: true })
  down_payment: number;

  @Column({ type: 'decimal', nullable: true })
  installment: number;

  @Column({ type: 'int', nullable: true })
  paid_installments_count: number;

  @Column({ type: 'timestamp', nullable: true })
  next_payment_date: Date;

  @OneToMany(() => InstallmentsEntity, (installment) => installment.payment)
  installments: InstallmentsEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
