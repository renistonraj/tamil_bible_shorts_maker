import React, { useState, useEffect, useRef } from "react";
import { 
  Database, Type, Layers, Film, Settings, Play, Pause, RotateCcw, 
  Upload, Check, AlertCircle, Sparkles, Sliders, Layout, Volume2, 
  Trash2, Plus, Download, RefreshCw, RefreshCcw, Eye, HelpCircle, 
  FileText, FolderOpen, Save, BookOpen, Clock, AlertTriangle, CheckCircle, Flame, ToggleLeft, ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BibleDatabaseInfo, Verse, FontAsset, BackgroundStyle, TextStyle, 
  FrameStyle, TemplateConfig, RenderTask 
} from "./types";
import { 
  BACKGROUND_CATEGORIES, BACKGROUNDS, TEXT_STYLES, FRAME_STYLES, 
  PARTICLES_TYPES, ANIMATIONS_IN, ANIMATIONS_OUT, ANIMATIONS_LOOP, 
  generateTemplates1000 
} from "./templatesData";

// Proper Configurable Book ID -> English/Tamil Book Name mapping
export const BIBLE_BOOKS_MAP: Record<number, { en: string; ta: string }> = {
  1: { en: "Genesis", ta: "ஆதியாகமம்" },
  2: { en: "Exodus", ta: "யாத்திராகமம்" },
  3: { en: "Leviticus", ta: "லேவியராகமம்" },
  4: { en: "Numbers", ta: "எண்ணாகமம்" },
  5: { en: "Deuteronomy", ta: "உபாகமம்" },
  6: { en: "Joshua", ta: "யோசுவா" },
  7: { en: "Judges", ta: "நியாயாதிபதிகள்" },
  8: { en: "Ruth", ta: "ரூத்" },
  9: { en: "1 Samuel", ta: "1 சாமுவேல்" },
  10: { en: "2 Samuel", ta: "2 சாமுவேல்" },
  11: { en: "1 Kings", ta: "1 இராஜாக்கள்" },
  12: { en: "2 Kings", ta: "2 இராஜாக்கள்" },
  13: { en: "1 Chronicles", ta: "1 நாளாகமம்" },
  14: { en: "2 Chronicles", ta: "2 நாளாகமம்" },
  15: { en: "Ezra", ta: "எஸ்றா" },
  16: { en: "Nehemiah", ta: "நெகேமியா" },
  17: { en: "Esther", ta: "எஸ்தர்" },
  18: { en: "Job", ta: "யோபு" },
  19: { en: "Psalms", ta: "சங்கீதம்" },
  20: { en: "Proverbs", ta: "நீதிமொழிகள்" },
  21: { en: "Ecclesiastes", ta: "பிரசங்கி" },
  22: { en: "Song of Solomon", ta: "உன்னதப்பாட்டு" },
  23: { en: "Isaiah", ta: "ஏசாயா" },
  24: { en: "Jeremiah", ta: "எரேமியா" },
  25: { en: "Lamentations", ta: "புலம்பல்" },
  26: { en: "Ezekiel", ta: "எசேக்கியேல்" },
  27: { en: "Daniel", ta: "தானியேல்" },
  28: { en: "Hosea", ta: "ஓசியா" },
  29: { en: "Joel", ta: "யோவேல்" },
  30: { en: "Amos", ta: "ஆமோஸ்" },
  31: { en: "Obadiah", ta: "ஒபதியா" },
  32: { en: "Jonah", ta: "யோனா" },
  33: { en: "Micah", ta: "மீகா" },
  34: { en: "Nahum", ta: "நாகூம்" },
  35: { en: "Habakkuk", ta: "ஆபகூக்" },
  36: { en: "Zephaniah", ta: "செப்பனியா" },
  37: { en: "Haggai", ta: "ஆகாய்" },
  38: { en: "Zechariah", ta: "சகரியா" },
  39: { en: "Malachi", ta: "மல்கியா" },
  40: { en: "Matthew", ta: "மத்தேயு" },
  41: { en: "Mark", ta: "மாற்கு" },
  42: { en: "Luke", ta: "லூக்கா" },
  43: { en: "John", ta: "யோவான்" },
  44: { en: "Acts", ta: "அப்போஸ்தலர்" },
  45: { en: "Romans", ta: "ரோமர்" },
  46: { en: "1 Corinthians", ta: "1 கொரிந்தியர்" },
  47: { en: "2 Corinthians", ta: "2 கொரிந்தியர்" },
  48: { en: "Galatians", ta: "கலாத்தியர்" },
  49: { en: "Ephesians", ta: "எபேசியர்" },
  50: { en: "Philippians", ta: "பிலிப்பியர்" },
  51: { en: "Colossians", ta: "கொலோசெயர்" },
  52: { en: "1 Thessalonians", ta: "1 தெசலோனிக்கேயர்" },
  53: { en: "2 Thessalonians", ta: "2 தெசலோனிக்கேயர்" },
  54: { en: "1 Timothy", ta: "1 தீமோத்தேயு" },
  55: { en: "2 Timothy", ta: "2 தீமோத்தேயு" },
  56: { en: "Titus", ta: "தீத்து" },
  57: { en: "Philemon", ta: "பிலேமோன்" },
  58: { en: "Hebrews", ta: "எபிரெயர்" },
  59: { en: "James", ta: "யாக்கோபு" },
  60: { en: "1 Peter", ta: "1 பேதுரு" },
  61: { en: "2 Peter", ta: "2 பேதுரு" },
  62: { en: "1 John", ta: "1 யோவான்" },
  63: { en: "2 John", ta: "2 யோவான்" },
  64: { en: "3 John", ta: "3 யோவான்" },
  65: { en: "Jude", ta: "யூதா" },
  66: { en: "Revelation", ta: "வெளிப்படுத்தின விசேஷம்" }
};

export function getBookName(bookId: any, language: "Tamil" | "English" = "English"): string {
  const numericId = parseInt(bookId, 10);
  if (!isNaN(numericId) && BIBLE_BOOKS_MAP[numericId]) {
    return language === "Tamil" ? BIBLE_BOOKS_MAP[numericId].ta : BIBLE_BOOKS_MAP[numericId].en;
  }
  return String(bookId);
}

// Strict Tamil/English Voice pools
const TAMIL_VOICES = [
  "ta-IN-ValluvarNeural",
  "ta-MY-KaniNeural",
  "ta-MY-SuryaNeural",
  "ta-SG-AnbuNeural",
  "ta-SG-VenbaNeural",
  "ta-LK-KumarNeural",
  "ta-LK-SaranyaNeural"
];

const ENGLISH_VOICES = [
  "en-US-AvaMultilingualNeural",
  "en-US-AndrewMultilingualNeural",
  "en-US-EmmaMultilingualNeural",
  "en-US-BrianMultilingualNeural",
  "en-US-JennyNeural",
  "en-US-GuyNeural",
  "en-GB-SoniaNeural",
  "en-GB-RyanNeural",
  "en-AU-NatashaNeural",
  "en-AU-WilliamNeural",
  "en-CA-ClaraNeural",
  "en-CA-LiamNeural"
];

const ALL_TEMPLATES = generateTemplates1000();

