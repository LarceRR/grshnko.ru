import type { Currency } from './currency';

export interface UserCurrencyBalanceInline {
  currencyId: string;
  amount: number;
  currency: Currency;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  username: string;
  email: string;
  role?: Role;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  permissions: string[];
  isVerified?: boolean;
  theme?: string | null;
  language?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isOnline?: boolean;
  /** Нормализованные балансы; на API из `UserService.mapUser` / `auth` session всегда приходит массив. */
  currencyBalances?: UserCurrencyBalanceInline[];
}

/**
 * Строка из `GET api/user/userslist` — сервер всегда кладёт `currencyBalances`
 * (по всем валютам, нули если записи не было). См. `UserService.mapUser`.
 */
export type UserListEntry = Omit<User, "currencyBalances"> & {
  currencyBalances: UserCurrencyBalanceInline[];
};

export interface Role {
  id: string;
  name: string;
  createdAt?: string;
  key?: string;
  color?: string;
}