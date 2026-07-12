import { requireNativeModule } from "expo-modules-core";

export type AgeRangeStatus = "adult" | "not_adult" | "declined" | "unavailable";

export type AgeRangeResult = {
  status: AgeRangeStatus;
  source: string;
  lowerBound?: number;
  upperBound?: number;
  message?: string;
};

type NativeAgeRange = {
  isAvailableAsync(): Promise<boolean>;
  requestAdultRangeAsync(): Promise<AgeRangeResult>;
};

function loadNative(): NativeAgeRange | null {
  try {
    return requireNativeModule<NativeAgeRange>("LitmoAgeRange");
  } catch {
    return null;
  }
}

const native = loadNative();

export const litmoAgeRange = {
  async isAvailable(): Promise<boolean> {
    if (!native) return false;
    try {
      return await native.isAvailableAsync();
    } catch {
      return false;
    }
  },
  async requestAdultRange(): Promise<AgeRangeResult> {
    if (!native) {
      return {
        status: "unavailable",
        source: "apple_declared_age_range",
        message:
          "Age range requires an iOS development build with the LitmoAgeRange module (not Expo Go).",
      };
    }
    return native.requestAdultRangeAsync();
  },
};
