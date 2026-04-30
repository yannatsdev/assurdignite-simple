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
      actuarial_config_versions: {
        Row: {
          config_json: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          source_file_name: string | null
          validation_report: Json
          version_name: string
        }
        Insert: {
          config_json: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          source_file_name?: string | null
          validation_report?: Json
          version_name: string
        }
        Update: {
          config_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          source_file_name?: string | null
          validation_report?: Json
          version_name?: string
        }
        Relationships: []
      }
      assures_complementaires: {
        Row: {
          contract_id: string
          dob: string | null
          id: string
          lien_parente: string | null
          nom: string
          prestation_nature: string | null
          type_assure: string | null
        }
        Insert: {
          contract_id: string
          dob?: string | null
          id?: string
          lien_parente?: string | null
          nom: string
          prestation_nature?: string | null
          type_assure?: string | null
        }
        Update: {
          contract_id?: string
          dob?: string | null
          id?: string
          lien_parente?: string | null
          nom?: string
          prestation_nature?: string | null
          type_assure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assures_complementaires_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiaires: {
        Row: {
          contract_id: string | null
          created_at: string | null
          id: string
          lien_parente: string | null
          nom: string
          telephone: string | null
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          lien_parente?: string | null
          nom: string
          telephone?: string | null
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          lien_parente?: string | null
          nom?: string
          telephone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaires_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          capital_total: number
          conjoint_dob: string | null
          conjoint_name: string | null
          created_at: string | null
          date_effet: string
          date_expiration: string
          formule: string
          id: string
          kyc_documents: Json | null
          nb_ascendants: number | null
          nb_enfants: number | null
          police_number: string
          prime_annuelle: number
          principal_dob: string | null
          principal_name: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          capital_total: number
          conjoint_dob?: string | null
          conjoint_name?: string | null
          created_at?: string | null
          date_effet: string
          date_expiration: string
          formule: string
          id?: string
          kyc_documents?: Json | null
          nb_ascendants?: number | null
          nb_enfants?: number | null
          police_number: string
          prime_annuelle: number
          principal_dob?: string | null
          principal_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          capital_total?: number
          conjoint_dob?: string | null
          conjoint_name?: string | null
          created_at?: string | null
          date_effet?: string
          date_expiration?: string
          formule?: string
          id?: string
          kyc_documents?: Json | null
          nb_ascendants?: number | null
          nb_enfants?: number | null
          police_number?: string
          prime_annuelle?: number
          principal_dob?: string | null
          principal_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          contract_id: string | null
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          biometric_confirmed_at: string | null
          contract_id: string | null
          date_paiement: string | null
          id: string
          methode: string | null
          montant: number
          reference: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          biometric_confirmed_at?: string | null
          contract_id?: string | null
          date_paiement?: string | null
          id?: string
          methode?: string | null
          montant: number
          reference?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          biometric_confirmed_at?: string | null
          contract_id?: string | null
          date_paiement?: string | null
          id?: string
          methode?: string | null
          montant?: number
          reference?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          disabled_at: string | null
          email: string
          full_name: string | null
          id: string
          id_document_number: string | null
          id_document_type: string | null
          kyc_payload: Json | null
          kyc_provider: string | null
          kyc_session_id: string | null
          kyc_status: string | null
          kyc_verified_at: string | null
          phone: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          disabled_at?: string | null
          email: string
          full_name?: string | null
          id: string
          id_document_number?: string | null
          id_document_type?: string | null
          kyc_payload?: Json | null
          kyc_provider?: string | null
          kyc_session_id?: string | null
          kyc_status?: string | null
          kyc_verified_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          disabled_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          id_document_number?: string | null
          id_document_type?: string | null
          kyc_payload?: Json | null
          kyc_provider?: string | null
          kyc_session_id?: string | null
          kyc_status?: string | null
          kyc_verified_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sinistres: {
        Row: {
          beneficiaire_nom: string | null
          circonstances: string | null
          contract_id: string | null
          created_at: string | null
          date_deces: string | null
          documents_urls: string[] | null
          id: string
          lieu_deces: string | null
          methode_paiement: string | null
          nom_decede: string
          numero_paiement: string | null
          reference: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          beneficiaire_nom?: string | null
          circonstances?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_deces?: string | null
          documents_urls?: string[] | null
          id?: string
          lieu_deces?: string | null
          methode_paiement?: string | null
          nom_decede: string
          numero_paiement?: string | null
          reference: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          beneficiaire_nom?: string | null
          circonstances?: string | null
          contract_id?: string | null
          created_at?: string | null
          date_deces?: string | null
          documents_urls?: string[] | null
          id?: string
          lieu_deces?: string | null
          methode_paiement?: string | null
          nom_decede?: string
          numero_paiement?: string | null
          reference?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinistres_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_passkeys: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
