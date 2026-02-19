import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select } from "antd";
import { Home } from "lucide-react";
import { getMyActivity, updatePreferences } from "../../../../api/activity";
import { APP_ROUTES, buildSelectOptions } from "../../../../config/routes.config";
import "./StartupPageSelector.scss";

const StartupPageSelector = () => {
  const queryClient = useQueryClient();

  const { data: activity, isLoading } = useQuery({
    queryKey: ["myActivity"],
    queryFn: getMyActivity,
    retry: false,
  });

  const { mutate: saveStartupPage, isPending } = useMutation({
    mutationFn: (page: string | null) =>
      updatePreferences({ startupPage: page }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myActivity"] });
    },
  });

  const currentValue = activity?.startupPage ?? "/";

  return (
    <div className="startup-page-selector">
      <div className="startup-page-selector__header">
        <Home size={18} />
        <span>Стартовая страница</span>
      </div>
      <div className="startup-page-selector__footer">
        <span className="startup-page-selector__desc">
          Страница при входе на сайт
        </span>
        <Select
          className="startup-page-selector__select"
          value={currentValue}
          loading={isLoading || isPending}
          onChange={(value: string) =>
            saveStartupPage(value === "/" ? null : value)
          }
          options={buildSelectOptions(APP_ROUTES)}
        />
      </div>
    </div>
  );
};

export default StartupPageSelector;
