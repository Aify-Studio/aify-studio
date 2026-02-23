import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ThemeMode } from "@/shared/constants";
import { getCurrentTheme, setTheme } from "../../actions/theme.actions";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function AppearanceSettings() {
  const { t } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");

  const items = Object.values(ThemeMode).map((theme) => ({
    label: t(`settings.appearance.theme.${theme}`) as string,
    value: theme,
  }));

  useEffect(() => {
    getCurrentTheme().then((theme) => {
      setCurrentTheme(theme.local || theme.system);
    });
  }, []);

  function onValueChange(value: string) {
    const newTheme = value as ThemeMode;
    setTheme(newTheme);
    setCurrentTheme(newTheme);
  }

  console.log(123, currentTheme);

  return (
    <div className="mx-auto flex w-2xl flex-col">
      <div className="mb-6 flex">
        <h1 className="font-bold text-xl">{t("settings.appearance.title")}</h1>
      </div>
      <div className="flex w-full rounded border bg-mute bg-muted">
        <div className="settings-item flex w-full items-center justify-between p-4">
          <div className="item-left grid gap-1">
            <div className="item-title text-xs">{t("settings.appearance.theme.title")}</div>
            <div className="item-desc text-muted-foreground text-xs">{t("settings.appearance.theme.description")}</div>
          </div>
          <div className="item-right">
            <Select items={items} onValueChange={onValueChange} value={currentTheme}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger>
                <SelectGroup>
                  {Object.values(ThemeMode).map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {t(`settings.appearance.theme.${theme}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
