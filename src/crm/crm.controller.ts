import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmDatesService } from './crm-dates.service';
import { UpdateCrmDto } from './dto/crm/update-crm.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { AdminGuard } from 'src/guards/admin.guard';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { User } from 'src/decorators/user.decorator';
import { CreateCrmDto } from './dto/crm/create-crm.dto';
import { CreateCrmDateDto } from './dto/crm-date/create-crm-date.dto';

@Controller('crm')
@UseGuards(ReaderGuard)
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly crmDatesService: CrmDatesService,
  ) {}
  @Get('car/:carId')
  async findCrmByCarId(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('carId', new ParseUUIDPipe()) carId: string,
  ) {
    return this.crmService.findCrmByCarId(tenant_id, carId);
  }
  @Post('car/:carId')
  @UseGuards(AdminGuard)
  async createCrm(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('carId', new ParseUUIDPipe()) carId: string,
    @Body() createCrmDto: CreateCrmDto,
  ) {
    return this.crmService.createCrm(tenant_id, carId, createCrmDto);
  }
  @Patch(':crmId/car/:carId')
  @UseGuards(AdminGuard)
  async updateCrm(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('crmId', new ParseUUIDPipe()) crmId: string,
    @Param('carId', new ParseUUIDPipe()) carId: string,
    @Body() updateCrmDto: UpdateCrmDto,
  ) {
    return this.crmService.updateCrm(tenant_id, carId, crmId, updateCrmDto);
  }
  @Delete(':crmId')
  @UseGuards(AdminGuard)
  async deleteCrm(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('crmId', new ParseUUIDPipe()) crmId: string,
  ) {
    return this.crmService.deleteCrm(tenant_id, crmId);
  }
  @Get(':crmId/dates')
  async findCrmDatesByCrmId(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('crmId', new ParseUUIDPipe()) crmId: string,
  ) {
    return this.crmDatesService.findCrmDatesByCrmId(tenant_id, crmId);
  }
  @Post(':crmId/dates')
  @UseGuards(AdminGuard)
  async createCrmDate(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('crmId', new ParseUUIDPipe()) crmId: string,
    @Body() createCrmDateDto: CreateCrmDateDto,
  ) {
    return this.crmDatesService.createCrmDate(
      tenant_id,
      crmId,
      createCrmDateDto,
    );
  }
  @Delete('dates/:crmDateId')
  @UseGuards(AdminGuard)
  async deleteCrmDate(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('crmDateId', new ParseUUIDPipe()) crmDateId: string,
  ) {
    return this.crmDatesService.deleteCrmDate(tenant_id, crmDateId);
  }
}
