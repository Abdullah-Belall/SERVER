import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { StockChecksService } from './stock-checks.service';
import { CreateStockCheckDto } from './dto/create-stock-check.dto';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { AdminGuard } from 'src/guards/admin.guard';
import { ReaderGuard } from 'src/guards/reader.guard';

@Controller('stock-checks')
@UseGuards(ReaderGuard)
export class StockChecksController {
  constructor(private readonly stockChecksService: StockChecksService) {}

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createStockCheckDto: CreateStockCheckDto,
  ) {
    return await this.stockChecksService.create(tenant_id, createStockCheckDto);
  }

  @Get()
  async findAll(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.stockChecksService.findAll(tenant_id);
  }

  @Get(':id')
  async findOne(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id') id: string,
  ) {
    return await this.stockChecksService.findOne(tenant_id, id);
  }
}
