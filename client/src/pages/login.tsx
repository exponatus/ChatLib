import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import chatLibLogo from "@assets/chatlib_logo_1767359875781.png";

export default function LoginPage() {
  const { user, isLoading, login, isLoggingIn, loginError } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("chatlib");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <img src={chatLibLogo} alt="ChatLib" className="w-20 h-20 rounded-3xl rotate-3 shadow-lg shadow-primary/10" style={{ filter: 'hue-rotate(-30deg) saturate(1.2)' }} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            ChatLib
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Build intelligent assistants for your library in minutes.
          </p>
        </div>

        {!showForm ? (
          <div className="pt-8">
            <Button 
              size="lg" 
              className="w-full text-lg h-14 rounded-xl shadow-xl shadow-primary/20 transition-all"
              onClick={() => setShowForm(true)}
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="mt-4 text-xs text-slate-400 tracking-wide">
              © 2026 ChatLib.de — Alexander Ananyev
            </p>
          </div>
        ) : (
          <Card className="mt-8 border-0 shadow-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2 text-left">
                  <Label htmlFor="username">Login</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your login"
                    data-testid="input-username"
                    required
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    data-testid="input-password"
                    required
                  />
                </div>
                
                {(error || loginError) && (
                  <p className="text-sm text-destructive" data-testid="text-login-error">
                    {error || loginError}
                  </p>
                )}

                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full h-12 rounded-xl"
                  disabled={isLoggingIn}
                  data-testid="button-login"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForm(false)}
                  data-testid="button-back"
                >
                  Back
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
