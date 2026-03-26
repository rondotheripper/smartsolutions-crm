import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Pipeline from "@/pages/Pipeline";
import Catalog from "@/pages/Catalog";
import Proposals from "@/pages/Proposals";
import Followups from "@/pages/Followups";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clientes" component={Clients} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/catalogo" component={Catalog} />
      <Route path="/propostas" component={Proposals} />
      <Route path="/followups" component={Followups} />
      <Route path="/definicoes" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
