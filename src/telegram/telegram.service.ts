// src/telegram/telegram.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ErrorMsg } from 'src/utils/base';
import * as fs from 'fs';
import * as FormData from 'form-data';

@Injectable()
export class TelegramService {
  private readonly botToken = '7990245657:AAHkRs81_9RweMc7Z-Id1zDSsPqD5Crh_yY';
  private readonly baseUrl = `https://api.telegram.org/bot${this.botToken}`;

  async sendMessage(chat_id: string, message: string) {
    const url = `${this.baseUrl}/sendMessage`;
    try {
      await axios.post(url, {
        chat_id,
        text: message,
        parse_mode: 'HTML',
      });
    } catch (err) {
      console.error(err);
    }
  }
  async sendTelegramPDF(chat_id: string, filePath: string) {
    const url = `${this.baseUrl}/sendDocument`;
    const form = new FormData();

    form.append('chat_id', chat_id);
    form.append('document', fs.createReadStream(filePath));

    await axios.post(url, form, {
      headers: form.getHeaders(),
    });
  }
  async getChatIds() {
    const response = await axios.get(`${this.baseUrl}/getUpdates`);
    if (!response.data.ok) {
      throw new InternalServerErrorException(ErrorMsg);
    }
    const latestByDate = response.data?.result;
    let final;
    if (latestByDate.length > 0) {
      final = latestByDate.reduce((latest, current) =>
        current.message.date > latest.message.date ? current : latest,
      );
    }
    return {
      chat_id: final?.message?.chat?.id,
      text: final?.message?.text,
    };
  }
}
