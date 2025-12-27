import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import { updateAppLanguage } from "./actions/language.actions";
import { syncWithLocalTheme } from "./actions/theme.actions";
import { queryClient } from "./lib/react-query-client";
import { routeTree } from "./routeTree.gen";
import "./i18n";
import "./styles/global.css";

export const router = createRouter({
  defaultPendingMinMs: 0,
  routeTree,
  history: createMemoryHistory({
    initialEntries: ["/"],
  }),
});

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncWithLocalTheme();
    updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
