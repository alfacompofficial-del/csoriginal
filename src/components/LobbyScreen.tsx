import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type LobbyMember = { user_id: string; role: "host" | "member"; nickname: string };
type LobbyInvite = { id: string; lobby_id: string; sender_id: string; sender_nickname: string };

interface LobbyScreenProps {
  onBack: () => void;
  onStart: (args: { mode: "closed" | "partners" | "competitive"; mapName: string; lobbyId: string | null }) => void;
  initialLobbyId?: string | null;
}

export default function LobbyScreen({ onBack, onStart, initialLobbyId = null }: LobbyScreenProps) {
  const { user } = useAuth();
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [members, setMembers] = useState<LobbyMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<LobbyInvite[]>([]);
  const [mode, setMode] = useState<"closed" | "partners" | "competitive">("competitive");
  const [mapName, setMapName] = useState<"Dust 2" | "Mirage" | "Sandstone">("Dust 2");
  const [error, setError] = useState<string>("");
  const maxInvites = 5;

  const memberCount = members.length;
  const inviteCount = pendingInvites.length;
  const canInviteMore = inviteCount < maxInvites;

  const loadLobby = useCallback(async (id: string) => {
    const { data: lobbyMembers } = await supabase.from("lobby_members").select("user_id, role").eq("lobby_id", id);
    const userIds = (lobbyMembers ?? []).map((m) => m.user_id);
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("user_id, nickname").in("user_id", userIds)
      : { data: [] as { user_id: string; nickname: string }[] };
    const nickMap = new Map((profiles ?? []).map((p) => [p.user_id, p.nickname]));
    setMembers(
      (lobbyMembers ?? []).map((m) => ({
        user_id: m.user_id,
        role: (m.role as "host" | "member") ?? "member",
        nickname: nickMap.get(m.user_id) ?? "Player",
      }))
    );

    const { data: invites } = await supabase
      .from("lobby_invites")
      .select("id, lobby_id, sender_id, receiver_id, status")
      .eq("lobby_id", id)
      .eq("status", "pending");

    const senderIds = (invites ?? []).map((i) => i.sender_id);
    const { data: senderProfiles } = senderIds.length
      ? await supabase.from("profiles").select("user_id, nickname").in("user_id", senderIds)
      : { data: [] as { user_id: string; nickname: string }[] };
    const senderNickMap = new Map((senderProfiles ?? []).map((p) => [p.user_id, p.nickname]));

    setPendingInvites(
      (invites ?? []).map((i) => ({
        id: i.id,
        lobby_id: i.lobby_id,
        sender_id: i.sender_id,
        sender_nickname: senderNickMap.get(i.sender_id) ?? "Player",
      }))
    );
  }, []);

  useEffect(() => {
    if (!initialLobbyId) return;
    setLobbyId(initialLobbyId);
    loadLobby(initialLobbyId);
  }, [initialLobbyId, loadLobby]);

  const ensureLobby = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    if (lobbyId) return lobbyId;
    setError("");
    const { data, error: rpcErr } = await supabase.rpc("create_lobby");
    if (rpcErr) {
      setError(rpcErr.message || "Не удалось создать лобби");
      return null;
    }
    const id = data as string;
    setLobbyId(id);
    await loadLobby(id);
    return id;
  }, [user, lobbyId, loadLobby]);

  const myRole = useMemo(() => members.find((m) => m.user_id === user?.id)?.role ?? "member", [members, user]);
  const isHost = myRole === "host";

  const inviteByNickname = useCallback(async (nickname: string) => {
    if (!user) return;
    setError("");
    const id = await ensureLobby();
    if (!id) return;
    if (!canInviteMore) {
      setError("Можно пригласить максимум 5 друзей");
      return;
    }

    const { data: target, error: findErr } = await supabase.from("profiles").select("user_id").eq("nickname", nickname.trim()).single();
    if (findErr || !target) {
      setError("Игрок не найден");
      return;
    }
    if (target.user_id === user.id) {
      setError("Нельзя пригласить себя");
      return;
    }

    const { error: insErr } = await supabase.from("lobby_invites").insert({
      lobby_id: id,
      sender_id: user.id,
      receiver_id: target.user_id,
    });
    if (insErr) {
      setError(insErr.code === "23505" ? "Этот игрок уже приглашён" : insErr.message || "Ошибка приглашения");
      return;
    }
    await loadLobby(id);
  }, [user, ensureLobby, canInviteMore, loadLobby]);

  const leaveLobby = useCallback(async () => {
    if (!user) return;
    setError("");
    if (!lobbyId) {
      onBack();
      return;
    }
    await supabase.from("lobby_members").delete().eq("lobby_id", lobbyId).eq("user_id", user.id);
    setLobbyId(null);
    setMembers([]);
    setPendingInvites([]);
    onBack();
  }, [user, lobbyId, onBack]);

  useEffect(() => {
    if (!user || !lobbyId) return;
    const channel = supabase
      .channel(`lobby:${lobbyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lobby_members", filter: `lobby_id=eq.${lobbyId}` }, () => loadLobby(lobbyId))
      .on("postgres_changes", { event: "*", schema: "public", table: "lobby_invites", filter: `lobby_id=eq.${lobbyId}` }, () => loadLobby(lobbyId))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, lobbyId, loadLobby]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={leaveLobby} className="p-2 rounded hover:bg-secondary transition-colors" title="Назад">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-3xl font-bold text-foreground uppercase tracking-wider">Лобби</h1>
          {lobbyId && <span className="text-xs text-muted-foreground">ID: {lobbyId.slice(0, 8)}</span>}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 cs-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-foreground uppercase">Игроки ({memberCount}/6)</h2>
              <div className="text-xs text-muted-foreground">Приглашений: {inviteCount}/{maxInvites}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between bg-secondary/30 rounded px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{m.nickname}</div>
                    <div className="text-xs text-muted-foreground">{m.role === "host" ? "Хост" : "Игрок"}</div>
                  </div>
                  {m.user_id === user?.id && (
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Вы</span>
                  )}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 6 - members.length) }).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex items-center justify-between bg-secondary/10 rounded px-4 py-3 border border-border/40">
                  <div className="text-sm text-muted-foreground">Пустой слот</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="cs-input text-sm py-2">
                <option value="closed">Закрытая карта</option>
                <option value="partners">Напарники</option>
                <option value="competitive">Соревновательный</option>
              </select>
              <select value={mapName} onChange={(e) => setMapName(e.target.value as any)} className="cs-input text-sm py-2">
                <option value="Dust 2">Dust 2</option>
                <option value="Mirage">Mirage</option>
                <option value="Sandstone">Sandstone</option>
              </select>

              <button
                disabled={!lobbyId}
                onClick={() => onStart({ mode, mapName, lobbyId })}
                className={`cs-btn-primary flex items-center gap-2 ${!lobbyId ? "opacity-50 cursor-not-allowed" : ""}`}
                title={isHost ? "Запуск поиска/игры" : "Хост запускает"}
              >
                <Play className="w-4 h-4" />
                {isHost ? "Старт" : "Ожидание хоста"}
              </button>
            </div>

            {error && <div className="mt-3 text-sm text-destructive">{error}</div>}
          </div>

          <div className="col-span-4 cs-panel p-6">
            <h2 className="font-heading text-xl font-bold text-foreground uppercase mb-4">Пригласить</h2>
            <InviteBox onInvite={inviteByNickname} disabled={!canInviteMore} />

            {pendingInvites.length > 0 && (
              <div className="mt-6">
                <div className="text-xs text-primary uppercase tracking-wider mb-2 font-semibold">Ожидают ({pendingInvites.length})</div>
                <div className="space-y-2">
                  {pendingInvites.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-secondary/30 rounded px-3 py-2">
                      <div className="text-sm text-muted-foreground">От: {inv.sender_nickname}</div>
                      <button
                        className="p-1 rounded hover:bg-secondary"
                        title="Скрыть"
                        onClick={async () => {
                          await supabase.from("lobby_invites").update({ status: "cancelled" }).eq("id", inv.id);
                        }}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 text-xs text-muted-foreground">
              - Лимит приглашений: 5\n
              - В лобби один 3D-опорник будет добавлен на следующем шаге (вместо картинки)\n
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteBox({ onInvite, disabled }: { onInvite: (nickname: string) => void; disabled: boolean }) {
  const [nick, setNick] = useState("");
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <input
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          className="cs-input w-full text-sm py-2"
          placeholder="Ник друга..."
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") onInvite(nick);
          }}
        />
      </div>
      <button
        disabled={disabled}
        onClick={() => onInvite(nick)}
        className={`cs-btn-primary px-3 py-2 text-sm flex items-center gap-1 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <UserPlus className="w-4 h-4" />
        ОК
      </button>
    </div>
  );
}

