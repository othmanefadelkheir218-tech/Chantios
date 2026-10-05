-- CreateEnum
CREATE TYPE "tenant_status" AS ENUM ('active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('trialing', 'active', 'past_due', 'cancelled');

-- CreateEnum
CREATE TYPE "client_type" AS ENUM ('individual', 'professional', 'property_manager');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('prospect', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "quote_status" AS ENUM ('draft', 'sent', 'accepted', 'refused');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('transfer', 'cheque', 'cash', 'stripe');

-- CreateEnum
CREATE TYPE "purchase_invoice_status" AS ENUM ('to_pay', 'paid');

-- CreateEnum
CREATE TYPE "purchase_invoice_type" AS ENUM ('subcontractor', 'supplier');

-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM ('purchase', 'consumption', 'adjustment');

-- CreateEnum
CREATE TYPE "reservation_status" AS ENUM ('active', 'released', 'consumed');

-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('meeting', 'work');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('planned', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "conversation_type" AS ENUM ('internal', 'project_client', 'support');

-- CreateEnum
CREATE TYPE "sender_type" AS ENUM ('employee', 'client', 'admin');

-- CreateEnum
CREATE TYPE "portal_event_type" AS ENUM ('view', 'download');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('quote', 'invoice', 'purchase_invoice');

-- CreateEnum
CREATE TYPE "one_time_code_type" AS ENUM ('password_reset', 'email_verification', 'admin_2fa');

-- CreateEnum
CREATE TYPE "margin_alert_level" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "permission_scope" AS ENUM ('all', 'own');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('open', 'in_progress', 'waiting_tenant', 'closed');

-- CreateEnum
CREATE TYPE "ticket_category" AS ENUM ('bug', 'question', 'billing', 'other');

-- CreateEnum
CREATE TYPE "ticket_priority" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "feedback_type" AS ENUM ('feature_request', 'improvement', 'complaint');

-- CreateEnum
CREATE TYPE "feedback_status" AS ENUM ('new', 'reviewing', 'planned', 'declined', 'shipped');

-- CreateEnum
CREATE TYPE "permission_module" AS ENUM ('clients', 'projects', 'tasks', 'time_entries', 'catalogue', 'stock', 'quotes', 'invoices', 'purchase_invoices', 'margins', 'subcontractors', 'reports', 'media', 'chat', 'team', 'settings');

-- CreateEnum
CREATE TYPE "media_entity_type" AS ENUM ('user', 'tenant', 'project', 'report', 'purchase_invoice', 'quote', 'invoice', 'message');

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "vat_number" TEXT,
    "registration_number" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "postal_code" TEXT,
    "city" TEXT,
    "country" CHAR(2),
    "logo_media_id" INTEGER,
    "default_vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    "default_payment_days" SMALLINT NOT NULL DEFAULT 30,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Brussels',
    "end_of_day_reminder_time" TIME(6) NOT NULL DEFAULT '18:00:00'::time without time zone,
    "status" "tenant_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "totp_secret" TEXT,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "parent_plan_id" INTEGER,
    "stripe_price_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" SERIAL NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "feature_key" TEXT NOT NULL,
    "limit_value" INTEGER NOT NULL,
    "overage_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "status" "subscription_status" NOT NULL DEFAULT 'trialing',
    "period_start" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "pending_plan_id" INTEGER,
    "pending_plan_effective_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_usage_snapshots" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "snapshot_taken_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feature_key" TEXT NOT NULL,
    "actual_count" DECIMAL(14,3) NOT NULL,
    "included_allowance" INTEGER NOT NULL,
    "overage_rate" DECIMAL(12,2) NOT NULL,
    "overage_amount" DECIMAL(12,2) NOT NULL,
    "stripe_invoice_id" TEXT,

    CONSTRAINT "billing_usage_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" SERIAL NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER,
    "admin_user_id" INTEGER,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "event_name" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "submitted_by" INTEGER NOT NULL,
    "type" "feedback_type" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" "feedback_status" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "opened_by" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "ticket_category" NOT NULL DEFAULT 'question',
    "priority" "ticket_priority" NOT NULL DEFAULT 'normal',
    "status" "ticket_status" NOT NULL DEFAULT 'open',
    "assigned_admin_id" INTEGER,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "role_id" SMALLINT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "mobile_pin_hash" TEXT,
    "failed_pin_count" SMALLINT NOT NULL DEFAULT 0,
    "hourly_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "role_id" SMALLINT NOT NULL,
    "module" "permission_module" NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "scope" "permission_scope" NOT NULL DEFAULT 'all',

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "admin_user_id" INTEGER,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" INET,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_invitations" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role_id" SMALLINT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_time_codes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "admin_user_id" INTEGER,
    "type" "one_time_code_type" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "attempt_count" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "one_time_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "type" "client_type" NOT NULL DEFAULT 'individual',
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_secondary" TEXT,
    "vat_number" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "postal_code" TEXT,
    "city" TEXT,
    "country" CHAR(2),
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "project_status" NOT NULL DEFAULT 'prospect',
    "address_line1" TEXT,
    "address_line2" TEXT,
    "postal_code" TEXT,
    "city" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "actual_end_date" DATE,
    "manager_id" INTEGER,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_status_history" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "from_status" "project_status",
    "to_status" "project_status" NOT NULL,
    "reason" TEXT,
    "changed_by" INTEGER,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price_excl_vat" DECIMAL(12,2) NOT NULL,
    "default_vat_rate" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "purchase_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "minimum_stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_materials" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity_per_unit" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "service_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "report_id" INTEGER,
    "purchase_invoice_id" INTEGER,
    "type" "stock_movement_type" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "movement_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "note" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "reserved_quantity" DECIMAL(12,3) NOT NULL,
    "remaining_quantity" DECIMAL(12,3) NOT NULL,
    "status" "reservation_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "task_type" NOT NULL DEFAULT 'work',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "task_status" NOT NULL DEFAULT 'planned',
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignees" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "task_id" INTEGER,
    "work_date" DATE NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "hourly_rate" DECIMAL(12,2) NOT NULL,
    "comment" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "report_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "progress_pct" INTEGER NOT NULL,
    "weather" TEXT,
    "note" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_counters" (
    "tenant_id" INTEGER NOT NULL,
    "document_type" "document_type" NOT NULL,
    "year" SMALLINT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_counters_pkey" PRIMARY KEY ("tenant_id","document_type","year")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "status" "quote_status" NOT NULL DEFAULT 'draft',
    "issue_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "valid_until" DATE,
    "default_vat_rate" DECIMAL(5,2) NOT NULL,
    "amount_excl_vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_incl_vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "refused_at" TIMESTAMPTZ(6),
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "service_id" INTEGER,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price_excl_vat" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "total_excl_vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "quote_id" INTEGER,
    "number" TEXT NOT NULL,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "issue_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "due_date" DATE NOT NULL,
    "default_vat_rate" DECIMAL(5,2) NOT NULL,
    "amount_excl_vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_incl_vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "reminder_count" SMALLINT NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMPTZ(6),
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "service_id" INTEGER,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price_excl_vat" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL,
    "total_excl_vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "payment_method" NOT NULL,
    "reference" TEXT,
    "payment_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontractors" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "company_name" TEXT NOT NULL,
    "trade" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "vat_number" TEXT,
    "hourly_rate" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "vat_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontractor_contracts" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "subcontractor_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "description" TEXT,
    "amount_excl_vat" DECIMAL(12,2) NOT NULL,
    "status" "contract_status" NOT NULL DEFAULT 'in_progress',
    "start_date" DATE,
    "end_date" DATE,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcontractor_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_types" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "type" "purchase_invoice_type" NOT NULL,
    "cost_type_id" INTEGER NOT NULL,
    "subcontractor_contract_id" INTEGER,
    "supplier_id" INTEGER,
    "project_id" INTEGER,
    "number" TEXT NOT NULL,
    "external_number" TEXT,
    "amount_excl_vat" DECIMAL(12,2) NOT NULL,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    "vat_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_incl_vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "status" "purchase_invoice_status" NOT NULL DEFAULT 'to_pay',
    "payment_reference" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_closure_snapshots" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "budget_excl_vat" DECIMAL(12,2) NOT NULL,
    "total_cost" DECIMAL(12,2) NOT NULL,
    "margin_excl_vat" DECIMAL(12,2) NOT NULL,
    "margin_pct" DECIMAL(5,2),
    "closed_by" INTEGER,
    "closed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided_at" TIMESTAMPTZ(6),
    "voided_by" INTEGER,

    CONSTRAINT "project_closure_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_closure_snapshot_costs" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "snapshot_id" INTEGER NOT NULL,
    "cost_type_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "project_closure_snapshot_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_margin_alerts" (
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "level" "margin_alert_level" NOT NULL,
    "fired_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_margin_alerts_pkey" PRIMARY KEY ("project_id","level")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "entity_type" "media_entity_type" NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER,
    "user_id" INTEGER,
    "admin_user_id" INTEGER,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_tokens" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_tracking" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "portal_token_id" INTEGER NOT NULL,
    "event_type" "portal_event_type" NOT NULL,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "type" "conversation_type" NOT NULL,
    "project_id" INTEGER,
    "support_ticket_id" INTEGER,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "client_id" INTEGER,
    "admin_user_id" INTEGER,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_type" "sender_type" NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reads" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "client_id" INTEGER,
    "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_id_feature_key_key" ON "plan_features"("plan_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subscriptions_tenant_id_key" ON "tenant_subscriptions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_usage_snapshots_tenant_id_period_start_feature_key_key" ON "billing_usage_snapshots"("tenant_id", "period_start", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_events_stripe_event_id_key" ON "stripe_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_tenant_id_created_at_idx" ON "analytics_events"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "support_tickets_tenant_id_status_idx" ON "support_tickets"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_tenant_id_role_id_module_key" ON "role_permissions"("tenant_id", "role_id", "module");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_invitations_token_hash_key" ON "user_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "clients_tenant_id_idx" ON "clients"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_tenant_id_email_key" ON "clients"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "projects_tenant_id_status_idx" ON "projects"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "project_status_history_project_id_changed_at_idx" ON "project_status_history"("project_id", "changed_at");

-- CreateIndex
CREATE INDEX "services_tenant_id_idx" ON "services"("tenant_id");

-- CreateIndex
CREATE INDEX "materials_tenant_id_idx" ON "materials"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_materials_service_id_material_id_key" ON "service_materials"("service_id", "material_id");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_material_id_idx" ON "stock_movements"("tenant_id", "material_id");

-- CreateIndex
CREATE INDEX "stock_movements_project_id_idx" ON "stock_movements"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_reservations_project_id_material_id_key" ON "stock_reservations"("project_id", "material_id");

-- CreateIndex
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_tenant_id_id_key" ON "tasks"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "task_assignees_user_id_idx" ON "task_assignees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignees_task_id_user_id_key" ON "task_assignees"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "time_entries_user_id_work_date_idx" ON "time_entries"("user_id", "work_date");

-- CreateIndex
CREATE INDEX "time_entries_project_id_idx" ON "time_entries"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_entries_user_id_project_id_work_date_key" ON "time_entries"("user_id", "project_id", "work_date");

-- CreateIndex
CREATE UNIQUE INDEX "reports_tenant_id_project_id_report_date_key" ON "reports"("tenant_id", "project_id", "report_date");

-- CreateIndex
CREATE INDEX "quotes_project_id_status_idx" ON "quotes"("project_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_tenant_id_number_key" ON "quotes"("tenant_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_tenant_id_id_key" ON "quotes"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "quote_lines_quote_id_position_idx" ON "quote_lines"("quote_id", "position");

-- CreateIndex
CREATE INDEX "invoices_project_id_idx" ON "invoices"("project_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_due_date_idx" ON "invoices"("tenant_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_number_key" ON "invoices"("tenant_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_id_key" ON "invoices"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_position_idx" ON "invoice_lines"("invoice_id", "position");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "subcontractors_tenant_id_idx" ON "subcontractors"("tenant_id");

-- CreateIndex
CREATE INDEX "subcontractor_contracts_project_id_idx" ON "subcontractor_contracts"("project_id");

-- CreateIndex
CREATE INDEX "purchase_invoices_project_id_idx" ON "purchase_invoices"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoices_tenant_id_number_key" ON "purchase_invoices"("tenant_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "project_closure_snapshot_costs_snapshot_id_cost_type_id_key" ON "project_closure_snapshot_costs"("snapshot_id", "cost_type_id");

-- CreateIndex
CREATE INDEX "media_entity_type_entity_id_idx" ON "media"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "media_tenant_id_idx" ON "media"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_admin_user_id_idx" ON "notifications"("admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_tokens_token_hash_key" ON "portal_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_idx" ON "conversations"("tenant_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "message_reads_message_id_user_id_client_id_key" ON "message_reads"("message_id", "user_id", "client_id");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_parent_plan_id_fkey" FOREIGN KEY ("parent_plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_pending_plan_id_fkey" FOREIGN KEY ("pending_plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "billing_usage_snapshots" ADD CONSTRAINT "billing_usage_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_time_codes" ADD CONSTRAINT "one_time_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_time_codes" ADD CONSTRAINT "one_time_codes_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_status_history" ADD CONSTRAINT "project_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_materials" ADD CONSTRAINT "service_materials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_materials" ADD CONSTRAINT "service_materials_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_materials" ADD CONSTRAINT "service_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_purchase_invoice_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_tenant_id_task_id_fkey" FOREIGN KEY ("tenant_id", "task_id") REFERENCES "tasks"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_counters" ADD CONSTRAINT "document_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_tenant_id_quote_id_fkey" FOREIGN KEY ("tenant_id", "quote_id") REFERENCES "quotes"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_tenant_id_invoice_id_fkey" FOREIGN KEY ("tenant_id", "invoice_id") REFERENCES "invoices"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "subcontractor_contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "subcontractor_contracts_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "subcontractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "subcontractor_contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "subcontractor_contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_types" ADD CONSTRAINT "cost_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "cost_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_subcontractor_contract_id_fkey" FOREIGN KEY ("subcontractor_contract_id") REFERENCES "subcontractor_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_closure_snapshots" ADD CONSTRAINT "project_closure_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_closure_snapshots" ADD CONSTRAINT "project_closure_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_closure_snapshots" ADD CONSTRAINT "project_closure_snapshots_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_closure_snapshots" ADD CONSTRAINT "project_closure_snapshots_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_closure_snapshot_costs" ADD CONSTRAINT "project_closure_snapshot_costs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_closure_snapshot_costs" ADD CONSTRAINT "project_closure_snapshot_costs_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "project_closure_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_closure_snapshot_costs" ADD CONSTRAINT "project_closure_snapshot_costs_cost_type_id_fkey" FOREIGN KEY ("cost_type_id") REFERENCES "cost_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_margin_alerts" ADD CONSTRAINT "project_margin_alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_margin_alerts" ADD CONSTRAINT "project_margin_alerts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_tokens" ADD CONSTRAINT "portal_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_tokens" ADD CONSTRAINT "portal_tokens_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_tokens" ADD CONSTRAINT "portal_tokens_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_tokens" ADD CONSTRAINT "portal_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_tracking" ADD CONSTRAINT "portal_tracking_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_tracking" ADD CONSTRAINT "portal_tracking_portal_token_id_fkey" FOREIGN KEY ("portal_token_id") REFERENCES "portal_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_support_ticket_id_fkey" FOREIGN KEY ("support_ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ============================================================================
-- HAND-WRITTEN BLOCK — doc/Schema Proposal.md
-- Prisma cannot express CHECK constraints, triggers, partial indexes or views.
-- Everything below is what makes the business rules impossible to break,
-- rather than merely discouraged.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Exactly-one-recipient checks (the two-nullable-columns pattern)
-- ---------------------------------------------------------------------------
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "chk_refresh_one_owner"
  CHECK (num_nonnulls("user_id", "admin_user_id") = 1);

ALTER TABLE "one_time_codes" ADD CONSTRAINT "chk_code_one_owner"
  CHECK (num_nonnulls("user_id", "admin_user_id") = 1);

-- Platform alerts go to admin_users, who have no users row and no tenant.
ALTER TABLE "notifications" ADD CONSTRAINT "chk_notification_one_recipient"
  CHECK (num_nonnulls("user_id", "admin_user_id") = 1);

ALTER TABLE "conversation_members" ADD CONSTRAINT "chk_member_one_identity"
  CHECK (num_nonnulls("user_id", "client_id", "admin_user_id") = 1);

-- One row cannot have two readers.
ALTER TABLE "message_reads" ADD CONSTRAINT "chk_read_one_reader"
  CHECK (num_nonnulls("user_id", "client_id") = 1);

-- ---------------------------------------------------------------------------
-- 2. Date ordering
-- ---------------------------------------------------------------------------
ALTER TABLE "projects" ADD CONSTRAINT "chk_project_dates"
  CHECK ("end_date" IS NULL OR "start_date" IS NULL OR "end_date" >= "start_date");

ALTER TABLE "tasks" ADD CONSTRAINT "chk_task_dates"
  CHECK ("end_date" >= "start_date");

ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "chk_contract_dates"
  CHECK ("end_date" IS NULL OR "start_date" IS NULL OR "end_date" >= "start_date");

-- ---------------------------------------------------------------------------
-- 3. Clients and directories — VAT for professionals, phone format
-- ---------------------------------------------------------------------------
ALTER TABLE "clients" ADD CONSTRAINT "chk_professional_has_vat"
  CHECK ("type" <> 'professional'::"client_type" OR "vat_number" IS NOT NULL);

ALTER TABLE "clients" ADD CONSTRAINT "chk_client_phone_format"
  CHECK ("phone" ~ '^\+?[0-9 ().-]{6,20}$');

ALTER TABLE "subcontractors" ADD CONSTRAINT "chk_subcontractor_phone_format"
  CHECK ("phone" IS NULL OR "phone" ~ '^\+?[0-9 ().-]{6,20}$');

ALTER TABLE "suppliers" ADD CONSTRAINT "chk_supplier_phone_format"
  CHECK ("phone" IS NULL OR "phone" ~ '^\+?[0-9 ().-]{6,20}$');

-- ---------------------------------------------------------------------------
-- 4. Ranges and signs
-- ---------------------------------------------------------------------------
ALTER TABLE "reports" ADD CONSTRAINT "chk_progress_pct_range"
  CHECK ("progress_pct" BETWEEN 0 AND 100);

ALTER TABLE "time_entries" ADD CONSTRAINT "chk_hours_range"
  CHECK ("hours" > 0 AND "hours" <= 24);

ALTER TABLE "payments" ADD CONSTRAINT "chk_payment_positive"
  CHECK ("amount" > 0);

ALTER TABLE "quote_lines" ADD CONSTRAINT "chk_quote_line_quantity"
  CHECK ("quantity" <> 0);
ALTER TABLE "quote_lines" ADD CONSTRAINT "chk_quote_line_price"
  CHECK ("unit_price_excl_vat" >= 0);

ALTER TABLE "invoice_lines" ADD CONSTRAINT "chk_invoice_line_quantity"
  CHECK ("quantity" <> 0);
ALTER TABLE "invoice_lines" ADD CONSTRAINT "chk_invoice_line_price"
  CHECK ("unit_price_excl_vat" >= 0);

ALTER TABLE "services" ADD CONSTRAINT "chk_service_price"
  CHECK ("price_excl_vat" >= 0);

ALTER TABLE "materials" ADD CONSTRAINT "chk_material_prices"
  CHECK ("purchase_price" >= 0 AND "minimum_stock" >= 0);

ALTER TABLE "service_materials" ADD CONSTRAINT "chk_recipe_quantity"
  CHECK ("quantity_per_unit" > 0);

ALTER TABLE "plans" ADD CONSTRAINT "chk_plan_price"
  CHECK ("base_price" >= 0);

ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "chk_contract_amount"
  CHECK ("amount_excl_vat" >= 0);

ALTER TABLE "purchase_invoices" ADD CONSTRAINT "chk_purchase_amount"
  CHECK ("amount_excl_vat" >= 0);

-- 10 MB per file. SUM(file_size) per tenant is the storage_gb billing dimension.
ALTER TABLE "media" ADD CONSTRAINT "chk_media_file_size"
  CHECK ("file_size" > 0 AND "file_size" <= 10485760);

-- ---------------------------------------------------------------------------
-- 5. Stock ledger — the signs ARE the rule
--    consumption: must name a project, must be negative
--    purchase:    never tied to a project (stock is a shared pool), positive
-- ---------------------------------------------------------------------------
ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_movement_quantity_nonzero"
  CHECK ("quantity" <> 0);

ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_consumption_has_project"
  CHECK ("type" <> 'consumption'::"stock_movement_type"
         OR ("project_id" IS NOT NULL AND "quantity" < 0));

ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_purchase_no_project"
  CHECK ("type" <> 'purchase'::"stock_movement_type"
         OR ("project_id" IS NULL AND "quantity" > 0));

-- Two quantity columns: reserved is the original ask, remaining is what is
-- still held. Consumption lowers remaining ONLY, so the original is never lost.
ALTER TABLE "stock_reservations" ADD CONSTRAINT "chk_reservation_quantities"
  CHECK ("reserved_quantity" >= 0
         AND "remaining_quantity" >= 0
         AND "remaining_quantity" <= "reserved_quantity");

-- ---------------------------------------------------------------------------
-- 6. Purchase invoices — exactly one source
-- ---------------------------------------------------------------------------
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "chk_purchase_one_source"
  CHECK (
    ("type" = 'subcontractor'::"purchase_invoice_type"
      AND "subcontractor_contract_id" IS NOT NULL AND "supplier_id" IS NULL)
    OR
    ("type" = 'supplier'::"purchase_invoice_type"
      AND "supplier_id" IS NOT NULL AND "subcontractor_contract_id" IS NULL)
  );

-- A subcontractor bill always has a project, because its contract has one.
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "chk_subcontractor_has_project"
  CHECK ("type" <> 'subcontractor'::"purchase_invoice_type" OR "project_id" IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 7. Conversations — the type decides which parent is mandatory
-- ---------------------------------------------------------------------------
ALTER TABLE "conversations" ADD CONSTRAINT "chk_project_client_has_project"
  CHECK ("type" <> 'project_client'::"conversation_type" OR "project_id" IS NOT NULL);

ALTER TABLE "conversations" ADD CONSTRAINT "chk_support_has_ticket"
  CHECK ("type" <> 'support'::"conversation_type" OR "support_ticket_id" IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 8. Partial unique indexes — "only one of these at a time"
-- ---------------------------------------------------------------------------

-- Only one default plan. Registration lands new companies on it.
CREATE UNIQUE INDEX "idx_plans_one_default" ON "plans" ("is_default")
  WHERE "is_default" = true;

-- One OPEN invitation per email, app-wide. Same reason as users.email:
-- one email belongs to one company.
CREATE UNIQUE INDEX "idx_invitations_open_email" ON "user_invitations" ("email")
  WHERE "accepted_at" IS NULL;

-- One LIVE closure snapshot per project. A voided one stays as history.
CREATE UNIQUE INDEX "idx_closure_one_live" ON "project_closure_snapshots" ("project_id")
  WHERE "voided_at" IS NULL;

-- One ACTIVE portal link per project. Generating a new one deactivates the old.
CREATE UNIQUE INDEX "idx_portal_one_active" ON "portal_tokens" ("project_id")
  WHERE "is_active" = true;

-- A project has at most ONE client conversation, so regenerating a portal
-- link reuses the thread instead of starting a second one.
CREATE UNIQUE INDEX "idx_one_client_conversation" ON "conversations" ("project_id")
  WHERE "type" = 'project_client'::"conversation_type";

-- ---------------------------------------------------------------------------
-- 9. Trigger — a material bill must never carry a project
--
-- Material cost has exactly ONE source: the consumption rows in
-- stock_movements. Every material passes through the stock, even a delivery
-- straight to site. If the bill also carried a project the same tiles would
-- be counted twice. Cannot be a CHECK because it has to read cost_types.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION chk_material_bill_has_no_project() RETURNS TRIGGER AS $$
BEGIN
  IF NEW."project_id" IS NOT NULL
     AND (SELECT "name" FROM "cost_types" WHERE "id" = NEW."cost_type_id") = 'material' THEN
    RAISE EXCEPTION
      'A material purchase invoice cannot carry a project_id (cost comes from the stock ledger, not the bill)';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_material_bill_no_project
  BEFORE INSERT OR UPDATE ON "purchase_invoices"
  FOR EACH ROW EXECUTE FUNCTION chk_material_bill_has_no_project();

-- ---------------------------------------------------------------------------
-- 10. Triggers — document line totals are computed by the DATABASE
--
-- The fix for the NaN-total bug: the number is never produced by client JS.
-- A trigger rather than a GENERATED column, so Prisma can keep managing the
-- table without reporting permanent drift.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_document_line_total() RETURNS TRIGGER AS $$
BEGIN
  NEW."total_excl_vat" := round(NEW."quantity" * NEW."unit_price_excl_vat", 2);
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quote_line_total
  BEFORE INSERT OR UPDATE OF "quantity", "unit_price_excl_vat" ON "quote_lines"
  FOR EACH ROW EXECUTE FUNCTION set_document_line_total();

CREATE TRIGGER trg_invoice_line_total
  BEFORE INSERT OR UPDATE OF "quantity", "unit_price_excl_vat" ON "invoice_lines"
  FOR EACH ROW EXECUTE FUNCTION set_document_line_total();

-- ---------------------------------------------------------------------------
-- 11. VIEWS — Prisma does not manage views.
--     All three carry tenant_id. A $queryRaw on them MUST filter by it: the
--     Prisma extension cannot see inside raw SQL.
-- ---------------------------------------------------------------------------

-- Stock quantity: the ONE place it is computed. materials has no quantity column.
CREATE VIEW "material_stock_live" AS
SELECT
  m."id"                                            AS material_id,
  m."tenant_id"                                     AS tenant_id,
  COALESCE(mv.on_hand, 0)                           AS on_hand,
  COALESCE(rs.reserved, 0)                          AS reserved,
  COALESCE(mv.on_hand, 0) - COALESCE(rs.reserved, 0) AS available
FROM "materials" m
LEFT JOIN (
  SELECT "material_id", SUM("quantity") AS on_hand
  FROM "stock_movements" GROUP BY "material_id"
) mv ON mv.material_id = m."id"
LEFT JOIN (
  SELECT "material_id", SUM("remaining_quantity") AS reserved
  FROM "stock_reservations" WHERE "status" = 'active'::"reservation_status"
  GROUP BY "material_id"
) rs ON rs.material_id = m."id";

-- Balance and lateness. is_late is computed here — that is why invoice_status
-- has no `overdue`: a sent and a partially_paid invoice can both be late, and
-- one stored status cannot hold both answers at once.
CREATE VIEW "invoice_balance" AS
SELECT
  i."id"                                            AS invoice_id,
  i."tenant_id"                                     AS tenant_id,
  i."amount_incl_vat"                               AS amount_incl_vat,
  COALESCE(p.amount_paid, 0)                        AS amount_paid,
  i."amount_incl_vat" - COALESCE(p.amount_paid, 0)  AS balance_due,
  (   i."due_date" < CURRENT_DATE
  AND i."amount_incl_vat" - COALESCE(p.amount_paid, 0) > 0
  AND i."status" IN ('sent'::"invoice_status", 'partially_paid'::"invoice_status")
  )                                                 AS is_late
FROM "invoices" i
LEFT JOIN (
  SELECT "invoice_id", SUM("amount") AS amount_paid
  FROM "payments" GROUP BY "invoice_id"
) p ON p.invoice_id = i."id";

-- Live margin. Three doors, never four:
--   materials -> the stock ledger     (qty x FROZEN unit_price)
--   hours     -> time_entries         (hours x FROZEN hourly_rate)
--   bills     -> purchase_invoices    (grouped by cost type, EXCEPT material)
-- Budget = SUM of accepted quotes; projects has no budget column.
-- margin_pct is NULL (not an error) when there is no accepted quote yet.
CREATE VIEW "project_margin_live" AS
SELECT
  p."id"                                            AS project_id,
  p."tenant_id"                                     AS tenant_id,
  COALESCE(q.budget_excl_vat, 0)                    AS budget_excl_vat,
  COALESCE(mc.material_cost, 0)                     AS material_cost,
  COALESCE(lc.labor_cost, 0)                        AS labor_cost,
  COALESCE(bc.bill_cost, 0)                         AS bill_cost,
  COALESCE(mc.material_cost, 0) + COALESCE(lc.labor_cost, 0) + COALESCE(bc.bill_cost, 0)
                                                    AS total_cost,
  COALESCE(q.budget_excl_vat, 0)
    - (COALESCE(mc.material_cost, 0) + COALESCE(lc.labor_cost, 0) + COALESCE(bc.bill_cost, 0))
                                                    AS margin_excl_vat,
  CASE WHEN COALESCE(q.budget_excl_vat, 0) > 0 THEN
    round(
      ( (COALESCE(q.budget_excl_vat, 0)
          - (COALESCE(mc.material_cost, 0) + COALESCE(lc.labor_cost, 0) + COALESCE(bc.bill_cost, 0)))
        / q.budget_excl_vat ) * 100, 2)
  END                                               AS margin_pct
FROM "projects" p
LEFT JOIN (
  SELECT "project_id", SUM("amount_excl_vat") AS budget_excl_vat
  FROM "quotes" WHERE "status" = 'accepted'::"quote_status"
  GROUP BY "project_id"
) q ON q."project_id" = p."id"
LEFT JOIN (
  -- quantity is negative on consumption, so negate it
  SELECT "project_id", SUM(-"quantity" * "unit_price") AS material_cost
  FROM "stock_movements" WHERE "type" = 'consumption'::"stock_movement_type"
  GROUP BY "project_id"
) mc ON mc."project_id" = p."id"
LEFT JOIN (
  SELECT "project_id", SUM("hours" * "hourly_rate") AS labor_cost
  FROM "time_entries" GROUP BY "project_id"
) lc ON lc."project_id" = p."id"
LEFT JOIN (
  -- every bill on the project EXCEPT material (already counted by the ledger).
  -- Counted from the day it is entered, whatever its status.
  SELECT pi."project_id", SUM(pi."amount_excl_vat") AS bill_cost
  FROM "purchase_invoices" pi
  JOIN "cost_types" ct ON ct."id" = pi."cost_type_id"
  WHERE pi."project_id" IS NOT NULL AND ct."name" <> 'material'
  GROUP BY pi."project_id"
) bc ON bc."project_id" = p."id";
