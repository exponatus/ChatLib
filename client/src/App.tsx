import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AssistantEditor from "@/pages/assistant-editor";
import FilesPage from "@/pages/files";
import TextPage from "@/pages/text";
import WebsitePage from "@/pages/website";
import QAPage from "@/pages/qa";
import AIWorkspacePage from "@/pages/ai-workspace";
import ChatInterfacePage from "@/pages/chat-interface";
import SecurityPage from "@/pages/security";
import DeployPage from "@/pages/deploy";
import LoginPage from "@/pages/login";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={LoginPage} />
      
      {/* Protected Routes */}
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      
      <Route path="/assistant/:id">
        {() => <ProtectedRoute component={AssistantEditor} />}
      </Route>
      
      <Route path="/assistant/:id/files">
        {() => <ProtectedRoute component={FilesPage} />}
      </Route>
      
      <Route path="/assistant/:id/text">
        {() => <ProtectedRoute component={TextPage} />}
      </Route>
      
      <Route path="/assistant/:id/website">
        {() => <ProtectedRoute component={WebsitePage} />}
      </Route>
      
      <Route path="/assistant/:id/qa">
        {() => <ProtectedRoute component={QAPage} />}
      </Route>
      
      <Route path="/assistant/:id/ai-workspace">
        {() => <ProtectedRoute component={AIWorkspacePage} />}
      </Route>
      
      <Route path="/assistant/:id/chat-interface">
        {() => <ProtectedRoute component={ChatInterfacePage} />}
      </Route>
      
      <Route path="/assistant/:id/security">
        {() => <ProtectedRoute component={SecurityPage} />}
      </Route>
      
      <Route path="/assistant/:id/deploy">
        {() => <ProtectedRoute component={DeployPage} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
