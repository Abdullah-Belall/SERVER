import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { DeductionService } from './deduction.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { UpdateDeductionDto } from './dto/update-deduction.dto';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { OwnerGuard } from 'src/guards/owner.guard';

@Controller('deduction')
@UseGuards(OwnerGuard)
export class DeductionController {
  constructor(private readonly deductionService: DeductionService) {}
  @Post(':workerId')
  async createDeduction(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('workerId', new ParseUUIDPipe()) workerId: string,
    @Body() createDeductionDto: CreateDeductionDto,
  ) {
    return await this.deductionService.createDeduction(
      tenant_id,
      workerId,
      createDeductionDto,
    );
  }
  @Patch(':id')
  async updateDeduction(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDeductionDto: UpdateDeductionDto,
  ) {
    return await this.deductionService.updateDeduction(
      tenant_id,
      id,
      updateDeductionDto,
    );
  }
}
