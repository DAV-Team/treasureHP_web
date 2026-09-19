import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { SafeUser } from '../users/interfaces/safe-user.interface.js';

export const ADMIN_ONLY = 'admin-only';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { super(); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated || !this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY, [context.getHandler(), context.getClass()])) return authenticated as boolean;
    const user = context.switchToHttp().getRequest<{ user?: SafeUser }>().user;
    if (user?.role !== 'admin') throw new ForbiddenException('Admin access required');
    return true;
  }
}
