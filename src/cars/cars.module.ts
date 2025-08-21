import { Module } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarsEntity } from './entities/car.entity';
import { ClientsModule } from 'src/clients/clients.module';

@Module({
  imports: [TypeOrmModule.forFeature([CarsEntity]), ClientsModule],
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
