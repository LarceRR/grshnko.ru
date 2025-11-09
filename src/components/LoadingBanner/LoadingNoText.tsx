import "./LoaderSpinner/LoaderSpinner.scss";

const LoadingBannerNoText = () => {
  return (
    <div
      className="loader-wrapper"
      style={{
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="loader"></div>
    </div>
  );
};

export default LoadingBannerNoText;
