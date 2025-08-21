import { ProductsEntity } from 'src/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'categories' })
export class CategoriesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'uuid' })
  tenant_id: string;
  @Column()
  name: string;

  @Column({ nullable: true })
  desc: string;

  @OneToMany(() => ProductsEntity, (product) => product.category, {
    cascade: true,
  })
  products: ProductsEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
