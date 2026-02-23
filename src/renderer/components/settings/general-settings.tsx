import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../actions/language.actions";
import langs from "../../i18n/langs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function GeneralSettings() {
  const { t, i18n } = useTranslation();

  const currentLang = langs.find((e) => e.key === i18n.language)?.nativeName || "en-US";

  function onValueChange(value: string) {
    setAppLanguage(value, i18n);
  }

  return (
    <div className="mx-auto flex w-2xl flex-col">
      <div className="mb-6 flex">
        <h1 className="font-bold text-xl">{t("settings.general.title")}</h1>
      </div>
      <div className="flex w-full rounded border bg-mute bg-muted">
        <div className="settings-item flex w-full items-center justify-between p-4">
          <div className="item-left grid gap-1">
            <div className="item-title text-xs">{t("settings.general.language.title")}</div>
            <div className="item-desc text-muted-foreground text-xs">{t("settings.general.language.description")}</div>
          </div>
          <div className="item-right">
            <Select onValueChange={onValueChange} value={currentLang}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger>
                <SelectGroup>
                  {langs.map((lang) => (
                    <SelectItem key={lang.key} value={lang.key}>
                      {lang.nativeName}
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
