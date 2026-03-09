export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      banner_ads: {
        Row: {
          click_count: number
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          image_url: string
          impression_count: number
          is_active: boolean
          link_url: string
          position: string
          sort_order: number
          starts_at: string
          title: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          impression_count?: number
          is_active?: boolean
          link_url?: string
          position?: string
          sort_order?: number
          starts_at?: string
          title?: string
        }
        Update: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          impression_count?: number
          is_active?: boolean
          link_url?: string
          position?: string
          sort_order?: number
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      bans: {
        Row: {
          banned_by: string
          banned_until: string
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          banned_until: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          banned_until?: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      category_access: {
        Row: {
          access_count: number
          category: string
          id: string
          last_accessed_at: string
          user_id: string
        }
        Insert: {
          access_count?: number
          category: string
          id?: string
          last_accessed_at?: string
          user_id: string
        }
        Update: {
          access_count?: number
          category?: string
          id?: string
          last_accessed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      forbidden_words: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          word?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          category: string
          city: string | null
          condition: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          price: string
          sold: boolean
          title: string
          user_id: string
          view_count: number
          whatsapp: string
        }
        Insert: {
          category?: string
          city?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          price: string
          sold?: boolean
          title: string
          user_id: string
          view_count?: number
          whatsapp?: string
        }
        Update: {
          category?: string
          city?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          price?: string
          sold?: boolean
          title?: string
          user_id?: string
          view_count?: number
          whatsapp?: string
        }
        Relationships: []
      }
      marketplace_views: {
        Row: {
          category: string
          created_at: string
          id: string
          interaction_type: string
          item_id: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          interaction_type?: string
          item_id: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          interaction_type?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_views_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          edited_at: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_deleted: boolean | null
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          edited_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          edited_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          action_type: string
          created_at: string
          details: string | null
          id: string
          moderator_id: string
          target_id: string
          target_owner_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: string | null
          id?: string
          moderator_id: string
          target_id: string
          target_owner_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: string | null
          id?: string
          moderator_id?: string
          target_id?: string
          target_owner_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          birthdate: string | null
          business_verified: boolean
          city: string | null
          created_at: string
          email: string
          id: string
          name: string
          photo_url: string | null
          profile_links: Json | null
          school: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          bio?: string | null
          birthdate?: string | null
          business_verified?: boolean
          city?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          photo_url?: string | null
          profile_links?: Json | null
          school?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          bio?: string | null
          birthdate?: string | null
          business_verified?: boolean
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          photo_url?: string | null
          profile_links?: Json | null
          school?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_note: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          content_id: string
          content_type?: string
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      service_listings: {
        Row: {
          category_id: string
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          subcategory_id: string | null
          title: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          category_id: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          subcategory_id?: string | null
          title: string
          user_id: string
          whatsapp?: string
        }
        Update: {
          category_id?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          subcategory_id?: string | null
          title?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "service_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          content: string
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      sponsored_campaigns: {
        Row: {
          budget: number
          clicks: number
          created_at: string
          ends_at: string
          id: string
          impressions: number
          item_id: string
          spent: number
          status: string
          target_category: string | null
          target_city: string | null
          user_id: string
        }
        Insert: {
          budget?: number
          clicks?: number
          created_at?: string
          ends_at?: string
          id?: string
          impressions?: number
          item_id: string
          spent?: number
          status?: string
          target_category?: string | null
          target_city?: string | null
          user_id: string
        }
        Update: {
          budget?: number
          clicks?: number
          created_at?: string
          ends_at?: string
          id?: string
          impressions?: number
          item_id?: string
          spent?: number
          status?: string
          target_category?: string | null
          target_city?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_campaigns_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean
          price: string
          store_id: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          price: string
          store_id: string
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          price?: string
          store_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen_at: string
          user_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen_at?: string
          user_id: string
        }
        Update: {
          is_online?: boolean
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          allow_messages_from: string
          compact_mode: boolean
          created_at: string
          email_notifications: boolean
          friend_request_notifications: boolean
          id: string
          language: string
          marketplace_notifications: boolean
          message_notifications: boolean
          profile_visibility: string
          push_notifications: boolean
          show_last_seen: boolean
          show_online_status: boolean
          sound_enabled: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_messages_from?: string
          compact_mode?: boolean
          created_at?: string
          email_notifications?: boolean
          friend_request_notifications?: boolean
          id?: string
          language?: string
          marketplace_notifications?: boolean
          message_notifications?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          show_last_seen?: boolean
          show_online_status?: boolean
          sound_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_messages_from?: string
          compact_mode?: boolean
          created_at?: string
          email_notifications?: boolean
          friend_request_notifications?: boolean
          id?: string
          language?: string
          marketplace_notifications?: boolean
          message_notifications?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          show_last_seen?: boolean
          show_online_status?: boolean
          sound_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_friend_suggestions: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          city: string
          mutual_count: number
          name: string
          photo_url: string
          score: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_banner_clicks: {
        Args: { _banner_id: string }
        Returns: undefined
      }
      increment_banner_impressions: {
        Args: { _banner_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
