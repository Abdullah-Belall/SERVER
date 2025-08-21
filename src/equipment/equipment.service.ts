import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentsEntity } from './entities/equipment.entity';
import { Between, Brackets, Repository } from 'typeorm';
import { ErrorMsg } from 'src/utils/base';
import * as dayjs from 'dayjs';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(EquipmentsEntity)
    private readonly equipmentsRepo: Repository<EquipmentsEntity>,
  ) {}
  async saveEquipment(equipment: EquipmentsEntity) {
    let saved;
    try {
      saved = await this.equipmentsRepo.save(equipment);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async findOneEquipment(tenant_id: string, id: string) {
    const equipment = await this.equipmentsRepo.findOne({
      where: { id, tenant_id },
    });
    if (!equipment) {
      throw new NotFoundException('لا يوجد معدة بهذا المعرف.');
    }
    return equipment;
  }
  async AddEquipment(
    tenant_id: string,
    createEquipmentDto: CreateEquipmentDto,
  ) {
    await this.saveEquipment(
      this.equipmentsRepo.create({ ...createEquipmentDto, tenant_id }),
    );
    return {
      done: true,
    };
  }
  async UpdateEquipment(
    tenant_id: string,
    id: string,
    updateEquipmentDto: UpdateEquipmentDto,
  ) {
    const equipment = await this.findOneEquipment(tenant_id, id);
    Object.assign(equipment, updateEquipmentDto);
    await this.saveEquipment(equipment);
    return {
      done: true,
    };
  }
  async findAllEquipments(tenant_id: string) {
    const [equipments, total] = await this.equipmentsRepo.findAndCount({
      where: { tenant_id },
      order: { created_at: 'DESC' },
    });
    return {
      equipments,
      total,
    };
  }
  // ===============
  async getTodayEquiments(tenant_id: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const [equipments, total] = await this.equipmentsRepo.findAndCount({
      where: {
        tenant_id,
        created_at: Between(startOfDay, endOfDay),
      },
      order: { created_at: 'DESC' },
    });

    return {
      equipments,
      total,
    };
  }
  async searchEngine(
    tenant_id: string,
    searchin: 'equipments',
    searchwith: string,
  ) {
    if (searchin === 'equipments') {
      const query = this.equipmentsRepo
        .createQueryBuilder('eqp')
        .where('eqp.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('eqp.name ILIKE :termStart', {
              termStart: `${searchwith.toLowerCase()}%`,
            }).orWhere('eqp.name ILIKE :termEnd', {
              termEnd: `%${searchwith.toLowerCase()}`,
            });
          }),
        );
      const [results, total] = await query
        .orderBy('eqp.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}
