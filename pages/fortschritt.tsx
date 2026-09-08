'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
/* eslint-disable @next/next/no-img-element */
import Page, { Loading } from '../components/ui/Page';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { Segmented } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';

type PoseType = 'vorn' | 'seite' | 'hinten';

interface CapturedPhoto {
  id: string;
  pose: PoseType;
  dataUrl: string;
  timestamp: Date;
}

export default function FortschrittsFotosSeite() {
  const toast = useToast();
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
      toast.error('Login fehlgeschlagen');
    }
  };

  const loadPhotosFromDrive = async () => {
    try {
      setPhotosLoading(true);
      console.log('Loading photos from Google Drive...');
      const response = await fetch('/api/get-progress-photos');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        
        if (response.status === 401 || errorData.requiresAuth) {
          console.log('Authentication required, resetting auth state');
          setIsAuthenticated(false);
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch photos');
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
        toast.success(`${selectedPose}-Foto in Google Drive gespeichert`);
      } else {
        console.error('Upload-Fehler:', result);
        if (response.status === 401 || result.requiresAuth) {
          toast.error('Google Login abgelaufen, bitte neu anmelden');
          setIsAuthenticated(false);
          // Clear the authentication status to force re-login
          await checkAuthStatus();
        } else {
          toast.error(`Upload fehlgeschlagen: ${result.error || result.details || 'Unbekannter Fehler'}`);
        }
      }
    } catch (uploadError) {
      console.error('Upload-Fehler:', uploadError);
      toast.error('Upload zu Google Drive fehlgeschlagen');
    } finally {
      setIsCapturing(false);
    }
  }, [selectedPose, toast]);

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


  const PoseOverlay = ({ pose, opacity }: { pose: PoseType; opacity: number }) => {
    const poseImage = pose === 'vorn' ? '/images/pose-vorn.png' : pose === 'seite' ? '/images/pose-seite.png' : '/images/pose-hinten.png';
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity }}>
        <img src={poseImage} alt={`Pose ${pose}`} style={{ width: '95%', height: '95%', objectFit: 'contain', filter: 'brightness(1.5) contrast(0.7)', mixBlendMode: 'screen' }} />
      </div>
    );
  };

  const GridOverlay = () => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  );

  const filteredPhotos = (selectedPoseFilter === 'all' ? capturedPhotos : capturedPhotos.filter((p) => p.pose === selectedPoseFilter))
    .slice()
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const poseLabel = (p: PoseType | 'all') => (p === 'all' ? 'Alle' : p === 'vorn' ? 'Vorne' : p === 'seite' ? 'Seite' : 'Hinten');
  const cameraDisabled = !stream || countdown !== null || cameraError !== null || isCapturing;

  const PhotoTile = ({ photo, onClick, height = 160 }: { photo: CapturedPhoto; onClick?: () => void; height?: number }) => (
    <button onClick={onClick} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', padding: 0, cursor: onClick ? 'pointer' : 'default', textAlign: 'left' }}>
      <img src={photo.dataUrl} alt={`${photo.pose} vom ${photo.timestamp.toLocaleDateString('de-DE')}`} style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
      <div style={{ padding: '6px 8px' }} className="row-between">
        <span className="tiny" style={{ color: 'var(--accent)', fontWeight: 600 }}>{poseLabel(photo.pose)}</span>
        <span className="tiny faint">{photo.timestamp.toLocaleDateString('de-DE')}</span>
      </div>
    </button>
  );

  if (authLoading) return <Page title="Fotos"><Loading text="Prüfe Google-Drive-Berechtigung…" /></Page>;

  if (!isAuthenticated) {
    return (
      <Page title="Fotos" subtitle="Fortschrittsbilder in deinem Google Drive">
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <div className="icon-box" style={{ margin: '0 auto 14px', width: 48, height: 48, background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icon name="lock" size={22} /></div>
          <h3 className="card-title">Google Drive verbinden</h3>
          <p className="small muted" style={{ marginTop: 6, lineHeight: 1.5 }}>Die Fotos werden ausschließlich in deinem eigenen Google Drive gespeichert. Dafür ist einmalig eine Anmeldung nötig.</p>
          <Button variant="primary" size="lg" block style={{ marginTop: 18 }} icon="external" onClick={handleGoogleLogin}>Mit Google anmelden</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Fotos" subtitle={`${capturedPhotos.length} ${capturedPhotos.length === 1 ? 'Foto' : 'Fotos'}`}>
      <div className="stack">
        <Segmented value={currentMode} onChange={setCurrentMode} options={[{ value: 'gallery', label: 'Galerie', icon: 'image' }, { value: 'camera', label: 'Kamera', icon: 'camera' }]} />

        {currentMode === 'camera' && (
          <>
            {cameraError && (
              <div className="card" style={{ borderColor: 'rgba(251,113,133,0.4)' }}>
                <p className="small" style={{ color: 'var(--danger)' }}>{cameraError}</p>
                <Button size="sm" style={{ marginTop: 10 }} icon="refresh" onClick={() => { setCameraError(null); setCurrentMode('gallery'); setTimeout(() => setCurrentMode('camera'), 100); }}>Erneut versuchen</Button>
              </div>
            )}

            <Segmented value={selectedPose} onChange={setSelectedPose} options={[{ value: 'vorn', label: 'Vorne' }, { value: 'seite', label: 'Seite' }, { value: 'hinten', label: 'Hinten' }]} />

            <div className="card" style={{ padding: 12 }}>
              <div className="row" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="row-between tiny faint"><span>Pose-Overlay</span><span className="num">{Math.round(overlayOpacity * 100)} %</span></div>
                  <input type="range" className="range" min="0" max="1" step="0.1" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} style={{ margin: '6px 0 0' }} />
                </div>
                <button className={`chip ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid(!showGrid)}><Icon name="grid" size={14} /> Raster</button>
              </div>
            </div>

            <div style={{ position: 'relative', background: '#000', borderRadius: 16, overflow: 'hidden', aspectRatio: '9/16', border: '1px solid var(--border)' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: videoRotation === 90 ? '177.78%' : '100%',
                  height: videoRotation === 90 ? '177.78%' : '100%',
                  objectFit: 'cover',
                  backgroundColor: '#000',
                  display: stream ? 'block' : 'none',
                  transform: videoRotation === 90 ? 'rotate(90deg) scale(0.5625)' : 'none',
                  transformOrigin: 'center center',
                  position: videoRotation === 90 ? 'absolute' : 'static',
                  top: videoRotation === 90 ? '50%' : 'auto',
                  left: videoRotation === 90 ? '50%' : 'auto',
                  marginTop: videoRotation === 90 ? '-88.89%' : '0',
                  marginLeft: videoRotation === 90 ? '-88.89%' : '0',
                }}
              />
              {!stream && !cameraError && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-3)' }}>
                  <span className="spinner" style={{ width: 26, height: 26, color: 'var(--accent)' }} />
                  <span className="small">Kamera wird gestartet…</span>
                </div>
              )}
              {stream && (
                <>
                  {showGrid && <GridOverlay />}
                  <PoseOverlay pose={selectedPose} opacity={overlayOpacity} />
                </>
              )}
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="num"
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, fontSize: 84, fontWeight: 800, color: 'var(--accent)', textShadow: '0 0 24px rgba(0,0,0,0.6)' }}
                  >
                    {countdown === 0 ? <Icon name="camera" size={72} /> : countdown}
                  </motion.div>
                )}
              </AnimatePresence>
              {isCapturing && countdown === null && (
                <div className="badge badge-accent" style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', height: 30 }}>
                  <span className="spinner" style={{ width: 12, height: 12 }} /> Lädt in Google Drive hoch…
                </div>
              )}
            </div>

            <div className="grid-2">
              <Button size="lg" icon="clock" onClick={startCountdown} disabled={cameraDisabled}>Timer 10 s</Button>
              <Button size="lg" variant="primary" icon="camera" onClick={capturePhoto} disabled={cameraDisabled}>Aufnehmen</Button>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        )}

        {currentMode === 'gallery' && (
          photosLoading ? (
            <Loading text="Lade Fotos aus Google Drive…" />
          ) : capturedPhotos.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 28 }}>
              <div className="icon-box" style={{ margin: '0 auto 10px' }}><Icon name="camera" size={18} /></div>
              <p className="small muted">Noch keine Fotos.</p>
              <Button size="sm" style={{ marginTop: 12 }} icon="camera" onClick={() => setCurrentMode('camera')}>Erstes Foto machen</Button>
            </div>
          ) : (
            <>
              <div className="chip-row">
                {([['grid', 'Übersicht', 'grid'], ['compare', 'Vergleich', 'columns'], ['timeline', 'Timeline', 'history'], ['flipbook', 'Animation', 'film']] as const).map(([v, label, icon]) => (
                  <button key={v} className={`chip ${galleryView === v ? 'active' : ''}`} onClick={() => setGalleryView(v)}><Icon name={icon} size={14} /> {label}</button>
                ))}
              </div>

              {(galleryView === 'timeline' || galleryView === 'flipbook') && (
                <Segmented value={selectedPoseFilter} onChange={setSelectedPoseFilter} options={[{ value: 'all', label: 'Alle' }, { value: 'vorn', label: 'Vorne' }, { value: 'seite', label: 'Seite' }, { value: 'hinten', label: 'Hinten' }]} />
              )}

              {galleryView === 'grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                  {capturedPhotos.map((photo) => (
                    <PhotoTile key={photo.id} photo={photo} onClick={() => { if (comparePhotos[0] === null) { setComparePhotos([photo, null]); setGalleryView('compare'); } }} />
                  ))}
                </div>
              )}

              {galleryView === 'compare' && (
                <>
                  <div className="grid-2">
                    {[0, 1].map((index) => {
                      const photo = comparePhotos[index];
                      return (
                        <div key={index} className="card" style={{ padding: 10 }}>
                          <div className="tiny faint" style={{ textAlign: 'center', marginBottom: 8 }}>{index === 0 ? 'Vorher' : 'Nachher'}</div>
                          {photo ? (
                            <>
                              <img src={photo.dataUrl} alt={photo.pose} onClick={() => setSelectingPhotoFor(index as 0 | 1)} style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', borderRadius: 8, cursor: 'pointer', display: 'block' }} />
                              <div className="tiny faint" style={{ textAlign: 'center', marginTop: 6 }}>{poseLabel(photo.pose)} · {photo.timestamp.toLocaleDateString('de-DE')}</div>
                              <Button size="sm" variant="ghost" block style={{ marginTop: 6 }} onClick={() => { const c: [CapturedPhoto | null, CapturedPhoto | null] = [...comparePhotos]; c[index] = null; setComparePhotos(c); }}>Entfernen</Button>
                            </>
                          ) : (
                            <button onClick={() => setSelectingPhotoFor(index as 0 | 1)} style={{ width: '100%', aspectRatio: '9/16', background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 8, color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                              <Icon name="plus" size={22} /><span className="tiny">Foto wählen</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="ghost" block icon="refresh" onClick={() => setComparePhotos([null, null])}>Vergleich zurücksetzen</Button>

                  {selectingPhotoFor !== null && (
                    <div className="sheet-overlay" style={{ alignItems: 'stretch', padding: 0 }} onClick={() => setSelectingPhotoFor(null)}>
                      <div className="sheet" style={{ maxHeight: '100dvh', borderRadius: 0, maxWidth: 'none' }} onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-header">
                          <h2 className="sheet-title" style={{ flex: 1 }}>{selectingPhotoFor === 0 ? 'Vorher' : 'Nachher'} wählen</h2>
                          <button className="btn btn-ghost btn-icon" onClick={() => setSelectingPhotoFor(null)} aria-label="Schließen"><Icon name="x" /></button>
                        </div>
                        <div className="sheet-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, alignContent: 'start' }}>
                          {capturedPhotos.map((photo) => (
                            <PhotoTile key={photo.id} photo={photo} height={150} onClick={() => { const c: [CapturedPhoto | null, CapturedPhoto | null] = [...comparePhotos]; c[selectingPhotoFor] = photo; setComparePhotos(c); setSelectingPhotoFor(null); }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {galleryView === 'timeline' && (
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', overflowX: 'auto', gap: 12 }} className="hide-scrollbar">
                    {filteredPhotos.map((photo) => (
                      <div key={photo.id} style={{ flexShrink: 0, width: 150, textAlign: 'center' }}>
                        <div className="tiny faint" style={{ marginBottom: 6 }}>{photo.timestamp.toLocaleDateString('de-DE')}</div>
                        <img src={photo.dataUrl} alt={photo.pose} style={{ width: 150, height: 267, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }} />
                        <div className="tiny" style={{ color: 'var(--accent)', marginTop: 6 }}>{poseLabel(photo.pose)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {galleryView === 'flipbook' && filteredPhotos.length > 0 && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: '100%', maxWidth: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                    {(() => { const cur = filteredPhotos[flipbookIndex % filteredPhotos.length]; return cur ? <img src={cur.dataUrl} alt={cur.pose} style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }} /> : null; })()}
                  </div>
                  <div className="tiny faint">{(() => { const cur = filteredPhotos[flipbookIndex % filteredPhotos.length]; return cur ? `${poseLabel(cur.pose)} · ${cur.timestamp.toLocaleDateString('de-DE')}` : ''; })()}</div>
                  <Button variant={isFlipbookPlaying ? 'secondary' : 'primary'} icon={isFlipbookPlaying ? 'pause' : 'play'} onClick={() => setIsFlipbookPlaying(!isFlipbookPlaying)}>{isFlipbookPlaying ? 'Pause' : 'Abspielen'}</Button>
                  <div className="row" style={{ width: '100%', maxWidth: 300, gap: 10 }}>
                    <span className="tiny faint" style={{ whiteSpace: 'nowrap' }}>Tempo</span>
                    <input type="range" className="range" min="100" max="2000" step="100" value={flipbookSpeed} onChange={(e) => setFlipbookSpeed(Number(e.target.value))} style={{ margin: 0 }} />
                    <span className="tiny faint num" style={{ width: 48, textAlign: 'right' }}>{flipbookSpeed} ms</span>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </Page>
  );
}
