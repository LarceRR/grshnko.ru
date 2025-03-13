import "./DashboardHeader.scss";
import HighlightedText from "../../../../components/HighlightedText/HighlightedText";
import { Ellipsis } from "lucide-react";
import { useWindowSize } from "../../../../hooks/useWindowSize";
import Button from "../../../../components/custom-components/custom-button";
import PopularPost from "./PopularPost/PopularPost";
import usePostController from "../../../../hooks/postsController";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const { getPopularPosts, popularPosts, posts } = usePostController();

  const navigate = useNavigate();

  useEffect(() => {
    getPopularPosts();
  }, []);

  useEffect(() => {
    console.log(popularPosts);
  }, [popularPosts]);

  const { size } = useWindowSize();

  if (size[0] > 1028) {
    return (
      <div className="dashboard-block-wrapper">
        <div className="status-item">
          <span>Статус:</span>
          <HighlightedText color="#ff0000">Онлайн</HighlightedText>
        </div>
        <div className="divider"></div>
        <PopularPost maxShowEmojies={30} popularPosts={popularPosts} />
        <div className="divider"></div>
        <div>
          <Ellipsis />
        </div>
      </div>
    );
  } else {
    return (
      <div className="dashboard-block-wrapper">
        <PopularPost maxShowEmojies={7} popularPosts={popularPosts} />
        <div className="dashboard-additional-buttons">
          <Button
            className="dashboard-additional-button"
            onClick={() => navigate("/tgcosmos/allPosts")}
          >
            Показать все посты({posts?.messages.length})
          </Button>
          <Button className="dashboard-additional-button" disabled>
            Показать отложенные посты(unreleased)
          </Button>
        </div>
      </div>
    );
  }
};

export default DashboardHeader;
