import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;
  @IsString()
  @MinLength(9, { message: 'Invalid password.' })
  @MaxLength(24, { message: 'Invalid password.' })
  password: string;
  @IsString()
  @Matches(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/, {
    message: 'القيمة يجب أن تكون دومين صالح مثل example.com أو example.co.uk',
  })
  tenant_domain: string;
}
