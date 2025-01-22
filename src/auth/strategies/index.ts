import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from '@auth/strategies/google.strategy';
import { YandexStrategy } from '@auth/strategies/yandex.strategy';

export const STRTAGIES = [JwtStrategy, GoogleStrategy, YandexStrategy];
