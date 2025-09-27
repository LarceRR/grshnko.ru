import { useEffect, useRef, useState, MutableRefObject } from "react";
import QRCodeStyling, { Options } from "qr-code-styling";

interface UseQRCodeProps {
  options: Options;
  data?: string;
}

interface UseQRCodeReturn {
  qrRef: MutableRefObject<HTMLDivElement | null>;
  updateQRCode: (data: string) => void;
  qrInstance: QRCodeStyling | null;
}

export const useQRCode = ({
  options,
  data,
}: UseQRCodeProps): UseQRCodeReturn => {
  const qrRef = useRef<HTMLDivElement | null>(null);
  const [qrInstance, setQrInstance] = useState<QRCodeStyling | null>(null);

  // Создание экземпляра QR один раз
  useEffect(() => {
    const instance = new QRCodeStyling(options);
    setQrInstance(instance);

    if (qrRef.current) {
      instance.append(qrRef.current);
    }

    return () => {
      if (qrRef.current) qrRef.current.innerHTML = "";
    };
  }, []); // создаём один раз

  // Автообновление при смене data
  useEffect(() => {
    if (qrInstance && data) {
      qrInstance.update({ data });
    }
  }, [data, qrInstance]);

  const updateQRCode = (newData: string) => {
    if (qrInstance) {
      qrInstance.update({ data: newData });
    }
  };

  return { qrRef, updateQRCode, qrInstance };
};
