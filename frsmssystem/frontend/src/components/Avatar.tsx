import React, { useState } from 'react';

// Deterministic accent so an initials-only avatar isn't the same flat
// color for everyone, without pulling in a random/id-hash library for
// one small bit of visual variety.
const ACCENTS = ['bg-leaf-500', 'bg-navy-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-fuchsia-500'];
function accentFor(seed: string) {
  const sum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ACCENTS[sum % ACCENTS.length];
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Shows the person's Google profile photo (avatar_url on their profile)
// when there is one -- e.g. from "Continue with Google" -- and falls
// back to the existing initials-chip look for email/password accounts
// or if the photo URL fails to load.
export default function Avatar({
  name,
  avatarUrl,
  seed,
  className = '',
}: {
  name: string;
  avatarUrl?: string | null;
  /** What to color/derive the fallback initials chip from; defaults to `name`. */
  seed?: string;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgFailed(true)}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-navy-800 ${className}`}
      />
    );
  }

  return (
    <div className={`avatar-chip ${accentFor(seed ?? name)} ${className}`}>
      {initialsOf(name)}
    </div>
  );
}
