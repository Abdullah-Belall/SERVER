import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantsEntity } from './entities/tenant.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { ErrorMsg } from 'src/utils/base';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PeriodsEnum } from 'src/types/enums/product.enum';
import { CrmService } from 'src/crm/crm.service';
import { Cron } from '@nestjs/schedule';
@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantsEntity)
    private readonly tenantsRepo: Repository<TenantsEntity>,
    private readonly crmService: CrmService,
  ) {}
  async createNewTenant({
    tenant_domain,
    phone,
    title,
    logo,
    bill_path,
    theme,
  }: CreateTenantDto) {
    const isExists = await this.tenantsRepo.findOne({
      where: { domain: tenant_domain },
    });
    if (isExists) {
      throw new ConflictException('هذا المستأجر موجود بالفعل.');
    }
    const tenantReady = this.tenantsRepo.create({
      domain: tenant_domain,
      phone,
      company_logo: logo,
      company_title: title,
      bill_path,
      theme,
    });
    try {
      await this.tenantsRepo.save(tenantReady);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم انشاء مستأجر جديد بنجاح.',
    };
  }
  async getTenantByTenantId(tenant_id: string) {
    return await this.tenantsRepo.findOne({
      where: { tenant_id },
      relations: ['chat_ids'],
      select: {
        chat_ids: {
          id: true,
          chat_id: true,
        },
      },
    });
  }
  async getAllTenants() {
    const [tenants, total] = await this.tenantsRepo.findAndCount({
      relations: ['chat_ids'],
      order: {
        created_at: 'DESC',
      },
    });
    return {
      tenants,
      total,
    };
  }
  async updateTenant(
    tenant_id: string,
    { tenant_domain, title, logo, phone, bill_path, theme }: UpdateTenantDto,
  ) {
    const isExists = await this.tenantsRepo.findOne({
      where: { tenant_id: tenant_id },
    });
    if (!isExists) {
      throw new ConflictException('لا يوجد مستأجر بهذه الدومين.');
    }
    if (tenant_domain && tenant_domain !== isExists.domain) {
      const isTenantDomainExist = await this.tenantsRepo.findOne({
        where: { domain: tenant_domain },
      });
      if (isTenantDomainExist) {
        throw new ConflictException('يوجد مستأجر اخر بهذا الدومين.');
      }
    }
    const compareObj = {
      domain: tenant_domain,
      company_title: title,
      company_logo: logo,
      phone,
      bill_path,
      theme,
    };
    if (!phone || phone === '') {
      delete compareObj.phone;
    }
    if (!bill_path || bill_path === '') {
      compareObj.bill_path = null;
    }
    if (!theme || theme === '') {
      compareObj.theme = null;
    }
    Object.assign(isExists, compareObj);
    try {
      await this.tenantsRepo.save(isExists);
    } catch (err) {
      console.error(err);
    }
    return {
      done: true,
      message: 'تم تعديل المستأجر بنجاح.',
    };
  }
  async getTenantId(tenant_domain: string) {
    const isExists = await this.tenantsRepo.findOne({
      where: { domain: tenant_domain },
    });
    if (!isExists) {
      throw new NotFoundException('لا يوجد مستأجر بهذا الدومين.');
    }
    return isExists?.tenant_id;
  }
  async getTenantDetails(tenant_domain: string) {
    const isExists = await this.tenantsRepo.findOne({
      where: { domain: tenant_domain },
    });
    if (!isExists) {
      throw new NotFoundException('لا يوجد مستأجر بهذا الدومين.');
    }
    return {
      company_title: isExists.company_title,
      copmany_logo: isExists.company_logo,
      tenant_id: isExists.tenant_id,
      bill_path: isExists.bill_path,
      theme: isExists.theme,
    };
  }
  async getAllowedOrigins() {
    const all = (await this.tenantsRepo.find({ select: ['domain'] })).map(
      (e) =>
        `http${process.env.NODE_ENV === 'production' ? 's' : ''}://${e.domain}`,
    );
    return all;
  }
  async getBalance(tenant_id: string) {
    const tenant = await this.tenantsRepo.findOne({
      where: { tenant_id },
    });

    if (!tenant) {
      throw new NotFoundException('لا يوجد مستأجر بهذا المعرف.');
    }
    return tenant;
  }
  async updateBalance(tenant_id: string, balance: number, period: PeriodsEnum) {
    const tenant = await this.tenantsRepo.findOne({
      where: { tenant_id },
    });
    if (tenant.balance) {
      throw new ConflictException('لا يمكن تعديل الرصيد الحالي.');
    }
    if (!tenant) {
      throw new NotFoundException('لا يوجد مستأجر بهذا المعرف.');
    }

    tenant.balance = balance;
    tenant.period = period;

    try {
      await this.tenantsRepo.save(tenant);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث الرصيد بنجاح.',
    };
  }
  @Cron('0 8 * * *', {
    timeZone: 'Africa/Cairo',
  })
  //!HEREOB
  //* OK
  async crmAutoAlert() {
    const tenants = await this.tenantsRepo.find();
    for (const tenant of tenants) {
      if (tenant.chat_ids.length > 0) {
        await this.crmService.crmAlert(
          tenant.tenant_id,
          tenant.chat_ids.map((obj) => obj.chat_id),
        );
      }
    }
  }
}
