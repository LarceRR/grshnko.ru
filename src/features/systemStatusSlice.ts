// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IServer {
    arch: string;
    connected: boolean | false;
    versions: IVersions;
    nodejs_uptime: number;
}

export interface ITelegram {
    telegram: {
        telegram_client_status: boolean;
        serverData: IServer;
    }
}

export interface IVersions {
    node: string;
    acorn: string;
    ada: string;
    amaro: string;
    ares: string;
    brotli: string;
    cjs_module_lexer: string;
    cldr: string;
    icu: string;
    llhttp: string;
    modules: string;
    napi: string;
    nbytes: string;
    ncrypto: string;
    nghttp2: string;
    openssl: string;
    simdjson: string;
    simdutf: string;
    sqlite: string;
    tz: string;
    undici: string;
    unicode: string;
    uv: string;
    uvwasi: string;
    v8: string;
    zlib: string;
    zstd: string;
}

export interface IServerStatus {
  serverStatus: ITelegram | null
}

const initialState: IServerStatus = {
  serverStatus: null
}

export const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState,
  reducers: {
    updateServerStatus: (state, action: PayloadAction<ITelegram>) => {
      state.serverStatus = action.payload;
    }
  },
});

export const { updateServerStatus } = serverStatusSlice.actions;

export default serverStatusSlice.reducer;
