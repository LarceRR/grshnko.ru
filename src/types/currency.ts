export interface Currency {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  iconType: 'emoji' | 'lucide' | 'url';
  iconColor?: string | null;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCurrencyBalance extends Currency {
  amount: number | null;
  isHidden: boolean;
  isHiddenForOthers: boolean;
}

export interface AdjustBalancePayload {
  userId: string;
  amount: number;
  reason?: string;
}

export interface UpdateVisibilityPayload {
  hideAll?: boolean;
  perCurrency?: { currencyId: string; isHidden: boolean }[];
}

export interface CreateCurrencyPayload {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  iconType?: 'emoji' | 'lucide' | 'url';
  iconColor?: string;
}

export interface UpdateCurrencyPayload {
  name?: string;
  description?: string;
  icon?: string;
  iconType?: 'emoji' | 'lucide' | 'url';
  iconColor?: string;
}
