import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { exec } from "child_process";
import crypto from "crypto";
import opentype from "opentype.js";
import { createServer as createViteServer } from "vite";
import { generateEdgeTTS } from "./tts_helper.ts";

const app = express();
const PORT = 3000;

// Enable JSON body parsing up to 100mb (for sending high-res slide images or batches of frames)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Setup file upload directories
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_DIR = path.join(UPLOADS_DIR, "databases");
const FONTS_DIR = path.join(UPLOADS_DIR, "fonts");
const AUDIO_DIR = path.join(UPLOADS_DIR, "audio");
const VIDEO_DIR = path.join(UPLOADS_DIR, "videos");
const INTRO_DIR = path.join(UPLOADS_DIR, "intro");
const OUTRO_DIR = path.join(UPLOADS_DIR, "outro");
const TASKS_DIR = path.join(UPLOADS_DIR, "tasks");

[UPLOADS_DIR, DB_DIR, FONTS_DIR, AUDIO_DIR, VIDEO_DIR, INTRO_DIR, OUTRO_DIR, TASKS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Persistent database and config files
const QUEUE_FILE = path.join(UPLOADS_DIR, "render_queue.json");
const COMPLETED_FILE = path.join(UPLOADS_DIR, "completed_videos.json");
const FONTS_CONFIG_FILE = path.join(UPLOADS_DIR, "fonts_config.json");

// Memory stores initialized from persistence
let activeDbPath: string | null = null;
let activeDbName: string | null = null;
let dbMetadata: any = null;
let renderQueue: any[] = [];
let completedVideos: any[] = [];
let disabledFonts: string[] = [];

// Load persistent data
if (fs.existsSync(QUEUE_FILE)) {
  try {
    renderQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to load render queue:", e);
  }
}
if (fs.existsSync(COMPLETED_FILE)) {
  try {
    completedVideos = JSON.parse(fs.readFileSync(COMPLETED_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to load completed videos list:", e);
  }
}
if (fs.existsSync(FONTS_CONFIG_FILE)) {
  try {
    const config = JSON.parse(fs.readFileSync(FONTS_CONFIG_FILE, "utf-8"));
    disabledFonts = config.disabledFonts || [];
  } catch (e) {
    console.error("Failed to load fonts config:", e);
  }
}

// Helpers to persist data
function saveRenderQueue() {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(renderQueue, null, 2));
}
function saveCompletedVideos() {
  fs.writeFileSync(COMPLETED_FILE, JSON.stringify(completedVideos, null, 2));
}
function saveFontsConfig() {
  fs.writeFileSync(FONTS_CONFIG_FILE, JSON.stringify({ disabledFonts }, null, 2));
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "database") cb(null, DB_DIR);
    else if (file.fieldname === "fonts") cb(null, FONTS_DIR);
    else if (file.fieldname === "intro_16_9" || file.fieldname === "intro_9_16") cb(null, INTRO_DIR);
    else if (file.fieldname === "outro_16_9" || file.fieldname === "outro_9_16") cb(null, OUTRO_DIR);
    else cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Standard names to prevent duplication of the identical aspect ratios
    if (file.fieldname === "intro_16_9") cb(null, "intro_16_9" + path.extname(file.originalname));
    else if (file.fieldname === "intro_9_16") cb(null, "intro_9_16" + path.extname(file.originalname));
    else if (file.fieldname === "outro_16_9") cb(null, "outro_16_9" + path.extname(file.originalname));
    else if (file.fieldname === "outro_9_16") cb(null, "outro_9_16" + path.extname(file.originalname));
    else cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// Serve uploads statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Helper to run python script
function runPythonHelper(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const pyArgs = args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(" ");
    exec(`python3 sqlite_helper.py ${pyArgs}`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Python execution error: ${error.message}. stderr: ${stderr}`));
        return;
      }
      try {
        const data = JSON.parse(stdout.trim());
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data);
        }
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${stdout}. stderr: ${stderr}`));
      }
    });
  });
}

