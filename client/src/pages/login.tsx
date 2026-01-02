import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Library, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center rotate-3 shadow-lg shadow-primary/10">
            <Library className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900">
            ChatLib
          </h1>
          <p className="text-lg text-slate-600">
            Build intelligent assistants for your library in minutes.
          </p>
        </div>

        <div className="pt-8">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1"
            onClick={() => window.location.href = "/api/login"}
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="mt-4 text-xs text-slate-400 tracking-wide">
            © 2026 ChatLib.de — Alexander Ananyev
          </p>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
