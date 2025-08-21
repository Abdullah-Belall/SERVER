import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CarsEntity } from './entities/car.entity';
import { Brackets, Repository } from 'typeorm';
import { ClientsService } from 'src/clients/clients.service';
import { ErrorMsg } from 'src/utils/base';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(CarsEntity)
    private readonly carsRepo: Repository<CarsEntity>,
    private readonly clientsService: ClientsService,
  ) {}
  async addCar(
    tenant_id: string,
    client_id: string,
    createCarDto: CreateCarDto,
  ) {
    const { plate, chassis } = createCarDto;
    await this.isDublicateCar(tenant_id, plate, chassis);
    const client = await this.clientsService.findClientById(
      tenant_id,
      client_id,
    );
    if (!client) {
      throw new NotFoundException('لا يوجد عميل بهذا المعرف.');
    }
    const car = this.carsRepo.create({
      tenant_id,
      client,
      ...createCarDto,
    });
    await this.saveCar(car);
    return {
      done: true,
    };
  }
  async findOneCar(
    tenant_id: string,
    id: string,
    orders?: boolean,
    client?: boolean,
    crm?: boolean,
  ) {
    const qb = this.carsRepo
      .createQueryBuilder('car')
      .where('car.tenant_id = :tenant_id', { tenant_id })
      .andWhere('car.id = :id', { id });
    if (orders) {
      qb.loadRelationCountAndMap('car.orders_count', 'car.orders');
      qb.leftJoinAndSelect('car.orders', 'orders');
      qb.leftJoinAndSelect('orders.payment', 'payment');
    }
    if (client) {
      qb.leftJoin('car.client', 'client').addSelect([
        'client.id',
        'client.user_name',
        'client.balance',
      ]);
    }
    if (crm) {
      qb.leftJoinAndSelect('car.crm', 'crm');
    }
    const car = await qb.getOne();
    if (!car) {
      throw new NotFoundException('لا يوجد سيارة بهذا المعرف.');
    }
    return car;
  }
  async updateCar(tenant_id: string, id: string, updateCarDto: UpdateCarDto) {
    const car = await this.findOneCar(tenant_id, id);
    const { plate, chassis } = updateCarDto;

    if (car.plate !== plate) {
      await this.isDublicateCar(tenant_id, plate);
    }
    if (car.chassis !== chassis) {
      await this.isDublicateCar(tenant_id, undefined, chassis);
    }
    Object.assign(car, updateCarDto);
    await this.saveCar(car);
    return {
      done: true,
    };
  }
  async deleteCar(tenant_id: string, id: string) {
    const car: any = await this.findOneCar(tenant_id, id, true);
    if (Number(car.orders_count) > 0) {
      throw new ConflictException('لا يمكن حذف سيارة مسجل عليها فواتير.');
    }
    try {
      await this.carsRepo.delete(car.id);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
    };
  }
  async findAllCars(tenant_id: string) {
    const [cars, total] = await this.carsRepo.findAndCount({
      where: {
        tenant_id,
      },
      relations: ['client'],
      select: {
        client: {
          id: true,
          user_name: true,
          balance: true,
        },
      },
    });
    return {
      cars,
      total,
    };
  }

  async searchEngine(tenant_id: string, searchin: 'cars', searchwith: string) {
    if (searchin === 'cars') {
      const query = this.carsRepo
        .createQueryBuilder('car')
        .leftJoin('car.client', 'client')
        .addSelect(['client.id', 'client.user_name'])
        .where('car.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('client.user_name ILIKE :termStart', {
              termStart: `${searchwith.toLowerCase()}%`,
            })
              .orWhere('client.user_name ILIKE :termEnd', {
                termEnd: `%${searchwith.toLowerCase()}`,
              })
              .orWhere('car.mark ILIKE :termStart', {
                termStart: `${searchwith.toLowerCase()}%`,
              })
              .orWhere('car.mark ILIKE :termEnd', {
                termEnd: `%${searchwith.toLowerCase()}`,
              })
              .orWhere('car.plate ILIKE :termStart', {
                termStart: `${searchwith.toLowerCase()}%`,
              })
              .orWhere('car.plate ILIKE :termEnd', {
                termEnd: `%${searchwith.toLowerCase()}`,
              })
              .orWhere('car.chassis ILIKE :termStart', {
                termStart: `${searchwith.toLowerCase()}%`,
              })
              .orWhere('car.chassis ILIKE :termEnd', {
                termEnd: `%${searchwith.toLowerCase()}`,
              });
          }),
        );
      const [results, total] = await query
        .orderBy('car.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }

  //*=========
  async isDublicateCar(tenant_id: string, plate?: string, chassis?: string) {
    if (plate) {
      const isDulicate = await this.carsRepo.findOne({
        where: { tenant_id, plate },
      });
      if (isDulicate) {
        throw new ConflictException('يوجد سيارة اخري بنفس رقم اللوحة.');
      }
    }
    if (chassis) {
      const isDulicate = await this.carsRepo.findOne({
        where: { tenant_id, chassis },
      });
      if (isDulicate) {
        throw new ConflictException('يوجد سيارة اخري بنفس رقم الشاسية.');
      }
    }
  }
  async saveCar(car: CarsEntity) {
    let savedCar;
    try {
      savedCar = await this.carsRepo.save(car);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return savedCar;
  }
}
