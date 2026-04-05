import { useState } from "react";
import AuthScreen from "@/components/AuthScreen";
import MainMenu from "@/components/MainMenu";

const Index = () => {
  const [user, setUser] = useState<string | null>(null);

  if (!user) {
    return <AuthScreen onAuth={(username) => setUser(username)} />;
  }

  return <MainMenu username={user} onLogout={() => setUser(null)} />;
};

export default Index;
