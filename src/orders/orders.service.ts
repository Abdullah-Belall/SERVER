import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { OrdersEntity } from './entities/order.entity';
import { OrderItemsEntity } from './entities/order-items.entity';
import { PaymentsEntity } from './entities/payments.entity';
import { ClientsService } from 'src/clients/clients.service';
import { ProductsService } from 'src/products/products.service';
import { ErrorMsg, StartYear } from 'src/utils/base';
import { ReturnEntity } from './entities/return.entity';
import { ReturnsItemsEntity } from './entities/returns-items.entity';
import { TelegramService } from 'src/telegram/telegram.service';
import { TenantsService } from 'src/tenants/tenants.service';
import { InstallmentsEntity } from './entities/intallments.entity';
import {
  InstallmentTypeEnum,
  PaidStatusEnum,
} from 'src/types/enums/product.enum';
import * as dayjs from 'dayjs';
import { CarsService } from 'src/cars/cars.service';
import { CreateOrderNoSortDto } from './dto/create-order-nosort.dto';
import { PdfGeneratorService } from 'src/pdf-generator/pdf-generator.service';
import * as fs from 'fs';
import { shortIdGenerator } from 'src/pdf-generator/view/rabi3-bill.view';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrdersEntity)
    private readonly ordersRepo: Repository<OrdersEntity>,
    @InjectRepository(OrderItemsEntity)
    private readonly ItemsRepo: Repository<OrderItemsEntity>,
    @InjectRepository(PaymentsEntity)
    private readonly paymentsRepo: Repository<PaymentsEntity>,
    @InjectRepository(ReturnEntity)
    private readonly returnRepo: Repository<ReturnEntity>,
    @InjectRepository(ReturnsItemsEntity)
    private readonly returnsItemsRepo: Repository<ReturnsItemsEntity>,
    @InjectRepository(InstallmentsEntity)
    private readonly installmentsRepo: Repository<InstallmentsEntity>,
    private readonly clientsService: ClientsService,
    private readonly productsService: ProductsService,
    private readonly telegramService: TelegramService,
    private readonly tenantsService: TenantsService,
    private readonly carsService: CarsService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}
  //! client repo
  async findOrdersWithPaymentToday(type: 'daily' | 'weekly') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const orders = this.ordersRepo
      .createQueryBuilder('order')
      .innerJoin('order.payment', 'payment')
      .leftJoin('payment.installments', 'installment')
      .innerJoin('order.client', 'client')
      .leftJoin('client.contacts', 'contacts');
    if (type === 'daily') {
      orders
        .where('payment.next_payment_date BETWEEN :todayStart AND :todayEnd', {
          todayStart,
          todayEnd,
        })
        .andWhere('payment.status = :status', { status: 'installments' });
    } else {
      orders
        .where('payment.status = :pendingStatus', {
          pendingStatus: 'pending',
        })
        .orWhere(
          new Brackets((qb) => {
            qb.where('payment.status = :installmentsStatus', {
              installmentsStatus: 'installments',
            }).andWhere(
              'payment.next_payment_date BETWEEN :sevenDaysAgo AND :todayEnd',
              {
                sevenDaysAgo,
                todayEnd,
              },
            );
          }),
        );
    }

    return await orders
      .select([
        'order.id',
        'order.tenant_id',
        'order.short_id',
        'order.total_price_after',
        'order.tax',
        'order.discount',
        'payment.id',
        'payment.installment_type',
        'payment.down_payment',
        'payment.installment',
        'installment.id',
        'installment.amount',
        'client.id',
        'client.user_name',
        'contacts.id',
        'contacts.phone',
      ])
      .getMany();
  }
  //! client repo
  // async installmentsReminder(type: 'daily' | 'weekly') {
  //   const orders = await this.findOrdersWithPaymentToday(type);
  //   const readyForMessage = orders.map((e) => {
  //     const total_price =
  //       Number(e.total_price) +
  //       (Number(e.total_price) * (e.tax !== '0' ? Number(e.tax) : 100)) / 100 +
  //       (Number(e.additional_fees) || 0) -
  //       (Number(e.discount) || 0);
  //     let alreadyPaid;
  //     let due;
  //     if (e.payment.status === 'installments') {
  //       alreadyPaid =
  //         (Number(e.payment.down_payment) || 0) +
  //         e.payment.installments.reduce(
  //           (acc, curr) => acc + Number(curr.amount),
  //           0,
  //         );

  //       due = Number(total_price) - Number(alreadyPaid);
  //     }
  //     return {
  //       tenant_id: e.tenant_id,
  //       short_id: e.short_id.slice(4),
  //       user_name: e.client.user_name,
  //       paid_so_far: alreadyPaid,
  //       total_price,
  //       status: e.payment.status,
  //       installment_type: e.payment.installment_type,
  //       installment:
  //         e.payment.installment > total_price - alreadyPaid
  //           ? due
  //           : e.payment.installment,
  //       contacts: e.client.contacts.map((con) => con.phone + '\n'),
  //     };
  //   });
  //   for (const order of readyForMessage) {
  //     const chatId = (
  //       await this.tenantsService.getTenantByTenantId(order.tenant_id)
  //     )?.telegram_chat_id;
  //     if (chatId) {
  //       try {
  //         if (order.short_id === readyForMessage[0].short_id) {
  //           await this.telegramService.sendMessage(
  //             chatId,
  //             `
  //             <b style='font-weight: bold;' >${type === 'daily' ? 'اقساط تاريخ تحصيلها اليوم' : 'اقساط لم تحصل وتاريخ تحصيلها فات.'}</b>\n
  //             `,
  //           );
  //         }
  //         await this.telegramService.sendMessage(
  //           chatId,
  //           `
  //           ${type === 'daily' && '<b>⏰ قسط مستحق اليوم</b>\n'}
  //           <b>رقم الفاتورة:</b> ${order.short_id}\n
  //           <b>الفاتورة كاملة:</b> ${order.total_price} ج.م\n
  //           <b>المسدد حتي الأن:</b> ${order.paid_so_far} ج.م\n
  //           <b>القسط المستحق:</b> ${order.installment} ج.م\n
  //           <b>نوع التقسيط:</b> ${getSlug(order.installment_type, periodsArray)}\n
  //           <b>اسم العميل:</b> ${order.user_name}\n
  //           <b>ارقام تواصل:</b> ${order.contacts.length === 0 ? 'لا يوجد' : order.contacts}\n
  //           `,
  //         );
  //       } catch (err) {
  //         console.error(err);
  //       }
  //     }
  //   }
  // }
  //! client repo
  // @Cron('0 8 * * *', {
  //   timeZone: 'Africa/Cairo',
  // })
  // async dailyReminder() {
  //   await this.installmentsReminder('daily');
  // }
  //! client repo
  // @Cron('0 9 * * 2', {
  //   timeZone: 'Africa/Cairo',
  // })
  // async weeklyReminder() {
  //   await this.installmentsReminder('weekly');
  // }
  //! =========================
  async findOrderInstallments(tenant_id: string, order_id: string) {
    const [installments, total] = await this.installmentsRepo.findAndCount({
      where: {
        tenant_id,
        payment: {
          order: {
            id: order_id,
          },
        },
      },
      order: { created_at: 'DESC' },
    });
    return {
      installments,
      total,
    };
  }

  async saveOrder(order: OrdersEntity) {
    let savedOrder;
    try {
      savedOrder = await this.ordersRepo.save(order);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return savedOrder;
  }

  private async getNextShortId(tenant_id: string): Promise<number> {
    const result = await this.ordersRepo
      .createQueryBuilder('order')
      .select('MAX(order.short_id)', 'maxShortId')
      .where('order.tenant_id = :tenant_id', { tenant_id })
      .getRawOne();

    return (result?.maxShortId || 0) + 1;
  }
  async createOrder(
    tenant_id: string,
    {
      car_id,
      product_sorts,
      payment_method,
      paid_status,
      tax,
      discount,
      additional_fees,
      installment_type,
      installment,
      down_payment,
    }: CreateOrderDto,
  ) {
    if (+tax > 99 || +tax < 1) throw new BadRequestException();
    const car = await this.carsService.findOneCar(
      tenant_id,
      car_id,
      false,
      true,
    );
    const parseData = JSON.parse(product_sorts);
    let additional_band;
    if (parseData[parseData.length - 1] === 'band') {
      additional_band = parseData[parseData.length - 2];
      parseData.splice(parseData.length - 2, 2);
    }
    const order = this.ordersRepo.create({
      car,
      total_price_after: 0,
      short_id: await this.getNextShortId(tenant_id),
      tax,
      discount,
      tenant_id,
    });
    let savedOrder = await this.saveOrder(order);
    const orderItemsPrepare = [];
    let total_price = Number(additional_fees || 0);
    for (const item of parseData) {
      const productSort = await this.productsService.findOneSort(
        tenant_id,
        item.product_id,
      );
      if (!productSort) {
        await this.ordersRepo.delete({ id: savedOrder.id });
        throw new NotFoundException(`لا يوجد صنف بمعرف ${item.product_id}.`);
      }

      if (productSort.qty < item.qty) {
        await this.ordersRepo.delete({ id: savedOrder.id });
        throw new ConflictException(
          `الكمية المتاحة من الصنف صاحب المعرف ${item.product_id} غير كافية.`,
        );
      }
      total_price += +productSort.unit_price * item.qty;
      orderItemsPrepare.push({
        product: productSort.product,
        sort: productSort,
        qty: item.qty,
        order,
        unit_price: productSort.unit_price,
      });
    }
    if (
      discount >
      Number(
        total_price *
          (tax && tax !== '' && tax !== '0' ? Number(tax) / 100 + 1 : 1),
      )
    ) {
      await this.ordersRepo.delete({ id: savedOrder.id });
      throw new ConflictException(
        'لا يمكن ان يكون الخصم اكبر من الفاتورة كاملة.',
      );
    }
    for (const item of orderItemsPrepare) {
      const totalCostForItem = this.productsService.countCostPriceForOrder(
        item.sort,
        item.qty,
      );
      await this.productsService.updateSortQtyOrders(
        tenant_id,
        item.sort.id,
        item.sort.qty - item.qty,
      );
      const orderItem = this.ItemsRepo.create({
        tenant_id,
        ...item,
        total_cost_price: totalCostForItem,
      });
      await this.ItemsRepo.save(orderItem);
    }
    const now = dayjs();
    let next_payment_date;
    switch (installment_type) {
      case InstallmentTypeEnum.WEEKLY:
        next_payment_date = now.add(1, 'week').toDate();
        break;
      case InstallmentTypeEnum.MONTH:
        next_payment_date = now.add(1, 'month').toDate();
        break;
      case InstallmentTypeEnum.QUARTER:
        next_payment_date = now.add(3, 'month').toDate();
        break;
      case InstallmentTypeEnum.HALFYEAR:
        next_payment_date = now.add(6, 'month').toDate();
        break;
      case InstallmentTypeEnum.YEAR:
        next_payment_date = now.add(1, 'year').toDate();
        break;
      default:
        next_payment_date = null;
        break;
    }
    const payment = this.paymentsRepo.create({
      payment_method,
      status: paid_status,
      order: savedOrder,
      tenant_id,
      installment_type,
      installment,
      down_payment,
      next_payment_date,
      paid_installments_count: 0,
    });
    const savedPayment = await this.paymentsRepo.save(payment);
    if (additional_band) {
      await this.ItemsRepo.save(
        this.ItemsRepo.create({
          tenant_id,
          total_cost_price: 0,
          qty: 1,
          unit_price: additional_fees,
          order: savedOrder,
          additional_band: additional_band?.product_id,
        }),
      );
    }
    const finalSave = {
      ...savedOrder,
      total_price_after:
        total_price *
          (tax && tax !== '' && tax !== '0' ? Number(tax) / 100 + 1 : 1) -
        (discount ? Number(discount) : 0),
    };
    if (car.client.balance > 0) {
      const balance =
        Number(car.client.balance) - Number(finalSave.total_price_after);
      let takeFromBalance = 0;
      if (Number(car.client.balance) > Number(finalSave.total_price_after)) {
        takeFromBalance = Number(finalSave.total_price_after);
      } else {
        takeFromBalance = Number(car.client.balance);
      }
      savedPayment.client_balance = takeFromBalance;
      await this.paymentsRepo.save(savedPayment);
      await this.clientsService.saveClient({
        ...car.client,
        balance: balance > 0 ? balance : 0,
      });
    }
    await this.saveOrder(finalSave);
    const orderDone = await this.findOne(savedOrder.id, tenant_id);

    const tenant = await this.tenantsService.getTenantByTenantId(tenant_id);
    if (tenant?.chat_ids?.length > 0) {
      this.sendPdfInvoice(
        orderDone,
        tenant.domain,
        tenant.chat_ids?.map((e) => e.chat_id),
      ).catch((error) => console.error('Error sending PDF invoice:', error));
    }
    // if (chatId) {
    //   try {
    //     await this.telegramService.sendMessage(
    //       chatId,
    //       `
    //       <b>🧾 فاتورة مبيعات</b>\n
    //       <b>رقم الفاتورة:</b> ${orderDone.short_id}\n
    //       <b>العميل:</b> ${orderDone.car?.client.user_name}\n
    //       <b>ضريبة القيمة المضافة:</b> ${orderDone.tax}\n
    //       <b>الخصم:</b> ${orderDone.discount}\n
    //       <b>اجمالي السعر:</b> ${Number(orderDone.total_price_after)?.toFixed(2) || 0}\n
    //       <b>وسيلة الدفع:</b> ${getSlug(orderDone.payment?.payment_method, PaymentMethodsSlugs)}\n
    //       <b>حالة الدفع:</b> ${getSlug(orderDone.payment?.status, PaidStatusSlug)}\n
    //       <b>تاريخ انشاء الفاتورة:</b> ${formatDate(orderDone?.created_at)}
    //       `,
    //     );
    //   } catch (err) {
    //     console.error(err);
    //   }
    // }
    return {
      done: true,
      order: orderDone,
    };
  }
  async sendPdfInvoice(order: any, domain: string, chatIds: string[]) {
    const orderForPdf = {
      bills: {
        type: 'order',
        bill_id: order.short_id,
        car: order.car,
        data: order.order_items,
        totals: {
          totalPrice: order.total_price_after,
          tax: order.tax,
          discount: order.discount,
          payment_method: order.payment?.payment_method,
          paid_status: order.payment?.status,
          created_at: order.created_at,
          installment_type: order.payment?.installment_type,
          take_from_client_balance: order?.payment?.client_balance,
          client_balance: order?.car?.client?.balance,
          down_payment: order.payment?.down_payment,
          installment: order.payment?.installment,
          client_depts: order.client_depts,
        },
      },
    };
    const filePath = await this.pdfGeneratorService.generateInvoicePdf(
      domain,
      orderForPdf,
      `${shortIdGenerator(orderForPdf?.bills?.bill_id)}-${orderForPdf?.bills?.car?.client?.user_name}-${orderForPdf?.bills?.car?.mark}`,
      'rabi3-bill',
    );

    for (const chat_id of chatIds) {
      await this.telegramService.sendTelegramPDF(chat_id, filePath);
    }
    fs.unlinkSync(filePath);
  }
  async createOrderNoSorts(
    tenant_id: string,
    {
      car_id,
      payment_method,
      paid_status,
      tax,
      discount,
      additional_fees,
      installment_type,
      installment,
      down_payment,
      additional_band,
    }: CreateOrderNoSortDto,
  ) {
    if (+tax > 99 || +tax < 1) throw new BadRequestException();
    const car = await this.carsService.findOneCar(
      tenant_id,
      car_id,
      false,
      true,
    );
    const now = dayjs();
    let next_payment_date;
    switch (installment_type) {
      case InstallmentTypeEnum.WEEKLY:
        next_payment_date = now.add(1, 'week').toDate();
        break;
      case InstallmentTypeEnum.MONTH:
        next_payment_date = now.add(1, 'month').toDate();
        break;
      case InstallmentTypeEnum.QUARTER:
        next_payment_date = now.add(3, 'month').toDate();
        break;
      case InstallmentTypeEnum.HALFYEAR:
        next_payment_date = now.add(6, 'month').toDate();
        break;
      case InstallmentTypeEnum.YEAR:
        next_payment_date = now.add(1, 'year').toDate();
        break;
      default:
        next_payment_date = null;
        break;
    }
    const order = this.ordersRepo.create({
      car,
      total_price_after:
        additional_fees *
          (tax && tax.toString().trim().length > 0
            ? Number(tax) / 100 + 1
            : 1) -
        Number(discount || 0),
      short_id: await this.getNextShortId(tenant_id),
      tax,
      discount,
      tenant_id,
    });

    let savedOrder = await this.saveOrder(order);
    const payment = this.paymentsRepo.create({
      payment_method,
      status: paid_status,
      order: savedOrder,
      tenant_id,
      installment_type,
      installment,
      down_payment,
      next_payment_date,
      paid_installments_count: 0,
    });
    const savedPayment = await this.paymentsRepo.save(payment);

    const order_item = await this.ItemsRepo.save(
      this.ItemsRepo.create({
        tenant_id,
        total_cost_price: 0,
        qty: 1,
        unit_price: additional_fees,
        order: savedOrder,
        additional_band: additional_band,
      }),
    );
    if (car.client.balance > 0) {
      const balance =
        Number(car.client.balance) - Number(savedOrder.total_price_after);
      let takeFromBalance = 0;
      if (Number(car.client.balance) > Number(savedOrder.total_price_after)) {
        takeFromBalance = Number(savedOrder.total_price_after);
      } else {
        takeFromBalance = Number(car.client.balance);
      }
      savedPayment.client_balance = takeFromBalance;
      await this.paymentsRepo.save(savedPayment);
      await this.clientsService.saveClient({
        ...car.client,
        balance: balance > 0 ? balance : 0,
      });
    }
    await this.saveOrder({ ...savedOrder, payment, order_items: [order_item] });
    const orderDone = await this.findOne(savedOrder.id, tenant_id);
    const tenant = await this.tenantsService.getTenantByTenantId(tenant_id);
    if (tenant?.chat_ids?.length > 0) {
      this.sendPdfInvoice(
        orderDone,
        tenant.domain,
        tenant.chat_ids?.map((e) => e.chat_id),
      ).catch((error) => console.error('Error sending PDF invoice:', error));
    }
    // if (chatId) {
    //   try {
    //     await this.telegramService.sendMessage(
    //       chatId,
    //       `
    //       <b>🧾 فاتورة مبيعات</b>\n
    //       <b>رقم الفاتورة:</b> ${orderDone.short_id}\n
    //       <b>العميل:</b> ${orderDone.car?.client.user_name}\n
    //       <b>ضريبة القيمة المضافة:</b> ${orderDone.tax}\n
    //       <b>الخصم:</b> ${orderDone.discount}\n
    //       <b>اجمالي السعر:</b> ${orderDone.total_price_after.toFixed(2)}\n
    //       <b>وسيلة الدفع:</b> ${getSlug(orderDone.payment?.payment_method, PaymentMethodsSlugs)}\n
    //       <b>حالة الدفع:</b> ${getSlug(orderDone.payment?.status, PaidStatusSlug)}\n
    //       <b>تاريخ انشاء الفاتورة:</b> ${formatDate(orderDone?.created_at)}
    //       `,
    //     );
    //   } catch (err) {
    //     console.error(err);
    //   }
    // }
    return {
      done: true,
      order: orderDone,
    };
  }
  async getAllOrders(tenant_id: string) {
    const [data, total] = await this.ordersRepo
      .createQueryBuilder('order')
      .where('order.tenant_id = :tenant_id', { tenant_id })
      .leftJoin('order.order_items', 'item')
      .addSelect(['item.id', 'item.total_cost_price'])
      .leftJoin('order.payment', 'payment')
      .addSelect([
        'payment.id',
        'payment.payment_method',
        'payment.status',
        'payment.installment_type',
        'payment.down_payment',
        'payment.client_balance',
        'payment.installment',
        'payment.paid_installments_count',
        'payment.next_payment_date',
      ])
      .leftJoin('order.car', 'car')
      .addSelect(['car.id', 'car.mark'])
      .leftJoin('car.client', 'client')
      .addSelect(['client.id', 'client.user_name'])
      .orderBy('order.short_id', 'DESC')
      .getManyAndCount();
    const orders = data.map((e) => {
      const total_cost_price = e.order_items?.reduce(
        (acc, curr) => acc + Number(curr.total_cost_price),
        0,
      );
      delete e.order_items;
      return {
        ...e,
        total_cost_price,
      };
    });
    return {
      orders,
      total,
    };
  }
  async ordersCollector(tenant_id: string, ids: string[]) {
    if (ids.length <= 0) {
      throw new BadRequestException();
    }
    const orders = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_items', 'item')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('payment.installments', 'installment')
      .leftJoinAndSelect('order.car', 'car')
      .leftJoinAndSelect('car.client', 'client')
      .leftJoinAndSelect('order.return', 'return')
      .loadRelationCountAndMap('return.return_count', 'return.returns_items')
      .leftJoinAndSelect('item.sort', 'sort')
      .leftJoinAndSelect('sort.product', 'product')
      .where('order.tenant_id = :tenant_id', { tenant_id })
      .andWhere('order.id IN (:...ids)', { ids })
      .select([
        'order.id',
        'order.short_id',
        'order.total_price_after',
        'order.tax',
        'order.discount',
        'return.id',
        'payment.status',
        'payment.down_payment',
        'payment.payment_method',
        'payment.client_balance',
        'installment.id',
        'installment.amount',
        'order.created_at',
        'car.id',
        'car.mark',
        'car.plate',
        'car.type',
        'client.id',
        'client.user_name',
        'client.balance',
        'item.id',
        'item.qty',
        'item.unit_price',
        'item.additional_band',
        'sort.id',
        'sort.name',
        'sort.size',
        'sort.color',
        'product.id',
        'product.name',
        'product.material',
      ])
      .getMany();
    const order_items = [];
    const paidOrders: OrdersEntity[] = [];
    const notPaidOrders: OrdersEntity[] = [];
    const installmentsOrders: OrdersEntity[] = [];
    for (const order of orders) {
      order_items.push(...order.order_items);
      if (order.payment?.status === PaidStatusEnum.PAID) {
        paidOrders.push(order);
      } else if (order.payment?.status === PaidStatusEnum.PENDING) {
        notPaidOrders.push(order);
      } else {
        installmentsOrders.push(order);
      }
    }
    let paidOrdersTotalPrice = 0;
    let paidOrdersClientBalance = 0;
    for (const order of paidOrders) {
      paidOrdersTotalPrice += Number(order.total_price_after);
      paidOrdersClientBalance += Number(order.payment?.client_balance);
    }
    //! -------------------
    let notPaidOrdersTotalPrice = 0;
    let notPaidOrdersClientBalance = 0;
    for (const order of notPaidOrders) {
      notPaidOrdersTotalPrice += Number(order.total_price_after);
      notPaidOrdersClientBalance += Number(order.payment?.client_balance);
    }
    let clientDeptNotPaidOrders =
      notPaidOrdersTotalPrice - notPaidOrdersClientBalance;
    //! -------------------
    let installmentsOrdersTotalPrice = 0;
    let installmentsOrdersClientBalance = 0;
    let downPayment = 0;
    let totalInstallments = 0;
    for (const order of installmentsOrders) {
      installmentsOrdersTotalPrice += Number(order.total_price_after);
      installmentsOrdersClientBalance += Number(order.payment?.client_balance);
      downPayment += Number(order.payment?.down_payment || 0);
      totalInstallments += Number(
        order.payment?.installments?.reduce(
          (acc, curr) => acc + Number(curr.amount || 0),
          0,
        ),
      );
    }
    let clientDeptsInstallmentsOrders =
      installmentsOrdersTotalPrice -
      (installmentsOrdersClientBalance + downPayment + totalInstallments);
    const order: any = orders[0];
    order.order_items = order_items;
    order.total_price_after =
      paidOrdersTotalPrice +
      notPaidOrdersTotalPrice +
      installmentsOrdersTotalPrice;
    order.payment.client_balance =
      paidOrdersClientBalance +
      notPaidOrdersClientBalance +
      installmentsOrdersClientBalance;
    order.payment.down_payment = downPayment;
    order.client_depts =
      clientDeptsInstallmentsOrders + clientDeptNotPaidOrders;
    return order;
  }
  async findOne(id: string, tenant_id: string) {
    const order: any = await this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin('order.order_items', 'item')
      .leftJoin('order.payment', 'payment')
      .leftJoin('payment.installments', 'installment')
      .leftJoin('order.car', 'car')
      .leftJoin('car.client', 'client')
      .leftJoin('client.contacts', 'contact')
      .leftJoin('order.return', 'return')
      .loadRelationCountAndMap('return.return_count', 'return.returns_items')
      .leftJoin('item.sort', 'sort')
      .leftJoin('sort.product', 'product')
      .where('order.tenant_id = :tenant_id', { tenant_id })
      .andWhere('order.id = :id', { id })
      .select([
        'order.id',
        'order.short_id',
        'order.total_price_after',
        'order.tax',
        'order.discount',
        'return.id',
        'payment.status',
        'payment.payment_method',
        'payment.client_balance',
        'payment.down_payment',
        'installment.id',
        'installment.amount',
        'order.created_at',
        'car.id',
        'car.mark',
        'car.plate',
        'car.type',
        'client.id',
        'client.user_name',
        'client.balance',
        'contact.id',
        'contact.phone',
        'item.id',
        'item.qty',
        'item.unit_price',
        'item.additional_band',
        'item.total_cost_price',
        'sort.id',
        'sort.name',
        'sort.size',
        'sort.color',
        'product.id',
        'product.name',
        'product.material',
      ])
      .getOne();

    if (!order) throw new NotFoundException('No Order Found.');
    order.client_depts = 0;
    if (order.payment.status === PaidStatusEnum.PENDING) {
      order.client_depts =
        order.total_price_after - (order.payment.client_balance || 0);
    }
    if (order.payment.status === PaidStatusEnum.INSTALLMENTS) {
      order.client_depts =
        order.total_price_after -
        (Number(order.payment.client_balance || 0) +
          Number(order.payment.down_payment || 0) +
          Number(
            order.payment.installments.reduce(
              (acc, curr) => acc + Number(curr.amount),
              0,
            ),
          ));
    }
    return order;
  }
  getTax(tax: string) {
    return !tax || tax == '' || tax == '0' ? Number(1) : Number(tax) / 100 + 1;
  }
  async updateOrder(
    tenant_id: string,
    id: string,
    updateOrderDto: UpdateOrderDto,
  ) {
    const {
      installment_type,
      discount,
      payment_method,
      paid_status,
      client_balance,
      tax,
    } = updateOrderDto;
    const order = await this.ordersRepo.findOne({
      where: { id, tenant_id },
      relations: ['payment', 'payment.installments', 'car', 'car.client'],
    });
    if (!order)
      throw new NotFoundException('الفاتورة المراد تعديله غير موجود.');
    const total_price =
      (Number(order.total_price_after) + Number(order.discount)) /
      this.getTax(order.tax);
    if (
      discount >
      Number(
        total_price * (order.tax !== '0' ? Number(order.tax) / 100 + 1 : 1),
      )
    )
      throw new ConflictException(
        'لا يمكن ان يكون الخصم اكبر من الفاتورة كاملة.',
      );
    if (tax && Number(order.tax) !== Number(tax)) {
      let totalAfter = Number(order.total_price_after);
      totalAfter += Number(order.discount) || 0;
      totalAfter *= 1 / Number(`1.${order.tax || 0}`);
      totalAfter *= Number(`1.${tax || 0}`);
      totalAfter -= Number(order.discount) || 0;
      order.tax = tax;
      order.total_price_after = Number(totalAfter);
    }
    if (
      (discount || Number(discount) === 0) &&
      Number(order.discount) !== Number(discount)
    ) {
      let totalAfter = Number(order.total_price_after);
      totalAfter += Number(order.discount) || 0;
      totalAfter -= Number(discount) || 0;
      order.discount = discount;
      order.total_price_after = Number(totalAfter);
    }
    const payment = order.payment;
    if (
      payment.status === PaidStatusEnum.PENDING &&
      paid_status === PaidStatusEnum.PAID
    ) {
      payment.paid_at = dayjs().toDate();
    }
    Object.assign(payment, {
      installment_type,
      payment_method,
      status: paid_status,
    });
    if (Number(client_balance || 0) !== Number(payment.client_balance || 0)) {
      let balance = order.car.client.balance || 0;
      balance = Number(balance) + Number(payment.client_balance || 0);
      if (balance < Number(client_balance || 0)) {
        throw new ConflictException('لا يوجد بحساب العميل ميزانية كافية.');
      }
      balance -= Number(client_balance || 0);
      payment.client_balance = Number(client_balance || 0);
      await this.clientsService.saveClient({
        ...order.car.client,
        balance,
      });
    }
    try {
      await this.ordersRepo.save(order);
      await this.paymentsRepo.save(payment);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
    return {
      done: true,
      message: 'تم تعديل الطلب بنجاح.',
    };
  }
  async payInstallment(
    tenant_id: string,
    orderId: string,
    installment: number,
  ) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, tenant_id },
      relations: ['payment', 'payment.installments'],
    });
    if (!order) {
      throw new NotFoundException('لا توجد فاتورة بهذا المعرف.');
    }
    const payment = order.payment;
    const totalPaid =
      payment.installments.reduce((acc, curr) => acc + Number(curr.amount), 0) +
      payment.down_payment;
    const totalPriceAfter = order.total_price_after;
    if (Math.floor(totalPriceAfter) - Math.floor(totalPaid) < installment) {
      throw new ConflictException(`القسط المراد دفعه اكبر من اجمالي المستحق.`);
    }
    payment.paid_installments_count = payment.paid_installments_count
      ? payment.paid_installments_count + 1
      : 1;
    const now = payment.next_payment_date
      ? dayjs(payment.next_payment_date)
      : dayjs();
    switch (payment.installment_type) {
      case InstallmentTypeEnum.WEEKLY:
        payment.next_payment_date = now.add(1, 'week').toDate();
        break;
      case InstallmentTypeEnum.MONTH:
        payment.next_payment_date = now.add(1, 'month').toDate();
        break;
      case InstallmentTypeEnum.QUARTER:
        payment.next_payment_date = now.add(3, 'month').toDate();
        break;
      case InstallmentTypeEnum.HALFYEAR:
        payment.next_payment_date = now.add(6, 'month').toDate();
        break;
      case InstallmentTypeEnum.YEAR:
        payment.next_payment_date = now.add(1, 'year').toDate();
        break;
      default:
        payment.next_payment_date = null;
        break;
    }
    const installment_item = this.installmentsRepo.create({
      tenant_id,
      payment,
      amount: installment,
    });
    try {
      await this.paymentsRepo.save(payment);
      await this.installmentsRepo.save(installment_item);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تسديد القسط بنجاح.',
    };
  }
  async getCarOrders(tenant_id: string, car_id: string) {
    const [data, total] = await this.ordersRepo.findAndCount({
      where: {
        tenant_id,
        car: {
          id: car_id,
        },
      },
      relations: ['car', 'car.client', 'payment', 'order_items'],
      select: {
        car: {
          id: true,
          mark: true,
          plate: true,
          client: {
            id: true,
            user_name: true,
          },
        },
        order_items: {
          id: true,
          total_cost_price: true,
        },
      },
    });
    const orders = data.map((e) => {
      const total_cost_price = e.order_items?.reduce(
        (acc, curr) => acc + Number(curr.total_cost_price),
        0,
      );
      delete e.order_items;
      return {
        ...e,
        total_cost_price,
      };
    });
    return {
      orders,
      total,
    };
  }
  //* ===================
  async makeReturn(tenant_id: string, order_id: string, data: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: order_id, tenant_id },
      relations: ['return', 'payment'],
    });
    if (!order) {
      throw new NotFoundException('لا يوجد طلب بهذا المعرف.');
    }
    const parseData = JSON.parse(data);
    let returnRecord = order.return;
    if (!order.return) {
      const returnReady = this.returnRepo.create({
        order,
        tenant_id,
        short_id: (await this.returnRepo.count({ where: { tenant_id } })) + 1,
      });
      try {
        const savedReturn = await this.returnRepo.save(returnReady);
        order.return = savedReturn;
        await this.ordersRepo.save(order);
        returnRecord = savedReturn;
      } catch (err) {
        console.error(err);
        throw new InternalServerErrorException(ErrorMsg);
      }
    }
    let countLoseMoney = 0;
    for (const item of parseData) {
      const order_item = await this.ItemsRepo.findOne({
        where: { id: item.item_id, tenant_id },
        relations: ['sort'],
      });
      if (!order_item)
        throw new NotFoundException(
          `لا يوجد عنصر لطلب بهذا المعرف ${item.item_id}.`,
        );
      if (order_item.qty < item.qty)
        throw new ConflictException(
          `الكمية المراد ارجاعها لعنصر من العناصر اكبر من الكمية الفعلية.`,
        );
      const returnsItemsReady = this.returnsItemsRepo.create({
        return: returnRecord,
        qty: item.qty,
        unit_price: order_item.unit_price,
        order_item,
        tenant_id,
      });
      try {
        await this.returnsItemsRepo.save(returnsItemsReady);
        await this.ItemsRepo.save({
          ...order_item,
          total_cost_price:
            (order_item.total_cost_price / order_item.qty) *
            (order_item.qty - item.qty),
          qty: order_item.qty - item.qty,
        });
        await this.productsService.updateSortQtyOrders(
          tenant_id,
          order_item.sort.id,
          item.qty + order_item.sort.qty,
        );
        countLoseMoney += item.qty * Number(order_item.unit_price);
      } catch (err) {
        console.error(err);
        throw new InternalServerErrorException(ErrorMsg);
      }
    }
    const total_price =
      Number(order.total_price_after) +
      (order.discount ? Number(order.discount) : 0) /
        (order.tax && order.tax !== '' && order.tax !== '0'
          ? Number(order.tax) / 100 + 1
          : 1) -
      countLoseMoney;
    const total_price_after =
      Number(total_price) *
        (order.tax && order.tax !== '' && order.tax !== '0'
          ? Number(order.tax) / 100 + 1
          : 1) -
      (order.discount ? Number(order.discount) : 0);
    await this.saveOrder({
      ...order,
      total_price_after,
    });
    return {
      done: true,
      order: await this?.findOne(order_id, tenant_id),
    };
  }

  async deleteOrder(tenant_id: string, order_id: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: order_id, tenant_id },
      relations: [
        'payment',
        'payment.installments',
        'return',
        'return.returns_items',
        'order_items',
        'order_items.sort',
        'order_items.sort.product',
        'car',
        'car.client',
      ],
    });
    if (!order) {
      throw new NotFoundException('لا يوجد فاتورة بهذا المعرف.');
    }
    if (Number(order.payment.client_balance || 0) > 0) {
      await this.clientsService.saveClient({
        ...order.car.client,
        balance:
          Number(order.car.client.balance || 0) +
          Number(order.payment.client_balance || 0),
      });
    }
    const installments = order.payment.installments;
    if (installments && installments.length > 0) {
      await this.installmentsRepo.delete(installments.map((i) => i.id));
    }
    if (order.return?.returns_items && order.return.returns_items.length > 0) {
      await this.returnsItemsRepo.delete(
        order.return.returns_items.map((item) => item.id),
      );
    }
    const order_items = order.order_items;
    if (order_items && order_items.length > 0) {
      for (const item of order_items) {
        if (item.sort) {
          await this.productsService.updateSortQtyOrders(
            tenant_id,
            item.sort.id,
            item.sort.qty + item.qty,
          );
        }
      }
      await this.ItemsRepo.delete(order_items.map((item) => item.id));
    }
    await this.ordersRepo.delete(order.id);
    if (order.payment) {
      await this.paymentsRepo.delete(order.payment.id);
    }
    if (order.return) {
      await this.returnRepo.delete(order.return.id);
    }
    return {
      done: true,
    };
  }

  async getAllReturn(
    tenant_id: string,
    page: number = 1,
    limit: number = 1000,
    returnId?: string,
  ) {
    const builder = this.returnRepo
      .createQueryBuilder('return')
      .leftJoin('return.order', 'order')
      .addSelect(['order.id', 'order.tax', 'order.short_id'])
      .leftJoin('order.car', 'car')
      .addSelect(['car.id', 'car.mark'])
      .leftJoin('car.client', 'client')
      .addSelect(['client.id', 'client.user_name'])
      .loadRelationCountAndMap(
        'return.returns_items_count',
        'return.returns_items',
      )
      .leftJoin('return.returns_items', 'ri')
      .addSelect(['ri.id', 'ri.qty', 'ri.unit_price'])
      .orderBy('return.created_at', 'DESC')
      .where('return.tenant_id = :tenant_id', { tenant_id });
    if (returnId) {
      builder.andWhere('return.id = :id', { id: returnId });
    }
    const [returns_items, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      returns_items,
      total,
      page,
      limit,
    };
  }

  async findReturnsItems(tenant_id: string, id: string) {
    const returnObj = await this.returnRepo
      .createQueryBuilder('return')
      .leftJoin('return.order', 'order')
      .addSelect(['order.id', 'order.short_id'])
      .leftJoin('order.car', 'car')
      .addSelect(['car.id', 'car.mark'])
      .leftJoin('car.client', 'client')
      .addSelect(['client.id', 'client.user_name'])
      .leftJoinAndSelect('return.returns_items', 'return_items')
      .leftJoin('return_items.order_item', 'order_item')
      .addSelect(['order_item.id', 'order_item.qty'])
      .leftJoin('order_item.sort', 'sort')
      .addSelect(['sort.id', 'sort.name', 'sort.color', 'sort.size'])
      .leftJoin('sort.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.material'])
      .orderBy('return.created_at', 'DESC')
      .where('return.tenant_id = :tenant_id', { tenant_id })
      .andWhere('return.id = :id', { id })
      .getOne();

    if (!returnObj) {
      throw new NotFoundException('لا يوجد مرتجع بهذا المعرف.');
    }
    return returnObj;
  }

  async countClientDepts(tenant_id: string) {
    const subQuery = this.ordersRepo
      .createQueryBuilder('subOrder')
      .leftJoin('subOrder.payment', 'subPayment')
      .leftJoin('subPayment.installments', 'subInstallments')
      .where('subPayment.tenant_id = :tenant_id', { tenant_id })
      .andWhere(
        new Brackets((qb) => {
          qb.where('subPayment.status = :installmentsStatus', {
            installmentsStatus: PaidStatusEnum.INSTALLMENTS,
          }).orWhere('subPayment.status = :pendingStatus', {
            pendingStatus: PaidStatusEnum.PENDING,
          });
        }),
      )
      .select([
        'subOrder.id AS "orderId"',
        'subOrder.total_price_after AS "totalPrice"',
        'subPayment.down_payment AS "downPayment"',
        'COALESCE(SUM(CAST(subInstallments.amount AS FLOAT)), 0) AS "installmentsSum"',
      ])
      .groupBy(
        'subOrder.id, subOrder.total_price_after, subPayment.down_payment',
      );

    const rows = await subQuery.getRawMany();

    let clientsDepts = 0;

    for (const row of rows) {
      const totalPriceAfter = Number(row.totalPrice);

      const alreadyPaid =
        (row.downPayment ? Number(row.downPayment) : 0) +
        Number(row.installmentsSum);

      const dept = totalPriceAfter - alreadyPaid;

      clientsDepts += dept;
    }

    return { clientsDepts };
  }
  // async countClientDepts(tenant_id: string) {
  //   const orders = await this.ordersRepo
  //     .createQueryBuilder('order')
  //     .leftJoin('order.payment', 'payment')
  //     .leftJoin('payment.installments', 'installments')
  //     .where('payment.tenant_id = :tenant_id', { tenant_id })
  //     .andWhere(
  //       new Brackets((qb) => {
  //         qb.where('payment.status = :installmentsStatus', {
  //           installmentsStatus: PaidStatusEnum.INSTALLMENTS,
  //         }).orWhere('payment.status = :pendingStatus', {
  //           pendingStatus: PaidStatusEnum.PENDING,
  //         });
  //       }),
  //     )
  //     .select([
  //       'order.id',
  //       'order.total_price',
  //       'order.tax',
  //       'order.discount',
  //       'order.additional_fees',
  //       'payment.id',
  //       'payment.down_payment',
  //       'installments.id',
  //       'installments.amount',
  //     ])
  //     .getMany();

  //   let clientsDepts = 0;
  //   for (let order of orders) {
  //     const totalPriceAfter =
  //       order.total_price *
  //         (order.tax && order.tax !== '0'
  //           ? Number(order.tax.slice(0, 2)) / 100 + 1
  //           : 1) -
  //       (order.discount ? Number(order.discount) : 0) +
  //       (order.additional_fees ? Number(order.additional_fees) : 0);
  //     const alreadyPaid =
  //       (order.payment.down_payment || 0) +
  //       (order.payment?.installments?.reduce(
  //         (acc, curr) => acc + Number(curr.amount),
  //         0,
  //       ) || 0);
  //     const dept = totalPriceAfter - alreadyPaid;
  //     clientsDepts += dept;
  //   }

  //   return {
  //     clientsDepts,
  //   };
  // }

  async searchEngine(
    tenant_id: string,
    searchin: 'orders' | 'returns',
    searchwith: string,
    column?: string,
  ) {
    if (searchin === 'orders') {
      const columns = ['order.short_id', 'client.user_name', 'car.mark'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.ordersRepo
        .createQueryBuilder('order')
        .leftJoin('order.order_items', 'item')
        .addSelect(['item.id', 'item.total_cost_price'])
        .leftJoin('order.car', 'car')
        .addSelect(['car.id', 'car.mark'])
        .leftJoin('car.client', 'client')
        .addSelect(['client.id', 'client.user_name'])
        .leftJoin('order.payment', 'payment')
        .addSelect([
          'payment.id',
          'payment.status',
          'payment.payment_method',
          'payment.client_balance',
        ])
        .where('order.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            if (column) {
              if (column === 'order.short_id') {
                qb.where('CAST(order.short_id AS TEXT) LIKE :termStart', {
                  termStart: `${searchwith}%`,
                }).orWhere('CAST(order.short_id AS TEXT) LIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                });
              } else {
                qb.where(`${column} ILIKE :termStart`, {
                  termStart: `${searchwith}%`,
                }).orWhere(`${column} ILIKE :termEnd`, {
                  termEnd: `%${searchwith}`,
                });
              }
            } else {
              qb.where('CAST(order.short_id AS TEXT) LIKE :termStart', {
                termStart: `${searchwith}%`,
              })
                .orWhere('CAST(order.short_id AS TEXT) LIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('car.mark ILIKE :termStart', {
                  termStart: `${searchwith.toLowerCase()}%`,
                })
                .orWhere('car.mark ILIKE :termEnd', {
                  termEnd: `%${searchwith.toLowerCase()}`,
                })
                .orWhere('client.user_name ILIKE :termStart', {
                  termStart: `${searchwith.toLowerCase()}%`,
                })
                .orWhere('client.user_name ILIKE :termEnd', {
                  termEnd: `%${searchwith.toLowerCase()}`,
                });
            }
          }),
        );

      const [results, total] = await query
        .orderBy('order.created_at', 'DESC')
        .getManyAndCount();
      results.forEach((order: any) => {
        order.total_cost_price = order.order_items?.reduce(
          (acc, curr) => acc + Number(curr.total_cost_price),
          0,
        );
        delete order.order_items;
      });
      return { results, total };
    } else if (searchin === 'returns') {
      const columns = ['return.short_id', 'client.user_name'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.returnRepo
        .createQueryBuilder('return')
        .loadRelationCountAndMap(
          'return.returns_items_count',
          'return.returns_items',
        )
        .leftJoin('return.order', 'order')
        .addSelect(['order.id', 'order.short_id'])
        .leftJoin('order.car', 'car')
        .addSelect(['car.id', 'car.mark'])
        .leftJoin('car.client', 'client')
        .addSelect(['client.id', 'client.user_name'])
        .where('return.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            if (column) {
              if (column === 'return.short_id') {
                qb.where('CAST(return.short_id AS TEXT) LIKE :termStart', {
                  termStart: `${searchwith}%`,
                }).orWhere('CAST(return.short_id AS TEXT) LIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                });
              } else {
                qb.where(`${column} ILIKE :termStart`, {
                  termStart: `${searchwith}%`,
                }).orWhere(`${column} ILIKE :termEnd`, {
                  termEnd: `%${searchwith}`,
                });
              }
            } else {
              qb.where('CAST(return.short_id AS TEXT) LIKE :termStart', {
                termStart: `${searchwith}%`,
              })
                .orWhere('CAST(return.short_id AS TEXT) LIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('car.mark ILIKE :termStart', {
                  termStart: `${searchwith.toLowerCase()}%`,
                })
                .orWhere('car.mark ILIKE :termEnd', {
                  termEnd: `%${searchwith.toLowerCase()}`,
                })
                .orWhere('client.user_name ILIKE :termStart', {
                  termStart: `${searchwith.toLowerCase()}%`,
                })
                .orWhere('client.user_name ILIKE :termEnd', {
                  termEnd: `%${searchwith.toLowerCase()}`,
                });
            }
          }),
        );

      const [results, total] = await query
        .orderBy('return.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }
    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }

  async handleGraphData(tenant_id: string, type: 'years' | 'months' | 'days') {
    const typesArr = ['years', 'months', 'days'];
    if (!type || !typesArr.includes(type)) {
      throw new BadRequestException('يجب تحديد نوع صالح.');
    }
    const currDate = new Date();
    const currYear = currDate.getFullYear();
    const currMonth = currDate.getMonth() + 1;
    const daysInMonth = new Date(currYear, currMonth, 0).getDate();

    const totalGraphData = [];

    if (type === 'years') {
      const yearDiff = currYear - StartYear;
      for (let i = 0; i <= yearDiff; i++) {
        const year = StartYear + i;
        const graphData = await this.getGraphData(tenant_id, year);
        totalGraphData.push(graphData);
      }
    } else if (type === 'months') {
      for (let month = 1; month <= 12; month++) {
        const graphData = await this.getGraphData(tenant_id, currYear, month);
        totalGraphData.push(graphData);
      }
    } else if (type === 'days') {
      for (let day = 1; day <= daysInMonth; day++) {
        const graphData = await this.getGraphData(
          tenant_id,
          currYear,
          currMonth,
          day,
        );
        totalGraphData.push(graphData);
      }
    }

    return { totalGraphData };
  }

  async getGraphData(
    tenant_id: string,
    year: number,
    month?: number,
    day?: number,
  ) {
    const query = this.ordersRepo
      .createQueryBuilder('ord')
      .leftJoin('ord.order_items', 'items')
      .select([
        'ord.id',
        'ord.total_price_after',
        'ord.tax',
        'ord.discount',
        'items.id',
        'items.qty',
        'items.total_cost_price',
      ])
      .where('ord.tenant_id = :tenant_id', { tenant_id })
      .andWhere(
        new Brackets((qb) => {
          qb.where(`EXTRACT(YEAR FROM ord.created_at) = :year`, { year });
          if (month !== undefined) {
            qb.andWhere(`EXTRACT(MONTH FROM ord.created_at) = :month`, {
              month,
            });
          }
          if (day !== undefined) {
            qb.andWhere(`EXTRACT(DAY FROM ord.created_at) = :day`, { day });
          }
        }),
      );
    const orders = await query.getMany();
    let totalCostPrice = 0;
    let totalEarning = 0;
    orders?.forEach((e) => {
      totalEarning += Number(e.total_price_after);
      e.order_items.forEach((e) => {
        totalCostPrice += Number(e.total_cost_price);
      });
    });
    const netProfit = totalEarning - totalCostPrice;
    return {
      totalEarning,
      netProfit,
      year,
      month,
      day,
    };
  }
  // ===============

  async getTodaySales(tenant_id: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const qb = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin('order.payment', 'payment')
      .addSelect([
        'payment.id',
        'payment.status',
        'payment.paid_at',
        'payment.payment_method',
        'payment.client_balance',
        'payment.down_payment',
        'payment.installment',
        'payment.installment_type',
      ])
      .leftJoinAndSelect('order.car', 'car')
      .leftJoin('car.client', 'client')
      .addSelect(['client.id', 'client.user_name', 'client.balance'])
      .leftJoin('order.order_items', 'items')
      .addSelect([
        'items.id',
        'items.total_cost_price',
        'items.qty',
        'items.unit_price',
        'items.additional_band',
      ])
      .leftJoin('items.sort', 'sort')
      .addSelect(['sort.id', 'sort.name'])
      .where('order.tenant_id = :tenant_id', { tenant_id })
      .andWhere('order.created_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .orderBy('order.created_at', 'DESC');

    const [orders, total] = await qb.getManyAndCount();
    orders.forEach((order: OrdersEntity & { total_cost_price: number }) => {
      order.total_cost_price = order.order_items.reduce(
        (acc, curr) => acc + Number(curr.total_cost_price),
        0,
      );
    });
    return {
      orders,
      total,
    };
  }

  async getPrevSalesPaidAtToday(tenant_id: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const qb = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoin('order.payment', 'payment')
      .addSelect([
        'payment.id',
        'payment.paid_at',
        'payment.payment_method',
        'payment.client_balance',
        'payment.down_payment',
        'payment.installment',
        'payment.installment_type',
      ])
      .leftJoinAndSelect('order.car', 'car')
      .leftJoin('car.client', 'client')
      .addSelect(['client.id', 'client.user_name', 'client.balance'])
      .where('order.tenant_id = :tenant_id', { tenant_id })
      .andWhere('payment.status = :status', { status: PaidStatusEnum.PAID })
      .andWhere('payment.paid_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .orderBy('order.created_at', 'DESC');

    const [prev_orders, total] = await qb.getManyAndCount();
    return {
      prev_orders,
      total,
    };
  }

  async getTodayReturns(tenant_id: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const qb = this.returnRepo
      .createQueryBuilder('return')
      .leftJoin('return.order', 'order')
      .addSelect(['order.id', 'order.short_id'])
      .leftJoin('order.car', 'car')
      .addSelect(['car.id', 'car.mark'])
      .leftJoin('car.client', 'client')
      .addSelect(['client.id', 'client.user_name'])
      .leftJoin('return.returns_items', 'returns_items')
      .addSelect([
        'returns_items.id',
        'returns_items.qty',
        'returns_items.unit_price',
      ])
      .loadRelationCountAndMap(
        'return.returns_items_count',
        'return.returns_items',
      )
      .where('return.tenant_id = :tenant_id', { tenant_id })
      .andWhere('return.created_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .orderBy('return.created_at', 'DESC');

    const [returns_items, total] = await qb.getManyAndCount();
    returns_items.forEach(
      (returns_item: ReturnEntity & { total_price_after: number }) => {
        returns_item.total_price_after = returns_item.returns_items.reduce(
          (acc, curr) => acc + Number(curr.unit_price),
          0,
        );
        delete returns_item.returns_items;
      },
    );
    return {
      returns_items,
      total,
    };
  }

  // async fixDuplicateShortIds(tenant_id: string) {
  //   const orders = await this.ordersRepo.find({
  //     where: { tenant_id },
  //     order: { created_at: 'DESC' },
  //   });
  //   for (let i = 0; i < orders.length; i++) {
  //     const order = orders[i];
  //     order.short_id = i + 1;
  //     await this.ordersRepo.save(order);
  //   }
  // }
  // async fixAllDuplicateShortIds() {
  //   const { tenants } = await this.tenantsService.getAllTenants();
  //   for (const tenant of tenants) {
  //     await this.fixDuplicateShortIds(tenant.tenant_id);
  //   }
  // }
}
