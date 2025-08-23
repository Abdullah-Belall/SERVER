import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { WorkersModule } from './workers/workers.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from './clients/clients.module';
import { CategoryModule } from './category/category.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { CommonModule } from './common/common.module';
import { TenantsModule } from './tenants/tenants.module';
import { TelegramModule } from './telegram/telegram.module';
import { ExpensesModule } from './expenses/expenses.module';
import { StockChecksModule } from './stock-checks/stock-checks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CarsModule } from './cars/cars.module';
import { EquipmentModule } from './equipment/equipment.module';
import { AdvancesModule } from './advances/advances.module';
import { DeductionModule } from './deduction/deduction.module';
import { AbsenceModule } from './absence/absence.module';
import { CrmModule } from './crm/crm.module';
import { PdfGeneratorModule } from './pdf-generator/pdf-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        migrations: [__dirname + '/migrations/*.{js,ts}'],
        autoLoadEntities: true,
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
      inject: [ConfigService],
    }),
    WorkersModule,
    ContactsModule,
    ClientsModule,
    CategoryModule,
    OrdersModule,
    ProductsModule,
    CommonModule,
    TenantsModule,
    TelegramModule,
    ExpensesModule,
    StockChecksModule,
    SuppliersModule,
    CarsModule,
    EquipmentModule,
    AdvancesModule,
    DeductionModule,
    AbsenceModule,
    CrmModule,
    PdfGeneratorModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
