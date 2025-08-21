import { Module } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { AdvancesController } from './advances.controller';
import { AdvanceEntity } from './entities/advance.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkersModule } from 'src/workers/workers.module';
import { PayAdvanceEntity } from './entities/pay-advance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvanceEntity, PayAdvanceEntity]),
    WorkersModule,
  ],
  controllers: [AdvancesController],
  providers: [AdvancesService],
  exports: [AdvancesService],
})
export class AdvancesModule {}
