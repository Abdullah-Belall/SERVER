import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkersEntity } from './entities/worker.entity';
import { Brackets, Repository } from 'typeorm';
import { SignInDto } from './dto/sign-in.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Response } from 'express';
import { RoleEnum } from 'src/types/enums/user.enum';
import { ErrorMsg } from 'src/utils/base';
import { UpdateWorkerPasswordDto } from './dto/update-worker-password.dto';
import { TenantsService } from 'src/tenants/tenants.service';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(WorkersEntity)
    private readonly workersRepo: Repository<WorkersEntity>,
    private readonly tenantsService: TenantsService,
  ) {}
  //! Only Boss Can Hit This
  async signUpFirstUser({ user_name, password, tenant_domain }: SignInDto) {
    const tenantId = await this.tenantsService.getTenantId(tenant_domain);
    const existingUser = await this.workersRepo.findOne({
      where: {
        user_name,
        tenant_id: tenantId,
      },
    });
    if (existingUser) {
      throw new ConflictException('يوجد مستخدم اخر بنفس البيانات.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newWorker = this.workersRepo.create({
      user_name,
      password: hashedPassword,
      role: RoleEnum.OWNER,
      tenant_id: tenantId,
    });
    try {
      await this.workersRepo.save(newWorker);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: `تم انشاء مستأجر برتبة مالك للدومين : ${tenant_domain}`,
    };
  }
  async SignInUser(
    { user_name, password, tenant_domain }: SignInDto,
    response: Response,
  ) {
    const tenantId = await this.tenantsService.getTenantId(tenant_domain);
    const user = await this.workersRepo.findOne({
      where: {
        user_name,
        tenant_id: tenantId,
      },
    });
    if (!user) {
      throw new NotFoundException('لا يوجد مستخدم بهذه البيانات.');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('كلمة مرور غير صحيحة.');
    }
    this.checkUserStatus(user);
    const access_token = this.generateAccessToken({
      id: user.id,
      user_name: user.user_name,
      role: user.role,
      tenant_id: user.tenant_id,
    });
    const refresh_token = this.generateRefreshToken({
      id: user.id,
      user_name: user.user_name,
      role: user.role,
      tenant_id: user.tenant_id,
    });
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'high',
    });
    return {
      done: true,
      access_token,
    };
  }
  async RefreshToken(user_name: string, tenant_id: string) {
    const user = await this.workersRepo.findOne({
      where: {
        user_name,
        tenant_id,
      },
    });
    if (!user) {
      throw new ForbiddenException('لا يوجد مستخدم بهذه البيانات.');
    }
    this.checkUserStatus(user);
    const access_token = this.generateAccessToken({
      id: user.id,
      user_name,
      role: user.role,
      tenant_id,
    });
    return {
      done: true,
      access_token,
    };
  }
  async SignOutUser(response: Response) {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    response.clearCookie('access_token', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return {
      done: true,
    };
  }
  async saveWorker(worker: WorkersEntity) {
    let saved;
    try {
      saved = await this.workersRepo.save(worker);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async findOneWorker(id: string, tenant_id: string) {
    const worker = await this.workersRepo.findOne({
      where: {
        id,
        tenant_id,
      },
      relations: ['advances', 'deductions', 'absences'],
      order: {
        advances: { created_at: 'DESC' },
        deductions: { created_at: 'DESC' },
      },
    });
    if (!worker) throw new NotFoundException();
    return worker;
  }
  async findAll(tenant_id: string, page: number = 1, limit: number = 1000) {
    const [workers, total] = await this.workersRepo
      .createQueryBuilder('worker')
      .where('worker.tenant_id = :tenant_id', { tenant_id })
      .loadRelationCountAndMap('worker.contacts_count', 'worker.contacts')
      .select([
        'worker.id',
        'worker.user_name',
        'worker.role',
        'worker.salary',
        'worker.is_banned',
        'worker.banned_reason',
        'worker.created_at',
        'worker.updated_at',
      ])
      .orderBy('worker.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      workers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async getTenantDetails(tenant_domain: string) {
    return await this.tenantsService.getTenantDetails(tenant_domain);
  }
  async addWorker(
    user_name: string,
    password: string,
    tenant_id: string,
    role: RoleEnum = RoleEnum.ADMIN,
    salary?: number,
  ) {
    const existingUser = await this.workersRepo.findOne({
      where: {
        user_name,
        tenant_id,
      },
    });
    if (existingUser) {
      throw new ConflictException('يوجد مستخدم اخر بهذه البيانات.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newWorker = this.workersRepo.create({
      user_name,
      password: hashedPassword,
      role,
      tenant_id,
      salary,
    });
    try {
      await this.workersRepo.save(newWorker);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم انشاء مستخدم جديد بنجاح.',
    };
  }
  async updateWorker(
    tenant_id: string,
    worker_id: string,
    updateWorkerDto: UpdateWorkerDto,
  ) {
    const existingUser = await this.workersRepo.findOne({
      where: {
        id: worker_id,
        tenant_id,
      },
    });
    if (!existingUser) {
      throw new NotFoundException('لا يوجد مستخدم بهذه البيانات.');
    }
    if (
      updateWorkerDto.user_name &&
      updateWorkerDto.user_name !== existingUser.user_name
    ) {
      const conflictUser = await this.workersRepo.findOne({
        where: {
          user_name: updateWorkerDto?.user_name,
          tenant_id,
        },
        select: ['id'],
      });
      if (conflictUser) {
        throw new ConflictException('يوجد مستخدم اخر بهذا الاسم.');
      }
    }
    Object.assign(existingUser, updateWorkerDto);
    try {
      await this.workersRepo.save(existingUser);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث بيانات المستخدم بنجاح.',
    };
  }
  async workerProfile(
    user_name: string,
    tenant_id: string,
    domain: string,
    response: Response,
  ) {
    const worker = await this.workersRepo.findOne({
      where: {
        user_name,
        tenant_id,
      },
      relations: ['contacts'],
    });
    if (!worker) {
      throw new ForbiddenException('لا يوجد مستخدم بهذه البيانات.');
    }
    this.checkUserStatus(worker);
    const tenant = await this.tenantsService.getTenantDetails(domain);
    if (tenant.tenant_id !== tenant_id) {
      await this.SignOutUser(response);
      throw new ForbiddenException('لا يوجد مستخدم بهذه البيانات.');
    }
    return {
      done: true,
      worker,
    };
  }
  async updateWorkerPassword(
    user_name: string,
    tenant_id: string,
    { password, new_password }: UpdateWorkerPasswordDto,
  ) {
    const worker = await this.workersRepo.findOne({
      where: {
        user_name,
        tenant_id,
      },
    });
    if (!worker) {
      throw new ForbiddenException('لا يوجد مستخدم بهذه البيانات.');
    }
    const isCorrectPassword = await bcrypt.compare(password, worker.password);
    if (!isCorrectPassword) {
      throw new ConflictException('كلمة المرور غير صحيحة.');
    }
    const hashedPassword = await bcrypt.hash(new_password, 10);
    worker.password = hashedPassword;
    try {
      await this.workersRepo.save(worker);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث كلمة المرور بنجاح.',
    };
  }
  async BanWorker(worker_id: string, banned_reason: string, tenant_id: string) {
    const worker = await this.workersRepo.findOne({
      where: {
        id: worker_id,
        tenant_id,
      },
    });
    if (!worker) throw new NotFoundException('لا يوجد مستخدم بهذه البيانات.');
    if (worker.role === 'owner')
      throw new ForbiddenException('لا يمكنك حظر مالك.');
    if (worker.is_banned)
      throw new ConflictException('هذا المستخدم محظور بالفعل.');
    try {
      await this.workersRepo.save({
        ...worker,
        is_banned: true,
        banned_reason,
      });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم حظر المستخدم بنجاح.',
    };
  }
  async findWorkerById(
    tenant_id: string,
    user_id: string,
    needContacts: boolean = false,
  ) {
    const relations = [];
    if (needContacts) relations.push('contacts');
    return await this.workersRepo.findOne({
      where: { id: user_id, tenant_id },
      relations,
    });
  }
  async searchEngine(
    tenant_id: string,
    searchin: 'workers',
    searchwith: string,
  ) {
    if (searchin === 'workers') {
      const [results, total] = await this.workersRepo
        .createQueryBuilder('worker')
        .loadRelationCountAndMap('worker.contacts_count', 'worker.contacts')
        .select([
          'worker.id',
          'worker.user_name',
          'worker.role',
          'worker.salary',
          'worker.is_banned',
          'worker.banned_reason',
          'worker.created_at',
          'worker.updated_at',
        ])
        .orderBy('worker.created_at', 'DESC')
        .where('worker.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('worker.user_name ILIKE :termStart', {
              termStart: `${searchwith}%`,
            }).orWhere('worker.user_name ILIKE :termEnd', {
              termEnd: `%${searchwith}`,
            });
          }),
        )
        .getManyAndCount();

      return { results, total };
    }
    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
  private checkUserStatus(worker: WorkersEntity) {
    if (worker.is_banned) {
      throw new ForbiddenException(
        `هذا الحساب محظور, اتصل بالمدير لمزيد من المعلومات.`,
      );
    }
  }
  private generateAccessToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: '15m',
    });
  }
  private generateRefreshToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET_KEY, {
      expiresIn: '7d',
    });
  }
}
