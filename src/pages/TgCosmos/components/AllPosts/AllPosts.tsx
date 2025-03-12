import { useEffect } from "react";
import usePostController from "../../../../hooks/postsController";
import { Message } from "../../../../types/postTypes";
import "./AllPosts.scss";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import relativeTime from "dayjs/plugin/relativeTime";

const AllPosts = () => {
  const { getAllPosts, posts, loading, error } = usePostController();

  dayjs.extend(relativeTime);
  dayjs.locale("ru");

  useEffect(() => {
    getAllPosts();
  }, []);

  if (posts) {
    console.log(posts);
  }

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
            <div>
              <div>
                <span>
                  {dayjs(post.date * 1000)
                    .startOf("millisecond")
                    .fromNow()}
                </span>
                <span>({dayjs(post.date * 1000).format("HH:mm")})</span>
              </div>
              <p>{post.message}</p>
            </div>
          ))}
      </div>
    );
  }
};

export default AllPosts;
