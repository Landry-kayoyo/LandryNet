import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { Reveal } from '@/components/reveal';
import { fieldNotes, collagePhotos } from '@/lib/data';

// ---------------------------------------------------------------------------
// DiplomaCollage
// ---------------------------------------------------------------------------
export function DiplomaCollage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const activePhoto = collagePhotos[selectedIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSelectedIndex((current) => (current + 1) % collagePhotos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <div className="diploma-card">
        <div
          className="diploma-main-frame"
          onClick={() => setIsExpanded(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsExpanded(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Agrandir ${activePhoto.label}`}
        >
          <img
            src={activePhoto.image}
            alt={activePhoto.label}
            width="700"
            height="850"
            loading="lazy"
            decoding="async"
          />
          <div className="diploma-main-caption">
            <strong>{activePhoto.label}</strong>
            <p>{activePhoto.description}</p>
          </div>
        </div>
        <div className="diploma-mini-gallery">
          {collagePhotos.map((photo, index) => (
            <button
              key={photo.label}
              type="button"
              className={`diploma-mini ${index === selectedIndex ? 'is-selected' : ''}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Afficher ${photo.label}`}
              aria-pressed={index === selectedIndex}
            >
              <img src={photo.image} alt={photo.label} loading="lazy" decoding="async" />
              <span>{photo.label}</span>
            </button>
          ))}
        </div>
      </div>
      {isExpanded && (
        <div
          className="diploma-lightbox"
          onClick={() => setIsExpanded(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="diploma-lightbox-close"
            aria-label="Fermer l'image"
            onClick={() => setIsExpanded(false)}
          >
            ×
          </button>
          <img src={activePhoto.image} alt={activePhoto.label} />
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// FieldNote
// ---------------------------------------------------------------------------
function FieldNote({
  note,
  index,
}: {
  note: (typeof fieldNotes)[number];
  index: number;
}) {
  const noteRef = useRef<HTMLElement>(null);
  const isInView = useInView(noteRef, { amount: 0.35 });

  return (
    <Reveal
      delay={index * 0.06}
      className={`field-note ${note.className} ${isInView ? 'is-in-view' : ''}`}
    >
      <figure ref={noteRef}>
        <img
          src={note.image}
          alt={`${note.title} - Landry Kayoyo, expert en infrastructure IT et réseaux`}
          width="1200"
          height="800"
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          <span>
            {note.number} / {note.label}
          </span>
          <strong>{note.title}</strong>
        </figcaption>
      </figure>
      <p>{note.description}</p>
    </Reveal>
  );
}

// ---------------------------------------------------------------------------
// FieldNotesCarousel
// ---------------------------------------------------------------------------
export function FieldNotesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % fieldNotes.length);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  return (
    <>
      <div className="field-notes">
        {fieldNotes.map((note, index) => (
          <div
            key={note.number}
            className={`field-note-slide ${index === activeIndex ? 'is-active' : ''}`}
            onClick={() => setActiveIndex((index + 1) % fieldNotes.length)}
          >
            <FieldNote note={note} index={index} />
          </div>
        ))}
      </div>
      <div className="field-notes-controls" aria-label="Choisir une image du terrain">
        {fieldNotes.map((note, index) => (
          <button
            key={note.number}
            type="button"
            className={index === activeIndex ? 'is-active' : ''}
            aria-label={`Afficher ${note.title}`}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </>
  );
}
