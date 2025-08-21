import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ExpensesEntity } from './entities/expense.entity';
import { Between, Brackets, Repository } from 'typeorm';
import { ErrorMsg } from 'src/utils/base';
import * as dayjs from 'dayjs';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpensesEntity)
    private readonly expensesRepo: Repository<ExpensesEntity>,
  ) {}

  async create(tenant_id: string, createExpenseDto: CreateExpenseDto) {
    const expense = this.expensesRepo.create({
      ...createExpenseDto,
      tenant_id,
    });
    try {
      await this.expensesRepo.save(expense);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم إضافة المصروف بنجاح.',
    };
  }
  // data
  // {
  //   worker_id, // achtly it's not id, it's name
  //   salary,
  // }[]
  async payingSalaries(tenant_id: string, data: any) {
    const parseData = JSON.parse(data);

    const expenses = parseData.map((e: { worker_id: string; salary: string }) =>
      this.expensesRepo.create({
        tenant_id,
        name: `راتب ${e.worker_id}`,
        amount: Number(e.salary),
      }),
    );

    try {
      await this.expensesRepo.save(expenses);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'تم تسجيل رواتب الموظفين بنجاح.',
    };
  }

  async update(
    tenant_id: string,
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ) {
    const expense = await this.expensesRepo.findOne({
      where: { id, tenant_id },
    });
    if (!expense) {
      throw new NotFoundException(`لا يوجد مصروف بهذا المعرف ${id}`);
    }
    try {
      await this.expensesRepo.save({ id, ...updateExpenseDto });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث المصروف بنجاح.',
    };
  }

  async remove(tenant_id: string, id: string) {
    const expense = await this.expensesRepo.findOne({
      where: { id, tenant_id },
    });
    if (!expense) {
      throw new NotFoundException(`لا يوجد مصروف بهذا المعرف ${id}`);
    }
    try {
      await this.expensesRepo.delete(id);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم حذف المصروف بنجاح.',
    };
  }

  async findAll(tenant_id: string) {
    const expenses = await this.expensesRepo.findAndCount({
      where: { tenant_id },
      order: { created_at: 'DESC' },
    });

    return {
      expenses: expenses[0],
      total: expenses[1],
    };
  }
  // ===============
  async getTodayExpenses(tenant_id: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const [expenses, total] = await this.expensesRepo.findAndCount({
      where: {
        tenant_id,
        created_at: Between(startOfDay, endOfDay),
      },
      order: { created_at: 'DESC' },
    });
    return {
      expenses,
      total,
    };
  }

  async searchEngine(
    tenant_id: string,
    searchin: 'expenses',
    searchwith: string,
  ) {
    if (searchin === 'expenses') {
      const query = this.expensesRepo
        .createQueryBuilder('exp')
        .where('exp.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('exp.name ILIKE :termStart', {
              termStart: `${searchwith.toLowerCase()}%`,
            }).orWhere('exp.name ILIKE :termEnd', {
              termEnd: `%${searchwith.toLowerCase()}`,
            });
          }),
        );
      const [results, total] = await query
        .orderBy('exp.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}
