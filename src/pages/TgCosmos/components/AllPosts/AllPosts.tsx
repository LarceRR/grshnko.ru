import { useEffect } from "react";
import usePostController from "../../../../hooks/postsController";
import { Message } from "../../../../types/postTypes";
import "./AllPosts.scss";
import "dayjs/locale/ru";
import PostItem from "./PostItem/PostItem";

const AllPosts = () => {
  const { getAllPosts, posts, loading, error } = usePostController();

  useEffect(() => {
    getAllPosts();
  }, []);

  if (loading) {
    return <div>Загрузка постов...</div>;
  }

  if (error) {
    return <div>Произошла ошибка</div>;
  }

  if (posts) {
    return (
      <div className="all-posts-wrapper">
        {posts.messages
          .filter(
            (post): post is Message => (post as Message).message !== undefined
          )
          .map((post: Message) => (
            <PostItem key={post.id} post={post} />
          ))}
      </div>
    );
  }
};

export default AllPosts;
