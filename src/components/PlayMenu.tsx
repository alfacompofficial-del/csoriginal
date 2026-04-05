import { useState } from "react";
import { ArrowLeft, Lock, Users, Trophy, ShoppingCart } from "lucide-react";

interface PlayMenuProps {
  onBack: () => void;
  onWeaponShop: () => void;
}

const maps = [
  { name: "Mirage", description: "Классическая карта" },
  { name: "Dust 2", description: "Легендарная карта" },
  { name: "Inferno", description: "Тактическая карта" },
];

const PlayMenu = ({ onBack, onWeaponShop }: PlayMenuProps) => {
  const [mode, setMode] = useState<"select" | "closed" | "partners" | "competitive" | "searching">("select");
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState(0);

  const startSearch = (gameMode: string) => {
    setMode("searching");
    const interval = setInterval(() => {
      setSearchTime((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          alert(`Игра найдена! Режим: ${gameMode}${selectedMap ? `, Карта: ${selectedMap}` : ""}`);
          setMode("select");
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  if (mode === "searching") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-heading text-3xl font-bold text-foreground uppercase mb-2">Поиск игры</h2>
          <p className="text-muted-foreground text-lg">Время поиска: {searchTime}с</p>
          <button
            onClick={() => { setMode("select"); setSearchTime(0); }}
            className="cs-btn-secondary mt-6"
          >
            Отменить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-heading text-3xl font-bold text-foreground uppercase tracking-wider">Играть</h1>
          </div>
          <button onClick={onWeaponShop} className="cs-btn-secondary flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Магазин оружия
          </button>
        </div>

        {mode === "select" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Closed Map */}
            <button
              onClick={() => setMode("closed")}
              className="cs-panel p-8 text-center hover:border-primary/50 transition-all group"
            >
              <Lock className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-xl font-bold text-foreground uppercase mb-2">Закрытая карта</h3>
              <p className="text-muted-foreground text-sm">Играйте с другом или с ботами на выбранной карте</p>
            </button>

            {/* Partners */}
            <button
              onClick={() => setMode("partners")}
              className="cs-panel p-8 text-center hover:border-primary/50 transition-all group"
            >
              <Users className="w-12 h-12 text-accent mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-xl font-bold text-foreground uppercase mb-2">Напарники</h3>
              <p className="text-muted-foreground text-sm">2 на 2 — открытый плент A, ограниченная карта</p>
            </button>

            {/* Competitive */}
            <button
              onClick={() => setMode("competitive")}
              className="cs-panel p-8 text-center hover:border-primary/50 transition-all group"
            >
              <Trophy className="w-12 h-12 text-cs-gold mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-xl font-bold text-foreground uppercase mb-2">Соревновательный</h3>
              <p className="text-muted-foreground text-sm">5 на 5 — полная карта, полный матч</p>
            </button>
          </div>
        )}

        {mode === "closed" && (
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground uppercase mb-4">Выберите карту</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {maps.map((map) => (
                <button
                  key={map.name}
                  onClick={() => setSelectedMap(map.name)}
                  className={`cs-panel p-6 text-center transition-all ${
                    selectedMap === map.name ? "border-primary cs-glow" : "hover:border-primary/30"
                  }`}
                >
                  <h4 className="font-heading text-lg font-bold text-foreground">{map.name}</h4>
                  <p className="text-muted-foreground text-xs mt-1">{map.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => selectedMap && startSearch("Закрытая карта")}
                disabled={!selectedMap}
                className={`cs-btn-primary ${!selectedMap ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Начать игру
              </button>
              <button onClick={() => setMode("select")} className="cs-btn-secondary">Назад</button>
            </div>
          </div>
        )}

        {(mode === "partners" || mode === "competitive") && (
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase mb-4">
              {mode === "partners" ? "Напарники — 2 на 2" : "Соревновательный — 5 на 5"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {mode === "partners"
                ? "Открытое лобби. Карта выбирается автоматически. Открыт только плент A."
                : "Полная карта. Если игроков не хватает за 3 минуты — добавляются боты."}
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => startSearch(mode === "partners" ? "Напарники" : "Соревновательный")} className="cs-btn-primary text-lg px-10">
                Найти игру
              </button>
              <button onClick={() => setMode("select")} className="cs-btn-secondary">Назад</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayMenu;
