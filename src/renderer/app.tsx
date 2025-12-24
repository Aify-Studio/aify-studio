import { StrictMode } from "react";
import "./styles/global.css";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const router = createRouter({
  defaultPendingMinMs: 0,
  routeTree,
  history: createMemoryHistory({
    initialEntries: ["/"],
  }),
});

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
