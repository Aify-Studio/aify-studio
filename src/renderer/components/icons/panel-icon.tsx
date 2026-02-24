import type { ComponentProps } from "react";

const PanelLeftClose = (props: ComponentProps<"svg">) => (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
    <rect fill="currentColor" height={12} rx={1} width={2} x={6} y={6} />
  </svg>
);

const PanelLeftOpen = (props: ComponentProps<"svg">) => (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
      stroke="black"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
    <rect fill="black" height={12} rx={1} width={4} x={6} y={6} />
  </svg>
);

export { PanelLeftClose as PaneLeftClose, PanelLeftOpen as PaneLeftOpen };
