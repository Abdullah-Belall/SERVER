import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CrmEntity } from './entities/crm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmDatesEntity } from './entities/crm-dates.entity';
import { CrmService } from './crm.service';
import { CreateCrmDateDto } from './dto/crm-date/create-crm-date.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class CrmDatesService {
  constructor(
    @InjectRepository(CrmDatesEntity)
    private readonly crmDatesRepo: Repository<CrmDatesEntity>,
    private readonly crmService: CrmService,
  ) {}
  async createCrmDate(
    tenant_id: string,
    crmId: string,
    { note }: CreateCrmDateDto,
  ) {
    const crm = await this.crmService.findCrmById(tenant_id, crmId);
    const currentDate = dayjs();
    const timeDifference = dayjs(crm.next_call_date).diff(
      dayjs(crm.created_at),
    );
    const newNextCallDate = currentDate
      .add(timeDifference, 'millisecond')
      .toDate();
    crm.next_call_date = newNextCallDate;
    await this.crmService.saveCrm(crm);
    const newCrmDate = this.crmDatesRepo.create({
      tenant_id,
      crm,
      note,
    });
    await this.saveCrmDate(newCrmDate);
    return {
      done: true,
    };
  }
  async findCrmDatesByCrmId(tenant_id: string, crmId: string) {
    const [crm_dates, total] = await this.crmDatesRepo.findAndCount({
      where: {
        crm: { id: crmId, tenant_id },
      },
    });
    return {
      crm_dates,
      total,
    };
  }
  async deleteCrmDate(tenant_id: string, crmDateId: string) {
    const crmDate = await this.findCrmDateById(tenant_id, crmDateId);
    try {
      await this.crmDatesRepo.delete(crmDate.id);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error);
    }
    return {
      done: true,
    };
  }
  //* ------------
  async saveCrmDate(crmDate: CrmDatesEntity) {
    let saved;
    try {
      saved = await this.crmDatesRepo.save(crmDate);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error);
    }
    return saved;
  }
  async findCrmDateById(tenant_id: string, crmDateId: string) {
    const crmDate = await this.crmDatesRepo.findOne({
      where: {
        id: crmDateId,
        tenant_id,
      },
    });
    if (!crmDate) {
      throw new NotFoundException('هذا التاريخ غير موجود.');
    }
    return crmDate;
  }
}
