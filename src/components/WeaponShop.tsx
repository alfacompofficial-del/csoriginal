import { useState } from "react";
import { ArrowLeft } from "lucide-react";

interface Weapon {
  name: string;
  price: number;
  side?: "T" | "CT" | "both";
}

interface WeaponCategory {
  name: string;
  icon: string;
  weapons: Weapon[];
}

const weaponData: WeaponCategory[] = [
  {
    name: "Броня и оборудование",
    icon: "🛡️",
    weapons: [
      { name: "Kevlar Vest", price: 650 },
      { name: "Kevlar + Helmet", price: 1000 },
      { name: "Defuse Kit", price: 400, side: "CT" },
      { name: "Zeus x27", price: 200 },
    ],
  },
  {
    name: "Гранаты",
    icon: "💣",
    weapons: [
      { name: "Flashbang", price: 200 },
      { name: "HE Grenade", price: 300 },
      { name: "Smoke Grenade", price: 300 },
      { name: "Molotov", price: 400, side: "T" },
      { name: "Incendiary Grenade", price: 600, side: "CT" },
      { name: "Decoy Grenade", price: 50 },
    ],
  },
  {
    name: "Пистолеты",
    icon: "🔫",
    weapons: [
      { name: "Glock-18", price: 200, side: "T" },
      { name: "USP-S", price: 200, side: "CT" },
      { name: "P2000", price: 200, side: "CT" },
      { name: "P250", price: 300 },
      { name: "Dual Berettas", price: 300 },
      { name: "CZ75-Auto", price: 500 },
      { name: "Tec-9", price: 500, side: "T" },
      { name: "Five-SeveN", price: 500, side: "CT" },
      { name: "R8 Revolver", price: 600 },
      { name: "Desert Eagle", price: 700 },
    ],
  },
  {
    name: "SMG",
    icon: "🔧",
    weapons: [
      { name: "MAC-10", price: 1050, side: "T" },
      { name: "MP9", price: 1250, side: "CT" },
      { name: "MP7", price: 1500 },
      { name: "MP5-SD", price: 1500 },
      { name: "UMP-45", price: 1200 },
      { name: "PP-Bizon", price: 1400 },
      { name: "P90", price: 2350 },
    ],
  },
  {
    name: "Heavy",
    icon: "🔨",
    weapons: [
      { name: "Nova", price: 1050 },
      { name: "Sawed-Off", price: 1100, side: "T" },
      { name: "MAG-7", price: 1300, side: "CT" },
      { name: "XM1014", price: 2000 },
      { name: "Negev", price: 1700 },
      { name: "M249", price: 5200 },
    ],
  },
  {
    name: "Винтовки",
    icon: "🎯",
    weapons: [
      { name: "Galil AR", price: 1800, side: "T" },
      { name: "AK-47", price: 2700, side: "T" },
      { name: "SG 553", price: 3000, side: "T" },
      { name: "FAMAS", price: 2050, side: "CT" },
      { name: "M4A4", price: 3100, side: "CT" },
      { name: "M4A1-S", price: 2900, side: "CT" },
      { name: "AUG", price: 3300, side: "CT" },
    ],
  },
  {
    name: "Снайперские",
    icon: "🔭",
    weapons: [
      { name: "SSG 08", price: 1700 },
      { name: "AWP", price: 4750 },
      { name: "SCAR-20", price: 5000, side: "CT" },
      { name: "G3SG1", price: 5000, side: "T" },
    ],
  },
];

const WeaponShop = ({ onBack }: { onBack: () => void }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [money, setMoney] = useState(16000);
  const [purchased, setPurchased] = useState<string[]>([]);

  const buyWeapon = (weapon: Weapon) => {
    if (money >= weapon.price && !purchased.includes(weapon.name)) {
      setMoney((prev) => prev - weapon.price);
      setPurchased((prev) => [...prev, weapon.name]);
    }
  };

  const category = weaponData[selectedCategory];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-heading text-3xl font-bold text-foreground uppercase tracking-wider">Магазин оружия</h1>
          </div>
          <div className="cs-panel px-6 py-3">
            <span className="text-muted-foreground text-sm">Баланс: </span>
            <span className="font-heading text-2xl font-bold text-cs-gold">${money}</span>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Categories sidebar */}
          <div className="w-56 space-y-1">
            {weaponData.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(i)}
                className={`w-full text-left px-4 py-3 rounded transition-all flex items-center gap-3 ${
                  selectedCategory === i
                    ? "bg-primary/10 border border-primary/30 text-foreground"
                    : "hover:bg-secondary/50 text-muted-foreground"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="font-heading font-semibold text-sm uppercase">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Weapons grid */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {category.weapons.map((weapon) => {
              const owned = purchased.includes(weapon.name);
              const canAfford = money >= weapon.price;

              return (
                <button
                  key={weapon.name}
                  onClick={() => buyWeapon(weapon)}
                  disabled={owned || !canAfford}
                  className={`cs-panel p-4 text-left transition-all ${
                    owned
                      ? "border-cs-success/30 opacity-60"
                      : canAfford
                      ? "hover:border-primary/50 hover:bg-card/90 cursor-pointer"
                      : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-heading font-bold text-foreground">{weapon.name}</h4>
                    {weapon.side && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        weapon.side === "CT" ? "bg-cs-ct/20 text-cs-ct" : weapon.side === "T" ? "bg-cs-t/20 text-cs-t" : ""
                      }`}>
                        {weapon.side}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-cs-gold font-heading font-bold">${weapon.price}</span>
                    {owned && <span className="text-cs-success text-xs font-bold uppercase">Куплено</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Purchased items */}
          {purchased.length > 0 && (
            <div className="w-48">
              <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase mb-3">Инвентарь</h3>
              <div className="space-y-1">
                {purchased.map((name) => (
                  <div key={name} className="bg-secondary/30 rounded px-3 py-2 text-sm text-foreground">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeaponShop;
