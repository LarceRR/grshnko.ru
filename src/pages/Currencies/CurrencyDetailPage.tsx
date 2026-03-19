import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, InputNumber, Select, message } from "antd";
import { ArrowLeft, Crown, Trash2, UserPlus, Pen } from "lucide-react";
import { useState, useMemo } from "react";
import { currencyApi } from "../../api/currencies";
import { getAllUsers } from "../../api/user";
import { useUser } from "../../hooks/useUser";
import { CurrencyIcon } from "../../components/CurrencyDisplay/CurrencyIcon";
import { IconPicker } from "../../components/IconPicker/IconPicker";
import { resolveCurrencyIconForPersist } from "../../utils/resolveCurrencyIconForPersist";
import type { UpdateCurrencyPayload } from "../../types/currency";
import type { User } from "../../types/user";
import "./CurrencyDetailPage.scss";

export default function CurrencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const [editing, setEditing] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState<UpdateCurrencyPayload>({});
  const [savePreparing, setSavePreparing] = useState(false);

  const { data: currency, isLoading } = useQuery({
    queryKey: ["currency", id],
    queryFn: () => currencyApi.getById(id!),
    enabled: !!id,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["usersList"],
    queryFn: () => getAllUsers() as Promise<User[]>,
    enabled: adjustOpen,
  });

  const userOptions = useMemo(() => {
    const q = userSearch.toLowerCase();
    return allUsers
      .filter(
        (u) =>
          !q ||
          u.username.toLowerCase().includes(q) ||
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q),
      )
      .map((u) => ({
        value: u.id,
        label: `${u.username}${u.firstName ? ` (${u.firstName} ${u.lastName || ""})` : ""}`,
      }));
  }, [allUsers, userSearch]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCurrencyPayload) => currencyApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      queryClient.invalidateQueries({ queryKey: ["currency", id] });
      setEditing(false);
      message.success("Валюта обновлена");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => currencyApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      navigate("/currencies");
      message.success("Валюта удалена");
    },
  });

  const setMainMutation = useMutation({
    mutationFn: () => currencyApi.setMain(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      queryClient.invalidateQueries({ queryKey: ["currency", id] });
      message.success("Установлена как главная валюта");
    },
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      currencyApi.adjustBalance(id!, {
        userId: adjustUserId,
        amount: adjustAmount,
        reason: adjustReason || undefined,
      }),
    onSuccess: (data) => {
      setAdjustOpen(false);
      setAdjustUserId("");
      setAdjustAmount(0);
      setAdjustReason("");
      queryClient.invalidateQueries({ queryKey: ["usersList"] });
      queryClient.invalidateQueries({ queryKey: ["user-currencies"] });
      queryClient.invalidateQueries({ queryKey: ["user", adjustUserId] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      message.success(`Баланс обновлён: ${data.balance}`);
    },
    onError: () => message.error("Ошибка изменения баланса"),
  });

  const canEdit = user?.permissions.includes("CURRENCY_UPDATE");
  const canDelete = user?.permissions.includes("CURRENCY_DELETE");
  const canAdjust = user?.permissions.includes("CURRENCY_ADJUST_BALANCE");

  const startEdit = () => {
    if (!currency) return;
    setForm({
      name: currency.name,
      description: currency.description || "",
      icon: currency.icon || "",
      iconType: currency.iconType,
      iconColor: currency.iconColor || undefined,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSavePreparing(true);
    try {
      let prep;
      try {
        prep = await resolveCurrencyIconForPersist(
          form.icon ?? "",
          (form.iconType ?? "emoji") as "emoji" | "lucide" | "url",
        );
      } catch {
        message.error("Не удалось загрузить иконку на сервер");
        return;
      }
      await updateMutation.mutateAsync({
        ...form,
        icon: prep.icon,
        iconType: prep.iconType,
      });
    } catch {
      message.error("Не удалось сохранить валюту");
    } finally {
      setSavePreparing(false);
    }
  };

  if (isLoading)
    return <div className="currency-detail__loading">Загрузка…</div>;
  if (!currency)
    return <div className="currency-detail__loading">Валюта не найдена</div>;

  return (
    <div className="currency-detail">
      <div className="currency-detail__back">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate("/currencies")}
        >
          Назад
        </Button>
      </div>

      <div className="currency-detail__card">
        <div className="currency-detail__hero">
          <div className="currency-detail__icon-wrapper">
            {editing ? (
              <IconPicker
                value={form.icon || ""}
                iconType={form.iconType || "emoji"}
                iconColor={form.iconColor}
                onChange={(icon, iconType) =>
                  setForm((f) => ({ ...f, icon, iconType }))
                }
                onColorChange={(color) =>
                  setForm((f) => ({ ...f, iconColor: color }))
                }
                size={64}
              />
            ) : (
              <CurrencyIcon
                icon={currency.icon}
                iconType={currency.iconType}
                iconColor={currency.iconColor}
                size={64}
              />
            )}
          </div>

          <div className="currency-detail__title-block">
            {editing ? (
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="currency-detail__name-input"
                placeholder="Название"
              />
            ) : (
              <h2 className="currency-detail__name">
                {currency.name}
                {currency.isMain && (
                  <span className="currency-detail__main-badge">
                    <Crown size={14} /> Главная валюта
                  </span>
                )}
              </h2>
            )}
            <span className="currency-detail__slug">/{currency.slug}</span>
          </div>
        </div>

        <div className="currency-detail__section">
          <span className="currency-detail__label">Описание</span>
          {editing ? (
            <Input.TextArea
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Описание валюты"
            />
          ) : (
            <p className="currency-detail__value">
              {currency.description || "Нет описания"}
            </p>
          )}
        </div>

        {canEdit && (
          <div className="currency-detail__actions">
            {editing ? (
              <>
                <Button
                  type="primary"
                  onClick={() => void saveEdit()}
                  loading={updateMutation.isPending || savePreparing}
                >
                  Сохранить
                </Button>
                <Button onClick={() => setEditing(false)}>Отмена</Button>
              </>
            ) : (
              <>
                <Button icon={<Pen size={14} />} onClick={startEdit}>
                  Редактировать
                </Button>
                {!currency.isMain && (
                  <Button
                    icon={<Crown size={14} />}
                    onClick={() => setMainMutation.mutate()}
                    loading={setMainMutation.isPending}
                  >
                    Сделать главной
                  </Button>
                )}
                {canAdjust && (
                  <Button
                    icon={<UserPlus size={14} />}
                    onClick={() => setAdjustOpen(true)}
                  >
                    Выдать/списать
                  </Button>
                )}
                {canDelete && (
                  <Button
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() =>
                      Modal.confirm({
                        title: "Удалить валюту?",
                        content:
                          "Это действие необратимо. Все балансы будут потеряны.",
                        okText: "Удалить",
                        cancelText: "Отмена",
                        okButtonProps: { danger: true },
                        onOk: () => deleteMutation.mutateAsync(),
                      })
                    }
                  >
                    Удалить
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Modal
        title="Выдать / списать валюту"
        open={adjustOpen}
        onCancel={() => setAdjustOpen(false)}
        onOk={() => adjustMutation.mutate()}
        confirmLoading={adjustMutation.isPending}
        okText="Применить"
        cancelText="Отмена"
        okButtonProps={{ disabled: !adjustUserId || adjustAmount === 0 }}
      >
        <div className="adjust-form">
          <div className="adjust-form__field">
            <span>Пользователь</span>
            <Select
              showSearch
              value={adjustUserId || undefined}
              placeholder="Выберите пользователя"
              filterOption={false}
              onSearch={setUserSearch}
              onChange={setAdjustUserId}
              options={userOptions}
              style={{ width: "100%" }}
              notFoundContent="Пользователи не найдены"
            />
          </div>
          <div className="adjust-form__field">
            <span>Количество (отрицательное для списания)</span>
            <InputNumber
              value={adjustAmount}
              onChange={(v) => setAdjustAmount(v ?? 0)}
              style={{ width: "100%" }}
            />
          </div>
          <div className="adjust-form__field">
            <span>Причина</span>
            <Input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
