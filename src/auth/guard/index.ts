import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '@auth/guard/role.guard';
import { GoogleGuard } from '@auth/guard/google.guard';

export const GUARDS = [JwtAuthGuard, RolesGuard, GoogleGuard];
