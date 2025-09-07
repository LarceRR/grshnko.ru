import { useUser } from "../../../../hooks/useUser"; // путь под себя

const Logout = () => {
  const { logout } = useUser();

  return <span onClick={logout}>Выйти</span>;
};

export default Logout;
