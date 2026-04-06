import { useState, useEffect, useCallback } from "react";
import { Settings, LogOut, UserPlus, Check, X, User, Gamepad2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import bgImg from "@/assets/cs2-bg.jpg";
import agentImg from "@/assets/agent.png";
import SettingsPanel from "./SettingsPanel";
import PlayMenu from "./PlayMenu";
import GameCanvas from "./GameCanvas";

interface FriendData {
  id: string;
  nickname: string;
  online: boolean;
}

interface FriendRequestData {
  id: string;
  senderNickname: string;
  senderId: string;
}

const MainMenu = () => {
  const { user, profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendError, setFriendError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [friends, setFriends] = useState<FriendData[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestData[]>([]);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    // Load friendships
    const { data: friendships } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nickname")
        .in("user_id", friendIds);

      if (profiles) {
        setFriends(profiles.map(p => ({
          id: p.user_id,
          nickname: p.nickname,
          online: false, // simplified - no presence tracking yet
        })));
      }
    } else {
      setFriends([]);
    }
  }, [user]);

  const loadFriendRequests = useCallback(async () => {
    if (!user) return;
    const { data: requests } = await supabase
      .from("friend_requests")
      .select("id, sender_id")
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (requests && requests.length > 0) {
      const senderIds = requests.map(r => r.sender_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nickname")
        .in("user_id", senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.nickname]) ?? []);
      setFriendRequests(requests.map(r => ({
        id: r.id,
        senderId: r.sender_id,
        senderNickname: profileMap.get(r.sender_id) ?? "Unknown",
      })));
    } else {
      setFriendRequests([]);
    }
  }, [user]);

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, [loadFriends, loadFriendRequests]);

  const sendFriendRequest = async () => {
    if (!friendSearch.trim() || !user) return;
    setFriendError("");

    // Find user by nickname
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("nickname", friendSearch.trim())
      .single();

    if (!targetProfile) {
      setFriendError("Игрок не найден");
      return;
    }
    if (targetProfile.user_id === user.id) {
      setFriendError("Нельзя добавить себя");
      return;
    }

    const { error } = await supabase.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: targetProfile.user_id,
    });

    if (error) {
      if (error.code === "23505") setFriendError("Заявка уже отправлена");
      else setFriendError("Ошибка отправки");
      return;
    }

    setFriendSearch("");
    setShowAddFriend(false);
    setFriendError("");
  };

  const acceptRequest = async (requestId: string) => {
    await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
    await loadFriends();
    await loadFriendRequests();
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", requestId);
    await loadFriendRequests();
  };

  const handleAvatarChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setAvatarUrl(URL.createObjectURL(file));
    };
    input.click();
  };

  if (showGame) return <GameCanvas onExit={() => setShowGame(false)} />;
  if (showSettings) return <SettingsPanel onBack={() => setShowSettings(false)} />;
  if (showPlayMenu) return <PlayMenu onBack={() => setShowPlayMenu(false)} onStartGame={() => { setShowPlayMenu(false); setShowGame(true); }} />;

  const username = profile?.nickname || "Player";

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <img src={bgImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/60" />

      <div className="relative z-10 min-h-screen flex">
        {/* Left side */}
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleAvatarChange} className="relative group w-16 h-16 rounded-full overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors" title="Изменить аватар">
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

          <div className="flex items-center gap-4 mb-auto">
            <button onClick={() => setShowPlayMenu(true)} className="cs-btn-primary text-xl px-12 py-4 animate-pulse-glow flex items-center gap-3">
              <Gamepad2 className="w-6 h-6" />
              ИГРАТЬ
            </button>
            <button onClick={() => setShowSettings(true)} className="group relative p-3 bg-secondary rounded-lg border border-border hover:border-primary/30 transition-all" title="Настройки">
              <Settings className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <button onClick={() => setShowQuitConfirm(true)} className="group relative p-3 bg-secondary rounded-lg border border-border hover:border-destructive/30 transition-all" title="Выход">
              <LogOut className="w-6 h-6 text-muted-foreground group-hover:text-destructive transition-colors" />
            </button>
          </div>

          <div className="flex-1 flex items-end justify-center pointer-events-none">
            <img src={agentImg} alt="Agent" className="h-[70vh] max-h-[600px] object-contain drop-shadow-2xl" />
          </div>
        </div>

        {/* Right side - Friends */}
        <div className="w-72 cs-panel m-4 p-4 flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-foreground uppercase tracking-wider">Друзья</h3>
            <button onClick={() => { setShowAddFriend(true); setFriendError(""); }} className="p-1.5 rounded hover:bg-secondary transition-colors" title="Добавить друга">
              <UserPlus className="w-4 h-4 text-primary" />
            </button>
          </div>

          {showAddFriend && (
            <div className="mb-4 animate-fade-in">
              <div className="flex gap-2">
                <input type="text" placeholder="Ник игрока..." value={friendSearch} onChange={(e) => setFriendSearch(e.target.value)} className="cs-input flex-1 text-sm py-2" onKeyDown={(e) => e.key === "Enter" && sendFriendRequest()} />
                <button onClick={sendFriendRequest} className="cs-btn-primary px-3 py-2 text-sm">ОК</button>
              </div>
              {friendError && <p className="text-destructive text-xs mt-1">{friendError}</p>}
            </div>
          )}

          {friendRequests.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-primary uppercase tracking-wider mb-2 font-semibold">Заявки ({friendRequests.length})</p>
              {friendRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-secondary/50 rounded p-2 mb-1">
                  <span className="text-sm text-foreground">{req.senderNickname}</span>
                  <div className="flex gap-1">
                    <button onClick={() => acceptRequest(req.id)} className="p-1 hover:bg-cs-success/20 rounded transition-colors">
                      <Check className="w-4 h-4 text-cs-success" />
                    </button>
                    <button onClick={() => rejectRequest(req.id)} className="p-1 hover:bg-destructive/20 rounded transition-colors">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1">
            {friends.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">Пока нет друзей</p>
            )}
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span className="text-sm text-muted-foreground">{friend.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="cs-panel p-8 text-center animate-fade-in max-w-sm">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-4 uppercase">Выход из игры</h3>
            <p className="text-muted-foreground mb-6">Вы уверены?</p>
            <div className="flex gap-4 justify-center">
              <button onClick={signOut} className="cs-btn-primary px-8">Да</button>
              <button onClick={() => setShowQuitConfirm(false)} className="cs-btn-secondary px-8">Нет</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
