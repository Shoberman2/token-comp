export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          company: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          default_model: string | null;
          join_code: string;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          company?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          default_model?: string | null;
          join_code?: string;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          handle?: string;
          display_name?: string;
          company?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          default_model?: string | null;
          invited_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      burns: {
        Row: {
          id: string;
          user_id: string;
          tokens: number;
          cost: number | null;
          model: string;
          image_url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tokens: number;
          cost?: number | null;
          model?: string;
          image_url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          tokens?: number;
          cost?: number | null;
          model?: string;
          image_url?: string;
          caption?: string | null;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      ai_models: {
        Row: {
          name: string;
          provider: string | null;
          is_base: boolean;
          uses_count: number;
          first_seen_at: string;
          last_seen_at: string;
        };
        Insert: {
          name: string;
          provider?: string | null;
          is_base?: boolean;
          uses_count?: number;
          first_seen_at?: string;
          last_seen_at?: string;
        };
        Update: {
          provider?: string | null;
          is_base?: boolean;
          uses_count?: number;
          last_seen_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      profile_best_days: {
        Row: {
          user_id: string | null;
          day: string | null;
          tokens: number | null;
        };
        Relationships: [];
      };
      profile_daily_token_totals: {
        Row: {
          user_id: string | null;
          day: string | null;
          tokens: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      normalize_handle: {
        Args: { input: string };
        Returns: string;
      };
      record_ai_model: {
        Args: { model_name: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
