import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Input, message } from "antd";
import { Plus, Coins } from "lucide-react";
import { currencyApi } from "../../api/currencies";
import { useUser } from "../../hooks/useUser";
import { CurrencyIcon } from "../../components/CurrencyDisplay/CurrencyIcon";
import { IconPicker } from "../../components/IconPicker/IconPicker";
import { resolveCurrencyIconForPersist } from "../../utils/resolveCurrencyIconForPersist";
import type { Currency, CreateCurrencyPayload } from "../../types/currency";
import "./CurrenciesPage.scss";

export default function CurrenciesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [createPreparing, setCreatePreparing] = useState(false);
  const [form, setForm] = useState<CreateCurrencyPayload>({
    name: "",
    slug: "",
    icon: "💰",
    iconType: "emoji",
    iconColor: undefined,
  });

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: currencyApi.getAll,
  });

  const { data: myBalances = [] } = useQuery({
    queryKey: ["user-currencies", user?.id],
    queryFn: () => currencyApi.getUserCurrencies(user!.id),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: currencyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      setCreateOpen(false);
      setForm({
        name: "",
        slug: "",
        icon: "💰",
        iconType: "emoji",
        iconColor: undefined,
      });
      message.success("Валюта создана");
    },
  });

  const canCreate = user?.permissions.includes("CURRENCY_CREATE");
  const balanceMap = new Map(myBalances.map((b) => [b.id, b]));

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      message.warning("Заполните название и slug");
      return;
    }
    setCreatePreparing(true);
    try {
      let prep;
      try {
        prep = await resolveCurrencyIconForPersist(
          form.icon ?? "💰",
          (form.iconType ?? "emoji") as "emoji" | "lucide" | "url",
        );
      } catch {
        message.error("Не удалось загрузить иконку на сервер");
        return;
      }
      await createMutation.mutateAsync({ ...form, ...prep });
    } catch {
      message.error("Ошибка при создании валюты");
    } finally {
      setCreatePreparing(false);
    }
  };

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .replace(/^-|-$/g, "");

  return (
    <div className="currencies-page">
      <div className="currencies-page__header">
        <h2>
          <Coins size={22} />
          Валюты
          <span className="currencies-page__count">
            {isLoading ? "…" : currencies.length}
          </span>
        </h2>
        {canCreate && (
          <Button
            type="text"
            icon={<Plus size={20} />}
            className="currencies-page__add-btn"
            onClick={() => setCreateOpen(true)}
          />
        )}
      </div>

      {isLoading ? (
        <div className="currencies-page__loading">Загрузка…</div>
      ) : currencies.length === 0 ? (
        <div className="currencies-page__empty">
          <Coins size={48} strokeWidth={1} />
          <p>Валюты ещё не созданы</p>
          {canCreate && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Создать первую валюту
            </Button>
          )}
        </div>
      ) : (
        <div className="currencies-page__grid">
          {currencies.map((currency: Currency, index: number) => {
            const balance = balanceMap.get(currency.id);
            return (
              <div
                key={currency.id}
                className={`currency-card${currency.isMain ? " currency-card--main" : ""}`}
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => navigate(`/currencies/${currency.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && navigate(`/currencies/${currency.id}`)
                }
              >
                <div className="currency-card__icon">
                  <CurrencyIcon
                    icon={currency.icon}
                    iconType={currency.iconType}
                    iconColor={currency.iconColor}
                    size={36}
                  />
                </div>
                <div className="currency-card__info">
                  <div className="currency-card__name">
                    {currency.name}
                    {currency.isMain && (
                      <span className="currency-card__main-badge">главная</span>
                    )}
                  </div>
                  {currency.description && (
                    <div className="currency-card__desc">
                      {currency.description}
                    </div>
                  )}
                </div>
                {balance && balance.amount !== null && (
                  <div className="currency-card__balance">
                    {balance.amount.toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title="Создать валюту"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreate()}
        confirmLoading={createMutation.isPending || createPreparing}
        okText="Создать"
        cancelText="Отмена"
      >
        <div className="create-currency-form">
          <div className="create-currency-form__icon-row">
            <span className="create-currency-form__label">Иконка</span>
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
            />
          </div>
          <div className="create-currency-form__field">
            <span className="create-currency-form__label">Название</span>
            <Input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugify(name) }));
              }}
              placeholder="Например: Респы"
            />
          </div>
          <div className="create-currency-form__field">
            <span className="create-currency-form__label">Slug</span>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="respy"
            />
          </div>
          <div className="create-currency-form__field">
            <span className="create-currency-form__label">Описание</span>
            <Input.TextArea
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Описание валюты (необязательно)"
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
