import { PartialType } from '@nestjs/mapped-types';
import { CreatePayAdvanceDto } from './create-pay-advance.dto';

export class UpdatePayAdvanceDto extends PartialType(CreatePayAdvanceDto) {}
