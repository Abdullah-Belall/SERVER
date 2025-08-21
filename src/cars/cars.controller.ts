import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { AdminGuard } from 'src/guards/admin.guard';
import { ReaderGuard } from 'src/guards/reader.guard';

@Controller('cars')
@UseGuards(ReaderGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}
  @Post(':clientId')
  @UseGuards(AdminGuard)
  async addCar(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('clientId', new ParseUUIDPipe()) clientId: string,
    @Body() createCarDto: CreateCarDto,
  ) {
    return await this.carsService.addCar(tenant_id, clientId, createCarDto);
  }
  @Get()
  async findAllCars(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.carsService.findAllCars(tenant_id);
  }
  @Get(':id')
  async findOneCar(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.carsService.findOneCar(tenant_id, id, true);
  }
  @Patch(':id')
  @UseGuards(AdminGuard)
  async updateCar(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return await this.carsService.updateCar(tenant_id, id, updateCarDto);
  }
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteCar(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.carsService.deleteCar(tenant_id, id);
  }
}
