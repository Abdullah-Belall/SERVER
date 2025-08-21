import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsEntity } from './entities/tenant.entity';
import { CrmModule } from 'src/crm/crm.module';
import { TelegramBotEntity } from './entities/telegram.entity';
import { ChatIdService } from './chat-ids.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantsEntity, TelegramBotEntity]),
    CrmModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, ChatIdService],
  exports: [TenantsService],
})
export class TenantsModule {}
