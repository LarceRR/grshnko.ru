import "./DashboardHeader.scss";
import { Ellipsis } from "lucide-react";
import { useWindowSize } from "../../../../hooks/useWindowSize";
import Button from "../../../../components/custom-components/custom-button";
import PopularPost from "./PopularPost/PopularPost";
import usePostController from "../../../../hooks/postsController";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "antd";
import ServerStatus from "./ServerStatus/ServerStatus";

const DashboardHeader = () => {
  const { getPopularPosts, popularPosts, posts } = usePostController();

  const navigate = useNavigate();

  useEffect(() => {
    getPopularPosts();
  }, []);

  // useEffect(() => {
  //   console.log(popularPosts);
  // }, [popularPosts]);

  const { size } = useWindowSize();

  if (size[0] > 1028) {
    return (
      <div className="dashboard-block-wrapper">
        <ServerStatus />
        <div className="divider"></div>
        {popularPosts ? (
          <PopularPost maxShowEmojies={30} popularPosts={popularPosts} />
        ) : (
          <Skeleton.Avatar
            active={true}
            size={"large"}
            shape="square"
            style={{
              height: "70px",
              width: "100px",
              borderRadius: 5,
            }}
          />
        )}
        <div className="divider"></div>
        <div>
          <Ellipsis />
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="dashboard-block-wrapper"
        style={{
          display: "flex",
        }}
      >
        <PopularPost maxShowEmojies={7} popularPosts={popularPosts} />
        <div className="dashboard-additional-buttons">
          <Button
            className="dashboard-additional-button"
            onClick={() => navigate("/tgcosmos/allPosts")}
          >
            Показать все посты ({posts?.messages.length})
          </Button>
          <Button className="dashboard-additional-button" disabled>
            Показать отложенные посты (0)
          </Button>
        </div>
      </div>
    );
  }
};

export default DashboardHeader;