// Helper to parse Font Metadata safely
function parseFontMetadata(filePath: string, filename: string) {
  try {
    const font = opentype.loadSync(filePath);
    const getEnName = (names: any) => {
      if (!names) return null;
      if (typeof names === "string") return names;
      return names.en || Object.values(names)[0] || null;
    };

    const family = getEnName(font.names.fontFamily) || path.basename(filename, path.extname(filename)).replace(/^\d+_/, "");
    const styleName = getEnName(font.names.fontSubfamily) || "Regular";
    
    // Detect weight and style from subfamily name
    const styleLower = styleName.toLowerCase();
    const weight = styleLower.includes("bold") ? "700" : styleLower.includes("light") ? "300" : "400";
    const style = styleLower.includes("italic") ? "italic" : "normal";
    const glyphCount = font.numGlyphs;

    return {
      family,
      url: `/uploads/fonts/${filename}`,
      filename,
      weight,
      style,
      glyphCount,
      enabled: !disabledFonts.includes(filename),
    };
  } catch (err: any) {
    console.error(`Failed to parse font opentype for ${filename}:`, err.message);
    const familyName = path.basename(filename, path.extname(filename)).replace(/^\d+_/, "");
    return {
      family: familyName,
      url: `/uploads/fonts/${filename}`,
      filename,
      weight: "400",
      style: "normal",
      glyphCount: 0,
      enabled: !disabledFonts.includes(filename),
    };
  }
}

// --------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------

