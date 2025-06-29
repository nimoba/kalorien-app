'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingTabBar from '../components/FloatingTabBar';

type PoseType = 'vorn' | 'seite' | 'hinten';

interface CapturedPhoto {
  id: string;
  pose: PoseType;
  dataUrl: string;
  timestamp: Date;
}

export default function FortschrittsFotosSeite() {
  const [currentMode, setCurrentMode] = useState<'gallery' | 'camera'>('gallery');
  const [selectedPose, setSelectedPose] = useState<PoseType>('vorn');
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  const [showGrid, setShowGrid] = useState(true);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Kamera starten
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Rückkamera bevorzugen
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('❌ Kamera-Zugriff fehlgeschlagen:', error);
      alert('Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.');
    }
  };

  // Kamera stoppen
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Foto aufnehmen
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Canvas-Größe an Video anpassen
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Video-Frame auf Canvas zeichnen
    ctx.drawImage(video, 0, 0);

    // Zu Base64 konvertieren
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const timestamp = new Date();

    // Foto lokal speichern (für sofortige Anzeige)
    const newPhoto: CapturedPhoto = {
      id: Date.now().toString(),
      pose: selectedPose,
      dataUrl,
      timestamp
    };

    setCapturedPhotos(prev => [...prev, newPhoto]);
    
    // Erfolgs-Feedback
    setIsCapturing(false);
    
    // Upload zu Google Drive
    try {
      setIsCapturing(true); // Zeige Upload-Status
      
      const response = await fetch('/api/upload-progress-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoData: dataUrl,
          pose: selectedPose,
          timestamp: timestamp.toISOString(),
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`📸 ${selectedPose.toUpperCase()}-Foto erfolgreich aufgenommen und in Google Drive gespeichert!`);
      } else {
        console.error('Upload-Fehler:', result);
        alert(`📸 Foto aufgenommen, aber Upload-Fehler: ${result.error}`);
      }
    } catch (uploadError) {
      console.error('Upload-Fehler:', uploadError);
      alert('📸 Foto aufgenommen, aber konnte nicht zu Google Drive hochgeladen werden');
    } finally {
      setIsCapturing(false);
    }
  }, [selectedPose]);

  // Countdown für Timer-Aufnahme
  const startCountdown = () => {
    setCountdown(10);
    setIsCapturing(true);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      capturePhoto();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, capturePhoto]);

  // Kamera starten wenn Camera-Mode aktiviert
  useEffect(() => {
    if (currentMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [currentMode]);

  // Pose-Overlay Komponente
  const PoseOverlay = ({ pose, opacity }: { pose: PoseType; opacity: number }) => {
    // Base64 encodierte Bilder (du musst diese durch deine echten Bilder ersetzen)
    const overlayImages = {
      vorn: '/images/pose-vorn.png', // Hier dein Vorderansicht-Bild
      seite: '/images/pose-seite.png', // Hier dein Seitenansicht-Bild  
      hinten: '/images/pose-vorn.png' // Für hinten nehmen wir erstmal vorn (später separate Datei)
    };

    return (
      <div 
        className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
        style={{
          opacity: opacity
        }}
      >
        <img 
          src={overlayImages[pose]}
          alt={`${pose} pose overlay`}
          style={{
            height: '80%', // 80% der Höhe = 10% oben + 10% unten frei
            width: 'auto', // Breite automatisch basierend auf originalen Proportionen
            objectFit: 'contain',
            filter: 'invert(1)', // Macht schwarz zu weiß
            mixBlendMode: 'screen' // Macht schwarze Bereiche transparent
          }}
        />
      </div>
    );
  };

  // Grid-Overlay
  const GridOverlay = () => (
    <div className="absolute inset-0 pointer-events-none z-5">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#ffffff" strokeWidth="0.5" opacity="0.5"/>
        <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeWidth="0.5" opacity="0.5"/>
      </svg>
    </div>
  );

  return (
    <div style={{
      backgroundColor: '#2c2c2c',
      minHeight: '100vh',
      color: '#fff',
      paddingBottom: 100
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 24px 16px 24px',
        borderBottom: '1px solid #444'
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
          📸 Fortschrittsbilder
        </h1>
        
        {/* Mode Toggle */}
        <div style={{
          marginTop: 16,
          display: 'flex',
          backgroundColor: '#1e1e1e',
          borderRadius: 12,
          padding: 4,
          border: '1px solid #444'
        }}>
          <button
            onClick={() => setCurrentMode('gallery')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: currentMode === 'gallery' ? '#36a2eb' : 'transparent',
              color: currentMode === 'gallery' ? '#fff' : '#ccc',
              fontSize: 14,
              fontWeight: currentMode === 'gallery' ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🖼️ Galerie
          </button>
          <button
            onClick={() => setCurrentMode('camera')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: currentMode === 'camera' ? '#36a2eb' : 'transparent',
              color: currentMode === 'camera' ? '#fff' : '#ccc',
              fontSize: 14,
              fontWeight: currentMode === 'camera' ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📷 Kamera
          </button>
        </div>
      </div>

      {/* Camera Mode */}
      {currentMode === 'camera' && (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Pose Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: 14,
              color: '#ccc' 
            }}>
              Pose auswählen:
            </label>
            <div style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16
            }}>
              {(['vorn', 'seite', 'hinten'] as PoseType[]).map(pose => (
                <button
                  key={pose}
                  onClick={() => setSelectedPose(pose)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    borderRadius: 8,
                    border: '2px solid',
                    borderColor: selectedPose === pose ? '#36a2eb' : '#555',
                    backgroundColor: selectedPose === pose ? '#36a2eb33' : '#1e1e1e',
                    color: selectedPose === pose ? '#36a2eb' : '#ccc',
                    fontSize: 14,
                    fontWeight: selectedPose === pose ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                >
                  {pose === 'vorn' && '🧍‍♂️'} {pose === 'seite' && '🚶‍♂️'} {pose === 'hinten' && '🕴️'}
                  <br />
                  {pose}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Controls */}
          <div style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                color: '#ccc',
                marginBottom: 4
              }}>
                Overlay Transparenz: {Math.round(overlayOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#36a2eb'
                }}
              />
            </div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #555',
                backgroundColor: showGrid ? '#36a2eb' : '#1e1e1e',
                color: showGrid ? '#fff' : '#ccc',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {showGrid ? '✅' : '⬜'} Raster
            </button>
          </div>

          {/* Camera View */}
          <div style={{
            position: 'relative',
            backgroundColor: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            aspectRatio: '9/16',
            marginBottom: 20
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* Overlays */}
            {showGrid && <GridOverlay />}
            <PoseOverlay pose={selectedPose} opacity={overlayOpacity} />

            {/* Countdown Overlay */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                    fontSize: 72,
                    fontWeight: 'bold',
                    color: '#36a2eb',
                    textShadow: '0 0 10px rgba(54, 162, 235, 0.8)'
                  }}
                >
                  {countdown === 0 ? '📸' : countdown}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Capture Status */}
            {isCapturing && countdown === null && (
              <div style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(54, 162, 235, 0.9)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 'bold'
              }}>
                ☁️ Uploading to Google Drive...
              </div>
            )}
          </div>

          {/* Capture Buttons */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center'
          }}>
            <button
              onClick={startCountdown}
              disabled={!stream || countdown !== null}
              style={{
                backgroundColor: '#36a2eb',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '16px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: (!stream || countdown !== null) ? 0.5 : 1,
                flex: 1,
                maxWidth: 200
              }}
            >
              ⏱️ Timer (10s)
            </button>
            <button
              onClick={capturePhoto}
              disabled={!stream || countdown !== null}
              style={{
                backgroundColor: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '16px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: (!stream || countdown !== null) ? 0.5 : 1,
                flex: 1,
                maxWidth: 200
              }}
            >
              📸 Sofort
            </button>
          </div>

          {/* Hidden Canvas für Foto-Aufnahme */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Gallery Mode */}
      {currentMode === 'gallery' && (
        <div style={{ padding: '0 24px 24px' }}>
          {capturedPhotos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#888'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#ccc' }}>
                Noch keine Fotos aufgenommen
              </h3>
              <p style={{ margin: 0, fontSize: 14 }}>
                Wechsle zur Kamera um dein erstes Fortschrittsfoto zu machen!
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ 
                marginBottom: 16, 
                color: '#fff',
                fontSize: 18 
              }}>
                📸 Aufgenommene Fotos ({capturedPhotos.length})
              </h3>
              
              {/* Foto Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12
              }}>
                {capturedPhotos.map(photo => (
                  <div
                    key={photo.id}
                    style={{
                      backgroundColor: '#1e1e1e',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #444'
                    }}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`${photo.pose} vom ${photo.timestamp.toLocaleDateString()}`}
                      style={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      padding: 8,
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#36a2eb',
                        textTransform: 'capitalize',
                        marginBottom: 4
                      }}>
                        {photo.pose}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: '#888'
                      }}>
                        {photo.timestamp.toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Future: Hier kommen Vergleichs-Features */}
              <div style={{
                marginTop: 32,
                padding: 20,
                backgroundColor: '#1e1e1e',
                borderRadius: 12,
                border: '2px dashed #444',
                textAlign: 'center',
                color: '#888'
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
                <div style={{ fontSize: 14, marginBottom: 4, color: '#ccc' }}>
                  Vergleichs-Features
                </div>
                <div style={{ fontSize: 12 }}>
                  Side-by-Side Vergleiche • Timeline • Progress-Videos
                  <br />
                  <em>Coming Soon...</em>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <FloatingTabBar />
    </div>
  );
}