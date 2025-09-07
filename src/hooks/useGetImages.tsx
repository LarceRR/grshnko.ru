import { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import axios from "axios";
import {
  IImage,
  setImages,
  setIsImagesAlreadyRequested,
  setLoading,
  setSelectedImages,
} from "../features/imagesSlice";
import { API_URL } from "../config";

// Define the custom hook
const useGetImages = () => {
  const [error, setError] = useState<string | null>(null);
  const { images } = useAppSelector((state) => state.images);
  const { topic } = useAppSelector((state) => state.topic);
  const dispatch = useAppDispatch();

  // Флаг, который предотвратит повторные вызовы
  const isFetchingRef = useRef(false);

  const fetchImages = useCallback(async () => {
    dispatch(setSelectedImages([]));
    const query = topic?.eng_term?.trim();

    if (!query || isFetchingRef.current) return;

    isFetchingRef.current = true;
    dispatch(setLoading(true));
    dispatch(setIsImagesAlreadyRequested(true));

    try {
      const response = await axios.get<IImage[]>(
        `${API_URL}getImages?query=${query}`,
        {
          withCredentials: true,
        }
      );
      dispatch(setImages(response.data));
      setError(null);
    } catch (error) {
      setError(
        axios.isAxiosError(error) ? error.message : `Unknown error: ${error}`
      );
    } finally {
      dispatch(setLoading(false));
      dispatch(setIsImagesAlreadyRequested(false));
      isFetchingRef.current = false;
    }
  }, [topic, dispatch]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    // console.log(topic);
    fetchImages();
  }, [topic]);

  return { fetchImages, images, error };
};

export default useGetImages;
