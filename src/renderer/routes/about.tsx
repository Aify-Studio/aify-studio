import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/renderer/components/ui/button";
import { Header } from "../components/header";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Header />
      <h1>{t("welcome")}</h1>
      <div className="mt-6">
        <Button render={<Link to="/" />}>Hello AboutPage!</Button>
      </div>
    </div>
  );
}
