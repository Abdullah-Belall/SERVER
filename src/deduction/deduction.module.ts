import { Module } from '@nestjs/common';
import { DeductionService } from './deduction.service';
import { DeductionController } from './deduction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeductionEntity } from './entities/deduction.entity';
import { WorkersModule } from 'src/workers/workers.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeductionEntity]), WorkersModule],
  controllers: [DeductionController],
  providers: [DeductionService],
})
export class DeductionModule {}
