import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { CreatePayAdvanceDto } from './dto/create-pay-advance.dto';
import { UpdatePayAdvanceDto } from './dto/update-pay-advance.dto';
import { OwnerGuard } from 'src/guards/owner.guard';
import { ReaderGuard } from 'src/guards/reader.guard';

@Controller('advances')
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}
  @Post(':workerId')
  @UseGuards(OwnerGuard)
  async createAdvance(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('workerId', new ParseUUIDPipe()) workerId: string,
    @Body() createAdvanceDto: CreateAdvanceDto,
  ) {
    return await this.advancesService.createAdvance(
      tenant_id,
      workerId,
      createAdvanceDto,
    );
  }
  @Patch(':id')
  @UseGuards(OwnerGuard)
  async updateAdvance(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAdvanceDto: UpdateAdvanceDto,
  ) {
    return await this.advancesService.updateAdvance(
      tenant_id,
      id,
      updateAdvanceDto,
    );
  }
  @Post(':advance_id/pay')
  @UseGuards(OwnerGuard)
  async createPayAdvance(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('advance_id', new ParseUUIDPipe()) advance_id: string,
    @Body() createPayAdvanceDto: CreatePayAdvanceDto,
  ) {
    return await this.advancesService.payAdvance(
      tenant_id,
      advance_id,
      createPayAdvanceDto,
    );
  }
  @Patch(':pay_advance_id/edit-pay')
  @UseGuards(OwnerGuard)
  async updatePayAdvance(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('pay_advance_id', new ParseUUIDPipe()) pay_advance_id: string,
    @Body() updatePayAdvanceDto: UpdatePayAdvanceDto,
  ) {
    return await this.advancesService.editPayAdvance(
      tenant_id,
      pay_advance_id,
      updatePayAdvanceDto,
    );
  }
  @Get(':id/bills')
  @UseGuards(ReaderGuard)
  async findOnePayAdvance(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.advancesService.findOneAdvance(tenant_id, id, true);
  }
}
