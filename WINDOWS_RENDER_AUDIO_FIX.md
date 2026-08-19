## Windows rendering/audio dependency fix

The existing server invokes `ffmpeg` during video compilation and `ffprobe` while validating generated TTS audio. On Windows these binaries may exist but not be available to the Node process through PATH. This causes both symptoms: rendering fails, and TTS can return an error after audio generation because duration verification cannot run.

`ffmpeg.cmd` and `ffprobe.cmd` resolve common Windows installations and support `FFMPEG_PATH` as an explicit override. `render_test.cmd` checks both commands before starting a render.