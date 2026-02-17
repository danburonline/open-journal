import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import WritePage from "@/pages/write";
import JournalPage from "@/pages/journal";
import ReflectPage from "@/pages/reflect";
import InsightsPage from "@/pages/insights";
import DreamsPage from "@/pages/dreams";
import HighlightsPage from "@/pages/highlights";
import TagsPage from "@/pages/tags";
import PeoplePage from "@/pages/people";
import WisdomPage from "@/pages/wisdom";
import NotesPage from "@/pages/notes";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={WritePage} />
      <Route path="/journal" component={JournalPage} />
      <Route path="/reflect" component={ReflectPage} />
      <Route path="/insights" component={InsightsPage} />
      <Route path="/dreams" component={DreamsPage} />
      <Route path="/highlights" component={HighlightsPage} />
      <Route path="/tags" component={TagsPage} />
      <Route path="/people" component={PeoplePage} />
      <Route path="/wisdom" component={WisdomPage} />
      <Route path="/notes" component={NotesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between gap-4 p-3 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-y-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
