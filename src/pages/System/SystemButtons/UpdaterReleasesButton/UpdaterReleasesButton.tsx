import { DownloadCloud } from "lucide-react";
import { useNavigate } from "react-router";
import "../UserListButton/UserListButton.scss";

const UpdaterReleasesButton = () => {
  const navigate = useNavigate();
  return (
    <div className="user-list-button" onClick={() => navigate("/system/updater-releases")}>
      <div>
        <div className="centered">
          <DownloadCloud size={34} />
        </div>
        <div className="centered" style={{ gridColumn: "span 2" }}>
          <span style={{ fontSize: "14px", textAlign: "center", marginTop: "10px" }}>
            Updater releases
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpdaterReleasesButton;
