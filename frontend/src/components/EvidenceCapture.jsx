import { useEffect, useRef, useState } from 'react';

const MAX_PHOTOS = 10, MAX_VIDEOS = 2, PHOTO_MB = 5, VIDEO_MB = 50;

export default function EvidenceCapture({ onChange }) {
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [cam, setCam] = useState(false);
  const [rec, setRec] = useState(false);
  const [error, setError] = useState('');
  const video = useRef(); const stream = useRef(); const recorder = useRef(); const chunks = useRef([]);
  const pIn = useRef(); const vIn = useRef();

  const push = (p, v) => { setPhotos(p); setVideos(v); onChange({ photos: p, videos: v }); };
  const addPhotos = (files) => {
    const ok = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) { setError('Photos must be image files'); continue; }
      if (f.size > PHOTO_MB * 1048576) { setError(`${f.name}: photos must be ${PHOTO_MB} MB or smaller`); continue; }
      ok.push(f);
    }
    if (photos.length + ok.length > MAX_PHOTOS) return setError(`Maximum ${MAX_PHOTOS} photos`);
    if (ok.length) { setError(''); push([...photos, ...ok], videos); }
  };
  const addVideos = (files) => {
    const ok = [];
    for (const f of files) {
      if (!f.type.startsWith('video/')) { setError('Videos must be video files'); continue; }
      if (f.size > VIDEO_MB * 1048576) { setError(`${f.name}: videos must be ${VIDEO_MB} MB or smaller`); continue; }
      ok.push(f);
    }
    if (videos.length + ok.length > MAX_VIDEOS) return setError(`Maximum ${MAX_VIDEOS} videos`);
    if (ok.length) { setError(''); push(photos, [...videos, ...ok]); }
  };

  const stopCam = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; setCam(false); setRec(false); };
  useEffect(() => stopCam, []);

  const openCam = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) return setError('Camera needs HTTPS or localhost and a supported browser');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
    } catch {
      try { stream.current = await navigator.mediaDevices.getUserMedia({ video: true }); }
      catch { return setError('Could not access the camera. Check browser permissions.'); }
    }
    setCam(true);
    setTimeout(() => { if (video.current) { video.current.srcObject = stream.current; video.current.play(); } }, 0);
  };
  const snap = () => {
    const v = video.current; if (!v?.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((b) => b && addPhotos([new File([b], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })]), 'image/jpeg', 0.85);
  };
  const startRec = () => {
    if (typeof MediaRecorder === 'undefined') return setError('Video recording is not supported in this browser. Upload a video instead.');
    chunks.current = [];
    recorder.current = new MediaRecorder(stream.current);
    recorder.current.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    recorder.current.onstop = () => {
      const type = recorder.current.mimeType || 'video/webm';
      addVideos([new File(chunks.current, `clip-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type: type.split(';')[0] })]);
    };
    recorder.current.start(); setRec(true);
  };
  const stopRec = () => { recorder.current?.stop(); setRec(false); };

  return (
    <div className="evidence">
      <div className="row wrap">
        <button type="button" className="btn ghost" onClick={() => pIn.current.click()}>+ Photos</button>
        <button type="button" className="btn ghost" onClick={() => vIn.current.click()}>+ Videos</button>
        {cam ? <button type="button" className="btn ghost" onClick={stopCam}>Close camera</button> : <button type="button" className="btn ghost" onClick={openCam}>Use camera</button>}
        <input ref={pIn} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos([...e.target.files]); e.target.value = ''; }} />
        <input ref={vIn} type="file" accept="video/mp4,video/webm,video/quicktime" multiple hidden onChange={(e) => { addVideos([...e.target.files]); e.target.value = ''; }} />
      </div>
      {cam && (
        <div className="cam">
          <video ref={video} playsInline muted />
          <div className="row">
            <button type="button" className="btn" onClick={snap}>Capture photo</button>
            {rec ? <button type="button" className="btn danger" onClick={stopRec}>■ Stop recording</button> : <button type="button" className="btn ghost" onClick={startRec}>● Record video</button>}
          </div>
        </div>
      )}
      <p className="muted small">Up to {MAX_PHOTOS} photos ({PHOTO_MB} MB each) and {MAX_VIDEOS} videos ({VIDEO_MB} MB each).</p>
      <div className="thumbs">
        {photos.map((f, i) => (
          <div key={i} className="thumb"><img src={URL.createObjectURL(f)} alt="" /><button type="button" onClick={() => push(photos.filter((_, j) => j !== i), videos)}>×</button></div>
        ))}
        {videos.map((f, i) => (
          <div key={i} className="thumb"><video src={URL.createObjectURL(f)} /><span className="tag">VIDEO</span><button type="button" onClick={() => push(photos, videos.filter((_, j) => j !== i))}>×</button></div>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
