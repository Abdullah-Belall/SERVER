import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CommonService } from './common.service';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { ReaderGuard } from 'src/guards/reader.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { OwnerGuard } from 'src/guards/owner.guard';
import { DailyReportDto } from './dto/daily-report.dto';

@Controller('common')
@UseGuards(ReaderGuard)
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('search')
  async searchEngine(
    @Query('searchin') searchin: string,
    @Query('searchwith') searchwith: string,
    @Query('column') column: string,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.commonService.searchEngine(
      tenant_id,
      searchin,
      searchwith,
      column,
    );
  }
  @Get('calcs')
  @UseGuards(AdminGuard)
  async getAllCalcs(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.commonService.getGenralCalcs(tenant_id);
  }
  @Post('daily-report')
  async getDailyReport(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { date }: DailyReportDto,
  ) {
    return await this.commonService.getDailyReport(tenant_id, date);
  }
  @Post('telegram-daily-report')
  async telegramDailyReport(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { date }: DailyReportDto,
  ) {
    return await this.commonService.TelegramDailyReport(tenant_id, date);
  }
}
