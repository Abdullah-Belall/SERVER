import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { SuppliersEntity } from './entities/supplier.entity';
import { ErrorMsg } from 'src/utils/base';
import { ProductsService } from 'src/products/products.service';
import { SuppliersPaymentsEntity } from './entities/suppliers-payments.entity';
import { PaySupplierDto } from './dto/pay-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(SuppliersEntity)
    private readonly suppliersRepo: Repository<SuppliersEntity>,
    @InjectRepository(SuppliersPaymentsEntity)
    private readonly SuppliersPaymentsRepo: Repository<SuppliersPaymentsEntity>,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
  ) {}

  async create(tenant_id: string, user_name: string) {
    const supplier = await this.suppliersRepo.findOne({
      where: {
        tenant_id,
        user_name,
      },
    });
    if (supplier) throw new ConflictException('يوجد مورد اخر بهذا الاسم.');
    const newSupplier = this.suppliersRepo.create({
      user_name,
      tenant_id,
    });
    try {
      await this.suppliersRepo.save(newSupplier);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم انشاء مورد جديد بنجاح.',
    };
  }
  async findOneById(tenant_id: string, id: string) {
    const supplier = await this.suppliersRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.bills', 'bill')
      .leftJoin('bill.sort', 'sort')
      .addSelect(['sort.id', 'sort.name', 'sort.color', 'sort.size'])
      .leftJoin('sort.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .where('sub.id = :id', { id })
      .andWhere('sub.tenant_id = :tenant_id', { tenant_id })
      .getOne();
    if (!supplier) {
      throw new NotFoundException('لا يوجد مورد بهذا المعرف.');
    }
    return supplier;
  }
  async findOneByUsername(tenant_id: string, user_name: string) {
    const supplier = await this.suppliersRepo.findOne({
      where: { tenant_id, user_name },
    });
    if (!supplier) {
      throw new NotFoundException('لا يوجد مورد بهذا المعرف.');
    }
    return supplier;
  }
  async findAll(tenant_id: string) {
    const suppliersData = await this.suppliersRepo
      .createQueryBuilder('sub')
      .leftJoin('sub.bills', 'bill', 'bill.is_paid = false')
      .addSelect(['bill.id', 'bill.price'])
      .leftJoin('bill.pay_bills', 'payBill')
      .addSelect(['payBill.id', 'payBill.amount'])
      .where('sub.tenant_id = :tenant_id', { tenant_id })
      .orderBy('sub.created_at', 'DESC')
      .getMany();
    const suppliers = suppliersData.map((e) => {
      let fullPrice = 0;
      let totalPaid = 0;
      for (const bill of e.bills) {
        fullPrice += Number(bill.price);
        for (const payBill of bill.pay_bills) {
          totalPaid += Number(payBill.amount);
        }
      }
      return {
        id: e.id,
        user_name: e.user_name,
        created_at: e.created_at,
        unpaid_total: fullPrice - totalPaid,
      };
    });
    return {
      suppliers,
      total: suppliers.length,
    };
  }
  //! pay
  async paySupplier(
    tenant_id: string,
    { cost_id, installment, note }: PaySupplierDto,
  ) {
    const cost = await this.productsService.findOneCost(
      tenant_id,
      cost_id,
      true,
    );
    const alreadyPaid =
      cost.pay_bills?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const totalPay = Math.round(alreadyPaid + Number(installment));
    const costPrice = Math.round(Number(cost.price));

    if (cost.is_paid || costPrice <= Math.round(alreadyPaid)) {
      throw new ConflictException('هذه الفاتورة مسددة بالكامل.');
    }
    if (totalPay > costPrice) {
      throw new ConflictException(
        'القسط المراد دفعه اكبر من الدين الخاص بك لهذه الفاتورة.',
      );
    }
    const pay = this.SuppliersPaymentsRepo.create({
      tenant_id,
      cost,
      amount: installment,
      note,
    });
    if (totalPay === costPrice) {
      cost.is_paid = true;
      await this.productsService.UpdateCost(cost);
    }
    try {
      await this.SuppliersPaymentsRepo.save(pay);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: `تم تسديد قسط فاتورة بنجاح`,
    };
  }
  async suppliersPaymentsBills(tenant_id: string, cost_id: string) {
    const [bills, total] = await this.SuppliersPaymentsRepo.findAndCount({
      where: { tenant_id, cost: { id: cost_id } },
      order: { created_at: 'DESC' },
    });
    if (!bills) {
      throw new NotFoundException(`لا يوجد فاتورة تكاليف بهذا المعرف.`);
    }
    return {
      bills,
      total,
    };
  }
  //* search engine
  async searchEngine(
    tenant_id: string,
    searchin: 'suppliers',
    searchwith: string,
  ) {
    if (searchin === 'suppliers') {
      const query = this.suppliersRepo
        .createQueryBuilder('supplier')
        .where('supplier.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            qb.where('supplier.user_name ILIKE :termStart', {
              termStart: `${searchwith.toLowerCase()}%`,
            }).orWhere('supplier.user_name ILIKE :termEnd', {
              termEnd: `%${searchwith.toLowerCase()}`,
            });
          }),
        )
        .leftJoin('supplier.bills', 'bill', 'bill.is_paid = false')
        .addSelect(['bill.id', 'bill.price'])
        .leftJoin('bill.pay_bills', 'payBill')
        .addSelect(['payBill.id', 'payBill.amount']);

      const [suppliersData, total] = await query
        .orderBy('supplier.created_at', 'DESC')
        .getManyAndCount();
      const results = suppliersData.map((e) => {
        let fullPrice = 0;
        let totalPaid = 0;
        for (const bill of e.bills) {
          fullPrice += Number(bill.price);
          for (const payBill of bill.pay_bills) {
            totalPaid += Number(payBill.amount);
          }
        }
        return {
          id: e.id,
          user_name: e.user_name,
          created_at: e.created_at,
          unpaid_total: fullPrice - totalPaid,
        };
      });
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}
