import "./LoadingBanner.scss";

const LoadingBanner = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="loader-wrapper">
        <div className="loader"></div>
        <h1>Идет загрузка страницы...</h1>
        <span>Пожалуйста, подождите</span>
      </div>
    </div>
  );
};

export default LoadingBanner;
