import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CategoriesEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ErrorMsg } from 'src/utils/base';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoriesEntity)
    private readonly CategoriesRepo: Repository<CategoriesEntity>,
  ) {}

  //^
  async create(tenant_id: string, createCategoryDto: CreateCategoryDto) {
    const exists = await this.CategoriesRepo.findOne({
      where: { name: createCategoryDto.name, tenant_id },
    });
    if (exists) throw new ConflictException('اسم الفئة موجود بالفعل.');

    const newCategory = this.CategoriesRepo.create({
      ...createCategoryDto,
      tenant_id,
    });
    try {
      await this.CategoriesRepo.save(newCategory);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم إنشاء الفئة بنجاح.',
    };
  }
  //^
  async findAll(tenant_id: string, page: number = 1, limit: number = 50) {
    const [categories, total] = await this.CategoriesRepo.createQueryBuilder(
      'category',
    )
      .where('category.tenant_id = :tenant_id', { tenant_id })
      .loadRelationCountAndMap('category.products_count', 'category.products')
      .orderBy('category.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      categories,
      total,
      page: Number(page),
      limit,
    };
  }
  //^
  async findOne(tenant_id: string, id: string) {
    const category = await this.CategoriesRepo.createQueryBuilder('category')
      .where('category.tenant_id = :tenant_id', { tenant_id })
      .andWhere('category.id = :id', { id })
      .leftJoinAndSelect('category.products', 'product')
      .loadRelationCountAndMap('product.sorts_count', 'product.sorts')
      .getOne();
    if (!category) throw new NotFoundException('الفئة غير موجودة');

    return category;
  }
  //^
  async update(
    tenant_id: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.CategoriesRepo.findOne({
      where: { id, tenant_id },
    });
    if (!category) throw new NotFoundException('الفئة غير موجودة.');

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const duplicate = await this.CategoriesRepo.findOne({
        where: { name: updateCategoryDto.name, tenant_id },
      });
      if (duplicate) throw new ConflictException('اسم الفئة مستخدم بالفعل.');
    }

    Object.assign(category, updateCategoryDto);
    try {
      await this.CategoriesRepo.save(category);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(ErrorMsg);
    }
    return {
      done: true,
      message: 'تم تحديث الفئة بنجاح.',
    };
  }
  //^
  async delete(tenant_id: string, id: string) {
    const category = await this.CategoriesRepo.findOne({
      where: { id, tenant_id },
      relations: ['products'],
    });
    if (!category) throw new NotFoundException('الفئة غير موجودة.');
    if (category.products && category.products.length > 0) {
      throw new BadRequestException(
        'لا يمكن حذف الفئة لوجود منتجات تابعة لها.',
      );
    }
    await this.CategoriesRepo.remove(category);
    return { done: true, message: 'تم حذف الفئة بنجاح.' };
  }
  async searchEngine(
    tenant_id: string,
    searchin: 'categories',
    searchwith: string,
    column?: string,
  ) {
    if (searchin === 'categories') {
      const columns = ['category.name', 'category.desc'];
      if (column && !columns.includes(column)) {
        throw new ConflictException('لا يوجد عمود بهذا الاسم');
      }
      const query = this.CategoriesRepo.createQueryBuilder('category')
        .loadRelationCountAndMap('category.products_count', 'category.products')
        .where('category.tenant_id = :tenant_id', { tenant_id })
        .andWhere(
          new Brackets((qb) => {
            if (column) {
              qb.where(`${column} ILIKE :termStart`, {
                termStart: `${searchwith.toLowerCase()}%`,
              }).orWhere(`${column} ILIKE :termEnd`, {
                termEnd: `%${searchwith.toLowerCase()}`,
              });
            } else {
              qb.where('category.name ILIKE :termStart', {
                termStart: `${searchwith.toLowerCase()}%`,
              })
                .orWhere('category.name ILIKE :termEnd', {
                  termEnd: `%${searchwith.toLowerCase()}`,
                })
                .orWhere('category.desc ILIKE :termStart', {
                  termStart: `${searchwith.toLowerCase()}%`,
                })
                .orWhere('category.desc ILIKE :termEnd', {
                  termEnd: `%${searchwith.toLowerCase()}`,
                });
            }
          }),
        );

      const [results, total] = await query
        .orderBy('category.created_at', 'DESC')
        .getManyAndCount();
      return { results, total };
    }

    throw new ConflictException('البحث غير مدعوم لهذه الفئة.');
  }
}
