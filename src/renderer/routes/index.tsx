import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/renderer/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex h-screen items-center justify-center bg-orange-100">
      <Button render={<Link to="/about" />}>Hello HomePage!</Button>
    </div>
  );
}
