import { Message } from "../../../../types/postTypes";
import "./AllPosts.scss";
import "dayjs/locale/ru";
import PostItem from "./PostItem/PostItem";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../../../../config";

const AllPosts = () => {
  interface ApiResponse {
    messages: Message[];
  }

  const {
    data: allPosts,
    isLoading: isPostsLoading,
    error: postsError,
  } = useQuery<ApiResponse>({
    queryKey: ["getAllPosts"],
    queryFn: () =>
      fetch(`${API_URL}getAllMessages?channel=@saycosmos`).then((res) =>
        res.json()
      ),
  });

  // useEffect(() => {
  //   if (allPosts) {
  //     console.log(allPosts);
  //   }
  // }, [allPosts]);

  if (isPostsLoading) {
    return <div>Загрузка постов...</div>;
  }

  if (postsError) {
    return <div>Произошла ошибка</div>;
  }

  if (allPosts) {
    return (
      <div className="all-posts-wrapper">
        {allPosts?.messages
          .filter((post: Message) => post.message !== undefined)
          .map((post: Message) => (
            <PostItem key={post.id} post={post} />
          ))}
      </div>
    );
  }
};

export default AllPosts;
