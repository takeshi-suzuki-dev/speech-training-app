import { useCallback, useEffect, useRef, useState } from "react";

// ── Timing constants ─────────────────────────────────────────
const MIC_AUTO_RELEASE_MS = 90_000;
const RECORDING_MAX_MS = 35_000;
const TARGET_SAMPLE_RATE = 16_000;

// ── Pure audio helpers (no React state; module scope) ────────
function mergeAudioChunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function resampleAudio(
  data: Float32Array,
  from: number,
  to: number,
): Float32Array {
  if (from === to) return data;
  const ratio = from / to;
  const newLen = Math.round(data.length / ratio);
  const out = new Float32Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const si = i * ratio;
    const ib = Math.floor(si);
    const ia = Math.min(ib + 1, data.length - 1);
    const w = si - ib;
    out[i] = data[ib] * (1 - w) + data[ia] * w;
  }
  return out;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2,
    numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const ws = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  ws(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  ws(36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (const s of samples) {
    const c = Math.max(-1, Math.min(1, s));
    view.setInt16(offset, c < 0 ? c * 0x8000 : c * 0x7fff, true);
    offset += 2;
  }
  return new Blob([view], { type: "audio/wav" });
}

// ── Params / return ──────────────────────────────────────────
type UseRecordingSessionParams = {
  /**
   * Safety valve. When false, `startRecording` is a no-op. The caller is
   * responsible for surfacing any domain-level reason (e.g. "select a
   * sentence first") — the hook stays silent so recording-device errors and
   * domain errors don't get tangled together.
   */
  canRecord: boolean;
  /**
   * Called at the moment recording actually starts, so the caller can clear
   * scoring state (result / scored / expandedWord). Keeps scoring concerns
   * out of the recording hook.
   */
  onRecordingStart?: () => void;
  /** Recording-device errors (unsupported browser, getUserMedia failure, …). */
  reportError: (message: string) => void;
};

export type RecordingSession = {
  audioFile: File | null;
  recordedAudioUrl: string | null;
  isRecording: boolean;
  isMicReady: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  releaseMicrophone: () => void;
  /**
   * Discard the captured recording (audioFile + its playback URL) without
   * touching the live mic. Call when the recording is no longer relevant —
   * e.g. the selected sentence changed. Stable identity (safe as an effect
   * dependency).
   */
  reset: () => void;
};

export function useRecordingSession({
  canRecord,
  onRecordingStart,
  reportError,
}: UseRecordingSessionParams): RecordingSession {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Float32Array[]>([]);
  const releaseTimerRef = useRef<number | null>(null);
  const recordingLimitTimerRef = useRef<number | null>(null);

  // Callbacks / latest props are read through refs so they don't need to be
  // dependencies of the timer/handler closures (avoids stale-closure vs.
  // re-subscribe churn on parent re-renders). Same pattern as
  // useCategoryTemplateManager: the refs are synced inside an effect, never
  // written during render.
  const canRecordRef = useRef(canRecord);
  const onRecordingStartRef = useRef(onRecordingStart);
  const reportErrorRef = useRef(reportError);

  useEffect(() => {
    canRecordRef.current = canRecord;
    onRecordingStartRef.current = onRecordingStart;
    reportErrorRef.current = reportError;
  });

  // stopRecording and the 35s auto-stop timer reference each other, so the
  // latest stopRecording is kept in a ref for the timer callback to call.
  const stopRecordingRef = useRef<() => void>(() => {});

  // ── Mic helpers ────────────────────────────────────────────
  const clearRecordingLimitTimer = () => {
    if (recordingLimitTimerRef.current) {
      window.clearTimeout(recordingLimitTimerRef.current);
      recordingLimitTimerRef.current = null;
    }
  };

  const releaseMicrophone = () => {
    clearRecordingLimitTimer();

    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
    setIsMicReady(false);
    setIsRecording(false);
  };

  const scheduleMicRelease = () => {
    if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = window.setTimeout(
      () => releaseMicrophone(),
      MIC_AUTO_RELEASE_MS,
    );
  };

  const startRecording = async () => {
    if (!canRecordRef.current) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      reportErrorRef.current(
        "Microphone recording is not supported in this browser.",
      );
      return;
    }
    try {
      onRecordingStartRef.current?.();
      recordedChunksRef.current = [];
      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
      if (!recordingStreamRef.current)
        recordingStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      )
        audioContextRef.current = new AudioContext();
      if (audioContextRef.current.state === "suspended")
        await audioContextRef.current.resume();
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      const source = audioContextRef.current.createMediaStreamSource(
        recordingStreamRef.current,
      );
      sourceRef.current = source;
      const processor = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1,
      );
      processorRef.current = processor;
      processor.onaudioprocess = (e) =>
        recordedChunksRef.current.push(
          new Float32Array(e.inputBuffer.getChannelData(0)),
        );
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      setAudioFile(null);
      setRecordedAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsMicReady(true);
      setIsRecording(true);

      clearRecordingLimitTimer();
      recordingLimitTimerRef.current = window.setTimeout(() => {
        recordingLimitTimerRef.current = null;
        stopRecordingRef.current();
      }, RECORDING_MAX_MS);
    } catch (error) {
      reportErrorRef.current(
        error instanceof Error
          ? error.message
          : "Failed to start microphone recording.",
      );
    }
  };

  const stopRecording = () => {
    clearRecordingLimitTimer();

    if (!audioContextRef.current || recordedChunksRef.current.length === 0) {
      setIsRecording(false);
      scheduleMicRelease();
      return;
    }

    const sr = audioContextRef.current.sampleRate;
    const merged = mergeAudioChunks(recordedChunksRef.current);
    const resampled = resampleAudio(merged, sr, TARGET_SAMPLE_RATE);
    const wavBlob = encodeWav(resampled, TARGET_SAMPLE_RATE);
    const wavFile = new File([wavBlob], `recording-${Date.now()}.wav`, {
      type: "audio/wav",
    });
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    setAudioFile(wavFile);
    setRecordedAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(wavBlob);
    });
    setIsRecording(false);
    scheduleMicRelease();
  };

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  });

  // Discard the captured recording without releasing the mic. Uses only
  // functional setState updaters so it can be a stable ([]) callback — safe to
  // pass as an effect dependency in the consumer.
  const reset = useCallback(() => {
    setAudioFile(null);
    setRecordedAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  // ── Unmount cleanup: tear down all recording resources ─────
  useEffect(() => {
    return () => {
      clearRecordingLimitTimer();

      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
      }

      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());

      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  return {
    audioFile,
    recordedAudioUrl,
    isRecording,
    isMicReady,
    startRecording,
    stopRecording,
    releaseMicrophone,
    reset,
  };
}
