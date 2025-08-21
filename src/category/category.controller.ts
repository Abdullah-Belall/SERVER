import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { User } from 'src/decorators/user.decorator';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('category')
@UseGuards(ReaderGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return await this.categoryService.create(tenant_id, createCategoryDto);
  }

  @Get()
  async findAll(
    @User() { tenant_id }: WorkerTokenInterface,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.categoryService.findAll(tenant_id, page, limit);
  }

  @Get(':id')
  async findOne(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.categoryService.findOne(tenant_id, id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return await this.categoryService.update(tenant_id, id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.categoryService.delete(tenant_id, id);
  }
}
