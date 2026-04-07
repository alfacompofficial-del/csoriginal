import { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface SettingsPanelProps {
  onBack: () => void;
}

const defaultKeybinds: Record<string, string> = {
  "Вперёд": "W",
  "Назад": "S",
  "Влево": "A",
  "Вправо": "D",
  "Прыжок": "Space",
  "Присесть": "Ctrl",
  "Перезарядка": "R",
  "Взаимодействие": "E",
  "Дефьюз": "E",
  "Основное оружие": "1",
  "Вторичное оружие": "2",
  "Нож": "3",
  "Граната": "4",
  "Бомба": "5",
  "Табло": "Tab",
  "Чат": "Y",
  "Командный чат": "U",
};

const mouseBinds: Record<string, string> = {
  "Стрельба": "Mouse1 (ЛКМ)",
  "Прицел / Вторичная атака": "Mouse2 (ПКМ)",
  "Смена оружия": "Mouse3 (Колёсико)",
};

const crosshairColors = [
  { name: "Зелёный", value: "#00ff00" },
  { name: "Красный", value: "#ff0000" },
  { name: "Жёлтый", value: "#ffff00" },
  { name: "Голубой", value: "#00ffff" },
  { name: "Белый", value: "#ffffff" },
  { name: "Розовый", value: "#ff69b4" },
];

const SettingsPanel = ({ onBack }: SettingsPanelProps) => {
  const [tab, setTab] = useState<"keys" | "game">("keys");
  const [keybinds, setKeybinds] = useState(defaultKeybinds);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(2.5);
  const [crosshairSize, setCrosshairSize] = useState(4);
  const [crosshairGap, setCrosshairGap] = useState(2);
  const [crosshairThickness, setCrosshairThickness] = useState(1);
  const [crosshairColor, setCrosshairColor] = useState("#00ff00");
  const [crosshairDot, setCrosshairDot] = useState(false);
  const [hideAvatars, setHideAvatars] = useState(false);
  const [hideNicknames, setHideNicknames] = useState(false);
  const [showAlive, setShowAlive] = useState(true);

  const handleKeyCapture = (action: string) => {
    setEditingKey(action);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
      setKeybinds((prev) => ({ ...prev, [action]: key }));
      setEditingKey(null);
      window.removeEventListener("keydown", handler);
    };
    window.addEventListener("keydown", handler);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-3xl font-bold text-foreground uppercase tracking-wider">Настройки</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setTab("keys")}
            className={`cs-tab ${tab === "keys" ? "cs-tab-active" : ""}`}
          >
            Клавиатура и мышь
          </button>
          <button
            onClick={() => setTab("game")}
            className={`cs-tab ${tab === "game" ? "cs-tab-active" : ""}`}
          >
            Игра
          </button>
        </div>

        {tab === "keys" && (
          <div className="space-y-6">
            {/* Keyboard binds */}
            <div className="cs-panel p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 uppercase">Клавиатура</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(keybinds).map(([action, key]) => (
                  <div key={action} className="flex items-center justify-between bg-secondary/30 rounded px-4 py-2">
                    <span className="text-sm text-foreground">{action}</span>
                    <button
                      onClick={() => handleKeyCapture(action)}
                      className={`px-3 py-1 rounded text-sm font-mono font-bold min-w-[60px] text-center transition-all ${
                        editingKey === action
                          ? "bg-primary text-primary-foreground animate-pulse"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {editingKey === action ? "..." : key}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mouse binds */}
            <div className="cs-panel p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 uppercase">Мышь</h3>
              <div className="space-y-2">
                {Object.entries(mouseBinds).map(([action, bind]) => (
                  <div key={action} className="flex items-center justify-between bg-secondary/30 rounded px-4 py-2">
                    <span className="text-sm text-foreground">{action}</span>
                    <span className="px-3 py-1 bg-muted rounded text-sm font-mono text-muted-foreground">{bind}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "game" && (
          <div className="space-y-6">
            {/* Sensitivity */}
            <div className="cs-panel p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 uppercase">Чувствительность</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-48">Скорость камеры</span>
                <input
                  type="range"
                  min="0.01"
                  max="10"
                  step="0.01"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-mono text-primary w-12 text-right">{sensitivity.toFixed(2)}</span>
              </div>
            </div>

            {/* Crosshair */}
            <div className="cs-panel p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 uppercase">Прицел</h3>
              
              {/* Preview */}
              <div className="flex justify-center mb-6">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted" />
                  {/* Crosshair preview */}
                  <div className="relative">
                    {/* Top */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: `${crosshairGap + 2}px`,
                        transform: "translateX(-50%)",
                        width: `${crosshairThickness * 2}px`,
                        height: `${crosshairSize * 3}px`,
                        backgroundColor: crosshairColor,
                      }}
                    />
                    {/* Bottom */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: `${crosshairGap + 2}px`,
                        transform: "translateX(-50%)",
                        width: `${crosshairThickness * 2}px`,
                        height: `${crosshairSize * 3}px`,
                        backgroundColor: crosshairColor,
                      }}
                    />
                    {/* Left */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: `${crosshairGap + 2}px`,
                        transform: "translateY(-50%)",
                        width: `${crosshairSize * 3}px`,
                        height: `${crosshairThickness * 2}px`,
                        backgroundColor: crosshairColor,
                      }}
                    />
                    {/* Right */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: `${crosshairGap + 2}px`,
                        transform: "translateY(-50%)",
                        width: `${crosshairSize * 3}px`,
                        height: `${crosshairThickness * 2}px`,
                        backgroundColor: crosshairColor,
                      }}
                    />
                    {/* Dot */}
                    {crosshairDot && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: `${crosshairThickness * 2}px`,
                          height: `${crosshairThickness * 2}px`,
                          backgroundColor: crosshairColor,
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">Размер</span>
                  <input type="range" min="1" max="10" value={crosshairSize} onChange={(e) => setCrosshairSize(parseInt(e.target.value))} className="flex-1 accent-primary" />
                  <span className="text-sm font-mono text-primary w-8 text-right">{crosshairSize}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">Промежуток</span>
                  <input type="range" min="0" max="10" value={crosshairGap} onChange={(e) => setCrosshairGap(parseInt(e.target.value))} className="flex-1 accent-primary" />
                  <span className="text-sm font-mono text-primary w-8 text-right">{crosshairGap}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">Толщина</span>
                  <input type="range" min="1" max="5" value={crosshairThickness} onChange={(e) => setCrosshairThickness(parseInt(e.target.value))} className="flex-1 accent-primary" />
                  <span className="text-sm font-mono text-primary w-8 text-right">{crosshairThickness}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">Точка</span>
                  <button
                    onClick={() => setCrosshairDot(!crosshairDot)}
                    className={`px-4 py-1 rounded text-sm font-bold transition-all ${crosshairDot ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {crosshairDot ? "ДА" : "НЕТ"}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-32">Цвет</span>
                  <div className="flex gap-2">
                    {crosshairColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setCrosshairColor(c.value)}
                        className={`w-8 h-8 rounded border-2 transition-all ${crosshairColor === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle options */}
            <div className="cs-panel p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 uppercase">Функции</h3>
              <div className="space-y-3">
                {[
                  { label: "Скрывать аватары", value: hideAvatars, set: setHideAvatars },
                  { label: "Скрыть ники", value: hideNicknames, set: setHideNicknames },
                  { label: "Показывать число выживших", value: showAlive, set: setShowAlive },
                ].map((opt) => (
                  <div key={opt.label} className="flex items-center justify-between bg-secondary/30 rounded px-4 py-3">
                    <span className="text-sm text-foreground">{opt.label}</span>
                    <button
                      onClick={() => opt.set(!opt.value)}
                      className={`px-4 py-1 rounded text-sm font-bold transition-all ${opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {opt.value ? "ДА" : "НЕТ"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
