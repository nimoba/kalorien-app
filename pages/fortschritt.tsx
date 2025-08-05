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
  const [overlayOpacity, setOverlayOpacity] = useState(1.0);
  const [showGrid, setShowGrid] = useState(true);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photosLoading, setPhotosLoading] = useState(false);
  
  // Gallery view states
  const [galleryView, setGalleryView] = useState<'grid' | 'compare' | 'timeline' | 'flipbook'>('grid');
  const [comparePhotos, setComparePhotos] = useState<[CapturedPhoto | null, CapturedPhoto | null]>([null, null]);
  const [flipbookSpeed, setFlipbookSpeed] = useState(500); // milliseconds per frame
  const [isFlipbookPlaying, setIsFlipbookPlaying] = useState(false);
  const [flipbookIndex, setFlipbookIndex] = useState(0);
  const [selectedPoseFilter, setSelectedPoseFilter] = useState<PoseType | 'all'>('all');
  const [selectingPhotoFor, setSelectingPhotoFor] = useState<0 | 1 | null>(null);
  const [videoRotation, setVideoRotation] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flipbookIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth status on page load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load photos from Google Drive when authenticated and in gallery mode
  useEffect(() => {
    if (isAuthenticated && !authLoading && currentMode === 'gallery') {
      loadPhotosFromDrive();
    }
  }, [isAuthenticated, authLoading, currentMode]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
    setAuthLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google-login');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      alert('Login fehlgeschlagen');
    }
  };

  const loadPhotosFromDrive = async () => {
    try {
      setPhotosLoading(true);
      console.log('Loading photos from Google Drive...');
      const response = await fetch('/api/get-progress-photos');
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error('Failed to fetch photos');
      }
      
      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        // Convert timestamps to Date objects and merge with existing photos
        const drivePhotos = data.photos.map((photo: {
          id: string;
          pose: PoseType;
          dataUrl: string;
          timestamp: string;
          name?: string;
        }) => ({
          ...photo,
          timestamp: new Date(photo.timestamp)
        }));
        
        // Merge with existing photos (avoid duplicates based on ID)
        setCapturedPhotos(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPhotos = drivePhotos.filter((p: CapturedPhoto) => !existingIds.has(p.id));
          return [...prev, ...newPhotos];
        });
        
        console.log(`Loaded ${data.photos.length} photos from Google Drive`);
      }
    } catch (error) {
      console.error('Error loading photos from Drive:', error);
    } finally {
      setPhotosLoading(false);
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
    
    // Upload zu Google Drive via OAuth
    try {
      setIsCapturing(true); // Zeige Upload-Status
      
      const response = await fetch('/api/upload-progress-photo-oauth', {
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
        alert(`📸 ${selectedPose.toUpperCase()}-Foto erfolgreich in deinem Google Drive gespeichert!`);
      } else {
        console.error('Upload-Fehler:', result);
        if (response.status === 401) {
          alert('Google Login abgelaufen. Bitte neu anmelden.');
          setIsAuthenticated(false);
        } else {
          alert(`📸 Foto aufgenommen, aber Upload-Fehler: ${result.error}`);
        }
      }
    } catch (uploadError) {
      console.error('Upload-Fehler:', uploadError);
      alert('📸 Foto aufgenommen, aber Upload zu Google Drive fehlgeschlagen');
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

  // Flipbook effect
  useEffect(() => {
    if (isFlipbookPlaying && capturedPhotos.length > 0) {
      const filteredPhotos = selectedPoseFilter === 'all' 
        ? capturedPhotos 
        : capturedPhotos.filter(p => p.pose === selectedPoseFilter);
      
      if (filteredPhotos.length > 0) {
        flipbookIntervalRef.current = setInterval(() => {
          setFlipbookIndex((prev) => (prev + 1) % filteredPhotos.length);
        }, flipbookSpeed);
      }
    } else {
      if (flipbookIntervalRef.current) {
        clearInterval(flipbookIntervalRef.current);
        flipbookIntervalRef.current = null;
      }
    }
    
    return () => {
      if (flipbookIntervalRef.current) {
        clearInterval(flipbookIntervalRef.current);
      }
    };
  }, [isFlipbookPlaying, flipbookSpeed, capturedPhotos, selectedPoseFilter]);

  // Kamera starten wenn Camera-Mode aktiviert
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      if (currentMode === 'camera' && isAuthenticated && !authLoading && mounted) {
        console.log('📷 Initializing camera...');
        setCameraError(null);
        
        try {
          // Request camera with front camera - let browser handle orientation
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user' // Front camera, no specific dimensions
            },
            audio: false
          });
          
          if (mounted) {
            setStream(mediaStream);
            
            // Wait for video element to be ready
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              
              // Wait for metadata to load before playing
              videoRef.current.onloadedmetadata = async () => {
                try {
                  if (!videoRef.current) return;
                  
                  await videoRef.current.play();
                  
                  // Check if video is landscape and needs rotation
                  const videoWidth = videoRef.current.videoWidth;
                  const videoHeight = videoRef.current.videoHeight;
                  console.log(`📐 Video dimensions: ${videoWidth}x${videoHeight}`);
                  
                  // If width > height, video is in landscape, rotate it
                  if (videoWidth > videoHeight) {
                    console.log('🔄 Video is landscape, rotating to portrait');
                    setVideoRotation(90);
                  } else {
                    setVideoRotation(0);
                  }
                  
                  console.log('✅ Camera started successfully');
                } catch (err) {
                  console.error('Play error:', err);
                  setCameraError('Fehler beim Starten der Kamera. Bitte versuche es erneut.');
                }
              };
            }
          } else {
            // Component unmounted während wir warteten
            mediaStream.getTracks().forEach(track => track.stop());
          }
        } catch (error) {
          if (mounted) {
            console.error('❌ Camera error:', error);
            let errorMessage = 'Kamera-Fehler: ';
            if (error instanceof Error) {
              if (error.name === 'NotAllowedError') {
                errorMessage += 'Kamera-Zugriff wurde verweigert. Bitte erlaube den Zugriff in deinen Browser-Einstellungen.';
              } else if (error.name === 'NotFoundError') {
                errorMessage += 'Keine Kamera gefunden.';
              } else {
                errorMessage += error.message;
              }
            } else {
              errorMessage += 'Unbekannter Fehler';
            }
            setCameraError(errorMessage);
          }
        }
      }
    };
    
    if (currentMode === 'camera') {
      initCamera();
    }
    
    // Cleanup when switching away from camera or unmounting
    return () => {
      mounted = false;
      if (stream) {
        console.log('🧹 Cleaning up camera stream');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [currentMode, isAuthenticated, authLoading]); // stream removed from dependencies to prevent flickering

  // Pose-Overlay Komponente mit echten Bildern
  const PoseOverlay = ({ pose, opacity }: { pose: PoseType; opacity: number }) => {
    const poseImage = pose === 'vorn' ? '/images/pose-vorn.png' : 
                     pose === 'seite' ? '/images/pose-seite.png' : 
                     '/images/pose-hinten.png';
    
    return (
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: opacity
        }}
      >
        <img 
          src={poseImage}
          alt={`Pose ${pose}`}
          style={{
            width: '95%',
            height: '95%',
            objectFit: 'contain',
            filter: 'brightness(1.5) contrast(0.7)',
            mixBlendMode: 'screen'
          }}
        />
      </div>
    );
  };

  // Grid-Overlay
  const GridOverlay = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 5
    }}>
      <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
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
      {/* Auth Check Loading */}
      {authLoading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <div>Prüfe Google Drive Berechtigung...</div>
        </div>
      )}

      {/* Not Authenticated */}
      {!authLoading && !isAuthenticated && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 24,
          padding: 24
        }}>
          <div style={{ fontSize: 64 }}>🔐</div>
          <h2 style={{ margin: 0, textAlign: 'center' }}>
            Google Drive Berechtigung erforderlich
          </h2>
          <p style={{ 
            textAlign: 'center', 
            color: '#ccc',
            maxWidth: 400,
            lineHeight: 1.5
          }}>
            Um deine Fortschrittsbilder in deinem persönlichen Google Drive zu speichern, 
            musst du dich zuerst mit Google anmelden.
          </p>
          <button
            onClick={handleGoogleLogin}
            style={{
              backgroundColor: '#4285f4',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            🚀 Mit Google anmelden
          </button>
        </div>
      )}

      {/* Authenticated Content */}
      {!authLoading && isAuthenticated && (
        <>
          {/* Header - NICHT animiert */}
          <div style={{
            padding: '24px 24px 16px 24px',
            borderBottom: '1px solid #444',
            position: 'relative',
            zIndex: 100,
            backgroundColor: '#2c2c2c'
          }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>
              📸 Fortschrittsbilder
            </h1>
        
            {/* Mode Toggle - NICHT animiert */}
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
            <div style={{ 
              padding: '0 24px 24px',
              position: 'relative',
              zIndex: 50
            }}>
              {/* Kamera Fehler Anzeige */}
              {cameraError && (
                <div style={{
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                  textAlign: 'center'
                }}>
                  ❌ {cameraError}
                  <br />
                  <button
                    onClick={() => {
                      setCameraError(null);
                      setCurrentMode('gallery');
                      setTimeout(() => setCurrentMode('camera'), 100);
                    }}
                    style={{
                      marginTop: 8,
                      backgroundColor: 'transparent',
                      border: '1px solid #fff',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Erneut versuchen
                  </button>
                </div>
              )}

              {/* Pose Selection - NICHT animiert */}
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

              {/* Camera Controls - NICHT animiert */}
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

              {/* Camera View - FESTE Positionierung */}
              <div style={{
                position: 'relative',
                backgroundColor: '#000',
                borderRadius: 12,
                overflow: 'hidden',
                aspectRatio: '9/16',
                marginBottom: 20,
                border: '2px solid #444',
                maxWidth: '100%',
                margin: '0 auto 20px'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: videoRotation === 90 ? '177.78%' : '100%', // 16/9 aspect ratio when rotated
                    height: videoRotation === 90 ? '177.78%' : '100%',
                    objectFit: 'cover',
                    backgroundColor: '#000',
                    display: stream ? 'block' : 'none', // Show only when stream is ready
                    transform: videoRotation === 90 ? 'rotate(90deg) scale(0.5625)' : 'none',
                    transformOrigin: 'center center',
                    position: videoRotation === 90 ? 'absolute' : 'static',
                    top: videoRotation === 90 ? '50%' : 'auto',
                    left: videoRotation === 90 ? '50%' : 'auto',
                    marginTop: videoRotation === 90 ? '-88.89%' : '0',
                    marginLeft: videoRotation === 90 ? '-88.89%' : '0'
                  }}
                />
                
                {/* Kamera nicht bereit Overlay */}
                {!stream && !cameraError && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: '#ccc'
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
                    <div>Kamera wird gestartet...</div>
                  </div>
                )}
                
                {/* Overlays nur wenn Kamera läuft */}
                {stream && (
                  <>
                    {showGrid && <GridOverlay />}
                    <PoseOverlay pose={selectedPose} opacity={overlayOpacity} />
                  </>
                )}

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

              {/* Capture Buttons - NICHT animiert */}
              <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center'
              }}>
                <button
                  onClick={startCountdown}
                  disabled={!stream || countdown !== null || cameraError !== null || isCapturing}
                  style={{
                    backgroundColor: '#36a2eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '16px 24px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: (!stream || countdown !== null || cameraError || isCapturing) ? 'not-allowed' : 'pointer',
                    opacity: (!stream || countdown !== null || cameraError || isCapturing) ? 0.5 : 1,
                    flex: 1,
                    maxWidth: 200,
                    transition: 'opacity 0.2s'
                  }}
                >
                  ⏱️ Timer (10s)
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!stream || countdown !== null || cameraError !== null || isCapturing}
                  style={{
                    backgroundColor: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '16px 24px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: (!stream || countdown !== null || cameraError || isCapturing) ? 'not-allowed' : 'pointer',
                    opacity: (!stream || countdown !== null || cameraError || isCapturing) ? 0.5 : 1,
                    flex: 1,
                    maxWidth: 200,
                    transition: 'opacity 0.2s'
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
              {photosLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#888'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#ccc' }}>
                    Lade Fotos von Google Drive...
                  </h3>
                </div>
              ) : capturedPhotos.length === 0 ? (
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
                  {/* View Mode Selector */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                    backgroundColor: '#1e1e1e',
                    padding: 4,
                    borderRadius: 8
                  }}>
                    {(['grid', 'compare', 'timeline', 'flipbook'] as const).map(view => (
                      <button
                        key={view}
                        onClick={() => setGalleryView(view)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: galleryView === view ? '#36a2eb' : 'transparent',
                          color: galleryView === view ? '#fff' : '#ccc',
                          fontSize: 13,
                          fontWeight: galleryView === view ? 'bold' : 'normal',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {view === 'grid' && '📷 Übersicht'}
                        {view === 'compare' && '🔍 Vergleich'}
                        {view === 'timeline' && '📅 Timeline'}
                        {view === 'flipbook' && '🎬 Animation'}
                      </button>
                    ))}
                  </div>

                  {/* Pose Filter */}
                  {(galleryView === 'timeline' || galleryView === 'flipbook') && (
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 16
                    }}>
                      {(['all', 'vorn', 'seite', 'hinten'] as const).map(pose => (
                        <button
                          key={pose}
                          onClick={() => setSelectedPoseFilter(pose)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid',
                            borderColor: selectedPoseFilter === pose ? '#36a2eb' : '#444',
                            backgroundColor: selectedPoseFilter === pose ? '#36a2eb22' : 'transparent',
                            color: selectedPoseFilter === pose ? '#36a2eb' : '#ccc',
                            fontSize: 12,
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                          }}
                        >
                          {pose === 'all' ? 'Alle' : pose}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Grid View */}
                  {galleryView === 'grid' && (
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
                            border: '1px solid #444',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (comparePhotos[0] === null) {
                              setComparePhotos([photo, null]);
                              setGalleryView('compare');
                            }
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
                  )}

                  {/* Compare View */}
                  {galleryView === 'compare' && (
                    <div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 16,
                        marginBottom: 16
                      }}>
                        {[0, 1].map(index => (
                          <div key={index} style={{
                            backgroundColor: '#1e1e1e',
                            borderRadius: 8,
                            padding: 12,
                            border: '2px solid #444'
                          }}>
                            <div style={{
                              fontSize: 12,
                              color: '#888',
                              marginBottom: 8,
                              textAlign: 'center'
                            }}>
                              {index === 0 ? 'Vorher' : 'Nachher'}
                            </div>
                            {comparePhotos[index] ? (
                              <div>
                                <img
                                  src={comparePhotos[index]!.dataUrl}
                                  alt={`${comparePhotos[index]!.pose}`}
                                  style={{
                                    width: '100%',
                                    aspectRatio: '9/16',
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    marginBottom: 8,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => setSelectingPhotoFor(index as 0 | 1)}
                                />
                                <div style={{
                                  textAlign: 'center',
                                  fontSize: 11,
                                  color: '#ccc'
                                }}>
                                  {comparePhotos[index]!.pose} • {comparePhotos[index]!.timestamp.toLocaleDateString('de-DE')}
                                </div>
                                <button
                                  onClick={() => {
                                    const newCompare: [CapturedPhoto | null, CapturedPhoto | null] = [...comparePhotos];
                                    newCompare[index] = null;
                                    setComparePhotos(newCompare);
                                  }}
                                  style={{
                                    marginTop: 8,
                                    width: '100%',
                                    padding: '6px',
                                    backgroundColor: '#333',
                                    color: '#ccc',
                                    border: 'none',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ❌ Entfernen
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  aspectRatio: '9/16',
                                  backgroundColor: '#0a0a0a',
                                  borderRadius: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'column',
                                  gap: 8,
                                  cursor: 'pointer',
                                  border: '2px dashed #444'
                                }}
                                onClick={() => setSelectingPhotoFor(index as 0 | 1)}
                              >
                                <div style={{ fontSize: 32 }}>➕</div>
                                <div style={{ fontSize: 12, color: '#888' }}>Foto wählen</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Photo Selector Modal */}
                      {selectingPhotoFor !== null && (
                        <div style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          zIndex: 1000,
                          display: 'flex',
                          flexDirection: 'column',
                          padding: 20
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20
                          }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>
                              Foto für {selectingPhotoFor === 0 ? 'Vorher' : 'Nachher'} auswählen
                            </h3>
                            <button
                              onClick={() => setSelectingPhotoFor(null)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: 24,
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                          
                          <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: 12
                          }}>
                            {capturedPhotos.map(photo => (
                              <div
                                key={photo.id}
                                onClick={() => {
                                  const newCompare: [CapturedPhoto | null, CapturedPhoto | null] = [...comparePhotos];
                                  newCompare[selectingPhotoFor] = photo;
                                  setComparePhotos(newCompare);
                                  setSelectingPhotoFor(null);
                                }}
                                style={{
                                  cursor: 'pointer',
                                  border: '2px solid transparent',
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  transition: 'border-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#36a2eb';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'transparent';
                                }}
                              >
                                <img
                                  src={photo.dataUrl}
                                  alt={`${photo.pose}`}
                                  style={{
                                    width: '100%',
                                    height: 150,
                                    objectFit: 'cover'
                                  }}
                                />
                                <div style={{
                                  padding: 4,
                                  backgroundColor: '#1e1e1e',
                                  fontSize: 10,
                                  textAlign: 'center',
                                  color: '#ccc'
                                }}>
                                  {photo.pose}<br />
                                  {photo.timestamp.toLocaleDateString('de-DE')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setComparePhotos([null, null])}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 14,
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Vergleich zurücksetzen
                      </button>
                    </div>
                  )}

                  {/* Timeline View */}
                  {galleryView === 'timeline' && (
                    <div style={{
                      display: 'flex',
                      overflowX: 'auto',
                      gap: 16,
                      padding: '16px 0',
                      backgroundColor: '#1e1e1e',
                      borderRadius: 8
                    }}>
                      {(selectedPoseFilter === 'all' 
                        ? capturedPhotos 
                        : capturedPhotos.filter(p => p.pose === selectedPoseFilter)
                      ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).map((photo) => (
                        <div
                          key={photo.id}
                          style={{
                            flexShrink: 0,
                            textAlign: 'center'
                          }}
                        >
                          <div style={{
                            fontSize: 10,
                            color: '#888',
                            marginBottom: 8
                          }}>
                            {photo.timestamp.toLocaleDateString('de-DE')}
                          </div>
                          <img
                            src={photo.dataUrl}
                            alt={`${photo.pose}`}
                            style={{
                              width: 150,
                              height: 267,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '2px solid #444'
                            }}
                          />
                          <div style={{
                            fontSize: 11,
                            color: '#36a2eb',
                            marginTop: 8,
                            textTransform: 'capitalize'
                          }}>
                            {photo.pose}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Flipbook View */}
                  {galleryView === 'flipbook' && (
                    <div>
                      {capturedPhotos.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 16
                        }}>
                          {/* Display */}
                          <div style={{
                            backgroundColor: '#000',
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '2px solid #444',
                            maxWidth: 300
                          }}>
                            {(() => {
                              const filteredPhotos = selectedPoseFilter === 'all' 
                                ? capturedPhotos 
                                : capturedPhotos.filter(p => p.pose === selectedPoseFilter);
                              const currentPhoto = filteredPhotos[flipbookIndex % filteredPhotos.length];
                              
                              return currentPhoto ? (
                                <img
                                  src={currentPhoto.dataUrl}
                                  alt={`${currentPhoto.pose}`}
                                  style={{
                                    width: '100%',
                                    aspectRatio: '9/16',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : null;
                            })()}
                          </div>

                          {/* Controls */}
                          <div style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center'
                          }}>
                            <button
                              onClick={() => setIsFlipbookPlaying(!isFlipbookPlaying)}
                              style={{
                                padding: '12px 24px',
                                backgroundColor: isFlipbookPlaying ? '#e74c3c' : '#22c55e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {isFlipbookPlaying ? '⏸️ Pause' : '▶️ Play'}
                            </button>
                          </div>

                          {/* Speed Control */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            width: '100%',
                            maxWidth: 300
                          }}>
                            <label style={{
                              fontSize: 12,
                              color: '#ccc'
                            }}>
                              Geschwindigkeit:
                            </label>
                            <input
                              type="range"
                              min="100"
                              max="2000"
                              step="100"
                              value={flipbookSpeed}
                              onChange={(e) => setFlipbookSpeed(Number(e.target.value))}
                              style={{
                                flex: 1,
                                accentColor: '#36a2eb'
                              }}
                            />
                            <span style={{
                              fontSize: 12,
                              color: '#888',
                              minWidth: 50
                            }}>
                              {flipbookSpeed}ms
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <FloatingTabBar />
    </div>
  );
}   