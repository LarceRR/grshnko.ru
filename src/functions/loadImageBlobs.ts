import { IImage } from "../features/imagesSlice";

export const loadImageBlobs = async (images: IImage[]) => {
    if (!images || images.length === 0) return [];
  
    try {
      // Используем Promise.all для параллельной загрузки
      const photosArray = await Promise.all(
        images.map(async (image) => {
          try {
            const response = await fetch(image.url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const blob = await response.blob();
            return {
              image: new Date().getTime(), // Используем getTime() вместо getDate() для уникальности
              blob: blob,
              url: image.url // Сохраняем исходный URL для reference
            };
          } catch (error) {
            console.error(`Error loading image ${image.url}:`, error);
            return null; // или можно выбросить ошибку
          }
        })
      );
  
      // Фильтруем возможные null (если были ошибки загрузки)
      return photosArray.filter(item => item !== null);
    } catch (error) {
      console.error('Error in loadImageBlobs:', error);
      return [];
    }
  };