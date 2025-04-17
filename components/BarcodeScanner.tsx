'use client'; // ⬅️ GANZ oben!
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

interface Props {
  onDetected: (code: string) => void;
}

export default function BarcodeScanner({ onDetected }: Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("scanner", {
      fps: 10,
      qrbox: 250,
    }, false);

    scanner.render(
      (decodedText) => {
        onDetected(decodedText);
        scanner.clear().catch(console.error);
      },
      (error) => {
        console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onDetected]);

  return <div id="scanner" style={{ width: "100%" }} />;
}
