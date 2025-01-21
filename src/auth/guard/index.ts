import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '@auth/guard/role.guard';

export const GUARDS = [JwtAuthGuard, RolesGuard];
