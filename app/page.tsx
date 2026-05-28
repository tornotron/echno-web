'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { StarsBackground } from '@/components/shadcn/star';

export default function WelcomePage() {
  return (
    <StarsBackground className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/e-ai-logo.png"
          alt="Echno"
          width={160}
          height={58}
          priority
          className="invert"
        />

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome..! Echno Console
        </h1>

        <div className="flex gap-4">
          <button
            onClick={() => signIn('keycloak')}
            className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Login
          </button>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-700 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            Register
          </Link>
        </div>
      </div>
    </StarsBackground>
  );
}
