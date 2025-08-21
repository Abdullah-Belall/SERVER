import { IsString, Matches } from 'class-validator';

export class TenantDetails {
  @IsString()
  @Matches(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/, {
    message: 'القيمة يجب أن تكون دومين صالح مثل example.com أو example.co.uk',
  })
  tenant_domain: string;
}
