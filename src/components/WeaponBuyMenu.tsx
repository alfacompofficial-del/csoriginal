import { WEAPONS } from "@/game/types";
import { X } from "lucide-react";

interface WeaponBuyMenuProps {
  money: number;
  onBuy: (weaponKey: string) => void;
  onBuyArmor: (withHelmet: boolean) => void;
  onClose: () => void;
}

const categories = [
  {
    name: "Броня",
    items: [
      { key: "vest", name: "Kevlar Vest", price: 650, type: "armor" as const },
      { key: "vesthelm", name: "Kevlar + Шлем", price: 1000, type: "armorHelmet" as const },
    ],
  },
  {
    name: "Пистолеты",
    items: [
      { key: "usp", type: "weapon" as const },
      { key: "glock", type: "weapon" as const },
      { key: "deagle", type: "weapon" as const },
    ],
  },
  {
    name: "SMG",
    items: [
      { key: "mac10", type: "weapon" as const },
      { key: "p90", type: "weapon" as const },
    ],
  },
  {
    name: "Винтовки",
    items: [
      { key: "ak47", type: "weapon" as const },
      { key: "m4a4", type: "weapon" as const },
    ],
  },
  {
    name: "Снайперские",
    items: [
      { key: "awp", type: "weapon" as const },
    ],
  },
];

const WeaponBuyMenu = ({ money, onBuy, onBuyArmor, onClose }: WeaponBuyMenuProps) => {
  return (
    <div className="cs-panel p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wider">Магазин оружия</h2>
        <div className="flex items-center gap-4">
          <span className="font-heading text-xl font-bold text-cs-gold">${money}</span>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded transition-colors">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.name}>
            <h3 className="font-heading text-sm font-bold text-primary uppercase tracking-wider mb-2">{cat.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cat.items.map((item) => {
                const weapon = item.type === "weapon" ? WEAPONS[item.key] : null;
                const name = weapon?.name ?? (item as { name: string }).name;
                const price = weapon?.price ?? (item as { price: number }).price;
                const canAfford = money >= price;

                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (item.type === "weapon") onBuy(item.key);
                      else if (item.type === "armor") onBuyArmor(false);
                      else if (item.type === "armorHelmet") onBuyArmor(true);
                    }}
                    disabled={!canAfford}
                    className={`p-3 rounded border text-left transition-all ${
                      canAfford
                        ? "border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50"
                        : "border-border/30 opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <p className="font-heading font-bold text-sm text-foreground">{name}</p>
                    <p className="text-cs-gold font-heading text-sm">${price}</p>
                    {weapon && (
                      <p className="text-muted-foreground text-xs">DMG: {weapon.damage} | Маг: {weapon.magSize}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onClose} className="cs-btn-primary w-full mt-6 text-lg">
        НАЧАТЬ РАУНД
      </button>
    </div>
  );
};

export default WeaponBuyMenu;
