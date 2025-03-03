import React from "react";
import "./ImageSelector.scss";
import { Button } from "antd";
import { Ellipsis } from "lucide-react";

interface IImageSelectorProps {
  prompt: string;
}

const images = [
  "https://nanotech.academic.ru/pictures/nanotech_en_ru/blm.jpg",
  "https://www.chem.msu.ru/rus/teaching/kolman/217.jpg",
  "https://eng.thesaurus.rusnano.com/upload/iblock/e8d/bilayer.jpg",
  "https://media.istockphoto.com/id/1483447285/ru/%D0%B2%D0%B5%D0%BA%D1%82%D0%BE%D1%80%D0%BD%D0%B0%D1%8F/%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%82%D1%83%D1%80%D0%B0-%D1%84%D0%BE%D1%81%D1%84%D0%BE%D0%BB%D0%B8%D0%BF%D0%B8%D0%B4%D0%BD%D0%BE%D0%B3%D0%BE-%D0%B1%D0%B8%D1%81%D0%BB%D0%BE%D1%8F-%D0%B2-%D0%BA%D0%BB%D0%B5%D1%82%D0%BE%D1%87%D0%BD%D0%BE%D0%B9-%D0%BC%D0%B5%D0%BC%D0%B1%D1%80%D0%B0%D0%BD%D0%B5.jpg?s=612x612&w=0&k=20&c=iH5h7OFa7_-d7fvp1oQ2Qw7TxNZDHWU0zk_vmsHfGEI=",
  "https://gcagro.ru/assets/images/lipidy-v-biologicheskih-membranah-goldkovagro-minsk-belarus-analizator-moloka-korova-ferma.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/0303_Lipid_Bilayer_With_Various_Components.jpg/525px-0303_Lipid_Bilayer_With_Various_Components.jpg",
  "https://www.ras.ru/FStorage/Download.aspx?id=5f773377-9751-4591-ae1c-2e4ab9a62b11",
  "http://www.issp.ac.ru/journal/perst/Control/Inform/perst/2014/14_05/14_05_11.jpg",
  "https://media.istockphoto.com/id/467698230/ru/%D1%84%D0%BE%D1%82%D0%BE/%D0%B0%D0%B4%D0%B5%D0%BD%D0%BE%D0%B7%D0%B8%D0%BD-a1-%D1%80%D0%B5%D1%86%D0%B5%D0%BF%D1%82%D0%BE%D1%80%D0%B0-%D0%B2-%D0%B4%D0%B2%D0%BE%D0%B9%D0%BD%D0%BE%D0%BC-%D0%BB%D0%B8%D0%BF%D0%B8%D0%B4%D0%BD%D0%B0%D1%8F-%D0%BC%D0%B5%D0%BC%D0%B1%D1%80%D0%B0%D0%BD%D0%B0-%D0%BA%D0%BB%D0%B5%D1%82%D0%BA%D0%B8.jpg?s=1024x1024&w=is&k=20&c=WNOstLUxt1FDEAMbexnsYQBhH6gHOCPaiw2l18OIBb0=",
  "http://rscf.ru/upload/iblock/884/u54nck8a1f7d8vdfaxjiwrmxlqmimo97.jpg",
];

const ImageSelector: React.FC<IImageSelectorProps> = () => {
  return (
    <div className="image-selector-wrapper">
      <div className="image-selector-result">
        <div className="image-selector-result__header">
          <p>Выберите от 1 до 3 из предложенных изображенний</p>
          <div className="image-selector-result__header-buttons">
            <Button className="get-new-images">Получить изображежния</Button>
            <Ellipsis />
          </div>
        </div>
        <div className="image-selector-gallery">
          {images.map((image: string, index: number) => (
            <div key={index} className="image-selector-gallery-image">
              <img className="blured_image" src={image} alt="alt"></img>
              <div className="white-cover-image"></div>
              <img className="image" src={image} alt="alt"></img>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;
