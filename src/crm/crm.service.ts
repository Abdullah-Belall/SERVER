import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCrmDto } from './dto/crm/update-crm.dto';
import { CrmEntity } from './entities/crm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarsService } from 'src/cars/cars.service';
import { CreateCrmDto } from './dto/crm/create-crm.dto';
import * as dayjs from 'dayjs';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CrmEntity)
    private readonly crmRepo: Repository<CrmEntity>,
    private readonly carsService: CarsService,
    private readonly telegramService: TelegramService,
  ) {}
  async findCrmByCarId(tenant_id: string, carId: string) {
    const [crm, total] = await this.crmRepo.findAndCount({
      where: {
        tenant_id,
        car: {
          id: carId,
          tenant_id,
        },
      },
    });
    return {
      crm,
      total,
    };
  }
  async createCrm(
    tenant_id: string,
    carId: string,
    { name, next_call_date }: CreateCrmDto,
  ) {
    const car = await this.carsService.findOneCar(
      tenant_id,
      carId,
      false,
      false,
      true,
    );
    for (const crm of car.crm) {
      if (crm.name?.trim() === name.trim()) {
        throw new ConflictException('هذا التنبيه موجود بالفعل.');
      }
    }
    const newCrm = this.crmRepo.create({
      tenant_id,
      car,
      name,
      next_call_date,
    });
    await this.saveCrm(newCrm);
    return {
      done: true,
    };
  }
  async updateCrm(
    tenant_id: string,
    carId: string,
    crmId: string,
    { name, next_call_date }: UpdateCrmDto,
  ) {
    const car = await this.carsService.findOneCar(
      tenant_id,
      carId,
      false,
      false,
      true,
    );
    const crm = await this.findCrmById(tenant_id, crmId);
    for (const crm of car.crm) {
      if (crm.name?.trim() === name.trim()) {
        throw new ConflictException('هذا التنبيه موجود بالفعل.');
      }
    }
    crm.name = name;
    crm.next_call_date = next_call_date;
    await this.saveCrm(crm);
    return {
      done: true,
    };
  }
  async deleteCrm(tenant_id: string, crmId: string) {
    const crm = await this.findCrmById(tenant_id, crmId);
    try {
      await this.crmRepo.delete(crm.id);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(err);
    }
    return {
      done: true,
    };
  }
  async crmAlert(tenant_id: string, chat_ids: string[]) {
    const today = dayjs().startOf('day');
    const tomorrow = dayjs().endOf('day');
    const crmAlerts = await this.crmRepo
      .createQueryBuilder('crm')
      .leftJoin('crm.car', 'car')
      .leftJoin('car.client', 'client')
      .leftJoin('client.contacts', 'contacts')
      .select([
        'crm.id',
        'crm.name',
        'car.id',
        'car.mark',
        'car.type',
        'car.plate',
        'client.id',
        'client.user_name',
        'contacts.id',
        'contacts.phone',
      ])
      .where('crm.next_call_date >= :startDate', { startDate: today.toDate() })
      .andWhere('crm.next_call_date <= :endDate', {
        endDate: tomorrow.toDate(),
      })
      .andWhere('crm.tenant_id = :tenant_id', { tenant_id })
      .getMany();
    const crmUi = crmAlerts.map((crm) => {
      return `
          <b>اسم التنبيه: ${crm.name}</b>\n
          <b>العميل:</b> ${crm.car?.client?.user_name}\n
          <b>السيارة:</b> ${crm.car?.mark && crm.car.mark.length > 0 ? crm.car.mark : 'غير مسجل'}\n
          <b>النوع:</b> ${crm.car?.type && crm.car.type.length > 0 ? crm.car.type : 'غير مسجل'}\n
          <b>لوحة الترخيص:</b> ${crm.car?.plate && crm.car.plate.length > 0 ? crm.car.plate : 'غير مسجل'}\n
          <b>رقم الهاتف:</b> ${crm.car?.client?.contacts[0]?.phone ?? 'لا يوجد'}\n
          <b>--------------------------------</b>\n
          `;
    });
    if (crmAlerts.length > 0) {
      const finalUi = `
      <b>تنبيهات التنبيهات اليومية</b>\n
      <b>تاريخ اليوم: ${dayjs(today).format('DD/MM/YYYY')}</b>\n
      ${crmUi.join('')}
      `;
      for (const chat_id of chat_ids) {
        await this.telegramService.sendMessage(chat_id, finalUi);
      }
    }
  }
  //
  async saveCrm(crm: CrmEntity) {
    let saved;
    try {
      saved = await this.crmRepo.save(crm);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
    return saved;
  }
  async findCrmById(tenant_id: string, crmId: string) {
    const crm = await this.crmRepo.findOne({
      where: {
        id: crmId,
        tenant_id,
      },
    });
    if (!crm) {
      throw new NotFoundException('هذا التنبيه غير موجود.');
    }
    return crm;
  }
}
