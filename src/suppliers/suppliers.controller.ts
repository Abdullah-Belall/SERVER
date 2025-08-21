import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { ReaderGuard } from 'src/guards/reader.guard';
import { OwnerGuard } from 'src/guards/owner.guard';
import { PaySupplierDto } from './dto/pay-supplier.dto';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('suppliers')
@UseGuards(ReaderGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.suppliersService.findAll(tenant_id);
  }

  @Post()
  @UseGuards(AdminGuard)
  async CreateSupplier(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { user_name }: CreateSupplierDto,
  ) {
    return await this.suppliersService.create(tenant_id, user_name);
  }
  @Post(`pay`)
  @UseGuards(AdminGuard)
  async paySupplier(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() paySupplierDto: PaySupplierDto,
  ) {
    return await this.suppliersService.paySupplier(tenant_id, paySupplierDto);
  }
  @Get('bills/:cost_id')
  async getAllSuppliers(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('cost_id', new ParseUUIDPipe()) cost_id: string,
  ) {
    return await this.suppliersService.suppliersPaymentsBills(
      tenant_id,
      cost_id,
    );
  }
  @Get(':id')
  async findOne(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.suppliersService.findOneById(tenant_id, id);
  }
}
