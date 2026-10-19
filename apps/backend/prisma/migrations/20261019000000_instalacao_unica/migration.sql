◇ injected env (33) from .env.development // tip: ◈ secrets for agents [www.dotenvx.com]
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ATIVO', 'SUSPENSO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('CADASTRO', 'LOGIN', 'RECUPERACAO');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('MARCADO', 'CONFIRMADO', 'CONCLUIDO', 'FALTOU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('APP', 'PAINEL');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('PLATAFORMA', 'BARBEARIA');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('DONO', 'GESTOR', 'BARBEIRO');

-- CreateEnum
CREATE TYPE "AdminUserStatus" AS ENUM ('ATIVO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('UPLOAD', 'LINK');

-- CreateEnum
CREATE TYPE "LandingEventKind" AS ENUM ('VISITA', 'CONTATO', 'DEMO');

-- CreateEnum
CREATE TYPE "WhatsappStatus" AS ENUM ('DESCONECTADO', 'CONECTANDO', 'AGUARDANDO_QR', 'CONECTADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('AGENDADO', 'CONFIRMADO', 'LEMBRETE', 'CLIENTE_CONFIRMOU', 'CANCELADO', 'CONCLUIDO', 'FALTOU');

-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('DISPONIVEL', 'USADO', 'EXPIRADO');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "phone_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "referral_code" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barbers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "next_available_label" TEXT NOT NULL DEFAULT 'Hoje',
    "next_available_today" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "service_ids" TEXT[],
    "covered_service_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_id" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMADO',
    "source" "AppointmentSource" NOT NULL DEFAULT 'APP',
    "notes" TEXT,
    "cancel_code" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),
    "customer_confirmed_at" TIMESTAMP(3),
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reward_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_blocks" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_agendas" (
    "barber_id" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "closed_reason" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_agendas_pkey" PRIMARY KEY ("barber_id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'platform',
    "landing_whatsapp" TEXT,
    "landing_demo_url" TEXT,
    "meta_pixel_id" TEXT,
    "google_tag_id" TEXT,
    "google_ads_conversion" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'BARBEARIA',
    "member_role" "MemberRole" NOT NULL DEFAULT 'DONO',
    "member_barber_id" TEXT,
    "status" "AdminUserStatus" NOT NULL DEFAULT 'ATIVO',
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT,
    "source" "MediaSource" NOT NULL,
    "mime" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_configs" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_events" (
    "id" TEXT NOT NULL,
    "kind" "LandingEventKind" NOT NULL,
    "session_id" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "referrer" TEXT,
    "path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "session" TEXT NOT NULL,
    "status" "WhatsappStatus" NOT NULL DEFAULT 'DESCONECTADO',
    "phone" TEXT,
    "push_name" TEXT,
    "connected_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "event" "NotificationEvent" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "text" TEXT NOT NULL,
    "offset_min" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "event" "NotificationEvent",
    "phone" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "WhatsappMessageStatus" NOT NULL DEFAULT 'PENDENTE',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_access_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_id" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDENTE',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_rewards" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "referral_id" TEXT,
    "source" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "service_id" TEXT,
    "label" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "expires_at" TIMESTAMP(3),
    "appointment_id" TEXT,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_referral_code_key" ON "customers"("referral_code");

-- CreateIndex
CREATE INDEX "otp_codes_phone_purpose_created_at_idx" ON "otp_codes"("phone", "purpose", "created_at");

-- CreateIndex
CREATE INDEX "barbers_position_idx" ON "barbers"("position");

-- CreateIndex
CREATE UNIQUE INDEX "barbers_slug_key" ON "barbers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_cancel_code_key" ON "appointments"("cancel_code");

-- CreateIndex
CREATE INDEX "appointments_starts_at_idx" ON "appointments"("starts_at");

-- CreateIndex
CREATE INDEX "appointments_barber_id_starts_at_idx" ON "appointments"("barber_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_customer_phone_idx" ON "appointments"("customer_phone");

-- CreateIndex
CREATE INDEX "appointments_customer_id_idx" ON "appointments"("customer_id");

-- CreateIndex
CREATE INDEX "agenda_blocks_starts_at_idx" ON "agenda_blocks"("starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "media_assets_created_at_idx" ON "media_assets"("created_at");

-- CreateIndex
CREATE INDEX "tenant_configs_published_idx" ON "tenant_configs"("published");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_configs_version_key" ON "tenant_configs"("version");

-- CreateIndex
CREATE INDEX "landing_events_created_at_idx" ON "landing_events"("created_at");

-- CreateIndex
CREATE INDEX "landing_events_kind_session_id_created_at_idx" ON "landing_events"("kind", "session_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_session_key" ON "whatsapp_connections"("session");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_key" ON "notification_templates"("event");

-- CreateIndex
CREATE INDEX "whatsapp_messages_created_at_idx" ON "whatsapp_messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_appointment_id_event_key" ON "whatsapp_messages"("appointment_id", "event");

-- CreateIndex
CREATE UNIQUE INDEX "admin_access_tokens_token_hash_key" ON "admin_access_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "customer_referrals_referred_id_key" ON "customer_referrals"("referred_id");

-- CreateIndex
CREATE INDEX "customer_referrals_referrer_id_idx" ON "customer_referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "customer_rewards_customer_id_status_idx" ON "customer_rewards"("customer_id", "status");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_access_tokens" ADD CONSTRAINT "admin_access_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_referrals" ADD CONSTRAINT "customer_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_referrals" ADD CONSTRAINT "customer_referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_rewards" ADD CONSTRAINT "customer_rewards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_rewards" ADD CONSTRAINT "customer_rewards_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "customer_referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
