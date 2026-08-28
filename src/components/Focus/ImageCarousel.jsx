import { useState, useEffect, useCallback, useRef } from 'react';
import { Images, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import db from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import './Focus.css';

export default function ImageCarousel() {
  const images = useLiveQuery(() => db.carouselImages.orderBy('order').toArray(), []) || [];
  const [current, setCurrent] = useState(0);
  const fileInputRef = useRef(null);

  const next = useCallback(() => {
    if (images.length === 0) return;
    setCurrent(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    if (images.length === 0) return;
    setCurrent(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-scroll every 8 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next, images.length]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      const order = images.length > 0 ? Math.max(...images.map(img => img.order)) + 1 : 0;
      await db.carouselImages.add({
        data: base64,
        order,
      });
      // Optionally reset to the newly added image
      setCurrent(images.length); 
    };
    // Resize before saving if possible, but for now we trust the user. (Ideally a canvas resize here)
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const deleteCurrent = async () => {
    if (images.length === 0) return;
    const imgToDelete = images[current];
    await db.carouselImages.delete(imgToDelete.id);
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="carousel-card glass-card" id="carousel">
      <div className="carousel-header">
        <div className="carousel-title">
          <Images size={20} className="icon" />
          Inspiration
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {images.length > 0 && (
             <button className="btn btn-ghost btn-icon" onClick={deleteCurrent} style={{ color: 'var(--accent-danger)', width: 28, height: 28, padding: 4 }}>
               <Trash2 size={14} />
             </button>
          )}
          <button className="btn btn-ghost btn-icon" onClick={() => fileInputRef.current?.click()} style={{ width: 28, height: 28, padding: 4 }}>
            <Plus size={14} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
        </div>
      </div>

      <div className="carousel-viewport">
        {images.length === 0 ? (
          <div className="carousel-slide active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', flexDirection: 'column', color: 'var(--text-muted)' }}>
            <Images size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No images added yet.</p>
            <p style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Click the + icon to add some inspiration.</p>
          </div>
        ) : (
          images.map((item, i) => (
            <div
              className={`carousel-slide ${i === current ? 'active' : ''}`}
              key={item.id}
            >
              <img src={item.data} alt="Inspiration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))
        )}
      </div>

      {images.length > 1 && (
        <div className="carousel-controls">
          <button onClick={prev} aria-label="Previous slide" id="carousel-prev">
            <ChevronLeft size={16} />
          </button>
          <div className="carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button onClick={next} aria-label="Next slide" id="carousel-next">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
