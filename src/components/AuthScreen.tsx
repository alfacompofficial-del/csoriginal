import { useState } from "react";

type AuthMode = "login" | "register" | "forgot";

interface AuthScreenProps {
  onAuth: (username: string) => void;
}

const AuthScreen = ({ onAuth }: AuthScreenProps) => {
  const [mode, setMode] = useState<AuthMode>("register");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
        setError("Пароль должен быть минимум 6 символов");
        return;
      }
      onAuth(nickname);
    } else if (mode === "login") {
      if (!nickname || !password) {
        setError("Введите ник и пароль");
        return;
      }
      onAuth(nickname);
    } else {
      if (!email) {
        setError("Введите вашу почту");
        return;
      }
      alert("Данные аккаунта отправлены на вашу почту!");
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cs-dark via-background to-cs-dark" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-5xl font-bold text-primary tracking-wider">CS2</h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">Counter-Strike 2</p>
        </div>

        {/* Form Card */}
        <div className="cs-panel p-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 text-center uppercase tracking-wide">
            {mode === "register" && "Регистрация"}
            {mode === "login" && "Вход"}
            {mode === "forgot" && "Восстановление"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(mode === "register" || mode === "login") && (
              <input
                type="text"
                placeholder="Никнейм"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="cs-input w-full"
              />
            )}

            {(mode === "register" || mode === "forgot") && (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cs-input w-full"
              />
            )}

            {(mode === "register" || mode === "login") && (
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cs-input w-full"
              />
            )}

            {mode === "register" && (
              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="cs-input w-full"
              />
            )}

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <button type="submit" className="cs-btn-primary w-full text-lg">
              {mode === "register" && "Зарегистрироваться"}
              {mode === "login" && "Войти"}
              {mode === "forgot" && "Отправить"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === "register" && (
              <p className="text-muted-foreground text-sm">
                Уже есть аккаунт?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Войти
                </button>
              </p>
            )}
            {mode === "login" && (
              <>
                <p className="text-muted-foreground text-sm">
                  Нет аккаунта?{" "}
                  <button
                    onClick={() => { setMode("register"); setError(""); }}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Регистрация
                  </button>
                </p>
                <p>
                  <button
                    onClick={() => { setMode("forgot"); setError(""); }}
                    className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
                  >
                    Забыл пароль/ник
                  </button>
                </p>
              </>
            )}
            {mode === "forgot" && (
              <p className="text-muted-foreground text-sm">
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Вернуться к входу
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
