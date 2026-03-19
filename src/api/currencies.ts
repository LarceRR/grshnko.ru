import axios from 'axios';
import { API_URL } from '../config';
import type {
  Currency,
  UserCurrencyBalance,
  CreateCurrencyPayload,
  UpdateCurrencyPayload,
  AdjustBalancePayload,
  UpdateVisibilityPayload,
} from '../types/currency';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

export const currencyApi = {
  getAll: () =>
    api.get<Currency[]>('api/currencies').then(r => r.data),

  getById: (id: string) =>
    api.get<Currency>(`api/currencies/${id}`).then(r => r.data),

  create: (data: CreateCurrencyPayload) =>
    api.post<Currency>('api/currencies', data).then(r => r.data),

  update: (id: string, data: UpdateCurrencyPayload) =>
    api.patch<Currency>(`api/currencies/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`api/currencies/${id}`).then(r => r.data),

  setMain: (currencyId: string) =>
    api.patch('api/currencies/main', { currencyId }).then(r => r.data),

  adjustBalance: (currencyId: string, data: AdjustBalancePayload) =>
    api.post<{ balance: number }>(`api/currencies/${currencyId}/adjust`, data).then(r => r.data),

  getUserCurrencies: (userId: string) =>
    api.get<UserCurrencyBalance[]>(`api/user/${userId}/currencies`).then(r => r.data),

  updateVisibility: (data: UpdateVisibilityPayload) =>
    api.patch('api/user/currencies/visibility', data).then(r => r.data),

  uploadIcon: (file: File) => {
    const form = new FormData();
    form.append('icon', file);
    return api.post<{ filename: string }>('api/currencies/upload-icon', form).then(r => r.data);
  },

  uploadIconFromUrl: (url: string) =>
    api.post<{ filename: string }>('api/currencies/upload-icon-url', { url }).then(r => r.data),
};
