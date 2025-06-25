import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 55 20"
      width="80"
      height="30"
      aria-label="NCBX Logo"
      {...props}
    >
      <text
        x="0"
        y="15"
        fontFamily="'Poppins', sans-serif"
        fontSize="18"
        fontWeight="bold"
        fill="hsl(var(--primary))"
        letterSpacing="-0.5"
      >
        NCBX
      </text>
    </svg>
  );
}
