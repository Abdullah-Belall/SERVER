import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmEntity } from './entities/crm.entity';
import { CarsModule } from 'src/cars/cars.module';
import { CrmDatesEntity } from './entities/crm-dates.entity';
import { CrmDatesService } from './crm-dates.service';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmEntity, CrmDatesEntity]),
    CarsModule,
    TelegramModule,
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmDatesService],
  exports: [CrmService],
})
export class CrmModule {}
