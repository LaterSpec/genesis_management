# GenesisGym ERD (Entity Relationship Diagram)

Diagrama relacional basado en las especificaciones del proyecto y Supabase (PostgreSQL).

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        string first_name
        string last_name
        enum role "administrator | receptionist"
        timestamptz created_at
    }
    
    CLIENTS {
        uuid id PK
        string first_name
        string last_name
        string email
        string status
        timestamptz join_date
    }
    
    MEMBERSHIP_PLANS {
        uuid id PK
        string name
        string description
        numeric price
        int duration_days
    }
    
    MEMBERSHIPS {
        uuid id PK
        uuid client_id FK
        uuid plan_id FK
        timestamptz start_date
        timestamptz end_date
        enum status "active | expired | cancelled"
        timestamptz created_at
    }
    
    CATEGORIES {
        uuid id PK
        string name
    }
    
    PRODUCTS {
        uuid id PK
        string sku
        string name
        uuid category_id FK
        numeric price
        int stock
        string image_url "nullable"
    }
    
    SALES {
        uuid id PK
        uuid client_id FK "nullable"
        uuid seller_id FK
        bigint cash_session_id FK "nullable"
        numeric total
        string status
        timestamptz created_at
    }
    
    SALE_ITEMS {
        uuid id PK
        uuid sale_id FK
        uuid product_id FK "nullable"
        uuid membership_id FK "nullable"
        int quantity
        numeric unit_price
    }
    
    FINANCIAL_TRANSACTIONS {
        uuid id PK
        uuid sale_id FK "nullable"
        string type "income | expense"
        numeric amount
        string description
        string category
        timestamptz date
    }
    
    CLIENT_CREDITS {
        uuid id PK
        uuid client_id FK
        numeric balance "Deuda"
        timestamptz last_updated
    }
    
    ACTIVITY_LOGS {
        uuid id PK
        uuid user_id FK "nullable"
        uuid client_id FK "nullable"
        string action_type
        string description
        boolean is_error
        timestamptz created_at
    }

    CASH_SESSIONS {
        bigint id PK
        uuid user_id FK
        timestamptz opened_at
        timestamptz closed_at "nullable"
        string status "open | closed"
        numeric initial_amount
    }

    PROFILES ||--o{ SALES : "processes"
    PROFILES ||--o{ ACTIVITY_LOGS : "performs"
    PROFILES ||--o{ CASH_SESSIONS : "opens"
    CASH_SESSIONS ||--o{ SALES : "contains"
    CLIENTS ||--o{ MEMBERSHIPS : "has"
    CLIENTS ||--o{ SALES : "makes"
    CLIENTS ||--o| CLIENT_CREDITS : "owes"
    CLIENTS ||--o{ ACTIVITY_LOGS : "involved_in"
    MEMBERSHIP_PLANS ||--o{ MEMBERSHIPS : "defines"
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    SALES ||--|{ SALE_ITEMS : "contains"
    PRODUCTS ||--o{ SALE_ITEMS : "included_as"
    MEMBERSHIPS ||--o{ SALE_ITEMS : "included_as"
    SALES ||--o| FINANCIAL_TRANSACTIONS : "generates"
```,StartLine:57,TargetContent:
```
