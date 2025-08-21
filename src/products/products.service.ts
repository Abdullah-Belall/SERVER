import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Brackets, Repository } from 'typeorm';
import { ProductsEntity } from './entities/product.entity';
import { ProductSortsEntity } from './entities/product-sort.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoriesEntity } from 'src/category/entities/category.entity';
import { ErrorMsg } from 'src/utils/base';
import { CreateSortDto } from './dto/create-sort.dto';
import { UpdateSortDto } from './dto/update-sorts.dto';
import { CustomProductSortsInterface } from 'src/types/interfaces/user.interface';
import { CostsEntity } from './entities/good-costs.entity';
import { SuppliersService } from 'src/suppliers/suppliers.service';
import * as dayjs from 'dayjs';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductsEntity)
    private readonly productsRepo: Repository<ProductsEntity>,

    @InjectRepository(CategoriesEntity)
    private readonly categoriesRepo: Repository<CategoriesEntity>,

    @InjectRepository(ProductSortsEntity)
    private readonly sortsRepo: Repository<ProductSortsEntity>,

    @InjectRepository(CostsEntity)
    private readonly costsRepo: Repository<CostsEntity>,
    @Inject(forwardRef(() => SuppliersService))
    private suppliersService: SuppliersService,
  ) {}
  async create(tenant_id: string, createProductDto: CreateProductDto) {
    const exists = await this.productsRepo.findOne({
      where: { name: createProductDto.name, tenant_id },
    });
    if (exists) throw new ConflictException('اسم المنتج موجود بالفعل.');

    const category = await this.categoriesRepo.findOne({
      where: { id: createProductDto.categoryId, tenant_id },
    });
    if (!category) throw new NotFoundException('الفئة غير موجودة.');

    const newProduct = this.productsRepo.create({
      ...createProductDto,
      tenant_id,
      category,
    });
    try {
      await this.productsRepo.save(newProduct);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم إنشاء المنتج بنجاح',
    };
  }
  async findAll(tenant_id: string) {
    const [products, total] = await this.productsRepo
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenant_id', { tenant_id })
      .leftJoin('product.category', 'cat')
      .addSelect(['cat.id', 'cat.name'])
      .loadRelationCountAndMap('product.sorts_count', 'product.sorts')
      .orderBy('product.created_at', 'DESC')
      .getManyAndCount();
    return {
      products,
      total,
    };
  }
  async findAllSorts(
    tenant_id: string,
    page: number = 1,
    limit: number = 1000,
  ) {
    const [sorts, total] = await this.sortsRepo
      .createQueryBuilder('sorts')
      .where('sorts.tenant_id = :tenant_id', { tenant_id })
      .leftJoin('sorts.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.material'])
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .orderBy('sorts.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      sorts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async findOne(id: string, tenant_id: string) {
    const product = await this.productsRepo
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenant_id', { tenant_id })
      .andWhere('product.id = :id', { id })
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.sorts', 'sorts')
      .loadRelationCountAndMap('sorts.orders_count', 'sorts.order_items')
      .getOne();
    const sorts = await Promise.all(
      product.sorts.map(async (e) => {
        const latest_cost = await this.costsRepo.findOne({
          where: { sort: { id: e.id } },
          order: { created_at: 'DESC' },
          select: ['id', 'price', 'qty', 'created_at'],
        });
        return {
          ...e,
          latest_cost_unit_price: latest_cost
            ? latest_cost.price / latest_cost.qty
            : 0,
        };
      }),
    );
    product.sorts = sorts as any;
    if (!product) throw new NotFoundException('المنتج غير موجود');

    return product;
  }
  async update(
    tenant_id: string,
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productsRepo.findOne({
      where: { id, tenant_id },
      relations: ['category', 'sorts'],
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');

    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const duplicate = await this.productsRepo.findOne({
        where: { name: updateProductDto.name, tenant_id },
      });
      if (duplicate) throw new ConflictException('اسم المنتج مستخدم بالفعل');
    }

    if (updateProductDto.categoryId) {
      const category = await this.categoriesRepo.findOne({
        where: { id: updateProductDto.categoryId, tenant_id },
      });
      if (!category) throw new NotFoundException('الفئة الجديدة غير موجودة');
      product.category = category;
    }
    Object.assign(product, updateProductDto);
    try {
      await this.productsRepo.save(product);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث المنتج بنجاح',
    };
  }
  async createSort(
    tenant_id: string,
    productId: string,
    createSortDto: CreateSortDto,
  ) {
    const product = await this.productsRepo.findOne({
      where: { id: productId, tenant_id },
      relations: ['sorts'],
    });
    if (!product) throw new NotFoundException('المنتج غير موجود.');
    if (
      product.sorts?.some(
        (sort) =>
          sort.color?.trim().toLowerCase() ===
            createSortDto.color?.trim().toLowerCase() &&
          sort.size?.trim().toLowerCase() ===
            createSortDto.size?.trim().toLowerCase() &&
          sort.name?.trim().toLowerCase() ===
            createSortDto.name?.trim().toLowerCase(),
      )
    ) {
      throw new ConflictException('هذا الصنف موجود بالفعل');
    }

    const newSort = this.sortsRepo.create({
      ...createSortDto,
      tenant_id,
      product,
    });

    try {
      await this.productsRepo.save({
        ...product,
        qty: product.qty + createSortDto.qty,
      });
      const savedSort = await this.sortsRepo.save(newSort);
      const supplier = await this.suppliersService.findOneByUsername(
        tenant_id,
        createSortDto.supplier,
      );
      const costsRepo = this.costsRepo.create({
        sort: savedSort,
        qty: createSortDto.qty,
        price: createSortDto.costPrice,
        supplier,
        tenant_id,
        short_id: (await this.costsRepo.count({ where: { tenant_id } })) + 1,
      });
      const savedCost = await this.costsRepo.save(costsRepo);

      if (
        createSortDto.initial_amount &&
        Number(createSortDto.initial_amount) !== 0
      ) {
        await this.suppliersService.paySupplier(tenant_id, {
          cost_id: savedCost.id,
          installment: Number(createSortDto.initial_amount),
        });
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم إنشاء الصنف بنجاح',
    };
  }
  //^
  async updateSortQtyOrders(tenant_id: string, sortId: string, newQty: number) {
    const sort = await this.sortsRepo.findOne({
      where: { id: sortId, tenant_id },
      relations: ['product'],
    });
    if (!sort) throw new NotFoundException('النوع غير موجود.');
    try {
      const productQty = sort.product.qty - sort.qty + newQty;
      await this.productsRepo.save({
        ...sort.product,
        qty: productQty,
      });
      Object.assign(sort, { qty: newQty });
      await this.sortsRepo.save(sort);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
  }
  async updateSort(
    tenant_id: string,
    sortId: string,
    updateSortDto: UpdateSortDto,
  ) {
    if (updateSortDto.qty !== undefined && !updateSortDto.supplier) {
      throw new BadRequestException('يجب تحديد المورد عند تعديل الكمية.');
    }

    const sort = await this.sortsRepo.findOne({
      where: { id: sortId, tenant_id },
      relations: ['product'],
    });
    if (!sort) throw new NotFoundException('النوع غير موجود');

    const otherSorts = await this.sortsRepo.find({
      where: { product: { id: sort.product.id, tenant_id } },
    });
    if (
      (updateSortDto.color || updateSortDto.size || updateSortDto.name) &&
      otherSorts.some(
        (s) =>
          s.id !== sortId &&
          s.color?.trim() === updateSortDto.color?.trim() &&
          s.size?.trim() === updateSortDto.size?.trim() &&
          s.name?.trim() === updateSortDto.name?.trim(),
      )
    ) {
      throw new ConflictException('يوجد صنف آخر بنفس الأسم واللون والمقاس.');
    }
    let supplier;
    if (updateSortDto.supplier) {
      supplier = await this.suppliersService.findOneByUsername(
        tenant_id,
        updateSortDto.supplier,
      );
      if (!supplier) {
        throw new NotFoundException('لا يوجد مورد بهذا الاسم.');
      }
    }
    try {
      if (updateSortDto.qty !== undefined) {
        const productQty = sort.product.qty - sort.qty + updateSortDto.qty;
        await this.productsRepo.save({
          ...sort.product,
          qty: productQty,
        });
        const newQty = updateSortDto.qty - sort.qty;
        const newCost = this.costsRepo.create({
          sort,
          qty: newQty,
          price: updateSortDto.costPrice,
          supplier,
          tenant_id,
          short_id: (await this.costsRepo.count({ where: { tenant_id } })) + 1,
        });
        const savedCost = await this.costsRepo.save(newCost);
        if (
          updateSortDto.initial_amount &&
          Number(updateSortDto.initial_amount) > 0
        ) {
          await this.suppliersService.paySupplier(tenant_id, {
            cost_id: savedCost.id,
            installment: Number(updateSortDto.initial_amount),
          });
        }
      }
      Object.assign(sort, updateSortDto);
      await this.sortsRepo.save(sort);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }

    return {
      done: true,
      message: 'تم تحديث الصنف بنجاح',
    };
  }
  async deleteSort(tenant_id: string, id: string) {
    const sort: CustomProductSortsInterface = await this.sortsRepo
      .createQueryBuilder('sort')
      .where('sort.tenant_id = :tenant_id', { tenant_id })
      .andWhere('sort.id = :id', { id })
      .leftJoinAndSelect('sort.product', 'product')
      .loadRelationCountAndMap('sort.orders_count', 'sort.order_items')
      .getOne();
    if (!sort) {
      throw new NotFoundException('لا يوجد صنف بهذه البيانات.');
    }
    if (sort.orders_count != 0) {
      throw new ConflictException('لا يمكن حذف صنف يحتوي علي طلبات.');
    }
    try {
      await this.sortsRepo.delete(sort.id);
      await this.productsRepo.save({
        ...sort.product,
        qty: sort.product.qty - sort.qty,
      });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }
  async deleteProduct(tenant_id: string, id: string) {
    const product = await this.productsRepo.findOne({
      where: { id, tenant_id },
      relations: ['sorts'],
    });
    if (!product) throw new NotFoundException('لا يوجد منتج بهذا المعرف.');

    if (product.sorts.length > 0)
      throw new ConflictException('لا يمكن حذف منتج يحتوي علي اصناف.');

    try {
      await this.productsRepo.delete(id);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم حذف المنتج بنجاح.',
    };
  }
  //^
  async findOneSort(tenant_id: string, id: string) {
    const sort = await this.sortsRepo.findOne({
      where: { id, tenant_id },
      relations: ['product', 'costs'],
    });
    if (!sort) throw new NotFoundException('الصنف غير موجود');
    return sort;
  }
  async findAllCosts(
    tenant_id: string,
    page: number = 1,
    limit: number = 1000,
  ) {
    const [costs, total] = await this.costsRepo
      .createQueryBuilder('cost')
      .where('cost.tenant_id = :tenant_id', { tenant_id })
      .leftJoinAndSelect('cost.sort', 'sort')
      .leftJoin('sort.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .orderBy('cost.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      costs,
      total,
      page,
      limit,
    };
  }
  async calcCurrentInventory(tenant_id: string) {
    const sorts = await this.sortsRepo
      .createQueryBuilder('sort')
      .where('sort.tenant_id = :tenant_id', { tenant_id })
      .leftJoin('sort.costs', 'cost')
      .select([
        'sort.id',
        'sort.qty',
        'sort.unit_price',
        'cost.id',
        'cost.qty',
        'cost.price',
        'cost.created_at',
      ])
      .getMany();
    let totalCostsPrice = 0;
    let totalPrices = 0;
    for (const sort of sorts) {
      totalCostsPrice += this.countCostPriceForOrder(
        sort,
        sort.qty,
        true,
      ) as any;
      totalPrices += sort.qty * sort.unit_price;
    }
    return { totalCostsPrice, totalPrices };
  }
  countCostPriceForOrder(
    sort: ProductSortsEntity,
    orderQty: number,
    isForCalcs?: boolean,
  ) {
    let currSortQty = sort.qty;
    let filledCosts = [];
    const sortedCosts = this.sortData(sort.costs, 'newFirst');
    for (const cost of sortedCosts) {
      if (cost.qty > 0) {
        if (currSortQty > 0) {
          currSortQty -= cost.qty;
          filledCosts.push({
            qty: currSortQty >= 0 ? cost.qty : currSortQty + cost.qty,
            unit_price: cost.price / cost.qty,
            created_at: cost.created_at,
          });
        }
      }
    }
    if (isForCalcs) {
      return filledCosts.reduce(
        (acc, crr) => acc + crr.qty * crr.unit_price,
        0,
      );
    }
    let countCostPrice = 0;
    for (const filledCost of this.sortData(filledCosts, 'oldFirst')) {
      if (orderQty <= filledCost.qty) {
        countCostPrice += orderQty * filledCost.unit_price;
        break;
      } else if (orderQty > filledCost.qty) {
        countCostPrice += filledCost.qty * filledCost.unit_price;
        orderQty -= filledCost.qty;
      }
    }
    return countCostPrice;
  }
  sortData(data: any[], type: 'oldFirst' | 'newFirst') {
    return data.sort(
      (a, b) =>
        new Date((type === 'newFirst' ? b : a).created_at).getTime() -
        new Date((type === 'newFirst' ? a : b).created_at).getTime(),
    );
  }

  async searchEngine(
    tenant_id: string,
    searchin: 'products' | 'sorts' | 'costs',
    searchwith: string,
    column?: string,
  ) {
    if (searchin === 'sorts') {
      const columns = [
        'sort.name',
        'sort.color',
        'sort.size',
        'product.name',
        'product.material',
        'category.name',
      ];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.sortsRepo
        .createQueryBuilder('sort')
        .leftJoin('sort.product', 'product')
        .leftJoin('product.category', 'category')
        .addSelect(['product.id', 'product.name', 'product.material'])
        .addSelect(['category.id', 'category.name'])
        .where('sort.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            if (column) {
              qb.where(`${column} ILIKE :termStart`, {
                termStart: `${searchwith}%`,
              }).orWhere(`${column} ILIKE :termEnd`, {
                termEnd: `%${searchwith}`,
              });
            } else {
              qb.where('sort.name ILIKE :termStart', {
                termStart: `${searchwith}%`,
              })
                .orWhere('sort.name ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('sort.color ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('sort.color ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('sort.size ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('sort.size ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('product.name ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('product.name ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('product.material ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('product.material ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('category.name ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('category.name ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                });
            }
          }),
        );

      const [results, total] = await query
        .orderBy('sort.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    } else if (searchin === 'products') {
      const columns = [
        'product.name',
        'product.desc',
        'cat.name',
        'product.material',
        'product.note',
      ];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.productsRepo
        .createQueryBuilder('product')
        .leftJoin('product.category', 'cat')
        .loadRelationCountAndMap('product.sorts_count', 'product.sorts')
        .select([
          'product.id',
          'product.name',
          'product.desc',
          'cat.id',
          'cat.name',
          'product.qty',
          'product.material',
          'product.note',
          'product.created_at',
          'product.updated_at',
        ])
        .where('product.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            if (column) {
              qb.where(`${column} ILIKE :termStart`, {
                termStart: `${searchwith}%`,
              }).orWhere(`${column} ILIKE :termEnd`, {
                termEnd: `%${searchwith}`,
              });
            } else {
              qb.where('product.name ILIKE :termStart', {
                termStart: `${searchwith}%`,
              })
                .orWhere('product.name ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('product.desc ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('product.desc ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('product.material ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('product.material ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('product.note ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('product.note ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('cat.name ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('cat.name ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                });
            }
          }),
        );
      const [results, total] = await query
        .orderBy('product.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    } else if (searchin === 'costs') {
      const columns = [
        'cost.short_id',
        'product.name',
        'sort.name',
        'sort.color',
        'sort.size',
      ];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.costsRepo
        .createQueryBuilder('cost')
        .leftJoin('cost.sort', 'sort')
        .leftJoin('sort.product', 'product')
        .select([
          'cost.id',
          'cost.short_id',
          'cost.qty',
          'cost.price',
          'cost.is_paid',
          'cost.created_at',
          'cost.updated_at',
          'sort.id',
          'sort.name',
          'sort.color',
          'sort.size',
          'product.id',
          'product.name',
        ])
        .where('cost.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            if (column) {
              if (column === 'cost.short_id') {
                qb.where('CAST(cost.short_id AS TEXT) LIKE :termStart', {
                  termStart: `${searchwith}%`,
                }).orWhere('CAST(cost.short_id AS TEXT) LIKE :termEnd', {
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
              qb.where('CAST(cost.short_id AS TEXT) LIKE :termStart', {
                termStart: `${searchwith}%`,
              })
                .orWhere('CAST(cost.short_id AS TEXT) LIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('product.name ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('product.name ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('sort.name ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('sort.name ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('sort.color ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('sort.color ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                })
                .orWhere('sort.size ILIKE :termStart', {
                  termStart: `${searchwith}%`,
                })
                .orWhere('sort.size ILIKE :termEnd', {
                  termEnd: `%${searchwith}`,
                });
            }
          }),
        );

      const [results, total] = await query
        .orderBy('cost.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }

  async findOneCost(tenant_id: string, id: string, needBills: boolean = false) {
    const relations = needBills ? ['pay_bills'] : undefined;
    const cost = await this.costsRepo.findOne({
      where: {
        tenant_id,
        id,
      },
      relations,
    });
    if (!cost) {
      throw new NotFoundException('لا يوجد فاتورة تكاليف بهذا المعرف.');
    }
    return cost;
  }
  async UpdateCost(cost: CostsEntity) {
    try {
      await this.costsRepo.save(cost);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(ErrorMsg);
    }
  }
  async countMyDepts(tenant_id: string) {
    const costs = await this.costsRepo
      .createQueryBuilder('cost')
      .where('cost.tenant_id = :tenant_id', { tenant_id })
      .andWhere('cost.is_paid = false')
      .leftJoin('cost.pay_bills', 'bill')
      .select(['cost.id', 'cost.price', 'bill.id', 'bill.amount'])
      .getMany();
    let myDepts = 0;
    for (let cost of costs) {
      const paid = cost?.pay_bills?.reduce(
        (acc, curr) => acc + Number(curr.amount),
        0,
      );
      const dept = cost?.price - paid;
      myDepts += dept;
    }
    return { myDepts };
  }
  // ===============
  async getTodayCosts(tenant_id: string, date: Date) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const qb = this.costsRepo
      .createQueryBuilder('cost')
      .leftJoin('cost.sort', 'sort')
      .addSelect(['sort.id', 'sort.name', 'sort.color', 'sort.size'])
      .leftJoin('sort.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .where('cost.tenant_id = :tenant_id', { tenant_id })
      .andWhere('cost.created_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .orderBy('cost.created_at', 'DESC');

    const [costs, total] = await qb.getManyAndCount();

    return {
      costs,
      total,
    };
  }
}
