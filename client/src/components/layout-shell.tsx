import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LogOut, 
  Play,
  Cpu,
  MessageSquare,
  Shield,
  Rocket,
  FileText,
  Type,
  Globe,
  HelpCircle,
  Settings,
  Menu
} from "lucide-react";
import chatLibLogo from "@assets/chatlib_logo_1767359875781.png";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutShellProps {
  children: React.ReactNode;
  assistantId?: number;
}

export function LayoutShell({ children, assistantId }: LayoutShellProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAssistantPage = location.startsWith("/assistant/");
  const isFilesPage = location.includes("/files");
  const isTextPage = location.includes("/text");
  const isWebsitePage = location.includes("/website");
  const isQAPage = location.includes("/qa");
  const isAIWorkspacePage = location.includes("/ai-workspace");
  const isChatInterfacePage = location.includes("/chat-interface");
  const isSecurityPage = location.includes("/security");
  const isDeployPage = location.includes("/deploy");
  const basePath = assistantId ? `/assistant/${assistantId}` : '';

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-3 group">
          <img src={chatLibLogo} alt="ChatLib" className="w-10 h-10 rounded-xl" />
          <span className="font-display font-bold text-xl tracking-tight">ChatLib</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {/* Configure Section - shown when editing an assistant */}
        {isAssistantPage && (
          <>
            {/* Playground - only visible on assistant pages */}
            <Link href={`/assistant/${assistantId}`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${location === `/assistant/${assistantId}` && !isFilesPage && !isTextPage && !isWebsitePage && !isQAPage && !isAIWorkspacePage && !isChatInterfacePage && !isSecurityPage && !isDeployPage
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <Play className="w-4 h-4" />
              Playground
            </Link>
          </>
        )}

        {isAssistantPage && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4">
                Configure
              </p>
            </div>
            <Link href={`/assistant/${assistantId}/ai-workspace`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isAIWorkspacePage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <Cpu className="w-4 h-4" />
              AI Workspace
            </Link>
            <Link href={`/assistant/${assistantId}/chat-interface`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isChatInterfacePage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <MessageSquare className="w-4 h-4" />
              Chat Interface
            </Link>
            <Link href={`/assistant/${assistantId}/security`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isSecurityPage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <Shield className="w-4 h-4" />
              Security
            </Link>
            <Link href={`/assistant/${assistantId}/deploy`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isDeployPage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <Rocket className="w-4 h-4" />
              Deploy
            </Link>

            {/* Knowledge Base Section */}
            <div className="pt-4 pb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4">
                Knowledge Base
              </p>
            </div>
            <Link href={`/assistant/${assistantId}/files`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isFilesPage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <FileText className="w-4 h-4" />
              Files
            </Link>
            <Link href={`/assistant/${assistantId}/text`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isTextPage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <Type className="w-4 h-4" />
              Text
            </Link>
            <Link href={`/assistant/${assistantId}/website`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isWebsitePage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <Globe className="w-4 h-4" />
              Website
            </Link>
            <Link href={`/assistant/${assistantId}/qa`} className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
              ${isQAPage 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <HelpCircle className="w-4 h-4" />
              Q&A
            </Link>
          </>
        )}
      </nav>

      {/* Account Section - Bottom */}
      <div className="mt-auto px-4 pb-4 border-t border-border pt-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName || 'User'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Admin Settings
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-card border-r border-border h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Library className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg">ChatLib</span>
        </Link>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
