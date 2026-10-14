import { renderPromo } from "./promoRender.js";

const PROMO = {
  name: "ds-rangotsav-promo",
  intro: {
    title: "DS RANGOTSAV 2026",
    tagline: "DANDIYA NIGHT",
    dateLine: "16 OCTOBER  |  6 PM ONWARDS",
  },
  scenes: [
    {
      mode: "zoomOut",
      prompt: "epic aerial drone night view of a huge illuminated outdoor festival ground, golden string lights covering the field, colorful tents and stage, crowd dancing below, warm festive glow, cinematic",
      keywords: ["festival ground night lights", "aerial night event"],
      overlay: [{ text: "16 OCTOBER  |  6 PM ONWARDS", style: "A" }],
    },
    {
      mode: "zoomIn",
      prompt: "energetic dandiya raas dance at night, women in colorful chaniya choli spinning with decorated sticks, purple pink and gold stage lights, motion blur, festive joyful",
      keywords: ["dandiya dance", "garba night"],
      overlay: [
        { text: "DOON SCHOLARS GROUND", style: "B" },
        { text: "SHIVAM VIHAR, DEHRADUN", style: "C" },
      ],
    },
    {
      mode: "pan",
      prompt: "colorful Indian street food stall at night festival, steam rising from grills and chaat counter, fairy lights bokeh, delicious snacks, vibrant orange and red tones",
      keywords: ["indian food stall festival", "street food night"],
      overlay: [{ text: "BELOW 18  ₹300   |   ADULTS  ₹500", style: "F" }],
    },
    {
      mode: "zoomOut",
      prompt: "cheering festival crowd at night with hands raised, confetti falling, golden and magenta lights, joyful bokeh, celebration energy",
      keywords: ["festival crowd cheering night", "concert crowd celebration"],
      overlay: [{ text: "MUSIC  •  DANDIYA  •  FOOD  •  FUN", style: "D" }],
    },
    {
      mode: "zoomIn",
      prompt: "happy friends celebrating together at colorful Indian night festival, laughing, festive lights bokeh behind them, vibrant traditional clothes, warm glow",
      keywords: ["friends festival selfie night", "people celebrating india festival"],
      overlay: [{ text: "CONTACT  7302355597", style: "E" }],
    },
  ],
  outro: [
    "EAT. DANCE.",
    "CELEBRATE.",
    { text: "DS RANGOTSAV 2026", style: "OutroWhite" },
    { text: "BELOW 18 ₹300  |  ADULTS ₹500", style: "OutroOrange" },
    { text: "CONTACT 7302355597", style: "OutroMag" },
  ],
  theme: "festive",
  total: 10,
  preferVideo: !!(process.env.POLLINATIONS_API_KEY || process.env.PIXAZO_API_KEY),
};

renderPromo(PROMO).catch(e => { console.error(e); process.exit(1); });
