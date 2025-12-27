import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/renderer/components/ui/button";
import { Header } from "../components/header";
import { apiClient } from "../lib/api-client";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
  const healthcheckQuery = useQuery({ queryKey: ["healthcheck"], queryFn: () => apiClient.health.healthcheck() });

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Header />
      <h1>{t("welcome")}</h1>
      <div className="mt-6 flex flex-col items-center justify-center">
        <p>System health: {healthcheckQuery.data || "checking"}</p>
        <Button className="mt-4" render={<Link to="/" />}>
          Hello AboutPage!
        </Button>
      </div>
    </div>
  );
}
