import { useState } from "react";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import {
  VARIABLES,
  FUNCTIONS,
  SELECTOR_EXAMPLES,
  COLOR_EXAMPLES,
  type RefItem,
} from "./expressionEngineDocs";
import "./ExpressionReference.scss";

interface ExpressionReferenceProps {
  /** Вставка в поле selector */
  onInsertSelector?: (text: string) => void;
  /** Применить пример цвета (r,g,b) */
  onInsertColor?: (r: string, g: string, b: string) => void;
  /** Вставка в любое поле (если передан ref на input) */
  onInsert?: (text: string) => void;
}

export default function ExpressionReference({
  onInsertSelector,
  onInsertColor,
  onInsert,
}: ExpressionReferenceProps) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("selector");
  const toggleSection = (id: string) => {
    setActiveSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="expr-ref">
      <button
        type="button"
        className="expr-ref__toggle"
        onClick={() => setOpen(!open)}
      >
        <HelpCircle size={18} />
        <span>Справка движка</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div className="expr-ref__content">
          <Section
            title="Переменные"
            id="vars"
            active={activeSection}
            onToggle={toggleSection}
          >
            <div className="expr-ref__grid">
              {VARIABLES.map((v) => (
                <RefItemRow key={v.name} item={v} onInsert={onInsert} />
              ))}
            </div>
          </Section>

          <Section
            title="Функции"
            id="funcs"
            active={activeSection}
            onToggle={toggleSection}
          >
            <div className="expr-ref__grid">
              {FUNCTIONS.map((f) => (
                <RefItemRow key={f.name} item={f} onInsert={onInsert} />
              ))}
            </div>
          </Section>

          <Section
            title="Selector — маска пикселей"
            id="selector"
            active={activeSection}
            onToggle={toggleSection}
          >
            <p className="expr-ref__hint">
              Выражение 0 или 1. Где 1 — слой рисуется. «1» = все пиксели.
            </p>
            <div className="expr-ref__examples">
              {SELECTOR_EXAMPLES.map((e) => (
                <button
                  key={e.expr}
                  type="button"
                  className="expr-ref__example-btn"
                  onClick={() => (onInsertSelector ?? onInsert)?.(e.expr)}
                >
                  <span className="expr-ref__example-label">{e.label}</span>
                  <code>{e.expr}</code>
                </button>
              ))}
            </div>
          </Section>

          <Section
            title="Примеры цветов"
            id="colors"
            active={activeSection}
            onToggle={toggleSection}
          >
            <div className="expr-ref__examples">
              {COLOR_EXAMPLES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  className="expr-ref__example-btn expr-ref__example-btn--color"
                  onClick={() => onInsertColor?.(c.r, c.g, c.b)}
                >
                  <span className="expr-ref__example-label">{c.label}</span>
                  <code>
                    {c.r} / {c.g} / {c.b}
                  </code>
                </button>
              ))}
            </div>
          </Section>

          <Section
            title="Операторы"
            id="ops"
            active={activeSection}
            onToggle={toggleSection}
          >
            <div className="expr-ref__ops">
              <code>+ - * / %</code> арифметика
              <code>== != &lt; &gt; &lt;= &gt;=</code> сравнение
              <code>&amp;&amp; || !</code> логика
              <code>cond ? a : b</code> условие
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  id,
  active,
  onToggle,
  children,
}: {
  title: string;
  id: string;
  active: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = active === id;
  return (
    <div className="expr-ref__section">
      <button
        type="button"
        className="expr-ref__section-title"
        onClick={() => onToggle(id)}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {isOpen && <div className="expr-ref__section-body">{children}</div>}
    </div>
  );
}

function RefItemRow({
  item,
  onInsert,
}: {
  item: RefItem;
  onInsert?: (t: string) => void;
}) {
  const insert = item.example || item.name;
  return (
    <div className="expr-ref__row">
      <code className="expr-ref__name">{item.name}</code>
      <span className="expr-ref__desc">{item.desc}</span>
      {onInsert && insert && (
        <button
          type="button"
          className="expr-ref__insert"
          onClick={() => onInsert(insert)}
          title={`Вставить: ${insert}`}
        >
          +
        </button>
      )}
    </div>
  );
}
