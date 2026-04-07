import { useState, useEffect, useCallback } from "react";
import { Settings, LogOut, UserPlus, Check, X, User, Gamepad2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SettingsPanel from "./SettingsPanel";
import PlayMenu from "./PlayMenu";
import GameCanvas from "./GameCanvas";
import LobbyScreen from "./LobbyScreen";
import AgentPreview3D from "./AgentPreview3D";

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

interface LobbyInviteData {
  id: string;
  lobbyId: string;
  senderId: string;
  senderNickname: string;
}

const MainMenu = () => {
  const { user, profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendError, setFriendError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [friends, setFriends] = useState<FriendData[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestData[]>([]);
  const [lobbyInvites, setLobbyInvites] = useState<LobbyInviteData[]>([]);
  const [joinLobbyId, setJoinLobbyId] = useState<string | null>(null);
  const [matchmaking, setMatchmaking] = useState<{ active: boolean; message: string }>({ active: false, message: "" });

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

  const loadLobbyInvites = useCallback(async () => {
    if (!user) return;
    const { data: invites } = await supabase
      .from("lobby_invites")
      .select("id, lobby_id, sender_id")
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (invites && invites.length > 0) {
      const senderIds = invites.map((i) => i.sender_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, nickname").in("user_id", senderIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.nickname]) ?? []);
      setLobbyInvites(
        invites.map((i) => ({
          id: i.id,
          lobbyId: i.lobby_id,
          senderId: i.sender_id,
          senderNickname: profileMap.get(i.sender_id) ?? "Unknown",
        }))
      );
    } else {
      setLobbyInvites([]);
    }
  }, [user]);

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    loadLobbyInvites();
  }, [loadFriends, loadFriendRequests, loadLobbyInvites]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`friend_requests:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friend_requests", filter: `receiver_id=eq.${user.id}` },
        () => {
          loadFriendRequests();
          loadFriends();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friend_requests", filter: `sender_id=eq.${user.id}` },
        () => {
          loadFriendRequests();
          loadFriends();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `user_id=eq.${user.id}` },
        () => {
          loadFriends();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lobby_invites", filter: `receiver_id=eq.${user.id}` },
        () => {
          loadLobbyInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFriendRequests, loadFriends, loadLobbyInvites]);

  useEffect(() => {
    if (!user) return;
    // keep lobby invites fresh too
    const channel = supabase
      .channel(`lobby_invites:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lobby_invites", filter: `receiver_id=eq.${user.id}` },
        () => loadLobbyInvites()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadLobbyInvites]);

  const sendFriendRequest = async () => {
    if (!friendSearch.trim() || !user) return;
    setFriendError("");

    // Find user by nickname
    const nick = friendSearch.trim();
    const { data: targetProfile, error: findErr } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("nickname", nick)
      .single();

    if (findErr || !targetProfile) {
      setFriendError("Игрок не найден");
      return;
    }
    if (targetProfile.user_id === user.id) {
      setFriendError("Нельзя добавить себя");
      return;
    }

    // Already friends?
    const { data: existingFriend } = await supabase
      .from("friendships")
      .select("id")
      .eq("user_id", user.id)
      .eq("friend_id", targetProfile.user_id)
      .maybeSingle();

    if (existingFriend) {
      setFriendError("Этот игрок уже у вас в друзьях");
      return;
    }

    // If there is a pending request from them to you — ask user to accept instead of creating a reverse pending.
    const { data: reversePending } = await supabase
      .from("friend_requests")
      .select("id, status")
      .eq("sender_id", targetProfile.user_id)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (reversePending?.id) {
      setFriendError("У этого игрока уже есть заявка к вам — примите её в списке заявок");
      return;
    }

    const { error } = await supabase.from("friend_requests").insert({
      sender_id: user.id,
      receiver_id: targetProfile.user_id,
    });

    if (error) {
      if (error.code === "23505") setFriendError("Заявка уже отправлена");
      else setFriendError(error.message || "Ошибка отправки");
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

  const acceptLobbyInvite = async (inviteId: string, lobbyId: string) => {
    const { error } = await supabase.rpc("accept_lobby_invite", { invite_id: inviteId });
    if (error) {
      setFriendError(error.message || "Не удалось принять инвайт в лобби");
      return;
    }
    setJoinLobbyId(lobbyId);
    setShowLobby(true);
    await loadLobbyInvites();
  };

  const rejectLobbyInvite = async (inviteId: string) => {
    await supabase.from("lobby_invites").update({ status: "rejected" }).eq("id", inviteId);
    await loadLobbyInvites();
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

  const startMatchmaking = useCallback(async (args: { mode: "closed" | "partners" | "competitive"; mapName: string; lobbyId: string | null }) => {
    if (!user) return;
    setMatchmaking({ active: true, message: "Поиск игроков..." });

    // If Supabase tables/RPC aren't deployed yet, don't block starting the game.
    const { error: queueErr } = await supabase.from("matchmaking_queue").upsert({
      user_id: user.id,
      lobby_id: args.lobbyId,
      mode: args.mode,
      map_name: args.mapName,
    }, { onConflict: "user_id" });
    if (queueErr) {
      setMatchmaking({ active: false, message: "" });
      setFriendError("Матчмейкинг пока не настроен на сервере — запускаю локальную игру с ботами");
      setShowGame(true);
      return;
    }

    const tryOnce = async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc("try_matchmake", { p_mode: args.mode, p_map_name: args.mapName });
      if (error) {
        setMatchmaking({ active: false, message: "" });
        setFriendError("Матчмейкинг пока не настроен на сервере — запускаю локальную игру с ботами");
        setShowGame(true);
        return null;
      }
      return (data as string | null) ?? null;
    };

    let matchId = await tryOnce();
    if (matchId) {
      setMatchmaking({ active: false, message: "" });
      setShowGame(true);
      return;
    }

    setMatchmaking({ active: true, message: "Ждём второго игрока..." });
    const startedAt = Date.now();

    const interval = window.setInterval(async () => {
      if (Date.now() - startedAt > 60_000) {
        window.clearInterval(interval);
        await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
        setMatchmaking({ active: false, message: "" });
        setFriendError("Не удалось найти игроков за 60 секунд");
        return;
      }
      matchId = await tryOnce();
      if (matchId) {
        window.clearInterval(interval);
        setMatchmaking({ active: false, message: "" });
        setShowGame(true);
      }
    }, 2000);
  }, [user]);

  if (showGame) return <GameCanvas onExit={() => setShowGame(false)} />;
  if (showSettings) return <SettingsPanel onBack={() => setShowSettings(false)} />;
  if (showPlayMenu) return <PlayMenu onBack={() => setShowPlayMenu(false)} onStartGame={(args) => { setShowPlayMenu(false); startMatchmaking({ ...args, lobbyId: null }); }} />;
  if (showLobby) return <LobbyScreen initialLobbyId={joinLobbyId} onBack={() => { setJoinLobbyId(null); setShowLobby(false); }} onStart={(args) => { setShowLobby(false); startMatchmaking(args); }} />;

  const username = profile?.nickname || "Player";

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-cs-dark via-background to-cs-dark" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/60" />
      <img src="/placeholder.svg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.06] mix-blend-overlay" />

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
            <button onClick={() => setShowLobby(true)} className="group relative p-3 bg-secondary rounded-lg border border-border hover:border-primary/30 transition-all" title="Лобби">
              <Users className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <button onClick={() => setShowSettings(true)} className="group relative p-3 bg-secondary rounded-lg border border-border hover:border-primary/30 transition-all" title="Настройки">
              <Settings className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <button onClick={() => setShowQuitConfirm(true)} className="group relative p-3 bg-secondary rounded-lg border border-border hover:border-destructive/30 transition-all" title="Выход">
              <LogOut className="w-6 h-6 text-muted-foreground group-hover:text-destructive transition-colors" />
            </button>
          </div>

          <div className="flex-1 flex items-end justify-center">
            <div className="pointer-events-auto w-full flex justify-center">
              <AgentPreview3D height={600} yOffset={22} />
            </div>
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

          {lobbyInvites.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-accent uppercase tracking-wider mb-2 font-semibold">Инвайты в лобби ({lobbyInvites.length})</p>
              {lobbyInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between bg-secondary/50 rounded p-2 mb-1">
                  <span className="text-sm text-foreground">{inv.senderNickname}</span>
                  <div className="flex gap-1">
                    <button onClick={() => acceptLobbyInvite(inv.id, inv.lobbyId)} className="p-1 hover:bg-cs-success/20 rounded transition-colors" title="Принять">
                      <Check className="w-4 h-4 text-cs-success" />
                    </button>
                    <button onClick={() => rejectLobbyInvite(inv.id)} className="p-1 hover:bg-destructive/20 rounded transition-colors" title="Отклонить">
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

      {matchmaking.active && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="cs-panel p-8 text-center animate-fade-in max-w-sm">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-3 uppercase">Поиск матча</h3>
            <p className="text-muted-foreground mb-6">{matchmaking.message}</p>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <button
              onClick={async () => {
                if (user) await supabase.from("matchmaking_queue").delete().eq("user_id", user.id);
                setMatchmaking({ active: false, message: "" });
              }}
              className="cs-btn-secondary px-10"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
