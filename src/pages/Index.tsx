import { useAuth } from "@/contexts/AuthContext";
import AuthScreen from "@/components/AuthScreen";
import MainMenu from "@/components/MainMenu";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-heading text-xl text-foreground uppercase tracking-wider">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  return <MainMenu />;
};

export default Index;
