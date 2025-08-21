import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AbsenceEntity } from './entities/absence.entity';
import { Repository } from 'typeorm';
import { WorkersService } from 'src/workers/workers.service';
import { ErrorMsg } from 'src/utils/base';

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(AbsenceEntity)
    private readonly absenceRepo: Repository<AbsenceEntity>,
    private readonly workersService: WorkersService,
  ) {}

  async createAbsence(
    tenant_id: string,
    worker_id: string,
    { reason }: CreateAbsenceDto,
  ) {
    const worker = await this.workersService.findOneWorker(
      worker_id,
      tenant_id,
    );
    await this.saveAbsence(
      this.absenceRepo.create({
        worker,
        tenant_id,
        reason,
      }),
    );
    return {
      done: true,
    };
  }
  async updateAbsence(
    tenant_id: string,
    id: string,
    updateAbsenceDto: UpdateAbsenceDto,
  ) {
    const absence = await this.findOneAbsence(tenant_id, id);
    Object.assign(absence, updateAbsenceDto);
    await this.saveAbsence(absence);
    return {
      done: true,
    };
  }
  async deleteAbsence(tenant_id: string, id: string) {
    const absence = await this.findOneAbsence(tenant_id, id);
    try {
      await this.absenceRepo.delete(absence.id);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
    };
  }

  // =================
  async saveAbsence(absence: AbsenceEntity) {
    let saved;
    try {
      saved = await this.absenceRepo.save(absence);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async findOneAbsence(tenant_id: string, id: string) {
    const absence = await this.absenceRepo.findOne({
      where: {
        tenant_id,
        id,
      },
    });
    if (!absence) throw new NotFoundException('لا يوجد غياب مسجل بهذا المعرف.');
    return absence;
  }
}
