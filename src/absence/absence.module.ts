import { Module } from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { AbsenceController } from './absence.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbsenceEntity } from './entities/absence.entity';
import { WorkersModule } from 'src/workers/workers.module';

@Module({
  imports: [TypeOrmModule.forFeature([AbsenceEntity]), WorkersModule],
  controllers: [AbsenceController],
  providers: [AbsenceService],
})
export class AbsenceModule {}
