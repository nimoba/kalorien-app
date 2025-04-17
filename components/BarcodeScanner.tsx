'use client';
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useEffect } from "react";

interface Props {
  onDetected: (code: string) => void;
  onError?: (error: string) => void; // 👈 Fehler-Rückmeldung
}

export default function BarcodeScanner({ onDetected, onError }: Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("scanner", {
      fps: 10,
      qrbox: { width: 350, height: 100 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    }, false);

    scanner.render(
      (decodedText) => {
        onDetected(decodedText);
        scanner.clear().catch(console.error);
      },
      () => {
        // ❌ Kein Fehler-Handling → keine Aktion bei "kein Treffer"
      }
    );
    

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onDetected, onError]);

  return <div id="scanner" style={{ width: "100%" }} />;
}
