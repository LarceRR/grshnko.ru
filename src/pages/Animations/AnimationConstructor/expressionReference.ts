/** Справочник возможностей движка — переменные, функции, примеры */

export interface RefItem {
  name: string;
  desc: string;
  example?: string;
}

export const VARIABLES: RefItem[] = [
  { name: "i", desc: "Индекс пикселя 0..ledCount-1", example: "i / ledCount" },
  { name: "t", desc: "Время в секундах (не миллисекунды!)", example: "t * speed" },
  { name: "r", desc: "Случайное 0..255 каждый кадр", example: "r > 250" },
  { name: "ledCount", desc: "Всего LED на ленте", example: "i / ledCount" },
  { name: "pi", desc: "Число π", example: "sin(i * pi / ledCount)" },
  { name: "e", desc: "Число Эйлера", example: "" },
  { name: "prev_r", desc: "R предыдущего кадра (0..255)", example: "prev_r * 0.9" },
  { name: "prev_g", desc: "G предыдущего кадра", example: "" },
  { name: "prev_b", desc: "B предыдущего кадра", example: "" },
  { name: "evt0_val", desc: "Событие 0: значение", example: "evt0_val" },
  { name: "evt0_pos", desc: "Событие 0: позиция", example: "abs(i - evt0_pos)" },
  { name: "evt0_width", desc: "Событие 0: ширина", example: "" },
  { name: "field", desc: "Поле диффузии 0..1", example: "field" },
  { name: "charge", desc: "Заряд (лавина при ≥1)", example: "charge" },
  { name: "particle_count", desc: "Кол-во частиц", example: "" },
  { name: "particle_near", desc: "Близость частиц 0..1", example: "particle_near" },
];

export const FUNCTIONS: RefItem[] = [
  { name: "sin(x)", desc: "Синус, период 1.0, результат -1..1", example: "sin(i/ledCount + t)" },
  { name: "cos(x)", desc: "Косинус, период 1.0", example: "cos(t * 0.5)" },
  { name: "noise(seed)", desc: "Шум 0..1, плавный", example: "noise(i*0.1 + t*0.5)" },
  { name: "noise2D(x,y)", desc: "2D шум, без движения", example: "noise2D(i*0.05, t*0.3)" },
  { name: "hash(x)", desc: "Псевдослучайное 0..1", example: "hash(i*137 + floor(t*10))" },
  { name: "min(a,b)", desc: "Минимум", example: "min(r, 255)" },
  { name: "max(a,b)", desc: "Максимум", example: "max(0, r)" },
  { name: "clamp(v,lo,hi)", desc: "Ограничить диапазон", example: "clamp(r, 0, 255)" },
  { name: "abs(x)", desc: "Модуль", example: "abs(sin(t))" },
  { name: "floor(x)", desc: "Округление вниз", example: "floor(t * 10)" },
  { name: "round(x)", desc: "Округление", example: "" },
  { name: "fract(x)", desc: "Дробная часть 0..1", example: "fract(t)" },
  { name: "pow(b,e)", desc: "Степень", example: "pow(2, 3)" },
  { name: "sqrt(x)", desc: "Корень", example: "sqrt(i)" },
  { name: "lerp(a,b,t)", desc: "Линейная интерполяция", example: "lerp(0, 255, t)" },
  { name: "map(v,i0,i1,o0,o1)", desc: "Смена диапазона", example: "map(sin(t), -1, 1, 0, 255)" },
  { name: "smoothstep(e0,e1,x)", desc: "S-кривая 0→1", example: "smoothstep(0, 0.15, abs(i/ledCount - 0.5))" },
  { name: "step(edge,x)", desc: "Порог 0 или 1", example: "step(0.5, noise(i))" },
  { name: "select(cond,a,b)", desc: "Условие ? a : b", example: "select(i>50, 255, 0)" },
  { name: "easeIn(x)", desc: "Easing 0..1", example: "" },
  { name: "easeOut(x)", desc: "Easing 0..1", example: "" },
  { name: "easeInOut(x)", desc: "Easing 0..1", example: "" },
  { name: "bounce(x)", desc: "Отскок", example: "" },
  { name: "elastic(x)", desc: "Пружина", example: "" },
  { name: "mirror(x)", desc: "0→1→0 пилообразная", example: "mirror(t)" },
  { name: "reverse(x)", desc: "ledCount-1-x", example: "reverse(i)" },
  { name: "wrap(x,off)", desc: "(x+off) % ledCount", example: "" },
  { name: "hsv(h,s,v)", desc: "HSV → RGB, h,s,v 0..1", example: "hsv(i/ledCount + t*0.2, 1, 1)" },
  { name: "wave_collapse(prob)", desc: "Случай 0/1, prob 0..1", example: "wave_collapse(0.01)" },
  { name: "ca_rule(n)", desc: "Клеточный автомат Вольфрама", example: "ca_rule(30)" },
  { name: "echo_r(N)", desc: "R кадра N назад", example: "echo_r(5)" },
  { name: "fmsin(carrier,mod,depth)", desc: "FM-синтез синуса", example: "fmsin(t, t*2, 0.3)" },
];

export const SELECTOR_EXAMPLES: { label: string; expr: string }[] = [
  { label: "Все пиксели", expr: "1" },
  { label: "Правая половина", expr: "i > ledCount / 2" },
  { label: "Левая половина", expr: "i < ledCount / 2" },
  { label: "Центр (полоска)", expr: "abs(i - ledCount/2) < 20" },
  { label: "Случайные искры", expr: "noise(i*0.5 + t*2) > 0.94" },
  { label: "Хеш-искры", expr: "hash(i*137 + floor(t*10)) > 0.98" },
  { label: "Волна (маска)", expr: "sin(i/ledCount + t) > 0" },
  { label: "Каждый 3-й", expr: "i % 3 == 0" },
];

export const COLOR_EXAMPLES: { label: string; r: string; g: string; b: string }[] = [
  { label: "Красный", r: "255", g: "0", b: "0" },
  { label: "Радуга (sin)", r: "127 + 127*sin(i/ledCount + t)", g: "127 + 127*sin(i/ledCount + t + 0.33)", b: "127 + 127*sin(i/ledCount + t + 0.67)" },
  { label: "Огонь (noise)", r: "255", g: "noise(i*0.1 + t*1.5) * 120", b: "0" },
  { label: "Trail (prev)", r: "prev_r * 0.9", g: "prev_g * 0.9", b: "prev_b * 0.9" },
  { label: "Шум", r: "noise(i*0.1 + t) * 255", g: "noise(i*0.1 + t + 100) * 255", b: "noise(i*0.1 + t + 200) * 255" },
  { label: "Градиент", r: "i / ledCount * 255", g: "100", b: "255 - i/ledCount*255" },
];
