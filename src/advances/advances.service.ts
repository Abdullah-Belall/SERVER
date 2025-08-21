import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AdvanceEntity } from './entities/advance.entity';
import { Between, Repository } from 'typeorm';
import { WorkersService } from 'src/workers/workers.service';
import { ErrorMsg } from 'src/utils/base';
import { PayAdvanceEntity } from './entities/pay-advance.entity';
import { CreatePayAdvanceDto } from './dto/create-pay-advance.dto';
import { UpdatePayAdvanceDto } from './dto/update-pay-advance.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class AdvancesService {
  constructor(
    @InjectRepository(AdvanceEntity)
    private readonly advanceRepo: Repository<AdvanceEntity>,
    @InjectRepository(PayAdvanceEntity)
    private readonly payAdvanceRepo: Repository<PayAdvanceEntity>,
    private readonly workersService: WorkersService,
  ) {}

  async createAdvance(
    tenant_id: string,
    worker_id: string,
    createAdvanceDto: CreateAdvanceDto,
  ) {
    const worker = await this.workersService.findOneWorker(
      worker_id,
      tenant_id,
    );
    await this.saveAdvance(
      this.advanceRepo.create({ ...createAdvanceDto, tenant_id, worker }),
    );
    return {
      done: true,
    };
  }
  async updateAdvance(
    tenant_id: string,
    id: string,
    updateAdvanceDto: UpdateAdvanceDto,
  ) {
    const advance = await this.findOneAdvance(tenant_id, id);
    Object.assign(advance, updateAdvanceDto);
    await this.saveAdvance(advance);
    return {
      done: true,
    };
  }
  async saveAdvance(advance: AdvanceEntity) {
    let saved;
    try {
      saved = await this.advanceRepo.save(advance);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async findOneAdvance(tenant_id: string, id: string, pay_bills?: boolean) {
    const advance = await this.advanceRepo.findOne({
      where: { tenant_id, id },
      relations: pay_bills ? ['pay_bills'] : [],
    });
    if (!advance) {
      throw new NotFoundException('لا يوجد سلفة بهذا المعرف.');
    }
    return advance;
  }
  //*==============
  async savePayAdvance(payAdvance: PayAdvanceEntity) {
    let saved;
    try {
      saved = await this.payAdvanceRepo.save(payAdvance);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async findOnePayAdvance(tenant_id: string, id: string) {
    const payAdvance = await this.payAdvanceRepo.findOne({
      where: { tenant_id, id },
    });
    if (!payAdvance) {
      throw new NotFoundException('لا يوجد فاتورة تسديد بهذا المعرف.');
    }
    return payAdvance;
  }
  async payAdvance(
    tenant_id: string,
    advance_id: string,
    createPayAdvanceDto: CreatePayAdvanceDto,
  ) {
    const advance = await this.findOneAdvance(tenant_id, advance_id, true);
    await this.savePayAdvance(
      this.payAdvanceRepo.create({
        ...createPayAdvanceDto,
        tenant_id,
        advance,
      }),
    );
    const paid =
      advance.pay_bills.reduce((acc, curr) => acc + Number(curr.amount), 0) +
      Number(createPayAdvanceDto.amount);
    const due = Number(advance.amount) - paid;
    if (Math.floor(due) === 0) {
      advance.is_paid = true;
      await this.saveAdvance(advance);
    }
    return {
      done: true,
    };
  }
  async editPayAdvance(
    tenant_id: string,
    pay_advance_id: string,
    updatePayAdvanceDto: UpdatePayAdvanceDto,
  ) {
    const payAdvance = await this.findOnePayAdvance(tenant_id, pay_advance_id);
    Object.assign(payAdvance, updatePayAdvanceDto);
    await this.savePayAdvance(payAdvance);
    return {
      done: true,
    };
  }
  async getTodayAdvances(tenant_id: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const [advances, total] = await this.advanceRepo.findAndCount({
      where: {
        tenant_id,
        created_at: Between(startOfDay, endOfDay),
      },
      relations: ['worker'],
      select: {
        worker: {
          id: true,
          user_name: true,
        },
      },
      order: { created_at: 'DESC' },
    });
    return {
      advances,
      total,
    };
  }
}
