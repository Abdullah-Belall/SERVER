import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { ReaderGuard } from 'src/guards/reader.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { OwnerGuard } from 'src/guards/owner.guard';
import { PaySalariesDto } from './dto/pay-salaries.dto';

@Controller('expenses')
@UseGuards(ReaderGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return await this.expensesService.create(tenant_id, createExpenseDto);
  }
  @Post('paying-salaries')
  @UseGuards(OwnerGuard)
  async payingSalaries(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { data }: PaySalariesDto,
  ) {
    return await this.expensesService.payingSalaries(tenant_id, data);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return await this.expensesService.update(tenant_id, id, updateExpenseDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id') id: string,
  ) {
    return await this.expensesService.remove(tenant_id, id);
  }

  @Get()
  async findAll(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.expensesService.findAll(tenant_id);
  }
}
