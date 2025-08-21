import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Matches(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/, {
    message: 'القيمة يجب أن تكون دومين صالح مثل example.com أو example.co.uk',
  })
  tenant_domain: string;
  @IsOptional()
  @IsString()
  phone: string;
  @IsString()
  logo: string;
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  bill_path: string;
  @IsOptional()
  @IsString()
  theme: string;
}
