import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { TitleBar } from "../components/title-bar";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <TitleBar />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}
