import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactsEntity } from './entities/contacts.entity';
import { Repository } from 'typeorm';
import { ClientsService } from 'src/clients/clients.service';
import { ErrorMsg } from 'src/utils/base';
import { WorkersService } from 'src/workers/workers.service';
import { CreateWorkerContactDto } from './dto/create-worker-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(ContactsEntity)
    private readonly contactsRepo: Repository<ContactsEntity>,
    private readonly clientsService: ClientsService,
    private readonly workersService: WorkersService,
  ) {}

  async CreateClientContact(
    tenant_id: string,
    createClientContactDto: CreateClientContactDto,
  ) {
    const { user_id } = createClientContactDto;
    let user = await this.clientsService.findClientById(
      tenant_id,
      user_id,
      true,
    );
    if (!user) {
      throw new NotFoundException('لا يوجد عميل بهذه البيانات.');
    }
    const condition = user.contacts.some(
      (contact) => contact.phone === createClientContactDto.phone,
    );
    if (condition) {
      throw new ConflictException('جهة الاتصال موجودة بالفعل.');
    }
    const contact = this.contactsRepo.create({
      ...createClientContactDto,
      tenant_id,
      client: user,
    });
    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم انشاء جهة اتصال للعمية بنجاح.',
    };
  }
  async updateContact(
    tenant_id: string,
    contactId: string,
    updateContactDto: UpdateContactDto,
  ) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId, tenant_id },
      relations: ['worker'],
    });
    if (!contact)
      throw new NotFoundException('لا يوجد جهة اتصال بهذه البيانات.');
    if (contact.worker) {
      throw new ForbiddenException(
        'لا يمكنك تعديل جهة اتصال الخاصة بالموظفين والملاك.',
      );
    }
    Object.assign(contact, updateContactDto);

    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'Contact updated successfully.',
    };
  }
  async deleteContact(tenant_id: string, contactId: string) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId, tenant_id },
      relations: ['worker'],
    });
    if (!contact)
      throw new NotFoundException('لا يوجد جهة اتصال بهذه البيانات.');
    if (contact.worker) {
      throw new ForbiddenException(
        'لا يمكنك حذف جهة اتصال الخاصة بالموظفين والملاك.',
      );
    }
    await this.contactsRepo.delete(contactId);

    return {
      done: true,
      message: 'تم حذف جهة الاتصال بنجاح.',
    };
  }
  async CreateWorkerContact(
    tenant_id: string,
    user_id: string,
    createWorkerContactDto: CreateWorkerContactDto,
  ) {
    let user = await this.workersService.findWorkerById(
      tenant_id,
      user_id,
      true,
    );
    if (!user) {
      throw new NotFoundException('لا يوجد مستخدم بهذه البيانات.');
    }
    const condition = user.contacts.some(
      (contact) => contact.phone === createWorkerContactDto.phone,
    );
    if (condition) {
      throw new ConflictException('جهة الاتصال هذه موجودة مسبقا.');
    }
    const contact = this.contactsRepo.create({
      ...createWorkerContactDto,
      tenant_id,
      worker: user,
    });
    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم انشاء جهة اتصال جديدة بنجاح.',
    };
  }
  async updateWorkerContact(
    tenant_id: string,
    user_id: string,
    contactId: string,
    updateContactDto: UpdateContactDto,
  ) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId, tenant_id },
      relations: ['worker'],
    });
    if (!contact)
      throw new NotFoundException('لا يوجد جهة اتصال بهذه البيانات.');
    if (!contact.worker) {
      throw new ForbiddenException(
        'لا يمكن تعديل جهة اتصال لعميل بنقطة النهاية هذه.',
      );
    }
    if (contact.worker.id !== user_id) {
      throw new ForbiddenException('لا يمكنك تعديل جهة اتصال لمستخدم اخر.');
    }
    Object.assign(contact, updateContactDto);

    try {
      await this.contactsRepo.save(contact);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'تم تحديث جهة الاتصال بنجاح.',
    };
  }
  async deleteWorkerContact(
    tenant_id: string,
    user_id: string,
    contactId: string,
  ) {
    const contact = await this.contactsRepo.findOne({
      where: { id: contactId, tenant_id },
      relations: ['worker'],
    });
    if (!contact)
      throw new NotFoundException('لا يوجد جهة اتصال بهذه البيانات.');
    if (!contact.worker) {
      throw new ForbiddenException(
        'لا يمكن حذف جهة اتصال لعميل من نقطة النهاية هذه.',
      );
    }
    if (contact.worker.id !== user_id) {
      throw new ForbiddenException('لا يمكنك حذف جهة اتصال لمستخدم اخر.');
    }
    await this.contactsRepo.delete(contactId);

    return {
      done: true,
      message: 'تم حذف جهة الاتصال بنجاح.',
    };
  }
}
