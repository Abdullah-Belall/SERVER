import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { UpdateDeductionDto } from './dto/update-deduction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeductionEntity } from './entities/deduction.entity';
import { Repository } from 'typeorm';
import { WorkersService } from 'src/workers/workers.service';
import { ErrorMsg } from 'src/utils/base';

@Injectable()
export class DeductionService {
  constructor(
    @InjectRepository(DeductionEntity)
    private readonly deductionRepo: Repository<DeductionEntity>,
    private readonly workersService: WorkersService,
  ) {}
  async saveDeduction(deduction: DeductionEntity) {
    let saved;
    try {
      saved = await this.deductionRepo.save(deduction);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async findOneDeduction(tenant_id: string, id: string) {
    const deduction = await this.deductionRepo.findOne({
      where: { tenant_id, id },
    });
    if (!deduction) throw new NotFoundException('لا يوجد خصم بهذا المعرف.');
    return deduction;
  }
  async createDeduction(
    tenant_id: string,
    worker_id: string,
    createDeductionDto: CreateDeductionDto,
  ) {
    const worker = await this.workersService.findOneWorker(
      worker_id,
      tenant_id,
    );
    await this.saveDeduction(
      this.deductionRepo.create({ ...createDeductionDto, tenant_id, worker }),
    );
    return {
      done: true,
    };
  }
  async updateDeduction(
    tenant_id: string,
    id: string,
    updateDeductionDto: UpdateDeductionDto,
  ) {
    const deduction = await this.findOneDeduction(tenant_id, id);
    Object.assign(deduction, updateDeductionDto);
    await this.saveDeduction(deduction);
    return {
      done: true,
    };
  }
}
