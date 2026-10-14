import type { Category, Condition, NewsSection } from './lib/constants';

export type Role = 'student' | 'admin';

export interface Profile {
  id: string;
  name: string;
  role: Role;
}

export type ListingStatus = 'active' | 'sold';

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  /** Photo URLs, or "art:<icon>:<tint>" placeholders for demo data. First one is the cover. */
  photos: string[];
  status: ListingStatus;
  created_at: string;
  /** Null for visitors who are not signed in (profiles are private). */
  seller: { name: string } | null;
}

export type ListingInput = Pick<Listing, 'title' | 'description' | 'price' | 'category' | 'condition' | 'photos'>;

export interface Conversation {
  id: string;
  listing_id: string | null;
  listing_title: string;
  buyer_id: string;
  seller_id: string;
  last_message_text: string | null;
  last_message_sender: string | null;
  last_message_at: string | null;
  buyer_read_at: string;
  seller_read_at: string;
  created_at: string;
  buyer: { name: string } | null;
  seller: { name: string } | null;
  listing: Pick<Listing, 'id' | 'title' | 'price' | 'photos' | 'status' | 'condition'> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Article {
  id: string;
  author_name: string;
  section: NewsSection;
  title: string;
  summary: string;
  body: string;
  photo_url: string | null;
  is_notice: boolean;
  is_demo: boolean;
  published_at: string;
}

export type ArticleInput = Pick<Article, 'section' | 'title' | 'summary' | 'body' | 'photo_url' | 'is_notice' | 'published_at'>;
