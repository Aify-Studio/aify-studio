import { StrictMode } from "react";
import "./styles/global.css";
import { createRoot } from "react-dom/client";
import { Button } from "@/renderer/components/ui/button";

export default function App() {
  return (
    <div className="bg-orange-100">
      <Button>Hello World!</Button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
