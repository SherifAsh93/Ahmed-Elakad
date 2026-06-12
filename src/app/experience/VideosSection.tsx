'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { VideoItem } from '@/lib/content';
import InstagramEmbed from './InstagramEmbed';

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  if (/instagram\.com\/(?:p|reel|tv)\//.test(url)) return url;
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return url;
  return null;
}

function VideoCard({ video }: { video: VideoItem }) {
  const embedUrl = getEmbedUrl(video.url);
  if (!embedUrl) return null;

  const isInstagram = /instagram\.com\/(?:p|reel|tv)\//.test(video.url);
  const isDirect = /\.(mp4|webm|ogg)(\?.*)?$/i.test(video.url);

  const label = video.clientName ? (
    <div className="pt-4 px-1">
      <p className="text-[9px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-1">{video.clientName}</p>
      {video.clientSubtitle && (
        <p className="text-[9px] tracking-[2px] uppercase text-[#aaa]">{video.clientSubtitle}</p>
      )}
    </div>
  ) : null;

  if (isInstagram) {
    return <InstagramEmbed url={video.url} clientName={video.clientName} clientSubtitle={video.clientSubtitle} />;
  }

  return (
    <div className="w-full">
      <div className="bg-[#1a1a1a] overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {isDirect ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={embedUrl} controls playsInline preload="metadata" className="w-full h-full object-cover" />
        ) : (
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            loading="lazy"
            title={video.clientName || video.title || 'Client video'}
          />
        )}
      </div>
      {label}
    </div>
  );
}

export default function VideosSection({
  videos,
  title,
  subtitle,
}: {
  videos: VideoItem[];
  title: string;
  subtitle?: string;
}) {
  const valid = videos.filter(v => getEmbedUrl(v.url));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>(':scope > div');
    if (cards[index]) {
      el.scrollTo({ left: cards[index].offsetLeft - el.offsetLeft, behavior: 'smooth' });
    }
    setCurrent(index);
  }, []);

  const prev = () => scrollTo(Math.max(0, current - 1));
  const next = () => scrollTo(Math.min(valid.length - 1, current + 1));

  // Sync dot indicator with scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const cards = el.querySelectorAll<HTMLElement>(':scope > div');
      let closest = 0;
      let minDist = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - el.offsetLeft - el.scrollLeft);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setCurrent(closest);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  if (valid.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <p className="text-[7px] tracking-[4px] uppercase text-[#b3a384] mb-1">In Their Own Words</p>
        <h2 className="font-serif font-light text-[#1a1a1a] text-[15px] sm:text-[20px] md:text-[26px]">{title}</h2>
        {subtitle && <p className="text-[#666] text-[12px] font-light font-serif mt-2">{subtitle}</p>}
      </div>

      {/* Scroll area + arrows */}
      <div className="relative">
        {/* Prev arrow */}
        {current > 0 && (
          <button
            onClick={prev}
            className="absolute left-2 top-[40%] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white transition-colors rounded-full"
            aria-label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}

        {/* Next arrow */}
        {current < valid.length - 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-[40%] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white transition-colors rounded-full"
            aria-label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' } as React.CSSProperties}
        >
          {valid.map((v) => (
            <div
              key={v.id}
              className="flex-none overflow-hidden"
              style={{
                width: /instagram\.com\/(?:p|reel|tv)\//.test(v.url)
                  ? 'clamp(300px, 50vw, 400px)'
                  : 'clamp(280px, 85vw, 620px)',
                scrollSnapAlign: 'start',
              }}
            >
              <VideoCard video={v} />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {valid.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          {valid.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="transition-all duration-300"
              aria-label={`Go to video ${i + 1}`}
            >
              <div
                className="w-[7px] h-[7px] rotate-45 transition-all duration-300"
                style={{
                  background: i === current ? '#b3a384' : 'transparent',
                  border: '1.5px solid #b3a384',
                  opacity: i === current ? 1 : 0.5,
                  transform: `rotate(45deg) scale(${i === current ? 1.2 : 1})`,
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
