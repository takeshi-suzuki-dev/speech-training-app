import { useCallback, useEffect, useRef, useState } from "react";
import { SentenceTemplate } from "@/lib/api/sentenceTemplates";
import { generateTemplateSampleAudio } from "@/lib/api/tts";

const MAX_SAMPLE_AUDIO_CACHE_ITEMS = 20;

type CachedSampleAudio = {
  url: string;
  size: number;
  lastUsedAt: number;
};

// ── Pure cache helpers (no React state; module scope) ────────
function buildSampleAudioCacheKey(template: SentenceTemplate): string {
  return `${template.id}:${template.sampleAudioText}`;
}

function evictOldSampleAudioCache(cache: Map<string, CachedSampleAudio>): void {
  if (cache.size <= MAX_SAMPLE_AUDIO_CACHE_ITEMS) {
    return;
  }

  const entriesByOldest = [...cache.entries()].sort(
    ([, a], [, b]) => a.lastUsedAt - b.lastUsedAt,
  );

  while (cache.size > MAX_SAMPLE_AUDIO_CACHE_ITEMS) {
    const nextEviction = entriesByOldest.shift();

    if (!nextEviction) {
      return;
    }

    const [cacheKey, cached] = nextEviction;
    URL.revokeObjectURL(cached.url);
    cache.delete(cacheKey);
  }
}

function removeCachedSampleAudioForTemplate(
  cache: Map<string, CachedSampleAudio>,
  templateId: string,
): void {
  for (const [cacheKey, cached] of cache.entries()) {
    if (cacheKey.startsWith(`${templateId}:`)) {
      URL.revokeObjectURL(cached.url);
      cache.delete(cacheKey);
    }
  }
}

// ── Params / return ──────────────────────────────────────────
type UseSampleAudioPlayerParams = {
  reportError: (message: string) => void;
};

/**
 * Props to spread onto the hidden <audio> element that plays the sample.
 * Keeps all the media-event wiring inside the hook.
 */
export type SampleAudioElementProps = {
  ref: React.RefObject<HTMLAudioElement | null>;
  src: string | undefined;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
};

export type SampleAudioPlayer = {
  audioUrl: string | null;
  ttsLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** Spread onto the hidden <audio> element. */
  audioProps: SampleAudioElementProps;
  /**
   * Silently generate/cache a template's sample audio and set it as the source
   * without auto-playing. Manages the loading flag; resolves to false on
   * failure. Stable identity — safe as an effect dependency.
   */
  preload: (template: SentenceTemplate) => Promise<boolean>;
  /**
   * Toggle play/pause when audio already exists, otherwise generate then
   * auto-play. `referenceText` gates generation the same way the page does.
   */
  playSample: (
    template: SentenceTemplate | null,
    referenceText: string,
  ) => Promise<void>;
  /** Seek to a time (seconds) and resume playback. */
  seek: (time: number) => void;
  /** Clear playback + drop the current URL (does not clear the cache). */
  resetState: () => void;
  /** Drop every cached entry for a template id (e.g. on template edit/delete). */
  removeCachedForTemplate: (templateId: string) => void;
};

