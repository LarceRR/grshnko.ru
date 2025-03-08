// src/features/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IThumbnail {
    url: string;        // URL миниатюры изображения
    width: number;      // Ширина миниатюры
    height: number;     // Высота миниатюры
}

export interface IImage {
    type: string;       // Тип изображения (например, "image/jpeg")
    width: number;      // Ширина изображения
    height: number;     // Высота изображения
    size: number;       // Размер изображения в байтах
    url: string;        // URL изображения
    thumbnail: IThumbnail; // Миниатюра изображения
    description: string; // Описание изображения
    parentPage: string;  // URL страницы, на которой находится изображение
}

interface IImagesState {
  images: IImage[],
  loading: boolean,
  error: string,
  isAlreadyAsked: boolean
}

const initialState: IImagesState = {
  images: [],
  loading: false,
  error: '',
  isAlreadyAsked: false
}

export const imagesSlice = createSlice({
  name: "post_images",
  initialState,
  reducers: {
    setImages: (state, action: PayloadAction<IImage[]>) => {
      state.images = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
    },
    setIsImagesAlreadyRequested: (state, action: PayloadAction<boolean>) => {
      state.isAlreadyAsked = action.payload
    }
  },
});

export const { setImages, setLoading, setError, setIsImagesAlreadyRequested } = imagesSlice.actions;

export default imagesSlice.reducer;
