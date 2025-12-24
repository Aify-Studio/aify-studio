import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/renderer/components/ui/button";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-orange-100">
      <Button render={<Link to="/" />}>Hello AboutPage!</Button>
    </div>
  );
}
