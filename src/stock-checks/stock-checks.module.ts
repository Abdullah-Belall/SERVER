import { Module } from '@nestjs/common';
import { StockChecksService } from './stock-checks.service';
import { StockChecksController } from './stock-checks.controller';
import { ProductsModule } from 'src/products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockChecksEntity } from './entities/stock-check.entity';
import { StockChecksItemsEntity } from './entities/stock-checks-items.entity';
import { EquipmentModule } from 'src/equipment/equipment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockChecksEntity, StockChecksItemsEntity]),
    ProductsModule,
    EquipmentModule,
  ],
  controllers: [StockChecksController],
  providers: [StockChecksService],
})
export class StockChecksModule {}
