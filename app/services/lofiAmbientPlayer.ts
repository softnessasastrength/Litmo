/**
 * In-app Containment Lo-Fi ambient player (expo-av).
 * Singleton — one stream at a time. Soft Signal of sound = stop/mute free.
 */
import { Audio, type AVPlaybackStatus } from "expo-av";
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
  private sound: Audio.Sound | null = null;
  private status: LofiPlayerStatus = defaultStatus();
  private listeners = new Set<Listener>();
  private modeReady = false;

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
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    this.modeReady = true;
  }

  private onPlaybackStatus = (raw: AVPlaybackStatus) => {
    if (!raw.isLoaded) {
      if ("error" in raw && raw.error) {
        this.set({ error: String(raw.error), isLoading: false, isPlaying: false });
      }
      return;
    }
    this.set({
      isPlaying: raw.isPlaying,
      isLoading: false,
      positionMillis: raw.positionMillis,
      durationMillis: raw.durationMillis ?? null,
      error: null,
    });
  };

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
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound.setOnPlaybackStatusUpdate(null);
        this.sound = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        {
          shouldPlay: true,
          isLooping: true,
          volume: this.status.isMuted ? 0 : this.status.volume,
          progressUpdateIntervalMillis: 500,
        },
        this.onPlaybackStatus,
      );
      this.sound = sound;
      this.set({ isPlaying: true, isLoading: false, error: null });
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
    if (!this.sound) {
      if (this.status.trackId) await this.playTrack(this.status.trackId);
      return;
    }
    try {
      const st = await this.sound.getStatusAsync();
      if (!st.isLoaded) {
        if (this.status.trackId) await this.playTrack(this.status.trackId);
        return;
      }
      if (st.isPlaying) {
        await this.sound.pauseAsync();
        this.set({ isPlaying: false });
      } else {
        await this.sound.playAsync();
        this.set({ isPlaying: true });
      }
    } catch (e) {
      this.set({
        error: e instanceof Error ? e.message : "Playback toggle failed",
      });
    }
  }

  /** Soft Signal of sound — stop fully. */
  async stop(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound.setOnPlaybackStatusUpdate(null);
        this.sound = null;
      }
    } catch {
      this.sound = null;
    }
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
      if (this.sound) {
        await this.sound.setVolumeAsync(muted ? 0 : this.status.volume);
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
      if (this.sound && !this.status.isMuted) {
        await this.sound.setVolumeAsync(v);
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
