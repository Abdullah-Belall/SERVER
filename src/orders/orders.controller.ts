import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { ReturnDto } from './dto/return.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { User } from 'src/decorators/user.decorator';
import { AdminGuard } from 'src/guards/admin.guard';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { CreateOrderNoSortDto } from './dto/create-order-nosort.dto';
import { OrdersCollectorDto } from './dto/orders-collector.dto';
@Controller('orders')
@UseGuards(ReaderGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post()
  @UseGuards(AdminGuard)
  async createOrder(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return await this.ordersService.createOrder(tenant_id, createOrderDto);
  }

  @Get()
  async findAll(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.ordersService.getAllOrders(tenant_id);
  }
  @Get('installments/:id')
  async findOrderInstallments(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.ordersService.findOrderInstallments(tenant_id, id);
  }
  @Patch(':id')
  @UseGuards(AdminGuard)
  async updateOrder(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return await this.ordersService.updateOrder(tenant_id, id, updateOrderDto);
  }
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteOrder(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.ordersService.deleteOrder(tenant_id, id);
  }
  @Post('installments/:orderId')
  @UseGuards(AdminGuard)
  async payInstallment(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() { installment }: PayInstallmentDto,
  ) {
    return await this.ordersService.payInstallment(
      tenant_id,
      orderId,
      installment,
    );
  }
  @Post('returns/:orderId')
  @UseGuards(AdminGuard)
  async makeReturn(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
    @Body() { returns }: ReturnDto,
  ) {
    return await this.ordersService.makeReturn(tenant_id, orderId, returns);
  }
  @Get('returns')
  async findAllReturns(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.ordersService.getAllReturn(tenant_id);
  }
  @Get('returns/:id')
  async findOrderReturns(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.ordersService.getAllReturn(
      tenant_id,
      undefined,
      undefined,
      id,
    );
  }
  @Get('returns/returns-items/:id')
  async findReturnsItems(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.ordersService.findReturnsItems(tenant_id, id);
  }
  @Get('graphData')
  async getGraphData(
    @User() { tenant_id }: WorkerTokenInterface,
    @Query('type') type: 'years' | 'months' | 'days',
  ) {
    return await this.ordersService.handleGraphData(tenant_id, type);
  }

  @Get('car/:carId')
  async getCarOrders(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('carId', new ParseUUIDPipe()) carId: string,
  ) {
    return await this.ordersService.getCarOrders(tenant_id, carId);
  }
  @Post('no-sorts')
  @UseGuards(AdminGuard)
  async createOrderNoSorts(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createOrderNoSortDto: CreateOrderNoSortDto,
  ) {
    return await this.ordersService.createOrderNoSorts(
      tenant_id,
      createOrderNoSortDto,
    );
  }
  @Post('collector')
  @UseGuards(AdminGuard)
  async ordersCollector(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { ids }: OrdersCollectorDto,
  ) {
    const parseIds = JSON.parse(ids);
    return await this.ordersService.ordersCollector(tenant_id, parseIds);
  }
  // @Get('fix-duplicate-short-ids')
  // // @UseGuards(BossGuard)
  // async fixDuplicateShortIds() {
  //   return await this.ordersService.fixAllDuplicateShortIds();
  // }
  @Get(':id')
  async findOne(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.ordersService.findOne(id, tenant_id);
  }
}
