// Database types matching supabase/migrations. Regenerate with `npm run types:db` once Docker or a linked project is available.
// Hand-maintained until then: edit this file in the same commit as any migration that changes a table.

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export type AgeingBucket = 'current' | '1_30' | '31_60' | '61_90' | 'over_90'

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export type WorkerType = 'monthly' | 'daily'
export type PayrollRunStatus = 'draft' | 'approved' | 'paid'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type InvoiceStatus = 'draft' | 'issued' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | 'other'
export type PaymentStatus = 'draft' | 'unpaid' | 'part_paid' | 'paid' | 'overdue' | 'cancelled'

export type AppRole = 'owner' | 'accounts' | 'sales' | 'hr' | 'staff'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      company_profile: {
        Row: {
          id: number
          legal_name: string
          trade_name: string
          address_line1: string
          address_line2: string
          city: string
          state: string
          state_code: string
          pincode: string
          phone: string
          email: string
          website: string
          gstin: string
          pan: string
          bank_name: string
          bank_account_name: string
          bank_account_number: string
          bank_ifsc: string
          bank_branch: string
          logo_url: string
          invoice_terms: string
          invoice_footer: string
          default_gst_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          legal_name?: string
          trade_name?: string
          address_line1?: string
          address_line2?: string
          city?: string
          state?: string
          state_code?: string
          pincode?: string
          phone?: string
          email?: string
          website?: string
          gstin?: string
          pan?: string
          bank_name?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_ifsc?: string
          bank_branch?: string
          logo_url?: string
          invoice_terms?: string
          invoice_footer?: string
          default_gst_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          legal_name?: string
          trade_name?: string
          address_line1?: string
          address_line2?: string
          city?: string
          state?: string
          state_code?: string
          pincode?: string
          phone?: string
          email?: string
          website?: string
          gstin?: string
          pan?: string
          bank_name?: string
          bank_account_name?: string
          bank_account_number?: string
          bank_ifsc?: string
          bank_branch?: string
          logo_url?: string
          invoice_terms?: string
          invoice_footer?: string
          default_gst_rate?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          id: string
          name: string
          display_name: string
          is_client: boolean
          is_vendor: boolean
          contact_person: string
          phone: string
          email: string
          billing_address_line1: string
          billing_address_line2: string
          billing_city: string
          billing_state: string
          billing_state_code: string
          billing_pincode: string
          gstin: string
          pan: string
          payment_terms_days: number
          notes: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name?: string
          is_client?: boolean
          is_vendor?: boolean
          contact_person?: string
          phone?: string
          email?: string
          billing_address_line1?: string
          billing_address_line2?: string
          billing_city?: string
          billing_state?: string
          billing_state_code?: string
          billing_pincode?: string
          gstin?: string
          pan?: string
          payment_terms_days?: number
          notes?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_client?: boolean
          is_vendor?: boolean
          contact_person?: string
          phone?: string
          email?: string
          billing_address_line1?: string
          billing_address_line2?: string
          billing_city?: string
          billing_state?: string
          billing_state_code?: string
          billing_pincode?: string
          gstin?: string
          pan?: string
          payment_terms_days?: number
          notes?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          id: string
          label: string
          rate: number
          is_default: boolean
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          rate: number
          is_default?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          rate?: number
          is_default?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      document_series: {
        Row: {
          id: string
          doc_type: string
          financial_year: string
          prefix: string
          padding: number
          last_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doc_type: string
          financial_year: string
          prefix?: string
          padding?: number
          last_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doc_type?: string
          financial_year?: string
          prefix?: string
          padding?: number
          last_number?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          id: string
          quote_number: string | null
          status: QuoteStatus
          party_id: string
          issue_date: string
          valid_until: string | null
          is_gst_applicable: boolean
          gst_rate: number
          subtotal_paise: number
          igst_paise: number
          cgst_paise: number
          sgst_paise: number
          rounding_paise: number
          total_paise: number
          notes: string
          pdf_path: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          quote_number?: string | null
          status?: QuoteStatus
          party_id: string
          issue_date?: string
          valid_until?: string | null
          is_gst_applicable?: boolean
          gst_rate?: number
          subtotal_paise?: number
          igst_paise?: number
          cgst_paise?: number
          sgst_paise?: number
          rounding_paise?: number
          total_paise?: number
          notes?: string
          pdf_path?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          quote_number?: string | null
          status?: QuoteStatus
          party_id?: string
          issue_date?: string
          valid_until?: string | null
          is_gst_applicable?: boolean
          gst_rate?: number
          subtotal_paise?: number
          igst_paise?: number
          cgst_paise?: number
          sgst_paise?: number
          rounding_paise?: number
          total_paise?: number
          notes?: string
          pdf_path?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          position: number
          description: string
          width_ft: number | null
          height_ft: number | null
          quantity: number
          unit: string
          rate_paise: number
          amount_paise: number
          product_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          position?: number
          description: string
          width_ft?: number | null
          height_ft?: number | null
          quantity?: number
          unit?: string
          rate_paise?: number
          amount_paise?: number
          product_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          position?: number
          description?: string
          width_ft?: number | null
          height_ft?: number | null
          quantity?: number
          unit?: string
          rate_paise?: number
          amount_paise?: number
          product_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string | null
          status: InvoiceStatus
          party_id: string
          quote_id: string | null
          issue_date: string
          due_date: string | null
          is_gst_applicable: boolean
          gst_rate: number
          place_of_supply_state: string
          place_of_supply_code: string
          party_snapshot: Json
          subtotal_paise: number
          igst_paise: number
          cgst_paise: number
          sgst_paise: number
          rounding_paise: number
          total_paise: number
          notes: string
          pdf_path: string
          issued_at: string | null
          cancelled_at: string | null
          cancellation_reason: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          invoice_number?: string | null
          status?: InvoiceStatus
          party_id: string
          quote_id?: string | null
          issue_date?: string
          due_date?: string | null
          is_gst_applicable?: boolean
          gst_rate?: number
          place_of_supply_state?: string
          place_of_supply_code?: string
          party_snapshot?: Json
          subtotal_paise?: number
          igst_paise?: number
          cgst_paise?: number
          sgst_paise?: number
          rounding_paise?: number
          total_paise?: number
          notes?: string
          pdf_path?: string
          issued_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string | null
          status?: InvoiceStatus
          party_id?: string
          quote_id?: string | null
          issue_date?: string
          due_date?: string | null
          is_gst_applicable?: boolean
          gst_rate?: number
          place_of_supply_state?: string
          place_of_supply_code?: string
          party_snapshot?: Json
          subtotal_paise?: number
          igst_paise?: number
          cgst_paise?: number
          sgst_paise?: number
          rounding_paise?: number
          total_paise?: number
          notes?: string
          pdf_path?: string
          issued_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          position: number
          description: string
          width_ft: number | null
          height_ft: number | null
          quantity: number
          unit: string
          rate_paise: number
          amount_paise: number
          product_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          position?: number
          description: string
          width_ft?: number | null
          height_ft?: number | null
          quantity?: number
          unit?: string
          rate_paise?: number
          amount_paise?: number
          product_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          position?: number
          description?: string
          width_ft?: number | null
          height_ft?: number | null
          quantity?: number
          unit?: string
          rate_paise?: number
          amount_paise?: number
          product_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          paid_on: string
          amount_paise: number
          method: PaymentMethod
          reference: string
          notes: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          paid_on?: string
          amount_paise: number
          method?: PaymentMethod
          reference?: string
          notes?: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          paid_on?: string
          amount_paise?: number
          method?: PaymentMethod
          reference?: string
          notes?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          employee_code: string
          full_name: string
          designation: string
          worker_type: WorkerType
          default_amount_paise: number
          phone: string
          aadhaar_file_name: string | null
          aadhaar_path: string | null
          address: string
          joining_date: string | null
          bank_account_name: string
          bank_account_number: string
          bank_ifsc: string
          is_active: boolean
          notes: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          employee_code: string
          full_name: string
          designation?: string
          worker_type?: WorkerType
          default_amount_paise?: number
          phone?: string
          aadhaar_file_name?: string | null
          aadhaar_path?: string | null
          address?: string
          joining_date?: string | null
          bank_account_name?: string
          bank_account_number?: string
          bank_ifsc?: string
          is_active?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          employee_code?: string
          full_name?: string
          designation?: string
          worker_type?: WorkerType
          default_amount_paise?: number
          phone?: string
          aadhaar_file_name?: string | null
          aadhaar_path?: string | null
          address?: string
          joining_date?: string | null
          bank_account_name?: string
          bank_account_number?: string
          bank_ifsc?: string
          is_active?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          id: string
          period_month: string
          status: PayrollRunStatus
          days_in_period: number
          total_gross_paise: number
          total_net_paise: number
          employee_count: number
          notes: string
          approved_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          period_month: string
          status?: PayrollRunStatus
          days_in_period?: number
          total_gross_paise?: number
          total_net_paise?: number
          employee_count?: number
          notes?: string
          approved_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          period_month?: string
          status?: PayrollRunStatus
          days_in_period?: number
          total_gross_paise?: number
          total_net_paise?: number
          employee_count?: number
          notes?: string
          approved_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      payslips: {
        Row: {
          id: string
          run_id: string
          employee_id: string
          employee_code: string
          employee_name: string
          designation: string
          worker_type: WorkerType
          days_worked: number
          entered_amount_paise: number
          base_paise: number
          overtime_paise: number
          bonus_paise: number
          gross_paise: number
          net_paise: number
          pdf_path: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          run_id: string
          employee_id: string
          employee_code?: string
          employee_name?: string
          designation?: string
          worker_type?: WorkerType
          days_worked?: number
          entered_amount_paise?: number
          base_paise?: number
          overtime_paise?: number
          bonus_paise?: number
          gross_paise?: number
          net_paise?: number
          pdf_path?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          run_id?: string
          employee_id?: string
          employee_code?: string
          employee_name?: string
          designation?: string
          worker_type?: WorkerType
          days_worked?: number
          entered_amount_paise?: number
          base_paise?: number
          overtime_paise?: number
          bonus_paise?: number
          gross_paise?: number
          net_paise?: number
          pdf_path?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          spent_on: string
          category_id: string
          party_id: string | null
          description: string
          amount_paise: number
          tax_paise: number
          payment_method: PaymentMethod
          reference: string
          project_tag: string
          notes: string
          status: ExpenseStatus
          rejection_reason: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          spent_on?: string
          category_id: string
          party_id?: string | null
          description: string
          amount_paise: number
          tax_paise?: number
          payment_method?: PaymentMethod
          reference?: string
          project_tag?: string
          notes?: string
          status?: ExpenseStatus
          rejection_reason?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          spent_on?: string
          category_id?: string
          party_id?: string | null
          description?: string
          amount_paise?: number
          tax_paise?: number
          payment_method?: PaymentMethod
          reference?: string
          project_tag?: string
          notes?: string
          status?: ExpenseStatus
          rejection_reason?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      expense_attachments: {
        Row: {
          id: string
          expense_id: string
          storage_path: string
          file_name: string
          content_type: string
          size_bytes: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          expense_id: string
          storage_path: string
          file_name?: string
          content_type?: string
          size_bytes?: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          expense_id?: string
          storage_path?: string
          file_name?: string
          content_type?: string
          size_bytes?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: number
          table_name: string
          record_id: string | null
          operation: AuditOperation
          changed_fields: Json
          old_values: Json | null
          new_values: Json | null
          actor_id: string | null
          actor_email: string
          created_at: string
        }
        Insert: {
          id?: number
          table_name: string
          record_id?: string | null
          operation: AuditOperation
          changed_fields?: Json
          old_values?: Json | null
          new_values?: Json | null
          actor_id?: string | null
          actor_email?: string
          created_at?: string
        }
        Update: {
          id?: number
          table_name?: string
          record_id?: string | null
          operation?: AuditOperation
          changed_fields?: Json
          old_values?: Json | null
          new_values?: Json | null
          actor_id?: string | null
          actor_email?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: AppRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          role?: AppRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: AppRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          image_url: string
          image_urls: string[]
          specs: Json
          price_per_sqft: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          description?: string | null
          image_url: string
          image_urls?: string[] | null
          specs?: Json | null
          price_per_sqft?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          image_url?: string
          image_urls?: string[] | null
          specs?: Json | null
          price_per_sqft?: number
          created_at?: string | null
        }
        Relationships: []
      }
      page_media: {
        Row: {
          id: string
          page: string
          section: string
          title: string | null
          description: string | null
          action_text: string | null
          image_url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          page: string
          section: string
          title?: string | null
          description?: string | null
          action_text?: string | null
          image_url: string
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          page?: string
          section?: string
          title?: string | null
          description?: string | null
          action_text?: string | null
          image_url?: string
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          featured_image_url: string
          featured_image_alt: string
          featured_image_fit: string
          category: string
          tags: string[]
          author: string
          reading_time_minutes: number
          intro_html: string
          second_image_url: string | null
          second_image_alt: string | null
          second_image_fit: string
          sections: Json
          qa: Json
          cta: Json
          published_at: string
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          featured_image_url: string
          featured_image_alt: string
          featured_image_fit?: string
          category: string
          tags?: string[] | null
          author?: string
          reading_time_minutes?: number
          intro_html: string
          second_image_url?: string | null
          second_image_alt?: string | null
          second_image_fit?: string
          sections?: Json
          qa?: Json
          cta?: Json
          published_at?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          featured_image_url?: string
          featured_image_alt?: string
          featured_image_fit?: string
          category?: string
          tags?: string[] | null
          author?: string
          reading_time_minutes?: number
          intro_html?: string
          second_image_url?: string | null
          second_image_alt?: string | null
          second_image_fit?: string
          sections?: Json
          qa?: Json
          cta?: Json
          published_at?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["name"]
          },
        ]
      }
      blog_comments: {
        Row: {
          id: string
          post_id: string
          name: string
          email: string
          message: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          name: string
          email: string
          message: string
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          name?: string
          email?: string
          message?: string
          status?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      integrity_issues: {
        Row: {
          record_type: string
          record_id: string | null
          reference: string | null
          issue: string
        }
        Relationships: []
      }
      revenue_monthly: {
        Row: {
          period_month: string
          invoice_count: number
          net_revenue_paise: number
          output_tax_paise: number
          gross_revenue_paise: number
        }
        Relationships: []
      }
      collections_monthly: {
        Row: {
          period_month: string
          payment_count: number
          collected_paise: number
        }
        Relationships: []
      }
      payroll_monthly: {
        Row: {
          period_month: string
          status: PayrollRunStatus
          employee_count: number
          payroll_paise: number
        }
        Relationships: []
      }
      profit_and_loss_monthly: {
        Row: {
          period_month: string
          revenue_paise: number
          output_tax_paise: number
          expenses_paise: number
          input_tax_paise: number
          payroll_paise: number
          profit_paise: number
        }
        Relationships: []
      }
      gst_summary_monthly: {
        Row: {
          period_month: string
          taxable_sales_paise: number
          output_tax_paise: number
          input_tax_paise: number
          net_tax_paise: number
        }
        Relationships: []
      }
      receivables_ageing: {
        Row: {
          party_id: string
          invoice_id: string
          invoice_number: string | null
          issue_date: string
          due_date: string | null
          balance_paise: number
          ageing_bucket: AgeingBucket
        }
        Relationships: []
      }
      expense_monthly_summary: {
        Row: {
          period_month: string
          category_id: string
          category_name: string
          entry_count: number
          total_paise: number
          tax_paise: number
        }
        Relationships: []
      }
      employee_pay_history: {
        Row: {
          employee_id: string
          period_month: string
          run_status: PayrollRunStatus
          worker_type: WorkerType
          entered_amount_paise: number
          days_worked: number
          base_paise: number
          overtime_paise: number
          bonus_paise: number
          net_paise: number
        }
        Relationships: []
      }
      invoice_balances: {
        Row: {
          invoice_id: string
          invoice_number: string | null
          party_id: string
          status: InvoiceStatus
          issue_date: string
          due_date: string | null
          total_paise: number
          paid_paise: number
          balance_paise: number
          payment_status: PaymentStatus
          days_overdue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      allocate_document_number: {
        Args: { p_doc_type: string; p_date?: string }
        Returns: string
      }
      peek_document_number: {
        Args: { p_doc_type: string; p_date?: string }
        Returns: string
      }
      financial_year_of: {
        Args: { on_date: string }
        Returns: string
      }
    }
    Enums: {
      app_role: 'owner' | 'accounts' | 'sales' | 'hr' | 'staff'
    }
    CompositeTypes: Record<never, never>
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type CompanyProfile = Tables<'company_profile'>
export type Party = Tables<'parties'>
export type TaxRate = Tables<'tax_rates'>
export type DocumentSeries = Tables<'document_series'>
export type Quote = Tables<'quotes'>
export type QuoteItem = Tables<'quote_items'>
export type Invoice = Tables<'invoices'>
export type InvoiceItem = Tables<'invoice_items'>
export type Payment = Tables<'payments'>
export type Employee = Tables<'employees'>
export type PayrollRun = Tables<'payroll_runs'>
export type Payslip = Tables<'payslips'>
export type ExpenseCategory = Tables<'expense_categories'>
export type Expense = Tables<'expenses'>
export type ExpenseAttachment = Tables<'expense_attachments'>
export type ExpenseMonthlySummary = Database['public']['Views']['expense_monthly_summary']['Row']
export type RevenueMonthly = Database['public']['Views']['revenue_monthly']['Row']
export type CollectionsMonthly = Database['public']['Views']['collections_monthly']['Row']
export type PayrollMonthly = Database['public']['Views']['payroll_monthly']['Row']
export type ProfitAndLossMonthly = Database['public']['Views']['profit_and_loss_monthly']['Row']
export type GstSummaryMonthly = Database['public']['Views']['gst_summary_monthly']['Row']
export type ReceivablesAgeing = Database['public']['Views']['receivables_ageing']['Row']
export type AuditLog = Tables<'audit_log'>
export type IntegrityIssue = Database['public']['Views']['integrity_issues']['Row']
export type EmployeePayHistory = Database['public']['Views']['employee_pay_history']['Row']
export type InvoiceBalance = Database['public']['Views']['invoice_balances']['Row']
export type Product = Tables<'products'>
export type Category = Tables<'categories'>
export type PageMedia = Tables<'page_media'>
export type BlogPost = Tables<'blog_posts'>
export type BlogCategory = Tables<'blog_categories'>
export type BlogComment = Tables<'blog_comments'>

// Narrowed views of columns the database stores loosely. JSONB and CHECK-constrained TEXT cannot carry their real shape through type generation, so pages cast at the query boundary rather than pushing `Json` into components.
export type ImageFit = 'cover' | 'contain'
export type ProductSpecs = Record<string, string>

export type BlogSubsection = {
  heading: string
  body_html: string
}

export type BlogSection = {
  heading: string
  body_html: string
  subsections: BlogSubsection[]
}

export type BlogQA = {
  question: string
  answer: string
}

export type BlogCtaButton = {
  label: string
  href: string
}

export type BlogCta = {
  intro: string
  buttons: BlogCtaButton[]
}

export type ProductRow = Omit<Product, 'specs'> & { specs: ProductSpecs }

export type BlogPostRow = Omit<BlogPost, 'featured_image_fit' | 'second_image_fit' | 'sections' | 'qa' | 'cta'> & {
  featured_image_fit: ImageFit
  second_image_fit: ImageFit
  sections: BlogSection[]
  qa: BlogQA[]
  cta: BlogCta
}
