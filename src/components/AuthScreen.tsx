import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Crosshair, Shield, Target, Zap } from "lucide-react";
import agentImg from "@/assets/agent.png";

type AuthMode = "login" | "register" | "forgot";

const AuthScreen = () => {
  const { signUp, signIn, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("register");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!nickname || !email || !password || !confirmPassword) {
          setError("Заполните все поля");
          return;
        }
        if (password !== confirmPassword) {
          setError("Пароли не совпадают");
          return;
        }
        if (password.length < 6) {
          setError("Пароль минимум 6 символов");
          return;
        }
        const { error } = await signUp(email, password, nickname);
        if (error) setError(error);
        else setSuccess("Проверьте почту для подтверждения!");
      } else if (mode === "login") {
        if (!email || !password) {
          setError("Введите email и пароль");
          return;
        }
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else {
        if (!email) {
          setError("Введите email");
          return;
        }
        const { error } = await resetPassword(email);
        if (error) setError(error);
        else setSuccess("Инструкции отправлены на почту!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cs-dark via-background to-cs-dark" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-cs-gold/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Left: Hero section */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative z-10 p-12">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crosshair className="w-10 h-10 text-primary" />
            <h1 className="font-heading text-7xl font-bold text-primary tracking-widest">CS2</h1>
          </div>
          <p className="text-muted-foreground tracking-[0.3em] uppercase text-sm">Counter-Strike 2</p>
        </div>

        <img
          src={agentImg}
          alt="Agent"
          className="h-[50vh] max-h-[450px] object-contain drop-shadow-[0_0_40px_rgba(255,165,0,0.15)]"
        />

        {/* Feature badges */}
        <div className="flex gap-6 mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {[
            { icon: Shield, label: "Тактика" },
            { icon: Target, label: "Точность" },
            { icon: Zap, label: "Скорость" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground">
              <Icon className="w-4 h-4 text-primary/60" />
              <span className="text-xs uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-heading text-5xl font-bold text-primary tracking-widest">CS2</h1>
          </div>

          {/* Mode tabs */}
          <div className="flex mb-8 bg-card/50 rounded-lg p-1 backdrop-blur-sm border border-border">
            {[
              { key: "register" as AuthMode, label: "Регистрация" },
              { key: "login" as AuthMode, label: "Вход" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setMode(tab.key); setError(""); setSuccess(""); }}
                className={`flex-1 py-3 rounded-md font-heading font-semibold uppercase tracking-wider text-sm transition-all ${
                  mode === tab.key
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "forgot" ? (
            <div className="cs-panel p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-2 uppercase text-center">
                Восстановление
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-6">
                Введите email для сброса пароля
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="cs-input w-full" />
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                {success && <p className="text-cs-success text-sm text-center">{success}</p>}
                <button type="submit" disabled={loading} className="cs-btn-primary w-full">
                  {loading ? "..." : "Отправить"}
                </button>
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:text-primary/80 text-sm w-full text-center">
                  Вернуться к входу
                </button>
              </form>
            </div>
          ) : (
            <div className="cs-panel p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Никнейм"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="cs-input w-full pl-12"
                    />
                    <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                )}

                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cs-input w-full pl-12"
                  />
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>

                <div className="relative">
                  <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cs-input w-full pl-12"
                  />
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>

                {mode === "register" && (
                  <input
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="cs-input w-full"
                  />
                )}

                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                {success && <p className="text-cs-success text-sm text-center">{success}</p>}

                <button type="submit" disabled={loading} className="cs-btn-primary w-full text-lg animate-pulse-glow">
                  {loading ? "Загрузка..." : mode === "register" ? "Создать аккаунт" : "Войти в игру"}
                </button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                    className="text-accent hover:text-accent/80 text-sm w-full text-center transition-colors"
                  >
                    Забыл пароль?
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
