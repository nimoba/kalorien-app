'use client'; // ⬅️ GANZ oben!
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useEffect } from "react";



interface Props {
  onDetected: (code: string) => void;
}

export default function BarcodeScanner({ onDetected }: Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("scanner", {
        fps: 10,
        qrbox: { width: 350, height: 100 }, // 👈 rechteckiger Bereich
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      }, false);
      
      

    scanner.render(
      (decodedText) => {
        onDetected(decodedText);
        scanner.clear().catch(console.error);
      },
      (error) => {
        console.log("Scanner-Fehler:", error); // vorher: console.warn
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onDetected]);

  return <div id="scanner" style={{ width: "100%" }} />;
}
