import { forwardRef, Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersEntity } from './entities/supplier.entity';
import { SuppliersPaymentsEntity } from './entities/suppliers-payments.entity';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuppliersEntity, SuppliersPaymentsEntity]),
    forwardRef(() => ProductsModule),
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
