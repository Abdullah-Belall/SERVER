import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentsEntity } from './entities/equipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentsEntity])],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
