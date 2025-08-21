import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ClientsEntity } from './entities/client.entity';
import { ErrorMsg } from 'src/utils/base';
import { ShippingAddressesEntity } from './entities/shipping-addresses.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientsEntity)
    private readonly clientsRepo: Repository<ClientsEntity>,
    @InjectRepository(ShippingAddressesEntity)
    private readonly shippingAddressesRepo: Repository<ShippingAddressesEntity>,
  ) {}
  async saveClient(client: ClientsEntity) {
    let saved;
    try {
      saved = await this.clientsRepo.save(client);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async create(
    tenant_id: string,
    user_name: string,
    tax_num: string,
    balance: number,
  ) {
    const client = await this.clientsRepo.findOne({
      where: {
        user_name,
        tenant_id,
      },
    });
    if (client) throw new ConflictException('يوجد عميل اخر بهذا الاسم.');
    const newClient = this.clientsRepo.create({
      user_name,
      tax_num,
      tenant_id,
      balance,
    });
    try {
      await this.clientsRepo.save(newClient);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم انشاء عميل جديد بنجاح.',
    };
  }
  async findOneById(tenant_id: string, id: string) {
    const client = await this.clientsRepo
      .createQueryBuilder('client')
      .where('client.tenant_id = :tenant_id', { tenant_id })
      .andWhere('client.id = :id', { id })
      .leftJoinAndSelect('client.contacts', 'contacts')
      .leftJoinAndSelect('client.cars', 'cars')
      .leftJoin('cars.client', 'cli')
      .addSelect(['cli.id', 'cli.user_name'])
      .getOne();

    if (!client) throw new NotFoundException('لا يوجد عميل بهذا الاسم.');
    return client;
  }
  async findAll(tenant_id: string, page: number = 1, limit: number = 1000) {
    const [clients, total] = await this.clientsRepo
      .createQueryBuilder('client')
      .where('client.tenant_id = :tenant_id', { tenant_id })
      .loadRelationCountAndMap('client.cars_count', 'client.cars')
      .loadRelationCountAndMap('client.contacts_count', 'client.contacts')
      .loadRelationCountAndMap(
        'client.addresses_count',
        'client.shipping_addresses',
      )
      .orderBy('client.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async updateClient(
    tenant_id: string,
    id: string,
    { user_name, tax_num, balance }: UpdateClientDto,
  ) {
    const client = await this.clientsRepo.findOne({ where: { id, tenant_id } });
    if (!client) throw new NotFoundException('لا يوجد عميل بهذه البيانات.');
    if (user_name?.trim() !== client.user_name?.trim()) {
      const existingUser = await this.clientsRepo.findOne({
        where: { user_name, tenant_id },
      });
      if (existingUser)
        throw new ConflictException('يوجد عميل اخر بهذا الاسم.');
      client.user_name = user_name;
    }

    if (tax_num) client.tax_num = tax_num;
    if (balance) client.balance = balance;
    try {
      await this.clientsRepo.save(client);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'تم تحديث بيانات العميل بنجاح.',
    };
  }
  async createAddress(tenant_id: string, createAddressDto: CreateAddressDto) {
    const client = await this.clientsRepo.findOne({
      where: {
        user_name: createAddressDto.client_name,
        tenant_id,
      },
    });
    if (!client) throw new NotFoundException('لا يوجد عميل بهذا الاسم.');

    const address = this.shippingAddressesRepo.create({
      ...createAddressDto,
      tenant_id,
      client,
    });

    try {
      await this.shippingAddressesRepo.save(address);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return { done: true, message: 'تم اضافة عنوان جديد للعميل بنجاح.' };
  }
  async updateAddress(
    tenant_id: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.shippingAddressesRepo.findOne({
      where: { id: addressId, tenant_id },
    });
    if (!address) throw new NotFoundException('لا يوجد عنوان بهذه البيانات.');

    Object.assign(address, updateAddressDto);

    try {
      await this.shippingAddressesRepo.save(address);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return { done: true, message: 'تم تحديث العنوان بنجاح.' };
  }
  async deleteAddress(tenant_id: string, addressId: string) {
    const address = await this.shippingAddressesRepo.findOne({
      where: { id: addressId, tenant_id },
    });
    if (!address) throw new NotFoundException('لا يوجد عنوان بهذه البيانات.');
    await this.shippingAddressesRepo.delete(addressId);
    return { done: true, message: 'تم حذف العنوان بنجاح.' };
  }
  async findClientById(
    tenant_id: string,
    user_id: string,
    needContacts: boolean = false,
    needAddresses: boolean = false,
  ) {
    const relations = [];
    if (needContacts) relations.push('contacts');
    if (needAddresses) relations.push('shipping_addresses');
    return await this.clientsRepo.findOne({
      where: { id: user_id, tenant_id },
      relations,
    });
  }
  async searchEngine(
    tenant_id: string,
    searchin: 'clients',
    searchwith: string,
    column?: string,
  ) {
    if (searchin === 'clients') {
      const columns = ['client.user_name', 'client.tax_num'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.clientsRepo
        .createQueryBuilder('client')
        .loadRelationCountAndMap('client.contacts_count', 'client.contacts')
        .loadRelationCountAndMap('client.cars_count', 'client.cars')
        .where('client.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            if (column) {
              qb.where(`${column} ILIKE :termStart`, {
                termStart: `${searchwith.toLowerCase()}%`,
              }).orWhere(`${column} ILIKE :termEnd`, {
                termEnd: `%${searchwith.toLowerCase()}`,
              });
            } else {
              qb.where(`client.user_name ILIKE :termStart`, {
                termStart: `${searchwith.toLowerCase()}%`,
              })
                .orWhere(`client.user_name ILIKE :termEnd`, {
                  termEnd: `%${searchwith.toLowerCase()}`,
                })
                .orWhere(`client.tax_num ILIKE :termStart`, {
                  termStart: `${searchwith.toLowerCase()}%`,
                })
                .orWhere(`client.tax_num ILIKE :termEnd`, {
                  termEnd: `%${searchwith.toLowerCase()}`,
                });
            }
          }),
        );
      const [results, total] = await query
        .orderBy('client.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }
    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}
