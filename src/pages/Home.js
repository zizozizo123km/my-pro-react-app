import { useEffect, useRef, useState } from 'react';
import { Upload, Play, Download, Sparkles, Image as ImageIcon, SlidersHorizontal, RotateCcw, CheckCircle2, Info } from 'lucide-react';

const motions = [
  { id: 'zoom', label: 'تقريب سينمائي', detail: 'تكبير هادئ مع حركة جانبية' },
  { id: 'pan', label: 'بانوراما ناعمة', detail: 'تحريك أفقي لطيف للصورة' },
  { id: 'float', label: 'طفو خفيف', detail: 'حركة ذهاب وإياب هادئة' },
];

function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

export default function Home() {
  const [imageUrl, setImageUrl] = useState(null);
  const [fileName, setFileName] = useState('لم تُرفع صورة بعد');
  const [motion, setMotion] = useState('zoom');
  const [duration, setDuration] = useState(5);
  const [intensity, setIntensity] = useState(48);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); if (videoUrl) URL.revokeObjectURL(videoUrl); }, [imageUrl, videoUrl]);
  const onFile = (file) => { if (!file || !file.type.startsWith('image/')) return; if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(file)); setFileName(file.name); setVideoUrl(null); setProgress(0); };
  const handleDrop = (event) => { event.preventDefault(); onFile(event.dataTransfer.files?.[0]); };

  const renderVideo = async () => {
    if (!imageUrl || isRendering) return;
    setIsRendering(true); setVideoUrl(null); setProgress(0);
    const image = new Image(); image.src = imageUrl; await new Promise((resolve) => { image.onload = resolve; });
    const canvas = document.createElement('canvas'); const width = 720; const height = Math.round(width * (image.height / image.width));
    canvas.width = Math.min(width, 900); canvas.height = Math.min(height, 1280);
    const context = canvas.getContext('2d'); const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: 'video/webm;codecs=vp9' }); const chunks = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    recorder.onstop = () => { setVideoUrl(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }))); setIsRendering(false); setProgress(100); };
    const totalFrames = duration * 30; let frame = 0; recorder.start();
    const draw = () => {
      const t = frame / totalFrames; const eased = easeInOut(t); const amount = intensity / 100; let scale = 1 + amount * 0.14; let x = 0; let y = 0;
      if (motion === 'zoom') { scale = 1 + amount * 0.16 * eased; x = -amount * 16 * eased; y = -amount * 8 * eased; }
      else if (motion === 'pan') { scale = 1 + amount * 0.1; x = (eased - 0.5) * amount * 44; }
      else { scale = 1 + amount * 0.08; y = Math.sin(t * Math.PI * 2) * amount * 18; x = Math.cos(t * Math.PI * 2) * amount * 10; }
      const ratio = Math.max(canvas.width / image.width, canvas.height / image.height) * scale; const drawWidth = image.width * ratio; const drawHeight = image.height * ratio;
      context.fillStyle = '#111827'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, (canvas.width - drawWidth) / 2 + x, (canvas.height - drawHeight) / 2 + y, drawWidth, drawHeight);
      frame += 1; setProgress(Math.round((frame / totalFrames) * 100)); if (frame < totalFrames) requestAnimationFrame(draw); else setTimeout(() => recorder.stop(), 120);
    }; draw();
  };

  return <main className="app-shell" dir="rtl">
    <nav className="topbar"><div className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>حرّكها</span></div><div className="nav-note"><span className="status-dot" /> يعمل محليًا في متصفحك</div></nav>
    <section className="hero container"><div className="eyebrow"><span>أداة تحريك الصور</span><span className="eyebrow-line" /></div><h1>حوّل صورتك الساكنة<br /><em>إلى لحظة تتحرك.</em></h1><p className="hero-copy">اصنع حركة سينمائية ناعمة من صورة واحدة. ارفع، اضبط، وشاهد النتيجة — دون رفع صورتك إلى أي خادم.</p></section>
    <section className="workspace container">
      <div className="stage-card"><div className="card-label"><span>المعاينة</span><span className="label-muted">{isRendering ? `جاري التصدير ${progress}%` : '720 × 1280'}</span></div><div className={`preview ${imageUrl ? 'has-image' : ''}`}>
        {imageUrl ? <img src={imageUrl} alt="معاينة الصورة" className={`preview-image motion-${motion}`} style={{ '--motion-speed': `${duration}s`, '--motion-intensity': `${intensity / 100}` }} /> : <div className="empty-preview"><div className="empty-icon"><ImageIcon size={25} /></div><strong>ستظهر صورتك هنا</strong><span>النتيجة ستكون فيديو قصيرًا بصيغة WebM</span></div>}
        {isRendering && <div className="render-overlay"><div className="spinner" /><span>يتم تجهيز الفيديو...</span></div>}</div><div className="preview-footer"><span><CheckCircle2 size={15} /> معالجة محلية وآمنة</span><span>بدون حساب</span></div></div>
      <aside className="control-card"><div className="card-heading"><div><span className="section-kicker">ابدأ من هنا</span><h2>أنشئ حركة</h2></div><SlidersHorizontal size={20} /></div>
        <div className="control-section"><label className="field-label">الصورة</label><div className="upload-zone" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} role="button" tabIndex="0"><input ref={inputRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} hidden /><div className="upload-icon"><Upload size={18} /></div><div><strong>{fileName === 'لم تُرفع صورة بعد' ? 'اسحب صورتك هنا' : fileName}</strong><span>{fileName === 'لم تُرفع صورة بعد' ? 'أو انقر للاختيار من جهازك' : 'انقر لاستبدال الصورة'}</span></div></div></div>
        <div className="control-section"><label className="field-label">أسلوب الحركة</label><div className="motion-list">{motions.map((item) => <button key={item.id} className={`motion-option ${motion === item.id ? 'selected' : ''}`} onClick={() => setMotion(item.id)}><span className="motion-radio" /><span><strong>{item.label}</strong><small>{item.detail}</small></span></button>)}</div></div>
        <div className="control-section sliders"><div className="slider-row"><label className="field-label">المدة</label><output>{duration} ثوانٍ</output></div><input type="range" min="3" max="8" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div><div className="control-section sliders"><div className="slider-row"><label className="field-label">قوة الحركة</label><output>{intensity}%</output></div><input type="range" min="10" max="90" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} /></div>
        <button className="primary-button" onClick={renderVideo} disabled={!imageUrl || isRendering}><Play size={17} fill="currentColor" /> {isRendering ? 'جاري الإنشاء...' : 'إنشاء الفيديو'}</button>{videoUrl && <a className="download-button" href={videoUrl} download="harrekha-motion.webm"><Download size={16} /> تنزيل الفيديو</a>}<div className="info-note"><Info size={15} /><span>هذه نسخة خفيفة تعمل داخل المتصفح. لنتائج توليدية بالذكاء الاصطناعي، صِل نقطة استدلال GPU مثل LTX-Video أو Stable Video Diffusion.</span></div>
      </aside>
    </section>
    <footer className="container footer"><span>حرّكها / استوديو الصور المتحركة</span><button onClick={() => { setImageUrl(null); setVideoUrl(null); setFileName('لم تُرفع صورة بعد'); setProgress(0); }}><RotateCcw size={14} /> إعادة ضبط</button><span>خصوصيتك أولًا — الصور لا تغادر جهازك</span></footer>
  </main>;
}
