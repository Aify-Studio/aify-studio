import { z } from "zod";
import { ThemeMode } from "@/shared/constants";

export const setThemeModeInputSchema = z.enum([ThemeMode.Light, ThemeMode.Dark, ThemeMode.System]);
