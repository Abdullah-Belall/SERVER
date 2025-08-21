import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateWorkerContactDto } from './dto/create-worker-contact.dto';
import { User } from 'src/decorators/user.decorator';
import { ReaderGuard } from 'src/guards/reader.guard';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('contacts')
@UseGuards(AdminGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post('client')
  async createClientContact(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createClientContactDto: CreateClientContactDto,
  ) {
    return await this.contactsService.CreateClientContact(
      tenant_id,
      createClientContactDto,
    );
  }

  @Patch('client/:id')
  async updateContact(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return await this.contactsService.updateContact(
      tenant_id,
      id,
      updateContactDto,
    );
  }

  @Delete('client/:id')
  async deleteContact(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.contactsService.deleteContact(tenant_id, id);
  }

  @Post('worker/:id')
  async createWorkerContact(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) user_id: string,
    @Body() createWorkerContactDto: CreateWorkerContactDto,
  ) {
    return await this.contactsService.CreateWorkerContact(
      tenant_id,
      user_id,
      createWorkerContactDto,
    );
  }

  @Patch('worker/:contactId')
  async updateWorkerContact(
    @User() { id, tenant_id }: WorkerTokenInterface,
    @Param('contactId', new ParseUUIDPipe()) contactId: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return await this.contactsService.updateWorkerContact(
      tenant_id,
      id,
      contactId,
      updateContactDto,
    );
  }

  @Delete('worker/:contactId')
  async deleteWorkerContact(
    @User() { id, tenant_id }: WorkerTokenInterface,
    @Param('contactId', new ParseUUIDPipe()) contactId: string,
  ) {
    return await this.contactsService.deleteWorkerContact(
      tenant_id,
      id,
      contactId,
    );
  }
}
