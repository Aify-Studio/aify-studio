import { tool } from "ai";
import { z } from "zod";

export const getWeatherInformationTool = tool({
  description: "向用户显示给定城市的天气，如果没有指定城市，使用getLocation工具询问",
  inputSchema: z.object({ city: z.string() }),
  needsApproval: true,
  execute: async ({}: { city: string }) => {
    const weatherOptions = ["sunny", "cloudy", "rainy", "snowy", "windy"];
    return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  },
});

export const askForConfirmationTool = tool({
  description: "Ask the user for confirmation.",
  inputSchema: z.object({
    message: z.string().describe("The message to ask for confirmation."),
  }),
});

export const getLocationTool = tool({
  description: "Get the user location. Always ask for confirmation before using this tool.",
  inputSchema: z.object({}),
});
