import { IsString, IsUUID } from 'class-validator';

export class CreateTelegramChatIdDto {
  @IsUUID()
  tenant_id: string;
  @IsString()
  telegram_chat_id: string;
}
