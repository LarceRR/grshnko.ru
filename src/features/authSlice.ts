// store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  isVerified?: boolean;
  theme?: string | null;
  language?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

// thunk для получения текущего пользователя
export const fetchUser = createAsyncThunk("auth/fetchUser", async () => {
  if (import.meta.env.VITE_NODE_ENV === "development") {
    // фейковые данные для разработки
    return {
      id: "681b934493ff691a0847c1e1",
      username: "LarceRR",
      email: "larcerrtc@gmail.com",
      role: "ADMIN",
      avatarUrl: null,
      bio: null,
      location: null,
      website: null,
      isVerified: false,
      theme: null,
      language: "en",
      lastLoginAt: null,
      createdAt: "2025-05-07T17:07:16.536Z",
      updatedAt: "2025-05-07T17:07:16.536Z",
    } as User;
  }

  try {
    const res = await axios.get("https://core.grshnko.ru/api/sessions/me", {
      withCredentials: true,
    });

    // Если сервер вернул код не 2xx, axios кинет ошибку, сюда мы не попадем
    return res.data.user as User;
  } catch (err: any) {
    console.error("Ошибка при получении пользователя:", err);

    // Редирект на core.grshnko.ru в зависимости от окружения
    if (import.meta.env.VITE_NODE_ENV !== "development") {
      window.location.href = "https://core.grshnko.ru/";
    }

    // В development просто возвращаем null
    return null;
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.user = null;
        state.loading = false;

        if (import.meta.env.VITE_NODE_ENV !== "development") {
          window.location.href = "https://core.grshnko.ru/";
        }
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
