/**
 * Tipos TypeScript generados manualmente a partir del esquema en:
 * supabase/migrations/20260514121400_initial_schema.sql
 *
 * En producción, generar automáticamente con:
 *   npx supabase gen types typescript --local > src/lib/database.types.ts
 */

export type RoleEnum = "administrator" | "receptionist";
export type MembershipStatus = "active" | "expired" | "cancelled";
export type TransactionType = "income" | "expense";
export type PaymentMethod = "efectivo" | "tarjeta" | "yape";

// ─── Tablas ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string; // UUID – FK a auth.users
  first_name: string;
  last_name: string;
  role: RoleEnum;
  created_at: string; // TIMESTAMPTZ como ISO string
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  dni: string;
  phone: string | null;
  status: string; // 'active' | 'inactive'
  join_date: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
}

export interface Membership {
  id: string;
  client_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  created_at: string;
  // Relaciones opcionales (eager load)
  membership_plans?: MembershipPlan;
  clients?: Client;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  price: number;
  stock: number;
  image_url: string | null;
  // Relaciones opcionales
  categories?: Category;
}

export interface Sale {
  id: string;
  client_id: string | null;
  total: number;
  created_at: string;
  status: string;
  seller_id: string | null;
  payment_method: PaymentMethod;
  // Relaciones opcionales
  clients?: Client;
  profiles?: Profile;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  membership_id: string | null;
  plan_id: string | null;
  quantity: number;
  unit_price: number;
  // Relaciones opcionales
  products?: Product;
  memberships?: Membership;
  membership_plans?: MembershipPlan;
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  category: string | null;
  sale_id: string | null;
}

export interface ClientCredit {
  id: string;
  client_id: string;
  balance: number; // Deuda actual (positivo = debe)
  last_updated: string;
  // Relaciones opcionales
  clients?: Client;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  client_id: string | null;
  action_type: string;
  description: string;
  is_error: boolean;
  created_at: string;
  // Relaciones opcionales
  profiles?: Profile;
  clients?: Client;
}

export interface ClientAttendance {
  id: string;
  client_id: string;
  registered_by: string | null;
  attendance_at: string;
  attendance_date: string;
  created_at: string;
  clients?: Client;
  profiles?: Profile;
}

// ─── Tipo Database para el cliente Supabase ───────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "join_date"> & { id?: string; join_date?: string };
        Update: Partial<Omit<Client, "id">>;
      };
      membership_plans: {
        Row: MembershipPlan;
        Insert: Omit<MembershipPlan, "id"> & { id?: string };
        Update: Partial<Omit<MembershipPlan, "id">>;
      };
      memberships: {
        Row: Membership;
        Insert: Omit<Membership, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Membership, "id">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id"> & { id?: string };
        Update: Partial<Omit<Category, "id">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id"> & { id?: string };
        Update: Partial<Omit<Product, "id">>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, "id" | "created_at"> & { id?: string; created_at?: string; payment_method?: PaymentMethod };
        Update: Partial<Omit<Sale, "id">>;
      };
      sale_items: {
        Row: SaleItem;
        Insert: Omit<SaleItem, "id"> & { id?: string; plan_id?: string | null };
        Update: Partial<Omit<SaleItem, "id">>;
      };
      financial_transactions: {
        Row: FinancialTransaction;
        Insert: Omit<FinancialTransaction, "id" | "date"> & { id?: string; date?: string };
        Update: Partial<Omit<FinancialTransaction, "id">>;
      };
      client_credits: {
        Row: ClientCredit;
        Insert: Omit<ClientCredit, "id" | "last_updated"> & { id?: string; last_updated?: string };
        Update: Partial<Omit<ClientCredit, "id">>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<ActivityLog, "id">>;
      };
      client_attendances: {
        Row: ClientAttendance;
        Insert: Omit<ClientAttendance, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<ClientAttendance, "id">>;
      };
    };
    Enums: {
      role_enum: RoleEnum;
      membership_status: MembershipStatus;
      transaction_type: TransactionType;
    };
  };
}