// 1. Database Endpoints
app.post("/api/database/upload", upload.single("database"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const dbPath = req.file.path;
    const dbName = req.file.originalname;

    // Validate using python helper
    const result = await runPythonHelper([dbPath, "validate"]);
    if (result.valid) {
      activeDbPath = dbPath;
      activeDbName = dbName;
      dbMetadata = {
        name: dbName,
        language: result.language,
        booksCount: result.booksCount,
        chaptersCount: result.chaptersCount,
        versesCount: result.versesCount,
        validationReport: result.validationReport,
        uploadedAt: new Date().toISOString(),
      };
      res.json({ success: true, metadata: dbMetadata });
    } else {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      res.status(400).json({ error: result.error || "Invalid Bible database structure" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/database/info", (req, res) => {
  if (!activeDbPath) {
    return res.json({ ready: false });
  }
  res.json({ ready: true, metadata: dbMetadata });
});

app.get("/api/database/books", async (req, res) => {
  try {
    if (!activeDbPath) {
      return res.status(400).json({ error: "No active database" });
    }
    const data = await runPythonHelper([activeDbPath, "books"]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/database/chapters", async (req, res) => {
  try {
    if (!activeDbPath) {
      return res.status(400).json({ error: "No active database" });
    }
    const bookId = req.query.book as string;
    if (!bookId) {
      return res.status(400).json({ error: "Book parameter is required" });
    }
    const data = await runPythonHelper([activeDbPath, "chapters", bookId]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/database/verses", async (req, res) => {
  try {
    if (!activeDbPath) {
      return res.status(400).json({ error: "No active database" });
    }
    const bookId = req.query.book as string;
    const chapterId = req.query.chapter as string;
    if (!bookId || !chapterId) {
      return res.status(400).json({ error: "Book and chapter parameters are required" });
    }
    const data = await runPythonHelper([activeDbPath, "verses", bookId, chapterId]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Font Endpoints (Improved with metadata, previewing, disabling)
app.post("/api/fonts/upload", upload.array("fonts"), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const loadedFonts = files.map((file) => {
      return parseFontMetadata(file.path, file.filename);
    });

    res.json({ success: true, fonts: loadedFonts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/fonts", (req, res) => {
  try {
    const files = fs.readdirSync(FONTS_DIR);
    const fonts = files
      .filter((file) => /\.(ttf|otf|woff|woff2)$/i.test(file))
      .map((file) => {
        return parseFontMetadata(path.join(FONTS_DIR, file), file);
      });
    res.json({ fonts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/fonts/toggle", (req, res) => {
  const { filename, enabled } = req.body;
  if (!filename) return res.status(400).json({ error: "Filename is required" });

  if (!enabled) {
    if (!disabledFonts.includes(filename)) {
      disabledFonts.push(filename);
    }
  } else {
    disabledFonts = disabledFonts.filter(f => f !== filename);
  }
  saveFontsConfig();
  res.json({ success: true, disabledFonts });
});

// 3. TTS Endpoint (Improved with advanced audio caching layer)
app.post("/api/tts/generate", async (req, res) => {
  const { text, voice, verseKey } = req.body;
  if (!text || !voice) {
    return res.status(400).json({ error: "Text and voice are required" });
  }

  // Proper audio caching layer: MD5 hash of text + voice
  const hash = crypto.createHash("md5").update(text + "_" + voice).digest("hex");
  const cachedFilename = `cache_${hash}.mp3`;
  const cachedPath = path.join(AUDIO_DIR, cachedFilename);

  const returnAudioDetails = (outputPath: string, filename: string) => {
    const ffprobeCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`;
    exec(ffprobeCommand, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: `ffprobe failed to read audio duration: ${err.message}` });
      }
      const duration = parseFloat(stdout.trim());
      if (isNaN(duration)) {
        return res.status(500).json({ error: "ffprobe returned invalid duration format" });
      }
      res.json({
        success: true,
        audioUrl: `/uploads/audio/${filename}`,
        duration,
        filename,
        cached: true,
      });
    });
  };

  // If already cached, reuse immediately
  if (fs.existsSync(cachedPath)) {
    return returnAudioDetails(cachedPath, cachedFilename);
  }

  try {
    // Generate audio using Edge TTS Node client
    await generateEdgeTTS(text, voice, cachedPath);
    returnAudioDetails(cachedPath, cachedFilename);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "TTS generation failed" });
  }
});

// 4. ANIMATED Render Queue Endpoints
app.post("/api/video/initiate", (req, res) => {
  const { book, chapter, versecount, totalFrames, filename } = req.body;
  const uniqueId = Math.random().toString(36).substring(2, 9);
  const taskId = `${Date.now()}_${uniqueId}_${book}_${chapter}_${versecount}`;
  const taskDir = path.join(TASKS_DIR, taskId);
  
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }

  const finalFilename = filename || `${book || "Book"}_${chapter || "0"}_${versecount || "0"}.mp4`;
  const finalOutputPath = path.join(VIDEO_DIR, `${Date.now()}_${finalFilename}`);

  const queueItem = {
    id: taskId,
    book: String(book),
    chapter: Number(chapter),
    verse: Number(versecount),
    status: "Processing Slide",
    progress: 5,
    filename: finalFilename,
    outputPath: finalOutputPath,
    downloadUrl: `/uploads/videos/${path.basename(finalOutputPath)}`,
    createdAt: new Date().toISOString(),
  };

  renderQueue.push(queueItem);
  saveRenderQueue();

  res.json({ success: true, taskId, queueItem });
});

app.post("/api/video/upload_frames", (req, res) => {
  const { taskId, startIndex, frames } = req.body;
  if (!taskId || !frames || !Array.isArray(frames)) {
    return res.status(400).json({ error: "taskId and frames array are required" });
  }

  const taskDir = path.join(TASKS_DIR, taskId);
  if (!fs.existsSync(taskDir)) {
    return res.status(404).json({ error: "Task directory not found" });
  }

  frames.forEach((frameBase64, index) => {
    const frameIndex = startIndex + index;
    const base64Data = frameBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const framePath = path.join(taskDir, `frame_${String(frameIndex).padStart(4, "0")}.jpg`);
    fs.writeFileSync(framePath, base64Data, "base64");
  });

  const task = renderQueue.find(t => t.id === taskId);
  if (task) {
    task.status = "Uploading Frames";
    const totalSent = startIndex + frames.length;
    task.progress = Math.min(25, Math.round((totalSent / 100) * 20) + 5); // caps frame uploads at 25% progress block
    saveRenderQueue();
  }

  res.json({ success: true, uploaded: frames.length });
});

app.post("/api/video/compile", async (req, res) => {
  const {
    taskId,
    audioUrl,
    introEnabled,
    outroEnabled,
    aspectRatio,
    fps = 15,
    resolutionWidth = 1280,
    resolutionHeight = 720,
    videoCodec = "libx264",
    audioCodec = "aac",
    bitrate = "2000k",
    overwrite = true,
    cacheKey, // for render caching
  } = req.body;

  if (!taskId || !audioUrl) {
    return res.status(400).json({ error: "taskId and audioUrl are required" });
  }

  const taskDir = path.join(TASKS_DIR, taskId);
  const task = renderQueue.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found in queue" });
  }

  // Proper Render Cache Layer Check
  if (cacheKey) {
    const renderHash = crypto.createHash("md5").update(cacheKey).digest("hex");
    const cachedVideoPath = path.join(VIDEO_DIR, `cache_render_${renderHash}.mp4`);
    
    if (fs.existsSync(cachedVideoPath)) {
      console.log("Serving video compile from render cache:", cachedVideoPath);
      fs.copyFileSync(cachedVideoPath, task.outputPath);
      task.status = "Completed";
      task.progress = 100;
      saveRenderQueue();

      completedVideos.push({
        id: task.id,
        book: task.book,
        chapter: task.chapter,
        verse: task.verse,
        downloadUrl: task.downloadUrl,
        filename: task.filename,
        timestamp: new Date().toISOString(),
      });
      saveCompletedVideos();

      // clean frames dir
      if (fs.existsSync(taskDir)) fs.rmSync(taskDir, { recursive: true, force: true });
      return res.json({ success: true, downloadUrl: task.downloadUrl, cached: true });
    }
  }

  if (!fs.existsSync(taskDir)) {
    return res.status(404).json({ error: "Task directory not found" });
  }

  const relativeAudioPath = audioUrl.replace("/uploads/", "");
  const audioPath = path.join(UPLOADS_DIR, relativeAudioPath);

  task.status = "Rendering Video";
  task.progress = 30;
  saveRenderQueue();

  const tempMainVideo = path.join(VIDEO_DIR, `temp_main_${taskId}.mp4`);
  
  // FFmpeg command compilation from frame sequence
  const renderCmd = `ffmpeg -r ${fps} -i "${taskDir}/frame_%04d.jpg" -i "${audioPath}" -c:v ${videoCodec} -b:v ${bitrate} -c:a ${audioCodec} -b:a 192k -pix_fmt yuv420p -shortest -y "${tempMainVideo}"`;

  try {
    await new Promise<void>((resolve, reject) => {
      exec(renderCmd, (err, stdout, stderr) => {
        if (err) reject(new Error(`FFmpeg main compile failed: ${err.message}`));
        else resolve();
      });
    });

    let currentVideoPath = tempMainVideo;
    task.progress = 75;
    task.status = "Joining Intro/Outro";
    saveRenderQueue();

    // Fix Intro/Outro Selection by Output Aspect Ratio
    const introFiles = fs.readdirSync(INTRO_DIR).filter(f => !f.startsWith("."));
    const outroFiles = fs.readdirSync(OUTRO_DIR).filter(f => !f.startsWith("."));
    const is169 = aspectRatio === "16:9";

    let selectedIntro: string | null = null;
    if (introEnabled && introFiles.length > 0) {
      const match = introFiles.find(f => {
        const lf = f.toLowerCase();
        return is169 ? (lf.includes("16_9") || lf.includes("16-9") || lf.includes("16x9") || lf.includes("landscape") || lf.includes("horizontal"))
                     : (lf.includes("9_16") || lf.includes("9-16") || lf.includes("9x16") || lf.includes("portrait") || lf.includes("vertical"));
      }) || introFiles[0];
      selectedIntro = path.join(INTRO_DIR, match);
    }

    let selectedOutro: string | null = null;
    if (outroEnabled && outroFiles.length > 0) {
      const match = outroFiles.find(f => {
        const lf = f.toLowerCase();
        return is169 ? (lf.includes("16_9") || lf.includes("16-9") || lf.includes("16x9") || lf.includes("landscape") || lf.includes("horizontal"))
                     : (lf.includes("9_16") || lf.includes("9-16") || lf.includes("9x16") || lf.includes("portrait") || lf.includes("vertical"));
      }) || outroFiles[0];
      selectedOutro = path.join(OUTRO_DIR, match);
    }

    if (selectedIntro || selectedOutro) {
      const partsToConcat: string[] = [];
      if (selectedIntro) partsToConcat.push(selectedIntro);
      partsToConcat.push(currentVideoPath);
      if (selectedOutro) partsToConcat.push(selectedOutro);

      const listFilePath = path.join(UPLOADS_DIR, `list_${taskId}.txt`);
      const listContent = partsToConcat.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
      fs.writeFileSync(listFilePath, listContent);

      const concatVideo = path.join(VIDEO_DIR, `concat_${taskId}.mp4`);
      // Standard re-encoding concat so distinct aspect ratios and bitrates stitch seamlessly
      const concatCmd = `ffmpeg -f concat -safe 0 -i "${listFilePath}" -c:v ${videoCodec} -b:v ${bitrate} -c:a ${audioCodec} -y "${concatVideo}"`;

      await new Promise<void>((resolve, reject) => {
        exec(concatCmd, (err, stdout, stderr) => {
          fs.unlinkSync(listFilePath);
          if (err) reject(new Error(`FFmpeg stitch failed: ${err.message}`));
          else resolve();
        });
      });

      if (fs.existsSync(tempMainVideo)) fs.unlinkSync(tempMainVideo);
      currentVideoPath = concatVideo;
    }

    // Rename to destination and handle overwrite properties
    let finalOutputPath = task.outputPath;
    if (fs.existsSync(finalOutputPath)) {
      if (!overwrite) {
        const ext = path.extname(task.filename);
        const name = path.basename(task.filename, ext);
        const uniquePath = path.join(VIDEO_DIR, `${name}_${Date.now()}${ext}`);
        fs.renameSync(currentVideoPath, uniquePath);
        task.outputPath = uniquePath;
        task.downloadUrl = `/uploads/videos/${path.basename(uniquePath)}`;
        task.filename = path.basename(uniquePath);
      } else {
        fs.unlinkSync(finalOutputPath);
        fs.renameSync(currentVideoPath, finalOutputPath);
      }
    } else {
      fs.renameSync(currentVideoPath, finalOutputPath);
    }

    // Populate render cache if requested
    if (cacheKey) {
      const renderHash = crypto.createHash("md5").update(cacheKey).digest("hex");
      const cachedVideoPath = path.join(VIDEO_DIR, `cache_render_${renderHash}.mp4`);
      fs.copyFileSync(task.outputPath, cachedVideoPath);
    }

    // Cleanup tasks frames folder
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true });
    }

    task.status = "Completed";
    task.progress = 100;
    saveRenderQueue();

    completedVideos.push({
      id: task.id,
      book: task.book,
      chapter: task.chapter,
      verse: task.verse,
      downloadUrl: task.downloadUrl,
      filename: task.filename,
      timestamp: new Date().toISOString(),
    });
    saveCompletedVideos();

    res.json({ success: true, downloadUrl: task.downloadUrl });
  } catch (error: any) {
    console.error("FFmpeg animated compilation pipeline failed:", error);
    task.status = "Failed";
    task.progress = 0;
    task.error = error.message;
    saveRenderQueue();

    if (fs.existsSync(taskDir)) fs.rmSync(taskDir, { recursive: true, force: true });
    if (fs.existsSync(tempMainVideo)) fs.unlinkSync(tempMainVideo);

    res.status(500).json({ error: error.message });
  }
});

// Persistent Render Queue operations (Pause, Resume, Cancel, Retry)
app.post("/api/video/queue/pause", (req, res) => {
  const { taskId } = req.body;
  const task = renderQueue.find(t => t.id === taskId);
  if (task) {
    task.status = "Paused";
    saveRenderQueue();
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

app.post("/api/video/queue/resume", (req, res) => {
  const { taskId } = req.body;
  const task = renderQueue.find(t => t.id === taskId);
  if (task) {
    task.status = "Waiting";
    saveRenderQueue();
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

app.post("/api/video/queue/cancel", (req, res) => {
  const { taskId } = req.body;
  const taskIndex = renderQueue.findIndex(t => t.id === taskId);
  if (taskIndex > -1) {
    const task = renderQueue[taskIndex];
    const taskDir = path.join(TASKS_DIR, taskId);
    if (fs.existsSync(taskDir)) fs.rmSync(taskDir, { recursive: true, force: true });
    renderQueue.splice(taskIndex, 1);
    saveRenderQueue();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

app.post("/api/video/queue/retry", (req, res) => {
  const { taskId } = req.body;
  const task = renderQueue.find(t => t.id === taskId);
  if (task) {
    task.status = "Waiting";
    task.progress = 0;
    task.error = undefined;
    saveRenderQueue();
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

app.get("/api/video/queue", (req, res) => {
  res.json({ queue: renderQueue });
});

app.get("/api/video/completed", (req, res) => {
  res.json({ completed: completedVideos });
});

app.post("/api/video/clear", (req, res) => {
  renderQueue = [];
  saveRenderQueue();
  res.json({ success: true });
});

// 5. Intro & Outro Upload Endpoints (Fixed to support 16:9 and 9:16 files separate mapping)
app.post("/api/intro/upload_16_9", upload.single("intro_16_9"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ success: true, filename: req.file.filename, url: `/uploads/intro/${req.file.filename}` });
});

app.post("/api/intro/upload_9_16", upload.single("intro_9_16"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ success: true, filename: req.file.filename, url: `/uploads/intro/${req.file.filename}` });
});

app.post("/api/outro/upload_16_9", upload.single("outro_16_9"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ success: true, filename: req.file.filename, url: `/uploads/outro/${req.file.filename}` });
});

app.post("/api/outro/upload_9_16", upload.single("outro_9_16"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ success: true, filename: req.file.filename, url: `/uploads/outro/${req.file.filename}` });
});

app.get("/api/intro-outro/info", (req, res) => {
  try {
    const intros = fs.readdirSync(INTRO_DIR).filter(f => !f.startsWith("."));
    const outros = fs.readdirSync(OUTRO_DIR).filter(f => !f.startsWith("."));
    
    const intro169 = intros.find(f => f.includes("intro_16_9"));
    const intro916 = intros.find(f => f.includes("intro_9_16"));
    const outro169 = outros.find(f => f.includes("outro_16_9"));
    const outro916 = outros.find(f => f.includes("outro_9_16"));

    res.json({
      intro_16_9: intro169 ? `/uploads/intro/${intro169}` : null,
      intro_9_16: intro916 ? `/uploads/intro/${intro916}` : null,
      outro_16_9: outro169 ? `/uploads/outro/${outro169}` : null,
      outro_9_16: outro916 ? `/uploads/outro/${outro916}` : null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/intro-outro/clear", (req, res) => {
  try {
    fs.readdirSync(INTRO_DIR).forEach(f => fs.unlinkSync(path.join(INTRO_DIR, f)));
    fs.readdirSync(OUTRO_DIR).forEach(f => fs.unlinkSync(path.join(OUTRO_DIR, f)));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 6. Project Configuration Save/Load
app.post("/api/project/save", (req, res) => {
  try {
    const config = req.body;
    const projectPath = path.join(UPLOADS_DIR, "BibleVerseProject.json");
    fs.writeFileSync(projectPath, JSON.stringify(config, null, 2));
    res.json({ success: true, downloadUrl: "/uploads/BibleVerseProject.json" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/project/load", (req, res) => {
  try {
    const projectPath = path.join(UPLOADS_DIR, "BibleVerseProject.json");
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: "No project file saved yet" });
    }
    const data = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
    res.json({ success: true, config: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------------
// VITE DEV SERVER / PRODUCTION SERVING
// --------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
