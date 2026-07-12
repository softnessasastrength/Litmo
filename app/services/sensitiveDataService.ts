import { litmoPasskeys } from "../modules/litmo-passkeys";
import { createSensitiveDataService } from "./sensitiveDataServiceCore.ts";

export const sensitiveDataService = createSensitiveDataService(litmoPasskeys);
