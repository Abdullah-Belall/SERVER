import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TelegramBotEntity } from './entities/telegram.entity';
import { Repository } from 'typeorm';
import { ErrorMsg } from 'src/utils/base';
import { CreateTelegramChatIdDto } from './dto/create-chat-id.dto';
import { TenantsService } from './tenants.service';

@Injectable()
export class ChatIdService {
  constructor(
    @InjectRepository(TelegramBotEntity)
    private readonly telegramBotRepo: Repository<TelegramBotEntity>,
    private readonly tenantsService: TenantsService,
  ) {}
  async saveTelegramChatId(obj: TelegramBotEntity) {
    let saved: TelegramBotEntity;
    try {
      saved = await this.telegramBotRepo.save(obj);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async findOneChatId(where: any, relations?: string[], select?: any) {
    const chatIdObj = await this.telegramBotRepo.findOne({
      where,
      relations,
      select,
    });
    if (!chatIdObj) {
      throw new NotFoundException(`لا يوجد معرف محادثة بهذه البيانات.`);
    }
    return chatIdObj;
  }
  async addChatId({ telegram_chat_id, tenant_id }: CreateTelegramChatIdDto) {
    const isExist = await this.telegramBotRepo.findOne({
      where: {
        tenant_id,
        chat_id: telegram_chat_id,
      },
    });
    if (isExist) throw new ConflictException(`معرف الدردشة هذا موجود بالفعل.`);
    const tenant = await this.tenantsService.getTenantByTenantId(tenant_id);
    if (!tenant) {
      throw new NotFoundException(`لا يوجد مستأجر.`);
    }
    await this.saveTelegramChatId(
      this.telegramBotRepo.create({
        tenant_id,
        chat_id: telegram_chat_id,
        tenant,
      }),
    );
    return {
      done: true,
    };
  }
  async editChatId(
    id: string,
    { telegram_chat_id, tenant_id }: CreateTelegramChatIdDto,
  ) {
    const chatIdObj = await this.findOneChatId({
      tenant_id,
      id,
    });
    chatIdObj.chat_id = telegram_chat_id;
    await this.saveTelegramChatId(chatIdObj);
    return {
      done: true,
    };
  }
  async findChatIds(tenant_id: string, relations?: string[], select?: any) {
    const [chat_ids, total] = await this.telegramBotRepo.findAndCount({
      where: { tenant_id },
      relations,
      select,
    });
    return {
      chat_ids,
      total,
    };
  }
}
