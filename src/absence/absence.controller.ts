import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AbsenceService } from './absence.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { User } from 'src/decorators/user.decorator';
import { OwnerGuard } from 'src/guards/owner.guard';

@Controller('absence')
@UseGuards(OwnerGuard)
export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  @Post(':worker_id')
  createAbsence(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('worker_id', new ParseUUIDPipe()) worker_id: string,
    @Body() createAbsenceDto: CreateAbsenceDto,
  ) {
    return this.absenceService.createAbsence(
      tenant_id,
      worker_id,
      createAbsenceDto,
    );
  }

  @Patch(':id')
  updateAbsence(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
  ) {
    return this.absenceService.updateAbsence(tenant_id, id, updateAbsenceDto);
  }

  @Delete(':id')
  deleteAbsence(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.absenceService.deleteAbsence(tenant_id, id);
  }
}
