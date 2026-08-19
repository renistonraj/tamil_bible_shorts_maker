import { BackgroundStyle, TextStyle, FrameStyle, TemplateConfig } from "./types";

// Cinematic, Bible, Nature, Heaven, Worship, Ancient, Peaceful, Green, Powerful, Spiritual, Modern, Dark, Color, Particle, Abstract, Geometric, Emotional, Bright
export const BACKGROUND_CATEGORIES = [
  "Cinematic", "Bible", "Nature", "Heaven", "Worship", "Ancient",
  "Peaceful", "Green", "Powerful", "Spiritual", "Modern", "Dark",
  "Color", "Particle", "Abstract", "Geometric", "Emotional", "Bright"
];

export const BACKGROUNDS: BackgroundStyle[] = [
  // Cinematic
  { id: "bg-galaxy", name: "Nebula Galaxy", category: "Cinematic", bgType: "gradient", value: "linear-gradient(135deg, #0b001a, #030008, #18002a)" },
  { id: "bg-stars", name: "Deep Space Stars", category: "Cinematic", bgType: "gradient", value: "radial-gradient(circle, #0d1b2a 0%, #000814 100%)" },
  { id: "bg-nebula", name: "Cosmic Nebula", category: "Cinematic", bgType: "gradient", value: "linear-gradient(45deg, #1f0030, #001233)" },
  
  // Bible
  { id: "bg-cross", name: "Sacred Cross Backdrop", category: "Bible", bgType: "gradient", value: "radial-gradient(circle at center, #2c0c14 0%, #0c0205 100%)" },
  { id: "bg-church", name: "Gothic Sanctuary Glow", category: "Bible", bgType: "gradient", value: "linear-gradient(to bottom, #110507, #2c0e12, #050102)" },
  { id: "bg-openbible", name: "Holy Scriptures Light", category: "Bible", bgType: "gradient", value: "radial-gradient(circle at bottom, #3d1c1a 0%, #0d0404 100%)" },

  // Nature
  { id: "bg-mountain", name: "Majestic Peaks Peak", category: "Nature", bgType: "gradient", value: "linear-gradient(to bottom, #001219, #005f73, #0a1128)" },
  { id: "bg-sunrise", name: "Dawn Illuminance", category: "Nature", bgType: "gradient", value: "linear-gradient(to top, #4a0e17, #0f0206)" },

  // Heaven
  { id: "bg-clouds", name: "Heavenly Altocumulus", category: "Heaven", bgType: "gradient", value: "linear-gradient(to top, #141125, #352a55)" },
  { id: "bg-golden-light", name: "Angelic Glow", category: "Heaven", bgType: "gradient", value: "radial-gradient(circle at top, #a27b38 0%, #150f05 100%)" },

  // Worship
  { id: "bg-candle", name: "Warm Sanctuary Flame", category: "Worship", bgType: "gradient", value: "radial-gradient(circle at center, #3d2314 0%, #0c0502 100%)" },

  // Ancient
  { id: "bg-parchment", name: "Sacred Scroll Manuscript", category: "Ancient", bgType: "gradient", value: "radial-gradient(circle, #2d2218, #18120c)" },

  // Dark
  { id: "bg-dark-cinematic", name: "Void Shadows", category: "Dark", bgType: "gradient", value: "linear-gradient(135deg, #0a0a0a, #1a1515, #000000)" },

  // Modern
  { id: "bg-neon-grad", name: "Midnight Glow", category: "Modern", bgType: "gradient", value: "linear-gradient(135deg, #09090b 0%, #2e0817 100%)" }
];

export const TEXT_STYLES: TextStyle[] = [
  { id: "text-bold-gold", name: "Royal Gold Foil", fontWeight: "900", fontStyle: "normal", color: "#ffd700", glow: "0 0 15px rgba(255, 215, 0, 0.4)", shadow: "3px 3px 6px rgba(0,0,0,0.8)" },
  { id: "text-divine-white", name: "Angelic White Glow", fontWeight: "700", fontStyle: "normal", color: "#ffffff", glow: "0 0 20px rgba(255, 255, 255, 0.6)", shadow: "2px 2px 8px rgba(0,0,0,0.9)" },
  { id: "text-sacred-red", name: "Martyr Crimson Outline", fontWeight: "800", fontStyle: "normal", color: "#ff4d4d", outlineColor: "#ffffff", outlineWidth: 1.5, shadow: "4px 4px 10px rgba(0,0,0,1)" },
  { id: "text-classic-serif", name: "Scripture Editorial Serif", fontWeight: "400", fontStyle: "italic", color: "#f5f5f7", shadow: "1px 1px 3px rgba(0,0,0,0.7)" },
  { id: "text-retro-neon", name: "Sacred Neon Sign", fontWeight: "900", fontStyle: "normal", color: "#ff3366", glow: "0 0 25px rgba(255, 51, 102, 0.8)", shadow: "0 0 10px rgba(0,0,0,0.5)" },
  { id: "text-royal-bronze", name: "Polished Bronze Emboss", fontWeight: "800", fontStyle: "normal", color: "#cd7f32", shadow: "2px 2px 0px #8b5a2b, 4px 4px 8px rgba(0,0,0,0.9)" },
  { id: "text-glassmorphism", name: "Frosted Mirror Glass", fontWeight: "300", fontStyle: "normal", color: "rgba(255, 255, 255, 0.95)", glow: "0 0 8px rgba(255,255,255,0.3)", shadow: "2px 2px 4px rgba(0,0,0,0.5)" }
];

