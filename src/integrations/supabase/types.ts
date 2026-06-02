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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          base_amount: number
          brand_id: string | null
          client_id: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          paid_at: string | null
          status: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          affiliate_id: string
          base_amount?: number
          brand_id?: string | null
          client_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          status?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          affiliate_id?: string
          base_amount?: number
          brand_id?: string | null
          client_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          status?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      affiliated_agents: {
        Row: {
          agent_name: string
          brand_id: string | null
          client_id: string | null
          commission_rate: number | null
          created_at: string | null
          id: string
          total_sales: number | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          agent_name: string
          brand_id?: string | null
          client_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          total_sales?: number | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          agent_name?: string
          brand_id?: string | null
          client_id?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          total_sales?: number | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          action_taken: string
          agent_code: string
          agent_name: string | null
          brand_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json | null
          log_details: Json
          output_data: Json | null
          parent_task_id: string | null
          source_workflow: string | null
          status: string | null
          task_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action_taken: string
          agent_code: string
          agent_name?: string | null
          brand_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          log_details?: Json
          output_data?: Json | null
          parent_task_id?: string | null
          source_workflow?: string | null
          status?: string | null
          task_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action_taken?: string
          agent_code?: string
          agent_name?: string | null
          brand_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          log_details?: Json
          output_data?: Json | null
          parent_task_id?: string | null
          source_workflow?: string | null
          status?: string | null
          task_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key_value: string
          label: string
          last_used_at: string | null
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          user_id: string
          user_name: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key_value: string
          label: string
          last_used_at?: string | null
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          user_id: string
          user_name?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key_value?: string
          label?: string
          last_used_at?: string | null
          owner_id?: string
          owner_kind?: Database["public"]["Enums"]["owner_kind"]
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          user_name: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          user_name?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
          value?: Json
        }
        Relationships: []
      }
      archive_vault: {
        Row: {
          created_at: string
          deleted_at: string
          expires_at: string | null
          id: string
          original_data: Json
          original_table_name: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string
          expires_at?: string | null
          id?: string
          original_data?: Json
          original_table_name: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string
          expires_at?: string | null
          id?: string
          original_data?: Json
          original_table_name?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      artistic_production: {
        Row: {
          brand_id: string | null
          created_at: string | null
          id: string
          media_type: string | null
          production_status: string | null
          project_name: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          production_status?: string | null
          project_name: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          production_status?: string | null
          project_name?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      assets_management: {
        Row: {
          asset_name: string
          brand_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          location: string | null
          purchase_date: string | null
          user_id: string
          user_name: string | null
          value: number | null
        }
        Insert: {
          asset_name: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          purchase_date?: string | null
          user_id: string
          user_name?: string | null
          value?: number | null
        }
        Update: {
          asset_name?: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          purchase_date?: string | null
          user_id?: string
          user_name?: string | null
          value?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          brand_id: string | null
          client_id: string | null
          created_at: string
          details: Json
          id: string
          level: string
          module: string | null
          record_id: string | null
          table_name: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          level?: string
          module?: string | null
          record_id?: string | null
          table_name: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          level?: string
          module?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          automation_id: string
          brand_id: string | null
          client_id: string | null
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          status: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          automation_id: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          status?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          automation_id?: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          status?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          name: string
          run_count: number
          trigger_event: string
          trigger_table: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name: string
          run_count?: number
          trigger_event?: string
          trigger_table: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name?: string
          run_count?: number
          trigger_event?: string
          trigger_table?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          id: string
          label: string
          size_bytes: number
          snapshot: Json
          status: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          size_bytes?: number
          snapshot?: Json
          status?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          size_bytes?: number
          snapshot?: Json
          status?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          title: string
          user_name: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          title: string
          user_name?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          title?: string
          user_name?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          branch_type: string
          brand_id: string | null
          created_at: string
          data: Json
          id: string
          lat: number | null
          lng: number | null
          manager_id: string | null
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          address?: string | null
          branch_type?: string
          brand_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          lat?: number | null
          lng?: number | null
          manager_id?: string | null
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          address?: string | null
          branch_type?: string
          brand_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          lat?: number | null
          lng?: number | null
          manager_id?: string | null
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_invitations: {
        Row: {
          accepted_at: string | null
          brand_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          user_name: string | null
        }
        Insert: {
          accepted_at?: string | null
          brand_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          token: string
          user_name?: string | null
        }
        Update: {
          accepted_at?: string | null
          brand_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_invitations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_members: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          role: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_owners: {
        Row: {
          brand_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          sort_order: number
          user_id: string
          user_name: string | null
          whatsapp: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          sort_order?: number
          user_id: string
          user_name?: string | null
          whatsapp?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          sort_order?: number
          user_id?: string
          user_name?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      brand_renewals: {
        Row: {
          alert_before_days: number | null
          brand_id: string
          created_at: string
          document_type: string
          expiry_date: string
          id: string
          status: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          alert_before_days?: number | null
          brand_id: string
          created_at?: string
          document_type: string
          expiry_date: string
          id?: string
          status?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          alert_before_days?: number | null
          brand_id?: string
          created_at?: string
          document_type?: string
          expiry_date?: string
          id?: string
          status?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          address: string | null
          ai_count: number
          created_at: string
          data: Json
          human_count: number
          id: string
          industry: string | null
          is_public: boolean
          logo_url: string | null
          name: string
          social_links: Json
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_count?: number
          created_at?: string
          data?: Json
          human_count?: number
          id?: string
          industry?: string | null
          is_public?: boolean
          logo_url?: string | null
          name: string
          social_links?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_count?: number
          created_at?: string
          data?: Json
          human_count?: number
          id?: string
          industry?: string | null
          is_public?: boolean
          logo_url?: string | null
          name?: string
          social_links?: Json
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
          website?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          agent_kind: string
          brand_id: string | null
          client_id: string | null
          created_at: string
          id: string
          metadata: Json
          title: string | null
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          agent_kind?: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          title?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          agent_kind?: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          brand_id: string | null
          client_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_brand_access: {
        Row: {
          brand_id: string
          client_id: string
          created_at: string
          id: string
          is_primary: boolean
          permissions: Json
          role: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id: string
          client_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          permissions?: Json
          role?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          permissions?: Json
          role?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      client_mapping: {
        Row: {
          branch_id: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          id: string
          identifier: string | null
          knowledge_table: string | null
          reports_to: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          branch_id?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          identifier?: string | null
          knowledge_table?: string | null
          reports_to?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          branch_id?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          identifier?: string | null
          knowledge_table?: string | null
          reports_to?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          api_key: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          loyalty_points: number | null
          password: string | null
          phone: string | null
          status: string | null
          telegram_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          loyalty_points?: number | null
          password?: string | null
          phone?: string | null
          status?: string | null
          telegram_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          loyalty_points?: number | null
          password?: string | null
          phone?: string | null
          status?: string | null
          telegram_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          body: string
          brand_id: string | null
          client_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          mentions: Json
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          body: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          mentions?: Json
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          body?: string
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          mentions?: Json
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          brand_id: string | null
          client_id: string | null
          coupon_id: string
          created_at: string
          customer_id: string | null
          discount_applied: number
          id: string
          invoice_id: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          coupon_id: string
          created_at?: string
          customer_id?: string | null
          discount_applied?: number
          id?: string
          invoice_id?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          coupon_id?: string
          created_at?: string
          customer_id?: string | null
          discount_applied?: number
          id?: string
          invoice_id?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          applies_to_plans: Json
          brand_id: string | null
          client_id: string | null
          code: string
          created_at: string
          currency: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          used_count: number
          user_id: string
          user_name: string | null
        }
        Insert: {
          active?: boolean
          applies_to_plans?: Json
          brand_id?: string | null
          client_id?: string | null
          code: string
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number
          user_id: string
          user_name?: string | null
        }
        Update: {
          active?: boolean
          applies_to_plans?: Json
          brand_id?: string | null
          client_id?: string | null
          code?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      crm_interactions: {
        Row: {
          agent_id: string | null
          brand_id: string | null
          client_id: string | null
          id: string
          interaction_date: string | null
          notes: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          agent_id?: string | null
          brand_id?: string | null
          client_id?: string | null
          id?: string
          interaction_date?: string | null
          notes?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          agent_id?: string | null
          brand_id?: string | null
          client_id?: string | null
          id?: string
          interaction_date?: string | null
          notes?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          brand_id: string | null
          client_id: string | null
          created_at: string
          data: Json
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          id: string
          layout: Json
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      dead_man_switch: {
        Row: {
          active: boolean
          created_at: string
          deadline_days: number
          heirs: Json
          id: string
          last_heartbeat: string
          triggered_at: string | null
          updated_at: string
          user_id: string
          user_name: string | null
          warning_days: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          deadline_days?: number
          heirs?: Json
          id?: string
          last_heartbeat?: string
          triggered_at?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
          warning_days?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          deadline_days?: number
          heirs?: Json
          id?: string
          last_heartbeat?: string
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
          warning_days?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          brand_id: string | null
          client_id: string | null
          created_at: string
          dept_code: string | null
          id: string
          managed_agents: string[] | null
          manager_name: string | null
          system_prompt: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          dept_code?: string | null
          id?: string
          managed_agents?: string[] | null
          manager_name?: string | null
          system_prompt?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          dept_code?: string | null
          id?: string
          managed_agents?: string[] | null
          manager_name?: string | null
          system_prompt?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      digital_inheritance: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          agent_code: string | null
          agent_version: string | null
          availability: string
          avatar_url: string | null
          bio: string | null
          branch_id: string | null
          brand_id: string | null
          client_id: string | null
          created_at: string
          data: Json
          email: string | null
          employee_type: string
          id: string
          instructions: string | null
          is_aggregator: boolean
          metadata: Json
          name: string
          phone: string | null
          position: string | null
          reports_to: string | null
          role: string | null
          specialization: string | null
          status: Database["public"]["Enums"]["entity_status"]
          system_prompt: string | null
          team_category: string | null
          updated_at: string
          user_id: string
          user_name: string | null
          workflow_id: string | null
        }
        Insert: {
          agent_code?: string | null
          agent_version?: string | null
          availability?: string
          avatar_url?: string | null
          bio?: string | null
          branch_id?: string | null
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          employee_type?: string
          id?: string
          instructions?: string | null
          is_aggregator?: boolean
          metadata?: Json
          name: string
          phone?: string | null
          position?: string | null
          reports_to?: string | null
          role?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          system_prompt?: string | null
          team_category?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
          workflow_id?: string | null
        }
        Update: {
          agent_code?: string | null
          agent_version?: string | null
          availability?: string
          avatar_url?: string | null
          bio?: string | null
          branch_id?: string | null
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          employee_type?: string
          id?: string
          instructions?: string | null
          is_aggregator?: boolean
          metadata?: Json
          name?: string
          phone?: string | null
          position?: string | null
          reports_to?: string | null
          role?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          system_prompt?: string | null
          team_category?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_files: {
        Row: {
          category: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          size_bytes: number | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          size_bytes?: number | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          owner_id?: string
          owner_kind?: Database["public"]["Enums"]["owner_kind"]
          size_bytes?: number | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          id: string
          rate: number
          target_currency: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          base_currency?: string
          id?: string
          rate: number
          target_currency: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          base_currency?: string
          id?: string
          rate?: number
          target_currency?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          user_name: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          user_name?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      finance_analytics: {
        Row: {
          created_at: string | null
          id: string
          month_year: string | null
          net_profit: number | null
          total_expenses: number | null
          total_revenue: number | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_year?: string | null
          net_profit?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month_year?: string | null
          net_profit?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      heartbeats: {
        Row: {
          confirmed_at: string
          id: string
          next_deadline: string
          user_id: string
          user_name: string | null
          warned_3d: boolean
        }
        Insert: {
          confirmed_at?: string
          id?: string
          next_deadline: string
          user_id: string
          user_name?: string | null
          warned_3d?: boolean
        }
        Update: {
          confirmed_at?: string
          id?: string
          next_deadline?: string
          user_id?: string
          user_name?: string | null
          warned_3d?: boolean
        }
        Relationships: []
      }
      import_export: {
        Row: {
          country_of_origin: string | null
          created_at: string | null
          document_type: string | null
          id: string
          status: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          country_of_origin?: string | null
          created_at?: string | null
          document_type?: string | null
          id?: string
          status?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          country_of_origin?: string | null
          created_at?: string | null
          document_type?: string | null
          id?: string
          status?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      installed_apps: {
        Row: {
          app_id: string
          id: string
          installed_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          app_id: string
          id?: string
          installed_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          app_id?: string
          id?: string
          installed_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installed_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "marketplace_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          client_id: string | null
          id: string
          last_updated: string | null
          material_id: string | null
          quantity: number | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          branch_id?: string | null
          brand_id?: string | null
          client_id?: string | null
          id?: string
          last_updated?: string | null
          material_id?: string | null
          quantity?: number | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string | null
          client_id?: string | null
          id?: string
          last_updated?: string | null
          material_id?: string | null
          quantity?: number | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          billing_info: Json
          brand_id: string | null
          client_id: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          customer_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          line_items: Json
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          receipt_url: string | null
          refunded_amount: number
          status: string
          subscription_id: string | null
          tax_amount: number
          total: number
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount?: number
          billing_info?: Json
          brand_id?: string | null
          client_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          line_items?: Json
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          refunded_amount?: number
          status?: string
          subscription_id?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          billing_info?: Json
          brand_id?: string | null
          client_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          refunded_amount?: number
          status?: string
          subscription_id?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      ip_whitelist: {
        Row: {
          active: boolean
          created_at: string
          id: string
          ip_range: string
          label: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          ip_range: string
          label: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          ip_range?: string
          label?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      key_persons: {
        Row: {
          channels: Json
          created_at: string
          emails: Json
          id: string
          name: string
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          phones: Json
          position: number
          role: string | null
          socials: Json
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          channels?: Json
          created_at?: string
          emails?: Json
          id?: string
          name: string
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          phones?: Json
          position?: number
          role?: string | null
          socials?: Json
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          channels?: Json
          created_at?: string
          emails?: Json
          id?: string
          name?: string
          owner_id?: string
          owner_kind?: Database["public"]["Enums"]["owner_kind"]
          phones?: Json
          position?: number
          role?: string | null
          socials?: Json
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      legal_vault: {
        Row: {
          brand_id: string | null
          client_id: string | null
          created_at: string | null
          doc_title: string
          expiry_date: string | null
          file_url: string | null
          id: string
          is_encrypted: boolean | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string | null
          doc_title: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string | null
          doc_title?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_encrypted?: boolean | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      legendary_journey: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      login_history: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          location: string | null
          os: string | null
          success: boolean
          user_agent: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          os?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          os?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      logistics_shipping: {
        Row: {
          brand_id: string | null
          carrier: string | null
          client_id: string | null
          created_at: string | null
          estimated_delivery: string | null
          id: string
          project_id: string | null
          status: string | null
          tracking_number: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          carrier?: string | null
          client_id?: string | null
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          tracking_number?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          carrier?: string | null
          client_id?: string | null
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          tracking_number?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          brand_id: string | null
          budget: number | null
          campaign_name: string | null
          client_id: string | null
          created_at: string | null
          id: string
          leads_generated: number | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          budget?: number | null
          campaign_name?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          budget?: number | null
          campaign_name?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      marketplace_apps: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          developer: string | null
          featured: boolean | null
          icon: string | null
          id: string
          installs: number | null
          name: string
          price_cents: number | null
          rating: number | null
          slug: string
          user_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          developer?: string | null
          featured?: boolean | null
          icon?: string | null
          id?: string
          installs?: number | null
          name: string
          price_cents?: number | null
          rating?: number | null
          slug: string
          user_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          developer?: string | null
          featured?: boolean | null
          icon?: string | null
          id?: string
          installs?: number | null
          name?: string
          price_cents?: number | null
          rating?: number | null
          slug?: string
          user_name?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          brand_id: string | null
          client_id: string | null
          created_at: string | null
          current_stock: number | null
          id: string
          min_stock_level: number | null
          name: string
          unit: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          min_stock_level?: number | null
          name: string
          unit?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          min_stock_level?: number | null
          name?: string
          unit?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          active: boolean
          channel: string
          created_at: string
          field: string
          id: string
          name: string
          operator: string
          table_name: string
          threshold: number
          user_id: string
          user_name: string | null
        }
        Insert: {
          active?: boolean
          channel?: string
          created_at?: string
          field: string
          id?: string
          name: string
          operator?: string
          table_name: string
          threshold: number
          user_id: string
          user_name?: string | null
        }
        Update: {
          active?: boolean
          channel?: string
          created_at?: string
          field?: string
          id?: string
          name?: string
          operator?: string
          table_name?: string
          threshold?: number
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          assignee_ref: string | null
          brand_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          task_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          assignee_ref?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          task_id?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          assignee_ref?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          api_config: Json | null
          brand_id: string | null
          created_at: string | null
          gateway_name: string | null
          id: string
          is_active: boolean | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          api_config?: Json | null
          brand_id?: string | null
          created_at?: string | null
          gateway_name?: string | null
          id?: string
          is_active?: boolean | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          api_config?: Json | null
          brand_id?: string | null
          created_at?: string | null
          gateway_name?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          brand_id: string | null
          client_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          method: string
          notes: string | null
          proof_url: string | null
          reference: string | null
          status: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount?: number
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method: string
          notes?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string
          notes?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string
          phone: string | null
          social_linkedin: string | null
          social_website: string | null
          timezone: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string
          phone?: string | null
          social_linkedin?: string | null
          social_website?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string
          phone?: string | null
          social_linkedin?: string | null
          social_website?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      project_team: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          member_name: string
          project_id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          member_name: string
          project_id: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          member_name?: string
          project_id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          brand_id: string | null
          budget_amount: number | null
          budget_currency: string | null
          client_id: string | null
          created_at: string
          data: Json
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          brand_id: string | null
          client_id: string | null
          code: string
          created_at: string
          id: string
          reward_amount: number | null
          reward_currency: string | null
          total_earned: number | null
          total_referred: number | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          code: string
          created_at?: string
          id?: string
          reward_amount?: number | null
          reward_currency?: string | null
          total_earned?: number | null
          total_referred?: number | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          code?: string
          created_at?: string
          id?: string
          reward_amount?: number | null
          reward_currency?: string | null
          total_earned?: number | null
          total_referred?: number | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          brand_id: string | null
          client_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          invoice_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_default: boolean
          name: string
          page: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name: string
          page: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          page?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          brand_id: string | null
          client_id: string | null
          created_at: string
          data: Json
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_tasks: {
        Row: {
          agent_code: string | null
          ai_output: string | null
          brand_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          parent_task_id: string | null
          status: string | null
          title: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          agent_code?: string | null
          ai_output?: string | null
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          parent_task_id?: string | null
          status?: string | null
          title: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          agent_code?: string | null
          ai_output?: string | null
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          parent_task_id?: string | null
          status?: string | null
          title?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          customer_id: string | null
          grace_until: string | null
          id: string
          interval: string
          metadata: Json
          plan_id: string
          plan_name: string
          price: number
          status: string
          trial_end: string | null
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string | null
          grace_until?: string | null
          id?: string
          interval?: string
          metadata?: Json
          plan_id: string
          plan_name: string
          price?: number
          status?: string
          trial_end?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string | null
          grace_until?: string | null
          id?: string
          interval?: string
          metadata?: Json
          plan_id?: string
          plan_name?: string
          price?: number
          status?: string
          trial_end?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      success_partners: {
        Row: {
          brand_id: string | null
          client_id: string | null
          created_at: string
          data: Json
          id: string
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          name: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          category: string | null
          company_name: string
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          category?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          category?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          acknowledged: boolean
          created_at: string
          id: string
          level: string
          message: string
          module: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          id?: string
          level?: string
          message: string
          module: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          id?: string
          level?: string
          message?: string
          module?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          action_taken: string | null
          agent_code: string | null
          agent_kind: string
          ai_response: string | null
          assignee: string | null
          brand_id: string | null
          category: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          error_message: string | null
          id: string
          is_aggregator: boolean
          log_details: Json | null
          metadata: Json
          output_data: Json | null
          parent_task_id: string | null
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action_taken?: string | null
          agent_code?: string | null
          agent_kind?: string
          ai_response?: string | null
          assignee?: string | null
          brand_id?: string | null
          category?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          error_message?: string | null
          id?: string
          is_aggregator?: boolean
          log_details?: Json | null
          metadata?: Json
          output_data?: Json | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action_taken?: string | null
          agent_code?: string | null
          agent_kind?: string
          ai_response?: string | null
          assignee?: string | null
          brand_id?: string | null
          category?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          error_message?: string | null
          id?: string
          is_aggregator?: boolean
          log_details?: Json | null
          metadata?: Json
          output_data?: Json | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          brand_id: string | null
          category: string | null
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          kind: string
          metadata: Json
          occurred_at: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount?: number
          brand_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          occurred_at?: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          brand_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          occurred_at?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          backup_codes: Json
          created_at: string
          enabled: boolean
          id: string
          secret: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          backup_codes?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          secret: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          backup_codes?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          secret?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          last_active: string
          os: string | null
          revoked: boolean
          session_token: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          last_active?: string
          os?: string | null
          revoked?: boolean
          session_token: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          last_active?: string
          os?: string | null
          revoked?: boolean
          session_token?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      vault_entries: {
        Row: {
          brand_id: string | null
          category: string | null
          client_id: string | null
          created_at: string
          id: string
          label: string
          locked: boolean
          payload: Json
          threat_level: number
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          label: string
          locked?: boolean
          payload?: Json
          threat_level?: number
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          label?: string
          locked?: boolean
          payload?: Json
          threat_level?: number
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      vault_settings: {
        Row: {
          auto_emergency: boolean
          current_threat_pct: number
          emergency_mode: boolean
          threat_lock_pct: number
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          auto_emergency?: boolean
          current_threat_pct?: number
          emergency_mode?: boolean
          threat_lock_pct?: number
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          auto_emergency?: boolean
          current_threat_pct?: number
          emergency_mode?: boolean
          threat_lock_pct?: number
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          event: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
          user_id: string
          user_name: string | null
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          user_id: string
          user_name?: string | null
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          event?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
          user_id?: string
          user_name?: string | null
          webhook_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          active: boolean
          created_at: string
          events: Json
          id: string
          label: string
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          secret: string | null
          updated_at: string
          url: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: Json
          id?: string
          label: string
          owner_id: string
          owner_kind: Database["public"]["Enums"]["owner_kind"]
          secret?: string | null
          updated_at?: string
          url: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: Json
          id?: string
          label?: string
          owner_id?: string
          owner_kind?: Database["public"]["Enums"]["owner_kind"]
          secret?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      white_label: {
        Row: {
          accent_color: string | null
          brand_id: string | null
          brand_name: string | null
          client_id: string | null
          custom_domain: string | null
          hide_branding: boolean | null
          id: string
          logo_url: string | null
          primary_color: string | null
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          accent_color?: string | null
          brand_id?: string | null
          brand_name?: string | null
          client_id?: string | null
          custom_domain?: string | null
          hide_branding?: boolean | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          accent_color?: string | null
          brand_id?: string | null
          brand_name?: string | null
          client_id?: string | null
          custom_domain?: string | null
          hide_branding?: boolean | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      workflow_map: {
        Row: {
          brand_id: string | null
          client_id: string | null
          created_at: string
          dependency_type: string
          description: string | null
          from_agent_code: string
          id: string
          task_type: string | null
          to_agent_code: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          dependency_type?: string
          description?: string | null
          from_agent_code: string
          id?: string
          task_type?: string | null
          to_agent_code: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          dependency_type?: string
          description?: string | null
          from_agent_code?: string
          id?: string
          task_type?: string | null
          to_agent_code?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      agent_permissions: {
        Row: {
          agent_code: string
          agent_id: string | null
          allowed_actions: string[]
          allowed_tables: string[]
          brand_id: string | null
          can_escalate: boolean
          created_at: string
          id: string
          max_daily_ops: number | null
          max_spend_eur: number | null
          notes: string | null
          requires_approval: boolean
          sandbox_mode: boolean
          sector_access: Json
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          agent_code: string
          agent_id?: string | null
          allowed_actions?: string[]
          allowed_tables?: string[]
          brand_id?: string | null
          can_escalate?: boolean
          created_at?: string
          id?: string
          max_daily_ops?: number | null
          max_spend_eur?: number | null
          notes?: string | null
          requires_approval?: boolean
          sandbox_mode?: boolean
          sector_access?: Json
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          agent_code?: string
          agent_id?: string | null
          allowed_actions?: string[]
          allowed_tables?: string[]
          brand_id?: string | null
          can_escalate?: boolean
          created_at?: string
          id?: string
          max_daily_ops?: number | null
          max_spend_eur?: number | null
          notes?: string | null
          requires_approval?: boolean
          sandbox_mode?: boolean
          sector_access?: Json
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand_id: string | null
          created_at: string
          customer_id: string | null
          display_name: string | null
          expires_at: string | null
          gateway_id: string | null
          id: string
          is_default: boolean
          metadata: Json
          method_type: string
          provider_code: string | null
          token: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          customer_id?: string | null
          display_name?: string | null
          expires_at?: string | null
          gateway_id?: string | null
          id?: string
          is_default?: boolean
          metadata?: Json
          method_type?: string
          provider_code?: string | null
          token?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          customer_id?: string | null
          display_name?: string | null
          expires_at?: string | null
          gateway_id?: string | null
          id?: string
          is_default?: boolean
          metadata?: Json
          method_type?: string
          provider_code?: string | null
          token?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      payment_splits: {
        Row: {
          amount: number
          brand_id: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          percentage: number | null
          processed_at: string | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_type: string
          status: string
          transaction_id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount?: number
          brand_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          percentage?: number | null
          processed_at?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string
          status?: string
          transaction_id: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          brand_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          percentage?: number | null
          processed_at?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string
          status?: string
          transaction_id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      responsible_personnel: {
        Row: {
          ai_can_contact: boolean
          avatar_url: string | null
          brand_id: string | null
          client_id: string | null
          created_at: string
          department: string | null
          emails: Json
          full_name: string
          id: string
          is_active: boolean
          metadata: Json
          national_id: string | null
          notes: string | null
          owner_id: string
          owner_kind: string
          phones: Json
          priority: number
          socials: Json
          title: string | null
          updated_at: string
          user_id: string
          user_name: string | null
          whatsapp: string | null
        }
        Insert: {
          ai_can_contact?: boolean
          avatar_url?: string | null
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          department?: string | null
          emails?: Json
          full_name: string
          id?: string
          is_active?: boolean
          metadata?: Json
          national_id?: string | null
          notes?: string | null
          owner_id: string
          owner_kind: string
          phones?: Json
          priority?: number
          socials?: Json
          title?: string | null
          updated_at?: string
          user_id: string
          user_name?: string | null
          whatsapp?: string | null
        }
        Update: {
          ai_can_contact?: boolean
          avatar_url?: string | null
          brand_id?: string | null
          client_id?: string | null
          created_at?: string
          department?: string | null
          emails?: Json
          full_name?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          national_id?: string | null
          notes?: string | null
          owner_id?: string
          owner_kind?: string
          phones?: Json
          priority?: number
          socials?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          brand_id: string | null
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_export: boolean
          can_read: boolean
          can_update: boolean
          created_at: string
          extra_perms: Json
          id: string
          resource_type: string
          role: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id?: string | null
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          extra_perms?: Json
          id?: string
          resource_type: string
          role: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string | null
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          extra_perms?: Json
          id?: string
          resource_type?: string
          role?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      sector_permissions: {
        Row: {
          ai_agent_codes: string[] | null
          ai_managed: boolean
          branch_ids: string[] | null
          brand_id: string
          can_approve: boolean
          can_delete: boolean
          can_export: boolean
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          notes: string | null
          sector: string
          target_user_id: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          ai_agent_codes?: string[] | null
          ai_managed?: boolean
          branch_ids?: string[] | null
          brand_id: string
          can_approve?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          sector: string
          target_user_id: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          ai_agent_codes?: string[] | null
          ai_managed?: boolean
          branch_ids?: string[] | null
          brand_id?: string
          can_approve?: boolean
          can_delete?: boolean
          can_export?: boolean
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          sector?: string
          target_user_id?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          brand_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          initiated_by: string | null
          started_at: string
          status: string
          steps_log: Json
          trigger_payload: Json
          trigger_source: string | null
          user_id: string
          user_name: string | null
          workflow_name: string
        }
        Insert: {
          brand_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          started_at?: string
          status?: string
          steps_log?: Json
          trigger_payload?: Json
          trigger_source?: string | null
          user_id: string
          user_name?: string | null
          workflow_name: string
        }
        Update: {
          brand_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          started_at?: string
          status?: string
          steps_log?: Json
          trigger_payload?: Json
          trigger_source?: string | null
          user_id?: string
          user_name?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          action_config: Json
          action_type: string
          agent_code: string | null
          brand_id: string | null
          client_id: string | null
          condition_expr: string | null
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          on_failure_step: string | null
          on_success_step: string | null
          retry_count: number | null
          step_label: string
          step_order: number
          timeout_seconds: number | null
          updated_at: string
          user_id: string
          user_name: string | null
          workflow_name: string
        }
        Insert: {
          action_config?: Json
          action_type?: string
          agent_code?: string | null
          brand_id?: string | null
          client_id?: string | null
          condition_expr?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          on_failure_step?: string | null
          on_success_step?: string | null
          retry_count?: number | null
          step_label: string
          step_order?: number
          timeout_seconds?: number | null
          updated_at?: string
          user_id: string
          user_name?: string | null
          workflow_name: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          agent_code?: string | null
          brand_id?: string | null
          client_id?: string | null
          condition_expr?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          on_failure_step?: string | null
          on_success_step?: string | null
          retry_count?: number | null
          step_label?: string
          step_order?: number
          timeout_seconds?: number | null
          updated_at?: string
          user_id?: string
          user_name?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
      executive_cockpit_state: {
        Row: {
          id: string
          workflow_name: string
          department_code: string
          current_status: string
          active_agent_id: string | null
          last_update: string
          health_score: number
          last_error_message: string | null
        }
        Insert: {
          id?: string
          workflow_name: string
          department_code: string
          current_status?: string
          active_agent_id?: string | null
          last_update?: string
          health_score?: number
          last_error_message?: string | null
        }
        Update: {
          id?: string
          workflow_name?: string
          department_code?: string
          current_status?: string
          active_agent_id?: string | null
          last_update?: string
          health_score?: number
          last_error_message?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          brand_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          role: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_brand_member: {
        Args: { _brand: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      entity_status: "active" | "inactive" | "maintenance" | "pending"
      owner_kind:
        | "brand"
        | "project"
        | "service"
        | "employee"
        | "customer"
        | "branch"
        | "affiliate"
        | "success_partner"
        | "digital_inheritance"
        | "legendary_journey"
        | "system"
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
      entity_status: ["active", "inactive", "maintenance", "pending"],
      owner_kind: [
        "brand",
        "project",
        "service",
        "employee",
        "customer",
        "branch",
        "affiliate",
        "success_partner",
        "digital_inheritance",
        "legendary_journey",
        "system",
      ],
    },
  },
} as const
