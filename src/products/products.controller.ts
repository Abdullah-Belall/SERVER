import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateSortDto } from './dto/create-sort.dto';
import { UpdateSortDto } from './dto/update-sorts.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('products')
@UseGuards(ReaderGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Post()
  @UseGuards(AdminGuard)
  async create(
    @Body() createProductDto: CreateProductDto,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.productsService.create(tenant_id, createProductDto);
  }
  @Get()
  async findAll(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.productsService.findAll(tenant_id);
  }
  @Get('cost/:id')
  async findOneCost(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.productsService.findOneCost(tenant_id, id);
  }
  @Get('sorts')
  async findAllSorts(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.productsService.findAllSorts(tenant_id);
  }
  @Post(':id/sorts')
  @UseGuards(AdminGuard)
  async createSort(
    @Param('id', new ParseUUIDPipe()) productId: string,
    @Body() createSortDto: CreateSortDto,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.productsService.createSort(
      tenant_id,
      productId,
      createSortDto,
    );
  }

  @Patch('sorts/:id')
  @UseGuards(AdminGuard)
  async updateSort(
    @Param('id', new ParseUUIDPipe()) sortId: string,
    @Body() updateSortDto: UpdateSortDto,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.productsService.updateSort(
      tenant_id,
      sortId,
      updateSortDto,
    );
  }

  @Get('/costs')
  async findAllCosts(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.productsService.findAllCosts(tenant_id);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.productsService.findOne(id, tenant_id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.productsService.update(tenant_id, id, updateProductDto);
  }
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.productsService.deleteProduct(tenant_id, id);
  }
}
