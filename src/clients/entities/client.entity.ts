import { ContactsEntity } from 'src/contacts/entities/contacts.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ShippingAddressesEntity } from './shipping-addresses.entity';
import { CarsEntity } from 'src/cars/entities/car.entity';

@Entity({ name: 'clients' })
export class ClientsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column()
  user_name: string;

  @Column({ nullable: true })
  tax_num: string;

  @Column({ type: 'decimal', default: 0 })
  balance: number;

  @OneToMany(() => ContactsEntity, (contact) => contact.client, {
    cascade: true,
  })
  contacts: ContactsEntity[];

  @OneToMany(() => ShippingAddressesEntity, (address) => address.client, {
    cascade: true,
  })
  shipping_addresses: ShippingAddressesEntity[];

  @OneToMany(() => CarsEntity, (car) => car.client, { cascade: true })
  cars: CarsEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
