import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateStockCheckDto } from './dto/create-stock-check.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockChecksEntity } from './entities/stock-check.entity';
import { StockChecksItemsEntity } from './entities/stock-checks-items.entity';
import { ErrorMsg } from 'src/utils/base';
import { ProductsService } from 'src/products/products.service';
import { EquipmentService } from 'src/equipment/equipment.service';

@Injectable()
export class StockChecksService {
  constructor(
    @InjectRepository(StockChecksEntity)
    private readonly sChecksRepo: Repository<StockChecksEntity>,
    @InjectRepository(StockChecksItemsEntity)
    private readonly sChecksItemsRepo: Repository<StockChecksItemsEntity>,
    private readonly productService: ProductsService,
    private readonly equipmentService: EquipmentService,
  ) {}
  async saveStockCheck(stockCheck: StockChecksEntity) {
    let saved;
    try {
      saved = await this.sChecksRepo.save(stockCheck);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return saved;
  }
  async create(tenant_id: string, createStockCheckDto: CreateStockCheckDto) {
    const stockCheck = this.sChecksRepo.create({
      tenant_id,
      note: createStockCheckDto.note,
      type: createStockCheckDto.type,
    });
    let stockCheckReady = await this.saveStockCheck(stockCheck);
    if (createStockCheckDto.type === 'sorts') {
      for (const item of createStockCheckDto.data) {
        const sort = await this.productService.findOneSort(
          tenant_id,
          item.sort_id,
        );
        const stockCheckItem = this.sChecksItemsRepo.create({
          tenant_id,
          stock_check: stockCheckReady,
          sort,
          recorded_quantity: sort.qty,
          actual_quantity: item.qty,
          difference: item.qty - sort.qty,
        });
        try {
          await this.sChecksItemsRepo.save(stockCheckItem);
          await this.productService.updateSortQtyOrders(
            tenant_id,
            sort.id,
            item.qty,
          );
        } catch (err) {
          console.error(err);
          throw new InternalServerErrorException(ErrorMsg);
        }
      }
    } else {
      for (const item of createStockCheckDto.data) {
        const equipment = await this.equipmentService.findOneEquipment(
          tenant_id,
          item.sort_id,
        );
        const stockCheckItem = this.sChecksItemsRepo.create({
          tenant_id,
          stock_check: stockCheckReady,
          equipment,
          recorded_quantity: equipment.qty,
          actual_quantity: item.qty,
          difference: Number(item.qty) - Number(equipment.qty),
        });
        try {
          await this.sChecksItemsRepo.save(stockCheckItem);
          await this.equipmentService.UpdateEquipment(tenant_id, equipment.id, {
            qty: Number(item.qty),
          });
        } catch (err) {
          console.error(err);
          throw new InternalServerErrorException(ErrorMsg);
        }
      }
    }
    return {
      done: true,
      message: 'تم تنفيذ الجرد بنجاح.',
    };
  }
  async findAll(tenant_id: string) {
    const [stockChecks, total] = await this.sChecksRepo.findAndCount({
      where: { tenant_id },
      order: { created_at: 'DESC' },
    });
    return {
      stockChecks,
      total,
    };
  }
  async findOne(tenant_id: string, id: string) {
    const stockCheck = await this.sChecksRepo.findOne({
      where: { tenant_id, id },
      relations: [
        'items',
        'items.sort',
        'items.equipment',
        'items.sort.product',
      ],
    });
    if (!stockCheck) {
      throw new InternalServerErrorException('جرد غير موجود.');
    }
    return stockCheck;
  }
}
