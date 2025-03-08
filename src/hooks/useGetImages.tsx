import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import axios from "axios";
import {
  IImage,
  setImages,
  setIsImagesAlreadyRequested,
  setLoading,
} from "../features/images";

const url = import.meta.env.VITE_API_URL;

// Define the custom hook
const useGetImages = () => {
  const [error, setError] = useState<string | null>(null);

  const { images } = useAppSelector((state) => state.images);
  const { topic } = useAppSelector((state) => state.topic);
  const dispatch = useAppDispatch();

  const fetchImages = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setIsImagesAlreadyRequested(true));

      const response = await axios.get<IImage[]>(
        `${url}/getGoogleImages?query=${topic.eng_term}`
      );

      dispatch(setImages(response.data));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.message);
      } else {
        setError(`Unknown error: ${error}`);
      }
    } finally {
      dispatch(setLoading(false));
      dispatch(setIsImagesAlreadyRequested(false));
    }
  };

  useEffect(() => {
    fetchImages();
  }, [topic]); // Re-run the effect if photoId changes

  return { fetchImages, images, error };
};

export default useGetImages;
