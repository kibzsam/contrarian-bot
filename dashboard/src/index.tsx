import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter, RootRoute, Route, Outlet } from '@tanstack/react-router';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import './index.css';

// Import pages
import DashboardPage from './routes/index';
import TradesPage from './routes/trades';
import MarketsPage from './routes/markets';
import BacktestPage from './routes/backtest';
import Layout from './components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Root layout
const rootRoute = new RootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

// Routes
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const tradesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/trades',
  component: TradesPage,
});

const marketsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/markets',
  component: MarketsPage,
});

const backtestRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/backtest',
  component: BacktestPage,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  tradesRoute,
  marketsRoute,
  backtestRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
