import "./LoaderSpinner.scss";

interface LoaderSpinnerProps {
  style?: React.CSSProperties;
}

const LoaderSpinner = ({ style }: LoaderSpinnerProps) => {
  return (
    <div
      style={{
        ...style,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "10px",
        height: "100%",
        width: "100%",
      }}
    >
      <div className="loader"></div>
    </div>
  );
};

export default LoaderSpinner;