export const FRAME_STYLES: FrameStyle[] = [
  { id: "frame-simple", name: "Elegant Simple Line", borderStyle: "solid 2px", borderColor: "rgba(255,255,255,0.4)", borderRadius: "8px", padding: "24px" },
  { id: "frame-double", name: "Cathedral Double Border", borderStyle: "double 6px", borderColor: "rgba(255, 215, 0, 0.7)", borderRadius: "0px", padding: "30px", glow: "0 0 15px rgba(255, 215, 0, 0.3)" },
  { id: "frame-neon", name: "Glowing Covenant Frame", borderStyle: "solid 3px", borderColor: "#ff3366", borderRadius: "16px", padding: "28px", glow: "0 0 20px rgba(255, 51, 102, 0.5)" },
  { id: "frame-gold-corners", name: "Ancient Royal Corners", borderStyle: "solid 1px", borderColor: "rgba(255, 215, 0, 0.3)", borderRadius: "12px", padding: "32px", glow: "0 0 10px rgba(255,215,0,0.2)" },
  { id: "frame-none", name: "Borderless Cinematic", borderStyle: "none 0px", borderColor: "transparent", borderRadius: "0px", padding: "16px" }
];

export const PARTICLES_TYPES = [
  "Stars", "Dust", "Golden Particles", "Fire Particles", "Smoke", "Bokeh",
  "Snow", "Rain", "Light Particles", "Energy Particles", "Divine Particles",
  "Galaxy Particles", "Sparkles", "Glitter"
];

export const ANIMATIONS_IN = ["Fade In", "Slide In", "Zoom In", "Reveal", "Typewriter", "Blur Reveal", "Wipe", "Scale", "Rotate"];
export const ANIMATIONS_OUT = ["Fade Out", "Slide Out", "Zoom Out", "Blur", "Dissolve", "Light Fade", "Glitch Out"];
export const ANIMATIONS_LOOP = ["Floating", "Breathing", "Glow Pulse", "Light Sweep", "Shimmer", "Particle Motion", "Slow Zoom"];

// Procedurally generate 1000 genuinely unique template configurations on compile
export function generateTemplates1000(): TemplateConfig[] {
  const list: TemplateConfig[] = [];
  
  // Create standard top-tier manually customized templates first
  list.push({
    id: "temp-001",
    name: "Golden Covenant Royal",
    category: "Worship",
    backgroundId: "bg-candle",
    textStyleId: "text-bold-gold",
    frameStyleId: "frame-double",
    animationIn: "Blur Reveal",
    animationHold: "Glow Pulse",
    animationOut: "Light Fade",
    particles: "Golden Particles",
    particlesDensity: "High"
  });

  list.push({
    id: "temp-002",
    name: "Nebula Cosmic Revelation",
    category: "Cinematic",
    backgroundId: "bg-galaxy",
    textStyleId: "text-divine-white",
    frameStyleId: "frame-simple",
    animationIn: "Zoom In",
    animationHold: "Slow Zoom",
    animationOut: "Dissolve",
    particles: "Stars",
    particlesDensity: "Ultra"
  });

  list.push({
    id: "temp-003",
    name: "Scriptural Parchment Scroll",
    category: "Ancient",
    backgroundId: "bg-parchment",
    textStyleId: "text-classic-serif",
    frameStyleId: "frame-gold-corners",
    animationIn: "Typewriter",
    animationHold: "Breathing",
    animationOut: "Fade Out",
    particles: "Dust",
    particlesDensity: "Low"
  });

  // Procedurally populate up to 1000 configurations using mathematical combinations
  // of background categories, text styles, frame styles, animations, and particle types
  let counter = 4;
  while (list.length < 1000) {
    const bgIdx = counter % BACKGROUNDS.length;
    const txtIdx = (counter * 3) % TEXT_STYLES.length;
    const frameIdx = (counter * 7) % FRAME_STYLES.length;
    const pTypeIdx = (counter * 13) % PARTICLES_TYPES.length;
    const animInIdx = (counter * 2) % ANIMATIONS_IN.length;
    const animHoldIdx = (counter * 5) % ANIMATIONS_LOOP.length;
    const animOutIdx = (counter * 11) % ANIMATIONS_OUT.length;
    const densities: Array<"Low" | "Medium" | "High" | "Ultra"> = ["Low", "Medium", "High", "Ultra"];
    const densIdx = counter % densities.length;

    const bg = BACKGROUNDS[bgIdx];
    const txtStyle = TEXT_STYLES[txtIdx];
    const frameStyle = FRAME_STYLES[frameIdx];

    const padStr = String(counter).padStart(3, "0");
    list.push({
      id: `temp-${padStr}`,
      name: `${bg.category} Layout ${padStr}`,
      category: bg.category,
      backgroundId: bg.id,
      textStyleId: txtStyle.id,
      frameStyleId: frameStyle.id,
      animationIn: ANIMATIONS_IN[animInIdx],
      animationHold: ANIMATIONS_LOOP[animHoldIdx],
      animationOut: ANIMATIONS_OUT[animOutIdx],
      particles: PARTICLES_TYPES[pTypeIdx],
      particlesDensity: densities[densIdx]
    });
    
    counter++;
  }

  return list;
}
