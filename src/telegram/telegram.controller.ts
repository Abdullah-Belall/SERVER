import { Controller, Get, UseGuards } from '@nestjs/common';
import { BossGuard } from 'src/guards/boss.guard';
import { TelegramService } from './telegram.service';

@Controller('telegram')
@UseGuards(BossGuard)
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}
  @Get('chatIds')
  async gtes() {
    return await this.telegramService.getChatIds();
  }
}
