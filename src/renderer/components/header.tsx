import { Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/renderer/components/ui/select";
import { setAppLanguage } from "../actions/language.actions";
import { toggleTheme } from "../actions/theme.actions";
import langs from "../i18n/langs";
import { Button } from "./ui/button";

export function Header() {
  const { i18n } = useTranslation();

  const currentLang = langs.find((e) => e.key === i18n.language)?.nativeName || "en-US";

  function onValueChange(value: string) {
    setAppLanguage(value, i18n);
  }

  return (
    <header className="absolute top-0 flex w-screen items-center justify-between p-8">
      <div />
      <div className="flex items-center gap-2">
        <Button onClick={toggleTheme} size="icon">
          <Moon size={16} />
        </Button>
        <Select onValueChange={onValueChange} value={currentLang}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
    </header>
  );
}
