import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkersEntity } from './entities/worker.entity';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkersEntity]), TenantsModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
