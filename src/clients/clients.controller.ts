import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { User } from 'src/decorators/user.decorator';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('clients')
@UseGuards(ReaderGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('create-client')
  @UseGuards(AdminGuard)
  async createClient(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { user_name, tax_num, balance }: CreateClientDto,
  ) {
    return await this.clientsService.create(
      tenant_id,
      user_name,
      tax_num,
      balance,
    );
  }

  @Get('find-one/:id')
  async findOne(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.clientsService.findOneById(tenant_id, id);
  }

  @Get()
  async findAll(
    @User() { tenant_id }: WorkerTokenInterface,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 1000,
  ) {
    return await this.clientsService.findAll(tenant_id, page, limit);
  }

  @Patch('update/:id')
  @UseGuards(AdminGuard)
  async updateClient(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return await this.clientsService.updateClient(
      tenant_id,
      id,
      updateClientDto,
    );
  }

  @Post('new-address')
  @UseGuards(AdminGuard)
  async createAddress(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return await this.clientsService.createAddress(tenant_id, createAddressDto);
  }

  @Patch('update-address/:addressId')
  @UseGuards(AdminGuard)
  async update(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return await this.clientsService.updateAddress(tenant_id, addressId, dto);
  }

  @Delete('delete-address/:addressId')
  @UseGuards(AdminGuard)
  async delete(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ) {
    return await this.clientsService.deleteAddress(tenant_id, addressId);
  }
}
