import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { AdminGuard } from 'src/guards/admin.guard';
import { ReaderGuard } from 'src/guards/reader.guard';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @UseGuards(AdminGuard)
  async addEquipment(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() createEquipmentDto: CreateEquipmentDto,
  ) {
    return this.equipmentService.AddEquipment(tenant_id, createEquipmentDto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async updateEquipment(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.UpdateEquipment(
      tenant_id,
      id,
      updateEquipmentDto,
    );
  }

  @Get()
  @UseGuards(ReaderGuard)
  async findAllEquipments(@User() { tenant_id }: WorkerTokenInterface) {
    return this.equipmentService.findAllEquipments(tenant_id);
  }
}
