import { SITE } from '../config';

const MINUTE = 60_000;

export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / MINUTE);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export const clock = (iso: string | number) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const dateLong = (iso: string | number) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const dateShort = (iso: string | number) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? 'Today'
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export const price = (value: number) => `${SITE.currency}${value}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