// Seeded deterministic pseudo-random generator
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export default function App() {
  // --------------------------------------------------------
  // WORKSPACE STATES
  // --------------------------------------------------------
  const [isInWorkspace, setIsInWorkspace] = useState(false);
  
  // Database States
  const [dbFile, setDbFile] = useState<File | null>(null);
  const [dbMetadata, setDbMetadata] = useState<BibleDatabaseInfo | null>(null);
  const [activeDbName, setActiveDbName] = useState("");
  const [books, setBooks] = useState<number[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | "">("");
  const [chapters, setChapters] = useState<number[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | "">("");
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);
  
  // Font States
  const [fontFiles, setFontFiles] = useState<File[]>([]);
  const [uploadedFonts, setUploadedFonts] = useState<FontAsset[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>("system-ui");

  // Template Overrides & General States
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("9:16");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(ALL_TEMPLATES[0]);
  const [uniqueTemplatePerVerse, setUniqueTemplatePerVerse] = useState(true);
  const [uniqueVoicePerVerse, setUniqueVoicePerVerse] = useState(true);
  const [previewVerseIndex, setPreviewVerseIndex] = useState<number>(0);
  
  // Audio / Preview States
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(8); // default fallback
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Watermark Advanced States
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("BIBLE VERSE STUDIO");
  const [watermarkPosition169, setWatermarkPosition169] = useState<"Top-Left" | "Top-Right" | "Bottom-Left" | "Bottom-Right" | "Center">("Bottom-Right");
  const [watermarkPosition916, setWatermarkPosition916] = useState<"Top-Left" | "Top-Right" | "Bottom-Left" | "Bottom-Right" | "Center">("Bottom-Right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);
  const [watermarkScale, setWatermarkScale] = useState(16);
  const [watermarkMargin, setWatermarkMargin] = useState(25);
  const [watermarkAnimation, setWatermarkAnimation] = useState<"Static" | "Pulsing" | "Scrolling">("Static");

  // Export Settings
  const [videoCodec, setVideoCodec] = useState("libx264");
  const [audioCodec, setAudioCodec] = useState("aac");
  const [bitrate, setBitrate] = useState("2000k");
  const [fps, setFps] = useState(15);
  const [overwriteBehaviour, setOverwriteBehaviour] = useState(true);
  const [filenameFormat, setFilenameFormat] = useState("{Book}_{Chapter}_{Verse}.mp4");

  // Intro / Outro States
  const [introEnabled, setIntroEnabled] = useState(false);
  const [outroEnabled, setOutroEnabled] = useState(false);
  const [introFile169, setIntroFile169] = useState<string | null>(null);
  const [introFile916, setIntroFile916] = useState<string | null>(null);
  const [outroFile169, setOutroFile169] = useState<string | null>(null);
  const [outroFile916, setOutroFile916] = useState<string | null>(null);

  // Queue and Render States
  const [renderQueue, setRenderQueue] = useState<RenderTask[]>([]);
  const [completedExports, setCompletedExports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "queue" | "exports" | "templates">("preview");
  const [logs, setLogs] = useState<string[]>([]);

  // Testing voice states
  const [testingText, setTestingText] = useState("");
  const [testingVoice, setTestingVoice] = useState(TAMIL_VOICES[0]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testedAudioUrl, setTestedAudioUrl] = useState<string | null>(null);

  // Status check variables
  const [initStatus, setInitStatus] = useState({
    db: false,
    fonts: false,
    templateEngine: true,
    tts: true,
    ffmpeg: true
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCurrentlyGeneratingRef = useRef<boolean>(false);
  const playStartTimeRef = useRef<number>(0);

  // Fetch initial info on load
  useEffect(() => {
    checkBackendInfo();
    loadFontsList();
    loadIntroOutroInfo();
    loadCompletedVideos();
    
    // Auto load saved project if available
    handleLoadProjectSilently();

    // Poll render queue every 2 seconds
    const interval = setInterval(() => {
      fetchRenderQueue();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update canvas preview immediately when rendering properties change
  useEffect(() => {
    if (isInWorkspace && verses.length > 0) {
      if (!isPlaying) {
        drawCanvasPreview(previewTime);
      }
    }
  }, [
    isInWorkspace, 
    previewVerseIndex, 
    selectedTemplate, 
    aspectRatio, 
    verses, 
    watermarkEnabled, 
    watermarkText, 
    watermarkOpacity, 
    watermarkPosition169, 
    watermarkPosition916, 
    watermarkScale, 
    watermarkMargin, 
    watermarkAnimation,
    previewTime,
    uploadedFonts
  ]);

  // Handle preview animation loop when playing
  useEffect(() => {
    if (isPlaying) {
      playStartTimeRef.current = performance.now() - (previewTime * 1000);
      const loop = () => {
        const elapsed = (performance.now() - playStartTimeRef.current) / 1000;
        if (elapsed >= audioDuration) {
          setIsPlaying(false);
          setPreviewTime(0);
          drawCanvasPreview(0);
        } else {
          setPreviewTime(elapsed);
          drawCanvasPreview(elapsed);
          animationFrameRef.current = requestAnimationFrame(loop);
        }
      };
      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, audioDuration]);

  // Audio element listeners
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      const handleEnded = () => {
        setIsPlaying(false);
        setPreviewTime(0);
      };
      audioRef.current.addEventListener("ended", handleEnded);
      return () => {
        audioRef.current?.removeEventListener("ended", handleEnded);
      };
    }
  }, [audioUrl]);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 99)]);
  };

  // --------------------------------------------------------
  // API SERVICE CALLS
  // --------------------------------------------------------
  const checkBackendInfo = async () => {
    try {
      const res = await fetch("/api/database/info");
      const data = await res.json();
      if (data.ready) {
        setDbMetadata(data.metadata);
        setInitStatus(prev => ({ ...prev, db: true }));
        loadBooks(data.metadata);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFontsList = async () => {
    try {
      const res = await fetch("/api/fonts");
      const data = await res.json();
      if (data.fonts) {
        setUploadedFonts(data.fonts);
        setInitStatus(prev => ({ ...prev, fonts: true }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadIntroOutroInfo = async () => {
    try {
      const res = await fetch("/api/intro-outro/info");
      const data = await res.json();
      if (data) {
        setIntroFile169(data.intro_16_9);
        setIntroFile916(data.intro_9_16);
        setOutroFile169(data.outro_16_9);
        setOutroFile916(data.outro_9_16);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCompletedVideos = async () => {
    try {
      const res = await fetch("/api/video/completed");
      const data = await res.json();
      if (data.completed) {
        setCompletedExports(data.completed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRenderQueue = async () => {
    try {
      const res = await fetch("/api/video/queue");
      const data = await res.json();
      if (data.queue) {
        setRenderQueue(data.queue);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------------
  // DATABASE ACTIONS
  // --------------------------------------------------------
  const handleDbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDbFile(file);
    addLog(`Uploading database file: ${file.name}...`);

    const formData = new FormData();
    formData.append("database", file);

    try {
      const res = await fetch("/api/database/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.metadata) {
        setDbMetadata(data.metadata);
        setActiveDbName(file.name);
        setInitStatus(prev => ({ ...prev, db: true }));
        setSuccessMessage("Database validated and initialized successfully!");
        addLog(`Database upload successful: ${data.metadata.name} (${data.metadata.language})`);
        loadBooks(data.metadata);
      } else {
        setErrorMessage(data.error || "Database upload validation failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const loadBooks = async (meta: BibleDatabaseInfo) => {
    try {
      const res = await fetch("/api/database/books");
      const data = await res.json();
      if (data.books) {
        setBooks(data.books);
        if (data.books.length > 0) {
          setSelectedBook(data.books[0]);
          loadChapters(data.books[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadChapters = async (bookId: number) => {
    try {
      const res = await fetch(`/api/database/chapters?book=${bookId}`);
      const data = await res.json();
      if (data.chapters) {
        setChapters(data.chapters);
        if (data.chapters.length > 0) {
          setSelectedChapter(data.chapters[0]);
          loadVerses(bookId, data.chapters[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadVerses = async (bookId: number, chapterId: number) => {
    try {
      const res = await fetch(`/api/database/verses?book=${bookId}&chapter=${chapterId}`);
      const data = await res.json();
      if (data.verses) {
        // Map templates, voices, and fonts per verse sequentially to ensure variety
        const formatted = data.verses.map((v: any, index: number) => {
          const isTamil = dbMetadata?.language === "Tamil";
          const voicesPool = isTamil ? TAMIL_VOICES : ENGLISH_VOICES;
          const assignedVoice = voicesPool[index % voicesPool.length];
          const assignedTemplate = ALL_TEMPLATES[index % ALL_TEMPLATES.length];
          const assignedFont = uploadedFonts.length > 0 ? uploadedFonts[index % uploadedFonts.length].family : "system-ui";

          return {
            ...v,
            voiceName: assignedVoice,
            templateId: assignedTemplate.id,
            fontFamily: assignedFont,
            status: "Waiting",
          };
        });
        setVerses(formatted);
        setPreviewVerseIndex(0);
        // Reset selected verse counts
        setSelectedVerseIds(formatted.map((v: any) => v.versecount));
        
        // Auto-load TTS audio for first verse if available
        if (formatted[0]) {
          setAudioUrl(null);
          setPreviewTime(0);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------------
  // FONT ACTIONS
  // --------------------------------------------------------
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("fonts", files[i]);
    }

    addLog(`Uploading ${files.length} custom vector fonts...`);
    try {
      const res = await fetch("/api/fonts/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        loadFontsList();
        setSuccessMessage("Vector fonts parsed and indexed successfully.");
        addLog("Typography pool refreshed.");
      } else {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleToggleFont = async (filename: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/fonts/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, enabled }),
      });
      if (res.ok) {
        loadFontsList();
        addLog(`Typography file status updated: ${filename}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------------
  // AUDIO GENERATOR & TESTING
  // --------------------------------------------------------
  const handleGenerateTTS = async (index: number) => {
    const currentVerse = verses[index];
    if (!currentVerse) return;

    setIsLoadingAudio(true);
    addLog(`Initiating Edge TTS neural audio synthesis for verse ${currentVerse.versecount}...`);

    try {
      const isTamil = dbMetadata?.language === "Tamil";
      const voiceToUse = uniqueVoicePerVerse ? currentVerse.voiceName : (isTamil ? TAMIL_VOICES[0] : ENGLISH_VOICES[0]);
      
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentVerse.verse,
          voice: voiceToUse,
          verseKey: `v_${selectedBook}_${selectedChapter}_${currentVerse.versecount}`
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAudioUrl(data.audioUrl);
        setAudioDuration(data.duration);
        
        // Update verse info
        const updatedVerses = [...verses];
        updatedVerses[index] = {
          ...currentVerse,
          audioUrl: data.audioUrl,
          audioDuration: data.duration,
          status: "Ready"
        };
        setVerses(updatedVerses);
        addLog(`Speech synthesis ready. Verified Duration: ${data.duration} seconds.`);
        
        // Load audio player
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.load();
        }
      } else {
        setErrorMessage(data.error || "Edge TTS service failed to respond.");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleTestVoice = async () => {
    if (!testingText.trim()) {
      setErrorMessage("Please enter custom text for speech testing.");
      return;
    }
    setIsTestingVoice(true);
    setTestedAudioUrl(null);
    addLog(`Synthesizing voice test with voice: ${testingVoice}...`);
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: testingText,
          voice: testingVoice,
          verseKey: "testing_voice"
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestedAudioUrl(data.audioUrl);
        addLog(`Voice test synthesis completed. Duration: ${data.duration.toFixed(1)}s`);
        const snd = new Audio(data.audioUrl);
        snd.play();
      } else {
        setErrorMessage(data.error || "Voice testing failed.");
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setIsTestingVoice(false);
    }
  };

  // --------------------------------------------------------
  // ANIMATION DRAWING PIPELINE (PREVIEW & SERVER MIRROR)
  // --------------------------------------------------------
  const drawCanvasFrame = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    t: number, 
    duration: number, 
    verse: Verse, 
    template: TemplateConfig
  ) => {
    const bgStyle = BACKGROUNDS.find(b => b.id === template.backgroundId) || BACKGROUNDS[0];
    const txtStyle = TEXT_STYLES.find(t => t.id === template.textStyleId) || TEXT_STYLES[0];
    const frameStyle = FRAME_STYLES.find(f => f.id === template.frameStyleId) || FRAME_STYLES[0];
    const particlesType = template.particles || "Dust";

    // 1. Draw animated background based on t
    const grad = ctx.createLinearGradient(
      Math.sin(t * 0.15) * 100, 
      Math.cos(t * 0.15) * 100, 
      width + Math.cos(t * 0.1) * 100, 
      height + Math.sin(t * 0.1) * 100
    );

    if (bgStyle.id === "bg-galaxy") {
      grad.addColorStop(0, "#0a0116");
      grad.addColorStop(0.5 + Math.sin(t * 0.4) * 0.1, "#030009");
      grad.addColorStop(1, "#19002c");
    } else if (bgStyle.id === "bg-stars") {
      grad.addColorStop(0, "#081320");
      grad.addColorStop(1, "#00050d");
    } else if (bgStyle.id === "bg-cross" || bgStyle.id === "bg-church") {
      grad.addColorStop(0, "#250a10");
      grad.addColorStop(1, "#040101");
    } else if (bgStyle.id === "bg-parchment") {
      grad.addColorStop(0, "#2a1e15");
      grad.addColorStop(1, "#140e09");
    } else {
      // Default modern twilight
      grad.addColorStop(0, "#070709");
      grad.addColorStop(1, "#250612");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw animated particles (Procedurally deterministic based on verse count & seed)
    const densityMap = { Low: 25, Medium: 60, High: 120, Ultra: 200 };
    const pCount = densityMap[template.particlesDensity as "Low" | "Medium" | "High" | "Ultra"] || 60;
    
    ctx.shadowBlur = 0; // reset shadows
    for (let i = 0; i < pCount; i++) {
      const seed = i + (verse.versecount * 7) + 12.3;
      const rx = seededRandom(seed) * width;
      const ry = seededRandom(seed + 1) * height;
      const speedX = (seededRandom(seed + 2) - 0.5) * 1.5;
      const speedY = (seededRandom(seed + 3) + 0.3) * 1.2;
      const size = seededRandom(seed + 4) * 4 + 1.2;
      const pAlpha = seededRandom(seed + 5) * 0.6 + 0.25;

      const px = (rx + speedX * t * 30) % width;
      let py = (ry - speedY * t * 30) % height;
      if (py < 0) py += height;

      if (particlesType === "Stars") {
        const tw = pAlpha * (0.3 + 0.7 * Math.sin(t * 3 + seed));
        ctx.fillStyle = `rgba(255, 255, 255, ${tw})`;
      } else if (particlesType === "Golden Particles") {
        const glow = pAlpha * (0.4 + 0.6 * Math.sin(t * 2 + seed));
        ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
      } else if (particlesType === "Fire Particles") {
        const flicker = pAlpha * (0.5 + 0.5 * Math.sin(t * 6 + seed));
        ctx.fillStyle = `rgba(${230 + seededRandom(seed) * 25}, ${110 + seededRandom(seed+1) * 90}, 15, ${flicker})`;
      } else if (particlesType === "Snow") {
        const snowY = (ry + speedY * t * 20) % height;
        ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(px, snowY, size * 1.3, 0, Math.PI * 2);
        ctx.fill();
        continue;
      } else {
        // Soft amber dust
        ctx.fillStyle = `rgba(215, 175, 125, ${pAlpha * (0.7 + 0.3 * Math.sin(t + seed))})`;
      }

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw safe frame bounds with glowing lines
    const margin = 50;
    const padding = 28;
    const borderRad = parseInt(frameStyle.borderRadius || "8") || 8;

    if (frameStyle.id !== "frame-none") {
      ctx.save();
      ctx.strokeStyle = frameStyle.borderColor || "#ffffff";
      ctx.lineWidth = frameStyle.id === "frame-double" ? 3 : 1.5;
      
      // Handle glowing frame pulsing based on t
      if (frameStyle.glow) {
        ctx.shadowColor = frameStyle.borderColor;
        ctx.shadowBlur = 10 + Math.sin(t * 4.0) * 5;
      }

      // Rounded path rendering for clean borders
      ctx.beginPath();
      ctx.roundRect(margin, margin, width - margin * 2, height - margin * 2, borderRad);
      ctx.stroke();

      if (frameStyle.id === "frame-double") {
        ctx.beginPath();
        ctx.roundRect(margin + 6, margin + 6, width - (margin + 6) * 2, height - (margin + 6) * 2, Math.max(0, borderRad - 6));
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Draw Advanced Watermark (Support separate positioning/margins/sizes/pulsing)
    if (watermarkEnabled) {
      ctx.save();
      const wPos = aspectRatio === "16:9" ? watermarkPosition169 : watermarkPosition916;
      const wSize = watermarkScale;
      const wMargin = watermarkMargin + margin;

      let wx = width / 2;
      let wy = height - wMargin;
      let textAlign: CanvasTextAlign = "center";

      if (wPos === "Top-Left") {
        wx = wMargin;
        wy = wMargin + 10;
        textAlign = "left";
      } else if (wPos === "Top-Right") {
        wx = width - wMargin;
        wy = wMargin + 10;
        textAlign = "right";
      } else if (wPos === "Bottom-Left") {
        wx = wMargin;
        wy = height - wMargin;
        textAlign = "left";
      } else if (wPos === "Bottom-Right") {
        wx = width - wMargin;
        wy = height - wMargin;
        textAlign = "right";
      } else if (wPos === "Center") {
        wx = width / 2;
        wy = height / 2;
        textAlign = "center";
      }

      // Handle animated watermark pulsing/scrolling
      let animOpacity = watermarkOpacity;
      if (watermarkAnimation === "Pulsing") {
        animOpacity = watermarkOpacity * (0.6 + 0.4 * Math.sin(t * 2.5));
      }
      
      let finalWText = watermarkText;
      if (watermarkAnimation === "Scrolling") {
        const offset = Math.floor(t * 3) % (watermarkText.length + 5);
        finalWText = (watermarkText + "   " + watermarkText).substring(offset, offset + watermarkText.length);
      }

      ctx.fillStyle = `rgba(255, 255, 255, ${animOpacity})`;
      ctx.font = `italic 700 ${wSize}px system-ui, sans-serif`;
      ctx.textAlign = textAlign;
      ctx.fillText(finalWText, wx, wy);
      ctx.restore();
    }

    // 5. Calculate Animation Timings (With automatic compressing for short audio files)
    const inDur = Math.min(1.0, duration * 0.15);
    const outDur = Math.min(1.0, duration * 0.15);
    const inProgress = Math.min(1.0, t / inDur);
    const outProgress = t >= (duration - outDur) ? Math.max(0.0, (duration - t) / outDur) : 1.0;

    // Determine current global animation scalar state
    let opacity = 1.0;
    let textYOffset = 0;
    let scale = 1.0;
    let rotation = 0;
    let blurAmt = 0;

    // Apply text-in animation
    if (t < inDur) {
      const animIn = template.animationIn || "Blur Reveal";
      if (animIn === "Fade In") {
        opacity = inProgress;
      } else if (animIn === "Slide In") {
        opacity = inProgress;
        textYOffset = (1.0 - inProgress) * 40;
      } else if (animIn === "Zoom In") {
        opacity = inProgress;
        scale = 0.6 + 0.4 * inProgress;
      } else if (animIn === "Reveal" || animIn === "Wipe") {
        opacity = inProgress;
        textYOffset = (1.0 - inProgress) * 15;
      } else if (animIn === "Blur Reveal") {
        opacity = inProgress;
        blurAmt = (1.0 - inProgress) * 12;
      } else if (animIn === "Scale") {
        scale = inProgress;
      } else if (animIn === "Rotate") {
        rotation = (1.0 - inProgress) * 0.12;
        opacity = inProgress;
      }
    } 
    // Apply text-out animation
    else if (t >= (duration - outDur)) {
      const animOut = template.animationOut || "Fade Out";
      if (animOut === "Fade Out") {
        opacity = outProgress;
      } else if (animOut === "Slide Out") {
        opacity = outProgress;
        textYOffset = (1.0 - outProgress) * -40;
      } else if (animOut === "Zoom Out") {
        opacity = outProgress;
        scale = 1.0 + (1.0 - outProgress) * 0.3;
      } else if (animOut === "Blur" || animOut === "Dissolve") {
        opacity = outProgress;
        blurAmt = (1.0 - outProgress) * 15;
      } else if (animOut === "Glitch Out") {
        opacity = outProgress;
        textYOffset = (Math.random() - 0.5) * 12;
      } else if (animOut === "Light Fade") {
        opacity = outProgress * 0.8;
      }
    }

    // Apply text-loop / hold animations when active
    if (t >= inDur && t < (duration - outDur)) {
      const animHold = template.animationHold || "Floating";
      if (animHold === "Floating") {
        textYOffset = Math.sin(t * 2.2) * 6;
      } else if (animHold === "Breathing") {
        scale = 1.0 + Math.sin(t * 1.5) * 0.025;
      } else if (animHold === "Slow Zoom") {
        scale = 1.0 + (t / duration) * 0.06;
      } else if (animHold === "Particle Motion") {
        textYOffset = Math.sin(t * 15) * 1.5;
      }
    }

    // 6. Draw Bible Verse Reference Header
    ctx.save();
    const resolvedBookName = getBookName(selectedBook, dbMetadata?.language);
    const refText = `${resolvedBookName} ${selectedChapter}:${verse.versecount}`;
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.85})`;
    
    // Check if family has changed or fallback
    const familyToUse = verse.fontFamily || selectedFont || "system-ui";
    ctx.font = `italic 700 24px "${familyToUse}", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(refText, width / 2, margin + padding + 20);
    ctx.restore();

    // 7. Auto-scaling, auto-wrapping Multi-line Verse Text
    ctx.save();
    
    const maxTextWidth = width - (margin * 2 + padding * 2 + 40);
    const maxTextHeight = height - (margin * 2 + padding * 2 + 180);
    
    const fontWeight = txtStyle.fontWeight || "600";
    const fontStyle = txtStyle.fontStyle || "normal";
    
    let fontSize = 38;
    let lines: string[] = [];
    let totalHeight = 0;
    
    // Dynamic text wrap shrink calculator to prevent frame clipping
    while (fontSize > 15) {
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${familyToUse}", sans-serif`;
      const words = verse.verse.split(" ");
      lines = [];
      let currentLine = "";

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && n > 0) {
          lines.push(currentLine.trim());
          currentLine = words[n] + " ";
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine.trim());

      const lineHeight = fontSize * 1.45;
      totalHeight = lines.length * lineHeight;

      if (totalHeight <= maxTextHeight) {
        break;
      }
      fontSize -= 2;
    }

    // Multi-line vertical rendering
    const lineHeight = fontSize * 1.45;
    const startY = (height / 2) - (totalHeight / 2) + (lineHeight / 2) + textYOffset;

    // Apply coordinate transformations for scale and rotation
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.rotate(rotation);
    ctx.translate(-width / 2, -height / 2);

    // Filter effect for blur
    if (blurAmt > 0 && typeof ctx.filter === "string") {
      ctx.filter = `blur(${blurAmt}px)`;
    }

    lines.forEach((lineText, i) => {
      const y = startY + (i * lineHeight);
      
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${familyToUse}", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Setup shadows/glows from txtStyle properties
      if (txtStyle.glow) {
        ctx.shadowColor = txtStyle.color;
        ctx.shadowBlur = 12 + Math.sin(t * 3.5) * 4;
      } else if (txtStyle.shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.95)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      } else {
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = txtStyle.color || "#ffffff";
      ctx.fillText(lineText, width / 2, y);
    });

    ctx.restore();
  };

  const drawCanvasPreview = (t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = aspectRatio === "16:9" ? 1280 : 720;
    const height = aspectRatio === "16:9" ? 720 : 1280;
    canvas.width = width;
    canvas.height = height;

    const currentVerse = verses[previewVerseIndex];
    if (!currentVerse) return;

    const templateToUse = uniqueTemplatePerVerse 
      ? (ALL_TEMPLATES.find(temp => temp.id === currentVerse.templateId) || selectedTemplate)
      : selectedTemplate;

    drawCanvasFrame(ctx, width, height, t, audioDuration, currentVerse, templateToUse);
  };

  const togglePlay = () => {
    if (!audioUrl) {
      handleGenerateTTS(previewVerseIndex).then(() => {
        setIsPlaying(true);
      });
      return;
    }

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = previewTime;
        audioRef.current.play().catch(e => console.error("Audio play blocked", e));
      }
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setPreviewTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    drawCanvasPreview(0);
  };

  // --------------------------------------------------------
  // PROJECT LOAD/SAVE IMPLEMENTATION
  // --------------------------------------------------------
  const handleSaveProject = async () => {
    addLog("Packaging state and exporting project package...");
    const projectConfig = {
      activeDbName,
      dbMetadata,
      selectedBook,
      selectedChapter,
      selectedVerseIds,
      verses,
      aspectRatio,
      selectedTemplateId: selectedTemplate.id,
      uniqueTemplatePerVerse,
      uniqueVoicePerVerse,
      watermarkEnabled,
      watermarkText,
      watermarkPosition169,
      watermarkPosition916,
      watermarkOpacity,
      watermarkScale,
      watermarkMargin,
      watermarkAnimation,
      videoCodec,
      audioCodec,
      bitrate,
      fps,
      overwriteBehaviour,
      filenameFormat,
      introEnabled,
      outroEnabled,
      savedAt: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/project/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectConfig),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Project state saved to server file successfully!");
        addLog("Project database and customization models updated on disk.");
      }
    } catch (e: any) {
      setErrorMessage("Save failed: " + e.message);
    }
  };

  const handleLoadProjectSilently = async () => {
    try {
      const res = await fetch("/api/project/load");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.config) {
        const c = data.config;
        if (c.activeDbName) setActiveDbName(c.activeDbName);
        if (c.dbMetadata) setDbMetadata(c.dbMetadata);
        if (c.selectedBook) setSelectedBook(c.selectedBook);
        if (c.selectedChapter) setSelectedChapter(c.selectedChapter);
        if (c.selectedVerseIds) setSelectedVerseIds(c.selectedVerseIds);
        if (c.verses) setVerses(c.verses);
        if (c.aspectRatio) setAspectRatio(c.aspectRatio);
        if (c.selectedTemplateId) {
          const matched = ALL_TEMPLATES.find(t => t.id === c.selectedTemplateId);
          if (matched) setSelectedTemplate(matched);
        }
        if (c.uniqueTemplatePerVerse !== undefined) setUniqueTemplatePerVerse(c.uniqueTemplatePerVerse);
        if (c.uniqueVoicePerVerse !== undefined) setUniqueVoicePerVerse(c.uniqueVoicePerVerse);
        if (c.watermarkEnabled !== undefined) setWatermarkEnabled(c.watermarkEnabled);
        if (c.watermarkText !== undefined) setWatermarkText(c.watermarkText);
        if (c.watermarkPosition169) setWatermarkPosition169(c.watermarkPosition169);
        if (c.watermarkPosition916) setWatermarkPosition916(c.watermarkPosition916);
        if (c.watermarkOpacity !== undefined) setWatermarkOpacity(c.watermarkOpacity);
        if (c.watermarkScale !== undefined) setWatermarkScale(c.watermarkScale);
        if (c.watermarkMargin !== undefined) setWatermarkMargin(c.watermarkMargin);
        if (c.watermarkAnimation) setWatermarkAnimation(c.watermarkAnimation);
        if (c.videoCodec) setVideoCodec(c.videoCodec);
        if (c.audioCodec) setAudioCodec(c.audioCodec);
        if (c.bitrate) setBitrate(c.bitrate);
        if (c.fps) setFps(c.fps);
        if (c.overwriteBehaviour !== undefined) setOverwriteBehaviour(c.overwriteBehaviour);
        if (c.filenameFormat) setFilenameFormat(c.filenameFormat);
        if (c.introEnabled !== undefined) setIntroEnabled(c.introEnabled);
        if (c.outroEnabled !== undefined) setOutroEnabled(c.outroEnabled);
        addLog("Loaded existing workspace layout from persistent storage.");
      }
    } catch (e) {
      console.error("Silent config load failed", e);
    }
  };

  const handleLoadProjectButton = async () => {
    addLog("Loading persistent project layout...");
    try {
      const res = await fetch("/api/project/load");
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("Workspace loaded successfully.");
        handleLoadProjectSilently();
      } else {
        setErrorMessage("No saved project found on server disk.");
      }
    } catch (e: any) {
      setErrorMessage("Load failed: " + e.message);
    }
  };

  // --------------------------------------------------------
  // ADVANCED COV-STITCH INTRO/OUTRO UPLOADERS
  // --------------------------------------------------------
  const handleIntroUpload169 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("intro_16_9", file);
    try {
      const res = await fetch("/api/intro/upload_16_9", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setIntroFile169(data.url);
        addLog("Intro (16:9 Landscape) uploaded successfully.");
      }
    } catch (e: any) {
      setErrorMessage("Intro upload failed: " + e.message);
    }
  };

  const handleIntroUpload916 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("intro_9_16", file);
    try {
      const res = await fetch("/api/intro/upload_9_16", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setIntroFile916(data.url);
        addLog("Intro (9:16 Portrait) uploaded successfully.");
      }
    } catch (e: any) {
      setErrorMessage("Intro upload failed: " + e.message);
    }
  };

  const handleOutroUpload169 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("outro_16_9", file);
    try {
      const res = await fetch("/api/outro/upload_16_9", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setOutroFile169(data.url);
        addLog("Outro (16:9 Landscape) uploaded successfully.");
      }
    } catch (e: any) {
      setErrorMessage("Outro upload failed: " + e.message);
    }
  };

  const handleOutroUpload916 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("outro_9_16", file);
    try {
      const res = await fetch("/api/outro/upload_9_16", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setOutroFile916(data.url);
        addLog("Outro (9:16 Portrait) uploaded successfully.");
      }
    } catch (e: any) {
      setErrorMessage("Outro upload failed: " + e.message);
    }
  };

  const clearIntroOutro = async () => {
    try {
      await fetch("/api/intro-outro/clear", { method: "DELETE" });
      setIntroFile169(null);
      setIntroFile916(null);
      setOutroFile169(null);
      setOutroFile916(null);
      addLog("All introductory and concluding stitch-ready mp4 files cleared.");
    } catch (e: any) {
      console.error(e);
    }
  };

  // --------------------------------------------------------
  // QUEUE CONTROLS (PAUSE/RESUME/CANCEL/RETRY)
  // --------------------------------------------------------
  const handlePauseTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/video/queue/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        fetchRenderQueue();
        addLog(`Task paused: ${taskId.substring(0, 8)}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResumeTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/video/queue/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        fetchRenderQueue();
        addLog(`Task resumed in wait state: ${taskId.substring(0, 8)}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/video/queue/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        fetchRenderQueue();
        addLog(`Task cancelled and cleaned: ${taskId.substring(0, 8)}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/video/queue/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) {
        fetchRenderQueue();
        addLog(`Task queued for retry execution: ${taskId.substring(0, 8)}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------------
  // ANIMATED BATCH EXPORT PIPELINE
  // --------------------------------------------------------
  const renderAndUploadSingleVerse = async (index: number) => {
    const verse = verses[index];
    if (!verse) return;

    const resolvedBookName = getBookName(selectedBook, dbMetadata?.language);
    
    // 1. Ensure TTS Audio is generated first
    let finalAudioUrl = verse.audioUrl;
    let duration = verse.audioDuration || 8;
    
    if (!finalAudioUrl) {
      addLog(`Verse ${verse.versecount} lacks synthesized audio. Triggering TTS now...`);
      const isTamil = dbMetadata?.language === "Tamil";
      const voiceToUse = uniqueVoicePerVerse ? verse.voiceName : (isTamil ? TAMIL_VOICES[0] : ENGLISH_VOICES[0]);

      try {
        const res = await fetch("/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: verse.verse,
            voice: voiceToUse,
            verseKey: `v_${selectedBook}_${selectedChapter}_${verse.versecount}`
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          finalAudioUrl = data.audioUrl;
          duration = data.duration;
          
          const updated = [...verses];
          updated[index] = { ...verse, audioUrl: data.audioUrl, audioDuration: data.duration, status: "Ready" };
          setVerses(updated);
        } else {
          throw new Error(data.error || "Speech synthesis failed during export loop.");
        }
      } catch (err: any) {
        addLog(`[Error] Verse ${verse.versecount} TTS synthesis failed: ${err.message}`);
        return;
      }
    }

    // Format output filename templates
    const formattedFilename = filenameFormat
      .replace(/{Book}/g, resolvedBookName.replace(/\s+/g, ""))
      .replace(/{Chapter}/g, String(selectedChapter))
      .replace(/{Verse}/g, String(verse.versecount));

    // 2. Call initiate render on the server
    addLog(`Initiating render task for verse ${verse.versecount}...`);
    let taskId = "";
    try {
      const res = await fetch("/api/video/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book: resolvedBookName,
          chapter: selectedChapter,
          versecount: verse.versecount,
          filename: formattedFilename,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        taskId = data.taskId;
        addLog(`Task initialized on server. TaskID: ${taskId.substring(0, 8)}`);
      } else {
        throw new Error(data.error || "Render initiate failed.");
      }
    } catch (err: any) {
      addLog(`[Error] Verse ${verse.versecount} initiate failed: ${err.message}`);
      return;
    }

    // 3. Render and upload frames sequentially on a separate off-screen layout canvas
    const width = aspectRatio === "16:9" ? 1280 : 720;
    const height = aspectRatio === "16:9" ? 720 : 1280;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext("2d");

    if (!exportCtx) {
      addLog(`[Error] Failed to initialize 2D render context on offscreen canvas.`);
      return;
    }

    const totalFrames = Math.ceil(duration * fps);
    addLog(`Beginning high-precision render. Total frames: ${totalFrames} at ${fps} FPS.`);

    const templateToUse = uniqueTemplatePerVerse 
      ? (ALL_TEMPLATES.find(temp => temp.id === verse.templateId) || selectedTemplate)
      : selectedTemplate;

    // We upload frames in chunks of 15 to avoid massive single payloads
    const chunkSize = 15;
    for (let f = 0; f < totalFrames; f += chunkSize) {
      // Check if paused or cancelled by fetching latest server state
      const checkRes = await fetch("/api/video/queue");
      const checkData = await checkRes.json();
      const currentTask = checkData.queue?.find((t: any) => t.id === taskId);
      if (currentTask && currentTask.status === "Paused") {
        addLog(`Task ${taskId.substring(0, 8)} is PAUSED. Halting frame rendering...`);
        while (true) {
          await new Promise(r => setTimeout(r, 2000));
          const pCheck = await (await fetch("/api/video/queue")).json();
          const pTask = pCheck.queue?.find((t: any) => t.id === taskId);
          if (!pTask || pTask.status === "Cancelled") {
            addLog(`Task cancelled during pause.`);
            return;
          }
          if (pTask.status !== "Paused") {
            addLog(`Resuming frame rendering...`);
            break;
          }
        }
      }

      const endFrame = Math.min(totalFrames, f + chunkSize);
      const frameBuffer: string[] = [];

      for (let frameIndex = f; frameIndex < endFrame; frameIndex++) {
        const t = frameIndex / fps;
        // Clean canvas
        exportCtx.clearRect(0, 0, width, height);
        // Draw the complete animation properties
        drawCanvasFrame(exportCtx, width, height, t, duration, verse, templateToUse);
        
        // Grab base64 data
        const base64Jpg = exportCanvas.toDataURL("image/jpeg", 0.82);
        frameBuffer.push(base64Jpg);
      }

      // Upload frames chunk
      try {
        const uploadRes = await fetch("/api/video/upload_frames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            startIndex: f,
            frames: frameBuffer,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "Chunk upload failure");
        }
        
        // Update UI state progress
        const renderPercent = Math.round((endFrame / totalFrames) * 100);
        addLog(`Rendering Frame sequence: Uploaded ${endFrame}/${totalFrames} (${renderPercent}%)`);
        fetchRenderQueue();
      } catch (err: any) {
        addLog(`[Error] Frame upload chunk failed: ${err.message}`);
        // mark task failed on server
        return;
      }
    }

    // 4. Trigger FFmpeg video compilation and stitching
    addLog(`Initiating server-side H.264 video compilation...`);
    try {
      // Setup unique cache key consisting of variables to allow instant rendering reuses
      const cacheKey = `${verse.verse}_${templateToUse.id}_${aspectRatio}_${watermarkEnabled ? watermarkText + watermarkOpacity + watermarkScale + watermarkPosition169 + watermarkPosition916 : "no_watermark"}_${duration}`;

      const res = await fetch("/api/video/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          audioUrl: finalAudioUrl,
          introEnabled,
          outroEnabled,
          aspectRatio,
          fps,
          videoCodec,
          audioCodec,
          bitrate,
          overwrite: overwriteBehaviour,
          cacheKey
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`Compilation Complete for Verse ${verse.versecount}! Saved file.`);
        if (data.cached) {
          addLog("Served directly from high-speed render cache layer!");
        }
        fetchRenderQueue();
        loadCompletedVideos();
      } else {
        throw new Error(data.error || "FFmpeg compile failed.");
      }
    } catch (err: any) {
      addLog(`[Error] Verse ${verse.versecount} compilation failed: ${err.message}`);
    }
  };

  const handleSingleExport = async (index: number) => {
    if (isCurrentlyGeneratingRef.current) {
      setErrorMessage("Exporter is busy rendering a batch. Please wait.");
      return;
    }
    isCurrentlyGeneratingRef.current = true;
    setActiveTab("queue");
    await renderAndUploadSingleVerse(index);
    isCurrentlyGeneratingRef.current = false;
  };

  const handleBatchExport = async () => {
    if (selectedVerseIds.length === 0) {
      setErrorMessage("Please select at least one verse to trigger a batch export.");
      return;
    }
    if (isCurrentlyGeneratingRef.current) {
      setErrorMessage("Export batch is already running.");
      return;
    }

    isCurrentlyGeneratingRef.current = true;
    addLog(`Initiating batch export pipeline for ${selectedVerseIds.length} verses...`);
    setActiveTab("queue");

    for (let i = 0; i < verses.length; i++) {
      if (selectedVerseIds.includes(verses[i].versecount)) {
        addLog(`Processing verse ${verses[i].versecount} (${i + 1}/${verses.length})...`);
        try {
          await renderAndUploadSingleVerse(i);
        } catch (e: any) {
          addLog(`[Error] Failed processing verse index ${i}: ${e.message}`);
        }
      }
    }

    isCurrentlyGeneratingRef.current = false;
    setSuccessMessage("Completed all queued Bible video productions!");
    addLog("Batch execution complete.");
  };

  // Verses Helpers
  const selectAllVerses = () => {
    setSelectedVerseIds(verses.map((v) => v.versecount));
  };

  const selectNoneVerses = () => {
    setSelectedVerseIds([]);
  };

  const toggleVerseSelection = (id: number) => {
    if (selectedVerseIds.includes(id)) {
      setSelectedVerseIds(selectedVerseIds.filter((vId) => vId !== id));
    } else {
      setSelectedVerseIds([...selectedVerseIds, id]);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0a0a0c] text-zinc-300 flex overflow-hidden antialiased selection:bg-[#e03131]/30">
      
      {/* GLOBAL DYNAMIC STYLESHEET INJECTOR FOR CUSTOM FONTS */}
      <style dangerouslySetInnerHTML={{
        __html: uploadedFonts
          .filter(f => f.enabled)
          .map(f => `
            @font-face {
              font-family: '${f.family}';
              src: url('${f.url}') format('truetype');
              font-weight: ${f.weight || '400'};
              font-style: ${f.style || 'normal'};
            }
          `).join('\n')
      }} />

      {/* BACKGROUND GRAPHIC ACCENTS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-950/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-950/5 rounded-full blur-[120px] pointer-events-none translate-y-1/2 z-0" />

      {/* HTML5 AUDIO PLAYER SOURCE */}
      <audio ref={audioRef} />

      {/* INITIALIZATION / LANDING PORTAL SCREEN */}
      {!isInWorkspace ? (
        <div className="flex-1 flex flex-col justify-center items-center z-10 p-6">
          <div className="w-full max-w-lg bg-[#141419] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            
            {/* Visual Header Block */}
            <div className="text-center mb-8 relative z-10">
              <span className="bg-[#e03131]/10 text-[#e03131] text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                Enterprise Bible Suite
              </span>
              <h1 className="text-2xl font-black text-white mt-3 tracking-tight">V-STUDIO PIPELINE</h1>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                Compile cinematic, multi-template scripture animations with neural text-to-speech synchronization.
              </p>
            </div>

            {/* Error and success message overlays */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-950/30 border border-red-900 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2.5 mb-6"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-950/30 border border-green-900 text-green-400 text-xs p-3 rounded-xl flex items-center gap-2.5 mb-6"
                >
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step-by-Step System Activation checks */}
            <div className="space-y-4 mb-8">
              
              {/* SQLite database upload module */}
              <div className="bg-[#0b0b0e] border border-zinc-800 rounded-xl p-4 flex items-center justify-between transition hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${initStatus.db ? "bg-green-950/30 text-green-400" : "bg-zinc-900 text-zinc-500"}`}>
                    <Database size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Bible Database Reference</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {dbMetadata ? `${dbMetadata.name} (${dbMetadata.language})` : "Click to select and upload your SQLite DB"}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="file" 
                    accept=".db,.sqlite,.sqlite3" 
                    onChange={handleDbUpload}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    <Upload size={12} />
                    {dbMetadata ? "Replace" : "Upload"}
                  </button>
                </div>
              </div>

              {/* Typography Upload */}
              <div className="bg-[#0b0b0e] border border-zinc-800 rounded-xl p-4 flex items-center justify-between transition hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${uploadedFonts.length > 0 ? "bg-green-950/30 text-green-400" : "bg-zinc-900 text-zinc-500"}`}>
                    <Type size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Custom Vector Typography</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {uploadedFonts.length > 0 ? `${uploadedFonts.length} Custom Fonts parsed & ready` : "Upload OTF/TTF files"}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="file" 
                    multiple 
                    accept=".ttf,.otf" 
                    onChange={handleFontUpload}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    <Plus size={12} />
                    Upload
                  </button>
                </div>
              </div>

              {/* Rendering backend check (FFmpeg, TTS) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b0b0e] border border-zinc-800 p-3.5 rounded-xl flex items-center gap-2.5 font-mono text-[10px]">
                  <Check size={14} className="text-green-400" />
                  <div>
                    <span className="text-zinc-500 block">FFmpeg Engine</span>
                    <span className="text-white font-bold">ACTIVE (H.264)</span>
                  </div>
                </div>

                <div className="bg-[#0b0b0e] border border-zinc-800 p-3.5 rounded-xl flex items-center gap-2.5 font-mono text-[10px]">
                  <Check size={14} className="text-green-400" />
                  <div>
                    <span className="text-zinc-500 block">Edge TTS API</span>
                    <span className="text-white font-bold">ONLINE</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Launch Workspace CTA Button */}
            <div className="flex gap-3">
              <button 
                onClick={handleLoadProjectButton} 
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Restore Last State
              </button>

              <button 
                onClick={() => {
                  if (!dbMetadata) {
                    setErrorMessage("A valid Bible SQLite database must be loaded to initialize workspace.");
                    return;
                  }
                  setIsInWorkspace(true);
                  addLog("Active pipeline workspace booted.");
                }}
                className={`flex-1 font-bold py-2.5 px-4 rounded-xl text-xs transition ${
                  dbMetadata ? "bg-[#e03131] hover:bg-[#c22525] text-white shadow-lg" : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                }`}
              >
                Open Studio Workspace
              </button>
            </div>

            <p className="text-center text-[10px] text-zinc-600 mt-6 font-mono">
              Full-stack Pipeline active. Ready to render native H.264 high fidelity outputs.
            </p>

          </div>
        </div>
      ) : (
        
        // --------------------------------------------------------
        // ACTIVE WORKSPACE INTERFACE (THREE PANEL SYSTEM)
        // --------------------------------------------------------
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* TOP HEADER STATUS TOOLBAR */}
          <header className="h-14 bg-[#141419] border-b border-[#27272a] px-5 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <span className="bg-[#e03131] text-white text-[10px] font-black tracking-widest px-2 py-0.5 rounded-sm">V-STUDIO</span>
              <h2 className="text-sm font-bold text-white">Bible Verse Video Suite</h2>
              <span className="text-zinc-600">|</span>
              {dbMetadata && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Database size={12} className="text-[#e03131]" />
                  <span>{dbMetadata.name}</span>
                  <span className="bg-zinc-850 border border-zinc-800 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase text-[#e03131]">
                    {dbMetadata.language}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Layout & Project Save */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSaveProject} 
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs px-3 py-1.5 rounded-lg text-zinc-200 font-medium transition"
              >
                <Save size={14} />
                Save State
              </button>

              <div className="bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg flex">
                <button 
                  onClick={() => setAspectRatio("16:9")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${aspectRatio === "16:9" ? "bg-[#e03131] text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  16:9 Landscape
                </button>
                <button 
                  onClick={() => setAspectRatio("9:16")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${aspectRatio === "9:16" ? "bg-[#e03131] text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  9:16 Portrait
                </button>
              </div>

              <button 
                onClick={() => setIsInWorkspace(false)} 
                className="text-zinc-400 hover:text-white text-xs border border-zinc-800 hover:bg-zinc-900 px-3 py-1.5 rounded-lg transition"
              >
                Exit Workspace
              </button>
            </div>
          </header>

          {/* MAIN THREE PANEL SYSTEM */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* 1. LEFT SIDEBAR: BIBLE SELECTION & CUSTOM DATABASES */}
            <aside className="w-80 bg-[#141419] border-r border-[#27272a] flex flex-col justify-between overflow-y-auto shrink-0">
              
              <div className="p-4 space-y-5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                    <BookOpen size={14} className="text-[#e03131]" />
                    Book & Chapter Selection
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Book Name</label>
                      <select 
                        value={selectedBook} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedBook(val);
                          loadChapters(val);
                        }}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                      >
                        {books.map((b) => (
                          <option key={b} value={b}>{getBookName(b, dbMetadata?.language)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Chapter ID</label>
                      <select 
                        value={selectedChapter} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedChapter(val);
                          loadVerses(Number(selectedBook), val);
                        }}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                      >
                        {chapters.map((c) => (
                          <option key={c} value={c}>Chapter {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Advanced Database Validation Metrics Panel */}
                {dbMetadata && dbMetadata.validationReport && (
                  <div className="bg-zinc-900/40 border border-zinc-800 p-3.5 rounded-xl space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Sliders size={12} className="text-amber-500" />
                      DB Validation Report
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] text-zinc-500">
                      <div className="bg-[#0b0b0e] p-1.5 rounded">
                        <span className="block text-white font-bold">{dbMetadata.booksCount}</span>
                        Books
                      </div>
                      <div className="bg-[#0b0b0e] p-1.5 rounded">
                        <span className="block text-white font-bold">{dbMetadata.chaptersCount}</span>
                        Chaps
                      </div>
                      <div className="bg-[#0b0b0e] p-1.5 rounded">
                        <span className="block text-white font-bold">{dbMetadata.versesCount}</span>
                        Verses
                      </div>
                    </div>

                    {/* Duplicate detection summaries */}
                    <div className="text-[9px] space-y-1 bg-[#0b0b0e] p-2.5 rounded-lg border border-zinc-850">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Duplicate combinations:</span>
                        <span className={dbMetadata.validationReport.hasDuplicates ? "text-red-400 font-bold" : "text-green-400"}>
                          {dbMetadata.validationReport.duplicateBookChapterVerses.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Missing sequence gaps:</span>
                        <span className={dbMetadata.validationReport.hasMissing ? "text-amber-400 font-bold" : "text-green-400"}>
                          {dbMetadata.validationReport.missingSequentialVerses.length > 0 ? "YES" : "NONE"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verses Selection Checkboxes */}
                {verses.length > 0 && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] text-zinc-500 uppercase font-bold">Chapter Verses ({verses.length})</h4>
                      <div className="flex gap-2 text-[10px]">
                        <button onClick={selectAllVerses} className="text-[#e03131] hover:underline font-bold">All</button>
                        <span className="text-zinc-700">|</span>
                        <button onClick={selectNoneVerses} className="text-zinc-500 hover:underline font-bold">None</button>
                      </div>
                    </div>

                    {/* Verse Checkbox scroll list */}
                    <div className="bg-[#0b0b0e] border border-zinc-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                      {verses.map((v, idx) => (
                        <div 
                          key={`${v.versecount}-${idx}`} 
                          onClick={() => {
                            setPreviewVerseIndex(idx);
                            setAudioUrl(v.audioUrl || null);
                            setAudioDuration(v.audioDuration || 8);
                            setPreviewTime(0);
                          }}
                          className={`flex items-start gap-3 p-3 border-b border-zinc-900 cursor-pointer transition ${previewVerseIndex === idx ? "bg-zinc-900" : "hover:bg-zinc-900/50"}`}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedVerseIds.includes(v.versecount)}
                            onChange={() => toggleVerseSelection(v.versecount)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 accent-[#e03131]"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-white">Verse {v.versecount}</span>
                              {v.audioDuration && (
                                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-800 px-1 rounded">
                                  {v.audioDuration.toFixed(1)}s
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate leading-relaxed">{v.verse}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Console operation logs panel */}
              <div className="p-4 border-t border-[#27272a] bg-[#0b0b0e]">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Console Operations Logs</h4>
                <div className="h-28 overflow-y-auto font-mono text-[9px] text-zinc-500 space-y-1 scrollbar-thin text-left">
                  {logs.length > 0 ? (
                    logs.map((log, i) => <div key={i}>{log}</div>)
                  ) : (
                    <div className="text-zinc-700">No events generated yet.</div>
                  )}
                </div>
              </div>

            </aside>

            {/* 2. CENTER PANEL: ACTIVE CANVAS VIEWPORTS */}
            <main className="flex-1 bg-[#0b0b0d] flex flex-col overflow-hidden relative">
              
              {/* VIEWPORT NAV TABS */}
              <div className="h-12 border-b border-[#27272a] bg-[#141419] px-4 flex items-center justify-between shrink-0">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab("preview")}
                    className={`px-4 h-12 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${activeTab === "preview" ? "border-[#e03131] text-white" : "border-transparent text-zinc-400 hover:text-white"}`}
                  >
                    <Eye size={14} />
                    Live Canvas Preview
                  </button>
                  <button 
                    onClick={() => setActiveTab("templates")}
                    className={`px-4 h-12 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${activeTab === "templates" ? "border-[#e03131] text-white" : "border-transparent text-zinc-400 hover:text-white"}`}
                  >
                    <Layout size={14} />
                    1000+ Templates Library
                  </button>
                  <button 
                    onClick={() => setActiveTab("queue")}
                    className={`px-4 h-12 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${activeTab === "queue" ? "border-[#e03131] text-white" : "border-transparent text-zinc-400 hover:text-white"}`}
                  >
                    <Sliders size={14} />
                    Render Queue ({renderQueue.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab("exports")}
                    className={`px-4 h-12 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${activeTab === "exports" ? "border-[#e03131] text-white" : "border-transparent text-zinc-400 hover:text-white"}`}
                  >
                    <Film size={14} />
                    Exports Storage ({completedExports.length})
                  </button>
                </div>

                {verses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleGenerateTTS(previewVerseIndex)}
                      disabled={isLoadingAudio}
                      className="bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 px-3 py-1 rounded transition flex items-center gap-1"
                    >
                      <Volume2 size={12} className="text-[#e03131]" />
                      {isLoadingAudio ? "Synthesizing..." : "Force TTS Audio"}
                    </button>
                    <button 
                      onClick={() => handleSingleExport(previewVerseIndex)}
                      className="bg-[#e03131] hover:bg-[#c22525] text-[11px] font-bold text-white px-3 py-1 rounded transition"
                    >
                      Export Active
                    </button>
                  </div>
                )}
              </div>

              {/* VIEWPORT CONTROLLER */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center">
                
                {/* PREVIEW VIEWPORT PANEL */}
                {activeTab === "preview" && (
                  <div className="w-full h-full flex flex-col justify-between items-center max-w-2xl">
                    
                    {/* Centered Canvas Renderer Container */}
                    <div className="flex-1 flex items-center justify-center w-full min-h-[400px]">
                      <div 
                        className={`relative border border-zinc-800 bg-black overflow-hidden shadow-2xl transition-all duration-300 ${
                          aspectRatio === "16:9" ? "w-[560px] h-[315px]" : "w-[240px] h-[426px]"
                        }`}
                      >
                        {/* Native High Performance Canvas */}
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
                      </div>
                    </div>

                    {/* Timeline Controls */}
                    {verses.length > 0 && (
                      <div className="w-full bg-[#141419] border border-[#27272a] rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Verse Duration Timeline</span>
                          <span className="text-xs text-zinc-300 font-mono">
                            {previewTime.toFixed(1)}s / {audioDuration.toFixed(1)}s
                          </span>
                        </div>

                        {/* Slider Track */}
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden relative cursor-pointer" onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const newTime = percent * audioDuration;
                          setPreviewTime(newTime);
                          if (audioRef.current) {
                            audioRef.current.currentTime = newTime;
                          }
                          drawCanvasPreview(newTime);
                        }}>
                          <div 
                            className="bg-[#e03131] h-full"
                            style={{ width: `${(previewTime / audioDuration) * 100}%` }}
                          />
                        </div>

                        {/* Button controls strip */}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-3">
                            <button onClick={togglePlay} className="p-2 bg-[#e03131] hover:bg-[#c22525] rounded-full text-white transition">
                              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button onClick={handleRestart} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition">
                              <RefreshCcw size={16} />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-zinc-400 font-mono">
                              Template: <span className="text-white">
                                {uniqueTemplatePerVerse 
                                  ? (ALL_TEMPLATES.find(t => t.id === verses[previewVerseIndex]?.templateId)?.name || "Default") 
                                  : selectedTemplate.name}
                              </span>
                            </span>
                            <span className="text-zinc-700">|</span>
                            <span className="text-xs font-bold text-zinc-400 font-mono">
                              Voice: <span className="text-[#e03131]">
                                {uniqueVoicePerVerse ? (verses[previewVerseIndex]?.voiceName || "Default") : TAMIL_VOICES[0]}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 1000+ TEMPLATES BROWSER */}
                {activeTab === "templates" && (
                  <div className="w-full h-full flex flex-col text-left">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dynamic Template Registry (1000+ Unique Layouts)</h3>
                      <span className="text-xs text-zinc-500">Procedural variety seed active</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto max-h-[480px] pr-2">
                      {ALL_TEMPLATES.slice(0, 100).map((temp, idx) => (
                        <div 
                          key={`${temp.id}-${idx}`}
                          onClick={() => {
                            setSelectedTemplate(temp);
                            addLog(`Changed target layout configuration to template: ${temp.name}`);
                          }}
                          className={`bg-[#141419] border rounded-xl p-4 cursor-pointer transition flex flex-col justify-between h-36 ${
                            selectedTemplate.id === temp.id ? "border-[#e03131] bg-[#1a1314]" : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block mb-1">
                              {temp.category}
                            </span>
                            <h4 className="text-xs font-bold text-white line-clamp-1">{temp.name}</h4>
                          </div>

                          <div className="space-y-1.5 text-[9px] text-zinc-500 font-mono">
                            <div className="flex justify-between">
                              <span>Background</span>
                              <span className="text-zinc-400">{temp.backgroundId.replace("bg-", "")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Overlay Particles</span>
                              <span className="text-zinc-400">{temp.particles} ({temp.particlesDensity})</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Anims (In/Loop/Out)</span>
                              <span className="text-zinc-400 truncate max-w-[120px]">{temp.animationIn}/{temp.animationHold}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PERSISTENT RENDER QUEUE TABLE */}
                {activeTab === "queue" && (
                  <div className="w-full h-full flex flex-col text-left">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">FFmpeg Animated Live Render Queue</h3>
                      <button 
                        onClick={() => {
                          fetch("/api/video/clear", { method: "POST" });
                          setRenderQueue([]);
                          addLog("Render queue database cleared.");
                        }}
                        className="text-xs text-zinc-500 hover:text-white underline"
                      >
                        Clear All Tasks
                      </button>
                    </div>

                    <div className="bg-[#141419] border border-[#27272a] rounded-xl overflow-hidden flex-1 overflow-y-auto">
                      {renderQueue.length === 0 ? (
                        <div className="h-48 flex flex-col justify-center items-center text-zinc-500 gap-2">
                          <Clock size={24} />
                          <span className="text-xs font-semibold">Render queue is currently empty.</span>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0b0b0e] border-b border-zinc-800 text-zinc-500 uppercase text-[10px] font-black tracking-wider">
                            <tr>
                              <th className="p-4">Verse Reference</th>
                              <th className="p-4">Destination Target</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Progress Monitor</th>
                              <th className="p-4 text-center">Controls</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-mono">
                            {renderQueue.map((task, idx) => (
                              <tr key={`${task.id}-${idx}`} className="hover:bg-zinc-900/50">
                                <td className="p-4 font-bold text-zinc-300">
                                  {task.book} Ch {task.chapter}:{task.verse}
                                </td>
                                <td className="p-4 text-zinc-400 text-[10px]">{task.filename}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    task.status === "Completed" ? "bg-green-950/50 text-green-400" :
                                    task.status === "Failed" ? "bg-red-950/50 text-red-400" :
                                    task.status === "Paused" ? "bg-zinc-800 text-zinc-400" :
                                    "bg-amber-950/50 text-amber-400 animate-pulse"
                                  }`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-[#e03131] h-full transition-all duration-300"
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px]">{task.progress}%</span>
                                  </div>
                                </td>
                                <td className="p-4 text-center space-x-1.5">
                                  {task.status !== "Completed" && task.status !== "Failed" && (
                                    <>
                                      {task.status === "Paused" ? (
                                        <button 
                                          onClick={() => handleResumeTask(task.id)}
                                          className="bg-green-900/40 hover:bg-green-800/60 text-green-400 px-2 py-1 rounded text-[10px] font-bold"
                                        >
                                          Resume
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handlePauseTask(task.id)}
                                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-[10px] font-bold"
                                        >
                                          Pause
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleCancelTask(task.id)}
                                        className="bg-red-950/40 hover:bg-red-900/40 text-red-400 px-2 py-1 rounded text-[10px] font-bold"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {task.status === "Failed" && (
                                    <button 
                                      onClick={() => handleRetryTask(task.id)}
                                      className="bg-amber-900/40 hover:bg-amber-800/40 text-amber-400 px-2 py-1 rounded text-[10px] font-bold"
                                    >
                                      Retry
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* COMPLETED STORAGE VIEWPORT */}
                {activeTab === "exports" && (
                  <div className="w-full h-full flex flex-col text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Completed Productions Storage</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 flex-1">
                      {completedExports.length === 0 ? (
                        <div className="col-span-2 h-48 flex flex-col justify-center items-center text-zinc-500 gap-2">
                          <Film size={24} />
                          <span className="text-xs font-semibold">No exported video files generated yet.</span>
                        </div>
                      ) : (
                        completedExports.map((exp, idx) => (
                          <div key={`${exp.id}-${idx}`} className="bg-[#141419] border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-white max-w-[200px] truncate">{exp.filename}</h4>
                              <p className="text-[10px] text-zinc-500 font-mono mt-1">Exported on {new Date(exp.timestamp).toLocaleTimeString()}</p>
                            </div>

                            <a 
                              href={exp.downloadUrl}
                              download
                              className="bg-green-600 hover:bg-green-700 text-white font-bold p-2.5 rounded-lg transition"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            </main>

            {/* 3. RIGHT SIDEBAR: PROPERTIES COMPILATION PANEL */}
            <aside className="w-80 bg-[#141419] border-l border-[#27272a] overflow-y-auto p-4 space-y-6 shrink-0 text-left">
              
              {/* Overrides and custom layout rules */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <Sliders size={14} className="text-[#e03131]" />
                  Active Layout Overrides
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Unique Design Per Verse</span>
                    <input 
                      type="checkbox" 
                      checked={uniqueTemplatePerVerse}
                      onChange={(e) => setUniqueTemplatePerVerse(e.target.checked)}
                      className="accent-[#e03131] h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Unique Voice Per Verse</span>
                    <input 
                      type="checkbox" 
                      checked={uniqueVoicePerVerse}
                      onChange={(e) => setUniqueVoicePerVerse(e.target.checked)}
                      className="accent-[#e03131] h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              {/* Voice Tester & Manager Panel */}
              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                  Voice Tester
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Testing Voice</label>
                    <select 
                      value={testingVoice}
                      onChange={(e) => setTestingVoice(e.target.value)}
                      className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                    >
                      <optgroup label="Tamil neural voices">
                        {TAMIL_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                      </optgroup>
                      <optgroup label="English neural voices">
                        {ENGLISH_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Test Text Phrase</label>
                    <textarea 
                      value={testingText}
                      placeholder={verses[previewVerseIndex]?.verse || "Type text to synthesize..."}
                      onChange={(e) => setTestingText(e.target.value)}
                      className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-xs p-2 text-zinc-200 outline-none h-16 resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleTestVoice}
                    disabled={isTestingVoice}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-bold py-2 rounded-lg transition"
                  >
                    {isTestingVoice ? "Synthesizing Test..." : "Test Voice Audio"}
                  </button>
                </div>
              </div>

              {/* Advanced Watermark Properties Panel */}
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                    Watermark Branding
                  </h3>
                  <input 
                    type="checkbox" 
                    checked={watermarkEnabled}
                    onChange={(e) => setWatermarkEnabled(e.target.checked)}
                    className="accent-[#e03131] h-4 w-4"
                  />
                </div>

                {watermarkEnabled && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Watermark Text</label>
                      <input 
                        type="text" 
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Pos (16:9)</label>
                        <select 
                          value={watermarkPosition169}
                          onChange={(e) => setWatermarkPosition169(e.target.value as any)}
                          className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-[11px] p-1.5 text-zinc-200 outline-none"
                        >
                          <option value="Top-Left">Top-Left</option>
                          <option value="Top-Right">Top-Right</option>
                          <option value="Bottom-Left">Bottom-Left</option>
                          <option value="Bottom-Right">Bottom-Right</option>
                          <option value="Center">Center</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Pos (9:16)</label>
                        <select 
                          value={watermarkPosition916}
                          onChange={(e) => setWatermarkPosition916(e.target.value as any)}
                          className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-[11px] p-1.5 text-zinc-200 outline-none"
                        >
                          <option value="Top-Left">Top-Left</option>
                          <option value="Top-Right">Top-Right</option>
                          <option value="Bottom-Left">Bottom-Left</option>
                          <option value="Bottom-Right">Bottom-Right</option>
                          <option value="Center">Center</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Opacity: {watermarkOpacity}</label>
                      <input 
                        type="range" min="0.1" max="1.0" step="0.1"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-[#e03131]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Scale/Size: {watermarkScale}px</label>
                        <input 
                          type="range" min="10" max="32" step="2"
                          value={watermarkScale}
                          onChange={(e) => setWatermarkScale(parseInt(e.target.value))}
                          className="w-full accent-[#e03131]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Padding/Margin: {watermarkMargin}px</label>
                        <input 
                          type="range" min="10" max="60" step="5"
                          value={watermarkMargin}
                          onChange={(e) => setWatermarkMargin(parseInt(e.target.value))}
                          className="w-full accent-[#e03131]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Watermark Effect</label>
                      <select 
                        value={watermarkAnimation}
                        onChange={(e) => setWatermarkAnimation(e.target.value as any)}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                      >
                        <option value="Static">Static</option>
                        <option value="Pulsing">Glowing Pulsing</option>
                        <option value="Scrolling">Marquee Scrolling</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Complete Export Settings Panel */}
              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                  FFmpeg Export Settings
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Video Codec</label>
                      <select 
                        value={videoCodec}
                        onChange={(e) => setVideoCodec(e.target.value)}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                      >
                        <option value="libx264">H.264 (libx264)</option>
                        <option value="libx265">H.265 (libx265)</option>
                        <option value="mpeg4">MPEG4 standard</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Audio Codec</label>
                      <select 
                        value={audioCodec}
                        onChange={(e) => setAudioCodec(e.target.value)}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                      >
                        <option value="aac">AAC audio</option>
                        <option value="mp3">MP3 standard</option>
                        <option value="copy">Direct audio copy</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Bitrate</label>
                      <select 
                        value={bitrate}
                        onChange={(e) => setBitrate(e.target.value)}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                      >
                        <option value="1000k">1 Mbps (Standard)</option>
                        <option value="2000k">2 Mbps (High)</option>
                        <option value="4000k">4 Mbps (Ultra)</option>
                        <option value="8000k">8 Mbps (Cinema)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Render FPS</label>
                      <select 
                        value={fps}
                        onChange={(e) => setFps(Number(e.target.value))}
                        className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-1.5 text-zinc-200"
                      >
                        <option value={10}>10 FPS (Draft)</option>
                        <option value={15}>15 FPS (Default)</option>
                        <option value={24}>24 FPS (Cinematic)</option>
                        <option value={30}>30 FPS (Fluid)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase font-black block mb-1">Filename Template</label>
                    <input 
                      type="text" 
                      value={filenameFormat}
                      onChange={(e) => setFilenameFormat(e.target.value)}
                      className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg text-xs p-2 text-zinc-200 outline-none"
                    />
                    <span className="text-[9px] text-zinc-600 block mt-0.5 font-mono">Use variables: {'{Book}, {Chapter}, {Verse}'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Overwrite Existing Outputs</span>
                    <input 
                      type="checkbox" 
                      checked={overwriteBehaviour}
                      onChange={(e) => setOverwriteBehaviour(e.target.checked)}
                      className="accent-[#e03131] h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Aspect Ratio Stitchable Intro/Outro uploads */}
              <div className="border-t border-zinc-800 pt-4 space-y-4 text-xs">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                  Stitchable Intro & Outro MP4s
                </h3>

                {/* Intro uploads */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Intro Stitching active</span>
                    <input 
                      type="checkbox" 
                      checked={introEnabled}
                      onChange={(e) => setIntroEnabled(e.target.checked)}
                      className="accent-[#e03131] h-4 w-4"
                    />
                  </div>

                  {introEnabled && (
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="bg-[#0b0b0e] p-2 rounded-lg border border-zinc-800 relative group">
                        <input type="file" accept="video/mp4" onChange={handleIntroUpload169} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Film size={16} className="mx-auto text-zinc-500 group-hover:text-[#e03131] mb-1 transition" />
                        <span className="text-zinc-400 block truncate">{introFile169 ? "Ready (16:9)" : "Upload 16:9"}</span>
                      </div>

                      <div className="bg-[#0b0b0e] p-2 rounded-lg border border-zinc-800 relative group">
                        <input type="file" accept="video/mp4" onChange={handleIntroUpload916} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Film size={16} className="mx-auto text-zinc-500 group-hover:text-[#e03131] mb-1 transition" />
                        <span className="text-zinc-400 block truncate">{introFile916 ? "Ready (9:16)" : "Upload 9:16"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outro uploads */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Outro Stitching active</span>
                    <input 
                      type="checkbox" 
                      checked={outroEnabled}
                      onChange={(e) => setOutroEnabled(e.target.checked)}
                      className="accent-[#e03131] h-4 w-4"
                    />
                  </div>

                  {outroEnabled && (
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="bg-[#0b0b0e] p-2 rounded-lg border border-zinc-800 relative group">
                        <input type="file" accept="video/mp4" onChange={handleOutroUpload169} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Film size={16} className="mx-auto text-zinc-500 group-hover:text-[#e03131] mb-1 transition" />
                        <span className="text-zinc-400 block truncate">{outroFile169 ? "Ready (16:9)" : "Upload 16:9"}</span>
                      </div>

                      <div className="bg-[#0b0b0e] p-2 rounded-lg border border-zinc-800 relative group">
                        <input type="file" accept="video/mp4" onChange={handleOutroUpload916} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Film size={16} className="mx-auto text-zinc-500 group-hover:text-[#e03131] mb-1 transition" />
                        <span className="text-zinc-400 block truncate">{outroFile916 ? "Ready (9:16)" : "Upload 9:16"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {(introFile169 || introFile916 || outroFile169 || outroFile916) && (
                  <button 
                    onClick={clearIntroOutro}
                    className="w-full text-center text-[10px] text-[#e03131] hover:underline"
                  >
                    Clear All Concat video files
                  </button>
                )}
              </div>

              {/* Big Batch Action CTA Button */}
              {selectedVerseIds.length > 0 && (
                <div className="border-t border-zinc-800 pt-5">
                  <button 
                    onClick={handleBatchExport}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Flame size={14} className="animate-pulse" />
                    Batch Export Selected ({selectedVerseIds.length})
                  </button>
                </div>
              )}

            </aside>

          </div>

        </div>
      )}

    </div>
  );
}
