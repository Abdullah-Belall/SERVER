import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CarsService } from 'src/cars/cars.service';
import { CategoryService } from 'src/category/category.service';
import { ClientsService } from 'src/clients/clients.service';
import { EquipmentService } from 'src/equipment/equipment.service';
import { ExpensesService } from 'src/expenses/expenses.service';
import { OrdersEntity } from 'src/orders/entities/order.entity';
import { ReturnEntity } from 'src/orders/entities/return.entity';
import { OrdersService } from 'src/orders/orders.service';
import { ProductsService } from 'src/products/products.service';
import { SuppliersService } from 'src/suppliers/suppliers.service';
import { TenantsService } from 'src/tenants/tenants.service';
import { WorkersService } from 'src/workers/workers.service';
import { PdfGeneratorService } from 'src/pdf-generator/pdf-generator.service';
import { TelegramService } from 'src/telegram/telegram.service';
import * as fs from 'fs';
import { AdvancesService } from 'src/advances/advances.service';
import { PaidStatusEnum } from 'src/types/enums/product.enum';

@Injectable()
export class CommonService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly categoryService: CategoryService,
    private readonly clientsService: ClientsService,
    private readonly workersService: WorkersService,
    private readonly tenantsService: TenantsService,
    private readonly expensesService: ExpensesService,
    private readonly equipmentService: EquipmentService,
    private readonly suppliersService: SuppliersService,
    private readonly carsService: CarsService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly telegramService: TelegramService,
    private readonly advancesService: AdvancesService,
  ) {}
  async searchEngine(
    tenant_id: string,
    searchin: string,
    searchwith?: string,
    column?: string,
  ) {
    const repos = [
      'sorts',
      'products',
      'costs',
      'categories',
      'orders',
      'returns',
      'clients',
      'workers',
      'suppliers',
      'equipments',
      'expenses',
      'cars',
    ];
    if (!searchin || searchin === '') {
      throw new BadRequestException('يجب اختيار المستودع المطلب البحث به.');
    }
    let service;
    if (!repos.includes(searchin)) {
      throw new ConflictException('لا يوجد مستودع بهذا الاسم.');
    }
    if (
      searchin === 'sorts' ||
      searchin === 'products' ||
      searchin === 'costs'
    ) {
      service = this.productsService;
    } else if (searchin === 'categories') {
      service = this.categoryService;
    } else if (searchin === 'orders' || searchin === 'returns') {
      service = this.ordersService;
    } else if (searchin === 'clients') {
      service = this.clientsService;
    } else if (searchin === 'workers') {
      service = this.workersService;
    } else if (searchin === 'suppliers') {
      service = this.suppliersService;
    } else if (searchin === 'equipments') {
      service = this.equipmentService;
    } else if (searchin === 'expenses') {
      service = this.expensesService;
    } else if (searchin === 'cars') {
      service = this.carsService;
    }
    return service.searchEngine(tenant_id, searchin, searchwith || '', column);
  }
  async getGenralCalcs(tenant_id: string) {
    const calcCurrentInventory =
      await this.productsService.calcCurrentInventory(tenant_id);
    const { balance, period } = await this.tenantsService.getBalance(tenant_id);
    const { clientsDepts } =
      await this.ordersService.countClientDepts(tenant_id);
    const { myDepts } = await this.productsService.countMyDepts(tenant_id);
    return {
      totalCostsPrice: calcCurrentInventory.totalCostsPrice,
      totalSortsPrices: calcCurrentInventory.totalPrices,
      clientsDepts,
      myDepts,
      balance,
      period,
    };
  }
  async getDailyReport(tenant_id: string, date: Date) {
    const expenses = await this.expensesService.getTodayExpenses(
      tenant_id,
      date,
    );
    const equipments = await this.equipmentService.getTodayEquiments(
      tenant_id,
      date,
    );
    const costs = await this.productsService.getTodayCosts(tenant_id, date);
    const sales = await this.ordersService.getTodaySales(tenant_id, date);
    const returns = await this.ordersService.getTodayReturns(tenant_id, date);
    return {
      done: true,
      expenses,
      equipments,
      costs,
      sales,
      returns,
    };
  }
  //! HEREOB
  //* OK
  async TelegramDailyReport(tenant_id: string, date: Date) {
    const { orders } = await this.ordersService.getTodaySales(tenant_id, date);
    const sales = orders.reduce(
      (acc, curr) => acc + Number(curr.total_price_after),
      0,
    );
    //* only paid orders
    const safeSales = orders
      .filter(
        (order) =>
          order.payment.status === PaidStatusEnum.PAID &&
          !order.payment.paid_at,
      )
      ?.reduce((acc, curr) => acc + Number(curr.total_price_after), 0);
    const { prev_orders } = await this.ordersService.getPrevSalesPaidAtToday(
      tenant_id,
      date,
    );
    const totalCosts = orders.reduce(
      (acc, curr: OrdersEntity & { total_cost_price: number }) =>
        acc + Number(curr.total_cost_price),
      0,
    );
    const netProfit = sales - totalCosts;
    const { expenses } = await this.expensesService.getTodayExpenses(
      tenant_id,
      date,
    );
    const totalExpenses = expenses.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0,
    );
    const { returns_items } = await this.ordersService.getTodayReturns(
      tenant_id,
      date,
    );
    const totalReturns = returns_items.reduce(
      (acc, curr: ReturnEntity & { total_price_after: number }) =>
        acc + Number(curr.total_price_after),
      0,
    );
    const { advances } = await this.advancesService.getTodayAdvances(
      tenant_id,
      date,
    );
    const totalAdvances = advances.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0,
    );
    const { costs } = await this.productsService.getTodayCosts(tenant_id, date);
    const totalAllCosts = costs.reduce(
      (acc, curr) => acc + Number(curr.price),
      0,
    );
    const tenant = await this.tenantsService.getTenantByTenantId(tenant_id);
    if (!tenant) throw new NotFoundException('لا يوجد مستأجر بهذا الدومين.');
    const domain = tenant.domain;
    // const chatId = '5726273594';
    if (!tenant.chat_ids || tenant.chat_ids?.length === 0)
      throw new BadRequestException('اعدادات التليجرام لا توجد لهذا المستأجر.');
    const filePath = await this.pdfGeneratorService.generateInvoicePdf(
      domain,
      {
        date,
        expenses,
        sales,
        totalCosts,
        netProfit,
        totalExpenses,
        totalReturns,
        totalAdvances,
        advances,
        orders,
        totalAllCosts,
        costs,
        prev_orders,
      },
      `daily-report`,
      'rabi3-daily-report',
    );
    for (const chat_id of tenant.chat_ids) {
      await this.telegramService.sendTelegramPDF(chat_id.chat_id, filePath);
    }
    fs.unlinkSync(filePath);
    return {
      done: true,
    };
  }
}
// 00:15:5d:eb:5b:ee
