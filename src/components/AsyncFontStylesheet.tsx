"use client";

export default function AsyncFontStylesheet({ href }: { href: string }) {
  return (
    <link
      rel="stylesheet"
      href={href}
      media="print"
      onLoad={(e) => {
        (e.currentTarget as HTMLLinkElement).media = "all";
      }}
    />
  );
}
