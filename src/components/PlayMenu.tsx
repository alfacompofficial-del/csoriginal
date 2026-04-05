import { useState } from "react";
import { ArrowLeft, Lock, Users, Trophy } from "lucide-react";

interface PlayMenuProps {
  onBack: () => void;
  onStartGame: () => void;
}

const maps = [
  { name: "Dust 2", description: "Легендарная карта" },
  { name: "Mirage", description: "Классическая карта (скоро)" },
  { name: "Inferno", description: "Тактическая карта (скоро)" },
];

const PlayMenu = ({ onBack, onStartGame }: PlayMenuProps) => {
  const [mode, setMode] = useState<"select" | "closed" | "partners" | "competitive">("select");
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-3xl font-bold text-foreground uppercase tracking-wider">Играть</h1>
        </div>

        {mode === "select" && (
          <div className="grid grid-cols-3 gap-6">
            <button onClick={() => setMode("closed")} className="cs-panel p-8 text-center hover:border-primary/50 transition-all group">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-xl font-bold text-foreground uppercase mb-2">Закрытая карта</h3>
              <p className="text-muted-foreground text-sm">С ботами на выбранной карте</p>
            </button>
            <button onClick={() => setMode("partners")} className="cs-panel p-8 text-center hover:border-primary/50 transition-all group">
              <Users className="w-12 h-12 text-accent mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-xl font-bold text-foreground uppercase mb-2">Напарники</h3>
              <p className="text-muted-foreground text-sm">2 на 2 с ботами</p>
            </button>
            <button onClick={() => setMode("competitive")} className="cs-panel p-8 text-center hover:border-primary/50 transition-all group">
              <Trophy className="w-12 h-12 text-cs-gold mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-xl font-bold text-foreground uppercase mb-2">Соревновательный</h3>
              <p className="text-muted-foreground text-sm">5 на 5 с ботами</p>
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
                  disabled={map.name !== "Dust 2"}
                  className={`cs-panel p-6 text-center transition-all ${
                    selectedMap === map.name ? "border-primary cs-glow" : map.name === "Dust 2" ? "hover:border-primary/30" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  <h4 className="font-heading text-lg font-bold text-foreground">{map.name}</h4>
                  <p className="text-muted-foreground text-xs mt-1">{map.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={onStartGame} disabled={!selectedMap} className={`cs-btn-primary ${!selectedMap ? "opacity-50 cursor-not-allowed" : ""}`}>
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
            <p className="text-muted-foreground mb-8">Играете на карте Dust 2 с ботами</p>
            <div className="flex gap-4 justify-center">
              <button onClick={onStartGame} className="cs-btn-primary text-lg px-10">Начать игру</button>
              <button onClick={() => setMode("select")} className="cs-btn-secondary">Назад</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayMenu;
