/**
 * Typed surface for Agora Supabase tables (supabase-js v2 shape).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type ChapterRow = {
  id: string
  org_id: string
  org_name: string
  nickname: string | null
  letters: string | null
  chapter_designation: string
  university: string
  semester: string
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  founded_by: string | null
  join_code: string | null
  invite_codes: Json
  created_at: string
  updated_at: string
}

type ChapterKvRow = {
  chapter_id: string
  key: string
  value: Json
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      chapters: {
        Row: ChapterRow
        Insert: {
          id?: string
          org_id: string
          org_name: string
          nickname?: string | null
          letters?: string | null
          chapter_designation?: string
          university?: string
          semester?: string
          primary_color?: string | null
          secondary_color?: string | null
          accent_color?: string | null
          founded_by?: string | null
          join_code?: string | null
          invite_codes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<ChapterRow>
        Relationships: []
      }
      chapter_kv: {
        Row: ChapterKvRow
        Insert: {
          chapter_id: string
          key: string
          value?: Json
          updated_at?: string
        }
        Update: Partial<ChapterKvRow>
        Relationships: [
          {
            foreignKeyName: 'chapter_kv_chapter_id_fkey'
            columns: ['chapter_id']
            isOneToOne: false
            referencedRelation: 'chapters'
            referencedColumns: ['id']
          },
        ]
      }
      chapter_memberships: {
        Row: {
          id: string
          chapter_id: string
          user_id: string
          app_member_id: string
          role: string
          is_founder: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          user_id: string
          app_member_id: string
          role?: string
          is_founder?: boolean
          joined_at?: string
        }
        Update: Partial<{
          id: string
          chapter_id: string
          user_id: string
          app_member_id: string
          role: string
          is_founder: boolean
          joined_at: string
        }>
        Relationships: [
          {
            foreignKeyName: 'chapter_memberships_chapter_id_fkey'
            columns: ['chapter_id']
            isOneToOne: false
            referencedRelation: 'chapters'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      chapter_members: {
        Row: {
          id: string
          chapter_id: string
          user_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          role: string
          status: string
          attendance_pct: number
          dues_paid: number
          dues_expected: number
          dues_status: string
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          user_id?: string | null
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          role?: string
          status?: string
          attendance_pct?: number
          dues_paid?: number
          dues_expected?: number
          dues_status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['chapter_members']['Row']>
        Relationships: []
      }
      events: {
        Row: {
          id: string
          chapter_id: string
          name: string
          date: string
          time: string | null
          location: string | null
          type: string | null
          description: string | null
          required: boolean
          rsvp_required: boolean
          points: number
          dress_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          name: string
          date: string
          time?: string | null
          location?: string | null
          type?: string | null
          description?: string | null
          required?: boolean
          rsvp_required?: boolean
          points?: number
          dress_code?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['events']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      claim_or_create_chapter: {
        Args: {
          p_org_id: string
          p_designation: string
          p_university: string
          p_org_name?: string | null
          p_nickname?: string | null
          p_letters?: string | null
          p_semester?: string | null
          p_primary_color?: string | null
          p_secondary_color?: string | null
          p_accent_color?: string | null
          p_app_member_id?: string | null
          p_role?: string | null
          p_is_founder?: boolean | null
        }
        Returns: string
      }
      leave_all_chapters: {
        Args: Record<string, never>
        Returns: undefined
      }
      resolve_join_code: {
        Args: { p_code: string }
        Returns: Json
      }
      sync_chapter_join_codes: {
        Args: {
          p_chapter_id: string
          p_join_code: string | null
          p_invite_codes?: Json
        }
        Returns: undefined
      }
      is_chapter_member: {
        Args: { p_chapter_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
