-- Lobbies
CREATE TABLE public.lobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_game', 'closed')),
  max_members INTEGER NOT NULL DEFAULT 6 CHECK (max_members BETWEEN 1 AND 6),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lobby_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('host', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lobby_id, user_id)
);

CREATE TABLE public.lobby_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (lobby_id, receiver_id)
);

ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_invites ENABLE ROW LEVEL SECURITY;

-- Policies: lobbies
CREATE POLICY "Lobby members can view lobbies"
  ON public.lobbies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lobby_members m
      WHERE m.lobby_id = lobbies.id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lobbies"
  ON public.lobbies FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update lobby"
  ON public.lobbies FOR UPDATE
  USING (auth.uid() = host_id);

-- Policies: lobby_members
CREATE POLICY "Members can view lobby members"
  ON public.lobby_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lobby_members m
      WHERE m.lobby_id = lobby_members.lobby_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Host can insert lobby members"
  ON public.lobby_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lobby_members m
      WHERE m.lobby_id = lobby_members.lobby_id AND m.user_id = auth.uid() AND m.role = 'host'
    )
  );

CREATE POLICY "Members can leave lobby (delete self)"
  ON public.lobby_members FOR DELETE
  USING (auth.uid() = user_id);

-- Policies: lobby_invites
CREATE POLICY "Users can view own lobby invites"
  ON public.lobby_invites FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Members can send lobby invites"
  ON public.lobby_invites FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update invite"
  ON public.lobby_invites FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Sender can cancel invite"
  ON public.lobby_invites FOR UPDATE
  USING (auth.uid() = sender_id);

-- Helper: create lobby + host member
CREATE OR REPLACE FUNCTION public.create_lobby()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_lobby_id UUID;
BEGIN
  INSERT INTO public.lobbies (host_id) VALUES (auth.uid()) RETURNING id INTO new_lobby_id;
  INSERT INTO public.lobby_members (lobby_id, user_id, role) VALUES (new_lobby_id, auth.uid(), 'host');
  RETURN new_lobby_id;
END;
$$;

-- Helper: accept invite -> add member (respect max_members)
CREATE OR REPLACE FUNCTION public.accept_lobby_invite(invite_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lobby_id UUID;
  v_status TEXT;
  v_count INTEGER;
  v_max INTEGER;
BEGIN
  SELECT lobby_id, status INTO v_lobby_id, v_status
  FROM public.lobby_invites
  WHERE id = invite_id AND receiver_id = auth.uid();

  IF v_lobby_id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_status <> 'pending' THEN
    RETURN v_lobby_id;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.lobby_members
  WHERE lobby_id = v_lobby_id;

  SELECT max_members INTO v_max FROM public.lobbies WHERE id = v_lobby_id;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Lobby is full';
  END IF;

  UPDATE public.lobby_invites SET status = 'accepted' WHERE id = invite_id;
  INSERT INTO public.lobby_members (lobby_id, user_id, role)
  VALUES (v_lobby_id, auth.uid(), 'member')
  ON CONFLICT DO NOTHING;

  RETURN v_lobby_id;
END;
$$;

-- Matchmaking (minimal)
CREATE TABLE public.matchmaking_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lobby_id UUID REFERENCES public.lobbies(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'closed' CHECK (mode IN ('closed', 'partners', 'competitive')),
  map_name TEXT NOT NULL DEFAULT 'Dust 2',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'started', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.match_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('T', 'CT')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue"
  ON public.matchmaking_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own queue"
  ON public.matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue"
  ON public.matchmaking_queue FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Players can view own matches"
  ON public.matches FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.match_players mp WHERE mp.match_id = matches.id AND mp.user_id = auth.uid())
  );

CREATE POLICY "Players can view match players"
  ON public.match_players FOR SELECT
  USING (auth.uid() = user_id);

-- Function: try to create a 2-player match (first come) for given map/mode
CREATE OR REPLACE FUNCTION public.try_matchmake(p_mode TEXT, p_map_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  other_user UUID;
  new_match_id UUID;
BEGIN
  -- find someone else in queue
  SELECT q.user_id INTO other_user
  FROM public.matchmaking_queue q
  WHERE q.user_id <> auth.uid()
    AND q.mode = p_mode
    AND q.map_name = p_map_name
  ORDER BY q.created_at ASC
  LIMIT 1;

  IF other_user IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.matches (map_name, status) VALUES (p_map_name, 'started') RETURNING id INTO new_match_id;

  INSERT INTO public.match_players (match_id, user_id, team) VALUES
    (new_match_id, auth.uid(), 'CT'),
    (new_match_id, other_user, 'T');

  DELETE FROM public.matchmaking_queue WHERE user_id IN (auth.uid(), other_user);

  RETURN new_match_id;
END;
$$;

