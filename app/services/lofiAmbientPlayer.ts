/**
 * In-app Containment Lo-Fi ambient player (expo-audio).
 * Singleton — one stream at a time. Soft Signal of sound = stop/mute free.
 *
 * NOTE: expo-av was removed — it fails to compile EXAV on Expo SDK 55 / Xcode 27
 * (missing ExpoModulesCore/EXEventEmitter.h). expo-audio is the supported path.
 */
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LOFI_TRACKS,
  clampVolume,
  findLofiTrack,
  nextTrackId,
  prevTrackId,
  type LofiTrack,
} from "../lib/lofiCatalog.ts";

const PREFS_KEY = "litmo.lofi.ambient.prefs.v1";

export type LofiPlayerStatus = {
  trackId: string | null;
  track: LofiTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  volume: number;
  error: string | null;
  positionMillis: number;
  durationMillis: number | null;
};

type Listener = (status: LofiPlayerStatus) => void;

const defaultStatus = (): LofiPlayerStatus => ({
  trackId: LOFI_TRACKS[0]?.id ?? null,
  track: LOFI_TRACKS[0] ?? null,
  isPlaying: false,
  isLoading: false,
  isMuted: false,
  volume: 0.35,
  error: null,
  positionMillis: 0,
  durationMillis: null,
});

class LofiAmbientPlayer {
  private player: AudioPlayer | null = null;
  private status: LofiPlayerStatus = defaultStatus();
  private listeners = new Set<Listener>();
  private modeReady = false;
  private poll: ReturnType<typeof setInterval> | null = null;

  getStatus(): LofiPlayerStatus {
    return this.status;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const l of this.listeners) l(this.status);
  }

  private set(partial: Partial<LofiPlayerStatus>) {
    this.status = { ...this.status, ...partial };
    this.emit();
  }

  private startPoll() {
    if (this.poll) return;
    this.poll = setInterval(() => {
      if (!this.player) return;
      try {
        this.set({
          isPlaying: this.player.playing,
          isLoading: this.player.isBuffering && !this.player.isLoaded,
          positionMillis: Math.floor(this.player.currentTime * 1000),
          durationMillis:
            this.player.duration > 0
              ? Math.floor(this.player.duration * 1000)
              : null,
        });
      } catch {
        // player may be released mid-poll
      }
    }, 500);
  }

  private stopPoll() {
    if (this.poll) {
      clearInterval(this.poll);
      this.poll = null;
    }
  }

  async hydratePrefs(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as {
        trackId?: string;
        volume?: number;
        isMuted?: boolean;
      };
      const track = p.trackId ? findLofiTrack(p.trackId) : null;
      this.set({
        trackId: track?.id ?? this.status.trackId,
        track: track ?? this.status.track,
        volume: clampVolume(p.volume ?? this.status.volume),
        isMuted: Boolean(p.isMuted),
      });
    } catch {
      // defaults fine
    }
  }

  private async persistPrefs(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          trackId: this.status.trackId,
          volume: this.status.volume,
          isMuted: this.status.isMuted,
        }),
      );
    } catch {
      // ignore
    }
  }

  private async ensureMode(): Promise<void> {
    if (this.modeReady) return;
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "duckOthers",
    });
    this.modeReady = true;
  }

  private disposePlayer() {
    this.stopPoll();
    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch {
        // ignore
      }
      this.player = null;
    }
  }

  async playTrack(trackId: string): Promise<void> {
    const track = findLofiTrack(trackId);
    if (!track) {
      this.set({ error: "Track not found" });
      return;
    }
    this.set({
      isLoading: true,
      error: null,
      trackId: track.id,
      track,
    });
    try {
      await this.ensureMode();
      this.disposePlayer();
      const player = createAudioPlayer(
        { uri: track.uri },
        { updateInterval: 500, downloadFirst: true },
      );
      player.loop = true;
      player.volume = this.status.isMuted ? 0 : this.status.volume;
      player.play();
      this.player = player;
      this.startPoll();
      this.set({
        isPlaying: true,
        isLoading: false,
        error: null,
      });
      await this.persistPrefs();
    } catch (e) {
      this.set({
        isLoading: false,
        isPlaying: false,
        error:
          e instanceof Error
            ? e.message
            : "Could not start ambient audio (network?)",
      });
    }
  }

  async togglePlay(): Promise<void> {
    if (!this.player) {
      if (this.status.trackId) await this.playTrack(this.status.trackId);
      return;
    }
    try {
      if (this.player.playing) {
        this.player.pause();
        this.set({ isPlaying: false });
      } else {
        this.player.play();
        this.set({ isPlaying: true });
        this.startPoll();
      }
    } catch (e) {
      this.set({
        error: e instanceof Error ? e.message : "Playback toggle failed",
      });
    }
  }

  /** Soft Signal of sound — stop fully. */
  async stop(): Promise<void> {
    this.disposePlayer();
    this.set({
      isPlaying: false,
      isLoading: false,
      positionMillis: 0,
      durationMillis: null,
    });
  }

  async setMuted(muted: boolean): Promise<void> {
    this.set({ isMuted: muted });
    try {
      if (this.player) {
        this.player.muted = muted;
        this.player.volume = muted ? 0 : this.status.volume;
      }
    } catch {
      // ignore
    }
    await this.persistPrefs();
  }

  async setVolume(volume: number): Promise<void> {
    const v = clampVolume(volume);
    this.set({ volume: v });
    try {
      if (this.player && !this.status.isMuted) {
        this.player.volume = v;
      }
    } catch {
      // ignore
    }
    await this.persistPrefs();
  }

  async next(): Promise<void> {
    const id = nextTrackId(this.status.trackId ?? LOFI_TRACKS[0]!.id);
    await this.playTrack(id);
  }

  async prev(): Promise<void> {
    const id = prevTrackId(this.status.trackId ?? LOFI_TRACKS[0]!.id);
    await this.playTrack(id);
  }
}

export const lofiAmbientPlayer = new LofiAmbientPlayer();
export const LOFI_AMBIENT_PREFS_KEY = PREFS_KEY;
