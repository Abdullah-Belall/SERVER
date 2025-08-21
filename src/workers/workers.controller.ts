import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import CreateWorkerDto from './dto/create-worker.dto';
import { Response } from 'express';
import { User } from 'src/decorators/user.decorator';
import { WorkerTokenInterface } from 'src/types/interfaces/user.interface';
import { OwnerGuard } from 'src/guards/owner.guard';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshGuard } from 'src/guards/refresh.guard';
import { UpdateWorkerPasswordDto } from './dto/update-worker-password.dto';
import { BanWorkerDto } from './dto/ban-worker.dto';
import { ReaderGuard } from 'src/guards/reader.guard';
import { BossGuard } from 'src/guards/boss.guard';
import { TenantDetails } from './dto/tenant-details.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}
  @Post('sign-fuser')
  @UseGuards(BossGuard)
  async signFirstUser(@Body() signInDto: SignInDto) {
    return await this.workersService.signUpFirstUser(signInDto);
  }
  @Post('sign-in')
  async signInUser(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.workersService.SignInUser(signInDto, response);
  }
  @Post('tenant-details')
  async getTenantDetails(@Body() { tenant_domain }: TenantDetails) {
    return await this.workersService.getTenantDetails(tenant_domain);
  }
  @Get('refresh-token')
  @UseGuards(RefreshGuard)
  async refreshToken(@User() { user_name, tenant_id }: WorkerTokenInterface) {
    return await this.workersService.RefreshToken(user_name, tenant_id);
  }
  @Post('sign-out')
  @UseGuards(ReaderGuard)
  async signOutUser(@Res({ passthrough: true }) response: Response) {
    return await this.workersService.SignOutUser(response);
  }
  @Post('create-worker')
  @UseGuards(OwnerGuard)
  async createWorker(
    @User() { tenant_id }: WorkerTokenInterface,
    @Body() { user_name, password, role, salary }: CreateWorkerDto,
  ) {
    return await this.workersService.addWorker(
      user_name,
      password,
      tenant_id,
      role,
      salary,
    );
  }
  @Patch('update-worker/:id')
  @UseGuards(OwnerGuard)
  async updateWorker(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) worker_id: string,
    @Body() updateWorkerDto: UpdateWorkerDto,
  ) {
    return await this.workersService.updateWorker(
      tenant_id,
      worker_id,
      updateWorkerDto,
    );
  }

  @Get()
  @UseGuards(ReaderGuard)
  async findAll(@User() { tenant_id }: WorkerTokenInterface) {
    return await this.workersService.findAll(tenant_id);
  }

  @Get('profile/:domain')
  @UseGuards(ReaderGuard)
  async profile(
    @User() { user_name, tenant_id }: WorkerTokenInterface,
    @Param('domain') domain: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.workersService.workerProfile(
      user_name,
      tenant_id,
      domain,
      response,
    );
  }
  @Patch('update-password')
  @UseGuards(ReaderGuard)
  async updatePassword(
    @User() { user_name, tenant_id }: WorkerTokenInterface,
    @Body() updateWorkerPasswordDto: UpdateWorkerPasswordDto,
  ) {
    return await this.workersService.updateWorkerPassword(
      user_name,
      tenant_id,
      updateWorkerPasswordDto,
    );
  }
  @Patch('ban/:id')
  @UseGuards(OwnerGuard)
  async BanWorker(
    @User() { tenant_id }: WorkerTokenInterface,
    @Param('id', new ParseUUIDPipe()) worker_id: string,
    @Body() { banned_reason }: BanWorkerDto,
  ) {
    return await this.workersService.BanWorker(
      worker_id,
      banned_reason,
      tenant_id,
    );
  }
  @Get(':id')
  @UseGuards(ReaderGuard)
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() { tenant_id }: WorkerTokenInterface,
  ) {
    return await this.workersService.findOneWorker(id, tenant_id);
  }
}
