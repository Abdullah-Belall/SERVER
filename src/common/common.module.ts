import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { ProductsModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';
import { CategoryModule } from 'src/category/category.module';
import { ClientsModule } from 'src/clients/clients.module';
import { WorkersModule } from 'src/workers/workers.module';
import { TenantsModule } from 'src/tenants/tenants.module';
import { EquipmentModule } from 'src/equipment/equipment.module';
import { ExpensesModule } from 'src/expenses/expenses.module';
import { SuppliersModule } from 'src/suppliers/suppliers.module';
import { CarsModule } from 'src/cars/cars.module';
import { PdfGeneratorModule } from 'src/pdf-generator/pdf-generator.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { AdvancesModule } from 'src/advances/advances.module';

@Module({
  imports: [
    ProductsModule,
    OrdersModule,
    ProductsModule,
    CategoryModule,
    ClientsModule,
    WorkersModule,
    TenantsModule,
    EquipmentModule,
    ExpensesModule,
    SuppliersModule,
    CarsModule,
    PdfGeneratorModule,
    TelegramModule,
    AdvancesModule,
  ],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
