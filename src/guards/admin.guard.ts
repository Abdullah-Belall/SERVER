import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CustomRequest } from 'src/types/interfaces/user.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const user = context.switchToHttp().getRequest<CustomRequest>().user;
    const allowed = ['admin', 'owner', 'boss'];
    if (user && allowed.includes(user?.role)) {
      return true;
    }
    return false;
  }
}
