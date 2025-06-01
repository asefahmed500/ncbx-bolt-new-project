import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 20"
      width="150"
      height="30"
      aria-label="NCBX Website Canvas Logo"
      {...props}
    >
      <text
        x="0"
        y="15"
        fontFamily="'Poppins', sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="hsl(var(--primary))"
      >
        NCBX
      </text>
      <text
        x="48"
        y="15"
        fontFamily="'Poppins', sans-serif"
        fontSize="16"
        fill="hsl(var(--foreground))"
      >
        Canvas
      </text>
    </svg>
  );
}