export function useSampleAudioPlayer({
  reportError,
}: UseSampleAudioPlayerParams): SampleAudioPlayer {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const sampleAudioCacheRef = useRef<Map<string, CachedSampleAudio>>(new Map());
  const sampleAudioLoadingRef = useRef<Map<string, Promise<string>>>(new Map());
  const pendingSampleAudioAutoPlayRef = useRef(false);

  // reportError read through a ref so callbacks don't need it as a dependency
  // (avoids re-subscribe churn on parent re-renders). Synced in an effect —
  // never written during render (react-hooks/refs).
  const reportErrorRef = useRef(reportError);
  useEffect(() => {
    reportErrorRef.current = reportError;
  });

  const resetState = useCallback(() => {
    pendingSampleAudioAutoPlayRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setTtsLoading(false);
  }, []);

  const getOrCreateUrl = useCallback(
    async (template: SentenceTemplate): Promise<string> => {
      const cacheKey = buildSampleAudioCacheKey(template);
      const cached = sampleAudioCacheRef.current.get(cacheKey);

      if (cached) {
        cached.lastUsedAt = Date.now();
        return cached.url;
      }

      const loading = sampleAudioLoadingRef.current.get(cacheKey);

      if (loading) {
        return loading;
      }

      const loadingPromise = generateTemplateSampleAudio(template.id)
        .then((audioBlob) => {
          const objectUrl = URL.createObjectURL(audioBlob);

          sampleAudioCacheRef.current.set(cacheKey, {
            url: objectUrl,
            size: audioBlob.size,
            lastUsedAt: Date.now(),
          });

          evictOldSampleAudioCache(sampleAudioCacheRef.current);

          return objectUrl;
        })
        .finally(() => {
          sampleAudioLoadingRef.current.delete(cacheKey);
        });

      sampleAudioLoadingRef.current.set(cacheKey, loadingPromise);

      return loadingPromise;
    },
    [],
  );

  // Silently prepare (generate/cache) a template's sample audio and set it as
  // the current source *without* auto-playing. Owns the loading flag; the page
  // decides *when* to call this (on template change). Returns false on failure
  // so the caller can skip stale-guarded state updates.
  const preload = useCallback(
    async (template: SentenceTemplate): Promise<boolean> => {
      try {
        setTtsLoading(true);
        const objectUrl = await getOrCreateUrl(template);
        pendingSampleAudioAutoPlayRef.current = false;
        setAudioUrl(objectUrl);
        return true;
      } catch (error) {
        reportErrorRef.current(
          error instanceof Error
            ? error.message
            : "Failed to prepare sample audio.",
        );
        return false;
      } finally {
        setTtsLoading(false);
      }
    },
    [getOrCreateUrl],
  );

  const removeCachedForTemplate = useCallback((templateId: string) => {
    removeCachedSampleAudioForTemplate(sampleAudioCacheRef.current, templateId);
  }, []);

  const playSample = useCallback(
    async (template: SentenceTemplate | null, referenceText: string) => {
      if (!template) {
        reportErrorRef.current("Please select a sentence first.");
        return;
      }

      // Already generated → toggle play/pause.
      if (audioUrl && audioRef.current) {
        if (audioRef.current.paused) {
          void audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
        return;
      }

      if (!referenceText.trim()) {
        reportErrorRef.current("Please enter reference text.");
        return;
      }

      try {
        setTtsLoading(true);
        const objectUrl = await getOrCreateUrl(template);
        pendingSampleAudioAutoPlayRef.current = true;
        setAudioUrl(objectUrl);
      } catch (error) {
        reportErrorRef.current(
          error instanceof Error
            ? error.message
            : "Failed to load sample audio.",
        );
      } finally {
        setTtsLoading(false);
      }
    },
    [audioUrl, getOrCreateUrl],
  );

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    void audio.play();
  }, []);

  // Load the new source; auto-play only when the pending flag was set (i.e. the
  // user pressed play, not the silent preload path).
  useEffect(() => {
    if (!audioUrl || !audioRef.current) {
      return;
    }

    audioRef.current.load();

    if (!pendingSampleAudioAutoPlayRef.current) {
      return;
    }

    pendingSampleAudioAutoPlayRef.current = false;
    void audioRef.current.play();
  }, [audioUrl]);

  // Revoke every cached object URL on unmount.
  useEffect(() => {
    const cache = sampleAudioCacheRef.current;
    const loading = sampleAudioLoadingRef.current;

    return () => {
      cache.forEach((cached) => {
        URL.revokeObjectURL(cached.url);
      });
      cache.clear();
      loading.clear();
    };
  }, []);

  const audioProps: SampleAudioElementProps = {
    ref: audioRef,
    src: audioUrl ?? undefined,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: () => {
      setIsPlaying(false);
      setCurrentTime(0);
    },
    onTimeUpdate: () => setCurrentTime(audioRef.current?.currentTime ?? 0),
    onLoadedMetadata: () => setDuration(audioRef.current?.duration ?? 0),
  };

  return {
    audioUrl,
    ttsLoading,
    isPlaying,
    currentTime,
    duration,
    audioProps,
    preload,
    playSample,
    seek,
    resetState,
    removeCachedForTemplate,
  };
}
