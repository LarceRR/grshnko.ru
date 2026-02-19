import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyActivity } from "../api/activity";
import LoadingBanner from "./LoadingBanner/LoadingBanner";
import TgCosmos from "../pages/TgCosmos/TgCosmos";

/**
 * Renders the home page, or redirects to the user's chosen startup page
 * if it differs from "/".
 */
const SmartHome = () => {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["myActivity"],
    queryFn: getMyActivity,
    retry: false,
    staleTime: 5 * 60 * 1000, // re-check every 5 minutes
  });

  if (isLoading) return <LoadingBanner />;

  const startupPage = activity?.startupPage;

  // Redirect to user's chosen startup page only when it differs from the home route
  if (startupPage && startupPage !== "/") {
    return <Navigate to={startupPage} replace />;
  }

  return <TgCosmos />;
};

export default SmartHome;
