'use client';

import ServerAbout from './server/index';

export default function About() {
  return (
    <div style={{ padding: '24px' }} className="w-300 h-400 bg-cyan-800">
      <ServerAbout />
    </div>
  );
}
