--
-- PostgreSQL database dump
--

\restrict 4Tno2bsyl7ZDzWj7QSyk0tyBrTiSJgXCimQuUfrS13dUbkfsnGKNFEAUCNa6DGq

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_invited_by_fkey;
ALTER TABLE IF EXISTS ONLY public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_invited_by_admin_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.time_entries DROP CONSTRAINT IF EXISTS time_entries_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.time_entries DROP CONSTRAINT IF EXISTS time_entries_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.time_entries DROP CONSTRAINT IF EXISTS time_entries_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.time_entries DROP CONSTRAINT IF EXISTS time_entries_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_pending_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignees DROP CONSTRAINT IF EXISTS task_assignees_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignees DROP CONSTRAINT IF EXISTS task_assignees_tenant_id_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignees DROP CONSTRAINT IF EXISTS task_assignees_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_opened_by_fkey;
ALTER TABLE IF EXISTS ONLY public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_assigned_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subcontractors DROP CONSTRAINT IF EXISTS subcontractors_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subcontractor_contracts DROP CONSTRAINT IF EXISTS subcontractor_contracts_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subcontractor_contracts DROP CONSTRAINT IF EXISTS subcontractor_contracts_subcontractor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subcontractor_contracts DROP CONSTRAINT IF EXISTS subcontractor_contracts_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subcontractor_contracts DROP CONSTRAINT IF EXISTS subcontractor_contracts_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_reservations DROP CONSTRAINT IF EXISTS stock_reservations_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_reservations DROP CONSTRAINT IF EXISTS stock_reservations_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_reservations DROP CONSTRAINT IF EXISTS stock_reservations_material_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_report_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_purchase_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_material_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_import_batch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_materials DROP CONSTRAINT IF EXISTS service_materials_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_materials DROP CONSTRAINT IF EXISTS service_materials_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_materials DROP CONSTRAINT IF EXISTS service_materials_material_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_admin_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotes DROP CONSTRAINT IF EXISTS quotes_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotes DROP CONSTRAINT IF EXISTS quotes_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotes DROP CONSTRAINT IF EXISTS quotes_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.quotes DROP CONSTRAINT IF EXISTS quotes_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quote_lines DROP CONSTRAINT IF EXISTS quote_lines_tenant_id_quote_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quote_lines DROP CONSTRAINT IF EXISTS quote_lines_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quote_lines DROP CONSTRAINT IF EXISTS quote_lines_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_subcontractor_contract_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_cost_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_manager_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_status_history DROP CONSTRAINT IF EXISTS project_status_history_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_status_history DROP CONSTRAINT IF EXISTS project_status_history_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_status_history DROP CONSTRAINT IF EXISTS project_status_history_changed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.project_margin_alerts DROP CONSTRAINT IF EXISTS project_margin_alerts_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_margin_alerts DROP CONSTRAINT IF EXISTS project_margin_alerts_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshots DROP CONSTRAINT IF EXISTS project_closure_snapshots_voided_by_fkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshots DROP CONSTRAINT IF EXISTS project_closure_snapshots_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshots DROP CONSTRAINT IF EXISTS project_closure_snapshots_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshots DROP CONSTRAINT IF EXISTS project_closure_snapshots_closed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshot_costs DROP CONSTRAINT IF EXISTS project_closure_snapshot_costs_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshot_costs DROP CONSTRAINT IF EXISTS project_closure_snapshot_costs_snapshot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshot_costs DROP CONSTRAINT IF EXISTS project_closure_snapshot_costs_cost_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.portal_tracking DROP CONSTRAINT IF EXISTS portal_tracking_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.portal_tracking DROP CONSTRAINT IF EXISTS portal_tracking_portal_token_id_fkey;
ALTER TABLE IF EXISTS ONLY public.portal_tokens DROP CONSTRAINT IF EXISTS portal_tokens_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.portal_tokens DROP CONSTRAINT IF EXISTS portal_tokens_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.portal_tokens DROP CONSTRAINT IF EXISTS portal_tokens_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.portal_tokens DROP CONSTRAINT IF EXISTS portal_tokens_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.plans DROP CONSTRAINT IF EXISTS plans_parent_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.plan_features DROP CONSTRAINT IF EXISTS plan_features_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.one_time_codes DROP CONSTRAINT IF EXISTS one_time_codes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.one_time_codes DROP CONSTRAINT IF EXISTS one_time_codes_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.one_time_codes DROP CONSTRAINT IF EXISTS one_time_codes_admin_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_admin_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_reads DROP CONSTRAINT IF EXISTS message_reads_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_reads DROP CONSTRAINT IF EXISTS message_reads_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_reads DROP CONSTRAINT IF EXISTS message_reads_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_reads DROP CONSTRAINT IF EXISTS message_reads_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.media DROP CONSTRAINT IF EXISTS media_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.media DROP CONSTRAINT IF EXISTS media_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.materials DROP CONSTRAINT IF EXISTS materials_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_quote_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoice_lines DROP CONSTRAINT IF EXISTS invoice_lines_tenant_id_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoice_lines DROP CONSTRAINT IF EXISTS invoice_lines_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoice_lines DROP CONSTRAINT IF EXISTS invoice_lines_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.import_batches DROP CONSTRAINT IF EXISTS import_batches_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.import_batches DROP CONSTRAINT IF EXISTS import_batches_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.feedback DROP CONSTRAINT IF EXISTS feedback_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.feedback DROP CONSTRAINT IF EXISTS feedback_submitted_by_fkey;
ALTER TABLE IF EXISTS ONLY public.document_counters DROP CONSTRAINT IF EXISTS document_counters_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cost_types DROP CONSTRAINT IF EXISTS cost_types_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_support_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversation_members DROP CONSTRAINT IF EXISTS conversation_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversation_members DROP CONSTRAINT IF EXISTS conversation_members_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversation_members DROP CONSTRAINT IF EXISTS conversation_members_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversation_members DROP CONSTRAINT IF EXISTS conversation_members_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversation_members DROP CONSTRAINT IF EXISTS conversation_members_admin_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.billing_usage_snapshots DROP CONSTRAINT IF EXISTS billing_usage_snapshots_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_tenant_id_fkey;
DROP TRIGGER IF EXISTS trg_quote_line_total ON public.quote_lines;
DROP TRIGGER IF EXISTS trg_material_bill_no_project ON public.purchase_invoices;
DROP TRIGGER IF EXISTS trg_invoice_line_total ON public.invoice_lines;
DROP INDEX IF EXISTS public.users_tenant_id_idx;
DROP INDEX IF EXISTS public.users_login_code_key;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.user_invitations_token_hash_key;
DROP INDEX IF EXISTS public.uq_read_user;
DROP INDEX IF EXISTS public.uq_read_client;
DROP INDEX IF EXISTS public.uq_member_user;
DROP INDEX IF EXISTS public.uq_member_client;
DROP INDEX IF EXISTS public.uq_member_admin;
DROP INDEX IF EXISTS public.uq_materials_tenant_description;
DROP INDEX IF EXISTS public.uq_import_batches_hash;
DROP INDEX IF EXISTS public.time_entries_user_id_work_date_idx;
DROP INDEX IF EXISTS public.time_entries_user_id_project_id_work_date_key;
DROP INDEX IF EXISTS public.time_entries_project_id_idx;
DROP INDEX IF EXISTS public.tenants_email_key;
DROP INDEX IF EXISTS public.tenant_subscriptions_tenant_id_key;
DROP INDEX IF EXISTS public.tasks_tenant_id_id_key;
DROP INDEX IF EXISTS public.tasks_project_id_idx;
DROP INDEX IF EXISTS public.task_assignees_user_id_idx;
DROP INDEX IF EXISTS public.task_assignees_task_id_user_id_key;
DROP INDEX IF EXISTS public.support_tickets_tenant_id_status_idx;
DROP INDEX IF EXISTS public.subcontractors_tenant_id_idx;
DROP INDEX IF EXISTS public.subcontractor_contracts_project_id_idx;
DROP INDEX IF EXISTS public.stripe_events_stripe_event_id_key;
DROP INDEX IF EXISTS public.stock_reservations_project_id_material_id_key;
DROP INDEX IF EXISTS public.stock_movements_tenant_id_material_id_idx;
DROP INDEX IF EXISTS public.stock_movements_project_id_idx;
DROP INDEX IF EXISTS public.services_tenant_id_idx;
DROP INDEX IF EXISTS public.service_materials_service_id_material_id_key;
DROP INDEX IF EXISTS public.roles_name_key;
DROP INDEX IF EXISTS public.role_permissions_tenant_id_role_id_module_key;
DROP INDEX IF EXISTS public.reports_tenant_id_project_id_report_date_key;
DROP INDEX IF EXISTS public.refresh_tokens_user_id_idx;
DROP INDEX IF EXISTS public.refresh_tokens_token_hash_key;
DROP INDEX IF EXISTS public.quotes_tenant_id_number_key;
DROP INDEX IF EXISTS public.quotes_tenant_id_id_key;
DROP INDEX IF EXISTS public.quotes_project_id_status_idx;
DROP INDEX IF EXISTS public.quote_lines_quote_id_position_idx;
DROP INDEX IF EXISTS public.purchase_invoices_tenant_id_number_key;
DROP INDEX IF EXISTS public.purchase_invoices_project_id_idx;
DROP INDEX IF EXISTS public.projects_tenant_id_status_idx;
DROP INDEX IF EXISTS public.project_status_history_project_id_changed_at_idx;
DROP INDEX IF EXISTS public.project_closure_snapshot_costs_snapshot_id_cost_type_id_key;
DROP INDEX IF EXISTS public.portal_tokens_token_hash_key;
DROP INDEX IF EXISTS public.plan_features_plan_id_feature_key_key;
DROP INDEX IF EXISTS public.payments_invoice_id_idx;
DROP INDEX IF EXISTS public.notifications_user_id_idx;
DROP INDEX IF EXISTS public.notifications_admin_user_id_idx;
DROP INDEX IF EXISTS public.messages_conversation_id_created_at_idx;
DROP INDEX IF EXISTS public.message_reads_message_id_user_id_client_id_key;
DROP INDEX IF EXISTS public.media_tenant_id_idx;
DROP INDEX IF EXISTS public.media_entity_type_entity_id_idx;
DROP INDEX IF EXISTS public.materials_tenant_id_idx;
DROP INDEX IF EXISTS public.invoices_tenant_id_number_key;
DROP INDEX IF EXISTS public.invoices_tenant_id_id_key;
DROP INDEX IF EXISTS public.invoices_tenant_id_due_date_idx;
DROP INDEX IF EXISTS public.invoices_project_id_idx;
DROP INDEX IF EXISTS public.invoice_lines_invoice_id_position_idx;
DROP INDEX IF EXISTS public.import_batches_tenant_id_created_at_idx;
DROP INDEX IF EXISTS public.idx_portal_one_active;
DROP INDEX IF EXISTS public.idx_plans_one_default;
DROP INDEX IF EXISTS public.idx_one_client_conversation;
DROP INDEX IF EXISTS public.idx_invitations_open_email;
DROP INDEX IF EXISTS public.idx_closure_one_live;
DROP INDEX IF EXISTS public.conversations_tenant_id_idx;
DROP INDEX IF EXISTS public.clients_tenant_id_idx;
DROP INDEX IF EXISTS public.clients_tenant_id_email_key;
DROP INDEX IF EXISTS public.billing_usage_snapshots_tenant_id_period_start_feature_key_key;
DROP INDEX IF EXISTS public.audit_logs_tenant_id_created_at_idx;
DROP INDEX IF EXISTS public.analytics_events_tenant_id_created_at_idx;
DROP INDEX IF EXISTS public.admin_users_email_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.time_entries DROP CONSTRAINT IF EXISTS time_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.task_assignees DROP CONSTRAINT IF EXISTS task_assignees_pkey;
ALTER TABLE IF EXISTS ONLY public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.subcontractors DROP CONSTRAINT IF EXISTS subcontractors_pkey;
ALTER TABLE IF EXISTS ONLY public.subcontractor_contracts DROP CONSTRAINT IF EXISTS subcontractor_contracts_pkey;
ALTER TABLE IF EXISTS ONLY public.stripe_events DROP CONSTRAINT IF EXISTS stripe_events_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_reservations DROP CONSTRAINT IF EXISTS stock_reservations_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.service_materials DROP CONSTRAINT IF EXISTS service_materials_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.quotes DROP CONSTRAINT IF EXISTS quotes_pkey;
ALTER TABLE IF EXISTS ONLY public.quote_lines DROP CONSTRAINT IF EXISTS quote_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_invoices DROP CONSTRAINT IF EXISTS purchase_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.project_status_history DROP CONSTRAINT IF EXISTS project_status_history_pkey;
ALTER TABLE IF EXISTS ONLY public.project_margin_alerts DROP CONSTRAINT IF EXISTS project_margin_alerts_pkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshots DROP CONSTRAINT IF EXISTS project_closure_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.project_closure_snapshot_costs DROP CONSTRAINT IF EXISTS project_closure_snapshot_costs_pkey;
ALTER TABLE IF EXISTS ONLY public.portal_tracking DROP CONSTRAINT IF EXISTS portal_tracking_pkey;
ALTER TABLE IF EXISTS ONLY public.portal_tokens DROP CONSTRAINT IF EXISTS portal_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.plans DROP CONSTRAINT IF EXISTS plans_pkey;
ALTER TABLE IF EXISTS ONLY public.plan_features DROP CONSTRAINT IF EXISTS plan_features_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.one_time_codes DROP CONSTRAINT IF EXISTS one_time_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.message_reads DROP CONSTRAINT IF EXISTS message_reads_pkey;
ALTER TABLE IF EXISTS ONLY public.media DROP CONSTRAINT IF EXISTS media_pkey;
ALTER TABLE IF EXISTS ONLY public.materials DROP CONSTRAINT IF EXISTS materials_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.invoice_lines DROP CONSTRAINT IF EXISTS invoice_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.import_batches DROP CONSTRAINT IF EXISTS import_batches_pkey;
ALTER TABLE IF EXISTS ONLY public.feedback DROP CONSTRAINT IF EXISTS feedback_pkey;
ALTER TABLE IF EXISTS ONLY public.document_counters DROP CONSTRAINT IF EXISTS document_counters_pkey;
ALTER TABLE IF EXISTS ONLY public.cost_types DROP CONSTRAINT IF EXISTS cost_types_pkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.conversation_members DROP CONSTRAINT IF EXISTS conversation_members_pkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.billing_usage_snapshots DROP CONSTRAINT IF EXISTS billing_usage_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_users DROP CONSTRAINT IF EXISTS admin_users_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_invitations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.time_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tenants ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tenant_subscriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.task_assignees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.support_tickets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.suppliers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subcontractors ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subcontractor_contracts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stripe_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_reservations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stock_movements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.services ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.service_materials ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.role_permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quote_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.purchase_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.project_status_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.project_closure_snapshots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.project_closure_snapshot_costs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.portal_tracking ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.portal_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.plan_features ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.one_time_codes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.message_reads ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.media ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.materials ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.invoice_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.import_batches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.feedback ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cost_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.conversations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.conversation_members ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clients ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.billing_usage_snapshots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.analytics_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_users ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_invitations_id_seq;
DROP TABLE IF EXISTS public.user_invitations;
DROP SEQUENCE IF EXISTS public.time_entries_id_seq;
DROP SEQUENCE IF EXISTS public.tenants_id_seq;
DROP TABLE IF EXISTS public.tenants;
DROP SEQUENCE IF EXISTS public.tenant_subscriptions_id_seq;
DROP TABLE IF EXISTS public.tenant_subscriptions;
DROP SEQUENCE IF EXISTS public.tasks_id_seq;
DROP TABLE IF EXISTS public.tasks;
DROP SEQUENCE IF EXISTS public.task_assignees_id_seq;
DROP TABLE IF EXISTS public.task_assignees;
DROP SEQUENCE IF EXISTS public.support_tickets_id_seq;
DROP TABLE IF EXISTS public.support_tickets;
DROP SEQUENCE IF EXISTS public.suppliers_id_seq;
DROP TABLE IF EXISTS public.suppliers;
DROP SEQUENCE IF EXISTS public.subcontractors_id_seq;
DROP TABLE IF EXISTS public.subcontractors;
DROP SEQUENCE IF EXISTS public.subcontractor_contracts_id_seq;
DROP TABLE IF EXISTS public.subcontractor_contracts;
DROP SEQUENCE IF EXISTS public.stripe_events_id_seq;
DROP TABLE IF EXISTS public.stripe_events;
DROP SEQUENCE IF EXISTS public.stock_reservations_id_seq;
DROP SEQUENCE IF EXISTS public.stock_movements_id_seq;
DROP SEQUENCE IF EXISTS public.services_id_seq;
DROP TABLE IF EXISTS public.services;
DROP SEQUENCE IF EXISTS public.service_materials_id_seq;
DROP TABLE IF EXISTS public.service_materials;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.role_permissions_id_seq;
DROP TABLE IF EXISTS public.role_permissions;
DROP SEQUENCE IF EXISTS public.reports_id_seq;
DROP TABLE IF EXISTS public.reports;
DROP SEQUENCE IF EXISTS public.refresh_tokens_id_seq;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP SEQUENCE IF EXISTS public.quotes_id_seq;
DROP SEQUENCE IF EXISTS public.quote_lines_id_seq;
DROP TABLE IF EXISTS public.quote_lines;
DROP SEQUENCE IF EXISTS public.purchase_invoices_id_seq;
DROP SEQUENCE IF EXISTS public.projects_id_seq;
DROP SEQUENCE IF EXISTS public.project_status_history_id_seq;
DROP TABLE IF EXISTS public.project_status_history;
DROP VIEW IF EXISTS public.project_margin_live;
DROP TABLE IF EXISTS public.time_entries;
DROP TABLE IF EXISTS public.quotes;
DROP TABLE IF EXISTS public.purchase_invoices;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.project_margin_alerts;
DROP SEQUENCE IF EXISTS public.project_closure_snapshots_id_seq;
DROP TABLE IF EXISTS public.project_closure_snapshots;
DROP SEQUENCE IF EXISTS public.project_closure_snapshot_costs_id_seq;
DROP TABLE IF EXISTS public.project_closure_snapshot_costs;
DROP SEQUENCE IF EXISTS public.portal_tracking_id_seq;
DROP TABLE IF EXISTS public.portal_tracking;
DROP SEQUENCE IF EXISTS public.portal_tokens_id_seq;
DROP TABLE IF EXISTS public.portal_tokens;
DROP SEQUENCE IF EXISTS public.plans_id_seq;
DROP TABLE IF EXISTS public.plans;
DROP SEQUENCE IF EXISTS public.plan_features_id_seq;
DROP TABLE IF EXISTS public.plan_features;
DROP SEQUENCE IF EXISTS public.payments_id_seq;
DROP SEQUENCE IF EXISTS public.one_time_codes_id_seq;
DROP TABLE IF EXISTS public.one_time_codes;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.messages_id_seq;
DROP TABLE IF EXISTS public.messages;
DROP SEQUENCE IF EXISTS public.message_reads_id_seq;
DROP TABLE IF EXISTS public.message_reads;
DROP SEQUENCE IF EXISTS public.media_id_seq;
DROP TABLE IF EXISTS public.media;
DROP SEQUENCE IF EXISTS public.materials_id_seq;
DROP VIEW IF EXISTS public.material_stock_live;
DROP TABLE IF EXISTS public.stock_reservations;
DROP TABLE IF EXISTS public.stock_movements;
DROP TABLE IF EXISTS public.materials;
DROP SEQUENCE IF EXISTS public.invoices_id_seq;
DROP SEQUENCE IF EXISTS public.invoice_lines_id_seq;
DROP TABLE IF EXISTS public.invoice_lines;
DROP VIEW IF EXISTS public.invoice_balance;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.invoices;
DROP SEQUENCE IF EXISTS public.import_batches_id_seq;
DROP TABLE IF EXISTS public.import_batches;
DROP SEQUENCE IF EXISTS public.feedback_id_seq;
DROP TABLE IF EXISTS public.feedback;
DROP TABLE IF EXISTS public.document_counters;
DROP SEQUENCE IF EXISTS public.cost_types_id_seq;
DROP TABLE IF EXISTS public.cost_types;
DROP SEQUENCE IF EXISTS public.conversations_id_seq;
DROP TABLE IF EXISTS public.conversations;
DROP SEQUENCE IF EXISTS public.conversation_members_id_seq;
DROP TABLE IF EXISTS public.conversation_members;
DROP SEQUENCE IF EXISTS public.clients_id_seq;
DROP TABLE IF EXISTS public.clients;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.billing_usage_snapshots_id_seq;
DROP TABLE IF EXISTS public.billing_usage_snapshots;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.analytics_events_id_seq;
DROP TABLE IF EXISTS public.analytics_events;
DROP SEQUENCE IF EXISTS public.admin_users_id_seq;
DROP TABLE IF EXISTS public.admin_users;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP FUNCTION IF EXISTS public.set_document_line_total();
DROP FUNCTION IF EXISTS public.chk_material_bill_has_no_project();
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.ticket_category;
DROP TYPE IF EXISTS public.tenant_status;
DROP TYPE IF EXISTS public.task_type;
DROP TYPE IF EXISTS public.task_status;
DROP TYPE IF EXISTS public.subscription_status;
DROP TYPE IF EXISTS public.stock_movement_type;
DROP TYPE IF EXISTS public.sender_type;
DROP TYPE IF EXISTS public.reservation_status;
DROP TYPE IF EXISTS public.quote_status;
DROP TYPE IF EXISTS public.purchase_invoice_type;
DROP TYPE IF EXISTS public.purchase_invoice_status;
DROP TYPE IF EXISTS public.project_status;
DROP TYPE IF EXISTS public.portal_event_type;
DROP TYPE IF EXISTS public.permission_scope;
DROP TYPE IF EXISTS public.permission_module;
DROP TYPE IF EXISTS public.payment_method;
DROP TYPE IF EXISTS public.one_time_code_type;
DROP TYPE IF EXISTS public.media_entity_type;
DROP TYPE IF EXISTS public.margin_alert_level;
DROP TYPE IF EXISTS public.invoice_status;
DROP TYPE IF EXISTS public.import_type;
DROP TYPE IF EXISTS public.import_status;
DROP TYPE IF EXISTS public.feedback_type;
DROP TYPE IF EXISTS public.feedback_status;
DROP TYPE IF EXISTS public.document_type;
DROP TYPE IF EXISTS public.conversation_type;
DROP TYPE IF EXISTS public.contract_status;
DROP TYPE IF EXISTS public.client_type;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: client_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_type AS ENUM (
    'individual',
    'professional',
    'property_manager'
);


--
-- Name: contract_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contract_status AS ENUM (
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: conversation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.conversation_type AS ENUM (
    'internal',
    'project_client',
    'support'
);


--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'quote',
    'invoice',
    'purchase_invoice'
);


--
-- Name: feedback_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_status AS ENUM (
    'new',
    'reviewing',
    'planned',
    'declined',
    'shipped'
);


--
-- Name: feedback_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_type AS ENUM (
    'feature_request',
    'improvement',
    'complaint'
);


--
-- Name: import_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.import_status AS ENUM (
    'pending',
    'processing',
    'done',
    'failed'
);


--
-- Name: import_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.import_type AS ENUM (
    'materials',
    'stock'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'partially_paid',
    'paid',
    'cancelled'
);


--
-- Name: margin_alert_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.margin_alert_level AS ENUM (
    'warning',
    'critical'
);


--
-- Name: media_entity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.media_entity_type AS ENUM (
    'user',
    'tenant',
    'project',
    'report',
    'purchase_invoice',
    'quote',
    'invoice',
    'message'
);


--
-- Name: one_time_code_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.one_time_code_type AS ENUM (
    'password_reset',
    'email_verification',
    'admin_2fa'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'transfer',
    'cheque',
    'cash',
    'stripe'
);


--
-- Name: permission_module; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.permission_module AS ENUM (
    'clients',
    'projects',
    'tasks',
    'time_entries',
    'catalogue',
    'stock',
    'quotes',
    'invoices',
    'purchase_invoices',
    'margins',
    'subcontractors',
    'reports',
    'media',
    'chat',
    'team',
    'settings'
);


--
-- Name: permission_scope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.permission_scope AS ENUM (
    'all',
    'own'
);


--
-- Name: portal_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.portal_event_type AS ENUM (
    'view',
    'download'
);


--
-- Name: project_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_status AS ENUM (
    'prospect',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: purchase_invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.purchase_invoice_status AS ENUM (
    'to_pay',
    'paid'
);


--
-- Name: purchase_invoice_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.purchase_invoice_type AS ENUM (
    'subcontractor',
    'supplier'
);


--
-- Name: quote_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quote_status AS ENUM (
    'draft',
    'sent',
    'accepted',
    'refused'
);


--
-- Name: reservation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reservation_status AS ENUM (
    'active',
    'released',
    'consumed'
);


--
-- Name: sender_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sender_type AS ENUM (
    'employee',
    'client',
    'admin'
);


--
-- Name: stock_movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stock_movement_type AS ENUM (
    'purchase',
    'consumption',
    'adjustment'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'trialing',
    'active',
    'past_due',
    'cancelled'
);


--
-- Name: task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_status AS ENUM (
    'planned',
    'in_progress',
    'completed'
);


--
-- Name: task_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_type AS ENUM (
    'meeting',
    'work'
);


--
-- Name: tenant_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tenant_status AS ENUM (
    'active',
    'suspended',
    'banned'
);


--
-- Name: ticket_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_category AS ENUM (
    'bug',
    'question',
    'billing',
    'other'
);


--
-- Name: ticket_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_priority AS ENUM (
    'low',
    'normal',
    'high'
);


--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'waiting_tenant',
    'closed'
);


--
-- Name: chk_material_bill_has_no_project(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.chk_material_bill_has_no_project() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW."project_id" IS NOT NULL
     AND (SELECT "name" FROM "cost_types" WHERE "id" = NEW."cost_type_id") = 'material' THEN
    RAISE EXCEPTION
      'A material purchase invoice cannot carry a project_id (cost comes from the stock ledger, not the bill)';
  END IF;
  RETURN NEW;
END $$;


--
-- Name: set_document_line_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_document_line_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW."total_excl_vat" := round(NEW."quantity" * NEW."unit_price_excl_vat", 2);
  RETURN NEW;
END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    totp_secret text,
    role text DEFAULT 'staff'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    can_manage_billing boolean DEFAULT false NOT NULL,
    can_manage_tenants boolean DEFAULT false NOT NULL
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    user_id integer,
    event_name text NOT NULL,
    payload jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: analytics_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_events_id_seq OWNED BY public.analytics_events.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    tenant_id integer,
    admin_user_id integer,
    user_id integer,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id integer,
    old_value jsonb,
    new_value jsonb,
    ip_address inet,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: billing_usage_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_usage_snapshots (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    period_start timestamp(6) with time zone NOT NULL,
    period_end timestamp(6) with time zone NOT NULL,
    snapshot_taken_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    feature_key text NOT NULL,
    actual_count numeric(14,3) NOT NULL,
    included_allowance integer NOT NULL,
    overage_rate numeric(12,2) NOT NULL,
    overage_amount numeric(12,2) NOT NULL,
    stripe_invoice_id text
);


--
-- Name: billing_usage_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.billing_usage_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: billing_usage_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.billing_usage_snapshots_id_seq OWNED BY public.billing_usage_snapshots.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    tenant_id integer,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    type public.client_type DEFAULT 'individual'::public.client_type NOT NULL,
    name text NOT NULL,
    contact_name text,
    email text NOT NULL,
    phone text NOT NULL,
    phone_secondary text,
    vat_number text,
    address_line1 text,
    address_line2 text,
    postal_code text,
    city text,
    country character(2),
    note text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_client_phone_format CHECK ((phone ~ '^\+?[0-9 ().-]{6,20}$'::text)),
    CONSTRAINT chk_professional_has_vat CHECK (((type <> 'professional'::public.client_type) OR (vat_number IS NOT NULL)))
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: conversation_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_members (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer,
    client_id integer,
    admin_user_id integer,
    joined_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_member_one_identity CHECK ((num_nonnulls(user_id, client_id, admin_user_id) = 1))
);


--
-- Name: conversation_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_members_id_seq OWNED BY public.conversation_members.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    type public.conversation_type NOT NULL,
    project_id integer,
    support_ticket_id integer,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_project_client_has_project CHECK (((type <> 'project_client'::public.conversation_type) OR (project_id IS NOT NULL))),
    CONSTRAINT chk_support_has_ticket CHECK (((type <> 'support'::public.conversation_type) OR (support_ticket_id IS NOT NULL)))
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: cost_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_types (
    id integer NOT NULL,
    tenant_id integer,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cost_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cost_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cost_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cost_types_id_seq OWNED BY public.cost_types.id;


--
-- Name: document_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_counters (
    tenant_id integer NOT NULL,
    document_type public.document_type NOT NULL,
    year smallint NOT NULL,
    last_number integer DEFAULT 0 NOT NULL
);


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    submitted_by integer NOT NULL,
    type public.feedback_type NOT NULL,
    title text NOT NULL,
    body text,
    status public.feedback_status DEFAULT 'new'::public.feedback_status NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: import_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_batches (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    type public.import_type NOT NULL,
    status public.import_status DEFAULT 'pending'::public.import_status NOT NULL,
    file_name text NOT NULL,
    rows_hash text NOT NULL,
    row_count integer NOT NULL,
    rows jsonb NOT NULL,
    errors jsonb,
    created_count integer DEFAULT 0 NOT NULL,
    updated_count integer DEFAULT 0 NOT NULL,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    started_at timestamp(6) with time zone,
    finished_at timestamp(6) with time zone,
    CONSTRAINT chk_import_row_count CHECK (((row_count >= 1) AND (row_count <= 500)))
);


--
-- Name: import_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.import_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: import_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.import_batches_id_seq OWNED BY public.import_batches.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    client_id integer NOT NULL,
    project_id integer NOT NULL,
    quote_id integer,
    number text NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date NOT NULL,
    default_vat_rate numeric(5,2) NOT NULL,
    amount_excl_vat numeric(12,2) DEFAULT 0 NOT NULL,
    vat_amount numeric(12,2) DEFAULT 0 NOT NULL,
    amount_incl_vat numeric(12,2) DEFAULT 0 NOT NULL,
    note text,
    sent_at timestamp(6) with time zone,
    reminder_count smallint DEFAULT 0 NOT NULL,
    last_reminder_at timestamp(6) with time zone,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    invoice_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    method public.payment_method NOT NULL,
    reference text,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    note text,
    CONSTRAINT chk_payment_correction_note CHECK (((amount > (0)::numeric) OR (note IS NOT NULL))),
    CONSTRAINT chk_payment_not_zero CHECK ((amount <> (0)::numeric))
);


--
-- Name: invoice_balance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.invoice_balance AS
 SELECT i.id AS invoice_id,
    i.tenant_id,
    i.amount_incl_vat,
    COALESCE(p.amount_paid, (0)::numeric) AS amount_paid,
    (i.amount_incl_vat - COALESCE(p.amount_paid, (0)::numeric)) AS balance_due,
    ((i.due_date < CURRENT_DATE) AND ((i.amount_incl_vat - COALESCE(p.amount_paid, (0)::numeric)) > (0)::numeric) AND (i.status = ANY (ARRAY['sent'::public.invoice_status, 'partially_paid'::public.invoice_status]))) AS is_late
   FROM (public.invoices i
     LEFT JOIN ( SELECT payments.invoice_id,
            sum(payments.amount) AS amount_paid
           FROM public.payments
          GROUP BY payments.invoice_id) p ON ((p.invoice_id = i.id)));


--
-- Name: invoice_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_lines (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    invoice_id integer NOT NULL,
    service_id integer,
    description text NOT NULL,
    unit text,
    quantity numeric(12,3) NOT NULL,
    unit_price_excl_vat numeric(12,2) NOT NULL,
    vat_rate numeric(5,2) NOT NULL,
    total_excl_vat numeric(12,2) DEFAULT 0 NOT NULL,
    "position" smallint DEFAULT 0 NOT NULL,
    CONSTRAINT chk_invoice_line_price CHECK ((unit_price_excl_vat >= (0)::numeric)),
    CONSTRAINT chk_invoice_line_quantity CHECK ((quantity <> (0)::numeric))
);


--
-- Name: invoice_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_lines_id_seq OWNED BY public.invoice_lines.id;


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    description text NOT NULL,
    unit text NOT NULL,
    purchase_price numeric(12,2) DEFAULT 0 NOT NULL,
    minimum_stock numeric(12,3) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_material_prices CHECK (((purchase_price >= (0)::numeric) AND (minimum_stock >= (0)::numeric)))
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    material_id integer NOT NULL,
    project_id integer,
    report_id integer,
    purchase_invoice_id integer,
    type public.stock_movement_type NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    movement_date date DEFAULT CURRENT_DATE NOT NULL,
    note text,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    import_batch_id integer,
    CONSTRAINT chk_consumption_has_project CHECK (((type <> 'consumption'::public.stock_movement_type) OR ((project_id IS NOT NULL) AND (quantity < (0)::numeric)))),
    CONSTRAINT chk_movement_quantity_nonzero CHECK ((quantity <> (0)::numeric)),
    CONSTRAINT chk_purchase_no_project CHECK (((type <> 'purchase'::public.stock_movement_type) OR ((project_id IS NULL) AND (quantity > (0)::numeric))))
);


--
-- Name: stock_reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_reservations (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    project_id integer NOT NULL,
    material_id integer NOT NULL,
    reserved_quantity numeric(12,3) NOT NULL,
    remaining_quantity numeric(12,3) NOT NULL,
    status public.reservation_status DEFAULT 'active'::public.reservation_status NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_reservation_quantities CHECK (((reserved_quantity >= (0)::numeric) AND (remaining_quantity >= (0)::numeric) AND (remaining_quantity <= reserved_quantity)))
);


--
-- Name: material_stock_live; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.material_stock_live AS
 SELECT m.id AS material_id,
    m.tenant_id,
    COALESCE(mv.on_hand, (0)::numeric) AS on_hand,
    COALESCE(rs.reserved, (0)::numeric) AS reserved,
    (COALESCE(mv.on_hand, (0)::numeric) - COALESCE(rs.reserved, (0)::numeric)) AS available
   FROM ((public.materials m
     LEFT JOIN ( SELECT stock_movements.material_id,
            sum(stock_movements.quantity) AS on_hand
           FROM public.stock_movements
          GROUP BY stock_movements.material_id) mv ON ((mv.material_id = m.id)))
     LEFT JOIN ( SELECT stock_reservations.material_id,
            sum(stock_reservations.remaining_quantity) AS reserved
           FROM public.stock_reservations
          WHERE (stock_reservations.status = 'active'::public.reservation_status)
          GROUP BY stock_reservations.material_id) rs ON ((rs.material_id = m.id)));


--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    entity_type public.media_entity_type NOT NULL,
    entity_id integer NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size bigint NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    uploaded_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) with time zone,
    file_id text NOT NULL,
    CONSTRAINT chk_media_file_size CHECK (((file_size > 0) AND (file_size <= 10485760)))
);


--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: message_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_reads (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer,
    client_id integer,
    read_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_read_one_reader CHECK ((num_nonnulls(user_id, client_id) = 1))
);


--
-- Name: message_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_reads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_reads_id_seq OWNED BY public.message_reads.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_type public.sender_type NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    tenant_id integer,
    user_id integer,
    admin_user_id integer,
    type text NOT NULL,
    payload jsonb,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_notification_one_recipient CHECK ((num_nonnulls(user_id, admin_user_id) = 1))
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: one_time_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.one_time_codes (
    id integer NOT NULL,
    user_id integer,
    admin_user_id integer,
    type public.one_time_code_type NOT NULL,
    code_hash text NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    consumed_at timestamp(6) with time zone,
    attempt_count smallint DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tenant_id integer,
    CONSTRAINT chk_code_one_owner CHECK ((num_nonnulls(tenant_id, user_id, admin_user_id) = 1))
);


--
-- Name: one_time_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.one_time_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: one_time_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.one_time_codes_id_seq OWNED BY public.one_time_codes.id;


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: plan_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_features (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    feature_key text NOT NULL,
    limit_value integer NOT NULL,
    overage_rate numeric(12,2) DEFAULT 0 NOT NULL
);


--
-- Name: plan_features_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plan_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plan_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plan_features_id_seq OWNED BY public.plan_features.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    name text NOT NULL,
    base_price numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    parent_plan_id integer,
    stripe_price_id text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_plan_price CHECK ((base_price >= (0)::numeric))
);


--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: portal_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_tokens (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    client_id integer NOT NULL,
    project_id integer NOT NULL,
    token_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: portal_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_tokens_id_seq OWNED BY public.portal_tokens.id;


--
-- Name: portal_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_tracking (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    portal_token_id integer NOT NULL,
    event_type public.portal_event_type NOT NULL,
    ip_address inet,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: portal_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_tracking_id_seq OWNED BY public.portal_tracking.id;


--
-- Name: project_closure_snapshot_costs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_closure_snapshot_costs (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    snapshot_id integer NOT NULL,
    cost_type_id integer NOT NULL,
    amount numeric(12,2) NOT NULL
);


--
-- Name: project_closure_snapshot_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_closure_snapshot_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_closure_snapshot_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_closure_snapshot_costs_id_seq OWNED BY public.project_closure_snapshot_costs.id;


--
-- Name: project_closure_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_closure_snapshots (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    project_id integer NOT NULL,
    budget_excl_vat numeric(12,2) NOT NULL,
    total_cost numeric(12,2) NOT NULL,
    margin_excl_vat numeric(12,2) NOT NULL,
    margin_pct numeric(5,2),
    closed_by integer,
    closed_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    voided_at timestamp(6) with time zone,
    voided_by integer
);


--
-- Name: project_closure_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_closure_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_closure_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_closure_snapshots_id_seq OWNED BY public.project_closure_snapshots.id;


--
-- Name: project_margin_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_margin_alerts (
    tenant_id integer NOT NULL,
    project_id integer NOT NULL,
    level public.margin_alert_level NOT NULL,
    fired_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    client_id integer NOT NULL,
    name text NOT NULL,
    description text,
    status public.project_status DEFAULT 'prospect'::public.project_status NOT NULL,
    address_line1 text,
    address_line2 text,
    postal_code text,
    city text,
    start_date date,
    end_date date,
    actual_end_date date,
    manager_id integer,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_project_dates CHECK (((end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: purchase_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_invoices (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    type public.purchase_invoice_type NOT NULL,
    cost_type_id integer NOT NULL,
    subcontractor_contract_id integer,
    supplier_id integer,
    project_id integer,
    number text NOT NULL,
    external_number text,
    amount_excl_vat numeric(12,2) NOT NULL,
    vat_rate numeric(5,2) DEFAULT 21.00 NOT NULL,
    vat_amount numeric(12,2) DEFAULT 0 NOT NULL,
    amount_incl_vat numeric(12,2) DEFAULT 0 NOT NULL,
    issue_date date NOT NULL,
    due_date date,
    status public.purchase_invoice_status DEFAULT 'to_pay'::public.purchase_invoice_status NOT NULL,
    payment_reference text,
    paid_at timestamp(6) with time zone,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_purchase_amount CHECK ((amount_excl_vat >= (0)::numeric)),
    CONSTRAINT chk_purchase_one_source CHECK ((((type = 'subcontractor'::public.purchase_invoice_type) AND (subcontractor_contract_id IS NOT NULL) AND (supplier_id IS NULL)) OR ((type = 'supplier'::public.purchase_invoice_type) AND (supplier_id IS NOT NULL) AND (subcontractor_contract_id IS NULL)))),
    CONSTRAINT chk_subcontractor_has_project CHECK (((type <> 'subcontractor'::public.purchase_invoice_type) OR (project_id IS NOT NULL)))
);


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    client_id integer NOT NULL,
    project_id integer NOT NULL,
    number text NOT NULL,
    status public.quote_status DEFAULT 'draft'::public.quote_status NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    valid_until date,
    default_vat_rate numeric(5,2) NOT NULL,
    amount_excl_vat numeric(12,2) DEFAULT 0 NOT NULL,
    vat_amount numeric(12,2) DEFAULT 0 NOT NULL,
    amount_incl_vat numeric(12,2) DEFAULT 0 NOT NULL,
    note text,
    sent_at timestamp(6) with time zone,
    accepted_at timestamp(6) with time zone,
    refused_at timestamp(6) with time zone,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entries (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer,
    work_date date NOT NULL,
    hours numeric(5,2) NOT NULL,
    hourly_rate numeric(12,2) NOT NULL,
    comment text,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_hours_range CHECK (((hours > (0)::numeric) AND (hours <= (24)::numeric)))
);


--
-- Name: project_margin_live; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.project_margin_live AS
 SELECT p.id AS project_id,
    p.tenant_id,
    COALESCE(q.budget_excl_vat, (0)::numeric) AS budget_excl_vat,
    COALESCE(mc.material_cost, (0)::numeric) AS material_cost,
    COALESCE(lc.labor_cost, (0)::numeric) AS labor_cost,
    COALESCE(bc.bill_cost, (0)::numeric) AS bill_cost,
    ((COALESCE(mc.material_cost, (0)::numeric) + COALESCE(lc.labor_cost, (0)::numeric)) + COALESCE(bc.bill_cost, (0)::numeric)) AS total_cost,
    (COALESCE(q.budget_excl_vat, (0)::numeric) - ((COALESCE(mc.material_cost, (0)::numeric) + COALESCE(lc.labor_cost, (0)::numeric)) + COALESCE(bc.bill_cost, (0)::numeric))) AS margin_excl_vat,
        CASE
            WHEN (COALESCE(q.budget_excl_vat, (0)::numeric) > (0)::numeric) THEN round((((COALESCE(q.budget_excl_vat, (0)::numeric) - ((COALESCE(mc.material_cost, (0)::numeric) + COALESCE(lc.labor_cost, (0)::numeric)) + COALESCE(bc.bill_cost, (0)::numeric))) / q.budget_excl_vat) * (100)::numeric), 2)
            ELSE NULL::numeric
        END AS margin_pct
   FROM ((((public.projects p
     LEFT JOIN ( SELECT quotes.project_id,
            sum(quotes.amount_excl_vat) AS budget_excl_vat
           FROM public.quotes
          WHERE (quotes.status = 'accepted'::public.quote_status)
          GROUP BY quotes.project_id) q ON ((q.project_id = p.id)))
     LEFT JOIN ( SELECT stock_movements.project_id,
            sum(((- stock_movements.quantity) * stock_movements.unit_price)) AS material_cost
           FROM public.stock_movements
          WHERE ((stock_movements.type = ANY (ARRAY['consumption'::public.stock_movement_type, 'adjustment'::public.stock_movement_type])) AND (stock_movements.project_id IS NOT NULL))
          GROUP BY stock_movements.project_id) mc ON ((mc.project_id = p.id)))
     LEFT JOIN ( SELECT time_entries.project_id,
            sum((time_entries.hours * time_entries.hourly_rate)) AS labor_cost
           FROM public.time_entries
          GROUP BY time_entries.project_id) lc ON ((lc.project_id = p.id)))
     LEFT JOIN ( SELECT pi.project_id,
            sum(pi.amount_excl_vat) AS bill_cost
           FROM (public.purchase_invoices pi
             JOIN public.cost_types ct ON ((ct.id = pi.cost_type_id)))
          WHERE ((pi.project_id IS NOT NULL) AND (ct.name <> 'material'::text))
          GROUP BY pi.project_id) bc ON ((bc.project_id = p.id)));


--
-- Name: project_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_status_history (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    project_id integer NOT NULL,
    from_status public.project_status,
    to_status public.project_status NOT NULL,
    reason text,
    changed_by integer,
    changed_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: project_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_status_history_id_seq OWNED BY public.project_status_history.id;


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: purchase_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_invoices_id_seq OWNED BY public.purchase_invoices.id;


--
-- Name: quote_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_lines (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    quote_id integer NOT NULL,
    service_id integer,
    description text NOT NULL,
    unit text,
    quantity numeric(12,3) NOT NULL,
    unit_price_excl_vat numeric(12,2) NOT NULL,
    vat_rate numeric(5,2) NOT NULL,
    total_excl_vat numeric(12,2) DEFAULT 0 NOT NULL,
    "position" smallint DEFAULT 0 NOT NULL,
    CONSTRAINT chk_quote_line_price CHECK ((unit_price_excl_vat >= (0)::numeric)),
    CONSTRAINT chk_quote_line_quantity CHECK ((quantity <> (0)::numeric))
);


--
-- Name: quote_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quote_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quote_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quote_lines_id_seq OWNED BY public.quote_lines.id;


--
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer,
    admin_user_id integer,
    token_hash text NOT NULL,
    user_agent text,
    ip_address inet,
    expires_at timestamp(6) with time zone NOT NULL,
    revoked_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_refresh_one_owner CHECK ((num_nonnulls(user_id, admin_user_id) = 1))
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    project_id integer NOT NULL,
    report_date date DEFAULT CURRENT_DATE NOT NULL,
    progress_pct integer NOT NULL,
    weather text,
    note text,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_progress_pct_range CHECK (((progress_pct >= 0) AND (progress_pct <= 100)))
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    role_id smallint NOT NULL,
    module public.permission_module NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    scope public.permission_scope DEFAULT 'all'::public.permission_scope NOT NULL
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id smallint NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: service_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_materials (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    service_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity_per_unit numeric(12,4) NOT NULL,
    CONSTRAINT chk_recipe_quantity CHECK ((quantity_per_unit > (0)::numeric))
);


--
-- Name: service_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_materials_id_seq OWNED BY public.service_materials.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    category_id integer NOT NULL,
    description text NOT NULL,
    unit text NOT NULL,
    price_excl_vat numeric(12,2) NOT NULL,
    default_vat_rate numeric(5,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_service_price CHECK ((price_excl_vat >= (0)::numeric))
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- Name: stock_reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_reservations_id_seq OWNED BY public.stock_reservations.id;


--
-- Name: stripe_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_events (
    id integer NOT NULL,
    stripe_event_id text NOT NULL,
    type text NOT NULL,
    payload jsonb NOT NULL,
    processed_at timestamp(6) with time zone,
    error text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: stripe_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stripe_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stripe_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stripe_events_id_seq OWNED BY public.stripe_events.id;


--
-- Name: subcontractor_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcontractor_contracts (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    subcontractor_id integer NOT NULL,
    project_id integer NOT NULL,
    description text,
    amount_excl_vat numeric(12,2) NOT NULL,
    status public.contract_status DEFAULT 'in_progress'::public.contract_status NOT NULL,
    start_date date,
    end_date date,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_contract_amount CHECK ((amount_excl_vat >= (0)::numeric)),
    CONSTRAINT chk_contract_dates CHECK (((end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: subcontractor_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subcontractor_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subcontractor_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subcontractor_contracts_id_seq OWNED BY public.subcontractor_contracts.id;


--
-- Name: subcontractors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcontractors (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    company_name text NOT NULL,
    trade text,
    email text,
    phone text,
    vat_number text,
    hourly_rate numeric(12,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_subcontractor_phone_format CHECK (((phone IS NULL) OR (phone ~ '^\+?[0-9 ().-]{6,20}$'::text)))
);


--
-- Name: subcontractors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subcontractors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subcontractors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subcontractors_id_seq OWNED BY public.subcontractors.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    vat_number text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_supplier_phone_format CHECK (((phone IS NULL) OR (phone ~ '^\+?[0-9 ().-]{6,20}$'::text)))
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    opened_by integer NOT NULL,
    subject text NOT NULL,
    category public.ticket_category DEFAULT 'question'::public.ticket_category NOT NULL,
    priority public.ticket_priority DEFAULT 'normal'::public.ticket_priority NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    assigned_admin_id integer,
    closed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.support_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: support_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.support_tickets_id_seq OWNED BY public.support_tickets.id;


--
-- Name: task_assignees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_assignees (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: task_assignees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_assignees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_assignees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_assignees_id_seq OWNED BY public.task_assignees.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    project_id integer NOT NULL,
    title text NOT NULL,
    type public.task_type DEFAULT 'work'::public.task_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.task_status DEFAULT 'planned'::public.task_status NOT NULL,
    created_by integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_task_dates CHECK ((end_date >= start_date))
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: tenant_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_subscriptions (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    plan_id integer NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    status public.subscription_status DEFAULT 'trialing'::public.subscription_status NOT NULL,
    period_start timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    period_end timestamp(6) with time zone NOT NULL,
    pending_plan_id integer,
    pending_plan_effective_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    grace_ends_at timestamp(6) with time zone
);


--
-- Name: tenant_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_subscriptions_id_seq OWNED BY public.tenant_subscriptions.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id integer NOT NULL,
    name text NOT NULL,
    legal_name text,
    vat_number text,
    registration_number text,
    email text NOT NULL,
    phone text,
    address_line1 text,
    address_line2 text,
    postal_code text,
    city text,
    country character(2),
    logo_media_id integer,
    default_vat_rate numeric(5,2) DEFAULT 21.00 NOT NULL,
    default_payment_days smallint DEFAULT 30 NOT NULL,
    locale text DEFAULT 'fr'::text NOT NULL,
    currency character(3) DEFAULT 'EUR'::bpchar NOT NULL,
    timezone text DEFAULT 'Europe/Brussels'::text NOT NULL,
    end_of_day_reminder_time time(6) without time zone DEFAULT '18:00:00'::time without time zone NOT NULL,
    status public.tenant_status DEFAULT 'active'::public.tenant_status NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) with time zone,
    email_verified_at timestamp(6) with time zone,
    iban text,
    bic text
);


--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: time_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.time_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: time_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.time_entries_id_seq OWNED BY public.time_entries.id;


--
-- Name: user_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_invitations (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role_id smallint NOT NULL,
    token_hash text NOT NULL,
    invited_by integer,
    expires_at timestamp(6) with time zone NOT NULL,
    accepted_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    invited_by_admin_user_id integer,
    CONSTRAINT chk_invitation_one_inviter CHECK ((num_nonnulls(invited_by, invited_by_admin_user_id) = 1))
);


--
-- Name: user_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_invitations_id_seq OWNED BY public.user_invitations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    tenant_id integer NOT NULL,
    role_id smallint NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    password_hash text,
    mobile_pin_hash text,
    failed_pin_count smallint DEFAULT 0 NOT NULL,
    hourly_rate numeric(12,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    login_code character varying(8),
    must_change_password boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_users_email_or_worker_code CHECK (((email IS NOT NULL) OR ((role_id = 5) AND (login_code IS NOT NULL))))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: analytics_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events ALTER COLUMN id SET DEFAULT nextval('public.analytics_events_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: billing_usage_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_usage_snapshots ALTER COLUMN id SET DEFAULT nextval('public.billing_usage_snapshots_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: conversation_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members ALTER COLUMN id SET DEFAULT nextval('public.conversation_members_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: cost_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_types ALTER COLUMN id SET DEFAULT nextval('public.cost_types_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: import_batches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches ALTER COLUMN id SET DEFAULT nextval('public.import_batches_id_seq'::regclass);


--
-- Name: invoice_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines ALTER COLUMN id SET DEFAULT nextval('public.invoice_lines_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: message_reads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reads ALTER COLUMN id SET DEFAULT nextval('public.message_reads_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: one_time_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_codes ALTER COLUMN id SET DEFAULT nextval('public.one_time_codes_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: plan_features id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features ALTER COLUMN id SET DEFAULT nextval('public.plan_features_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: portal_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tokens ALTER COLUMN id SET DEFAULT nextval('public.portal_tokens_id_seq'::regclass);


--
-- Name: portal_tracking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tracking ALTER COLUMN id SET DEFAULT nextval('public.portal_tracking_id_seq'::regclass);


--
-- Name: project_closure_snapshot_costs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshot_costs ALTER COLUMN id SET DEFAULT nextval('public.project_closure_snapshot_costs_id_seq'::regclass);


--
-- Name: project_closure_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshots ALTER COLUMN id SET DEFAULT nextval('public.project_closure_snapshots_id_seq'::regclass);


--
-- Name: project_status_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status_history ALTER COLUMN id SET DEFAULT nextval('public.project_status_history_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: purchase_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices ALTER COLUMN id SET DEFAULT nextval('public.purchase_invoices_id_seq'::regclass);


--
-- Name: quote_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_lines ALTER COLUMN id SET DEFAULT nextval('public.quote_lines_id_seq'::regclass);


--
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: service_materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_materials ALTER COLUMN id SET DEFAULT nextval('public.service_materials_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- Name: stock_reservations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations ALTER COLUMN id SET DEFAULT nextval('public.stock_reservations_id_seq'::regclass);


--
-- Name: stripe_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events ALTER COLUMN id SET DEFAULT nextval('public.stripe_events_id_seq'::regclass);


--
-- Name: subcontractor_contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractor_contracts ALTER COLUMN id SET DEFAULT nextval('public.subcontractor_contracts_id_seq'::regclass);


--
-- Name: subcontractors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractors ALTER COLUMN id SET DEFAULT nextval('public.subcontractors_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: support_tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN id SET DEFAULT nextval('public.support_tickets_id_seq'::regclass);


--
-- Name: task_assignees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees ALTER COLUMN id SET DEFAULT nextval('public.task_assignees_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: tenant_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.tenant_subscriptions_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: time_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries ALTER COLUMN id SET DEFAULT nextval('public.time_entries_id_seq'::regclass);


--
-- Name: user_invitations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invitations ALTER COLUMN id SET DEFAULT nextval('public.user_invitations_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f0cb6538-e484-400e-9206-c05a3f45738f	9fd4ba1a865b47130f56fcfbe7808b6bb2a92f06871bb6c3e205c7678fcc1346	2026-10-05 20:35:26.855244+00	20261005130720_init	\N	\N	2026-10-05 20:35:24.658497+00	1
63383daf-42fb-44c6-9cb3-2e93b5a8405b	12c87813f0df2a89bf1cceba83d213a089d00e98c661b61b268b19b66aa0211c	2026-10-05 20:35:26.867775+00	20261005143039_tenant_soft_delete	\N	\N	2026-10-05 20:35:26.858737+00	1
f8f68332-c981-4014-a1d3-2763fa17a4d3	41acf8a7d19f114374701884c8f35557774b9f8e3cff24a056355f0493cc4f5c	2026-10-10 19:12:58.274289+00	20261010200000_subscription_grace_ends_at	\N	\N	2026-10-10 19:12:58.24309+00	1
631e67c6-f9f1-4928-bdbc-ee2203954e93	9b380f19f6a3ddffdbaa36e81d612d759f367e0351618cb308db06df9d6a6dd1	2026-10-05 20:35:26.885429+00	20261005145600_tenant_email_verification	\N	\N	2026-10-05 20:35:26.870437+00	1
2b98d9b8-043f-44c9-89c0-dfac2cf67def	4efa14dfdba3d96d68ee34fb83fe524d6bedc995783127332e8051db20fc0a24	2026-10-05 20:35:26.899081+00	20261005145627_one_time_codes_tenant_owner_check	\N	\N	2026-10-05 20:35:26.888014+00	1
3ca45457-ece7-4e78-be15-288c888bd4ca	c8616f209cf859b9c19108f2b538efb97cbceb01bc3ce72897eeabce87e88e2d	2026-10-06 20:24:02.374589+00	20261006115226_media_soft_delete	\N	\N	2026-10-06 20:24:02.36078+00	1
8bdf9337-e712-4f04-b1ee-6d565a402ff1	5d7b6f34bf5a63bce7879a5b5c4380067a2140c000575b5e7bce81a85ddb3849	2026-10-10 19:58:26.645901+00	20261010220000_margin_counts_project_adjustments	\N	\N	2026-10-10 19:58:26.595408+00	1
2bcaa6ef-351d-4abc-942d-35b88f92be6a	7252cff484bf8ac2802c5a4dcfb075f7f831d97dfa9d481076954bc329fd480a	2026-10-06 20:24:02.387745+00	20261006115944_media_file_id	\N	\N	2026-10-06 20:24:02.377644+00	1
bd4123b6-3b43-444e-9705-3908b156abfe	c06cd5303b98ec0955d6a00b556dbb833a39e1dca47b780ad7a6428c377431dd	2026-10-06 22:35:49.105488+00	20261006220000_chat_member_and_read_uniques	\N	\N	2026-10-06 22:35:49.064189+00	1
b12dd928-bb79-4ede-9f60-fa6bf04738e4	953ef2212d987ed394f2e2afaeae4186a356d474c945a7934b42156b8e8def2d	2026-10-09 17:13:29.405211+00	20261009180000_admin_can_manage_billing	\N	\N	2026-10-09 17:13:29.375865+00	1
6fa4f41b-e4a3-4eb4-a2f3-b051fbed4deb	9772cd1f6d0bb7cbda9b0690a3fd66dcd0f9b808fbc5c99bd0d59d59a28b1a81	2026-10-09 19:06:51.946433+00	20261009190000_admin_can_manage_tenants	\N	\N	2026-10-09 19:06:51.923909+00	1
67b29789-753b-4be1-936e-9efb961b854c	923560737e887b7f410740e0bc3bb26d7e4d44be9807169511ff83ade89652b9	2026-10-09 19:43:07.309459+00	20261009200000_locale_arabic_to_french	\N	\N	2026-10-09 19:43:07.288133+00	1
a8136f81-e1b4-4588-9341-7c910ad41bc7	ad0e1d708aca893f1fe918b9b1fb975ef4a1e8da392aa677cd412b5b32ddc4e2	2026-10-09 22:41:34.464402+00	20261010090000_frontend_support_columns	\N	\N	2026-10-09 22:41:34.338997+00	1
e2891b98-80bc-4ac4-8567-525975990b68	98cfc133164ac6a36b534d92ec334283a7922c99106c96e0dc97211a94ab3ff5	2026-10-10 16:15:38.563539+00	20261010150000_bulk_import	\N	\N	2026-10-10 16:15:38.433949+00	1
9228d4aa-b295-4861-9d12-92288c338e10	75ac841beadb61a595a0e5c409f952f9067c30adf2fda81c0170e061c7bb3220	2026-10-10 18:06:45.205965+00	20261010180000_direct_team_members	\N	\N	2026-10-10 18:06:45.148299+00	1
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_users (id, email, name, password_hash, totp_secret, role, is_active, created_at, updated_at, can_manage_billing, can_manage_tenants) FROM stdin;
2	othmanefadelkheir218+staff@gmail.com	TEST Staff	$argon2id$v=19$m=19456,p=1,t=2$D+oe45AW1sMKQ2BYt3PWDQ$KiEh/wxpVeSA8rTEmrbEkSF1H59muSjm5o5XoWmbGbM	\N	staff	t	2026-10-08 22:11:17.264+00	2026-10-09 19:08:03.33+00	f	f
3	othmanefadelkheir218+not211791579655679@gmail.com	TEST Not21	$argon2id$v=19$m=19456,p=1,t=2$yJ8lh702Rh62SQNIbXbfAQ$X5UM7BHobHNahdX3IpZK3DWG2vufraV0n+T2/mQxFvU	\N	staff	f	2026-10-09 21:00:55.819+00	2026-10-09 21:00:55.881+00	f	f
1	othmanefadelkheir218@gmail.com	Super Admin	$argon2id$v=19$m=19456,p=1,t=2$kUCazbTKqP2Wpi2t7d3MZQ$5/3ta4/pK1/ijdgoAlnmnMAn+MankuYgDHnWW/IuqVI	\N	super_admin	t	2026-10-08 22:10:12.312+00	2026-10-10 00:46:25.787+00	f	f
\.


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_events (id, tenant_id, user_id, event_name, payload, created_at) FROM stdin;
3	1	1	TEST_quote_sent	{"test": "true"}	2026-10-09 13:15:54.969+00
4	1	1	TEST_redis_down_1	{"test": "true"}	2026-10-09 13:29:06.074+00
5	1	1	TEST_redis_down_2	{"test": "true"}	2026-10-09 13:29:06.193+00
6	1	1	TEST_after_redis	\N	2026-10-09 13:29:32.721+00
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, tenant_id, admin_user_id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at) FROM stdin;
1	\N	1	\N	create	plan	1	\N	{"name": "TEST Small", "features": [{"feature_key": "max_workers", "limit_value": 2, "overage_rate": "2.00"}, {"feature_key": "max_managers", "limit_value": 3, "overage_rate": "5.00"}, {"feature_key": "max_clients", "limit_value": 3, "overage_rate": "1.00"}, {"feature_key": "max_subcontractors", "limit_value": 2, "overage_rate": "1.00"}, {"feature_key": "storage_gb", "limit_value": 1, "overage_rate": "0.50"}, {"feature_key": "retention_days", "limit_value": 30, "overage_rate": "0"}], "base_price": "10.00", "is_default": true}	::1	2026-10-08 22:11:13.729+00
2	\N	1	\N	create	plan	2	\N	{"name": "TEST Zero Storage", "features": [{"feature_key": "max_workers", "limit_value": 2, "overage_rate": "2.00"}, {"feature_key": "max_managers", "limit_value": 3, "overage_rate": "5.00"}, {"feature_key": "max_clients", "limit_value": 3, "overage_rate": "1.00"}, {"feature_key": "max_subcontractors", "limit_value": 2, "overage_rate": "1.00"}, {"feature_key": "storage_gb", "limit_value": 0, "overage_rate": "0"}, {"feature_key": "retention_days", "limit_value": 30, "overage_rate": "0"}], "base_price": "5.00"}	::1	2026-10-08 22:11:15.613+00
3	\N	1	\N	create	plan	3	\N	{"name": "TEST Big", "features": [{"feature_key": "max_workers", "limit_value": 50, "overage_rate": "1.00"}, {"feature_key": "max_managers", "limit_value": 20, "overage_rate": "1.00"}, {"feature_key": "max_clients", "limit_value": 500, "overage_rate": "0.10"}, {"feature_key": "max_subcontractors", "limit_value": 100, "overage_rate": "0.10"}, {"feature_key": "storage_gb", "limit_value": 10, "overage_rate": "0.20"}, {"feature_key": "retention_days", "limit_value": 365, "overage_rate": "0"}], "base_price": "50.00"}	::1	2026-10-08 22:11:16.847+00
4	\N	1	\N	create	admin_user	2	\N	{"name": "TEST Staff", "role": "staff", "email": "othmanefadelkheir218+staff@gmail.com", "password": "[redacted]"}	::1	2026-10-08 22:11:17.332+00
5	1	\N	1	soft_delete_many	media	\N	\N	{"ids": [], "skipped": []}	\N	2026-10-08 22:18:02.919+00
6	1	\N	2	soft_delete_many	media	\N	\N	{"ids": [], "skipped": []}	\N	2026-10-08 22:18:03.212+00
7	1	\N	3	soft_delete_many	media	\N	\N	{"ids": [], "skipped": []}	\N	2026-10-08 22:18:03.428+00
8	1	\N	4	soft_delete_many	media	\N	\N	{"ids": [], "skipped": []}	\N	2026-10-08 22:18:03.643+00
9	1	\N	5	soft_delete_many	media	\N	\N	{"ids": [], "skipped": []}	\N	2026-10-08 22:18:03.815+00
10	1	\N	1	upsert_permission	role_permission	1	\N	{"id": 1, "scope": "all", "module": "invoices", "role_id": 2, "can_edit": false, "can_view": true, "tenant_id": 1, "can_create": false, "can_delete": false}	\N	2026-10-08 22:19:17.185+00
11	1	\N	1	upsert_permission	role_permission	2	\N	{"id": 2, "scope": "own", "module": "projects", "role_id": 5, "can_edit": false, "can_view": true, "tenant_id": 1, "can_create": false, "can_delete": false}	\N	2026-10-08 22:19:17.516+00
12	1	\N	1	remove_permission	role_permission	1	{"id": 1, "scope": "all", "module": "invoices", "role_id": 2, "can_edit": false, "can_view": true, "tenant_id": 1, "can_create": false, "can_delete": false}	\N	\N	2026-10-08 22:19:17.63+00
13	1	\N	1	remove_permission	role_permission	2	{"id": 2, "scope": "own", "module": "projects", "role_id": 5, "can_edit": false, "can_view": true, "tenant_id": 1, "can_create": false, "can_delete": false}	\N	\N	2026-10-08 22:19:17.695+00
14	1	\N	1	revoke	user_invitation	1	{"id": 1, "name": "TEST Iso", "email": "zakariyazouazou+isotest@gmail.com", "role_id": 6, "tenant_id": 1, "created_at": "2026-10-08T22:19:51.345Z", "expires_at": "2026-10-15T22:19:51.345Z", "invited_by": 1, "accepted_at": null}	\N	\N	2026-10-08 22:19:52.763+00
15	2	1	\N	set_status	tenant	2	{"status": "active"}	{"reason": "TEST suspension", "status": "suspended"}	::1	2026-10-08 22:46:27.241+00
16	2	1	\N	set_status	tenant	2	{"status": "suspended"}	{"reason": null, "status": "active"}	::1	2026-10-08 22:46:27.412+00
17	1	\N	1	upload	media	1	\N	{"id": 1, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_jJk_BYH-G.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:13.267Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:13.267Z", "entity_type": "report", "uploaded_by": 1}	\N	2026-10-08 22:50:13.283+00
18	1	\N	1	upload	media	2	\N	{"id": 2, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_E_Ewfc_x7.webp", "entity_id": 1, "file_name": "test.webp", "file_size": 42, "file_type": "image/webp", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:14.581Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:14.581Z", "entity_type": "report", "uploaded_by": 1}	\N	2026-10-08 22:50:14.599+00
19	1	\N	1	upload	media	3	\N	{"id": 3, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/purchase_invoice/1/test_2ShA_gLNx.pdf", "entity_id": 1, "file_name": "test.pdf", "file_size": 193, "file_type": "application/pdf", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:15.817Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:15.817Z", "entity_type": "purchase_invoice", "uploaded_by": 1}	\N	2026-10-08 22:50:15.838+00
20	1	\N	1	upload	media	4	\N	{"id": 4, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_b1pviP5P_.pdf", "entity_id": 1, "file_name": "test.pdf", "file_size": 193, "file_type": "application/pdf", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:17.309Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:17.309Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:50:17.327+00
21	1	\N	1	upload	media	5	\N	{"id": 5, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_AMWanV3hj.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:18.424Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:18.424Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:50:18.443+00
22	1	\N	1	upload	media	6	\N	{"id": 6, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_nXKU1bJRa.png", "entity_id": 1, "file_name": "test.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:19.378Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:19.378Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:50:19.382+00
182	1	\N	1	set_assignees	task	2	{"assignee_ids": []}	{"assignee_ids": [5]}	\N	2026-10-08 23:34:33.504+00
23	1	\N	1	rename	media	1	{"id": 1, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_jJk_BYH-G.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:13.267Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:13.267Z", "entity_type": "report", "uploaded_by": 1}	{"id": 1, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_jJk_BYH-G.jpg", "entity_id": 1, "file_name": "front-photo.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:13.267Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:34.999Z", "entity_type": "report", "uploaded_by": 1}	\N	2026-10-08 22:50:35.006+00
24	1	\N	2	upload	media	7	\N	{"id": 7, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_At5P1tvk3.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:55.604Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:55.604Z", "entity_type": "report", "uploaded_by": 2}	\N	2026-10-08 22:50:55.614+00
25	1	\N	5	upload	media	8	\N	{"id": 8, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_b9ZztxXQ6.png", "entity_id": 1, "file_name": "test.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:50:56.676Z", "deleted_at": null, "updated_at": "2026-10-08T22:50:56.676Z", "entity_type": "project", "uploaded_by": 5}	\N	2026-10-08 22:50:56.682+00
26	1	\N	5	upload	media	9	\N	{"id": 9, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_ecVgRAV9r.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:51:03.886Z", "deleted_at": null, "updated_at": "2026-10-08T22:51:03.886Z", "entity_type": "report", "uploaded_by": 5}	\N	2026-10-08 22:51:03.892+00
27	1	\N	5	upload	media	10	\N	{"id": 10, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_ccVPiOn00.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:51:06.372Z", "deleted_at": null, "updated_at": "2026-10-08T22:51:06.372Z", "entity_type": "report", "uploaded_by": 5}	\N	2026-10-08 22:51:06.377+00
28	1	\N	5	upload	media	11	\N	{"id": 11, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_X1TUowzon.webp", "entity_id": 1, "file_name": "test.webp", "file_size": 42, "file_type": "image/webp", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:51:08.646Z", "deleted_at": null, "updated_at": "2026-10-08T22:51:08.646Z", "entity_type": "report", "uploaded_by": 5}	\N	2026-10-08 22:51:08.651+00
29	1	\N	1	upload	media	12	\N	{"id": 12, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/50/TEST-T3_i7q5tBCL-.jpg", "entity_id": 50, "file_name": "TEST-T3.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:51:53.296Z", "deleted_at": null, "updated_at": "2026-10-08T22:51:53.296Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:51:53.309+00
30	1	\N	1	upload	media	13	\N	{"id": 13, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/50/TEST-T1_vRlZc_kIV.jpg", "entity_id": 50, "file_name": "TEST-T1.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:51:58.031Z", "deleted_at": null, "updated_at": "2026-10-08T22:51:58.031Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:51:58.047+00
31	1	\N	1	upload	media	14	\N	{"id": 14, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/50/TEST-T2__eChgIH-I.jpg", "entity_id": 50, "file_name": "TEST-T2.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:51:58.792Z", "deleted_at": null, "updated_at": "2026-10-08T22:51:58.792Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:51:58.797+00
32	1	\N	1	upload	media	15	\N	{"id": 15, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_Nx8H_Ry5e.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:05.436Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:05.436Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:05.453+00
33	1	\N	1	upload	media	16	\N	{"id": 16, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_SyAH7W-ER.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:06.217Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:06.217Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:06.224+00
34	1	\N	1	upload	media	17	\N	{"id": 17, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_1pHkXYA48.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:07.013Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:07.013Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:07.028+00
35	1	\N	1	upload	media	18	\N	{"id": 18, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_dZ0d61Hrh.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:07.788Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:07.788Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:07.792+00
36	1	\N	1	upload	media	19	\N	{"id": 19, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_aG7VX4Zx-.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:08.588Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:08.588Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:08.602+00
37	1	\N	1	upload	media	20	\N	{"id": 20, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_o6te6IYeN.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:09.394Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:09.394Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:09.399+00
183	1	\N	1	status_change	task	2	{"status": "planned"}	{"status": "in_progress"}	\N	2026-10-08 23:34:33.547+00
38	1	\N	1	upload	media	21	\N	{"id": 21, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_-7Y09sqhM.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:10.244Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:10.244Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:10.258+00
39	1	\N	1	upload	media	22	\N	{"id": 22, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_0A8UNHiOud.jpg", "entity_id": 51, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:11.124Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:11.124Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:11.129+00
40	1	\N	1	soft_delete_many	media	\N	\N	{"ids": [13], "skipped": [12]}	\N	2026-10-08 22:52:22.131+00
41	1	\N	1	restore_many	media	\N	\N	{"ids": [13]}	\N	2026-10-08 22:52:33.542+00
42	1	\N	1	restore_many	media	\N	\N	{"ids": []}	\N	2026-10-08 22:52:33.721+00
43	1	\N	1	hard_delete_many	media	\N	\N	{"ids": [14], "failed": [], "skipped": []}	\N	2026-10-08 22:52:34.448+00
44	1	\N	1	hard_delete_many	media	\N	\N	{"ids": [], "failed": [], "skipped": [12]}	\N	2026-10-08 22:52:34.789+00
45	1	\N	1	upload	media	23	\N	{"id": 23, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/50/TEST-T4_NRFFfCMp3.jpg", "entity_id": 50, "file_name": "TEST-T4.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:52:44.298Z", "deleted_at": null, "updated_at": "2026-10-08T22:52:44.298Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 22:52:44.309+00
46	1	\N	1	soft_delete_many	media	\N	\N	{"ids": [13], "skipped": []}	\N	2026-10-08 22:52:49.932+00
47	1	\N	1	soft_delete_many	media	\N	\N	{"ids": [23], "skipped": []}	\N	2026-10-08 22:52:50.281+00
48	1	\N	1	replace	media	24	\N	{"id": 24, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/user/1/test_kHi5iu1SG.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:53:02.135Z", "deleted_at": null, "updated_at": "2026-10-08T22:53:02.135Z", "entity_type": "user", "uploaded_by": 1}	\N	2026-10-08 22:53:02.141+00
49	1	\N	1	replace	media	25	{"id": 24, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/user/1/test_kHi5iu1SG.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:53:02.135Z", "deleted_at": null, "updated_at": "2026-10-08T22:53:02.135Z", "entity_type": "user", "uploaded_by": 1}	{"id": 25, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/user/1/test_32Q0Q-Dkm.jpg", "entity_id": 1, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:53:03.050Z", "deleted_at": null, "updated_at": "2026-10-08T22:53:03.050Z", "entity_type": "user", "uploaded_by": 1}	\N	2026-10-08 22:53:03.701+00
50	1	\N	1	replace	media	26	\N	{"id": 26, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/tenant/1/test_57h34-met.png", "entity_id": 1, "file_name": "test.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:53:04.869Z", "deleted_at": null, "updated_at": "2026-10-08T22:53:04.869Z", "entity_type": "tenant", "uploaded_by": 1}	\N	2026-10-08 22:53:04.88+00
51	2	\N	9	soft_delete_many	media	\N	\N	{"ids": [], "skipped": []}	\N	2026-10-08 22:53:11.085+00
52	2	\N	9	hard_delete_many	media	\N	\N	{"ids": [], "failed": [], "skipped": []}	\N	2026-10-08 22:53:11.145+00
53	1	\N	1	create	client	1	\N	{"id": 1, "city": "Brussels", "name": "TEST Client Main", "note": null, "type": "individual", "email": "gryehirir@gmail.com", "phone": "+32 470 00 00 01", "country": "BE", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:14:24.996Z", "updated_at": "2026-10-08T23:14:24.996Z", "vat_number": null, "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:14:25.006+00
54	1	\N	1	create	client	2	\N	{"id": 2, "city": "Brussels", "name": "TEST Client Pro", "note": null, "type": "professional", "email": "gryehirir+pro@gmail.com", "phone": "+32 470 00 00 02", "country": "BE", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:14:25.088Z", "updated_at": "2026-10-08T23:14:25.088Z", "vat_number": "BE0123456789", "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:14:25.092+00
55	2	\N	9	create	client	3	\N	{"id": 3, "city": null, "name": "TEST B Client", "note": null, "type": "individual", "email": "gryehirir@gmail.com", "phone": "+32 470 00 00 01", "country": null, "is_active": true, "tenant_id": 2, "created_at": "2026-10-08T23:14:25.190Z", "updated_at": "2026-10-08T23:14:25.190Z", "vat_number": null, "postal_code": null, "contact_name": null, "address_line1": null, "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:14:25.195+00
56	1	\N	1	create	client	4	\N	{"id": 4, "city": "Brussels", "name": "TEST Client Three", "note": null, "type": "individual", "email": "gryehirir+three@gmail.com", "phone": "+32 470 00 00 03", "country": "BE", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:14:25.428Z", "updated_at": "2026-10-08T23:14:25.428Z", "vat_number": null, "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:14:25.431+00
57	1	\N	1	create	client	5	\N	{"id": 5, "city": "Brussels", "name": "TEST Client Four", "note": null, "type": "individual", "email": "gryehirir+four@gmail.com", "phone": "+32 470 00 00 04", "country": "BE", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:14:25.468Z", "updated_at": "2026-10-08T23:14:25.468Z", "vat_number": null, "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:14:25.472+00
76	1	\N	1	upload	media	28	\N	{"id": 28, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/6/test_tHnGTMvE8.jpg", "entity_id": 6, "file_name": "test.jpg", "file_size": 125, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:15:07.531Z", "deleted_at": null, "updated_at": "2026-10-08T23:15:07.531Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 23:15:07.535+00
77	1	\N	1	delete_all_for_entity	media	\N	\N	{"ids": [27, 28], "skipped": [], "entity_id": 6, "entity_type": "project"}	\N	2026-10-08 23:15:08.667+00
367	1	\N	1	generate	portal_token	10	\N	{"expires_at": "2027-01-07T13:04:47.227Z", "project_id": 4, "replaced_previous_link": false}	\N	2026-10-09 13:04:47.256+00
58	1	\N	1	update	client	2	{"id": 2, "city": "Brussels", "name": "TEST Client Pro", "note": null, "type": "professional", "email": "gryehirir+pro@gmail.com", "phone": "+32 470 00 00 02", "country": "BE", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:14:25.088Z", "updated_at": "2026-10-08T23:14:25.088Z", "vat_number": "BE0123456789", "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	{"id": 2, "city": "Brussels", "name": "TEST Client Pro", "note": null, "type": "professional", "email": "gryehirir+pro@gmail.com", "phone": "+32 470 11 11 11", "country": "BE", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:14:25.088Z", "updated_at": "2026-10-08T23:14:32.100Z", "vat_number": "BE0123456789", "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:14:32.106+00
59	1	\N	1	archive	client	5	{"id": 5, "city": "Brussels", "name": "TEST Client Four", "note": null, "type": "individual", "email": "gryehirir+four@gmail.com", "phone": "+32 470 00 00 04", "country": "BE", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:14:25.468Z", "updated_at": "2026-10-08T23:14:25.468Z", "vat_number": null, "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	{"id": 5, "city": "Brussels", "name": "TEST Client Four", "note": null, "type": "individual", "email": "gryehirir+four@gmail.com", "phone": "+32 470 00 00 04", "country": "BE", "is_active": false, "tenant_id": 1, "created_at": "2026-10-08T23:14:25.468Z", "updated_at": "2026-10-08T23:14:32.162Z", "vat_number": null, "postal_code": "1000", "contact_name": null, "address_line1": "Rue Neuve 10", "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:14:32.168+00
60	1	\N	1	create	project	1	\N	{"id": 1, "city": "Brussels", "name": "TEST Project Flow", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:14:32.746Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:14:32.746Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:14:32.768+00
61	1	\N	1	create	project	2	\N	{"id": 2, "city": null, "name": "TEST Iso address only", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:14:45.112Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:14:45.112Z", "description": null, "postal_code": "1000", "address_line1": "Rue Neuve 10", "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:14:45.121+00
62	1	\N	1	create	project	3	\N	{"id": 3, "city": null, "name": "TEST Iso start_date ISO", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:14:45.207Z", "created_by": 1, "manager_id": null, "start_date": "2026-11-02T00:00:00.000Z", "updated_at": "2026-10-08T23:14:45.207Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:14:45.217+00
63	1	\N	1	delete_all_for_entity	media	\N	\N	{"ids": [], "skipped": [], "entity_id": 2, "entity_type": "project"}	\N	2026-10-08 23:14:55.902+00
64	1	\N	1	delete	project	2	{"id": 2, "city": null, "name": "TEST Iso address only", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:14:45.112Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:14:45.112Z", "description": null, "postal_code": "1000", "address_line1": "Rue Neuve 10", "address_line2": null, "actual_end_date": null}	\N	\N	2026-10-08 23:14:55.928+00
65	1	\N	1	delete_all_for_entity	media	\N	\N	{"ids": [], "skipped": [], "entity_id": 3, "entity_type": "project"}	\N	2026-10-08 23:14:55.974+00
66	1	\N	1	delete	project	3	{"id": 3, "city": null, "name": "TEST Iso start_date ISO", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:14:45.207Z", "created_by": 1, "manager_id": null, "start_date": "2026-11-02T00:00:00.000Z", "updated_at": "2026-10-08T23:14:45.207Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	\N	2026-10-08 23:14:55.983+00
67	1	\N	1	create	project	4	\N	{"id": 4, "city": "Brussels", "name": "TEST Project Main", "status": "prospect", "end_date": "2026-12-18T00:00:00.000Z", "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:14:56.092Z", "created_by": 1, "manager_id": null, "start_date": "2026-11-02T00:00:00.000Z", "updated_at": "2026-10-08T23:14:56.092Z", "description": null, "postal_code": "1000", "address_line1": "Rue Neuve 10", "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:14:56.104+00
68	1	\N	1	change_status	project	1	{"status": "prospect"}	{"status": "in_progress", "snapshot_id": null}	\N	2026-10-08 23:14:56.245+00
69	1	\N	1	change_status	project	1	{"status": "in_progress"}	{"status": "completed", "snapshot_id": 1}	\N	2026-10-08 23:14:56.424+00
70	1	\N	1	change_status	project	1	{"status": "completed"}	{"status": "in_progress", "snapshot_id": 1}	\N	2026-10-08 23:14:56.52+00
71	1	\N	1	create	project	5	\N	{"id": 5, "city": null, "name": "TEST Project Cancel", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:15:05.368Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:15:05.368Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:15:05.376+00
72	1	\N	1	release_reservations	project	5	\N	{"released": 0}	\N	2026-10-08 23:15:05.468+00
73	1	\N	1	cancel	project	5	{"status": "prospect"}	{"status": "cancelled", "snapshot_id": 2}	\N	2026-10-08 23:15:05.525+00
74	1	\N	1	create	project	6	\N	{"id": 6, "city": null, "name": "TEST Project Delete", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:15:05.663Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:15:05.663Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:15:05.672+00
75	1	\N	1	upload	media	27	\N	{"id": 27, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/6/test_iI1UQaozJ.pdf", "entity_id": 6, "file_name": "test.pdf", "file_size": 193, "file_type": "application/pdf", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:15:06.784Z", "deleted_at": null, "updated_at": "2026-10-08T23:15:06.784Z", "entity_type": "project", "uploaded_by": 1}	\N	2026-10-08 23:15:06.803+00
217	1	\N	3	create	report	4	\N	{"id": 4, "note": null, "weather": null, "tenant_id": 1, "created_at": "2026-10-08T23:41:03.796Z", "created_by": 3, "project_id": 10, "updated_at": "2026-10-08T23:41:03.796Z", "report_date": "2026-09-28T00:00:00.000Z", "progress_pct": 40}	\N	2026-10-08 23:41:03.812+00
78	1	\N	1	delete	project	6	{"id": 6, "city": null, "name": "TEST Project Delete", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:15:05.663Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:15:05.663Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	\N	2026-10-08 23:15:08.684+00
79	1	\N	1	change_status	project	1	{"status": "in_progress"}	{"status": "completed", "snapshot_id": 3}	\N	2026-10-08 23:15:08.982+00
80	1	\N	7	create	client	6	\N	{"id": 6, "city": null, "name": "TEST Sales Client", "note": null, "type": "individual", "email": "gryehirir+sales@gmail.com", "phone": "+32 470 00 00 07", "country": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:15:15.666Z", "updated_at": "2026-10-08T23:15:15.666Z", "vat_number": null, "postal_code": null, "contact_name": null, "address_line1": null, "address_line2": null, "phone_secondary": null}	\N	2026-10-08 23:15:15.672+00
81	1	\N	1	create	category	11	\N	{"id": 11, "name": "TEST Finishing", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:16.001Z"}	\N	2026-10-08 23:22:16.005+00
82	1	\N	1	update	category	11	{"id": 11, "name": "TEST Finishing", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:16.001Z"}	{"id": 11, "name": "TEST Finishing 2", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:16.001Z"}	\N	2026-10-08 23:22:16.367+00
83	1	\N	1	archive	category	11	{"id": 11, "name": "TEST Finishing 2", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:16.001Z"}	{"id": 11, "name": "TEST Finishing 2", "is_active": false, "tenant_id": 1, "created_at": "2026-10-08T23:22:16.001Z"}	\N	2026-10-08 23:22:16.415+00
84	1	\N	1	create	category	12	\N	{"id": 12, "name": "TEST Finishing", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:16.449Z"}	\N	2026-10-08 23:22:16.453+00
85	1	\N	1	create	material	1	\N	{"id": 1, "unit": "l", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.472Z", "updated_at": "2026-10-08T23:22:26.472Z", "description": "TEST Paint", "minimum_stock": "10", "purchase_price": "6"}	\N	2026-10-08 23:22:26.479+00
86	1	\N	1	create	material	2	\N	{"id": 2, "unit": "piece", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.518Z", "updated_at": "2026-10-08T23:22:26.518Z", "description": "TEST Tape", "minimum_stock": "5", "purchase_price": "2"}	\N	2026-10-08 23:22:26.521+00
87	1	\N	1	create	material	3	\N	{"id": 3, "unit": "kg", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.566Z", "updated_at": "2026-10-08T23:22:26.566Z", "description": "TEST Filler", "minimum_stock": "5", "purchase_price": "4"}	\N	2026-10-08 23:22:26.569+00
88	1	\N	1	create	service	1	\N	{"id": 1, "unit": "m2", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.644Z", "updated_at": "2026-10-08T23:22:26.644Z", "category_id": 1, "description": "TEST Painting", "price_excl_vat": "25", "default_vat_rate": "6"}	\N	2026-10-08 23:22:26.65+00
89	1	\N	1	create	service	2	\N	{"id": 2, "unit": "h", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.697Z", "updated_at": "2026-10-08T23:22:26.697Z", "category_id": 12, "description": "TEST Labour", "price_excl_vat": "45", "default_vat_rate": "21"}	\N	2026-10-08 23:22:26.7+00
90	1	\N	1	set_recipe	service	1	\N	{"items": [{"material_id": 1, "quantity_per_unit": "9"}, {"material_id": 2, "quantity_per_unit": "9"}, {"material_id": 3, "quantity_per_unit": "9"}]}	\N	2026-10-08 23:22:26.763+00
91	1	\N	1	set_recipe	service	1	\N	{"items": [{"material_id": 1, "quantity_per_unit": "0.15"}, {"material_id": 2, "quantity_per_unit": "0.05"}, {"material_id": 3, "quantity_per_unit": "0.02"}]}	\N	2026-10-08 23:22:26.826+00
92	1	\N	1	set_recipe	service	1	\N	{"items": [{"material_id": 1, "quantity_per_unit": "1"}]}	\N	2026-10-08 23:22:26.93+00
93	1	\N	1	set_recipe	service	1	\N	{"items": [{"material_id": 1, "quantity_per_unit": "0.15"}, {"material_id": 2, "quantity_per_unit": "0.05"}, {"material_id": 3, "quantity_per_unit": "0.02"}]}	\N	2026-10-08 23:22:27.093+00
94	2	\N	9	create	material	4	\N	{"id": 4, "unit": "l", "is_active": true, "tenant_id": 2, "created_at": "2026-10-08T23:22:27.309Z", "updated_at": "2026-10-08T23:22:27.309Z", "description": "TEST B Mat", "minimum_stock": "1", "purchase_price": "1"}	\N	2026-10-08 23:22:27.314+00
95	1	\N	1	purchase	stock_movement	1	\N	{"id": 1, "note": null, "type": "purchase", "quantity": "100", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:22:37.205Z", "created_by": 1, "project_id": null, "unit_price": "6", "material_id": 1, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-08 23:22:37.21+00
96	1	\N	1	purchase	stock_movement	2	\N	{"id": 2, "note": null, "type": "purchase", "quantity": "40", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:22:37.261Z", "created_by": 1, "project_id": null, "unit_price": "2", "material_id": 2, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-08 23:22:37.264+00
97	1	\N	1	purchase	stock_movement	3	\N	{"id": 3, "note": null, "type": "purchase", "quantity": "20", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:22:37.314Z", "created_by": 1, "project_id": null, "unit_price": "4", "material_id": 3, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-08 23:22:37.317+00
98	1	\N	1	update	material	1	{"id": 1, "unit": "l", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.472Z", "updated_at": "2026-10-08T23:22:26.472Z", "description": "TEST Paint", "minimum_stock": "10", "purchase_price": "6"}	{"id": 1, "unit": "l", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.472Z", "updated_at": "2026-10-08T23:22:37.603Z", "description": "TEST Paint", "minimum_stock": "10", "purchase_price": "9"}	\N	2026-10-08 23:22:37.617+00
99	1	\N	1	update	material	1	{"id": 1, "unit": "l", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.472Z", "updated_at": "2026-10-08T23:22:37.603Z", "description": "TEST Paint", "minimum_stock": "10", "purchase_price": "9"}	{"id": 1, "unit": "l", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:22:26.472Z", "updated_at": "2026-10-08T23:22:37.699Z", "description": "TEST Paint", "minimum_stock": "10", "purchase_price": "6"}	\N	2026-10-08 23:22:37.701+00
261	1	\N	1	create_reservations	project	12	\N	{"materials": []}	\N	2026-10-08 23:52:10.006+00
397	1	2	\N	set_pending_plan	subscription	1	\N	{"plan_id": 3}	::1	2026-10-09 13:35:35.718+00
100	1	\N	2	adjustment	stock_movement	4	\N	{"id": 4, "note": "TEST damaged", "type": "adjustment", "quantity": "-38", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:22:37.766Z", "created_by": 2, "project_id": null, "unit_price": "2", "material_id": 2, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-08 23:22:37.769+00
101	1	\N	1	adjustment	stock_movement	5	\N	{"id": 5, "note": "TEST correction", "type": "adjustment", "quantity": "38", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:22:38.284Z", "created_by": 1, "project_id": null, "unit_price": "2", "material_id": 2, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-08 23:22:38.299+00
102	1	\N	1	create	quote	1	\N	{"id": 1, "note": null, "lines": [{"id": 1, "unit": "m²", "position": 1, "quantity": "40", "quote_id": 1, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "1000", "unit_price_excl_vat": "25"}, {"id": 2, "unit": "h", "position": 2, "quantity": "10", "quote_id": 1, "vat_rate": "21", "tenant_id": 1, "service_id": 2, "description": "TEST Labour", "total_excl_vat": "450", "unit_price_excl_vat": "45"}], "number": "QUO-2026-0001", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:25:51.459Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:25:51.486Z", "vat_amount": "154.5", "accepted_at": null, "valid_until": null, "amount_excl_vat": "1450", "amount_incl_vat": "1604.5", "default_vat_rate": "21"}	\N	2026-10-08 23:25:51.493+00
103	1	\N	1	set_lines	quote	1	\N	{"id": 1, "note": null, "lines": [{"id": 3, "unit": "m²", "position": 1, "quantity": "40", "quote_id": 1, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "1000", "unit_price_excl_vat": "25"}, {"id": 4, "unit": "h", "position": 2, "quantity": "12", "quote_id": 1, "vat_rate": "21", "tenant_id": 1, "service_id": 2, "description": "TEST Labour", "total_excl_vat": "540", "unit_price_excl_vat": "45"}], "number": "QUO-2026-0001", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:25:51.459Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:25:51.607Z", "vat_amount": "173.4", "accepted_at": null, "valid_until": null, "amount_excl_vat": "1540", "amount_incl_vat": "1713.4", "default_vat_rate": "21"}	\N	2026-10-08 23:25:51.614+00
104	1	\N	1	set_lines	quote	1	\N	{"id": 1, "note": null, "lines": [{"id": 5, "unit": "m²", "position": 1, "quantity": "40", "quote_id": 1, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "1000", "unit_price_excl_vat": "25"}, {"id": 6, "unit": "h", "position": 2, "quantity": "10", "quote_id": 1, "vat_rate": "21", "tenant_id": 1, "service_id": 2, "description": "TEST Labour", "total_excl_vat": "450", "unit_price_excl_vat": "45"}], "number": "QUO-2026-0001", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:25:51.459Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:25:51.647Z", "vat_amount": "154.5", "accepted_at": null, "valid_until": null, "amount_excl_vat": "1450", "amount_incl_vat": "1604.5", "default_vat_rate": "21"}	\N	2026-10-08 23:25:51.654+00
105	1	\N	1	create	quote	2	\N	{"id": 2, "note": null, "lines": [], "number": "QUO-2026-0002", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:25:51.683Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:25:51.689Z", "vat_amount": "0", "accepted_at": null, "valid_until": null, "amount_excl_vat": "0", "amount_incl_vat": "0", "default_vat_rate": "21"}	\N	2026-10-08 23:25:51.695+00
106	1	\N	1	create	quote	3	\N	{"id": 3, "note": null, "lines": [{"id": 7, "unit": "piece", "position": 1, "quantity": "1", "quote_id": 3, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST free text", "total_excl_vat": "100", "unit_price_excl_vat": "100"}], "number": "QUO-2026-0003", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:06.305Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:26:06.313Z", "vat_amount": "21", "accepted_at": null, "valid_until": null, "amount_excl_vat": "100", "amount_incl_vat": "121", "default_vat_rate": "21"}	\N	2026-10-08 23:26:06.319+00
107	1	\N	1	create	quote	4	\N	{"id": 4, "note": null, "lines": [{"id": 8, "unit": "piece", "position": 1, "quantity": "1", "quote_id": 4, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST concurrent", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0004", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:06.370Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:26:06.383Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-08 23:26:06.391+00
108	1	\N	1	create	quote	5	\N	{"id": 5, "note": null, "lines": [{"id": 9, "unit": "piece", "position": 1, "quantity": "1", "quote_id": 5, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST concurrent", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0005", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:06.402Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:26:06.417Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-08 23:26:06.426+00
127	1	\N	1	upload	media	33	\N	{"id": 33, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/10/QUO-2026-0010_c7EI6jl-b.pdf", "entity_id": 10, "file_name": "QUO-2026-0010.pdf", "file_size": 3361, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:26:38.936Z", "deleted_at": null, "updated_at": "2026-10-08T23:26:38.936Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:26:38.951+00
128	1	\N	1	send	quote	10	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:26:38.965+00
109	1	\N	1	create	quote	6	\N	{"id": 6, "note": null, "lines": [{"id": 10, "unit": "piece", "position": 1, "quantity": "1", "quote_id": 6, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST concurrent", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0006", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:06.424Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:26:06.439Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-08 23:26:06.445+00
110	1	\N	1	upload	media	29	\N	{"id": 29, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/1/QUO-2026-0001_OP1hX3OWP.pdf", "entity_id": 1, "file_name": "QUO-2026-0001.pdf", "file_size": 3559, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:26:08.546Z", "deleted_at": null, "updated_at": "2026-10-08T23:26:08.546Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:26:08.551+00
111	1	\N	1	send	quote	1	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:26:08.567+00
112	1	\N	1	create_reservations	project	4	\N	{"materials": [1, 2, 3]}	\N	2026-10-08 23:26:22.54+00
113	1	\N	1	accept	quote	1	{"status": "sent"}	{"status": "accepted", "project_id": 4}	\N	2026-10-08 23:26:22.55+00
114	1	\N	1	create	quote	7	\N	{"id": 7, "note": null, "lines": [{"id": 11, "unit": "m²", "position": 1, "quantity": "20", "quote_id": 7, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "500", "unit_price_excl_vat": "25"}], "number": "QUO-2026-0007", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:34.354Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:26:34.370Z", "vat_amount": "30", "accepted_at": null, "valid_until": null, "amount_excl_vat": "500", "amount_incl_vat": "530", "default_vat_rate": "21"}	\N	2026-10-08 23:26:34.376+00
115	1	\N	1	upload	media	30	\N	{"id": 30, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/7/QUO-2026-0007_-iCEiqZ6h.pdf", "entity_id": 7, "file_name": "QUO-2026-0007.pdf", "file_size": 3358, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:26:35.630Z", "deleted_at": null, "updated_at": "2026-10-08T23:26:35.630Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:26:35.646+00
116	1	\N	1	send	quote	7	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:26:35.665+00
117	1	\N	1	create_reservations	project	4	\N	{"materials": [1, 2, 3]}	\N	2026-10-08 23:26:35.714+00
118	1	\N	1	accept	quote	7	{"status": "sent"}	{"status": "accepted", "project_id": 4}	\N	2026-10-08 23:26:35.721+00
119	1	\N	1	create	quote	8	\N	{"id": 8, "note": null, "lines": [{"id": 12, "unit": "m²", "position": 1, "quantity": "1", "quote_id": 8, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "25", "unit_price_excl_vat": "25"}], "number": "QUO-2026-0008", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:35.812Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:26:35.821Z", "vat_amount": "1.5", "accepted_at": null, "valid_until": "2020-01-01T00:00:00.000Z", "amount_excl_vat": "25", "amount_incl_vat": "26.5", "default_vat_rate": "21"}	\N	2026-10-08 23:26:35.825+00
120	1	\N	1	upload	media	31	\N	{"id": 31, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/8/QUO-2026-0008_dEkDGJB09.pdf", "entity_id": 8, "file_name": "QUO-2026-0008.pdf", "file_size": 3360, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:26:36.741Z", "deleted_at": null, "updated_at": "2026-10-08T23:26:36.741Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:26:36.749+00
121	1	\N	1	send	quote	8	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:26:36.779+00
122	1	\N	1	create	quote	9	\N	{"id": 9, "note": null, "lines": [{"id": 13, "unit": "m²", "position": 1, "quantity": "1", "quote_id": 9, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "25", "unit_price_excl_vat": "25"}], "number": "QUO-2026-0009", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:36.846Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 1, "refused_at": null, "updated_at": "2026-10-08T23:26:36.853Z", "vat_amount": "1.5", "accepted_at": null, "valid_until": null, "amount_excl_vat": "25", "amount_incl_vat": "26.5", "default_vat_rate": "21"}	\N	2026-10-08 23:26:36.86+00
123	1	\N	1	upload	media	32	\N	{"id": 32, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/9/QUO-2026-0009_HX-q8ro2o.pdf", "entity_id": 9, "file_name": "QUO-2026-0009.pdf", "file_size": 3358, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:26:37.748Z", "deleted_at": null, "updated_at": "2026-10-08T23:26:37.748Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:26:37.755+00
124	1	\N	1	send	quote	9	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:26:37.771+00
125	1	\N	1	create	project	7	\N	{"id": 7, "city": null, "name": "TEST Project Refuse", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:37.845Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:26:37.845Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:26:37.854+00
126	1	\N	1	create	quote	10	\N	{"id": 10, "note": null, "lines": [{"id": 14, "unit": "m²", "position": 1, "quantity": "5", "quote_id": 10, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "125", "unit_price_excl_vat": "25"}], "number": "QUO-2026-0010", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:37.883Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 7, "refused_at": null, "updated_at": "2026-10-08T23:26:37.891Z", "vat_amount": "7.5", "accepted_at": null, "valid_until": null, "amount_excl_vat": "125", "amount_incl_vat": "132.5", "default_vat_rate": "21"}	\N	2026-10-08 23:26:37.895+00
129	1	\N	1	refuse	quote	10	{"status": "sent"}	{"status": "refused"}	\N	2026-10-08 23:26:38.985+00
130	1	\N	1	create	invoice	1	\N	{"id": 1, "note": null, "lines": [{"id": 1, "unit": "piece", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 1, "service_id": null, "description": "TEST Invoice line", "total_excl_vat": "1000", "unit_price_excl_vat": "1000"}], "number": "INV-2026-0001", "status": "draft", "sent_at": null, "due_date": "2026-11-07T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:52.695Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:26:52.712Z", "vat_amount": "210", "reminder_count": 0, "amount_excl_vat": "1000", "amount_incl_vat": "1210", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-08 23:26:52.729+00
131	1	\N	1	create	invoice	2	\N	{"id": 2, "note": null, "lines": [], "number": "INV-2026-0002", "status": "draft", "sent_at": null, "due_date": "2026-11-07T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:26:52.775Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:26:52.782Z", "vat_amount": "0", "reminder_count": 0, "amount_excl_vat": "0", "amount_incl_vat": "0", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-08 23:26:52.79+00
132	1	\N	1	upload	media	34	\N	{"id": 34, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/1/INV-2026-0001_o0-IlgZ-Z.pdf", "entity_id": 1, "file_name": "INV-2026-0001.pdf", "file_size": 3410, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:26:54.075Z", "deleted_at": null, "updated_at": "2026-10-08T23:26:54.075Z", "entity_type": "invoice", "uploaded_by": 1}	\N	2026-10-08 23:26:54.093+00
133	1	\N	1	send	invoice	1	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:26:54.106+00
134	1	\N	1	record_payment	invoice	1	\N	{"amount": "500.00", "status": "partially_paid", "payment_id": 1}	\N	2026-10-08 23:26:54.155+00
135	1	\N	1	record_payment	invoice	1	\N	{"amount": "710.00", "status": "paid", "payment_id": 2}	\N	2026-10-08 23:26:54.202+00
136	1	\N	1	create	invoice	3	\N	{"id": 3, "note": null, "lines": [{"id": 2, "unit": "piece", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 3, "service_id": null, "description": "TEST Invoice line", "total_excl_vat": "100", "unit_price_excl_vat": "100"}], "number": "INV-2026-0003", "status": "draft", "sent_at": null, "due_date": "2026-11-07T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:27:01.842Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:27:01.855Z", "vat_amount": "21", "reminder_count": 0, "amount_excl_vat": "100", "amount_incl_vat": "121", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-08 23:27:01.859+00
137	1	\N	1	upload	media	35	\N	{"id": 35, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/3/INV-2026-0003_jRJqGO6e5.pdf", "entity_id": 3, "file_name": "INV-2026-0003.pdf", "file_size": 3408, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:27:03.019Z", "deleted_at": null, "updated_at": "2026-10-08T23:27:03.019Z", "entity_type": "invoice", "uploaded_by": 1}	\N	2026-10-08 23:27:03.038+00
138	1	\N	1	send	invoice	3	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:27:03.056+00
139	1	\N	1	cancel	invoice	3	{"status": "sent"}	{"status": "cancelled"}	\N	2026-10-08 23:27:03.085+00
140	1	\N	1	create	invoice	4	\N	{"id": 4, "note": null, "lines": [{"id": 3, "unit": "piece", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 4, "service_id": null, "description": "TEST Invoice line", "total_excl_vat": "200", "unit_price_excl_vat": "200"}], "number": "INV-2026-0004", "status": "draft", "sent_at": null, "due_date": "2026-09-28T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:27:03.135Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:27:03.143Z", "vat_amount": "42", "reminder_count": 0, "amount_excl_vat": "200", "amount_incl_vat": "242", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-08 23:27:03.148+00
141	1	\N	1	upload	media	36	\N	{"id": 36, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/4/INV-2026-0004_-DnDBJ-XE.pdf", "entity_id": 4, "file_name": "INV-2026-0004.pdf", "file_size": 3409, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:27:04.031Z", "deleted_at": null, "updated_at": "2026-10-08T23:27:04.031Z", "entity_type": "invoice", "uploaded_by": 1}	\N	2026-10-08 23:27:04.046+00
142	1	\N	1	send	invoice	4	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:27:04.058+00
143	1	\N	1	send_reminder	invoice	4	\N	{"reminder_count": 1}	\N	2026-10-08 23:27:04.152+00
144	1	\N	7	create	quote	11	\N	{"id": 11, "note": null, "lines": [{"id": 15, "unit": "piece", "position": 1, "quantity": "1", "quote_id": 11, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST role line", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0011", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:27:20.110Z", "created_by": 7, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-08T23:27:20.127Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-08 23:27:20.144+00
145	1	\N	8	create	invoice	5	\N	{"id": 5, "note": null, "lines": [{"id": 4, "unit": "piece", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 5, "service_id": null, "description": "TEST role line", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "INV-2026-0005", "status": "draft", "sent_at": null, "due_date": "2026-11-07T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:27:21.786Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:27:21.799Z", "vat_amount": "2.1", "reminder_count": 0, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-08 23:27:21.805+00
146	2	\N	9	create	project	8	\N	{"id": 8, "city": null, "name": "TEST B Project", "status": "prospect", "end_date": null, "client_id": 3, "tenant_id": 2, "created_at": "2026-10-08T23:27:30.558Z", "created_by": 9, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:27:30.558Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:27:30.567+00
147	2	\N	9	create	quote	12	\N	{"id": 12, "note": null, "lines": [{"id": 16, "unit": "piece", "position": 1, "quantity": "1", "quote_id": 12, "vat_rate": "21", "tenant_id": 2, "service_id": null, "description": "TEST B line", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0001", "status": "draft", "sent_at": null, "client_id": 3, "tenant_id": 2, "created_at": "2026-10-08T23:27:30.611Z", "created_by": 9, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 8, "refused_at": null, "updated_at": "2026-10-08T23:27:30.621Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-08 23:27:30.627+00
148	1	\N	1	create	project	9	\N	{"id": 9, "city": null, "name": "TEST Project Second", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.220Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:29:11.220Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:29:11.236+00
149	1	\N	1	create	subcontractor	1	\N	{"id": 1, "email": null, "phone": "+32 475 00 00 00", "trade": "plumbing", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.271Z", "updated_at": "2026-10-08T23:29:11.271Z", "vat_number": null, "hourly_rate": "45", "company_name": "TEST Plumbing"}	\N	2026-10-08 23:29:11.278+00
150	1	\N	1	update	subcontractor	1	{"id": 1, "email": null, "phone": "+32 475 00 00 00", "trade": "plumbing", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.271Z", "updated_at": "2026-10-08T23:29:11.271Z", "vat_number": null, "hourly_rate": "45", "company_name": "TEST Plumbing"}	{"id": 1, "email": "gryehirir+plumb@gmail.com", "phone": "+32 475 00 00 00", "trade": "heating", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.271Z", "updated_at": "2026-10-08T23:29:11.311Z", "vat_number": null, "hourly_rate": "45", "company_name": "TEST Plumbing"}	\N	2026-10-08 23:29:11.315+00
151	1	\N	1	create	subcontractor	2	\N	{"id": 2, "email": null, "phone": null, "trade": "electric", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.372Z", "updated_at": "2026-10-08T23:29:11.372Z", "vat_number": null, "hourly_rate": null, "company_name": "TEST Electric"}	\N	2026-10-08 23:29:11.376+00
152	1	\N	1	create	subcontractor	3	\N	{"id": 3, "email": null, "phone": null, "trade": "roofing", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.395Z", "updated_at": "2026-10-08T23:29:11.395Z", "vat_number": null, "hourly_rate": null, "company_name": "TEST Roofing"}	\N	2026-10-08 23:29:11.4+00
153	1	\N	1	create	subcontractor_contract	1	\N	{"id": 1, "status": "in_progress", "end_date": "2026-12-01T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:29:11.480Z", "created_by": 1, "project_id": 4, "start_date": "2026-11-01T00:00:00.000Z", "updated_at": "2026-10-08T23:29:11.480Z", "description": "TEST Main contract", "amount_excl_vat": "2500", "subcontractor_id": 1}	\N	2026-10-08 23:29:11.487+00
154	1	\N	1	create	subcontractor_contract	2	\N	{"id": 2, "status": "in_progress", "end_date": null, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.537Z", "created_by": 1, "project_id": 9, "start_date": null, "updated_at": "2026-10-08T23:29:11.537Z", "description": null, "amount_excl_vat": "800", "subcontractor_id": 1}	\N	2026-10-08 23:29:11.541+00
155	1	\N	1	status_change	subcontractor_contract	2	{"status": "in_progress"}	{"status": "completed"}	\N	2026-10-08 23:29:11.637+00
156	1	\N	1	create	supplier	1	\N	{"id": 1, "name": "TEST Brico", "email": "gryehirir+brico@gmail.com", "phone": null, "address": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.687Z", "updated_at": "2026-10-08T23:29:11.687Z", "vat_number": null}	\N	2026-10-08 23:29:11.691+00
157	1	\N	1	update	supplier	1	{"id": 1, "name": "TEST Brico", "email": "gryehirir+brico@gmail.com", "phone": null, "address": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.687Z", "updated_at": "2026-10-08T23:29:11.687Z", "vat_number": null}	{"id": 1, "name": "TEST Brico", "email": "gryehirir+brico@gmail.com", "phone": "+32 475 11 11 11", "address": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.687Z", "updated_at": "2026-10-08T23:29:11.714Z", "vat_number": null}	\N	2026-10-08 23:29:11.718+00
158	1	\N	1	create	supplier	2	\N	{"id": 2, "name": "TEST Archive", "email": null, "phone": null, "address": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.740Z", "updated_at": "2026-10-08T23:29:11.740Z", "vat_number": null}	\N	2026-10-08 23:29:11.743+00
159	1	\N	1	archive	supplier	2	{"id": 2, "name": "TEST Archive", "email": null, "phone": null, "address": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.740Z", "updated_at": "2026-10-08T23:29:11.740Z", "vat_number": null}	{"id": 2, "name": "TEST Archive", "email": null, "phone": null, "address": null, "is_active": false, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.740Z", "updated_at": "2026-10-08T23:29:11.766Z", "vat_number": null}	\N	2026-10-08 23:29:11.769+00
160	1	\N	1	create	cost_type	4	\N	{"id": 4, "name": "insurance", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:29:11.825Z"}	\N	2026-10-08 23:29:11.829+00
161	1	\N	1	create	purchase_invoice	1	\N	{"id": 1, "type": "supplier", "number": "PUR-2026-0001", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.160Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:29:34.160Z", "vat_amount": "21", "supplier_id": 1, "cost_type_id": 1, "amount_excl_vat": "100", "amount_incl_vat": "121", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:29:34.17+00
162	1	\N	1	create	purchase_invoice	2	\N	{"id": 2, "type": "supplier", "number": "PUR-2026-0002", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.205Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:29:34.205Z", "vat_amount": "21", "supplier_id": 1, "cost_type_id": 1, "amount_excl_vat": "100", "amount_incl_vat": "121", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:29:34.211+00
163	1	\N	1	create	purchase_invoice	3	\N	{"id": 3, "type": "supplier", "number": "PUR-2026-0003", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.220Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:29:34.220Z", "vat_amount": "21", "supplier_id": 1, "cost_type_id": 1, "amount_excl_vat": "100", "amount_incl_vat": "121", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:29:34.229+00
164	1	\N	1	create	purchase_invoice	4	\N	{"id": 4, "type": "supplier", "number": "PUR-2026-0004", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.230Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:29:34.230Z", "vat_amount": "21", "supplier_id": 1, "cost_type_id": 1, "amount_excl_vat": "100", "amount_incl_vat": "121", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:29:34.241+00
165	1	\N	1	create	purchase_invoice	5	\N	{"id": 5, "type": "subcontractor", "number": "PUR-2026-0005", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.339Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:29:34.339Z", "vat_amount": "525", "supplier_id": null, "cost_type_id": 2, "amount_excl_vat": "2500", "amount_incl_vat": "3025", "external_number": null, "payment_reference": null, "subcontractor_contract_id": 1}	\N	2026-10-08 23:29:34.345+00
166	1	\N	1	create	purchase_invoice	6	\N	{"id": 6, "type": "subcontractor", "number": "PUR-2026-0006", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "6", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.451Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:29:34.451Z", "vat_amount": "30", "supplier_id": null, "cost_type_id": 2, "amount_excl_vat": "500", "amount_incl_vat": "530", "external_number": null, "payment_reference": null, "subcontractor_contract_id": 1}	\N	2026-10-08 23:29:34.456+00
167	1	\N	1	create	purchase_invoice	7	\N	{"id": 7, "type": "supplier", "number": "PUR-2026-0007", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.497Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:29:34.497Z", "vat_amount": "21", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "100", "amount_incl_vat": "121", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:29:34.502+00
168	1	\N	1	update	purchase_invoice	6	{"id": 6, "type": "subcontractor", "number": "PUR-2026-0006", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "6", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.451Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:29:34.451Z", "vat_amount": "30", "supplier_id": null, "cost_type_id": 2, "amount_excl_vat": "500", "amount_incl_vat": "530", "external_number": null, "payment_reference": null, "subcontractor_contract_id": 1}	{"id": 6, "type": "subcontractor", "number": "PUR-2026-0006", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "6", "tenant_id": 1, "created_at": "2026-10-08T23:29:34.451Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-08T23:29:35.190Z", "vat_amount": "60", "supplier_id": null, "cost_type_id": 2, "amount_excl_vat": "1000", "amount_incl_vat": "1060", "external_number": null, "payment_reference": null, "subcontractor_contract_id": 1}	\N	2026-10-08 23:29:35.194+00
169	1	\N	1	mark_paid	purchase_invoice	6	{"status": "to_pay"}	{"status": "paid", "paid_at": "2026-10-08T23:29:35.221Z", "payment_reference": "TRF-1"}	\N	2026-10-08 23:29:35.225+00
170	1	\N	1	create	purchase_invoice	12	\N	{"id": 12, "type": "supplier", "number": "PUR-2026-0008", "status": "to_pay", "paid_at": null, "due_date": "2026-10-13T00:00:00.000Z", "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:35.276Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:29:35.276Z", "vat_amount": "21", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "100", "amount_incl_vat": "121", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:29:35.282+00
171	1	\N	1	upload	media	37	\N	{"id": 37, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/purchase_invoice/1/bill_RnWG98ED-.pdf", "entity_id": 1, "file_name": "bill.pdf", "file_size": 69, "file_type": "application/pdf", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:29:36.342Z", "deleted_at": null, "updated_at": "2026-10-08T23:29:36.342Z", "entity_type": "purchase_invoice", "uploaded_by": 1}	\N	2026-10-08 23:29:36.36+00
172	1	\N	1	purchase	stock_movement	6	\N	{"id": 6, "note": null, "type": "purchase", "quantity": "10", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:29:36.379Z", "created_by": 1, "project_id": null, "unit_price": "4", "material_id": 3, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": 1}	\N	2026-10-08 23:29:36.383+00
173	1	\N	8	create	purchase_invoice	13	\N	{"id": 13, "type": "supplier", "number": "PUR-2026-0009", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:29:49.355Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:29:49.355Z", "vat_amount": "10.5", "supplier_id": 1, "cost_type_id": 1, "amount_excl_vat": "50", "amount_incl_vat": "60.5", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:29:49.361+00
174	1	\N	1	create	project	10	\N	{"id": 10, "city": null, "name": "TEST Project Side", "status": "prospect", "end_date": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:34:31.626Z", "created_by": 1, "manager_id": null, "start_date": null, "updated_at": "2026-10-08T23:34:31.626Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:34:31.639+00
175	1	\N	1	create	quote	13	\N	{"id": 13, "note": null, "lines": [{"id": 17, "unit": "piece", "position": 1, "quantity": "1", "quote_id": 13, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST side line", "total_excl_vat": "100", "unit_price_excl_vat": "100"}], "number": "QUO-2026-0012", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:34:31.669Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 10, "refused_at": null, "updated_at": "2026-10-08T23:34:31.680Z", "vat_amount": "21", "accepted_at": null, "valid_until": null, "amount_excl_vat": "100", "amount_incl_vat": "121", "default_vat_rate": "21"}	\N	2026-10-08 23:34:31.685+00
176	1	\N	1	upload	media	38	\N	{"id": 38, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/13/QUO-2026-0012_ICMdwFJni.pdf", "entity_id": 13, "file_name": "QUO-2026-0012.pdf", "file_size": 3362, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:34:33.073Z", "deleted_at": null, "updated_at": "2026-10-08T23:34:33.073Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:34:33.078+00
177	1	\N	1	send	quote	13	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:34:33.093+00
178	1	\N	1	create_reservations	project	10	\N	{"materials": []}	\N	2026-10-08 23:34:33.136+00
179	1	\N	1	accept	quote	13	{"status": "sent"}	{"status": "accepted", "project_id": 10}	\N	2026-10-08 23:34:33.153+00
180	1	\N	1	create	task	1	\N	{"id": 1, "type": "work", "title": "TEST Painting walls", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:34:33.212Z", "created_by": 1, "project_id": 4, "start_date": "2026-10-06T00:00:00.000Z", "updated_at": "2026-10-08T23:34:33.212Z", "assignee_ids": [3, 4, 5, 6, 2]}	\N	2026-10-08 23:34:33.227+00
181	1	\N	1	create	task	2	\N	{"id": 2, "type": "work", "title": "TEST No assignee", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:34:33.438Z", "created_by": 1, "project_id": 4, "start_date": "2026-10-06T00:00:00.000Z", "updated_at": "2026-10-08T23:34:33.438Z", "assignee_ids": []}	\N	2026-10-08 23:34:33.445+00
184	1	\N	1	create	task	4	\N	{"id": 4, "type": "work", "title": "TEST Others only", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:35:04.098Z", "created_by": 1, "project_id": 4, "start_date": "2026-10-06T00:00:00.000Z", "updated_at": "2026-10-08T23:35:04.098Z", "assignee_ids": [3, 4]}	\N	2026-10-08 23:35:04.123+00
185	1	\N	1	create	task	5	\N	{"id": 5, "type": "work", "title": "TEST Side work", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:35:04.268Z", "created_by": 1, "project_id": 10, "start_date": "2026-10-06T00:00:00.000Z", "updated_at": "2026-10-08T23:35:04.268Z", "assignee_ids": [6]}	\N	2026-10-08 23:35:04.283+00
186	1	\N	5	create	time_entry	1	\N	{"id": 1, "hours": "8", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-08T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.339Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:04.339Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:04.347+00
187	1	\N	1	update	user	5	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:34:59.260Z", "hourly_rate": "20", "email_verified_at": "2026-10-08T22:12:24.814Z"}	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:35:04.396Z", "hourly_rate": "35", "email_verified_at": "2026-10-08T22:12:24.814Z"}	\N	2026-10-08 23:35:04.4+00
188	1	\N	1	update	user	5	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:35:04.396Z", "hourly_rate": "35", "email_verified_at": "2026-10-08T22:12:24.814Z"}	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:35:04.627Z", "hourly_rate": "20", "email_verified_at": "2026-10-08T22:12:24.814Z"}	\N	2026-10-08 23:35:04.633+00
189	1	\N	6	create	time_entry	2	\N	{"id": 2, "hours": "8", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-07T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.681Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-08T23:35:04.681Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:04.685+00
190	1	\N	6	create	time_entry	3	\N	{"id": 3, "hours": "3", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-07T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.726Z", "created_by": 6, "project_id": 10, "updated_at": "2026-10-08T23:35:04.726Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:04.73+00
191	1	\N	6	create	time_entry	4	\N	{"id": 4, "hours": "7", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-06T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.761Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-08T23:35:04.761Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:04.765+00
192	1	\N	6	create	time_entry	5	\N	{"id": 5, "hours": "6", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-06T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.813Z", "created_by": 6, "project_id": 10, "updated_at": "2026-10-08T23:35:04.813Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:04.818+00
193	1	\N	6	create	time_entry	6	\N	{"id": 6, "hours": "20", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-05T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.977Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-08T23:35:04.977Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:04.983+00
194	1	\N	6	create	time_entry	8	\N	{"id": 8, "hours": "10", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-09T00:00:00.000Z", "created_at": "2026-10-08T23:35:05.390Z", "created_by": 6, "project_id": 10, "updated_at": "2026-10-08T23:35:05.390Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:05.396+00
195	1	\N	6	create	time_entry	9	\N	{"id": 9, "hours": "4", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-09T00:00:00.000Z", "created_at": "2026-10-08T23:35:05.434Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-08T23:35:05.434Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:05.438+00
196	1	\N	6	update	time_entry	9	{"id": 9, "hours": "4", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-09T00:00:00.000Z", "created_at": "2026-10-08T23:35:05.434Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-08T23:35:05.434Z", "hourly_rate": "25"}	{"id": 9, "hours": "14", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-09T00:00:00.000Z", "created_at": "2026-10-08T23:35:05.434Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-08T23:35:05.530Z", "hourly_rate": "25"}	\N	2026-10-08 23:35:05.534+00
197	1	\N	5	update	time_entry	1	{"id": 1, "hours": "8", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-08T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.339Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:04.339Z", "hourly_rate": "20"}	{"id": 1, "hours": "6", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-08T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.339Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:28.893Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:28.898+00
198	1	\N	5	update	time_entry	1	{"id": 1, "hours": "6", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-08T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.339Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:28.893Z", "hourly_rate": "20"}	{"id": 1, "hours": "7", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-08T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.339Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:29.112Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:29.116+00
199	1	\N	5	create	time_entry	10	\N	{"id": 10, "hours": "2", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-07T00:00:00.000Z", "created_at": "2026-10-08T23:35:29.362Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:29.362Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:29.366+00
200	1	\N	2	update	time_entry	10	{"id": 10, "hours": "2", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-07T00:00:00.000Z", "created_at": "2026-10-08T23:35:29.362Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:29.362Z", "hourly_rate": "20"}	{"id": 10, "hours": "3", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-07T00:00:00.000Z", "created_at": "2026-10-08T23:35:29.362Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:29.402Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:29.408+00
201	1	\N	2	delete	time_entry	10	{"id": 10, "hours": "3", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-07T00:00:00.000Z", "created_at": "2026-10-08T23:35:29.362Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:29.402Z", "hourly_rate": "20"}	\N	\N	2026-10-08 23:35:29.51+00
202	1	\N	5	create	time_entry	11	\N	{"id": 11, "hours": "2", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-06T00:00:00.000Z", "created_at": "2026-10-08T23:35:29.766Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:29.766Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:29.782+00
203	1	\N	2	create	time_entry	12	\N	{"id": 12, "hours": "3", "comment": null, "task_id": null, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-10T00:00:00.000Z", "created_at": "2026-10-08T23:35:30.056Z", "created_by": 2, "project_id": 10, "updated_at": "2026-10-08T23:35:30.056Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:30.062+00
204	1	\N	1	create	task	6	\N	{"id": 6, "type": "work", "title": "TEST Delete me", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:35:30.371Z", "created_by": 1, "project_id": 4, "start_date": "2026-10-06T00:00:00.000Z", "updated_at": "2026-10-08T23:35:30.371Z", "assignee_ids": [5]}	\N	2026-10-08 23:35:30.39+00
205	1	\N	5	create	time_entry	13	\N	{"id": 13, "hours": "2", "comment": null, "task_id": 6, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-03T00:00:00.000Z", "created_at": "2026-10-08T23:35:30.451Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-08T23:35:30.451Z", "hourly_rate": "20"}	\N	2026-10-08 23:35:30.458+00
206	1	\N	1	delete	task	6	{"id": 6, "type": "work", "title": "TEST Delete me", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:35:30.371Z", "created_by": 1, "project_id": 4, "start_date": "2026-10-06T00:00:00.000Z", "updated_at": "2026-10-08T23:35:30.371Z", "assignee_ids": [5]}	\N	\N	2026-10-08 23:35:30.508+00
207	1	\N	3	create	report	1	\N	{"id": 1, "note": "Walls prepared", "weather": "Sunny", "tenant_id": 1, "created_at": "2026-10-08T23:39:57.493Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:57.493Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 30}	\N	2026-10-08 23:39:57.5+00
208	1	\N	3	update	report	1	{"id": 1, "note": "Walls prepared", "weather": "Sunny", "tenant_id": 1, "created_at": "2026-10-08T23:39:57.493Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:57.493Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 30}	{"id": 1, "note": "Walls prepared", "weather": "Sunny", "tenant_id": 1, "created_at": "2026-10-08T23:39:57.493Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:57.548Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 45}	\N	2026-10-08 23:39:57.553+00
209	1	\N	4	update	report	1	{"id": 1, "note": "Walls prepared", "weather": "Sunny", "tenant_id": 1, "created_at": "2026-10-08T23:39:57.493Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:57.548Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 45}	{"id": 1, "note": "Walls prepared", "weather": "Sunny", "tenant_id": 1, "created_at": "2026-10-08T23:39:57.493Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:57.924Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 46}	\N	2026-10-08 23:39:57.929+00
210	1	\N	3	update	report	1	{"id": 1, "note": "Walls prepared", "weather": "Sunny", "tenant_id": 1, "created_at": "2026-10-08T23:39:57.493Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:57.924Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 46}	{"id": 1, "note": "Second coat", "weather": "Sunny", "tenant_id": 1, "created_at": "2026-10-08T23:39:57.493Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:58.077Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 50}	\N	2026-10-08 23:39:58.082+00
211	1	\N	3	create	report	3	\N	{"id": 3, "note": null, "weather": null, "tenant_id": 1, "created_at": "2026-10-08T23:39:58.308Z", "created_by": 3, "project_id": 4, "updated_at": "2026-10-08T23:39:58.308Z", "report_date": "2026-10-06T00:00:00.000Z", "progress_pct": 90}	\N	2026-10-08 23:39:58.325+00
212	1	\N	3	declare_materials	report	1	\N	{"items": [{"quantity": "-3.5", "unit_price": "6", "material_id": 1, "movement_id": 7}, {"quantity": "-3", "unit_price": "2", "material_id": 2, "movement_id": 8}], "service_id": 1}	\N	2026-10-08 23:40:19.952+00
213	1	\N	3	declare_materials	report	1	\N	{"items": [{"quantity": "-0.1", "unit_price": "6", "material_id": 1, "movement_id": 10}], "service_id": null}	\N	2026-10-08 23:40:21.39+00
214	1	\N	3	declare_materials	report	1	\N	{"items": [{"quantity": "-50", "unit_price": "4", "material_id": 3, "movement_id": 11}], "service_id": null}	\N	2026-10-08 23:40:21.617+00
215	1	\N	1	adjustment	stock_movement	12	\N	{"id": 12, "note": "TEST over-declared", "type": "adjustment", "quantity": "45", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:40:22.479Z", "created_by": 1, "project_id": null, "unit_price": "4", "material_id": 3, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-08 23:40:22.498+00
216	1	\N	3	upload	media	39	\N	{"id": 39, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/photo_w7l-bBpfm.jpg", "entity_id": 1, "file_name": "photo.jpg", "file_size": 22, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:40:35.120Z", "deleted_at": null, "updated_at": "2026-10-08T23:40:35.120Z", "entity_type": "report", "uploaded_by": 3}	\N	2026-10-08 23:40:35.143+00
272	1	\N	1	create_reservations	project	13	\N	{"materials": [1, 2, 3]}	\N	2026-10-08 23:52:58.695+00
398	1	1	\N	set_pending_plan	subscription	1	\N	{"plan_id": 3}	::1	2026-10-09 13:35:36.376+00
218	1	\N	3	create	report	5	\N	{"id": 5, "note": null, "weather": null, "tenant_id": 1, "created_at": "2026-10-08T23:41:03.850Z", "created_by": 3, "project_id": 10, "updated_at": "2026-10-08T23:41:03.850Z", "report_date": "2026-10-07T00:00:00.000Z", "progress_pct": 40}	\N	2026-10-08 23:41:03.855+00
219	1	\N	1	create	material	5	\N	{"id": 5, "unit": "pcs", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:50:33.639Z", "updated_at": "2026-10-08T23:50:33.639Z", "description": "TEST Brick", "minimum_stock": "0", "purchase_price": "10"}	\N	2026-10-08 23:50:33.652+00
220	1	\N	1	purchase	stock_movement	13	\N	{"id": 13, "note": "TEST Brick initial stock", "type": "purchase", "quantity": "100", "report_id": null, "tenant_id": 1, "created_at": "2026-10-08T23:50:33.695Z", "created_by": 1, "project_id": null, "unit_price": "10", "material_id": 5, "movement_date": "2026-10-08T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-08 23:50:33.704+00
221	1	\N	1	create	project	11	\N	{"id": 11, "city": "Brussels", "name": "TEST Project Margin", "status": "prospect", "end_date": "2026-12-07T00:00:00.000Z", "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:50:46.307Z", "created_by": 1, "manager_id": null, "start_date": "2026-10-07T00:00:00.000Z", "updated_at": "2026-10-08T23:50:46.307Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:50:46.318+00
222	1	\N	1	create	project	12	\N	{"id": 12, "city": "Brussels", "name": "TEST Project Alerts", "status": "prospect", "end_date": "2026-12-07T00:00:00.000Z", "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:50:46.350Z", "created_by": 1, "manager_id": null, "start_date": "2026-10-07T00:00:00.000Z", "updated_at": "2026-10-08T23:50:46.350Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:50:46.358+00
223	1	\N	1	create	project	13	\N	{"id": 13, "city": "Brussels", "name": "TEST Project Stop", "status": "prospect", "end_date": "2026-12-07T00:00:00.000Z", "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:50:46.378Z", "created_by": 1, "manager_id": null, "start_date": "2026-10-07T00:00:00.000Z", "updated_at": "2026-10-08T23:50:46.378Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-08 23:50:46.384+00
224	1	\N	1	create	task	7	\N	{"id": 7, "type": "work", "title": "TEST Margin work", "status": "planned", "end_date": "2026-10-18T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-08T23:50:46.414Z", "created_by": 1, "project_id": 11, "start_date": "2026-10-07T00:00:00.000Z", "updated_at": "2026-10-08T23:50:46.414Z", "assignee_ids": [5]}	\N	2026-10-08 23:50:46.447+00
225	1	\N	1	create	subcontractor_contract	3	\N	{"id": 3, "status": "in_progress", "end_date": null, "tenant_id": 1, "created_at": "2026-10-08T23:50:46.515Z", "created_by": 1, "project_id": 11, "start_date": null, "updated_at": "2026-10-08T23:50:46.515Z", "description": "TEST Plumbing contract", "amount_excl_vat": "2500", "subcontractor_id": 1}	\N	2026-10-08 23:50:46.522+00
226	1	\N	1	create	quote	14	\N	{"id": 14, "note": null, "lines": [{"id": 18, "unit": null, "position": 1, "quantity": "1", "quote_id": 14, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST margin quote 1", "total_excl_vat": "10000", "unit_price_excl_vat": "10000"}], "number": "QUO-2026-0013", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:51:03.251Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 11, "refused_at": null, "updated_at": "2026-10-08T23:51:03.269Z", "vat_amount": "2100", "accepted_at": null, "valid_until": "2026-11-07T00:00:00.000Z", "amount_excl_vat": "10000", "amount_incl_vat": "12100", "default_vat_rate": "21"}	\N	2026-10-08 23:51:03.277+00
227	1	\N	1	upload	media	40	\N	{"id": 40, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/14/QUO-2026-0013_ldscv75zX.pdf", "entity_id": 14, "file_name": "QUO-2026-0013.pdf", "file_size": 3378, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:51:05.671Z", "deleted_at": null, "updated_at": "2026-10-08T23:51:05.671Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:51:05.694+00
228	1	\N	1	send	quote	14	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:51:05.714+00
229	1	\N	1	create_reservations	project	11	\N	{"materials": []}	\N	2026-10-08 23:51:05.755+00
230	1	\N	1	accept	quote	14	{"status": "sent"}	{"status": "accepted", "project_id": 11}	\N	2026-10-08 23:51:05.775+00
231	1	\N	1	create	quote	15	\N	{"id": 15, "note": null, "lines": [{"id": 19, "unit": null, "position": 1, "quantity": "1", "quote_id": 15, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST margin quote 2", "total_excl_vat": "1500", "unit_price_excl_vat": "1500"}], "number": "QUO-2026-0014", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:51:05.844Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 11, "refused_at": null, "updated_at": "2026-10-08T23:51:05.852Z", "vat_amount": "315", "accepted_at": null, "valid_until": "2026-11-07T00:00:00.000Z", "amount_excl_vat": "1500", "amount_incl_vat": "1815", "default_vat_rate": "21"}	\N	2026-10-08 23:51:05.859+00
232	1	\N	1	upload	media	41	\N	{"id": 41, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/15/QUO-2026-0014_mlt_BRw2m.pdf", "entity_id": 15, "file_name": "QUO-2026-0014.pdf", "file_size": 3382, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:51:07.119Z", "deleted_at": null, "updated_at": "2026-10-08T23:51:07.119Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:51:07.124+00
233	1	\N	1	send	quote	15	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:51:07.138+00
234	1	\N	1	create_reservations	project	11	\N	{"materials": []}	\N	2026-10-08 23:51:07.172+00
235	1	\N	1	accept	quote	15	{"status": "sent"}	{"status": "accepted", "project_id": 11}	\N	2026-10-08 23:51:07.182+00
236	1	\N	3	create	report	6	\N	{"id": 6, "note": "TEST margin report", "weather": null, "tenant_id": 1, "created_at": "2026-10-08T23:51:17.727Z", "created_by": 3, "project_id": 11, "updated_at": "2026-10-08T23:51:17.727Z", "report_date": "2026-10-08T00:00:00.000Z", "progress_pct": 20}	\N	2026-10-08 23:51:17.733+00
237	1	\N	3	declare_materials	report	6	\N	{"items": [{"quantity": "-40", "unit_price": "10", "material_id": 5, "movement_id": 14}], "service_id": null}	\N	2026-10-08 23:51:17.795+00
273	1	\N	1	accept	quote	18	{"status": "sent"}	{"status": "accepted", "project_id": 13}	\N	2026-10-08 23:52:58.705+00
419	\N	1	\N	update	admin_user	2	\N	{"can_manage_tenants": true}	::1	2026-10-09 19:08:03.07+00
238	1	\N	1	update	material	5	{"id": 5, "unit": "pcs", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:50:33.639Z", "updated_at": "2026-10-08T23:50:33.639Z", "description": "TEST Brick", "minimum_stock": "0", "purchase_price": "10"}	{"id": 5, "unit": "pcs", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:50:33.639Z", "updated_at": "2026-10-08T23:51:17.864Z", "description": "TEST Brick", "minimum_stock": "0", "purchase_price": "99"}	\N	2026-10-08 23:51:17.868+00
239	1	\N	2	create	time_entry	14	\N	{"id": 14, "hours": "10", "comment": null, "task_id": 7, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-07T00:00:00.000Z", "created_at": "2026-10-08T23:51:17.934Z", "created_by": 2, "project_id": 11, "updated_at": "2026-10-08T23:51:17.934Z", "hourly_rate": "20"}	\N	2026-10-08 23:51:17.94+00
240	1	\N	2	create	time_entry	15	\N	{"id": 15, "hours": "10", "comment": null, "task_id": 7, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-06T00:00:00.000Z", "created_at": "2026-10-08T23:51:17.982Z", "created_by": 2, "project_id": 11, "updated_at": "2026-10-08T23:51:17.982Z", "hourly_rate": "20"}	\N	2026-10-08 23:51:17.987+00
241	1	\N	1	update	user	5	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:39:52.707Z", "hourly_rate": "20", "email_verified_at": "2026-10-08T22:12:24.814Z"}	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:51:18.034Z", "hourly_rate": "45", "email_verified_at": "2026-10-08T22:12:24.814Z"}	\N	2026-10-08 23:51:18.042+00
242	1	\N	1	update	user	5	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:51:18.034Z", "hourly_rate": "45", "email_verified_at": "2026-10-08T22:12:24.814Z"}	{"id": 5, "name": "TEST Worker", "email": "winucardit@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:24.972Z", "updated_at": "2026-10-08T23:51:18.094Z", "hourly_rate": "20", "email_verified_at": "2026-10-08T22:12:24.814Z"}	\N	2026-10-08 23:51:18.099+00
243	1	\N	8	create	purchase_invoice	14	\N	{"id": 14, "type": "subcontractor", "number": "PUR-2026-0010", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:51:30.674Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 11, "updated_at": "2026-10-08T23:51:30.674Z", "vat_amount": "525", "supplier_id": null, "cost_type_id": 2, "amount_excl_vat": "2500", "amount_incl_vat": "3025", "external_number": null, "payment_reference": null, "subcontractor_contract_id": 3}	\N	2026-10-08 23:51:30.682+00
244	1	\N	8	mark_paid	purchase_invoice	14	{"status": "to_pay"}	{"status": "paid", "paid_at": "2026-10-08T23:51:30.728Z", "payment_reference": null}	\N	2026-10-08 23:51:30.733+00
245	1	\N	8	create	purchase_invoice	15	\N	{"id": 15, "type": "supplier", "number": "PUR-2026-0011", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:51:30.783Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:51:30.783Z", "vat_amount": "63", "supplier_id": 1, "cost_type_id": 1, "amount_excl_vat": "300", "amount_incl_vat": "363", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:51:30.792+00
246	1	\N	8	create	purchase_invoice	16	\N	{"id": 16, "type": "supplier", "number": "PUR-2026-0012", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:51:30.816Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-08T23:51:30.816Z", "vat_amount": "63", "supplier_id": 1, "cost_type_id": 1, "amount_excl_vat": "300", "amount_incl_vat": "363", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:51:30.823+00
247	1	\N	8	create	purchase_invoice	17	\N	{"id": 17, "type": "supplier", "number": "PUR-2026-0013", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:51:37.411Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 11, "updated_at": "2026-10-08T23:51:37.411Z", "vat_amount": "42", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "200", "amount_incl_vat": "242", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:51:37.428+00
248	1	\N	1	create	quote	16	\N	{"id": 16, "note": null, "lines": [{"id": 20, "unit": null, "position": 1, "quantity": "1", "quote_id": 16, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST alerts quote", "total_excl_vat": "10000", "unit_price_excl_vat": "10000"}], "number": "QUO-2026-0015", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:51:47.363Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "refused_at": null, "updated_at": "2026-10-08T23:51:47.389Z", "vat_amount": "2100", "accepted_at": null, "valid_until": "2026-11-07T00:00:00.000Z", "amount_excl_vat": "10000", "amount_incl_vat": "12100", "default_vat_rate": "21"}	\N	2026-10-08 23:51:47.398+00
249	1	\N	1	upload	media	42	\N	{"id": 42, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/16/QUO-2026-0015_y22i1jv9S.pdf", "entity_id": 16, "file_name": "QUO-2026-0015.pdf", "file_size": 3373, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:51:50.843Z", "deleted_at": null, "updated_at": "2026-10-08T23:51:50.843Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:51:50.849+00
250	1	\N	1	send	quote	16	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:51:50.865+00
251	1	\N	1	create_reservations	project	12	\N	{"materials": []}	\N	2026-10-08 23:51:50.91+00
252	1	\N	1	accept	quote	16	{"status": "sent"}	{"status": "accepted", "project_id": 12}	\N	2026-10-08 23:51:50.931+00
253	1	\N	8	create	purchase_invoice	18	\N	{"id": 18, "type": "supplier", "number": "PUR-2026-0014", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:51:53.921Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "updated_at": "2026-10-08T23:51:53.921Z", "vat_amount": "1659", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "7900", "amount_incl_vat": "9559", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:51:53.942+00
254	1	\N	8	create	purchase_invoice	19	\N	{"id": 19, "type": "supplier", "number": "PUR-2026-0015", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:51:56.918Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "updated_at": "2026-10-08T23:51:56.918Z", "vat_amount": "21", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "100", "amount_incl_vat": "121", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:51:56.925+00
255	1	\N	8	create	purchase_invoice	20	\N	{"id": 20, "type": "supplier", "number": "PUR-2026-0016", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:51:59.920Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "updated_at": "2026-10-08T23:51:59.920Z", "vat_amount": "63", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "300", "amount_incl_vat": "363", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:51:59.929+00
256	1	\N	8	create	purchase_invoice	21	\N	{"id": 21, "type": "supplier", "number": "PUR-2026-0017", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:52:02.992Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "updated_at": "2026-10-08T23:52:02.992Z", "vat_amount": "252", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "1200", "amount_incl_vat": "1452", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:52:03.004+00
257	1	\N	8	create	purchase_invoice	22	\N	{"id": 22, "type": "supplier", "number": "PUR-2026-0018", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:52:05.891Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "updated_at": "2026-10-08T23:52:05.891Z", "vat_amount": "2.1", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:52:05.897+00
258	1	\N	1	create	quote	17	\N	{"id": 17, "note": null, "lines": [{"id": 21, "unit": null, "position": 1, "quantity": "1", "quote_id": 17, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST alerts quote 2", "total_excl_vat": "5000", "unit_price_excl_vat": "5000"}], "number": "QUO-2026-0016", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:52:08.754Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "refused_at": null, "updated_at": "2026-10-08T23:52:08.762Z", "vat_amount": "1050", "accepted_at": null, "valid_until": "2026-11-07T00:00:00.000Z", "amount_excl_vat": "5000", "amount_incl_vat": "6050", "default_vat_rate": "21"}	\N	2026-10-08 23:52:08.77+00
259	1	\N	1	upload	media	43	\N	{"id": 43, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/17/QUO-2026-0016__KWtO83Uq.pdf", "entity_id": 17, "file_name": "QUO-2026-0016.pdf", "file_size": 3382, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:52:09.938Z", "deleted_at": null, "updated_at": "2026-10-08T23:52:09.938Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:52:09.955+00
260	1	\N	1	send	quote	17	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:52:09.973+00
262	1	\N	1	accept	quote	17	{"status": "sent"}	{"status": "accepted", "project_id": 12}	\N	2026-10-08 23:52:10.013+00
263	1	\N	8	create	purchase_invoice	23	\N	{"id": 23, "type": "supplier", "number": "PUR-2026-0019", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:52:12.879Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 12, "updated_at": "2026-10-08T23:52:12.879Z", "vat_amount": "525", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "2500", "amount_incl_vat": "3025", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:52:12.886+00
264	1	\N	2	change_status	project	11	{"status": "in_progress"}	{"status": "completed", "snapshot_id": 4}	\N	2026-10-08 23:52:37.816+00
265	1	\N	1	update	material	5	{"id": 5, "unit": "pcs", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:50:33.639Z", "updated_at": "2026-10-08T23:51:17.864Z", "description": "TEST Brick", "minimum_stock": "0", "purchase_price": "99"}	{"id": 5, "unit": "pcs", "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T23:50:33.639Z", "updated_at": "2026-10-08T23:52:38.427Z", "description": "TEST Brick", "minimum_stock": "0", "purchase_price": "50"}	\N	2026-10-08 23:52:38.432+00
266	1	\N	8	create	purchase_invoice	24	\N	{"id": 24, "type": "supplier", "number": "PUR-2026-0020", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:52:38.470Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 11, "updated_at": "2026-10-08T23:52:38.470Z", "vat_amount": "147", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "700", "amount_incl_vat": "847", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:52:38.481+00
267	1	\N	1	change_status	project	11	{"status": "completed"}	{"status": "in_progress", "snapshot_id": 4}	\N	2026-10-08 23:52:38.769+00
268	1	\N	1	change_status	project	11	{"status": "in_progress"}	{"status": "completed", "snapshot_id": 5}	\N	2026-10-08 23:52:39.003+00
269	1	\N	1	create	quote	18	\N	{"id": 18, "note": null, "lines": [{"id": 22, "unit": null, "position": 1, "quantity": "100", "quote_id": 18, "vat_rate": "21", "tenant_id": 1, "service_id": 1, "description": "TEST Stop painting", "total_excl_vat": "4000", "unit_price_excl_vat": "40"}], "number": "QUO-2026-0017", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-08T23:52:53.870Z", "created_by": 1, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 13, "refused_at": null, "updated_at": "2026-10-08T23:52:53.891Z", "vat_amount": "840", "accepted_at": null, "valid_until": "2026-11-07T00:00:00.000Z", "amount_excl_vat": "4000", "amount_incl_vat": "4840", "default_vat_rate": "21"}	\N	2026-10-08 23:52:53.9+00
270	1	\N	1	upload	media	44	\N	{"id": 44, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/18/QUO-2026-0017_VMiGoPWLb.pdf", "entity_id": 18, "file_name": "QUO-2026-0017.pdf", "file_size": 3370, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-08T23:52:58.580Z", "deleted_at": null, "updated_at": "2026-10-08T23:52:58.580Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-08 23:52:58.585+00
271	1	\N	1	send	quote	18	{"status": "draft"}	{"status": "sent"}	\N	2026-10-08 23:52:58.602+00
274	1	\N	8	create	purchase_invoice	25	\N	{"id": 25, "type": "supplier", "number": "PUR-2026-0021", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:52:58.940Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 13, "updated_at": "2026-10-08T23:52:58.940Z", "vat_amount": "630", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "3000", "amount_incl_vat": "3630", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:52:58.949+00
275	1	\N	1	release_reservations	project	13	\N	{"released": 3}	\N	2026-10-08 23:52:59.085+00
276	1	\N	1	cancel	project	13	{"status": "in_progress"}	{"status": "cancelled", "snapshot_id": 6}	\N	2026-10-08 23:52:59.143+00
277	1	\N	8	create	purchase_invoice	26	\N	{"id": 26, "type": "supplier", "number": "PUR-2026-0022", "status": "to_pay", "paid_at": null, "due_date": null, "vat_rate": "21", "tenant_id": 1, "created_at": "2026-10-08T23:52:59.428Z", "created_by": 8, "issue_date": "2026-10-08T00:00:00.000Z", "project_id": 13, "updated_at": "2026-10-08T23:52:59.428Z", "vat_amount": "105", "supplier_id": 1, "cost_type_id": 4, "amount_excl_vat": "500", "amount_incl_vat": "605", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-08 23:52:59.437+00
278	1	\N	1	create	conversation	1	\N	{"id": 1, "type": "internal", "members": [{"user_id": 1, "client_id": null, "joined_at": "2026-10-08T23:56:07.158Z", "admin_user_id": null}, {"user_id": 2, "client_id": null, "joined_at": "2026-10-08T23:56:07.158Z", "admin_user_id": null}, {"user_id": 3, "client_id": null, "joined_at": "2026-10-08T23:56:07.158Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-08T23:56:07.153Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-08 23:56:07.171+00
279	1	\N	1	add_member	conversation	1	\N	{"user_id": 4}	\N	2026-10-08 23:56:07.797+00
280	1	\N	2	create	conversation	4	\N	{"id": 4, "type": "internal", "members": [{"user_id": 2, "client_id": null, "joined_at": "2026-10-08T23:56:21.382Z", "admin_user_id": null}, {"user_id": 3, "client_id": null, "joined_at": "2026-10-08T23:56:21.382Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-08T23:56:21.375Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-08 23:56:21.398+00
281	1	\N	1	upload	media	45	\N	{"id": 45, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-a_8ED7maD_O.png", "entity_id": 0, "file_name": "TEST-chat-a.png", "file_size": 81, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:56:58.979Z", "deleted_at": null, "updated_at": "2026-10-08T23:56:58.979Z", "entity_type": "message", "uploaded_by": 1}	\N	2026-10-08 23:56:58.992+00
282	1	\N	1	upload	media	46	\N	{"id": 46, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-b_BIu-o7kxg.png", "entity_id": 0, "file_name": "TEST-chat-b.png", "file_size": 81, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:56:59.668Z", "deleted_at": null, "updated_at": "2026-10-08T23:56:59.668Z", "entity_type": "message", "uploaded_by": 1}	\N	2026-10-08 23:56:59.685+00
283	1	\N	2	upload	media	47	\N	{"id": 47, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-mgr_x1Za9jhbo.png", "entity_id": 0, "file_name": "TEST-chat-mgr.png", "file_size": 83, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:57:02.296Z", "deleted_at": null, "updated_at": "2026-10-08T23:57:02.296Z", "entity_type": "message", "uploaded_by": 2}	\N	2026-10-08 23:57:02.313+00
284	1	\N	1	upload	media	48	\N	{"id": 48, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-c_8LLrLQpcX.png", "entity_id": 0, "file_name": "TEST-chat-c.png", "file_size": 81, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:57:03.069Z", "deleted_at": null, "updated_at": "2026-10-08T23:57:03.069Z", "entity_type": "message", "uploaded_by": 1}	\N	2026-10-08 23:57:03.075+00
285	1	\N	1	upload	media	49	\N	{"id": 49, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-t_b1Q0PWide.png", "entity_id": 0, "file_name": "TEST-chat-t.png", "file_size": 81, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T23:57:03.747Z", "deleted_at": null, "updated_at": "2026-10-08T23:57:03.747Z", "entity_type": "message", "uploaded_by": 1}	\N	2026-10-08 23:57:03.765+00
286	1	\N	1	soft_delete_many	media	\N	\N	{"ids": [49], "skipped": []}	\N	2026-10-08 23:57:03.794+00
287	1	\N	1	create	conversation	5	\N	{"id": 5, "type": "internal", "members": [{"user_id": 1, "client_id": null, "joined_at": "2026-10-08T23:57:21.813Z", "admin_user_id": null}, {"user_id": 2, "client_id": null, "joined_at": "2026-10-08T23:57:21.813Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-08T23:57:21.809Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-08 23:57:21.824+00
288	1	\N	1	archive	conversation	5	{"is_archived": false}	{"is_archived": true}	\N	2026-10-08 23:57:35.081+00
289	1	\N	1	create	project	14	\N	{"id": 14, "city": "Brussels", "name": "TEST Project Portal", "status": "prospect", "end_date": "2026-12-01T00:00:00.000Z", "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:02.974Z", "created_by": 1, "manager_id": null, "start_date": "2026-10-01T00:00:00.000Z", "updated_at": "2026-10-09T00:01:02.974Z", "description": "INTERNAL project description", "postal_code": "1000", "address_line1": "1 Test Street", "address_line2": null, "actual_end_date": null}	\N	2026-10-09 00:01:02.986+00
290	1	\N	1	create	quote	19	\N	{"id": 19, "note": "INTERNAL quote note", "lines": [{"id": 23, "unit": "m2", "position": 1, "quantity": "40", "quote_id": 19, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "1000", "unit_price_excl_vat": "25"}], "number": "QUO-2026-0018", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:03.024Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "refused_at": null, "updated_at": "2026-10-09T00:01:03.039Z", "vat_amount": "60", "accepted_at": null, "valid_until": "2026-12-31T00:00:00.000Z", "amount_excl_vat": "1000", "amount_incl_vat": "1060", "default_vat_rate": "21"}	\N	2026-10-09 00:01:03.044+00
366	1	\N	1	create	conversation	8	\N	{"id": 8, "type": "project_client", "members": [{"user_id": null, "client_id": 1, "joined_at": "2026-10-09T13:04:47.152Z", "admin_user_id": null}, {"user_id": 1, "client_id": null, "joined_at": "2026-10-09T13:04:47.152Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-09T13:04:47.141Z", "project_id": 4, "is_archived": false, "support_ticket_id": null}	\N	2026-10-09 13:04:47.218+00
291	1	\N	1	create	quote	20	\N	{"id": 20, "note": "INTERNAL quote note B", "lines": [{"id": 24, "unit": "pc", "position": 1, "quantity": "1", "quote_id": 20, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST free text work", "total_excl_vat": "500", "unit_price_excl_vat": "500"}], "number": "QUO-2026-0019", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:03.068Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "refused_at": null, "updated_at": "2026-10-09T00:01:03.074Z", "vat_amount": "105", "accepted_at": null, "valid_until": "2026-12-31T00:00:00.000Z", "amount_excl_vat": "500", "amount_incl_vat": "605", "default_vat_rate": "21"}	\N	2026-10-09 00:01:03.079+00
292	1	\N	1	create	quote	21	\N	{"id": 21, "note": "INTERNAL draft", "lines": [{"id": 25, "unit": "pc", "position": 1, "quantity": "1", "quote_id": 21, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST draft work", "total_excl_vat": "100", "unit_price_excl_vat": "100"}], "number": "QUO-2026-0020", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:03.101Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "refused_at": null, "updated_at": "2026-10-09T00:01:03.107Z", "vat_amount": "21", "accepted_at": null, "valid_until": "2026-12-31T00:00:00.000Z", "amount_excl_vat": "100", "amount_incl_vat": "121", "default_vat_rate": "21"}	\N	2026-10-09 00:01:03.112+00
293	1	\N	1	upload	media	50	\N	{"id": 50, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/19/QUO-2026-0018_hWTj_Kp7_.pdf", "entity_id": 19, "file_name": "QUO-2026-0018.pdf", "file_size": 3448, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T00:01:04.341Z", "deleted_at": null, "updated_at": "2026-10-09T00:01:04.341Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-09 00:01:04.363+00
294	1	\N	1	send	quote	19	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 00:01:04.383+00
295	1	\N	1	upload	media	51	\N	{"id": 51, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/20/QUO-2026-0019_LCOp0pXlx.pdf", "entity_id": 20, "file_name": "QUO-2026-0019.pdf", "file_size": 3468, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T00:01:05.245Z", "deleted_at": null, "updated_at": "2026-10-09T00:01:05.245Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-09 00:01:05.252+00
296	1	\N	1	send	quote	20	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 00:01:05.267+00
297	1	\N	1	create	invoice	6	\N	{"id": 6, "note": "INTERNAL invoice draft", "lines": [{"id": 5, "unit": "pc", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 6, "service_id": null, "description": "TEST invoice work", "total_excl_vat": "200", "unit_price_excl_vat": "200"}], "number": "INV-2026-0006", "status": "draft", "sent_at": null, "due_date": "2026-11-08T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:05.292Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "updated_at": "2026-10-09T00:01:05.302Z", "vat_amount": "42", "reminder_count": 0, "amount_excl_vat": "200", "amount_incl_vat": "242", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-09 00:01:05.307+00
298	1	\N	1	create	invoice	7	\N	{"id": 7, "note": "INTERNAL invoice sent", "lines": [{"id": 6, "unit": "pc", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 7, "service_id": null, "description": "TEST invoice work", "total_excl_vat": "200", "unit_price_excl_vat": "200"}], "number": "INV-2026-0007", "status": "draft", "sent_at": null, "due_date": "2026-11-08T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:05.328Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "updated_at": "2026-10-09T00:01:05.333Z", "vat_amount": "42", "reminder_count": 0, "amount_excl_vat": "200", "amount_incl_vat": "242", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-09 00:01:05.338+00
299	1	\N	1	create	invoice	8	\N	{"id": 8, "note": "INTERNAL invoice late", "lines": [{"id": 7, "unit": "pc", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 8, "service_id": null, "description": "TEST invoice work", "total_excl_vat": "200", "unit_price_excl_vat": "200"}], "number": "INV-2026-0008", "status": "draft", "sent_at": null, "due_date": "2026-09-01T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:05.358Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "updated_at": "2026-10-09T00:01:05.365Z", "vat_amount": "42", "reminder_count": 0, "amount_excl_vat": "200", "amount_incl_vat": "242", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-09 00:01:05.369+00
300	1	\N	1	create	invoice	9	\N	{"id": 9, "note": "INTERNAL invoice cancelled", "lines": [{"id": 8, "unit": "pc", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 9, "service_id": null, "description": "TEST invoice work", "total_excl_vat": "200", "unit_price_excl_vat": "200"}], "number": "INV-2026-0009", "status": "draft", "sent_at": null, "due_date": "2026-11-08T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:05.391Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "updated_at": "2026-10-09T00:01:05.396Z", "vat_amount": "42", "reminder_count": 0, "amount_excl_vat": "200", "amount_incl_vat": "242", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-09 00:01:05.399+00
301	1	\N	1	upload	media	52	\N	{"id": 52, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/7/INV-2026-0007_8igOeYbN1.pdf", "entity_id": 7, "file_name": "INV-2026-0007.pdf", "file_size": 3448, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T00:01:06.464Z", "deleted_at": null, "updated_at": "2026-10-09T00:01:06.464Z", "entity_type": "invoice", "uploaded_by": 1}	\N	2026-10-09 00:01:06.483+00
302	1	\N	1	send	invoice	7	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 00:01:06.498+00
303	1	\N	1	upload	media	53	\N	{"id": 53, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/8/INV-2026-0008_jWehiGzee.pdf", "entity_id": 8, "file_name": "INV-2026-0008.pdf", "file_size": 3449, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T00:01:07.329Z", "deleted_at": null, "updated_at": "2026-10-09T00:01:07.329Z", "entity_type": "invoice", "uploaded_by": 1}	\N	2026-10-09 00:01:07.346+00
304	1	\N	1	send	invoice	8	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 00:01:07.356+00
305	1	\N	1	upload	media	54	\N	{"id": 54, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/9/INV-2026-0009_FKiLByb4w.pdf", "entity_id": 9, "file_name": "INV-2026-0009.pdf", "file_size": 3453, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T00:01:08.234Z", "deleted_at": null, "updated_at": "2026-10-09T00:01:08.234Z", "entity_type": "invoice", "uploaded_by": 1}	\N	2026-10-09 00:01:08.249+00
306	1	\N	1	send	invoice	9	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 00:01:08.262+00
307	1	\N	1	cancel	invoice	9	{"status": "sent"}	{"status": "cancelled"}	\N	2026-10-09 00:01:08.283+00
308	1	\N	1	create	conversation	6	\N	{"id": 6, "type": "project_client", "members": [{"user_id": null, "client_id": 1, "joined_at": "2026-10-09T00:01:24.259Z", "admin_user_id": null}, {"user_id": 1, "client_id": null, "joined_at": "2026-10-09T00:01:24.259Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-09T00:01:24.256Z", "project_id": 14, "is_archived": false, "support_ticket_id": null}	\N	2026-10-09 00:01:24.281+00
309	1	\N	1	generate	portal_token	1	\N	{"expires_at": "2027-01-07T00:01:24.285Z", "project_id": 14, "replaced_previous_link": false}	\N	2026-10-09 00:01:24.294+00
310	1	\N	1	generate	portal_token	2	\N	{"expires_at": "2026-10-16T00:03:52.355Z", "project_id": 14, "replaced_previous_link": true}	\N	2026-10-09 00:03:52.37+00
311	1	\N	1	generate	portal_token	3	\N	{"expires_at": "2027-01-07T00:03:52.804Z", "project_id": 14, "replaced_previous_link": true}	\N	2026-10-09 00:03:52.826+00
312	1	\N	1	generate	portal_token	4	\N	{"expires_at": "2027-01-07T00:04:07.467Z", "project_id": 14, "replaced_previous_link": true}	\N	2026-10-09 00:04:07.492+00
313	1	\N	1	generate	portal_token	5	\N	{"expires_at": "2027-01-07T00:04:08.078Z", "project_id": 14, "replaced_previous_link": true}	\N	2026-10-09 00:04:08.092+00
314	1	\N	1	revoke	portal_token	\N	\N	{"project_id": 14}	\N	2026-10-09 00:04:08.126+00
315	1	\N	1	generate	portal_token	6	\N	{"expires_at": "2027-01-07T00:04:08.243Z", "project_id": 14, "replaced_previous_link": false}	\N	2026-10-09 00:04:08.255+00
316	1	\N	1	generate	portal_token	7	\N	{"expires_at": "2027-01-07T00:04:27.538Z", "project_id": 14, "replaced_previous_link": false}	\N	2026-10-09 00:04:27.563+00
317	1	\N	\N	create_reservations	project	14	\N	{"materials": [1, 2, 3]}	\N	2026-10-09 00:04:51.227+00
318	1	\N	\N	accept	quote	19	{"status": "sent"}	{"status": "accepted", "project_id": 14}	\N	2026-10-09 00:04:51.239+00
319	1	\N	\N	portal_accept	quote	19	\N	{"client_id": 1, "portal_token_id": "[redacted]"}	::1	2026-10-09 00:04:51.261+00
320	1	\N	\N	refuse	quote	20	{"status": "sent"}	{"status": "refused"}	\N	2026-10-09 00:04:55.45+00
321	1	\N	\N	portal_refuse	quote	20	\N	{"client_id": 1, "portal_token_id": "[redacted]"}	::1	2026-10-09 00:04:55.467+00
322	1	\N	1	create	project	15	\N	{"id": 15, "city": "Brussels", "name": "TEST Project Portal Staff", "status": "prospect", "end_date": "2026-12-01T00:00:00.000Z", "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:05:21.769Z", "created_by": 1, "manager_id": null, "start_date": "2026-10-01T00:00:00.000Z", "updated_at": "2026-10-09T00:05:21.769Z", "description": "INTERNAL staff compare", "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-09 00:05:21.781+00
323	1	\N	1	create	quote	22	\N	{"id": 22, "note": null, "lines": [{"id": 26, "unit": "m2", "position": 1, "quantity": "40", "quote_id": 22, "vat_rate": "6", "tenant_id": 1, "service_id": 1, "description": "TEST Painting", "total_excl_vat": "1000", "unit_price_excl_vat": "25"}], "number": "QUO-2026-0021", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:05:21.827Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 15, "refused_at": null, "updated_at": "2026-10-09T00:05:21.844Z", "vat_amount": "60", "accepted_at": null, "valid_until": "2026-12-31T00:00:00.000Z", "amount_excl_vat": "1000", "amount_incl_vat": "1060", "default_vat_rate": "21"}	\N	2026-10-09 00:05:21.85+00
324	1	\N	1	upload	media	55	\N	{"id": 55, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/22/QUO-2026-0021_qwRmRlOXc.pdf", "entity_id": 22, "file_name": "QUO-2026-0021.pdf", "file_size": 3361, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T00:05:23.077Z", "deleted_at": null, "updated_at": "2026-10-09T00:05:23.077Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-09 00:05:23.082+00
325	1	\N	1	send	quote	22	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 00:05:23.096+00
326	1	\N	1	create_reservations	project	15	\N	{"materials": [1, 2, 3]}	\N	2026-10-09 00:05:23.166+00
327	1	\N	1	accept	quote	22	{"status": "sent"}	{"status": "accepted", "project_id": 15}	\N	2026-10-09 00:05:23.176+00
328	1	\N	3	create	report	7	\N	{"id": 7, "note": "INTERNAL report note", "weather": "sunny", "tenant_id": 1, "created_at": "2026-10-09T00:05:41.530Z", "created_by": 3, "project_id": 14, "updated_at": "2026-10-09T00:05:41.530Z", "report_date": "2026-10-09T00:00:00.000Z", "progress_pct": 35}	\N	2026-10-09 00:05:41.537+00
329	1	\N	3	upload	media	56	\N	{"id": 56, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/7/TEST-portal-photo_h469AXowy.png", "entity_id": 7, "file_name": "TEST-portal-photo.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T00:05:42.544Z", "deleted_at": null, "updated_at": "2026-10-09T00:05:42.544Z", "entity_type": "report", "uploaded_by": 3}	\N	2026-10-09 00:05:42.561+00
330	1	\N	1	upload	media	57	\N	{"id": 57, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/21/TEST-draft-quote_YFHMJtmUY.pdf", "entity_id": 21, "file_name": "TEST-draft-quote.pdf", "file_size": 192, "file_type": "application/pdf", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T00:05:54.815Z", "deleted_at": null, "updated_at": "2026-10-09T00:05:54.815Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-09 00:05:54.833+00
331	2	\N	9	create	conversation	7	\N	{"id": 7, "type": "project_client", "members": [{"user_id": null, "client_id": 3, "joined_at": "2026-10-09T00:07:06.279Z", "admin_user_id": null}, {"user_id": 9, "client_id": null, "joined_at": "2026-10-09T00:07:06.279Z", "admin_user_id": null}], "tenant_id": 2, "created_at": "2026-10-09T00:07:06.275Z", "project_id": 8, "is_archived": false, "support_ticket_id": null}	\N	2026-10-09 00:07:06.292+00
332	2	\N	9	generate	portal_token	8	\N	{"expires_at": "2027-01-07T00:07:06.297Z", "project_id": 8, "replaced_previous_link": false}	\N	2026-10-09 00:07:06.31+00
333	1	\N	1	create	quote	23	\N	{"id": 23, "note": null, "lines": [{"id": 27, "unit": "pc", "position": 1, "quantity": "1", "quote_id": 23, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST audit fix", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0022", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T12:19:33.455Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "refused_at": null, "updated_at": "2026-10-09T12:19:33.527Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": "2026-12-31T00:00:00.000Z", "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-09 12:19:33.59+00
334	1	\N	1	upload	media	58	\N	{"id": 58, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/23/QUO-2026-0022_ViOf1ZhTO.pdf", "entity_id": 23, "file_name": "QUO-2026-0022.pdf", "file_size": 3363, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T12:19:35.087Z", "deleted_at": null, "updated_at": "2026-10-09T12:19:35.087Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-09 12:19:35.104+00
335	1	\N	1	send	quote	23	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 12:19:35.158+00
336	1	\N	1	generate	portal_token	9	\N	{"expires_at": "2027-01-07T12:19:35.343Z", "project_id": 14, "replaced_previous_link": true}	\N	2026-10-09 12:19:35.383+00
337	1	\N	\N	refuse	quote	23	{"status": "sent"}	{"status": "refused"}	\N	2026-10-09 12:19:35.444+00
338	1	\N	\N	portal_refuse	quote	23	\N	{"client_id": 1, "portal_link_id": 9}	::1	2026-10-09 12:19:35.456+00
339	1	\N	1	create	material	6	\N	{"id": 6, "unit": "kg", "is_active": true, "tenant_id": 1, "created_at": "2026-10-09T12:37:21.998Z", "updated_at": "2026-10-09T12:37:21.998Z", "description": "TEST Sand", "minimum_stock": "10", "purchase_price": "2"}	\N	2026-10-09 12:37:22.022+00
340	1	\N	1	purchase	stock_movement	15	\N	{"id": 15, "note": null, "type": "purchase", "quantity": "50", "report_id": null, "tenant_id": 1, "created_at": "2026-10-09T12:37:22.115Z", "created_by": 1, "project_id": null, "unit_price": "2", "material_id": 6, "movement_date": "2026-10-09T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-09 12:37:22.137+00
341	1	\N	1	adjustment	stock_movement	16	\N	{"id": 16, "note": "TEST NOT-01", "type": "adjustment", "quantity": "-45", "report_id": null, "tenant_id": 1, "created_at": "2026-10-09T12:37:22.672Z", "created_by": 1, "project_id": null, "unit_price": "2", "material_id": 6, "movement_date": "2026-10-09T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-09 12:37:22.685+00
342	1	\N	1	adjustment	stock_movement	17	\N	{"id": 17, "note": "TEST NOT-03", "type": "adjustment", "quantity": "-1", "report_id": null, "tenant_id": 1, "created_at": "2026-10-09T12:37:26.423Z", "created_by": 1, "project_id": null, "unit_price": "2", "material_id": 6, "movement_date": "2026-10-09T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-09 12:37:26.441+00
343	1	\N	1	update	time_entry	4	{"id": 4, "hours": "7", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-06T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.761Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-08T23:35:04.761Z", "hourly_rate": "25"}	{"id": 4, "hours": "7.5", "comment": null, "task_id": null, "user_id": 6, "tenant_id": 1, "work_date": "2026-10-06T00:00:00.000Z", "created_at": "2026-10-08T23:35:04.761Z", "created_by": 6, "project_id": 4, "updated_at": "2026-10-09T12:38:36.567Z", "hourly_rate": "25"}	\N	2026-10-09 12:38:36.58+00
344	1	\N	2	create	task	8	\N	{"id": 8, "type": "work", "title": "TEST Task Notif", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-09T12:44:41.567Z", "created_by": 2, "project_id": 4, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-09T12:44:41.567Z", "assignee_ids": [6, 2]}	\N	2026-10-09 12:44:41.63+00
345	1	\N	2	status_change	task	8	{"status": "planned"}	{"status": "in_progress"}	\N	2026-10-09 12:44:44.668+00
346	1	\N	2	set_assignees	task	8	{"assignee_ids": [6, 2]}	{"assignee_ids": [6, 5]}	\N	2026-10-09 12:44:56.393+00
347	1	\N	2	create	task	9	\N	{"id": 9, "type": "work", "title": "TEST Task Tomorrow", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 1, "created_at": "2026-10-09T12:46:02.538Z", "created_by": 2, "project_id": 4, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-09T12:46:02.538Z", "assignee_ids": [6, 5]}	\N	2026-10-09 12:46:02.625+00
348	2	\N	9	upload	media	59	\N	{"id": 59, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-2/quote/12/QUO-2026-0001_UPbJ-_hsT.pdf", "entity_id": 12, "file_name": "QUO-2026-0001.pdf", "file_size": 2841, "file_type": "application/pdf", "is_locked": true, "tenant_id": 2, "created_at": "2026-10-09T12:47:50.233Z", "deleted_at": null, "updated_at": "2026-10-09T12:47:50.233Z", "entity_type": "quote", "uploaded_by": 9}	\N	2026-10-09 12:47:50.284+00
349	2	\N	9	send	quote	12	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 12:47:50.324+00
350	7	\N	\N	create	tenant	7	\N	{"id": 7, "city": null, "name": "TEST Epsilon", "email": "othmanefadelkheir218+epsilon@gmail.com", "phone": null, "locale": "en", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T12:48:32.316Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T12:48:32.316Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	\N	2026-10-09 12:48:32.328+00
351	1	\N	1	create	quote	24	\N	{"id": 24, "note": "TEST DOC terms", "lines": [{"id": 28, "unit": "m2", "position": 0, "quantity": "120", "quote_id": 24, "vat_rate": "6", "tenant_id": 1, "service_id": null, "description": "TEST DOC Painting", "total_excl_vat": "4800", "unit_price_excl_vat": "40"}, {"id": 29, "unit": "pc", "position": 1, "quantity": "10", "quote_id": 24, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST DOC Materials", "total_excl_vat": "1000", "unit_price_excl_vat": "100"}], "number": "QUO-2026-0023", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T13:02:51.655Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-09T13:02:51.726Z", "vat_amount": "498", "accepted_at": null, "valid_until": null, "amount_excl_vat": "5800", "amount_incl_vat": "6298", "default_vat_rate": "21"}	\N	2026-10-09 13:02:51.783+00
352	1	\N	1	set_lines	quote	24	\N	{"id": 24, "note": "TEST DOC terms", "lines": [{"id": 30, "unit": "m2", "position": 0, "quantity": "120", "quote_id": 24, "vat_rate": "6", "tenant_id": 1, "service_id": null, "description": "TEST DOC Painting", "total_excl_vat": "4800", "unit_price_excl_vat": "40"}, {"id": 31, "unit": "pc", "position": 1, "quantity": "12", "quote_id": 24, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST DOC Materials", "total_excl_vat": "1200", "unit_price_excl_vat": "100"}], "number": "QUO-2026-0023", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T13:02:51.655Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-09T13:02:52.733Z", "vat_amount": "540", "accepted_at": null, "valid_until": null, "amount_excl_vat": "6000", "amount_incl_vat": "6540", "default_vat_rate": "21"}	\N	2026-10-09 13:02:52.785+00
353	1	\N	1	upload	media	60	\N	{"id": 60, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/24/QUO-2026-0023_VBzMmpVUt.pdf", "entity_id": 24, "file_name": "QUO-2026-0023.pdf", "file_size": 3652, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T13:03:10.592Z", "deleted_at": null, "updated_at": "2026-10-09T13:03:10.592Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-09 13:03:10.611+00
354	1	\N	1	send	quote	24	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 13:03:10.677+00
355	1	\N	1	soft_delete_many	media	\N	\N	{"ids": [], "skipped": [60]}	\N	2026-10-09 13:03:15.25+00
356	1	\N	1	hard_delete_many	media	\N	\N	{"ids": [], "failed": [], "skipped": [60]}	\N	2026-10-09 13:03:15.347+00
357	1	\N	1	create	invoice	10	\N	{"id": 10, "note": "TEST DOC pay within 30 days", "lines": [{"id": 9, "unit": "m2", "position": 0, "quantity": "10", "vat_rate": "21", "tenant_id": 1, "invoice_id": 10, "service_id": null, "description": "TEST DOC Invoice line", "total_excl_vat": "500", "unit_price_excl_vat": "50"}], "number": "INV-2026-0010", "status": "draft", "sent_at": null, "due_date": "2026-11-08T00:00:00.000Z", "quote_id": 24, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T13:03:15.790Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 4, "updated_at": "2026-10-09T13:03:15.820Z", "vat_amount": "105", "reminder_count": 0, "amount_excl_vat": "500", "amount_incl_vat": "605", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-09 13:03:15.859+00
358	1	\N	1	upload	media	61	\N	{"id": 61, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/10/INV-2026-0010_vorfPGsrs.pdf", "entity_id": 10, "file_name": "INV-2026-0010.pdf", "file_size": 3477, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T13:03:22.924Z", "deleted_at": null, "updated_at": "2026-10-09T13:03:22.924Z", "entity_type": "invoice", "uploaded_by": 1}	\N	2026-10-09 13:03:22.974+00
359	1	\N	1	send	invoice	10	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 13:03:23.009+00
360	2	\N	9	create	quote	25	\N	{"id": 25, "note": null, "lines": [{"id": 32, "unit": "pc", "position": 0, "quantity": "2", "quote_id": 25, "vat_rate": "21", "tenant_id": 2, "service_id": null, "description": "TEST B line", "total_excl_vat": "20", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0002", "status": "draft", "sent_at": null, "client_id": 3, "tenant_id": 2, "created_at": "2026-10-09T13:03:55.547Z", "created_by": 9, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 8, "refused_at": null, "updated_at": "2026-10-09T13:03:55.594Z", "vat_amount": "4.2", "accepted_at": null, "valid_until": null, "amount_excl_vat": "20", "amount_incl_vat": "24.2", "default_vat_rate": "21"}	\N	2026-10-09 13:03:55.656+00
361	1	\N	1	create	quote	26	\N	{"id": 26, "note": null, "lines": [{"id": 33, "unit": "pc", "position": 0, "quantity": "1", "quote_id": 26, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST DOC logo line", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0024", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T13:03:56.317Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-09T13:03:56.341Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-09 13:03:56.353+00
362	1	\N	1	replace	media	62	{"id": 26, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/tenant/1/test_57h34-met.png", "entity_id": 1, "file_name": "test.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-08T22:53:04.869Z", "deleted_at": null, "updated_at": "2026-10-08T22:53:04.869Z", "entity_type": "tenant", "uploaded_by": 1}	{"id": 62, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/tenant/1/logo-blue_x2A1t1Zp4.png", "entity_id": 1, "file_name": "logo-blue.png", "file_size": 78, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T13:04:02.328Z", "deleted_at": null, "updated_at": "2026-10-09T13:04:02.328Z", "entity_type": "tenant", "uploaded_by": 1}	\N	2026-10-09 13:04:02.976+00
363	1	\N	1	create	quote	27	\N	{"id": 27, "note": null, "lines": [{"id": 34, "unit": "m2", "position": 0, "quantity": "120", "quote_id": 27, "vat_rate": "6", "tenant_id": 1, "service_id": null, "description": "TEST DOC8 Painting", "total_excl_vat": "4800", "unit_price_excl_vat": "40"}, {"id": 35, "unit": "pc", "position": 1, "quantity": "10", "quote_id": 27, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST DOC8 Materials", "total_excl_vat": "1000", "unit_price_excl_vat": "100"}], "number": "QUO-2026-0025", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T13:04:03.906Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-09T13:04:03.931Z", "vat_amount": "498", "accepted_at": null, "valid_until": null, "amount_excl_vat": "5800", "amount_incl_vat": "6298", "default_vat_rate": "21"}	\N	2026-10-09 13:04:03.983+00
364	1	\N	1	upload	media	63	\N	{"id": 63, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/27/QUO-2026-0025_Pyp7q8bXw.pdf", "entity_id": 27, "file_name": "QUO-2026-0025.pdf", "file_size": 3480, "file_type": "application/pdf", "is_locked": true, "tenant_id": 1, "created_at": "2026-10-09T13:04:04.966Z", "deleted_at": null, "updated_at": "2026-10-09T13:04:04.966Z", "entity_type": "quote", "uploaded_by": 1}	\N	2026-10-09 13:04:04.996+00
365	1	\N	1	send	quote	27	{"status": "draft"}	{"status": "sent"}	\N	2026-10-09 13:04:05.038+00
368	1	\N	1	create	support_ticket	1	\N	{"id": 1, "status": "open", "subject": "TEST Cannot export", "category": "bug", "priority": "high", "closed_at": null, "opened_by": 1, "tenant_id": 1, "created_at": "2026-10-09T13:12:21.194Z", "updated_at": "2026-10-09T13:12:21.194Z", "conversation_id": 9, "assigned_admin_id": null}	\N	2026-10-09 13:12:21.298+00
369	2	\N	9	create	support_ticket	2	\N	{"id": 2, "status": "open", "subject": "TEST Beta billing", "category": "billing", "priority": "low", "closed_at": null, "opened_by": 9, "tenant_id": 2, "created_at": "2026-10-09T13:13:07.774Z", "updated_at": "2026-10-09T13:13:07.774Z", "conversation_id": 11, "assigned_admin_id": null}	\N	2026-10-09 13:13:07.913+00
370	1	1	\N	assign	support_ticket	1	{"assigned_admin_id": null}	{"assigned_admin_id": 2}	::1	2026-10-09 13:13:16.063+00
371	1	2	\N	support_reply	conversation	9	\N	{"ticket_id": 1, "message_id": 19}	::1	2026-10-09 13:13:18.557+00
372	1	1	\N	support_read	conversation	9	\N	{"page": 1, "returned": 2, "ticket_id": 1}	::1	2026-10-09 13:13:28.854+00
373	1	1	\N	support_read	conversation	9	\N	{"page": 1, "returned": 2, "ticket_id": 1}	::1	2026-10-09 13:13:29.48+00
374	1	1	\N	support_read	conversation	9	\N	{"page": 1, "returned": 2, "ticket_id": 1}	::1	2026-10-09 13:13:32.722+00
375	1	1	\N	support_reply	conversation	9	\N	{"ticket_id": 1, "message_id": 20}	::1	2026-10-09 13:13:34.579+00
376	1	1	\N	support_join	conversation	9	\N	\N	::1	2026-10-09 13:14:02.511+00
377	1	1	\N	support_reply	conversation	9	\N	{"ticket_id": 1, "message_id": 21}	::1	2026-10-09 13:14:02.796+00
378	1	1	\N	update_status	support_ticket	1	{"status": "open"}	{"status": "in_progress"}	::1	2026-10-09 13:15:09.598+00
379	1	1	\N	close	support_ticket	1	{"status": "in_progress"}	{"status": "closed", "closed_at": "2026-10-09T13:15:10.281Z"}	::1	2026-10-09 13:15:10.346+00
380	1	\N	5	create	feedback	1	\N	{"id": 1, "body": "TEST please add export", "type": "feature_request", "title": "TEST Export to Excel", "status": "new", "tenant_id": 1, "created_at": "2026-10-09T13:15:20.118Z", "updated_at": "2026-10-09T13:15:20.118Z", "submitted_by": 5}	\N	2026-10-09 13:15:20.144+00
381	1	\N	1	create	feedback	2	\N	{"id": 2, "body": "TEST it is slow", "type": "complaint", "title": "TEST Slow PDF", "status": "new", "tenant_id": 1, "created_at": "2026-10-09T13:15:20.425Z", "updated_at": "2026-10-09T13:15:20.425Z", "submitted_by": 1}	\N	2026-10-09 13:15:20.482+00
382	2	\N	9	create	feedback	3	\N	{"id": 3, "body": "TEST beta body", "type": "improvement", "title": "TEST Beta idea", "status": "new", "tenant_id": 2, "created_at": "2026-10-09T13:15:38.171Z", "updated_at": "2026-10-09T13:15:38.171Z", "submitted_by": 9}	\N	2026-10-09 13:15:38.298+00
383	1	1	\N	impersonate_enter	tenant	1	\N	{"impersonated_user_id": 1}	::1	2026-10-09 13:16:43.503+00
384	1	1	\N	impersonate_exit	tenant	1	\N	\N	::1	2026-10-09 13:16:45.8+00
385	8	1	\N	create	tenant	8	\N	{"id": 8, "city": null, "name": "TEST Gamma", "email": "othmanefadelkheir218+gamma@gmail.com", "phone": null, "locale": "fr", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T13:17:00.712Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T13:17:00.712Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	::1	2026-10-09 13:17:00.778+00
386	1	2	\N	impersonate_enter	tenant	1	\N	{"impersonated_user_id": 1}	::1	2026-10-09 13:17:06.963+00
387	1	2	\N	impersonate_exit	tenant	1	\N	\N	::1	2026-10-09 13:17:07.258+00
388	1	1	\N	update_status	feedback	2	{"status": "new"}	{"status": "reviewing"}	::1	2026-10-09 13:24:54.292+00
389	1	\N	1	create	user_invitation	4	\N	{"id": 4, "name": "TEST Worker Three", "email": "winucardit+worker3@gmail.com", "role_id": 5, "tenant_id": 1, "created_at": "2026-10-09T13:32:51.008Z", "expires_at": "2026-10-16T13:32:51.002Z", "invited_by": 1, "accepted_at": null}	\N	2026-10-09 13:32:51.615+00
390	\N	1	\N	create	plan	4	\N	{"name": "TEST Closed", "features": [{"feature_key": "max_workers", "limit_value": 2, "overage_rate": "2"}, {"feature_key": "max_managers", "limit_value": 3, "overage_rate": "5"}, {"feature_key": "max_clients", "limit_value": 3, "overage_rate": "1"}, {"feature_key": "max_subcontractors", "limit_value": 2, "overage_rate": "1"}, {"feature_key": "storage_gb", "limit_value": 1, "overage_rate": "0.5"}, {"feature_key": "retention_days", "limit_value": 30, "overage_rate": "0"}], "base_price": "7.00"}	::1	2026-10-09 13:33:30.51+00
391	\N	1	\N	deactivate	plan	4	\N	{}	::1	2026-10-09 13:33:31.217+00
392	\N	1	\N	create	plan	5	\N	{"name": "TEST Mid", "features": [{"feature_key": "max_workers", "limit_value": 5, "overage_rate": "2"}, {"feature_key": "max_managers", "limit_value": 5, "overage_rate": "5"}, {"feature_key": "max_clients", "limit_value": 5, "overage_rate": "1"}, {"feature_key": "max_subcontractors", "limit_value": 5, "overage_rate": "1"}, {"feature_key": "storage_gb", "limit_value": 2, "overage_rate": "0.5"}, {"feature_key": "retention_days", "limit_value": 30, "overage_rate": "0"}], "base_price": "20.00"}	::1	2026-10-09 13:33:54.154+00
393	7	\N	15	upload	media	64	\N	{"id": 64, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-7/report/0/test_84xcuCWTH.jpg", "entity_id": 0, "file_name": "test.jpg", "file_size": 134, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 7, "created_at": "2026-10-09T13:35:01.156Z", "deleted_at": null, "updated_at": "2026-10-09T13:35:01.156Z", "entity_type": "report", "uploaded_by": 15}	\N	2026-10-09 13:35:01.224+00
394	7	\N	15	soft_delete_many	media	\N	\N	{"ids": [64], "skipped": []}	\N	2026-10-09 13:35:11.852+00
395	7	\N	15	hard_delete_many	media	\N	\N	{"ids": [64], "failed": [], "skipped": []}	\N	2026-10-09 13:35:13.825+00
396	7	\N	15	upload	media	65	\N	{"id": 65, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-7/report/0/test_mkRKSWlHvH.jpg", "entity_id": 0, "file_name": "test.jpg", "file_size": 134, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 7, "created_at": "2026-10-09T13:35:23.454Z", "deleted_at": null, "updated_at": "2026-10-09T13:35:23.454Z", "entity_type": "report", "uploaded_by": 15}	\N	2026-10-09 13:35:23.515+00
399	1	\N	1	deactivate	user	8	{"id": 8, "name": "TEST Accountant", "email": "zakariyazouazou+accountant@gmail.com", "phone": null, "role_id": 7, "is_active": true, "tenant_id": 1, "created_at": "2026-10-08T22:12:25.013Z", "updated_at": "2026-10-08T22:12:25.013Z", "hourly_rate": "0", "email_verified_at": "2026-10-08T22:12:24.814Z"}	{"id": 8, "name": "TEST Accountant", "email": "zakariyazouazou+accountant@gmail.com", "phone": null, "role_id": 7, "is_active": false, "tenant_id": 1, "created_at": "2026-10-08T22:12:25.013Z", "updated_at": "2026-10-09T13:44:55.001Z", "hourly_rate": "0", "email_verified_at": "2026-10-08T22:12:24.814Z"}	\N	2026-10-09 13:44:55.122+00
400	1	\N	1	create	client	7	\N	{"id": 7, "city": null, "name": "TEST Limit Client 5", "note": null, "type": "individual", "email": "limit5@example.com", "phone": "+32470123456", "country": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-09T13:45:53.148Z", "updated_at": "2026-10-09T13:45:53.148Z", "vat_number": null, "postal_code": null, "contact_name": null, "address_line1": null, "address_line2": null, "phone_secondary": null}	\N	2026-10-09 13:45:53.213+00
401	1	\N	1	create	subcontractor	4	\N	{"id": 4, "email": null, "phone": null, "trade": null, "is_active": true, "tenant_id": 1, "created_at": "2026-10-09T13:45:53.345Z", "updated_at": "2026-10-09T13:45:53.345Z", "vat_number": null, "hourly_rate": null, "company_name": "TEST Limit Sub 4"}	\N	2026-10-09 13:45:53.405+00
402	1	\N	16	accept_invitation	user	16	\N	{"id": 16, "email": "winucardit+worker3@gmail.com", "role_id": 5}	\N	2026-10-09 14:55:20.698+00
403	1	\N	1	deactivate	user	16	{"id": 16, "name": "TEST Worker Three", "email": "winucardit+worker3@gmail.com", "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-09T14:55:20.676Z", "updated_at": "2026-10-09T14:55:20.676Z", "hourly_rate": "0", "email_verified_at": null}	{"id": 16, "name": "TEST Worker Three", "email": "winucardit+worker3@gmail.com", "phone": null, "role_id": 5, "is_active": false, "tenant_id": 1, "created_at": "2026-10-09T14:55:20.676Z", "updated_at": "2026-10-09T14:55:20.815Z", "hourly_rate": "0", "email_verified_at": null}	\N	2026-10-09 14:55:20.83+00
404	\N	1	\N	update	admin_user	2	\N	{"can_manage_billing": true}	::1	2026-10-09 17:16:02.177+00
405	1	2	\N	set_pending_plan	subscription	1	\N	{"plan_id": 3}	::1	2026-10-09 17:16:02.262+00
406	\N	1	\N	update	admin_user	2	\N	{"can_manage_billing": false}	::1	2026-10-09 17:16:02.284+00
407	1	1	\N	set_pending_plan	subscription	1	\N	{"plan_id": 3}	::1	2026-10-09 17:16:02.328+00
408	1	1	\N	set_pending_plan	subscription	1	\N	{"plan_id": 3}	::1	2026-10-09 17:29:47.469+00
409	1	\N	2	create	project	16	\N	{"id": 16, "city": null, "name": "TEST date-only fix", "status": "prospect", "end_date": "2026-12-18T00:00:00.000Z", "client_id": 7, "tenant_id": 1, "created_at": "2026-10-09T17:40:16.590Z", "created_by": 2, "manager_id": null, "start_date": "2026-11-02T00:00:00.000Z", "updated_at": "2026-10-09T17:40:16.590Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-09 17:40:16.623+00
410	1	\N	2	update	project	16	{"id": 16, "city": null, "name": "TEST date-only fix", "status": "prospect", "end_date": "2026-12-18T00:00:00.000Z", "client_id": 7, "tenant_id": 1, "created_at": "2026-10-09T17:40:16.590Z", "created_by": 2, "manager_id": null, "start_date": "2026-11-02T00:00:00.000Z", "updated_at": "2026-10-09T17:40:16.590Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	{"id": 16, "city": null, "name": "TEST date-only fix", "status": "prospect", "end_date": "2026-12-18T00:00:00.000Z", "client_id": 7, "tenant_id": 1, "created_at": "2026-10-09T17:40:16.590Z", "created_by": 2, "manager_id": null, "start_date": "2026-11-03T00:00:00.000Z", "updated_at": "2026-10-09T17:40:20.610Z", "description": null, "postal_code": null, "address_line1": null, "address_line2": null, "actual_end_date": null}	\N	2026-10-09 17:40:20.629+00
411	1	\N	2	upload	media	66	\N	{"id": 66, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/16/t_wdsHIJnQ9-.png", "entity_id": 16, "file_name": "t.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T18:55:26.231Z", "deleted_at": null, "updated_at": "2026-10-09T18:55:26.231Z", "entity_type": "project", "uploaded_by": 2}	\N	2026-10-09 18:55:26.258+00
412	1	\N	2	upload	media	67	\N	{"id": 67, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/16/t_W1U_cut0r.png", "entity_id": 16, "file_name": "t.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T18:55:27.084Z", "deleted_at": null, "updated_at": "2026-10-09T18:55:27.084Z", "entity_type": "project", "uploaded_by": 2}	\N	2026-10-09 18:55:27.101+00
413	1	\N	2	upload	media	68	\N	{"id": 68, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/16/t_W1FUxIde5.png", "entity_id": 16, "file_name": "t.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T18:55:27.928Z", "deleted_at": null, "updated_at": "2026-10-09T18:55:27.928Z", "entity_type": "project", "uploaded_by": 2}	\N	2026-10-09 18:55:27.945+00
414	1	\N	2	upload	media	69	\N	{"id": 69, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/16/t_i6cCyRfKj.png", "entity_id": 16, "file_name": "t.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T18:55:28.789Z", "deleted_at": null, "updated_at": "2026-10-09T18:55:28.789Z", "entity_type": "project", "uploaded_by": 2}	\N	2026-10-09 18:55:28.794+00
415	1	\N	2	upload	media	70	\N	{"id": 70, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/16/t_r95APQXdfw.png", "entity_id": 16, "file_name": "t.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T18:55:29.552Z", "deleted_at": null, "updated_at": "2026-10-09T18:55:29.552Z", "entity_type": "project", "uploaded_by": 2}	\N	2026-10-09 18:55:29.569+00
416	1	\N	2	upload	media	71	\N	{"id": 71, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/16/t_xfJnJ7ZbCH.png", "entity_id": 16, "file_name": "t.png", "file_size": 70, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-09T18:55:30.351Z", "deleted_at": null, "updated_at": "2026-10-09T18:55:30.351Z", "entity_type": "project", "uploaded_by": 2}	\N	2026-10-09 18:55:30.359+00
417	1	\N	2	soft_delete_many	media	\N	\N	{"ids": [66, 67, 68, 69, 70, 71], "skipped": []}	\N	2026-10-09 18:55:41.923+00
418	1	\N	2	hard_delete_many	media	\N	\N	{"ids": [66, 67, 68, 69, 70, 71], "failed": [], "skipped": []}	\N	2026-10-09 18:55:43.612+00
420	8	2	\N	set_status	tenant	8	{"status": "active"}	{"reason": null, "status": "suspended"}	::1	2026-10-09 19:08:03.166+00
421	8	2	\N	set_status	tenant	8	{"status": "suspended"}	{"reason": null, "status": "active"}	::1	2026-10-09 19:08:03.249+00
422	\N	1	\N	update	admin_user	2	\N	{"can_manage_tenants": false}	::1	2026-10-09 19:08:03.336+00
423	8	2	\N	update	tenant	8	{"id": 8, "city": null, "name": "TEST Gamma", "email": "othmanefadelkheir218+gamma@gmail.com", "phone": null, "locale": "fr", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T13:17:00.712Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T19:08:03.244Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	{"id": 8, "city": null, "name": "TEST Gamma", "email": "othmanefadelkheir218+gamma@gmail.com", "phone": null, "locale": "fr", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T13:17:00.712Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T19:08:03.244Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	::1	2026-10-09 19:12:38.294+00
424	1	\N	1	create	conversation	12	\N	{"id": 12, "type": "internal", "members": [{"user_id": 1, "client_id": null, "joined_at": "2026-10-09T19:28:30.080Z", "admin_user_id": null}, {"user_id": 5, "client_id": null, "joined_at": "2026-10-09T19:28:30.080Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-09T19:28:30.061Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-09 19:28:30.119+00
425	1	\N	1	create	conversation	13	\N	{"id": 13, "type": "internal", "members": [{"user_id": 1, "client_id": null, "joined_at": "2026-10-09T19:28:30.330Z", "admin_user_id": null}, {"user_id": 2, "client_id": null, "joined_at": "2026-10-09T19:28:30.330Z", "admin_user_id": null}, {"user_id": 3, "client_id": null, "joined_at": "2026-10-09T19:28:30.330Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-09T19:28:30.322Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-09 19:28:30.387+00
426	9	\N	\N	create	tenant	9	\N	{"id": 9, "city": null, "name": "TEST Mail FR", "email": "othmanefadelkheir218+mailfr@gmail.com", "phone": null, "locale": "fr", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T19:44:08.761Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T19:44:08.761Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	\N	2026-10-09 19:44:08.776+00
427	10	\N	\N	create	tenant	10	\N	{"id": 10, "city": null, "name": "TEST Mail NL", "email": "othmanefadelkheir218+mailnl@gmail.com", "phone": null, "locale": "nl", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T19:44:09.534Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T19:44:09.534Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	\N	2026-10-09 19:44:09.537+00
428	11	\N	\N	create	tenant	11	\N	{"id": 11, "city": null, "name": "TEST Alert Check", "email": "othmanefadelkheir218+alertcheck@gmail.com", "phone": null, "locale": "en", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T19:48:27.326Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T19:48:27.326Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	\N	2026-10-09 19:48:27.331+00
429	1	\N	1	adjustment	stock_movement	18	\N	{"id": 18, "note": "NOT-28 test: bad Resend key", "type": "adjustment", "quantity": "-1", "report_id": null, "tenant_id": 1, "created_at": "2026-10-09T20:34:13.232Z", "created_by": 1, "project_id": null, "unit_price": "2", "material_id": 6, "movement_date": "2026-10-09T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-09 20:34:13.248+00
430	1	\N	1	create	material	7	\N	{"id": 7, "unit": "kg", "is_active": true, "tenant_id": 1, "created_at": "2026-10-09T20:36:02.021Z", "updated_at": "2026-10-09T20:36:02.021Z", "description": "TEST NOT-28 Sand", "minimum_stock": "10", "purchase_price": "1"}	\N	2026-10-09 20:36:02.03+00
431	1	\N	1	adjustment	stock_movement	19	\N	{"id": 19, "note": "NOT-28 start stock", "type": "adjustment", "quantity": "50", "report_id": null, "tenant_id": 1, "created_at": "2026-10-09T20:36:02.059Z", "created_by": 1, "project_id": null, "unit_price": "1", "material_id": 7, "movement_date": "2026-10-09T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-09 20:36:02.067+00
432	1	\N	1	adjustment	stock_movement	20	\N	{"id": 20, "note": "NOT-28 test: bad Resend key", "type": "adjustment", "quantity": "-45", "report_id": null, "tenant_id": 1, "created_at": "2026-10-09T20:36:02.101Z", "created_by": 1, "project_id": null, "unit_price": "1", "material_id": 7, "movement_date": "2026-10-09T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-09 20:36:02.106+00
433	11	1	\N	update	tenant	11	{"id": 11, "city": null, "name": "TEST Alert Check", "email": "othmanefadelkheir218+alertcheck@gmail.com", "phone": null, "locale": "en", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T19:48:27.326Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T21:00:54.495Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	{"id": 11, "city": null, "name": "TEST Alert Check x", "email": "othmanefadelkheir218+alertcheck@gmail.com", "phone": null, "locale": "en", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T19:48:27.326Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T21:00:55.050Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	::1	2026-10-09 21:00:55.079+00
434	11	1	\N	update	tenant	11	{"id": 11, "city": null, "name": "TEST Alert Check x", "email": "othmanefadelkheir218+alertcheck@gmail.com", "phone": null, "locale": "en", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T19:48:27.326Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T21:00:55.050Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	{"id": 11, "city": null, "name": "TEST Alert Check", "email": "othmanefadelkheir218+alertcheck@gmail.com", "phone": null, "locale": "en", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T19:48:27.326Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T21:00:55.121Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	::1	2026-10-09 21:00:55.135+00
435	\N	1	\N	create	admin_user	3	\N	{"name": "TEST Not21", "role": "staff", "email": "othmanefadelkheir218+not211791579655679@gmail.com", "password": "[redacted]"}	::1	2026-10-09 21:00:55.835+00
436	\N	1	\N	deactivate	admin_user	3	\N	\N	::1	2026-10-09 21:00:55.903+00
437	1	2	\N	impersonate_enter	tenant	1	\N	{"impersonated_user_id": 1}	::1	2026-10-09 22:46:41.579+00
438	1	2	\N	impersonate_exit	tenant	1	\N	\N	::1	2026-10-09 22:46:41.81+00
439	1	\N	1	update	tenant	1	{"id": 1, "bic": null, "city": null, "iban": null, "name": "TEST Alpha Renovation", "email": "othmanefadelkheir218@gmail.com", "phone": null, "locale": "fr", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-08T22:12:24.851Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T13:04:02.377Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": 62, "default_vat_rate": "21", "email_verified_at": "2026-10-08T22:12:24.814Z", "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	{"id": 1, "bic": "GKCCBEBB", "city": null, "iban": "BE68539007547034", "name": "TEST Alpha Renovation", "email": "othmanefadelkheir218@gmail.com", "phone": null, "locale": "fr", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-08T22:12:24.851Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T22:55:33.266Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": 62, "default_vat_rate": "21", "email_verified_at": "2026-10-08T22:12:24.814Z", "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	::1	2026-10-09 22:55:33.287+00
440	1	\N	1	record_payment	invoice	7	\N	{"amount": "262.00", "status": "paid", "payment_id": 3}	\N	2026-10-09 23:00:15.471+00
441	1	\N	1	record_payment	invoice	7	\N	{"note": "TEST typed 262 instead of 242", "amount": "-20.00", "status": "paid", "payment_id": 5}	\N	2026-10-09 23:00:16.871+00
442	1	\N	1	record_payment	invoice	7	\N	{"note": "TEST bounced part", "amount": "-142.00", "status": "partially_paid", "payment_id": 6}	\N	2026-10-09 23:00:17.204+00
443	1	\N	1	record_payment	invoice	7	\N	{"note": "TEST bounced rest", "amount": "-100.00", "status": "sent", "payment_id": 7}	\N	2026-10-09 23:00:17.548+00
444	12	1	\N	create	tenant	12	\N	{"id": 12, "bic": null, "city": null, "iban": null, "name": "TEST B18 Admin Company", "email": "winucardit+b18company@gmail.com", "phone": null, "locale": "fr", "status": "active", "country": null, "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-09T23:32:10.022Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-09T23:32:10.022Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	::1	2026-10-09 23:32:10.035+00
445	12	1	\N	create	user_invitation	5	\N	{"id": 5, "name": "TEST B18 Boss", "email": "winucardit+b18owner@gmail.com", "role_id": 1, "tenant_id": 12, "created_at": "2026-10-09T23:32:10.081Z", "expires_at": "2026-10-16T23:32:10.079Z", "invited_by": null, "accepted_at": null, "invited_by_admin_user_id": 1}	::1	2026-10-09 23:32:10.091+00
446	12	\N	20	accept_invitation	user	20	\N	{"id": 20, "email": "winucardit+b18owner@gmail.com", "role_id": 1}	\N	2026-10-09 23:32:28.125+00
447	2	\N	9	create	conversation	14	\N	{"id": 14, "type": "internal", "members": [{"user_id": 9, "client_id": null, "joined_at": "2026-10-10T11:03:42.762Z", "admin_user_id": null}, {"user_id": 14, "client_id": null, "joined_at": "2026-10-10T11:03:42.762Z", "admin_user_id": null}], "tenant_id": 2, "created_at": "2026-10-10T11:03:42.743Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-10 11:03:42.786+00
448	11	1	\N	soft_delete	tenant	11	{"deleted_at": null}	{"deleted_at": "2026-10-10T11:41:55.466Z"}	::1	2026-10-10 11:41:55.501+00
449	11	1	\N	restore	tenant	11	{"deleted_at": "2026-10-10T11:41:55.466Z"}	{"deleted_at": null}	::1	2026-10-10 11:41:55.724+00
450	2	1	\N	support_read	conversation	11	\N	{"page": 1, "returned": 1, "ticket_id": 2}	::1	2026-10-10 14:03:55.368+00
451	2	1	\N	support_join	conversation	11	\N	\N	::1	2026-10-10 14:03:55.401+00
452	1	\N	1	create	conversation	15	\N	{"id": 15, "type": "internal", "members": [{"user_id": 1, "client_id": null, "joined_at": "2026-10-10T14:25:42.037Z", "admin_user_id": null}, {"user_id": 8, "client_id": null, "joined_at": "2026-10-10T14:25:42.037Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-10T14:25:42.023Z", "project_id": 16, "is_archived": false, "support_ticket_id": null}	\N	2026-10-10 14:25:42.07+00
453	1	\N	1	add_member	conversation	15	\N	{"user_id": 6}	\N	2026-10-10 14:27:05.027+00
454	1	\N	6	create	conversation	16	\N	{"id": 16, "type": "internal", "members": [{"user_id": 6, "client_id": null, "joined_at": "2026-10-10T14:33:59.692Z", "admin_user_id": null}, {"user_id": 1, "client_id": null, "joined_at": "2026-10-10T14:33:59.692Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-10T14:33:59.686Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-10 14:33:59.721+00
477	13	\N	21	create	material	16	\N	{"id": 16, "unit": "pièce", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:34:58.539Z", "updated_at": "2026-10-10T15:34:58.539Z", "description": "Plaque de plâtre BA13 – 260x120", "minimum_stock": "30", "purchase_price": "8.9"}	\N	2026-10-10 15:34:58.557+00
455	1	\N	6	upload	media	72	\N	{"id": 72, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/WhatsApp_Image_2026-10-03_at_3.27.34_PM_yVzFyN0Mm.jpeg", "entity_id": 0, "file_name": "WhatsApp Image 2026-10-03 at 3.27.34 PM.jpeg", "file_size": 49895, "file_type": "image/jpeg", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-10T15:04:31.398Z", "deleted_at": null, "updated_at": "2026-10-10T15:04:31.398Z", "entity_type": "message", "uploaded_by": 6}	\N	2026-10-10 15:04:31.411+00
456	13	1	\N	create	tenant	13	\N	{"id": 13, "bic": null, "city": null, "iban": null, "name": "hubchoose", "email": "zoizouzakaria32@gmail.com", "phone": "+212676138066", "locale": "fr", "status": "active", "country": "FR", "currency": "EUR", "timezone": "Europe/Brussels", "created_at": "2026-10-10T15:07:06.764Z", "deleted_at": null, "legal_name": null, "updated_at": "2026-10-10T15:07:06.764Z", "vat_number": null, "postal_code": null, "address_line1": null, "address_line2": null, "logo_media_id": null, "default_vat_rate": "21", "email_verified_at": null, "registration_number": null, "default_payment_days": 30, "end_of_day_reminder_time": "18:00"}	::1	2026-10-10 15:07:06.774+00
457	13	1	\N	create	user_invitation	6	\N	{"id": 6, "name": "ziko", "email": "zoizouzakaria32@gmail.com", "role_id": 1, "tenant_id": 13, "created_at": "2026-10-10T15:07:06.817Z", "expires_at": "2026-10-17T15:07:06.815Z", "invited_by": null, "accepted_at": null, "invited_by_admin_user_id": 1}	::1	2026-10-10 15:07:06.829+00
458	13	1	\N	verify_email	tenant	13	{"email_verified_at": null}	{"email_verified_at": "2026-10-10T15:08:20.465Z"}	::1	2026-10-10 15:08:20.476+00
459	13	\N	21	accept_invitation	user	21	\N	{"id": 21, "email": "zoizouzakaria32@gmail.com", "role_id": 1}	\N	2026-10-10 15:08:41.384+00
460	13	1	\N	impersonate_enter	tenant	13	\N	{"impersonated_user_id": 21}	::1	2026-10-10 15:26:11.269+00
461	13	1	\N	impersonate_exit	tenant	13	\N	\N	::1	2026-10-10 15:26:17.707+00
462	13	1	\N	set_pending_plan	subscription	13	\N	{"plan_id": 2}	::1	2026-10-10 15:26:50.799+00
463	13	1	\N	set_pending_plan	subscription	13	\N	{"plan_id": 1}	::1	2026-10-10 15:27:50.539+00
464	13	\N	21	create	cost_type	5	\N	{"id": 5, "name": "transport", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:29:43.058Z"}	\N	2026-10-10 15:29:43.064+00
465	13	\N	21	create	supplier	3	\N	{"id": 3, "name": "mokhtare", "email": "mokhtareAhmed@gmail.com", "phone": "+1234567890", "address": "mokhtareAhmed@gmail.com", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:30:14.782Z", "updated_at": "2026-10-10T15:30:14.782Z", "vat_number": "20"}	\N	2026-10-10 15:30:14.805+00
466	13	\N	21	create	purchase_invoice	27	\N	{"id": 27, "type": "supplier", "number": "PUR-2026-0001", "status": "to_pay", "paid_at": null, "due_date": "2026-06-02T00:00:00.000Z", "vat_rate": "20", "tenant_id": 13, "created_at": "2026-10-10T15:30:50.361Z", "created_by": 21, "issue_date": "2026-09-30T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-10T15:30:50.361Z", "vat_amount": "4000", "supplier_id": 3, "cost_type_id": 3, "amount_excl_vat": "20000", "amount_incl_vat": "24000", "external_number": "#12345", "payment_reference": "sdf", "subcontractor_contract_id": null}	\N	2026-10-10 15:30:50.423+00
467	13	\N	21	mark_paid	purchase_invoice	27	{"status": "to_pay"}	{"status": "paid", "paid_at": "2026-10-10T15:30:58.328Z", "payment_reference": "sdf"}	\N	2026-10-10 15:30:58.372+00
468	13	\N	21	update	purchase_invoice	27	{"id": 27, "type": "supplier", "number": "PUR-2026-0001", "status": "paid", "paid_at": "2026-10-10T15:30:58.328Z", "due_date": "2026-06-02T00:00:00.000Z", "vat_rate": "20", "tenant_id": 13, "created_at": "2026-10-10T15:30:50.361Z", "created_by": 21, "issue_date": "2026-09-30T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-10T15:30:58.338Z", "vat_amount": "4000", "supplier_id": 3, "cost_type_id": 3, "amount_excl_vat": "20000", "amount_incl_vat": "24000", "external_number": "#12345", "payment_reference": "sdf", "subcontractor_contract_id": null}	{"id": 27, "type": "supplier", "number": "PUR-2026-0001", "status": "paid", "paid_at": "2026-10-10T15:30:58.328Z", "due_date": "2026-06-02T00:00:00.000Z", "vat_rate": "20", "tenant_id": 13, "created_at": "2026-10-10T15:30:50.361Z", "created_by": 21, "issue_date": "2026-09-30T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-10T15:30:59.748Z", "vat_amount": "4000", "supplier_id": 3, "cost_type_id": 3, "amount_excl_vat": "20000", "amount_incl_vat": "24000", "external_number": "#12345", "payment_reference": "sdf", "subcontractor_contract_id": null}	\N	2026-10-10 15:30:59.76+00
469	13	\N	21	create	material	8	\N	{"id": 8, "unit": "sac", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:33:03.002Z", "updated_at": "2026-10-10T15:33:03.002Z", "description": "Ciment Portland CEM II 32,5 – sac 25 kg", "minimum_stock": "20", "purchase_price": "6.5"}	\N	2026-10-10 15:33:03.02+00
470	13	\N	21	create	material	9	\N	{"id": 9, "unit": "t", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:33:20.490Z", "updated_at": "2026-10-10T15:33:20.490Z", "description": "Sable de construction 0/4", "minimum_stock": "5", "purchase_price": "35"}	\N	2026-10-10 15:33:20.517+00
471	13	\N	21	create	material	10	\N	{"id": 10, "unit": "t", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:33:32.407Z", "updated_at": "2026-10-10T15:33:32.407Z", "description": "Gravier 4/14", "minimum_stock": "5", "purchase_price": "38"}	\N	2026-10-10 15:33:32.433+00
472	13	\N	21	create	material	11	\N	{"id": 11, "unit": "m3", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:33:49.369Z", "updated_at": "2026-10-10T15:33:49.369Z", "description": "Béton prêt à l’emploi C25/30", "minimum_stock": "2", "purchase_price": "115"}	\N	2026-10-10 15:33:49.409+00
473	13	\N	21	create	material	12	\N	{"id": 12, "unit": "pièce", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:34:03.814Z", "updated_at": "2026-10-10T15:34:03.814Z", "description": "Bloc béton creux 39x19x14", "minimum_stock": "200", "purchase_price": "1.2"}	\N	2026-10-10 15:34:03.849+00
474	13	\N	21	create	material	13	\N	{"id": 13, "unit": "pièce", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:34:18.307Z", "updated_at": "2026-10-10T15:34:18.307Z", "description": "Brique de parement rouge", "minimum_stock": "500", "purchase_price": "0.65"}	\N	2026-10-10 15:34:18.348+00
475	13	\N	21	create	material	14	\N	{"id": 14, "unit": "barre", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:34:31.980Z", "updated_at": "2026-10-10T15:34:31.980Z", "description": "Fer à béton HA Ø10 – barre 6 m", "minimum_stock": "50", "purchase_price": "7.8"}	\N	2026-10-10 15:34:32.021+00
476	13	\N	21	create	material	15	\N	{"id": 15, "unit": "panneau", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:34:44.687Z", "updated_at": "2026-10-10T15:34:44.687Z", "description": "Treillis soudé 150x150 Ø6", "minimum_stock": "10", "purchase_price": "32"}	\N	2026-10-10 15:34:44.702+00
478	13	\N	21	create	material	17	\N	{"id": 17, "unit": "pièce", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:35:11.748Z", "updated_at": "2026-10-10T15:35:11.748Z", "description": "Rail métallique R48 – 3 m", "minimum_stock": "40", "purchase_price": "3.4"}	\N	2026-10-10 15:35:11.767+00
479	13	\N	21	create	material	18	\N	{"id": 18, "unit": "pièce", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:35:24.987Z", "updated_at": "2026-10-10T15:35:24.987Z", "description": "Montant métallique M48 – 3 m", "minimum_stock": "40", "purchase_price": "3.9"}	\N	2026-10-10 15:35:25+00
480	13	\N	21	create	material	19	\N	{"id": 19, "unit": "m2", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:35:44.461Z", "updated_at": "2026-10-10T15:35:44.461Z", "description": "Laine de verre 100 mm", "minimum_stock": "50", "purchase_price": "6.2"}	\N	2026-10-10 15:35:44.508+00
481	13	\N	21	create	material	20	\N	{"id": 20, "unit": "sac", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:35:58.025Z", "updated_at": "2026-10-10T15:35:58.025Z", "description": "Enduit de lissage – sac 25 kg", "minimum_stock": "10", "purchase_price": "18.5"}	\N	2026-10-10 15:35:58.054+00
482	13	\N	21	create	material	21	\N	{"id": 21, "unit": "sac", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:36:11.327Z", "updated_at": "2026-10-10T15:36:11.327Z", "description": "Colle carrelage C2 – sac 25 kg", "minimum_stock": "15", "purchase_price": "14"}	\N	2026-10-10 15:36:11.35+00
483	13	\N	21	create	material	22	\N	{"id": 22, "unit": "m2", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:36:25.545Z", "updated_at": "2026-10-10T15:36:25.545Z", "description": "Carrelage grès cérame 60x60", "minimum_stock": "20", "purchase_price": "22"}	\N	2026-10-10 15:36:25.555+00
484	13	\N	21	update	material	22	{"id": 22, "unit": "m2", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:36:25.545Z", "updated_at": "2026-10-10T15:36:25.545Z", "description": "Carrelage grès cérame 60x60", "minimum_stock": "20", "purchase_price": "22"}	{"id": 22, "unit": "m2", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:36:25.545Z", "updated_at": "2026-10-10T15:36:43.143Z", "description": "Carrelage grès cérame 60x60", "minimum_stock": "20", "purchase_price": "22"}	\N	2026-10-10 15:36:43.149+00
485	13	\N	21	create	material	23	\N	{"id": 23, "unit": "seau", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:37:51.578Z", "updated_at": "2026-10-10T15:37:51.578Z", "description": "Peinture acrylique blanche mate – 10 L", "minimum_stock": "5", "purchase_price": "45"}	\N	2026-10-10 15:37:51.594+00
486	13	\N	21	create	service	3	\N	{"id": 3, "unit": "m2", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:42:48.342Z", "updated_at": "2026-10-10T15:42:48.342Z", "category_id": 10, "description": "test_1", "price_excl_vat": "20", "default_vat_rate": "20"}	\N	2026-10-10 15:42:48.35+00
487	13	\N	21	set_recipe	service	3	\N	{"items": [{"material_id": 22, "quantity_per_unit": "3"}, {"material_id": 20, "quantity_per_unit": "2"}, {"material_id": 18, "quantity_per_unit": "4"}]}	\N	2026-10-10 15:43:18.848+00
488	1	\N	2	create	material	24	\N	{"id": 24, "unit": "sac", "is_active": true, "tenant_id": 1, "created_at": "2026-10-10T15:43:27.967Z", "updated_at": "2026-10-10T15:43:27.967Z", "description": "TEST Stock initial", "minimum_stock": "10", "purchase_price": "6"}	\N	2026-10-10 15:43:27.972+00
489	1	\N	2	adjustment	stock_movement	21	\N	{"id": 21, "note": "Stock initial", "type": "adjustment", "quantity": "50", "report_id": null, "tenant_id": 1, "created_at": "2026-10-10T15:43:28.298Z", "created_by": 2, "project_id": null, "unit_price": "6", "material_id": 24, "movement_date": "2026-10-10T00:00:00.000Z", "purchase_invoice_id": null}	\N	2026-10-10 15:43:28.309+00
490	1	\N	2	import	import_batch	1	\N	{"type": "materials", "file_name": "Flle 1.xlsx", "row_count": 29, "error_count": 0, "created_count": 29, "updated_count": 0}	\N	2026-10-10 17:32:00.446+00
491	1	\N	2	import	import_batch	2	\N	{"type": "stock", "file_name": "Flle 1 (1).xlsx", "row_count": 36, "error_count": 0, "created_count": 36, "updated_count": 0}	\N	2026-10-10 17:34:12.857+00
492	13	\N	21	create	supplier	4	\N	{"id": 4, "name": "Ayoub", "email": "Ayoub@gmai.com", "phone": "+1234567890", "address": "mokhtareAhmed", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T17:48:09.154Z", "updated_at": "2026-10-10T17:48:09.154Z", "vat_number": "2013"}	\N	2026-10-10 17:48:09.165+00
493	13	\N	21	create	purchase_invoice	28	\N	{"id": 28, "type": "supplier", "number": "PUR-2026-0002", "status": "to_pay", "paid_at": null, "due_date": "2026-04-27T00:00:00.000Z", "vat_rate": "20", "tenant_id": 13, "created_at": "2026-10-10T17:48:58.280Z", "created_by": 21, "issue_date": "2026-04-19T00:00:00.000Z", "project_id": null, "updated_at": "2026-10-10T17:48:58.280Z", "vat_amount": "4000", "supplier_id": 4, "cost_type_id": 1, "amount_excl_vat": "20000", "amount_incl_vat": "24000", "external_number": "123121", "payment_reference": "234234234", "subcontractor_contract_id": null}	\N	2026-10-10 17:48:58.312+00
494	13	\N	21	import	import_batch	3	\N	{"type": "stock", "file_name": "Flle 1 (2).xlsx", "row_count": 16, "error_count": 0, "created_count": 16, "updated_count": 0}	\N	2026-10-10 17:52:02.784+00
495	1	\N	1	create	conversation	17	\N	{"id": 17, "type": "internal", "members": [{"user_id": 1, "client_id": null, "joined_at": "2026-10-10T17:57:00.205Z", "admin_user_id": null}, {"user_id": 4, "client_id": null, "joined_at": "2026-10-10T17:57:00.205Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-10T17:57:00.175Z", "project_id": null, "is_archived": false, "support_ticket_id": null}	\N	2026-10-10 17:57:00.253+00
496	13	\N	21	create	client	8	\N	{"id": 8, "city": "bardo", "name": "Eya Jarray", "note": null, "type": "individual", "email": "eyajarraya771@gmail.com", "phone": "+21299403927", "country": "FR", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T17:59:19.935Z", "updated_at": "2026-10-10T17:59:19.935Z", "vat_number": "2010", "postal_code": "50 000", "contact_name": "Eya jarraya", "address_line1": "tunis bardo romana", "address_line2": null, "phone_secondary": "+21299403927"}	\N	2026-10-10 17:59:19.961+00
497	13	\N	21	create	project	17	\N	{"id": 17, "city": "tunis - bardo", "name": "Renovation", "status": "prospect", "end_date": "2026-10-28T00:00:00.000Z", "client_id": 8, "tenant_id": 13, "created_at": "2026-10-10T18:00:14.523Z", "created_by": 21, "manager_id": 21, "start_date": "2026-10-16T00:00:00.000Z", "updated_at": "2026-10-10T18:00:14.523Z", "description": "test Renovation", "postal_code": "50 000", "address_line1": "Bardo - Romana", "address_line2": null, "actual_end_date": null}	\N	2026-10-10 18:00:14.548+00
552	12	1	\N	dev_time_travel	subscription	12	\N	{"days": 5}	::1	2026-10-10 19:44:26.997+00
553	\N	1	\N	dev_run_job	job	\N	\N	\N	::1	2026-10-10 19:44:27.196+00
498	13	\N	21	create	task	10	\N	{"id": 10, "type": "work", "title": "test_1", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 13, "created_at": "2026-10-10T18:00:32.450Z", "created_by": 21, "project_id": 17, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-10T18:00:32.450Z", "assignee_ids": []}	\N	2026-10-10 18:00:32.473+00
499	13	\N	21	create	user_invitation	7	\N	{"id": 7, "name": "test_10", "email": "test_10@gmail.com", "role_id": 5, "tenant_id": 13, "created_at": "2026-10-10T18:01:02.787Z", "expires_at": "2026-10-17T18:01:02.785Z", "invited_by": 21, "accepted_at": null, "invited_by_admin_user_id": null}	\N	2026-10-10 18:01:03.236+00
500	13	\N	21	create	quote	28	\N	{"id": 28, "note": null, "lines": [], "number": "QUO-2026-0001", "status": "draft", "sent_at": null, "client_id": 8, "tenant_id": 13, "created_at": "2026-10-10T18:07:42.917Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "refused_at": null, "updated_at": "2026-10-10T18:07:42.943Z", "vat_amount": "0", "accepted_at": null, "valid_until": "2026-10-23T00:00:00.000Z", "amount_excl_vat": "0", "amount_incl_vat": "0", "default_vat_rate": "21"}	\N	2026-10-10 18:07:42.959+00
501	13	\N	21	set_lines	quote	28	\N	{"id": 28, "note": null, "lines": [{"id": 36, "unit": "m2", "position": 0, "quantity": "1", "quote_id": 28, "vat_rate": "21", "tenant_id": 13, "service_id": null, "description": "test", "total_excl_vat": "25", "unit_price_excl_vat": "25"}], "number": "QUO-2026-0001", "status": "draft", "sent_at": null, "client_id": 8, "tenant_id": 13, "created_at": "2026-10-10T18:07:42.917Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "refused_at": null, "updated_at": "2026-10-10T18:09:27.829Z", "vat_amount": "5.25", "accepted_at": null, "valid_until": "2026-10-23T00:00:00.000Z", "amount_excl_vat": "25", "amount_incl_vat": "30.25", "default_vat_rate": "21"}	\N	2026-10-10 18:09:27.842+00
502	13	\N	21	upload	media	73	\N	{"id": 73, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/quote/28/QUO-2026-0001_d8j5SwzJP.pdf", "entity_id": 28, "file_name": "QUO-2026-0001.pdf", "file_size": 2912, "file_type": "application/pdf", "is_locked": true, "tenant_id": 13, "created_at": "2026-10-10T18:09:37.735Z", "deleted_at": null, "updated_at": "2026-10-10T18:09:37.735Z", "entity_type": "quote", "uploaded_by": 21}	\N	2026-10-10 18:09:37.749+00
503	13	\N	21	send	quote	28	{"status": "draft"}	{"status": "sent"}	\N	2026-10-10 18:09:37.779+00
504	13	\N	21	create	conversation	18	\N	{"id": 18, "type": "project_client", "members": [{"user_id": null, "client_id": 8, "joined_at": "2026-10-10T18:10:54.932Z", "admin_user_id": null}, {"user_id": 21, "client_id": null, "joined_at": "2026-10-10T18:10:54.932Z", "admin_user_id": null}], "tenant_id": 13, "created_at": "2026-10-10T18:10:54.925Z", "project_id": 17, "is_archived": false, "support_ticket_id": null}	\N	2026-10-10 18:10:54.963+00
505	13	\N	21	generate	portal_token	11	\N	{"expires_at": "2027-01-08T18:10:54.968Z", "project_id": 17, "replaced_previous_link": false}	\N	2026-10-10 18:10:54.996+00
506	1	\N	1	create	user	22	\N	{"id": 22, "name": "TEST Ouvrier sans email", "email": null, "phone": null, "role_id": 5, "is_active": true, "tenant_id": 1, "created_at": "2026-10-10T18:20:07.927Z", "login_code": "46763517", "updated_at": "2026-10-10T18:20:07.927Z", "hourly_rate": "0", "email_verified_at": null, "must_change_password": "[redacted]"}	\N	2026-10-10 18:20:07.942+00
507	1	\N	1	create	user	23	\N	{"id": 23, "name": "TEST Direct Manager", "email": "test.direct.1791656407@chantieros.local", "phone": null, "role_id": 2, "is_active": true, "tenant_id": 1, "created_at": "2026-10-10T18:20:08.982Z", "login_code": null, "updated_at": "2026-10-10T18:20:08.982Z", "hourly_rate": "0", "email_verified_at": null, "must_change_password": "[redacted]"}	\N	2026-10-10 18:20:08.987+00
508	1	\N	2	create	conversation	19	\N	{"id": 19, "type": "project_client", "members": [{"user_id": null, "client_id": 7, "joined_at": "2026-10-10T18:34:07.599Z", "admin_user_id": null}, {"user_id": 2, "client_id": null, "joined_at": "2026-10-10T18:34:07.599Z", "admin_user_id": null}], "tenant_id": 1, "created_at": "2026-10-10T18:34:07.584Z", "project_id": 16, "is_archived": false, "support_ticket_id": null}	\N	2026-10-10 18:34:07.635+00
509	1	\N	2	generate	portal_token	12	\N	{"expires_at": "2027-01-08T18:34:07.643Z", "project_id": 16, "replaced_previous_link": false}	\N	2026-10-10 18:34:07.667+00
510	1	\N	\N	upload	media	74	\N	{"id": 74, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-portal-doc_u41oNEfcp.pdf", "entity_id": 0, "file_name": "TEST-portal-doc.pdf", "file_size": 45, "file_type": "application/pdf", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-10T18:34:16.506Z", "deleted_at": null, "updated_at": "2026-10-10T18:34:16.506Z", "entity_type": "message", "uploaded_by": null}	\N	2026-10-10 18:34:16.515+00
511	1	\N	\N	upload	media	75	\N	{"id": 75, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-portal-photo_lNwDxIzXW.png", "entity_id": 0, "file_name": "TEST-portal-photo.png", "file_size": 69, "file_type": "image/png", "is_locked": false, "tenant_id": 1, "created_at": "2026-10-10T18:34:17.334Z", "deleted_at": null, "updated_at": "2026-10-10T18:34:17.334Z", "entity_type": "message", "uploaded_by": null}	\N	2026-10-10 18:34:17.34+00
512	1	\N	2	set_lines	quote	26	\N	{"id": 26, "note": null, "lines": [{"id": 37, "unit": "pc", "position": 0, "quantity": "1", "quote_id": 26, "vat_rate": "21", "tenant_id": 1, "service_id": 150, "description": "TEST DOC logo line", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0024", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T13:03:56.317Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-10T18:43:44.108Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-10 18:43:44.137+00
513	1	\N	2	set_lines	quote	26	\N	{"id": 26, "note": null, "lines": [{"id": 38, "unit": "pc", "position": 0, "quantity": "1", "quote_id": 26, "vat_rate": "21", "tenant_id": 1, "service_id": null, "description": "TEST DOC logo line", "total_excl_vat": "10", "unit_price_excl_vat": "10"}], "number": "QUO-2026-0024", "status": "draft", "sent_at": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T13:03:56.317Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 4, "refused_at": null, "updated_at": "2026-10-10T18:43:44.453Z", "vat_amount": "2.1", "accepted_at": null, "valid_until": null, "amount_excl_vat": "10", "amount_incl_vat": "12.1", "default_vat_rate": "21"}	\N	2026-10-10 18:43:44.466+00
554	12	1	\N	dev_simulate_payment	subscription	12	\N	{"result": "failed"}	::1	2026-10-10 19:44:27.697+00
514	1	\N	8	set_lines	invoice	6	\N	{"id": 6, "note": "INTERNAL invoice draft", "lines": [{"id": 10, "unit": "pc", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 6, "service_id": 203, "description": "TEST invoice work", "total_excl_vat": "200", "unit_price_excl_vat": "200"}], "number": "INV-2026-0006", "status": "draft", "sent_at": null, "due_date": "2026-11-08T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:05.292Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "updated_at": "2026-10-10T18:44:02.081Z", "vat_amount": "42", "reminder_count": 0, "amount_excl_vat": "200", "amount_incl_vat": "242", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-10 18:44:02.09+00
515	1	\N	8	set_lines	invoice	6	\N	{"id": 6, "note": "INTERNAL invoice draft", "lines": [{"id": 11, "unit": "pc", "position": 1, "quantity": "1", "vat_rate": "21", "tenant_id": 1, "invoice_id": 6, "service_id": null, "description": "TEST invoice work", "total_excl_vat": "200", "unit_price_excl_vat": "200"}], "number": "INV-2026-0006", "status": "draft", "sent_at": null, "due_date": "2026-11-08T00:00:00.000Z", "quote_id": null, "client_id": 1, "tenant_id": 1, "created_at": "2026-10-09T00:01:05.292Z", "created_by": 1, "issue_date": "2026-10-09T00:00:00.000Z", "project_id": 14, "updated_at": "2026-10-10T18:44:02.400Z", "vat_amount": "42", "reminder_count": 0, "amount_excl_vat": "200", "amount_incl_vat": "242", "default_vat_rate": "21", "last_reminder_at": null}	\N	2026-10-10 18:44:02.42+00
516	13	\N	21	refuse	quote	28	{"status": "sent"}	{"status": "refused"}	\N	2026-10-10 18:57:15.246+00
517	13	\N	21	create	quote	29	\N	{"id": 29, "note": null, "lines": [], "number": "QUO-2026-0002", "status": "draft", "sent_at": null, "client_id": 8, "tenant_id": 13, "created_at": "2026-10-10T18:57:25.997Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "refused_at": null, "updated_at": "2026-10-10T18:57:26.014Z", "vat_amount": "0", "accepted_at": null, "valid_until": "2026-10-15T00:00:00.000Z", "amount_excl_vat": "0", "amount_incl_vat": "0", "default_vat_rate": "21"}	\N	2026-10-10 18:57:26.036+00
518	13	\N	21	set_lines	quote	29	\N	{"id": 29, "note": null, "lines": [{"id": 39, "unit": "h", "position": 0, "quantity": "1", "quote_id": 29, "vat_rate": "6", "tenant_id": 13, "service_id": 1801, "description": "Main-d’œuvre démolition — salle de bain", "total_excl_vat": "46", "unit_price_excl_vat": "46"}, {"id": 40, "unit": "h", "position": 1, "quantity": "1", "quote_id": 29, "vat_rate": "6", "tenant_id": 13, "service_id": 1800, "description": "Main-d’œuvre démolition — standard", "total_excl_vat": "42.12", "unit_price_excl_vat": "42.12"}, {"id": 41, "unit": "ml", "position": 2, "quantity": "1", "quote_id": 29, "vat_rate": "21", "tenant_id": 13, "service_id": 1779, "description": "Plinthes bois — premium", "total_excl_vat": "16.41", "unit_price_excl_vat": "16.41"}], "number": "QUO-2026-0002", "status": "draft", "sent_at": null, "client_id": 8, "tenant_id": 13, "created_at": "2026-10-10T18:57:25.997Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "refused_at": null, "updated_at": "2026-10-10T18:57:57.504Z", "vat_amount": "8.74", "accepted_at": null, "valid_until": "2026-10-15T00:00:00.000Z", "amount_excl_vat": "104.53", "amount_incl_vat": "113.27", "default_vat_rate": "21"}	\N	2026-10-10 18:57:57.512+00
519	13	\N	21	upload	media	76	\N	{"id": 76, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/quote/29/QUO-2026-0002_x6iE_rMOd.pdf", "entity_id": 29, "file_name": "QUO-2026-0002.pdf", "file_size": 3291, "file_type": "application/pdf", "is_locked": true, "tenant_id": 13, "created_at": "2026-10-10T18:58:02.645Z", "deleted_at": null, "updated_at": "2026-10-10T18:58:02.645Z", "entity_type": "quote", "uploaded_by": 21}	\N	2026-10-10 18:58:02.659+00
520	13	\N	21	send	quote	29	{"status": "draft"}	{"status": "sent"}	\N	2026-10-10 18:58:02.682+00
521	13	\N	21	create_reservations	project	17	\N	{"materials": []}	\N	2026-10-10 18:58:42.829+00
522	13	\N	21	accept	quote	29	{"status": "sent"}	{"status": "accepted", "project_id": 17}	\N	2026-10-10 18:58:42.843+00
523	13	\N	21	revoke	user_invitation	7	{"id": 7, "name": "test_10", "email": "test_10@gmail.com", "role_id": 5, "tenant_id": 13, "created_at": "2026-10-10T18:01:02.787Z", "expires_at": "2026-10-17T18:01:02.785Z", "invited_by": 21, "accepted_at": null, "invited_by_admin_user_id": null}	\N	\N	2026-10-10 19:11:43.225+00
524	13	\N	21	set_assignees	task	10	{"assignee_ids": []}	{"assignee_ids": [21]}	\N	2026-10-10 19:12:38.931+00
525	13	\N	21	update	task	10	{"id": 10, "type": "work", "title": "test_1", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 13, "created_at": "2026-10-10T18:00:32.450Z", "created_by": 21, "project_id": 17, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-10T18:00:32.450Z", "assignee_ids": [21]}	{"id": 10, "type": "work", "title": "test_1", "status": "planned", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 13, "created_at": "2026-10-10T18:00:32.450Z", "created_by": 21, "project_id": 17, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-10T19:12:46.040Z", "assignee_ids": [21]}	\N	2026-10-10 19:12:46.055+00
526	13	\N	21	status_change	task	10	{"status": "planned"}	{"status": "in_progress"}	\N	2026-10-10 19:12:55.211+00
527	13	\N	21	create	time_entry	16	\N	{"id": 16, "hours": "20", "comment": null, "task_id": 10, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-11T00:00:00.000Z", "created_at": "2026-10-10T19:13:15.420Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:13:15.420Z", "hourly_rate": "0"}	\N	2026-10-10 19:13:15.45+00
528	13	\N	21	create	subcontractor	5	\N	{"id": 5, "email": "zoizouzakaria32@gmail.com", "phone": "123456789", "trade": "plomp", "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T19:23:01.469Z", "updated_at": "2026-10-10T19:23:01.469Z", "vat_number": "2000", "hourly_rate": "20", "company_name": "test_socity"}	\N	2026-10-10 19:23:01.498+00
529	13	\N	21	create	subcontractor_contract	4	\N	{"id": 4, "status": "in_progress", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 13, "created_at": "2026-10-10T19:23:25.663Z", "created_by": 21, "project_id": 17, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-10T19:23:25.663Z", "description": "adf", "amount_excl_vat": "1000", "subcontractor_id": 5}	\N	2026-10-10 19:23:25.692+00
530	13	\N	21	status_change	subcontractor_contract	4	{"status": "in_progress"}	{"status": "completed"}	\N	2026-10-10 19:23:35.557+00
555	12	1	\N	dev_simulate_payment	subscription	12	\N	{"result": "succeeded"}	::1	2026-10-10 19:44:28.238+00
531	13	\N	21	update	subcontractor_contract	4	{"id": 4, "status": "completed", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 13, "created_at": "2026-10-10T19:23:25.663Z", "created_by": 21, "project_id": 17, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-10T19:23:35.538Z", "description": "adf", "amount_excl_vat": "1000", "subcontractor_id": 5}	{"id": 4, "status": "completed", "end_date": "2026-10-10T00:00:00.000Z", "tenant_id": 13, "created_at": "2026-10-10T19:23:25.663Z", "created_by": 21, "project_id": 17, "start_date": "2026-10-10T00:00:00.000Z", "updated_at": "2026-10-10T19:24:42.466Z", "description": "adf", "amount_excl_vat": "70", "subcontractor_id": 5}	\N	2026-10-10 19:24:42.489+00
532	13	\N	21	create	purchase_invoice	29	\N	{"id": 29, "type": "supplier", "number": "PUR-2026-0003", "status": "to_pay", "paid_at": null, "due_date": "2026-10-10T00:00:00.000Z", "vat_rate": "10", "tenant_id": 13, "created_at": "2026-10-10T19:25:43.106Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "updated_at": "2026-10-10T19:25:43.106Z", "vat_amount": "7", "supplier_id": 4, "cost_type_id": 5, "amount_excl_vat": "70", "amount_incl_vat": "77", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-10 19:25:43.15+00
533	13	\N	21	update	purchase_invoice	29	{"id": 29, "type": "supplier", "number": "PUR-2026-0003", "status": "to_pay", "paid_at": null, "due_date": "2026-10-10T00:00:00.000Z", "vat_rate": "10", "tenant_id": 13, "created_at": "2026-10-10T19:25:43.106Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "updated_at": "2026-10-10T19:25:43.106Z", "vat_amount": "7", "supplier_id": 4, "cost_type_id": 5, "amount_excl_vat": "70", "amount_incl_vat": "77", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	{"id": 29, "type": "supplier", "number": "PUR-2026-0003", "status": "to_pay", "paid_at": null, "due_date": "2026-10-10T00:00:00.000Z", "vat_rate": "10", "tenant_id": 13, "created_at": "2026-10-10T19:25:43.106Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "updated_at": "2026-10-10T19:26:01.573Z", "vat_amount": "7", "supplier_id": 4, "cost_type_id": 5, "amount_excl_vat": "70", "amount_incl_vat": "77", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-10 19:26:01.621+00
534	13	\N	21	mark_paid	purchase_invoice	29	{"status": "to_pay"}	{"status": "paid", "paid_at": "2026-10-10T19:26:03.803Z", "payment_reference": null}	\N	2026-10-10 19:26:03.845+00
535	13	\N	21	update	purchase_invoice	29	{"id": 29, "type": "supplier", "number": "PUR-2026-0003", "status": "paid", "paid_at": "2026-10-10T19:26:03.803Z", "due_date": "2026-10-10T00:00:00.000Z", "vat_rate": "10", "tenant_id": 13, "created_at": "2026-10-10T19:25:43.106Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "updated_at": "2026-10-10T19:26:03.812Z", "vat_amount": "7", "supplier_id": 4, "cost_type_id": 5, "amount_excl_vat": "70", "amount_incl_vat": "77", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	{"id": 29, "type": "supplier", "number": "PUR-2026-0003", "status": "paid", "paid_at": "2026-10-10T19:26:03.803Z", "due_date": "2026-10-10T00:00:00.000Z", "vat_rate": "10", "tenant_id": 13, "created_at": "2026-10-10T19:25:43.106Z", "created_by": 21, "issue_date": "2026-10-10T00:00:00.000Z", "project_id": 17, "updated_at": "2026-10-10T19:26:05.257Z", "vat_amount": "7", "supplier_id": 4, "cost_type_id": 5, "amount_excl_vat": "70", "amount_incl_vat": "77", "external_number": null, "payment_reference": null, "subcontractor_contract_id": null}	\N	2026-10-10 19:26:05.273+00
536	13	\N	21	status_change	task	10	{"status": "in_progress"}	{"status": "completed"}	\N	2026-10-10 19:33:48.237+00
537	13	\N	21	update	time_entry	16	{"id": 16, "hours": "20", "comment": null, "task_id": 10, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-11T00:00:00.000Z", "created_at": "2026-10-10T19:13:15.420Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:13:15.420Z", "hourly_rate": "0"}	{"id": 16, "hours": "20", "comment": "", "task_id": 10, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-11T00:00:00.000Z", "created_at": "2026-10-10T19:13:15.420Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:34:16.500Z", "hourly_rate": "0"}	\N	2026-10-10 19:34:16.514+00
538	13	\N	21	update	time_entry	16	{"id": 16, "hours": "20", "comment": "", "task_id": 10, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-11T00:00:00.000Z", "created_at": "2026-10-10T19:13:15.420Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:34:16.500Z", "hourly_rate": "0"}	{"id": 16, "hours": "15", "comment": "", "task_id": 10, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-11T00:00:00.000Z", "created_at": "2026-10-10T19:13:15.420Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:34:31.616Z", "hourly_rate": "0"}	\N	2026-10-10 19:34:31.627+00
539	13	\N	21	update	time_entry	16	{"id": 16, "hours": "15", "comment": "", "task_id": 10, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-11T00:00:00.000Z", "created_at": "2026-10-10T19:13:15.420Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:34:31.616Z", "hourly_rate": "0"}	{"id": 16, "hours": "4", "comment": "", "task_id": 10, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-11T00:00:00.000Z", "created_at": "2026-10-10T19:13:15.420Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:34:57.666Z", "hourly_rate": "0"}	\N	2026-10-10 19:34:57.675+00
540	12	1	\N	dev_time_travel	subscription	12	\N	{"days": 11}	::1	2026-10-10 19:35:42.347+00
541	\N	1	\N	dev_run_job	job	\N	\N	\N	::1	2026-10-10 19:35:42.929+00
542	12	1	\N	dev_time_travel	subscription	12	\N	{"days": 3}	::1	2026-10-10 19:35:50.984+00
543	\N	1	\N	dev_run_job	job	\N	\N	\N	::1	2026-10-10 19:35:51.577+00
544	12	1	\N	dev_time_travel	subscription	12	\N	{"days": 7}	::1	2026-10-10 19:36:15.352+00
545	\N	1	\N	dev_run_job	job	\N	\N	\N	::1	2026-10-10 19:36:15.561+00
546	12	1	\N	dev_time_travel	subscription	12	\N	{"days": 30}	::1	2026-10-10 19:36:25.258+00
547	\N	1	\N	dev_run_job	job	\N	\N	\N	::1	2026-10-10 19:36:25.389+00
548	12	1	\N	dev_simulate_payment	subscription	12	\N	{"result": "succeeded"}	::1	2026-10-10 19:36:25.519+00
549	12	1	\N	dev_simulate_payment	subscription	12	\N	{"result": "failed"}	::1	2026-10-10 19:44:25.742+00
550	12	1	\N	dev_time_travel	subscription	12	\N	{"days": 2}	::1	2026-10-10 19:44:26.11+00
551	12	1	\N	dev_simulate_payment	subscription	12	\N	{"result": "failed"}	::1	2026-10-10 19:44:26.518+00
556	13	\N	21	update	user	21	{"id": 21, "name": "ziko", "email": "zoizouzakaria32@gmail.com", "phone": null, "role_id": 1, "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:08:41.356Z", "login_code": null, "updated_at": "2026-10-10T15:08:41.356Z", "hourly_rate": "0", "email_verified_at": null, "must_change_password": "[redacted]"}	{"id": 21, "name": "ziko", "email": "zoizouzakaria32@gmail.com", "phone": null, "role_id": 1, "is_active": true, "tenant_id": 13, "created_at": "2026-10-10T15:08:41.356Z", "login_code": null, "updated_at": "2026-10-10T19:46:10.635Z", "hourly_rate": "20", "email_verified_at": null, "must_change_password": "[redacted]"}	\N	2026-10-10 19:46:10.657+00
557	13	\N	21	create	time_entry	17	\N	{"id": 17, "hours": "3", "comment": null, "task_id": null, "user_id": 21, "tenant_id": 13, "work_date": "2026-10-10T00:00:00.000Z", "created_at": "2026-10-10T19:46:39.441Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:46:39.441Z", "hourly_rate": "20"}	\N	2026-10-10 19:46:39.452+00
558	13	\N	21	create	report	8	\N	{"id": 8, "note": null, "weather": "20", "tenant_id": 13, "created_at": "2026-10-10T19:50:16.936Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:50:16.936Z", "report_date": "2026-10-10T00:00:00.000Z", "progress_pct": 20}	\N	2026-10-10 19:50:16.946+00
559	13	\N	21	declare_materials	report	8	\N	{"items": [{"quantity": "-73.19", "unit_price": "115", "material_id": 11, "movement_id": 103}], "service_id": 1797}	\N	2026-10-10 19:50:37.549+00
560	13	\N	21	update	report	8	{"id": 8, "note": null, "weather": "20", "tenant_id": 13, "created_at": "2026-10-10T19:50:16.936Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:50:16.936Z", "report_date": "2026-10-10T00:00:00.000Z", "progress_pct": 20}	{"id": 8, "note": null, "weather": "20", "tenant_id": 13, "created_at": "2026-10-10T19:50:16.936Z", "created_by": 21, "project_id": 17, "updated_at": "2026-10-10T19:51:28.863Z", "report_date": "2026-10-10T00:00:00.000Z", "progress_pct": 14}	\N	2026-10-10 19:51:28.869+00
561	13	\N	21	adjustment	stock_movement	104	\N	{"id": 104, "note": "corrction", "type": "adjustment", "quantity": "73.19", "report_id": null, "tenant_id": 13, "created_at": "2026-10-10T19:54:13.437Z", "created_by": 21, "project_id": null, "unit_price": "115", "material_id": 11, "movement_date": "2026-10-10T00:00:00.000Z", "import_batch_id": null, "purchase_invoice_id": null}	\N	2026-10-10 19:54:13.443+00
562	13	1	\N	impersonate_enter	tenant	13	\N	{"impersonated_user_id": 21}	::1	2026-10-10 20:08:52.427+00
563	13	1	\N	impersonate_exit	tenant	13	\N	\N	::1	2026-10-10 20:09:10.086+00
564	13	\N	21	create	quote	30	\N	{"id": 30, "note": null, "lines": [], "number": "QUO-2026-0003", "status": "draft", "sent_at": null, "client_id": 8, "tenant_id": 13, "created_at": "2026-10-10T20:26:15.940Z", "created_by": 21, "issue_date": "2026-10-21T00:00:00.000Z", "project_id": 17, "refused_at": null, "updated_at": "2026-10-10T20:26:15.964Z", "vat_amount": "0", "accepted_at": null, "valid_until": "2026-11-05T00:00:00.000Z", "amount_excl_vat": "0", "amount_incl_vat": "0", "default_vat_rate": "21"}	\N	2026-10-10 20:26:15.986+00
565	13	\N	21	set_lines	quote	30	\N	{"id": 30, "note": null, "lines": [{"id": 42, "unit": "m2", "position": 0, "quantity": "1", "quote_id": 30, "vat_rate": "21", "tenant_id": 13, "service_id": 1788, "description": "Dépose carrelage — standard", "total_excl_vat": "18.35", "unit_price_excl_vat": "18.35"}, {"id": 43, "unit": "h", "position": 1, "quantity": "1", "quote_id": 30, "vat_rate": "6", "tenant_id": 13, "service_id": 1800, "description": "Main-d’œuvre démolition — standard", "total_excl_vat": "42.12", "unit_price_excl_vat": "42.12"}, {"id": 44, "unit": "m2", "position": 2, "quantity": "1", "quote_id": 30, "vat_rate": "21", "tenant_id": 13, "service_id": 1798, "description": "Décapage sol — cuisine", "total_excl_vat": "14.53", "unit_price_excl_vat": "14.53"}], "number": "QUO-2026-0003", "status": "draft", "sent_at": null, "client_id": 8, "tenant_id": 13, "created_at": "2026-10-10T20:26:15.940Z", "created_by": 21, "issue_date": "2026-10-21T00:00:00.000Z", "project_id": 17, "refused_at": null, "updated_at": "2026-10-10T20:26:44.096Z", "vat_amount": "9.43", "accepted_at": null, "valid_until": "2026-11-05T00:00:00.000Z", "amount_excl_vat": "75", "amount_incl_vat": "84.43", "default_vat_rate": "21"}	\N	2026-10-10 20:26:44.108+00
566	13	\N	21	upload	media	77	\N	{"id": 77, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/quote/30/QUO-2026-0003_QQKBcpi3e.pdf", "entity_id": 30, "file_name": "QUO-2026-0003.pdf", "file_size": 3281, "file_type": "application/pdf", "is_locked": true, "tenant_id": 13, "created_at": "2026-10-10T20:26:50.164Z", "deleted_at": null, "updated_at": "2026-10-10T20:26:50.164Z", "entity_type": "quote", "uploaded_by": 21}	\N	2026-10-10 20:26:50.19+00
567	13	\N	21	send	quote	30	{"status": "draft"}	{"status": "sent"}	\N	2026-10-10 20:26:50.229+00
568	13	\N	21	refuse	quote	30	{"status": "sent"}	{"status": "refused"}	\N	2026-10-10 20:27:56.606+00
569	13	\N	21	upload	media	78	\N	{"id": 78, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/project/17/ChantierOS_AUDIT_HANDOVER_RQd4QCPEj.pdf", "entity_id": 17, "file_name": "ChantierOS AUDIT HANDOVER.pdf", "file_size": 245039, "file_type": "application/pdf", "is_locked": false, "tenant_id": 13, "created_at": "2026-10-10T20:33:24.706Z", "deleted_at": null, "updated_at": "2026-10-10T20:33:24.706Z", "entity_type": "project", "uploaded_by": 21}	\N	2026-10-10 20:33:24.73+00
570	13	\N	21	upload	media	79	\N	{"id": 79, "file_url": "https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/project/17/contrat_Contrat_de_formation__Normale___2__Gdxn96dUs.pdf", "entity_id": 17, "file_name": "contrat_Contrat_de_formation_(Normale) (2).pdf", "file_size": 1221377, "file_type": "application/pdf", "is_locked": false, "tenant_id": 13, "created_at": "2026-10-10T20:33:26.426Z", "deleted_at": null, "updated_at": "2026-10-10T20:33:26.426Z", "entity_type": "project", "uploaded_by": 21}	\N	2026-10-10 20:33:26.454+00
571	13	\N	21	revoke	portal_token	\N	\N	{"project_id": 17}	\N	2026-10-10 20:34:10.244+00
572	13	\N	21	generate	portal_token	13	\N	{"expires_at": "2027-01-08T20:34:14.050Z", "project_id": 17, "replaced_previous_link": false}	\N	2026-10-10 20:34:14.076+00
573	1	\N	5	create	time_entry	18	\N	{"id": 18, "hours": "3", "comment": null, "task_id": 2, "user_id": 5, "tenant_id": 1, "work_date": "2026-10-10T00:00:00.000Z", "created_at": "2026-10-10T20:51:21.747Z", "created_by": 5, "project_id": 4, "updated_at": "2026-10-10T20:51:21.747Z", "hourly_rate": "20"}	\N	2026-10-10 20:51:21.762+00
574	1	\N	1	update	user	23	{"id": 23, "name": "TEST Direct Manager", "email": "test.direct.1791656407@chantieros.local", "phone": null, "role_id": 2, "is_active": true, "tenant_id": 1, "created_at": "2026-10-10T18:20:08.982Z", "login_code": null, "updated_at": "2026-10-10T18:20:09.519Z", "hourly_rate": "0", "email_verified_at": null, "must_change_password": "[redacted]"}	{"id": 23, "name": "TEST Direct Manager", "email": "test.direct.1791656407@chantieros.local", "phone": null, "role_id": 2, "is_active": true, "tenant_id": 1, "created_at": "2026-10-10T18:20:08.982Z", "login_code": null, "updated_at": "2026-10-10T20:53:09.732Z", "hourly_rate": "0", "email_verified_at": null, "must_change_password": "[redacted]"}	\N	2026-10-10 20:53:09.753+00
575	13	1	\N	set_pending_plan	subscription	13	\N	{"plan_id": 3}	::1	2026-10-11 12:26:19.668+00
576	13	1	\N	set_pending_plan	subscription	13	\N	{"plan_id": 5}	::1	2026-10-11 12:26:31.404+00
577	13	1	\N	set_pending_plan	subscription	13	\N	{"plan_id": 1}	::1	2026-10-11 12:26:41.762+00
578	13	1	\N	set_pending_plan	subscription	13	\N	{"plan_id": 5}	::1	2026-10-11 12:26:48.34+00
\.


--
-- Data for Name: billing_usage_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_usage_snapshots (id, tenant_id, period_start, period_end, snapshot_taken_at, feature_key, actual_count, included_allowance, overage_rate, overage_amount, stripe_invoice_id) FROM stdin;
1	1	2026-10-09 13:43:47.759+00	2026-11-09 13:43:47.759+00	2026-10-09 13:44:16.837+00	max_clients	4.000	3	1.00	1.00	\N
2	1	2026-10-09 13:43:47.759+00	2026-11-09 13:43:47.759+00	2026-10-09 13:44:16.837+00	max_managers	6.000	3	5.00	15.00	\N
3	1	2026-10-09 13:43:47.759+00	2026-11-09 13:43:47.759+00	2026-10-09 13:44:16.837+00	max_subcontractors	3.000	2	1.00	1.00	\N
4	1	2026-10-09 13:43:47.759+00	2026-11-09 13:43:47.759+00	2026-10-09 13:44:16.837+00	max_workers	2.000	2	2.00	0.00	\N
5	1	2026-10-09 13:43:47.759+00	2026-11-09 13:43:47.759+00	2026-10-09 13:44:16.837+00	storage_gb	0.000	1	0.50	0.00	\N
6	1	2026-11-09 13:43:47.759+00	2026-12-09 13:43:47.759+00	2026-10-09 13:44:55.431+00	max_clients	4.000	3	1.00	1.00	\N
7	1	2026-11-09 13:43:47.759+00	2026-12-09 13:43:47.759+00	2026-10-09 13:44:55.431+00	max_managers	5.000	3	5.00	10.00	\N
8	1	2026-11-09 13:43:47.759+00	2026-12-09 13:43:47.759+00	2026-10-09 13:44:55.431+00	max_subcontractors	3.000	2	1.00	1.00	\N
9	1	2026-11-09 13:43:47.759+00	2026-12-09 13:43:47.759+00	2026-10-09 13:44:55.431+00	max_workers	2.000	2	2.00	0.00	\N
10	1	2026-11-09 13:43:47.759+00	2026-12-09 13:43:47.759+00	2026-10-09 13:44:55.431+00	storage_gb	0.000	1	0.50	0.00	\N
11	1	2026-12-09 13:43:47.759+00	2027-01-09 13:43:47.759+00	2026-10-09 13:44:57.915+00	max_clients	4.000	3	1.00	1.00	\N
12	1	2026-12-09 13:43:47.759+00	2027-01-09 13:43:47.759+00	2026-10-09 13:44:57.915+00	max_managers	5.000	3	5.00	10.00	\N
13	1	2026-12-09 13:43:47.759+00	2027-01-09 13:43:47.759+00	2026-10-09 13:44:57.915+00	max_subcontractors	3.000	2	1.00	1.00	\N
14	1	2026-12-09 13:43:47.759+00	2027-01-09 13:43:47.759+00	2026-10-09 13:44:57.915+00	max_workers	2.000	2	2.00	0.00	\N
15	1	2026-12-09 13:43:47.759+00	2027-01-09 13:43:47.759+00	2026-10-09 13:44:57.915+00	storage_gb	0.000	1	0.50	0.00	\N
16	2	2026-10-08 22:12:24.814+00	2026-10-22 22:12:24.814+00	2026-10-09 13:45:35.376+00	max_clients	1.000	3	1.00	0.00	\N
17	2	2026-10-08 22:12:24.814+00	2026-10-22 22:12:24.814+00	2026-10-09 13:45:35.376+00	max_managers	1.000	3	5.00	0.00	\N
18	2	2026-10-08 22:12:24.814+00	2026-10-22 22:12:24.814+00	2026-10-09 13:45:35.376+00	max_subcontractors	0.000	2	1.00	0.00	\N
19	2	2026-10-08 22:12:24.814+00	2026-10-22 22:12:24.814+00	2026-10-09 13:45:35.376+00	max_workers	1.000	2	2.00	0.00	\N
20	2	2026-10-08 22:12:24.814+00	2026-10-22 22:12:24.814+00	2026-10-09 13:45:35.376+00	storage_gb	0.000	1	0.50	0.00	\N
21	1	2027-01-09 13:43:47.759+00	2027-02-09 14:43:47.759+00	2026-10-09 13:45:36.982+00	max_clients	4.000	3	1.00	1.00	\N
22	1	2027-01-09 13:43:47.759+00	2027-02-09 14:43:47.759+00	2026-10-09 13:45:36.982+00	max_managers	6.000	3	5.00	15.00	\N
23	1	2027-01-09 13:43:47.759+00	2027-02-09 14:43:47.759+00	2026-10-09 13:45:36.982+00	max_subcontractors	3.000	2	1.00	1.00	\N
24	1	2027-01-09 13:43:47.759+00	2027-02-09 14:43:47.759+00	2026-10-09 13:45:36.982+00	max_workers	2.000	2	2.00	0.00	\N
25	1	2027-01-09 13:43:47.759+00	2027-02-09 14:43:47.759+00	2026-10-09 13:45:36.982+00	storage_gb	0.000	1	0.50	0.00	\N
26	1	2026-10-09 16:51:01.054+00	2026-11-09 16:51:01.054+00	2026-10-09 17:20:02.805+00	max_clients	5.000	3	1.00	2.00	\N
27	1	2026-10-09 16:51:01.054+00	2026-11-09 16:51:01.054+00	2026-10-09 17:20:02.805+00	max_managers	6.000	3	5.00	15.00	\N
28	1	2026-10-09 16:51:01.054+00	2026-11-09 16:51:01.054+00	2026-10-09 17:20:02.805+00	max_subcontractors	4.000	2	1.00	2.00	\N
29	1	2026-10-09 16:51:01.054+00	2026-11-09 16:51:01.054+00	2026-10-09 17:20:02.805+00	max_workers	2.000	2	2.00	0.00	\N
30	1	2026-10-09 16:51:01.054+00	2026-11-09 16:51:01.054+00	2026-10-09 17:20:02.805+00	storage_gb	0.000	1	0.50	0.00	\N
41	12	2026-09-25 23:32:10.042+00	2026-10-09 23:32:10.042+00	2026-10-10 19:35:51.648+00	max_clients	0.000	3	1.00	0.00	\N
42	12	2026-09-25 23:32:10.042+00	2026-10-09 23:32:10.042+00	2026-10-10 19:35:51.648+00	max_managers	1.000	3	5.00	0.00	\N
43	12	2026-09-25 23:32:10.042+00	2026-10-09 23:32:10.042+00	2026-10-10 19:35:51.648+00	max_subcontractors	0.000	2	1.00	0.00	\N
44	12	2026-09-25 23:32:10.042+00	2026-10-09 23:32:10.042+00	2026-10-10 19:35:51.648+00	max_workers	0.000	2	2.00	0.00	\N
45	12	2026-09-25 23:32:10.042+00	2026-10-09 23:32:10.042+00	2026-10-10 19:35:51.648+00	storage_gb	0.000	1	0.50	0.00	\N
46	13	2026-07-10 15:07:06+00	2026-07-24 15:07:06+00	2026-07-24 15:07:06+00	max_clients	1.000	3	1.00	0.00	\N
47	13	2026-07-10 15:07:06+00	2026-07-24 15:07:06+00	2026-07-24 15:07:06+00	max_managers	1.000	3	5.00	0.00	\N
48	13	2026-07-10 15:07:06+00	2026-07-24 15:07:06+00	2026-07-24 15:07:06+00	max_subcontractors	0.000	2	1.00	0.00	\N
49	13	2026-07-10 15:07:06+00	2026-07-24 15:07:06+00	2026-07-24 15:07:06+00	max_workers	0.000	2	2.00	0.00	\N
50	13	2026-07-10 15:07:06+00	2026-07-24 15:07:06+00	2026-07-24 15:07:06+00	storage_gb	0.000	1	0.50	0.00	\N
51	13	2026-07-24 15:07:06+00	2026-08-24 15:07:06+00	2026-08-24 15:07:06+00	max_clients	3.000	3	1.00	0.00	\N
52	13	2026-07-24 15:07:06+00	2026-08-24 15:07:06+00	2026-08-24 15:07:06+00	max_managers	2.000	3	5.00	0.00	\N
53	13	2026-07-24 15:07:06+00	2026-08-24 15:07:06+00	2026-08-24 15:07:06+00	max_subcontractors	1.000	2	1.00	0.00	\N
54	13	2026-07-24 15:07:06+00	2026-08-24 15:07:06+00	2026-08-24 15:07:06+00	max_workers	2.000	2	2.00	0.00	\N
55	13	2026-07-24 15:07:06+00	2026-08-24 15:07:06+00	2026-08-24 15:07:06+00	storage_gb	0.400	1	0.50	0.00	\N
56	13	2026-08-24 15:07:06+00	2026-09-24 15:07:06+00	2026-09-24 15:07:06+00	max_clients	5.000	3	1.00	2.00	\N
57	13	2026-08-24 15:07:06+00	2026-09-24 15:07:06+00	2026-09-24 15:07:06+00	max_managers	2.000	3	5.00	0.00	\N
58	13	2026-08-24 15:07:06+00	2026-09-24 15:07:06+00	2026-09-24 15:07:06+00	max_subcontractors	1.000	2	1.00	0.00	\N
59	13	2026-08-24 15:07:06+00	2026-09-24 15:07:06+00	2026-09-24 15:07:06+00	max_workers	3.000	2	2.00	2.00	\N
60	13	2026-08-24 15:07:06+00	2026-09-24 15:07:06+00	2026-09-24 15:07:06+00	storage_gb	0.800	1	0.50	0.00	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, tenant_id, name, is_active, created_at) FROM stdin;
1	\N	Painting	t	2026-10-08 22:10:07.883+00
2	\N	Tiling	t	2026-10-08 22:10:07.924+00
3	\N	Plumbing	t	2026-10-08 22:10:07.953+00
4	\N	Electricity	t	2026-10-08 22:10:07.974+00
5	\N	Masonry	t	2026-10-08 22:10:07.998+00
6	\N	Carpentry	t	2026-10-08 22:10:08.018+00
7	\N	Roofing	t	2026-10-08 22:10:08.05+00
8	\N	Insulation	t	2026-10-08 22:10:08.075+00
9	\N	Flooring	t	2026-10-08 22:10:08.093+00
10	\N	Demolition	t	2026-10-08 22:10:08.114+00
11	1	TEST Finishing 2	f	2026-10-08 23:22:16.001+00
12	1	TEST Finishing	t	2026-10-08 23:22:16.449+00
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, tenant_id, type, name, contact_name, email, phone, phone_secondary, vat_number, address_line1, address_line2, postal_code, city, country, note, is_active, created_at, updated_at) FROM stdin;
3	2	individual	TEST B Client	\N	gryehirir@gmail.com	+32 470 00 00 01	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-10-08 23:14:25.19+00	2026-10-08 23:14:25.19+00
4	1	individual	TEST Client Three	\N	gryehirir+three@gmail.com	+32 470 00 00 03	\N	\N	Rue Neuve 10	\N	1000	Brussels	BE	\N	t	2026-10-08 23:14:25.428+00	2026-10-08 23:14:25.428+00
2	1	professional	TEST Client Pro	\N	gryehirir+pro@gmail.com	+32 470 11 11 11	\N	BE0123456789	Rue Neuve 10	\N	1000	Brussels	BE	\N	t	2026-10-08 23:14:25.088+00	2026-10-08 23:14:32.1+00
5	1	individual	TEST Client Four	\N	gryehirir+four@gmail.com	+32 470 00 00 04	\N	\N	Rue Neuve 10	\N	1000	Brussels	BE	\N	f	2026-10-08 23:14:25.468+00	2026-10-08 23:14:32.162+00
6	1	individual	TEST Sales Client	\N	gryehirir+sales@gmail.com	+32 470 00 00 07	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-10-08 23:15:15.666+00	2026-10-08 23:15:15.666+00
1	1	individual	TEST Client Main	\N	gryehirir@gmail.com	+32 470 00 00 01	\N	\N	Rue Neuve 10	\N	1000	Brussels	BE	INTERNAL client note	t	2026-10-08 23:14:24.996+00	2026-10-08 23:14:24.996+00
7	1	individual	TEST Limit Client 5	\N	limit5@example.com	+32470123456	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-10-09 13:45:53.148+00	2026-10-09 13:45:53.148+00
8	13	individual	Eya Jarray	Eya jarraya	eyajarraya771@gmail.com	+21299403927	+21299403927	2010	tunis bardo romana	\N	50 000	bardo	FR	\N	t	2026-10-10 17:59:19.935+00	2026-10-10 17:59:19.935+00
\.


--
-- Data for Name: conversation_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation_members (id, tenant_id, conversation_id, user_id, client_id, admin_user_id, joined_at) FROM stdin;
1	1	1	1	\N	\N	2026-10-08 23:56:07.158+00
2	1	1	2	\N	\N	2026-10-08 23:56:07.158+00
3	1	1	3	\N	\N	2026-10-08 23:56:07.158+00
4	1	1	4	\N	\N	2026-10-08 23:56:07.789+00
8	1	4	2	\N	\N	2026-10-08 23:56:21.382+00
9	1	4	3	\N	\N	2026-10-08 23:56:21.382+00
10	1	5	1	\N	\N	2026-10-08 23:57:21.813+00
11	1	5	2	\N	\N	2026-10-08 23:57:21.813+00
12	1	6	\N	1	\N	2026-10-09 00:01:24.259+00
13	1	6	1	\N	\N	2026-10-09 00:01:24.259+00
20	2	7	\N	3	\N	2026-10-09 00:07:06.279+00
21	2	7	9	\N	\N	2026-10-09 00:07:06.279+00
23	1	8	\N	1	\N	2026-10-09 13:04:47.152+00
24	1	8	1	\N	\N	2026-10-09 13:04:47.152+00
25	1	9	1	\N	\N	2026-10-09 13:12:21.24+00
26	2	11	9	\N	\N	2026-10-09 13:13:07.815+00
27	1	9	\N	\N	2	2026-10-09 13:13:16.046+00
29	1	9	\N	\N	1	2026-10-09 13:13:34.516+00
31	1	12	1	\N	\N	2026-10-09 19:28:30.08+00
32	1	12	5	\N	\N	2026-10-09 19:28:30.08+00
33	1	13	1	\N	\N	2026-10-09 19:28:30.33+00
34	1	13	2	\N	\N	2026-10-09 19:28:30.33+00
35	1	13	3	\N	\N	2026-10-09 19:28:30.33+00
36	2	14	9	\N	\N	2026-10-10 11:03:42.762+00
37	2	14	14	\N	\N	2026-10-10 11:03:42.762+00
38	1	15	1	\N	\N	2026-10-10 14:25:42.037+00
39	1	15	8	\N	\N	2026-10-10 14:25:42.037+00
40	1	15	6	\N	\N	2026-10-10 14:27:04.988+00
41	1	16	6	\N	\N	2026-10-10 14:33:59.692+00
42	1	16	1	\N	\N	2026-10-10 14:33:59.692+00
43	1	17	1	\N	\N	2026-10-10 17:57:00.205+00
44	1	17	4	\N	\N	2026-10-10 17:57:00.205+00
45	13	18	\N	8	\N	2026-10-10 18:10:54.932+00
46	13	18	21	\N	\N	2026-10-10 18:10:54.932+00
47	1	19	\N	7	\N	2026-10-10 18:34:07.599+00
48	1	19	2	\N	\N	2026-10-10 18:34:07.599+00
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, tenant_id, type, project_id, support_ticket_id, is_archived, created_at) FROM stdin;
1	1	internal	\N	\N	f	2026-10-08 23:56:07.153+00
4	1	internal	\N	\N	f	2026-10-08 23:56:21.375+00
5	1	internal	\N	\N	t	2026-10-08 23:57:21.809+00
6	1	project_client	14	\N	f	2026-10-09 00:01:24.256+00
7	2	project_client	8	\N	f	2026-10-09 00:07:06.275+00
8	1	project_client	4	\N	f	2026-10-09 13:04:47.141+00
9	1	support	\N	1	f	2026-10-09 13:12:21.225+00
11	2	support	\N	2	f	2026-10-09 13:13:07.798+00
12	1	internal	\N	\N	f	2026-10-09 19:28:30.061+00
13	1	internal	\N	\N	f	2026-10-09 19:28:30.322+00
14	2	internal	\N	\N	f	2026-10-10 11:03:42.743+00
15	1	internal	16	\N	f	2026-10-10 14:25:42.023+00
16	1	internal	\N	\N	f	2026-10-10 14:33:59.686+00
17	1	internal	\N	\N	f	2026-10-10 17:57:00.175+00
18	13	project_client	17	\N	f	2026-10-10 18:10:54.925+00
19	1	project_client	16	\N	f	2026-10-10 18:34:07.584+00
\.


--
-- Data for Name: cost_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_types (id, tenant_id, name, is_active, created_at) FROM stdin;
1	\N	material	t	2026-10-08 22:10:07.7+00
2	\N	subcontractor	t	2026-10-08 22:10:07.817+00
3	\N	labor	t	2026-10-08 22:10:07.848+00
4	1	insurance	t	2026-10-08 23:29:11.825+00
5	13	transport	t	2026-10-10 15:29:43.058+00
\.


--
-- Data for Name: document_counters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_counters (tenant_id, document_type, year, last_number) FROM stdin;
2	quote	2026	2
1	quote	2026	25
13	purchase_invoice	2026	3
13	quote	2026	3
1	purchase_invoice	2026	22
1	invoice	2026	10
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback (id, tenant_id, submitted_by, type, title, body, status, created_at, updated_at) FROM stdin;
3	2	9	improvement	TEST Beta idea	TEST beta body	new	2026-10-09 13:15:38.171+00	2026-10-09 13:15:38.171+00
1	1	5	feature_request	TEST Export to Excel	TEST please add export	planned	2026-10-09 13:15:20.118+00	2026-10-09 13:15:41.776+00
2	1	1	complaint	TEST Slow PDF	TEST it is slow	reviewing	2026-10-09 13:15:20.425+00	2026-10-09 13:24:54.221+00
\.


--
-- Data for Name: import_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.import_batches (id, tenant_id, type, status, file_name, rows_hash, row_count, rows, errors, created_count, updated_count, created_by, created_at, started_at, finished_at) FROM stdin;
1	1	materials	done	Flle 1.xlsx	4777174f362389afdf5b3a079ef2161c33ed6aae500ded3275ee5fbe2e20a62d	29	[{"row": 2, "unit": "pcs 1", "description": "TEST Brick 1", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 3, "unit": "pcs 2", "description": "TEST Brick 2", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 4, "unit": "pcs 3", "description": "TEST Brick 3", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 5, "unit": "pcs 4", "description": "TEST Brick 4", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 6, "unit": "pcs 5", "description": "TEST Brick 5", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 7, "unit": "pcs 6", "description": "TEST Brick 6", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 8, "unit": "pcs 7", "description": "TEST Brick 7", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 9, "unit": "pcs 8", "description": "TEST Brick 8", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 10, "unit": "pcs 9", "description": "TEST Brick 9", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 11, "unit": "pcs 10", "description": "TEST Brick 10", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 12, "unit": "pcs 11", "description": "TEST Brick 11", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 13, "unit": "pcs 12", "description": "TEST Brick 12", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 14, "unit": "pcs 13", "description": "TEST Brick 13", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 15, "unit": "pcs 14", "description": "TEST Brick 14", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 16, "unit": "pcs 15", "description": "TEST Brick 15", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 17, "unit": "pcs 16", "description": "TEST Brick 16", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 18, "unit": "pcs 17", "description": "TEST Brick 17", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 19, "unit": "pcs 18", "description": "TEST Brick 18", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 20, "unit": "pcs 19", "description": "TEST Brick 19", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 21, "unit": "pcs 20", "description": "TEST Brick 20", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 22, "unit": "pcs 21", "description": "TEST Brick 21", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 23, "unit": "pcs 22", "description": "TEST Brick 22", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 24, "unit": "pcs 23", "description": "TEST Brick 23", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 25, "unit": "pcs 24", "description": "TEST Brick 24", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 26, "unit": "pcs 25", "description": "TEST Brick 25", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 27, "unit": "pcs 26", "description": "TEST Brick 26", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 28, "unit": "pcs 27", "description": "TEST Brick 27", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 29, "unit": "pcs 28", "description": "TEST Brick 28", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}, {"row": 30, "unit": "pcs 29", "description": "TEST Brick 29", "stock_depart": "2", "minimum_stock": "2", "purchase_price": "50"}]	\N	29	0	2	2026-10-10 17:31:57.459+00	2026-10-10 17:31:57.5+00	2026-10-10 17:31:57.72+00
2	1	stock	done	Flle 1 (1).xlsx	4c810e9e2780c901759e19694fe9d1b8fdaf78f278d410c579761a613fcd7205	36	[{"id": 5, "row": 2, "type": "purchase", "quantity": "20", "description": "TEST Brick", "movement_date": "2026-12-05"}, {"id": 25, "row": 3, "type": "purchase", "quantity": "20", "description": "TEST Brick 1", "movement_date": "2026-12-05"}, {"id": 34, "row": 4, "type": "purchase", "quantity": "20", "description": "TEST Brick 10", "movement_date": "2026-12-05"}, {"id": 35, "row": 5, "type": "purchase", "quantity": "20", "description": "TEST Brick 11", "movement_date": "2026-12-05"}, {"id": 36, "row": 6, "type": "purchase", "quantity": "20", "description": "TEST Brick 12", "movement_date": "2026-12-05"}, {"id": 37, "row": 7, "type": "purchase", "quantity": "20", "description": "TEST Brick 13", "movement_date": "2026-12-05"}, {"id": 38, "row": 8, "type": "purchase", "quantity": "20", "description": "TEST Brick 14", "movement_date": "2026-12-05"}, {"id": 39, "row": 9, "type": "purchase", "quantity": "20", "description": "TEST Brick 15", "movement_date": "2026-12-05"}, {"id": 40, "row": 10, "type": "purchase", "quantity": "20", "description": "TEST Brick 16", "movement_date": "2026-12-05"}, {"id": 41, "row": 11, "type": "purchase", "quantity": "20", "description": "TEST Brick 17", "movement_date": "2026-12-05"}, {"id": 42, "row": 12, "type": "purchase", "quantity": "20", "description": "TEST Brick 18", "movement_date": "2026-12-05"}, {"id": 43, "row": 13, "type": "purchase", "quantity": "20", "description": "TEST Brick 19", "movement_date": "2026-12-05"}, {"id": 26, "row": 14, "type": "purchase", "quantity": "20", "description": "TEST Brick 2", "movement_date": "2026-12-05"}, {"id": 44, "row": 15, "type": "purchase", "quantity": "20", "description": "TEST Brick 20", "movement_date": "2026-12-05"}, {"id": 45, "row": 16, "type": "purchase", "quantity": "20", "description": "TEST Brick 21", "movement_date": "2026-12-05"}, {"id": 46, "row": 17, "type": "purchase", "quantity": "20", "description": "TEST Brick 22", "movement_date": "2026-12-05"}, {"id": 47, "row": 18, "type": "purchase", "quantity": "20", "description": "TEST Brick 23", "movement_date": "2026-12-05"}, {"id": 48, "row": 19, "type": "purchase", "quantity": "20", "description": "TEST Brick 24", "movement_date": "2026-12-05"}, {"id": 49, "row": 20, "type": "purchase", "quantity": "20", "description": "TEST Brick 25", "movement_date": "2026-12-05"}, {"id": 50, "row": 21, "type": "purchase", "quantity": "20", "description": "TEST Brick 26", "movement_date": "2026-12-05"}, {"id": 51, "row": 22, "type": "purchase", "quantity": "20", "description": "TEST Brick 27", "movement_date": "2026-12-05"}, {"id": 52, "row": 23, "type": "purchase", "quantity": "20", "description": "TEST Brick 28", "movement_date": "2026-12-05"}, {"id": 53, "row": 24, "type": "purchase", "quantity": "20", "description": "TEST Brick 29", "movement_date": "2026-12-05"}, {"id": 27, "row": 25, "type": "purchase", "quantity": "20", "description": "TEST Brick 3", "movement_date": "2026-12-05"}, {"id": 28, "row": 26, "type": "purchase", "quantity": "20", "description": "TEST Brick 4", "movement_date": "2026-12-05"}, {"id": 29, "row": 27, "type": "purchase", "quantity": "20", "description": "TEST Brick 5", "movement_date": "2026-12-05"}, {"id": 30, "row": 28, "type": "purchase", "quantity": "20", "description": "TEST Brick 6", "movement_date": "2026-12-05"}, {"id": 31, "row": 29, "type": "purchase", "quantity": "20", "description": "TEST Brick 7", "movement_date": "2026-12-05"}, {"id": 32, "row": 30, "type": "purchase", "quantity": "20", "description": "TEST Brick 8", "movement_date": "2026-12-05"}, {"id": 33, "row": 31, "type": "purchase", "quantity": "20", "description": "TEST Brick 9", "movement_date": "2026-12-05"}, {"id": 3, "row": 32, "type": "purchase", "quantity": "20", "description": "TEST Filler", "movement_date": "2026-12-05"}, {"id": 7, "row": 33, "type": "purchase", "quantity": "20", "description": "TEST NOT-28 Sand", "movement_date": "2026-12-05"}, {"id": 1, "row": 34, "type": "purchase", "quantity": "20", "description": "TEST Paint", "movement_date": "2026-12-05"}, {"id": 6, "row": 35, "type": "purchase", "quantity": "20", "description": "TEST Sand", "movement_date": "2026-12-05"}, {"id": 24, "row": 36, "type": "purchase", "quantity": "20", "description": "TEST Stock initial", "movement_date": "2026-12-05"}, {"id": 2, "row": 37, "type": "purchase", "quantity": "20", "description": "TEST Tape", "movement_date": "2026-12-05"}]	\N	36	0	2	2026-10-10 17:34:12.471+00	2026-10-10 17:34:12.492+00	2026-10-10 17:34:12.563+00
3	13	stock	done	Flle 1 (2).xlsx	99886d5236c33c9bd31323c215fcaa6d52ce3220d8500ef017beebf00ee48554	16	[{"id": 12, "row": 2, "type": "purchase", "quantity": "50", "description": "Bloc béton creux 39x19x14", "movement_date": "2026-10-10"}, {"id": 13, "row": 3, "type": "purchase", "quantity": "50", "description": "Brique de parement rouge", "movement_date": "2026-10-10"}, {"id": 11, "row": 4, "type": "purchase", "quantity": "50", "description": "Béton prêt à l’emploi C25/30", "movement_date": "2026-10-10"}, {"id": 22, "row": 5, "type": "purchase", "quantity": "50", "description": "Carrelage grès cérame 60x60", "movement_date": "2026-10-10"}, {"id": 8, "row": 6, "type": "purchase", "quantity": "50", "description": "Ciment Portland CEM II 32,5 – sac 25 kg", "movement_date": "2026-10-10"}, {"id": 21, "row": 7, "type": "purchase", "quantity": "50", "description": "Colle carrelage C2 – sac 25 kg", "movement_date": "2026-10-10"}, {"id": 20, "row": 8, "type": "purchase", "quantity": "50", "description": "Enduit de lissage – sac 25 kg", "movement_date": "2026-10-10"}, {"id": 14, "row": 9, "type": "purchase", "quantity": "50", "description": "Fer à béton HA Ø10 – barre 6 m", "movement_date": "2026-10-10"}, {"id": 10, "row": 10, "type": "purchase", "quantity": "50", "description": "Gravier 4/14", "movement_date": "2026-10-10"}, {"id": 19, "row": 11, "type": "purchase", "quantity": "50", "description": "Laine de verre 100 mm", "movement_date": "2026-10-10"}, {"id": 18, "row": 12, "type": "purchase", "quantity": "50", "description": "Montant métallique M48 – 3 m", "movement_date": "2026-10-10"}, {"id": 23, "row": 13, "type": "purchase", "quantity": "50", "description": "Peinture acrylique blanche mate – 10 L", "movement_date": "2026-10-10"}, {"id": 16, "row": 14, "type": "purchase", "quantity": "50", "description": "Plaque de plâtre BA13 – 260x120", "movement_date": "2026-10-10"}, {"id": 17, "row": 15, "type": "purchase", "quantity": "50", "description": "Rail métallique R48 – 3 m", "movement_date": "2026-10-10"}, {"id": 9, "row": 16, "type": "purchase", "quantity": "50", "description": "Sable de construction 0/4", "movement_date": "2026-10-10"}, {"id": 15, "row": 17, "type": "purchase", "quantity": "50", "description": "Treillis soudé 150x150 Ø6", "movement_date": "2026-10-10"}]	\N	16	0	21	2026-10-10 17:52:01.939+00	2026-10-10 17:52:01.993+00	2026-10-10 17:52:02.081+00
\.


--
-- Data for Name: invoice_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_lines (id, tenant_id, invoice_id, service_id, description, unit, quantity, unit_price_excl_vat, vat_rate, total_excl_vat, "position") FROM stdin;
1	1	1	\N	TEST Invoice line	piece	1.000	1000.00	21.00	1000.00	1
2	1	3	\N	TEST Invoice line	piece	1.000	100.00	21.00	100.00	1
3	1	4	\N	TEST Invoice line	piece	1.000	200.00	21.00	200.00	1
4	1	5	\N	TEST role line	piece	1.000	10.00	21.00	10.00	1
6	1	7	\N	TEST invoice work	pc	1.000	200.00	21.00	200.00	1
7	1	8	\N	TEST invoice work	pc	1.000	200.00	21.00	200.00	1
8	1	9	\N	TEST invoice work	pc	1.000	200.00	21.00	200.00	1
9	1	10	\N	TEST DOC Invoice line	m2	10.000	50.00	21.00	500.00	0
11	1	6	\N	TEST invoice work	pc	1.000	200.00	21.00	200.00	1
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, tenant_id, client_id, project_id, quote_id, number, status, issue_date, due_date, default_vat_rate, amount_excl_vat, vat_amount, amount_incl_vat, note, sent_at, reminder_count, last_reminder_at, created_by, created_at, updated_at) FROM stdin;
2	1	1	4	\N	INV-2026-0002	draft	2026-10-08	2026-11-07	21.00	0.00	0.00	0.00	\N	\N	0	\N	1	2026-10-08 23:26:52.775+00	2026-10-08 23:26:52.782+00
1	1	1	4	\N	INV-2026-0001	paid	2026-10-08	2026-11-07	21.00	1000.00	210.00	1210.00	\N	2026-10-08 23:26:54.096+00	0	\N	1	2026-10-08 23:26:52.695+00	2026-10-08 23:26:54.196+00
3	1	1	4	\N	INV-2026-0003	cancelled	2026-10-08	2026-11-07	21.00	100.00	21.00	121.00	\N	2026-10-08 23:27:03.043+00	0	\N	1	2026-10-08 23:27:01.842+00	2026-10-08 23:27:03.081+00
4	1	1	4	\N	INV-2026-0004	sent	2026-10-08	2026-09-28	21.00	200.00	42.00	242.00	\N	2026-10-08 23:27:04.05+00	1	2026-10-08 23:27:04.135+00	1	2026-10-08 23:27:03.135+00	2026-10-08 23:27:04.136+00
5	1	1	4	\N	INV-2026-0005	draft	2026-10-08	2026-11-07	21.00	10.00	2.10	12.10	\N	\N	0	\N	8	2026-10-08 23:27:21.786+00	2026-10-08 23:27:21.799+00
8	1	1	14	\N	INV-2026-0008	sent	2026-10-09	2026-09-01	21.00	200.00	42.00	242.00	INTERNAL invoice late	2026-10-09 00:01:07.348+00	0	\N	1	2026-10-09 00:01:05.358+00	2026-10-09 00:01:07.349+00
9	1	1	14	\N	INV-2026-0009	cancelled	2026-10-09	2026-11-08	21.00	200.00	42.00	242.00	INTERNAL invoice cancelled	2026-10-09 00:01:08.253+00	0	\N	1	2026-10-09 00:01:05.391+00	2026-10-09 00:01:08.28+00
10	1	1	4	24	INV-2026-0010	sent	2026-10-09	2026-11-08	21.00	500.00	105.00	605.00	TEST DOC pay within 30 days	2026-10-09 13:03:22.982+00	0	\N	1	2026-10-09 13:03:15.79+00	2026-10-09 13:03:22.986+00
7	1	1	14	\N	INV-2026-0007	sent	2026-10-09	2026-11-08	21.00	200.00	42.00	242.00	INTERNAL invoice sent	2026-10-09 00:01:06.488+00	0	\N	1	2026-10-09 00:01:05.328+00	2026-10-09 23:00:17.537+00
6	1	1	14	\N	INV-2026-0006	draft	2026-10-09	2026-11-08	21.00	200.00	42.00	242.00	INTERNAL invoice draft	\N	0	\N	1	2026-10-09 00:01:05.292+00	2026-10-10 18:44:02.4+00
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materials (id, tenant_id, description, unit, purchase_price, minimum_stock, is_active, created_at, updated_at) FROM stdin;
2	1	TEST Tape	piece	2.00	5.000	t	2026-10-08 23:22:26.518+00	2026-10-08 23:22:26.518+00
3	1	TEST Filler	kg	4.00	5.000	t	2026-10-08 23:22:26.566+00	2026-10-08 23:22:26.566+00
4	2	TEST B Mat	l	1.00	1.000	t	2026-10-08 23:22:27.309+00	2026-10-08 23:22:27.309+00
1	1	TEST Paint	l	6.00	10.000	t	2026-10-08 23:22:26.472+00	2026-10-08 23:22:37.699+00
5	1	TEST Brick	pcs	50.00	0.000	t	2026-10-08 23:50:33.639+00	2026-10-08 23:52:38.427+00
6	1	TEST Sand	kg	2.00	10.000	t	2026-10-09 12:37:21.998+00	2026-10-09 12:37:21.998+00
7	1	TEST NOT-28 Sand	kg	1.00	10.000	t	2026-10-09 20:36:02.021+00	2026-10-09 20:36:02.021+00
8	13	Ciment Portland CEM II 32,5 – sac 25 kg	sac	6.50	20.000	t	2026-10-10 15:33:03.002+00	2026-10-10 15:33:03.002+00
9	13	Sable de construction 0/4	t	35.00	5.000	t	2026-10-10 15:33:20.49+00	2026-10-10 15:33:20.49+00
10	13	Gravier 4/14	t	38.00	5.000	t	2026-10-10 15:33:32.407+00	2026-10-10 15:33:32.407+00
11	13	Béton prêt à l’emploi C25/30	m3	115.00	2.000	t	2026-10-10 15:33:49.369+00	2026-10-10 15:33:49.369+00
12	13	Bloc béton creux 39x19x14	pièce	1.20	200.000	t	2026-10-10 15:34:03.814+00	2026-10-10 15:34:03.814+00
13	13	Brique de parement rouge	pièce	0.65	500.000	t	2026-10-10 15:34:18.307+00	2026-10-10 15:34:18.307+00
14	13	Fer à béton HA Ø10 – barre 6 m	barre	7.80	50.000	t	2026-10-10 15:34:31.98+00	2026-10-10 15:34:31.98+00
15	13	Treillis soudé 150x150 Ø6	panneau	32.00	10.000	t	2026-10-10 15:34:44.687+00	2026-10-10 15:34:44.687+00
16	13	Plaque de plâtre BA13 – 260x120	pièce	8.90	30.000	t	2026-10-10 15:34:58.539+00	2026-10-10 15:34:58.539+00
17	13	Rail métallique R48 – 3 m	pièce	3.40	40.000	t	2026-10-10 15:35:11.748+00	2026-10-10 15:35:11.748+00
18	13	Montant métallique M48 – 3 m	pièce	3.90	40.000	t	2026-10-10 15:35:24.987+00	2026-10-10 15:35:24.987+00
19	13	Laine de verre 100 mm	m2	6.20	50.000	t	2026-10-10 15:35:44.461+00	2026-10-10 15:35:44.461+00
20	13	Enduit de lissage – sac 25 kg	sac	18.50	10.000	t	2026-10-10 15:35:58.025+00	2026-10-10 15:35:58.025+00
21	13	Colle carrelage C2 – sac 25 kg	sac	14.00	15.000	t	2026-10-10 15:36:11.327+00	2026-10-10 15:36:11.327+00
22	13	Carrelage grès cérame 60x60	m2	22.00	20.000	t	2026-10-10 15:36:25.545+00	2026-10-10 15:36:43.143+00
23	13	Peinture acrylique blanche mate – 10 L	seau	45.00	5.000	t	2026-10-10 15:37:51.578+00	2026-10-10 15:37:51.578+00
24	1	TEST Stock initial	sac	6.00	10.000	t	2026-10-10 15:43:27.967+00	2026-10-10 15:43:27.967+00
25	1	TEST Brick 1	pcs 1	50.00	2.000	t	2026-10-10 17:31:57.527+00	2026-10-10 17:31:57.527+00
26	1	TEST Brick 2	pcs 2	50.00	2.000	t	2026-10-10 17:31:57.534+00	2026-10-10 17:31:57.534+00
27	1	TEST Brick 3	pcs 3	50.00	2.000	t	2026-10-10 17:31:57.539+00	2026-10-10 17:31:57.539+00
28	1	TEST Brick 4	pcs 4	50.00	2.000	t	2026-10-10 17:31:57.546+00	2026-10-10 17:31:57.546+00
29	1	TEST Brick 5	pcs 5	50.00	2.000	t	2026-10-10 17:31:57.551+00	2026-10-10 17:31:57.551+00
30	1	TEST Brick 6	pcs 6	50.00	2.000	t	2026-10-10 17:31:57.555+00	2026-10-10 17:31:57.555+00
31	1	TEST Brick 7	pcs 7	50.00	2.000	t	2026-10-10 17:31:57.56+00	2026-10-10 17:31:57.56+00
32	1	TEST Brick 8	pcs 8	50.00	2.000	t	2026-10-10 17:31:57.567+00	2026-10-10 17:31:57.567+00
33	1	TEST Brick 9	pcs 9	50.00	2.000	t	2026-10-10 17:31:57.573+00	2026-10-10 17:31:57.573+00
34	1	TEST Brick 10	pcs 10	50.00	2.000	t	2026-10-10 17:31:57.577+00	2026-10-10 17:31:57.577+00
35	1	TEST Brick 11	pcs 11	50.00	2.000	t	2026-10-10 17:31:57.584+00	2026-10-10 17:31:57.584+00
36	1	TEST Brick 12	pcs 12	50.00	2.000	t	2026-10-10 17:31:57.588+00	2026-10-10 17:31:57.588+00
37	1	TEST Brick 13	pcs 13	50.00	2.000	t	2026-10-10 17:31:57.594+00	2026-10-10 17:31:57.594+00
38	1	TEST Brick 14	pcs 14	50.00	2.000	t	2026-10-10 17:31:57.6+00	2026-10-10 17:31:57.6+00
39	1	TEST Brick 15	pcs 15	50.00	2.000	t	2026-10-10 17:31:57.604+00	2026-10-10 17:31:57.604+00
40	1	TEST Brick 16	pcs 16	50.00	2.000	t	2026-10-10 17:31:57.609+00	2026-10-10 17:31:57.609+00
41	1	TEST Brick 17	pcs 17	50.00	2.000	t	2026-10-10 17:31:57.615+00	2026-10-10 17:31:57.615+00
42	1	TEST Brick 18	pcs 18	50.00	2.000	t	2026-10-10 17:31:57.619+00	2026-10-10 17:31:57.619+00
43	1	TEST Brick 19	pcs 19	50.00	2.000	t	2026-10-10 17:31:57.623+00	2026-10-10 17:31:57.623+00
44	1	TEST Brick 20	pcs 20	50.00	2.000	t	2026-10-10 17:31:57.628+00	2026-10-10 17:31:57.628+00
45	1	TEST Brick 21	pcs 21	50.00	2.000	t	2026-10-10 17:31:57.633+00	2026-10-10 17:31:57.633+00
46	1	TEST Brick 22	pcs 22	50.00	2.000	t	2026-10-10 17:31:57.636+00	2026-10-10 17:31:57.636+00
47	1	TEST Brick 23	pcs 23	50.00	2.000	t	2026-10-10 17:31:57.641+00	2026-10-10 17:31:57.641+00
48	1	TEST Brick 24	pcs 24	50.00	2.000	t	2026-10-10 17:31:57.646+00	2026-10-10 17:31:57.646+00
49	1	TEST Brick 25	pcs 25	50.00	2.000	t	2026-10-10 17:31:57.651+00	2026-10-10 17:31:57.651+00
50	1	TEST Brick 26	pcs 26	50.00	2.000	t	2026-10-10 17:31:57.655+00	2026-10-10 17:31:57.655+00
51	1	TEST Brick 27	pcs 27	50.00	2.000	t	2026-10-10 17:31:57.66+00	2026-10-10 17:31:57.66+00
52	1	TEST Brick 28	pcs 28	50.00	2.000	t	2026-10-10 17:31:57.664+00	2026-10-10 17:31:57.664+00
53	1	TEST Brick 29	pcs 29	50.00	2.000	t	2026-10-10 17:31:57.667+00	2026-10-10 17:31:57.667+00
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media (id, tenant_id, entity_type, entity_id, file_name, file_url, file_type, file_size, is_locked, uploaded_by, created_at, updated_at, deleted_at, file_id) FROM stdin;
2	1	report	1	test.webp	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_E_Ewfc_x7.webp	image/webp	42	f	1	2026-10-08 22:50:14.581+00	2026-10-08 22:50:14.581+00	\N	6ac81e27ead997d09aab1775
3	1	purchase_invoice	1	test.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/purchase_invoice/1/test_2ShA_gLNx.pdf	application/pdf	193	f	1	2026-10-08 22:50:15.817+00	2026-10-08 22:50:15.817+00	\N	6ac81e28ead997d09aab1de5
4	1	project	1	test.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_b1pviP5P_.pdf	application/pdf	193	f	1	2026-10-08 22:50:17.309+00	2026-10-08 22:50:17.309+00	\N	6ac81e2aead997d09aab2261
5	1	project	1	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_AMWanV3hj.jpg	image/jpeg	125	f	1	2026-10-08 22:50:18.424+00	2026-10-08 22:50:18.424+00	\N	6ac81e2bead997d09aab24ac
6	1	project	1	test.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_nXKU1bJRa.png	image/png	70	f	1	2026-10-08 22:50:19.378+00	2026-10-08 22:50:19.378+00	\N	6ac81e2cead997d09aab2688
1	1	report	1	front-photo.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_jJk_BYH-G.jpg	image/jpeg	125	f	1	2026-10-08 22:50:13.267+00	2026-10-08 22:50:34.999+00	\N	6ac81e26ead997d09aab127c
7	1	report	1	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_At5P1tvk3.jpg	image/jpeg	125	f	2	2026-10-08 22:50:55.604+00	2026-10-08 22:50:55.604+00	\N	6ac81e50ead997d09aab935b
8	1	project	1	test.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/1/test_b9ZztxXQ6.png	image/png	70	f	5	2026-10-08 22:50:56.676+00	2026-10-08 22:50:56.676+00	\N	6ac81e51ead997d09aab972c
9	1	report	1	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_ecVgRAV9r.jpg	image/jpeg	125	f	5	2026-10-08 22:51:03.886+00	2026-10-08 22:51:03.886+00	\N	6ac81e58ead997d09aabb0d9
10	1	report	1	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_ccVPiOn00.jpg	image/jpeg	125	f	5	2026-10-08 22:51:06.372+00	2026-10-08 22:51:06.372+00	\N	6ac81e59ead997d09aabb470
11	1	report	1	test.webp	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/test_X1TUowzon.webp	image/webp	42	f	5	2026-10-08 22:51:08.646+00	2026-10-08 22:51:08.646+00	\N	6ac81e5dead997d09aabbcce
15	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_Nx8H_Ry5e.jpg	image/jpeg	125	f	1	2026-10-08 22:52:05.436+00	2026-10-08 22:52:05.436+00	\N	6ac81e96ead997d09aac53cd
16	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_SyAH7W-ER.jpg	image/jpeg	125	f	1	2026-10-08 22:52:06.217+00	2026-10-08 22:52:06.217+00	\N	6ac81e97ead997d09aac59b1
17	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_1pHkXYA48.jpg	image/jpeg	125	f	1	2026-10-08 22:52:07.013+00	2026-10-08 22:52:07.013+00	\N	6ac81e98ead997d09aac5d85
18	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_dZ0d61Hrh.jpg	image/jpeg	125	f	1	2026-10-08 22:52:07.788+00	2026-10-08 22:52:07.788+00	\N	6ac81e99ead997d09aac5eb7
19	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_aG7VX4Zx-.jpg	image/jpeg	125	f	1	2026-10-08 22:52:08.588+00	2026-10-08 22:52:08.588+00	\N	6ac81e99ead997d09aac6036
20	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_o6te6IYeN.jpg	image/jpeg	125	f	1	2026-10-08 22:52:09.394+00	2026-10-08 22:52:09.394+00	\N	6ac81e9aead997d09aac61ea
21	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_-7Y09sqhM.jpg	image/jpeg	125	f	1	2026-10-08 22:52:10.244+00	2026-10-08 22:52:10.244+00	\N	6ac81e9bead997d09aac6320
22	1	project	51	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/51/test_0A8UNHiOud.jpg	image/jpeg	125	f	1	2026-10-08 22:52:11.124+00	2026-10-08 22:52:11.124+00	\N	6ac81e9cead997d09aac6443
12	1	project	50	TEST-T3.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/50/TEST-T3_i7q5tBCL-.jpg	image/jpeg	125	t	1	2026-10-08 22:51:53.296+00	2026-10-08 22:51:53.296+00	\N	6ac81e8aead997d09aac3645
29	1	quote	1	QUO-2026-0001.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/1/QUO-2026-0001_OP1hX3OWP.pdf	application/pdf	3559	t	1	2026-10-08 23:26:08.546+00	2026-10-08 23:26:08.546+00	\N	6ac82691ead997d09ac3931b
36	1	invoice	4	INV-2026-0004.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/4/INV-2026-0004_-DnDBJ-XE.pdf	application/pdf	3409	t	1	2026-10-08 23:27:04.031+00	2026-10-08 23:27:04.031+00	\N	6ac826c9ead997d09ac421db
23	1	project	50	TEST-T4.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/project/50/TEST-T4_NRFFfCMp3.jpg	image/jpeg	125	f	1	2026-10-08 22:52:44.298+00	2026-10-08 22:52:50.276+00	2026-10-08 22:52:50.276+00	6ac81ebdead997d09aacba34
25	1	user	1	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/user/1/test_32Q0Q-Dkm.jpg	image/jpeg	125	f	1	2026-10-08 22:53:03.05+00	2026-10-08 22:53:03.05+00	\N	6ac81ed0ead997d09aace0e0
30	1	quote	7	QUO-2026-0007.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/7/QUO-2026-0007_-iCEiqZ6h.pdf	application/pdf	3358	t	1	2026-10-08 23:26:35.63+00	2026-10-08 23:26:35.63+00	\N	6ac826acead997d09ac3e04b
31	1	quote	8	QUO-2026-0008.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/8/QUO-2026-0008_dEkDGJB09.pdf	application/pdf	3360	t	1	2026-10-08 23:26:36.741+00	2026-10-08 23:26:36.741+00	\N	6ac826adead997d09ac3e257
32	1	quote	9	QUO-2026-0009.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/9/QUO-2026-0009_HX-q8ro2o.pdf	application/pdf	3358	t	1	2026-10-08 23:26:37.748+00	2026-10-08 23:26:37.748+00	\N	6ac826aeead997d09ac3e459
33	1	quote	10	QUO-2026-0010.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/10/QUO-2026-0010_c7EI6jl-b.pdf	application/pdf	3361	t	1	2026-10-08 23:26:38.936+00	2026-10-08 23:26:38.936+00	\N	6ac826b0ead997d09ac3e7ec
34	1	invoice	1	INV-2026-0001.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/1/INV-2026-0001_o0-IlgZ-Z.pdf	application/pdf	3410	t	1	2026-10-08 23:26:54.075+00	2026-10-08 23:26:54.075+00	\N	6ac826bfead997d09ac40ba4
35	1	invoice	3	INV-2026-0003.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/3/INV-2026-0003_jRJqGO6e5.pdf	application/pdf	3408	t	1	2026-10-08 23:27:03.019+00	2026-10-08 23:27:03.019+00	\N	6ac826c8ead997d09ac42086
37	1	purchase_invoice	1	bill.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/purchase_invoice/1/bill_RnWG98ED-.pdf	application/pdf	69	f	1	2026-10-08 23:29:36.342+00	2026-10-08 23:29:36.342+00	\N	6ac82761ead997d09ac587de
38	1	quote	13	QUO-2026-0012.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/13/QUO-2026-0012_ICMdwFJni.pdf	application/pdf	3362	t	1	2026-10-08 23:34:33.073+00	2026-10-08 23:34:33.073+00	\N	6ac8288aead997d09ac8defa
39	1	report	1	photo.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/1/photo_w7l-bBpfm.jpg	image/jpeg	22	f	3	2026-10-08 23:40:35.12+00	2026-10-08 23:40:35.12+00	\N	6ac829f4ead997d09add477e
40	1	quote	14	QUO-2026-0013.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/14/QUO-2026-0013_ldscv75zX.pdf	application/pdf	3378	t	1	2026-10-08 23:51:05.671+00	2026-10-08 23:51:05.671+00	\N	6ac82c6aead997d09ae474b7
41	1	quote	15	QUO-2026-0014.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/15/QUO-2026-0014_mlt_BRw2m.pdf	application/pdf	3382	t	1	2026-10-08 23:51:07.119+00	2026-10-08 23:51:07.119+00	\N	6ac82c6cead997d09ae4781f
42	1	quote	16	QUO-2026-0015.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/16/QUO-2026-0015_y22i1jv9S.pdf	application/pdf	3373	t	1	2026-10-08 23:51:50.843+00	2026-10-08 23:51:50.843+00	\N	6ac82c97ead997d09ae4cc0b
43	1	quote	17	QUO-2026-0016.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/17/QUO-2026-0016__KWtO83Uq.pdf	application/pdf	3382	t	1	2026-10-08 23:52:09.938+00	2026-10-08 23:52:09.938+00	\N	6ac82cabead997d09ae5005f
44	1	quote	18	QUO-2026-0017.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/18/QUO-2026-0017_VMiGoPWLb.pdf	application/pdf	3370	t	1	2026-10-08 23:52:58.58+00	2026-10-08 23:52:58.58+00	\N	6ac82cdbead997d09ae55f96
45	1	message	3	TEST-chat-a.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-a_8ED7maD_O.png	image/png	81	f	1	2026-10-08 23:56:58.979+00	2026-10-08 23:56:59.943+00	\N	6ac82dccead997d09ae796b7
46	1	message	3	TEST-chat-b.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-b_BIu-o7kxg.png	image/png	81	f	1	2026-10-08 23:56:59.668+00	2026-10-08 23:56:59.943+00	\N	6ac82dccead997d09ae79a3a
47	1	message	0	TEST-chat-mgr.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-mgr_x1Za9jhbo.png	image/png	83	f	2	2026-10-08 23:57:02.296+00	2026-10-08 23:57:02.296+00	\N	6ac82dcfead997d09ae7a36a
48	1	message	0	TEST-chat-c.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-c_8LLrLQpcX.png	image/png	81	f	1	2026-10-08 23:57:03.069+00	2026-10-08 23:57:03.069+00	\N	6ac82dd0ead997d09ae7a502
49	1	message	0	TEST-chat-t.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-chat-t_b1Q0PWide.png	image/png	81	f	1	2026-10-08 23:57:03.747+00	2026-10-08 23:57:03.789+00	2026-10-08 23:57:03.787+00	6ac82dd1ead997d09ae7a653
50	1	quote	19	QUO-2026-0018.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/19/QUO-2026-0018_hWTj_Kp7_.pdf	application/pdf	3448	t	1	2026-10-09 00:01:04.341+00	2026-10-09 00:01:04.341+00	\N	6ac82ec1ead997d09aeaec96
51	1	quote	20	QUO-2026-0019.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/20/QUO-2026-0019_LCOp0pXlx.pdf	application/pdf	3468	t	1	2026-10-09 00:01:05.245+00	2026-10-09 00:01:05.245+00	\N	6ac82ec2ead997d09aeaf2e9
52	1	invoice	7	INV-2026-0007.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/7/INV-2026-0007_8igOeYbN1.pdf	application/pdf	3448	t	1	2026-10-09 00:01:06.464+00	2026-10-09 00:01:06.464+00	\N	6ac82ec3ead997d09aeafad0
53	1	invoice	8	INV-2026-0008.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/8/INV-2026-0008_jWehiGzee.pdf	application/pdf	3449	t	1	2026-10-09 00:01:07.329+00	2026-10-09 00:01:07.329+00	\N	6ac82ec4ead997d09aeb0387
54	1	invoice	9	INV-2026-0009.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/9/INV-2026-0009_FKiLByb4w.pdf	application/pdf	3453	t	1	2026-10-09 00:01:08.234+00	2026-10-09 00:01:08.234+00	\N	6ac82ec5ead997d09aeb07cd
55	1	quote	22	QUO-2026-0021.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/22/QUO-2026-0021_qwRmRlOXc.pdf	application/pdf	3361	t	1	2026-10-09 00:05:23.077+00	2026-10-09 00:05:23.077+00	\N	6ac82fc4ead997d09aeea499
56	1	report	7	TEST-portal-photo.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/report/7/TEST-portal-photo_h469AXowy.png	image/png	70	f	3	2026-10-09 00:05:42.544+00	2026-10-09 00:05:42.544+00	\N	6ac82fd7ead997d09aeed844
57	1	quote	21	TEST-draft-quote.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/21/TEST-draft-quote_YFHMJtmUY.pdf	application/pdf	192	f	1	2026-10-09 00:05:54.815+00	2026-10-09 00:05:54.815+00	\N	6ac82fe4ead997d09aeeff2e
58	1	quote	23	QUO-2026-0022.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/23/QUO-2026-0022_ViOf1ZhTO.pdf	application/pdf	3363	t	1	2026-10-09 12:19:35.087+00	2026-10-09 12:19:35.087+00	\N	6ac8dbd6ead997d09a689d17
59	2	quote	12	QUO-2026-0001.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-2/quote/12/QUO-2026-0001_UPbJ-_hsT.pdf	application/pdf	2841	t	9	2026-10-09 12:47:50.233+00	2026-10-09 12:47:50.233+00	\N	6ac8e275ead997d09a959e0b
60	1	quote	24	QUO-2026-0023.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/24/QUO-2026-0023_VBzMmpVUt.pdf	application/pdf	3652	t	1	2026-10-09 13:03:10.592+00	2026-10-09 13:03:10.592+00	\N	6ac8e60eead997d09aa814f3
61	1	invoice	10	INV-2026-0010.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/invoice/10/INV-2026-0010_vorfPGsrs.pdf	application/pdf	3477	t	1	2026-10-09 13:03:22.924+00	2026-10-09 13:03:22.924+00	\N	6ac8e61aead997d09aa875f7
62	1	tenant	1	logo-blue.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/tenant/1/logo-blue_x2A1t1Zp4.png	image/png	78	f	1	2026-10-09 13:04:02.328+00	2026-10-09 13:04:02.328+00	\N	6ac8e642ead997d09aa956fd
63	1	quote	27	QUO-2026-0025.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/quote/27/QUO-2026-0025_Pyp7q8bXw.pdf	application/pdf	3480	t	1	2026-10-09 13:04:04.966+00	2026-10-09 13:04:04.966+00	\N	6ac8e644ead997d09aa96417
65	7	report	0	test.jpg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-7/report/0/test_mkRKSWlHvH.jpg	image/jpeg	134	f	15	2026-10-09 13:35:23.454+00	2026-10-09 13:35:23.454+00	\N	6ac8ed9bead997d09aca3ebb
72	1	message	34	WhatsApp Image 2026-10-03 at 3.27.34 PM.jpeg	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/WhatsApp_Image_2026-10-03_at_3.27.34_PM_yVzFyN0Mm.jpeg	image/jpeg	49895	f	6	2026-10-10 15:04:31.398+00	2026-10-10 15:04:31.485+00	\N	6aca5400ead997d09a625846
73	13	quote	28	QUO-2026-0001.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/quote/28/QUO-2026-0001_d8j5SwzJP.pdf	application/pdf	2912	t	21	2026-10-10 18:09:37.735+00	2026-10-10 18:09:37.735+00	\N	6aca7f62ead997d09a32f14b
74	1	message	40	TEST-portal-doc.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-portal-doc_u41oNEfcp.pdf	application/pdf	45	f	\N	2026-10-10 18:34:16.506+00	2026-10-10 18:34:17.387+00	\N	6aca8529ead997d09a45e9df
75	1	message	40	TEST-portal-photo.png	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-1/message/0/TEST-portal-photo_lNwDxIzXW.png	image/png	69	f	\N	2026-10-10 18:34:17.334+00	2026-10-10 18:34:17.387+00	\N	6aca852aead997d09a45eb5b
76	13	quote	29	QUO-2026-0002.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/quote/29/QUO-2026-0002_x6iE_rMOd.pdf	application/pdf	3291	t	21	2026-10-10 18:58:02.645+00	2026-10-10 18:58:02.645+00	\N	6aca8abbead997d09a68f1aa
77	13	quote	30	QUO-2026-0003.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/quote/30/QUO-2026-0003_QQKBcpi3e.pdf	application/pdf	3281	t	21	2026-10-10 20:26:50.164+00	2026-10-10 20:26:50.164+00	\N	6aca9f8aead997d09ac52675
78	13	project	17	ChantierOS AUDIT HANDOVER.pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/project/17/ChantierOS_AUDIT_HANDOVER_RQd4QCPEj.pdf	application/pdf	245039	f	21	2026-10-10 20:33:24.706+00	2026-10-10 20:33:24.706+00	\N	6acaa115ead997d09aca5c3a
79	13	project	17	contrat_Contrat_de_formation_(Normale) (2).pdf	https://ik.imagekit.io/1ip6yatv2/Chantios/tenant-13/project/17/contrat_Contrat_de_formation__Normale___2__Gdxn96dUs.pdf	application/pdf	1221377	f	21	2026-10-10 20:33:26.426+00	2026-10-10 20:33:26.426+00	\N	6acaa117ead997d09aca5f82
\.


--
-- Data for Name: message_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_reads (id, tenant_id, message_id, user_id, client_id, read_at) FROM stdin;
3	1	1	2	\N	2026-10-08 23:57:21.754335+00
4	1	2	2	\N	2026-10-08 23:57:21.754335+00
5	1	3	2	\N	2026-10-08 23:57:21.754335+00
6	1	8	2	\N	2026-10-08 23:57:22.09823+00
7	1	9	2	\N	2026-10-08 23:57:22.09823+00
12	1	11	2	\N	2026-10-08 23:57:23.877872+00
13	1	12	2	\N	2026-10-08 23:57:23.877872+00
14	1	13	2	\N	2026-10-08 23:57:23.877872+00
25	1	16	\N	1	2026-10-09 00:06:46.15818+00
27	1	25	6	\N	2026-10-10 14:27:53.638992+00
28	1	27	1	\N	2026-10-10 14:34:31.431364+00
29	1	28	1	\N	2026-10-10 14:34:31.431364+00
34	1	29	6	\N	2026-10-10 14:34:53.514429+00
36	1	30	5	\N	2026-10-10 14:38:15.842682+00
38	1	26	6	\N	2026-10-10 15:02:52.022668+00
44	1	31	6	\N	2026-10-10 15:04:04.522405+00
47	1	32	1	\N	2026-10-10 15:04:11.374039+00
55	1	33	6	\N	2026-10-10 15:04:15.035052+00
62	1	34	1	\N	2026-10-10 15:04:31.67003+00
67	13	41	21	\N	2026-10-10 18:56:38.69768+00
70	13	42	\N	8	2026-10-10 18:56:53.141605+00
71	13	43	\N	8	2026-10-10 18:56:53.141605+00
77	13	44	21	\N	2026-10-10 20:34:52.877133+00
82	13	45	21	\N	2026-10-10 20:34:57.708654+00
90	13	46	\N	8	2026-10-10 20:35:19.464009+00
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, tenant_id, conversation_id, sender_type, sender_id, content, is_archived, created_at) FROM stdin;
1	1	1	employee	1	TEST hello	f	2026-10-08 23:56:21.462+00
2	1	1	employee	1	TEST realtime	f	2026-10-08 23:56:22.647+00
3	1	1	employee	1	TEST with files	f	2026-10-08 23:56:59.922+00
8	1	5	employee	1	TEST o1	f	2026-10-08 23:57:21.919+00
9	1	5	employee	1	TEST o2	f	2026-10-08 23:57:21.982+00
10	1	5	employee	2	TEST m1	f	2026-10-08 23:57:22.027+00
11	1	5	employee	1	TEST p1	f	2026-10-08 23:57:23.729+00
12	1	5	employee	1	TEST p2	f	2026-10-08 23:57:23.773+00
13	1	5	employee	1	TEST p3	f	2026-10-08 23:57:23.82+00
14	1	6	client	1	TEST question from the client	f	2026-10-09 00:06:22.668+00
15	1	6	client	1	TEST second question from the client	f	2026-10-09 00:06:39.917+00
16	1	6	employee	1	TEST reply from the company	f	2026-10-09 00:06:42.878+00
17	1	9	employee	1	TEST first message	f	2026-10-09 13:12:21.272+00
18	2	11	employee	9	TEST beta msg	f	2026-10-09 13:13:07.846+00
19	1	9	admin	2	TEST platform reply	f	2026-10-09 13:13:18.499+00
20	1	9	admin	1	TEST SUPC-03 reply	f	2026-10-09 13:13:34.567+00
21	1	9	admin	1	TEST live socket reply	f	2026-10-09 13:14:02.775+00
22	2	14	employee	9	hello thre	f	2026-10-10 11:03:51.69+00
23	2	14	employee	9	hello there	f	2026-10-10 13:15:21.483+00
24	2	14	employee	9	this is perfect on this part	f	2026-10-10 13:15:26.764+00
25	1	15	employee	1	helllo there , we we stop on this part here	f	2026-10-10 14:27:19.654+00
26	1	15	employee	1	hello i talking to you	f	2026-10-10 14:28:14.928+00
27	1	16	employee	6	what the fuck is that man	f	2026-10-10 14:34:12.154+00
28	1	16	employee	6	answer me	f	2026-10-10 14:34:24.336+00
29	1	16	employee	1	hey what wrong with you man ???	f	2026-10-10 14:34:53.433+00
30	1	12	employee	1	TEST live notification check	f	2026-10-10 14:38:15.725+00
31	1	16	employee	1	this is the last warning	f	2026-10-10 15:03:55.759+00
32	1	16	employee	6	oky sorry	f	2026-10-10 15:04:11.296+00
33	1	16	employee	1	no problm	f	2026-10-10 15:04:14.946+00
34	1	16	employee	6	.	f	2026-10-10 15:04:31.456+00
35	1	17	employee	1	hello there	f	2026-10-10 17:57:04.855+00
36	1	17	employee	1	wake up	f	2026-10-10 17:57:06.681+00
37	1	17	employee	1	man	f	2026-10-10 17:57:07.602+00
38	1	17	employee	1	i neeed you here	f	2026-10-10 17:57:12.89+00
39	1	19	client	7	TEST client text only	f	2026-10-10 18:34:14.807+00
40	1	19	client	7	TEST client with 2 files	f	2026-10-10 18:34:17.359+00
41	13	18	client	8	hello there	f	2026-10-10 18:56:32.963+00
42	13	18	employee	21	hey , how ar you ,	f	2026-10-10 18:56:43.878+00
43	13	18	employee	21	we are almost finish your wor	f	2026-10-10 18:56:50.37+00
44	13	18	client	8	hello	f	2026-10-10 20:34:52.721+00
45	13	18	client	8	tst	f	2026-10-10 20:34:57.623+00
46	13	18	employee	21	test	f	2026-10-10 20:35:01.871+00
47	1	12	employee	5	test	f	2026-10-10 20:51:29.588+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, tenant_id, user_id, admin_user_id, type, payload, is_read, created_at) FROM stdin;
1	\N	\N	1	tenant_status_changed	{"status": "suspended", "entity_id": 2, "tenant_id": 2, "company_name": "TEST Beta Bouw"}	f	2026-10-08 22:46:27.284+00
2	\N	\N	2	tenant_status_changed	{"status": "suspended", "entity_id": 2, "tenant_id": 2, "company_name": "TEST Beta Bouw"}	f	2026-10-08 22:46:27.284+00
3	\N	\N	1	tenant_status_changed	{"status": "active", "entity_id": 2, "tenant_id": 2, "company_name": "TEST Beta Bouw"}	f	2026-10-08 22:46:27.427+00
4	\N	\N	2	tenant_status_changed	{"status": "active", "entity_id": 2, "tenant_id": 2, "company_name": "TEST Beta Bouw"}	f	2026-10-08 22:46:27.427+00
6	1	2	\N	project_cancelled	{"entity_id": 5, "project_id": 5, "project_name": "TEST Project Cancel"}	f	2026-10-08 23:15:05.508+00
7	1	1	\N	low_stock	{"unit": "piece", "on_hand": "2", "entity_id": 2, "material_id": 2, "material_name": "TEST Tape"}	f	2026-10-08 23:22:37.813+00
8	1	2	\N	low_stock	{"unit": "piece", "on_hand": "2", "entity_id": 2, "material_id": 2, "material_name": "TEST Tape"}	f	2026-10-08 23:22:37.813+00
9	1	1	\N	invoice_paid	{"amount": "1210", "entity_id": 1, "invoice_id": 1, "invoice_ref": "INV-2026-0001"}	f	2026-10-08 23:26:54.233+00
10	1	1	\N	margin_warning	{"cost_pct": "128", "entity_id": 4, "project_id": 4, "project_name": "TEST Project Main"}	f	2026-10-08 23:29:34.385+00
11	1	2	\N	margin_warning	{"cost_pct": "128", "entity_id": 4, "project_id": 4, "project_name": "TEST Project Main"}	f	2026-10-08 23:29:34.385+00
12	1	1	\N	margin_critical	{"cost_pct": "128", "entity_id": 4, "project_id": 4, "project_name": "TEST Project Main"}	f	2026-10-08 23:29:34.416+00
13	1	2	\N	margin_critical	{"cost_pct": "128", "entity_id": 4, "project_id": 4, "project_name": "TEST Project Main"}	f	2026-10-08 23:29:34.416+00
14	1	2	\N	task_assigned	{"task_id": 1, "entity_id": 1, "task_title": "TEST Painting walls", "project_name": "TEST Project Main"}	f	2026-10-08 23:34:33.24+00
15	1	3	\N	task_assigned	{"task_id": 1, "entity_id": 1, "task_title": "TEST Painting walls", "project_name": "TEST Project Main"}	f	2026-10-08 23:34:33.24+00
16	1	4	\N	task_assigned	{"task_id": 1, "entity_id": 1, "task_title": "TEST Painting walls", "project_name": "TEST Project Main"}	f	2026-10-08 23:34:33.24+00
17	1	5	\N	task_assigned	{"task_id": 1, "entity_id": 1, "task_title": "TEST Painting walls", "project_name": "TEST Project Main"}	f	2026-10-08 23:34:33.24+00
19	1	5	\N	task_assigned	{"task_id": 2, "entity_id": 2, "task_title": "TEST No assignee", "project_name": "TEST Project Main"}	f	2026-10-08 23:34:33.515+00
20	1	5	\N	task_status_changed	{"status": "in_progress", "task_id": 2, "entity_id": 2, "task_title": "TEST No assignee", "project_name": "TEST Project Main"}	f	2026-10-08 23:34:33.562+00
21	1	3	\N	task_assigned	{"task_id": 4, "entity_id": 4, "task_title": "TEST Others only", "project_name": "TEST Project Main"}	f	2026-10-08 23:35:04.135+00
22	1	4	\N	task_assigned	{"task_id": 4, "entity_id": 4, "task_title": "TEST Others only", "project_name": "TEST Project Main"}	f	2026-10-08 23:35:04.135+00
24	1	1	\N	abnormal_hours	{"date": "2026-10-06", "hours": "13.00", "entity_id": 6, "employee_id": 6, "employee_name": "TEST Worker 2"}	f	2026-10-08 23:35:04.882+00
25	1	2	\N	abnormal_hours	{"date": "2026-10-06", "hours": "13.00", "entity_id": 6, "employee_id": 6, "employee_name": "TEST Worker 2"}	f	2026-10-08 23:35:04.882+00
26	1	1	\N	margin_warning	{"cost_pct": "225", "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:35:04.92+00
27	1	2	\N	margin_warning	{"cost_pct": "225", "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:35:04.92+00
28	1	1	\N	margin_critical	{"cost_pct": "225", "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:35:04.944+00
29	1	2	\N	margin_critical	{"cost_pct": "225", "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:35:04.944+00
30	1	5	\N	task_assigned	{"task_id": 6, "entity_id": 6, "task_title": "TEST Delete me", "project_name": "TEST Project Main"}	f	2026-10-08 23:35:30.4+00
31	1	1	\N	low_stock	{"unit": "kg", "on_hand": "-20", "entity_id": 3, "material_id": 3, "material_name": "TEST Filler"}	f	2026-10-08 23:40:21.679+00
32	1	2	\N	low_stock	{"unit": "kg", "on_hand": "-20", "entity_id": 3, "material_id": 3, "material_name": "TEST Filler"}	f	2026-10-08 23:40:21.679+00
33	1	1	\N	reservation_unmet	{"unit": "kg", "short_by": "20", "entity_id": 3, "material_id": 3, "material_name": "TEST Filler"}	f	2026-10-08 23:40:21.721+00
34	1	2	\N	reservation_unmet	{"unit": "kg", "short_by": "20", "entity_id": 3, "material_id": 3, "material_name": "TEST Filler"}	f	2026-10-08 23:40:21.721+00
35	1	1	\N	missing_report	{"days": 3, "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:40:56.78+00
36	1	2	\N	missing_report	{"days": 3, "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:40:56.78+00
37	1	1	\N	progress_stalled	{"days": 7, "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:41:20.639+00
38	1	2	\N	progress_stalled	{"days": 7, "entity_id": 10, "project_id": 10, "project_name": "TEST Project Side"}	f	2026-10-08 23:41:20.639+00
39	1	5	\N	task_assigned	{"task_id": 7, "entity_id": 7, "task_title": "TEST Margin work", "project_name": "TEST Project Margin"}	f	2026-10-08 23:50:46.467+00
40	1	1	\N	margin_warning	{"cost_pct": "80", "entity_id": 12, "project_id": 12, "project_name": "TEST Project Alerts"}	f	2026-10-08 23:51:56.995+00
41	1	2	\N	margin_warning	{"cost_pct": "80", "entity_id": 12, "project_id": 12, "project_name": "TEST Project Alerts"}	f	2026-10-08 23:51:56.995+00
42	1	1	\N	margin_critical	{"cost_pct": "95", "entity_id": 12, "project_id": 12, "project_name": "TEST Project Alerts"}	f	2026-10-08 23:52:03.045+00
43	1	2	\N	margin_critical	{"cost_pct": "95", "entity_id": 12, "project_id": 12, "project_name": "TEST Project Alerts"}	f	2026-10-08 23:52:03.045+00
18	1	6	\N	task_assigned	{"task_id": 1, "entity_id": 1, "task_title": "TEST Painting walls", "project_name": "TEST Project Main"}	t	2026-10-08 23:34:33.24+00
44	1	1	\N	margin_warning	{"cost_pct": "80", "entity_id": 12, "project_id": 12, "project_name": "TEST Project Alerts"}	f	2026-10-08 23:52:12.908+00
45	1	2	\N	margin_warning	{"cost_pct": "80", "entity_id": 12, "project_id": 12, "project_name": "TEST Project Alerts"}	f	2026-10-08 23:52:12.908+00
46	1	1	\N	project_cancelled	{"entity_id": 13, "project_id": 13, "project_name": "TEST Project Stop"}	f	2026-10-08 23:52:59.129+00
47	1	2	\N	project_cancelled	{"entity_id": 13, "project_id": 13, "project_name": "TEST Project Stop"}	f	2026-10-08 23:52:59.129+00
48	1	2	\N	new_message	{"preview": "TEST hello", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:21.484+00
49	1	3	\N	new_message	{"preview": "TEST hello", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:21.484+00
50	1	4	\N	new_message	{"preview": "TEST hello", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:21.484+00
51	1	2	\N	new_message	{"preview": "TEST realtime", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:22.672+00
52	1	3	\N	new_message	{"preview": "TEST realtime", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:22.672+00
53	1	4	\N	new_message	{"preview": "TEST realtime", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:22.672+00
54	1	2	\N	new_message	{"preview": "TEST with files", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:59.962+00
55	1	3	\N	new_message	{"preview": "TEST with files", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:59.962+00
56	1	4	\N	new_message	{"preview": "TEST with files", "entity_id": 1, "sender_name": "Othmane Owner", "conversation_id": 1}	f	2026-10-08 23:56:59.962+00
57	1	2	\N	new_message	{"preview": "TEST o1", "entity_id": 5, "sender_name": "Othmane Owner", "conversation_id": 5}	f	2026-10-08 23:57:21.946+00
58	1	2	\N	new_message	{"preview": "TEST o2", "entity_id": 5, "sender_name": "Othmane Owner", "conversation_id": 5}	f	2026-10-08 23:57:22.003+00
59	1	1	\N	new_message	{"preview": "TEST m1", "entity_id": 5, "sender_name": "TEST Manager", "conversation_id": 5}	f	2026-10-08 23:57:22.046+00
60	1	2	\N	new_message	{"preview": "TEST p1", "entity_id": 5, "sender_name": "Othmane Owner", "conversation_id": 5}	f	2026-10-08 23:57:23.746+00
61	1	2	\N	new_message	{"preview": "TEST p2", "entity_id": 5, "sender_name": "Othmane Owner", "conversation_id": 5}	f	2026-10-08 23:57:23.791+00
62	1	2	\N	new_message	{"preview": "TEST p3", "entity_id": 5, "sender_name": "Othmane Owner", "conversation_id": 5}	f	2026-10-08 23:57:23.842+00
63	1	1	\N	new_message	{"preview": "TEST question from the client", "entity_id": 6, "sender_name": "TEST Client Main", "conversation_id": 6}	f	2026-10-09 00:06:22.691+00
64	1	1	\N	new_message	{"preview": "TEST second question from the client", "entity_id": 6, "sender_name": "TEST Client Main", "conversation_id": 6}	f	2026-10-09 00:06:39.948+00
65	1	1	\N	low_stock	{"unit": "kg", "on_hand": "5", "entity_id": 6, "material_id": 6, "material_name": "TEST Sand"}	f	2026-10-09 12:37:22.89+00
66	1	2	\N	low_stock	{"unit": "kg", "on_hand": "5", "entity_id": 6, "material_id": 6, "material_name": "TEST Sand"}	f	2026-10-09 12:37:22.89+00
67	1	5	\N	end_of_day_reminder	{"date": "2030-01-15"}	f	2026-10-09 12:39:16.508+00
69	2	14	\N	end_of_day_reminder	{"date": "2030-01-15"}	f	2026-10-09 12:39:53.839+00
70	1	1	\N	missing_timesheet	{"date": "2030-01-15", "entity_id": 5, "employee_id": 5, "employee_name": "TEST Worker"}	f	2026-10-09 12:41:33.244+00
71	1	2	\N	missing_timesheet	{"date": "2030-01-15", "entity_id": 5, "employee_id": 5, "employee_name": "TEST Worker"}	f	2026-10-09 12:41:33.244+00
72	1	1	\N	stalled_project	{"days": 5, "entity_id": 15, "project_id": 15, "project_name": "TEST Project Portal Staff"}	f	2026-10-09 12:42:21.964+00
73	1	2	\N	stalled_project	{"days": 5, "entity_id": 15, "project_id": 15, "project_name": "TEST Project Portal Staff"}	f	2026-10-09 12:42:21.964+00
74	1	1	\N	invoice_late	{"entity_id": 8, "invoice_id": 8, "balance_due": "242", "invoice_ref": "INV-2026-0008"}	f	2026-10-09 12:43:02.139+00
75	1	1	\N	invoice_late	{"entity_id": 4, "invoice_id": 4, "balance_due": "242", "invoice_ref": "INV-2026-0004"}	f	2026-10-09 12:43:02.25+00
76	1	1	\N	purchase_due	{"due_date": "2026-10-13", "entity_id": 12, "invoice_id": 12, "invoice_ref": "PUR-2026-0008"}	f	2026-10-09 12:43:59.961+00
79	1	5	\N	task_assigned	{"task_id": 8, "entity_id": 8, "task_title": "TEST Task Notif", "project_name": "TEST Project Main"}	f	2026-10-09 12:44:56.422+00
80	1	5	\N	task_assigned	{"task_id": 9, "entity_id": 9, "task_title": "TEST Task Tomorrow", "project_name": "TEST Project Main"}	f	2026-10-09 12:46:02.66+00
82	1	5	\N	task_starting	{"task_id": 9, "entity_id": 9, "start_date": "2026-10-10", "task_title": "TEST Task Tomorrow", "project_name": "TEST Project Main"}	f	2026-10-09 12:46:26.422+00
84	\N	\N	1	tenant_signed_up	{"entity_id": 7, "tenant_id": 7, "company_name": "TEST Epsilon"}	f	2026-10-09 12:48:32.497+00
85	\N	\N	2	tenant_signed_up	{"entity_id": 7, "tenant_id": 7, "company_name": "TEST Epsilon"}	f	2026-10-09 12:48:32.497+00
5	1	1	\N	project_cancelled	{"entity_id": 5, "project_id": 5, "project_name": "TEST Project Cancel"}	t	2026-10-08 23:15:05.508+00
23	1	6	\N	task_assigned	{"task_id": 5, "entity_id": 5, "task_title": "TEST Side work", "project_name": "TEST Project Side"}	t	2026-10-08 23:35:04.296+00
68	1	6	\N	end_of_day_reminder	{"date": "2030-01-15"}	t	2026-10-09 12:39:16.508+00
77	1	6	\N	task_assigned	{"task_id": 8, "entity_id": 8, "task_title": "TEST Task Notif", "project_name": "TEST Project Main"}	t	2026-10-09 12:44:41.686+00
78	1	6	\N	task_status_changed	{"status": "in_progress", "task_id": 8, "entity_id": 8, "task_title": "TEST Task Notif", "project_name": "TEST Project Main"}	t	2026-10-09 12:44:44.697+00
81	1	6	\N	task_assigned	{"task_id": 9, "entity_id": 9, "task_title": "TEST Task Tomorrow", "project_name": "TEST Project Main"}	t	2026-10-09 12:46:02.66+00
83	1	6	\N	task_starting	{"task_id": 9, "entity_id": 9, "start_date": "2026-10-10", "task_title": "TEST Task Tomorrow", "project_name": "TEST Project Main"}	t	2026-10-09 12:46:26.422+00
91	\N	\N	1	support_ticket_opened	{"subject": "TEST Cannot export", "entity_id": 1, "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:12:21.338+00
92	\N	\N	2	support_ticket_opened	{"subject": "TEST Cannot export", "entity_id": 1, "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:12:21.338+00
93	\N	\N	1	support_ticket_opened	{"subject": "TEST Beta billing", "entity_id": 2, "tenant_id": 2, "company_name": "TEST Beta Bouw"}	f	2026-10-09 13:13:07.962+00
94	\N	\N	2	support_ticket_opened	{"subject": "TEST Beta billing", "entity_id": 2, "tenant_id": 2, "company_name": "TEST Beta Bouw"}	f	2026-10-09 13:13:07.962+00
95	1	1	\N	support_reply	{"preview": "TEST platform reply", "entity_id": 9, "conversation_id": 9}	f	2026-10-09 13:13:18.601+00
96	1	1	\N	support_reply	{"preview": "TEST SUPC-03 reply", "entity_id": 9, "conversation_id": 9}	f	2026-10-09 13:13:34.609+00
97	1	1	\N	support_reply	{"preview": "TEST live socket reply", "entity_id": 9, "conversation_id": 9}	f	2026-10-09 13:14:02.872+00
98	\N	\N	1	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:37:16.192+00
99	\N	\N	2	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:37:16.192+00
100	\N	\N	1	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:41:48.246+00
101	\N	\N	2	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:41:48.246+00
102	\N	\N	1	payment_failed	{"amount": "20.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:42:05.578+00
103	\N	\N	2	payment_failed	{"amount": "20.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:42:05.578+00
104	1	1	\N	subscription_payment_failed	{"amount": "20.00"}	f	2026-10-09 13:42:05.793+00
105	1	1	\N	subscription_renewal_upcoming	{"amount_due": "15.00", "period_end": "2026-11-09"}	f	2026-10-09 13:43:25.142+00
106	\N	\N	1	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:43:47.832+00
107	\N	\N	2	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 13:43:47.832+00
108	1	5	\N	end_of_day_reminder	{"date": "2026-10-09"}	f	2026-10-09 16:25:33.491+00
109	\N	\N	1	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 16:51:01.114+00
110	\N	\N	2	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 16:51:01.114+00
111	\N	\N	1	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 17:30:10.016+00
112	\N	\N	2	payment_received	{"amount": "10.00", "tenant_id": 1, "company_name": "TEST Alpha Renovation"}	f	2026-10-09 17:30:10.016+00
113	\N	\N	1	tenant_status_changed	{"status": "suspended", "entity_id": 8, "tenant_id": 8, "company_name": "TEST Gamma"}	f	2026-10-09 19:08:03.185+00
114	\N	\N	2	tenant_status_changed	{"status": "suspended", "entity_id": 8, "tenant_id": 8, "company_name": "TEST Gamma"}	f	2026-10-09 19:08:03.185+00
115	\N	\N	1	tenant_status_changed	{"status": "active", "entity_id": 8, "tenant_id": 8, "company_name": "TEST Gamma"}	f	2026-10-09 19:08:03.263+00
116	\N	\N	2	tenant_status_changed	{"status": "active", "entity_id": 8, "tenant_id": 8, "company_name": "TEST Gamma"}	f	2026-10-09 19:08:03.263+00
117	\N	\N	1	tenant_signed_up	{"entity_id": 9, "tenant_id": 9, "company_name": "TEST Mail FR"}	f	2026-10-09 19:44:08.902+00
118	\N	\N	2	tenant_signed_up	{"entity_id": 9, "tenant_id": 9, "company_name": "TEST Mail FR"}	f	2026-10-09 19:44:08.902+00
119	\N	\N	1	tenant_signed_up	{"entity_id": 10, "tenant_id": 10, "company_name": "TEST Mail NL"}	f	2026-10-09 19:44:09.568+00
120	\N	\N	2	tenant_signed_up	{"entity_id": 10, "tenant_id": 10, "company_name": "TEST Mail NL"}	f	2026-10-09 19:44:09.568+00
121	\N	\N	1	tenant_signed_up	{"entity_id": 11, "tenant_id": 11, "company_name": "TEST Alert Check"}	f	2026-10-09 19:48:27.396+00
122	\N	\N	2	tenant_signed_up	{"entity_id": 11, "tenant_id": 11, "company_name": "TEST Alert Check"}	f	2026-10-09 19:48:27.396+00
123	1	1	\N	low_stock	{"unit": "kg", "on_hand": "5", "entity_id": 7, "material_id": 7, "material_name": "TEST NOT-28 Sand"}	f	2026-10-09 20:36:02.205+00
124	1	2	\N	low_stock	{"unit": "kg", "on_hand": "5", "entity_id": 7, "material_id": 7, "material_name": "TEST NOT-28 Sand"}	f	2026-10-09 20:36:02.205+00
125	2	14	\N	end_of_day_reminder	{"date": "2026-10-09"}	f	2026-10-09 21:00:00.378+00
126	1	1	\N	invoice_paid	{"amount": "242", "entity_id": 7, "invoice_id": 7, "invoice_ref": "INV-2026-0007"}	f	2026-10-09 23:00:15.566+00
127	1	1	\N	missing_report	{"days": 3, "entity_id": 15, "project_id": 15, "project_name": "TEST Project Portal Staff"}	f	2026-10-10 09:38:10.807+00
128	1	2	\N	missing_report	{"days": 3, "entity_id": 15, "project_id": 15, "project_name": "TEST Project Portal Staff"}	f	2026-10-10 09:38:10.807+00
129	2	14	\N	new_message	{"preview": "hello thre", "entity_id": 14, "sender_name": "Beta Owner", "conversation_id": 14}	f	2026-10-10 11:03:51.795+00
130	2	14	\N	new_message	{"preview": "hello there", "entity_id": 14, "sender_name": "Beta Owner", "conversation_id": 14}	f	2026-10-10 13:15:21.539+00
131	2	14	\N	new_message	{"preview": "this is perfect on this part", "entity_id": 14, "sender_name": "Beta Owner", "conversation_id": 14}	f	2026-10-10 13:15:26.805+00
132	1	6	\N	new_message	{"preview": "helllo there , we we stop on this part here", "entity_id": 15, "sender_name": "Othmane Owner", "conversation_id": 15}	f	2026-10-10 14:27:19.754+00
133	1	8	\N	new_message	{"preview": "helllo there , we we stop on this part here", "entity_id": 15, "sender_name": "Othmane Owner", "conversation_id": 15}	f	2026-10-10 14:27:19.754+00
134	1	6	\N	new_message	{"preview": "hello i talking to you", "entity_id": 15, "sender_name": "Othmane Owner", "conversation_id": 15}	f	2026-10-10 14:28:15.01+00
135	1	8	\N	new_message	{"preview": "hello i talking to you", "entity_id": 15, "sender_name": "Othmane Owner", "conversation_id": 15}	f	2026-10-10 14:28:15.01+00
136	1	1	\N	new_message	{"preview": "what the fuck is that man", "entity_id": 16, "sender_name": "TEST Worker 2", "conversation_id": 16}	f	2026-10-10 14:34:12.198+00
137	1	1	\N	new_message	{"preview": "answer me", "entity_id": 16, "sender_name": "TEST Worker 2", "conversation_id": 16}	f	2026-10-10 14:34:24.382+00
138	1	6	\N	new_message	{"preview": "hey what wrong with you man ???", "entity_id": 16, "sender_name": "Othmane Owner", "conversation_id": 16}	f	2026-10-10 14:34:53.468+00
139	1	5	\N	new_message	{"preview": "TEST live notification check", "entity_id": 12, "sender_name": "Othmane Owner", "conversation_id": 12}	f	2026-10-10 14:38:15.754+00
140	1	6	\N	new_message	{"preview": "this is the last warning", "entity_id": 16, "sender_name": "Othmane Owner", "conversation_id": 16}	f	2026-10-10 15:03:55.808+00
141	1	1	\N	new_message	{"preview": "oky sorry", "entity_id": 16, "sender_name": "TEST Worker 2", "conversation_id": 16}	f	2026-10-10 15:04:11.352+00
142	1	6	\N	new_message	{"preview": "no problm", "entity_id": 16, "sender_name": "Othmane Owner", "conversation_id": 16}	f	2026-10-10 15:04:15.004+00
143	1	1	\N	new_message	{"preview": ".", "entity_id": 16, "sender_name": "TEST Worker 2", "conversation_id": 16}	f	2026-10-10 15:04:31.553+00
144	1	6	\N	end_of_day_reminder	{"date": "2026-10-10"}	f	2026-10-10 16:00:00.102+00
145	1	1	\N	low_stock	{"unit": "pcs 1", "on_hand": "2", "entity_id": 25, "material_id": 25, "material_name": "TEST Brick 1"}	f	2026-10-10 17:31:57.874+00
146	1	2	\N	low_stock	{"unit": "pcs 1", "on_hand": "2", "entity_id": 25, "material_id": 25, "material_name": "TEST Brick 1"}	f	2026-10-10 17:31:57.874+00
147	1	1	\N	low_stock	{"unit": "pcs 2", "on_hand": "2", "entity_id": 26, "material_id": 26, "material_name": "TEST Brick 2"}	f	2026-10-10 17:31:57.971+00
148	1	2	\N	low_stock	{"unit": "pcs 2", "on_hand": "2", "entity_id": 26, "material_id": 26, "material_name": "TEST Brick 2"}	f	2026-10-10 17:31:57.971+00
149	1	1	\N	low_stock	{"unit": "pcs 3", "on_hand": "2", "entity_id": 27, "material_id": 27, "material_name": "TEST Brick 3"}	f	2026-10-10 17:31:58.046+00
150	1	2	\N	low_stock	{"unit": "pcs 3", "on_hand": "2", "entity_id": 27, "material_id": 27, "material_name": "TEST Brick 3"}	f	2026-10-10 17:31:58.046+00
151	1	1	\N	low_stock	{"unit": "pcs 4", "on_hand": "2", "entity_id": 28, "material_id": 28, "material_name": "TEST Brick 4"}	f	2026-10-10 17:31:58.131+00
152	1	2	\N	low_stock	{"unit": "pcs 4", "on_hand": "2", "entity_id": 28, "material_id": 28, "material_name": "TEST Brick 4"}	f	2026-10-10 17:31:58.131+00
153	1	1	\N	low_stock	{"unit": "pcs 5", "on_hand": "2", "entity_id": 29, "material_id": 29, "material_name": "TEST Brick 5"}	f	2026-10-10 17:31:58.215+00
154	1	2	\N	low_stock	{"unit": "pcs 5", "on_hand": "2", "entity_id": 29, "material_id": 29, "material_name": "TEST Brick 5"}	f	2026-10-10 17:31:58.215+00
155	1	1	\N	low_stock	{"unit": "pcs 6", "on_hand": "2", "entity_id": 30, "material_id": 30, "material_name": "TEST Brick 6"}	f	2026-10-10 17:31:58.297+00
156	1	2	\N	low_stock	{"unit": "pcs 6", "on_hand": "2", "entity_id": 30, "material_id": 30, "material_name": "TEST Brick 6"}	f	2026-10-10 17:31:58.297+00
157	1	1	\N	low_stock	{"unit": "pcs 7", "on_hand": "2", "entity_id": 31, "material_id": 31, "material_name": "TEST Brick 7"}	f	2026-10-10 17:31:58.382+00
158	1	2	\N	low_stock	{"unit": "pcs 7", "on_hand": "2", "entity_id": 31, "material_id": 31, "material_name": "TEST Brick 7"}	f	2026-10-10 17:31:58.382+00
159	1	1	\N	low_stock	{"unit": "pcs 8", "on_hand": "2", "entity_id": 32, "material_id": 32, "material_name": "TEST Brick 8"}	f	2026-10-10 17:31:58.446+00
160	1	2	\N	low_stock	{"unit": "pcs 8", "on_hand": "2", "entity_id": 32, "material_id": 32, "material_name": "TEST Brick 8"}	f	2026-10-10 17:31:58.446+00
161	1	1	\N	low_stock	{"unit": "pcs 9", "on_hand": "2", "entity_id": 33, "material_id": 33, "material_name": "TEST Brick 9"}	f	2026-10-10 17:31:58.553+00
162	1	2	\N	low_stock	{"unit": "pcs 9", "on_hand": "2", "entity_id": 33, "material_id": 33, "material_name": "TEST Brick 9"}	f	2026-10-10 17:31:58.553+00
163	1	1	\N	low_stock	{"unit": "pcs 10", "on_hand": "2", "entity_id": 34, "material_id": 34, "material_name": "TEST Brick 10"}	f	2026-10-10 17:31:58.637+00
164	1	2	\N	low_stock	{"unit": "pcs 10", "on_hand": "2", "entity_id": 34, "material_id": 34, "material_name": "TEST Brick 10"}	f	2026-10-10 17:31:58.637+00
165	1	1	\N	low_stock	{"unit": "pcs 11", "on_hand": "2", "entity_id": 35, "material_id": 35, "material_name": "TEST Brick 11"}	f	2026-10-10 17:31:58.757+00
166	1	2	\N	low_stock	{"unit": "pcs 11", "on_hand": "2", "entity_id": 35, "material_id": 35, "material_name": "TEST Brick 11"}	f	2026-10-10 17:31:58.757+00
167	1	1	\N	low_stock	{"unit": "pcs 12", "on_hand": "2", "entity_id": 36, "material_id": 36, "material_name": "TEST Brick 12"}	f	2026-10-10 17:31:58.893+00
168	1	2	\N	low_stock	{"unit": "pcs 12", "on_hand": "2", "entity_id": 36, "material_id": 36, "material_name": "TEST Brick 12"}	f	2026-10-10 17:31:58.893+00
169	1	1	\N	low_stock	{"unit": "pcs 13", "on_hand": "2", "entity_id": 37, "material_id": 37, "material_name": "TEST Brick 13"}	f	2026-10-10 17:31:58.97+00
170	1	2	\N	low_stock	{"unit": "pcs 13", "on_hand": "2", "entity_id": 37, "material_id": 37, "material_name": "TEST Brick 13"}	f	2026-10-10 17:31:58.97+00
171	1	1	\N	low_stock	{"unit": "pcs 14", "on_hand": "2", "entity_id": 38, "material_id": 38, "material_name": "TEST Brick 14"}	f	2026-10-10 17:31:59.058+00
172	1	2	\N	low_stock	{"unit": "pcs 14", "on_hand": "2", "entity_id": 38, "material_id": 38, "material_name": "TEST Brick 14"}	f	2026-10-10 17:31:59.058+00
173	1	1	\N	low_stock	{"unit": "pcs 15", "on_hand": "2", "entity_id": 39, "material_id": 39, "material_name": "TEST Brick 15"}	f	2026-10-10 17:31:59.171+00
174	1	2	\N	low_stock	{"unit": "pcs 15", "on_hand": "2", "entity_id": 39, "material_id": 39, "material_name": "TEST Brick 15"}	f	2026-10-10 17:31:59.171+00
175	1	1	\N	low_stock	{"unit": "pcs 16", "on_hand": "2", "entity_id": 40, "material_id": 40, "material_name": "TEST Brick 16"}	f	2026-10-10 17:31:59.27+00
176	1	2	\N	low_stock	{"unit": "pcs 16", "on_hand": "2", "entity_id": 40, "material_id": 40, "material_name": "TEST Brick 16"}	f	2026-10-10 17:31:59.27+00
177	1	1	\N	low_stock	{"unit": "pcs 17", "on_hand": "2", "entity_id": 41, "material_id": 41, "material_name": "TEST Brick 17"}	f	2026-10-10 17:31:59.326+00
178	1	2	\N	low_stock	{"unit": "pcs 17", "on_hand": "2", "entity_id": 41, "material_id": 41, "material_name": "TEST Brick 17"}	f	2026-10-10 17:31:59.326+00
181	1	1	\N	low_stock	{"unit": "pcs 19", "on_hand": "2", "entity_id": 43, "material_id": 43, "material_name": "TEST Brick 19"}	f	2026-10-10 17:31:59.499+00
182	1	2	\N	low_stock	{"unit": "pcs 19", "on_hand": "2", "entity_id": 43, "material_id": 43, "material_name": "TEST Brick 19"}	f	2026-10-10 17:31:59.499+00
183	1	1	\N	low_stock	{"unit": "pcs 20", "on_hand": "2", "entity_id": 44, "material_id": 44, "material_name": "TEST Brick 20"}	f	2026-10-10 17:31:59.58+00
184	1	2	\N	low_stock	{"unit": "pcs 20", "on_hand": "2", "entity_id": 44, "material_id": 44, "material_name": "TEST Brick 20"}	f	2026-10-10 17:31:59.58+00
187	1	1	\N	low_stock	{"unit": "pcs 22", "on_hand": "2", "entity_id": 46, "material_id": 46, "material_name": "TEST Brick 22"}	f	2026-10-10 17:31:59.742+00
188	1	2	\N	low_stock	{"unit": "pcs 22", "on_hand": "2", "entity_id": 46, "material_id": 46, "material_name": "TEST Brick 22"}	f	2026-10-10 17:31:59.742+00
193	1	1	\N	low_stock	{"unit": "pcs 25", "on_hand": "2", "entity_id": 49, "material_id": 49, "material_name": "TEST Brick 25"}	f	2026-10-10 17:32:00.103+00
194	1	2	\N	low_stock	{"unit": "pcs 25", "on_hand": "2", "entity_id": 49, "material_id": 49, "material_name": "TEST Brick 25"}	f	2026-10-10 17:32:00.103+00
179	1	1	\N	low_stock	{"unit": "pcs 18", "on_hand": "2", "entity_id": 42, "material_id": 42, "material_name": "TEST Brick 18"}	f	2026-10-10 17:31:59.418+00
180	1	2	\N	low_stock	{"unit": "pcs 18", "on_hand": "2", "entity_id": 42, "material_id": 42, "material_name": "TEST Brick 18"}	f	2026-10-10 17:31:59.418+00
195	1	1	\N	low_stock	{"unit": "pcs 26", "on_hand": "2", "entity_id": 50, "material_id": 50, "material_name": "TEST Brick 26"}	f	2026-10-10 17:32:00.185+00
196	1	2	\N	low_stock	{"unit": "pcs 26", "on_hand": "2", "entity_id": 50, "material_id": 50, "material_name": "TEST Brick 26"}	f	2026-10-10 17:32:00.185+00
185	1	1	\N	low_stock	{"unit": "pcs 21", "on_hand": "2", "entity_id": 45, "material_id": 45, "material_name": "TEST Brick 21"}	f	2026-10-10 17:31:59.65+00
186	1	2	\N	low_stock	{"unit": "pcs 21", "on_hand": "2", "entity_id": 45, "material_id": 45, "material_name": "TEST Brick 21"}	f	2026-10-10 17:31:59.65+00
189	1	1	\N	low_stock	{"unit": "pcs 23", "on_hand": "2", "entity_id": 47, "material_id": 47, "material_name": "TEST Brick 23"}	f	2026-10-10 17:31:59.868+00
190	1	2	\N	low_stock	{"unit": "pcs 23", "on_hand": "2", "entity_id": 47, "material_id": 47, "material_name": "TEST Brick 23"}	f	2026-10-10 17:31:59.868+00
197	1	1	\N	low_stock	{"unit": "pcs 27", "on_hand": "2", "entity_id": 51, "material_id": 51, "material_name": "TEST Brick 27"}	f	2026-10-10 17:32:00.27+00
198	1	2	\N	low_stock	{"unit": "pcs 27", "on_hand": "2", "entity_id": 51, "material_id": 51, "material_name": "TEST Brick 27"}	f	2026-10-10 17:32:00.27+00
191	1	1	\N	low_stock	{"unit": "pcs 24", "on_hand": "2", "entity_id": 48, "material_id": 48, "material_name": "TEST Brick 24"}	f	2026-10-10 17:31:59.998+00
192	1	2	\N	low_stock	{"unit": "pcs 24", "on_hand": "2", "entity_id": 48, "material_id": 48, "material_name": "TEST Brick 24"}	f	2026-10-10 17:31:59.998+00
199	1	1	\N	low_stock	{"unit": "pcs 28", "on_hand": "2", "entity_id": 52, "material_id": 52, "material_name": "TEST Brick 28"}	f	2026-10-10 17:32:00.349+00
200	1	2	\N	low_stock	{"unit": "pcs 28", "on_hand": "2", "entity_id": 52, "material_id": 52, "material_name": "TEST Brick 28"}	f	2026-10-10 17:32:00.349+00
201	1	1	\N	low_stock	{"unit": "pcs 29", "on_hand": "2", "entity_id": 53, "material_id": 53, "material_name": "TEST Brick 29"}	f	2026-10-10 17:32:00.414+00
202	1	2	\N	low_stock	{"unit": "pcs 29", "on_hand": "2", "entity_id": 53, "material_id": 53, "material_name": "TEST Brick 29"}	f	2026-10-10 17:32:00.414+00
203	1	2	\N	import_done	{"entity_id": 1, "file_name": "Flle 1.xlsx", "row_count": 29, "error_count": 0, "import_type": "materials", "created_count": 29, "updated_count": 0, "import_batch_id": 1}	f	2026-10-10 17:32:00.487+00
204	1	2	\N	import_done	{"entity_id": 2, "file_name": "Flle 1 (1).xlsx", "row_count": 36, "error_count": 0, "import_type": "stock", "created_count": 36, "updated_count": 0, "import_batch_id": 2}	f	2026-10-10 17:34:12.875+00
210	1	4	\N	new_message	{"preview": "hello there", "entity_id": 17, "sender_name": "Othmane Owner", "conversation_id": 17}	f	2026-10-10 17:57:04.92+00
211	1	4	\N	new_message	{"preview": "wake up", "entity_id": 17, "sender_name": "Othmane Owner", "conversation_id": 17}	f	2026-10-10 17:57:06.792+00
212	1	4	\N	new_message	{"preview": "man", "entity_id": 17, "sender_name": "Othmane Owner", "conversation_id": 17}	f	2026-10-10 17:57:07.671+00
213	1	4	\N	new_message	{"preview": "i neeed you here", "entity_id": 17, "sender_name": "Othmane Owner", "conversation_id": 17}	f	2026-10-10 17:57:12.973+00
214	1	2	\N	new_message	{"preview": "TEST client text only", "entity_id": 19, "sender_name": "TEST Limit Client 5", "conversation_id": 19}	f	2026-10-10 18:34:14.871+00
215	1	2	\N	new_message	{"preview": "TEST client with 2 files", "entity_id": 19, "sender_name": "TEST Limit Client 5", "conversation_id": 19}	f	2026-10-10 18:34:17.409+00
205	13	21	\N	low_stock	{"unit": "pièce", "on_hand": "50", "entity_id": 12, "material_id": 12, "material_name": "Bloc béton creux 39x19x14"}	t	2026-10-10 17:52:02.23+00
206	13	21	\N	low_stock	{"unit": "pièce", "on_hand": "50", "entity_id": 13, "material_id": 13, "material_name": "Brique de parement rouge"}	t	2026-10-10 17:52:02.385+00
207	13	21	\N	low_stock	{"unit": "barre", "on_hand": "50", "entity_id": 14, "material_id": 14, "material_name": "Fer à béton HA Ø10 – barre 6 m"}	t	2026-10-10 17:52:02.546+00
208	13	21	\N	low_stock	{"unit": "m2", "on_hand": "50", "entity_id": 19, "material_id": 19, "material_name": "Laine de verre 100 mm"}	t	2026-10-10 17:52:02.648+00
209	13	21	\N	import_done	{"entity_id": 3, "file_name": "Flle 1 (2).xlsx", "row_count": 16, "error_count": 0, "import_type": "stock", "created_count": 16, "updated_count": 0, "import_batch_id": 3}	t	2026-10-10 17:52:02.827+00
216	13	21	\N	new_message	{"preview": "hello there", "entity_id": 18, "sender_name": "Eya Jarray", "conversation_id": 18}	t	2026-10-10 18:56:33.011+00
217	13	21	\N	abnormal_hours	{"date": "2026-10-11", "hours": "20.00", "entity_id": 21, "employee_id": 21, "employee_name": "ziko"}	t	2026-10-10 19:13:15.512+00
218	12	20	\N	trial_ending	{"entity_id": 12, "trial_end": "2026-10-12"}	f	2026-10-10 19:35:42.886+00
219	12	20	\N	trial_ended	{"entity_id": 12, "grace_ends_at": "2026-10-16"}	f	2026-10-10 19:35:51.696+00
221	\N	\N	1	payment_received	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:36:25.506+00
222	\N	\N	2	payment_received	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:36:25.506+00
220	12	20	\N	subscription_blocked	{"entity_id": 12}	f	2026-10-10 19:36:15.539+00
223	\N	\N	1	payment_failed	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:25.678+00
224	\N	\N	2	payment_failed	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:25.678+00
225	12	20	\N	subscription_payment_failed	{"amount": "10.00", "grace_ends_at": "2026-10-17"}	f	2026-10-10 19:44:25.726+00
226	\N	\N	1	payment_failed	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:26.482+00
227	\N	\N	2	payment_failed	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:26.482+00
228	12	20	\N	subscription_payment_failed	{"amount": "10.00", "grace_ends_at": "2026-10-15"}	f	2026-10-10 19:44:26.5+00
229	12	20	\N	subscription_blocked	{"entity_id": 12}	f	2026-10-10 19:44:27.178+00
230	\N	\N	1	payment_failed	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:27.654+00
231	\N	\N	2	payment_failed	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:27.654+00
232	12	20	\N	subscription_payment_failed	{"amount": "10.00"}	f	2026-10-10 19:44:27.685+00
233	\N	\N	1	payment_received	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:28.227+00
234	\N	\N	2	payment_received	{"amount": "10.00", "tenant_id": 12, "company_name": "TEST B18 Admin Company"}	f	2026-10-10 19:44:28.227+00
235	13	21	\N	margin_warning	{"cost_pct": "124", "entity_id": 17, "project_id": 17, "project_name": "Renovation"}	f	2026-10-10 19:46:39.513+00
236	13	21	\N	margin_critical	{"cost_pct": "124", "entity_id": 17, "project_id": 17, "project_name": "Renovation"}	f	2026-10-10 19:46:39.55+00
237	13	21	\N	low_stock	{"unit": "m3", "on_hand": "-23.19", "entity_id": 11, "material_id": 11, "material_name": "Béton prêt à l’emploi C25/30"}	f	2026-10-10 19:50:37.589+00
238	13	21	\N	reservation_unmet	{"unit": "m3", "short_by": "23.19", "entity_id": 11, "material_id": 11, "material_name": "Béton prêt à l’emploi C25/30"}	f	2026-10-10 19:50:37.622+00
239	13	21	\N	new_message	{"preview": "hello", "entity_id": 18, "sender_name": "Eya Jarray", "conversation_id": 18}	f	2026-10-10 20:34:52.803+00
240	13	21	\N	new_message	{"preview": "tst", "entity_id": 18, "sender_name": "Eya Jarray", "conversation_id": 18}	f	2026-10-10 20:34:57.68+00
241	1	1	\N	new_message	{"preview": "test", "entity_id": 12, "sender_name": "TEST Worker", "conversation_id": 12}	f	2026-10-10 20:51:29.692+00
242	2	14	\N	end_of_day_reminder	{"date": "2026-10-10"}	f	2026-10-10 21:00:00.083+00
\.


--
-- Data for Name: one_time_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.one_time_codes (id, user_id, admin_user_id, type, code_hash, expires_at, consumed_at, attempt_count, created_at, tenant_id) FROM stdin;
1	\N	2	admin_2fa	05d62a499f29a932b36f4b85a83dd02da33bf277a6bf744cbcd5c308d2b4cebd	2026-10-08 22:51:42.96+00	2026-10-08 22:46:43.024+00	0	2026-10-08 22:46:42.962+00	\N
2	\N	2	admin_2fa	e5dd60eca8981732efcbc9a7cd50edb6f3e9ece7b9a530dc50f0dbb066f21c6b	2026-10-08 22:51:43.028+00	2026-10-08 22:46:43.092+00	3	2026-10-08 22:46:43.028+00	\N
3	\N	2	admin_2fa	ef73d75fd9ca32c486a32d48ba443b70b576d7bce3809a494c74140b350da202	2026-10-08 22:51:43.155+00	2026-10-08 22:46:43.184+00	1	2026-10-08 22:46:43.156+00	\N
4	\N	2	admin_2fa	72b59726512552db374db8088bb391d86cac45b90e9b8a2c37ebfc45eafcb485	2026-10-08 22:51:43.244+00	2026-10-08 22:46:43.282+00	3	2026-10-08 22:46:43.245+00	\N
5	15	\N	email_verification	a48411432bee2490efff8ded5780450f084cb00964fe0498da6197ac5c0f09d4	2026-10-10 12:48:32.535+00	\N	0	2026-10-09 12:48:32.538+00	\N
6	17	\N	email_verification	6e51e6450705fe9534d07124b7abd2661c096b38e4c76d67decbb03e6ed511d1	2026-10-10 19:44:08.95+00	\N	0	2026-10-09 19:44:08.952+00	\N
7	18	\N	email_verification	487636569fbef97285f6b1de84ff4b85eecb8789b232bd9f08fb899fc6b89272	2026-10-10 19:44:09.579+00	\N	0	2026-10-09 19:44:09.58+00	\N
8	19	\N	email_verification	3b90ae710a693555ed2f525c06fe5ab25ccab06e1d43d27a748da4849a84ae77	2026-10-10 19:48:27.413+00	\N	0	2026-10-09 19:48:27.414+00	\N
9	\N	\N	email_verification	eed29a8daf4e7c4f5743b7495d8bfcde12b48ad3f53301ba6ec9d89d5062edb8	2026-10-11 15:08:07.256+00	2026-10-10 15:08:20.458+00	0	2026-10-10 15:08:07.257+00	13
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, tenant_id, invoice_id, amount, method, reference, payment_date, created_by, created_at, note) FROM stdin;
1	1	1	500.00	transfer	TEST-1	2026-10-08	1	2026-10-08 23:26:54.137+00	\N
2	1	1	710.00	transfer	TEST-2	2026-10-08	1	2026-10-08 23:26:54.192+00	\N
3	1	7	262.00	transfer	TEST B18	2026-10-09	1	2026-10-09 23:00:15.427+00	\N
5	1	7	-20.00	transfer	\N	2026-10-09	1	2026-10-09 23:00:16.845+00	TEST typed 262 instead of 242
6	1	7	-142.00	transfer	\N	2026-10-09	1	2026-10-09 23:00:17.17+00	TEST bounced part
7	1	7	-100.00	transfer	\N	2026-10-09	1	2026-10-09 23:00:17.528+00	TEST bounced rest
\.


--
-- Data for Name: plan_features; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_features (id, plan_id, feature_key, limit_value, overage_rate) FROM stdin;
1	1	max_workers	2	2.00
2	1	max_managers	3	5.00
3	1	max_clients	3	1.00
4	1	max_subcontractors	2	1.00
5	1	storage_gb	1	0.50
6	1	retention_days	30	0.00
7	2	max_workers	2	2.00
8	2	max_managers	3	5.00
9	2	max_clients	3	1.00
10	2	max_subcontractors	2	1.00
11	2	storage_gb	0	0.00
12	2	retention_days	30	0.00
13	3	max_workers	50	1.00
14	3	max_managers	20	1.00
15	3	max_clients	500	0.10
16	3	max_subcontractors	100	0.10
17	3	storage_gb	10	0.20
18	3	retention_days	365	0.00
19	4	max_workers	2	2.00
20	4	max_managers	3	5.00
21	4	max_clients	3	1.00
22	4	max_subcontractors	2	1.00
23	4	storage_gb	1	0.50
24	4	retention_days	30	0.00
25	5	max_workers	5	2.00
26	5	max_managers	5	5.00
27	5	max_clients	5	1.00
28	5	max_subcontractors	5	1.00
29	5	storage_gb	2	0.50
30	5	retention_days	30	0.00
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plans (id, name, base_price, is_active, is_default, parent_plan_id, stripe_price_id, created_at) FROM stdin;
1	TEST Small	10.00	t	t	\N	price_1UOPWw5hh9F3Yct5qP7nBu1C	2026-10-08 22:11:13.642+00
2	TEST Zero Storage	5.00	t	f	\N	price_1UOPWy5hh9F3Yct5Kc3rriZ1	2026-10-08 22:11:15.536+00
3	TEST Big	50.00	t	f	\N	price_1UOPX05hh9F3Yct5M6raaV7g	2026-10-08 22:11:16.77+00
4	TEST Closed	7.00	f	f	\N	price_1UOdvS5hh9F3Yct53HKJ7IDI	2026-10-09 13:33:30.32+00
5	TEST Mid	20.00	t	f	\N	price_1UOdvp5hh9F3Yct5cHBs6xgy	2026-10-09 13:33:54.069+00
\.


--
-- Data for Name: portal_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portal_tokens (id, tenant_id, client_id, project_id, token_hash, is_active, expires_at, created_by, created_at) FROM stdin;
1	1	1	14	8d35893105b13a68462d4d47f305f6dda0ffc6fb24d9a9dac0ed38c3feba3e5e	f	2027-01-07 00:01:24.285+00	1	2026-10-09 00:01:24.289+00
2	1	1	14	f25e080d3745e0481c5cc4b8ac67f3cb2c0edfde74ee09f77fe992d9e3bf89d5	f	2026-10-16 00:03:52.355+00	1	2026-10-09 00:03:52.361+00
3	1	1	14	6004009c7442dbec4208496e0b81f3516a33d7b7b57ed7a530cd2a53f687d66c	f	2027-01-07 00:03:52.804+00	1	2026-10-09 00:03:52.809+00
4	1	1	14	84a189eb34171c4ddbc519fa97073b1718c942f3fa735c51e707380f45cadc9b	f	2027-01-07 00:04:07.467+00	1	2026-10-09 00:04:07.473+00
5	1	1	14	686cfc10f8a252c28b91eef125e59a6e7c567c390484cf2d597e6ac4d2cb9f0f	f	2027-01-07 00:04:08.078+00	1	2026-10-09 00:04:08.084+00
6	1	1	14	a52ff7ea5cd467ac834dcc626b123a5e6e0c86687d56675755361fd7703ccd26	f	2026-10-08 00:04:08.451829+00	1	2026-10-09 00:04:08.249+00
8	2	3	8	14f192c75bad66baefead6ce02d50c680b9a3f500264c43d2568a300324eebdd	t	2027-01-07 00:07:06.297+00	9	2026-10-09 00:07:06.304+00
7	1	1	14	bdfd6a7b73ef52fa6d3c522bf9cad8e6d87e26dc8621b5b23bf044497171bd9c	f	2027-01-07 00:04:27.538+00	1	2026-10-09 00:04:27.548+00
9	1	1	14	ed50a25598504be9e49a7195e6b9ce85cc4b3fb2a947b4b1822c256d720fce7b	t	2027-01-07 12:19:35.343+00	1	2026-10-09 12:19:35.37+00
10	1	1	4	629b7419ccfade67c750317c8e286983ecb93fb1418329800a3ed0163c6114d7	t	2027-01-07 13:04:47.227+00	1	2026-10-09 13:04:47.244+00
12	1	7	16	4f7c6471487d04c415a2e2d8e265a39e84229de20d3292121fe6a3b9d6e6988e	t	2027-01-08 18:34:07.643+00	2	2026-10-10 18:34:07.657+00
11	13	8	17	4fa5455e3d870b91b38a4d35f02ed7e4a1ac884a54fbabb4003390474b3e0d8c	f	2027-01-08 18:10:54.968+00	21	2026-10-10 18:10:54.981+00
13	13	8	17	27fd41f000c8450cfc90d7515b8d352df8a66062cea11c20cac4f1420af71fe4	t	2027-01-08 20:34:14.05+00	21	2026-10-10 20:34:14.061+00
\.


--
-- Data for Name: portal_tracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portal_tracking (id, tenant_id, portal_token_id, event_type, ip_address, created_at) FROM stdin;
1	1	4	view	::1	2026-10-09 00:04:07.76+00
2	1	7	view	::1	2026-10-09 00:04:27.681+00
3	1	7	view	::1	2026-10-09 00:04:36.667+00
4	1	7	view	::1	2026-10-09 00:05:42.601+00
5	1	7	download	::1	2026-10-09 00:05:53.558+00
6	1	7	download	::1	2026-10-09 00:05:56.892+00
7	2	8	view	::1	2026-10-09 00:07:07.047+00
8	1	7	view	::1	2026-10-09 00:07:08.084+00
9	1	10	download	::1	2026-10-09 13:04:47.4+00
10	13	11	view	::1	2026-10-10 18:11:03.669+00
11	13	11	view	::1	2026-10-10 18:56:28.274+00
12	13	13	view	::ffff:127.0.0.1	2026-10-10 20:34:23.878+00
\.


--
-- Data for Name: project_closure_snapshot_costs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_closure_snapshot_costs (id, tenant_id, snapshot_id, cost_type_id, amount) FROM stdin;
1	1	4	4	200.00
2	1	4	3	400.00
3	1	4	1	400.00
4	1	4	2	2500.00
5	1	5	4	900.00
6	1	5	3	400.00
7	1	5	1	400.00
8	1	5	2	2500.00
9	1	6	4	3000.00
\.


--
-- Data for Name: project_closure_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_closure_snapshots (id, tenant_id, project_id, budget_excl_vat, total_cost, margin_excl_vat, margin_pct, closed_by, closed_at, voided_at, voided_by) FROM stdin;
1	1	1	0.00	0.00	0.00	\N	1	2026-10-08 23:14:56.411+00	2026-10-08 23:14:56.515+00	1
2	1	5	0.00	0.00	0.00	\N	1	2026-10-08 23:15:05.445+00	\N	\N
3	1	1	0.00	0.00	0.00	\N	1	2026-10-08 23:15:08.97+00	\N	\N
4	1	11	11500.00	3500.00	8000.00	69.57	2	2026-10-08 23:52:37.787+00	2026-10-08 23:52:38.763+00	1
5	1	11	11500.00	4200.00	7300.00	63.48	1	2026-10-08 23:52:38.967+00	\N	\N
6	1	13	4000.00	3000.00	1000.00	25.00	1	2026-10-08 23:52:59.052+00	\N	\N
\.


--
-- Data for Name: project_margin_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_margin_alerts (tenant_id, project_id, level, fired_at) FROM stdin;
1	4	warning	2026-10-08 23:29:34.36+00
1	4	critical	2026-10-08 23:29:34.396+00
1	10	warning	2026-10-08 23:35:04.904+00
1	10	critical	2026-10-08 23:35:04.928+00
1	12	warning	2026-10-08 23:52:12.894+00
13	17	warning	2026-10-10 19:46:39.495+00
13	17	critical	2026-10-10 19:46:39.524+00
\.


--
-- Data for Name: project_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.project_status_history (id, tenant_id, project_id, from_status, to_status, reason, changed_by, changed_at) FROM stdin;
1	1	1	\N	prospect	\N	1	2026-10-08 23:14:32.762+00
4	1	4	\N	prospect	\N	1	2026-10-08 23:14:56.098+00
5	1	1	prospect	in_progress	\N	1	2026-10-08 23:14:56.238+00
6	1	1	in_progress	completed	\N	1	2026-10-08 23:14:56.353+00
7	1	1	completed	in_progress	\N	1	2026-10-08 23:14:56.508+00
8	1	5	\N	prospect	\N	1	2026-10-08 23:15:05.372+00
9	1	5	prospect	cancelled	TEST client withdrew	1	2026-10-08 23:15:05.427+00
11	1	1	in_progress	completed	\N	1	2026-10-08 23:15:08.948+00
12	1	4	prospect	in_progress	quote_accepted	1	2026-10-08 23:26:22.499+00
13	1	7	\N	prospect	\N	1	2026-10-08 23:26:37.849+00
14	2	8	\N	prospect	\N	9	2026-10-08 23:27:30.563+00
15	1	9	\N	prospect	\N	1	2026-10-08 23:29:11.227+00
16	1	10	\N	prospect	\N	1	2026-10-08 23:34:31.632+00
17	1	10	prospect	in_progress	quote_accepted	1	2026-09-28 23:34:33.133+00
18	1	11	\N	prospect	\N	1	2026-10-08 23:50:46.313+00
19	1	12	\N	prospect	\N	1	2026-10-08 23:50:46.354+00
20	1	13	\N	prospect	\N	1	2026-10-08 23:50:46.381+00
21	1	11	prospect	in_progress	quote_accepted	1	2026-10-08 23:51:05.751+00
22	1	12	prospect	in_progress	quote_accepted	1	2026-10-08 23:51:50.907+00
23	1	11	in_progress	completed	\N	2	2026-10-08 23:52:37.75+00
24	1	11	completed	in_progress	TEST reopen	1	2026-10-08 23:52:38.753+00
25	1	11	in_progress	completed	\N	1	2026-10-08 23:52:38.946+00
26	1	13	prospect	in_progress	quote_accepted	1	2026-10-08 23:52:58.646+00
27	1	13	in_progress	cancelled	TEST client stopped	1	2026-10-08 23:52:59.014+00
28	1	14	\N	prospect	\N	1	2026-10-09 00:01:02.981+00
29	1	14	prospect	in_progress	quote_accepted	\N	2026-10-09 00:04:51.181+00
30	1	15	\N	prospect	\N	1	2026-10-09 00:05:21.775+00
31	1	15	prospect	in_progress	quote_accepted	1	2026-10-03 12:40:48.237954+00
32	1	16	\N	prospect	\N	2	2026-10-09 17:40:16.612+00
33	13	17	\N	prospect	\N	21	2026-10-10 18:00:14.537+00
34	13	17	prospect	in_progress	quote_accepted	21	2026-10-10 18:58:42.781+00
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, tenant_id, client_id, name, description, status, address_line1, address_line2, postal_code, city, start_date, end_date, actual_end_date, manager_id, created_by, created_at, updated_at) FROM stdin;
5	1	1	TEST Project Cancel	\N	cancelled	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-10-08 23:15:05.368+00	2026-10-08 23:15:05.421+00
1	1	1	TEST Project Flow	\N	completed	\N	\N	\N	Brussels	\N	\N	2026-10-08	\N	1	2026-10-08 23:14:32.746+00	2026-10-08 23:15:08.946+00
4	1	1	TEST Project Main	\N	in_progress	Rue Neuve 10	\N	1000	Brussels	2026-11-02	2026-12-18	\N	\N	1	2026-10-08 23:14:56.092+00	2026-10-08 23:26:22.496+00
7	1	1	TEST Project Refuse	\N	prospect	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-10-08 23:26:37.845+00	2026-10-08 23:26:37.845+00
8	2	3	TEST B Project	\N	prospect	\N	\N	\N	\N	\N	\N	\N	\N	9	2026-10-08 23:27:30.558+00	2026-10-08 23:27:30.558+00
9	1	1	TEST Project Second	\N	prospect	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-10-08 23:29:11.22+00	2026-10-08 23:29:11.22+00
10	1	1	TEST Project Side	\N	in_progress	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-10-08 23:34:31.626+00	2026-10-08 23:34:33.13+00
12	1	1	TEST Project Alerts	\N	in_progress	\N	\N	\N	Brussels	2026-10-07	2026-12-07	\N	\N	1	2026-10-08 23:50:46.35+00	2026-10-08 23:51:50.903+00
11	1	1	TEST Project Margin	\N	completed	\N	\N	\N	Brussels	2026-10-07	2026-12-07	2026-10-08	\N	1	2026-10-08 23:50:46.307+00	2026-10-08 23:52:38.94+00
13	1	1	TEST Project Stop	\N	cancelled	\N	\N	\N	Brussels	2026-10-07	2026-12-07	\N	\N	1	2026-10-08 23:50:46.378+00	2026-10-08 23:52:59.01+00
14	1	1	TEST Project Portal	INTERNAL project description	in_progress	1 Test Street	\N	1000	Brussels	2026-10-01	2026-12-01	\N	\N	1	2026-10-09 00:01:02.974+00	2026-10-09 00:04:51.176+00
15	1	1	TEST Project Portal Staff	INTERNAL staff compare	in_progress	\N	\N	\N	Brussels	2026-10-01	2026-12-01	\N	\N	1	2026-10-09 00:05:21.769+00	2026-10-09 00:05:23.133+00
16	1	7	TEST date-only fix	\N	prospect	\N	\N	\N	\N	2026-11-03	2026-12-18	\N	\N	2	2026-10-09 17:40:16.59+00	2026-10-09 17:40:20.61+00
17	13	8	Renovation	test Renovation	in_progress	Bardo - Romana	\N	50 000	tunis - bardo	2026-10-16	2026-10-28	\N	21	21	2026-10-10 18:00:14.523+00	2026-10-10 18:58:42.77+00
\.


--
-- Data for Name: purchase_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_invoices (id, tenant_id, type, cost_type_id, subcontractor_contract_id, supplier_id, project_id, number, external_number, amount_excl_vat, vat_rate, vat_amount, amount_incl_vat, issue_date, due_date, status, payment_reference, paid_at, created_by, created_at, updated_at) FROM stdin;
1	1	supplier	1	\N	1	\N	PUR-2026-0001	\N	100.00	21.00	21.00	121.00	2026-10-08	\N	to_pay	\N	\N	1	2026-10-08 23:29:34.16+00	2026-10-08 23:29:34.16+00
2	1	supplier	1	\N	1	\N	PUR-2026-0002	\N	100.00	21.00	21.00	121.00	2026-10-08	\N	to_pay	\N	\N	1	2026-10-08 23:29:34.205+00	2026-10-08 23:29:34.205+00
3	1	supplier	1	\N	1	\N	PUR-2026-0003	\N	100.00	21.00	21.00	121.00	2026-10-08	\N	to_pay	\N	\N	1	2026-10-08 23:29:34.22+00	2026-10-08 23:29:34.22+00
4	1	supplier	1	\N	1	\N	PUR-2026-0004	\N	100.00	21.00	21.00	121.00	2026-10-08	\N	to_pay	\N	\N	1	2026-10-08 23:29:34.23+00	2026-10-08 23:29:34.23+00
5	1	subcontractor	2	1	\N	4	PUR-2026-0005	\N	2500.00	21.00	525.00	3025.00	2026-10-08	\N	to_pay	\N	\N	1	2026-10-08 23:29:34.339+00	2026-10-08 23:29:34.339+00
7	1	supplier	4	\N	1	4	PUR-2026-0007	\N	100.00	21.00	21.00	121.00	2026-10-08	\N	to_pay	\N	\N	1	2026-10-08 23:29:34.497+00	2026-10-08 23:29:34.497+00
6	1	subcontractor	2	1	\N	4	PUR-2026-0006	\N	1000.00	6.00	60.00	1060.00	2026-10-08	\N	paid	TRF-1	2026-10-08 23:29:35.221+00	1	2026-10-08 23:29:34.451+00	2026-10-08 23:29:35.222+00
12	1	supplier	4	\N	1	\N	PUR-2026-0008	\N	100.00	21.00	21.00	121.00	2026-10-08	2026-10-13	to_pay	\N	\N	1	2026-10-08 23:29:35.276+00	2026-10-08 23:29:35.276+00
13	1	supplier	1	\N	1	\N	PUR-2026-0009	\N	50.00	21.00	10.50	60.50	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:29:49.355+00	2026-10-08 23:29:49.355+00
14	1	subcontractor	2	3	\N	11	PUR-2026-0010	\N	2500.00	21.00	525.00	3025.00	2026-10-08	\N	paid	\N	2026-10-08 23:51:30.728+00	8	2026-10-08 23:51:30.674+00	2026-10-08 23:51:30.729+00
15	1	supplier	1	\N	1	\N	PUR-2026-0011	\N	300.00	21.00	63.00	363.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:51:30.783+00	2026-10-08 23:51:30.783+00
16	1	supplier	1	\N	1	\N	PUR-2026-0012	\N	300.00	21.00	63.00	363.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:51:30.816+00	2026-10-08 23:51:30.816+00
17	1	supplier	4	\N	1	11	PUR-2026-0013	\N	200.00	21.00	42.00	242.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:51:37.411+00	2026-10-08 23:51:37.411+00
18	1	supplier	4	\N	1	12	PUR-2026-0014	\N	7900.00	21.00	1659.00	9559.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:51:53.921+00	2026-10-08 23:51:53.921+00
19	1	supplier	4	\N	1	12	PUR-2026-0015	\N	100.00	21.00	21.00	121.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:51:56.918+00	2026-10-08 23:51:56.918+00
20	1	supplier	4	\N	1	12	PUR-2026-0016	\N	300.00	21.00	63.00	363.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:51:59.92+00	2026-10-08 23:51:59.92+00
21	1	supplier	4	\N	1	12	PUR-2026-0017	\N	1200.00	21.00	252.00	1452.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:52:02.992+00	2026-10-08 23:52:02.992+00
22	1	supplier	4	\N	1	12	PUR-2026-0018	\N	10.00	21.00	2.10	12.10	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:52:05.891+00	2026-10-08 23:52:05.891+00
23	1	supplier	4	\N	1	12	PUR-2026-0019	\N	2500.00	21.00	525.00	3025.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:52:12.879+00	2026-10-08 23:52:12.879+00
24	1	supplier	4	\N	1	11	PUR-2026-0020	\N	700.00	21.00	147.00	847.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:52:38.47+00	2026-10-08 23:52:38.47+00
25	1	supplier	4	\N	1	13	PUR-2026-0021	\N	3000.00	21.00	630.00	3630.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:52:58.94+00	2026-10-08 23:52:58.94+00
26	1	supplier	4	\N	1	13	PUR-2026-0022	\N	500.00	21.00	105.00	605.00	2026-10-08	\N	to_pay	\N	\N	8	2026-10-08 23:52:59.428+00	2026-10-08 23:52:59.428+00
27	13	supplier	3	\N	3	\N	PUR-2026-0001	#12345	20000.00	20.00	4000.00	24000.00	2026-09-30	2026-06-02	paid	sdf	2026-10-10 15:30:58.328+00	21	2026-10-10 15:30:50.361+00	2026-10-10 15:30:59.748+00
28	13	supplier	1	\N	4	\N	PUR-2026-0002	123121	20000.00	20.00	4000.00	24000.00	2026-04-19	2026-04-27	to_pay	234234234	\N	21	2026-10-10 17:48:58.28+00	2026-10-10 17:48:58.28+00
29	13	supplier	5	\N	4	17	PUR-2026-0003	\N	70.00	10.00	7.00	77.00	2026-10-10	2026-10-10	paid	\N	2026-10-10 19:26:03.803+00	21	2026-10-10 19:25:43.106+00	2026-10-10 19:26:05.257+00
\.


--
-- Data for Name: quote_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quote_lines (id, tenant_id, quote_id, service_id, description, unit, quantity, unit_price_excl_vat, vat_rate, total_excl_vat, "position") FROM stdin;
5	1	1	1	TEST Painting	m²	40.000	25.00	6.00	1000.00	1
6	1	1	2	TEST Labour	h	10.000	45.00	21.00	450.00	2
7	1	3	\N	TEST free text	piece	1.000	100.00	21.00	100.00	1
8	1	4	\N	TEST concurrent	piece	1.000	10.00	21.00	10.00	1
9	1	5	\N	TEST concurrent	piece	1.000	10.00	21.00	10.00	1
10	1	6	\N	TEST concurrent	piece	1.000	10.00	21.00	10.00	1
11	1	7	1	TEST Painting	m²	20.000	25.00	6.00	500.00	1
12	1	8	1	TEST Painting	m²	1.000	25.00	6.00	25.00	1
13	1	9	1	TEST Painting	m²	1.000	25.00	6.00	25.00	1
14	1	10	1	TEST Painting	m²	5.000	25.00	6.00	125.00	1
15	1	11	\N	TEST role line	piece	1.000	10.00	21.00	10.00	1
16	2	12	\N	TEST B line	piece	1.000	10.00	21.00	10.00	1
17	1	13	\N	TEST side line	piece	1.000	100.00	21.00	100.00	1
18	1	14	\N	TEST margin quote 1	\N	1.000	10000.00	21.00	10000.00	1
19	1	15	\N	TEST margin quote 2	\N	1.000	1500.00	21.00	1500.00	1
20	1	16	\N	TEST alerts quote	\N	1.000	10000.00	21.00	10000.00	1
21	1	17	\N	TEST alerts quote 2	\N	1.000	5000.00	21.00	5000.00	1
22	1	18	1	TEST Stop painting	\N	100.000	40.00	21.00	4000.00	1
23	1	19	1	TEST Painting	m2	40.000	25.00	6.00	1000.00	1
24	1	20	\N	TEST free text work	pc	1.000	500.00	21.00	500.00	1
25	1	21	\N	TEST draft work	pc	1.000	100.00	21.00	100.00	1
26	1	22	1	TEST Painting	m2	40.000	25.00	6.00	1000.00	1
27	1	23	\N	TEST audit fix	pc	1.000	10.00	21.00	10.00	1
30	1	24	\N	TEST DOC Painting	m2	120.000	40.00	6.00	4800.00	0
31	1	24	\N	TEST DOC Materials	pc	12.000	100.00	21.00	1200.00	1
32	2	25	\N	TEST B line	pc	2.000	10.00	21.00	20.00	0
34	1	27	\N	TEST DOC8 Painting	m2	120.000	40.00	6.00	4800.00	0
35	1	27	\N	TEST DOC8 Materials	pc	10.000	100.00	21.00	1000.00	1
36	13	28	\N	test	m2	1.000	25.00	21.00	25.00	0
38	1	26	\N	TEST DOC logo line	pc	1.000	10.00	21.00	10.00	0
39	13	29	1801	Main-d’œuvre démolition — salle de bain	h	1.000	46.00	6.00	46.00	0
40	13	29	1800	Main-d’œuvre démolition — standard	h	1.000	42.12	6.00	42.12	1
41	13	29	1779	Plinthes bois — premium	ml	1.000	16.41	21.00	16.41	2
42	13	30	1788	Dépose carrelage — standard	m2	1.000	18.35	21.00	18.35	0
43	13	30	1800	Main-d’œuvre démolition — standard	h	1.000	42.12	6.00	42.12	1
44	13	30	1798	Décapage sol — cuisine	m2	1.000	14.53	21.00	14.53	2
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quotes (id, tenant_id, client_id, project_id, number, status, issue_date, valid_until, default_vat_rate, amount_excl_vat, vat_amount, amount_incl_vat, note, sent_at, accepted_at, refused_at, created_by, created_at, updated_at) FROM stdin;
2	1	1	4	QUO-2026-0002	draft	2026-10-08	\N	21.00	0.00	0.00	0.00	\N	\N	\N	\N	1	2026-10-08 23:25:51.683+00	2026-10-08 23:25:51.689+00
3	1	1	4	QUO-2026-0003	draft	2026-10-08	\N	21.00	100.00	21.00	121.00	\N	\N	\N	\N	1	2026-10-08 23:26:06.305+00	2026-10-08 23:26:06.313+00
4	1	1	4	QUO-2026-0004	draft	2026-10-08	\N	21.00	10.00	2.10	12.10	\N	\N	\N	\N	1	2026-10-08 23:26:06.37+00	2026-10-08 23:26:06.383+00
5	1	1	4	QUO-2026-0005	draft	2026-10-08	\N	21.00	10.00	2.10	12.10	\N	\N	\N	\N	1	2026-10-08 23:26:06.402+00	2026-10-08 23:26:06.417+00
6	1	1	4	QUO-2026-0006	draft	2026-10-08	\N	21.00	10.00	2.10	12.10	\N	\N	\N	\N	1	2026-10-08 23:26:06.424+00	2026-10-08 23:26:06.439+00
1	1	1	4	QUO-2026-0001	accepted	2026-10-08	\N	21.00	1450.00	154.50	1604.50	\N	2026-10-08 23:26:08.555+00	2026-10-08 23:26:22.487+00	\N	1	2026-10-08 23:25:51.459+00	2026-10-08 23:26:22.488+00
7	1	1	4	QUO-2026-0007	accepted	2026-10-08	\N	21.00	500.00	30.00	530.00	\N	2026-10-08 23:26:35.653+00	2026-10-08 23:26:35.688+00	\N	1	2026-10-08 23:26:34.354+00	2026-10-08 23:26:35.689+00
8	1	1	4	QUO-2026-0008	sent	2026-10-08	2020-01-01	21.00	25.00	1.50	26.50	\N	2026-10-08 23:26:36.757+00	\N	\N	1	2026-10-08 23:26:35.812+00	2026-10-08 23:26:36.758+00
21	1	1	14	QUO-2026-0020	draft	2026-10-09	2026-12-31	21.00	100.00	21.00	121.00	INTERNAL draft	\N	\N	\N	1	2026-10-09 00:01:03.101+00	2026-10-09 00:01:03.107+00
9	1	1	1	QUO-2026-0009	sent	2026-10-08	\N	21.00	25.00	1.50	26.50	\N	2026-10-08 23:26:37.76+00	\N	\N	1	2026-10-08 23:26:36.846+00	2026-10-08 23:26:37.761+00
10	1	1	7	QUO-2026-0010	refused	2026-10-08	\N	21.00	125.00	7.50	132.50	\N	2026-10-08 23:26:38.955+00	\N	2026-10-08 23:26:38.981+00	1	2026-10-08 23:26:37.883+00	2026-10-08 23:26:38.982+00
11	1	1	4	QUO-2026-0011	draft	2026-10-08	\N	21.00	10.00	2.10	12.10	\N	\N	\N	\N	7	2026-10-08 23:27:20.11+00	2026-10-08 23:27:20.127+00
13	1	1	10	QUO-2026-0012	accepted	2026-10-08	\N	21.00	100.00	21.00	121.00	\N	2026-10-08 23:34:33.083+00	2026-10-08 23:34:33.124+00	\N	1	2026-10-08 23:34:31.669+00	2026-10-08 23:34:33.124+00
19	1	1	14	QUO-2026-0018	accepted	2026-10-09	2026-12-31	21.00	1000.00	60.00	1060.00	INTERNAL quote note	2026-10-09 00:01:04.37+00	2026-10-09 00:04:51.166+00	\N	1	2026-10-09 00:01:03.024+00	2026-10-09 00:04:51.166+00
14	1	1	11	QUO-2026-0013	accepted	2026-10-08	2026-11-07	21.00	10000.00	2100.00	12100.00	\N	2026-10-08 23:51:05.698+00	2026-10-08 23:51:05.738+00	\N	1	2026-10-08 23:51:03.251+00	2026-10-08 23:51:05.739+00
20	1	1	14	QUO-2026-0019	refused	2026-10-09	2026-12-31	21.00	500.00	105.00	605.00	INTERNAL quote note B	2026-10-09 00:01:05.257+00	\N	2026-10-09 00:04:55.43+00	1	2026-10-09 00:01:03.068+00	2026-10-09 00:04:55.431+00
15	1	1	11	QUO-2026-0014	accepted	2026-10-08	2026-11-07	21.00	1500.00	315.00	1815.00	\N	2026-10-08 23:51:07.128+00	2026-10-08 23:51:07.168+00	\N	1	2026-10-08 23:51:05.844+00	2026-10-08 23:51:07.168+00
16	1	1	12	QUO-2026-0015	accepted	2026-10-08	2026-11-07	21.00	10000.00	2100.00	12100.00	\N	2026-10-08 23:51:50.854+00	2026-10-08 23:51:50.896+00	\N	1	2026-10-08 23:51:47.363+00	2026-10-08 23:51:50.896+00
17	1	1	12	QUO-2026-0016	accepted	2026-10-08	2026-11-07	21.00	5000.00	1050.00	6050.00	\N	2026-10-08 23:52:09.96+00	2026-10-08 23:52:10+00	\N	1	2026-10-08 23:52:08.754+00	2026-10-08 23:52:10+00
18	1	1	13	QUO-2026-0017	accepted	2026-10-08	2026-11-07	21.00	4000.00	840.00	4840.00	\N	2026-10-08 23:52:58.589+00	2026-10-08 23:52:58.634+00	\N	1	2026-10-08 23:52:53.87+00	2026-10-08 23:52:58.634+00
22	1	1	15	QUO-2026-0021	accepted	2026-10-09	2026-12-31	21.00	1000.00	60.00	1060.00	\N	2026-10-09 00:05:23.085+00	2026-10-09 00:05:23.126+00	\N	1	2026-10-09 00:05:21.827+00	2026-10-09 00:05:23.127+00
29	13	8	17	QUO-2026-0002	accepted	2026-10-10	2026-10-15	21.00	104.53	8.74	113.27	\N	2026-10-10 18:58:02.665+00	2026-10-10 18:58:42.752+00	\N	21	2026-10-10 18:57:25.997+00	2026-10-10 18:58:42.755+00
23	1	1	14	QUO-2026-0022	refused	2026-10-09	2026-12-31	21.00	10.00	2.10	12.10	\N	2026-10-09 12:19:35.112+00	\N	2026-10-09 12:19:35.428+00	1	2026-10-09 12:19:33.455+00	2026-10-09 12:19:35.433+00
12	2	3	8	QUO-2026-0001	sent	2026-10-08	\N	21.00	10.00	2.10	12.10	\N	2026-10-09 12:47:50.293+00	\N	\N	9	2026-10-08 23:27:30.611+00	2026-10-09 12:47:50.296+00
24	1	1	4	QUO-2026-0023	sent	2026-10-09	\N	21.00	6000.00	540.00	6540.00	TEST DOC terms	2026-10-09 13:03:10.625+00	\N	\N	1	2026-10-09 13:02:51.655+00	2026-10-09 13:03:10.629+00
25	2	3	8	QUO-2026-0002	draft	2026-10-09	\N	21.00	20.00	4.20	24.20	\N	\N	\N	\N	9	2026-10-09 13:03:55.547+00	2026-10-09 13:03:55.594+00
27	1	1	4	QUO-2026-0025	sent	2026-10-09	\N	21.00	5800.00	498.00	6298.00	\N	2026-10-09 13:04:05.007+00	\N	\N	1	2026-10-09 13:04:03.906+00	2026-10-09 13:04:05.008+00
30	13	8	17	QUO-2026-0003	refused	2026-10-21	2026-11-05	21.00	75.00	9.43	84.43	\N	2026-10-10 20:26:50.199+00	\N	2026-10-10 20:27:56.592+00	21	2026-10-10 20:26:15.94+00	2026-10-10 20:27:56.596+00
26	1	1	4	QUO-2026-0024	draft	2026-10-09	\N	21.00	10.00	2.10	12.10	\N	\N	\N	\N	1	2026-10-09 13:03:56.317+00	2026-10-10 18:43:44.453+00
28	13	8	17	QUO-2026-0001	refused	2026-10-10	2026-10-23	21.00	25.00	5.25	30.25	\N	2026-10-10 18:09:37.756+00	\N	2026-10-10 18:57:15.222+00	21	2026-10-10 18:07:42.917+00	2026-10-10 18:57:15.224+00
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, admin_user_id, token_hash, user_agent, ip_address, expires_at, revoked_at, created_at) FROM stdin;
1	\N	1	23621ea29269af3369d5bb07805f363e1884e24dba26bcc78839b858082a715c	curl/8.17.0	::1	2026-10-15 22:11:02.955+00	\N	2026-10-08 22:11:03.087+00
2	1	\N	07a9b3fdb57555a636eda331f15ce1e1a751705e8e0f0b54187fcadfbb9b0b06	curl/8.17.0	::1	2026-10-15 22:12:34.855+00	\N	2026-10-08 22:12:34.868+00
3	2	\N	3e4c787e21b01b333930287bc1065ceab90cb17d50cf44abe852afbc49c7b97e	curl/8.17.0	::1	2026-10-15 22:12:35.227+00	\N	2026-10-08 22:12:35.234+00
5	5	\N	2d67915fbb6033d69eb3992f649949c14061c4dad653fcc91688947481de18d4	curl/8.17.0	::1	2026-10-15 22:12:35.915+00	\N	2026-10-08 22:12:35.925+00
7	1	\N	d275f0d072277e4d53755e995421466cdb579dc5408e7e5ac02a1a1145d8a30c	node	::1	2026-10-15 22:15:44.52+00	\N	2026-10-08 22:15:44.531+00
8	2	\N	3792ce23efba8e14e77877e6ff043ce761fc681707fcc6f22a5871d1234c2e4c	node	::1	2026-10-15 22:15:57.775+00	\N	2026-10-08 22:15:57.781+00
9	3	\N	90810ca2378a58b31f9dacadbc79b6e77a50083797fab64621113adca5ac968d	node	::1	2026-10-15 22:16:11.014+00	\N	2026-10-08 22:16:11.026+00
10	4	\N	5e43a76563b6e8a84dce5459241fbb1ba947d67af90096f9e4499a9456a9f640	node	::1	2026-10-15 22:16:24.314+00	\N	2026-10-08 22:16:24.326+00
11	5	\N	6b9e3943897d8f37a3d0832c93e5734a094a3f9ee5dddb91b31be0cb852523b0	node	::1	2026-10-15 22:16:37.541+00	\N	2026-10-08 22:16:37.549+00
12	7	\N	1687f691da41ce12d97ae32e909bdc3fe7a89441f3b7382f51ca83586956cffa	node	::1	2026-10-15 22:16:50.808+00	\N	2026-10-08 22:16:50.818+00
16	\N	1	fe44446d49763f447101577f76326923f84336c7877f21f0185ab57b45dbcad4	node	::1	2026-10-15 22:17:30.888+00	\N	2026-10-08 22:17:30.896+00
17	1	\N	4cbf02e84199f1cb5971bc98766e52ccd26b27f42c94994256e4edaaa234fff5	node	::1	2026-10-15 22:46:25.975+00	\N	2026-10-08 22:46:26.003+00
19	\N	1	90c3a7afed895a5ca8dd93d814428623047cc28c475de9fa6e90e1cbdcac592f	node	::1	2026-10-15 22:46:27.135+00	\N	2026-10-08 22:46:27.145+00
4	9	\N	3f49ccf3d8049bc16c9713bf3fdcd4735056b8786de28484792abc19f347ddaf	curl/8.17.0	::1	2026-10-15 22:12:35.51+00	2026-10-08 22:46:27.224+00	2026-10-08 22:12:35.519+00
14	9	\N	65a2e9af645278be90ce0e8270a94bc00048b27d108688fbee257985d92e0085	node	::1	2026-10-15 22:17:17.292+00	2026-10-08 22:46:27.224+00	2026-10-08 22:17:17.299+00
18	9	\N	be4086ecd0b7d0fe756f1cf56b742672aafbc94a23db9d1e2789b4367409bf84	node	::1	2026-10-15 22:46:26.988+00	2026-10-08 22:46:27.224+00	2026-10-08 22:46:26.994+00
20	9	\N	44ff0b2953cd69bad241460b28d6b77377ee61292c9d1e8fd8674ec7582b8e1c	node	::1	2026-10-15 22:46:27.48+00	\N	2026-10-08 22:46:27.486+00
21	2	\N	4447aa9b4b27819cd0007a8a9b3a168f1ecb426cec723e9d8e08a9f643285007	node	::1	2026-10-15 22:46:39.093+00	\N	2026-10-08 22:46:39.096+00
25	3	\N	68bf68b88230a7ee583a30bcdd18eafb98bd3b5d89f8b6d5220c7af41a3e7b03	node	::1	2026-10-15 22:46:52.17+00	\N	2026-10-08 22:46:52.173+00
27	\N	1	748d41fcaafa90b9252fc7b6d4b19ec62da6c66c8b40da0ff1e052604dd76696	node	::1	2026-10-15 22:48:10.378+00	\N	2026-10-08 22:48:10.381+00
28	1	\N	f3c90a3f075bab0170cec7b0474477052d1292596fc1f1118de22c950bda8696	curl/8.17.0	::1	2026-10-15 22:50:05.134+00	\N	2026-10-08 22:50:05.139+00
29	5	\N	c211b888581097f3d11a80b2739882b3c0262413520b724a9b452dd903f7d867	curl/8.17.0	::1	2026-10-15 22:50:41.408+00	\N	2026-10-08 22:50:41.413+00
30	2	\N	6483a2974dc3e15944f94923b5cfd67850d3c05c7f38655a78fb76ccd430dfc4	curl/8.17.0	::1	2026-10-15 22:50:41.562+00	\N	2026-10-08 22:50:41.566+00
31	9	\N	6a6edd77d52af64b96f2893ac32a32709a0bca2a2b7d076a871797f047ff4d84	curl/8.17.0	::1	2026-10-15 22:53:10.932+00	\N	2026-10-08 22:53:10.936+00
32	5	\N	08f9606d19e15cc3eb09a86303f36939bfe23a2d01755ffc77e7edb1b36eb39a	curl/8.17.0	::1	2026-10-15 23:07:33.291+00	\N	2026-10-08 23:07:33.332+00
33	1	\N	28266825e8777c81859009e06ef89e715a2d5b3c82ba0473c1ef4ae71b5766f3	curl/8.17.0	::1	2026-10-15 23:07:33.467+00	\N	2026-10-08 23:07:33.474+00
34	1	\N	b62c895de1a8415c97e37db634a99aa4a590853fb264c1ec2182d8866964155e	curl/8.21.0	::1	2026-10-15 23:14:24.508+00	\N	2026-10-08 23:14:24.512+00
35	2	\N	a7967b3d8cbdb40a600431984395797f87172f72a350c5686a20efe00928a4d6	curl/8.21.0	::1	2026-10-15 23:14:24.617+00	\N	2026-10-08 23:14:24.623+00
36	7	\N	f0e13548056e0abab1b4b32117b723584718424689c84e358e9915026f9b8ea6	curl/8.21.0	::1	2026-10-15 23:14:24.725+00	\N	2026-10-08 23:14:24.73+00
37	4	\N	d5ef5537683f6bed11f25c170952ac38404dc75bcdd3502192b93aa688b357e8	curl/8.21.0	::1	2026-10-15 23:14:24.828+00	\N	2026-10-08 23:14:24.832+00
38	9	\N	ad45167f001608ebe690b65e6507ae928864b5533ca9bc720ffb5788fa0eb406	curl/8.21.0	::1	2026-10-15 23:14:24.926+00	\N	2026-10-08 23:14:24.929+00
39	1	\N	cdca5bc35a713cc0874fd8149d759e68ed2ae2c47ec3b4f8f914e684c8d59839	curl/8.21.0	::1	2026-10-15 23:21:07.827+00	\N	2026-10-08 23:21:07.83+00
40	2	\N	60dab0fe22e516204eeb7f430fdf26331084c907604e4c214389edecba863675	curl/8.21.0	::1	2026-10-15 23:21:07.915+00	\N	2026-10-08 23:21:07.918+00
41	5	\N	9cebd6469bbc9603540922835d16f2ea8f3d3fb02a667e0ec2bd93e1b6d47510	curl/8.21.0	::1	2026-10-15 23:21:07.992+00	\N	2026-10-08 23:21:07.994+00
42	3	\N	a2878afee346e876824c76d108930a1c7180f006c35a02cb927a1271b546e9d8	curl/8.21.0	::1	2026-10-15 23:21:08.078+00	\N	2026-10-08 23:21:08.082+00
43	7	\N	8847b9fbf65d87938b91b50bdac3a1d9013273d8e4d6f7ede5a7f230695fef59	curl/8.21.0	::1	2026-10-15 23:21:08.181+00	\N	2026-10-08 23:21:08.185+00
44	9	\N	ea63fd03bdad0df7db1ff338b0569e47b70b2b5bc4a7f75f9a9ee0f3d6d2658b	curl/8.21.0	::1	2026-10-15 23:22:10.3+00	\N	2026-10-08 23:22:10.305+00
45	1	\N	c75fce01a4d021800bf515639cfd1b3acfc1ce269d185e6cfbb9c38d2bbd46ff	node	::1	2026-10-15 23:25:51.302+00	\N	2026-10-08 23:25:51.306+00
46	7	\N	6c1b2ce68ee48ba580dc766ceaee9ec1d11281dcd3556a7dc0d457d8895a7d93	node	::1	2026-10-15 23:27:18.54+00	\N	2026-10-08 23:27:18.544+00
48	2	\N	43609f2289b1c3b98c134a6823e9a2eab27c9d6da99b6901545e7ad9c89a96e0	node	::1	2026-10-15 23:27:21.877+00	\N	2026-10-08 23:27:21.882+00
49	9	\N	a9aff532edb904b3a7cb635424c7fe05e4a127704b1dcdcde12a7b49062e7a01	node	::1	2026-10-15 23:27:23.478+00	\N	2026-10-08 23:27:23.482+00
50	1	\N	22d748bd96f59e97c0e62b09fe8cf9eca7f53b6b6db1b077c8e7b729885ec944	node	::1	2026-10-15 23:29:11.168+00	\N	2026-10-08 23:29:11.173+00
51	2	\N	90dc00c8fba92a4f5585da633cfc40f998876b877fcc1203c77302396a9e271d	node	::1	2026-10-15 23:29:46.168+00	\N	2026-10-08 23:29:46.171+00
6	\N	2	ff8b324154d62347214e7cf65df7b9dc1a307af4c78cb508ffc88abeb1b16901	curl/8.17.0	::1	2026-10-15 22:12:36.648+00	2026-10-09 22:46:28.402+00	2026-10-08 22:12:36.66+00
15	\N	2	433c50687249e46e042624bcbc16d5d8686f4e900d12f5f4ece71ceed316a9dd	node	::1	2026-10-15 22:17:30.662+00	2026-10-09 22:46:28.402+00	2026-10-08 22:17:30.672+00
53	9	\N	14cec6eb28b76ccce83900513e272d7580c74dd25e59b3cb8792c8ed9f047c49	node	::1	2026-10-15 23:29:49.414+00	\N	2026-10-08 23:29:49.417+00
54	1	\N	90f8e94d880fe7e4188829b7f8ff6172ff3d84f94dade3739005b9cc9ce9c7f9	node	::1	2026-10-15 23:34:31.576+00	\N	2026-10-08 23:34:31.58+00
55	5	\N	9bc6334e297a1207e99e93b7a575955fe066962b86e4da5625047f258174c8a2	node	::1	2026-10-15 23:34:59.266+00	\N	2026-10-08 23:34:59.269+00
56	6	\N	87e9f9a33053e44954b38d25696f3d7928d5f7e749a94314e322c86155444fdf	node	::1	2026-10-15 23:35:00.915+00	\N	2026-10-08 23:35:00.919+00
57	2	\N	7f4cbeb42eb84d77c109871095bdacf31e29004631f1f1984bcacbf9c0cccd2a	node	::1	2026-10-15 23:35:02.482+00	\N	2026-10-08 23:35:02.486+00
59	3	\N	1efc2c41f273d9bfc2b06542b6f18aa4b594e2eb40ce552d11bda500728bd49d	node	::1	2026-10-15 23:35:43.856+00	\N	2026-10-08 23:35:43.861+00
60	7	\N	b1d32311b80a9918fd5bb76eefb11fd94d37b68dd0ab174264736167f4c8347c	node	::1	2026-10-15 23:35:56.959+00	\N	2026-10-08 23:35:56.964+00
61	9	\N	e19ecde077d93c772a2ae508129264b42acd726f98a84ac185cb048ea46c2556	node	::1	2026-10-15 23:36:10.068+00	\N	2026-10-08 23:36:10.072+00
62	\N	1	309f628619aa78c05200222cae5f2d4aa98ad0abe26c4478a524e4b569a8749f	node	::1	2026-10-15 23:36:23.169+00	\N	2026-10-08 23:36:23.173+00
63	3	\N	fdb2a2fbc6c44e96463b121a90fc0190cdb75fc7672db8faee3380879b7c7aa8	node	::1	2026-10-15 23:39:49.34+00	\N	2026-10-08 23:39:49.392+00
64	4	\N	49ad4f11239710613e4f915986c23500827754c2364343eaf04bfb75b2d85a8a	node	::1	2026-10-15 23:39:51.07+00	\N	2026-10-08 23:39:51.079+00
65	5	\N	f32abf1f9365b0639a3da1c4b9060c93bc13d595f0b21618e9649d3d723fbdf2	node	::1	2026-10-15 23:39:52.717+00	\N	2026-10-08 23:39:52.725+00
66	7	\N	e7fa3dd5501078228ab584e54b6ca021b446294fcbdb268ed727b1c094d30683	node	::1	2026-10-15 23:39:54.32+00	\N	2026-10-08 23:39:54.325+00
68	9	\N	002c4d24147cd7ec00acf402bcf0bfdf6fc51974654c4ec77ddfb607c06ec6d4	node	::1	2026-10-15 23:41:03.945+00	\N	2026-10-08 23:41:03.951+00
69	1	\N	d28d768f6032a817e0b9d699d933a276781f0232955e354aad66f1be2248df8d	node	::1	2026-10-15 23:50:25.41+00	\N	2026-10-08 23:50:25.435+00
70	2	\N	1f54c7a7ca532ac0b8066f3139337ce8d4840ca6aea4698ec779599f0e70c7f3	node	::1	2026-10-15 23:51:03.145+00	\N	2026-10-08 23:51:03.15+00
71	3	\N	ecce51d20054fc81bb2ac7357a9c979898cd460acd5cef989417b7635c02aae2	node	::1	2026-10-15 23:51:17.678+00	\N	2026-10-08 23:51:17.682+00
73	5	\N	8c924ea95a48a44ff293256550ff5560bba97889f8149ae99b845a39caeef774	node	::1	2026-10-15 23:53:08.429+00	\N	2026-10-08 23:53:08.433+00
74	4	\N	2f107605408ad31f5e4e9640ed555b90354983e58a273887f99b4936f3d79ab2	node	::1	2026-10-15 23:53:21.465+00	\N	2026-10-08 23:53:21.472+00
75	7	\N	4e242f4ae8bebc44e6a5c7e4d16b05ad30af57fbbc66e7a57da4d4258520b814	node	::1	2026-10-15 23:53:34.475+00	\N	2026-10-08 23:53:34.479+00
76	9	\N	969118d95f82858219563ec50170d836cb1a4800763b5d226b2f32e1b6599b0a	node	::1	2026-10-15 23:53:47.456+00	\N	2026-10-08 23:53:47.459+00
77	1	\N	f438b78d2e9a7e7ca143a7109f3178db08cd3a32c5f84e0417b55f265ebab642	node	::1	2026-10-16 00:00:38.8+00	\N	2026-10-09 00:00:38.803+00
78	5	\N	0b9d7c2e51147096b8b9c1bf4b28d7d1e1eb08f1e3a9961062c22126a932a088	node	::1	2026-10-16 00:00:40.365+00	\N	2026-10-09 00:00:40.369+00
79	3	\N	91d2be0d9e7588c28ba77284130ae24dc097538abafdd3f392d94a4c38b5d38a	node	::1	2026-10-16 00:00:41.932+00	\N	2026-10-09 00:00:41.936+00
80	9	\N	ad7e5071627e544fe88778ad9f80c705659e5805c5064c74caf8eadffce0da49	node	::1	2026-10-16 00:00:43.496+00	\N	2026-10-09 00:00:43.501+00
81	1	\N	0b108dfea1442c8e4efdbdd1d8e68f0616f96bf89eb169c415256d6e272da93e	node	::1	2026-10-16 00:06:22.215+00	\N	2026-10-09 00:06:22.219+00
82	9	\N	2acfbff00eae084d17d2fba2ebbed08721d9110e1b4595695748a892b7f9652b	node	::1	2026-10-16 00:07:06.204+00	\N	2026-10-09 00:07:06.208+00
83	1	\N	1d026da19384af9df078dbf4d3b3e9cb616e42116c5a8f5169d6eff1f9614ee7	node	::1	2026-10-16 12:19:33.104+00	\N	2026-10-09 12:19:33.192+00
84	1	\N	3d146a180287464c3c352fca60e3f05905d8ccb604d872238b0e863ea5627c91	node	::1	2026-10-16 12:24:40.824+00	\N	2026-10-09 12:24:40.863+00
85	1	\N	78dfe17191296bbffde1dd676d33cc5ca26cebcc25533b34a247fb3d69645015	node	::1	2026-10-16 12:36:53.532+00	\N	2026-10-09 12:36:53.618+00
86	1	\N	2d31d5961f41410dd8eaafc2394f038fa2634302d9d144797940e7ec76d0eb58	node	::1	2026-10-16 12:37:19.692+00	\N	2026-10-09 12:37:19.702+00
87	2	\N	3ef94c284c856bb23bd906e992b8144e225f4b9d33424c038d7ea261ec03baa2	node	::1	2026-10-16 12:37:19.926+00	\N	2026-10-09 12:37:19.936+00
88	5	\N	127718417576de5df59247aab6bd4c0e10dd1f14b30b1829d176c3bb98095e24	node	::1	2026-10-16 12:37:20.132+00	\N	2026-10-09 12:37:20.14+00
90	1	\N	02ea3608660f373b4613e719b09517a93164be343c0b9f099b576ccd111d765b	node	::1	2026-10-16 12:38:36.362+00	\N	2026-10-09 12:38:36.37+00
91	2	\N	6faadbfcd470c32bc2fb81b30eca32018d4e49630bf3ef656723613b6dbe625e	node	::1	2026-10-16 12:44:41.339+00	\N	2026-10-09 12:44:41.404+00
92	2	\N	c31c15d64217232ae4fd9d43d373cb0ff1247d14edfa47272c852bae632385ec	node	::1	2026-10-16 12:44:56.203+00	\N	2026-10-09 12:44:56.211+00
93	2	\N	27193d898d7e20f9f40db58cf9cc078d03e0d6fc0d51b342cf3165a6037c33d3	node	::1	2026-10-16 12:46:02.282+00	\N	2026-10-09 12:46:02.291+00
94	9	\N	6e9033262e6aef099503b06f3556c0696a4d52d56ae2ca6915ab66feb34b2ac1	node	::1	2026-10-16 12:47:48.658+00	\N	2026-10-09 12:47:48.667+00
95	1	\N	63f63e96f349030de427175bd1c4d36053f3baab705547fef0d5458716184a61	node	::1	2026-10-16 12:48:58.045+00	\N	2026-10-09 12:48:58.054+00
96	2	\N	4eba1408a274e9d59cc6ccd441a24c84918e8d3123c2491819146ec3d9768085	node	::1	2026-10-16 12:48:58.247+00	\N	2026-10-09 12:48:58.258+00
97	6	\N	b8e441698662b92a9f96fad918ca5a2ee03d3f23b3d0e6fff4fd5ada0fbc63e8	node	::1	2026-10-16 12:48:58.419+00	\N	2026-10-09 12:48:58.427+00
98	9	\N	299fab6a4bd756047dd42403e0eb8ac2cf010e3d2f406aca82851f51d8139684	node	::1	2026-10-16 12:48:58.551+00	\N	2026-10-09 12:48:58.57+00
100	9	\N	a0edce67b3d10d12c7983057d45726548e5c4a14b8858a4f857c3d078595a8f1	node	::1	2026-10-16 12:49:57.524+00	\N	2026-10-09 12:49:57.531+00
101	1	\N	0d8b8b6694b13f2e837c51e127ff55c4cf7072ca4244bb9bd26c8e8802e6f320	node	::1	2026-10-16 13:02:51.304+00	\N	2026-10-09 13:02:51.372+00
102	1	\N	d65bd54d70379fb7f9f634e33d4c70e27979e3ec3a600df61a3f0c1640b55e89	node	::1	2026-10-16 13:03:06.991+00	\N	2026-10-09 13:03:06.998+00
103	1	\N	ef8ce5be3eaa7ef9824770f17b941e9a04ff222a3aafe725b417de130127bba5	node	::1	2026-10-16 13:03:55.143+00	\N	2026-10-09 13:03:55.153+00
104	9	\N	1ff8ae3c878d7e6f5e3f04bab2c4d7cfe35be9ad042bf2f60e7876faf8a8ef45	node	::1	2026-10-16 13:03:55.33+00	\N	2026-10-09 13:03:55.357+00
99	\N	2	18975fd14ed406a554319fff8cb3f4b7654cfdbbbf45e5927b6779dcb710fbef	node	::1	2026-10-16 12:48:58.721+00	2026-10-09 22:46:28.402+00	2026-10-09 12:48:58.731+00
105	1	\N	b114e4c35b8891474a3543b9cbfd02d056075ad2a9f2d9cffad5e77da2791025	node	::1	2026-10-16 13:04:46.748+00	\N	2026-10-09 13:04:46.756+00
106	9	\N	2b31023b8dfd4af9b70a272db84bc13f308e9c18438fb5b0218443f745afd589	node	::1	2026-10-16 13:04:46.96+00	\N	2026-10-09 13:04:46.968+00
107	1	\N	d73fff5ae85dd0417244ecbb82133a1ca34bb472e66fa4c9083dd991c34ad21e	curl/8.17.0	::1	2026-10-16 13:11:40.668+00	\N	2026-10-09 13:11:40.683+00
108	2	\N	a6441848e28a60de8c9d5582f2f2ec5c14ae2c070e15b8ebd1c7736a4f447f14	curl/8.17.0	::1	2026-10-16 13:11:41.097+00	\N	2026-10-09 13:11:41.119+00
109	5	\N	b02f87419e5b0dbb284e3ab78ce9164dc9557fd1b16f22fbf5a4c3c53c1bf237	curl/8.17.0	::1	2026-10-16 13:11:41.62+00	\N	2026-10-09 13:11:41.632+00
110	9	\N	e3ce005cfd6a7daaf3d7ca9c54cacecfb1d3f7d5d75bf1ce530dd63703842b51	curl/8.17.0	::1	2026-10-16 13:11:42.031+00	\N	2026-10-09 13:11:42.045+00
111	\N	1	c46feae7a9526b78224ea7cf8bf9f668aef4b4fc0b2b3f497d8413429927ec32	curl/8.17.0	::1	2026-10-16 13:12:03.066+00	\N	2026-10-09 13:12:03.093+00
113	1	\N	8f08aec27879a1cca3166e761a103c19e0d773b3d4ac448d025fc89393f5e0ba	curl/8.17.0	::1	2026-10-16 13:28:28.649+00	\N	2026-10-09 13:28:28.71+00
114	1	\N	913d50801fce134f94a6e70cd7c05868de1ec5f3897a444e89c58a7a9736a0bd	node	::1	2026-10-16 13:32:14.224+00	\N	2026-10-09 13:32:14.239+00
115	9	\N	9ad894df92cf44a7c58966e381bec7f88300aa7c7837002895e970ca8bce0d7d	node	::1	2026-10-16 13:32:14.588+00	\N	2026-10-09 13:32:14.604+00
116	\N	1	29e5de2194e4776760241536848bb7ea2004eb17c2dff8a96fb3fb35867b8470	node	::1	2026-10-16 13:32:14.839+00	\N	2026-10-09 13:32:14.871+00
118	2	\N	4b82a53c618d8b2fab27599447562e78be2fa69bafd808c9246970416532198f	node	::1	2026-10-16 13:32:23.248+00	\N	2026-10-09 13:32:23.271+00
119	5	\N	dd84b853ad41c672e7643d34fcd586441d8d7241813bea3aa28d77644abb12c8	node	::1	2026-10-16 13:32:23.648+00	\N	2026-10-09 13:32:23.664+00
120	7	\N	29419caacf0f5c1ce2112efc56bb152cdf3eb027ff0f2fa191e89c0f0eb6f0aa	node	::1	2026-10-16 13:33:01.318+00	\N	2026-10-09 13:33:01.343+00
121	15	\N	038e01d0803c8fdae3d3000e82be1d16a3554ee15f42522c38c2bdfe1f9e53b4	node	::1	2026-10-16 13:34:26.086+00	\N	2026-10-09 13:34:26.1+00
123	1	\N	ef253c09d518ec73ec0727343b50157ca662bb6c60c31bf5f6d0881af36452e7	node	::1	2026-10-16 13:42:15.441+00	\N	2026-10-09 13:42:15.505+00
13	8	\N	dcf4a8c6433610cd0d2c0f2e6bd1da813b6cfdd4d03490e0ee83f8ff7b5ffe0d	node	::1	2026-10-15 22:17:04.035+00	2026-10-09 13:44:55.066+00	2026-10-08 22:17:04.041+00
47	8	\N	5320eb78c92382cbb88ffc56ca70889811d7c530538e40e0a5a5460f82c360db	node	::1	2026-10-15 23:27:20.246+00	2026-10-09 13:44:55.066+00	2026-10-08 23:27:20.249+00
52	8	\N	0ce7e1ce86d2a5076e6348b3680ac570f5d31494bd160995b152f7d707117f33	node	::1	2026-10-15 23:29:47.777+00	2026-10-09 13:44:55.066+00	2026-10-08 23:29:47.781+00
58	8	\N	7ac9be456ec185212b18be75f8579b5f1dfd8abc88d290ef2423e6c878cd3ecc	node	::1	2026-10-15 23:35:30.732+00	2026-10-09 13:44:55.066+00	2026-10-08 23:35:30.735+00
67	8	\N	1a0128df1ac7713c42cc86ddf724585caf5f1644af06981a0baaece05512912d	node	::1	2026-10-15 23:39:55.922+00	2026-10-09 13:44:55.066+00	2026-10-08 23:39:55.926+00
72	8	\N	a40f28e825c00b9373f523d4f3c4b8b3ee9c9d64cfb7d362c91183874a080c64	node	::1	2026-10-15 23:51:30.604+00	2026-10-09 13:44:55.066+00	2026-10-08 23:51:30.609+00
89	8	\N	f2a342cdf87462cad2aa05e13ac2bd6ecac45e9d83ef8d42486f7ebb31ccab9f	node	::1	2026-10-16 12:37:20.339+00	2026-10-09 13:44:55.066+00	2026-10-09 12:37:20.352+00
122	8	\N	78b350fc0c352a40147d1383780f3a34f4f922e40942ca39cafeafe0052e4dda	node	::1	2026-10-16 13:34:26.376+00	2026-10-09 13:44:55.066+00	2026-10-09 13:34:26.386+00
124	1	\N	c4c49102db9ef5cd98f594e2a3b1ad28e52e70ad85d64335a857f9de6b7ae4e3	node	::1	2026-10-16 13:45:38.832+00	\N	2026-10-09 13:45:38.844+00
125	1	\N	28c656b2d3640c68f6f61cfde00d7d56dbf71b77dd6b448db5ec5f011f04ad42	node	::1	2026-10-16 14:55:20.438+00	\N	2026-10-09 14:55:20.444+00
127	\N	1	905843e50e31e2ba6e58312c1b059b517e126c5300697922cc8678955e665913	node	::1	2026-10-16 17:15:53.568+00	\N	2026-10-09 17:15:53.574+00
128	\N	1	676b3d6fc0c6d44debca9c1bf6fcdda3a0010a277dc0e476d25474a8e589eb67	node	::1	2026-10-16 17:20:02.191+00	\N	2026-10-09 17:20:02.309+00
129	\N	1	ef48cbe774b885d558d6a453bcc536dd7af2bacea444d244faa779c07b1ae014	node	::1	2026-10-16 17:29:47.315+00	\N	2026-10-09 17:29:47.363+00
130	2	\N	f90a61c130c489e09d6a94805bf341758c1e30e8b067bec42241d44f942a50c5	curl/8.17.0	::1	2026-10-16 17:40:12.878+00	\N	2026-10-09 17:40:12.923+00
131	2	\N	6a6291fcacc70f19ae30cbe119ddce2ce164002334c6dac4481c2cf05a48be5f	curl/8.17.0	::1	2026-10-16 18:55:24.716+00	\N	2026-10-09 18:55:24.761+00
133	\N	1	4145d0e2b74fc0cddc54690f201df2ee272cb23233513f4ff1a1d354ce9573d4	curl/8.17.0	::1	2026-10-16 19:07:52.371+00	\N	2026-10-09 19:07:52.379+00
135	2	\N	6a45243740bbe9a0236f2e633bdacc8d22332f5b240d2233850095f70cb29b46	curl/8.17.0	::1	2026-10-16 19:22:04.084+00	\N	2026-10-09 19:22:04.193+00
136	5	\N	abf1dd278d32509b42ad8e3ce2aa269b94ea52d10a9f7848902d7fd98e48e362	curl/8.17.0	::1	2026-10-16 19:22:11.824+00	\N	2026-10-09 19:22:11.83+00
137	1	\N	66970e8c458265bed915a1bf9213949a9ef35dfa75cc5be1cc7beb6a0748aee1	curl/8.17.0	::1	2026-10-16 19:22:30.857+00	\N	2026-10-09 19:22:30.862+00
138	1	\N	e2c5447d31abb983fed82c28f6d874cc55896362ef3d8b0ca7ae9d4030953a89	curl/8.17.0	::1	2026-10-16 19:27:43.556+00	\N	2026-10-09 19:27:43.561+00
139	5	\N	86d4d86f5453b552df120a6e03a39173a9dd1665b209153c2539696edaeba844	curl/8.17.0	::1	2026-10-16 19:27:43.734+00	\N	2026-10-09 19:27:43.74+00
140	6	\N	31efb75a7df5b9b64bd3f10fc6515b55109b487d55dd54892a81d0039e8f4f8a	curl/8.17.0	::1	2026-10-16 19:27:45.026+00	\N	2026-10-09 19:27:45.051+00
141	\N	1	59c0abb9c1eaf7ded82473227ce5f53c0d30e5b68c567726e470c4a9a6ea7d3d	curl/8.17.0	::1	2026-10-16 19:48:20.298+00	\N	2026-10-09 19:48:20.305+00
142	1	\N	c78284c5588b6acd390bc7bf76596f409898d82efc8d6a7ab8b5f1724b25a111	node	::1	2026-10-16 20:34:13.116+00	\N	2026-10-09 20:34:13.14+00
143	1	\N	0d0ac4d68f8a645e641bb0cbe34d1c437e339367305952404e1d2575c5254574	node	::1	2026-10-16 20:36:01.88+00	\N	2026-10-09 20:36:01.921+00
144	\N	1	cc4ef8157fdd89c17725dba2ca75d6dc1a4fe8ba2e4d1b5c173957da5514cd78	node	::1	2026-10-16 21:00:54.263+00	\N	2026-10-09 21:00:54.314+00
145	\N	2	ae6c5d3a836e14bcfa135ad2cc53fb9488904cc5808823e8e237d5e9eb44e23b	curl/8.17.0	::1	2026-10-16 22:46:27.878+00	2026-10-09 22:46:28.189+00	2026-10-09 22:46:27.922+00
22	\N	2	99574c55d49acdbbb5824eafbfb7d77358373768b983b06476518de236dd8b53	node	::1	2026-10-15 22:46:43.19+00	2026-10-09 22:46:28.402+00	2026-10-08 22:46:43.193+00
23	\N	2	025213fd5e8a781cc8c9376bce6fb5955372f9ff9d8e3e5afd4d70816ded4b8e	node	::1	2026-10-15 22:46:43.29+00	2026-10-09 22:46:28.402+00	2026-10-08 22:46:43.292+00
24	\N	2	6434bb38fa8172ff5e1680184239b2c0cab5b48fe5c9ad15fa43d3f971526ef2	node	::1	2026-10-15 22:46:43.501+00	2026-10-09 22:46:28.402+00	2026-10-08 22:46:43.504+00
26	\N	2	723c6b29429c551c63d55d6bff2028e74a927271f92eec64013f405d1bf97d7e	node	::1	2026-10-15 22:48:10.325+00	2026-10-09 22:46:28.402+00	2026-10-08 22:48:10.328+00
112	\N	2	49107fc74ced30354374153372cd171e807bdcb558e1adad94e5f572c550e974	curl/8.17.0	::1	2026-10-16 13:12:03.429+00	2026-10-09 22:46:28.402+00	2026-10-09 13:12:03.436+00
117	\N	2	462a93562c20b9568b68b66b0d3adb32fcaa3edc95f585d5599d5f8143da57d4	node	::1	2026-10-16 13:32:15.216+00	2026-10-09 22:46:28.402+00	2026-10-09 13:32:15.23+00
126	\N	2	3855c9eb496a490eb9673929c4b509d47925489c857900fdda01fc8fcfce28bb	node	::1	2026-10-16 17:15:53.386+00	2026-10-09 22:46:28.402+00	2026-10-09 17:15:53.429+00
132	\N	2	d7f247bfe7e6ba3d3625f908f6f54a43c350df12e47d434ffca0f8dc56df324f	curl/8.17.0	::1	2026-10-16 19:07:36.925+00	2026-10-09 22:46:28.402+00	2026-10-09 19:07:36.971+00
134	\N	2	5c39c23e5bc3527bf18467bb04ba56a4b05a28bd27d500367547e20ef6d2c79f	curl/8.17.0	::1	2026-10-16 19:12:37.657+00	2026-10-09 22:46:28.402+00	2026-10-09 19:12:37.705+00
146	\N	2	6949ea37525b8f84de364096aabab5910a5c9c996908dc265900fb14892fd985	curl/8.17.0	::1	2026-10-16 22:46:28.207+00	2026-10-09 22:46:28.402+00	2026-10-09 22:46:28.211+00
147	2	\N	ab6d64dee739ba8cf3a2d88f671dce44f3f7727d4e35896e5cd03139d5e67d0b	curl/8.17.0	::1	2026-10-16 22:46:36.906+00	\N	2026-10-09 22:46:36.913+00
148	\N	2	f7bfa0572ac1b2f63e305f713e8f9e15ce60df5a6217d5639fe95c4c25cd2391	curl/8.17.0	::1	2026-10-16 22:46:41.437+00	\N	2026-10-09 22:46:41.442+00
149	1	\N	a2a8ab8bd0d09b7176f4ffc74e327305a748483fbead929dfdec87f024cdd03c	curl/8.17.0	::1	2026-10-16 22:55:25.228+00	\N	2026-10-09 22:55:25.276+00
150	5	\N	72a5da7070986e1c426770575264dbc7238e3a824230059abd8dfee4d1a58c23	curl/8.17.0	::1	2026-10-16 22:55:25.458+00	\N	2026-10-09 22:55:25.466+00
151	\N	2	ed939916d0699b6fe214a418636687a27218b98eb1aa2fe393d478745945bffe	curl/8.17.0	::1	2026-10-16 22:55:33.64+00	\N	2026-10-09 22:55:33.649+00
152	\N	1	074be43b7975c7c704eb959707e09578cb361758c7236407710ccac1581a4499	curl/8.17.0	::1	2026-10-16 22:55:46.871+00	\N	2026-10-09 22:55:46.877+00
153	\N	1	40742891575a1e3962ebe81e119ac79f37fbdcfc683dbbe41334e10be6466722	curl/8.17.0	::1	2026-10-16 23:32:09.669+00	\N	2026-10-09 23:32:09.727+00
154	20	\N	2a16dfe0b817c0808b53c3a668904c2b43048d20c09e4d03f84c11ca8e6a33d9	curl/8.17.0	::1	2026-10-16 23:32:28.421+00	\N	2026-10-09 23:32:28.43+00
155	1	\N	f6dbb97477ec161d52a3e8edefb2efe6b1913d05fa30560a7293c96baab5042c	curl/8.17.0	::1	2026-10-16 23:32:28.956+00	\N	2026-10-09 23:32:28.965+00
156	5	\N	999aa838c6c421c30a1bf7e69dc67432c0988b54fe0786fb5e89859fbdea4570	curl/8.17.0	::1	2026-10-16 23:32:29.373+00	\N	2026-10-09 23:32:29.38+00
157	2	\N	c277bb4b9441c8ec389df239c3c18f9ddc28f8585a43909a0adc4c5e166241d7	curl/8.17.0	::1	2026-10-16 23:48:56.907+00	\N	2026-10-09 23:48:56.96+00
158	5	\N	4a5dc80215c87adf5ec72877b0aee32df63aa6210893e27fc827634ad0d64b2b	curl/8.17.0	::1	2026-10-17 00:02:19.295+00	\N	2026-10-10 00:02:19.305+00
159	7	\N	a911cbdcb74328857b967ff522526a7f5315775b5fcb07dd66f866cfb75cb9ee	curl/8.17.0	::1	2026-10-17 00:02:19.515+00	\N	2026-10-10 00:02:19.533+00
160	1	\N	1736b27438d46b15a98fcd5a6df2479c8ef83a3f4826d0283f4894f7ac5c6be9	curl/8.17.0	::1	2026-10-17 00:06:02.451+00	\N	2026-10-10 00:06:02.457+00
161	\N	1	f5a9796e31aad43c67671b6393a68113ccd93fe281af02ab502a0772ec3b5625	curl/8.17.0	::1	2026-10-17 00:06:02.654+00	\N	2026-10-10 00:06:02.662+00
162	1	\N	80c1e3ee95333351fe787a9cfc185c227ae190a336a85740be925879b2f13938	curl/8.17.0	::1	2026-10-17 00:15:13.253+00	\N	2026-10-10 00:15:13.258+00
163	1	\N	bdb1fec7553056558161e0497332b7301064abf01c0456efe409eb169466a68e	curl/8.17.0	::1	2026-10-17 00:27:51.397+00	\N	2026-10-10 00:27:51.403+00
164	1	\N	e5ecb46560bcb81bff3b7c076773a68aea6fdc83722c5a71448e21305f2d3f95	curl/8.17.0	::1	2026-10-17 00:40:28.615+00	\N	2026-10-10 00:40:28.673+00
166	2	\N	0b0158c21333a7c59fa93ce56b737909dc35401cb7d29020112fc11fd04614e7	curl/8.17.0	::1	2026-10-17 01:07:33.025+00	\N	2026-10-10 01:07:33.03+00
167	9	\N	55f7ceb31d837284c60a8e05438682605ca17042c439827b13d0741388d68b38	curl/8.17.0	::1	2026-10-17 01:20:44.843+00	\N	2026-10-10 01:20:44.926+00
165	9	\N	f3977587fed31fa845e59f7f92b0016bb7a9f9b98f020444b7bc1f37bb70204d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 01:02:57.935+00	2026-10-10 01:25:56.16+00	2026-10-10 01:02:57.94+00
168	9	\N	f1d02fd7e5e8da7b6ec72a2192046062dc059cd9287ff0c891da79c5456d4dc0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 01:25:56.174+00	2026-10-10 01:46:50.482+00	2026-10-10 01:25:56.18+00
169	9	\N	b7d9f726f444ecd16b70e9756de9baf8908e38a968965a8f475e65fdccbf8b4e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 01:46:50.524+00	2026-10-10 09:38:19.628+00	2026-10-10 01:46:50.537+00
170	9	\N	f028a8bd479ba6dc9a906438885bd25facef29edc083a98e7b09001c982feb96	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 09:38:19.648+00	2026-10-10 09:59:22.657+00	2026-10-10 09:38:19.662+00
171	9	\N	a312cc778be2a7a6cd5463cd6ed04621b8debff276abcaecfb9200b850e2dfeb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 09:59:22.667+00	2026-10-10 10:30:04.767+00	2026-10-10 09:59:22.676+00
172	9	\N	bd34093501eec44e0b090f806ffccc3240b98c65f9567ea5d6147f01beb0b8db	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 10:30:04.804+00	2026-10-10 10:46:17.276+00	2026-10-10 10:30:04.857+00
173	9	\N	38b32e3d61b36f1b0d474f25255343374eb9d66d529ad92faa9f0e1d21b6d607	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 10:46:17.287+00	2026-10-10 11:03:07.818+00	2026-10-10 10:46:17.295+00
174	9	\N	a9e7bce8394af1b4b83aa2b58292b057a53b8c570c547e4e07c9f65afcd5078e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 11:03:07.83+00	2026-10-10 11:23:49.035+00	2026-10-10 11:03:07.843+00
176	\N	1	783899dd768c473776af1b3512bd03caa70f1e39a797331469941ee6229e513c	curl/8.17.0	::1	2026-10-17 11:27:53.63+00	2026-10-10 11:28:01.087+00	2026-10-10 11:27:53.639+00
177	\N	1	6b024ceadf6fd340307ef839f7c40b013d45ecc2a46d31aec1f441b0bdb49a3c	curl/8.17.0	::1	2026-10-17 11:41:46.405+00	2026-10-10 11:41:55.922+00	2026-10-10 11:41:46.457+00
175	9	\N	e288b835990b2c79e271ae43e1b48e12ff35121b772e120036ca527154bee914	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 11:23:49.049+00	2026-10-10 11:48:33.088+00	2026-10-10 11:23:49.056+00
178	9	\N	322b1e68204dfc16907a3ccdca89d4d8c811fbb4285c684cbe3b6b0abf5bf3fa	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 11:48:33.147+00	2026-10-10 12:06:43.764+00	2026-10-10 11:48:33.204+00
180	\N	1	328a80ec3269dc1009856269d690991a407fee7a40618b6ad64593a9a6f1a9c2	curl/8.17.0	::1	2026-10-17 12:11:40.11+00	2026-10-10 12:11:40.564+00	2026-10-10 12:11:40.168+00
181	5	\N	cd7d3a81aabd29631b8c923af60afc01ee64bfd9859ef7be4f1c31b843140330	curl/8.17.0	::1	2026-10-17 12:11:40.826+00	2026-10-10 12:11:41.275+00	2026-10-10 12:11:40.834+00
179	9	\N	74b3362005506fe4d4021d73ad275fbfc847537fcbf2fa18d80625ddec6d7aa1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 12:06:43.802+00	2026-10-10 12:42:08.136+00	2026-10-10 12:06:43.844+00
182	9	\N	ef440c87d0c60622acc36898e7815c3aaafbd91357ea6ad5d7a8be9287ec6359	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 12:42:08.151+00	2026-10-10 13:02:12.827+00	2026-10-10 12:42:08.17+00
183	9	\N	66a5c988dac75eee107f6ea2580f2157ffb916755e0340053d3da57f3cb4d6e7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 13:02:12.835+00	2026-10-10 13:23:39.748+00	2026-10-10 13:02:12.841+00
185	2	\N	43fb44bf4122958182b3dbcf2d379f2693b3b16aff8e44897033df9f19ec3995	node	::1	2026-10-17 13:32:26.257+00	\N	2026-10-10 13:32:26.295+00
186	5	\N	8598556d9dc9ba646dcfabf0ff09a1d9855f8b9c982fdd6f5093bb499322767a	node	::1	2026-10-17 13:32:26.396+00	\N	2026-10-10 13:32:26.4+00
187	2	\N	9484f4c33d20dc60fbf512243e38ec4d407cd10cb60e48788716d0164f0ef267	curl/8.17.0	::1	2026-10-17 13:39:31.177+00	\N	2026-10-10 13:39:31.183+00
188	5	\N	b516cc0178b1c715a2d4c07916b49a02450362e55fd36a7f3b0fc60d08c11f36	curl/8.17.0	::1	2026-10-17 13:39:31.347+00	\N	2026-10-10 13:39:31.352+00
189	\N	1	72e276e5a558085445b89719032b584cf20cb30c638099ea024c67ac41e2d97e	curl/8.17.0	::1	2026-10-17 13:39:31.55+00	\N	2026-10-10 13:39:31.561+00
190	1	\N	ff7d636f3a08aa145de057968294ad60c5cafe321f34e076f02bf12df5faff83	curl/8.17.0	::1	2026-10-17 13:40:06.813+00	\N	2026-10-10 13:40:06.818+00
191	9	\N	bbee0bc49977c1579f31b7c6b514232d999be384ba629c1fd420f2c661d332f3	curl/8.17.0	::1	2026-10-17 13:40:07.008+00	\N	2026-10-10 13:40:07.013+00
192	5	\N	54ff8911345895638e00ba7d925238e4225a364912d4eca2ae1a74fcb6eaf793	curl/8.17.0	::1	2026-10-17 13:40:07.189+00	\N	2026-10-10 13:40:07.194+00
184	9	\N	8577a2a87ff3a301ccc23d4714c3cad6e5241ae213a99184acd4a2fe869d4f3e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 13:23:39.776+00	2026-10-10 14:01:59.716+00	2026-10-10 13:23:39.813+00
193	9	\N	edb6d049a4e8a404eb448e7170b3a458072daed3e651d50428e2111ee6c80032	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:01:59.722+00	2026-10-10 14:02:04.83+00	2026-10-10 14:01:59.726+00
195	\N	2	6dd189212aad4e5f21ce760c8125ee248aaa1ca777c150850a8d01b6b18e375f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:05:27.582+00	\N	2026-10-10 14:05:27.588+00
205	5	\N	c2fc5d0f05225a6cda5786aa1c7b94c5e66f63d1e88d191d6356507ec097bc1b	curl/8.17.0	::1	2026-10-17 14:29:32.837+00	\N	2026-10-10 14:29:32.871+00
206	5	\N	af0a2ac5b5bbbf2c96630f8c2be9df69d86e04c1ca2f9a863df03aab4af640ae	curl/8.17.0	::1	2026-10-17 14:32:40.138+00	\N	2026-10-10 14:32:40.149+00
207	2	\N	39757054baae710e5f88222023c2b8a486f5c7e48b82585d2e343730ba8e6615	curl/8.17.0	::1	2026-10-17 14:32:40.388+00	\N	2026-10-10 14:32:40.397+00
196	1	\N	2a6d87ca112a1de7628b9279fdc2e2d7b8fa87271465853b8259975a740a5def	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:13:21.793+00	2026-10-10 14:34:12.27+00	2026-10-10 14:13:21.799+00
197	2	\N	cb7448e2349750223978ea20324501ddb6e5629bad27642e2aae755da76d797b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:14:49.627+00	2026-10-10 14:35:51.468+00	2026-10-10 14:14:49.632+00
210	1	\N	0d5a68ecda4c1fc2a2d0f89332222f3888cfa58f72b14a7ae531b72cb5269b13	curl/8.17.0	::1	2026-10-17 14:38:13.492+00	\N	2026-10-10 14:38:13.498+00
202	5	\N	ba0af48a526cb1a867ecb71ce63bf03884f8d3800ada04c6d6e798413b1f2262	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 14:19:19.677+00	2026-10-10 14:38:15.793+00	2026-10-10 14:19:19.682+00
212	\N	1	958a5fd90ef0d850285c4450a3bdcf06cc37cb892e9f175f278d64f084bdb81c	curl/8.17.0	::1	2026-10-17 14:44:00.445+00	\N	2026-10-10 14:44:00.452+00
199	4	\N	4ce84a9f72f6ae381a958ef5a5c56ce1bd3659493a8d325c504abd9ef8e74cec	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:16:49.175+00	2026-10-10 14:46:46.65+00	2026-10-10 14:16:49.181+00
213	4	\N	51931bd7bc546f603a9527e8059376d205bdd72238bc74d2cf5c8e60ab6930e0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:46:46.683+00	\N	2026-10-10 14:46:46.707+00
203	6	\N	d5f2921232903f8d0587710a0bae0f9eb8b5e826f388d76c131335f54a1593b8	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 14:20:58.13+00	2026-10-10 14:46:49.733+00	2026-10-10 14:20:58.134+00
198	3	\N	20becce10ef11d84fef2767ca9e945a3aeedd582c99a2be815b501cc56d8c199	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:15:55.107+00	2026-10-10 14:46:51.589+00	2026-10-10 14:15:55.112+00
204	9	\N	537d7d71d6b5898b4582470f266e202286559cb3962846e3fbc38f973d400ef7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:23:05.679+00	2026-10-10 14:46:51.595+00	2026-10-10 14:23:05.683+00
214	6	\N	d07f61df6a40e52c9cb604297b49609c2246478d07be25330da217972b8cf5eb	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 14:46:49.738+00	2026-10-10 15:02:45.898+00	2026-10-10 14:46:49.743+00
209	2	\N	846c5c7490cd06b3b30424d856f1153494f8a196bc1afe3ab27bc0908506cc8c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:35:51.486+00	2026-10-10 15:03:01.959+00	2026-10-10 14:35:51.489+00
208	1	\N	fb31e91925de79322ec5647cf9d9e48854f48250b1a93940693a83b922c21860	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:34:12.279+00	2026-10-10 15:03:27.003+00	2026-10-10 14:34:12.285+00
194	\N	1	16afc1fc279486e73a38fc501a1c0d18a5d56c165eee21511f36032881db5cd3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:03:05.053+00	2026-10-10 15:06:12.58+00	2026-10-10 14:03:05.058+00
211	5	\N	76282af9d12a0ea428dd6708080461a1cbe04098977fc0613bc528acf399080a	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 14:38:15.799+00	2026-10-10 16:16:18.958+00	2026-10-10 14:38:15.802+00
200	7	\N	0f7ca5f1a658a904f032d8f70bbce16e566410d3e4a46ee206f46f8b956d6607	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	::1	2026-10-17 14:17:42.851+00	2026-10-10 17:27:27.364+00	2026-10-10 14:17:42.857+00
201	8	\N	f646f08f0e8b194b48bbd6831d9b6bba9d2c3e1e50423746eb9968c580f6a73d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	::1	2026-10-17 14:18:17.224+00	2026-10-10 17:50:52.7+00	2026-10-10 14:18:17.229+00
215	3	\N	2edcd351c45ab9425ab9ac2756f652b4f849f3b91f27579adb74a11cef44051f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:46:51.594+00	\N	2026-10-10 14:46:51.598+00
220	\N	1	f5c9d2574d4b05970d4f5f3293ecd2fe8acc1743376838793d1a66bebc6a956d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:06:12.59+00	2026-10-10 15:24:38.926+00	2026-10-10 15:06:12.598+00
218	2	\N	1efe45d145cea9c026c0b84f5e8dd04c2aceaf016fbaaa264fc0dade85de6abc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:03:01.963+00	2026-10-10 15:24:38.98+00	2026-10-10 15:03:01.969+00
219	1	\N	c4ad8305de7276a1f433806619edeb02a97ad934b04e99c6020e4faf0ac253a9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:03:27.013+00	2026-10-10 15:24:39.045+00	2026-10-10 15:03:27.018+00
221	21	\N	358a06dc1c8f121cc648cce07a60268203dbfad3c5d8830b0ccc602eeccb0f6e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:08:45.523+00	2026-10-10 15:24:39.075+00	2026-10-10 15:08:45.527+00
225	21	\N	94ac6b964ce4736952df2e6441da502ad3feacec1a48e8c64103e92fa3d5481c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:24:39.084+00	2026-10-10 15:41:39.243+00	2026-10-10 15:24:39.108+00
227	2	\N	c633b4a94d5fe625e8e5e373189094aeb1382667a350847ffd315f8227acdf14	curl/8.17.0	::1	2026-10-17 15:43:27.838+00	\N	2026-10-10 15:43:27.843+00
217	6	\N	cb4fa26f2b41e7af3b95ca08efd6801fdcb79862ef659c614180bfa8106bb96d	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 15:02:45.905+00	2026-10-10 16:00:00.15+00	2026-10-10 15:02:45.91+00
222	\N	1	de6523009c08d6655f690f6e51cb10a963a423bfb14d5daf37c43bae2b2bfd7b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:24:38.944+00	2026-10-10 16:16:18.88+00	2026-10-10 15:24:38.95+00
228	6	\N	bb404ddb5adce76a433cad4bdd3502774ffb0c8882bccccb767136d9484ff8d2	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 16:00:00.16+00	2026-10-10 16:16:22.253+00	2026-10-10 16:00:00.167+00
231	6	\N	f080e0be3cfb50382c89b920fa29926903903c77dc0be6749a8a927745959c0e	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 16:16:22.259+00	\N	2026-10-10 16:16:22.265+00
226	21	\N	76c93e7c5bd88da867dc85760ae2fa8c6e1d95a746a93f486d679991cf57911d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:41:39.259+00	2026-10-10 16:16:22.674+00	2026-10-10 15:41:39.264+00
223	2	\N	04583c306201a254f6b25e1736244bf8c9ebbc2979f48e69980a35720b888252	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:24:38.985+00	2026-10-10 17:26:38.83+00	2026-10-10 15:24:38.992+00
232	21	\N	a400139eaf6cbdacb2033a976a47ace4f0e9428ff729f3da42cb2d4da4608314	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 16:16:22.682+00	2026-10-10 17:42:07.128+00	2026-10-10 16:16:22.695+00
233	2	\N	3d22664b3f141811c88f9b3833409ba60b0da4674abdcc9be87649d90dce37fe	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 17:26:38.881+00	2026-10-10 17:48:47.639+00	2026-10-10 17:26:38.932+00
236	2	\N	d9ec58115d5bfe34b7dc59fe8986338428fb74f4e997a6731d93f460e3130be0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 17:48:47.699+00	\N	2026-10-10 17:48:47.752+00
216	9	\N	673138877a53d4fcb4c31bc1079e603f907bdc272a061515b6d48081cb96350f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 14:46:51.6+00	2026-10-10 17:49:40.402+00	2026-10-10 14:46:51.604+00
238	8	\N	4d78dff25bd9a2e3f981fe301055d3b53366cc4b3d0bd558612bb855b1cf29ce	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	::1	2026-10-17 17:50:52.707+00	\N	2026-10-10 17:50:52.713+00
224	1	\N	911845da261311aca021779b5a7e1c58f673e2dd412dafd6f66330fb856fcc86	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 15:24:39.054+00	2026-10-10 17:56:10.756+00	2026-10-10 15:24:39.068+00
235	21	\N	3299cd5d584588b5687d5370f6f8654cfe68bd1292095ff1befe7bd65b7f83fb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 17:42:07.137+00	2026-10-10 17:57:31.288+00	2026-10-10 17:42:07.142+00
239	1	\N	8279fb5942224b6f6ab0d461e0b45354cbec7eb930d8d3255b404be637193605	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 17:56:10.77+00	2026-10-10 18:11:31.627+00	2026-10-10 17:56:10.779+00
237	9	\N	2628e4eec1f9859be96b8b620dacfc0c8237e5f94b4dcaf7e75ded7eb3709909	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 17:49:40.414+00	2026-10-10 18:11:31.707+00	2026-10-10 17:49:40.429+00
240	21	\N	732fa5e23411d3ef5b674567e83a6cc4de9c1dbd37a9c3d5530c39fd74a6de41	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 17:57:31.302+00	2026-10-10 18:13:15.383+00	2026-10-10 17:57:31.338+00
244	1	\N	6d31ec07489b159c72ab10cd2b668d24f8adaeb41d651395d99f01ea10b2c375	curl/8.17.0	::1	2026-10-17 18:20:07.731+00	\N	2026-10-10 18:20:07.737+00
245	22	\N	ce1aab9d03bb991c8a2c7d9493e2486293b355d11cc53063aedd9715b5e97ae6	curl/8.17.0	::1	2026-10-17 18:20:08.422+00	\N	2026-10-10 18:20:08.427+00
246	23	\N	ee6af3cbf6da7f3a8040e9b28d2410b739f0cd1529881867c427f355ba60fe33	curl/8.17.0	::1	2026-10-17 18:20:09.216+00	\N	2026-10-10 18:20:09.222+00
242	9	\N	5aa133a20cf4990e01ef7b4a4ad69656777ee245e35d02ec10a12dd5b7719c69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 18:11:31.719+00	2026-10-10 19:19:26.468+00	2026-10-10 18:11:31.725+00
229	\N	1	00f24af4e2697c6043e79bada8edf91c075330d68631bb24a1449766dad5ac38	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 16:16:18.912+00	2026-10-10 20:07:32.733+00	2026-10-10 16:16:18.946+00
234	7	\N	a3407908f37433deed0d9740225cbea32bd3ec87e5aef304c31a120de55f2c3f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	::1	2026-10-17 17:27:27.374+00	2026-10-10 20:19:22.396+00	2026-10-10 17:27:27.389+00
230	5	\N	6dd70bf7b9dd98de47fc09b9765bce653548dca2c2ec486fbd4b9a789453cac0	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 16:16:18.968+00	2026-10-10 20:49:16.191+00	2026-10-10 16:16:19.034+00
241	1	\N	0ff1cbf0101ecaa40405a450ea376050dbbe8cd6f3e8be50fb3ce5d0301793b9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 18:11:31.658+00	2026-10-10 20:52:21.998+00	2026-10-10 18:11:31.7+00
247	5	\N	ff959b78d3f4e897bc30c691c09ec295e422ee8550f36f2e456aefc4c0862d0a	curl/8.17.0	::1	2026-10-17 18:20:09.963+00	\N	2026-10-10 18:20:09.968+00
248	2	\N	0a264cded35b664d14da22808269096de1cf61d2ee598c7e89824375317c4fd5	curl/8.17.0	::1	2026-10-17 18:33:51.899+00	\N	2026-10-10 18:33:51.946+00
249	8	\N	cebc4003f537a1d09857a3092c71f3617731ce71844b9ca3aa42d722dd3ac9c4	curl/8.17.0	::1	2026-10-17 18:43:51.117+00	\N	2026-10-10 18:43:51.146+00
243	21	\N	d267d169bfcc00cd66f7f3f62f0bbe97121660ab82ba630a4cfb5d7fe91b444c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 18:13:15.457+00	2026-10-10 18:52:46.186+00	2026-10-10 18:13:15.513+00
250	21	\N	a94afb74479b39835c16152099ed9037ca75d16bb1fe026e750f41eab4fe3fee	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 18:52:46.224+00	2026-10-10 19:10:23.726+00	2026-10-10 18:52:46.262+00
251	21	\N	cd027474462d6ee465e8c52e68115c0fa06f6a6dcd99f6e35cca090184ad0684	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 19:10:23.748+00	2026-10-10 19:25:24.998+00	2026-10-10 19:10:23.782+00
254	2	\N	4f36a37d78ec46485387bfe8b4791ec36535184ff23cf211df4b38a253bfa88c	curl/8.17.0	::1	2026-10-17 19:30:09.278+00	\N	2026-10-10 19:30:09.328+00
255	\N	1	fd12992ffe34f65ae1f45a9a8f2d497526445893b44f524691314c38c6fc4424	curl/8.17.0	::1	2026-10-17 19:35:20.573+00	\N	2026-10-10 19:35:20.611+00
256	20	\N	8d57674ff680908b43cf4fb2078721b0c93691008f151c19bc11e443d5505212	curl/8.17.0	::1	2026-10-17 19:36:14.811+00	\N	2026-10-10 19:36:14.825+00
257	\N	2	c890f49c75cf3ff3f810c605df38c917c91f4290ecb75fc2991ea9fadfe7f8e4	curl/8.17.0	::1	2026-10-17 19:36:33.964+00	\N	2026-10-10 19:36:33.968+00
253	21	\N	c3cd0b25f84d5dce542749c30969f9cb71a97c0527e3cde0f92b92afd64ab74b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 19:25:25.033+00	2026-10-10 19:40:29.168+00	2026-10-10 19:25:25.094+00
252	9	\N	4becc7744e93032b925222cf9095913ec9416ef720edd8ccad21edcf2d100981	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 19:19:26.503+00	2026-10-10 19:41:45.76+00	2026-10-10 19:19:26.554+00
259	9	\N	b376c193041f3e6f553f81532dba7d3eec8c49541c35391c30ac8496ff95ccba	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 19:41:45.877+00	\N	2026-10-10 19:41:46.05+00
258	21	\N	5348b80155b9782a843a90805fd76dd09b3094e9b561990a9e03da5fd9530fb2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 19:40:29.175+00	2026-10-10 19:56:05.608+00	2026-10-10 19:40:29.18+00
262	7	\N	d22ae807747fc1f4a3739094fe393cab6643cf9d0cbe650fad19dc0228a9acfc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0	::1	2026-10-17 20:19:22.419+00	\N	2026-10-10 20:19:22.438+00
260	21	\N	9cca844072fd8dad393cec68134f39114d3e061daeea710e28d6d3d621378945	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 19:56:05.618+00	2026-10-10 20:23:57.332+00	2026-10-10 19:56:05.623+00
263	21	\N	7222f0b3c469c04e2bf87f2cfb5de150f1497752c222da590639f83d53cf3435	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 20:23:57.343+00	2026-10-10 20:39:13.438+00	2026-10-10 20:23:57.35+00
261	\N	1	606f3e6f3ff03a7b022ca198a44b3ae72d6fc13c055a932428583175193f83c3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 20:07:32.783+00	2026-10-10 20:44:58.719+00	2026-10-10 20:07:32.846+00
266	5	\N	87a3b524cebbabb07e5e02fd8f5fa8d046f9e2f908e4cd7f9131efc2acaa331d	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0	::ffff:127.0.0.1	2026-10-17 20:49:16.204+00	\N	2026-10-10 20:49:16.218+00
264	21	\N	b020c1b34c518cc1d6c7325b0c05995487e0de1234fae888049aa995ba405422	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 20:39:13.448+00	2026-10-10 21:16:23.207+00	2026-10-10 20:39:13.453+00
268	21	\N	8690e053ff945da6fe4f281683e286482c90a2629ec7c7b63fec7413020fcdbb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 21:16:23.215+00	2026-10-10 21:16:23.289+00	2026-10-10 21:16:23.221+00
269	21	\N	f54a726451440567ea151133fccce9d3fd2070a825981443ee353395880da530	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 21:16:23.296+00	\N	2026-10-10 21:16:23.307+00
267	1	\N	b4c1c2f0e3d2a80d2e869fcbdda772738f37fa899c86bea6a6ecc6e9e031bdc4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 20:52:22.008+00	2026-10-10 21:16:23.511+00	2026-10-10 20:52:22.014+00
270	1	\N	ca6e4cd398d067b257495c70932bb8c169a1a417a03451a818c839d255d76f7f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 21:16:23.518+00	\N	2026-10-10 21:16:23.527+00
265	\N	1	1aae8ab18efd13ebea194791d6321e5a1eb306b65946be0559430aa23009d896	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 20:44:58.77+00	2026-10-10 21:16:23.578+00	2026-10-10 20:44:58.829+00
271	\N	1	10262224c3a9fe161791e39eb373e93c6a4bee94548652685d4ff0f196df2f92	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-17 21:16:23.591+00	\N	2026-10-10 21:16:23.6+00
273	\N	1	4c31abfed545bbd99455c5c067802791844dd9d2d81c32c24b66683e2a39b893	curl/8.17.0	::1	2026-10-18 11:29:15.287+00	\N	2026-10-11 11:29:15.32+00
272	\N	1	59a0a451b7c54d610ca2f49070d68e5245f668a7df81de8cb1e2dbf176516d25	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-18 11:16:27.797+00	2026-10-11 11:53:26.023+00	2026-10-11 11:16:27.835+00
274	\N	1	265e0d1e413c2afdee1f992a1c84eeeb13c2354c47f4cdfb73f8b602f6b9b245	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-18 11:53:26.038+00	2026-10-11 12:14:26.667+00	2026-10-11 11:53:26.042+00
275	\N	1	b183b50dee4dfffb679e7cb379f81da079372161094d32bd09b4ff2b40548955	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	::1	2026-10-18 12:14:26.675+00	\N	2026-10-11 12:14:26.679+00
276	\N	1	6bdc922511352cd3aff3f1d9a24e4f0b8fb487aa74ddb37689e53a3534a4d9eb	curl/8.17.0	::1	2026-10-18 12:24:40.923+00	\N	2026-10-11 12:24:40.963+00
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, tenant_id, project_id, report_date, progress_pct, weather, note, created_by, created_at, updated_at) FROM stdin;
1	1	4	2026-10-08	50	Sunny	Second coat	3	2026-10-08 23:39:57.493+00	2026-10-08 23:39:58.077+00
3	1	4	2026-10-06	90	\N	\N	3	2026-10-08 23:39:58.308+00	2026-10-08 23:39:58.308+00
4	1	10	2026-09-28	40	\N	\N	3	2026-10-08 23:41:03.796+00	2026-10-08 23:41:03.796+00
5	1	10	2026-10-07	40	\N	\N	3	2026-10-08 23:41:03.85+00	2026-10-08 23:41:03.85+00
6	1	11	2026-10-08	20	\N	TEST margin report	3	2026-10-08 23:51:17.727+00	2026-10-08 23:51:17.727+00
7	1	14	2026-10-09	35	sunny	INTERNAL report note	3	2026-10-09 00:05:41.53+00	2026-10-09 00:05:41.53+00
8	13	17	2026-10-10	14	20	\N	21	2026-10-10 19:50:16.936+00	2026-10-10 19:51:28.863+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, tenant_id, role_id, module, can_view, can_create, can_edit, can_delete, scope) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, label, is_active) FROM stdin;
1	admin	Main Manager	t
2	manager	Sub Manager	t
3	site_supervisor	Site Supervisor	t
4	team_leader	Team Leader	t
5	worker	Worker	t
6	sales	Sales	t
7	accountant	Accountant	t
\.


--
-- Data for Name: service_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_materials (id, tenant_id, service_id, material_id, quantity_per_unit) FROM stdin;
8	1	1	1	0.1500
9	1	1	2	0.0500
10	1	1	3	0.0200
11	13	3	22	3.0000
12	13	3	20	2.0000
13	13	3	18	4.0000
14	1	4	24	1.1140
15	1	4	41	1.6860
16	1	4	36	2.7833
17	1	7	30	0.9300
18	1	7	42	2.3378
19	1	8	42	0.3244
20	1	8	52	4.4734
21	1	8	30	3.8635
22	1	11	29	4.0228
23	1	11	53	1.7270
24	1	11	3	4.7519
25	1	12	6	0.5448
26	1	15	1	0.4047
27	1	15	37	0.6945
28	1	16	25	4.9991
29	1	16	1	3.8657
30	1	16	40	3.1917
31	1	17	5	4.7219
32	1	24	38	1.3503
33	1	24	28	3.1507
34	1	26	3	1.2761
35	1	26	33	1.5187
36	1	28	2	3.7848
37	1	28	42	0.2532
38	1	28	5	4.3368
39	1	32	40	0.5464
40	1	32	39	1.4135
41	1	34	30	0.1014
42	1	34	43	0.6322
43	1	38	25	4.6020
44	1	44	1	3.1045
45	1	44	36	4.6503
46	1	51	5	0.9050
47	1	51	25	0.8778
48	1	51	51	3.5680
49	1	54	45	2.9882
50	1	54	27	2.6888
51	1	56	5	3.9037
52	1	56	3	3.5203
53	1	56	26	1.2341
54	1	58	53	0.9083
55	1	59	1	2.9777
56	1	64	28	1.0813
57	1	64	6	4.8282
58	1	67	47	0.5370
59	1	67	33	2.0692
60	1	68	29	4.5849
61	1	68	5	3.6081
62	1	69	33	4.6507
63	1	74	49	2.6727
64	1	74	35	1.6746
65	1	74	36	2.5443
66	1	75	27	2.3493
67	1	75	46	1.5681
68	1	77	30	0.6099
69	1	77	48	3.7032
70	1	77	43	0.5453
71	1	78	26	0.6200
72	1	78	45	1.0789
73	1	78	5	3.4709
74	1	86	2	3.3195
75	1	86	32	3.7276
76	1	86	45	4.7825
77	1	93	53	4.5509
78	1	94	1	1.4156
79	1	94	25	3.9206
80	1	95	38	2.4587
81	1	95	41	4.9709
82	1	95	33	3.1642
83	1	99	47	0.6965
84	1	109	33	4.1509
85	1	109	6	0.6432
86	1	109	52	1.4226
87	1	113	24	0.1583
88	1	115	1	4.8382
89	1	115	24	3.4448
90	1	118	5	2.7579
91	1	118	40	3.3690
92	1	118	26	0.8720
93	1	124	53	1.8270
94	1	124	43	2.2130
95	1	124	34	1.1313
96	1	125	45	2.7288
97	1	125	42	1.1906
98	1	125	24	2.3324
99	1	128	6	4.2289
100	1	128	5	3.9643
101	1	128	50	3.4769
102	1	130	32	2.5685
103	1	130	42	1.7546
104	1	130	30	1.0395
105	1	138	1	4.5269
106	1	138	48	0.9937
107	1	138	29	3.4158
108	1	139	6	4.1462
109	1	144	45	2.1578
110	1	144	31	1.6563
111	1	145	1	3.7433
112	1	145	6	4.0495
113	1	147	7	0.9364
114	1	148	26	3.9054
115	1	148	32	2.2252
116	1	149	41	2.7076
117	1	151	35	1.5979
118	1	151	6	2.9057
119	1	151	36	0.3994
120	1	154	46	4.9187
121	1	154	2	0.3644
122	1	157	53	3.3802
123	1	159	24	0.8613
124	1	159	52	2.0429
125	1	165	35	2.2678
126	1	165	31	3.6879
127	1	165	48	3.2685
128	1	167	44	2.3890
129	1	167	39	3.8655
130	1	168	25	3.3352
131	1	169	53	3.4456
132	1	169	43	3.2643
133	1	169	6	2.2779
134	1	170	30	3.9993
135	1	170	29	0.2009
136	1	170	45	2.7209
137	1	172	2	0.8333
138	1	172	3	4.6657
139	1	172	41	0.1365
140	1	175	1	3.9897
141	1	176	37	4.9141
142	1	185	30	4.2171
143	1	187	52	4.8896
144	1	188	35	4.2328
145	1	189	32	3.1926
146	1	189	25	1.2715
147	1	189	46	3.1602
148	1	196	42	1.6020
149	1	197	2	3.2068
150	1	197	46	4.3792
151	1	197	32	2.8069
152	1	198	43	2.9491
153	1	198	25	4.4804
154	1	198	28	0.8237
155	1	199	50	2.4687
156	2	204	4	1.2384
157	2	205	4	2.8659
158	2	209	4	4.9916
159	2	210	4	4.7140
160	2	224	4	3.1950
161	2	225	4	4.3483
162	2	230	4	1.4830
163	2	233	4	2.5935
164	2	236	4	4.6056
165	2	237	4	0.7411
166	2	244	4	4.2427
167	2	245	4	3.5352
168	2	246	4	4.3467
169	2	250	4	1.1022
170	2	251	4	4.4707
171	2	253	4	3.3774
172	2	256	4	3.5237
173	2	259	4	0.8153
174	2	264	4	2.1168
175	2	265	4	1.7481
176	2	268	4	1.4779
177	2	269	4	2.2205
178	2	270	4	0.4923
179	2	271	4	1.5177
180	2	272	4	4.6045
181	2	273	4	1.6638
182	2	275	4	3.0133
183	2	276	4	4.9763
184	2	277	4	2.5485
185	2	284	4	0.4534
186	2	286	4	1.1276
187	2	292	4	1.8900
188	2	295	4	1.4100
189	2	304	4	1.0508
190	2	305	4	3.6168
191	2	308	4	3.9235
192	2	309	4	2.4948
193	2	310	4	4.6727
194	2	313	4	3.5162
195	2	314	4	4.9548
196	2	317	4	2.0369
197	2	324	4	4.6064
198	2	325	4	1.6601
199	2	328	4	3.8794
200	2	330	4	4.6714
201	2	334	4	3.2108
202	2	335	4	1.9394
203	2	337	4	1.6023
204	2	349	4	3.6833
205	2	350	4	3.4649
206	2	351	4	0.2426
207	2	353	4	0.6505
208	2	354	4	1.4935
209	2	364	4	2.0116
210	2	365	4	2.3871
211	2	366	4	3.3989
212	2	368	4	1.5317
213	2	370	4	3.7927
214	2	371	4	3.2973
215	2	372	4	0.6291
216	2	375	4	4.6888
217	2	377	4	3.3235
218	2	385	4	1.3647
219	2	388	4	3.1275
220	2	392	4	1.0242
221	2	393	4	2.2013
222	2	397	4	2.7275
223	2	398	4	3.8538
224	2	399	4	3.1030
225	13	1606	9	4.6547
226	13	1606	16	3.9862
227	13	1608	14	4.1225
228	13	1608	19	4.5710
229	13	1614	11	1.4380
230	13	1624	14	1.6219
231	13	1627	15	1.7368
232	13	1627	11	4.9643
233	13	1627	19	2.0014
234	13	1628	19	3.1204
235	13	1634	12	2.2431
236	13	1634	18	4.1829
237	13	1636	20	2.7087
238	13	1636	10	4.5245
239	13	1639	21	2.2170
240	13	1639	8	1.7669
241	13	1644	23	1.7034
242	13	1647	8	1.8100
243	13	1649	23	0.2886
244	13	1649	10	2.6602
245	13	1652	16	2.6990
246	13	1652	23	4.4803
247	13	1652	15	1.6331
248	13	1653	18	2.2837
249	13	1653	22	0.7002
250	13	1655	10	3.7755
251	13	1655	14	2.2560
252	13	1658	21	0.3194
253	13	1658	9	3.5787
254	13	1659	19	0.1484
255	13	1667	8	3.8962
256	13	1667	10	1.6967
257	13	1669	10	2.4798
258	13	1671	10	4.4995
259	13	1674	12	4.4249
260	13	1676	10	2.2545
261	13	1676	13	1.7115
262	13	1677	11	0.1366
263	13	1677	8	1.5880
264	13	1677	18	4.0027
265	13	1678	19	3.5114
266	13	1684	11	1.3245
267	13	1688	23	1.0953
268	13	1688	8	2.1025
269	13	1689	13	4.2182
270	13	1689	20	4.1847
271	13	1689	15	4.4347
272	13	1694	16	3.0072
273	13	1694	15	3.6667
274	13	1699	23	3.0220
275	13	1699	21	4.2231
276	13	1704	12	0.7837
277	13	1705	18	2.9498
278	13	1705	10	0.1950
279	13	1708	13	2.5669
280	13	1708	15	2.1046
281	13	1708	19	0.9015
282	13	1709	19	0.4719
283	13	1709	13	4.3641
284	13	1709	10	3.1415
285	13	1713	9	4.3500
286	13	1713	19	1.2712
287	13	1717	14	0.8034
288	13	1718	16	2.0795
289	13	1724	19	1.7150
290	13	1724	17	3.7729
291	13	1724	20	2.2118
292	13	1725	20	4.2108
293	13	1728	16	2.5359
294	13	1730	17	0.7968
295	13	1733	23	3.1048
296	13	1733	18	0.5064
297	13	1733	8	1.3198
298	13	1734	21	0.6789
299	13	1734	9	0.7902
300	13	1738	21	1.3800
301	13	1738	8	4.5246
302	13	1738	12	2.9203
303	13	1739	23	0.7910
304	13	1739	9	4.9566
305	13	1739	11	3.0582
306	13	1744	23	0.7267
307	13	1744	21	0.4610
308	13	1747	22	4.9780
309	13	1747	23	2.1918
310	13	1750	10	4.1926
311	13	1750	19	3.2945
312	13	1750	17	4.0084
313	13	1751	9	4.0772
314	13	1752	11	0.1621
315	13	1753	19	3.7693
316	13	1754	12	1.0270
317	13	1754	16	1.6330
318	13	1757	10	3.9881
319	13	1757	20	1.3440
320	13	1757	22	2.9350
321	13	1769	20	1.9485
322	13	1769	8	4.5734
323	13	1769	11	3.5581
324	13	1770	20	4.2069
325	13	1770	14	1.1626
326	13	1770	21	1.3949
327	13	1776	21	0.8355
328	13	1784	19	3.1203
329	13	1784	11	1.8502
330	13	1785	20	4.1084
331	13	1785	11	3.5358
332	13	1788	10	1.7747
333	13	1789	12	1.1164
334	13	1789	18	2.1658
335	13	1789	19	1.6698
336	13	1790	10	1.5942
337	13	1790	12	3.9607
338	13	1792	14	1.3087
339	13	1792	13	3.7956
340	13	1792	19	1.6027
341	13	1795	20	2.5784
342	13	1796	9	3.1913
343	13	1796	16	4.5366
344	13	1796	17	3.7182
345	13	1797	11	3.6595
346	13	1798	10	4.0719
347	13	1799	14	2.9592
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, tenant_id, category_id, description, unit, price_excl_vat, default_vat_rate, is_active, created_at, updated_at) FROM stdin;
1	1	1	TEST Painting	m2	25.00	6.00	t	2026-10-08 23:22:26.644+00	2026-10-08 23:22:26.644+00
2	1	12	TEST Labour	h	45.00	21.00	t	2026-10-08 23:22:26.697+00	2026-10-08 23:22:26.697+00
3	13	10	test_1	m2	20.00	20.00	t	2026-10-10 15:42:48.342+00	2026-10-10 15:42:48.342+00
4	1	1	Peinture murale 2 couches — standard	m2	18.68	\N	t	2026-10-10 17:57:03.667+00	2026-10-10 17:57:03.667+00
5	1	1	Peinture murale 2 couches — salle de bain	m2	19.11	\N	t	2026-10-10 17:57:03.696+00	2026-10-10 17:57:03.696+00
6	1	1	Peinture murale 2 couches — cuisine	m2	20.90	\N	t	2026-10-10 17:57:03.703+00	2026-10-10 17:57:03.703+00
7	1	1	Peinture murale 2 couches — premium	m2	25.07	\N	t	2026-10-10 17:57:03.71+00	2026-10-10 17:57:03.71+00
8	1	1	Peinture plafond — standard	m2	19.87	\N	t	2026-10-10 17:57:03.727+00	2026-10-10 17:57:03.727+00
9	1	1	Peinture plafond — salle de bain	m2	27.83	\N	t	2026-10-10 17:57:03.747+00	2026-10-10 17:57:03.747+00
10	1	1	Peinture plafond — cuisine	m2	25.35	\N	t	2026-10-10 17:57:03.756+00	2026-10-10 17:57:03.756+00
11	1	1	Peinture plafond — premium	m2	32.38	\N	t	2026-10-10 17:57:03.764+00	2026-10-10 17:57:03.764+00
12	1	1	Laquage boiseries — standard	ml	13.97	\N	t	2026-10-10 17:57:03.782+00	2026-10-10 17:57:03.782+00
13	1	1	Laquage boiseries — salle de bain	ml	14.71	\N	t	2026-10-10 17:57:03.795+00	2026-10-10 17:57:03.795+00
14	1	1	Laquage boiseries — cuisine	ml	16.81	\N	t	2026-10-10 17:57:03.802+00	2026-10-10 17:57:03.802+00
15	1	1	Laquage boiseries — premium	ml	20.14	\N	f	2026-10-10 17:57:03.814+00	2026-10-10 17:57:03.814+00
16	1	1	Enduit de lissage — standard	m2	11.15	\N	t	2026-10-10 17:57:03.839+00	2026-10-10 17:57:03.839+00
17	1	1	Enduit de lissage — salle de bain	m2	13.62	\N	t	2026-10-10 17:57:03.853+00	2026-10-10 17:57:03.853+00
18	1	1	Enduit de lissage — cuisine	m2	13.65	\N	t	2026-10-10 17:57:03.867+00	2026-10-10 17:57:03.867+00
19	1	1	Enduit de lissage — premium	m2	15.39	\N	t	2026-10-10 17:57:03.874+00	2026-10-10 17:57:03.874+00
20	1	1	Main-d’œuvre peintre — standard	h	43.26	6.00	t	2026-10-10 17:57:03.881+00	2026-10-10 17:57:03.881+00
21	1	1	Main-d’œuvre peintre — salle de bain	h	55.58	6.00	t	2026-10-10 17:57:03.887+00	2026-10-10 17:57:03.887+00
22	1	1	Main-d’œuvre peintre — cuisine	h	46.88	6.00	t	2026-10-10 17:57:03.893+00	2026-10-10 17:57:03.893+00
23	1	1	Main-d’œuvre peintre — premium	h	54.69	6.00	t	2026-10-10 17:57:03.898+00	2026-10-10 17:57:03.898+00
24	1	2	Pose carrelage sol — standard	m2	49.20	\N	t	2026-10-10 17:57:03.905+00	2026-10-10 17:57:03.905+00
25	1	2	Pose carrelage sol — salle de bain	m2	53.01	\N	t	2026-10-10 17:57:03.923+00	2026-10-10 17:57:03.923+00
26	1	2	Pose carrelage sol — cuisine	m2	48.64	\N	f	2026-10-10 17:57:03.931+00	2026-10-10 17:57:03.931+00
27	1	2	Pose carrelage sol — premium	m2	65.08	\N	t	2026-10-10 17:57:03.955+00	2026-10-10 17:57:03.955+00
28	1	2	Pose faïence murale — standard	m2	48.22	\N	t	2026-10-10 17:57:03.963+00	2026-10-10 17:57:03.963+00
29	1	2	Pose faïence murale — salle de bain	m2	56.20	\N	t	2026-10-10 17:57:03.981+00	2026-10-10 17:57:03.981+00
30	1	2	Pose faïence murale — cuisine	m2	56.94	\N	t	2026-10-10 17:57:03.99+00	2026-10-10 17:57:03.99+00
31	1	2	Pose faïence murale — premium	m2	76.82	\N	t	2026-10-10 17:57:04.001+00	2026-10-10 17:57:04.001+00
32	1	2	Plinthes carrelées — standard	ml	15.63	\N	t	2026-10-10 17:57:04.01+00	2026-10-10 17:57:04.01+00
33	1	2	Plinthes carrelées — salle de bain	ml	17.62	\N	t	2026-10-10 17:57:04.028+00	2026-10-10 17:57:04.028+00
34	1	2	Plinthes carrelées — cuisine	ml	16.92	\N	t	2026-10-10 17:57:04.035+00	2026-10-10 17:57:04.035+00
35	1	2	Plinthes carrelées — premium	ml	22.19	\N	t	2026-10-10 17:57:04.052+00	2026-10-10 17:57:04.052+00
36	1	2	Joints époxy — standard	m2	11.85	\N	t	2026-10-10 17:57:04.069+00	2026-10-10 17:57:04.069+00
37	1	2	Joints époxy — salle de bain	m2	12.71	\N	f	2026-10-10 17:57:04.083+00	2026-10-10 17:57:04.083+00
38	1	2	Joints époxy — cuisine	m2	11.77	\N	t	2026-10-10 17:57:04.096+00	2026-10-10 17:57:04.096+00
39	1	2	Joints époxy — premium	m2	16.03	\N	t	2026-10-10 17:57:04.124+00	2026-10-10 17:57:04.124+00
40	1	2	Main-d’œuvre carreleur — standard	h	43.30	6.00	t	2026-10-10 17:57:04.133+00	2026-10-10 17:57:04.133+00
41	1	2	Main-d’œuvre carreleur — salle de bain	h	56.53	6.00	t	2026-10-10 17:57:04.142+00	2026-10-10 17:57:04.142+00
42	1	2	Main-d’œuvre carreleur — cuisine	h	53.74	6.00	t	2026-10-10 17:57:04.156+00	2026-10-10 17:57:04.156+00
43	1	2	Main-d’œuvre carreleur — premium	h	66.98	6.00	t	2026-10-10 17:57:04.166+00	2026-10-10 17:57:04.166+00
44	1	3	Pose WC suspendu — standard	piece	396.60	\N	t	2026-10-10 17:57:04.173+00	2026-10-10 17:57:04.173+00
45	1	3	Pose WC suspendu — salle de bain	piece	506.74	\N	t	2026-10-10 17:57:04.195+00	2026-10-10 17:57:04.195+00
46	1	3	Pose WC suspendu — cuisine	piece	433.87	\N	t	2026-10-10 17:57:04.202+00	2026-10-10 17:57:04.202+00
47	1	3	Pose WC suspendu — premium	piece	525.83	\N	t	2026-10-10 17:57:04.21+00	2026-10-10 17:57:04.21+00
48	1	3	Pose lavabo — standard	piece	269.73	\N	t	2026-10-10 17:57:04.219+00	2026-10-10 17:57:04.219+00
49	1	3	Pose lavabo — salle de bain	piece	306.92	\N	t	2026-10-10 17:57:04.225+00	2026-10-10 17:57:04.225+00
50	1	3	Pose lavabo — cuisine	piece	259.35	\N	t	2026-10-10 17:57:04.246+00	2026-10-10 17:57:04.246+00
51	1	3	Pose lavabo — premium	piece	350.37	\N	t	2026-10-10 17:57:04.256+00	2026-10-10 17:57:04.256+00
52	1	3	Tuyauterie multicouche — standard	ml	27.39	\N	t	2026-10-10 17:57:04.275+00	2026-10-10 17:57:04.275+00
53	1	3	Tuyauterie multicouche — salle de bain	ml	29.72	\N	t	2026-10-10 17:57:04.28+00	2026-10-10 17:57:04.28+00
54	1	3	Tuyauterie multicouche — cuisine	ml	31.79	\N	t	2026-10-10 17:57:04.286+00	2026-10-10 17:57:04.286+00
55	1	3	Tuyauterie multicouche — premium	ml	38.60	\N	t	2026-10-10 17:57:04.298+00	2026-10-10 17:57:04.298+00
56	1	3	Remplacement chauffe-eau — standard	piece	711.99	\N	t	2026-10-10 17:57:04.304+00	2026-10-10 17:57:04.304+00
57	1	3	Remplacement chauffe-eau — salle de bain	piece	821.27	\N	t	2026-10-10 17:57:04.317+00	2026-10-10 17:57:04.317+00
58	1	3	Remplacement chauffe-eau — cuisine	piece	765.04	\N	t	2026-10-10 17:57:04.323+00	2026-10-10 17:57:04.323+00
59	1	3	Remplacement chauffe-eau — premium	piece	926.18	\N	t	2026-10-10 17:57:04.333+00	2026-10-10 17:57:04.333+00
60	1	3	Main-d’œuvre plombier — standard	h	56.85	6.00	t	2026-10-10 17:57:04.346+00	2026-10-10 17:57:04.346+00
61	1	3	Main-d’œuvre plombier — salle de bain	h	64.53	6.00	t	2026-10-10 17:57:04.352+00	2026-10-10 17:57:04.352+00
62	1	3	Main-d’œuvre plombier — cuisine	h	55.86	6.00	t	2026-10-10 17:57:04.358+00	2026-10-10 17:57:04.358+00
63	1	3	Main-d’œuvre plombier — premium	h	79.19	6.00	f	2026-10-10 17:57:04.364+00	2026-10-10 17:57:04.364+00
64	1	4	Point lumineux — standard	piece	77.88	\N	t	2026-10-10 17:57:04.371+00	2026-10-10 17:57:04.371+00
65	1	4	Point lumineux — salle de bain	piece	102.49	\N	t	2026-10-10 17:57:04.39+00	2026-10-10 17:57:04.39+00
66	1	4	Point lumineux — cuisine	piece	85.50	\N	t	2026-10-10 17:57:04.403+00	2026-10-10 17:57:04.403+00
67	1	4	Point lumineux — premium	piece	118.71	\N	t	2026-10-10 17:57:04.412+00	2026-10-10 17:57:04.412+00
68	1	4	Prise de courant — standard	piece	71.48	\N	t	2026-10-10 17:57:04.425+00	2026-10-10 17:57:04.425+00
69	1	4	Prise de courant — salle de bain	piece	70.97	\N	t	2026-10-10 17:57:04.438+00	2026-10-10 17:57:04.438+00
70	1	4	Prise de courant — cuisine	piece	65.01	\N	t	2026-10-10 17:57:04.452+00	2026-10-10 17:57:04.452+00
71	1	4	Prise de courant — premium	piece	91.57	\N	t	2026-10-10 17:57:04.458+00	2026-10-10 17:57:04.458+00
72	1	4	Câblage encastré — standard	ml	17.74	\N	t	2026-10-10 17:57:04.464+00	2026-10-10 17:57:04.464+00
73	1	4	Câblage encastré — salle de bain	ml	20.18	\N	t	2026-10-10 17:57:04.477+00	2026-10-10 17:57:04.477+00
74	1	4	Câblage encastré — cuisine	ml	21.90	\N	t	2026-10-10 17:57:04.483+00	2026-10-10 17:57:04.483+00
75	1	4	Câblage encastré — premium	ml	24.57	\N	t	2026-10-10 17:57:04.499+00	2026-10-10 17:57:04.499+00
76	1	4	Tableau électrique — standard	piece	978.21	\N	t	2026-10-10 17:57:04.519+00	2026-10-10 17:57:04.519+00
77	1	4	Tableau électrique — salle de bain	piece	1129.10	\N	t	2026-10-10 17:57:04.525+00	2026-10-10 17:57:04.525+00
78	1	4	Tableau électrique — cuisine	piece	1067.35	\N	t	2026-10-10 17:57:04.54+00	2026-10-10 17:57:04.54+00
79	1	4	Tableau électrique — premium	piece	1230.11	\N	t	2026-10-10 17:57:04.567+00	2026-10-10 17:57:04.567+00
80	1	4	Main-d’œuvre électricien — standard	h	51.83	6.00	t	2026-10-10 17:57:04.574+00	2026-10-10 17:57:04.574+00
81	1	4	Main-d’œuvre électricien — salle de bain	h	63.21	6.00	t	2026-10-10 17:57:04.58+00	2026-10-10 17:57:04.58+00
82	1	4	Main-d’œuvre électricien — cuisine	h	59.53	6.00	t	2026-10-10 17:57:04.585+00	2026-10-10 17:57:04.585+00
83	1	4	Main-d’œuvre électricien — premium	h	71.87	6.00	t	2026-10-10 17:57:04.591+00	2026-10-10 17:57:04.591+00
84	1	5	Mur en blocs — standard	m2	73.35	\N	t	2026-10-10 17:57:04.596+00	2026-10-10 17:57:04.596+00
85	1	5	Mur en blocs — salle de bain	m2	93.15	\N	t	2026-10-10 17:57:04.616+00	2026-10-10 17:57:04.616+00
86	1	5	Mur en blocs — cuisine	m2	88.68	\N	t	2026-10-10 17:57:04.625+00	2026-10-10 17:57:04.625+00
87	1	5	Mur en blocs — premium	m2	107.70	\N	t	2026-10-10 17:57:04.65+00	2026-10-10 17:57:04.65+00
88	1	5	Chape ciment — standard	m2	29.91	\N	t	2026-10-10 17:57:04.661+00	2026-10-10 17:57:04.661+00
89	1	5	Chape ciment — salle de bain	m2	34.85	\N	t	2026-10-10 17:57:04.67+00	2026-10-10 17:57:04.67+00
90	1	5	Chape ciment — cuisine	m2	38.47	\N	t	2026-10-10 17:57:04.691+00	2026-10-10 17:57:04.691+00
91	1	5	Chape ciment — premium	m2	46.40	\N	t	2026-10-10 17:57:04.7+00	2026-10-10 17:57:04.7+00
92	1	5	Ouverture de baie — standard	piece	1558.63	\N	t	2026-10-10 17:57:04.707+00	2026-10-10 17:57:04.707+00
93	1	5	Ouverture de baie — salle de bain	piece	1811.68	\N	f	2026-10-10 17:57:04.715+00	2026-10-10 17:57:04.715+00
94	1	5	Ouverture de baie — cuisine	piece	1610.65	\N	t	2026-10-10 17:57:04.733+00	2026-10-10 17:57:04.733+00
95	1	5	Ouverture de baie — premium	piece	1788.51	\N	t	2026-10-10 17:57:04.751+00	2026-10-10 17:57:04.751+00
96	1	5	Rejointoyage façade — standard	m2	39.52	\N	t	2026-10-10 17:57:04.776+00	2026-10-10 17:57:04.776+00
97	1	5	Rejointoyage façade — salle de bain	m2	42.04	\N	f	2026-10-10 17:57:04.791+00	2026-10-10 17:57:04.791+00
98	1	5	Rejointoyage façade — cuisine	m2	38.74	\N	t	2026-10-10 17:57:04.803+00	2026-10-10 17:57:04.803+00
99	1	5	Rejointoyage façade — premium	m2	50.60	\N	t	2026-10-10 17:57:04.814+00	2026-10-10 17:57:04.814+00
100	1	5	Main-d’œuvre maçon — standard	h	45.60	6.00	t	2026-10-10 17:57:04.825+00	2026-10-10 17:57:04.825+00
101	1	5	Main-d’œuvre maçon — salle de bain	h	55.38	6.00	t	2026-10-10 17:57:04.83+00	2026-10-10 17:57:04.83+00
102	1	5	Main-d’œuvre maçon — cuisine	h	60.06	6.00	t	2026-10-10 17:57:04.837+00	2026-10-10 17:57:04.837+00
103	1	5	Main-d’œuvre maçon — premium	h	72.48	6.00	t	2026-10-10 17:57:04.845+00	2026-10-10 17:57:04.845+00
104	1	6	Pose porte intérieure — standard	piece	324.26	\N	t	2026-10-10 17:57:04.854+00	2026-10-10 17:57:04.854+00
105	1	6	Pose porte intérieure — salle de bain	piece	400.58	\N	t	2026-10-10 17:57:04.859+00	2026-10-10 17:57:04.859+00
106	1	6	Pose porte intérieure — cuisine	piece	317.11	\N	t	2026-10-10 17:57:04.865+00	2026-10-10 17:57:04.865+00
107	1	6	Pose porte intérieure — premium	piece	419.32	\N	f	2026-10-10 17:57:04.871+00	2026-10-10 17:57:04.871+00
108	1	6	Pose châssis — standard	piece	721.61	\N	t	2026-10-10 17:57:04.879+00	2026-10-10 17:57:04.879+00
109	1	6	Pose châssis — salle de bain	piece	877.34	\N	t	2026-10-10 17:57:04.884+00	2026-10-10 17:57:04.884+00
110	1	6	Pose châssis — cuisine	piece	913.55	\N	t	2026-10-10 17:57:04.913+00	2026-10-10 17:57:04.913+00
111	1	6	Pose châssis — premium	piece	1119.10	\N	t	2026-10-10 17:57:04.931+00	2026-10-10 17:57:04.931+00
112	1	6	Habillage escalier — standard	piece	2036.47	\N	t	2026-10-10 17:57:04.942+00	2026-10-10 17:57:04.942+00
113	1	6	Habillage escalier — salle de bain	piece	2191.82	\N	t	2026-10-10 17:57:04.955+00	2026-10-10 17:57:04.955+00
114	1	6	Habillage escalier — cuisine	piece	1998.79	\N	t	2026-10-10 17:57:04.981+00	2026-10-10 17:57:04.981+00
115	1	6	Habillage escalier — premium	piece	2714.92	\N	t	2026-10-10 17:57:04.99+00	2026-10-10 17:57:04.99+00
116	1	6	Placard sur mesure — standard	ml	439.03	\N	t	2026-10-10 17:57:05.008+00	2026-10-10 17:57:05.008+00
117	1	6	Placard sur mesure — salle de bain	ml	485.74	\N	t	2026-10-10 17:57:05.017+00	2026-10-10 17:57:05.017+00
118	1	6	Placard sur mesure — cuisine	ml	444.24	\N	t	2026-10-10 17:57:05.025+00	2026-10-10 17:57:05.025+00
119	1	6	Placard sur mesure — premium	ml	590.67	\N	t	2026-10-10 17:57:05.04+00	2026-10-10 17:57:05.04+00
120	1	6	Main-d’œuvre menuisier — standard	h	54.86	6.00	t	2026-10-10 17:57:05.046+00	2026-10-10 17:57:05.046+00
121	1	6	Main-d’œuvre menuisier — salle de bain	h	64.66	6.00	f	2026-10-10 17:57:05.054+00	2026-10-10 17:57:05.054+00
122	1	6	Main-d’œuvre menuisier — cuisine	h	52.96	6.00	t	2026-10-10 17:57:05.062+00	2026-10-10 17:57:05.062+00
123	1	6	Main-d’œuvre menuisier — premium	h	70.66	6.00	f	2026-10-10 17:57:05.075+00	2026-10-10 17:57:05.075+00
124	1	7	Couverture tuiles — standard	m2	98.84	\N	t	2026-10-10 17:57:05.086+00	2026-10-10 17:57:05.086+00
125	1	7	Couverture tuiles — salle de bain	m2	116.27	\N	t	2026-10-10 17:57:05.108+00	2026-10-10 17:57:05.108+00
126	1	7	Couverture tuiles — cuisine	m2	107.10	\N	t	2026-10-10 17:57:05.128+00	2026-10-10 17:57:05.128+00
127	1	7	Couverture tuiles — premium	m2	126.30	\N	t	2026-10-10 17:57:05.134+00	2026-10-10 17:57:05.134+00
128	1	7	Membrane EPDM — standard	m2	71.47	\N	f	2026-10-10 17:57:05.143+00	2026-10-10 17:57:05.143+00
129	1	7	Membrane EPDM — salle de bain	m2	77.97	\N	t	2026-10-10 17:57:05.171+00	2026-10-10 17:57:05.171+00
130	1	7	Membrane EPDM — cuisine	m2	76.10	\N	t	2026-10-10 17:57:05.184+00	2026-10-10 17:57:05.184+00
131	1	7	Membrane EPDM — premium	m2	84.78	\N	t	2026-10-10 17:57:05.198+00	2026-10-10 17:57:05.198+00
132	1	7	Gouttière zinc — standard	ml	56.58	\N	t	2026-10-10 17:57:05.205+00	2026-10-10 17:57:05.205+00
133	1	7	Gouttière zinc — salle de bain	ml	61.42	\N	f	2026-10-10 17:57:05.21+00	2026-10-10 17:57:05.21+00
134	1	7	Gouttière zinc — cuisine	ml	55.92	\N	t	2026-10-10 17:57:05.216+00	2026-10-10 17:57:05.216+00
135	1	7	Gouttière zinc — premium	ml	74.44	\N	t	2026-10-10 17:57:05.223+00	2026-10-10 17:57:05.223+00
136	1	7	Velux — standard	piece	1166.92	\N	t	2026-10-10 17:57:05.228+00	2026-10-10 17:57:05.228+00
137	1	7	Velux — salle de bain	piece	1426.47	\N	t	2026-10-10 17:57:05.233+00	2026-10-10 17:57:05.233+00
138	1	7	Velux — cuisine	piece	1339.74	\N	t	2026-10-10 17:57:05.24+00	2026-10-10 17:57:05.24+00
139	1	7	Velux — premium	piece	1530.66	\N	t	2026-10-10 17:57:05.252+00	2026-10-10 17:57:05.252+00
140	1	7	Main-d’œuvre couvreur — standard	h	59.51	6.00	t	2026-10-10 17:57:05.263+00	2026-10-10 17:57:05.263+00
141	1	7	Main-d’œuvre couvreur — salle de bain	h	70.98	6.00	t	2026-10-10 17:57:05.269+00	2026-10-10 17:57:05.269+00
142	1	7	Main-d’œuvre couvreur — cuisine	h	64.50	6.00	t	2026-10-10 17:57:05.275+00	2026-10-10 17:57:05.275+00
143	1	7	Main-d’œuvre couvreur — premium	h	83.98	6.00	t	2026-10-10 17:57:05.282+00	2026-10-10 17:57:05.282+00
144	1	8	Isolation laine de verre — standard	m2	24.50	\N	t	2026-10-10 17:57:05.287+00	2026-10-10 17:57:05.287+00
145	1	8	Isolation laine de verre — salle de bain	m2	27.41	\N	f	2026-10-10 17:57:05.298+00	2026-10-10 17:57:05.298+00
146	1	8	Isolation laine de verre — cuisine	m2	26.24	\N	t	2026-10-10 17:57:05.31+00	2026-10-10 17:57:05.31+00
147	1	8	Isolation laine de verre — premium	m2	32.38	\N	f	2026-10-10 17:57:05.316+00	2026-10-10 17:57:05.316+00
148	1	8	Isolation PIR toiture — standard	m2	44.54	\N	t	2026-10-10 17:57:05.327+00	2026-10-10 17:57:05.327+00
149	1	8	Isolation PIR toiture — salle de bain	m2	52.53	\N	t	2026-10-10 17:57:05.338+00	2026-10-10 17:57:05.338+00
150	1	8	Isolation PIR toiture — cuisine	m2	45.12	\N	f	2026-10-10 17:57:05.35+00	2026-10-10 17:57:05.35+00
151	1	8	Isolation PIR toiture — premium	m2	56.69	\N	t	2026-10-10 17:57:05.355+00	2026-10-10 17:57:05.355+00
152	1	8	Isolation façade ETICS — standard	m2	115.74	\N	t	2026-10-10 17:57:05.367+00	2026-10-10 17:57:05.367+00
153	1	8	Isolation façade ETICS — salle de bain	m2	140.14	\N	t	2026-10-10 17:57:05.373+00	2026-10-10 17:57:05.373+00
154	1	8	Isolation façade ETICS — cuisine	m2	127.62	\N	t	2026-10-10 17:57:05.379+00	2026-10-10 17:57:05.379+00
155	1	8	Isolation façade ETICS — premium	m2	147.98	\N	t	2026-10-10 17:57:05.391+00	2026-10-10 17:57:05.391+00
156	1	8	Pare-vapeur — standard	m2	8.63	\N	t	2026-10-10 17:57:05.397+00	2026-10-10 17:57:05.397+00
157	1	8	Pare-vapeur — salle de bain	m2	9.88	\N	t	2026-10-10 17:57:05.412+00	2026-10-10 17:57:05.412+00
158	1	8	Pare-vapeur — cuisine	m2	10.64	\N	t	2026-10-10 17:57:05.441+00	2026-10-10 17:57:05.441+00
159	1	8	Pare-vapeur — premium	m2	11.51	\N	t	2026-10-10 17:57:05.455+00	2026-10-10 17:57:05.455+00
160	1	8	Main-d’œuvre isolation — standard	h	49.63	6.00	t	2026-10-10 17:57:05.478+00	2026-10-10 17:57:05.478+00
161	1	8	Main-d’œuvre isolation — salle de bain	h	52.12	6.00	t	2026-10-10 17:57:05.482+00	2026-10-10 17:57:05.482+00
162	1	8	Main-d’œuvre isolation — cuisine	h	51.45	6.00	t	2026-10-10 17:57:05.487+00	2026-10-10 17:57:05.487+00
163	1	8	Main-d’œuvre isolation — premium	h	66.92	6.00	t	2026-10-10 17:57:05.493+00	2026-10-10 17:57:05.493+00
164	1	9	Parquet contrecollé — standard	m2	59.87	\N	t	2026-10-10 17:57:05.498+00	2026-10-10 17:57:05.498+00
165	1	9	Parquet contrecollé — salle de bain	m2	73.57	\N	t	2026-10-10 17:57:05.505+00	2026-10-10 17:57:05.505+00
166	1	9	Parquet contrecollé — cuisine	m2	69.14	\N	t	2026-10-10 17:57:05.521+00	2026-10-10 17:57:05.521+00
167	1	9	Parquet contrecollé — premium	m2	75.86	\N	t	2026-10-10 17:57:05.528+00	2026-10-10 17:57:05.528+00
168	1	9	Sol vinyle clipsable — standard	m2	35.02	\N	t	2026-10-10 17:57:05.543+00	2026-10-10 17:57:05.543+00
169	1	9	Sol vinyle clipsable — salle de bain	m2	40.93	\N	t	2026-10-10 17:57:05.581+00	2026-10-10 17:57:05.581+00
170	1	9	Sol vinyle clipsable — cuisine	m2	38.97	\N	t	2026-10-10 17:57:05.594+00	2026-10-10 17:57:05.594+00
171	1	9	Sol vinyle clipsable — premium	m2	48.41	\N	t	2026-10-10 17:57:05.606+00	2026-10-10 17:57:05.606+00
172	1	9	Ragréage — standard	m2	16.27	\N	t	2026-10-10 17:57:05.612+00	2026-10-10 17:57:05.612+00
173	1	9	Ragréage — salle de bain	m2	16.46	\N	t	2026-10-10 17:57:05.627+00	2026-10-10 17:57:05.627+00
174	1	9	Ragréage — cuisine	m2	15.82	\N	t	2026-10-10 17:57:05.633+00	2026-10-10 17:57:05.633+00
175	1	9	Ragréage — premium	m2	19.98	\N	t	2026-10-10 17:57:05.641+00	2026-10-10 17:57:05.641+00
176	1	9	Plinthes bois — standard	ml	13.12	\N	t	2026-10-10 17:57:05.657+00	2026-10-10 17:57:05.657+00
177	1	9	Plinthes bois — salle de bain	ml	13.44	\N	t	2026-10-10 17:57:05.669+00	2026-10-10 17:57:05.669+00
178	1	9	Plinthes bois — cuisine	ml	13.61	\N	t	2026-10-10 17:57:05.676+00	2026-10-10 17:57:05.676+00
179	1	9	Plinthes bois — premium	ml	17.80	\N	t	2026-10-10 17:57:05.681+00	2026-10-10 17:57:05.681+00
180	1	9	Main-d’œuvre poseur de sol — standard	h	46.98	6.00	t	2026-10-10 17:57:05.688+00	2026-10-10 17:57:05.688+00
181	1	9	Main-d’œuvre poseur de sol — salle de bain	h	55.32	6.00	t	2026-10-10 17:57:05.694+00	2026-10-10 17:57:05.694+00
182	1	9	Main-d’œuvre poseur de sol — cuisine	h	52.13	6.00	t	2026-10-10 17:57:05.7+00	2026-10-10 17:57:05.7+00
183	1	9	Main-d’œuvre poseur de sol — premium	h	60.46	6.00	t	2026-10-10 17:57:05.706+00	2026-10-10 17:57:05.706+00
184	1	10	Démolition cloison — standard	m2	21.65	\N	t	2026-10-10 17:57:05.711+00	2026-10-10 17:57:05.711+00
185	1	10	Démolition cloison — salle de bain	m2	28.69	\N	t	2026-10-10 17:57:05.717+00	2026-10-10 17:57:05.717+00
186	1	10	Démolition cloison — cuisine	m2	25.59	\N	t	2026-10-10 17:57:05.729+00	2026-10-10 17:57:05.729+00
187	1	10	Démolition cloison — premium	m2	35.14	\N	t	2026-10-10 17:57:05.736+00	2026-10-10 17:57:05.736+00
188	1	10	Dépose carrelage — standard	m2	17.50	\N	t	2026-10-10 17:57:05.745+00	2026-10-10 17:57:05.745+00
189	1	10	Dépose carrelage — salle de bain	m2	22.80	\N	t	2026-10-10 17:57:05.757+00	2026-10-10 17:57:05.757+00
190	1	10	Dépose carrelage — cuisine	m2	22.28	\N	t	2026-10-10 17:57:05.771+00	2026-10-10 17:57:05.771+00
191	1	10	Dépose carrelage — premium	m2	26.58	\N	t	2026-10-10 17:57:05.776+00	2026-10-10 17:57:05.776+00
192	1	10	Évacuation gravats — standard	piece	284.10	\N	t	2026-10-10 17:57:05.781+00	2026-10-10 17:57:05.781+00
193	1	10	Évacuation gravats — salle de bain	piece	327.40	\N	t	2026-10-10 17:57:05.786+00	2026-10-10 17:57:05.786+00
194	1	10	Évacuation gravats — cuisine	piece	338.32	\N	t	2026-10-10 17:57:05.792+00	2026-10-10 17:57:05.792+00
195	1	10	Évacuation gravats — premium	piece	413.48	\N	t	2026-10-10 17:57:05.798+00	2026-10-10 17:57:05.798+00
196	1	10	Décapage sol — standard	m2	14.18	\N	t	2026-10-10 17:57:05.803+00	2026-10-10 17:57:05.803+00
197	1	10	Décapage sol — salle de bain	m2	14.59	\N	t	2026-10-10 17:57:05.814+00	2026-10-10 17:57:05.814+00
198	1	10	Décapage sol — cuisine	m2	13.49	\N	t	2026-10-10 17:57:05.826+00	2026-10-10 17:57:05.826+00
199	1	10	Décapage sol — premium	m2	18.27	\N	t	2026-10-10 17:57:05.837+00	2026-10-10 17:57:05.837+00
200	1	10	Main-d’œuvre démolition — standard	h	42.48	6.00	t	2026-10-10 17:57:05.848+00	2026-10-10 17:57:05.848+00
201	1	10	Main-d’œuvre démolition — salle de bain	h	41.99	6.00	t	2026-10-10 17:57:05.857+00	2026-10-10 17:57:05.857+00
202	1	10	Main-d’œuvre démolition — cuisine	h	45.25	6.00	t	2026-10-10 17:57:05.862+00	2026-10-10 17:57:05.862+00
203	1	10	Main-d’œuvre démolition — premium	h	50.58	6.00	t	2026-10-10 17:57:05.868+00	2026-10-10 17:57:05.868+00
204	2	1	Peinture murale 2 couches — standard	m2	19.34	\N	t	2026-10-10 17:57:05.879+00	2026-10-10 17:57:05.879+00
205	2	1	Peinture murale 2 couches — salle de bain	m2	19.15	\N	t	2026-10-10 17:57:05.891+00	2026-10-10 17:57:05.891+00
206	2	1	Peinture murale 2 couches — cuisine	m2	19.17	\N	t	2026-10-10 17:57:05.908+00	2026-10-10 17:57:05.908+00
207	2	1	Peinture murale 2 couches — premium	m2	22.85	\N	t	2026-10-10 17:57:05.918+00	2026-10-10 17:57:05.918+00
208	2	1	Peinture plafond — standard	m2	22.90	\N	t	2026-10-10 17:57:05.926+00	2026-10-10 17:57:05.926+00
209	2	1	Peinture plafond — salle de bain	m2	24.69	\N	t	2026-10-10 17:57:05.932+00	2026-10-10 17:57:05.932+00
210	2	1	Peinture plafond — cuisine	m2	24.30	\N	t	2026-10-10 17:57:05.955+00	2026-10-10 17:57:05.955+00
211	2	1	Peinture plafond — premium	m2	28.52	\N	t	2026-10-10 17:57:05.981+00	2026-10-10 17:57:05.981+00
212	2	1	Laquage boiseries — standard	ml	13.04	\N	t	2026-10-10 17:57:05.989+00	2026-10-10 17:57:05.989+00
213	2	1	Laquage boiseries — salle de bain	ml	15.53	\N	t	2026-10-10 17:57:05.996+00	2026-10-10 17:57:05.996+00
214	2	1	Laquage boiseries — cuisine	ml	14.63	\N	t	2026-10-10 17:57:06.006+00	2026-10-10 17:57:06.006+00
215	2	1	Laquage boiseries — premium	ml	19.47	\N	t	2026-10-10 17:57:06.022+00	2026-10-10 17:57:06.022+00
216	2	1	Enduit de lissage — standard	m2	10.80	\N	t	2026-10-10 17:57:06.031+00	2026-10-10 17:57:06.031+00
217	2	1	Enduit de lissage — salle de bain	m2	14.30	\N	t	2026-10-10 17:57:06.044+00	2026-10-10 17:57:06.044+00
218	2	1	Enduit de lissage — cuisine	m2	14.51	\N	t	2026-10-10 17:57:06.051+00	2026-10-10 17:57:06.051+00
219	2	1	Enduit de lissage — premium	m2	15.18	\N	t	2026-10-10 17:57:06.056+00	2026-10-10 17:57:06.056+00
220	2	1	Main-d’œuvre peintre — standard	h	48.39	6.00	t	2026-10-10 17:57:06.067+00	2026-10-10 17:57:06.067+00
221	2	1	Main-d’œuvre peintre — salle de bain	h	50.41	6.00	t	2026-10-10 17:57:06.079+00	2026-10-10 17:57:06.079+00
222	2	1	Main-d’œuvre peintre — cuisine	h	47.34	6.00	t	2026-10-10 17:57:06.084+00	2026-10-10 17:57:06.084+00
223	2	1	Main-d’œuvre peintre — premium	h	55.83	6.00	t	2026-10-10 17:57:06.091+00	2026-10-10 17:57:06.091+00
224	2	2	Pose carrelage sol — standard	m2	48.09	\N	t	2026-10-10 17:57:06.111+00	2026-10-10 17:57:06.111+00
225	2	2	Pose carrelage sol — salle de bain	m2	60.33	\N	f	2026-10-10 17:57:06.128+00	2026-10-10 17:57:06.128+00
226	2	2	Pose carrelage sol — cuisine	m2	52.53	\N	t	2026-10-10 17:57:06.141+00	2026-10-10 17:57:06.141+00
227	2	2	Pose carrelage sol — premium	m2	61.64	\N	t	2026-10-10 17:57:06.149+00	2026-10-10 17:57:06.149+00
228	2	2	Pose faïence murale — standard	m2	51.65	\N	f	2026-10-10 17:57:06.156+00	2026-10-10 17:57:06.156+00
229	2	2	Pose faïence murale — salle de bain	m2	57.99	\N	t	2026-10-10 17:57:06.166+00	2026-10-10 17:57:06.166+00
230	2	2	Pose faïence murale — cuisine	m2	55.87	\N	t	2026-10-10 17:57:06.177+00	2026-10-10 17:57:06.177+00
231	2	2	Pose faïence murale — premium	m2	67.82	\N	t	2026-10-10 17:57:06.199+00	2026-10-10 17:57:06.199+00
232	2	2	Plinthes carrelées — standard	ml	17.03	\N	t	2026-10-10 17:57:06.208+00	2026-10-10 17:57:06.208+00
233	2	2	Plinthes carrelées — salle de bain	ml	18.55	\N	t	2026-10-10 17:57:06.224+00	2026-10-10 17:57:06.224+00
234	2	2	Plinthes carrelées — cuisine	ml	18.84	\N	t	2026-10-10 17:57:06.237+00	2026-10-10 17:57:06.237+00
235	2	2	Plinthes carrelées — premium	ml	20.50	\N	t	2026-10-10 17:57:06.242+00	2026-10-10 17:57:06.242+00
236	2	2	Joints époxy — standard	m2	10.38	\N	t	2026-10-10 17:57:06.247+00	2026-10-10 17:57:06.247+00
237	2	2	Joints époxy — salle de bain	m2	13.49	\N	f	2026-10-10 17:57:06.26+00	2026-10-10 17:57:06.26+00
238	2	2	Joints époxy — cuisine	m2	12.97	\N	t	2026-10-10 17:57:06.273+00	2026-10-10 17:57:06.273+00
239	2	2	Joints époxy — premium	m2	15.28	\N	t	2026-10-10 17:57:06.278+00	2026-10-10 17:57:06.278+00
240	2	2	Main-d’œuvre carreleur — standard	h	50.21	6.00	t	2026-10-10 17:57:06.284+00	2026-10-10 17:57:06.284+00
241	2	2	Main-d’œuvre carreleur — salle de bain	h	51.55	6.00	t	2026-10-10 17:57:06.291+00	2026-10-10 17:57:06.291+00
242	2	2	Main-d’œuvre carreleur — cuisine	h	54.89	6.00	t	2026-10-10 17:57:06.296+00	2026-10-10 17:57:06.296+00
243	2	2	Main-d’œuvre carreleur — premium	h	66.61	6.00	t	2026-10-10 17:57:06.303+00	2026-10-10 17:57:06.303+00
244	2	3	Pose WC suspendu — standard	piece	391.79	\N	t	2026-10-10 17:57:06.309+00	2026-10-10 17:57:06.309+00
245	2	3	Pose WC suspendu — salle de bain	piece	504.97	\N	t	2026-10-10 17:57:06.337+00	2026-10-10 17:57:06.337+00
246	2	3	Pose WC suspendu — cuisine	piece	438.08	\N	t	2026-10-10 17:57:06.348+00	2026-10-10 17:57:06.348+00
247	2	3	Pose WC suspendu — premium	piece	606.01	\N	t	2026-10-10 17:57:06.363+00	2026-10-10 17:57:06.363+00
248	2	3	Pose lavabo — standard	piece	244.23	\N	t	2026-10-10 17:57:06.373+00	2026-10-10 17:57:06.373+00
249	2	3	Pose lavabo — salle de bain	piece	282.06	\N	t	2026-10-10 17:57:06.395+00	2026-10-10 17:57:06.395+00
250	2	3	Pose lavabo — cuisine	piece	305.37	\N	t	2026-10-10 17:57:06.401+00	2026-10-10 17:57:06.401+00
251	2	3	Pose lavabo — premium	piece	379.44	\N	t	2026-10-10 17:57:06.415+00	2026-10-10 17:57:06.415+00
252	2	3	Tuyauterie multicouche — standard	ml	26.34	\N	t	2026-10-10 17:57:06.443+00	2026-10-10 17:57:06.443+00
253	2	3	Tuyauterie multicouche — salle de bain	ml	29.69	\N	t	2026-10-10 17:57:06.451+00	2026-10-10 17:57:06.451+00
254	2	3	Tuyauterie multicouche — cuisine	ml	30.85	\N	t	2026-10-10 17:57:06.489+00	2026-10-10 17:57:06.489+00
255	2	3	Tuyauterie multicouche — premium	ml	38.58	\N	t	2026-10-10 17:57:06.494+00	2026-10-10 17:57:06.494+00
256	2	3	Remplacement chauffe-eau — standard	piece	707.30	\N	t	2026-10-10 17:57:06.5+00	2026-10-10 17:57:06.5+00
257	2	3	Remplacement chauffe-eau — salle de bain	piece	761.19	\N	t	2026-10-10 17:57:06.51+00	2026-10-10 17:57:06.51+00
258	2	3	Remplacement chauffe-eau — cuisine	piece	788.87	\N	t	2026-10-10 17:57:06.517+00	2026-10-10 17:57:06.517+00
259	2	3	Remplacement chauffe-eau — premium	piece	849.64	\N	t	2026-10-10 17:57:06.522+00	2026-10-10 17:57:06.522+00
260	2	3	Main-d’œuvre plombier — standard	h	58.64	6.00	t	2026-10-10 17:57:06.538+00	2026-10-10 17:57:06.538+00
261	2	3	Main-d’œuvre plombier — salle de bain	h	68.52	6.00	t	2026-10-10 17:57:06.545+00	2026-10-10 17:57:06.545+00
262	2	3	Main-d’œuvre plombier — cuisine	h	54.63	6.00	t	2026-10-10 17:57:06.551+00	2026-10-10 17:57:06.551+00
263	2	3	Main-d’œuvre plombier — premium	h	68.78	6.00	t	2026-10-10 17:57:06.557+00	2026-10-10 17:57:06.557+00
264	2	4	Point lumineux — standard	piece	81.14	\N	t	2026-10-10 17:57:06.562+00	2026-10-10 17:57:06.562+00
265	2	4	Point lumineux — salle de bain	piece	100.71	\N	t	2026-10-10 17:57:06.574+00	2026-10-10 17:57:06.574+00
266	2	4	Point lumineux — cuisine	piece	98.56	\N	t	2026-10-10 17:57:06.585+00	2026-10-10 17:57:06.585+00
267	2	4	Point lumineux — premium	piece	105.17	\N	f	2026-10-10 17:57:06.591+00	2026-10-10 17:57:06.591+00
268	2	4	Prise de courant — standard	piece	68.79	\N	t	2026-10-10 17:57:06.596+00	2026-10-10 17:57:06.596+00
269	2	4	Prise de courant — salle de bain	piece	68.88	\N	t	2026-10-10 17:57:06.608+00	2026-10-10 17:57:06.608+00
270	2	4	Prise de courant — cuisine	piece	75.32	\N	f	2026-10-10 17:57:06.62+00	2026-10-10 17:57:06.62+00
271	2	4	Prise de courant — premium	piece	94.14	\N	t	2026-10-10 17:57:06.657+00	2026-10-10 17:57:06.657+00
272	2	4	Câblage encastré — standard	ml	19.58	\N	t	2026-10-10 17:57:06.672+00	2026-10-10 17:57:06.672+00
273	2	4	Câblage encastré — salle de bain	ml	19.73	\N	t	2026-10-10 17:57:06.699+00	2026-10-10 17:57:06.699+00
274	2	4	Câblage encastré — cuisine	ml	19.23	\N	t	2026-10-10 17:57:06.732+00	2026-10-10 17:57:06.732+00
275	2	4	Câblage encastré — premium	ml	23.80	\N	t	2026-10-10 17:57:06.742+00	2026-10-10 17:57:06.742+00
276	2	4	Tableau électrique — standard	piece	1035.31	\N	t	2026-10-10 17:57:06.757+00	2026-10-10 17:57:06.757+00
277	2	4	Tableau électrique — salle de bain	piece	1018.56	\N	t	2026-10-10 17:57:06.775+00	2026-10-10 17:57:06.775+00
278	2	4	Tableau électrique — cuisine	piece	983.28	\N	t	2026-10-10 17:57:06.792+00	2026-10-10 17:57:06.792+00
279	2	4	Tableau électrique — premium	piece	1245.52	\N	t	2026-10-10 17:57:06.802+00	2026-10-10 17:57:06.802+00
280	2	4	Main-d’œuvre électricien — standard	h	50.52	6.00	f	2026-10-10 17:57:06.81+00	2026-10-10 17:57:06.81+00
281	2	4	Main-d’œuvre électricien — salle de bain	h	64.54	6.00	t	2026-10-10 17:57:06.822+00	2026-10-10 17:57:06.822+00
282	2	4	Main-d’œuvre électricien — cuisine	h	65.60	6.00	t	2026-10-10 17:57:06.839+00	2026-10-10 17:57:06.839+00
283	2	4	Main-d’œuvre électricien — premium	h	77.81	6.00	t	2026-10-10 17:57:06.847+00	2026-10-10 17:57:06.847+00
284	2	5	Mur en blocs — standard	m2	80.43	\N	t	2026-10-10 17:57:06.858+00	2026-10-10 17:57:06.858+00
285	2	5	Mur en blocs — salle de bain	m2	87.55	\N	t	2026-10-10 17:57:06.882+00	2026-10-10 17:57:06.882+00
286	2	5	Mur en blocs — cuisine	m2	88.37	\N	t	2026-10-10 17:57:06.888+00	2026-10-10 17:57:06.888+00
287	2	5	Mur en blocs — premium	m2	111.33	\N	t	2026-10-10 17:57:06.916+00	2026-10-10 17:57:06.916+00
288	2	5	Chape ciment — standard	m2	30.95	\N	t	2026-10-10 17:57:06.927+00	2026-10-10 17:57:06.927+00
289	2	5	Chape ciment — salle de bain	m2	38.75	\N	t	2026-10-10 17:57:06.938+00	2026-10-10 17:57:06.938+00
290	2	5	Chape ciment — cuisine	m2	34.31	\N	t	2026-10-10 17:57:06.957+00	2026-10-10 17:57:06.957+00
291	2	5	Chape ciment — premium	m2	46.52	\N	t	2026-10-10 17:57:06.975+00	2026-10-10 17:57:06.975+00
292	2	5	Ouverture de baie — standard	piece	1405.44	\N	f	2026-10-10 17:57:06.982+00	2026-10-10 17:57:06.982+00
293	2	5	Ouverture de baie — salle de bain	piece	1571.23	\N	t	2026-10-10 17:57:07.004+00	2026-10-10 17:57:07.004+00
294	2	5	Ouverture de baie — cuisine	piece	1483.38	\N	t	2026-10-10 17:57:07.027+00	2026-10-10 17:57:07.027+00
295	2	5	Ouverture de baie — premium	piece	1850.19	\N	t	2026-10-10 17:57:07.033+00	2026-10-10 17:57:07.033+00
296	2	5	Rejointoyage façade — standard	m2	36.74	\N	t	2026-10-10 17:57:07.045+00	2026-10-10 17:57:07.045+00
297	2	5	Rejointoyage façade — salle de bain	m2	44.81	\N	t	2026-10-10 17:57:07.052+00	2026-10-10 17:57:07.052+00
298	2	5	Rejointoyage façade — cuisine	m2	40.86	\N	t	2026-10-10 17:57:07.059+00	2026-10-10 17:57:07.059+00
299	2	5	Rejointoyage façade — premium	m2	54.58	\N	f	2026-10-10 17:57:07.065+00	2026-10-10 17:57:07.065+00
300	2	5	Main-d’œuvre maçon — standard	h	50.50	6.00	t	2026-10-10 17:57:07.079+00	2026-10-10 17:57:07.079+00
301	2	5	Main-d’œuvre maçon — salle de bain	h	52.94	6.00	t	2026-10-10 17:57:07.093+00	2026-10-10 17:57:07.093+00
302	2	5	Main-d’œuvre maçon — cuisine	h	54.47	6.00	t	2026-10-10 17:57:07.102+00	2026-10-10 17:57:07.102+00
303	2	5	Main-d’œuvre maçon — premium	h	64.43	6.00	t	2026-10-10 17:57:07.114+00	2026-10-10 17:57:07.114+00
304	2	6	Pose porte intérieure — standard	piece	313.78	\N	t	2026-10-10 17:57:07.125+00	2026-10-10 17:57:07.125+00
305	2	6	Pose porte intérieure — salle de bain	piece	343.79	\N	t	2026-10-10 17:57:07.154+00	2026-10-10 17:57:07.154+00
306	2	6	Pose porte intérieure — cuisine	piece	363.70	\N	t	2026-10-10 17:57:07.172+00	2026-10-10 17:57:07.172+00
307	2	6	Pose porte intérieure — premium	piece	397.57	\N	t	2026-10-10 17:57:07.187+00	2026-10-10 17:57:07.187+00
308	2	6	Pose châssis — standard	piece	708.27	\N	t	2026-10-10 17:57:07.197+00	2026-10-10 17:57:07.197+00
309	2	6	Pose châssis — salle de bain	piece	871.72	\N	t	2026-10-10 17:57:07.215+00	2026-10-10 17:57:07.215+00
310	2	6	Pose châssis — cuisine	piece	795.52	\N	t	2026-10-10 17:57:07.23+00	2026-10-10 17:57:07.23+00
311	2	6	Pose châssis — premium	piece	1069.56	\N	t	2026-10-10 17:57:07.242+00	2026-10-10 17:57:07.242+00
312	2	6	Habillage escalier — standard	piece	1948.35	\N	t	2026-10-10 17:57:07.248+00	2026-10-10 17:57:07.248+00
313	2	6	Habillage escalier — salle de bain	piece	2111.51	\N	t	2026-10-10 17:57:07.254+00	2026-10-10 17:57:07.254+00
314	2	6	Habillage escalier — cuisine	piece	1900.00	\N	t	2026-10-10 17:57:07.266+00	2026-10-10 17:57:07.266+00
315	2	6	Habillage escalier — premium	piece	2399.60	\N	t	2026-10-10 17:57:07.277+00	2026-10-10 17:57:07.277+00
316	2	6	Placard sur mesure — standard	ml	403.61	\N	t	2026-10-10 17:57:07.283+00	2026-10-10 17:57:07.283+00
317	2	6	Placard sur mesure — salle de bain	ml	437.47	\N	t	2026-10-10 17:57:07.288+00	2026-10-10 17:57:07.288+00
318	2	6	Placard sur mesure — cuisine	ml	481.80	\N	t	2026-10-10 17:57:07.299+00	2026-10-10 17:57:07.299+00
319	2	6	Placard sur mesure — premium	ml	575.59	\N	t	2026-10-10 17:57:07.305+00	2026-10-10 17:57:07.305+00
320	2	6	Main-d’œuvre menuisier — standard	h	47.51	6.00	t	2026-10-10 17:57:07.31+00	2026-10-10 17:57:07.31+00
321	2	6	Main-d’œuvre menuisier — salle de bain	h	57.47	6.00	t	2026-10-10 17:57:07.315+00	2026-10-10 17:57:07.315+00
322	2	6	Main-d’œuvre menuisier — cuisine	h	52.45	6.00	t	2026-10-10 17:57:07.321+00	2026-10-10 17:57:07.321+00
323	2	6	Main-d’œuvre menuisier — premium	h	68.50	6.00	t	2026-10-10 17:57:07.326+00	2026-10-10 17:57:07.326+00
324	2	7	Couverture tuiles — standard	m2	88.92	\N	t	2026-10-10 17:57:07.332+00	2026-10-10 17:57:07.332+00
325	2	7	Couverture tuiles — salle de bain	m2	115.28	\N	t	2026-10-10 17:57:07.345+00	2026-10-10 17:57:07.345+00
326	2	7	Couverture tuiles — cuisine	m2	105.69	\N	t	2026-10-10 17:57:07.357+00	2026-10-10 17:57:07.357+00
327	2	7	Couverture tuiles — premium	m2	117.34	\N	t	2026-10-10 17:57:07.363+00	2026-10-10 17:57:07.363+00
328	2	7	Membrane EPDM — standard	m2	63.13	\N	t	2026-10-10 17:57:07.372+00	2026-10-10 17:57:07.372+00
329	2	7	Membrane EPDM — salle de bain	m2	83.97	\N	t	2026-10-10 17:57:07.384+00	2026-10-10 17:57:07.384+00
330	2	7	Membrane EPDM — cuisine	m2	76.86	\N	t	2026-10-10 17:57:07.39+00	2026-10-10 17:57:07.39+00
331	2	7	Membrane EPDM — premium	m2	96.53	\N	t	2026-10-10 17:57:07.406+00	2026-10-10 17:57:07.406+00
332	2	7	Gouttière zinc — standard	ml	54.37	\N	t	2026-10-10 17:57:07.411+00	2026-10-10 17:57:07.411+00
333	2	7	Gouttière zinc — salle de bain	ml	66.19	\N	t	2026-10-10 17:57:07.417+00	2026-10-10 17:57:07.417+00
334	2	7	Gouttière zinc — cuisine	ml	64.46	\N	t	2026-10-10 17:57:07.425+00	2026-10-10 17:57:07.425+00
335	2	7	Gouttière zinc — premium	ml	75.55	\N	t	2026-10-10 17:57:07.437+00	2026-10-10 17:57:07.437+00
336	2	7	Velux — standard	piece	1263.70	\N	t	2026-10-10 17:57:07.455+00	2026-10-10 17:57:07.455+00
337	2	7	Velux — salle de bain	piece	1375.03	\N	t	2026-10-10 17:57:07.475+00	2026-10-10 17:57:07.475+00
338	2	7	Velux — cuisine	piece	1258.99	\N	t	2026-10-10 17:57:07.488+00	2026-10-10 17:57:07.488+00
339	2	7	Velux — premium	piece	1457.17	\N	t	2026-10-10 17:57:07.499+00	2026-10-10 17:57:07.499+00
340	2	7	Main-d’œuvre couvreur — standard	h	63.70	6.00	f	2026-10-10 17:57:07.513+00	2026-10-10 17:57:07.513+00
341	2	7	Main-d’œuvre couvreur — salle de bain	h	61.41	6.00	t	2026-10-10 17:57:07.521+00	2026-10-10 17:57:07.521+00
342	2	7	Main-d’œuvre couvreur — cuisine	h	67.72	6.00	t	2026-10-10 17:57:07.53+00	2026-10-10 17:57:07.53+00
343	2	7	Main-d’œuvre couvreur — premium	h	71.95	6.00	f	2026-10-10 17:57:07.552+00	2026-10-10 17:57:07.552+00
344	2	8	Isolation laine de verre — standard	m2	24.31	\N	t	2026-10-10 17:57:07.557+00	2026-10-10 17:57:07.557+00
345	2	8	Isolation laine de verre — salle de bain	m2	29.18	\N	t	2026-10-10 17:57:07.562+00	2026-10-10 17:57:07.562+00
346	2	8	Isolation laine de verre — cuisine	m2	29.73	\N	t	2026-10-10 17:57:07.567+00	2026-10-10 17:57:07.567+00
347	2	8	Isolation laine de verre — premium	m2	32.46	\N	t	2026-10-10 17:57:07.572+00	2026-10-10 17:57:07.572+00
348	2	8	Isolation PIR toiture — standard	m2	44.92	\N	t	2026-10-10 17:57:07.577+00	2026-10-10 17:57:07.577+00
349	2	8	Isolation PIR toiture — salle de bain	m2	52.24	\N	t	2026-10-10 17:57:07.582+00	2026-10-10 17:57:07.582+00
350	2	8	Isolation PIR toiture — cuisine	m2	48.30	\N	t	2026-10-10 17:57:07.594+00	2026-10-10 17:57:07.594+00
351	2	8	Isolation PIR toiture — premium	m2	60.06	\N	t	2026-10-10 17:57:07.606+00	2026-10-10 17:57:07.606+00
352	2	8	Isolation façade ETICS — standard	m2	108.55	\N	t	2026-10-10 17:57:07.616+00	2026-10-10 17:57:07.616+00
353	2	8	Isolation façade ETICS — salle de bain	m2	127.22	\N	t	2026-10-10 17:57:07.628+00	2026-10-10 17:57:07.628+00
354	2	8	Isolation façade ETICS — cuisine	m2	138.12	\N	f	2026-10-10 17:57:07.642+00	2026-10-10 17:57:07.642+00
355	2	8	Isolation façade ETICS — premium	m2	166.14	\N	t	2026-10-10 17:57:07.657+00	2026-10-10 17:57:07.657+00
356	2	8	Pare-vapeur — standard	m2	8.89	\N	t	2026-10-10 17:57:07.663+00	2026-10-10 17:57:07.663+00
357	2	8	Pare-vapeur — salle de bain	m2	11.36	\N	t	2026-10-10 17:57:07.671+00	2026-10-10 17:57:07.671+00
358	2	8	Pare-vapeur — cuisine	m2	10.67	\N	t	2026-10-10 17:57:07.68+00	2026-10-10 17:57:07.68+00
359	2	8	Pare-vapeur — premium	m2	11.67	\N	t	2026-10-10 17:57:07.686+00	2026-10-10 17:57:07.686+00
360	2	8	Main-d’œuvre isolation — standard	h	48.00	6.00	t	2026-10-10 17:57:07.692+00	2026-10-10 17:57:07.692+00
361	2	8	Main-d’œuvre isolation — salle de bain	h	53.80	6.00	t	2026-10-10 17:57:07.698+00	2026-10-10 17:57:07.698+00
362	2	8	Main-d’œuvre isolation — cuisine	h	49.95	6.00	t	2026-10-10 17:57:07.705+00	2026-10-10 17:57:07.705+00
363	2	8	Main-d’œuvre isolation — premium	h	62.28	6.00	t	2026-10-10 17:57:07.713+00	2026-10-10 17:57:07.713+00
364	2	9	Parquet contrecollé — standard	m2	57.92	\N	t	2026-10-10 17:57:07.723+00	2026-10-10 17:57:07.723+00
365	2	9	Parquet contrecollé — salle de bain	m2	67.71	\N	t	2026-10-10 17:57:07.74+00	2026-10-10 17:57:07.74+00
366	2	9	Parquet contrecollé — cuisine	m2	63.37	\N	t	2026-10-10 17:57:07.776+00	2026-10-10 17:57:07.776+00
367	2	9	Parquet contrecollé — premium	m2	76.64	\N	t	2026-10-10 17:57:07.796+00	2026-10-10 17:57:07.796+00
368	2	9	Sol vinyle clipsable — standard	m2	31.82	\N	t	2026-10-10 17:57:07.805+00	2026-10-10 17:57:07.805+00
369	2	9	Sol vinyle clipsable — salle de bain	m2	41.13	\N	t	2026-10-10 17:57:07.84+00	2026-10-10 17:57:07.84+00
370	2	9	Sol vinyle clipsable — cuisine	m2	38.42	\N	t	2026-10-10 17:57:07.848+00	2026-10-10 17:57:07.848+00
371	2	9	Sol vinyle clipsable — premium	m2	49.56	\N	t	2026-10-10 17:57:07.861+00	2026-10-10 17:57:07.861+00
372	2	9	Ragréage — standard	m2	15.92	\N	t	2026-10-10 17:57:07.874+00	2026-10-10 17:57:07.874+00
373	2	9	Ragréage — salle de bain	m2	16.22	\N	t	2026-10-10 17:57:07.884+00	2026-10-10 17:57:07.884+00
374	2	9	Ragréage — cuisine	m2	16.60	\N	t	2026-10-10 17:57:07.89+00	2026-10-10 17:57:07.89+00
375	2	9	Ragréage — premium	m2	21.14	\N	t	2026-10-10 17:57:07.897+00	2026-10-10 17:57:07.897+00
376	2	9	Plinthes bois — standard	ml	10.85	\N	t	2026-10-10 17:57:07.914+00	2026-10-10 17:57:07.914+00
377	2	9	Plinthes bois — salle de bain	ml	14.46	\N	t	2026-10-10 17:57:07.921+00	2026-10-10 17:57:07.921+00
378	2	9	Plinthes bois — cuisine	ml	12.07	\N	t	2026-10-10 17:57:07.934+00	2026-10-10 17:57:07.934+00
379	2	9	Plinthes bois — premium	ml	15.64	\N	t	2026-10-10 17:57:07.955+00	2026-10-10 17:57:07.955+00
380	2	9	Main-d’œuvre poseur de sol — standard	h	46.79	6.00	t	2026-10-10 17:57:07.984+00	2026-10-10 17:57:07.984+00
381	2	9	Main-d’œuvre poseur de sol — salle de bain	h	48.58	6.00	t	2026-10-10 17:57:07.997+00	2026-10-10 17:57:07.997+00
382	2	9	Main-d’œuvre poseur de sol — cuisine	h	53.08	6.00	f	2026-10-10 17:57:08.006+00	2026-10-10 17:57:08.006+00
383	2	9	Main-d’œuvre poseur de sol — premium	h	62.71	6.00	t	2026-10-10 17:57:08.011+00	2026-10-10 17:57:08.011+00
384	2	10	Démolition cloison — standard	m2	24.22	\N	t	2026-10-10 17:57:08.021+00	2026-10-10 17:57:08.021+00
385	2	10	Démolition cloison — salle de bain	m2	26.73	\N	t	2026-10-10 17:57:08.028+00	2026-10-10 17:57:08.028+00
386	2	10	Démolition cloison — cuisine	m2	28.55	\N	t	2026-10-10 17:57:08.045+00	2026-10-10 17:57:08.045+00
387	2	10	Démolition cloison — premium	m2	32.67	\N	t	2026-10-10 17:57:08.051+00	2026-10-10 17:57:08.051+00
388	2	10	Dépose carrelage — standard	m2	18.90	\N	t	2026-10-10 17:57:08.058+00	2026-10-10 17:57:08.058+00
389	2	10	Dépose carrelage — salle de bain	m2	21.56	\N	t	2026-10-10 17:57:08.074+00	2026-10-10 17:57:08.074+00
390	2	10	Dépose carrelage — cuisine	m2	22.00	\N	t	2026-10-10 17:57:08.079+00	2026-10-10 17:57:08.079+00
391	2	10	Dépose carrelage — premium	m2	24.67	\N	t	2026-10-10 17:57:08.085+00	2026-10-10 17:57:08.085+00
392	2	10	Évacuation gravats — standard	piece	291.79	\N	t	2026-10-10 17:57:08.094+00	2026-10-10 17:57:08.094+00
393	2	10	Évacuation gravats — salle de bain	piece	321.57	\N	t	2026-10-10 17:57:08.116+00	2026-10-10 17:57:08.116+00
394	2	10	Évacuation gravats — cuisine	piece	286.68	\N	t	2026-10-10 17:57:08.132+00	2026-10-10 17:57:08.132+00
395	2	10	Évacuation gravats — premium	piece	382.50	\N	t	2026-10-10 17:57:08.139+00	2026-10-10 17:57:08.139+00
396	2	10	Décapage sol — standard	m2	14.00	\N	t	2026-10-10 17:57:08.149+00	2026-10-10 17:57:08.149+00
397	2	10	Décapage sol — salle de bain	m2	13.85	\N	t	2026-10-10 17:57:08.157+00	2026-10-10 17:57:08.157+00
398	2	10	Décapage sol — cuisine	m2	14.70	\N	t	2026-10-10 17:57:08.185+00	2026-10-10 17:57:08.185+00
399	2	10	Décapage sol — premium	m2	17.24	\N	t	2026-10-10 17:57:08.205+00	2026-10-10 17:57:08.205+00
400	2	10	Main-d’œuvre démolition — standard	h	38.09	6.00	t	2026-10-10 17:57:08.216+00	2026-10-10 17:57:08.216+00
401	2	10	Main-d’œuvre démolition — salle de bain	h	43.84	6.00	t	2026-10-10 17:57:08.224+00	2026-10-10 17:57:08.224+00
402	2	10	Main-d’œuvre démolition — cuisine	h	40.62	6.00	t	2026-10-10 17:57:08.23+00	2026-10-10 17:57:08.23+00
403	2	10	Main-d’œuvre démolition — premium	h	56.68	6.00	t	2026-10-10 17:57:08.235+00	2026-10-10 17:57:08.235+00
404	7	1	Peinture murale 2 couches — standard	m2	18.51	\N	t	2026-10-10 17:57:08.247+00	2026-10-10 17:57:08.247+00
405	7	1	Peinture murale 2 couches — salle de bain	m2	22.25	\N	t	2026-10-10 17:57:08.253+00	2026-10-10 17:57:08.253+00
406	7	1	Peinture murale 2 couches — cuisine	m2	20.82	\N	t	2026-10-10 17:57:08.259+00	2026-10-10 17:57:08.259+00
407	7	1	Peinture murale 2 couches — premium	m2	24.99	\N	t	2026-10-10 17:57:08.264+00	2026-10-10 17:57:08.264+00
408	7	1	Peinture plafond — standard	m2	21.35	\N	t	2026-10-10 17:57:08.269+00	2026-10-10 17:57:08.269+00
409	7	1	Peinture plafond — salle de bain	m2	24.09	\N	t	2026-10-10 17:57:08.28+00	2026-10-10 17:57:08.28+00
410	7	1	Peinture plafond — cuisine	m2	22.34	\N	t	2026-10-10 17:57:08.289+00	2026-10-10 17:57:08.289+00
411	7	1	Peinture plafond — premium	m2	27.44	\N	t	2026-10-10 17:57:08.305+00	2026-10-10 17:57:08.305+00
412	7	1	Laquage boiseries — standard	ml	14.33	\N	f	2026-10-10 17:57:08.314+00	2026-10-10 17:57:08.314+00
413	7	1	Laquage boiseries — salle de bain	ml	17.51	\N	t	2026-10-10 17:57:08.326+00	2026-10-10 17:57:08.326+00
414	7	1	Laquage boiseries — cuisine	ml	16.35	\N	t	2026-10-10 17:57:08.332+00	2026-10-10 17:57:08.332+00
415	7	1	Laquage boiseries — premium	ml	19.43	\N	t	2026-10-10 17:57:08.343+00	2026-10-10 17:57:08.343+00
416	7	1	Enduit de lissage — standard	m2	12.87	\N	t	2026-10-10 17:57:08.354+00	2026-10-10 17:57:08.354+00
417	7	1	Enduit de lissage — salle de bain	m2	12.85	\N	t	2026-10-10 17:57:08.359+00	2026-10-10 17:57:08.359+00
418	7	1	Enduit de lissage — cuisine	m2	14.14	\N	t	2026-10-10 17:57:08.367+00	2026-10-10 17:57:08.367+00
419	7	1	Enduit de lissage — premium	m2	16.06	\N	t	2026-10-10 17:57:08.378+00	2026-10-10 17:57:08.378+00
420	7	1	Main-d’œuvre peintre — standard	h	43.46	6.00	t	2026-10-10 17:57:08.392+00	2026-10-10 17:57:08.392+00
421	7	1	Main-d’œuvre peintre — salle de bain	h	51.12	6.00	t	2026-10-10 17:57:08.401+00	2026-10-10 17:57:08.401+00
422	7	1	Main-d’œuvre peintre — cuisine	h	45.02	6.00	t	2026-10-10 17:57:08.41+00	2026-10-10 17:57:08.41+00
423	7	1	Main-d’œuvre peintre — premium	h	64.47	6.00	t	2026-10-10 17:57:08.417+00	2026-10-10 17:57:08.417+00
424	7	2	Pose carrelage sol — standard	m2	46.79	\N	t	2026-10-10 17:57:08.423+00	2026-10-10 17:57:08.423+00
425	7	2	Pose carrelage sol — salle de bain	m2	56.31	\N	t	2026-10-10 17:57:08.431+00	2026-10-10 17:57:08.431+00
426	7	2	Pose carrelage sol — cuisine	m2	49.46	\N	t	2026-10-10 17:57:08.439+00	2026-10-10 17:57:08.439+00
427	7	2	Pose carrelage sol — premium	m2	69.12	\N	t	2026-10-10 17:57:08.451+00	2026-10-10 17:57:08.451+00
428	7	2	Pose faïence murale — standard	m2	53.10	\N	t	2026-10-10 17:57:08.459+00	2026-10-10 17:57:08.459+00
429	7	2	Pose faïence murale — salle de bain	m2	64.45	\N	t	2026-10-10 17:57:08.469+00	2026-10-10 17:57:08.469+00
430	7	2	Pose faïence murale — cuisine	m2	57.74	\N	t	2026-10-10 17:57:08.476+00	2026-10-10 17:57:08.476+00
431	7	2	Pose faïence murale — premium	m2	73.06	\N	t	2026-10-10 17:57:08.482+00	2026-10-10 17:57:08.482+00
432	7	2	Plinthes carrelées — standard	ml	17.54	\N	t	2026-10-10 17:57:08.491+00	2026-10-10 17:57:08.491+00
433	7	2	Plinthes carrelées — salle de bain	ml	17.25	\N	t	2026-10-10 17:57:08.496+00	2026-10-10 17:57:08.496+00
434	7	2	Plinthes carrelées — cuisine	ml	17.47	\N	t	2026-10-10 17:57:08.502+00	2026-10-10 17:57:08.502+00
435	7	2	Plinthes carrelées — premium	ml	22.60	\N	t	2026-10-10 17:57:08.508+00	2026-10-10 17:57:08.508+00
436	7	2	Joints époxy — standard	m2	10.82	\N	t	2026-10-10 17:57:08.514+00	2026-10-10 17:57:08.514+00
437	7	2	Joints époxy — salle de bain	m2	11.88	\N	t	2026-10-10 17:57:08.524+00	2026-10-10 17:57:08.524+00
438	7	2	Joints époxy — cuisine	m2	13.06	\N	t	2026-10-10 17:57:08.532+00	2026-10-10 17:57:08.532+00
439	7	2	Joints époxy — premium	m2	14.27	\N	t	2026-10-10 17:57:08.554+00	2026-10-10 17:57:08.554+00
440	7	2	Main-d’œuvre carreleur — standard	h	45.76	6.00	t	2026-10-10 17:57:08.561+00	2026-10-10 17:57:08.561+00
441	7	2	Main-d’œuvre carreleur — salle de bain	h	59.59	6.00	t	2026-10-10 17:57:08.57+00	2026-10-10 17:57:08.57+00
442	7	2	Main-d’œuvre carreleur — cuisine	h	51.39	6.00	t	2026-10-10 17:57:08.577+00	2026-10-10 17:57:08.577+00
443	7	2	Main-d’œuvre carreleur — premium	h	59.23	6.00	t	2026-10-10 17:57:08.587+00	2026-10-10 17:57:08.587+00
444	7	3	Pose WC suspendu — standard	piece	449.74	\N	t	2026-10-10 17:57:08.593+00	2026-10-10 17:57:08.593+00
445	7	3	Pose WC suspendu — salle de bain	piece	470.22	\N	t	2026-10-10 17:57:08.601+00	2026-10-10 17:57:08.601+00
446	7	3	Pose WC suspendu — cuisine	piece	479.18	\N	t	2026-10-10 17:57:08.609+00	2026-10-10 17:57:08.609+00
447	7	3	Pose WC suspendu — premium	piece	594.98	\N	t	2026-10-10 17:57:08.615+00	2026-10-10 17:57:08.615+00
448	7	3	Pose lavabo — standard	piece	276.26	\N	t	2026-10-10 17:57:08.622+00	2026-10-10 17:57:08.622+00
449	7	3	Pose lavabo — salle de bain	piece	305.09	\N	t	2026-10-10 17:57:08.629+00	2026-10-10 17:57:08.629+00
450	7	3	Pose lavabo — cuisine	piece	293.99	\N	t	2026-10-10 17:57:08.637+00	2026-10-10 17:57:08.637+00
451	7	3	Pose lavabo — premium	piece	386.08	\N	t	2026-10-10 17:57:08.645+00	2026-10-10 17:57:08.645+00
452	7	3	Tuyauterie multicouche — standard	ml	30.06	\N	t	2026-10-10 17:57:08.652+00	2026-10-10 17:57:08.652+00
453	7	3	Tuyauterie multicouche — salle de bain	ml	30.38	\N	t	2026-10-10 17:57:08.659+00	2026-10-10 17:57:08.659+00
454	7	3	Tuyauterie multicouche — cuisine	ml	33.18	\N	t	2026-10-10 17:57:08.664+00	2026-10-10 17:57:08.664+00
455	7	3	Tuyauterie multicouche — premium	ml	38.00	\N	t	2026-10-10 17:57:08.673+00	2026-10-10 17:57:08.673+00
456	7	3	Remplacement chauffe-eau — standard	piece	655.41	\N	t	2026-10-10 17:57:08.68+00	2026-10-10 17:57:08.68+00
457	7	3	Remplacement chauffe-eau — salle de bain	piece	805.52	\N	t	2026-10-10 17:57:08.687+00	2026-10-10 17:57:08.687+00
458	7	3	Remplacement chauffe-eau — cuisine	piece	702.21	\N	t	2026-10-10 17:57:08.695+00	2026-10-10 17:57:08.695+00
459	7	3	Remplacement chauffe-eau — premium	piece	992.46	\N	t	2026-10-10 17:57:08.703+00	2026-10-10 17:57:08.703+00
460	7	3	Main-d’œuvre plombier — standard	h	59.72	6.00	t	2026-10-10 17:57:08.71+00	2026-10-10 17:57:08.71+00
461	7	3	Main-d’œuvre plombier — salle de bain	h	64.87	6.00	t	2026-10-10 17:57:08.717+00	2026-10-10 17:57:08.717+00
462	7	3	Main-d’œuvre plombier — cuisine	h	61.29	6.00	t	2026-10-10 17:57:08.725+00	2026-10-10 17:57:08.725+00
463	7	3	Main-d’œuvre plombier — premium	h	73.27	6.00	t	2026-10-10 17:57:08.732+00	2026-10-10 17:57:08.732+00
464	7	4	Point lumineux — standard	piece	82.80	\N	t	2026-10-10 17:57:08.74+00	2026-10-10 17:57:08.74+00
465	7	4	Point lumineux — salle de bain	piece	94.05	\N	t	2026-10-10 17:57:08.75+00	2026-10-10 17:57:08.75+00
466	7	4	Point lumineux — cuisine	piece	91.10	\N	t	2026-10-10 17:57:08.757+00	2026-10-10 17:57:08.757+00
467	7	4	Point lumineux — premium	piece	116.64	\N	t	2026-10-10 17:57:08.772+00	2026-10-10 17:57:08.772+00
468	7	4	Prise de courant — standard	piece	63.59	\N	t	2026-10-10 17:57:08.779+00	2026-10-10 17:57:08.779+00
469	7	4	Prise de courant — salle de bain	piece	70.81	\N	t	2026-10-10 17:57:08.789+00	2026-10-10 17:57:08.789+00
470	7	4	Prise de courant — cuisine	piece	74.34	\N	t	2026-10-10 17:57:08.797+00	2026-10-10 17:57:08.797+00
471	7	4	Prise de courant — premium	piece	84.17	\N	t	2026-10-10 17:57:08.804+00	2026-10-10 17:57:08.804+00
472	7	4	Câblage encastré — standard	ml	19.21	\N	f	2026-10-10 17:57:08.809+00	2026-10-10 17:57:08.809+00
473	7	4	Câblage encastré — salle de bain	ml	20.12	\N	t	2026-10-10 17:57:08.816+00	2026-10-10 17:57:08.816+00
474	7	4	Câblage encastré — cuisine	ml	21.76	\N	t	2026-10-10 17:57:08.823+00	2026-10-10 17:57:08.823+00
475	7	4	Câblage encastré — premium	ml	25.86	\N	t	2026-10-10 17:57:08.829+00	2026-10-10 17:57:08.829+00
476	7	4	Tableau électrique — standard	piece	873.02	\N	t	2026-10-10 17:57:08.834+00	2026-10-10 17:57:08.834+00
477	7	4	Tableau électrique — salle de bain	piece	1201.43	\N	t	2026-10-10 17:57:08.838+00	2026-10-10 17:57:08.838+00
478	7	4	Tableau électrique — cuisine	piece	1093.32	\N	t	2026-10-10 17:57:08.844+00	2026-10-10 17:57:08.844+00
479	7	4	Tableau électrique — premium	piece	1316.77	\N	t	2026-10-10 17:57:08.849+00	2026-10-10 17:57:08.849+00
480	7	4	Main-d’œuvre électricien — standard	h	52.33	6.00	t	2026-10-10 17:57:08.854+00	2026-10-10 17:57:08.854+00
481	7	4	Main-d’œuvre électricien — salle de bain	h	64.69	6.00	t	2026-10-10 17:57:08.859+00	2026-10-10 17:57:08.859+00
482	7	4	Main-d’œuvre électricien — cuisine	h	55.34	6.00	t	2026-10-10 17:57:08.864+00	2026-10-10 17:57:08.864+00
483	7	4	Main-d’œuvre électricien — premium	h	81.51	6.00	t	2026-10-10 17:57:08.869+00	2026-10-10 17:57:08.869+00
484	7	5	Mur en blocs — standard	m2	77.14	\N	t	2026-10-10 17:57:08.874+00	2026-10-10 17:57:08.874+00
485	7	5	Mur en blocs — salle de bain	m2	92.60	\N	t	2026-10-10 17:57:08.879+00	2026-10-10 17:57:08.879+00
486	7	5	Mur en blocs — cuisine	m2	82.54	\N	t	2026-10-10 17:57:08.885+00	2026-10-10 17:57:08.885+00
487	7	5	Mur en blocs — premium	m2	101.11	\N	t	2026-10-10 17:57:08.894+00	2026-10-10 17:57:08.894+00
488	7	5	Chape ciment — standard	m2	32.58	\N	t	2026-10-10 17:57:08.901+00	2026-10-10 17:57:08.901+00
489	7	5	Chape ciment — salle de bain	m2	36.00	\N	t	2026-10-10 17:57:08.907+00	2026-10-10 17:57:08.907+00
490	7	5	Chape ciment — cuisine	m2	34.05	\N	t	2026-10-10 17:57:08.914+00	2026-10-10 17:57:08.914+00
491	7	5	Chape ciment — premium	m2	39.41	\N	t	2026-10-10 17:57:08.921+00	2026-10-10 17:57:08.921+00
492	7	5	Ouverture de baie — standard	piece	1455.53	\N	t	2026-10-10 17:57:08.928+00	2026-10-10 17:57:08.928+00
493	7	5	Ouverture de baie — salle de bain	piece	1519.52	\N	t	2026-10-10 17:57:08.935+00	2026-10-10 17:57:08.935+00
494	7	5	Ouverture de baie — cuisine	piece	1674.89	\N	t	2026-10-10 17:57:08.942+00	2026-10-10 17:57:08.942+00
495	7	5	Ouverture de baie — premium	piece	2082.20	\N	t	2026-10-10 17:57:08.948+00	2026-10-10 17:57:08.948+00
496	7	5	Rejointoyage façade — standard	m2	39.32	\N	t	2026-10-10 17:57:08.958+00	2026-10-10 17:57:08.958+00
497	7	5	Rejointoyage façade — salle de bain	m2	44.87	\N	t	2026-10-10 17:57:08.965+00	2026-10-10 17:57:08.965+00
498	7	5	Rejointoyage façade — cuisine	m2	41.58	\N	f	2026-10-10 17:57:08.981+00	2026-10-10 17:57:08.981+00
499	7	5	Rejointoyage façade — premium	m2	53.62	\N	t	2026-10-10 17:57:08.987+00	2026-10-10 17:57:08.987+00
500	7	5	Main-d’œuvre maçon — standard	h	53.12	6.00	t	2026-10-10 17:57:08.991+00	2026-10-10 17:57:08.991+00
501	7	5	Main-d’œuvre maçon — salle de bain	h	58.77	6.00	t	2026-10-10 17:57:09+00	2026-10-10 17:57:09+00
502	7	5	Main-d’œuvre maçon — cuisine	h	59.98	6.00	t	2026-10-10 17:57:09.01+00	2026-10-10 17:57:09.01+00
503	7	5	Main-d’œuvre maçon — premium	h	67.31	6.00	t	2026-10-10 17:57:09.016+00	2026-10-10 17:57:09.016+00
504	7	6	Pose porte intérieure — standard	piece	349.62	\N	t	2026-10-10 17:57:09.023+00	2026-10-10 17:57:09.023+00
505	7	6	Pose porte intérieure — salle de bain	piece	361.15	\N	t	2026-10-10 17:57:09.029+00	2026-10-10 17:57:09.029+00
506	7	6	Pose porte intérieure — cuisine	piece	346.32	\N	t	2026-10-10 17:57:09.035+00	2026-10-10 17:57:09.035+00
507	7	6	Pose porte intérieure — premium	piece	467.28	\N	t	2026-10-10 17:57:09.041+00	2026-10-10 17:57:09.041+00
508	7	6	Pose châssis — standard	piece	765.92	\N	t	2026-10-10 17:57:09.046+00	2026-10-10 17:57:09.046+00
509	7	6	Pose châssis — salle de bain	piece	881.94	\N	t	2026-10-10 17:57:09.065+00	2026-10-10 17:57:09.065+00
510	7	6	Pose châssis — cuisine	piece	833.13	\N	t	2026-10-10 17:57:09.075+00	2026-10-10 17:57:09.075+00
511	7	6	Pose châssis — premium	piece	959.98	\N	t	2026-10-10 17:57:09.08+00	2026-10-10 17:57:09.08+00
512	7	6	Habillage escalier — standard	piece	2052.40	\N	t	2026-10-10 17:57:09.085+00	2026-10-10 17:57:09.085+00
513	7	6	Habillage escalier — salle de bain	piece	1981.94	\N	t	2026-10-10 17:57:09.091+00	2026-10-10 17:57:09.091+00
514	7	6	Habillage escalier — cuisine	piece	2261.09	\N	t	2026-10-10 17:57:09.097+00	2026-10-10 17:57:09.097+00
515	7	6	Habillage escalier — premium	piece	2482.42	\N	t	2026-10-10 17:57:09.101+00	2026-10-10 17:57:09.101+00
516	7	6	Placard sur mesure — standard	ml	437.69	\N	t	2026-10-10 17:57:09.107+00	2026-10-10 17:57:09.107+00
517	7	6	Placard sur mesure — salle de bain	ml	428.02	\N	t	2026-10-10 17:57:09.112+00	2026-10-10 17:57:09.112+00
518	7	6	Placard sur mesure — cuisine	ml	490.68	\N	t	2026-10-10 17:57:09.12+00	2026-10-10 17:57:09.12+00
519	7	6	Placard sur mesure — premium	ml	606.14	\N	f	2026-10-10 17:57:09.125+00	2026-10-10 17:57:09.125+00
520	7	6	Main-d’œuvre menuisier — standard	h	51.28	6.00	t	2026-10-10 17:57:09.13+00	2026-10-10 17:57:09.13+00
521	7	6	Main-d’œuvre menuisier — salle de bain	h	60.63	6.00	t	2026-10-10 17:57:09.137+00	2026-10-10 17:57:09.137+00
522	7	6	Main-d’œuvre menuisier — cuisine	h	62.84	6.00	t	2026-10-10 17:57:09.142+00	2026-10-10 17:57:09.142+00
523	7	6	Main-d’œuvre menuisier — premium	h	66.37	6.00	f	2026-10-10 17:57:09.148+00	2026-10-10 17:57:09.148+00
524	7	7	Couverture tuiles — standard	m2	98.00	\N	t	2026-10-10 17:57:09.154+00	2026-10-10 17:57:09.154+00
525	7	7	Couverture tuiles — salle de bain	m2	114.65	\N	t	2026-10-10 17:57:09.158+00	2026-10-10 17:57:09.158+00
526	7	7	Couverture tuiles — cuisine	m2	114.79	\N	t	2026-10-10 17:57:09.163+00	2026-10-10 17:57:09.163+00
527	7	7	Couverture tuiles — premium	m2	120.43	\N	t	2026-10-10 17:57:09.169+00	2026-10-10 17:57:09.169+00
528	7	7	Membrane EPDM — standard	m2	69.68	\N	t	2026-10-10 17:57:09.175+00	2026-10-10 17:57:09.175+00
529	7	7	Membrane EPDM — salle de bain	m2	81.45	\N	t	2026-10-10 17:57:09.179+00	2026-10-10 17:57:09.179+00
530	7	7	Membrane EPDM — cuisine	m2	80.03	\N	t	2026-10-10 17:57:09.185+00	2026-10-10 17:57:09.185+00
531	7	7	Membrane EPDM — premium	m2	86.64	\N	t	2026-10-10 17:57:09.191+00	2026-10-10 17:57:09.191+00
532	7	7	Gouttière zinc — standard	ml	59.32	\N	t	2026-10-10 17:57:09.196+00	2026-10-10 17:57:09.196+00
533	7	7	Gouttière zinc — salle de bain	ml	63.72	\N	t	2026-10-10 17:57:09.201+00	2026-10-10 17:57:09.201+00
534	7	7	Gouttière zinc — cuisine	ml	62.90	\N	t	2026-10-10 17:57:09.207+00	2026-10-10 17:57:09.207+00
535	7	7	Gouttière zinc — premium	ml	67.46	\N	t	2026-10-10 17:57:09.212+00	2026-10-10 17:57:09.212+00
536	7	7	Velux — standard	piece	1217.21	\N	f	2026-10-10 17:57:09.217+00	2026-10-10 17:57:09.217+00
537	7	7	Velux — salle de bain	piece	1312.63	\N	t	2026-10-10 17:57:09.222+00	2026-10-10 17:57:09.222+00
538	7	7	Velux — cuisine	piece	1267.46	\N	t	2026-10-10 17:57:09.227+00	2026-10-10 17:57:09.227+00
539	7	7	Velux — premium	piece	1658.12	\N	t	2026-10-10 17:57:09.232+00	2026-10-10 17:57:09.232+00
540	7	7	Main-d’œuvre couvreur — standard	h	54.41	6.00	t	2026-10-10 17:57:09.238+00	2026-10-10 17:57:09.238+00
541	7	7	Main-d’œuvre couvreur — salle de bain	h	63.46	6.00	f	2026-10-10 17:57:09.243+00	2026-10-10 17:57:09.243+00
542	7	7	Main-d’œuvre couvreur — cuisine	h	65.03	6.00	f	2026-10-10 17:57:09.248+00	2026-10-10 17:57:09.248+00
543	7	7	Main-d’œuvre couvreur — premium	h	79.25	6.00	t	2026-10-10 17:57:09.254+00	2026-10-10 17:57:09.254+00
544	7	8	Isolation laine de verre — standard	m2	28.02	\N	t	2026-10-10 17:57:09.259+00	2026-10-10 17:57:09.259+00
545	7	8	Isolation laine de verre — salle de bain	m2	28.58	\N	t	2026-10-10 17:57:09.265+00	2026-10-10 17:57:09.265+00
546	7	8	Isolation laine de verre — cuisine	m2	27.52	\N	t	2026-10-10 17:57:09.27+00	2026-10-10 17:57:09.27+00
547	7	8	Isolation laine de verre — premium	m2	34.78	\N	t	2026-10-10 17:57:09.275+00	2026-10-10 17:57:09.275+00
548	7	8	Isolation PIR toiture — standard	m2	47.62	\N	t	2026-10-10 17:57:09.28+00	2026-10-10 17:57:09.28+00
549	7	8	Isolation PIR toiture — salle de bain	m2	52.45	\N	t	2026-10-10 17:57:09.285+00	2026-10-10 17:57:09.285+00
550	7	8	Isolation PIR toiture — cuisine	m2	48.64	\N	t	2026-10-10 17:57:09.29+00	2026-10-10 17:57:09.29+00
551	7	8	Isolation PIR toiture — premium	m2	54.12	\N	t	2026-10-10 17:57:09.296+00	2026-10-10 17:57:09.296+00
552	7	8	Isolation façade ETICS — standard	m2	127.75	\N	t	2026-10-10 17:57:09.301+00	2026-10-10 17:57:09.301+00
553	7	8	Isolation façade ETICS — salle de bain	m2	134.17	\N	f	2026-10-10 17:57:09.306+00	2026-10-10 17:57:09.306+00
554	7	8	Isolation façade ETICS — cuisine	m2	130.40	\N	t	2026-10-10 17:57:09.311+00	2026-10-10 17:57:09.311+00
555	7	8	Isolation façade ETICS — premium	m2	153.51	\N	t	2026-10-10 17:57:09.316+00	2026-10-10 17:57:09.316+00
556	7	8	Pare-vapeur — standard	m2	8.20	\N	t	2026-10-10 17:57:09.322+00	2026-10-10 17:57:09.322+00
557	7	8	Pare-vapeur — salle de bain	m2	10.51	\N	t	2026-10-10 17:57:09.327+00	2026-10-10 17:57:09.327+00
558	7	8	Pare-vapeur — cuisine	m2	9.51	\N	t	2026-10-10 17:57:09.331+00	2026-10-10 17:57:09.331+00
559	7	8	Pare-vapeur — premium	m2	13.21	\N	t	2026-10-10 17:57:09.336+00	2026-10-10 17:57:09.336+00
560	7	8	Main-d’œuvre isolation — standard	h	47.40	6.00	t	2026-10-10 17:57:09.342+00	2026-10-10 17:57:09.342+00
561	7	8	Main-d’œuvre isolation — salle de bain	h	54.33	6.00	t	2026-10-10 17:57:09.346+00	2026-10-10 17:57:09.346+00
562	7	8	Main-d’œuvre isolation — cuisine	h	47.90	6.00	t	2026-10-10 17:57:09.353+00	2026-10-10 17:57:09.353+00
563	7	8	Main-d’œuvre isolation — premium	h	66.88	6.00	t	2026-10-10 17:57:09.36+00	2026-10-10 17:57:09.36+00
564	7	9	Parquet contrecollé — standard	m2	65.86	\N	t	2026-10-10 17:57:09.365+00	2026-10-10 17:57:09.365+00
565	7	9	Parquet contrecollé — salle de bain	m2	73.58	\N	t	2026-10-10 17:57:09.374+00	2026-10-10 17:57:09.374+00
566	7	9	Parquet contrecollé — cuisine	m2	71.57	\N	t	2026-10-10 17:57:09.38+00	2026-10-10 17:57:09.38+00
567	7	9	Parquet contrecollé — premium	m2	81.04	\N	t	2026-10-10 17:57:09.386+00	2026-10-10 17:57:09.386+00
568	7	9	Sol vinyle clipsable — standard	m2	34.59	\N	t	2026-10-10 17:57:09.392+00	2026-10-10 17:57:09.392+00
569	7	9	Sol vinyle clipsable — salle de bain	m2	39.11	\N	t	2026-10-10 17:57:09.396+00	2026-10-10 17:57:09.396+00
570	7	9	Sol vinyle clipsable — cuisine	m2	40.32	\N	t	2026-10-10 17:57:09.402+00	2026-10-10 17:57:09.402+00
571	7	9	Sol vinyle clipsable — premium	m2	46.47	\N	t	2026-10-10 17:57:09.408+00	2026-10-10 17:57:09.408+00
572	7	9	Ragréage — standard	m2	13.57	\N	t	2026-10-10 17:57:09.414+00	2026-10-10 17:57:09.414+00
573	7	9	Ragréage — salle de bain	m2	16.79	\N	t	2026-10-10 17:57:09.42+00	2026-10-10 17:57:09.42+00
574	7	9	Ragréage — cuisine	m2	15.56	\N	t	2026-10-10 17:57:09.425+00	2026-10-10 17:57:09.425+00
575	7	9	Ragréage — premium	m2	21.57	\N	t	2026-10-10 17:57:09.436+00	2026-10-10 17:57:09.436+00
576	7	9	Plinthes bois — standard	ml	12.45	\N	t	2026-10-10 17:57:09.445+00	2026-10-10 17:57:09.445+00
577	7	9	Plinthes bois — salle de bain	ml	15.12	\N	t	2026-10-10 17:57:09.453+00	2026-10-10 17:57:09.453+00
578	7	9	Plinthes bois — cuisine	ml	14.38	\N	t	2026-10-10 17:57:09.46+00	2026-10-10 17:57:09.46+00
579	7	9	Plinthes bois — premium	ml	16.70	\N	t	2026-10-10 17:57:09.467+00	2026-10-10 17:57:09.467+00
580	7	9	Main-d’œuvre poseur de sol — standard	h	44.36	6.00	t	2026-10-10 17:57:09.488+00	2026-10-10 17:57:09.488+00
581	7	9	Main-d’œuvre poseur de sol — salle de bain	h	49.55	6.00	t	2026-10-10 17:57:09.513+00	2026-10-10 17:57:09.513+00
582	7	9	Main-d’œuvre poseur de sol — cuisine	h	49.35	6.00	t	2026-10-10 17:57:09.519+00	2026-10-10 17:57:09.519+00
583	7	9	Main-d’œuvre poseur de sol — premium	h	56.78	6.00	t	2026-10-10 17:57:09.524+00	2026-10-10 17:57:09.524+00
584	7	10	Démolition cloison — standard	m2	24.08	\N	t	2026-10-10 17:57:09.531+00	2026-10-10 17:57:09.531+00
585	7	10	Démolition cloison — salle de bain	m2	29.42	\N	t	2026-10-10 17:57:09.541+00	2026-10-10 17:57:09.541+00
586	7	10	Démolition cloison — cuisine	m2	24.18	\N	t	2026-10-10 17:57:09.55+00	2026-10-10 17:57:09.55+00
587	7	10	Démolition cloison — premium	m2	33.09	\N	t	2026-10-10 17:57:09.559+00	2026-10-10 17:57:09.559+00
588	7	10	Dépose carrelage — standard	m2	20.05	\N	t	2026-10-10 17:57:09.566+00	2026-10-10 17:57:09.566+00
589	7	10	Dépose carrelage — salle de bain	m2	22.92	\N	t	2026-10-10 17:57:09.572+00	2026-10-10 17:57:09.572+00
590	7	10	Dépose carrelage — cuisine	m2	22.40	\N	t	2026-10-10 17:57:09.577+00	2026-10-10 17:57:09.577+00
591	7	10	Dépose carrelage — premium	m2	27.85	\N	t	2026-10-10 17:57:09.584+00	2026-10-10 17:57:09.584+00
592	7	10	Évacuation gravats — standard	piece	286.66	\N	t	2026-10-10 17:57:09.59+00	2026-10-10 17:57:09.59+00
593	7	10	Évacuation gravats — salle de bain	piece	336.69	\N	t	2026-10-10 17:57:09.598+00	2026-10-10 17:57:09.598+00
594	7	10	Évacuation gravats — cuisine	piece	307.80	\N	t	2026-10-10 17:57:09.606+00	2026-10-10 17:57:09.606+00
595	7	10	Évacuation gravats — premium	piece	372.14	\N	t	2026-10-10 17:57:09.615+00	2026-10-10 17:57:09.615+00
596	7	10	Décapage sol — standard	m2	13.03	\N	t	2026-10-10 17:57:09.629+00	2026-10-10 17:57:09.629+00
597	7	10	Décapage sol — salle de bain	m2	16.33	\N	t	2026-10-10 17:57:09.635+00	2026-10-10 17:57:09.635+00
598	7	10	Décapage sol — cuisine	m2	13.33	\N	t	2026-10-10 17:57:09.641+00	2026-10-10 17:57:09.641+00
599	7	10	Décapage sol — premium	m2	18.42	\N	t	2026-10-10 17:57:09.647+00	2026-10-10 17:57:09.647+00
600	7	10	Main-d’œuvre démolition — standard	h	43.00	6.00	t	2026-10-10 17:57:09.651+00	2026-10-10 17:57:09.651+00
601	7	10	Main-d’œuvre démolition — salle de bain	h	46.21	6.00	t	2026-10-10 17:57:09.656+00	2026-10-10 17:57:09.656+00
602	7	10	Main-d’œuvre démolition — cuisine	h	43.51	6.00	t	2026-10-10 17:57:09.662+00	2026-10-10 17:57:09.662+00
603	7	10	Main-d’œuvre démolition — premium	h	51.96	6.00	t	2026-10-10 17:57:09.668+00	2026-10-10 17:57:09.668+00
604	8	1	Peinture murale 2 couches — standard	m2	18.43	\N	t	2026-10-10 17:57:09.679+00	2026-10-10 17:57:09.679+00
605	8	1	Peinture murale 2 couches — salle de bain	m2	19.63	\N	t	2026-10-10 17:57:09.684+00	2026-10-10 17:57:09.684+00
606	8	1	Peinture murale 2 couches — cuisine	m2	21.28	\N	t	2026-10-10 17:57:09.689+00	2026-10-10 17:57:09.689+00
607	8	1	Peinture murale 2 couches — premium	m2	22.89	\N	t	2026-10-10 17:57:09.694+00	2026-10-10 17:57:09.694+00
608	8	1	Peinture plafond — standard	m2	22.05	\N	t	2026-10-10 17:57:09.699+00	2026-10-10 17:57:09.699+00
609	8	1	Peinture plafond — salle de bain	m2	24.30	\N	t	2026-10-10 17:57:09.704+00	2026-10-10 17:57:09.704+00
610	8	1	Peinture plafond — cuisine	m2	24.15	\N	t	2026-10-10 17:57:09.71+00	2026-10-10 17:57:09.71+00
611	8	1	Peinture plafond — premium	m2	32.47	\N	t	2026-10-10 17:57:09.715+00	2026-10-10 17:57:09.715+00
612	8	1	Laquage boiseries — standard	ml	15.40	\N	t	2026-10-10 17:57:09.72+00	2026-10-10 17:57:09.72+00
613	8	1	Laquage boiseries — salle de bain	ml	16.26	\N	t	2026-10-10 17:57:09.726+00	2026-10-10 17:57:09.726+00
614	8	1	Laquage boiseries — cuisine	ml	15.45	\N	t	2026-10-10 17:57:09.73+00	2026-10-10 17:57:09.73+00
615	8	1	Laquage boiseries — premium	ml	19.31	\N	t	2026-10-10 17:57:09.736+00	2026-10-10 17:57:09.736+00
616	8	1	Enduit de lissage — standard	m2	12.26	\N	t	2026-10-10 17:57:09.741+00	2026-10-10 17:57:09.741+00
617	8	1	Enduit de lissage — salle de bain	m2	14.89	\N	t	2026-10-10 17:57:09.746+00	2026-10-10 17:57:09.746+00
618	8	1	Enduit de lissage — cuisine	m2	14.47	\N	t	2026-10-10 17:57:09.752+00	2026-10-10 17:57:09.752+00
619	8	1	Enduit de lissage — premium	m2	16.03	\N	t	2026-10-10 17:57:09.758+00	2026-10-10 17:57:09.758+00
620	8	1	Main-d’œuvre peintre — standard	h	44.57	6.00	t	2026-10-10 17:57:09.765+00	2026-10-10 17:57:09.765+00
621	8	1	Main-d’œuvre peintre — salle de bain	h	49.92	6.00	t	2026-10-10 17:57:09.771+00	2026-10-10 17:57:09.771+00
622	8	1	Main-d’œuvre peintre — cuisine	h	47.79	6.00	t	2026-10-10 17:57:09.776+00	2026-10-10 17:57:09.776+00
623	8	1	Main-d’œuvre peintre — premium	h	54.98	6.00	t	2026-10-10 17:57:09.781+00	2026-10-10 17:57:09.781+00
624	8	2	Pose carrelage sol — standard	m2	46.57	\N	t	2026-10-10 17:57:09.787+00	2026-10-10 17:57:09.787+00
625	8	2	Pose carrelage sol — salle de bain	m2	57.48	\N	t	2026-10-10 17:57:09.792+00	2026-10-10 17:57:09.792+00
626	8	2	Pose carrelage sol — cuisine	m2	48.02	\N	t	2026-10-10 17:57:09.797+00	2026-10-10 17:57:09.797+00
627	8	2	Pose carrelage sol — premium	m2	67.17	\N	t	2026-10-10 17:57:09.803+00	2026-10-10 17:57:09.803+00
628	8	2	Pose faïence murale — standard	m2	54.41	\N	t	2026-10-10 17:57:09.808+00	2026-10-10 17:57:09.808+00
629	8	2	Pose faïence murale — salle de bain	m2	60.56	\N	t	2026-10-10 17:57:09.813+00	2026-10-10 17:57:09.813+00
630	8	2	Pose faïence murale — cuisine	m2	59.06	\N	t	2026-10-10 17:57:09.818+00	2026-10-10 17:57:09.818+00
631	8	2	Pose faïence murale — premium	m2	67.12	\N	t	2026-10-10 17:57:09.824+00	2026-10-10 17:57:09.824+00
632	8	2	Plinthes carrelées — standard	ml	17.41	\N	t	2026-10-10 17:57:09.829+00	2026-10-10 17:57:09.829+00
633	8	2	Plinthes carrelées — salle de bain	ml	17.33	\N	t	2026-10-10 17:57:09.835+00	2026-10-10 17:57:09.835+00
634	8	2	Plinthes carrelées — cuisine	ml	18.19	\N	t	2026-10-10 17:57:09.841+00	2026-10-10 17:57:09.841+00
635	8	2	Plinthes carrelées — premium	ml	22.91	\N	t	2026-10-10 17:57:09.846+00	2026-10-10 17:57:09.846+00
636	8	2	Joints époxy — standard	m2	11.66	\N	t	2026-10-10 17:57:09.852+00	2026-10-10 17:57:09.852+00
637	8	2	Joints époxy — salle de bain	m2	12.25	\N	t	2026-10-10 17:57:09.857+00	2026-10-10 17:57:09.857+00
638	8	2	Joints époxy — cuisine	m2	12.50	\N	t	2026-10-10 17:57:09.862+00	2026-10-10 17:57:09.862+00
639	8	2	Joints époxy — premium	m2	15.84	\N	t	2026-10-10 17:57:09.868+00	2026-10-10 17:57:09.868+00
640	8	2	Main-d’œuvre carreleur — standard	h	48.44	6.00	t	2026-10-10 17:57:09.876+00	2026-10-10 17:57:09.876+00
641	8	2	Main-d’œuvre carreleur — salle de bain	h	53.85	6.00	t	2026-10-10 17:57:09.882+00	2026-10-10 17:57:09.882+00
642	8	2	Main-d’œuvre carreleur — cuisine	h	56.97	6.00	t	2026-10-10 17:57:09.893+00	2026-10-10 17:57:09.893+00
643	8	2	Main-d’œuvre carreleur — premium	h	69.16	6.00	t	2026-10-10 17:57:09.917+00	2026-10-10 17:57:09.917+00
644	8	3	Pose WC suspendu — standard	piece	402.48	\N	t	2026-10-10 17:57:09.93+00	2026-10-10 17:57:09.93+00
645	8	3	Pose WC suspendu — salle de bain	piece	530.05	\N	t	2026-10-10 17:57:09.939+00	2026-10-10 17:57:09.939+00
646	8	3	Pose WC suspendu — cuisine	piece	451.52	\N	t	2026-10-10 17:57:09.944+00	2026-10-10 17:57:09.944+00
647	8	3	Pose WC suspendu — premium	piece	538.70	\N	t	2026-10-10 17:57:09.952+00	2026-10-10 17:57:09.952+00
648	8	3	Pose lavabo — standard	piece	249.91	\N	t	2026-10-10 17:57:09.958+00	2026-10-10 17:57:09.958+00
649	8	3	Pose lavabo — salle de bain	piece	307.41	\N	t	2026-10-10 17:57:09.965+00	2026-10-10 17:57:09.965+00
650	8	3	Pose lavabo — cuisine	piece	271.79	\N	t	2026-10-10 17:57:09.981+00	2026-10-10 17:57:09.981+00
651	8	3	Pose lavabo — premium	piece	360.44	\N	t	2026-10-10 17:57:10.003+00	2026-10-10 17:57:10.003+00
652	8	3	Tuyauterie multicouche — standard	ml	29.08	\N	f	2026-10-10 17:57:10.012+00	2026-10-10 17:57:10.012+00
653	8	3	Tuyauterie multicouche — salle de bain	ml	30.45	\N	t	2026-10-10 17:57:10.019+00	2026-10-10 17:57:10.019+00
654	8	3	Tuyauterie multicouche — cuisine	ml	33.20	\N	t	2026-10-10 17:57:10.028+00	2026-10-10 17:57:10.028+00
655	8	3	Tuyauterie multicouche — premium	ml	39.06	\N	t	2026-10-10 17:57:10.044+00	2026-10-10 17:57:10.044+00
656	8	3	Remplacement chauffe-eau — standard	piece	724.53	\N	t	2026-10-10 17:57:10.056+00	2026-10-10 17:57:10.056+00
657	8	3	Remplacement chauffe-eau — salle de bain	piece	758.43	\N	t	2026-10-10 17:57:10.061+00	2026-10-10 17:57:10.061+00
658	8	3	Remplacement chauffe-eau — cuisine	piece	832.72	\N	t	2026-10-10 17:57:10.067+00	2026-10-10 17:57:10.067+00
659	8	3	Remplacement chauffe-eau — premium	piece	991.91	\N	t	2026-10-10 17:57:10.073+00	2026-10-10 17:57:10.073+00
660	8	3	Main-d’œuvre plombier — standard	h	53.13	6.00	t	2026-10-10 17:57:10.079+00	2026-10-10 17:57:10.079+00
661	8	3	Main-d’œuvre plombier — salle de bain	h	62.46	6.00	t	2026-10-10 17:57:10.085+00	2026-10-10 17:57:10.085+00
662	8	3	Main-d’œuvre plombier — cuisine	h	58.08	6.00	t	2026-10-10 17:57:10.091+00	2026-10-10 17:57:10.091+00
663	8	3	Main-d’œuvre plombier — premium	h	75.59	6.00	t	2026-10-10 17:57:10.096+00	2026-10-10 17:57:10.096+00
664	8	4	Point lumineux — standard	piece	86.02	\N	t	2026-10-10 17:57:10.115+00	2026-10-10 17:57:10.115+00
665	8	4	Point lumineux — salle de bain	piece	89.21	\N	f	2026-10-10 17:57:10.13+00	2026-10-10 17:57:10.13+00
666	8	4	Point lumineux — cuisine	piece	95.07	\N	t	2026-10-10 17:57:10.148+00	2026-10-10 17:57:10.148+00
667	8	4	Point lumineux — premium	piece	115.04	\N	f	2026-10-10 17:57:10.158+00	2026-10-10 17:57:10.158+00
668	8	4	Prise de courant — standard	piece	62.50	\N	t	2026-10-10 17:57:10.178+00	2026-10-10 17:57:10.178+00
669	8	4	Prise de courant — salle de bain	piece	68.53	\N	t	2026-10-10 17:57:10.185+00	2026-10-10 17:57:10.185+00
670	8	4	Prise de courant — cuisine	piece	70.30	\N	t	2026-10-10 17:57:10.197+00	2026-10-10 17:57:10.197+00
671	8	4	Prise de courant — premium	piece	86.12	\N	t	2026-10-10 17:57:10.205+00	2026-10-10 17:57:10.205+00
672	8	4	Câblage encastré — standard	ml	20.50	\N	t	2026-10-10 17:57:10.216+00	2026-10-10 17:57:10.216+00
673	8	4	Câblage encastré — salle de bain	ml	23.23	\N	t	2026-10-10 17:57:10.237+00	2026-10-10 17:57:10.237+00
674	8	4	Câblage encastré — cuisine	ml	21.76	\N	t	2026-10-10 17:57:10.245+00	2026-10-10 17:57:10.245+00
675	8	4	Câblage encastré — premium	ml	23.49	\N	t	2026-10-10 17:57:10.251+00	2026-10-10 17:57:10.251+00
676	8	4	Tableau électrique — standard	piece	946.41	\N	t	2026-10-10 17:57:10.257+00	2026-10-10 17:57:10.257+00
677	8	4	Tableau électrique — salle de bain	piece	1122.80	\N	t	2026-10-10 17:57:10.268+00	2026-10-10 17:57:10.268+00
678	8	4	Tableau électrique — cuisine	piece	1125.50	\N	t	2026-10-10 17:57:10.273+00	2026-10-10 17:57:10.273+00
679	8	4	Tableau électrique — premium	piece	1330.81	\N	t	2026-10-10 17:57:10.278+00	2026-10-10 17:57:10.278+00
680	8	4	Main-d’œuvre électricien — standard	h	58.01	6.00	t	2026-10-10 17:57:10.283+00	2026-10-10 17:57:10.283+00
681	8	4	Main-d’œuvre électricien — salle de bain	h	64.29	6.00	t	2026-10-10 17:57:10.288+00	2026-10-10 17:57:10.288+00
682	8	4	Main-d’œuvre électricien — cuisine	h	63.07	6.00	t	2026-10-10 17:57:10.293+00	2026-10-10 17:57:10.293+00
683	8	4	Main-d’œuvre électricien — premium	h	75.04	6.00	t	2026-10-10 17:57:10.298+00	2026-10-10 17:57:10.298+00
684	8	5	Mur en blocs — standard	m2	74.55	\N	t	2026-10-10 17:57:10.303+00	2026-10-10 17:57:10.303+00
685	8	5	Mur en blocs — salle de bain	m2	88.52	\N	t	2026-10-10 17:57:10.307+00	2026-10-10 17:57:10.307+00
686	8	5	Mur en blocs — cuisine	m2	81.64	\N	t	2026-10-10 17:57:10.312+00	2026-10-10 17:57:10.312+00
687	8	5	Mur en blocs — premium	m2	105.74	\N	t	2026-10-10 17:57:10.317+00	2026-10-10 17:57:10.317+00
688	8	5	Chape ciment — standard	m2	32.59	\N	t	2026-10-10 17:57:10.322+00	2026-10-10 17:57:10.322+00
689	8	5	Chape ciment — salle de bain	m2	39.50	\N	t	2026-10-10 17:57:10.328+00	2026-10-10 17:57:10.328+00
690	8	5	Chape ciment — cuisine	m2	35.74	\N	t	2026-10-10 17:57:10.333+00	2026-10-10 17:57:10.333+00
691	8	5	Chape ciment — premium	m2	45.84	\N	t	2026-10-10 17:57:10.338+00	2026-10-10 17:57:10.338+00
692	8	5	Ouverture de baie — standard	piece	1401.08	\N	t	2026-10-10 17:57:10.343+00	2026-10-10 17:57:10.343+00
693	8	5	Ouverture de baie — salle de bain	piece	1642.04	\N	t	2026-10-10 17:57:10.348+00	2026-10-10 17:57:10.348+00
694	8	5	Ouverture de baie — cuisine	piece	1545.34	\N	t	2026-10-10 17:57:10.352+00	2026-10-10 17:57:10.352+00
695	8	5	Ouverture de baie — premium	piece	1921.74	\N	t	2026-10-10 17:57:10.358+00	2026-10-10 17:57:10.358+00
696	8	5	Rejointoyage façade — standard	m2	39.85	\N	t	2026-10-10 17:57:10.365+00	2026-10-10 17:57:10.365+00
697	8	5	Rejointoyage façade — salle de bain	m2	41.39	\N	t	2026-10-10 17:57:10.37+00	2026-10-10 17:57:10.37+00
698	8	5	Rejointoyage façade — cuisine	m2	40.28	\N	t	2026-10-10 17:57:10.376+00	2026-10-10 17:57:10.376+00
699	8	5	Rejointoyage façade — premium	m2	53.71	\N	t	2026-10-10 17:57:10.382+00	2026-10-10 17:57:10.382+00
700	8	5	Main-d’œuvre maçon — standard	h	45.36	6.00	t	2026-10-10 17:57:10.39+00	2026-10-10 17:57:10.39+00
701	8	5	Main-d’œuvre maçon — salle de bain	h	57.91	6.00	t	2026-10-10 17:57:10.396+00	2026-10-10 17:57:10.396+00
702	8	5	Main-d’œuvre maçon — cuisine	h	49.56	6.00	t	2026-10-10 17:57:10.402+00	2026-10-10 17:57:10.402+00
703	8	5	Main-d’œuvre maçon — premium	h	73.63	6.00	t	2026-10-10 17:57:10.407+00	2026-10-10 17:57:10.407+00
704	8	6	Pose porte intérieure — standard	piece	341.55	\N	t	2026-10-10 17:57:10.412+00	2026-10-10 17:57:10.412+00
705	8	6	Pose porte intérieure — salle de bain	piece	340.65	\N	t	2026-10-10 17:57:10.418+00	2026-10-10 17:57:10.418+00
706	8	6	Pose porte intérieure — cuisine	piece	354.91	\N	t	2026-10-10 17:57:10.424+00	2026-10-10 17:57:10.424+00
707	8	6	Pose porte intérieure — premium	piece	435.58	\N	t	2026-10-10 17:57:10.429+00	2026-10-10 17:57:10.429+00
708	8	6	Pose châssis — standard	piece	703.80	\N	t	2026-10-10 17:57:10.441+00	2026-10-10 17:57:10.441+00
709	8	6	Pose châssis — salle de bain	piece	950.09	\N	t	2026-10-10 17:57:10.449+00	2026-10-10 17:57:10.449+00
710	8	6	Pose châssis — cuisine	piece	815.08	\N	t	2026-10-10 17:57:10.459+00	2026-10-10 17:57:10.459+00
711	8	6	Pose châssis — premium	piece	986.73	\N	t	2026-10-10 17:57:10.468+00	2026-10-10 17:57:10.468+00
712	8	6	Habillage escalier — standard	piece	1748.00	\N	t	2026-10-10 17:57:10.474+00	2026-10-10 17:57:10.474+00
713	8	6	Habillage escalier — salle de bain	piece	2400.68	\N	t	2026-10-10 17:57:10.48+00	2026-10-10 17:57:10.48+00
714	8	6	Habillage escalier — cuisine	piece	2215.26	\N	t	2026-10-10 17:57:10.485+00	2026-10-10 17:57:10.485+00
715	8	6	Habillage escalier — premium	piece	2606.21	\N	t	2026-10-10 17:57:10.491+00	2026-10-10 17:57:10.491+00
716	8	6	Placard sur mesure — standard	ml	442.93	\N	t	2026-10-10 17:57:10.512+00	2026-10-10 17:57:10.512+00
717	8	6	Placard sur mesure — salle de bain	ml	490.36	\N	t	2026-10-10 17:57:10.519+00	2026-10-10 17:57:10.519+00
718	8	6	Placard sur mesure — cuisine	ml	481.16	\N	t	2026-10-10 17:57:10.527+00	2026-10-10 17:57:10.527+00
719	8	6	Placard sur mesure — premium	ml	608.65	\N	t	2026-10-10 17:57:10.534+00	2026-10-10 17:57:10.534+00
720	8	6	Main-d’œuvre menuisier — standard	h	56.39	6.00	t	2026-10-10 17:57:10.542+00	2026-10-10 17:57:10.542+00
721	8	6	Main-d’œuvre menuisier — salle de bain	h	55.27	6.00	t	2026-10-10 17:57:10.548+00	2026-10-10 17:57:10.548+00
722	8	6	Main-d’œuvre menuisier — cuisine	h	57.39	6.00	t	2026-10-10 17:57:10.553+00	2026-10-10 17:57:10.553+00
723	8	6	Main-d’œuvre menuisier — premium	h	72.31	6.00	t	2026-10-10 17:57:10.558+00	2026-10-10 17:57:10.558+00
724	8	7	Couverture tuiles — standard	m2	90.80	\N	t	2026-10-10 17:57:10.564+00	2026-10-10 17:57:10.564+00
725	8	7	Couverture tuiles — salle de bain	m2	113.77	\N	t	2026-10-10 17:57:10.57+00	2026-10-10 17:57:10.57+00
726	8	7	Couverture tuiles — cuisine	m2	111.12	\N	t	2026-10-10 17:57:10.575+00	2026-10-10 17:57:10.575+00
727	8	7	Couverture tuiles — premium	m2	135.76	\N	t	2026-10-10 17:57:10.58+00	2026-10-10 17:57:10.58+00
728	8	7	Membrane EPDM — standard	m2	67.00	\N	t	2026-10-10 17:57:10.587+00	2026-10-10 17:57:10.587+00
729	8	7	Membrane EPDM — salle de bain	m2	83.07	\N	t	2026-10-10 17:57:10.593+00	2026-10-10 17:57:10.593+00
730	8	7	Membrane EPDM — cuisine	m2	78.16	\N	f	2026-10-10 17:57:10.599+00	2026-10-10 17:57:10.599+00
731	8	7	Membrane EPDM — premium	m2	90.94	\N	t	2026-10-10 17:57:10.606+00	2026-10-10 17:57:10.606+00
732	8	7	Gouttière zinc — standard	ml	54.34	\N	t	2026-10-10 17:57:10.611+00	2026-10-10 17:57:10.611+00
733	8	7	Gouttière zinc — salle de bain	ml	56.78	\N	t	2026-10-10 17:57:10.617+00	2026-10-10 17:57:10.617+00
734	8	7	Gouttière zinc — cuisine	ml	59.33	\N	t	2026-10-10 17:57:10.622+00	2026-10-10 17:57:10.622+00
735	8	7	Gouttière zinc — premium	ml	76.00	\N	t	2026-10-10 17:57:10.627+00	2026-10-10 17:57:10.627+00
736	8	7	Velux — standard	piece	1062.98	\N	t	2026-10-10 17:57:10.636+00	2026-10-10 17:57:10.636+00
737	8	7	Velux — salle de bain	piece	1393.14	\N	t	2026-10-10 17:57:10.643+00	2026-10-10 17:57:10.643+00
738	8	7	Velux — cuisine	piece	1298.06	\N	t	2026-10-10 17:57:10.65+00	2026-10-10 17:57:10.65+00
739	8	7	Velux — premium	piece	1485.46	\N	t	2026-10-10 17:57:10.659+00	2026-10-10 17:57:10.659+00
740	8	7	Main-d’œuvre couvreur — standard	h	54.87	6.00	t	2026-10-10 17:57:10.664+00	2026-10-10 17:57:10.664+00
741	8	7	Main-d’œuvre couvreur — salle de bain	h	70.68	6.00	t	2026-10-10 17:57:10.669+00	2026-10-10 17:57:10.669+00
742	8	7	Main-d’œuvre couvreur — cuisine	h	59.26	6.00	t	2026-10-10 17:57:10.674+00	2026-10-10 17:57:10.674+00
743	8	7	Main-d’œuvre couvreur — premium	h	71.33	6.00	f	2026-10-10 17:57:10.679+00	2026-10-10 17:57:10.679+00
744	8	8	Isolation laine de verre — standard	m2	23.60	\N	t	2026-10-10 17:57:10.687+00	2026-10-10 17:57:10.687+00
745	8	8	Isolation laine de verre — salle de bain	m2	29.57	\N	t	2026-10-10 17:57:10.699+00	2026-10-10 17:57:10.699+00
746	8	8	Isolation laine de verre — cuisine	m2	28.86	\N	t	2026-10-10 17:57:10.711+00	2026-10-10 17:57:10.711+00
747	8	8	Isolation laine de verre — premium	m2	36.74	\N	t	2026-10-10 17:57:10.72+00	2026-10-10 17:57:10.72+00
748	8	8	Isolation PIR toiture — standard	m2	41.66	\N	f	2026-10-10 17:57:10.733+00	2026-10-10 17:57:10.733+00
749	8	8	Isolation PIR toiture — salle de bain	m2	50.25	\N	t	2026-10-10 17:57:10.743+00	2026-10-10 17:57:10.743+00
750	8	8	Isolation PIR toiture — cuisine	m2	46.02	\N	t	2026-10-10 17:57:10.752+00	2026-10-10 17:57:10.752+00
751	8	8	Isolation PIR toiture — premium	m2	59.48	\N	t	2026-10-10 17:57:10.76+00	2026-10-10 17:57:10.76+00
752	8	8	Isolation façade ETICS — standard	m2	117.32	\N	t	2026-10-10 17:57:10.765+00	2026-10-10 17:57:10.765+00
753	8	8	Isolation façade ETICS — salle de bain	m2	127.61	\N	t	2026-10-10 17:57:10.773+00	2026-10-10 17:57:10.773+00
754	8	8	Isolation façade ETICS — cuisine	m2	140.47	\N	t	2026-10-10 17:57:10.781+00	2026-10-10 17:57:10.781+00
755	8	8	Isolation façade ETICS — premium	m2	168.61	\N	t	2026-10-10 17:57:10.786+00	2026-10-10 17:57:10.786+00
756	8	8	Pare-vapeur — standard	m2	8.19	\N	t	2026-10-10 17:57:10.791+00	2026-10-10 17:57:10.791+00
757	8	8	Pare-vapeur — salle de bain	m2	10.11	\N	f	2026-10-10 17:57:10.797+00	2026-10-10 17:57:10.797+00
758	8	8	Pare-vapeur — cuisine	m2	9.96	\N	t	2026-10-10 17:57:10.803+00	2026-10-10 17:57:10.803+00
759	8	8	Pare-vapeur — premium	m2	11.60	\N	f	2026-10-10 17:57:10.808+00	2026-10-10 17:57:10.808+00
760	8	8	Main-d’œuvre isolation — standard	h	44.87	6.00	t	2026-10-10 17:57:10.813+00	2026-10-10 17:57:10.813+00
761	8	8	Main-d’œuvre isolation — salle de bain	h	55.93	6.00	t	2026-10-10 17:57:10.818+00	2026-10-10 17:57:10.818+00
762	8	8	Main-d’œuvre isolation — cuisine	h	50.60	6.00	t	2026-10-10 17:57:10.823+00	2026-10-10 17:57:10.823+00
763	8	8	Main-d’œuvre isolation — premium	h	64.29	6.00	t	2026-10-10 17:57:10.828+00	2026-10-10 17:57:10.828+00
764	8	9	Parquet contrecollé — standard	m2	66.45	\N	t	2026-10-10 17:57:10.832+00	2026-10-10 17:57:10.832+00
765	8	9	Parquet contrecollé — salle de bain	m2	64.95	\N	t	2026-10-10 17:57:10.838+00	2026-10-10 17:57:10.838+00
766	8	9	Parquet contrecollé — cuisine	m2	72.34	\N	t	2026-10-10 17:57:10.843+00	2026-10-10 17:57:10.843+00
767	8	9	Parquet contrecollé — premium	m2	80.62	\N	t	2026-10-10 17:57:10.848+00	2026-10-10 17:57:10.848+00
768	8	9	Sol vinyle clipsable — standard	m2	34.99	\N	t	2026-10-10 17:57:10.853+00	2026-10-10 17:57:10.853+00
769	8	9	Sol vinyle clipsable — salle de bain	m2	39.06	\N	t	2026-10-10 17:57:10.858+00	2026-10-10 17:57:10.858+00
770	8	9	Sol vinyle clipsable — cuisine	m2	36.20	\N	t	2026-10-10 17:57:10.863+00	2026-10-10 17:57:10.863+00
771	8	9	Sol vinyle clipsable — premium	m2	43.87	\N	t	2026-10-10 17:57:10.869+00	2026-10-10 17:57:10.869+00
772	8	9	Ragréage — standard	m2	14.09	\N	f	2026-10-10 17:57:10.874+00	2026-10-10 17:57:10.874+00
773	8	9	Ragréage — salle de bain	m2	15.85	\N	t	2026-10-10 17:57:10.879+00	2026-10-10 17:57:10.879+00
774	8	9	Ragréage — cuisine	m2	16.98	\N	t	2026-10-10 17:57:10.885+00	2026-10-10 17:57:10.885+00
775	8	9	Ragréage — premium	m2	18.33	\N	t	2026-10-10 17:57:10.89+00	2026-10-10 17:57:10.89+00
776	8	9	Plinthes bois — standard	ml	11.04	\N	t	2026-10-10 17:57:10.896+00	2026-10-10 17:57:10.896+00
777	8	9	Plinthes bois — salle de bain	ml	14.30	\N	t	2026-10-10 17:57:10.902+00	2026-10-10 17:57:10.902+00
778	8	9	Plinthes bois — cuisine	ml	12.80	\N	t	2026-10-10 17:57:10.907+00	2026-10-10 17:57:10.907+00
779	8	9	Plinthes bois — premium	ml	17.63	\N	f	2026-10-10 17:57:10.915+00	2026-10-10 17:57:10.915+00
780	8	9	Main-d’œuvre poseur de sol — standard	h	40.06	6.00	t	2026-10-10 17:57:10.922+00	2026-10-10 17:57:10.922+00
781	8	9	Main-d’œuvre poseur de sol — salle de bain	h	49.50	6.00	t	2026-10-10 17:57:10.941+00	2026-10-10 17:57:10.941+00
782	8	9	Main-d’œuvre poseur de sol — cuisine	h	51.74	6.00	t	2026-10-10 17:57:10.952+00	2026-10-10 17:57:10.952+00
783	8	9	Main-d’œuvre poseur de sol — premium	h	61.18	6.00	t	2026-10-10 17:57:10.964+00	2026-10-10 17:57:10.964+00
784	8	10	Démolition cloison — standard	m2	23.68	\N	t	2026-10-10 17:57:10.969+00	2026-10-10 17:57:10.969+00
785	8	10	Démolition cloison — salle de bain	m2	28.10	\N	t	2026-10-10 17:57:10.974+00	2026-10-10 17:57:10.974+00
786	8	10	Démolition cloison — cuisine	m2	23.98	\N	t	2026-10-10 17:57:10.979+00	2026-10-10 17:57:10.979+00
787	8	10	Démolition cloison — premium	m2	34.18	\N	t	2026-10-10 17:57:10.984+00	2026-10-10 17:57:10.984+00
788	8	10	Dépose carrelage — standard	m2	19.52	\N	t	2026-10-10 17:57:10.995+00	2026-10-10 17:57:10.995+00
789	8	10	Dépose carrelage — salle de bain	m2	19.69	\N	t	2026-10-10 17:57:11.001+00	2026-10-10 17:57:11.001+00
790	8	10	Dépose carrelage — cuisine	m2	20.64	\N	t	2026-10-10 17:57:11.016+00	2026-10-10 17:57:11.016+00
791	8	10	Dépose carrelage — premium	m2	24.68	\N	t	2026-10-10 17:57:11.023+00	2026-10-10 17:57:11.023+00
792	8	10	Évacuation gravats — standard	piece	263.42	\N	t	2026-10-10 17:57:11.03+00	2026-10-10 17:57:11.03+00
793	8	10	Évacuation gravats — salle de bain	piece	349.48	\N	t	2026-10-10 17:57:11.039+00	2026-10-10 17:57:11.039+00
794	8	10	Évacuation gravats — cuisine	piece	295.92	\N	t	2026-10-10 17:57:11.047+00	2026-10-10 17:57:11.047+00
795	8	10	Évacuation gravats — premium	piece	341.37	\N	f	2026-10-10 17:57:11.058+00	2026-10-10 17:57:11.058+00
796	8	10	Décapage sol — standard	m2	12.76	\N	t	2026-10-10 17:57:11.065+00	2026-10-10 17:57:11.065+00
797	8	10	Décapage sol — salle de bain	m2	16.40	\N	t	2026-10-10 17:57:11.077+00	2026-10-10 17:57:11.077+00
798	8	10	Décapage sol — cuisine	m2	13.93	\N	t	2026-10-10 17:57:11.091+00	2026-10-10 17:57:11.091+00
799	8	10	Décapage sol — premium	m2	18.82	\N	t	2026-10-10 17:57:11.109+00	2026-10-10 17:57:11.109+00
800	8	10	Main-d’œuvre démolition — standard	h	37.13	6.00	t	2026-10-10 17:57:11.131+00	2026-10-10 17:57:11.131+00
801	8	10	Main-d’œuvre démolition — salle de bain	h	43.54	6.00	t	2026-10-10 17:57:11.142+00	2026-10-10 17:57:11.142+00
802	8	10	Main-d’œuvre démolition — cuisine	h	40.60	6.00	t	2026-10-10 17:57:11.149+00	2026-10-10 17:57:11.149+00
803	8	10	Main-d’œuvre démolition — premium	h	52.76	6.00	t	2026-10-10 17:57:11.157+00	2026-10-10 17:57:11.157+00
804	9	1	Peinture murale 2 couches — standard	m2	18.91	\N	t	2026-10-10 17:57:11.17+00	2026-10-10 17:57:11.17+00
805	9	1	Peinture murale 2 couches — salle de bain	m2	21.96	\N	t	2026-10-10 17:57:11.176+00	2026-10-10 17:57:11.176+00
806	9	1	Peinture murale 2 couches — cuisine	m2	21.32	\N	t	2026-10-10 17:57:11.204+00	2026-10-10 17:57:11.204+00
807	9	1	Peinture murale 2 couches — premium	m2	26.43	\N	t	2026-10-10 17:57:11.211+00	2026-10-10 17:57:11.211+00
808	9	1	Peinture plafond — standard	m2	21.46	\N	t	2026-10-10 17:57:11.218+00	2026-10-10 17:57:11.218+00
809	9	1	Peinture plafond — salle de bain	m2	25.34	\N	t	2026-10-10 17:57:11.227+00	2026-10-10 17:57:11.227+00
810	9	1	Peinture plafond — cuisine	m2	23.23	\N	t	2026-10-10 17:57:11.239+00	2026-10-10 17:57:11.239+00
811	9	1	Peinture plafond — premium	m2	31.31	\N	t	2026-10-10 17:57:11.245+00	2026-10-10 17:57:11.245+00
812	9	1	Laquage boiseries — standard	ml	13.59	\N	t	2026-10-10 17:57:11.257+00	2026-10-10 17:57:11.257+00
813	9	1	Laquage boiseries — salle de bain	ml	17.31	\N	t	2026-10-10 17:57:11.264+00	2026-10-10 17:57:11.264+00
814	9	1	Laquage boiseries — cuisine	ml	16.72	\N	t	2026-10-10 17:57:11.273+00	2026-10-10 17:57:11.273+00
815	9	1	Laquage boiseries — premium	ml	19.90	\N	t	2026-10-10 17:57:11.278+00	2026-10-10 17:57:11.278+00
816	9	1	Enduit de lissage — standard	m2	11.84	\N	t	2026-10-10 17:57:11.284+00	2026-10-10 17:57:11.284+00
817	9	1	Enduit de lissage — salle de bain	m2	13.81	\N	t	2026-10-10 17:57:11.289+00	2026-10-10 17:57:11.289+00
818	9	1	Enduit de lissage — cuisine	m2	13.86	\N	f	2026-10-10 17:57:11.294+00	2026-10-10 17:57:11.294+00
819	9	1	Enduit de lissage — premium	m2	17.74	\N	t	2026-10-10 17:57:11.3+00	2026-10-10 17:57:11.3+00
820	9	1	Main-d’œuvre peintre — standard	h	41.98	6.00	t	2026-10-10 17:57:11.308+00	2026-10-10 17:57:11.308+00
821	9	1	Main-d’œuvre peintre — salle de bain	h	53.64	6.00	t	2026-10-10 17:57:11.313+00	2026-10-10 17:57:11.313+00
822	9	1	Main-d’œuvre peintre — cuisine	h	47.58	6.00	t	2026-10-10 17:57:11.318+00	2026-10-10 17:57:11.318+00
823	9	1	Main-d’œuvre peintre — premium	h	56.90	6.00	t	2026-10-10 17:57:11.323+00	2026-10-10 17:57:11.323+00
824	9	2	Pose carrelage sol — standard	m2	44.74	\N	t	2026-10-10 17:57:11.328+00	2026-10-10 17:57:11.328+00
825	9	2	Pose carrelage sol — salle de bain	m2	53.66	\N	t	2026-10-10 17:57:11.334+00	2026-10-10 17:57:11.334+00
826	9	2	Pose carrelage sol — cuisine	m2	56.37	\N	t	2026-10-10 17:57:11.34+00	2026-10-10 17:57:11.34+00
827	9	2	Pose carrelage sol — premium	m2	59.74	\N	f	2026-10-10 17:57:11.345+00	2026-10-10 17:57:11.345+00
828	9	2	Pose faïence murale — standard	m2	55.69	\N	t	2026-10-10 17:57:11.35+00	2026-10-10 17:57:11.35+00
829	9	2	Pose faïence murale — salle de bain	m2	57.93	\N	t	2026-10-10 17:57:11.355+00	2026-10-10 17:57:11.355+00
830	9	2	Pose faïence murale — cuisine	m2	55.99	\N	t	2026-10-10 17:57:11.361+00	2026-10-10 17:57:11.361+00
831	9	2	Pose faïence murale — premium	m2	76.38	\N	t	2026-10-10 17:57:11.366+00	2026-10-10 17:57:11.366+00
832	9	2	Plinthes carrelées — standard	ml	16.43	\N	t	2026-10-10 17:57:11.375+00	2026-10-10 17:57:11.375+00
833	9	2	Plinthes carrelées — salle de bain	ml	18.14	\N	t	2026-10-10 17:57:11.385+00	2026-10-10 17:57:11.385+00
834	9	2	Plinthes carrelées — cuisine	ml	16.33	\N	t	2026-10-10 17:57:11.395+00	2026-10-10 17:57:11.395+00
835	9	2	Plinthes carrelées — premium	ml	21.84	\N	t	2026-10-10 17:57:11.403+00	2026-10-10 17:57:11.403+00
836	9	2	Joints époxy — standard	m2	10.27	\N	t	2026-10-10 17:57:11.41+00	2026-10-10 17:57:11.41+00
837	9	2	Joints époxy — salle de bain	m2	11.42	\N	t	2026-10-10 17:57:11.428+00	2026-10-10 17:57:11.428+00
838	9	2	Joints époxy — cuisine	m2	12.53	\N	t	2026-10-10 17:57:11.433+00	2026-10-10 17:57:11.433+00
839	9	2	Joints époxy — premium	m2	13.65	\N	t	2026-10-10 17:57:11.445+00	2026-10-10 17:57:11.445+00
840	9	2	Main-d’œuvre carreleur — standard	h	49.67	6.00	t	2026-10-10 17:57:11.471+00	2026-10-10 17:57:11.471+00
841	9	2	Main-d’œuvre carreleur — salle de bain	h	59.60	6.00	t	2026-10-10 17:57:11.479+00	2026-10-10 17:57:11.479+00
842	9	2	Main-d’œuvre carreleur — cuisine	h	54.18	6.00	t	2026-10-10 17:57:11.489+00	2026-10-10 17:57:11.489+00
843	9	2	Main-d’œuvre carreleur — premium	h	67.56	6.00	t	2026-10-10 17:57:11.494+00	2026-10-10 17:57:11.494+00
844	9	3	Pose WC suspendu — standard	piece	386.92	\N	t	2026-10-10 17:57:11.498+00	2026-10-10 17:57:11.498+00
845	9	3	Pose WC suspendu — salle de bain	piece	435.30	\N	t	2026-10-10 17:57:11.517+00	2026-10-10 17:57:11.517+00
846	9	3	Pose WC suspendu — cuisine	piece	452.70	\N	t	2026-10-10 17:57:11.527+00	2026-10-10 17:57:11.527+00
847	9	3	Pose WC suspendu — premium	piece	542.79	\N	t	2026-10-10 17:57:11.531+00	2026-10-10 17:57:11.531+00
848	9	3	Pose lavabo — standard	piece	274.48	\N	t	2026-10-10 17:57:11.547+00	2026-10-10 17:57:11.547+00
849	9	3	Pose lavabo — salle de bain	piece	316.31	\N	t	2026-10-10 17:57:11.554+00	2026-10-10 17:57:11.554+00
850	9	3	Pose lavabo — cuisine	piece	309.81	\N	t	2026-10-10 17:57:11.56+00	2026-10-10 17:57:11.56+00
851	9	3	Pose lavabo — premium	piece	340.26	\N	t	2026-10-10 17:57:11.568+00	2026-10-10 17:57:11.568+00
852	9	3	Tuyauterie multicouche — standard	ml	25.31	\N	t	2026-10-10 17:57:11.573+00	2026-10-10 17:57:11.573+00
853	9	3	Tuyauterie multicouche — salle de bain	ml	30.52	\N	t	2026-10-10 17:57:11.58+00	2026-10-10 17:57:11.58+00
854	9	3	Tuyauterie multicouche — cuisine	ml	29.58	\N	t	2026-10-10 17:57:11.589+00	2026-10-10 17:57:11.589+00
855	9	3	Tuyauterie multicouche — premium	ml	36.00	\N	t	2026-10-10 17:57:11.596+00	2026-10-10 17:57:11.596+00
856	9	3	Remplacement chauffe-eau — standard	piece	622.72	\N	t	2026-10-10 17:57:11.605+00	2026-10-10 17:57:11.605+00
857	9	3	Remplacement chauffe-eau — salle de bain	piece	818.21	\N	t	2026-10-10 17:57:11.614+00	2026-10-10 17:57:11.614+00
858	9	3	Remplacement chauffe-eau — cuisine	piece	727.56	\N	t	2026-10-10 17:57:11.624+00	2026-10-10 17:57:11.624+00
859	9	3	Remplacement chauffe-eau — premium	piece	968.33	\N	t	2026-10-10 17:57:11.63+00	2026-10-10 17:57:11.63+00
860	9	3	Main-d’œuvre plombier — standard	h	58.60	6.00	t	2026-10-10 17:57:11.637+00	2026-10-10 17:57:11.637+00
861	9	3	Main-d’œuvre plombier — salle de bain	h	57.80	6.00	t	2026-10-10 17:57:11.645+00	2026-10-10 17:57:11.645+00
862	9	3	Main-d’œuvre plombier — cuisine	h	64.04	6.00	t	2026-10-10 17:57:11.657+00	2026-10-10 17:57:11.657+00
863	9	3	Main-d’œuvre plombier — premium	h	73.67	6.00	t	2026-10-10 17:57:11.663+00	2026-10-10 17:57:11.663+00
864	9	4	Point lumineux — standard	piece	81.66	\N	t	2026-10-10 17:57:11.673+00	2026-10-10 17:57:11.673+00
865	9	4	Point lumineux — salle de bain	piece	105.84	\N	t	2026-10-10 17:57:11.682+00	2026-10-10 17:57:11.682+00
866	9	4	Point lumineux — cuisine	piece	95.82	\N	t	2026-10-10 17:57:11.687+00	2026-10-10 17:57:11.687+00
867	9	4	Point lumineux — premium	piece	123.98	\N	t	2026-10-10 17:57:11.692+00	2026-10-10 17:57:11.692+00
868	9	4	Prise de courant — standard	piece	71.27	\N	t	2026-10-10 17:57:11.697+00	2026-10-10 17:57:11.697+00
869	9	4	Prise de courant — salle de bain	piece	78.34	\N	t	2026-10-10 17:57:11.703+00	2026-10-10 17:57:11.703+00
870	9	4	Prise de courant — cuisine	piece	69.32	\N	f	2026-10-10 17:57:11.708+00	2026-10-10 17:57:11.708+00
871	9	4	Prise de courant — premium	piece	81.91	\N	t	2026-10-10 17:57:11.712+00	2026-10-10 17:57:11.712+00
872	9	4	Câblage encastré — standard	ml	19.02	\N	t	2026-10-10 17:57:11.717+00	2026-10-10 17:57:11.717+00
873	9	4	Câblage encastré — salle de bain	ml	22.58	\N	t	2026-10-10 17:57:11.723+00	2026-10-10 17:57:11.723+00
874	9	4	Câblage encastré — cuisine	ml	20.85	\N	t	2026-10-10 17:57:11.728+00	2026-10-10 17:57:11.728+00
875	9	4	Câblage encastré — premium	ml	27.15	\N	t	2026-10-10 17:57:11.733+00	2026-10-10 17:57:11.733+00
876	9	4	Tableau électrique — standard	piece	998.46	\N	t	2026-10-10 17:57:11.738+00	2026-10-10 17:57:11.738+00
877	9	4	Tableau électrique — salle de bain	piece	1044.09	\N	t	2026-10-10 17:57:11.742+00	2026-10-10 17:57:11.742+00
878	9	4	Tableau électrique — cuisine	piece	1133.66	\N	t	2026-10-10 17:57:11.747+00	2026-10-10 17:57:11.747+00
879	9	4	Tableau électrique — premium	piece	1311.01	\N	t	2026-10-10 17:57:11.751+00	2026-10-10 17:57:11.751+00
880	9	4	Main-d’œuvre électricien — standard	h	54.58	6.00	t	2026-10-10 17:57:11.757+00	2026-10-10 17:57:11.757+00
881	9	4	Main-d’œuvre électricien — salle de bain	h	68.61	6.00	t	2026-10-10 17:57:11.763+00	2026-10-10 17:57:11.763+00
882	9	4	Main-d’œuvre électricien — cuisine	h	61.32	6.00	t	2026-10-10 17:57:11.768+00	2026-10-10 17:57:11.768+00
883	9	4	Main-d’œuvre électricien — premium	h	68.54	6.00	t	2026-10-10 17:57:11.773+00	2026-10-10 17:57:11.773+00
884	9	5	Mur en blocs — standard	m2	78.95	\N	t	2026-10-10 17:57:11.781+00	2026-10-10 17:57:11.781+00
885	9	5	Mur en blocs — salle de bain	m2	80.44	\N	t	2026-10-10 17:57:11.788+00	2026-10-10 17:57:11.788+00
886	9	5	Mur en blocs — cuisine	m2	79.08	\N	t	2026-10-10 17:57:11.794+00	2026-10-10 17:57:11.794+00
887	9	5	Mur en blocs — premium	m2	92.73	\N	t	2026-10-10 17:57:11.801+00	2026-10-10 17:57:11.801+00
888	9	5	Chape ciment — standard	m2	35.04	\N	t	2026-10-10 17:57:11.807+00	2026-10-10 17:57:11.807+00
889	9	5	Chape ciment — salle de bain	m2	34.40	\N	t	2026-10-10 17:57:11.812+00	2026-10-10 17:57:11.812+00
890	9	5	Chape ciment — cuisine	m2	33.94	\N	t	2026-10-10 17:57:11.817+00	2026-10-10 17:57:11.817+00
891	9	5	Chape ciment — premium	m2	45.56	\N	t	2026-10-10 17:57:11.824+00	2026-10-10 17:57:11.824+00
892	9	5	Ouverture de baie — standard	piece	1588.27	\N	t	2026-10-10 17:57:11.83+00	2026-10-10 17:57:11.83+00
893	9	5	Ouverture de baie — salle de bain	piece	1604.49	\N	t	2026-10-10 17:57:11.836+00	2026-10-10 17:57:11.836+00
894	9	5	Ouverture de baie — cuisine	piece	1505.72	\N	t	2026-10-10 17:57:11.841+00	2026-10-10 17:57:11.841+00
895	9	5	Ouverture de baie — premium	piece	1868.40	\N	t	2026-10-10 17:57:11.849+00	2026-10-10 17:57:11.849+00
896	9	5	Rejointoyage façade — standard	m2	39.03	\N	t	2026-10-10 17:57:11.857+00	2026-10-10 17:57:11.857+00
897	9	5	Rejointoyage façade — salle de bain	m2	40.45	\N	t	2026-10-10 17:57:11.865+00	2026-10-10 17:57:11.865+00
898	9	5	Rejointoyage façade — cuisine	m2	45.22	\N	t	2026-10-10 17:57:11.876+00	2026-10-10 17:57:11.876+00
899	9	5	Rejointoyage façade — premium	m2	48.31	\N	t	2026-10-10 17:57:11.883+00	2026-10-10 17:57:11.883+00
900	9	5	Main-d’œuvre maçon — standard	h	49.83	6.00	t	2026-10-10 17:57:11.891+00	2026-10-10 17:57:11.891+00
901	9	5	Main-d’œuvre maçon — salle de bain	h	52.12	6.00	t	2026-10-10 17:57:11.899+00	2026-10-10 17:57:11.899+00
902	9	5	Main-d’œuvre maçon — cuisine	h	49.76	6.00	t	2026-10-10 17:57:11.907+00	2026-10-10 17:57:11.907+00
903	9	5	Main-d’œuvre maçon — premium	h	67.01	6.00	t	2026-10-10 17:57:11.915+00	2026-10-10 17:57:11.915+00
904	9	6	Pose porte intérieure — standard	piece	342.24	\N	t	2026-10-10 17:57:11.92+00	2026-10-10 17:57:11.92+00
905	9	6	Pose porte intérieure — salle de bain	piece	341.04	\N	t	2026-10-10 17:57:11.925+00	2026-10-10 17:57:11.925+00
906	9	6	Pose porte intérieure — cuisine	piece	360.53	\N	t	2026-10-10 17:57:11.931+00	2026-10-10 17:57:11.931+00
907	9	6	Pose porte intérieure — premium	piece	470.08	\N	t	2026-10-10 17:57:11.947+00	2026-10-10 17:57:11.947+00
908	9	6	Pose châssis — standard	piece	759.33	\N	t	2026-10-10 17:57:11.955+00	2026-10-10 17:57:11.955+00
909	9	6	Pose châssis — salle de bain	piece	923.10	\N	t	2026-10-10 17:57:11.962+00	2026-10-10 17:57:11.962+00
910	9	6	Pose châssis — cuisine	piece	841.79	\N	t	2026-10-10 17:57:11.972+00	2026-10-10 17:57:11.972+00
911	9	6	Pose châssis — premium	piece	1027.97	\N	t	2026-10-10 17:57:11.987+00	2026-10-10 17:57:11.987+00
912	9	6	Habillage escalier — standard	piece	1868.12	\N	t	2026-10-10 17:57:11.995+00	2026-10-10 17:57:11.995+00
913	9	6	Habillage escalier — salle de bain	piece	2339.74	\N	t	2026-10-10 17:57:12.003+00	2026-10-10 17:57:12.003+00
914	9	6	Habillage escalier — cuisine	piece	2267.83	\N	t	2026-10-10 17:57:12.009+00	2026-10-10 17:57:12.009+00
915	9	6	Habillage escalier — premium	piece	2635.06	\N	t	2026-10-10 17:57:12.014+00	2026-10-10 17:57:12.014+00
916	9	6	Placard sur mesure — standard	ml	390.78	\N	t	2026-10-10 17:57:12.019+00	2026-10-10 17:57:12.019+00
917	9	6	Placard sur mesure — salle de bain	ml	509.14	\N	t	2026-10-10 17:57:12.024+00	2026-10-10 17:57:12.024+00
918	9	6	Placard sur mesure — cuisine	ml	421.39	\N	t	2026-10-10 17:57:12.031+00	2026-10-10 17:57:12.031+00
919	9	6	Placard sur mesure — premium	ml	514.30	\N	t	2026-10-10 17:57:12.036+00	2026-10-10 17:57:12.036+00
920	9	6	Main-d’œuvre menuisier — standard	h	51.25	6.00	t	2026-10-10 17:57:12.042+00	2026-10-10 17:57:12.042+00
921	9	6	Main-d’œuvre menuisier — salle de bain	h	60.88	6.00	t	2026-10-10 17:57:12.048+00	2026-10-10 17:57:12.048+00
922	9	6	Main-d’œuvre menuisier — cuisine	h	58.25	6.00	t	2026-10-10 17:57:12.057+00	2026-10-10 17:57:12.057+00
923	9	6	Main-d’œuvre menuisier — premium	h	72.85	6.00	t	2026-10-10 17:57:12.064+00	2026-10-10 17:57:12.064+00
924	9	7	Couverture tuiles — standard	m2	92.34	\N	t	2026-10-10 17:57:12.077+00	2026-10-10 17:57:12.077+00
925	9	7	Couverture tuiles — salle de bain	m2	102.39	\N	t	2026-10-10 17:57:12.083+00	2026-10-10 17:57:12.083+00
926	9	7	Couverture tuiles — cuisine	m2	112.36	\N	t	2026-10-10 17:57:12.095+00	2026-10-10 17:57:12.095+00
927	9	7	Couverture tuiles — premium	m2	124.80	\N	t	2026-10-10 17:57:12.1+00	2026-10-10 17:57:12.1+00
928	9	7	Membrane EPDM — standard	m2	65.13	\N	t	2026-10-10 17:57:12.109+00	2026-10-10 17:57:12.109+00
929	9	7	Membrane EPDM — salle de bain	m2	74.26	\N	t	2026-10-10 17:57:12.14+00	2026-10-10 17:57:12.14+00
930	9	7	Membrane EPDM — cuisine	m2	80.77	\N	t	2026-10-10 17:57:12.147+00	2026-10-10 17:57:12.147+00
931	9	7	Membrane EPDM — premium	m2	90.75	\N	t	2026-10-10 17:57:12.153+00	2026-10-10 17:57:12.153+00
932	9	7	Gouttière zinc — standard	ml	56.67	\N	f	2026-10-10 17:57:12.158+00	2026-10-10 17:57:12.158+00
933	9	7	Gouttière zinc — salle de bain	ml	64.37	\N	t	2026-10-10 17:57:12.163+00	2026-10-10 17:57:12.163+00
934	9	7	Gouttière zinc — cuisine	ml	57.89	\N	t	2026-10-10 17:57:12.169+00	2026-10-10 17:57:12.169+00
935	9	7	Gouttière zinc — premium	ml	73.66	\N	t	2026-10-10 17:57:12.175+00	2026-10-10 17:57:12.175+00
936	9	7	Velux — standard	piece	1241.55	\N	t	2026-10-10 17:57:12.191+00	2026-10-10 17:57:12.191+00
937	9	7	Velux — salle de bain	piece	1319.71	\N	t	2026-10-10 17:57:12.197+00	2026-10-10 17:57:12.197+00
938	9	7	Velux — cuisine	piece	1387.02	\N	t	2026-10-10 17:57:12.202+00	2026-10-10 17:57:12.202+00
939	9	7	Velux — premium	piece	1548.56	\N	f	2026-10-10 17:57:12.214+00	2026-10-10 17:57:12.214+00
940	9	7	Main-d’œuvre couvreur — standard	h	63.30	6.00	t	2026-10-10 17:57:12.238+00	2026-10-10 17:57:12.238+00
941	9	7	Main-d’œuvre couvreur — salle de bain	h	66.40	6.00	t	2026-10-10 17:57:12.244+00	2026-10-10 17:57:12.244+00
942	9	7	Main-d’œuvre couvreur — cuisine	h	69.98	6.00	t	2026-10-10 17:57:12.255+00	2026-10-10 17:57:12.255+00
943	9	7	Main-d’œuvre couvreur — premium	h	76.13	6.00	t	2026-10-10 17:57:12.264+00	2026-10-10 17:57:12.264+00
944	9	8	Isolation laine de verre — standard	m2	28.50	\N	t	2026-10-10 17:57:12.28+00	2026-10-10 17:57:12.28+00
945	9	8	Isolation laine de verre — salle de bain	m2	30.72	\N	t	2026-10-10 17:57:12.288+00	2026-10-10 17:57:12.288+00
946	9	8	Isolation laine de verre — cuisine	m2	27.25	\N	t	2026-10-10 17:57:12.295+00	2026-10-10 17:57:12.295+00
947	9	8	Isolation laine de verre — premium	m2	34.02	\N	t	2026-10-10 17:57:12.313+00	2026-10-10 17:57:12.313+00
948	9	8	Isolation PIR toiture — standard	m2	47.02	\N	t	2026-10-10 17:57:12.318+00	2026-10-10 17:57:12.318+00
949	9	8	Isolation PIR toiture — salle de bain	m2	51.85	\N	t	2026-10-10 17:57:12.323+00	2026-10-10 17:57:12.323+00
950	9	8	Isolation PIR toiture — cuisine	m2	48.31	\N	t	2026-10-10 17:57:12.329+00	2026-10-10 17:57:12.329+00
951	9	8	Isolation PIR toiture — premium	m2	63.66	\N	t	2026-10-10 17:57:12.335+00	2026-10-10 17:57:12.335+00
952	9	8	Isolation façade ETICS — standard	m2	123.78	\N	t	2026-10-10 17:57:12.34+00	2026-10-10 17:57:12.34+00
953	9	8	Isolation façade ETICS — salle de bain	m2	132.44	\N	t	2026-10-10 17:57:12.344+00	2026-10-10 17:57:12.344+00
954	9	8	Isolation façade ETICS — cuisine	m2	129.64	\N	t	2026-10-10 17:57:12.351+00	2026-10-10 17:57:12.351+00
955	9	8	Isolation façade ETICS — premium	m2	149.24	\N	t	2026-10-10 17:57:12.356+00	2026-10-10 17:57:12.356+00
956	9	8	Pare-vapeur — standard	m2	8.38	\N	t	2026-10-10 17:57:12.362+00	2026-10-10 17:57:12.362+00
957	9	8	Pare-vapeur — salle de bain	m2	10.85	\N	t	2026-10-10 17:57:12.368+00	2026-10-10 17:57:12.368+00
958	9	8	Pare-vapeur — cuisine	m2	9.41	\N	t	2026-10-10 17:57:12.373+00	2026-10-10 17:57:12.373+00
959	9	8	Pare-vapeur — premium	m2	11.48	\N	t	2026-10-10 17:57:12.396+00	2026-10-10 17:57:12.396+00
960	9	8	Main-d’œuvre isolation — standard	h	47.36	6.00	t	2026-10-10 17:57:12.402+00	2026-10-10 17:57:12.402+00
961	9	8	Main-d’œuvre isolation — salle de bain	h	52.95	6.00	t	2026-10-10 17:57:12.42+00	2026-10-10 17:57:12.42+00
962	9	8	Main-d’œuvre isolation — cuisine	h	50.31	6.00	t	2026-10-10 17:57:12.424+00	2026-10-10 17:57:12.424+00
963	9	8	Main-d’œuvre isolation — premium	h	58.63	6.00	t	2026-10-10 17:57:12.431+00	2026-10-10 17:57:12.431+00
964	9	9	Parquet contrecollé — standard	m2	59.35	\N	t	2026-10-10 17:57:12.436+00	2026-10-10 17:57:12.436+00
965	9	9	Parquet contrecollé — salle de bain	m2	64.22	\N	t	2026-10-10 17:57:12.441+00	2026-10-10 17:57:12.441+00
966	9	9	Parquet contrecollé — cuisine	m2	73.87	\N	t	2026-10-10 17:57:12.449+00	2026-10-10 17:57:12.449+00
967	9	9	Parquet contrecollé — premium	m2	88.91	\N	t	2026-10-10 17:57:12.464+00	2026-10-10 17:57:12.464+00
968	9	9	Sol vinyle clipsable — standard	m2	32.08	\N	t	2026-10-10 17:57:12.47+00	2026-10-10 17:57:12.47+00
969	9	9	Sol vinyle clipsable — salle de bain	m2	41.88	\N	t	2026-10-10 17:57:12.476+00	2026-10-10 17:57:12.476+00
970	9	9	Sol vinyle clipsable — cuisine	m2	39.33	\N	t	2026-10-10 17:57:12.482+00	2026-10-10 17:57:12.482+00
971	9	9	Sol vinyle clipsable — premium	m2	45.60	\N	t	2026-10-10 17:57:12.487+00	2026-10-10 17:57:12.487+00
972	9	9	Ragréage — standard	m2	15.39	\N	t	2026-10-10 17:57:12.492+00	2026-10-10 17:57:12.492+00
973	9	9	Ragréage — salle de bain	m2	17.03	\N	t	2026-10-10 17:57:12.498+00	2026-10-10 17:57:12.498+00
974	9	9	Ragréage — cuisine	m2	17.82	\N	t	2026-10-10 17:57:12.504+00	2026-10-10 17:57:12.504+00
975	9	9	Ragréage — premium	m2	20.30	\N	t	2026-10-10 17:57:12.511+00	2026-10-10 17:57:12.511+00
976	9	9	Plinthes bois — standard	ml	11.81	\N	t	2026-10-10 17:57:12.521+00	2026-10-10 17:57:12.521+00
977	9	9	Plinthes bois — salle de bain	ml	15.11	\N	t	2026-10-10 17:57:12.529+00	2026-10-10 17:57:12.529+00
978	9	9	Plinthes bois — cuisine	ml	12.97	\N	t	2026-10-10 17:57:12.537+00	2026-10-10 17:57:12.537+00
979	9	9	Plinthes bois — premium	ml	15.75	\N	t	2026-10-10 17:57:12.543+00	2026-10-10 17:57:12.543+00
980	9	9	Main-d’œuvre poseur de sol — standard	h	39.87	6.00	t	2026-10-10 17:57:12.556+00	2026-10-10 17:57:12.556+00
981	9	9	Main-d’œuvre poseur de sol — salle de bain	h	50.02	6.00	t	2026-10-10 17:57:12.563+00	2026-10-10 17:57:12.563+00
982	9	9	Main-d’œuvre poseur de sol — cuisine	h	48.80	6.00	f	2026-10-10 17:57:12.575+00	2026-10-10 17:57:12.575+00
983	9	9	Main-d’œuvre poseur de sol — premium	h	54.87	6.00	t	2026-10-10 17:57:12.582+00	2026-10-10 17:57:12.582+00
984	9	10	Démolition cloison — standard	m2	24.85	\N	t	2026-10-10 17:57:12.597+00	2026-10-10 17:57:12.597+00
985	9	10	Démolition cloison — salle de bain	m2	28.12	\N	t	2026-10-10 17:57:12.609+00	2026-10-10 17:57:12.609+00
986	9	10	Démolition cloison — cuisine	m2	27.94	\N	t	2026-10-10 17:57:12.618+00	2026-10-10 17:57:12.618+00
987	9	10	Démolition cloison — premium	m2	35.54	\N	t	2026-10-10 17:57:12.627+00	2026-10-10 17:57:12.627+00
988	9	10	Dépose carrelage — standard	m2	17.14	\N	t	2026-10-10 17:57:12.642+00	2026-10-10 17:57:12.642+00
989	9	10	Dépose carrelage — salle de bain	m2	23.55	\N	t	2026-10-10 17:57:12.655+00	2026-10-10 17:57:12.655+00
990	9	10	Dépose carrelage — cuisine	m2	20.87	\N	t	2026-10-10 17:57:12.671+00	2026-10-10 17:57:12.671+00
991	9	10	Dépose carrelage — premium	m2	25.42	\N	t	2026-10-10 17:57:12.695+00	2026-10-10 17:57:12.695+00
992	9	10	Évacuation gravats — standard	piece	306.68	\N	t	2026-10-10 17:57:12.711+00	2026-10-10 17:57:12.711+00
993	9	10	Évacuation gravats — salle de bain	piece	342.22	\N	f	2026-10-10 17:57:12.716+00	2026-10-10 17:57:12.716+00
994	9	10	Évacuation gravats — cuisine	piece	328.12	\N	t	2026-10-10 17:57:12.722+00	2026-10-10 17:57:12.722+00
995	9	10	Évacuation gravats — premium	piece	403.62	\N	t	2026-10-10 17:57:12.727+00	2026-10-10 17:57:12.727+00
996	9	10	Décapage sol — standard	m2	12.07	\N	t	2026-10-10 17:57:12.734+00	2026-10-10 17:57:12.734+00
997	9	10	Décapage sol — salle de bain	m2	15.48	\N	t	2026-10-10 17:57:12.746+00	2026-10-10 17:57:12.746+00
998	9	10	Décapage sol — cuisine	m2	13.84	\N	t	2026-10-10 17:57:12.764+00	2026-10-10 17:57:12.764+00
999	9	10	Décapage sol — premium	m2	16.46	\N	t	2026-10-10 17:57:12.77+00	2026-10-10 17:57:12.77+00
1000	9	10	Main-d’œuvre démolition — standard	h	38.07	6.00	t	2026-10-10 17:57:12.775+00	2026-10-10 17:57:12.775+00
1001	9	10	Main-d’œuvre démolition — salle de bain	h	44.70	6.00	t	2026-10-10 17:57:12.78+00	2026-10-10 17:57:12.78+00
1002	9	10	Main-d’œuvre démolition — cuisine	h	47.81	6.00	t	2026-10-10 17:57:12.785+00	2026-10-10 17:57:12.785+00
1003	9	10	Main-d’œuvre démolition — premium	h	52.51	6.00	t	2026-10-10 17:57:12.79+00	2026-10-10 17:57:12.79+00
1004	10	1	Peinture murale 2 couches — standard	m2	17.97	\N	t	2026-10-10 17:57:12.803+00	2026-10-10 17:57:12.803+00
1005	10	1	Peinture murale 2 couches — salle de bain	m2	21.14	\N	t	2026-10-10 17:57:12.809+00	2026-10-10 17:57:12.809+00
1006	10	1	Peinture murale 2 couches — cuisine	m2	19.82	\N	t	2026-10-10 17:57:12.824+00	2026-10-10 17:57:12.824+00
1007	10	1	Peinture murale 2 couches — premium	m2	22.23	\N	f	2026-10-10 17:57:12.831+00	2026-10-10 17:57:12.831+00
1008	10	1	Peinture plafond — standard	m2	23.91	\N	t	2026-10-10 17:57:12.837+00	2026-10-10 17:57:12.837+00
1009	10	1	Peinture plafond — salle de bain	m2	25.85	\N	t	2026-10-10 17:57:12.857+00	2026-10-10 17:57:12.857+00
1010	10	1	Peinture plafond — cuisine	m2	22.16	\N	t	2026-10-10 17:57:12.862+00	2026-10-10 17:57:12.862+00
1011	10	1	Peinture plafond — premium	m2	31.77	\N	t	2026-10-10 17:57:12.868+00	2026-10-10 17:57:12.868+00
1012	10	1	Laquage boiseries — standard	ml	15.29	\N	t	2026-10-10 17:57:12.873+00	2026-10-10 17:57:12.873+00
1013	10	1	Laquage boiseries — salle de bain	ml	15.02	\N	t	2026-10-10 17:57:12.881+00	2026-10-10 17:57:12.881+00
1014	10	1	Laquage boiseries — cuisine	ml	15.38	\N	t	2026-10-10 17:57:12.891+00	2026-10-10 17:57:12.891+00
1015	10	1	Laquage boiseries — premium	ml	19.21	\N	t	2026-10-10 17:57:12.895+00	2026-10-10 17:57:12.895+00
1016	10	1	Enduit de lissage — standard	m2	11.03	\N	t	2026-10-10 17:57:12.902+00	2026-10-10 17:57:12.902+00
1017	10	1	Enduit de lissage — salle de bain	m2	13.03	\N	t	2026-10-10 17:57:12.912+00	2026-10-10 17:57:12.912+00
1018	10	1	Enduit de lissage — cuisine	m2	13.48	\N	t	2026-10-10 17:57:12.923+00	2026-10-10 17:57:12.923+00
1019	10	1	Enduit de lissage — premium	m2	15.25	\N	t	2026-10-10 17:57:12.944+00	2026-10-10 17:57:12.944+00
1020	10	1	Main-d’œuvre peintre — standard	h	44.85	6.00	f	2026-10-10 17:57:12.951+00	2026-10-10 17:57:12.951+00
1021	10	1	Main-d’œuvre peintre — salle de bain	h	55.93	6.00	t	2026-10-10 17:57:12.968+00	2026-10-10 17:57:12.968+00
1022	10	1	Main-d’œuvre peintre — cuisine	h	51.30	6.00	t	2026-10-10 17:57:13.006+00	2026-10-10 17:57:13.006+00
1023	10	1	Main-d’œuvre peintre — premium	h	62.16	6.00	t	2026-10-10 17:57:13.021+00	2026-10-10 17:57:13.021+00
1024	10	2	Pose carrelage sol — standard	m2	50.41	\N	t	2026-10-10 17:57:13.029+00	2026-10-10 17:57:13.029+00
1025	10	2	Pose carrelage sol — salle de bain	m2	59.71	\N	t	2026-10-10 17:57:13.04+00	2026-10-10 17:57:13.04+00
1026	10	2	Pose carrelage sol — cuisine	m2	57.21	\N	t	2026-10-10 17:57:13.047+00	2026-10-10 17:57:13.047+00
1027	10	2	Pose carrelage sol — premium	m2	60.45	\N	t	2026-10-10 17:57:13.057+00	2026-10-10 17:57:13.057+00
1028	10	2	Pose faïence murale — standard	m2	51.99	\N	t	2026-10-10 17:57:13.069+00	2026-10-10 17:57:13.069+00
1029	10	2	Pose faïence murale — salle de bain	m2	62.77	\N	t	2026-10-10 17:57:13.077+00	2026-10-10 17:57:13.077+00
1030	10	2	Pose faïence murale — cuisine	m2	59.50	\N	t	2026-10-10 17:57:13.083+00	2026-10-10 17:57:13.083+00
1031	10	2	Pose faïence murale — premium	m2	64.54	\N	t	2026-10-10 17:57:13.092+00	2026-10-10 17:57:13.092+00
1032	10	2	Plinthes carrelées — standard	ml	15.84	\N	t	2026-10-10 17:57:13.099+00	2026-10-10 17:57:13.099+00
1033	10	2	Plinthes carrelées — salle de bain	ml	19.84	\N	t	2026-10-10 17:57:13.106+00	2026-10-10 17:57:13.106+00
1034	10	2	Plinthes carrelées — cuisine	ml	19.22	\N	t	2026-10-10 17:57:13.112+00	2026-10-10 17:57:13.112+00
1035	10	2	Plinthes carrelées — premium	ml	19.77	\N	f	2026-10-10 17:57:13.118+00	2026-10-10 17:57:13.118+00
1036	10	2	Joints époxy — standard	m2	10.16	\N	t	2026-10-10 17:57:13.123+00	2026-10-10 17:57:13.123+00
1037	10	2	Joints époxy — salle de bain	m2	12.22	\N	t	2026-10-10 17:57:13.128+00	2026-10-10 17:57:13.128+00
1038	10	2	Joints époxy — cuisine	m2	11.65	\N	t	2026-10-10 17:57:13.142+00	2026-10-10 17:57:13.142+00
1039	10	2	Joints époxy — premium	m2	14.18	\N	t	2026-10-10 17:57:13.158+00	2026-10-10 17:57:13.158+00
1040	10	2	Main-d’œuvre carreleur — standard	h	49.28	6.00	t	2026-10-10 17:57:13.164+00	2026-10-10 17:57:13.164+00
1041	10	2	Main-d’œuvre carreleur — salle de bain	h	51.56	6.00	t	2026-10-10 17:57:13.175+00	2026-10-10 17:57:13.175+00
1042	10	2	Main-d’œuvre carreleur — cuisine	h	57.34	6.00	t	2026-10-10 17:57:13.182+00	2026-10-10 17:57:13.182+00
1043	10	2	Main-d’œuvre carreleur — premium	h	64.70	6.00	t	2026-10-10 17:57:13.191+00	2026-10-10 17:57:13.191+00
1044	10	3	Pose WC suspendu — standard	piece	379.64	\N	t	2026-10-10 17:57:13.199+00	2026-10-10 17:57:13.199+00
1045	10	3	Pose WC suspendu — salle de bain	piece	460.25	\N	t	2026-10-10 17:57:13.208+00	2026-10-10 17:57:13.208+00
1046	10	3	Pose WC suspendu — cuisine	piece	497.75	\N	t	2026-10-10 17:57:13.215+00	2026-10-10 17:57:13.215+00
1047	10	3	Pose WC suspendu — premium	piece	567.63	\N	t	2026-10-10 17:57:13.223+00	2026-10-10 17:57:13.223+00
1048	10	3	Pose lavabo — standard	piece	262.25	\N	t	2026-10-10 17:57:13.231+00	2026-10-10 17:57:13.231+00
1049	10	3	Pose lavabo — salle de bain	piece	280.55	\N	t	2026-10-10 17:57:13.238+00	2026-10-10 17:57:13.238+00
1050	10	3	Pose lavabo — cuisine	piece	303.28	\N	t	2026-10-10 17:57:13.244+00	2026-10-10 17:57:13.244+00
1051	10	3	Pose lavabo — premium	piece	366.96	\N	t	2026-10-10 17:57:13.253+00	2026-10-10 17:57:13.253+00
1052	10	3	Tuyauterie multicouche — standard	ml	25.49	\N	t	2026-10-10 17:57:13.259+00	2026-10-10 17:57:13.259+00
1053	10	3	Tuyauterie multicouche — salle de bain	ml	29.66	\N	t	2026-10-10 17:57:13.269+00	2026-10-10 17:57:13.269+00
1054	10	3	Tuyauterie multicouche — cuisine	ml	32.68	\N	t	2026-10-10 17:57:13.275+00	2026-10-10 17:57:13.275+00
1055	10	3	Tuyauterie multicouche — premium	ml	41.32	\N	t	2026-10-10 17:57:13.28+00	2026-10-10 17:57:13.28+00
1056	10	3	Remplacement chauffe-eau — standard	piece	699.12	\N	t	2026-10-10 17:57:13.285+00	2026-10-10 17:57:13.285+00
1057	10	3	Remplacement chauffe-eau — salle de bain	piece	753.35	\N	t	2026-10-10 17:57:13.29+00	2026-10-10 17:57:13.29+00
1058	10	3	Remplacement chauffe-eau — cuisine	piece	756.32	\N	t	2026-10-10 17:57:13.295+00	2026-10-10 17:57:13.295+00
1059	10	3	Remplacement chauffe-eau — premium	piece	1016.37	\N	t	2026-10-10 17:57:13.3+00	2026-10-10 17:57:13.3+00
1060	10	3	Main-d’œuvre plombier — standard	h	52.55	6.00	t	2026-10-10 17:57:13.305+00	2026-10-10 17:57:13.305+00
1061	10	3	Main-d’œuvre plombier — salle de bain	h	62.20	6.00	t	2026-10-10 17:57:13.311+00	2026-10-10 17:57:13.311+00
1062	10	3	Main-d’œuvre plombier — cuisine	h	61.77	6.00	t	2026-10-10 17:57:13.315+00	2026-10-10 17:57:13.315+00
1063	10	3	Main-d’œuvre plombier — premium	h	70.17	6.00	t	2026-10-10 17:57:13.321+00	2026-10-10 17:57:13.321+00
1064	10	4	Point lumineux — standard	piece	92.43	\N	f	2026-10-10 17:57:13.327+00	2026-10-10 17:57:13.327+00
1065	10	4	Point lumineux — salle de bain	piece	93.45	\N	t	2026-10-10 17:57:13.333+00	2026-10-10 17:57:13.333+00
1066	10	4	Point lumineux — cuisine	piece	97.71	\N	t	2026-10-10 17:57:13.337+00	2026-10-10 17:57:13.337+00
1067	10	4	Point lumineux — premium	piece	120.35	\N	t	2026-10-10 17:57:13.342+00	2026-10-10 17:57:13.342+00
1068	10	4	Prise de courant — standard	piece	62.37	\N	t	2026-10-10 17:57:13.347+00	2026-10-10 17:57:13.347+00
1069	10	4	Prise de courant — salle de bain	piece	72.10	\N	t	2026-10-10 17:57:13.353+00	2026-10-10 17:57:13.353+00
1070	10	4	Prise de courant — cuisine	piece	77.48	\N	t	2026-10-10 17:57:13.358+00	2026-10-10 17:57:13.358+00
1071	10	4	Prise de courant — premium	piece	79.35	\N	t	2026-10-10 17:57:13.363+00	2026-10-10 17:57:13.363+00
1072	10	4	Câblage encastré — standard	ml	20.26	\N	t	2026-10-10 17:57:13.369+00	2026-10-10 17:57:13.369+00
1073	10	4	Câblage encastré — salle de bain	ml	23.97	\N	t	2026-10-10 17:57:13.376+00	2026-10-10 17:57:13.376+00
1074	10	4	Câblage encastré — cuisine	ml	21.54	\N	t	2026-10-10 17:57:13.386+00	2026-10-10 17:57:13.386+00
1075	10	4	Câblage encastré — premium	ml	24.07	\N	t	2026-10-10 17:57:13.393+00	2026-10-10 17:57:13.393+00
1076	10	4	Tableau électrique — standard	piece	1036.36	\N	t	2026-10-10 17:57:13.399+00	2026-10-10 17:57:13.399+00
1077	10	4	Tableau électrique — salle de bain	piece	1090.12	\N	t	2026-10-10 17:57:13.406+00	2026-10-10 17:57:13.406+00
1078	10	4	Tableau électrique — cuisine	piece	951.27	\N	t	2026-10-10 17:57:13.411+00	2026-10-10 17:57:13.411+00
1079	10	4	Tableau électrique — premium	piece	1347.55	\N	t	2026-10-10 17:57:13.417+00	2026-10-10 17:57:13.417+00
1080	10	4	Main-d’œuvre électricien — standard	h	57.95	6.00	t	2026-10-10 17:57:13.423+00	2026-10-10 17:57:13.423+00
1081	10	4	Main-d’œuvre électricien — salle de bain	h	67.01	6.00	t	2026-10-10 17:57:13.428+00	2026-10-10 17:57:13.428+00
1082	10	4	Main-d’œuvre électricien — cuisine	h	64.15	6.00	t	2026-10-10 17:57:13.435+00	2026-10-10 17:57:13.435+00
1083	10	4	Main-d’œuvre électricien — premium	h	74.85	6.00	t	2026-10-10 17:57:13.457+00	2026-10-10 17:57:13.457+00
1084	10	5	Mur en blocs — standard	m2	77.58	\N	t	2026-10-10 17:57:13.477+00	2026-10-10 17:57:13.477+00
1085	10	5	Mur en blocs — salle de bain	m2	87.12	\N	t	2026-10-10 17:57:13.482+00	2026-10-10 17:57:13.482+00
1086	10	5	Mur en blocs — cuisine	m2	89.57	\N	t	2026-10-10 17:57:13.496+00	2026-10-10 17:57:13.496+00
1087	10	5	Mur en blocs — premium	m2	106.41	\N	t	2026-10-10 17:57:13.513+00	2026-10-10 17:57:13.513+00
1088	10	5	Chape ciment — standard	m2	29.73	\N	t	2026-10-10 17:57:13.526+00	2026-10-10 17:57:13.526+00
1089	10	5	Chape ciment — salle de bain	m2	34.98	\N	t	2026-10-10 17:57:13.543+00	2026-10-10 17:57:13.543+00
1090	10	5	Chape ciment — cuisine	m2	37.04	\N	t	2026-10-10 17:57:13.552+00	2026-10-10 17:57:13.552+00
1091	10	5	Chape ciment — premium	m2	46.49	\N	t	2026-10-10 17:57:13.571+00	2026-10-10 17:57:13.571+00
1092	10	5	Ouverture de baie — standard	piece	1561.00	\N	f	2026-10-10 17:57:13.583+00	2026-10-10 17:57:13.583+00
1093	10	5	Ouverture de baie — salle de bain	piece	1549.23	\N	f	2026-10-10 17:57:13.593+00	2026-10-10 17:57:13.593+00
1094	10	5	Ouverture de baie — cuisine	piece	1464.18	\N	t	2026-10-10 17:57:13.599+00	2026-10-10 17:57:13.599+00
1095	10	5	Ouverture de baie — premium	piece	1961.37	\N	t	2026-10-10 17:57:13.607+00	2026-10-10 17:57:13.607+00
1096	10	5	Rejointoyage façade — standard	m2	38.61	\N	t	2026-10-10 17:57:13.621+00	2026-10-10 17:57:13.621+00
1097	10	5	Rejointoyage façade — salle de bain	m2	47.65	\N	t	2026-10-10 17:57:13.629+00	2026-10-10 17:57:13.629+00
1098	10	5	Rejointoyage façade — cuisine	m2	42.91	\N	t	2026-10-10 17:57:13.64+00	2026-10-10 17:57:13.64+00
1099	10	5	Rejointoyage façade — premium	m2	50.97	\N	t	2026-10-10 17:57:13.647+00	2026-10-10 17:57:13.647+00
1100	10	5	Main-d’œuvre maçon — standard	h	53.87	6.00	t	2026-10-10 17:57:13.656+00	2026-10-10 17:57:13.656+00
1101	10	5	Main-d’œuvre maçon — salle de bain	h	57.51	6.00	t	2026-10-10 17:57:13.663+00	2026-10-10 17:57:13.663+00
1102	10	5	Main-d’œuvre maçon — cuisine	h	51.19	6.00	f	2026-10-10 17:57:13.671+00	2026-10-10 17:57:13.671+00
1103	10	5	Main-d’œuvre maçon — premium	h	69.23	6.00	t	2026-10-10 17:57:13.677+00	2026-10-10 17:57:13.677+00
1104	10	6	Pose porte intérieure — standard	piece	339.51	\N	t	2026-10-10 17:57:13.687+00	2026-10-10 17:57:13.687+00
1105	10	6	Pose porte intérieure — salle de bain	piece	404.54	\N	t	2026-10-10 17:57:13.699+00	2026-10-10 17:57:13.699+00
1106	10	6	Pose porte intérieure — cuisine	piece	344.32	\N	t	2026-10-10 17:57:13.705+00	2026-10-10 17:57:13.705+00
1107	10	6	Pose porte intérieure — premium	piece	431.23	\N	t	2026-10-10 17:57:13.711+00	2026-10-10 17:57:13.711+00
1108	10	6	Pose châssis — standard	piece	805.21	\N	t	2026-10-10 17:57:13.725+00	2026-10-10 17:57:13.725+00
1109	10	6	Pose châssis — salle de bain	piece	811.70	\N	t	2026-10-10 17:57:13.731+00	2026-10-10 17:57:13.731+00
1110	10	6	Pose châssis — cuisine	piece	843.91	\N	t	2026-10-10 17:57:13.736+00	2026-10-10 17:57:13.736+00
1111	10	6	Pose châssis — premium	piece	1097.94	\N	t	2026-10-10 17:57:13.742+00	2026-10-10 17:57:13.742+00
1112	10	6	Habillage escalier — standard	piece	1873.03	\N	t	2026-10-10 17:57:13.749+00	2026-10-10 17:57:13.749+00
1113	10	6	Habillage escalier — salle de bain	piece	2045.58	\N	t	2026-10-10 17:57:13.755+00	2026-10-10 17:57:13.755+00
1114	10	6	Habillage escalier — cuisine	piece	2199.72	\N	t	2026-10-10 17:57:13.76+00	2026-10-10 17:57:13.76+00
1115	10	6	Habillage escalier — premium	piece	2414.66	\N	t	2026-10-10 17:57:13.766+00	2026-10-10 17:57:13.766+00
1116	10	6	Placard sur mesure — standard	ml	433.15	\N	t	2026-10-10 17:57:13.771+00	2026-10-10 17:57:13.771+00
1117	10	6	Placard sur mesure — salle de bain	ml	513.98	\N	t	2026-10-10 17:57:13.775+00	2026-10-10 17:57:13.775+00
1118	10	6	Placard sur mesure — cuisine	ml	410.81	\N	t	2026-10-10 17:57:13.78+00	2026-10-10 17:57:13.78+00
1119	10	6	Placard sur mesure — premium	ml	551.51	\N	t	2026-10-10 17:57:13.786+00	2026-10-10 17:57:13.786+00
1120	10	6	Main-d’œuvre menuisier — standard	h	50.97	6.00	t	2026-10-10 17:57:13.791+00	2026-10-10 17:57:13.791+00
1121	10	6	Main-d’œuvre menuisier — salle de bain	h	58.00	6.00	f	2026-10-10 17:57:13.798+00	2026-10-10 17:57:13.798+00
1122	10	6	Main-d’œuvre menuisier — cuisine	h	51.68	6.00	t	2026-10-10 17:57:13.804+00	2026-10-10 17:57:13.804+00
1123	10	6	Main-d’œuvre menuisier — premium	h	75.73	6.00	t	2026-10-10 17:57:13.808+00	2026-10-10 17:57:13.808+00
1124	10	7	Couverture tuiles — standard	m2	91.39	\N	f	2026-10-10 17:57:13.813+00	2026-10-10 17:57:13.813+00
1125	10	7	Couverture tuiles — salle de bain	m2	119.99	\N	t	2026-10-10 17:57:13.817+00	2026-10-10 17:57:13.817+00
1126	10	7	Couverture tuiles — cuisine	m2	113.19	\N	t	2026-10-10 17:57:13.823+00	2026-10-10 17:57:13.823+00
1127	10	7	Couverture tuiles — premium	m2	138.15	\N	t	2026-10-10 17:57:13.828+00	2026-10-10 17:57:13.828+00
1128	10	7	Membrane EPDM — standard	m2	61.44	\N	t	2026-10-10 17:57:13.834+00	2026-10-10 17:57:13.834+00
1129	10	7	Membrane EPDM — salle de bain	m2	78.93	\N	t	2026-10-10 17:57:13.839+00	2026-10-10 17:57:13.839+00
1130	10	7	Membrane EPDM — cuisine	m2	72.65	\N	f	2026-10-10 17:57:13.844+00	2026-10-10 17:57:13.844+00
1131	10	7	Membrane EPDM — premium	m2	100.84	\N	t	2026-10-10 17:57:13.85+00	2026-10-10 17:57:13.85+00
1132	10	7	Gouttière zinc — standard	ml	50.51	\N	t	2026-10-10 17:57:13.855+00	2026-10-10 17:57:13.855+00
1133	10	7	Gouttière zinc — salle de bain	ml	62.35	\N	t	2026-10-10 17:57:13.859+00	2026-10-10 17:57:13.859+00
1134	10	7	Gouttière zinc — cuisine	ml	63.46	\N	f	2026-10-10 17:57:13.864+00	2026-10-10 17:57:13.864+00
1135	10	7	Gouttière zinc — premium	ml	78.26	\N	t	2026-10-10 17:57:13.871+00	2026-10-10 17:57:13.871+00
1136	10	7	Velux — standard	piece	1117.79	\N	t	2026-10-10 17:57:13.877+00	2026-10-10 17:57:13.877+00
1137	10	7	Velux — salle de bain	piece	1392.44	\N	t	2026-10-10 17:57:13.886+00	2026-10-10 17:57:13.886+00
1138	10	7	Velux — cuisine	piece	1278.09	\N	t	2026-10-10 17:57:13.892+00	2026-10-10 17:57:13.892+00
1139	10	7	Velux — premium	piece	1687.59	\N	t	2026-10-10 17:57:13.901+00	2026-10-10 17:57:13.901+00
1140	10	7	Main-d’œuvre couvreur — standard	h	54.77	6.00	t	2026-10-10 17:57:13.907+00	2026-10-10 17:57:13.907+00
1141	10	7	Main-d’œuvre couvreur — salle de bain	h	71.82	6.00	t	2026-10-10 17:57:13.913+00	2026-10-10 17:57:13.913+00
1142	10	7	Main-d’œuvre couvreur — cuisine	h	69.75	6.00	f	2026-10-10 17:57:13.919+00	2026-10-10 17:57:13.919+00
1143	10	7	Main-d’œuvre couvreur — premium	h	71.09	6.00	t	2026-10-10 17:57:13.927+00	2026-10-10 17:57:13.927+00
1144	10	8	Isolation laine de verre — standard	m2	26.28	\N	f	2026-10-10 17:57:13.933+00	2026-10-10 17:57:13.933+00
1145	10	8	Isolation laine de verre — salle de bain	m2	27.84	\N	t	2026-10-10 17:57:13.943+00	2026-10-10 17:57:13.943+00
1146	10	8	Isolation laine de verre — cuisine	m2	25.88	\N	t	2026-10-10 17:57:13.952+00	2026-10-10 17:57:13.952+00
1147	10	8	Isolation laine de verre — premium	m2	33.92	\N	t	2026-10-10 17:57:13.965+00	2026-10-10 17:57:13.965+00
1148	10	8	Isolation PIR toiture — standard	m2	47.25	\N	t	2026-10-10 17:57:13.972+00	2026-10-10 17:57:13.972+00
1149	10	8	Isolation PIR toiture — salle de bain	m2	52.03	\N	t	2026-10-10 17:57:13.981+00	2026-10-10 17:57:13.981+00
1150	10	8	Isolation PIR toiture — cuisine	m2	44.00	\N	t	2026-10-10 17:57:13.993+00	2026-10-10 17:57:13.993+00
1151	10	8	Isolation PIR toiture — premium	m2	54.90	\N	t	2026-10-10 17:57:13.998+00	2026-10-10 17:57:13.998+00
1152	10	8	Isolation façade ETICS — standard	m2	126.76	\N	t	2026-10-10 17:57:14.005+00	2026-10-10 17:57:14.005+00
1153	10	8	Isolation façade ETICS — salle de bain	m2	137.51	\N	t	2026-10-10 17:57:14.01+00	2026-10-10 17:57:14.01+00
1154	10	8	Isolation façade ETICS — cuisine	m2	132.90	\N	t	2026-10-10 17:57:14.015+00	2026-10-10 17:57:14.015+00
1155	10	8	Isolation façade ETICS — premium	m2	172.61	\N	t	2026-10-10 17:57:14.022+00	2026-10-10 17:57:14.022+00
1156	10	8	Pare-vapeur — standard	m2	9.18	\N	t	2026-10-10 17:57:14.027+00	2026-10-10 17:57:14.027+00
1157	10	8	Pare-vapeur — salle de bain	m2	11.23	\N	t	2026-10-10 17:57:14.032+00	2026-10-10 17:57:14.032+00
1158	10	8	Pare-vapeur — cuisine	m2	10.44	\N	t	2026-10-10 17:57:14.038+00	2026-10-10 17:57:14.038+00
1159	10	8	Pare-vapeur — premium	m2	11.22	\N	t	2026-10-10 17:57:14.043+00	2026-10-10 17:57:14.043+00
1160	10	8	Main-d’œuvre isolation — standard	h	42.07	6.00	t	2026-10-10 17:57:14.048+00	2026-10-10 17:57:14.048+00
1161	10	8	Main-d’œuvre isolation — salle de bain	h	47.88	6.00	t	2026-10-10 17:57:14.053+00	2026-10-10 17:57:14.053+00
1162	10	8	Main-d’œuvre isolation — cuisine	h	53.41	6.00	t	2026-10-10 17:57:14.058+00	2026-10-10 17:57:14.058+00
1163	10	8	Main-d’œuvre isolation — premium	h	65.39	6.00	t	2026-10-10 17:57:14.062+00	2026-10-10 17:57:14.062+00
1164	10	9	Parquet contrecollé — standard	m2	59.46	\N	t	2026-10-10 17:57:14.067+00	2026-10-10 17:57:14.067+00
1165	10	9	Parquet contrecollé — salle de bain	m2	67.53	\N	t	2026-10-10 17:57:14.073+00	2026-10-10 17:57:14.073+00
1166	10	9	Parquet contrecollé — cuisine	m2	67.84	\N	t	2026-10-10 17:57:14.078+00	2026-10-10 17:57:14.078+00
1167	10	9	Parquet contrecollé — premium	m2	84.48	\N	t	2026-10-10 17:57:14.083+00	2026-10-10 17:57:14.083+00
1168	10	9	Sol vinyle clipsable — standard	m2	32.66	\N	t	2026-10-10 17:57:14.089+00	2026-10-10 17:57:14.089+00
1169	10	9	Sol vinyle clipsable — salle de bain	m2	37.66	\N	t	2026-10-10 17:57:14.094+00	2026-10-10 17:57:14.094+00
1170	10	9	Sol vinyle clipsable — cuisine	m2	39.20	\N	t	2026-10-10 17:57:14.099+00	2026-10-10 17:57:14.099+00
1171	10	9	Sol vinyle clipsable — premium	m2	51.42	\N	t	2026-10-10 17:57:14.106+00	2026-10-10 17:57:14.106+00
1172	10	9	Ragréage — standard	m2	16.04	\N	t	2026-10-10 17:57:14.112+00	2026-10-10 17:57:14.112+00
1173	10	9	Ragréage — salle de bain	m2	17.36	\N	t	2026-10-10 17:57:14.117+00	2026-10-10 17:57:14.117+00
1174	10	9	Ragréage — cuisine	m2	16.19	\N	t	2026-10-10 17:57:14.122+00	2026-10-10 17:57:14.122+00
1175	10	9	Ragréage — premium	m2	21.76	\N	t	2026-10-10 17:57:14.126+00	2026-10-10 17:57:14.126+00
1176	10	9	Plinthes bois — standard	ml	11.64	\N	t	2026-10-10 17:57:14.132+00	2026-10-10 17:57:14.132+00
1177	10	9	Plinthes bois — salle de bain	ml	14.97	\N	t	2026-10-10 17:57:14.137+00	2026-10-10 17:57:14.137+00
1178	10	9	Plinthes bois — cuisine	ml	12.78	\N	t	2026-10-10 17:57:14.142+00	2026-10-10 17:57:14.142+00
1179	10	9	Plinthes bois — premium	ml	17.05	\N	t	2026-10-10 17:57:14.147+00	2026-10-10 17:57:14.147+00
1180	10	9	Main-d’œuvre poseur de sol — standard	h	44.27	6.00	f	2026-10-10 17:57:14.152+00	2026-10-10 17:57:14.152+00
1181	10	9	Main-d’œuvre poseur de sol — salle de bain	h	46.41	6.00	t	2026-10-10 17:57:14.157+00	2026-10-10 17:57:14.157+00
1182	10	9	Main-d’œuvre poseur de sol — cuisine	h	46.82	6.00	t	2026-10-10 17:57:14.162+00	2026-10-10 17:57:14.162+00
1183	10	9	Main-d’œuvre poseur de sol — premium	h	57.48	6.00	t	2026-10-10 17:57:14.168+00	2026-10-10 17:57:14.168+00
1184	10	10	Démolition cloison — standard	m2	24.74	\N	t	2026-10-10 17:57:14.173+00	2026-10-10 17:57:14.173+00
1185	10	10	Démolition cloison — salle de bain	m2	25.83	\N	t	2026-10-10 17:57:14.179+00	2026-10-10 17:57:14.179+00
1186	10	10	Démolition cloison — cuisine	m2	27.67	\N	t	2026-10-10 17:57:14.186+00	2026-10-10 17:57:14.186+00
1187	10	10	Démolition cloison — premium	m2	31.19	\N	t	2026-10-10 17:57:14.193+00	2026-10-10 17:57:14.193+00
1188	10	10	Dépose carrelage — standard	m2	17.40	\N	t	2026-10-10 17:57:14.199+00	2026-10-10 17:57:14.199+00
1189	10	10	Dépose carrelage — salle de bain	m2	21.31	\N	t	2026-10-10 17:57:14.206+00	2026-10-10 17:57:14.206+00
1190	10	10	Dépose carrelage — cuisine	m2	22.35	\N	t	2026-10-10 17:57:14.211+00	2026-10-10 17:57:14.211+00
1191	10	10	Dépose carrelage — premium	m2	24.00	\N	t	2026-10-10 17:57:14.216+00	2026-10-10 17:57:14.216+00
1192	10	10	Évacuation gravats — standard	piece	255.18	\N	t	2026-10-10 17:57:14.223+00	2026-10-10 17:57:14.223+00
1193	10	10	Évacuation gravats — salle de bain	piece	346.93	\N	t	2026-10-10 17:57:14.228+00	2026-10-10 17:57:14.228+00
1194	10	10	Évacuation gravats — cuisine	piece	318.11	\N	t	2026-10-10 17:57:14.232+00	2026-10-10 17:57:14.232+00
1195	10	10	Évacuation gravats — premium	piece	373.26	\N	t	2026-10-10 17:57:14.239+00	2026-10-10 17:57:14.239+00
1196	10	10	Décapage sol — standard	m2	12.95	\N	t	2026-10-10 17:57:14.248+00	2026-10-10 17:57:14.248+00
1197	10	10	Décapage sol — salle de bain	m2	15.94	\N	t	2026-10-10 17:57:14.254+00	2026-10-10 17:57:14.254+00
1198	10	10	Décapage sol — cuisine	m2	15.56	\N	t	2026-10-10 17:57:14.259+00	2026-10-10 17:57:14.259+00
1199	10	10	Décapage sol — premium	m2	19.19	\N	t	2026-10-10 17:57:14.264+00	2026-10-10 17:57:14.264+00
1200	10	10	Main-d’œuvre démolition — standard	h	43.65	6.00	t	2026-10-10 17:57:14.271+00	2026-10-10 17:57:14.271+00
1201	10	10	Main-d’œuvre démolition — salle de bain	h	49.43	6.00	t	2026-10-10 17:57:14.276+00	2026-10-10 17:57:14.276+00
1202	10	10	Main-d’œuvre démolition — cuisine	h	41.97	6.00	t	2026-10-10 17:57:14.281+00	2026-10-10 17:57:14.281+00
1203	10	10	Main-d’œuvre démolition — premium	h	49.81	6.00	t	2026-10-10 17:57:14.286+00	2026-10-10 17:57:14.286+00
1204	11	1	Peinture murale 2 couches — standard	m2	17.53	\N	t	2026-10-10 17:57:14.297+00	2026-10-10 17:57:14.297+00
1205	11	1	Peinture murale 2 couches — salle de bain	m2	20.33	\N	t	2026-10-10 17:57:14.301+00	2026-10-10 17:57:14.301+00
1206	11	1	Peinture murale 2 couches — cuisine	m2	19.09	\N	t	2026-10-10 17:57:14.307+00	2026-10-10 17:57:14.307+00
1207	11	1	Peinture murale 2 couches — premium	m2	25.75	\N	t	2026-10-10 17:57:14.311+00	2026-10-10 17:57:14.311+00
1208	11	1	Peinture plafond — standard	m2	20.34	\N	t	2026-10-10 17:57:14.315+00	2026-10-10 17:57:14.315+00
1209	11	1	Peinture plafond — salle de bain	m2	25.32	\N	t	2026-10-10 17:57:14.32+00	2026-10-10 17:57:14.32+00
1210	11	1	Peinture plafond — cuisine	m2	23.30	\N	t	2026-10-10 17:57:14.325+00	2026-10-10 17:57:14.325+00
1211	11	1	Peinture plafond — premium	m2	32.16	\N	t	2026-10-10 17:57:14.33+00	2026-10-10 17:57:14.33+00
1212	11	1	Laquage boiseries — standard	ml	13.22	\N	f	2026-10-10 17:57:14.336+00	2026-10-10 17:57:14.336+00
1213	11	1	Laquage boiseries — salle de bain	ml	14.81	\N	t	2026-10-10 17:57:14.34+00	2026-10-10 17:57:14.34+00
1214	11	1	Laquage boiseries — cuisine	ml	15.94	\N	t	2026-10-10 17:57:14.344+00	2026-10-10 17:57:14.344+00
1215	11	1	Laquage boiseries — premium	ml	19.49	\N	t	2026-10-10 17:57:14.35+00	2026-10-10 17:57:14.35+00
1216	11	1	Enduit de lissage — standard	m2	11.20	\N	t	2026-10-10 17:57:14.355+00	2026-10-10 17:57:14.355+00
1217	11	1	Enduit de lissage — salle de bain	m2	13.36	\N	t	2026-10-10 17:57:14.361+00	2026-10-10 17:57:14.361+00
1218	11	1	Enduit de lissage — cuisine	m2	12.44	\N	t	2026-10-10 17:57:14.366+00	2026-10-10 17:57:14.366+00
1219	11	1	Enduit de lissage — premium	m2	16.65	\N	t	2026-10-10 17:57:14.373+00	2026-10-10 17:57:14.373+00
1220	11	1	Main-d’œuvre peintre — standard	h	44.24	6.00	t	2026-10-10 17:57:14.378+00	2026-10-10 17:57:14.378+00
1221	11	1	Main-d’œuvre peintre — salle de bain	h	51.34	6.00	t	2026-10-10 17:57:14.383+00	2026-10-10 17:57:14.383+00
1222	11	1	Main-d’œuvre peintre — cuisine	h	49.62	6.00	t	2026-10-10 17:57:14.389+00	2026-10-10 17:57:14.389+00
1223	11	1	Main-d’œuvre peintre — premium	h	64.72	6.00	t	2026-10-10 17:57:14.395+00	2026-10-10 17:57:14.395+00
1224	11	2	Pose carrelage sol — standard	m2	51.43	\N	t	2026-10-10 17:57:14.4+00	2026-10-10 17:57:14.4+00
1225	11	2	Pose carrelage sol — salle de bain	m2	51.02	\N	t	2026-10-10 17:57:14.406+00	2026-10-10 17:57:14.406+00
1226	11	2	Pose carrelage sol — cuisine	m2	50.41	\N	t	2026-10-10 17:57:14.412+00	2026-10-10 17:57:14.412+00
1227	11	2	Pose carrelage sol — premium	m2	59.47	\N	t	2026-10-10 17:57:14.417+00	2026-10-10 17:57:14.417+00
1228	11	2	Pose faïence murale — standard	m2	47.73	\N	t	2026-10-10 17:57:14.423+00	2026-10-10 17:57:14.423+00
1229	11	2	Pose faïence murale — salle de bain	m2	60.38	\N	t	2026-10-10 17:57:14.427+00	2026-10-10 17:57:14.427+00
1230	11	2	Pose faïence murale — cuisine	m2	60.42	\N	t	2026-10-10 17:57:14.433+00	2026-10-10 17:57:14.433+00
1231	11	2	Pose faïence murale — premium	m2	73.44	\N	t	2026-10-10 17:57:14.439+00	2026-10-10 17:57:14.439+00
1232	11	2	Plinthes carrelées — standard	ml	17.16	\N	t	2026-10-10 17:57:14.444+00	2026-10-10 17:57:14.444+00
1233	11	2	Plinthes carrelées — salle de bain	ml	18.55	\N	t	2026-10-10 17:57:14.45+00	2026-10-10 17:57:14.45+00
1234	11	2	Plinthes carrelées — cuisine	ml	19.27	\N	t	2026-10-10 17:57:14.457+00	2026-10-10 17:57:14.457+00
1235	11	2	Plinthes carrelées — premium	ml	22.52	\N	t	2026-10-10 17:57:14.466+00	2026-10-10 17:57:14.466+00
1236	11	2	Joints époxy — standard	m2	10.35	\N	t	2026-10-10 17:57:14.475+00	2026-10-10 17:57:14.475+00
1237	11	2	Joints époxy — salle de bain	m2	13.33	\N	t	2026-10-10 17:57:14.482+00	2026-10-10 17:57:14.482+00
1238	11	2	Joints époxy — cuisine	m2	11.85	\N	t	2026-10-10 17:57:14.489+00	2026-10-10 17:57:14.489+00
1239	11	2	Joints époxy — premium	m2	13.95	\N	t	2026-10-10 17:57:14.496+00	2026-10-10 17:57:14.496+00
1240	11	2	Main-d’œuvre carreleur — standard	h	48.98	6.00	t	2026-10-10 17:57:14.502+00	2026-10-10 17:57:14.502+00
1241	11	2	Main-d’œuvre carreleur — salle de bain	h	53.83	6.00	t	2026-10-10 17:57:14.509+00	2026-10-10 17:57:14.509+00
1242	11	2	Main-d’œuvre carreleur — cuisine	h	53.68	6.00	t	2026-10-10 17:57:14.515+00	2026-10-10 17:57:14.515+00
1243	11	2	Main-d’œuvre carreleur — premium	h	67.75	6.00	t	2026-10-10 17:57:14.521+00	2026-10-10 17:57:14.521+00
1244	11	3	Pose WC suspendu — standard	piece	396.03	\N	t	2026-10-10 17:57:14.526+00	2026-10-10 17:57:14.526+00
1245	11	3	Pose WC suspendu — salle de bain	piece	526.60	\N	f	2026-10-10 17:57:14.533+00	2026-10-10 17:57:14.533+00
1246	11	3	Pose WC suspendu — cuisine	piece	430.91	\N	t	2026-10-10 17:57:14.541+00	2026-10-10 17:57:14.541+00
1247	11	3	Pose WC suspendu — premium	piece	574.99	\N	t	2026-10-10 17:57:14.547+00	2026-10-10 17:57:14.547+00
1248	11	3	Pose lavabo — standard	piece	237.69	\N	t	2026-10-10 17:57:14.553+00	2026-10-10 17:57:14.553+00
1249	11	3	Pose lavabo — salle de bain	piece	293.24	\N	t	2026-10-10 17:57:14.558+00	2026-10-10 17:57:14.558+00
1250	11	3	Pose lavabo — cuisine	piece	307.51	\N	t	2026-10-10 17:57:14.562+00	2026-10-10 17:57:14.562+00
1251	11	3	Pose lavabo — premium	piece	333.51	\N	t	2026-10-10 17:57:14.567+00	2026-10-10 17:57:14.567+00
1252	11	3	Tuyauterie multicouche — standard	ml	28.72	\N	f	2026-10-10 17:57:14.572+00	2026-10-10 17:57:14.572+00
1253	11	3	Tuyauterie multicouche — salle de bain	ml	33.80	\N	t	2026-10-10 17:57:14.576+00	2026-10-10 17:57:14.576+00
1254	11	3	Tuyauterie multicouche — cuisine	ml	32.70	\N	t	2026-10-10 17:57:14.58+00	2026-10-10 17:57:14.58+00
1255	11	3	Tuyauterie multicouche — premium	ml	37.16	\N	t	2026-10-10 17:57:14.585+00	2026-10-10 17:57:14.585+00
1256	11	3	Remplacement chauffe-eau — standard	piece	648.82	\N	t	2026-10-10 17:57:14.589+00	2026-10-10 17:57:14.589+00
1257	11	3	Remplacement chauffe-eau — salle de bain	piece	787.92	\N	t	2026-10-10 17:57:14.594+00	2026-10-10 17:57:14.594+00
1258	11	3	Remplacement chauffe-eau — cuisine	piece	707.07	\N	t	2026-10-10 17:57:14.598+00	2026-10-10 17:57:14.598+00
1259	11	3	Remplacement chauffe-eau — premium	piece	882.51	\N	t	2026-10-10 17:57:14.607+00	2026-10-10 17:57:14.607+00
1260	11	3	Main-d’œuvre plombier — standard	h	51.19	6.00	t	2026-10-10 17:57:14.612+00	2026-10-10 17:57:14.612+00
1261	11	3	Main-d’œuvre plombier — salle de bain	h	68.98	6.00	t	2026-10-10 17:57:14.616+00	2026-10-10 17:57:14.616+00
1262	11	3	Main-d’œuvre plombier — cuisine	h	56.15	6.00	t	2026-10-10 17:57:14.622+00	2026-10-10 17:57:14.622+00
1263	11	3	Main-d’œuvre plombier — premium	h	80.00	6.00	t	2026-10-10 17:57:14.628+00	2026-10-10 17:57:14.628+00
1264	11	4	Point lumineux — standard	piece	89.95	\N	f	2026-10-10 17:57:14.634+00	2026-10-10 17:57:14.634+00
1265	11	4	Point lumineux — salle de bain	piece	101.27	\N	t	2026-10-10 17:57:14.639+00	2026-10-10 17:57:14.639+00
1266	11	4	Point lumineux — cuisine	piece	97.37	\N	t	2026-10-10 17:57:14.643+00	2026-10-10 17:57:14.643+00
1267	11	4	Point lumineux — premium	piece	125.14	\N	t	2026-10-10 17:57:14.647+00	2026-10-10 17:57:14.647+00
1268	11	4	Prise de courant — standard	piece	67.67	\N	t	2026-10-10 17:57:14.652+00	2026-10-10 17:57:14.652+00
1269	11	4	Prise de courant — salle de bain	piece	81.79	\N	t	2026-10-10 17:57:14.656+00	2026-10-10 17:57:14.656+00
1270	11	4	Prise de courant — cuisine	piece	65.44	\N	t	2026-10-10 17:57:14.66+00	2026-10-10 17:57:14.66+00
1271	11	4	Prise de courant — premium	piece	83.26	\N	t	2026-10-10 17:57:14.664+00	2026-10-10 17:57:14.664+00
1272	11	4	Câblage encastré — standard	ml	18.85	\N	t	2026-10-10 17:57:14.669+00	2026-10-10 17:57:14.669+00
1273	11	4	Câblage encastré — salle de bain	ml	22.88	\N	t	2026-10-10 17:57:14.673+00	2026-10-10 17:57:14.673+00
1274	11	4	Câblage encastré — cuisine	ml	22.79	\N	t	2026-10-10 17:57:14.678+00	2026-10-10 17:57:14.678+00
1275	11	4	Câblage encastré — premium	ml	25.47	\N	t	2026-10-10 17:57:14.683+00	2026-10-10 17:57:14.683+00
1276	11	4	Tableau électrique — standard	piece	981.00	\N	t	2026-10-10 17:57:14.688+00	2026-10-10 17:57:14.688+00
1277	11	4	Tableau électrique — salle de bain	piece	1016.99	\N	t	2026-10-10 17:57:14.692+00	2026-10-10 17:57:14.692+00
1278	11	4	Tableau électrique — cuisine	piece	1102.12	\N	t	2026-10-10 17:57:14.696+00	2026-10-10 17:57:14.696+00
1279	11	4	Tableau électrique — premium	piece	1282.38	\N	t	2026-10-10 17:57:14.701+00	2026-10-10 17:57:14.701+00
1280	11	4	Main-d’œuvre électricien — standard	h	52.77	6.00	t	2026-10-10 17:57:14.707+00	2026-10-10 17:57:14.707+00
1281	11	4	Main-d’œuvre électricien — salle de bain	h	67.98	6.00	t	2026-10-10 17:57:14.711+00	2026-10-10 17:57:14.711+00
1282	11	4	Main-d’œuvre électricien — cuisine	h	56.48	6.00	t	2026-10-10 17:57:14.716+00	2026-10-10 17:57:14.716+00
1283	11	4	Main-d’œuvre électricien — premium	h	79.44	6.00	t	2026-10-10 17:57:14.722+00	2026-10-10 17:57:14.722+00
1284	11	5	Mur en blocs — standard	m2	73.42	\N	t	2026-10-10 17:57:14.726+00	2026-10-10 17:57:14.726+00
1285	11	5	Mur en blocs — salle de bain	m2	89.02	\N	t	2026-10-10 17:57:14.731+00	2026-10-10 17:57:14.731+00
1286	11	5	Mur en blocs — cuisine	m2	89.42	\N	t	2026-10-10 17:57:14.735+00	2026-10-10 17:57:14.735+00
1287	11	5	Mur en blocs — premium	m2	94.59	\N	t	2026-10-10 17:57:14.739+00	2026-10-10 17:57:14.739+00
1288	11	5	Chape ciment — standard	m2	32.10	\N	t	2026-10-10 17:57:14.744+00	2026-10-10 17:57:14.744+00
1289	11	5	Chape ciment — salle de bain	m2	38.64	\N	t	2026-10-10 17:57:14.748+00	2026-10-10 17:57:14.748+00
1290	11	5	Chape ciment — cuisine	m2	37.38	\N	t	2026-10-10 17:57:14.752+00	2026-10-10 17:57:14.752+00
1291	11	5	Chape ciment — premium	m2	40.76	\N	t	2026-10-10 17:57:14.756+00	2026-10-10 17:57:14.756+00
1292	11	5	Ouverture de baie — standard	piece	1553.47	\N	t	2026-10-10 17:57:14.761+00	2026-10-10 17:57:14.761+00
1293	11	5	Ouverture de baie — salle de bain	piece	1717.99	\N	t	2026-10-10 17:57:14.766+00	2026-10-10 17:57:14.766+00
1294	11	5	Ouverture de baie — cuisine	piece	1727.68	\N	t	2026-10-10 17:57:14.771+00	2026-10-10 17:57:14.771+00
1295	11	5	Ouverture de baie — premium	piece	1984.76	\N	f	2026-10-10 17:57:14.776+00	2026-10-10 17:57:14.776+00
1296	11	5	Rejointoyage façade — standard	m2	34.26	\N	t	2026-10-10 17:57:14.78+00	2026-10-10 17:57:14.78+00
1297	11	5	Rejointoyage façade — salle de bain	m2	39.69	\N	t	2026-10-10 17:57:14.785+00	2026-10-10 17:57:14.785+00
1298	11	5	Rejointoyage façade — cuisine	m2	45.78	\N	t	2026-10-10 17:57:14.79+00	2026-10-10 17:57:14.79+00
1299	11	5	Rejointoyage façade — premium	m2	50.23	\N	t	2026-10-10 17:57:14.795+00	2026-10-10 17:57:14.795+00
1300	11	5	Main-d’œuvre maçon — standard	h	52.97	6.00	t	2026-10-10 17:57:14.8+00	2026-10-10 17:57:14.8+00
1301	11	5	Main-d’œuvre maçon — salle de bain	h	60.74	6.00	t	2026-10-10 17:57:14.806+00	2026-10-10 17:57:14.806+00
1302	11	5	Main-d’œuvre maçon — cuisine	h	55.94	6.00	t	2026-10-10 17:57:14.81+00	2026-10-10 17:57:14.81+00
1303	11	5	Main-d’œuvre maçon — premium	h	62.62	6.00	t	2026-10-10 17:57:14.814+00	2026-10-10 17:57:14.814+00
1304	11	6	Pose porte intérieure — standard	piece	289.77	\N	t	2026-10-10 17:57:14.819+00	2026-10-10 17:57:14.819+00
1305	11	6	Pose porte intérieure — salle de bain	piece	331.53	\N	t	2026-10-10 17:57:14.824+00	2026-10-10 17:57:14.824+00
1306	11	6	Pose porte intérieure — cuisine	piece	373.22	\N	t	2026-10-10 17:57:14.829+00	2026-10-10 17:57:14.829+00
1307	11	6	Pose porte intérieure — premium	piece	397.39	\N	t	2026-10-10 17:57:14.833+00	2026-10-10 17:57:14.833+00
1308	11	6	Pose châssis — standard	piece	795.38	\N	t	2026-10-10 17:57:14.838+00	2026-10-10 17:57:14.838+00
1309	11	6	Pose châssis — salle de bain	piece	949.18	\N	t	2026-10-10 17:57:14.842+00	2026-10-10 17:57:14.842+00
1310	11	6	Pose châssis — cuisine	piece	796.36	\N	t	2026-10-10 17:57:14.846+00	2026-10-10 17:57:14.846+00
1311	11	6	Pose châssis — premium	piece	996.40	\N	t	2026-10-10 17:57:14.851+00	2026-10-10 17:57:14.851+00
1312	11	6	Habillage escalier — standard	piece	1989.81	\N	t	2026-10-10 17:57:14.857+00	2026-10-10 17:57:14.857+00
1313	11	6	Habillage escalier — salle de bain	piece	2101.07	\N	t	2026-10-10 17:57:14.862+00	2026-10-10 17:57:14.862+00
1314	11	6	Habillage escalier — cuisine	piece	2013.00	\N	t	2026-10-10 17:57:14.868+00	2026-10-10 17:57:14.868+00
1315	11	6	Habillage escalier — premium	piece	2538.70	\N	t	2026-10-10 17:57:14.872+00	2026-10-10 17:57:14.872+00
1316	11	6	Placard sur mesure — standard	ml	371.14	\N	t	2026-10-10 17:57:14.877+00	2026-10-10 17:57:14.877+00
1317	11	6	Placard sur mesure — salle de bain	ml	487.44	\N	t	2026-10-10 17:57:14.881+00	2026-10-10 17:57:14.881+00
1318	11	6	Placard sur mesure — cuisine	ml	418.47	\N	t	2026-10-10 17:57:14.886+00	2026-10-10 17:57:14.886+00
1319	11	6	Placard sur mesure — premium	ml	603.26	\N	t	2026-10-10 17:57:14.891+00	2026-10-10 17:57:14.891+00
1320	11	6	Main-d’œuvre menuisier — standard	h	50.98	6.00	t	2026-10-10 17:57:14.895+00	2026-10-10 17:57:14.895+00
1321	11	6	Main-d’œuvre menuisier — salle de bain	h	57.35	6.00	t	2026-10-10 17:57:14.9+00	2026-10-10 17:57:14.9+00
1322	11	6	Main-d’œuvre menuisier — cuisine	h	55.59	6.00	t	2026-10-10 17:57:14.904+00	2026-10-10 17:57:14.904+00
1323	11	6	Main-d’œuvre menuisier — premium	h	63.35	6.00	t	2026-10-10 17:57:14.909+00	2026-10-10 17:57:14.909+00
1324	11	7	Couverture tuiles — standard	m2	97.90	\N	t	2026-10-10 17:57:14.913+00	2026-10-10 17:57:14.913+00
1325	11	7	Couverture tuiles — salle de bain	m2	111.47	\N	t	2026-10-10 17:57:14.918+00	2026-10-10 17:57:14.918+00
1326	11	7	Couverture tuiles — cuisine	m2	106.12	\N	t	2026-10-10 17:57:14.923+00	2026-10-10 17:57:14.923+00
1327	11	7	Couverture tuiles — premium	m2	117.78	\N	t	2026-10-10 17:57:14.927+00	2026-10-10 17:57:14.927+00
1328	11	7	Membrane EPDM — standard	m2	72.15	\N	t	2026-10-10 17:57:14.932+00	2026-10-10 17:57:14.932+00
1329	11	7	Membrane EPDM — salle de bain	m2	83.11	\N	t	2026-10-10 17:57:14.938+00	2026-10-10 17:57:14.938+00
1330	11	7	Membrane EPDM — cuisine	m2	79.68	\N	t	2026-10-10 17:57:14.943+00	2026-10-10 17:57:14.943+00
1331	11	7	Membrane EPDM — premium	m2	86.75	\N	t	2026-10-10 17:57:14.948+00	2026-10-10 17:57:14.948+00
1332	11	7	Gouttière zinc — standard	ml	50.35	\N	t	2026-10-10 17:57:14.953+00	2026-10-10 17:57:14.953+00
1333	11	7	Gouttière zinc — salle de bain	ml	65.22	\N	t	2026-10-10 17:57:14.959+00	2026-10-10 17:57:14.959+00
1334	11	7	Gouttière zinc — cuisine	ml	59.21	\N	t	2026-10-10 17:57:14.966+00	2026-10-10 17:57:14.966+00
1335	11	7	Gouttière zinc — premium	ml	71.97	\N	t	2026-10-10 17:57:14.972+00	2026-10-10 17:57:14.972+00
1336	11	7	Velux — standard	piece	1079.24	\N	t	2026-10-10 17:57:14.977+00	2026-10-10 17:57:14.977+00
1337	11	7	Velux — salle de bain	piece	1353.50	\N	t	2026-10-10 17:57:14.982+00	2026-10-10 17:57:14.982+00
1338	11	7	Velux — cuisine	piece	1143.23	\N	t	2026-10-10 17:57:14.987+00	2026-10-10 17:57:14.987+00
1339	11	7	Velux — premium	piece	1528.84	\N	t	2026-10-10 17:57:14.992+00	2026-10-10 17:57:14.992+00
1340	11	7	Main-d’œuvre couvreur — standard	h	62.26	6.00	t	2026-10-10 17:57:14.997+00	2026-10-10 17:57:14.997+00
1341	11	7	Main-d’œuvre couvreur — salle de bain	h	64.15	6.00	t	2026-10-10 17:57:15.002+00	2026-10-10 17:57:15.002+00
1342	11	7	Main-d’œuvre couvreur — cuisine	h	68.58	6.00	t	2026-10-10 17:57:15.008+00	2026-10-10 17:57:15.008+00
1343	11	7	Main-d’œuvre couvreur — premium	h	75.43	6.00	t	2026-10-10 17:57:15.013+00	2026-10-10 17:57:15.013+00
1344	11	8	Isolation laine de verre — standard	m2	27.87	\N	t	2026-10-10 17:57:15.018+00	2026-10-10 17:57:15.018+00
1345	11	8	Isolation laine de verre — salle de bain	m2	30.55	\N	t	2026-10-10 17:57:15.023+00	2026-10-10 17:57:15.023+00
1346	11	8	Isolation laine de verre — cuisine	m2	28.42	\N	f	2026-10-10 17:57:15.027+00	2026-10-10 17:57:15.027+00
1347	11	8	Isolation laine de verre — premium	m2	34.10	\N	t	2026-10-10 17:57:15.032+00	2026-10-10 17:57:15.032+00
1348	11	8	Isolation PIR toiture — standard	m2	45.75	\N	t	2026-10-10 17:57:15.037+00	2026-10-10 17:57:15.037+00
1349	11	8	Isolation PIR toiture — salle de bain	m2	49.40	\N	t	2026-10-10 17:57:15.042+00	2026-10-10 17:57:15.042+00
1350	11	8	Isolation PIR toiture — cuisine	m2	47.11	\N	t	2026-10-10 17:57:15.046+00	2026-10-10 17:57:15.046+00
1351	11	8	Isolation PIR toiture — premium	m2	56.21	\N	t	2026-10-10 17:57:15.051+00	2026-10-10 17:57:15.051+00
1352	11	8	Isolation façade ETICS — standard	m2	130.12	\N	t	2026-10-10 17:57:15.055+00	2026-10-10 17:57:15.055+00
1353	11	8	Isolation façade ETICS — salle de bain	m2	137.47	\N	t	2026-10-10 17:57:15.059+00	2026-10-10 17:57:15.059+00
1354	11	8	Isolation façade ETICS — cuisine	m2	133.31	\N	t	2026-10-10 17:57:15.064+00	2026-10-10 17:57:15.064+00
1355	11	8	Isolation façade ETICS — premium	m2	161.55	\N	t	2026-10-10 17:57:15.068+00	2026-10-10 17:57:15.068+00
1356	11	8	Pare-vapeur — standard	m2	9.64	\N	t	2026-10-10 17:57:15.073+00	2026-10-10 17:57:15.073+00
1357	11	8	Pare-vapeur — salle de bain	m2	10.98	\N	t	2026-10-10 17:57:15.078+00	2026-10-10 17:57:15.078+00
1358	11	8	Pare-vapeur — cuisine	m2	10.63	\N	t	2026-10-10 17:57:15.084+00	2026-10-10 17:57:15.084+00
1359	11	8	Pare-vapeur — premium	m2	11.41	\N	t	2026-10-10 17:57:15.089+00	2026-10-10 17:57:15.089+00
1360	11	8	Main-d’œuvre isolation — standard	h	44.85	6.00	t	2026-10-10 17:57:15.093+00	2026-10-10 17:57:15.093+00
1361	11	8	Main-d’œuvre isolation — salle de bain	h	57.37	6.00	t	2026-10-10 17:57:15.098+00	2026-10-10 17:57:15.098+00
1362	11	8	Main-d’œuvre isolation — cuisine	h	47.24	6.00	t	2026-10-10 17:57:15.102+00	2026-10-10 17:57:15.102+00
1363	11	8	Main-d’œuvre isolation — premium	h	65.93	6.00	t	2026-10-10 17:57:15.107+00	2026-10-10 17:57:15.107+00
1364	11	9	Parquet contrecollé — standard	m2	60.93	\N	t	2026-10-10 17:57:15.112+00	2026-10-10 17:57:15.112+00
1365	11	9	Parquet contrecollé — salle de bain	m2	75.40	\N	f	2026-10-10 17:57:15.116+00	2026-10-10 17:57:15.116+00
1366	11	9	Parquet contrecollé — cuisine	m2	62.96	\N	t	2026-10-10 17:57:15.122+00	2026-10-10 17:57:15.122+00
1367	11	9	Parquet contrecollé — premium	m2	77.35	\N	t	2026-10-10 17:57:15.128+00	2026-10-10 17:57:15.128+00
1368	11	9	Sol vinyle clipsable — standard	m2	33.40	\N	f	2026-10-10 17:57:15.132+00	2026-10-10 17:57:15.132+00
1369	11	9	Sol vinyle clipsable — salle de bain	m2	37.01	\N	t	2026-10-10 17:57:15.138+00	2026-10-10 17:57:15.138+00
1370	11	9	Sol vinyle clipsable — cuisine	m2	40.77	\N	t	2026-10-10 17:57:15.143+00	2026-10-10 17:57:15.143+00
1371	11	9	Sol vinyle clipsable — premium	m2	50.96	\N	f	2026-10-10 17:57:15.147+00	2026-10-10 17:57:15.147+00
1372	11	9	Ragréage — standard	m2	13.52	\N	t	2026-10-10 17:57:15.151+00	2026-10-10 17:57:15.151+00
1373	11	9	Ragréage — salle de bain	m2	18.38	\N	t	2026-10-10 17:57:15.156+00	2026-10-10 17:57:15.156+00
1374	11	9	Ragréage — cuisine	m2	17.52	\N	t	2026-10-10 17:57:15.161+00	2026-10-10 17:57:15.161+00
1375	11	9	Ragréage — premium	m2	21.06	\N	t	2026-10-10 17:57:15.165+00	2026-10-10 17:57:15.165+00
1376	11	9	Plinthes bois — standard	ml	12.55	\N	t	2026-10-10 17:57:15.171+00	2026-10-10 17:57:15.171+00
1377	11	9	Plinthes bois — salle de bain	ml	14.05	\N	t	2026-10-10 17:57:15.175+00	2026-10-10 17:57:15.175+00
1378	11	9	Plinthes bois — cuisine	ml	12.92	\N	t	2026-10-10 17:57:15.18+00	2026-10-10 17:57:15.18+00
1379	11	9	Plinthes bois — premium	ml	17.49	\N	t	2026-10-10 17:57:15.184+00	2026-10-10 17:57:15.184+00
1380	11	9	Main-d’œuvre poseur de sol — standard	h	47.16	6.00	t	2026-10-10 17:57:15.19+00	2026-10-10 17:57:15.19+00
1381	11	9	Main-d’œuvre poseur de sol — salle de bain	h	48.41	6.00	t	2026-10-10 17:57:15.194+00	2026-10-10 17:57:15.194+00
1382	11	9	Main-d’œuvre poseur de sol — cuisine	h	44.82	6.00	f	2026-10-10 17:57:15.198+00	2026-10-10 17:57:15.198+00
1383	11	9	Main-d’œuvre poseur de sol — premium	h	55.99	6.00	t	2026-10-10 17:57:15.204+00	2026-10-10 17:57:15.204+00
1384	11	10	Démolition cloison — standard	m2	22.86	\N	t	2026-10-10 17:57:15.209+00	2026-10-10 17:57:15.209+00
1385	11	10	Démolition cloison — salle de bain	m2	30.33	\N	t	2026-10-10 17:57:15.213+00	2026-10-10 17:57:15.213+00
1386	11	10	Démolition cloison — cuisine	m2	25.35	\N	t	2026-10-10 17:57:15.219+00	2026-10-10 17:57:15.219+00
1387	11	10	Démolition cloison — premium	m2	34.03	\N	t	2026-10-10 17:57:15.224+00	2026-10-10 17:57:15.224+00
1388	11	10	Dépose carrelage — standard	m2	19.00	\N	t	2026-10-10 17:57:15.228+00	2026-10-10 17:57:15.228+00
1389	11	10	Dépose carrelage — salle de bain	m2	20.92	\N	f	2026-10-10 17:57:15.233+00	2026-10-10 17:57:15.233+00
1390	11	10	Dépose carrelage — cuisine	m2	22.78	\N	f	2026-10-10 17:57:15.238+00	2026-10-10 17:57:15.238+00
1391	11	10	Dépose carrelage — premium	m2	28.10	\N	t	2026-10-10 17:57:15.242+00	2026-10-10 17:57:15.242+00
1392	11	10	Évacuation gravats — standard	piece	304.51	\N	t	2026-10-10 17:57:15.247+00	2026-10-10 17:57:15.247+00
1393	11	10	Évacuation gravats — salle de bain	piece	298.37	\N	t	2026-10-10 17:57:15.25+00	2026-10-10 17:57:15.25+00
1394	11	10	Évacuation gravats — cuisine	piece	314.18	\N	t	2026-10-10 17:57:15.255+00	2026-10-10 17:57:15.255+00
1395	11	10	Évacuation gravats — premium	piece	391.55	\N	t	2026-10-10 17:57:15.258+00	2026-10-10 17:57:15.258+00
1396	11	10	Décapage sol — standard	m2	12.42	\N	t	2026-10-10 17:57:15.262+00	2026-10-10 17:57:15.262+00
1397	11	10	Décapage sol — salle de bain	m2	15.36	\N	t	2026-10-10 17:57:15.267+00	2026-10-10 17:57:15.267+00
1398	11	10	Décapage sol — cuisine	m2	15.09	\N	t	2026-10-10 17:57:15.271+00	2026-10-10 17:57:15.271+00
1399	11	10	Décapage sol — premium	m2	17.07	\N	t	2026-10-10 17:57:15.275+00	2026-10-10 17:57:15.275+00
1400	11	10	Main-d’œuvre démolition — standard	h	41.03	6.00	t	2026-10-10 17:57:15.279+00	2026-10-10 17:57:15.279+00
1401	11	10	Main-d’œuvre démolition — salle de bain	h	47.74	6.00	t	2026-10-10 17:57:15.284+00	2026-10-10 17:57:15.284+00
1402	11	10	Main-d’œuvre démolition — cuisine	h	44.54	6.00	t	2026-10-10 17:57:15.288+00	2026-10-10 17:57:15.288+00
1403	11	10	Main-d’œuvre démolition — premium	h	53.91	6.00	t	2026-10-10 17:57:15.293+00	2026-10-10 17:57:15.293+00
1404	12	1	Peinture murale 2 couches — standard	m2	19.26	\N	t	2026-10-10 17:57:15.303+00	2026-10-10 17:57:15.303+00
1405	12	1	Peinture murale 2 couches — salle de bain	m2	20.68	\N	t	2026-10-10 17:57:15.307+00	2026-10-10 17:57:15.307+00
1406	12	1	Peinture murale 2 couches — cuisine	m2	21.39	\N	t	2026-10-10 17:57:15.311+00	2026-10-10 17:57:15.311+00
1407	12	1	Peinture murale 2 couches — premium	m2	22.93	\N	t	2026-10-10 17:57:15.315+00	2026-10-10 17:57:15.315+00
1408	12	1	Peinture plafond — standard	m2	21.04	\N	t	2026-10-10 17:57:15.32+00	2026-10-10 17:57:15.32+00
1409	12	1	Peinture plafond — salle de bain	m2	23.24	\N	t	2026-10-10 17:57:15.325+00	2026-10-10 17:57:15.325+00
1410	12	1	Peinture plafond — cuisine	m2	25.35	\N	t	2026-10-10 17:57:15.329+00	2026-10-10 17:57:15.329+00
1411	12	1	Peinture plafond — premium	m2	30.47	\N	f	2026-10-10 17:57:15.333+00	2026-10-10 17:57:15.333+00
1412	12	1	Laquage boiseries — standard	ml	12.96	\N	t	2026-10-10 17:57:15.338+00	2026-10-10 17:57:15.338+00
1413	12	1	Laquage boiseries — salle de bain	ml	15.04	\N	t	2026-10-10 17:57:15.342+00	2026-10-10 17:57:15.342+00
1414	12	1	Laquage boiseries — cuisine	ml	16.48	\N	t	2026-10-10 17:57:15.347+00	2026-10-10 17:57:15.347+00
1415	12	1	Laquage boiseries — premium	ml	17.17	\N	t	2026-10-10 17:57:15.351+00	2026-10-10 17:57:15.351+00
1416	12	1	Enduit de lissage — standard	m2	11.15	\N	t	2026-10-10 17:57:15.355+00	2026-10-10 17:57:15.355+00
1417	12	1	Enduit de lissage — salle de bain	m2	13.53	\N	t	2026-10-10 17:57:15.36+00	2026-10-10 17:57:15.36+00
1418	12	1	Enduit de lissage — cuisine	m2	13.18	\N	t	2026-10-10 17:57:15.364+00	2026-10-10 17:57:15.364+00
1419	12	1	Enduit de lissage — premium	m2	16.59	\N	t	2026-10-10 17:57:15.369+00	2026-10-10 17:57:15.369+00
1420	12	1	Main-d’œuvre peintre — standard	h	41.29	6.00	t	2026-10-10 17:57:15.373+00	2026-10-10 17:57:15.373+00
1421	12	1	Main-d’œuvre peintre — salle de bain	h	46.64	6.00	t	2026-10-10 17:57:15.378+00	2026-10-10 17:57:15.378+00
1422	12	1	Main-d’œuvre peintre — cuisine	h	47.67	6.00	t	2026-10-10 17:57:15.382+00	2026-10-10 17:57:15.382+00
1423	12	1	Main-d’œuvre peintre — premium	h	61.33	6.00	t	2026-10-10 17:57:15.387+00	2026-10-10 17:57:15.387+00
1424	12	2	Pose carrelage sol — standard	m2	52.65	\N	t	2026-10-10 17:57:15.393+00	2026-10-10 17:57:15.393+00
1425	12	2	Pose carrelage sol — salle de bain	m2	57.07	\N	t	2026-10-10 17:57:15.397+00	2026-10-10 17:57:15.397+00
1426	12	2	Pose carrelage sol — cuisine	m2	57.37	\N	t	2026-10-10 17:57:15.402+00	2026-10-10 17:57:15.402+00
1427	12	2	Pose carrelage sol — premium	m2	69.87	\N	t	2026-10-10 17:57:15.406+00	2026-10-10 17:57:15.406+00
1428	12	2	Pose faïence murale — standard	m2	56.79	\N	t	2026-10-10 17:57:15.411+00	2026-10-10 17:57:15.411+00
1429	12	2	Pose faïence murale — salle de bain	m2	56.21	\N	t	2026-10-10 17:57:15.416+00	2026-10-10 17:57:15.416+00
1430	12	2	Pose faïence murale — cuisine	m2	57.34	\N	t	2026-10-10 17:57:15.42+00	2026-10-10 17:57:15.42+00
1431	12	2	Pose faïence murale — premium	m2	63.84	\N	t	2026-10-10 17:57:15.425+00	2026-10-10 17:57:15.425+00
1432	12	2	Plinthes carrelées — standard	ml	14.62	\N	t	2026-10-10 17:57:15.432+00	2026-10-10 17:57:15.432+00
1433	12	2	Plinthes carrelées — salle de bain	ml	19.20	\N	t	2026-10-10 17:57:15.44+00	2026-10-10 17:57:15.44+00
1434	12	2	Plinthes carrelées — cuisine	ml	16.10	\N	t	2026-10-10 17:57:15.446+00	2026-10-10 17:57:15.446+00
1435	12	2	Plinthes carrelées — premium	ml	22.23	\N	t	2026-10-10 17:57:15.452+00	2026-10-10 17:57:15.452+00
1436	12	2	Joints époxy — standard	m2	10.84	\N	f	2026-10-10 17:57:15.458+00	2026-10-10 17:57:15.458+00
1437	12	2	Joints époxy — salle de bain	m2	12.82	\N	t	2026-10-10 17:57:15.463+00	2026-10-10 17:57:15.463+00
1438	12	2	Joints époxy — cuisine	m2	13.14	\N	t	2026-10-10 17:57:15.468+00	2026-10-10 17:57:15.468+00
1439	12	2	Joints époxy — premium	m2	15.74	\N	t	2026-10-10 17:57:15.474+00	2026-10-10 17:57:15.474+00
1440	12	2	Main-d’œuvre carreleur — standard	h	43.83	6.00	t	2026-10-10 17:57:15.479+00	2026-10-10 17:57:15.479+00
1441	12	2	Main-d’œuvre carreleur — salle de bain	h	50.46	6.00	t	2026-10-10 17:57:15.485+00	2026-10-10 17:57:15.485+00
1442	12	2	Main-d’œuvre carreleur — cuisine	h	55.86	6.00	t	2026-10-10 17:57:15.49+00	2026-10-10 17:57:15.49+00
1443	12	2	Main-d’œuvre carreleur — premium	h	64.79	6.00	t	2026-10-10 17:57:15.496+00	2026-10-10 17:57:15.496+00
1444	12	3	Pose WC suspendu — standard	piece	428.07	\N	t	2026-10-10 17:57:15.501+00	2026-10-10 17:57:15.501+00
1445	12	3	Pose WC suspendu — salle de bain	piece	513.62	\N	t	2026-10-10 17:57:15.506+00	2026-10-10 17:57:15.506+00
1446	12	3	Pose WC suspendu — cuisine	piece	441.40	\N	t	2026-10-10 17:57:15.51+00	2026-10-10 17:57:15.51+00
1447	12	3	Pose WC suspendu — premium	piece	555.68	\N	t	2026-10-10 17:57:15.515+00	2026-10-10 17:57:15.515+00
1448	12	3	Pose lavabo — standard	piece	272.93	\N	f	2026-10-10 17:57:15.519+00	2026-10-10 17:57:15.519+00
1449	12	3	Pose lavabo — salle de bain	piece	275.89	\N	t	2026-10-10 17:57:15.524+00	2026-10-10 17:57:15.524+00
1450	12	3	Pose lavabo — cuisine	piece	273.85	\N	f	2026-10-10 17:57:15.528+00	2026-10-10 17:57:15.528+00
1451	12	3	Pose lavabo — premium	piece	341.35	\N	t	2026-10-10 17:57:15.533+00	2026-10-10 17:57:15.533+00
1452	12	3	Tuyauterie multicouche — standard	ml	28.35	\N	t	2026-10-10 17:57:15.537+00	2026-10-10 17:57:15.537+00
1453	12	3	Tuyauterie multicouche — salle de bain	ml	29.03	\N	t	2026-10-10 17:57:15.542+00	2026-10-10 17:57:15.542+00
1454	12	3	Tuyauterie multicouche — cuisine	ml	28.30	\N	t	2026-10-10 17:57:15.547+00	2026-10-10 17:57:15.547+00
1455	12	3	Tuyauterie multicouche — premium	ml	34.74	\N	t	2026-10-10 17:57:15.553+00	2026-10-10 17:57:15.553+00
1456	12	3	Remplacement chauffe-eau — standard	piece	720.76	\N	t	2026-10-10 17:57:15.558+00	2026-10-10 17:57:15.558+00
1457	12	3	Remplacement chauffe-eau — salle de bain	piece	816.44	\N	t	2026-10-10 17:57:15.563+00	2026-10-10 17:57:15.563+00
1458	12	3	Remplacement chauffe-eau — cuisine	piece	734.01	\N	t	2026-10-10 17:57:15.568+00	2026-10-10 17:57:15.568+00
1459	12	3	Remplacement chauffe-eau — premium	piece	1020.52	\N	t	2026-10-10 17:57:15.573+00	2026-10-10 17:57:15.573+00
1460	12	3	Main-d’œuvre plombier — standard	h	51.75	6.00	t	2026-10-10 17:57:15.578+00	2026-10-10 17:57:15.578+00
1461	12	3	Main-d’œuvre plombier — salle de bain	h	65.48	6.00	t	2026-10-10 17:57:15.583+00	2026-10-10 17:57:15.583+00
1462	12	3	Main-d’œuvre plombier — cuisine	h	62.00	6.00	t	2026-10-10 17:57:15.588+00	2026-10-10 17:57:15.588+00
1463	12	3	Main-d’œuvre plombier — premium	h	75.71	6.00	t	2026-10-10 17:57:15.592+00	2026-10-10 17:57:15.592+00
1464	12	4	Point lumineux — standard	piece	83.25	\N	t	2026-10-10 17:57:15.596+00	2026-10-10 17:57:15.596+00
1465	12	4	Point lumineux — salle de bain	piece	93.55	\N	t	2026-10-10 17:57:15.599+00	2026-10-10 17:57:15.599+00
1466	12	4	Point lumineux — cuisine	piece	98.37	\N	t	2026-10-10 17:57:15.603+00	2026-10-10 17:57:15.603+00
1467	12	4	Point lumineux — premium	piece	121.85	\N	t	2026-10-10 17:57:15.607+00	2026-10-10 17:57:15.607+00
1468	12	4	Prise de courant — standard	piece	60.99	\N	t	2026-10-10 17:57:15.61+00	2026-10-10 17:57:15.61+00
1469	12	4	Prise de courant — salle de bain	piece	78.58	\N	t	2026-10-10 17:57:15.614+00	2026-10-10 17:57:15.614+00
1470	12	4	Prise de courant — cuisine	piece	67.00	\N	t	2026-10-10 17:57:15.618+00	2026-10-10 17:57:15.618+00
1471	12	4	Prise de courant — premium	piece	90.31	\N	t	2026-10-10 17:57:15.622+00	2026-10-10 17:57:15.622+00
1472	12	4	Câblage encastré — standard	ml	18.86	\N	t	2026-10-10 17:57:15.626+00	2026-10-10 17:57:15.626+00
1473	12	4	Câblage encastré — salle de bain	ml	20.53	\N	t	2026-10-10 17:57:15.631+00	2026-10-10 17:57:15.631+00
1474	12	4	Câblage encastré — cuisine	ml	21.21	\N	t	2026-10-10 17:57:15.635+00	2026-10-10 17:57:15.635+00
1475	12	4	Câblage encastré — premium	ml	25.29	\N	t	2026-10-10 17:57:15.639+00	2026-10-10 17:57:15.639+00
1476	12	4	Tableau électrique — standard	piece	1004.96	\N	t	2026-10-10 17:57:15.643+00	2026-10-10 17:57:15.643+00
1477	12	4	Tableau électrique — salle de bain	piece	1094.30	\N	t	2026-10-10 17:57:15.646+00	2026-10-10 17:57:15.646+00
1478	12	4	Tableau électrique — cuisine	piece	953.53	\N	t	2026-10-10 17:57:15.651+00	2026-10-10 17:57:15.651+00
1479	12	4	Tableau électrique — premium	piece	1275.09	\N	t	2026-10-10 17:57:15.656+00	2026-10-10 17:57:15.656+00
1480	12	4	Main-d’œuvre électricien — standard	h	51.76	6.00	t	2026-10-10 17:57:15.661+00	2026-10-10 17:57:15.661+00
1481	12	4	Main-d’œuvre électricien — salle de bain	h	64.01	6.00	t	2026-10-10 17:57:15.665+00	2026-10-10 17:57:15.665+00
1482	12	4	Main-d’œuvre électricien — cuisine	h	58.11	6.00	t	2026-10-10 17:57:15.671+00	2026-10-10 17:57:15.671+00
1483	12	4	Main-d’œuvre électricien — premium	h	66.91	6.00	t	2026-10-10 17:57:15.675+00	2026-10-10 17:57:15.675+00
1484	12	5	Mur en blocs — standard	m2	78.11	\N	t	2026-10-10 17:57:15.679+00	2026-10-10 17:57:15.679+00
1485	12	5	Mur en blocs — salle de bain	m2	94.13	\N	t	2026-10-10 17:57:15.684+00	2026-10-10 17:57:15.684+00
1486	12	5	Mur en blocs — cuisine	m2	79.94	\N	t	2026-10-10 17:57:15.689+00	2026-10-10 17:57:15.689+00
1487	12	5	Mur en blocs — premium	m2	98.79	\N	t	2026-10-10 17:57:15.693+00	2026-10-10 17:57:15.693+00
1488	12	5	Chape ciment — standard	m2	30.34	\N	t	2026-10-10 17:57:15.697+00	2026-10-10 17:57:15.697+00
1489	12	5	Chape ciment — salle de bain	m2	38.62	\N	f	2026-10-10 17:57:15.702+00	2026-10-10 17:57:15.702+00
1490	12	5	Chape ciment — cuisine	m2	35.01	\N	t	2026-10-10 17:57:15.705+00	2026-10-10 17:57:15.705+00
1491	12	5	Chape ciment — premium	m2	46.80	\N	t	2026-10-10 17:57:15.71+00	2026-10-10 17:57:15.71+00
1492	12	5	Ouverture de baie — standard	piece	1327.15	\N	t	2026-10-10 17:57:15.714+00	2026-10-10 17:57:15.714+00
1493	12	5	Ouverture de baie — salle de bain	piece	1681.92	\N	t	2026-10-10 17:57:15.718+00	2026-10-10 17:57:15.718+00
1494	12	5	Ouverture de baie — cuisine	piece	1668.40	\N	t	2026-10-10 17:57:15.722+00	2026-10-10 17:57:15.722+00
1495	12	5	Ouverture de baie — premium	piece	2115.14	\N	t	2026-10-10 17:57:15.726+00	2026-10-10 17:57:15.726+00
1496	12	5	Rejointoyage façade — standard	m2	40.84	\N	t	2026-10-10 17:57:15.73+00	2026-10-10 17:57:15.73+00
1497	12	5	Rejointoyage façade — salle de bain	m2	44.57	\N	t	2026-10-10 17:57:15.734+00	2026-10-10 17:57:15.734+00
1498	12	5	Rejointoyage façade — cuisine	m2	37.67	\N	t	2026-10-10 17:57:15.738+00	2026-10-10 17:57:15.738+00
1499	12	5	Rejointoyage façade — premium	m2	55.53	\N	t	2026-10-10 17:57:15.741+00	2026-10-10 17:57:15.741+00
1500	12	5	Main-d’œuvre maçon — standard	h	51.68	6.00	t	2026-10-10 17:57:15.745+00	2026-10-10 17:57:15.745+00
1501	12	5	Main-d’œuvre maçon — salle de bain	h	53.56	6.00	t	2026-10-10 17:57:15.75+00	2026-10-10 17:57:15.75+00
1502	12	5	Main-d’œuvre maçon — cuisine	h	49.98	6.00	t	2026-10-10 17:57:15.754+00	2026-10-10 17:57:15.754+00
1503	12	5	Main-d’œuvre maçon — premium	h	67.07	6.00	t	2026-10-10 17:57:15.759+00	2026-10-10 17:57:15.759+00
1504	12	6	Pose porte intérieure — standard	piece	316.60	\N	t	2026-10-10 17:57:15.763+00	2026-10-10 17:57:15.763+00
1505	12	6	Pose porte intérieure — salle de bain	piece	399.21	\N	t	2026-10-10 17:57:15.767+00	2026-10-10 17:57:15.767+00
1506	12	6	Pose porte intérieure — cuisine	piece	375.14	\N	t	2026-10-10 17:57:15.771+00	2026-10-10 17:57:15.771+00
1507	12	6	Pose porte intérieure — premium	piece	426.79	\N	t	2026-10-10 17:57:15.776+00	2026-10-10 17:57:15.776+00
1508	12	6	Pose châssis — standard	piece	823.90	\N	t	2026-10-10 17:57:15.781+00	2026-10-10 17:57:15.781+00
1509	12	6	Pose châssis — salle de bain	piece	980.52	\N	f	2026-10-10 17:57:15.785+00	2026-10-10 17:57:15.785+00
1510	12	6	Pose châssis — cuisine	piece	811.13	\N	t	2026-10-10 17:57:15.789+00	2026-10-10 17:57:15.789+00
1511	12	6	Pose châssis — premium	piece	1125.53	\N	t	2026-10-10 17:57:15.793+00	2026-10-10 17:57:15.793+00
1512	12	6	Habillage escalier — standard	piece	2062.35	\N	t	2026-10-10 17:57:15.798+00	2026-10-10 17:57:15.798+00
1513	12	6	Habillage escalier — salle de bain	piece	2361.30	\N	f	2026-10-10 17:57:15.802+00	2026-10-10 17:57:15.802+00
1514	12	6	Habillage escalier — cuisine	piece	2045.47	\N	t	2026-10-10 17:57:15.806+00	2026-10-10 17:57:15.806+00
1515	12	6	Habillage escalier — premium	piece	2798.37	\N	t	2026-10-10 17:57:15.811+00	2026-10-10 17:57:15.811+00
1516	12	6	Placard sur mesure — standard	ml	446.54	\N	t	2026-10-10 17:57:15.815+00	2026-10-10 17:57:15.815+00
1517	12	6	Placard sur mesure — salle de bain	ml	431.54	\N	t	2026-10-10 17:57:15.82+00	2026-10-10 17:57:15.82+00
1518	12	6	Placard sur mesure — cuisine	ml	453.29	\N	t	2026-10-10 17:57:15.825+00	2026-10-10 17:57:15.825+00
1519	12	6	Placard sur mesure — premium	ml	570.00	\N	t	2026-10-10 17:57:15.83+00	2026-10-10 17:57:15.83+00
1520	12	6	Main-d’œuvre menuisier — standard	h	50.27	6.00	t	2026-10-10 17:57:15.834+00	2026-10-10 17:57:15.834+00
1521	12	6	Main-d’œuvre menuisier — salle de bain	h	63.37	6.00	t	2026-10-10 17:57:15.838+00	2026-10-10 17:57:15.838+00
1522	12	6	Main-d’œuvre menuisier — cuisine	h	62.81	6.00	t	2026-10-10 17:57:15.842+00	2026-10-10 17:57:15.842+00
1523	12	6	Main-d’œuvre menuisier — premium	h	76.04	6.00	t	2026-10-10 17:57:15.845+00	2026-10-10 17:57:15.845+00
1524	12	7	Couverture tuiles — standard	m2	97.86	\N	f	2026-10-10 17:57:15.85+00	2026-10-10 17:57:15.85+00
1525	12	7	Couverture tuiles — salle de bain	m2	99.13	\N	t	2026-10-10 17:57:15.856+00	2026-10-10 17:57:15.856+00
1526	12	7	Couverture tuiles — cuisine	m2	109.42	\N	t	2026-10-10 17:57:15.86+00	2026-10-10 17:57:15.86+00
1527	12	7	Couverture tuiles — premium	m2	139.77	\N	t	2026-10-10 17:57:15.865+00	2026-10-10 17:57:15.865+00
1528	12	7	Membrane EPDM — standard	m2	66.88	\N	t	2026-10-10 17:57:15.869+00	2026-10-10 17:57:15.869+00
1529	12	7	Membrane EPDM — salle de bain	m2	73.56	\N	f	2026-10-10 17:57:15.874+00	2026-10-10 17:57:15.874+00
1530	12	7	Membrane EPDM — cuisine	m2	74.40	\N	t	2026-10-10 17:57:15.879+00	2026-10-10 17:57:15.879+00
1531	12	7	Membrane EPDM — premium	m2	99.35	\N	t	2026-10-10 17:57:15.883+00	2026-10-10 17:57:15.883+00
1532	12	7	Gouttière zinc — standard	ml	52.91	\N	t	2026-10-10 17:57:15.889+00	2026-10-10 17:57:15.889+00
1533	12	7	Gouttière zinc — salle de bain	ml	56.07	\N	t	2026-10-10 17:57:15.893+00	2026-10-10 17:57:15.893+00
1534	12	7	Gouttière zinc — cuisine	ml	53.98	\N	t	2026-10-10 17:57:15.898+00	2026-10-10 17:57:15.898+00
1535	12	7	Gouttière zinc — premium	ml	69.73	\N	t	2026-10-10 17:57:15.903+00	2026-10-10 17:57:15.903+00
1536	12	7	Velux — standard	piece	1090.11	\N	t	2026-10-10 17:57:15.908+00	2026-10-10 17:57:15.908+00
1537	12	7	Velux — salle de bain	piece	1404.18	\N	t	2026-10-10 17:57:15.914+00	2026-10-10 17:57:15.914+00
1538	12	7	Velux — cuisine	piece	1254.95	\N	t	2026-10-10 17:57:15.919+00	2026-10-10 17:57:15.919+00
1539	12	7	Velux — premium	piece	1412.05	\N	t	2026-10-10 17:57:15.924+00	2026-10-10 17:57:15.924+00
1540	12	7	Main-d’œuvre couvreur — standard	h	52.99	6.00	t	2026-10-10 17:57:15.929+00	2026-10-10 17:57:15.929+00
1541	12	7	Main-d’œuvre couvreur — salle de bain	h	65.85	6.00	f	2026-10-10 17:57:15.933+00	2026-10-10 17:57:15.933+00
1542	12	7	Main-d’œuvre couvreur — cuisine	h	65.99	6.00	t	2026-10-10 17:57:15.938+00	2026-10-10 17:57:15.938+00
1543	12	7	Main-d’œuvre couvreur — premium	h	84.50	6.00	f	2026-10-10 17:57:15.942+00	2026-10-10 17:57:15.942+00
1544	12	8	Isolation laine de verre — standard	m2	24.17	\N	t	2026-10-10 17:57:15.947+00	2026-10-10 17:57:15.947+00
1545	12	8	Isolation laine de verre — salle de bain	m2	32.73	\N	t	2026-10-10 17:57:15.952+00	2026-10-10 17:57:15.952+00
1546	12	8	Isolation laine de verre — cuisine	m2	26.54	\N	t	2026-10-10 17:57:15.956+00	2026-10-10 17:57:15.956+00
1547	12	8	Isolation laine de verre — premium	m2	37.03	\N	t	2026-10-10 17:57:15.96+00	2026-10-10 17:57:15.96+00
1548	12	8	Isolation PIR toiture — standard	m2	44.60	\N	t	2026-10-10 17:57:15.965+00	2026-10-10 17:57:15.965+00
1549	12	8	Isolation PIR toiture — salle de bain	m2	52.86	\N	t	2026-10-10 17:57:15.969+00	2026-10-10 17:57:15.969+00
1550	12	8	Isolation PIR toiture — cuisine	m2	50.98	\N	t	2026-10-10 17:57:15.973+00	2026-10-10 17:57:15.973+00
1551	12	8	Isolation PIR toiture — premium	m2	58.64	\N	t	2026-10-10 17:57:15.978+00	2026-10-10 17:57:15.978+00
1552	12	8	Isolation façade ETICS — standard	m2	117.53	\N	t	2026-10-10 17:57:15.982+00	2026-10-10 17:57:15.982+00
1553	12	8	Isolation façade ETICS — salle de bain	m2	142.98	\N	t	2026-10-10 17:57:15.986+00	2026-10-10 17:57:15.986+00
1554	12	8	Isolation façade ETICS — cuisine	m2	134.23	\N	t	2026-10-10 17:57:15.991+00	2026-10-10 17:57:15.991+00
1555	12	8	Isolation façade ETICS — premium	m2	148.89	\N	t	2026-10-10 17:57:15.995+00	2026-10-10 17:57:15.995+00
1556	12	8	Pare-vapeur — standard	m2	8.39	\N	t	2026-10-10 17:57:16+00	2026-10-10 17:57:16+00
1557	12	8	Pare-vapeur — salle de bain	m2	9.95	\N	t	2026-10-10 17:57:16.005+00	2026-10-10 17:57:16.005+00
1558	12	8	Pare-vapeur — cuisine	m2	10.32	\N	t	2026-10-10 17:57:16.009+00	2026-10-10 17:57:16.009+00
1559	12	8	Pare-vapeur — premium	m2	12.05	\N	t	2026-10-10 17:57:16.013+00	2026-10-10 17:57:16.013+00
1560	12	8	Main-d’œuvre isolation — standard	h	49.65	6.00	t	2026-10-10 17:57:16.018+00	2026-10-10 17:57:16.018+00
1561	12	8	Main-d’œuvre isolation — salle de bain	h	47.63	6.00	t	2026-10-10 17:57:16.022+00	2026-10-10 17:57:16.022+00
1562	12	8	Main-d’œuvre isolation — cuisine	h	55.60	6.00	t	2026-10-10 17:57:16.027+00	2026-10-10 17:57:16.027+00
1563	12	8	Main-d’œuvre isolation — premium	h	63.49	6.00	t	2026-10-10 17:57:16.031+00	2026-10-10 17:57:16.031+00
1564	12	9	Parquet contrecollé — standard	m2	60.96	\N	t	2026-10-10 17:57:16.036+00	2026-10-10 17:57:16.036+00
1565	12	9	Parquet contrecollé — salle de bain	m2	74.56	\N	t	2026-10-10 17:57:16.04+00	2026-10-10 17:57:16.04+00
1566	12	9	Parquet contrecollé — cuisine	m2	65.76	\N	t	2026-10-10 17:57:16.045+00	2026-10-10 17:57:16.045+00
1567	12	9	Parquet contrecollé — premium	m2	84.78	\N	t	2026-10-10 17:57:16.049+00	2026-10-10 17:57:16.049+00
1568	12	9	Sol vinyle clipsable — standard	m2	33.62	\N	t	2026-10-10 17:57:16.053+00	2026-10-10 17:57:16.053+00
1569	12	9	Sol vinyle clipsable — salle de bain	m2	43.48	\N	t	2026-10-10 17:57:16.057+00	2026-10-10 17:57:16.057+00
1570	12	9	Sol vinyle clipsable — cuisine	m2	38.46	\N	t	2026-10-10 17:57:16.062+00	2026-10-10 17:57:16.062+00
1571	12	9	Sol vinyle clipsable — premium	m2	49.75	\N	t	2026-10-10 17:57:16.066+00	2026-10-10 17:57:16.066+00
1572	12	9	Ragréage — standard	m2	15.22	\N	t	2026-10-10 17:57:16.07+00	2026-10-10 17:57:16.07+00
1573	12	9	Ragréage — salle de bain	m2	17.13	\N	t	2026-10-10 17:57:16.074+00	2026-10-10 17:57:16.074+00
1574	12	9	Ragréage — cuisine	m2	16.13	\N	t	2026-10-10 17:57:16.079+00	2026-10-10 17:57:16.079+00
1575	12	9	Ragréage — premium	m2	19.43	\N	t	2026-10-10 17:57:16.083+00	2026-10-10 17:57:16.083+00
1576	12	9	Plinthes bois — standard	ml	12.06	\N	t	2026-10-10 17:57:16.087+00	2026-10-10 17:57:16.087+00
1577	12	9	Plinthes bois — salle de bain	ml	13.98	\N	t	2026-10-10 17:57:16.093+00	2026-10-10 17:57:16.093+00
1578	12	9	Plinthes bois — cuisine	ml	13.37	\N	t	2026-10-10 17:57:16.097+00	2026-10-10 17:57:16.097+00
1579	12	9	Plinthes bois — premium	ml	16.23	\N	t	2026-10-10 17:57:16.102+00	2026-10-10 17:57:16.102+00
1580	12	9	Main-d’œuvre poseur de sol — standard	h	40.47	6.00	t	2026-10-10 17:57:16.106+00	2026-10-10 17:57:16.106+00
1581	12	9	Main-d’œuvre poseur de sol — salle de bain	h	52.79	6.00	t	2026-10-10 17:57:16.111+00	2026-10-10 17:57:16.111+00
1582	12	9	Main-d’œuvre poseur de sol — cuisine	h	45.92	6.00	t	2026-10-10 17:57:16.116+00	2026-10-10 17:57:16.116+00
1583	12	9	Main-d’œuvre poseur de sol — premium	h	54.01	6.00	t	2026-10-10 17:57:16.12+00	2026-10-10 17:57:16.12+00
1584	12	10	Démolition cloison — standard	m2	24.47	\N	t	2026-10-10 17:57:16.124+00	2026-10-10 17:57:16.124+00
1585	12	10	Démolition cloison — salle de bain	m2	30.09	\N	t	2026-10-10 17:57:16.128+00	2026-10-10 17:57:16.128+00
1586	12	10	Démolition cloison — cuisine	m2	27.44	\N	t	2026-10-10 17:57:16.132+00	2026-10-10 17:57:16.132+00
1587	12	10	Démolition cloison — premium	m2	32.12	\N	t	2026-10-10 17:57:16.136+00	2026-10-10 17:57:16.136+00
1588	12	10	Dépose carrelage — standard	m2	20.50	\N	t	2026-10-10 17:57:16.141+00	2026-10-10 17:57:16.141+00
1589	12	10	Dépose carrelage — salle de bain	m2	19.74	\N	t	2026-10-10 17:57:16.146+00	2026-10-10 17:57:16.146+00
1590	12	10	Dépose carrelage — cuisine	m2	19.80	\N	t	2026-10-10 17:57:16.151+00	2026-10-10 17:57:16.151+00
1591	12	10	Dépose carrelage — premium	m2	25.06	\N	t	2026-10-10 17:57:16.155+00	2026-10-10 17:57:16.155+00
1592	12	10	Évacuation gravats — standard	piece	267.11	\N	t	2026-10-10 17:57:16.159+00	2026-10-10 17:57:16.159+00
1593	12	10	Évacuation gravats — salle de bain	piece	323.41	\N	t	2026-10-10 17:57:16.163+00	2026-10-10 17:57:16.163+00
1594	12	10	Évacuation gravats — cuisine	piece	306.88	\N	t	2026-10-10 17:57:16.167+00	2026-10-10 17:57:16.167+00
1595	12	10	Évacuation gravats — premium	piece	366.12	\N	t	2026-10-10 17:57:16.171+00	2026-10-10 17:57:16.171+00
1596	12	10	Décapage sol — standard	m2	12.65	\N	t	2026-10-10 17:57:16.175+00	2026-10-10 17:57:16.175+00
1597	12	10	Décapage sol — salle de bain	m2	14.95	\N	t	2026-10-10 17:57:16.179+00	2026-10-10 17:57:16.179+00
1598	12	10	Décapage sol — cuisine	m2	12.91	\N	t	2026-10-10 17:57:16.182+00	2026-10-10 17:57:16.182+00
1599	12	10	Décapage sol — premium	m2	18.98	\N	f	2026-10-10 17:57:16.186+00	2026-10-10 17:57:16.186+00
1600	12	10	Main-d’œuvre démolition — standard	h	36.14	6.00	t	2026-10-10 17:57:16.19+00	2026-10-10 17:57:16.19+00
1601	12	10	Main-d’œuvre démolition — salle de bain	h	48.29	6.00	t	2026-10-10 17:57:16.194+00	2026-10-10 17:57:16.194+00
1602	12	10	Main-d’œuvre démolition — cuisine	h	44.93	6.00	t	2026-10-10 17:57:16.198+00	2026-10-10 17:57:16.198+00
1603	12	10	Main-d’œuvre démolition — premium	h	56.60	6.00	t	2026-10-10 17:57:16.203+00	2026-10-10 17:57:16.203+00
1604	13	1	Peinture murale 2 couches — standard	m2	18.76	\N	t	2026-10-10 17:57:16.21+00	2026-10-10 17:57:16.21+00
1605	13	1	Peinture murale 2 couches — salle de bain	m2	21.58	\N	t	2026-10-10 17:57:16.214+00	2026-10-10 17:57:16.214+00
1606	13	1	Peinture murale 2 couches — cuisine	m2	20.80	\N	t	2026-10-10 17:57:16.219+00	2026-10-10 17:57:16.219+00
1607	13	1	Peinture murale 2 couches — premium	m2	23.69	\N	t	2026-10-10 17:57:16.227+00	2026-10-10 17:57:16.227+00
1608	13	1	Peinture plafond — standard	m2	23.31	\N	t	2026-10-10 17:57:16.231+00	2026-10-10 17:57:16.231+00
1609	13	1	Peinture plafond — salle de bain	m2	26.70	\N	t	2026-10-10 17:57:16.24+00	2026-10-10 17:57:16.24+00
1610	13	1	Peinture plafond — cuisine	m2	24.18	\N	t	2026-10-10 17:57:16.244+00	2026-10-10 17:57:16.244+00
1611	13	1	Peinture plafond — premium	m2	27.97	\N	t	2026-10-10 17:57:16.247+00	2026-10-10 17:57:16.247+00
1612	13	1	Laquage boiseries — standard	ml	14.48	\N	t	2026-10-10 17:57:16.252+00	2026-10-10 17:57:16.252+00
1613	13	1	Laquage boiseries — salle de bain	ml	14.68	\N	t	2026-10-10 17:57:16.256+00	2026-10-10 17:57:16.256+00
1614	13	1	Laquage boiseries — cuisine	ml	16.65	\N	t	2026-10-10 17:57:16.26+00	2026-10-10 17:57:16.26+00
1615	13	1	Laquage boiseries — premium	ml	18.46	\N	t	2026-10-10 17:57:16.268+00	2026-10-10 17:57:16.268+00
1616	13	1	Enduit de lissage — standard	m2	11.00	\N	t	2026-10-10 17:57:16.273+00	2026-10-10 17:57:16.273+00
1617	13	1	Enduit de lissage — salle de bain	m2	12.47	\N	t	2026-10-10 17:57:16.278+00	2026-10-10 17:57:16.278+00
1618	13	1	Enduit de lissage — cuisine	m2	12.36	\N	t	2026-10-10 17:57:16.283+00	2026-10-10 17:57:16.283+00
1619	13	1	Enduit de lissage — premium	m2	17.52	\N	t	2026-10-10 17:57:16.287+00	2026-10-10 17:57:16.287+00
1620	13	1	Main-d’œuvre peintre — standard	h	46.56	6.00	t	2026-10-10 17:57:16.29+00	2026-10-10 17:57:16.29+00
1621	13	1	Main-d’œuvre peintre — salle de bain	h	50.99	6.00	t	2026-10-10 17:57:16.293+00	2026-10-10 17:57:16.293+00
1622	13	1	Main-d’œuvre peintre — cuisine	h	52.56	6.00	t	2026-10-10 17:57:16.296+00	2026-10-10 17:57:16.296+00
1623	13	1	Main-d’œuvre peintre — premium	h	65.78	6.00	t	2026-10-10 17:57:16.3+00	2026-10-10 17:57:16.3+00
1624	13	2	Pose carrelage sol — standard	m2	43.40	\N	t	2026-10-10 17:57:16.309+00	2026-10-10 17:57:16.309+00
1625	13	2	Pose carrelage sol — salle de bain	m2	52.10	\N	f	2026-10-10 17:57:16.325+00	2026-10-10 17:57:16.325+00
1626	13	2	Pose carrelage sol — cuisine	m2	52.27	\N	t	2026-10-10 17:57:16.357+00	2026-10-10 17:57:16.357+00
1627	13	2	Pose carrelage sol — premium	m2	69.41	\N	t	2026-10-10 17:57:16.361+00	2026-10-10 17:57:16.361+00
1628	13	2	Pose faïence murale — standard	m2	47.34	\N	t	2026-10-10 17:57:16.372+00	2026-10-10 17:57:16.372+00
1629	13	2	Pose faïence murale — salle de bain	m2	57.19	\N	t	2026-10-10 17:57:16.387+00	2026-10-10 17:57:16.387+00
1630	13	2	Pose faïence murale — cuisine	m2	58.12	\N	t	2026-10-10 17:57:16.391+00	2026-10-10 17:57:16.391+00
1631	13	2	Pose faïence murale — premium	m2	69.22	\N	t	2026-10-10 17:57:16.396+00	2026-10-10 17:57:16.396+00
1632	13	2	Plinthes carrelées — standard	ml	15.18	\N	t	2026-10-10 17:57:16.401+00	2026-10-10 17:57:16.401+00
1633	13	2	Plinthes carrelées — salle de bain	ml	18.82	\N	t	2026-10-10 17:57:16.409+00	2026-10-10 17:57:16.409+00
1634	13	2	Plinthes carrelées — cuisine	ml	17.70	\N	t	2026-10-10 17:57:16.413+00	2026-10-10 17:57:16.413+00
1635	13	2	Plinthes carrelées — premium	ml	22.57	\N	t	2026-10-10 17:57:16.425+00	2026-10-10 17:57:16.425+00
1636	13	2	Joints époxy — standard	m2	11.29	\N	t	2026-10-10 17:57:16.429+00	2026-10-10 17:57:16.429+00
1637	13	2	Joints époxy — salle de bain	m2	13.03	\N	f	2026-10-10 17:57:16.44+00	2026-10-10 17:57:16.44+00
1638	13	2	Joints époxy — cuisine	m2	11.53	\N	t	2026-10-10 17:57:16.446+00	2026-10-10 17:57:16.446+00
1639	13	2	Joints époxy — premium	m2	15.71	\N	t	2026-10-10 17:57:16.451+00	2026-10-10 17:57:16.451+00
1640	13	2	Main-d’œuvre carreleur — standard	h	46.45	6.00	t	2026-10-10 17:57:16.461+00	2026-10-10 17:57:16.461+00
1641	13	2	Main-d’œuvre carreleur — salle de bain	h	57.69	6.00	t	2026-10-10 17:57:16.466+00	2026-10-10 17:57:16.466+00
1642	13	2	Main-d’œuvre carreleur — cuisine	h	54.83	6.00	t	2026-10-10 17:57:16.471+00	2026-10-10 17:57:16.471+00
1643	13	2	Main-d’œuvre carreleur — premium	h	59.03	6.00	t	2026-10-10 17:57:16.476+00	2026-10-10 17:57:16.476+00
1644	13	3	Pose WC suspendu — standard	piece	426.37	\N	f	2026-10-10 17:57:16.48+00	2026-10-10 17:57:16.48+00
1645	13	3	Pose WC suspendu — salle de bain	piece	519.81	\N	t	2026-10-10 17:57:16.489+00	2026-10-10 17:57:16.489+00
1646	13	3	Pose WC suspendu — cuisine	piece	499.57	\N	t	2026-10-10 17:57:16.494+00	2026-10-10 17:57:16.494+00
1647	13	3	Pose WC suspendu — premium	piece	569.38	\N	t	2026-10-10 17:57:16.499+00	2026-10-10 17:57:16.499+00
1648	13	3	Pose lavabo — standard	piece	264.61	\N	t	2026-10-10 17:57:16.508+00	2026-10-10 17:57:16.508+00
1649	13	3	Pose lavabo — salle de bain	piece	278.93	\N	t	2026-10-10 17:57:16.512+00	2026-10-10 17:57:16.512+00
1650	13	3	Pose lavabo — cuisine	piece	309.25	\N	t	2026-10-10 17:57:16.521+00	2026-10-10 17:57:16.521+00
1651	13	3	Pose lavabo — premium	piece	384.00	\N	t	2026-10-10 17:57:16.526+00	2026-10-10 17:57:16.526+00
1652	13	3	Tuyauterie multicouche — standard	ml	28.67	\N	t	2026-10-10 17:57:16.53+00	2026-10-10 17:57:16.53+00
1653	13	3	Tuyauterie multicouche — salle de bain	ml	32.51	\N	t	2026-10-10 17:57:16.547+00	2026-10-10 17:57:16.547+00
1654	13	3	Tuyauterie multicouche — cuisine	ml	32.48	\N	t	2026-10-10 17:57:16.557+00	2026-10-10 17:57:16.557+00
1655	13	3	Tuyauterie multicouche — premium	ml	39.52	\N	t	2026-10-10 17:57:16.56+00	2026-10-10 17:57:16.56+00
1656	13	3	Remplacement chauffe-eau — standard	piece	730.67	\N	t	2026-10-10 17:57:16.569+00	2026-10-10 17:57:16.569+00
1657	13	3	Remplacement chauffe-eau — salle de bain	piece	752.69	\N	t	2026-10-10 17:57:16.574+00	2026-10-10 17:57:16.574+00
1658	13	3	Remplacement chauffe-eau — cuisine	piece	774.88	\N	t	2026-10-10 17:57:16.579+00	2026-10-10 17:57:16.579+00
1659	13	3	Remplacement chauffe-eau — premium	piece	960.22	\N	t	2026-10-10 17:57:16.589+00	2026-10-10 17:57:16.589+00
1660	13	3	Main-d’œuvre plombier — standard	h	53.30	6.00	t	2026-10-10 17:57:16.596+00	2026-10-10 17:57:16.596+00
1661	13	3	Main-d’œuvre plombier — salle de bain	h	63.50	6.00	t	2026-10-10 17:57:16.601+00	2026-10-10 17:57:16.601+00
1662	13	3	Main-d’œuvre plombier — cuisine	h	58.84	6.00	t	2026-10-10 17:57:16.606+00	2026-10-10 17:57:16.606+00
1663	13	3	Main-d’œuvre plombier — premium	h	79.56	6.00	t	2026-10-10 17:57:16.609+00	2026-10-10 17:57:16.609+00
1664	13	4	Point lumineux — standard	piece	84.95	\N	t	2026-10-10 17:57:16.614+00	2026-10-10 17:57:16.614+00
1665	13	4	Point lumineux — salle de bain	piece	102.81	\N	t	2026-10-10 17:57:16.618+00	2026-10-10 17:57:16.618+00
1666	13	4	Point lumineux — cuisine	piece	87.76	\N	t	2026-10-10 17:57:16.622+00	2026-10-10 17:57:16.622+00
1667	13	4	Point lumineux — premium	piece	113.23	\N	t	2026-10-10 17:57:16.626+00	2026-10-10 17:57:16.626+00
1668	13	4	Prise de courant — standard	piece	67.57	\N	t	2026-10-10 17:57:16.637+00	2026-10-10 17:57:16.637+00
1669	13	4	Prise de courant — salle de bain	piece	78.03	\N	t	2026-10-10 17:57:16.641+00	2026-10-10 17:57:16.641+00
1670	13	4	Prise de courant — cuisine	piece	74.62	\N	t	2026-10-10 17:57:16.649+00	2026-10-10 17:57:16.649+00
1671	13	4	Prise de courant — premium	piece	96.27	\N	t	2026-10-10 17:57:16.654+00	2026-10-10 17:57:16.654+00
1672	13	4	Câblage encastré — standard	ml	19.15	\N	t	2026-10-10 17:57:16.662+00	2026-10-10 17:57:16.662+00
1673	13	4	Câblage encastré — salle de bain	ml	20.41	\N	t	2026-10-10 17:57:16.666+00	2026-10-10 17:57:16.666+00
1674	13	4	Câblage encastré — cuisine	ml	22.90	\N	t	2026-10-10 17:57:16.671+00	2026-10-10 17:57:16.671+00
1675	13	4	Câblage encastré — premium	ml	26.44	\N	t	2026-10-10 17:57:16.678+00	2026-10-10 17:57:16.678+00
1676	13	4	Tableau électrique — standard	piece	863.71	\N	t	2026-10-10 17:57:16.682+00	2026-10-10 17:57:16.682+00
1677	13	4	Tableau électrique — salle de bain	piece	1136.41	\N	t	2026-10-10 17:57:16.692+00	2026-10-10 17:57:16.692+00
1678	13	4	Tableau électrique — cuisine	piece	1051.24	\N	t	2026-10-10 17:57:16.702+00	2026-10-10 17:57:16.702+00
1679	13	4	Tableau électrique — premium	piece	1265.55	\N	t	2026-10-10 17:57:16.71+00	2026-10-10 17:57:16.71+00
1680	13	4	Main-d’œuvre électricien — standard	h	59.56	6.00	t	2026-10-10 17:57:16.714+00	2026-10-10 17:57:16.714+00
1681	13	4	Main-d’œuvre électricien — salle de bain	h	60.09	6.00	t	2026-10-10 17:57:16.719+00	2026-10-10 17:57:16.719+00
1682	13	4	Main-d’œuvre électricien — cuisine	h	60.01	6.00	t	2026-10-10 17:57:16.722+00	2026-10-10 17:57:16.722+00
1683	13	4	Main-d’œuvre électricien — premium	h	72.15	6.00	t	2026-10-10 17:57:16.725+00	2026-10-10 17:57:16.725+00
1684	13	5	Mur en blocs — standard	m2	73.28	\N	t	2026-10-10 17:57:16.729+00	2026-10-10 17:57:16.729+00
1685	13	5	Mur en blocs — salle de bain	m2	89.04	\N	t	2026-10-10 17:57:16.737+00	2026-10-10 17:57:16.737+00
1686	13	5	Mur en blocs — cuisine	m2	75.50	\N	t	2026-10-10 17:57:16.741+00	2026-10-10 17:57:16.741+00
1687	13	5	Mur en blocs — premium	m2	103.41	\N	t	2026-10-10 17:57:16.745+00	2026-10-10 17:57:16.745+00
1688	13	5	Chape ciment — standard	m2	31.68	\N	t	2026-10-10 17:57:16.749+00	2026-10-10 17:57:16.749+00
1689	13	5	Chape ciment — salle de bain	m2	35.41	\N	t	2026-10-10 17:57:16.758+00	2026-10-10 17:57:16.758+00
1690	13	5	Chape ciment — cuisine	m2	35.21	\N	t	2026-10-10 17:57:16.766+00	2026-10-10 17:57:16.766+00
1691	13	5	Chape ciment — premium	m2	44.60	\N	t	2026-10-10 17:57:16.769+00	2026-10-10 17:57:16.769+00
1692	13	5	Ouverture de baie — standard	piece	1365.26	\N	t	2026-10-10 17:57:16.773+00	2026-10-10 17:57:16.773+00
1693	13	5	Ouverture de baie — salle de bain	piece	1503.24	\N	t	2026-10-10 17:57:16.777+00	2026-10-10 17:57:16.777+00
1694	13	5	Ouverture de baie — cuisine	piece	1705.32	\N	t	2026-10-10 17:57:16.78+00	2026-10-10 17:57:16.78+00
1695	13	5	Ouverture de baie — premium	piece	2113.95	\N	t	2026-10-10 17:57:16.789+00	2026-10-10 17:57:16.789+00
1696	13	5	Rejointoyage façade — standard	m2	37.61	\N	t	2026-10-10 17:57:16.793+00	2026-10-10 17:57:16.793+00
1697	13	5	Rejointoyage façade — salle de bain	m2	47.49	\N	t	2026-10-10 17:57:16.797+00	2026-10-10 17:57:16.797+00
1698	13	5	Rejointoyage façade — cuisine	m2	45.85	\N	t	2026-10-10 17:57:16.801+00	2026-10-10 17:57:16.801+00
1699	13	5	Rejointoyage façade — premium	m2	53.59	\N	t	2026-10-10 17:57:16.805+00	2026-10-10 17:57:16.805+00
1700	13	5	Main-d’œuvre maçon — standard	h	49.30	6.00	t	2026-10-10 17:57:16.814+00	2026-10-10 17:57:16.814+00
1701	13	5	Main-d’œuvre maçon — salle de bain	h	52.01	6.00	t	2026-10-10 17:57:16.818+00	2026-10-10 17:57:16.818+00
1702	13	5	Main-d’œuvre maçon — cuisine	h	49.89	6.00	t	2026-10-10 17:57:16.823+00	2026-10-10 17:57:16.823+00
1703	13	5	Main-d’œuvre maçon — premium	h	69.84	6.00	t	2026-10-10 17:57:16.827+00	2026-10-10 17:57:16.827+00
1704	13	6	Pose porte intérieure — standard	piece	340.46	\N	t	2026-10-10 17:57:16.832+00	2026-10-10 17:57:16.832+00
1705	13	6	Pose porte intérieure — salle de bain	piece	381.60	\N	t	2026-10-10 17:57:16.843+00	2026-10-10 17:57:16.843+00
1706	13	6	Pose porte intérieure — cuisine	piece	320.02	\N	t	2026-10-10 17:57:16.853+00	2026-10-10 17:57:16.853+00
1707	13	6	Pose porte intérieure — premium	piece	402.02	\N	t	2026-10-10 17:57:16.857+00	2026-10-10 17:57:16.857+00
1708	13	6	Pose châssis — standard	piece	822.48	\N	t	2026-10-10 17:57:16.861+00	2026-10-10 17:57:16.861+00
1709	13	6	Pose châssis — salle de bain	piece	888.60	\N	t	2026-10-10 17:57:16.871+00	2026-10-10 17:57:16.871+00
1710	13	6	Pose châssis — cuisine	piece	812.24	\N	t	2026-10-10 17:57:16.881+00	2026-10-10 17:57:16.881+00
1711	13	6	Pose châssis — premium	piece	1114.15	\N	t	2026-10-10 17:57:16.886+00	2026-10-10 17:57:16.886+00
1712	13	6	Habillage escalier — standard	piece	1828.12	\N	t	2026-10-10 17:57:16.889+00	2026-10-10 17:57:16.889+00
1713	13	6	Habillage escalier — salle de bain	piece	2356.01	\N	t	2026-10-10 17:57:16.894+00	2026-10-10 17:57:16.894+00
1714	13	6	Habillage escalier — cuisine	piece	2154.15	\N	t	2026-10-10 17:57:16.905+00	2026-10-10 17:57:16.905+00
1715	13	6	Habillage escalier — premium	piece	2808.08	\N	t	2026-10-10 17:57:16.909+00	2026-10-10 17:57:16.909+00
1716	13	6	Placard sur mesure — standard	ml	441.22	\N	t	2026-10-10 17:57:16.914+00	2026-10-10 17:57:16.914+00
1717	13	6	Placard sur mesure — salle de bain	ml	491.00	\N	t	2026-10-10 17:57:16.918+00	2026-10-10 17:57:16.918+00
1718	13	6	Placard sur mesure — cuisine	ml	484.65	\N	t	2026-10-10 17:57:16.926+00	2026-10-10 17:57:16.926+00
1719	13	6	Placard sur mesure — premium	ml	512.10	\N	t	2026-10-10 17:57:16.936+00	2026-10-10 17:57:16.936+00
1720	13	6	Main-d’œuvre menuisier — standard	h	51.95	6.00	f	2026-10-10 17:57:16.941+00	2026-10-10 17:57:16.941+00
1721	13	6	Main-d’œuvre menuisier — salle de bain	h	57.26	6.00	t	2026-10-10 17:57:16.945+00	2026-10-10 17:57:16.945+00
1722	13	6	Main-d’œuvre menuisier — cuisine	h	55.16	6.00	t	2026-10-10 17:57:16.95+00	2026-10-10 17:57:16.95+00
1723	13	6	Main-d’œuvre menuisier — premium	h	64.13	6.00	t	2026-10-10 17:57:16.966+00	2026-10-10 17:57:16.966+00
1724	13	7	Couverture tuiles — standard	m2	98.60	\N	t	2026-10-10 17:57:16.973+00	2026-10-10 17:57:16.973+00
1725	13	7	Couverture tuiles — salle de bain	m2	103.60	\N	t	2026-10-10 17:57:16.985+00	2026-10-10 17:57:16.985+00
1726	13	7	Couverture tuiles — cuisine	m2	108.73	\N	t	2026-10-10 17:57:16.995+00	2026-10-10 17:57:16.995+00
1727	13	7	Couverture tuiles — premium	m2	122.93	\N	t	2026-10-10 17:57:17+00	2026-10-10 17:57:17+00
1728	13	7	Membrane EPDM — standard	m2	70.66	\N	t	2026-10-10 17:57:17.007+00	2026-10-10 17:57:17.007+00
1729	13	7	Membrane EPDM — salle de bain	m2	83.85	\N	t	2026-10-10 17:57:17.016+00	2026-10-10 17:57:17.016+00
1730	13	7	Membrane EPDM — cuisine	m2	68.71	\N	t	2026-10-10 17:57:17.02+00	2026-10-10 17:57:17.02+00
1731	13	7	Membrane EPDM — premium	m2	89.02	\N	t	2026-10-10 17:57:17.029+00	2026-10-10 17:57:17.029+00
1732	13	7	Gouttière zinc — standard	ml	52.09	\N	f	2026-10-10 17:57:17.033+00	2026-10-10 17:57:17.033+00
1733	13	7	Gouttière zinc — salle de bain	ml	57.76	\N	f	2026-10-10 17:57:17.038+00	2026-10-10 17:57:17.038+00
1734	13	7	Gouttière zinc — cuisine	ml	54.45	\N	t	2026-10-10 17:57:17.048+00	2026-10-10 17:57:17.048+00
1735	13	7	Gouttière zinc — premium	ml	69.02	\N	t	2026-10-10 17:57:17.061+00	2026-10-10 17:57:17.061+00
1736	13	7	Velux — standard	piece	1203.23	\N	t	2026-10-10 17:57:17.065+00	2026-10-10 17:57:17.065+00
1737	13	7	Velux — salle de bain	piece	1265.30	\N	t	2026-10-10 17:57:17.07+00	2026-10-10 17:57:17.07+00
1738	13	7	Velux — cuisine	piece	1357.78	\N	t	2026-10-10 17:57:17.075+00	2026-10-10 17:57:17.075+00
1739	13	7	Velux — premium	piece	1672.92	\N	t	2026-10-10 17:57:17.086+00	2026-10-10 17:57:17.086+00
1740	13	7	Main-d’œuvre couvreur — standard	h	57.94	6.00	t	2026-10-10 17:57:17.095+00	2026-10-10 17:57:17.095+00
1741	13	7	Main-d’œuvre couvreur — salle de bain	h	62.26	6.00	t	2026-10-10 17:57:17.099+00	2026-10-10 17:57:17.099+00
1742	13	7	Main-d’œuvre couvreur — cuisine	h	61.84	6.00	t	2026-10-10 17:57:17.103+00	2026-10-10 17:57:17.103+00
1743	13	7	Main-d’œuvre couvreur — premium	h	74.70	6.00	t	2026-10-10 17:57:17.107+00	2026-10-10 17:57:17.107+00
1744	13	8	Isolation laine de verre — standard	m2	28.02	\N	t	2026-10-10 17:57:17.111+00	2026-10-10 17:57:17.111+00
1745	13	8	Isolation laine de verre — salle de bain	m2	30.32	\N	t	2026-10-10 17:57:17.12+00	2026-10-10 17:57:17.12+00
1746	13	8	Isolation laine de verre — cuisine	m2	31.00	\N	t	2026-10-10 17:57:17.125+00	2026-10-10 17:57:17.125+00
1747	13	8	Isolation laine de verre — premium	m2	37.27	\N	t	2026-10-10 17:57:17.131+00	2026-10-10 17:57:17.131+00
1748	13	8	Isolation PIR toiture — standard	m2	42.11	\N	t	2026-10-10 17:57:17.139+00	2026-10-10 17:57:17.139+00
1749	13	8	Isolation PIR toiture — salle de bain	m2	46.29	\N	t	2026-10-10 17:57:17.142+00	2026-10-10 17:57:17.142+00
1750	13	8	Isolation PIR toiture — cuisine	m2	44.51	\N	t	2026-10-10 17:57:17.145+00	2026-10-10 17:57:17.145+00
1751	13	8	Isolation PIR toiture — premium	m2	60.89	\N	t	2026-10-10 17:57:17.154+00	2026-10-10 17:57:17.154+00
1752	13	8	Isolation façade ETICS — standard	m2	119.69	\N	t	2026-10-10 17:57:17.16+00	2026-10-10 17:57:17.16+00
1753	13	8	Isolation façade ETICS — salle de bain	m2	147.75	\N	t	2026-10-10 17:57:17.17+00	2026-10-10 17:57:17.17+00
1754	13	8	Isolation façade ETICS — cuisine	m2	141.21	\N	t	2026-10-10 17:57:17.178+00	2026-10-10 17:57:17.178+00
1755	13	8	Isolation façade ETICS — premium	m2	176.13	\N	t	2026-10-10 17:57:17.189+00	2026-10-10 17:57:17.189+00
1756	13	8	Pare-vapeur — standard	m2	8.30	\N	t	2026-10-10 17:57:17.193+00	2026-10-10 17:57:17.193+00
1757	13	8	Pare-vapeur — salle de bain	m2	10.65	\N	t	2026-10-10 17:57:17.198+00	2026-10-10 17:57:17.198+00
1758	13	8	Pare-vapeur — cuisine	m2	9.03	\N	t	2026-10-10 17:57:17.208+00	2026-10-10 17:57:17.208+00
1759	13	8	Pare-vapeur — premium	m2	12.05	\N	t	2026-10-10 17:57:17.212+00	2026-10-10 17:57:17.212+00
1760	13	8	Main-d’œuvre isolation — standard	h	48.97	6.00	t	2026-10-10 17:57:17.216+00	2026-10-10 17:57:17.216+00
1761	13	8	Main-d’œuvre isolation — salle de bain	h	48.92	6.00	t	2026-10-10 17:57:17.22+00	2026-10-10 17:57:17.22+00
1762	13	8	Main-d’œuvre isolation — cuisine	h	48.11	6.00	t	2026-10-10 17:57:17.225+00	2026-10-10 17:57:17.225+00
1763	13	8	Main-d’œuvre isolation — premium	h	58.69	6.00	t	2026-10-10 17:57:17.229+00	2026-10-10 17:57:17.229+00
1764	13	9	Parquet contrecollé — standard	m2	58.61	\N	t	2026-10-10 17:57:17.234+00	2026-10-10 17:57:17.234+00
1765	13	9	Parquet contrecollé — salle de bain	m2	77.85	\N	t	2026-10-10 17:57:17.239+00	2026-10-10 17:57:17.239+00
1766	13	9	Parquet contrecollé — cuisine	m2	73.38	\N	t	2026-10-10 17:57:17.243+00	2026-10-10 17:57:17.243+00
1767	13	9	Parquet contrecollé — premium	m2	81.34	\N	t	2026-10-10 17:57:17.246+00	2026-10-10 17:57:17.246+00
1768	13	9	Sol vinyle clipsable — standard	m2	32.65	\N	t	2026-10-10 17:57:17.25+00	2026-10-10 17:57:17.25+00
1769	13	9	Sol vinyle clipsable — salle de bain	m2	40.84	\N	t	2026-10-10 17:57:17.254+00	2026-10-10 17:57:17.254+00
1770	13	9	Sol vinyle clipsable — cuisine	m2	37.70	\N	t	2026-10-10 17:57:17.264+00	2026-10-10 17:57:17.264+00
1771	13	9	Sol vinyle clipsable — premium	m2	47.94	\N	t	2026-10-10 17:57:17.274+00	2026-10-10 17:57:17.274+00
1772	13	9	Ragréage — standard	m2	15.86	\N	t	2026-10-10 17:57:17.278+00	2026-10-10 17:57:17.278+00
1773	13	9	Ragréage — salle de bain	m2	16.70	\N	t	2026-10-10 17:57:17.282+00	2026-10-10 17:57:17.282+00
1774	13	9	Ragréage — cuisine	m2	17.61	\N	t	2026-10-10 17:57:17.287+00	2026-10-10 17:57:17.287+00
1775	13	9	Ragréage — premium	m2	21.01	\N	t	2026-10-10 17:57:17.29+00	2026-10-10 17:57:17.29+00
1776	13	9	Plinthes bois — standard	ml	11.43	\N	t	2026-10-10 17:57:17.295+00	2026-10-10 17:57:17.295+00
1777	13	9	Plinthes bois — salle de bain	ml	14.21	\N	t	2026-10-10 17:57:17.303+00	2026-10-10 17:57:17.303+00
1778	13	9	Plinthes bois — cuisine	ml	12.62	\N	t	2026-10-10 17:57:17.307+00	2026-10-10 17:57:17.307+00
1779	13	9	Plinthes bois — premium	ml	16.41	\N	t	2026-10-10 17:57:17.31+00	2026-10-10 17:57:17.31+00
1780	13	9	Main-d’œuvre poseur de sol — standard	h	39.89	6.00	t	2026-10-10 17:57:17.313+00	2026-10-10 17:57:17.313+00
1781	13	9	Main-d’œuvre poseur de sol — salle de bain	h	53.18	6.00	f	2026-10-10 17:57:17.317+00	2026-10-10 17:57:17.317+00
1782	13	9	Main-d’œuvre poseur de sol — cuisine	h	45.47	6.00	t	2026-10-10 17:57:17.321+00	2026-10-10 17:57:17.321+00
1783	13	9	Main-d’œuvre poseur de sol — premium	h	65.05	6.00	t	2026-10-10 17:57:17.324+00	2026-10-10 17:57:17.324+00
1784	13	10	Démolition cloison — standard	m2	26.16	\N	t	2026-10-10 17:57:17.327+00	2026-10-10 17:57:17.327+00
1785	13	10	Démolition cloison — salle de bain	m2	29.02	\N	t	2026-10-10 17:57:17.335+00	2026-10-10 17:57:17.335+00
1786	13	10	Démolition cloison — cuisine	m2	24.76	\N	t	2026-10-10 17:57:17.344+00	2026-10-10 17:57:17.344+00
1787	13	10	Démolition cloison — premium	m2	34.33	\N	t	2026-10-10 17:57:17.349+00	2026-10-10 17:57:17.349+00
1788	13	10	Dépose carrelage — standard	m2	18.35	\N	t	2026-10-10 17:57:17.354+00	2026-10-10 17:57:17.354+00
1789	13	10	Dépose carrelage — salle de bain	m2	22.36	\N	f	2026-10-10 17:57:17.363+00	2026-10-10 17:57:17.363+00
1790	13	10	Dépose carrelage — cuisine	m2	19.90	\N	t	2026-10-10 17:57:17.372+00	2026-10-10 17:57:17.372+00
1791	13	10	Dépose carrelage — premium	m2	26.43	\N	f	2026-10-10 17:57:17.381+00	2026-10-10 17:57:17.381+00
1792	13	10	Évacuation gravats — standard	piece	253.65	\N	t	2026-10-10 17:57:17.386+00	2026-10-10 17:57:17.386+00
1793	13	10	Évacuation gravats — salle de bain	piece	319.78	\N	t	2026-10-10 17:57:17.395+00	2026-10-10 17:57:17.395+00
1794	13	10	Évacuation gravats — cuisine	piece	285.36	\N	t	2026-10-10 17:57:17.4+00	2026-10-10 17:57:17.4+00
1795	13	10	Évacuation gravats — premium	piece	357.45	\N	t	2026-10-10 17:57:17.404+00	2026-10-10 17:57:17.404+00
1796	13	10	Décapage sol — standard	m2	13.60	\N	t	2026-10-10 17:57:17.413+00	2026-10-10 17:57:17.413+00
1797	13	10	Décapage sol — salle de bain	m2	14.42	\N	t	2026-10-10 17:57:17.423+00	2026-10-10 17:57:17.423+00
1798	13	10	Décapage sol — cuisine	m2	14.53	\N	t	2026-10-10 17:57:17.431+00	2026-10-10 17:57:17.431+00
1799	13	10	Décapage sol — premium	m2	16.34	\N	t	2026-10-10 17:57:17.441+00	2026-10-10 17:57:17.441+00
1800	13	10	Main-d’œuvre démolition — standard	h	42.12	6.00	t	2026-10-10 17:57:17.45+00	2026-10-10 17:57:17.45+00
1801	13	10	Main-d’œuvre démolition — salle de bain	h	46.00	6.00	t	2026-10-10 17:57:17.454+00	2026-10-10 17:57:17.454+00
1802	13	10	Main-d’œuvre démolition — cuisine	h	43.33	6.00	f	2026-10-10 17:57:17.458+00	2026-10-10 17:57:17.458+00
1803	13	10	Main-d’œuvre démolition — premium	h	49.52	6.00	f	2026-10-10 17:57:17.462+00	2026-10-10 17:57:17.462+00
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_movements (id, tenant_id, material_id, project_id, report_id, purchase_invoice_id, type, quantity, unit_price, movement_date, note, created_by, created_at, import_batch_id) FROM stdin;
1	1	1	\N	\N	\N	purchase	100.000	6.00	2026-10-08	\N	1	2026-10-08 23:22:37.205+00	\N
2	1	2	\N	\N	\N	purchase	40.000	2.00	2026-10-08	\N	1	2026-10-08 23:22:37.261+00	\N
3	1	3	\N	\N	\N	purchase	20.000	4.00	2026-10-08	\N	1	2026-10-08 23:22:37.314+00	\N
4	1	2	\N	\N	\N	adjustment	-38.000	2.00	2026-10-08	TEST damaged	2	2026-10-08 23:22:37.766+00	\N
5	1	2	\N	\N	\N	adjustment	38.000	2.00	2026-10-08	TEST correction	1	2026-10-08 23:22:38.284+00	\N
6	1	3	\N	\N	1	purchase	10.000	4.00	2026-10-08	\N	1	2026-10-08 23:29:36.379+00	\N
7	1	1	4	1	\N	consumption	-3.500	6.00	2026-10-08	\N	3	2026-10-08 23:40:19.901+00	\N
8	1	2	4	1	\N	consumption	-3.000	2.00	2026-10-08	\N	3	2026-10-08 23:40:19.927+00	\N
10	1	1	4	1	\N	consumption	-0.100	6.00	2026-10-08	\N	3	2026-10-08 23:40:21.369+00	\N
11	1	3	4	1	\N	consumption	-50.000	4.00	2026-10-08	\N	3	2026-10-08 23:40:21.604+00	\N
12	1	3	\N	\N	\N	adjustment	45.000	4.00	2026-10-08	TEST over-declared	1	2026-10-08 23:40:22.479+00	\N
13	1	5	\N	\N	\N	purchase	100.000	10.00	2026-10-08	TEST Brick initial stock	1	2026-10-08 23:50:33.695+00	\N
14	1	5	11	6	\N	consumption	-40.000	10.00	2026-10-08	\N	3	2026-10-08 23:51:17.778+00	\N
15	1	6	\N	\N	\N	purchase	50.000	2.00	2026-10-09	\N	1	2026-10-09 12:37:22.115+00	\N
16	1	6	\N	\N	\N	adjustment	-45.000	2.00	2026-10-09	TEST NOT-01	1	2026-10-09 12:37:22.672+00	\N
17	1	6	\N	\N	\N	adjustment	-1.000	2.00	2026-10-09	TEST NOT-03	1	2026-10-09 12:37:26.423+00	\N
18	1	6	\N	\N	\N	adjustment	-1.000	2.00	2026-10-09	NOT-28 test: bad Resend key	1	2026-10-09 20:34:13.232+00	\N
19	1	7	\N	\N	\N	adjustment	50.000	1.00	2026-10-09	NOT-28 start stock	1	2026-10-09 20:36:02.059+00	\N
20	1	7	\N	\N	\N	adjustment	-45.000	1.00	2026-10-09	NOT-28 test: bad Resend key	1	2026-10-09 20:36:02.101+00	\N
21	1	24	\N	\N	\N	adjustment	50.000	6.00	2026-10-10	Stock initial	2	2026-10-10 15:43:28.298+00	\N
22	1	25	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
23	1	26	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
24	1	27	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
25	1	28	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
26	1	29	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
27	1	30	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
28	1	31	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
29	1	32	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
30	1	33	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
31	1	34	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
32	1	35	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
33	1	36	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
34	1	37	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
35	1	38	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
36	1	39	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
37	1	40	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
38	1	41	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
39	1	42	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
40	1	43	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
41	1	44	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
42	1	45	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
43	1	46	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
44	1	47	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
45	1	48	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
46	1	49	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
47	1	50	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
48	1	51	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
49	1	52	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
50	1	53	\N	\N	\N	adjustment	2.000	50.00	2026-10-10	Stock initial	2	2026-10-10 17:31:57.702+00	1
51	1	5	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
52	1	25	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
53	1	34	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
54	1	35	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
55	1	36	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
56	1	37	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
57	1	38	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
58	1	39	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
59	1	40	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
60	1	41	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
61	1	42	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
62	1	43	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
63	1	26	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
64	1	44	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
65	1	45	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
66	1	46	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
67	1	47	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
68	1	48	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
69	1	49	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
70	1	50	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
71	1	51	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
72	1	52	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
73	1	53	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
74	1	27	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
75	1	28	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
76	1	29	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
77	1	30	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
78	1	31	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
79	1	32	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
80	1	33	\N	\N	\N	purchase	20.000	50.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
81	1	3	\N	\N	\N	purchase	20.000	4.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
82	1	7	\N	\N	\N	purchase	20.000	1.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
83	1	1	\N	\N	\N	purchase	20.000	6.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
84	1	6	\N	\N	\N	purchase	20.000	2.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
85	1	24	\N	\N	\N	purchase	20.000	6.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
86	1	2	\N	\N	\N	purchase	20.000	2.00	2026-12-05	\N	2	2026-10-10 17:34:12.542+00	2
87	13	12	\N	\N	\N	purchase	50.000	1.20	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
88	13	13	\N	\N	\N	purchase	50.000	0.65	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
89	13	11	\N	\N	\N	purchase	50.000	115.00	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
90	13	22	\N	\N	\N	purchase	50.000	22.00	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
91	13	8	\N	\N	\N	purchase	50.000	6.50	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
92	13	21	\N	\N	\N	purchase	50.000	14.00	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
93	13	20	\N	\N	\N	purchase	50.000	18.50	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
94	13	14	\N	\N	\N	purchase	50.000	7.80	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
95	13	10	\N	\N	\N	purchase	50.000	38.00	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
96	13	19	\N	\N	\N	purchase	50.000	6.20	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
97	13	18	\N	\N	\N	purchase	50.000	3.90	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
98	13	23	\N	\N	\N	purchase	50.000	45.00	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
99	13	16	\N	\N	\N	purchase	50.000	8.90	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
100	13	17	\N	\N	\N	purchase	50.000	3.40	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
101	13	9	\N	\N	\N	purchase	50.000	35.00	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
102	13	15	\N	\N	\N	purchase	50.000	32.00	2026-10-10	\N	21	2026-10-10 17:52:02.062+00	3
103	13	11	17	8	\N	consumption	-73.190	115.00	2026-10-10	\N	21	2026-10-10 19:50:37.528+00	\N
104	13	11	17	\N	\N	adjustment	73.190	115.00	2026-10-10	corrction	21	2026-10-10 19:54:13.437+00	\N
\.


--
-- Data for Name: stock_reservations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_reservations (id, tenant_id, project_id, material_id, reserved_quantity, remaining_quantity, status, created_at, updated_at) FROM stdin;
2	1	4	2	3.000	0.000	consumed	2026-10-08 23:26:22.532+00	2026-10-08 23:40:19.935+00
1	1	4	1	9.000	5.400	active	2026-10-08 23:26:22.526+00	2026-10-08 23:40:21.375+00
3	1	4	3	1.200	0.000	consumed	2026-10-08 23:26:22.537+00	2026-10-08 23:40:21.609+00
7	1	13	1	15.000	0.000	released	2026-10-08 23:52:58.676+00	2026-10-08 23:52:59.078+00
8	1	13	2	5.000	0.000	released	2026-10-08 23:52:58.683+00	2026-10-08 23:52:59.078+00
9	1	13	3	2.000	0.000	released	2026-10-08 23:52:58.688+00	2026-10-08 23:52:59.078+00
10	1	14	1	6.000	6.000	active	2026-10-09 00:04:51.211+00	2026-10-09 00:04:51.211+00
11	1	14	2	2.000	2.000	active	2026-10-09 00:04:51.217+00	2026-10-09 00:04:51.217+00
12	1	14	3	0.800	0.800	active	2026-10-09 00:04:51.222+00	2026-10-09 00:04:51.222+00
13	1	15	1	6.000	6.000	active	2026-10-09 00:05:23.156+00	2026-10-09 00:05:23.156+00
14	1	15	2	2.000	2.000	active	2026-10-09 00:05:23.16+00	2026-10-09 00:05:23.16+00
15	1	15	3	0.800	0.800	active	2026-10-09 00:05:23.163+00	2026-10-09 00:05:23.163+00
\.


--
-- Data for Name: stripe_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stripe_events (id, stripe_event_id, type, payload, processed_at, error, created_at) FROM stdin;
3	evt_3UOe3k5hh9F3Yct51PJ0adS3	payment_intent.payment_failed	{"id": "evt_3UOe3k5hh9F3Yct51PJ0adS3", "data": {"object": {"id": "pi_3UOe3k5hh9F3Yct51oyw0KAl", "amount": 2000, "object": "payment_intent", "review": null, "source": null, "status": "requires_payment_method", "created": 1791553324, "currency": "usd", "customer": "cus_VPStHl25uyqLfO", "livemode": false, "metadata": {}, "shipping": null, "processing": null, "application": null, "canceled_at": null, "description": "(created by Stripe CLI)", "next_action": null, "on_behalf_of": null, "client_secret": "pi_3UOe3k5hh9F3Yct51oyw0KAl_secret_WAFiPKpvAAOdrKNfTwj3tPu2n", "latest_charge": "ch_3UOe3k5hh9F3Yct51EiqClO4", "receipt_email": null, "transfer_data": null, "amount_details": {"tip": {}}, "capture_method": "automatic_async", "payment_method": null, "payment_record": null, "transfer_group": null, "amount_received": 0, "customer_account": null, "managed_payments": {"enabled": false}, "amount_capturable": 0, "last_payment_error": {"code": "card_declined", "type": "card_error", "charge": "ch_3UOe3k5hh9F3Yct51EiqClO4", "doc_url": "https://stripe.com/docs/error-codes/card-declined", "message": "Your card was declined.", "advice_code": "try_again_later", "decline_code": "generic_decline", "payment_method": {"id": "pm_1UOe3k5hh9F3Yct5RHdW5fYd", "card": {"brand": "visa", "last4": "0002", "checks": {"cvc_check": "pass", "address_line1_check": null, "address_postal_code_check": null}, "wallet": null, "country": "US", "funding": "credit", "exp_year": 2027, "networks": {"available": ["visa"], "preferred": null}, "exp_month": 10, "fingerprint": "yrVYtDIKGnQu2LKR", "display_brand": "visa", "generated_from": null, "regulated_status": "unregulated", "three_d_secure_usage": {"supported": true}}, "type": "card", "object": "payment_method", "created": 1791553324, "customer": null, "livemode": false, "metadata": {}, "allow_redisplay": "unspecified", "billing_details": {"name": null, "email": null, "phone": null, "tax_id": null, "address": {"city": null, "line1": null, "line2": null, "state": null, "country": null, "postal_code": null}}, "customer_account": null, "shared_payment_granted_token": null}, "payment_method_type": "card", "network_decline_code": "01"}, "setup_future_usage": null, "cancellation_reason": null, "confirmation_method": "automatic", "payment_method_types": ["card"], "statement_descriptor": null, "application_fee_amount": null, "payment_method_options": {"card": {"network": null, "installments": null, "mandate_options": null, "request_three_d_secure": "automatic"}}, "automatic_payment_methods": null, "statement_descriptor_suffix": null, "allowed_payment_method_types": null, "shared_payment_granted_token": null, "excluded_payment_method_types": null, "payment_method_configuration_details": null}}, "type": "payment_intent.payment_failed", "object": "event", "created": 1791553324, "request": {"id": "req_OdYkXdOGIizlPE", "idempotency_key": "193ccfb1-3e03-4457-b385-06fac4b09654"}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 2}	2026-10-09 13:42:05.866+00	\N	2026-10-09 13:42:05.426+00
1	evt_3UOdz55hh9F3Yct50wIENM8V	payment_intent.succeeded	{"id": "evt_3UOdz55hh9F3Yct50wIENM8V", "data": {"object": {"id": "pi_3UOdz55hh9F3Yct50wM7Ko1C", "amount": 1000, "object": "payment_intent", "review": null, "source": null, "status": "succeeded", "created": 1791553035, "currency": "usd", "customer": "cus_VPStHl25uyqLfO", "livemode": false, "metadata": {}, "shipping": {"name": "Jenny Rosen", "phone": null, "address": {"city": "San Francisco", "line1": "510 Townsend St", "line2": null, "state": "CA", "country": "US", "postal_code": "94103"}, "carrier": null, "tracking_number": null}, "processing": null, "application": null, "canceled_at": null, "description": "(created by Stripe CLI)", "next_action": null, "on_behalf_of": null, "client_secret": "pi_3UOdz55hh9F3Yct50wM7Ko1C_secret_kW0sxztu5g7fVn9Q4dbSNRnN9", "latest_charge": "ch_3UOdz55hh9F3Yct50gJGLI27", "receipt_email": null, "transfer_data": null, "amount_details": {"tip": {}}, "capture_method": "automatic_async", "payment_method": "pm_1UOdz45hh9F3Yct57R4nScoV", "payment_record": null, "transfer_group": null, "amount_received": 1000, "customer_account": null, "managed_payments": {"enabled": false}, "amount_capturable": 0, "last_payment_error": null, "setup_future_usage": null, "cancellation_reason": null, "confirmation_method": "automatic", "payment_method_types": ["card"], "statement_descriptor": null, "application_fee_amount": null, "payment_method_options": {"card": {"network": null, "installments": null, "mandate_options": null, "request_three_d_secure": "automatic"}}, "automatic_payment_methods": null, "statement_descriptor_suffix": null, "allowed_payment_method_types": null, "shared_payment_granted_token": null, "excluded_payment_method_types": null, "payment_method_configuration_details": null}}, "type": "payment_intent.succeeded", "object": "event", "created": 1791553035, "request": {"id": "req_MQMS8LQlUkdgt0", "idempotency_key": "716f2e8a-c29b-4d5b-a8f4-f924b6ee93a6"}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 2}	2026-10-09 13:41:48.299+00	\N	2026-10-09 13:37:15.988+00
4	evt_test_1791553403991	invoice.upcoming	{"id": "evt_test_1791553403991", "data": {"object": {"object": "invoice", "currency": "eur", "customer": "cus_VPStHl25uyqLfO", "amount_due": 1500}}, "type": "invoice.upcoming", "object": "event", "created": 1791553404, "request": {"id": null, "idempotency_key": null}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 1}	2026-10-09 13:43:25.229+00	\N	2026-10-09 13:43:24.757+00
5	evt_test_1791553403992	customer.subscription.deleted	{"id": "evt_test_1791553403992", "data": {"object": {"id": "sub_test", "object": "subscription", "status": "canceled", "customer": "cus_VPStHl25uyqLfO"}}, "type": "customer.subscription.deleted", "object": "event", "created": 1791553410, "request": {"id": null, "idempotency_key": null}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 1}	2026-10-09 13:43:30.746+00	\N	2026-10-09 13:43:30.55+00
6	evt_3UOe5O5hh9F3Yct50zfFKRBP	payment_intent.succeeded	{"id": "evt_3UOe5O5hh9F3Yct50zfFKRBP", "data": {"object": {"id": "pi_3UOe5O5hh9F3Yct50OPt5QFC", "amount": 1000, "object": "payment_intent", "review": null, "source": null, "status": "succeeded", "created": 1791553426, "currency": "usd", "customer": "cus_VPStHl25uyqLfO", "livemode": false, "metadata": {}, "shipping": {"name": "Jenny Rosen", "phone": null, "address": {"city": "San Francisco", "line1": "510 Townsend St", "line2": null, "state": "CA", "country": "US", "postal_code": "94103"}, "carrier": null, "tracking_number": null}, "processing": null, "application": null, "canceled_at": null, "description": "(created by Stripe CLI)", "next_action": null, "on_behalf_of": null, "client_secret": "pi_3UOe5O5hh9F3Yct50OPt5QFC_secret_G0icmsYf9KzNEADBPCrRkD9NX", "latest_charge": "ch_3UOe5O5hh9F3Yct50Sb7P0vk", "receipt_email": null, "transfer_data": null, "amount_details": {"tip": {}}, "capture_method": "automatic_async", "payment_method": "pm_1UOe5O5hh9F3Yct5j0vci67i", "payment_record": null, "transfer_group": null, "amount_received": 1000, "customer_account": null, "managed_payments": {"enabled": false}, "amount_capturable": 0, "last_payment_error": null, "setup_future_usage": null, "cancellation_reason": null, "confirmation_method": "automatic", "payment_method_types": ["card"], "statement_descriptor": null, "application_fee_amount": null, "payment_method_options": {"card": {"network": null, "installments": null, "mandate_options": null, "request_three_d_secure": "automatic"}}, "automatic_payment_methods": null, "statement_descriptor_suffix": null, "allowed_payment_method_types": null, "shared_payment_granted_token": null, "excluded_payment_method_types": null, "payment_method_configuration_details": null}}, "type": "payment_intent.succeeded", "object": "event", "created": 1791553427, "request": {"id": "req_53OOUaUNtqCReL", "idempotency_key": "e47565a7-00c5-4c46-b775-fc3c0912b228"}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 2}	2026-10-09 13:43:47.863+00	\N	2026-10-09 13:43:47.614+00
7	evt_test_1791553436477	payment_intent.succeeded	{"id": "evt_test_1791553436477", "data": {"object": {"id": "pi_orphan", "amount": 500, "object": "payment_intent", "customer": "cus_ORPHAN000"}}, "type": "payment_intent.succeeded", "object": "event", "created": 1791553438, "request": {"id": null, "idempotency_key": null}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 1}	2026-10-09 13:43:58.995+00	\N	2026-10-09 13:43:58.911+00
8	evt_3UOh0Z5hh9F3Yct50bHF36UG	payment_intent.succeeded	{"id": "evt_3UOh0Z5hh9F3Yct50bHF36UG", "data": {"object": {"id": "pi_3UOh0Z5hh9F3Yct509niMuD3", "amount": 1000, "object": "payment_intent", "review": null, "source": null, "status": "succeeded", "created": 1791564660, "currency": "usd", "customer": "cus_VPStHl25uyqLfO", "livemode": false, "metadata": {}, "shipping": {"name": "Jenny Rosen", "phone": null, "address": {"city": "San Francisco", "line1": "510 Townsend St", "line2": null, "state": "CA", "country": "US", "postal_code": "94103"}, "carrier": null, "tracking_number": null}, "processing": null, "application": null, "canceled_at": null, "description": "(created by Stripe CLI)", "next_action": null, "on_behalf_of": null, "client_secret": "pi_3UOh0Z5hh9F3Yct509niMuD3_secret_RehZgTrOkEIPf20Yrom5TbPEy", "latest_charge": "ch_3UOh0Z5hh9F3Yct50YSbmyEa", "receipt_email": null, "transfer_data": null, "amount_details": {"tip": {}}, "capture_method": "automatic_async", "payment_method": "pm_1UOh0Z5hh9F3Yct5xLto68BJ", "payment_record": null, "transfer_group": null, "amount_received": 1000, "customer_account": null, "managed_payments": {"enabled": false}, "amount_capturable": 0, "last_payment_error": null, "setup_future_usage": null, "cancellation_reason": null, "confirmation_method": "automatic", "payment_method_types": ["card"], "statement_descriptor": null, "application_fee_amount": null, "payment_method_options": {"card": {"network": null, "installments": null, "mandate_options": null, "request_three_d_secure": "automatic"}}, "automatic_payment_methods": null, "statement_descriptor_suffix": null, "allowed_payment_method_types": null, "shared_payment_granted_token": null, "excluded_payment_method_types": null, "payment_method_configuration_details": null}}, "type": "payment_intent.succeeded", "object": "event", "created": 1791564660, "request": {"id": "req_xvUG1zNlmsb7y4", "idempotency_key": "a2e607b8-9f6b-45f8-acc6-0bcf613963a6"}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 2}	2026-10-09 16:51:01.133+00	\N	2026-10-09 16:51:00.971+00
9	evt_3UOhcS5hh9F3Yct51vRRUnEy	payment_intent.succeeded	{"id": "evt_3UOhcS5hh9F3Yct51vRRUnEy", "data": {"object": {"id": "pi_3UOhcS5hh9F3Yct51Xzqk4gz", "amount": 1000, "object": "payment_intent", "review": null, "source": null, "status": "succeeded", "created": 1791567009, "currency": "usd", "customer": "cus_VPStHl25uyqLfO", "livemode": false, "metadata": {}, "shipping": {"name": "Jenny Rosen", "phone": null, "address": {"city": "San Francisco", "line1": "510 Townsend St", "line2": null, "state": "CA", "country": "US", "postal_code": "94103"}, "carrier": null, "tracking_number": null}, "processing": null, "application": null, "canceled_at": null, "description": "(created by Stripe CLI)", "next_action": null, "on_behalf_of": null, "client_secret": "pi_3UOhcS5hh9F3Yct51Xzqk4gz_secret_osZwuAwMug1OGpcpM0185GWqT", "latest_charge": "ch_3UOhcS5hh9F3Yct51ojSyByi", "receipt_email": null, "transfer_data": null, "amount_details": {"tip": {}}, "capture_method": "automatic_async", "payment_method": "pm_1UOhcS5hh9F3Yct5XO5MjqcM", "payment_record": null, "transfer_group": null, "amount_received": 1000, "customer_account": null, "managed_payments": {"enabled": false}, "amount_capturable": 0, "last_payment_error": null, "setup_future_usage": null, "cancellation_reason": null, "confirmation_method": "automatic", "payment_method_types": ["card"], "statement_descriptor": null, "application_fee_amount": null, "payment_method_options": {"card": {"network": null, "installments": null, "mandate_options": null, "request_three_d_secure": "automatic"}}, "automatic_payment_methods": null, "statement_descriptor_suffix": null, "allowed_payment_method_types": null, "shared_payment_granted_token": null, "excluded_payment_method_types": null, "payment_method_configuration_details": null}}, "type": "payment_intent.succeeded", "object": "event", "created": 1791567009, "request": {"id": "req_TR8usZzQFhU07W", "idempotency_key": "42328b28-bb05-4520-86a4-53adc31073bc"}, "livemode": false, "api_version": "2026-08-26.dahlia", "pending_webhooks": 2}	2026-10-09 17:30:10.033+00	\N	2026-10-09 17:30:09.897+00
\.


--
-- Data for Name: subcontractor_contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subcontractor_contracts (id, tenant_id, subcontractor_id, project_id, description, amount_excl_vat, status, start_date, end_date, created_by, created_at, updated_at) FROM stdin;
1	1	1	4	TEST Main contract	2500.00	in_progress	2026-11-01	2026-12-01	1	2026-10-08 23:29:11.48+00	2026-10-08 23:29:11.48+00
2	1	1	9	\N	800.00	completed	\N	\N	1	2026-10-08 23:29:11.537+00	2026-10-08 23:29:11.632+00
3	1	1	11	TEST Plumbing contract	2500.00	in_progress	\N	\N	1	2026-10-08 23:50:46.515+00	2026-10-08 23:50:46.515+00
4	13	5	17	adf	70.00	completed	2026-10-10	2026-10-10	21	2026-10-10 19:23:25.663+00	2026-10-10 19:24:42.466+00
\.


--
-- Data for Name: subcontractors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subcontractors (id, tenant_id, company_name, trade, email, phone, vat_number, hourly_rate, is_active, created_at, updated_at) FROM stdin;
1	1	TEST Plumbing	heating	gryehirir+plumb@gmail.com	+32 475 00 00 00	\N	45.00	t	2026-10-08 23:29:11.271+00	2026-10-08 23:29:11.311+00
2	1	TEST Electric	electric	\N	\N	\N	\N	t	2026-10-08 23:29:11.372+00	2026-10-08 23:29:11.372+00
3	1	TEST Roofing	roofing	\N	\N	\N	\N	t	2026-10-08 23:29:11.395+00	2026-10-08 23:29:11.395+00
4	1	TEST Limit Sub 4	\N	\N	\N	\N	\N	t	2026-10-09 13:45:53.345+00	2026-10-09 13:45:53.345+00
5	13	test_socity	plomp	zoizouzakaria32@gmail.com	123456789	2000	20.00	t	2026-10-10 19:23:01.469+00	2026-10-10 19:23:01.469+00
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, tenant_id, name, email, phone, address, vat_number, is_active, created_at, updated_at) FROM stdin;
1	1	TEST Brico	gryehirir+brico@gmail.com	+32 475 11 11 11	\N	\N	t	2026-10-08 23:29:11.687+00	2026-10-08 23:29:11.714+00
2	1	TEST Archive	\N	\N	\N	\N	f	2026-10-08 23:29:11.74+00	2026-10-08 23:29:11.766+00
3	13	mokhtare	mokhtareAhmed@gmail.com	+1234567890	mokhtareAhmed@gmail.com	20	t	2026-10-10 15:30:14.782+00	2026-10-10 15:30:14.782+00
4	13	Ayoub	Ayoub@gmai.com	+1234567890	mokhtareAhmed	2013	t	2026-10-10 17:48:09.154+00	2026-10-10 17:48:09.154+00
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_tickets (id, tenant_id, opened_by, subject, category, priority, status, assigned_admin_id, closed_at, created_at, updated_at) FROM stdin;
2	2	9	TEST Beta billing	billing	low	open	\N	\N	2026-10-09 13:13:07.774+00	2026-10-09 13:13:07.774+00
1	1	1	TEST Cannot export	bug	high	closed	2	2026-10-09 13:15:10.281+00	2026-10-09 13:12:21.194+00	2026-10-09 13:15:10.285+00
\.


--
-- Data for Name: task_assignees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_assignees (id, tenant_id, task_id, user_id) FROM stdin;
1	1	1	3
2	1	1	4
3	1	1	5
4	1	1	6
5	1	1	2
6	1	2	5
7	1	4	3
8	1	4	4
9	1	5	6
11	1	7	5
14	1	8	6
15	1	8	5
16	1	9	6
17	1	9	5
18	13	10	21
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, tenant_id, project_id, title, type, start_date, end_date, status, created_by, created_at, updated_at) FROM stdin;
1	1	4	TEST Painting walls	work	2026-10-06	2026-10-10	planned	1	2026-10-08 23:34:33.212+00	2026-10-08 23:34:33.212+00
2	1	4	TEST No assignee	work	2026-10-06	2026-10-10	in_progress	1	2026-10-08 23:34:33.438+00	2026-10-08 23:34:33.537+00
4	1	4	TEST Others only	work	2026-10-06	2026-10-10	planned	1	2026-10-08 23:35:04.098+00	2026-10-08 23:35:04.098+00
5	1	10	TEST Side work	work	2026-10-06	2026-10-10	planned	1	2026-10-08 23:35:04.268+00	2026-10-08 23:35:04.268+00
7	1	11	TEST Margin work	work	2026-10-07	2026-10-18	planned	1	2026-10-08 23:50:46.414+00	2026-10-08 23:50:46.414+00
8	1	4	TEST Task Notif	work	2026-10-10	2026-10-10	in_progress	2	2026-10-09 12:44:41.567+00	2026-10-09 12:44:44.649+00
9	1	4	TEST Task Tomorrow	work	2026-10-10	2026-10-10	planned	2	2026-10-09 12:46:02.538+00	2026-10-09 12:46:02.538+00
10	13	17	test_1	work	2026-10-10	2026-10-10	completed	21	2026-10-10 18:00:32.45+00	2026-10-10 19:33:48.203+00
\.


--
-- Data for Name: tenant_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_subscriptions (id, tenant_id, plan_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, period_start, period_end, pending_plan_id, pending_plan_effective_at, created_at, updated_at, grace_ends_at) FROM stdin;
3	7	1	\N	\N	\N	trialing	2026-10-09 12:48:32.377+00	2026-10-23 12:48:32.377+00	2	2026-10-23 12:48:32.377+00	2026-10-09 12:48:32.427+00	2026-10-09 13:35:14.639+00	\N
7	12	1	cus_dev_12	\N	\N	active	2026-10-10 19:44:28.193+00	2026-11-10 19:44:28.193+00	\N	\N	2026-10-09 23:32:10.071+00	2026-10-10 19:44:28.212+00	\N
8	13	2	\N	\N	\N	active	2026-09-24 15:07:06+00	2026-10-24 15:07:06+00	5	2026-10-24 15:07:06+00	2026-07-10 15:07:06+00	2026-10-11 12:26:48.328+00	\N
2	2	1	cus_VPT3kRWeum1MkU	\N	\N	trialing	2026-10-22 22:12:24.814+00	2026-11-22 22:12:24.814+00	\N	\N	2026-10-08 22:12:25.038+00	2026-10-09 13:45:35.45+00	\N
1	1	1	cus_VPStHl25uyqLfO	\N	\N	active	2026-10-09 17:30:09.956+00	2026-11-09 17:30:09.956+00	\N	\N	2026-10-08 22:12:24.884+00	2026-10-09 17:30:09.984+00	\N
4	9	1	\N	\N	\N	trialing	2026-10-09 19:44:08.838+00	2026-10-23 19:44:08.838+00	\N	\N	2026-10-09 19:44:08.863+00	2026-10-09 19:44:08.863+00	\N
5	10	1	\N	\N	\N	trialing	2026-10-09 19:44:09.552+00	2026-10-23 19:44:09.552+00	\N	\N	2026-10-09 19:44:09.556+00	2026-10-09 19:44:09.556+00	\N
6	11	1	\N	\N	\N	trialing	2026-10-09 19:48:27.35+00	2026-10-23 19:48:27.35+00	\N	\N	2026-10-09 19:48:27.371+00	2026-10-09 19:48:27.371+00	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, legal_name, vat_number, registration_number, email, phone, address_line1, address_line2, postal_code, city, country, logo_media_id, default_vat_rate, default_payment_days, locale, currency, timezone, end_of_day_reminder_time, status, created_at, updated_at, deleted_at, email_verified_at, iban, bic) FROM stdin;
2	TEST Beta Bouw	\N	\N	\N	industrytechnology198@gmail.com	\N	\N	\N	\N	\N	\N	\N	21.00	30	en	EUR	America/New_York	17:00:00	active	2026-10-08 22:12:25.026+00	2026-10-08 22:46:27.406+00	\N	2026-10-08 22:12:24.814+00	\N	\N
7	TEST Epsilon	\N	\N	\N	othmanefadelkheir218+epsilon@gmail.com	\N	\N	\N	\N	\N	\N	\N	21.00	30	en	EUR	Europe/Brussels	18:00:00	active	2026-10-09 12:48:32.316+00	2026-10-09 12:48:32.316+00	\N	\N	\N	\N
8	TEST Gamma	\N	\N	\N	othmanefadelkheir218+gamma@gmail.com	\N	\N	\N	\N	\N	\N	\N	21.00	30	fr	EUR	Europe/Brussels	18:00:00	active	2026-10-09 13:17:00.712+00	2026-10-09 19:08:03.244+00	\N	\N	\N	\N
9	TEST Mail FR	\N	\N	\N	othmanefadelkheir218+mailfr@gmail.com	\N	\N	\N	\N	\N	\N	\N	21.00	30	fr	EUR	Europe/Brussels	18:00:00	active	2026-10-09 19:44:08.761+00	2026-10-09 19:44:08.761+00	\N	\N	\N	\N
10	TEST Mail NL	\N	\N	\N	othmanefadelkheir218+mailnl@gmail.com	\N	\N	\N	\N	\N	\N	\N	21.00	30	nl	EUR	Europe/Brussels	18:00:00	active	2026-10-09 19:44:09.534+00	2026-10-09 19:44:09.534+00	\N	\N	\N	\N
1	TEST Alpha Renovation	\N	\N	\N	othmanefadelkheir218@gmail.com	\N	\N	\N	\N	\N	\N	62	21.00	30	fr	EUR	Europe/Brussels	18:00:00	active	2026-10-08 22:12:24.851+00	2026-10-09 22:55:33.425+00	\N	2026-10-08 22:12:24.814+00	BE68539007547034	GKCCBEBB
12	TEST B18 Admin Company	\N	\N	\N	winucardit+b18company@gmail.com	\N	\N	\N	\N	\N	\N	\N	21.00	30	fr	EUR	Europe/Brussels	18:00:00	active	2026-10-09 23:32:10.022+00	2026-10-09 23:32:10.022+00	\N	\N	\N	\N
11	TEST Alert Check	\N	\N	\N	othmanefadelkheir218+alertcheck@gmail.com	\N	\N	\N	\N	\N	\N	\N	21.00	30	en	EUR	Europe/Brussels	18:00:00	active	2026-10-09 19:48:27.326+00	2026-10-10 11:41:55.717+00	\N	\N	\N	\N
13	hubchoose	\N	\N	\N	zoizouzakaria32@gmail.com	+212676138066	\N	\N	\N	\N	FR	\N	21.00	30	fr	EUR	Europe/Brussels	18:00:00	active	2026-07-10 15:07:06+00	2026-10-10 15:08:20.467+00	\N	2026-10-10 15:08:20.465+00	\N	\N
\.


--
-- Data for Name: time_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.time_entries (id, tenant_id, project_id, user_id, task_id, work_date, hours, hourly_rate, comment, created_by, created_at, updated_at) FROM stdin;
2	1	4	6	\N	2026-10-07	8.00	25.00	\N	6	2026-10-08 23:35:04.681+00	2026-10-08 23:35:04.681+00
3	1	10	6	\N	2026-10-07	3.00	25.00	\N	6	2026-10-08 23:35:04.726+00	2026-10-08 23:35:04.726+00
5	1	10	6	\N	2026-10-06	6.00	25.00	\N	6	2026-10-08 23:35:04.813+00	2026-10-08 23:35:04.813+00
6	1	4	6	\N	2026-10-05	20.00	25.00	\N	6	2026-10-08 23:35:04.977+00	2026-10-08 23:35:04.977+00
8	1	10	6	\N	2026-10-09	10.00	25.00	\N	6	2026-10-08 23:35:05.39+00	2026-10-08 23:35:05.39+00
9	1	4	6	\N	2026-10-09	14.00	25.00	\N	6	2026-10-08 23:35:05.434+00	2026-10-08 23:35:05.53+00
1	1	4	5	\N	2026-10-08	7.00	20.00	\N	5	2026-10-06 23:35:04.339+00	2026-10-08 23:35:29.112+00
11	1	4	5	\N	2026-10-06	2.00	20.00	\N	5	2026-10-08 23:35:29.766+00	2026-10-08 23:35:29.766+00
12	1	10	5	\N	2026-10-10	3.00	20.00	\N	2	2026-10-08 23:35:30.056+00	2026-10-08 23:35:30.056+00
13	1	4	5	\N	2026-10-03	2.00	20.00	\N	5	2026-10-08 23:35:30.451+00	2026-10-08 23:35:30.451+00
14	1	11	5	7	2026-10-07	10.00	20.00	\N	2	2026-10-08 23:51:17.934+00	2026-10-08 23:51:17.934+00
15	1	11	5	7	2026-10-06	10.00	20.00	\N	2	2026-10-08 23:51:17.982+00	2026-10-08 23:51:17.982+00
4	1	4	6	\N	2026-10-06	7.50	25.00	\N	6	2026-10-08 23:35:04.761+00	2026-10-09 12:38:36.567+00
16	13	17	21	10	2026-10-11	4.00	0.00		21	2026-10-10 19:13:15.42+00	2026-10-10 19:34:57.666+00
17	13	17	21	\N	2026-10-10	3.00	20.00	\N	21	2026-10-10 19:46:39.441+00	2026-10-10 19:46:39.441+00
18	1	4	5	2	2026-10-10	3.00	20.00	\N	5	2026-10-10 20:51:21.747+00	2026-10-10 20:51:21.747+00
\.


--
-- Data for Name: user_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_invitations (id, tenant_id, email, name, role_id, token_hash, invited_by, expires_at, accepted_at, created_at, invited_by_admin_user_id) FROM stdin;
4	1	winucardit+worker3@gmail.com	TEST Worker Three	5	4de9d3c1ac795419cc9cad43037a9b993c33a55902985d26b97dc149c7607960	1	2026-10-16 13:32:51.002+00	2026-10-09 14:55:20.687+00	2026-10-09 13:32:51.008+00	\N
5	12	winucardit+b18owner@gmail.com	TEST B18 Boss	1	6d987b58055e7b9843c1dc977e3701ae83ebb30922d1f5fa69a88d1eb483e931	\N	2026-10-16 23:32:10.079+00	2026-10-09 23:32:28.109+00	2026-10-09 23:32:10.081+00	1
6	13	zoizouzakaria32@gmail.com	ziko	1	b60daca3ea00604ab8a49b387239d722a74c463aa5eba5d16e6e186f2fd0f636	\N	2026-10-17 15:07:06.815+00	2026-10-10 15:08:41.376+00	2026-10-10 15:07:06.817+00	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, tenant_id, role_id, name, email, phone, password_hash, mobile_pin_hash, failed_pin_count, hourly_rate, is_active, email_verified_at, created_at, updated_at, login_code, must_change_password) FROM stdin;
2	1	2	TEST Manager	zakariyazouazou@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	\N	0	0.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:24.931+00	2026-10-08 22:12:24.931+00	\N	f
3	1	3	TEST Supervisor	zakariyazouazou+supervisor@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	\N	0	30.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:24.947+00	2026-10-08 22:12:24.947+00	\N	f
4	1	4	TEST Leader	zakariyazouazou+leader@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	\N	0	0.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:24.958+00	2026-10-08 22:12:24.958+00	\N	f
9	2	1	Beta Owner	industrytechnology198@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	\N	0	0.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:25.054+00	2026-10-08 22:12:25.054+00	\N	f
19	11	1	Alert Check	othmanefadelkheir218+alertcheck@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$ZvmkmiHK3qvbxtiez/FqIA$9oYuHMFxYCU/C5FrcO1/J5RhmgfHG2Ih6GCyS4Dt0r8	\N	0	0.00	t	\N	2026-10-09 19:48:27.342+00	2026-10-09 19:48:27.342+00	\N	f
20	12	1	TEST B18 Boss	winucardit+b18owner@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$EmV0vCmXJ0UftKqBDBAOLg$CsNQFDIMkl19nJj0EtuwxzwQt2Cr70pxmDMXjXds42k	\N	0	0.00	t	\N	2026-10-09 23:32:28.098+00	2026-10-09 23:32:28.098+00	\N	f
7	1	6	TEST Sales	zakariyazouazou+sales@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	\N	0	0.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:24.999+00	2026-10-08 22:12:24.999+00	\N	f
1	1	1	Othmane Owner	othmane.owner+test@chantieros.local	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	\N	0	0.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:24.908+00	2026-10-10 00:50:38.654+00	\N	f
6	1	5	TEST Worker 2	winucardit+worker2@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	$argon2id$v=19$m=19456,p=1,t=2$5aG2PZuno6o3Temm1SI1Ww$bq4BhQUw8K4cMiUKqwoVYIotMLVwpSlZVyF6EXsxs8c	0	25.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:24.986+00	2026-10-10 14:20:58.125+00	\N	f
14	2	5	TEST B Worker	winucardit+bworker@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	$argon2id$v=19$m=19456,p=1,t=2$HL0njV06p0TDHyCi3i9IpA$0KS13D2H7FFEw47Nynkw96sJK2UWHaDZdQPKCvDlmCw	0	20.00	t	2026-10-09 12:37:57.160926+00	2026-10-09 12:37:57.160926+00	2026-10-09 12:37:57.160926+00	\N	f
15	7	1	TEST Epsilon Owner	othmanefadelkheir218+epsilon@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$A5J80GCSmkKIo2BUu5JkIg$dhzTRHm3zjsdVyt5VMB0uuRdpcdNw6zkwfheaw89lWc	\N	0	0.00	t	\N	2026-10-09 12:48:32.351+00	2026-10-09 12:48:32.351+00	\N	f
8	1	7	TEST Accountant	zakariyazouazou+accountant@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	\N	0	0.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:25.013+00	2026-10-09 13:44:55.001+00	\N	f
16	1	5	TEST Worker Three	winucardit+worker3@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$OfVvn5Rdz2dwnZpq6jzLUQ$Uw2/AD5elcqw5mWJfM5CEfOEMVEOGtJpKGdUFOHf1A0	\N	0	0.00	f	\N	2026-10-09 14:55:20.676+00	2026-10-09 14:55:20.815+00	\N	f
17	9	1	Mail fr	othmanefadelkheir218+mailfr@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$V6y7R0oI4Adz82BD8cqOHw$zkhlvh4uMpR6B5PiUWlKsxZl7lC2tLohg0hGdjAlu8g	\N	0	0.00	t	\N	2026-10-09 19:44:08.83+00	2026-10-09 19:44:08.83+00	\N	f
18	10	1	Mail nl	othmanefadelkheir218+mailnl@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$rkxTusa//RNPURSandlAww$JWQIj3ZgP3v4rTA5O6BYBJwx45DTZCSLFl8wxF+YvY8	\N	0	0.00	t	\N	2026-10-09 19:44:09.546+00	2026-10-09 19:44:09.546+00	\N	f
22	1	5	TEST Ouvrier sans email	\N	\N	\N	$argon2id$v=19$m=19456,p=1,t=2$FiGXnvdQJTabXsjGTmpJrg$HAk8uRXLhLZoiJeJYMiLhkSSA/1x2lZ/h2g3hCnZZNY	1	0.00	t	\N	2026-10-10 18:20:07.927+00	2026-10-10 18:20:08.721+00	46763517	f
5	1	5	TEST Worker	winucardit@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$8AG9V4zkhu8+xAf9cIhUQQ$XOkvADu41brkPw9I0MNaogsy21j+Zs2tu9aNZPI993E	$argon2id$v=19$m=19456,p=1,t=2$HL0njV06p0TDHyCi3i9IpA$0KS13D2H7FFEw47Nynkw96sJK2UWHaDZdQPKCvDlmCw	0	20.00	t	2026-10-08 22:12:24.814+00	2026-10-08 22:12:24.972+00	2026-10-10 18:20:09.947+00	\N	f
21	13	1	ziko	zoizouzakaria32@gmail.com	\N	$argon2id$v=19$m=19456,p=1,t=2$MAO3dSvHOxvmBu6JkPqxyw$TiWtkmIXWgw0WQbFduoEGN0ydwWUzjE0Me02dptDG90	\N	0	20.00	t	\N	2026-10-10 15:08:41.356+00	2026-10-10 19:46:10.635+00	\N	f
23	1	2	TEST Direct Manager	test.direct.1791656407@chantieros.local	\N	$argon2id$v=19$m=19456,p=1,t=2$W5XGG+IsWLQ0JktKBKfgIw$uxLkRXFZzI/dxrxDtXJNt712xOXwDeZ9j1gBggigd84	\N	0	0.00	t	\N	2026-10-10 18:20:08.982+00	2026-10-10 20:53:09.732+00	\N	f
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 3, true);


--
-- Name: analytics_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analytics_events_id_seq', 6, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 578, true);


--
-- Name: billing_usage_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.billing_usage_snapshots_id_seq', 60, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 12, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clients_id_seq', 8, true);


--
-- Name: conversation_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversation_members_id_seq', 49, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversations_id_seq', 19, true);


--
-- Name: cost_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cost_types_id_seq', 5, true);


--
-- Name: feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_id_seq', 3, true);


--
-- Name: import_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.import_batches_id_seq', 3, true);


--
-- Name: invoice_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_lines_id_seq', 11, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 10, true);


--
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.materials_id_seq', 53, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_id_seq', 79, true);


--
-- Name: message_reads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.message_reads_id_seq', 94, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 47, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 242, true);


--
-- Name: one_time_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.one_time_codes_id_seq', 9, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 7, true);


--
-- Name: plan_features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plan_features_id_seq', 30, true);


--
-- Name: plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plans_id_seq', 5, true);


--
-- Name: portal_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.portal_tokens_id_seq', 13, true);


--
-- Name: portal_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.portal_tracking_id_seq', 12, true);


--
-- Name: project_closure_snapshot_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_closure_snapshot_costs_id_seq', 9, true);


--
-- Name: project_closure_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_closure_snapshots_id_seq', 6, true);


--
-- Name: project_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_status_history_id_seq', 34, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 17, true);


--
-- Name: purchase_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_invoices_id_seq', 29, true);


--
-- Name: quote_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quote_lines_id_seq', 44, true);


--
-- Name: quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quotes_id_seq', 30, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 276, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reports_id_seq', 8, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 4, true);


--
-- Name: service_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_materials_id_seq', 347, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 1803, true);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 104, true);


--
-- Name: stock_reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_reservations_id_seq', 15, true);


--
-- Name: stripe_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stripe_events_id_seq', 9, true);


--
-- Name: subcontractor_contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subcontractor_contracts_id_seq', 4, true);


--
-- Name: subcontractors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subcontractors_id_seq', 5, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 4, true);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.support_tickets_id_seq', 2, true);


--
-- Name: task_assignees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_assignees_id_seq', 18, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 10, true);


--
-- Name: tenant_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tenant_subscriptions_id_seq', 8, true);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tenants_id_seq', 13, true);


--
-- Name: time_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.time_entries_id_seq', 18, true);


--
-- Name: user_invitations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_invitations_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 23, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_usage_snapshots billing_usage_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_usage_snapshots
    ADD CONSTRAINT billing_usage_snapshots_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: conversation_members conversation_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: cost_types cost_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_types
    ADD CONSTRAINT cost_types_pkey PRIMARY KEY (id);


--
-- Name: document_counters document_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_counters
    ADD CONSTRAINT document_counters_pkey PRIMARY KEY (tenant_id, document_type, year);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: import_batches import_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_pkey PRIMARY KEY (id);


--
-- Name: invoice_lines invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: message_reads message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: one_time_codes one_time_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_codes
    ADD CONSTRAINT one_time_codes_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: plan_features plan_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: portal_tokens portal_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tokens
    ADD CONSTRAINT portal_tokens_pkey PRIMARY KEY (id);


--
-- Name: portal_tracking portal_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tracking
    ADD CONSTRAINT portal_tracking_pkey PRIMARY KEY (id);


--
-- Name: project_closure_snapshot_costs project_closure_snapshot_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshot_costs
    ADD CONSTRAINT project_closure_snapshot_costs_pkey PRIMARY KEY (id);


--
-- Name: project_closure_snapshots project_closure_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshots
    ADD CONSTRAINT project_closure_snapshots_pkey PRIMARY KEY (id);


--
-- Name: project_margin_alerts project_margin_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_margin_alerts
    ADD CONSTRAINT project_margin_alerts_pkey PRIMARY KEY (project_id, level);


--
-- Name: project_status_history project_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status_history
    ADD CONSTRAINT project_status_history_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: purchase_invoices purchase_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_pkey PRIMARY KEY (id);


--
-- Name: quote_lines quote_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_lines
    ADD CONSTRAINT quote_lines_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: service_materials service_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_materials
    ADD CONSTRAINT service_materials_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: stock_reservations stock_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_pkey PRIMARY KEY (id);


--
-- Name: stripe_events stripe_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events
    ADD CONSTRAINT stripe_events_pkey PRIMARY KEY (id);


--
-- Name: subcontractor_contracts subcontractor_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractor_contracts
    ADD CONSTRAINT subcontractor_contracts_pkey PRIMARY KEY (id);


--
-- Name: subcontractors subcontractors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractors
    ADD CONSTRAINT subcontractors_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: task_assignees task_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tenant_subscriptions tenant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);


--
-- Name: user_invitations user_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invitations
    ADD CONSTRAINT user_invitations_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_users_email_key ON public.admin_users USING btree (email);


--
-- Name: analytics_events_tenant_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_events_tenant_id_created_at_idx ON public.analytics_events USING btree (tenant_id, created_at);


--
-- Name: audit_logs_tenant_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_tenant_id_created_at_idx ON public.audit_logs USING btree (tenant_id, created_at);


--
-- Name: billing_usage_snapshots_tenant_id_period_start_feature_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX billing_usage_snapshots_tenant_id_period_start_feature_key_key ON public.billing_usage_snapshots USING btree (tenant_id, period_start, feature_key);


--
-- Name: clients_tenant_id_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_tenant_id_email_key ON public.clients USING btree (tenant_id, email);


--
-- Name: clients_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_tenant_id_idx ON public.clients USING btree (tenant_id);


--
-- Name: conversations_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_tenant_id_idx ON public.conversations USING btree (tenant_id);


--
-- Name: idx_closure_one_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_closure_one_live ON public.project_closure_snapshots USING btree (project_id) WHERE (voided_at IS NULL);


--
-- Name: idx_invitations_open_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_invitations_open_email ON public.user_invitations USING btree (email) WHERE (accepted_at IS NULL);


--
-- Name: idx_one_client_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_one_client_conversation ON public.conversations USING btree (project_id) WHERE (type = 'project_client'::public.conversation_type);


--
-- Name: idx_plans_one_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_plans_one_default ON public.plans USING btree (is_default) WHERE (is_default = true);


--
-- Name: idx_portal_one_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_portal_one_active ON public.portal_tokens USING btree (project_id) WHERE (is_active = true);


--
-- Name: import_batches_tenant_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX import_batches_tenant_id_created_at_idx ON public.import_batches USING btree (tenant_id, created_at DESC);


--
-- Name: invoice_lines_invoice_id_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_lines_invoice_id_position_idx ON public.invoice_lines USING btree (invoice_id, "position");


--
-- Name: invoices_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_project_id_idx ON public.invoices USING btree (project_id);


--
-- Name: invoices_tenant_id_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_tenant_id_due_date_idx ON public.invoices USING btree (tenant_id, due_date);


--
-- Name: invoices_tenant_id_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoices_tenant_id_id_key ON public.invoices USING btree (tenant_id, id);


--
-- Name: invoices_tenant_id_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoices_tenant_id_number_key ON public.invoices USING btree (tenant_id, number);


--
-- Name: materials_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX materials_tenant_id_idx ON public.materials USING btree (tenant_id);


--
-- Name: media_entity_type_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_entity_type_entity_id_idx ON public.media USING btree (entity_type, entity_id);


--
-- Name: media_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_tenant_id_idx ON public.media USING btree (tenant_id);


--
-- Name: message_reads_message_id_user_id_client_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX message_reads_message_id_user_id_client_id_key ON public.message_reads USING btree (message_id, user_id, client_id);


--
-- Name: messages_conversation_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX messages_conversation_id_created_at_idx ON public.messages USING btree (conversation_id, created_at);


--
-- Name: notifications_admin_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_admin_user_id_idx ON public.notifications USING btree (admin_user_id);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: payments_invoice_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_invoice_id_idx ON public.payments USING btree (invoice_id);


--
-- Name: plan_features_plan_id_feature_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX plan_features_plan_id_feature_key_key ON public.plan_features USING btree (plan_id, feature_key);


--
-- Name: portal_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX portal_tokens_token_hash_key ON public.portal_tokens USING btree (token_hash);


--
-- Name: project_closure_snapshot_costs_snapshot_id_cost_type_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX project_closure_snapshot_costs_snapshot_id_cost_type_id_key ON public.project_closure_snapshot_costs USING btree (snapshot_id, cost_type_id);


--
-- Name: project_status_history_project_id_changed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_status_history_project_id_changed_at_idx ON public.project_status_history USING btree (project_id, changed_at);


--
-- Name: projects_tenant_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_tenant_id_status_idx ON public.projects USING btree (tenant_id, status);


--
-- Name: purchase_invoices_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX purchase_invoices_project_id_idx ON public.purchase_invoices USING btree (project_id);


--
-- Name: purchase_invoices_tenant_id_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX purchase_invoices_tenant_id_number_key ON public.purchase_invoices USING btree (tenant_id, number);


--
-- Name: quote_lines_quote_id_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quote_lines_quote_id_position_idx ON public.quote_lines USING btree (quote_id, "position");


--
-- Name: quotes_project_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quotes_project_id_status_idx ON public.quotes USING btree (project_id, status);


--
-- Name: quotes_tenant_id_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX quotes_tenant_id_id_key ON public.quotes USING btree (tenant_id, id);


--
-- Name: quotes_tenant_id_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX quotes_tenant_id_number_key ON public.quotes USING btree (tenant_id, number);


--
-- Name: refresh_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);


--
-- Name: refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: reports_tenant_id_project_id_report_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reports_tenant_id_project_id_report_date_key ON public.reports USING btree (tenant_id, project_id, report_date);


--
-- Name: role_permissions_tenant_id_role_id_module_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX role_permissions_tenant_id_role_id_module_key ON public.role_permissions USING btree (tenant_id, role_id, module);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: service_materials_service_id_material_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX service_materials_service_id_material_id_key ON public.service_materials USING btree (service_id, material_id);


--
-- Name: services_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX services_tenant_id_idx ON public.services USING btree (tenant_id);


--
-- Name: stock_movements_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_movements_project_id_idx ON public.stock_movements USING btree (project_id);


--
-- Name: stock_movements_tenant_id_material_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_movements_tenant_id_material_id_idx ON public.stock_movements USING btree (tenant_id, material_id);


--
-- Name: stock_reservations_project_id_material_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX stock_reservations_project_id_material_id_key ON public.stock_reservations USING btree (project_id, material_id);


--
-- Name: stripe_events_stripe_event_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX stripe_events_stripe_event_id_key ON public.stripe_events USING btree (stripe_event_id);


--
-- Name: subcontractor_contracts_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subcontractor_contracts_project_id_idx ON public.subcontractor_contracts USING btree (project_id);


--
-- Name: subcontractors_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subcontractors_tenant_id_idx ON public.subcontractors USING btree (tenant_id);


--
-- Name: support_tickets_tenant_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX support_tickets_tenant_id_status_idx ON public.support_tickets USING btree (tenant_id, status);


--
-- Name: task_assignees_task_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX task_assignees_task_id_user_id_key ON public.task_assignees USING btree (task_id, user_id);


--
-- Name: task_assignees_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_assignees_user_id_idx ON public.task_assignees USING btree (user_id);


--
-- Name: tasks_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_project_id_idx ON public.tasks USING btree (project_id);


--
-- Name: tasks_tenant_id_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_tenant_id_id_key ON public.tasks USING btree (tenant_id, id);


--
-- Name: tenant_subscriptions_tenant_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_subscriptions_tenant_id_key ON public.tenant_subscriptions USING btree (tenant_id);


--
-- Name: tenants_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenants_email_key ON public.tenants USING btree (email);


--
-- Name: time_entries_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_project_id_idx ON public.time_entries USING btree (project_id);


--
-- Name: time_entries_user_id_project_id_work_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX time_entries_user_id_project_id_work_date_key ON public.time_entries USING btree (user_id, project_id, work_date);


--
-- Name: time_entries_user_id_work_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_user_id_work_date_idx ON public.time_entries USING btree (user_id, work_date);


--
-- Name: uq_import_batches_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_import_batches_hash ON public.import_batches USING btree (tenant_id, type, rows_hash) WHERE (status <> 'failed'::public.import_status);


--
-- Name: uq_materials_tenant_description; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_materials_tenant_description ON public.materials USING btree (tenant_id, lower(btrim(description)));


--
-- Name: uq_member_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_member_admin ON public.conversation_members USING btree (conversation_id, admin_user_id) WHERE (admin_user_id IS NOT NULL);


--
-- Name: uq_member_client; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_member_client ON public.conversation_members USING btree (conversation_id, client_id) WHERE (client_id IS NOT NULL);


--
-- Name: uq_member_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_member_user ON public.conversation_members USING btree (conversation_id, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: uq_read_client; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_read_client ON public.message_reads USING btree (message_id, client_id) WHERE (client_id IS NOT NULL);


--
-- Name: uq_read_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_read_user ON public.message_reads USING btree (message_id, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: user_invitations_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_invitations_token_hash_key ON public.user_invitations USING btree (token_hash);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_login_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_login_code_key ON public.users USING btree (login_code);


--
-- Name: users_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_tenant_id_idx ON public.users USING btree (tenant_id);


--
-- Name: invoice_lines trg_invoice_line_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoice_line_total BEFORE INSERT OR UPDATE OF quantity, unit_price_excl_vat ON public.invoice_lines FOR EACH ROW EXECUTE FUNCTION public.set_document_line_total();


--
-- Name: purchase_invoices trg_material_bill_no_project; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_material_bill_no_project BEFORE INSERT OR UPDATE ON public.purchase_invoices FOR EACH ROW EXECUTE FUNCTION public.chk_material_bill_has_no_project();


--
-- Name: quote_lines trg_quote_line_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_quote_line_total BEFORE INSERT OR UPDATE OF quantity, unit_price_excl_vat ON public.quote_lines FOR EACH ROW EXECUTE FUNCTION public.set_document_line_total();


--
-- Name: analytics_events analytics_events_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analytics_events analytics_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: billing_usage_snapshots billing_usage_snapshots_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_usage_snapshots
    ADD CONSTRAINT billing_usage_snapshots_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clients clients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_members conversation_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_members
    ADD CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_support_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_support_ticket_id_fkey FOREIGN KEY (support_ticket_id) REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cost_types cost_types_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_types
    ADD CONSTRAINT cost_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_counters document_counters_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_counters
    ADD CONSTRAINT document_counters_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feedback feedback_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: feedback feedback_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: import_batches import_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: import_batches import_batches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_lines invoice_lines_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoice_lines invoice_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoice_lines invoice_lines_tenant_id_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_tenant_id_invoice_id_fkey FOREIGN KEY (tenant_id, invoice_id) REFERENCES public.invoices(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: materials materials_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media media_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: message_reads message_reads_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_reads message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_reads message_reads_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_reads message_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: one_time_codes one_time_codes_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_codes
    ADD CONSTRAINT one_time_codes_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: one_time_codes one_time_codes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_codes
    ADD CONSTRAINT one_time_codes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: one_time_codes one_time_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.one_time_codes
    ADD CONSTRAINT one_time_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plan_features plan_features_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: plans plans_parent_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_parent_plan_id_fkey FOREIGN KEY (parent_plan_id) REFERENCES public.plans(id);


--
-- Name: portal_tokens portal_tokens_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tokens
    ADD CONSTRAINT portal_tokens_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portal_tokens portal_tokens_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tokens
    ADD CONSTRAINT portal_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: portal_tokens portal_tokens_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tokens
    ADD CONSTRAINT portal_tokens_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portal_tokens portal_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tokens
    ADD CONSTRAINT portal_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portal_tracking portal_tracking_portal_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tracking
    ADD CONSTRAINT portal_tracking_portal_token_id_fkey FOREIGN KEY (portal_token_id) REFERENCES public.portal_tokens(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portal_tracking portal_tracking_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_tracking
    ADD CONSTRAINT portal_tracking_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_closure_snapshot_costs project_closure_snapshot_costs_cost_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshot_costs
    ADD CONSTRAINT project_closure_snapshot_costs_cost_type_id_fkey FOREIGN KEY (cost_type_id) REFERENCES public.cost_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: project_closure_snapshot_costs project_closure_snapshot_costs_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshot_costs
    ADD CONSTRAINT project_closure_snapshot_costs_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.project_closure_snapshots(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_closure_snapshot_costs project_closure_snapshot_costs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshot_costs
    ADD CONSTRAINT project_closure_snapshot_costs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_closure_snapshots project_closure_snapshots_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshots
    ADD CONSTRAINT project_closure_snapshots_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: project_closure_snapshots project_closure_snapshots_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshots
    ADD CONSTRAINT project_closure_snapshots_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_closure_snapshots project_closure_snapshots_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshots
    ADD CONSTRAINT project_closure_snapshots_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_closure_snapshots project_closure_snapshots_voided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_closure_snapshots
    ADD CONSTRAINT project_closure_snapshots_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: project_margin_alerts project_margin_alerts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_margin_alerts
    ADD CONSTRAINT project_margin_alerts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_margin_alerts project_margin_alerts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_margin_alerts
    ADD CONSTRAINT project_margin_alerts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_status_history project_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status_history
    ADD CONSTRAINT project_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: project_status_history project_status_history_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status_history
    ADD CONSTRAINT project_status_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_status_history project_status_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status_history
    ADD CONSTRAINT project_status_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_invoices purchase_invoices_cost_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_cost_type_id_fkey FOREIGN KEY (cost_type_id) REFERENCES public.cost_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_invoices purchase_invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_invoices purchase_invoices_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_invoices purchase_invoices_subcontractor_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_subcontractor_contract_id_fkey FOREIGN KEY (subcontractor_contract_id) REFERENCES public.subcontractor_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_invoices purchase_invoices_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_invoices purchase_invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quote_lines quote_lines_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_lines
    ADD CONSTRAINT quote_lines_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quote_lines quote_lines_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_lines
    ADD CONSTRAINT quote_lines_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quote_lines quote_lines_tenant_id_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_lines
    ADD CONSTRAINT quote_lines_tenant_id_quote_id_fkey FOREIGN KEY (tenant_id, quote_id) REFERENCES public.quotes(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quotes quotes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotes quotes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quotes quotes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: quotes quotes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reports reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reports reports_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reports reports_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: role_permissions role_permissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_materials service_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_materials
    ADD CONSTRAINT service_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_materials service_materials_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_materials
    ADD CONSTRAINT service_materials_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_materials service_materials_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_materials
    ADD CONSTRAINT service_materials_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: services services_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_import_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_import_batch_id_fkey FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_movements stock_movements_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_movements stock_movements_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_movements stock_movements_purchase_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_purchase_invoice_id_fkey FOREIGN KEY (purchase_invoice_id) REFERENCES public.purchase_invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_reservations stock_reservations_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_reservations stock_reservations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_reservations stock_reservations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subcontractor_contracts subcontractor_contracts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractor_contracts
    ADD CONSTRAINT subcontractor_contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subcontractor_contracts subcontractor_contracts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractor_contracts
    ADD CONSTRAINT subcontractor_contracts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subcontractor_contracts subcontractor_contracts_subcontractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractor_contracts
    ADD CONSTRAINT subcontractor_contracts_subcontractor_id_fkey FOREIGN KEY (subcontractor_id) REFERENCES public.subcontractors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subcontractor_contracts subcontractor_contracts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractor_contracts
    ADD CONSTRAINT subcontractor_contracts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subcontractors subcontractors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcontractors
    ADD CONSTRAINT subcontractors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: suppliers suppliers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_admin_id_fkey FOREIGN KEY (assigned_admin_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_opened_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: support_tickets support_tickets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_tenant_id_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_tenant_id_task_id_fkey FOREIGN KEY (tenant_id, task_id) REFERENCES public.tasks(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_subscriptions tenant_subscriptions_pending_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pending_plan_id_fkey FOREIGN KEY (pending_plan_id) REFERENCES public.plans(id);


--
-- Name: tenant_subscriptions tenant_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: tenant_subscriptions tenant_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: time_entries time_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: time_entries time_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: time_entries time_entries_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: time_entries time_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: time_entries time_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_invitations user_invitations_invited_by_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invitations
    ADD CONSTRAINT user_invitations_invited_by_admin_user_id_fkey FOREIGN KEY (invited_by_admin_user_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_invitations user_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invitations
    ADD CONSTRAINT user_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_invitations user_invitations_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invitations
    ADD CONSTRAINT user_invitations_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_invitations user_invitations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_invitations
    ADD CONSTRAINT user_invitations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 4Tno2bsyl7ZDzWj7QSyk0tyBrTiSJgXCimQuUfrS13dUbkfsnGKNFEAUCNa6DGq

