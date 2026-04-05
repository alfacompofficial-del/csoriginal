import { useState } from "react";
import { Settings, LogOut, UserPlus, Check, X, User } from "lucide-react";
import agentImg from "@/assets/agent.png";
import bgImg from "@/assets/cs2-bg.jpg";
import SettingsPanel from "./SettingsPanel";
import PlayMenu from "./PlayMenu";
import WeaponShop from "./WeaponShop";

interface MainMenuProps {
  username: string;
  onLogout: () => void;
}

interface Friend {
  name: string;
  online: boolean;
}

interface FriendRequest {
  name: string;
}

const MainMenu = ({ username, onLogout }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [showWeaponShop, setShowWeaponShop] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([
    { name: "Player_42", online: true },
    { name: "SniperX", online: false },
    { name: "RushB_Pro", online: true },
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    { name: "NewPlayer99" },
  ]);

  const acceptFriend = (name: string) => {
    setFriends((prev) => [...prev, { name, online: true }]);
    setFriendRequests((prev) => prev.filter((r) => r.name !== name));
  };

  const rejectFriend = (name: string) => {
    setFriendRequests((prev) => prev.filter((r) => r.name !== name));
  };

  const sendFriendRequest = () => {
    if (friendSearch.trim()) {
      alert(`Запрос отправлен игроку ${friendSearch}`);
      setFriendSearch("");
      setShowAddFriend(false);
    }
  };

  const handleAvatarChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setAvatarUrl(url);
      }
    };
    input.click();
  };

  if (showSettings) return <SettingsPanel onBack={() => setShowSettings(false)} />;
  if (showPlayMenu) return <PlayMenu onBack={() => setShowPlayMenu(false)} onWeaponShop={() => { setShowPlayMenu(false); setShowWeaponShop(true); }} />;
  if (showWeaponShop) return <WeaponShop onBack={() => { setShowWeaponShop(false); setShowPlayMenu(true); }} />;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background */}
      <img src={bgImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/60" />

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Avatar & Nav */}
        <div className="flex-1 flex flex-col p-6">
          {/* Top bar */}
          <div className="flex items-center gap-4 mb-8">
            {/* Avatar */}
            <button
              onClick={handleAvatarChange}
              className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors"
              title="Изменить аватар"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-foreground font-medium">Изменить</span>
              </div>
            </button>
            <div>
              <p className="font-heading text-xl font-bold text-foreground">{username}</p>
              <p className="text-cs-success text-xs uppercase tracking-wider">В сети</p>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-4 mb-auto">
            <button
              onClick={() => setShowPlayMenu(true)}
              className="cs-btn-primary text-xl px-12 py-4 animate-pulse-glow"
            >
              ИГРАТЬ
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="group relative p-3 bg-secondary rounded-lg border border-border hover:border-primary/30 transition-all"
              title="Настройки"
            >
              <Settings className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-foreground bg-card px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Настройки
              </span>
            </button>

            <button
              onClick={() => setShowQuitConfirm(true)}
              className="group relative p-3 bg-secondary rounded-lg border border-border hover:border-destructive/30 transition-all"
              title="Выход из игры"
            >
              <LogOut className="w-6 h-6 text-muted-foreground group-hover:text-destructive transition-colors" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-foreground bg-card px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Выход из игры
              </span>
            </button>
          </div>

          {/* Agent character */}
          <div className="flex-1 flex items-end justify-center pointer-events-none">
            <img src={agentImg} alt="Agent" className="h-[70vh] max-h-[600px] object-contain drop-shadow-2xl" />
          </div>
        </div>

        {/* Right side - Friends panel */}
        <div className="w-72 cs-panel m-4 p-4 flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-foreground uppercase tracking-wider">Друзья</h3>
            <button
              onClick={() => setShowAddFriend(true)}
              className="p-1.5 rounded hover:bg-secondary transition-colors"
              title="Добавить друга"
            >
              <UserPlus className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* Add friend input */}
          {showAddFriend && (
            <div className="mb-4 flex gap-2 animate-fade-in">
              <input
                type="text"
                placeholder="Ник игрока..."
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                className="cs-input flex-1 text-sm py-2"
                onKeyDown={(e) => e.key === "Enter" && sendFriendRequest()}
              />
              <button onClick={sendFriendRequest} className="cs-btn-primary px-3 py-2 text-sm">
                ОК
              </button>
            </div>
          )}

          {/* Friend requests */}
          {friendRequests.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-primary uppercase tracking-wider mb-2 font-semibold">Заявки</p>
              {friendRequests.map((req) => (
                <div key={req.name} className="flex items-center justify-between bg-secondary/50 rounded p-2 mb-1">
                  <span className="text-sm text-foreground">{req.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => acceptFriend(req.name)} className="p-1 hover:bg-cs-success/20 rounded transition-colors">
                      <Check className="w-4 h-4 text-cs-success" />
                    </button>
                    <button onClick={() => rejectFriend(req.name)} className="p-1 hover:bg-destructive/20 rounded transition-colors">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends list */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {friends
              .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
              .map((friend) => (
                <div
                  key={friend.name}
                  className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full ${friend.online ? "bg-cs-success" : "bg-muted-foreground/30"}`} />
                  <span className={`text-sm ${friend.online ? "text-foreground" : "text-muted-foreground"}`}>
                    {friend.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quit confirmation */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="cs-panel p-8 text-center animate-fade-in max-w-sm">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4 uppercase">Выход из игры</h3>
            <p className="text-muted-foreground mb-6">Вы уверены, что хотите выйти?</p>
            <div className="flex gap-4 justify-center">
              <button onClick={onLogout} className="cs-btn-primary px-8">Да</button>
              <button onClick={() => setShowQuitConfirm(false)} className="cs-btn-secondary px-8">Нет</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
