import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY_B64 = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.NEXT_PUBLIC_SITE_URL || 'https://adobe-csc-connect-app.vercel.app';

function b64ToBuffer(b64: string): ArrayBuffer {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

function strToBuffer(str: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(str);
  const buf = new ArrayBuffer(bytes.length);
  new Uint8Array(buf).set(bytes);
  return buf;
}

function bufToB64url(buf: ArrayBuffer): string {
  const arr = Array.from(new Uint8Array(buf));
  return btoa(arr.map((b) => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signVapidJwt(audience: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = bufToB64url(strToBuffer(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = bufToB64url(strToBuffer(JSON.stringify({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT })));
  const signingInput = strToBuffer(`${header}.${payload}`);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    b64ToBuffer(VAPID_PRIVATE_KEY_B64),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, signingInput);
  return `${header}.${payload}.${bufToB64url(sig)}`;
}

async function sendPush(endpoint: string, payload: string): Promise<boolean> {
  const { protocol, host } = new URL(endpoint);
  const jwt = await signVapidJwt(`${protocol}//${host}`);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      'Content-Type': 'application/json',
      TTL: '86400',
    },
    body: payload,
  });
  return res.ok || res.status === 201;
}

export async function POST(req: NextRequest) {
  try {
    const { channel_name, sender_name, message_preview, channel_id, sender_user_id } = await req.json();
    const supabase = createClient();

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .neq('user_id', sender_user_id);

    if (error) throw error;
    if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

    const payload = JSON.stringify({
      title: `#${channel_name}`,
      body: `${sender_name}: ${message_preview}`,
      tag: `chat-${channel_id}`,
      url: '/chat',
    });

    const results = await Promise.allSettled(subs.map((s) => sendPush(s.endpoint, payload)));
    const sent = results.filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<boolean>).value).length;

    const failedEndpoints = results
      .map((r, i) => ({ r, ep: subs[i].endpoint }))
      .filter(({ r }) => r.status === 'rejected')
      .map(({ ep }) => ep);
    if (failedEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', failedEndpoints);
    }

    return NextResponse.json({ sent });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
