'use client';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export default function InstagramEmbed({
  url,
  clientName,
  clientSubtitle,
}: {
  url: string;
  clientName?: string;
  clientSubtitle?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      } else if (!document.getElementById('ig-embed-js')) {
        const s = document.createElement('script');
        s.id = 'ig-embed-js';
        s.src = 'https://www.instagram.com/embed.js';
        s.async = true;
        document.body.appendChild(s);
      }
    };
    load();
  }, [url]);

  return (
    <div ref={ref} className="flex-none" style={{ width: 'clamp(300px, 50vw, 400px)' }}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: '#fff',
          border: 0,
          margin: 0,
          padding: 0,
          width: '100%',
          minWidth: '300px',
        }}
      />
      {clientName && (
        <div className="pt-4 px-1">
          <p className="text-[9px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-1">{clientName}</p>
          {clientSubtitle && (
            <p className="text-[9px] tracking-[2px] uppercase text-[#aaa]">{clientSubtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
