import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { BossGuard } from 'src/guards/boss.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { OwnerGuard } from 'src/guards/owner.guard';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { ChatIdService } from './chat-ids.service';
import { CreateTelegramChatIdDto } from './dto/create-chat-id.dto';

@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly chatIdService: ChatIdService,
  ) {}
  @Post()
  @UseGuards(BossGuard)
  async createNewTenant(@Body() createTenantDto: CreateTenantDto) {
    return await this.tenantsService.createNewTenant(createTenantDto);
  }
  @Get()
  @UseGuards(BossGuard)
  async getAllTenants() {
    return await this.tenantsService.getAllTenants();
  }
  @Patch('balance')
  @UseGuards(OwnerGuard)
  async updateBalance(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { balance, period }: UpdateBalanceDto,
  ) {
    return await this.tenantsService.updateBalance(tenant_id, balance, period);
  }
  @Patch(':id')
  @UseGuards(BossGuard)
  async updateTenant(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return await this.tenantsService.updateTenant(id, updateTenantDto);
  }
  @Post('chat-id')
  async addTelegramChatId(
    @Body() createTelegramChatIdDto: CreateTelegramChatIdDto,
  ) {
    return await this.chatIdService.addChatId(createTelegramChatIdDto);
  }
  @Patch('chat-id/:id')
  async editTelegramChatId(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createTelegramChatIdDto: CreateTelegramChatIdDto,
  ) {
    return await this.chatIdService.editChatId(id, createTelegramChatIdDto);
  }
  @Get(':tenant_id/chat-ids')
  async findChatIds(@Param('id', new ParseUUIDPipe()) tenant_id: string) {
    return await this.chatIdService.findChatIds(tenant_id);
  }
}
