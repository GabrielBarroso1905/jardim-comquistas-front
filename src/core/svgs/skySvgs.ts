export const SKY_SVGS: { [key: string]: string } = {
  star: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
        <stop offset="60%" stop-color="#FFFFE0" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#FFFFE0" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="8" height="8" fill="none"/>
    <circle cx="4" cy="4" r="0.4" fill="#FFFFFF"/>
    <circle cx="4" cy="4" r="3" fill="url(#g)"/>
  </svg>
  `,
};

export default SKY_SVGS;
