// api/telegram.ts
import axios from "axios";
import { API_URL } from "../config";

export interface ITelegramStatus {
    connected: boolean;
    needsPhoneNumber: boolean;
    awaitingPhoneCode: boolean;
    awaitingPassword: boolean;
    authorizationInProgress: boolean;
    awaitingQrScan: boolean;
    qrToken: string | null;
    error: string | null;
    user: {
        id: number;
        username: string;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
    } | null;
}

export interface IApiResponse {
    message: string;
    status: string;
}

export interface IQRCodeAuthResponse {
  message: string;
  qrToken: string;
  status: 'initiated';
}

export const getTelegramStatus = async (): Promise<ITelegramStatus> => {
    const res = await axios.get<ITelegramStatus>(`${API_URL}api/telegram-auth/status`, {
        withCredentials: true,
    });
    return res.data;
};

export const startTelegramAuth = async (phoneNumber: string): Promise<IApiResponse> => {
    const res = await axios.post<IApiResponse>(`${API_URL}api/telegram-auth/start`, 
        { phoneNumber }, 
        { withCredentials: true }
    );
    return res.data;
};

export const sendPhoneCode = async (code: string): Promise<IApiResponse> => {
    const res = await axios.post<IApiResponse>(`${API_URL}api/telegram-auth/send-code`, 
        { code }, 
        { withCredentials: true }
    );
    return res.data;
};

export const sendPassword = async (password: string): Promise<IApiResponse> => {
    const res = await axios.post<IApiResponse>(`${API_URL}api/telegram-auth/send-password`, 
        { password }, 
        { withCredentials: true }
    );
    return res.data;
};

// Новая функция для запроса QR-кода
export const authViaQRCode = async (): Promise<IQRCodeAuthResponse> => {
  // Предполагается, что у вас есть настроенный apiClient (например, axios)
  // Если нет, можно использовать fetch:
  const response = await fetch(`${API_URL}api/telegram-auth/authViaQRCode`);
  if (!response.ok) {
    throw new Error("Не удалось получить QR-код для авторизации");
  }
  return response.json();
};