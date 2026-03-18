import { createMCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export const createChromeDevtoolsMcpClient = async () =>
  await createMCPClient({
    transport: new StdioClientTransport({
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    }),
  });
