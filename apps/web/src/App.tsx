import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import AdminApp from './admin';
import Home from '@/pages/home';
import {
  AboutPage,
  PublicationPage,
  ServicesPage,
  ProjectsPage,
} from '@/pages/secondary-pages';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/a-propos" component={AboutPage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/projets" component={ProjectsPage} />
      <Route path="/publication/:id" component={PublicationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;