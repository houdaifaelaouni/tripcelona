export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor: string | null;
          created_at: string;
          diff: Json | null;
          entity: string;
          entity_id: string | null;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity: string;
          entity_id?: string | null;
          id?: never;
        };
        Update: {
          action?: string;
          actor?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: never;
        };
        Relationships: [];
      };
      booking_emails: {
        Row: {
          attempts: number;
          booking_id: string;
          created_at: string;
          error: string | null;
          id: string;
          kind: string;
          provider_id: string | null;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          attempts?: number;
          booking_id: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          kind: string;
          provider_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          booking_id?: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          kind?: string;
          provider_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_emails_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_travellers: {
        Row: {
          age_group: string | null;
          booking_id: string;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          age_group?: string | null;
          booking_id: string;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          age_group?: string | null;
          booking_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_travellers_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          cart_id: string | null;
          created_at: string;
          customer_name: string;
          departure_id: string;
          email: string;
          id: string;
          notes: string | null;
          phone: string | null;
          pickup_note: string | null;
          reference: string;
          status: Database["public"]["Enums"]["booking_status"];
          terms_accepted_at: string | null;
          total_cents: number;
          travellers: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cart_id?: string | null;
          created_at?: string;
          customer_name: string;
          departure_id: string;
          email: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          pickup_note?: string | null;
          reference?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          terms_accepted_at?: string | null;
          total_cents: number;
          travellers: number;
          updated_at?: string;
        };
        Update: {
          cart_id?: string | null;
          created_at?: string;
          customer_name?: string;
          departure_id?: string;
          email?: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          pickup_note?: string | null;
          reference?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          terms_accepted_at?: string | null;
          total_cents?: number;
          travellers?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_departure_id_fkey";
            columns: ["departure_id"];
            isOneToOne: false;
            referencedRelation: "tour_departures";
            referencedColumns: ["id"];
          },
        ];
      };
      content_translations: {
        Row: {
          entity: string;
          entity_id: string;
          field: string;
          locale: string;
          updated_at: string;
          value: Json;
        };
        ComputedFields: never;
        Insert: {
          entity: string;
          entity_id: string;
          field: string;
          locale: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          entity?: string;
          entity_id?: string;
          field?: string;
          locale?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string;
          cta_label: string | null;
          cta_url: string | null;
          description: Json | null;
          ends_at: string | null;
          id: string;
          image_id: string | null;
          location: string | null;
          price_cents: number | null;
          slug: string;
          starts_at: string;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          description?: Json | null;
          ends_at?: string | null;
          id?: string;
          image_id?: string | null;
          location?: string | null;
          price_cents?: number | null;
          slug: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          description?: Json | null;
          ends_at?: string | null;
          id?: string;
          image_id?: string | null;
          location?: string | null;
          price_cents?: number | null;
          slug?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      faqs: {
        Row: {
          answer: string;
          category: string | null;
          created_at: string;
          id: string;
          question: string;
          sort_order: number;
          source_url: string | null;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          answer: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          question: string;
          sort_order?: number;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          answer?: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          question?: string;
          sort_order?: number;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      form_rate_limits: {
        Row: {
          hits: number;
          key: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          hits?: number;
          key: string;
          window_start: string;
        };
        Update: {
          hits?: number;
          key?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          admin_notes: string | null;
          created_at: string;
          email_error: string | null;
          id: string;
          notified_at: string | null;
          payload: NonNullable<Json>;
          source: string;
          status: Database["public"]["Enums"]["request_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          admin_notes?: string | null;
          created_at?: string;
          email_error?: string | null;
          id?: string;
          notified_at?: string | null;
          payload: NonNullable<Json>;
          source: string;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string;
          email_error?: string | null;
          id?: string;
          notified_at?: string | null;
          payload?: NonNullable<Json>;
          source?: string;
          status?: Database["public"]["Enums"]["request_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          alt: string | null;
          bucket: string;
          created_at: string;
          height: number | null;
          id: string;
          mime: string | null;
          path: string;
          size_bytes: number | null;
          source_url: string | null;
          updated_at: string;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          alt?: string | null;
          bucket?: string;
          created_at?: string;
          height?: number | null;
          id?: string;
          mime?: string | null;
          path: string;
          size_bytes?: number | null;
          source_url?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          alt?: string | null;
          bucket?: string;
          created_at?: string;
          height?: number | null;
          id?: string;
          mime?: string | null;
          path?: string;
          size_bytes?: number | null;
          source_url?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          content: Json | null;
          created_at: string;
          id: string;
          kind: string;
          published_at: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          source_url: string | null;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          content?: Json | null;
          created_at?: string;
          id?: string;
          kind?: string;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: Json | null;
          created_at?: string;
          id?: string;
          kind?: string;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          event_key: string;
          id: string;
          outcome: string | null;
          payload: NonNullable<Json>;
          provider: string;
          provider_ref: string;
          received_at: string;
        };
        ComputedFields: never;
        Insert: {
          event_key: string;
          id?: string;
          outcome?: string | null;
          payload: NonNullable<Json>;
          provider: string;
          provider_ref: string;
          received_at?: string;
        };
        Update: {
          event_key?: string;
          id?: string;
          outcome?: string | null;
          payload?: NonNullable<Json>;
          provider?: string;
          provider_ref?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_cents: number;
          booking_id: string;
          cart_id: string | null;
          created_at: string;
          id: string;
          provider: string;
          provider_ref: string;
          raw_event: Json | null;
          refund_raw: Json | null;
          refunded_at: string | null;
          refunded_cents: number;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          booking_id: string;
          cart_id?: string | null;
          created_at?: string;
          id?: string;
          provider: string;
          provider_ref: string;
          raw_event?: Json | null;
          refund_raw?: Json | null;
          refunded_at?: string | null;
          refunded_cents?: number;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          booking_id?: string;
          cart_id?: string | null;
          created_at?: string;
          id?: string;
          provider?: string;
          provider_ref?: string;
          raw_event?: Json | null;
          refund_raw?: Json | null;
          refunded_at?: string | null;
          refunded_cents?: number;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          content: Json | null;
          cover_id: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          published_at: string | null;
          reading_minutes: number | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          source_url: string | null;
          status: Database["public"]["Enums"]["content_status"];
          tags: string[];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          content?: Json | null;
          cover_id?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          reading_minutes?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: Json | null;
          cover_id?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          reading_minutes?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_cover_id_fkey";
            columns: ["cover_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["staff_role"] | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["staff_role"] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["staff_role"] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      redirects: {
        Row: {
          created_at: string;
          from_path: string;
          id: string;
          status_code: number;
          to_path: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_path: string;
          id?: string;
          status_code?: number;
          to_path: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          from_path?: string;
          id?: string;
          status_code?: number;
          to_path?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          author: string;
          created_at: string;
          id: string;
          rating: number | null;
          source: string;
          status: Database["public"]["Enums"]["review_status"];
          text: string;
          tour_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author: string;
          created_at?: string;
          id?: string;
          rating?: number | null;
          source: string;
          status?: Database["public"]["Enums"]["review_status"];
          text: string;
          tour_id?: string | null;
          updated_at?: string;
        };
        Update: {
          author?: string;
          created_at?: string;
          id?: string;
          rating?: number | null;
          source?: string;
          status?: Database["public"]["Enums"]["review_status"];
          text?: string;
          tour_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      seat_holds: {
        Row: {
          booking_id: string | null;
          created_at: string;
          departure_id: string;
          expires_at: string;
          id: string;
          qty: number;
          status: Database["public"]["Enums"]["hold_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          booking_id?: string | null;
          created_at?: string;
          departure_id: string;
          expires_at: string;
          id?: string;
          qty: number;
          status?: Database["public"]["Enums"]["hold_status"];
          updated_at?: string;
        };
        Update: {
          booking_id?: string | null;
          created_at?: string;
          departure_id?: string;
          expires_at?: string;
          id?: string;
          qty?: number;
          status?: Database["public"]["Enums"]["hold_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seat_holds_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seat_holds_departure_id_fkey";
            columns: ["departure_id"];
            isOneToOne: false;
            referencedRelation: "tour_departures";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          created_at: string;
          is_public: boolean;
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          is_public?: boolean;
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          created_at?: string;
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      tour_departures: {
        Row: {
          capacity: number;
          created_at: string;
          ends_at: string | null;
          id: string;
          notes: string | null;
          price_cents: number;
          seats_taken: number;
          starts_at: string;
          status: Database["public"]["Enums"]["departure_status"];
          tour_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          capacity: number;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          notes?: string | null;
          price_cents: number;
          seats_taken?: number;
          starts_at: string;
          status?: Database["public"]["Enums"]["departure_status"];
          tour_id: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          notes?: string | null;
          price_cents?: number;
          seats_taken?: number;
          starts_at?: string;
          status?: Database["public"]["Enums"]["departure_status"];
          tour_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_departures_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_faqs: {
        Row: {
          answer: string;
          created_at: string;
          id: string;
          question: string;
          sort_order: number;
          tour_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          answer: string;
          created_at?: string;
          id?: string;
          question: string;
          sort_order?: number;
          tour_id: string;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          created_at?: string;
          id?: string;
          question?: string;
          sort_order?: number;
          tour_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_faqs_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_images: {
        Row: {
          alt: string | null;
          created_at: string;
          id: string;
          media_id: string | null;
          sort_order: number;
          storage_path: string;
          tour_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          media_id?: string | null;
          sort_order?: number;
          storage_path: string;
          tour_id: string;
          updated_at?: string;
        };
        Update: {
          alt?: string | null;
          created_at?: string;
          id?: string;
          media_id?: string | null;
          sort_order?: number;
          storage_path?: string;
          tour_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_images_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tour_images_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_itinerary: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          sort_order: number;
          time_label: string | null;
          title: string;
          tour_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          sort_order?: number;
          time_label?: string | null;
          title: string;
          tour_id: string;
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          sort_order?: number;
          time_label?: string | null;
          title?: string;
          tour_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_itinerary_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_requests: {
        Row: {
          admin_notes: string | null;
          budget: string | null;
          company: string | null;
          created_at: string;
          email: string;
          email_error: string | null;
          extras: string[];
          group_size: number | null;
          id: string;
          message: string | null;
          name: string;
          notified_at: string | null;
          phone: string | null;
          preferred_dates: string | null;
          privacy_accepted_at: string | null;
          status: Database["public"]["Enums"]["request_status"];
          tour_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          admin_notes?: string | null;
          budget?: string | null;
          company?: string | null;
          created_at?: string;
          email: string;
          email_error?: string | null;
          extras?: string[];
          group_size?: number | null;
          id?: string;
          message?: string | null;
          name: string;
          notified_at?: string | null;
          phone?: string | null;
          preferred_dates?: string | null;
          privacy_accepted_at?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          tour_id?: string | null;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          budget?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string;
          email_error?: string | null;
          extras?: string[];
          group_size?: number | null;
          id?: string;
          message?: string | null;
          name?: string;
          notified_at?: string | null;
          phone?: string | null;
          preferred_dates?: string | null;
          privacy_accepted_at?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          tour_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_requests_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tours: {
        Row: {
          area: string | null;
          area_slug: string | null;
          created_at: string;
          description: Json | null;
          difficulty: string | null;
          duration_minutes: number | null;
          exclusions: NonNullable<Json>;
          hero_image_id: string | null;
          highlights: NonNullable<Json>;
          id: string;
          inclusions: NonNullable<Json>;
          map_url: string | null;
          meeting_point: string | null;
          packing_list: NonNullable<Json>;
          price_from_cents: number | null;
          published_at: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          subtitle: string | null;
          summary: string | null;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          area?: string | null;
          area_slug?: string | null;
          created_at?: string;
          description?: Json | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          exclusions?: NonNullable<Json>;
          hero_image_id?: string | null;
          highlights?: NonNullable<Json>;
          id?: string;
          inclusions?: NonNullable<Json>;
          map_url?: string | null;
          meeting_point?: string | null;
          packing_list?: NonNullable<Json>;
          price_from_cents?: number | null;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          subtitle?: string | null;
          summary?: string | null;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          area?: string | null;
          area_slug?: string | null;
          created_at?: string;
          description?: Json | null;
          difficulty?: string | null;
          duration_minutes?: number | null;
          exclusions?: NonNullable<Json>;
          hero_image_id?: string | null;
          highlights?: NonNullable<Json>;
          id?: string;
          inclusions?: NonNullable<Json>;
          map_url?: string | null;
          meeting_point?: string | null;
          packing_list?: NonNullable<Json>;
          price_from_cents?: number | null;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          subtitle?: string | null;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tours_hero_image_id_fkey";
            columns: ["hero_image_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_payment_result: {
        Args: {
          p_amount_cents: number;
          p_authorized: boolean;
          p_event_key: string;
          p_payload: Json;
          p_provider: string;
          p_provider_ref: string;
        };
        Returns: string;
      };
      confirm_hold: { Args: { p_booking_id: string; p_hold_id: string }; Returns: boolean };
      current_staff_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["staff_role"];
      };
      hit_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      hold_seats: {
        Args: { p_departure_id: string; p_qty: number; p_ttl?: string };
        Returns: string;
      };
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      media_usage: { Args: { p_media_id: string }; Returns: number };
      next_booking_reference: { Args: Record<PropertyKey, never>; Returns: string };
      release_booking_seats: { Args: { p_booking_id: string }; Returns: number };
      release_expired_holds: { Args: Record<PropertyKey, never>; Returns: number };
      release_hold: { Args: { p_hold_id: string }; Returns: boolean };
      staff_members: {
        Args: Record<PropertyKey, never>;
        Returns: {
          email: string;
          full_name: string;
          id: string;
          last_sign_in_at: string;
          role: Database["public"]["Enums"]["staff_role"];
        }[];
      };
    };
    Enums: {
      booking_status: "pending" | "paid" | "cancelled" | "refunded";
      content_status: "draft" | "published" | "archived";
      departure_status: "open" | "sold_out" | "cancelled";
      hold_status: "held" | "confirmed" | "released";
      payment_status: "pending" | "succeeded" | "failed" | "refunded";
      request_status: "new" | "quoted" | "won" | "lost";
      review_status: "pending" | "approved" | "hidden";
      staff_role: "owner" | "editor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["pending", "paid", "cancelled", "refunded"],
      content_status: ["draft", "published", "archived"],
      departure_status: ["open", "sold_out", "cancelled"],
      hold_status: ["held", "confirmed", "released"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      request_status: ["new", "quoted", "won", "lost"],
      review_status: ["pending", "approved", "hidden"],
      staff_role: ["owner", "editor"],
    },
  },
} as const;
