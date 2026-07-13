/**
 * QR matrix generation for on-screen Litmo invites.
 * Uses the `qrcode` package pure API (no canvas/DOM required).
 */

import QRCode from "qrcode";

export type QrMatrix = {
  size: number;
  /** row-major, true = dark module */
  modules: boolean[];
};

export function buildQrMatrix(text: string, errorCorrection: "M" | "L" | "Q" | "H" = "M"): QrMatrix {
  const qr = QRCode.create(text, {
    errorCorrectionLevel: errorCorrection,
  });
  const size = qr.modules.size;
  const modules: boolean[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      modules.push(qr.modules.get(x, y) === 1);
    }
  }
  return { size, modules };
}
