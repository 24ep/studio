-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "image" TEXT,
    "dataAiHint" TEXT,
    "authentication_methods" TEXT[] DEFAULT ARRAY['basic']::TEXT[],
    "force_password_change" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "azure_oid" TEXT,
    "userGroupId" UUID,
    "userTeamId" UUID,
    "module_permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "personal_color" TEXT DEFAULT '#2c5ecaff',
    "position_title" TEXT,
    "department" TEXT,
    "phone_number" TEXT,
    "office_location" TEXT,
    "employee_id" TEXT,
    "company_name" TEXT,
    "employee_type" TEXT,
    "hire_date" TIMESTAMP(3),
    "manager" TEXT,
    "manager_email" TEXT,
    "sam_account_name" TEXT,
    "contact_info" JSONB,
    "deleted_from_ad" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_failed_login" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_method" TEXT,
    "two_factor_secret" TEXT,
    "two_factor_backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "two_factor_verified_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_campaigns" (
    "id" UUID NOT NULL,
    "channel" VARCHAR(16) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "message" TEXT NOT NULL,
    "audience" VARCHAR(40) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "priority" VARCHAR(16) NOT NULL DEFAULT 'normal',
    "placement" VARCHAR(24),
    "background_color" VARCHAR(7),
    "font_color" VARCHAR(7),
    "scroll_animation" VARCHAR(12) NOT NULL DEFAULT 'none',
    "cta_label" VARCHAR(80),
    "scheduled_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "provider_message_id" VARCHAR(255),
    "error_message" TEXT,
    "created_by" UUID,
    "created_by_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_banner_engagements" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_banner_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_setup_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_setup_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "performed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "description" TEXT,
    "matchCriteria" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "positionLevel" TEXT,
    "recruiterId" UUID,
    "organization_unit_id" UUID,
    "customAttributes" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" UUID,
    "gradeId" UUID,
    "positionAttribute" TEXT,
    "probation_period_days" INTEGER NOT NULL DEFAULT 90,
    "probation_evaluation_frequency_days" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyReference" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "domain" TEXT,
    "industry" TEXT,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "country" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "source" TEXT DEFAULT 'manual',
    "external_id" TEXT,
    "appkit_app_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "min_level" INTEGER NOT NULL,
    "max_level" INTEGER NOT NULL,
    "sla_days" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionLevel" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" UUID NOT NULL,
    "person_profile_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "positionId" UUID,
    "recruiterId" UUID,
    "fitScore" DOUBLE PRECISION DEFAULT 0,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parsedData" JSONB,
    "customAttributes" JSONB DEFAULT '{}',
    "resumePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    "assignmentJustification" TEXT,
    "educationData" JSONB DEFAULT '[]',
    "experienceData" JSONB DEFAULT '[]',
    "companyId" UUID,
    "sourceId" UUID,
    "subSource" TEXT,
    "statusId" UUID,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "emailDate" TIMESTAMP(3),
    "emailSubject" TEXT,
    "emailId" TEXT,
    "emailMetadata" JSONB,
    "expected_salary" INTEGER,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_profiles" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "preferred_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "introduction" TEXT,
    "avatar_url" TEXT,
    "education" JSONB NOT NULL DEFAULT '[]',
    "work_experience" JSONB NOT NULL DEFAULT '[]',
    "skills" JSONB NOT NULL DEFAULT '[]',
    "custom_attributes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_offers" (
    "id" UUID NOT NULL,
    "applicant_id" UUID,
    "position_id" UUID,
    "recipient_name" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "salary_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "start_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3),
    "letter_html" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "signed_name" TEXT,
    "signed_at" TIMESTAMP(3),
    "signature_ip" TEXT,
    "signature_user_agent" TEXT,
    "signature_consent_text" TEXT,
    "signature_hash" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_read_status" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicant_read_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_reminders" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "reminder_date" TIMESTAMP(3) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicant_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentStage" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "color_complete" TEXT,
    "color_badge" TEXT,

    CONSTRAINT "RecruitmentStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransitionRecord" (
    "id" UUID NOT NULL,
    "positionId" UUID,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage" TEXT NOT NULL,
    "notes" TEXT,
    "actingUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicant_id" UUID,

    CONSTRAINT "TransitionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "actingUserId" UUID,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "actingUserId" UUID,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "action" TEXT,
    "entity" TEXT,
    "entity_id" UUID,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTeam" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assignment_mode" TEXT NOT NULL DEFAULT 'manual',
    "assignment_conditions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" UUID NOT NULL,
    "model_name" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allow_custom_options" BOOLEAN NOT NULL DEFAULT false,
    "attribute_code" TEXT,
    "attribute_label" TEXT,
    "edit_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "field_code" TEXT NOT NULL,
    "show_in_applicant_detail" BOOLEAN NOT NULL DEFAULT false,
    "show_in_filter" BOOLEAN NOT NULL DEFAULT false,
    "show_in_full_applicant_detail" BOOLEAN NOT NULL DEFAULT false,
    "show_in_headcount_detail" BOOLEAN NOT NULL DEFAULT false,
    "show_in_position_settings" BOOLEAN NOT NULL DEFAULT false,
    "show_in_task_board_filter" BOOLEAN NOT NULL DEFAULT false,
    "applicant_detail_section" TEXT,
    "position_detail_section" TEXT,
    "view_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldOption" (
    "id" UUID NOT NULL,
    "custom_field_definition_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomFieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" UUID NOT NULL,
    "jobId" UUID,
    "jobTitle" TEXT,
    "fitScore" DOUBLE PRECISION,
    "matchReasons" TEXT[],
    "job_description_summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" UUID,
    "applicant_id" UUID,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_queue" (
    "id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "error_details" TEXT,
    "source" TEXT,
    "source_id" UUID,
    "sub_source" TEXT,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_date" TIMESTAMP(3),
    "upload_id" TEXT,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_path" TEXT NOT NULL,
    "webhook_payload" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "position_id" UUID,
    "process_date" TIMESTAMP(3),
    "email_date" TIMESTAMP(3),
    "email_subject" TEXT,
    "email_id" TEXT,
    "email_metadata" JSONB,

    CONSTRAINT "upload_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_operation_jobs" (
    "id" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "format" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "original_file_name" TEXT,
    "input_mime_type" TEXT,
    "input_file_size" BIGINT,
    "input_data" BYTEA,
    "parameters" JSONB,
    "output_file_name" TEXT,
    "output_mime_type" TEXT,
    "output_file_size" BIGINT,
    "output_data" BYTEA,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "requested_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_operation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUIDisplayPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "model_type" TEXT NOT NULL,
    "attribute_key" TEXT NOT NULL,
    "ui_preference" TEXT NOT NULL,
    "custom_note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserUIDisplayPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effective_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "published_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_document_acknowledgments" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_id" UUID,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_document_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_support_requests" (
    "id" UUID NOT NULL,
    "request_number" TEXT NOT NULL,
    "requester_user_id" UUID NOT NULL,
    "employee_id" UUID,
    "company_id" UUID,
    "assigned_to_user_id" UUID,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_support_activities" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "message" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'requester',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_support_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_desk_categories" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ai_enabled" BOOLEAN NOT NULL DEFAULT false,
    "system_prompt" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_desk_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_desk_knowledge_documents" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "content_hash" TEXT NOT NULL,
    "storage_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_desk_knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_desk_knowledge_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "token_estimate" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_desk_knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_desk_category_assignees" (
    "category_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_desk_category_assignees_pkey" PRIMARY KEY ("category_id","user_id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantComment" (
    "id" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'comment',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attachmentIds" TEXT[],

    CONSTRAINT "ApplicantComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" UUID NOT NULL,
    "applicantId" UUID,
    "uploadedById" UUID NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "headcountId" UUID,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "headers" JSONB,
    "auth_header_name" TEXT,
    "auth_header_value" TEXT,
    "auth_password" TEXT,
    "auth_token" TEXT,
    "auth_type" TEXT NOT NULL DEFAULT 'none',
    "auth_username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "events" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "timeout" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "body_template" TEXT,
    "field_mappings" JSONB,
    "include_metadata" BOOLEAN NOT NULL DEFAULT true,
    "custom_payload" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookBodyConfig" (
    "id" UUID NOT NULL,
    "webhook_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "field_mappings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookBodyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" UUID NOT NULL,
    "webhook_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "response_status" INTEGER,
    "response_body" TEXT,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" UUID NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "theme" TEXT NOT NULL DEFAULT 'default',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardShare" (
    "id" UUID NOT NULL,
    "dashboardId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidget" (
    "id" UUID NOT NULL,
    "dashboardId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB,
    "position" JSONB,
    "dataSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPromptCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemPromptCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPrompt" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantSource" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allow_sub_source" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logo" TEXT,
    "email" TEXT,

    CONSTRAINT "ApplicantSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB DEFAULT '{}',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Headcount" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'new',
    "status" TEXT NOT NULL DEFAULT 'vacant',
    "applicantId" UUID,
    "onboardingDate" TIMESTAMP(3),
    "requestDate" TIMESTAMP(3),
    "notes" TEXT,
    "memo_id" TEXT,
    "custom_fields" JSONB DEFAULT '{}',
    "employee_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Headcount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionInterviewer" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "PositionInterviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertiseGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertiseGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertiseSkill" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "skill_type" TEXT NOT NULL DEFAULT 'hard_skill',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "groupId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertiseSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#10B981',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityTrait" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "groupId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTemplate" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTemplateGroup" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTemplateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTemplateSkill" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTemplateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTemplatePersonalityGroup" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTemplatePersonalityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTemplatePersonalityTrait" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "traitId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTemplatePersonalityTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionExpertiseGroup" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionExpertiseGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionExpertiseSkill" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "min_score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionExpertiseSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionPersonalityGroup" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionPersonalityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionPersonalityTrait" (
    "id" UUID NOT NULL,
    "positionId" UUID NOT NULL,
    "traitId" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionPersonalityTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantEvaluation" (
    "id" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "positionId" UUID,
    "evaluatorId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "overall_score" DOUBLE PRECISION,
    "comments" TEXT,
    "completed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantEvaluationLink" (
    "id" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "requireLogin" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantEvaluationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantExpertiseScore" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantExpertiseScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantPersonalityScore" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "traitId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantPersonalityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemApiKey" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "last_used_ip" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_departments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "division" TEXT NOT NULL DEFAULT 'General',
    "department" TEXT NOT NULL DEFAULT 'General',
    "section" TEXT NOT NULL DEFAULT 'General',
    "unit_type" TEXT NOT NULL DEFAULT 'unit',
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "manager_id" UUID,
    "headcount_allocation" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employees" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "applicant_id" UUID,
    "person_profile_id" UUID,
    "employee_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "preferred_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department_id" UUID,
    "manager_id" UUID,
    "position_id" UUID,
    "job_title" TEXT,
    "employment_type" TEXT NOT NULL DEFAULT 'full_time',
    "status" TEXT NOT NULL DEFAULT 'active',
    "hire_date" TIMESTAMP(3),
    "probation_period_days" INTEGER,
    "probation_evaluation_frequency_days" INTEGER,
    "end_date" TIMESTAMP(3),
    "contract_notice_days" INTEGER NOT NULL DEFAULT 30,
    "location" TEXT,
    "company_id" UUID,
    "client_id" UUID,
    "legal_name" TEXT,
    "business_unit" TEXT,
    "work_phone" TEXT,
    "profile_photo_url" TEXT,
    "personal_information" JSONB NOT NULL DEFAULT '{}',
    "address" JSONB NOT NULL DEFAULT '{}',
    "emergency_contacts" JSONB NOT NULL DEFAULT '[]',
    "family_dependents" JSONB NOT NULL DEFAULT '[]',
    "bank_information" JSONB NOT NULL DEFAULT '{}',
    "tax_information" JSONB NOT NULL DEFAULT '{}',
    "government_identification" JSONB NOT NULL DEFAULT '{}',
    "education" JSONB NOT NULL DEFAULT '[]',
    "work_experience" JSONB NOT NULL DEFAULT '[]',
    "skills" JSONB NOT NULL DEFAULT '[]',
    "certifications" JSONB NOT NULL DEFAULT '[]',
    "languages" JSONB NOT NULL DEFAULT '[]',
    "profile_completion" INTEGER NOT NULL DEFAULT 35,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screening_consents" (
    "id" UUID NOT NULL,
    "applicant_id" UUID,
    "employee_id" UUID,
    "notice_version" TEXT NOT NULL,
    "capture_source" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screening_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screening_cases" (
    "id" UUID NOT NULL,
    "applicant_id" UUID,
    "employee_id" UUID,
    "requested_by_id" UUID,
    "trigger_type" TEXT NOT NULL,
    "use_ai" BOOLEAN NOT NULL DEFAULT false,
    "ai_status" TEXT NOT NULL DEFAULT 'not_requested',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "identity_snapshot" JSONB NOT NULL,
    "sources_checked" JSONB NOT NULL DEFAULT '[]',
    "idempotency_key" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "query_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error_code" TEXT,
    "error_message" TEXT,
    "consent_id" UUID,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screening_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screening_findings" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_title" TEXT,
    "publisher" TEXT,
    "published_at" TIMESTAMP(3),
    "category" TEXT NOT NULL,
    "allegation_status" TEXT NOT NULL DEFAULT 'unverified',
    "identity_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matching_signals" JSONB NOT NULL DEFAULT '[]',
    "review_status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_excerpt" TEXT,
    "ai_summary" TEXT,
    "ai_explanation" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screening_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_clients" (
    "id" UUID NOT NULL,
    "client_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "primary_contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_profile_change_requests" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "current_value" TEXT,
    "requested_value" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decided_by_id" UUID,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "request_id" TEXT,
    "requested_values" JSONB NOT NULL DEFAULT '{}',
    "original_values" JSONB NOT NULL DEFAULT '{}',
    "supporting_documents" JSONB NOT NULL DEFAULT '[]',
    "approver_comments" TEXT,
    "submitted_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "hr_employee_profile_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_documents" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "file_path" TEXT,
    "expires_at" TIMESTAMP(3),
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "issue_date" TIMESTAMP(3),
    "confidentiality_level" TEXT NOT NULL DEFAULT 'employee',
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "owner_id" UUID,
    "requires_acknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "file_size" BIGINT,
    "mime_type" TEXT,

    CONSTRAINT "hr_employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_onboarding_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_onboarding_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_onboarding_tasks" (
    "id" UUID NOT NULL,
    "template_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "detailed_instructions" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "owner_role" TEXT NOT NULL DEFAULT 'hr',
    "due_day" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "employee_visibility" TEXT NOT NULL DEFAULT 'visible',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_onboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_onboarding" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "template_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_onboarding_task_progress" (
    "id" UUID NOT NULL,
    "onboarding_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_onboarding_task_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_work_schedules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "weekly_hours" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "schedule_type" TEXT NOT NULL DEFAULT 'fixed',
    "expected_daily_minutes" INTEGER NOT NULL DEFAULT 480,
    "rotation_cycle_days" INTEGER,
    "effective_from" DATE,
    "effective_to" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_shift_assignments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "schedule_id" UUID,
    "roster_period_id" UUID,
    "shift_definition_id" UUID,
    "shift_definition_version" INTEGER,
    "shift_date" TIMESTAMP(3) NOT NULL,
    "logical_shift_date" DATE,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "work_location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "publication_status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "published_by_id" UUID,
    "change_reason" TEXT,
    "acknowledgment_required" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendance_records" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "work_date" TIMESTAMP(3) NOT NULL,
    "clock_in" TIMESTAMP(3),
    "clock_out" TIMESTAMP(3),
    "hours_worked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'present',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "overtime_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "late_minutes" INTEGER NOT NULL DEFAULT 0,
    "early_departure_minutes" INTEGER NOT NULL DEFAULT 0,
    "work_location" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "attendance_note" TEXT,
    "open_break_started_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "assignment_id" UUID,
    "scheduled_start_at" TIMESTAMP(3),
    "scheduled_end_at" TIMESTAMP(3),
    "scheduled_minutes" INTEGER NOT NULL DEFAULT 0,
    "worked_minutes" INTEGER NOT NULL DEFAULT 0,
    "regular_minutes" INTEGER NOT NULL DEFAULT 0,
    "overtime_minutes" INTEGER NOT NULL DEFAULT 0,
    "exception_status" TEXT NOT NULL DEFAULT 'clear',
    "review_status" TEXT NOT NULL DEFAULT 'open',
    "closed_at" TIMESTAMP(3),
    "closed_by_id" UUID,
    "original_values" JSONB NOT NULL DEFAULT '{}',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "calculation_version" TEXT,

    CONSTRAINT "hr_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_shift_definitions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color_token" TEXT NOT NULL DEFAULT 'indigo',
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_shift_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_shift_definition_versions" (
    "id" UUID NOT NULL,
    "shift_definition_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "overnight" BOOLEAN NOT NULL DEFAULT false,
    "break_rules" JSONB NOT NULL DEFAULT '[]',
    "grace_period_minutes" INTEGER NOT NULL DEFAULT 5,
    "early_departure_tolerance_minutes" INTEGER NOT NULL DEFAULT 5,
    "check_in_window_minutes" INTEGER NOT NULL DEFAULT 60,
    "check_out_window_minutes" INTEGER NOT NULL DEFAULT 180,
    "minimum_rest_minutes" INTEGER NOT NULL DEFAULT 660,
    "maximum_scheduled_minutes" INTEGER NOT NULL DEFAULT 720,
    "overtime_eligible" BOOLEAN NOT NULL DEFAULT true,
    "work_location" TEXT,
    "applicable_employee_groups" JSONB NOT NULL DEFAULT '[]',
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_shift_definition_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_work_schedule_days" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "cycle_day" INTEGER NOT NULL,
    "day_of_week" INTEGER,
    "is_working_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TEXT,
    "end_time" TEXT,
    "expected_minutes" INTEGER NOT NULL DEFAULT 480,
    "break_rules" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_work_schedule_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_roster_periods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" UUID,
    "department_id" UUID,
    "location" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "published_by_id" UUID,
    "locked_at" TIMESTAMP(3),
    "locked_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_roster_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_shift_assignment_history" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "previous_values" JSONB NOT NULL DEFAULT '{}',
    "new_values" JSONB NOT NULL DEFAULT '{}',
    "reason" TEXT NOT NULL,
    "actor_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_shift_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_open_shifts" (
    "id" UUID NOT NULL,
    "roster_period_id" UUID,
    "shift_definition_id" UUID,
    "shift_date" DATE NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "work_location" TEXT,
    "required_skills" JSONB NOT NULL DEFAULT '[]',
    "headcount_required" INTEGER NOT NULL DEFAULT 1,
    "headcount_assigned" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_open_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_availability" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "available_from" TIMESTAMP(3) NOT NULL,
    "available_to" TIMESTAMP(3) NOT NULL,
    "availability_type" TEXT NOT NULL DEFAULT 'available',
    "work_location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendance_events" (
    "id" UUID NOT NULL,
    "attendance_record_id" UUID,
    "employee_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logical_shift_date" DATE NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'web',
    "work_location" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "location_accuracy_meters" DECIMAL(10,2),
    "location_validation_status" TEXT,
    "device_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "actor_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_attendance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendance_calculations" (
    "id" UUID NOT NULL,
    "attendance_record_id" UUID NOT NULL,
    "calculation_version" TEXT NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "output_snapshot" JSONB NOT NULL,
    "explanation" JSONB NOT NULL DEFAULT '[]',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "calculated_by_id" UUID,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_attendance_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendance_exceptions" (
    "id" UUID NOT NULL,
    "attendance_record_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "status" TEXT NOT NULL DEFAULT 'open',
    "explanation" TEXT NOT NULL,
    "reviewer_comment" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_attendance_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendance_periods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "period_type" TEXT NOT NULL DEFAULT 'monthly',
    "company_id" UUID,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closed_at" TIMESTAMP(3),
    "closed_by_id" UUID,
    "reopened_at" TIMESTAMP(3),
    "reopened_by_id" UUID,
    "reopen_reason" TEXT,
    "exported_at" TIMESTAMP(3),
    "exported_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_attendance_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_shift_requests" (
    "id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "employee_id" UUID NOT NULL,
    "request_type" TEXT NOT NULL,
    "assignment_id" UUID,
    "requested_assignment_id" UUID,
    "swap_employee_id" UUID,
    "effective_start" DATE NOT NULL,
    "effective_end" DATE NOT NULL,
    "work_location" TEXT,
    "reason" TEXT NOT NULL,
    "impact_summary" JSONB NOT NULL DEFAULT '{}',
    "policy_warnings" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "colleague_accepted_at" TIMESTAMP(3),
    "approved_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "applied_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_shift_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_overtime_requests" (
    "id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "employee_id" UUID NOT NULL,
    "assignment_id" UUID,
    "work_date" DATE NOT NULL,
    "overtime_type" TEXT NOT NULL,
    "requested_start_at" TIMESTAMP(3) NOT NULL,
    "requested_end_at" TIMESTAMP(3) NOT NULL,
    "requested_minutes" INTEGER NOT NULL,
    "approved_start_at" TIMESTAMP(3),
    "approved_end_at" TIMESTAMP(3),
    "approved_minutes" INTEGER,
    "actual_start_at" TIMESTAMP(3),
    "actual_end_at" TIMESTAMP(3),
    "eligible_minutes" INTEGER,
    "manager_confirmed_minutes" INTEGER,
    "payroll_approved_minutes" INTEGER,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "business_reason" TEXT NOT NULL,
    "project" TEXT,
    "cost_center" TEXT,
    "work_location" TEXT,
    "compensation_method" TEXT NOT NULL DEFAULT 'paid',
    "difference_reason" TEXT,
    "policy_warnings" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approved_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_overtime_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_timesheets" (
    "id" UUID NOT NULL,
    "timesheet_number" TEXT NOT NULL,
    "employee_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "billable_minutes" INTEGER NOT NULL DEFAULT 0,
    "attendance_minutes" INTEGER NOT NULL DEFAULT 0,
    "difference_minutes" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "approved_by_id" UUID,
    "locked_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_timesheet_entries" (
    "id" UUID NOT NULL,
    "timesheet_id" UUID NOT NULL,
    "work_date" DATE NOT NULL,
    "project" TEXT NOT NULL,
    "task" TEXT,
    "client" TEXT,
    "cost_center" TEXT,
    "work_type" TEXT,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "duration_minutes" INTEGER NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "work_location" TEXT,
    "attendance_record_id" UUID,
    "overtime_request_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_timesheet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_attendance_exports" (
    "id" UUID NOT NULL,
    "attendance_period_id" UUID NOT NULL,
    "export_number" TEXT NOT NULL,
    "record_count" INTEGER NOT NULL,
    "regular_minutes" INTEGER NOT NULL,
    "overtime_minutes" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "exported_by_id" UUID,
    "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_attendance_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_policies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "annual_allowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "allow_half_day" BOOLEAN NOT NULL DEFAULT true,
    "allow_hourly" BOOLEAN NOT NULL DEFAULT false,
    "allow_backdated" BOOLEAN NOT NULL DEFAULT false,
    "exclude_weekends" BOOLEAN NOT NULL DEFAULT true,
    "exclude_holidays" BOOLEAN NOT NULL DEFAULT true,
    "minimum_notice_days" INTEGER NOT NULL DEFAULT 0,
    "maximum_consecutive_days" INTEGER,
    "attachment_required_after_days" DOUBLE PRECISION,
    "carry_forward_limit" DOUBLE PRECISION,
    "expires_on" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "accrual_frequency" TEXT NOT NULL DEFAULT 'annual',
    "accrual_rate" DOUBLE PRECISION,
    "maximum_balance" DOUBLE PRECISION,
    "minimum_request_units" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "maximum_future_days" INTEGER,
    "allow_negative_balance" BOOLEAN NOT NULL DEFAULT false,
    "negative_balance_limit" DOUBLE PRECISION,
    "encashment_eligible" BOOLEAN NOT NULL DEFAULT false,
    "minimum_retained_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maximum_encashment_units" DOUBLE PRECISION,
    "payroll_impact" TEXT NOT NULL DEFAULT 'none',
    "attendance_impact" TEXT NOT NULL DEFAULT 'leave',

    CONSTRAINT "hr_leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_balances" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "carry_forward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiring" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accrued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "hr_leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_requests" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "policy_id" UUID,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approver_id" UUID,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "request_id" TEXT,
    "request_unit" TEXT NOT NULL DEFAULT 'full_day',
    "half_day_period" TEXT,
    "requested_hours" DOUBLE PRECISION,
    "emergency_contact" TEXT,
    "handover_information" TEXT,
    "acting_employee_id" UUID,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "approver_comments" TEXT,
    "submitted_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "policy_version" INTEGER,
    "validation_snapshot" JSONB,
    "attendance_sync_status" TEXT NOT NULL DEFAULT 'pending',
    "payroll_sync_status" TEXT NOT NULL DEFAULT 'not_required',
    "request_group_id" UUID,
    "segment_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hr_leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_holidays" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "holiday_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_blocks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "leave_type" TEXT NOT NULL DEFAULT 'all',
    "scope" TEXT NOT NULL DEFAULT 'all',
    "target_value" TEXT,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_policy_versions" (
    "id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "rules" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_leave_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_policy_assignments" (
    "id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "employee_id" UUID,
    "assignment_type" TEXT NOT NULL DEFAULT 'employee',
    "assignment_value" TEXT,
    "inclusion_rules" JSONB NOT NULL DEFAULT '{}',
    "exclusion_rules" JSONB NOT NULL DEFAULT '{}',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 100,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "conflict_resolution" TEXT NOT NULL DEFAULT 'highest_priority',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_policy_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_balance_ledger" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "balance_id" UUID,
    "transaction_type" TEXT NOT NULL,
    "units" DOUBLE PRECISION NOT NULL,
    "balance_before" DOUBLE PRECISION NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" UUID,
    "idempotency_key" TEXT,
    "reason" TEXT,
    "actor_id" UUID,
    "reversal_of_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_leave_balance_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_approvals" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "approval_role" TEXT NOT NULL,
    "approver_id" UUID,
    "delegated_from_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "comment" TEXT,
    "policy_context" JSONB NOT NULL DEFAULT '{}',
    "exception_context" JSONB NOT NULL DEFAULT '{}',
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_encashments" (
    "id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "employee_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "requested_units" DOUBLE PRECISION NOT NULL,
    "approved_units" DOUBLE PRECISION,
    "unit_type" TEXT NOT NULL DEFAULT 'days',
    "period_year" INTEGER NOT NULL,
    "reason" TEXT,
    "payment_destination_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payroll_status" TEXT NOT NULL DEFAULT 'not_sent',
    "acknowledgment_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_encashments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_reservations" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" UUID NOT NULL,
    "units" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_leave_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_allocation_runs" (
    "id" UUID NOT NULL,
    "run_id" TEXT NOT NULL,
    "run_type" TEXT NOT NULL,
    "period_year" INTEGER NOT NULL,
    "policy_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'preview',
    "idempotency_key" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "error_report" JSONB NOT NULL DEFAULT '[]',
    "started_by" UUID,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_leave_allocation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_periods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "closed_at" TIMESTAMP(3),
    "closed_by" UUID,
    "reopened_at" TIMESTAMP(3),
    "reopened_by" UUID,
    "reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_exceptions" (
    "id" UUID NOT NULL,
    "exception_type" TEXT NOT NULL,
    "employee_id" UUID,
    "entity_type" TEXT,
    "entity_id" UUID,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "status" TEXT NOT NULL DEFAULT 'open',
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "assigned_to" UUID,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_leave_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leave_payroll_exports" (
    "id" UUID NOT NULL,
    "export_id" TEXT NOT NULL,
    "period_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'prepared',
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL DEFAULT '[]',
    "idempotency_key" TEXT NOT NULL,
    "exported_by" UUID,
    "exported_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_leave_payroll_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_cycles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "review_type" TEXT NOT NULL DEFAULT 'annual',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "self_due_date" TIMESTAMP(3),
    "manager_due_date" TIMESTAMP(3),
    "calibration_start_date" TIMESTAMP(3),
    "calibration_due_date" TIMESTAMP(3),
    "release_date" TIMESTAMP(3),
    "acknowledgment_due_date" TIMESTAMP(3),
    "company_id" UUID,
    "population_config" JSONB NOT NULL DEFAULT '{}',
    "workflow_config" JSONB NOT NULL DEFAULT '{}',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "template_version_id" UUID,
    "rating_model_id" UUID,
    "created_by_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_performance_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_reviews" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "rating" DOUBLE PRECISION,
    "summary" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "self_assessment" TEXT,
    "competency_assessment" JSONB NOT NULL DEFAULT '{}',
    "employee_comments" TEXT,
    "manager_assessment" TEXT,
    "development_plan" TEXT,
    "template_version_id" UUID,
    "rating_model_id" UUID,
    "calculated_rating" DOUBLE PRECISION,
    "manager_rating" DOUBLE PRECISION,
    "calibrated_rating" DOUBLE PRECISION,
    "final_rating" DOUBLE PRECISION,
    "goal_result" DOUBLE PRECISION,
    "competency_result" DOUBLE PRECISION,
    "self_responses" JSONB NOT NULL DEFAULT '{}',
    "manager_responses" JSONB NOT NULL DEFAULT '{}',
    "manager_comments" TEXT,
    "strengths" TEXT,
    "development_areas" TEXT,
    "career_aspiration" TEXT,
    "development_recommendation" TEXT,
    "submitted_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "released_by_id" UUID,
    "acknowledgment_status" TEXT NOT NULL DEFAULT 'not_released',
    "acknowledgment_comment" TEXT,
    "discussion_requested_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "hr_performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "company_id" UUID,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_template_versions" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "calculation_config" JSONB NOT NULL DEFAULT '{}',
    "visibility_config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'published',
    "published_by_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_appraisal_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_rating_models" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scale_type" TEXT NOT NULL DEFAULT 'numeric',
    "minimum_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maximum_score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "rounding_decimals" INTEGER NOT NULL DEFAULT 2,
    "missing_response_behavior" TEXT NOT NULL DEFAULT 'block',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "company_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_rating_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_rating_levels" (
    "id" UUID NOT NULL,
    "rating_model_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "numeric_value" DOUBLE PRECISION NOT NULL,
    "minimum_score" DOUBLE PRECISION NOT NULL,
    "maximum_score" DOUBLE PRECISION NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "semantic_status" TEXT NOT NULL DEFAULT 'neutral',
    "guidance" TEXT,

    CONSTRAINT "hr_appraisal_rating_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_reviewers" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewer_role" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "is_confidential" BOOLEAN NOT NULL DEFAULT false,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "responses" JSONB NOT NULL DEFAULT '{}',
    "rating" DOUBLE PRECISION,
    "strengths" TEXT,
    "development_areas" TEXT,
    "comments" TEXT,
    "submitted_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "reassigned_from_id" UUID,
    "idempotency_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_goal_evaluations" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "reviewer_role" TEXT NOT NULL,
    "reviewer_id" UUID,
    "rating" DOUBLE PRECISION,
    "comment" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "goal_snapshot" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_goal_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_competency_evaluations" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "competency_key" TEXT NOT NULL,
    "competency_snapshot" JSONB NOT NULL DEFAULT '{}',
    "reviewer_role" TEXT NOT NULL,
    "reviewer_id" UUID,
    "rating" DOUBLE PRECISION,
    "comment" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_competency_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_rating_adjustments" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "adjustment_type" TEXT NOT NULL,
    "original_rating" DOUBLE PRECISION,
    "new_rating" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "approver_id" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_appraisal_rating_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_calibration_sessions" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL DEFAULT 'company',
    "scope_value" TEXT,
    "meeting_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "guidance" JSONB NOT NULL DEFAULT '{}',
    "created_by_id" UUID,
    "finalized_by_id" UUID,
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_calibration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_calibration_decisions" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "review_id" UUID NOT NULL,
    "decision" TEXT NOT NULL,
    "proposed_rating" DOUBLE PRECISION,
    "calibrated_rating" DOUBLE PRECISION,
    "notes" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_appraisal_calibration_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_approvals" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "approval_role" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "approver_id" UUID,
    "delegated_from_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "comment" TEXT,
    "previous_status" TEXT,
    "new_status" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_appeals" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "original_result" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "manager_response" TEXT,
    "hr_decision" TEXT,
    "revised_result" JSONB,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_appraisal_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_appraisal_events" (
    "id" UUID NOT NULL,
    "cycle_id" UUID,
    "review_id" UUID,
    "actor_id" UUID,
    "event_type" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_appraisal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_goals" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "review_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "key_results" JSONB NOT NULL DEFAULT '[]',
    "comments" JSONB NOT NULL DEFAULT '[]',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "approval_status" TEXT NOT NULL DEFAULT 'approved',
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "hr_performance_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_check_ins" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "manager_id" UUID,
    "created_by_id" UUID,
    "type" TEXT NOT NULL DEFAULT 'one_on_one',
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "agenda" TEXT,
    "shared_notes" TEXT,
    "employee_draft_notes" TEXT,
    "manager_private_notes" TEXT,
    "achievements" TEXT,
    "challenges" TEXT,
    "support_required" TEXT,
    "follow_up_items" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "recurring_rule" TEXT,
    "idempotency_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_performance_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_feedback" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "provider_id" UUID,
    "requested_provider_id" UUID,
    "feedback_type" TEXT NOT NULL DEFAULT 'peer',
    "relationship" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'recipient',
    "status" TEXT NOT NULL DEFAULT 'published',
    "related_project" TEXT,
    "related_goal_id" UUID,
    "related_competency" TEXT,
    "context" TEXT,
    "went_well" TEXT,
    "improvement_suggestion" TEXT,
    "recommended_action" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_performance_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_recognition" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "provider_id" UUID,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "company_value" TEXT,
    "competency" TEXT,
    "related_project" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'recipient',
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_recognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_competency_evidence" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "competency_name" TEXT NOT NULL,
    "evidence_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "evidence_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "validated_by_id" UUID,
    "validated_at" TIMESTAMP(3),
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_competency_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_development_plans" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "owner_manager_id" UUID,
    "title" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL DEFAULT 'skill_development',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "aspiration" TEXT,
    "target_date" TIMESTAMP(3),
    "employee_comments" TEXT,
    "manager_comments" TEXT,
    "idempotency_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_development_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_development_actions" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "action_type" TEXT NOT NULL DEFAULT 'on_the_job',
    "related_competency" TEXT,
    "learning_course_id" UUID,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "employee_comments" TEXT,
    "manager_comments" TEXT,
    "idempotency_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_development_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_performance_activities" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "activity_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "title" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "visibility" TEXT NOT NULL DEFAULT 'employee',
    "idempotency_key" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_performance_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_ess_requests" (
    "id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "requester_employee_id" UUID NOT NULL,
    "subject_employee_id" UUID NOT NULL,
    "company_id" UUID,
    "source_record_type" TEXT,
    "source_record_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "current_approver_user_id" UUID,
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "original_values" JSONB NOT NULL DEFAULT '{}',
    "requested_values" JSONB NOT NULL DEFAULT '{}',
    "policy_warnings" JSONB NOT NULL DEFAULT '[]',
    "submitted_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_ess_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_ess_approval_steps" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "approval_mode" TEXT NOT NULL DEFAULT 'sequential',
    "approver_type" TEXT NOT NULL DEFAULT 'manager',
    "approver_user_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "acted_at" TIMESTAMP(3),
    "delegated_from_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_ess_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_ess_request_activities" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "comment" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_ess_request_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_courses" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "duration_hours" DOUBLE PRECISION,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "cover_image_url" TEXT,
    "objectives" JSONB NOT NULL DEFAULT '[]',
    "owner_name" TEXT,
    "passing_score" INTEGER NOT NULL DEFAULT 80,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "current_version_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_paths" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "course_ids" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_enrollments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "course_version_id" UUID,
    "current_lesson_id" UUID,
    "started_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "active_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_course_versions" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rules" JSONB NOT NULL DEFAULT '{}',
    "published_at" TIMESTAMP(3),
    "published_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_course_sections" (
    "id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_lessons" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 5,
    "minimum_active_seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_content_blocks" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "position" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_lesson_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "active_seconds" INTEGER NOT NULL DEFAULT 0,
    "furthest_second" INTEGER NOT NULL DEFAULT 0,
    "completed_blocks" JSONB NOT NULL DEFAULT '[]',
    "score" INTEGER,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_quiz_attempts" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "attempt" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_learning_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_assignment_submissions" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "text" TEXT,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_learning_assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_learning_activity_events" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID,
    "type" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "actor_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_learning_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_certifications" (
    "id" UUID NOT NULL,
    "record_type" TEXT NOT NULL DEFAULT 'employee',
    "employee_id" UUID,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "validity_months" INTEGER,
    "verification_url" TEXT,
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMP(3),
    "verified_by_id" UUID,
    "policy_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_periods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "pay_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "company_id" UUID,
    "locked_at" TIMESTAMP(3),
    "locked_by_id" UUID,
    "payroll_group_id" UUID,
    "cutoff_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_runs" (
    "id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "company_id" UUID,
    "payroll_group_id" UUID,
    "rule_set_id" UUID,
    "reversal_of_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "run_type" TEXT NOT NULL DEFAULT 'regular',
    "approval_status" TEXT NOT NULL DEFAULT 'not_submitted',
    "payment_status" TEXT NOT NULL DEFAULT 'not_ready',
    "accounting_status" TEXT NOT NULL DEFAULT 'not_ready',
    "reconciliation_status" TEXT NOT NULL DEFAULT 'pending',
    "gross_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employer_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employee_count" INTEGER NOT NULL DEFAULT 0,
    "calculation_version" INTEGER NOT NULL DEFAULT 0,
    "calculation_trace" JSONB NOT NULL DEFAULT '{}',
    "idempotency_key" TEXT,
    "created_by_id" UUID,
    "approved_by_id" UUID,
    "processed_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "finalized_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_run_items" (
    "id" UUID NOT NULL,
    "payroll_run_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "gross_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "base_salary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "regular_earnings" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "variable_earnings" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "reimbursements" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employer_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxable_income" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pit_withholding" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employee_social_security" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "employer_social_security" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "provident_fund_employee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "provident_fund_employer" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "previous_net_pay" DECIMAL(14,2),
    "variance_percent" DECIMAL(9,4),
    "payment_destination" TEXT,
    "components" JSONB NOT NULL DEFAULT '[]',
    "calculation_trace" JSONB NOT NULL DEFAULT '{}',
    "input_snapshot" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_payroll_run_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payslips" (
    "id" UUID NOT NULL,
    "payroll_run_item_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "payroll_period_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "file_path" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "gross_pay" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "year_to_date" JSONB NOT NULL DEFAULT '{}',
    "breakdown" JSONB NOT NULL DEFAULT '{}',
    "released_by_id" UUID,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_downloaded_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_compensation_packages" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "base_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "pay_frequency" TEXT NOT NULL DEFAULT 'monthly',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "components" JSONB NOT NULL DEFAULT '[]',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "correction_of_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_compensation_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_benefit_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "company_id" UUID,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "employer_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employee_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "eligibility_rules" JSONB NOT NULL DEFAULT '{}',
    "provider_code" TEXT,
    "effective_from" DATE,
    "effective_to" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_benefit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_benefit_enrollments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "benefit_plan_id" UUID NOT NULL,
    "company_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "effective_from" DATE,
    "effective_to" DATE,
    "life_event_type" TEXT,
    "dependents" JSONB NOT NULL DEFAULT '[]',
    "beneficiaries" JSONB NOT NULL DEFAULT '[]',
    "employee_contribution" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employer_contribution" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_employee_benefit_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_adjustments" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "period_id" UUID,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_payroll_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "internal_name" TEXT NOT NULL,
    "description" TEXT,
    "introduction" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "privacy_mode" TEXT NOT NULL DEFAULT 'identified',
    "owner_user_id" UUID NOT NULL,
    "department_owner_id" UUID,
    "company_id" UUID,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 5,
    "language" TEXT NOT NULL DEFAULT 'en',
    "additional_languages" JSONB NOT NULL DEFAULT '[]',
    "completion_message" TEXT,
    "contact_information" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "allow_draft" BOOLEAN NOT NULL DEFAULT true,
    "allow_edit_after_submit" BOOLEAN NOT NULL DEFAULT false,
    "anonymous_threshold" INTEGER NOT NULL DEFAULT 5,
    "results_visibility" TEXT NOT NULL DEFAULT 'owner_after_close',
    "opens_at" TIMESTAMP(3),
    "closes_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "version" INTEGER NOT NULL DEFAULT 1,
    "published_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_versions" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "snapshot" JSONB NOT NULL,
    "created_by_id" UUID NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_sections" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "randomize_questions" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "description" TEXT,
    "help_text" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "logic" JSONB NOT NULL DEFAULT '[]',
    "dimension" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scope" TEXT NOT NULL DEFAULT 'company',
    "company_id" UUID,
    "owner_user_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_audience_rules" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'include',
    "attribute" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_audience_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_audience_snapshots" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "employee_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_audience_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_distributions" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "payload" JSONB NOT NULL DEFAULT '{}',
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_invitations" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "user_id" UUID,
    "token_hash" TEXT NOT NULL,
    "response_binding_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_participation" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "started_at" TIMESTAMP(3),
    "last_saved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_participation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "privacy_mode" TEXT NOT NULL,
    "respondent_employee_id" UUID,
    "response_binding_hash" TEXT,
    "access_token_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "reference_code" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_response_answers" (
    "id" UUID NOT NULL,
    "response_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_response_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_reminders" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "target_statuses" TEXT[] DEFAULT ARRAY['not_started', 'in_progress']::TEXT[],
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "max_sends" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_result_releases" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "audience" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approved_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_result_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_action_plans" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner_user_id" UUID NOT NULL,
    "due_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_action_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_audit_logs" (
    "id" UUID NOT NULL,
    "survey_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_cost_centers" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_employee_id" UUID,
    "parent_id" UUID,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_projects" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost_center_id" UUID,
    "owner_employee_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" DATE,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advance_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "advance_id" UUID NOT NULL,
    "claim_id" UUID,
    "transaction_type" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "payment_reference" TEXT,
    "notes" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_advances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "advance_type_id" UUID NOT NULL,
    "travel_request_id" UUID,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "requested_amount" DECIMAL(16,2) NOT NULL,
    "approved_amount" DECIMAL(16,2),
    "issued_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "settled_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "required_date" DATE NOT NULL,
    "settlement_due_date" DATE NOT NULL,
    "department_id" UUID,
    "cost_center" TEXT,
    "project_reference" TEXT,
    "budget_reference" TEXT,
    "payment_method" TEXT NOT NULL,
    "payment_destination" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'not_ready',
    "payment_reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "policy_results" JSONB NOT NULL DEFAULT '[]',
    "idempotency_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_accounting_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "company_id" UUID,
    "source_type" TEXT NOT NULL,
    "source_id" UUID NOT NULL,
    "source_reference" TEXT NOT NULL,
    "journal_type" TEXT NOT NULL,
    "posting_date" DATE NOT NULL,
    "document_date" DATE NOT NULL,
    "accounting_period" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "exchange_rate" DECIMAL(18,8) NOT NULL DEFAULT 1,
    "total_debit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending_generation',
    "validation_results" JSONB NOT NULL DEFAULT '[]',
    "external_posting_reference" TEXT,
    "posting_error" TEXT,
    "reversal_of_id" UUID,
    "reconciliation_notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "exported_at" TIMESTAMPTZ(6),
    "posted_at" TIMESTAMPTZ(6),
    "reconciled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_accounting_entry_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "account_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "employee_id" UUID,
    "department_id" UUID,
    "cost_center" TEXT,
    "project_reference" TEXT,
    "tax_type" TEXT,
    "debit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_accounting_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_accounting_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "category_id" UUID,
    "advance_type_id" UUID,
    "payment_method" TEXT,
    "tax_type" TEXT,
    "expense_account" TEXT,
    "advance_account" TEXT,
    "payable_account" TEXT,
    "tax_account" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_DATE,
    "effective_to" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_accounting_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "comment" TEXT,
    "previous_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "idempotency_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_advance_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requires_travel" BOOLEAN NOT NULL DEFAULT false,
    "requires_document" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_advance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "approval_mode" TEXT NOT NULL DEFAULT 'sequential',
    "approval_role" TEXT NOT NULL,
    "approver_user_id" UUID,
    "delegated_from_user_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "comment" TEXT,
    "policy_context" JSONB NOT NULL DEFAULT '{}',
    "amount_context" JSONB NOT NULL DEFAULT '{}',
    "acted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requires_receipt" BOOLEAN NOT NULL DEFAULT true,
    "requires_attendees" BOOLEAN NOT NULL DEFAULT false,
    "default_tax_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_claim_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "claim_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "expense_date" DATE NOT NULL,
    "merchant" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "original_amount" DECIMAL(16,2) NOT NULL,
    "original_currency" VARCHAR(3) NOT NULL,
    "exchange_rate" DECIMAL(18,8) NOT NULL,
    "converted_amount" DECIMAL(16,2) NOT NULL,
    "tax_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "tax_type" TEXT,
    "tax_invoice_number" TEXT,
    "merchant_tax_id" TEXT,
    "receipt_number" TEXT,
    "cost_center" TEXT,
    "project_reference" TEXT,
    "business_purpose" TEXT,
    "attendee_count" INTEGER NOT NULL DEFAULT 0,
    "personal_payment" BOOLEAN NOT NULL DEFAULT true,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "reimbursable" BOOLEAN NOT NULL DEFAULT true,
    "review_status" TEXT NOT NULL DEFAULT 'pending',
    "approved_amount" DECIMAL(16,2),
    "adjustment_reason" TEXT,
    "exception_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_claim_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "title" TEXT NOT NULL,
    "business_purpose" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "travel_request_id" UUID,
    "advance_id" UUID,
    "department_id" UUID,
    "cost_center" TEXT,
    "project_reference" TEXT,
    "client_reference" TEXT,
    "claim_currency" VARCHAR(3) NOT NULL,
    "reimbursement_currency" VARCHAR(3) NOT NULL,
    "claimed_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "eligible_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "approved_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "advance_offset" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "employee_reimbursement" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "employee_repayment" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "payment_method" TEXT NOT NULL,
    "reimbursement_destination" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payment_status" TEXT NOT NULL DEFAULT 'not_ready',
    "policy_results" JSONB NOT NULL DEFAULT '[]',
    "idempotency_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_exchange_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "from_currency" VARCHAR(3) NOT NULL,
    "to_currency" VARCHAR(3) NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "rate_date" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "is_manual_override" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_policy_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "base_currency" VARCHAR(3) NOT NULL DEFAULT 'THB',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_receipts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "claim_id" UUID NOT NULL,
    "claim_item_id" UUID,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256_hash" TEXT NOT NULL,
    "ocr_status" TEXT NOT NULL DEFAULT 'not_requested',
    "ocr_values" JSONB NOT NULL DEFAULT '{}',
    "employee_confirmed_ocr" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_user_id" UUID,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_reimbursements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "claim_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "approved_amount" DECIMAL(16,2) NOT NULL,
    "advance_offset" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "reimbursement_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "repayment_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "masked_payment_destination" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ready_for_payment',
    "payment_reference" TEXT,
    "payment_batch" TEXT,
    "failure_reason" TEXT,
    "retry_history" JSONB NOT NULL DEFAULT '[]',
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_reimbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_tax_configurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "country" TEXT NOT NULL,
    "tax_type" TEXT NOT NULL,
    "rate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "recoverable_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_asset_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_return_at" TIMESTAMPTZ(6),
    "acknowledged_at" TIMESTAMPTZ(6),
    "returned_at" TIMESTAMPTZ(6),
    "return_condition" TEXT,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "assigned_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_transportation_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "mode" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "pickup_point" TEXT,
    "pickup_time" TIME(6),
    "vehicle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_transportation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "asset_tag" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serial_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "purchase_date" DATE,
    "value" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "employee_id" UUID,
    "case_number" TEXT NOT NULL,
    "case_type" TEXT NOT NULL,
    "confidentiality" TEXT NOT NULL DEFAULT 'restricted',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "owner_user_id" UUID,
    "due_at" TIMESTAMPTZ(6),
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "outcome" TEXT,
    "appeal_status" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "closed_at" TIMESTAMPTZ(6),
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_compensation_changes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "employee_id" UUID NOT NULL,
    "change_type" TEXT NOT NULL,
    "current_amount" DECIMAL(14,2) NOT NULL,
    "proposed_amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "effective_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "budget_impact" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approval_history" JSONB NOT NULL DEFAULT '[]',
    "requested_by_id" UUID,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "applied_package_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_compensation_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_compensation_review_cycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "budget_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "guidelines" JSONB NOT NULL DEFAULT '{}',
    "approved_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_compensation_review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_compensation_review_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "current_salary" DECIMAL(14,2) NOT NULL,
    "proposed_salary" DECIMAL(14,2) NOT NULL,
    "market_midpoint" DECIMAL(14,2),
    "merit_rating" DECIMAL(5,2),
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "manager_approved_at" TIMESTAMPTZ(6),
    "hr_approved_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_compensation_review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_document_acknowledgments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "device_metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "hr_document_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_document_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT,
    "mime_type" TEXT,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_domain_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employee_payroll_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "payroll_group_id" UUID,
    "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "payment_currency" TEXT NOT NULL DEFAULT 'THB',
    "bank_account_reference" TEXT,
    "tax_profile_reference" TEXT,
    "statutory_profile_reference" TEXT,
    "cost_center" TEXT,
    "accounting_dimensions" JSONB NOT NULL DEFAULT '{}',
    "payroll_start_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "payroll_end_date" DATE,
    "final_pay_status" TEXT NOT NULL DEFAULT 'not_required',
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employee_payroll_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employment_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "client_id" UUID,
    "position_id" UUID,
    "department_id" UUID,
    "manager_id" UUID,
    "grade_id" UUID,
    "work_schedule_id" UUID,
    "assignment_type" TEXT NOT NULL DEFAULT 'primary',
    "employment_type" TEXT NOT NULL DEFAULT 'full_time',
    "job_title" TEXT,
    "location" TEXT,
    "contract_number" TEXT,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "reason" TEXT,
    "source_event_id" UUID,
    "correction_of_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employment_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "event_type" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reason" TEXT NOT NULL,
    "previous_values" JSONB NOT NULL DEFAULT '{}',
    "proposed_values" JSONB NOT NULL DEFAULT '{}',
    "request_id" TEXT,
    "idempotency_key" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "requested_by_id" UUID,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "applied_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_ess_sensitive_access_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "field_group" TEXT NOT NULL,
    "reason" TEXT,
    "ip_address" TEXT,
    "device_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_ess_sensitive_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_exit_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "exit_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notice_date" DATE,
    "last_working_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "rehire_eligible" BOOLEAN,
    "rehire_notes" TEXT,
    "exit_interview" JSONB NOT NULL DEFAULT '{}',
    "leave_settlement_status" TEXT NOT NULL DEFAULT 'pending',
    "final_payroll_status" TEXT NOT NULL DEFAULT 'pending',
    "access_revocation_status" TEXT NOT NULL DEFAULT 'pending',
    "ownership_transfer_status" TEXT NOT NULL DEFAULT 'pending',
    "document_retention_until" DATE,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "requested_by_id" UUID,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_exit_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "feature_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "updated_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_integration_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "integration_type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_key" TEXT NOT NULL,
    "internal_resource" TEXT NOT NULL,
    "internal_id" UUID,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_synced_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_integration_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_internal_mobility_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "opportunity_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "statement" TEXT,
    "manager_endorsement" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "outcome_notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_internal_mobility_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_internal_opportunities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "position_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eligibility_rules" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "opens_at" TIMESTAMPTZ(6),
    "closes_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_internal_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_accounting_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "payroll_run_id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "accounting_date" DATE NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "total_debit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "posted_reference" TEXT,
    "posted_at" TIMESTAMPTZ(6),
    "posted_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_accounting_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_accounting_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accounting_entry_id" UUID NOT NULL,
    "account_type" TEXT NOT NULL,
    "account_code" TEXT,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "cost_center" TEXT,
    "department_id" UUID,
    "dimensions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_accounting_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "approval_role" TEXT NOT NULL,
    "approver_user_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "decision_reason" TEXT,
    "decided_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_calculation_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_item_id" UUID NOT NULL,
    "calculation_version" INTEGER NOT NULL,
    "line_type" TEXT NOT NULL,
    "component_code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "employer_cost" BOOLEAN NOT NULL DEFAULT false,
    "source_module" TEXT,
    "source_record_id" TEXT,
    "rule_reference" TEXT,
    "explanation" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_calculation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_exceptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_id" UUID NOT NULL,
    "employee_id" UUID,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_exports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "payroll_run_id" UUID NOT NULL,
    "export_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "file_path" TEXT,
    "checksum" TEXT,
    "totals" JSONB NOT NULL DEFAULT '{}',
    "generated_by_id" UUID,
    "generated_at" TIMESTAMPTZ(6),
    "reconciled_by_id" UUID,
    "reconciled_at" TIMESTAMPTZ(6),
    "reconciliation" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pay_frequency" TEXT NOT NULL DEFAULT 'monthly',
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "cutoff_day" INTEGER,
    "pay_day" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "effective_from" DATE NOT NULL DEFAULT CURRENT_DATE,
    "effective_to" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_inputs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "payroll_run_id" UUID,
    "employee_id" UUID NOT NULL,
    "input_type" TEXT NOT NULL,
    "component_code" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "units" DECIMAL(14,4),
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "source_module" TEXT NOT NULL,
    "source_record_id" TEXT,
    "effective_date" DATE NOT NULL,
    "approval_status" TEXT NOT NULL DEFAULT 'approved',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "idempotency_key" TEXT NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_payment_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "payroll_run_id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "employee_count" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'not_ready',
    "file_path" TEXT,
    "checksum" TEXT,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "created_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_payment_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_batch_id" UUID NOT NULL,
    "payroll_run_item_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "payment_method" TEXT NOT NULL,
    "payment_destination" TEXT,
    "payment_reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_ready',
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMPTZ(6),
    "reconciled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_reconciliations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "payroll_run_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "calculation_total" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "payslip_total" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "payment_total" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "accounting_debit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "accounting_credit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "discrepancy_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "issues" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "owner_user_id" UUID,
    "reconciled_by_id" UUID,
    "reconciled_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_rule_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "jurisdiction" TEXT NOT NULL DEFAULT 'TH',
    "name" TEXT NOT NULL,
    "legal_version" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rules" JSONB NOT NULL,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_payroll_variances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payroll_run_id" UUID NOT NULL,
    "employee_id" UUID,
    "metric" TEXT NOT NULL,
    "previous_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "current_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "variance_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "variance_percent" DECIMAL(9,4),
    "materiality_threshold" DECIMAL(9,4) NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'open',
    "explanation" TEXT,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_payroll_variances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_privacy_request_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "message" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'requester',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_privacy_request_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_privacy_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "employee_id" UUID,
    "request_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "decision" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_number" TEXT,
    "requester_user_id" UUID,
    "details" TEXT,
    "identity_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMPTZ(6),
    "withdrawn_at" TIMESTAMPTZ(6),

    CONSTRAINT "hr_privacy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_retention_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "record_type" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL,
    "legal_basis" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'review',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_succession_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "position_id" UUID,
    "incumbent_employee_id" UUID,
    "criticality" TEXT NOT NULL DEFAULT 'normal',
    "risk_level" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_succession_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_successor_candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "succession_plan_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "readiness" TEXT NOT NULL,
    "retention_risk" TEXT,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "gaps" JSONB NOT NULL DEFAULT '[]',
    "development_actions" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_successor_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_talent_review_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "performance_axis" INTEGER NOT NULL,
    "potential_axis" INTEGER NOT NULL,
    "retention_risk" TEXT,
    "restricted_notes" TEXT,
    "decision" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_talent_review_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_talent_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "review_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "locked_at" TIMESTAMPTZ(6),
    "locked_by_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_talent_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_workflow_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "task_type" VARCHAR(120) NOT NULL,
    "source_domain" VARCHAR(80) NOT NULL,
    "source_type" VARCHAR(120) NOT NULL,
    "source_id" UUID NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "summary" TEXT,
    "requester_user_id" UUID,
    "requester_name" VARCHAR(240),
    "assignee_user_id" UUID,
    "assignee_name" VARCHAR(240),
    "company_name" VARCHAR(240),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "due_at" TIMESTAMPTZ(6),
    "sla_at" TIMESTAMPTZ(6),
    "status" VARCHAR(80) NOT NULL DEFAULT 'pending',
    "deep_link" TEXT NOT NULL,
    "allowed_decisions" JSONB NOT NULL DEFAULT '[]',
    "decision_handlers" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_workforce_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "planning_period_start" DATE NOT NULL,
    "planning_period_end" DATE NOT NULL,
    "scenario" TEXT NOT NULL DEFAULT 'baseline',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "assumptions" JSONB NOT NULL DEFAULT '{}',
    "demand" JSONB NOT NULL DEFAULT '[]',
    "supply" JSONB NOT NULL DEFAULT '[]',
    "cost_forecast" JSONB NOT NULL DEFAULT '{}',
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_workforce_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL,
    "employee_id" UUID NOT NULL,
    "company_id" UUID,
    "title" TEXT NOT NULL,
    "business_purpose" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "travel_type" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destinations" JSONB NOT NULL DEFAULT '[]',
    "departure_at" TIMESTAMPTZ(6) NOT NULL,
    "return_at" TIMESTAMPTZ(6) NOT NULL,
    "department_id" UUID,
    "cost_center" TEXT,
    "project_reference" TEXT,
    "client_reference" TEXT,
    "estimated_amount" DECIMAL(16,2) NOT NULL,
    "approved_budget" DECIMAL(16,2),
    "currency" VARCHAR(3) NOT NULL,
    "requested_advance_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "preferred_transport" TEXT,
    "preferred_accommodation" TEXT,
    "visa_required" BOOLEAN NOT NULL DEFAULT false,
    "insurance_required" BOOLEAN NOT NULL DEFAULT false,
    "emergency_contact" TEXT,
    "itinerary" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "policy_results" JSONB NOT NULL DEFAULT '[]',
    "change_history" JSONB NOT NULL DEFAULT '[]',
    "idempotency_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travel_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sequence" BIGSERIAL NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" VARCHAR(20) NOT NULL DEFAULT 'AUDIT',
    "action" VARCHAR(160) NOT NULL,
    "outcome" VARCHAR(32) NOT NULL DEFAULT 'success',
    "message" TEXT NOT NULL,
    "source" VARCHAR(200),
    "actor_user_id" UUID,
    "impersonator_id" UUID,
    "company_id" UUID,
    "entity_type" VARCHAR(120),
    "entity_id" VARCHAR(200),
    "request_id" VARCHAR(160),
    "correlation_id" VARCHAR(160),
    "ip_address" INET,
    "user_agent" VARCHAR(1000),
    "reason" TEXT,
    "before_value" JSONB,
    "after_value" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "previous_hash" VARCHAR(64),
    "event_hash" VARCHAR(64) NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event_dead_letters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payload" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "next_attempt_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_dead_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_archive_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "receipt" JSONB,
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_archive_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_legal_holds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMPTZ(6),
    "created_by_id" UUID NOT NULL,
    "released_by_id" UUID,
    "released_at" TIMESTAMPTZ(6),
    "release_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_legal_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_retention_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_id" UUID,
    "company_id" UUID,
    "record_type" TEXT NOT NULL,
    "mode" VARCHAR(32) NOT NULL DEFAULT 'dry_run',
    "status" VARCHAR(32) NOT NULL DEFAULT 'queued',
    "cutoff_at" TIMESTAMPTZ(6) NOT NULL,
    "candidate_count" INTEGER NOT NULL DEFAULT 0,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "held_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "requested_by_id" UUID NOT NULL,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "report" JSONB NOT NULL DEFAULT '{}',
    "receipt_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_retention_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_retention_execution_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "execution_id" UUID NOT NULL,
    "entity_id" VARCHAR(200) NOT NULL,
    "storage_keys" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_retention_execution_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_access_review_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "launched_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "certification_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_access_review_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_access_review_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "subject_user_id" UUID NOT NULL,
    "reviewer_user_id" UUID,
    "access_snapshot" JSONB NOT NULL,
    "risk_flags" JSONB NOT NULL DEFAULT '[]',
    "decision" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "justification" TEXT,
    "remediation" JSONB NOT NULL DEFAULT '{}',
    "decided_at" TIMESTAMPTZ(6),
    "remediated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_access_review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_sod_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "permission_a" VARCHAR(160) NOT NULL,
    "permission_b" VARCHAR(160) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'high',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_mitigation" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_sod_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_controls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "framework_refs" JSONB NOT NULL DEFAULT '[]',
    "frequency" VARCHAR(40) NOT NULL,
    "owner_user_id" UUID,
    "reviewer_user_id" UUID,
    "automation_key" VARCHAR(120),
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "next_due_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_periods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "framework" VARCHAR(80) NOT NULL,
    "company_id" UUID,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'open',
    "locked_at" TIMESTAMPTZ(6),
    "locked_by_id" UUID,
    "manifest_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "control_id" UUID NOT NULL,
    "period_id" UUID,
    "company_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "evidence_type" VARCHAR(60) NOT NULL,
    "source" TEXT,
    "storage_key" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "checksum" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "collected_by_id" UUID,
    "collected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_exceptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "control_id" UUID,
    "detector_key" VARCHAR(120),
    "fingerprint" VARCHAR(64) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'open',
    "company_id" UUID,
    "owner_user_id" UUID,
    "due_at" TIMESTAMPTZ(6),
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "remediation" TEXT,
    "reviewer_user_id" UUID,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_assurance_evidence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" VARCHAR(60) NOT NULL,
    "reference" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "owner_user_id" UUID,
    "approver_user_id" UUID,
    "company_id" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "checksum" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_assurance_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_azure_oid_key" ON "User"("azure_oid");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_authentication_methods_idx" ON "User"("authentication_methods");

-- CreateIndex
CREATE INDEX "User_userGroupId_idx" ON "User"("userGroupId");

-- CreateIndex
CREATE INDEX "User_userTeamId_idx" ON "User"("userTeamId");

-- CreateIndex
CREATE INDEX "User_is_active_idx" ON "User"("is_active");

-- CreateIndex
CREATE INDEX "User_employee_id_idx" ON "User"("employee_id");

-- CreateIndex
CREATE INDEX "User_deleted_from_ad_idx" ON "User"("deleted_from_ad");

-- CreateIndex
CREATE INDEX "broadcast_campaigns_history_idx" ON "broadcast_campaigns"("created_at" DESC);

-- CreateIndex
CREATE INDEX "broadcast_campaigns_active_idx" ON "broadcast_campaigns"("channel", "status", "scheduled_at", "expires_at");

-- CreateIndex
CREATE INDEX "broadcast_banner_engagement_report_idx" ON "broadcast_banner_engagements"("campaign_id", "acknowledged_at");

-- CreateIndex
CREATE INDEX "broadcast_banner_engagement_user_idx" ON "broadcast_banner_engagements"("user_id", "acknowledged_at");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_banner_engagement_campaign_user_key" ON "broadcast_banner_engagements"("campaign_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_setup_tokens_token_hash_key" ON "password_setup_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_setup_tokens_user_id_idx" ON "password_setup_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_setup_tokens_expires_at_idx" ON "password_setup_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "UserActivityLog_user_id_idx" ON "UserActivityLog"("user_id");

-- CreateIndex
CREATE INDEX "UserActivityLog_action_idx" ON "UserActivityLog"("action");

-- CreateIndex
CREATE INDEX "UserActivityLog_created_at_idx" ON "UserActivityLog"("created_at");

-- CreateIndex
CREATE INDEX "UserActivityLog_performed_by_idx" ON "UserActivityLog"("performed_by");

-- CreateIndex
CREATE INDEX "Position_title_idx" ON "Position"("title");

-- CreateIndex
CREATE INDEX "Position_department_idx" ON "Position"("department");

-- CreateIndex
CREATE INDEX "Position_isOpen_idx" ON "Position"("isOpen");

-- CreateIndex
CREATE INDEX "Position_recruiterId_idx" ON "Position"("recruiterId");

-- CreateIndex
CREATE INDEX "Position_organization_unit_id_idx" ON "Position"("organization_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyReference_name_key" ON "CompanyReference"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyReference_external_id_key" ON "CompanyReference"("external_id");

-- CreateIndex
CREATE INDEX "CompanyReference_domain_idx" ON "CompanyReference"("domain");

-- CreateIndex
CREATE INDEX "CompanyReference_is_active_idx" ON "CompanyReference"("is_active");

-- CreateIndex
CREATE INDEX "CompanyReference_sort_order_idx" ON "CompanyReference"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_name_key" ON "Grade"("name");

-- CreateIndex
CREATE INDEX "Grade_min_level_idx" ON "Grade"("min_level");

-- CreateIndex
CREATE INDEX "Grade_max_level_idx" ON "Grade"("max_level");

-- CreateIndex
CREATE INDEX "Grade_is_active_idx" ON "Grade"("is_active");

-- CreateIndex
CREATE INDEX "Grade_sort_order_idx" ON "Grade"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "PositionLevel_name_key" ON "PositionLevel"("name");

-- CreateIndex
CREATE INDEX "PositionLevel_is_active_idx" ON "PositionLevel"("is_active");

-- CreateIndex
CREATE INDEX "PositionLevel_sort_order_idx" ON "PositionLevel"("sort_order");

-- CreateIndex
CREATE INDEX "Applicant_email_idx" ON "Applicant"("email");

-- CreateIndex
CREATE INDEX "Applicant_person_profile_id_idx" ON "Applicant"("person_profile_id");

-- CreateIndex
CREATE INDEX "Applicant_positionId_idx" ON "Applicant"("positionId");

-- CreateIndex
CREATE INDEX "Applicant_recruiterId_idx" ON "Applicant"("recruiterId");

-- CreateIndex
CREATE INDEX "Applicant_applicationDate_idx" ON "Applicant"("applicationDate");

-- CreateIndex
CREATE INDEX "Applicant_fitScore_idx" ON "Applicant"("fitScore");

-- CreateIndex
CREATE INDEX "Applicant_sourceId_idx" ON "Applicant"("sourceId");

-- CreateIndex
CREATE INDEX "Applicant_statusId_idx" ON "Applicant"("statusId");

-- CreateIndex
CREATE INDEX "Applicant_isPinned_idx" ON "Applicant"("isPinned");

-- CreateIndex
CREATE INDEX "Applicant_pinnedAt_idx" ON "Applicant"("pinnedAt");

-- CreateIndex
CREATE INDEX "person_profiles_email_idx" ON "person_profiles"("email");

-- CreateIndex
CREATE INDEX "person_profiles_last_name_first_name_idx" ON "person_profiles"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "job_offers_token_key" ON "job_offers"("token");

-- CreateIndex
CREATE INDEX "job_offers_applicant_id_idx" ON "job_offers"("applicant_id");

-- CreateIndex
CREATE INDEX "job_offers_position_id_idx" ON "job_offers"("position_id");

-- CreateIndex
CREATE INDEX "job_offers_recipient_email_idx" ON "job_offers"("recipient_email");

-- CreateIndex
CREATE INDEX "job_offers_status_idx" ON "job_offers"("status");

-- CreateIndex
CREATE INDEX "job_offers_token_idx" ON "job_offers"("token");

-- CreateIndex
CREATE INDEX "applicant_read_status_applicant_id_idx" ON "applicant_read_status"("applicant_id");

-- CreateIndex
CREATE INDEX "applicant_read_status_user_id_idx" ON "applicant_read_status"("user_id");

-- CreateIndex
CREATE INDEX "applicant_read_status_is_read_idx" ON "applicant_read_status"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_read_status_applicant_id_user_id_key" ON "applicant_read_status"("applicant_id", "user_id");

-- CreateIndex
CREATE INDEX "applicant_reminders_applicant_id_idx" ON "applicant_reminders"("applicant_id");

-- CreateIndex
CREATE INDEX "applicant_reminders_user_id_idx" ON "applicant_reminders"("user_id");

-- CreateIndex
CREATE INDEX "applicant_reminders_reminder_date_idx" ON "applicant_reminders"("reminder_date");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentStage_name_key" ON "RecruitmentStage"("name");

-- CreateIndex
CREATE INDEX "RecruitmentStage_sort_order_idx" ON "RecruitmentStage"("sort_order");

-- CreateIndex
CREATE INDEX "RecruitmentStage_is_system_idx" ON "RecruitmentStage"("is_system");

-- CreateIndex
CREATE INDEX "TransitionRecord_applicant_id_idx" ON "TransitionRecord"("applicant_id");

-- CreateIndex
CREATE INDEX "TransitionRecord_actingUserId_idx" ON "TransitionRecord"("actingUserId");

-- CreateIndex
CREATE INDEX "TransitionRecord_date_idx" ON "TransitionRecord"("date");

-- CreateIndex
CREATE INDEX "TransitionRecord_stage_idx" ON "TransitionRecord"("stage");

-- CreateIndex
CREATE INDEX "TransitionRecord_positionId_idx" ON "TransitionRecord"("positionId");

-- CreateIndex
CREATE INDEX "LogEntry_timestamp_idx" ON "LogEntry"("timestamp");

-- CreateIndex
CREATE INDEX "LogEntry_level_idx" ON "LogEntry"("level");

-- CreateIndex
CREATE INDEX "LogEntry_source_idx" ON "LogEntry"("source");

-- CreateIndex
CREATE INDEX "LogEntry_actingUserId_idx" ON "LogEntry"("actingUserId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_level_idx" ON "AuditLog"("level");

-- CreateIndex
CREATE INDEX "AuditLog_source_idx" ON "AuditLog"("source");

-- CreateIndex
CREATE INDEX "AuditLog_actingUserId_idx" ON "AuditLog"("actingUserId");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_name_key" ON "UserGroup"("name");

-- CreateIndex
CREATE INDEX "UserGroup_is_default_idx" ON "UserGroup"("is_default");

-- CreateIndex
CREATE INDEX "UserGroup_is_system_role_idx" ON "UserGroup"("is_system_role");

-- CreateIndex
CREATE UNIQUE INDEX "UserTeam_name_key" ON "UserTeam"("name");

-- CreateIndex
CREATE INDEX "UserTeam_is_active_idx" ON "UserTeam"("is_active");

-- CreateIndex
CREATE INDEX "SystemSetting_updatedAt_idx" ON "SystemSetting"("updatedAt");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_model_name_idx" ON "CustomFieldDefinition"("model_name");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_sort_order_idx" ON "CustomFieldDefinition"("sort_order");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_view_roles_idx" ON "CustomFieldDefinition"("view_roles");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_edit_roles_idx" ON "CustomFieldDefinition"("edit_roles");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_model_name_field_key_key" ON "CustomFieldDefinition"("model_name", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_model_name_field_code_key" ON "CustomFieldDefinition"("model_name", "field_code");

-- CreateIndex
CREATE INDEX "CustomFieldOption_custom_field_definition_id_idx" ON "CustomFieldOption"("custom_field_definition_id");

-- CreateIndex
CREATE INDEX "CustomFieldOption_sort_order_idx" ON "CustomFieldOption"("sort_order");

-- CreateIndex
CREATE INDEX "CustomFieldOption_is_active_idx" ON "CustomFieldOption"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldOption_custom_field_definition_id_value_key" ON "CustomFieldOption"("custom_field_definition_id", "value");

-- CreateIndex
CREATE INDEX "JobMatch_applicant_id_idx" ON "JobMatch"("applicant_id");

-- CreateIndex
CREATE INDEX "JobMatch_jobId_idx" ON "JobMatch"("jobId");

-- CreateIndex
CREATE INDEX "JobMatch_fitScore_idx" ON "JobMatch"("fitScore");

-- CreateIndex
CREATE INDEX "upload_queue_status_idx" ON "upload_queue"("status");

-- CreateIndex
CREATE INDEX "upload_queue_upload_date_idx" ON "upload_queue"("upload_date");

-- CreateIndex
CREATE INDEX "upload_queue_completed_date_idx" ON "upload_queue"("completed_date");

-- CreateIndex
CREATE INDEX "upload_queue_process_date_idx" ON "upload_queue"("process_date");

-- CreateIndex
CREATE INDEX "upload_queue_created_by_idx" ON "upload_queue"("created_by");

-- CreateIndex
CREATE INDEX "upload_queue_source_idx" ON "upload_queue"("source");

-- CreateIndex
CREATE INDEX "upload_queue_source_id_idx" ON "upload_queue"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "upload_queue_file_path_status_key" ON "upload_queue"("file_path", "status");

-- CreateIndex
CREATE INDEX "data_operation_jobs_status_created_at_idx" ON "data_operation_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "data_operation_jobs_requested_by_id_created_at_idx" ON "data_operation_jobs"("requested_by_id", "created_at");

-- CreateIndex
CREATE INDEX "data_operation_jobs_operation_entity_type_idx" ON "data_operation_jobs"("operation", "entity_type");

-- CreateIndex
CREATE INDEX "UserUIDisplayPreference_userId_idx" ON "UserUIDisplayPreference"("userId");

-- CreateIndex
CREATE INDEX "UserUIDisplayPreference_model_type_idx" ON "UserUIDisplayPreference"("model_type");

-- CreateIndex
CREATE INDEX "UserUIDisplayPreference_attribute_key_idx" ON "UserUIDisplayPreference"("attribute_key");

-- CreateIndex
CREATE UNIQUE INDEX "UserUIDisplayPreference_userId_model_type_attribute_key_key" ON "UserUIDisplayPreference"("userId", "model_type", "attribute_key");

-- CreateIndex
CREATE INDEX "legal_documents_document_type_status_published_at_idx" ON "legal_documents"("document_type", "status", "published_at");

-- CreateIndex
CREATE INDEX "legal_documents_type_status_idx" ON "legal_documents"("document_type", "status", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_document_type_version_key" ON "legal_documents"("document_type", "version");

-- CreateIndex
CREATE INDEX "legal_document_acknowledgments_user_id_acknowledged_at_idx" ON "legal_document_acknowledgments"("user_id", "acknowledged_at");

-- CreateIndex
CREATE INDEX "legal_ack_user_idx" ON "legal_document_acknowledgments"("user_id", "acknowledged_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "legal_document_acknowledgments_document_id_user_id_key" ON "legal_document_acknowledgments"("document_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_support_requests_request_number_key" ON "employee_support_requests"("request_number");

-- CreateIndex
CREATE INDEX "support_assignee_status_idx" ON "employee_support_requests"("assigned_to_user_id", "status");

-- CreateIndex
CREATE INDEX "support_company_status_idx" ON "employee_support_requests"("company_id", "status");

-- CreateIndex
CREATE INDEX "support_company_updated_idx" ON "employee_support_requests"("company_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "support_requester_updated_idx" ON "employee_support_requests"("requester_user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "support_activity_request_idx" ON "employee_support_activities"("request_id", "created_at");

-- CreateIndex
CREATE INDEX "service_desk_categories_company_order_idx" ON "service_desk_categories"("company_id", "sort_order");

-- CreateIndex
CREATE INDEX "service_desk_knowledge_documents_category_status_idx" ON "service_desk_knowledge_documents"("category_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "service_desk_knowledge_documents_category_file_key" ON "service_desk_knowledge_documents"("category_id", "file_name");

-- CreateIndex
CREATE INDEX "service_desk_knowledge_chunks_category_idx" ON "service_desk_knowledge_chunks"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_desk_knowledge_chunks_document_index_key" ON "service_desk_knowledge_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "service_desk_category_assignees_user_idx" ON "service_desk_category_assignees"("user_id", "category_id");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "SystemPreference_userId_idx" ON "SystemPreference"("userId");

-- CreateIndex
CREATE INDEX "SystemPreference_key_idx" ON "SystemPreference"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SystemPreference_userId_key_key" ON "SystemPreference"("userId", "key");

-- CreateIndex
CREATE INDEX "ApplicantComment_applicantId_idx" ON "ApplicantComment"("applicantId");

-- CreateIndex
CREATE INDEX "ApplicantComment_authorId_idx" ON "ApplicantComment"("authorId");

-- CreateIndex
CREATE INDEX "Attachment_applicantId_idx" ON "Attachment"("applicantId");

-- CreateIndex
CREATE INDEX "Attachment_headcountId_idx" ON "Attachment"("headcountId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "Attachment_label_idx" ON "Attachment"("label");

-- CreateIndex
CREATE INDEX "Attachment_isPrimary_idx" ON "Attachment"("isPrimary");

-- CreateIndex
CREATE INDEX "Webhook_is_active_idx" ON "Webhook"("is_active");

-- CreateIndex
CREATE INDEX "Webhook_events_idx" ON "Webhook"("events");

-- CreateIndex
CREATE INDEX "Webhook_createdAt_idx" ON "Webhook"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookBodyConfig_webhook_id_idx" ON "WebhookBodyConfig"("webhook_id");

-- CreateIndex
CREATE INDEX "WebhookBodyConfig_event_type_idx" ON "WebhookBodyConfig"("event_type");

-- CreateIndex
CREATE INDEX "WebhookBodyConfig_is_active_idx" ON "WebhookBodyConfig"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookBodyConfig_webhook_id_event_type_key" ON "WebhookBodyConfig"("webhook_id", "event_type");

-- CreateIndex
CREATE INDEX "WebhookLog_webhook_id_idx" ON "WebhookLog"("webhook_id");

-- CreateIndex
CREATE INDEX "WebhookLog_event_type_idx" ON "WebhookLog"("event_type");

-- CreateIndex
CREATE INDEX "WebhookLog_success_idx" ON "WebhookLog"("success");

-- CreateIndex
CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "Dashboard_createdAt_idx" ON "Dashboard"("createdAt");

-- CreateIndex
CREATE INDEX "Dashboard_isPublic_idx" ON "Dashboard"("isPublic");

-- CreateIndex
CREATE INDEX "Dashboard_updatedAt_idx" ON "Dashboard"("updatedAt");

-- CreateIndex
CREATE INDEX "Dashboard_userId_idx" ON "Dashboard"("userId");

-- CreateIndex
CREATE INDEX "DashboardShare_dashboardId_idx" ON "DashboardShare"("dashboardId");

-- CreateIndex
CREATE INDEX "DashboardShare_permission_idx" ON "DashboardShare"("permission");

-- CreateIndex
CREATE INDEX "DashboardShare_userId_idx" ON "DashboardShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardShare_dashboardId_userId_key" ON "DashboardShare"("dashboardId", "userId");

-- CreateIndex
CREATE INDEX "DashboardWidget_createdAt_idx" ON "DashboardWidget"("createdAt");

-- CreateIndex
CREATE INDEX "DashboardWidget_dashboardId_idx" ON "DashboardWidget"("dashboardId");

-- CreateIndex
CREATE INDEX "DashboardWidget_type_idx" ON "DashboardWidget"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SystemPromptCategory_name_key" ON "SystemPromptCategory"("name");

-- CreateIndex
CREATE INDEX "SystemPromptCategory_name_idx" ON "SystemPromptCategory"("name");

-- CreateIndex
CREATE INDEX "SystemPromptCategory_is_active_idx" ON "SystemPromptCategory"("is_active");

-- CreateIndex
CREATE INDEX "SystemPromptCategory_created_at_idx" ON "SystemPromptCategory"("created_at");

-- CreateIndex
CREATE INDEX "SystemPrompt_name_idx" ON "SystemPrompt"("name");

-- CreateIndex
CREATE INDEX "SystemPrompt_categoryId_idx" ON "SystemPrompt"("categoryId");

-- CreateIndex
CREATE INDEX "SystemPrompt_is_active_idx" ON "SystemPrompt"("is_active");

-- CreateIndex
CREATE INDEX "SystemPrompt_created_at_idx" ON "SystemPrompt"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSource_name_key" ON "ApplicantSource"("name");

-- CreateIndex
CREATE INDEX "ApplicantSource_sort_order_idx" ON "ApplicantSource"("sort_order");

-- CreateIndex
CREATE INDEX "ApplicantSource_is_active_idx" ON "ApplicantSource"("is_active");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Headcount_positionId_idx" ON "Headcount"("positionId");

-- CreateIndex
CREATE INDEX "Headcount_applicantId_idx" ON "Headcount"("applicantId");

-- CreateIndex
CREATE INDEX "Headcount_type_idx" ON "Headcount"("type");

-- CreateIndex
CREATE INDEX "Headcount_status_idx" ON "Headcount"("status");

-- CreateIndex
CREATE INDEX "Headcount_requestDate_idx" ON "Headcount"("requestDate");

-- CreateIndex
CREATE INDEX "PositionInterviewer_positionId_idx" ON "PositionInterviewer"("positionId");

-- CreateIndex
CREATE INDEX "PositionInterviewer_userId_idx" ON "PositionInterviewer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionInterviewer_positionId_userId_key" ON "PositionInterviewer"("positionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseGroup_name_key" ON "ExpertiseGroup"("name");

-- CreateIndex
CREATE INDEX "ExpertiseGroup_name_idx" ON "ExpertiseGroup"("name");

-- CreateIndex
CREATE INDEX "ExpertiseGroup_is_active_idx" ON "ExpertiseGroup"("is_active");

-- CreateIndex
CREATE INDEX "ExpertiseGroup_sort_order_idx" ON "ExpertiseGroup"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseSkill_name_key" ON "ExpertiseSkill"("name");

-- CreateIndex
CREATE INDEX "ExpertiseSkill_name_idx" ON "ExpertiseSkill"("name");

-- CreateIndex
CREATE INDEX "ExpertiseSkill_skill_type_idx" ON "ExpertiseSkill"("skill_type");

-- CreateIndex
CREATE INDEX "ExpertiseSkill_is_active_idx" ON "ExpertiseSkill"("is_active");

-- CreateIndex
CREATE INDEX "ExpertiseSkill_sort_order_idx" ON "ExpertiseSkill"("sort_order");

-- CreateIndex
CREATE INDEX "ExpertiseSkill_groupId_idx" ON "ExpertiseSkill"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityGroup_name_key" ON "PersonalityGroup"("name");

-- CreateIndex
CREATE INDEX "PersonalityGroup_name_idx" ON "PersonalityGroup"("name");

-- CreateIndex
CREATE INDEX "PersonalityGroup_is_active_idx" ON "PersonalityGroup"("is_active");

-- CreateIndex
CREATE INDEX "PersonalityGroup_sort_order_idx" ON "PersonalityGroup"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityTrait_name_key" ON "PersonalityTrait"("name");

-- CreateIndex
CREATE INDEX "PersonalityTrait_name_idx" ON "PersonalityTrait"("name");

-- CreateIndex
CREATE INDEX "PersonalityTrait_is_active_idx" ON "PersonalityTrait"("is_active");

-- CreateIndex
CREATE INDEX "PersonalityTrait_sort_order_idx" ON "PersonalityTrait"("sort_order");

-- CreateIndex
CREATE INDEX "PersonalityTrait_groupId_idx" ON "PersonalityTrait"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTemplate_name_key" ON "SkillTemplate"("name");

-- CreateIndex
CREATE INDEX "SkillTemplate_name_idx" ON "SkillTemplate"("name");

-- CreateIndex
CREATE INDEX "SkillTemplate_is_active_idx" ON "SkillTemplate"("is_active");

-- CreateIndex
CREATE INDEX "SkillTemplateGroup_templateId_idx" ON "SkillTemplateGroup"("templateId");

-- CreateIndex
CREATE INDEX "SkillTemplateGroup_groupId_idx" ON "SkillTemplateGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTemplateGroup_templateId_groupId_key" ON "SkillTemplateGroup"("templateId", "groupId");

-- CreateIndex
CREATE INDEX "SkillTemplateSkill_templateId_idx" ON "SkillTemplateSkill"("templateId");

-- CreateIndex
CREATE INDEX "SkillTemplateSkill_skillId_idx" ON "SkillTemplateSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTemplateSkill_templateId_skillId_key" ON "SkillTemplateSkill"("templateId", "skillId");

-- CreateIndex
CREATE INDEX "SkillTemplatePersonalityGroup_templateId_idx" ON "SkillTemplatePersonalityGroup"("templateId");

-- CreateIndex
CREATE INDEX "SkillTemplatePersonalityGroup_groupId_idx" ON "SkillTemplatePersonalityGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTemplatePersonalityGroup_templateId_groupId_key" ON "SkillTemplatePersonalityGroup"("templateId", "groupId");

-- CreateIndex
CREATE INDEX "SkillTemplatePersonalityTrait_templateId_idx" ON "SkillTemplatePersonalityTrait"("templateId");

-- CreateIndex
CREATE INDEX "SkillTemplatePersonalityTrait_traitId_idx" ON "SkillTemplatePersonalityTrait"("traitId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTemplatePersonalityTrait_templateId_traitId_key" ON "SkillTemplatePersonalityTrait"("templateId", "traitId");

-- CreateIndex
CREATE INDEX "PositionExpertiseGroup_positionId_idx" ON "PositionExpertiseGroup"("positionId");

-- CreateIndex
CREATE INDEX "PositionExpertiseGroup_groupId_idx" ON "PositionExpertiseGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionExpertiseGroup_positionId_groupId_key" ON "PositionExpertiseGroup"("positionId", "groupId");

-- CreateIndex
CREATE INDEX "PositionExpertiseSkill_positionId_idx" ON "PositionExpertiseSkill"("positionId");

-- CreateIndex
CREATE INDEX "PositionExpertiseSkill_skillId_idx" ON "PositionExpertiseSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionExpertiseSkill_positionId_skillId_key" ON "PositionExpertiseSkill"("positionId", "skillId");

-- CreateIndex
CREATE INDEX "PositionPersonalityGroup_positionId_idx" ON "PositionPersonalityGroup"("positionId");

-- CreateIndex
CREATE INDEX "PositionPersonalityGroup_groupId_idx" ON "PositionPersonalityGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionPersonalityGroup_positionId_groupId_key" ON "PositionPersonalityGroup"("positionId", "groupId");

-- CreateIndex
CREATE INDEX "PositionPersonalityTrait_positionId_idx" ON "PositionPersonalityTrait"("positionId");

-- CreateIndex
CREATE INDEX "PositionPersonalityTrait_traitId_idx" ON "PositionPersonalityTrait"("traitId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionPersonalityTrait_positionId_traitId_key" ON "PositionPersonalityTrait"("positionId", "traitId");

-- CreateIndex
CREATE INDEX "ApplicantEvaluation_applicantId_idx" ON "ApplicantEvaluation"("applicantId");

-- CreateIndex
CREATE INDEX "ApplicantEvaluation_positionId_idx" ON "ApplicantEvaluation"("positionId");

-- CreateIndex
CREATE INDEX "ApplicantEvaluation_evaluatorId_idx" ON "ApplicantEvaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "ApplicantEvaluation_status_idx" ON "ApplicantEvaluation"("status");

-- CreateIndex
CREATE INDEX "ApplicantEvaluation_createdAt_idx" ON "ApplicantEvaluation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantEvaluationLink_token_key" ON "ApplicantEvaluationLink"("token");

-- CreateIndex
CREATE INDEX "ApplicantEvaluationLink_applicantId_idx" ON "ApplicantEvaluationLink"("applicantId");

-- CreateIndex
CREATE INDEX "ApplicantEvaluationLink_expiresAt_idx" ON "ApplicantEvaluationLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ApplicantExpertiseScore_evaluationId_idx" ON "ApplicantExpertiseScore"("evaluationId");

-- CreateIndex
CREATE INDEX "ApplicantExpertiseScore_skillId_idx" ON "ApplicantExpertiseScore"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantExpertiseScore_evaluationId_skillId_key" ON "ApplicantExpertiseScore"("evaluationId", "skillId");

-- CreateIndex
CREATE INDEX "ApplicantPersonalityScore_evaluationId_idx" ON "ApplicantPersonalityScore"("evaluationId");

-- CreateIndex
CREATE INDEX "ApplicantPersonalityScore_traitId_idx" ON "ApplicantPersonalityScore"("traitId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantPersonalityScore_evaluationId_traitId_key" ON "ApplicantPersonalityScore"("evaluationId", "traitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_session_token_key" ON "UserSession"("session_token");

-- CreateIndex
CREATE INDEX "UserSession_user_id_idx" ON "UserSession"("user_id");

-- CreateIndex
CREATE INDEX "UserSession_session_token_idx" ON "UserSession"("session_token");

-- CreateIndex
CREATE INDEX "UserSession_is_active_idx" ON "UserSession"("is_active");

-- CreateIndex
CREATE INDEX "UserSession_expires_at_idx" ON "UserSession"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "SystemApiKey_key_hash_key" ON "SystemApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "SystemApiKey_key_hash_idx" ON "SystemApiKey"("key_hash");

-- CreateIndex
CREATE INDEX "SystemApiKey_is_active_idx" ON "SystemApiKey"("is_active");

-- CreateIndex
CREATE INDEX "SystemApiKey_expires_at_idx" ON "SystemApiKey"("expires_at");

-- CreateIndex
CREATE INDEX "SystemApiKey_created_by_id_idx" ON "SystemApiKey"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_departments_code_key" ON "hr_departments"("code");

-- CreateIndex
CREATE INDEX "hr_departments_is_active_idx" ON "hr_departments"("is_active");

-- CreateIndex
CREATE INDEX "hr_departments_division_idx" ON "hr_departments"("division");

-- CreateIndex
CREATE INDEX "hr_departments_department_idx" ON "hr_departments"("department");

-- CreateIndex
CREATE INDEX "hr_departments_section_idx" ON "hr_departments"("section");

-- CreateIndex
CREATE INDEX "hr_departments_parent_id_idx" ON "hr_departments"("parent_id");

-- CreateIndex
CREATE INDEX "hr_departments_unit_type_idx" ON "hr_departments"("unit_type");

-- CreateIndex
CREATE INDEX "hr_departments_parent_id_sort_order_idx" ON "hr_departments"("parent_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_user_id_key" ON "hr_employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_applicant_id_key" ON "hr_employees"("applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_person_profile_id_key" ON "hr_employees"("person_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_employee_number_key" ON "hr_employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employees_email_key" ON "hr_employees"("email");

-- CreateIndex
CREATE INDEX "hr_employees_department_id_idx" ON "hr_employees"("department_id");

-- CreateIndex
CREATE INDEX "hr_employees_manager_id_idx" ON "hr_employees"("manager_id");

-- CreateIndex
CREATE INDEX "hr_employees_position_id_idx" ON "hr_employees"("position_id");

-- CreateIndex
CREATE INDEX "hr_employees_status_idx" ON "hr_employees"("status");

-- CreateIndex
CREATE INDEX "hr_employees_hire_date_idx" ON "hr_employees"("hire_date");

-- CreateIndex
CREATE INDEX "hr_employees_company_id_idx" ON "hr_employees"("company_id");

-- CreateIndex
CREATE INDEX "hr_employees_client_id_idx" ON "hr_employees"("client_id");

-- CreateIndex
CREATE INDEX "screening_consents_applicant_id_consented_at_idx" ON "screening_consents"("applicant_id", "consented_at");

-- CreateIndex
CREATE INDEX "screening_consents_employee_id_consented_at_idx" ON "screening_consents"("employee_id", "consented_at");

-- CreateIndex
CREATE UNIQUE INDEX "screening_cases_idempotency_key_key" ON "screening_cases"("idempotency_key");

-- CreateIndex
CREATE INDEX "screening_cases_status_created_at_idx" ON "screening_cases"("status", "created_at");

-- CreateIndex
CREATE INDEX "screening_cases_applicant_id_created_at_idx" ON "screening_cases"("applicant_id", "created_at");

-- CreateIndex
CREATE INDEX "screening_cases_employee_id_created_at_idx" ON "screening_cases"("employee_id", "created_at");

-- CreateIndex
CREATE INDEX "screening_findings_review_status_created_at_idx" ON "screening_findings"("review_status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "screening_findings_case_id_source_url_key" ON "screening_findings"("case_id", "source_url");

-- CreateIndex
CREATE UNIQUE INDEX "hr_clients_client_code_key" ON "hr_clients"("client_code");

-- CreateIndex
CREATE INDEX "hr_clients_name_idx" ON "hr_clients"("name");

-- CreateIndex
CREATE INDEX "hr_clients_status_idx" ON "hr_clients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_profile_change_requests_request_id_key" ON "hr_employee_profile_change_requests"("request_id");

-- CreateIndex
CREATE INDEX "hr_employee_profile_change_requests_employee_id_idx" ON "hr_employee_profile_change_requests"("employee_id");

-- CreateIndex
CREATE INDEX "hr_employee_profile_change_requests_status_idx" ON "hr_employee_profile_change_requests"("status");

-- CreateIndex
CREATE INDEX "hr_employee_documents_employee_id_idx" ON "hr_employee_documents"("employee_id");

-- CreateIndex
CREATE INDEX "hr_employee_documents_type_idx" ON "hr_employee_documents"("type");

-- CreateIndex
CREATE INDEX "hr_employee_documents_status_idx" ON "hr_employee_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_onboarding_templates_name_key" ON "hr_onboarding_templates"("name");

-- CreateIndex
CREATE INDEX "hr_onboarding_templates_is_active_idx" ON "hr_onboarding_templates"("is_active");

-- CreateIndex
CREATE INDEX "hr_onboarding_tasks_template_id_idx" ON "hr_onboarding_tasks"("template_id");

-- CreateIndex
CREATE INDEX "hr_onboarding_tasks_sort_order_idx" ON "hr_onboarding_tasks"("sort_order");

-- CreateIndex
CREATE INDEX "hr_employee_onboarding_employee_id_idx" ON "hr_employee_onboarding"("employee_id");

-- CreateIndex
CREATE INDEX "hr_employee_onboarding_status_idx" ON "hr_employee_onboarding"("status");

-- CreateIndex
CREATE INDEX "hr_employee_onboarding_task_progress_employee_id_idx" ON "hr_employee_onboarding_task_progress"("employee_id");

-- CreateIndex
CREATE INDEX "hr_employee_onboarding_task_progress_status_idx" ON "hr_employee_onboarding_task_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_onboarding_task_progress_onboarding_id_task_id_key" ON "hr_employee_onboarding_task_progress"("onboarding_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_work_schedules_name_key" ON "hr_work_schedules"("name");

-- CreateIndex
CREATE INDEX "hr_work_schedules_is_active_idx" ON "hr_work_schedules"("is_active");

-- CreateIndex
CREATE INDEX "hr_shift_assignments_employee_id_idx" ON "hr_shift_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "hr_shift_assignments_employee_id_shift_date_idx" ON "hr_shift_assignments"("employee_id", "shift_date");

-- CreateIndex
CREATE INDEX "hr_shift_assignments_roster_period_id_idx" ON "hr_shift_assignments"("roster_period_id");

-- CreateIndex
CREATE INDEX "hr_shift_assignments_shift_date_idx" ON "hr_shift_assignments"("shift_date");

-- CreateIndex
CREATE INDEX "hr_shift_assignments_status_idx" ON "hr_shift_assignments"("status");

-- CreateIndex
CREATE INDEX "hr_attendance_records_work_date_idx" ON "hr_attendance_records"("work_date");

-- CreateIndex
CREATE INDEX "hr_attendance_records_status_idx" ON "hr_attendance_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_attendance_records_employee_id_work_date_key" ON "hr_attendance_records"("employee_id", "work_date");

-- CreateIndex
CREATE UNIQUE INDEX "hr_shift_definitions_code_key" ON "hr_shift_definitions"("code");

-- CreateIndex
CREATE INDEX "hr_shift_definitions_is_active_idx" ON "hr_shift_definitions"("is_active");

-- CreateIndex
CREATE INDEX "hr_shift_definition_versions_effective_from_effective_to_idx" ON "hr_shift_definition_versions"("effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "hr_shift_definition_versions_shift_definition_id_version_key" ON "hr_shift_definition_versions"("shift_definition_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "hr_work_schedule_days_schedule_id_cycle_day_key" ON "hr_work_schedule_days"("schedule_id", "cycle_day");

-- CreateIndex
CREATE INDEX "hr_roster_periods_start_date_end_date_idx" ON "hr_roster_periods"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "hr_roster_periods_company_id_idx" ON "hr_roster_periods"("company_id");

-- CreateIndex
CREATE INDEX "hr_shift_assignment_history_assignment_id_created_at_idx" ON "hr_shift_assignment_history"("assignment_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_open_shifts_shift_date_status_idx" ON "hr_open_shifts"("shift_date", "status");

-- CreateIndex
CREATE INDEX "hr_employee_availability_employee_id_available_from_idx" ON "hr_employee_availability"("employee_id", "available_from");

-- CreateIndex
CREATE INDEX "hr_attendance_events_employee_id_logical_shift_date_occurre_idx" ON "hr_attendance_events"("employee_id", "logical_shift_date", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_attendance_events_employee_id_idempotency_key_key" ON "hr_attendance_events"("employee_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "hr_attendance_calculations_attendance_record_id_calculated__idx" ON "hr_attendance_calculations"("attendance_record_id", "calculated_at");

-- CreateIndex
CREATE INDEX "hr_attendance_exceptions_attendance_record_id_status_idx" ON "hr_attendance_exceptions"("attendance_record_id", "status");

-- CreateIndex
CREATE INDEX "hr_attendance_periods_start_date_end_date_idx" ON "hr_attendance_periods"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "hr_attendance_periods_company_id_idx" ON "hr_attendance_periods"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_shift_requests_request_id_key" ON "hr_shift_requests"("request_id");

-- CreateIndex
CREATE INDEX "hr_shift_requests_employee_id_status_idx" ON "hr_shift_requests"("employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_overtime_requests_request_id_key" ON "hr_overtime_requests"("request_id");

-- CreateIndex
CREATE INDEX "hr_overtime_requests_employee_id_work_date_idx" ON "hr_overtime_requests"("employee_id", "work_date");

-- CreateIndex
CREATE INDEX "hr_overtime_requests_status_idx" ON "hr_overtime_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_timesheets_timesheet_number_key" ON "hr_timesheets"("timesheet_number");

-- CreateIndex
CREATE INDEX "hr_timesheets_status_idx" ON "hr_timesheets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_timesheets_employee_id_period_start_period_end_key" ON "hr_timesheets"("employee_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "hr_timesheet_entries_timesheet_id_work_date_idx" ON "hr_timesheet_entries"("timesheet_id", "work_date");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_attendance_exports_export_number_key" ON "hr_payroll_attendance_exports"("export_number");

-- CreateIndex
CREATE INDEX "hr_payroll_attendance_exports_attendance_period_id_idx" ON "hr_payroll_attendance_exports"("attendance_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_policies_name_key" ON "hr_leave_policies"("name");

-- CreateIndex
CREATE INDEX "hr_leave_policies_leave_type_idx" ON "hr_leave_policies"("leave_type");

-- CreateIndex
CREATE INDEX "hr_leave_policies_is_active_idx" ON "hr_leave_policies"("is_active");

-- CreateIndex
CREATE INDEX "hr_leave_balances_year_idx" ON "hr_leave_balances"("year");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_balances_employee_id_policy_id_year_key" ON "hr_leave_balances"("employee_id", "policy_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_request_request_id_key" ON "hr_leave_requests"("request_id");

-- CreateIndex
CREATE INDEX "hr_leave_requests_employee_id_idx" ON "hr_leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "hr_leave_requests_status_idx" ON "hr_leave_requests"("status");

-- CreateIndex
CREATE INDEX "hr_leave_requests_start_date_idx" ON "hr_leave_requests"("start_date");

-- CreateIndex
CREATE INDEX "hr_leave_request_employee_dates_idx" ON "hr_leave_requests"("employee_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "hr_leave_requests_request_group_id_segment_index_idx" ON "hr_leave_requests"("request_group_id", "segment_index");

-- CreateIndex
CREATE INDEX "hr_holidays_holiday_date_idx" ON "hr_holidays"("holiday_date");

-- CreateIndex
CREATE INDEX "hr_leave_blocks_start_date_end_date_idx" ON "hr_leave_blocks"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "hr_leave_blocks_is_active_idx" ON "hr_leave_blocks"("is_active");

-- CreateIndex
CREATE INDEX "hr_leave_blocks_scope_idx" ON "hr_leave_blocks"("scope");

-- CreateIndex
CREATE INDEX "hr_leave_policy_versions_effective_from_effective_to_idx" ON "hr_leave_policy_versions"("effective_from", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_policy_versions_policy_id_version_key" ON "hr_leave_policy_versions"("policy_id", "version");

-- CreateIndex
CREATE INDEX "hr_leave_policy_assignments_policy_id_idx" ON "hr_leave_policy_assignments"("policy_id");

-- CreateIndex
CREATE INDEX "hr_leave_policy_assignments_employee_id_idx" ON "hr_leave_policy_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "hr_leave_policy_assignments_assignment_type_assignment_valu_idx" ON "hr_leave_policy_assignments"("assignment_type", "assignment_value");

-- CreateIndex
CREATE INDEX "hr_leave_policy_assignments_effective_from_effective_to_idx" ON "hr_leave_policy_assignments"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "hr_leave_policy_assignments_status_idx" ON "hr_leave_policy_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_balance_ledger_idempotency_key_key" ON "hr_leave_balance_ledger"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_leave_balance_ledger_employee_id_policy_id_effective_dat_idx" ON "hr_leave_balance_ledger"("employee_id", "policy_id", "effective_date");

-- CreateIndex
CREATE INDEX "hr_leave_balance_ledger_balance_id_idx" ON "hr_leave_balance_ledger"("balance_id");

-- CreateIndex
CREATE INDEX "hr_leave_balance_ledger_source_type_source_id_idx" ON "hr_leave_balance_ledger"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "hr_leave_approvals_entity_type_entity_id_idx" ON "hr_leave_approvals"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "hr_leave_approvals_approver_id_status_idx" ON "hr_leave_approvals"("approver_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_encashments_request_id_key" ON "hr_leave_encashments"("request_id");

-- CreateIndex
CREATE INDEX "hr_leave_encashments_employee_id_status_idx" ON "hr_leave_encashments"("employee_id", "status");

-- CreateIndex
CREATE INDEX "hr_leave_encashments_policy_id_idx" ON "hr_leave_encashments"("policy_id");

-- CreateIndex
CREATE INDEX "hr_leave_encashments_payroll_status_idx" ON "hr_leave_encashments"("payroll_status");

-- CreateIndex
CREATE INDEX "hr_leave_reservations_employee_id_policy_id_status_idx" ON "hr_leave_reservations"("employee_id", "policy_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_reservations_source_type_source_id_key" ON "hr_leave_reservations"("source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_allocation_runs_run_id_key" ON "hr_leave_allocation_runs"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_allocation_runs_idempotency_key_key" ON "hr_leave_allocation_runs"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_leave_allocation_runs_period_year_run_type_idx" ON "hr_leave_allocation_runs"("period_year", "run_type");

-- CreateIndex
CREATE INDEX "hr_leave_allocation_runs_status_idx" ON "hr_leave_allocation_runs"("status");

-- CreateIndex
CREATE INDEX "hr_leave_periods_start_date_end_date_idx" ON "hr_leave_periods"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "hr_leave_periods_status_idx" ON "hr_leave_periods"("status");

-- CreateIndex
CREATE INDEX "hr_leave_exceptions_exception_type_status_idx" ON "hr_leave_exceptions"("exception_type", "status");

-- CreateIndex
CREATE INDEX "hr_leave_exceptions_employee_id_idx" ON "hr_leave_exceptions"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_payroll_exports_export_id_key" ON "hr_leave_payroll_exports"("export_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_leave_payroll_exports_idempotency_key_key" ON "hr_leave_payroll_exports"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_leave_payroll_exports_period_id_status_idx" ON "hr_leave_payroll_exports"("period_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_performance_cycles_name_key" ON "hr_performance_cycles"("name");

-- CreateIndex
CREATE INDEX "hr_performance_cycles_status_idx" ON "hr_performance_cycles"("status");

-- CreateIndex
CREATE INDEX "hr_performance_cycles_company_id_status_idx" ON "hr_performance_cycles"("company_id", "status");

-- CreateIndex
CREATE INDEX "hr_performance_cycles_start_date_end_date_idx" ON "hr_performance_cycles"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "hr_performance_reviews_idempotency_key_key" ON "hr_performance_reviews"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_performance_reviews_employee_id_idx" ON "hr_performance_reviews"("employee_id");

-- CreateIndex
CREATE INDEX "hr_performance_reviews_status_idx" ON "hr_performance_reviews"("status");

-- CreateIndex
CREATE INDEX "hr_performance_reviews_reviewer_id_status_idx" ON "hr_performance_reviews"("reviewer_id", "status");

-- CreateIndex
CREATE INDEX "hr_performance_reviews_released_at_acknowledgment_status_idx" ON "hr_performance_reviews"("released_at", "acknowledgment_status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_performance_reviews_cycle_id_employee_id_key" ON "hr_performance_reviews"("cycle_id", "employee_id");

-- CreateIndex
CREATE INDEX "hr_appraisal_templates_company_id_status_idx" ON "hr_appraisal_templates"("company_id", "status");

-- CreateIndex
CREATE INDEX "hr_appraisal_template_versions_status_created_at_idx" ON "hr_appraisal_template_versions"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_appraisal_template_versions_template_id_version_key" ON "hr_appraisal_template_versions"("template_id", "version");

-- CreateIndex
CREATE INDEX "hr_appraisal_rating_models_company_id_status_idx" ON "hr_appraisal_rating_models"("company_id", "status");

-- CreateIndex
CREATE INDEX "hr_appraisal_rating_levels_rating_model_id_display_order_idx" ON "hr_appraisal_rating_levels"("rating_model_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "hr_appraisal_rating_levels_rating_model_id_code_key" ON "hr_appraisal_rating_levels"("rating_model_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "hr_appraisal_reviewers_idempotency_key_key" ON "hr_appraisal_reviewers"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_appraisal_reviewers_reviewer_id_status_due_date_idx" ON "hr_appraisal_reviewers"("reviewer_id", "status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "hr_appraisal_reviewers_review_id_reviewer_id_reviewer_role_key" ON "hr_appraisal_reviewers"("review_id", "reviewer_id", "reviewer_role");

-- CreateIndex
CREATE INDEX "hr_appraisal_goal_evaluations_review_id_reviewer_role_idx" ON "hr_appraisal_goal_evaluations"("review_id", "reviewer_role");

-- CreateIndex
CREATE UNIQUE INDEX "hr_appraisal_goal_evaluations_review_id_goal_id_reviewer_ro_key" ON "hr_appraisal_goal_evaluations"("review_id", "goal_id", "reviewer_role", "reviewer_id");

-- CreateIndex
CREATE INDEX "hr_appraisal_competency_evaluations_review_id_reviewer_role_idx" ON "hr_appraisal_competency_evaluations"("review_id", "reviewer_role");

-- CreateIndex
CREATE UNIQUE INDEX "hr_appraisal_competency_evaluations_review_id_competency_ke_key" ON "hr_appraisal_competency_evaluations"("review_id", "competency_key", "reviewer_role", "reviewer_id");

-- CreateIndex
CREATE INDEX "hr_appraisal_rating_adjustments_review_id_created_at_idx" ON "hr_appraisal_rating_adjustments"("review_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_appraisal_calibration_sessions_cycle_id_status_idx" ON "hr_appraisal_calibration_sessions"("cycle_id", "status");

-- CreateIndex
CREATE INDEX "hr_appraisal_calibration_decisions_review_id_created_at_idx" ON "hr_appraisal_calibration_decisions"("review_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_appraisal_approvals_approver_id_status_idx" ON "hr_appraisal_approvals"("approver_id", "status");

-- CreateIndex
CREATE INDEX "hr_appraisal_approvals_review_id_sequence_idx" ON "hr_appraisal_approvals"("review_id", "sequence");

-- CreateIndex
CREATE INDEX "hr_appraisal_appeals_review_id_status_idx" ON "hr_appraisal_appeals"("review_id", "status");

-- CreateIndex
CREATE INDEX "hr_appraisal_events_review_id_created_at_idx" ON "hr_appraisal_events"("review_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_appraisal_events_cycle_id_created_at_idx" ON "hr_appraisal_events"("cycle_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_performance_goals_employee_id_idx" ON "hr_performance_goals"("employee_id");

-- CreateIndex
CREATE INDEX "hr_performance_goals_status_idx" ON "hr_performance_goals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_performance_check_ins_idempotency_key_key" ON "hr_performance_check_ins"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_performance_check_ins_employee_id_meeting_date_idx" ON "hr_performance_check_ins"("employee_id", "meeting_date");

-- CreateIndex
CREATE INDEX "hr_performance_check_ins_manager_id_status_idx" ON "hr_performance_check_ins"("manager_id", "status");

-- CreateIndex
CREATE INDEX "hr_performance_check_ins_status_due_date_idx" ON "hr_performance_check_ins"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "hr_performance_feedback_idempotency_key_key" ON "hr_performance_feedback"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_performance_feedback_recipient_id_created_at_idx" ON "hr_performance_feedback"("recipient_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_performance_feedback_provider_id_created_at_idx" ON "hr_performance_feedback"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_performance_feedback_status_created_at_idx" ON "hr_performance_feedback"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_recognition_idempotency_key_key" ON "hr_employee_recognition"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_employee_recognition_recipient_id_created_at_idx" ON "hr_employee_recognition"("recipient_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_employee_recognition_provider_id_created_at_idx" ON "hr_employee_recognition"("provider_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_competency_evidence_idempotency_key_key" ON "hr_competency_evidence"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_competency_evidence_employee_id_competency_name_idx" ON "hr_competency_evidence"("employee_id", "competency_name");

-- CreateIndex
CREATE INDEX "hr_competency_evidence_status_created_at_idx" ON "hr_competency_evidence"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_development_plans_idempotency_key_key" ON "hr_development_plans"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_development_plans_employee_id_status_idx" ON "hr_development_plans"("employee_id", "status");

-- CreateIndex
CREATE INDEX "hr_development_plans_owner_manager_id_status_idx" ON "hr_development_plans"("owner_manager_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_development_actions_idempotency_key_key" ON "hr_development_actions"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_development_actions_plan_id_status_idx" ON "hr_development_actions"("plan_id", "status");

-- CreateIndex
CREATE INDEX "hr_development_actions_status_due_date_idx" ON "hr_development_actions"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "hr_performance_activities_idempotency_key_key" ON "hr_performance_activities"("idempotency_key");

-- CreateIndex
CREATE INDEX "hr_performance_activities_employee_id_occurred_at_idx" ON "hr_performance_activities"("employee_id", "occurred_at");

-- CreateIndex
CREATE INDEX "hr_performance_activities_activity_type_occurred_at_idx" ON "hr_performance_activities"("activity_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_ess_requests_request_id_key" ON "hr_ess_requests"("request_id");

-- CreateIndex
CREATE INDEX "hr_ess_requests_requester_employee_id_created_at_idx" ON "hr_ess_requests"("requester_employee_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_ess_requests_current_approver_user_id_status_idx" ON "hr_ess_requests"("current_approver_user_id", "status");

-- CreateIndex
CREATE INDEX "hr_ess_requests_subject_employee_id_request_type_idx" ON "hr_ess_requests"("subject_employee_id", "request_type");

-- CreateIndex
CREATE INDEX "hr_ess_requests_company_id_idx" ON "hr_ess_requests"("company_id");

-- CreateIndex
CREATE INDEX "hr_ess_requests_approver_idx" ON "hr_ess_requests"("current_approver_user_id", "status");

-- CreateIndex
CREATE INDEX "hr_ess_requests_company_idx" ON "hr_ess_requests"("company_id");

-- CreateIndex
CREATE INDEX "hr_ess_requests_requester_idx" ON "hr_ess_requests"("requester_employee_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "hr_ess_requests_subject_idx" ON "hr_ess_requests"("subject_employee_id", "request_type");

-- CreateIndex
CREATE INDEX "hr_ess_approval_steps_request_id_step_number_idx" ON "hr_ess_approval_steps"("request_id", "step_number");

-- CreateIndex
CREATE INDEX "hr_ess_approval_steps_approver_user_id_status_idx" ON "hr_ess_approval_steps"("approver_user_id", "status");

-- CreateIndex
CREATE INDEX "hr_ess_approval_steps_approver_idx" ON "hr_ess_approval_steps"("approver_user_id", "status");

-- CreateIndex
CREATE INDEX "hr_ess_approval_steps_request_idx" ON "hr_ess_approval_steps"("request_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "hr_ess_approval_steps_request_id_step_number_approver_user__key" ON "hr_ess_approval_steps"("request_id", "step_number", "approver_user_id");

-- CreateIndex
CREATE INDEX "hr_ess_request_activities_request_id_created_at_idx" ON "hr_ess_request_activities"("request_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_ess_request_activities_request_idx" ON "hr_ess_request_activities"("request_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_learning_courses_category_idx" ON "hr_learning_courses"("category");

-- CreateIndex
CREATE INDEX "hr_learning_courses_is_active_idx" ON "hr_learning_courses"("is_active");

-- CreateIndex
CREATE INDEX "hr_learning_paths_status_idx" ON "hr_learning_paths"("status");

-- CreateIndex
CREATE INDEX "hr_learning_enrollments_status_idx" ON "hr_learning_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_learning_enrollments_employee_id_course_id_key" ON "hr_learning_enrollments"("employee_id", "course_id");

-- CreateIndex
CREATE INDEX "hr_learning_course_versions_course_id_status_idx" ON "hr_learning_course_versions"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_learning_course_versions_course_id_version_key" ON "hr_learning_course_versions"("course_id", "version");

-- CreateIndex
CREATE INDEX "hr_learning_course_sections_version_id_position_idx" ON "hr_learning_course_sections"("version_id", "position");

-- CreateIndex
CREATE INDEX "hr_learning_lessons_section_id_position_idx" ON "hr_learning_lessons"("section_id", "position");

-- CreateIndex
CREATE INDEX "hr_learning_content_blocks_lesson_id_position_idx" ON "hr_learning_content_blocks"("lesson_id", "position");

-- CreateIndex
CREATE INDEX "hr_learning_lesson_progress_enrollment_id_status_idx" ON "hr_learning_lesson_progress"("enrollment_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_learning_lesson_progress_enrollment_id_lesson_id_key" ON "hr_learning_lesson_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE INDEX "hr_learning_quiz_attempts_enrollment_id_block_id_idx" ON "hr_learning_quiz_attempts"("enrollment_id", "block_id");

-- CreateIndex
CREATE INDEX "hr_learning_assignment_submissions_status_idx" ON "hr_learning_assignment_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_learning_assignment_submissions_enrollment_id_block_id_key" ON "hr_learning_assignment_submissions"("enrollment_id", "block_id");

-- CreateIndex
CREATE INDEX "hr_learning_activity_events_enrollment_id_created_at_idx" ON "hr_learning_activity_events"("enrollment_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_certifications_employee_id_idx" ON "hr_certifications"("employee_id");

-- CreateIndex
CREATE INDEX "hr_certifications_record_type_idx" ON "hr_certifications"("record_type");

-- CreateIndex
CREATE INDEX "hr_certifications_status_idx" ON "hr_certifications"("status");

-- CreateIndex
CREATE INDEX "hr_certifications_verification_status_idx" ON "hr_certifications"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_periods_name_key" ON "hr_payroll_periods"("name");

-- CreateIndex
CREATE INDEX "hr_payroll_periods_status_idx" ON "hr_payroll_periods"("status");

-- CreateIndex
CREATE INDEX "hr_payroll_periods_pay_date_idx" ON "hr_payroll_periods"("pay_date");

-- CreateIndex
CREATE INDEX "hr_payroll_runs_period_id_idx" ON "hr_payroll_runs"("period_id");

-- CreateIndex
CREATE INDEX "hr_payroll_runs_status_idx" ON "hr_payroll_runs"("status");

-- CreateIndex
CREATE INDEX "hr_payroll_runs_company_group_status_idx" ON "hr_payroll_runs"("company_id", "payroll_group_id", "status");

-- CreateIndex
CREATE INDEX "hr_payroll_run_items_employee_id_idx" ON "hr_payroll_run_items"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_run_items_payroll_run_id_employee_id_key" ON "hr_payroll_run_items"("payroll_run_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payslips_payroll_run_item_id_key" ON "hr_payslips"("payroll_run_item_id");

-- CreateIndex
CREATE INDEX "hr_payslips_employee_id_idx" ON "hr_payslips"("employee_id");

-- CreateIndex
CREATE INDEX "hr_payslips_status_idx" ON "hr_payslips"("status");

-- CreateIndex
CREATE INDEX "hr_compensation_packages_employee_id_idx" ON "hr_compensation_packages"("employee_id");

-- CreateIndex
CREATE INDEX "hr_compensation_packages_effective_from_idx" ON "hr_compensation_packages"("effective_from");

-- CreateIndex
CREATE INDEX "hr_compensation_company_dates_idx" ON "hr_compensation_packages"("company_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "hr_benefit_plans_name_key" ON "hr_benefit_plans"("name");

-- CreateIndex
CREATE INDEX "hr_benefit_plans_type_idx" ON "hr_benefit_plans"("type");

-- CreateIndex
CREATE INDEX "hr_benefit_plans_is_active_idx" ON "hr_benefit_plans"("is_active");

-- CreateIndex
CREATE INDEX "hr_employee_benefit_enrollments_status_idx" ON "hr_employee_benefit_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_benefit_enrollments_employee_id_benefit_plan_id_key" ON "hr_employee_benefit_enrollments"("employee_id", "benefit_plan_id");

-- CreateIndex
CREATE INDEX "hr_payroll_adjustments_employee_id_idx" ON "hr_payroll_adjustments"("employee_id");

-- CreateIndex
CREATE INDEX "hr_payroll_adjustments_period_id_idx" ON "hr_payroll_adjustments"("period_id");

-- CreateIndex
CREATE INDEX "hr_payroll_adjustments_status_idx" ON "hr_payroll_adjustments"("status");

-- CreateIndex
CREATE INDEX "surveys_owner_user_id_status_idx" ON "surveys"("owner_user_id", "status");

-- CreateIndex
CREATE INDEX "surveys_company_id_status_idx" ON "surveys"("company_id", "status");

-- CreateIndex
CREATE INDEX "surveys_opens_at_closes_at_idx" ON "surveys"("opens_at", "closes_at");

-- CreateIndex
CREATE INDEX "survey_versions_survey_id_created_at_idx" ON "survey_versions"("survey_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "survey_versions_survey_id_version_key" ON "survey_versions"("survey_id", "version");

-- CreateIndex
CREATE INDEX "survey_sections_survey_id_sort_order_idx" ON "survey_sections"("survey_id", "sort_order");

-- CreateIndex
CREATE INDEX "survey_questions_survey_id_section_id_sort_order_idx" ON "survey_questions"("survey_id", "section_id", "sort_order");

-- CreateIndex
CREATE INDEX "survey_questions_dimension_idx" ON "survey_questions"("dimension");

-- CreateIndex
CREATE INDEX "survey_templates_category_is_archived_idx" ON "survey_templates"("category", "is_archived");

-- CreateIndex
CREATE INDEX "survey_templates_company_id_idx" ON "survey_templates"("company_id");

-- CreateIndex
CREATE INDEX "survey_audience_rules_survey_id_sort_order_idx" ON "survey_audience_rules"("survey_id", "sort_order");

-- CreateIndex
CREATE INDEX "survey_audience_snapshots_survey_id_included_idx" ON "survey_audience_snapshots"("survey_id", "included");

-- CreateIndex
CREATE UNIQUE INDEX "survey_audience_snapshots_survey_id_employee_id_key" ON "survey_audience_snapshots"("survey_id", "employee_id");

-- CreateIndex
CREATE INDEX "survey_distributions_survey_id_status_idx" ON "survey_distributions"("survey_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "survey_invitations_token_hash_key" ON "survey_invitations"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "survey_invitations_response_binding_hash_key" ON "survey_invitations"("response_binding_hash");

-- CreateIndex
CREATE INDEX "survey_invitations_survey_id_status_idx" ON "survey_invitations"("survey_id", "status");

-- CreateIndex
CREATE INDEX "survey_invitations_user_id_idx" ON "survey_invitations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_invitations_survey_id_employee_id_key" ON "survey_invitations"("survey_id", "employee_id");

-- CreateIndex
CREATE INDEX "survey_participation_survey_id_status_idx" ON "survey_participation"("survey_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "survey_participation_survey_id_employee_id_key" ON "survey_participation"("survey_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_response_binding_hash_key" ON "survey_responses"("response_binding_hash");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_access_token_hash_key" ON "survey_responses"("access_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_reference_code_key" ON "survey_responses"("reference_code");

-- CreateIndex
CREATE INDEX "survey_responses_survey_id_status_idx" ON "survey_responses"("survey_id", "status");

-- CreateIndex
CREATE INDEX "survey_responses_respondent_employee_id_idx" ON "survey_responses"("respondent_employee_id");

-- CreateIndex
CREATE INDEX "survey_response_answers_question_id_idx" ON "survey_response_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_response_answers_response_id_question_id_key" ON "survey_response_answers"("response_id", "question_id");

-- CreateIndex
CREATE INDEX "survey_reminders_survey_id_status_scheduled_at_idx" ON "survey_reminders"("survey_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "survey_result_releases_survey_id_status_idx" ON "survey_result_releases"("survey_id", "status");

-- CreateIndex
CREATE INDEX "survey_action_plans_survey_id_status_idx" ON "survey_action_plans"("survey_id", "status");

-- CreateIndex
CREATE INDEX "survey_action_plans_owner_user_id_due_at_idx" ON "survey_action_plans"("owner_user_id", "due_at");

-- CreateIndex
CREATE INDEX "survey_audit_logs_survey_id_created_at_idx" ON "survey_audit_logs"("survey_id", "created_at");

-- CreateIndex
CREATE INDEX "survey_audit_logs_actor_user_id_created_at_idx" ON "survey_audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "hr_cost_centers_company_id_is_active_name_idx" ON "hr_cost_centers"("company_id", "is_active", "name");

-- CreateIndex
CREATE INDEX "hr_projects_company_id_status_name_idx" ON "hr_projects"("company_id", "status", "name");

-- CreateIndex
CREATE INDEX "hr_projects_cost_center_id_idx" ON "hr_projects"("cost_center_id");

-- CreateIndex
CREATE UNIQUE INDEX "advance_transactions_idempotency_key_key" ON "advance_transactions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "employee_advances_reference_key" ON "employee_advances"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "employee_advances_idempotency_key_key" ON "employee_advances"("idempotency_key");

-- CreateIndex
CREATE INDEX "employee_advances_company_status_idx" ON "employee_advances"("company_id", "status");

-- CreateIndex
CREATE INDEX "employee_advances_employee_status_idx" ON "employee_advances"("employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "expense_accounting_entries_reference_key" ON "expense_accounting_entries"("reference");

-- CreateIndex
CREATE INDEX "expense_accounting_entries_queue_idx" ON "expense_accounting_entries"("company_id", "status", "posting_date");

-- CreateIndex
CREATE UNIQUE INDEX "expense_accounting_entries_source_type_source_id_journal_ty_key" ON "expense_accounting_entries"("source_type", "source_id", "journal_type");

-- CreateIndex
CREATE UNIQUE INDEX "expense_accounting_entry_lines_entry_id_line_number_key" ON "expense_accounting_entry_lines"("entry_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "expense_activities_idempotency_key_key" ON "expense_activities"("idempotency_key");

-- CreateIndex
CREATE INDEX "expense_activities_entity_idx" ON "expense_activities"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "expense_advance_types_code_key" ON "expense_advance_types"("code");

-- CreateIndex
CREATE INDEX "expense_approvals_queue_idx" ON "expense_approvals"("approver_user_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "expense_approvals_entity_type_entity_id_sequence_approval_r_key" ON "expense_approvals"("entity_type", "entity_id", "sequence", "approval_role");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_code_key" ON "expense_categories"("code");

-- CreateIndex
CREATE INDEX "expense_claim_items_claim_idx" ON "expense_claim_items"("claim_id");

-- CreateIndex
CREATE INDEX "expense_claim_items_duplicate_idx" ON "expense_claim_items"("expense_date", "merchant", "original_amount", "original_currency");

-- CreateIndex
CREATE UNIQUE INDEX "expense_claims_reference_key" ON "expense_claims"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "expense_claims_idempotency_key_key" ON "expense_claims"("idempotency_key");

-- CreateIndex
CREATE INDEX "expense_claims_company_status_idx" ON "expense_claims"("company_id", "status");

-- CreateIndex
CREATE INDEX "expense_claims_employee_status_idx" ON "expense_claims"("employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "expense_exchange_rates_company_id_from_currency_to_currency_key" ON "expense_exchange_rates"("company_id", "from_currency", "to_currency", "rate_date", "source");

-- CreateIndex
CREATE UNIQUE INDEX "expense_policy_versions_company_id_name_version_key" ON "expense_policy_versions"("company_id", "name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "expense_receipts_storage_path_key" ON "expense_receipts"("storage_path");

-- CreateIndex
CREATE INDEX "expense_receipts_hash_idx" ON "expense_receipts"("sha256_hash");

-- CreateIndex
CREATE UNIQUE INDEX "expense_reimbursements_claim_id_key" ON "expense_reimbursements"("claim_id");

-- CreateIndex
CREATE INDEX "hr_asset_assignments_employee_idx" ON "hr_asset_assignments"("employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_transportation_employee_uq" ON "hr_transportation_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "hr_transportation_status_idx" ON "hr_transportation_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_assets_company_tag_idx" ON "hr_assets"("company_id", "asset_tag");

-- CreateIndex
CREATE INDEX "hr_cases_company_status_idx" ON "hr_cases"("company_id", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "hr_cases_company_number_idx" ON "hr_cases"("company_id", "case_number");

-- CreateIndex
CREATE INDEX "hr_compensation_changes_company_status_idx" ON "hr_compensation_changes"("company_id", "status", "effective_date");

-- CreateIndex
CREATE INDEX "hr_comp_review_company_idx" ON "hr_compensation_review_cycles"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_compensation_review_items_cycle_id_employee_id_key" ON "hr_compensation_review_items"("cycle_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_document_acknowledgments_document_employee_key" ON "hr_document_acknowledgments"("document_id", "employee_id");

-- CreateIndex
CREATE INDEX "hr_document_versions_document_idx" ON "hr_document_versions"("document_id", "version_number" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "hr_document_versions_document_version_key" ON "hr_document_versions"("document_id", "version_number");

-- CreateIndex
CREATE INDEX "hr_domain_events_delivery_idx" ON "hr_domain_events"("status", "available_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_domain_events_company_id_idempotency_key_key" ON "hr_domain_events"("company_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "hr_employee_payroll_profiles_employee_id_key" ON "hr_employee_payroll_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "hr_employee_payroll_profiles_company_group_idx" ON "hr_employee_payroll_profiles"("company_id", "payroll_group_id", "status");

-- CreateIndex
CREATE INDEX "hr_assignments_company_idx" ON "hr_employment_assignments"("company_id", "status");

-- CreateIndex
CREATE INDEX "hr_assignments_employee_dates_idx" ON "hr_employment_assignments"("employee_id", "effective_from" DESC, "effective_to");

-- CreateIndex
CREATE INDEX "hr_employment_events_employee_idx" ON "hr_employment_events"("employee_id", "effective_date" DESC);

-- CreateIndex
CREATE INDEX "hr_ess_sensitive_access_employee_idx" ON "hr_ess_sensitive_access_log"("employee_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "hr_exit_cases_company_status_idx" ON "hr_exit_cases"("company_id", "status");

-- CreateIndex
CREATE INDEX "hr_exit_cases_employee_idx" ON "hr_exit_cases"("employee_id", "last_working_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "hr_feature_flags_company_id_feature_key_key" ON "hr_feature_flags"("company_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "hr_integration_mappings_company_id_integration_type_provide_key" ON "hr_integration_mappings"("company_id", "integration_type", "provider", "external_key");

-- CreateIndex
CREATE UNIQUE INDEX "hr_internal_mobility_application_opportunity_id_employee_id_key" ON "hr_internal_mobility_applications"("opportunity_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_accounting_entries_payroll_run_id_key" ON "hr_payroll_accounting_entries"("payroll_run_id");

-- CreateIndex
CREATE INDEX "hr_payroll_accounting_lines_entry_idx" ON "hr_payroll_accounting_lines"("accounting_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_approvals_payroll_run_id_sequence_approval_role_key" ON "hr_payroll_approvals"("payroll_run_id", "sequence", "approval_role");

-- CreateIndex
CREATE INDEX "hr_payroll_calculation_lines_item_idx" ON "hr_payroll_calculation_lines"("payroll_run_item_id", "calculation_version");

-- CreateIndex
CREATE INDEX "hr_payroll_exceptions_run_idx" ON "hr_payroll_exceptions"("payroll_run_id", "status");

-- CreateIndex
CREATE INDEX "hr_payroll_exports_run_idx" ON "hr_payroll_exports"("payroll_run_id", "export_type");

-- CreateIndex
CREATE INDEX "hr_payroll_groups_company_status_idx" ON "hr_payroll_groups"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_groups_company_id_code_key" ON "hr_payroll_groups"("company_id", "code");

-- CreateIndex
CREATE INDEX "hr_payroll_inputs_run_employee_idx" ON "hr_payroll_inputs"("payroll_run_id", "employee_id");

-- CreateIndex
CREATE INDEX "hr_payroll_inputs_source_idx" ON "hr_payroll_inputs"("source_module", "source_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_inputs_company_id_idempotency_key_key" ON "hr_payroll_inputs"("company_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_payment_batches_payroll_run_id_key" ON "hr_payroll_payment_batches"("payroll_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_payments_payment_batch_id_employee_id_key" ON "hr_payroll_payments"("payment_batch_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_reconciliations_payroll_run_id_key" ON "hr_payroll_reconciliations"("payroll_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_payroll_rule_legal_version_idx" ON "hr_payroll_rule_sets"("company_id", "jurisdiction", "legal_version");

-- CreateIndex
CREATE INDEX "hr_payroll_variances_run_status_idx" ON "hr_payroll_variances"("payroll_run_id", "status");

-- CreateIndex
CREATE INDEX "privacy_activity_request_idx" ON "hr_privacy_request_activities"("request_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "hr_retention_policies_company_id_record_type_key" ON "hr_retention_policies"("company_id", "record_type");

-- CreateIndex
CREATE INDEX "hr_succession_company_idx" ON "hr_succession_plans"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hr_successor_candidates_succession_plan_id_employee_id_key" ON "hr_successor_candidates"("succession_plan_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_talent_review_entries_review_id_employee_id_key" ON "hr_talent_review_entries"("review_id", "employee_id");

-- CreateIndex
CREATE INDEX "hr_workflow_tasks_assignee_status_due_idx" ON "hr_workflow_tasks"("assignee_user_id", "status", "due_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "hr_workflow_tasks_company_domain_idx" ON "hr_workflow_tasks"("company_id", "source_domain", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "hr_workflow_tasks_source_unique" ON "hr_workflow_tasks"("source_domain", "source_type", "source_id", "task_type", "assignee_user_id");

-- CreateIndex
CREATE INDEX "hr_workforce_plans_company_idx" ON "hr_workforce_plans"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "travel_requests_reference_key" ON "travel_requests"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "travel_requests_idempotency_key_key" ON "travel_requests"("idempotency_key");

-- CreateIndex
CREATE INDEX "travel_requests_company_departure_idx" ON "travel_requests"("company_id", "departure_at");

-- CreateIndex
CREATE INDEX "travel_requests_employee_status_idx" ON "travel_requests"("employee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_events_sequence_key" ON "audit_events"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "audit_events_event_hash_key" ON "audit_events"("event_hash");

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_occurred_at_idx" ON "audit_events"("actor_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_company_id_occurred_at_idx" ON "audit_events"("company_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_events_action_outcome_idx" ON "audit_events"("action", "outcome");

-- CreateIndex
CREATE INDEX "audit_event_dead_letters_status_next_attempt_at_idx" ON "audit_event_dead_letters"("status", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "audit_archive_outbox_event_id_key" ON "audit_archive_outbox"("event_id");

-- CreateIndex
CREATE INDEX "audit_archive_outbox_status_next_attempt_at_idx" ON "audit_archive_outbox"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "audit_legal_holds_company_id_status_idx" ON "audit_legal_holds"("company_id", "status");

-- CreateIndex
CREATE INDEX "audit_retention_executions_status_created_at_idx" ON "audit_retention_executions"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_retention_executions_company_id_record_type_idx" ON "audit_retention_executions"("company_id", "record_type");

-- CreateIndex
CREATE INDEX "audit_retention_execution_items_execution_id_status_idx" ON "audit_retention_execution_items"("execution_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_retention_execution_items_execution_id_entity_id_key" ON "audit_retention_execution_items"("execution_id", "entity_id");

-- CreateIndex
CREATE INDEX "audit_access_review_campaigns_company_id_status_due_at_idx" ON "audit_access_review_campaigns"("company_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "audit_access_review_items_reviewer_user_id_decision_idx" ON "audit_access_review_items"("reviewer_user_id", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "audit_access_review_items_campaign_id_subject_user_id_key" ON "audit_access_review_items"("campaign_id", "subject_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_sod_rules_code_key" ON "audit_sod_rules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "audit_controls_code_key" ON "audit_controls"("code");

-- CreateIndex
CREATE INDEX "audit_controls_status_next_due_at_idx" ON "audit_controls"("status", "next_due_at");

-- CreateIndex
CREATE INDEX "audit_periods_company_id_status_idx" ON "audit_periods"("company_id", "status");

-- CreateIndex
CREATE INDEX "audit_evidence_control_id_collected_at_idx" ON "audit_evidence"("control_id", "collected_at" DESC);

-- CreateIndex
CREATE INDEX "audit_evidence_period_id_idx" ON "audit_evidence"("period_id");

-- CreateIndex
CREATE INDEX "audit_evidence_company_id_collected_at_idx" ON "audit_evidence"("company_id", "collected_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "audit_exceptions_fingerprint_key" ON "audit_exceptions"("fingerprint");

-- CreateIndex
CREATE INDEX "audit_exceptions_status_severity_due_at_idx" ON "audit_exceptions"("status", "severity", "due_at");

-- CreateIndex
CREATE INDEX "audit_assurance_evidence_kind_occurred_at_idx" ON "audit_assurance_evidence"("kind", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_assurance_evidence_company_id_kind_occurred_at_idx" ON "audit_assurance_evidence"("company_id", "kind", "occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "UserGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userTeamId_fkey" FOREIGN KEY ("userTeamId") REFERENCES "UserTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_banner_engagements" ADD CONSTRAINT "broadcast_banner_engagements_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "broadcast_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_banner_engagements" ADD CONSTRAINT "broadcast_banner_engagements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_setup_tokens" ADD CONSTRAINT "password_setup_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_person_profile_id_fkey" FOREIGN KEY ("person_profile_id") REFERENCES "person_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ApplicantSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "RecruitmentStage"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_offers" ADD CONSTRAINT "job_offers_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_read_status" ADD CONSTRAINT "applicant_read_status_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_read_status" ADD CONSTRAINT "applicant_read_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_reminders" ADD CONSTRAINT "applicant_reminders_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_reminders" ADD CONSTRAINT "applicant_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionRecord" ADD CONSTRAINT "TransitionRecord_actingUserId_fkey" FOREIGN KEY ("actingUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionRecord" ADD CONSTRAINT "TransitionRecord_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionRecord" ADD CONSTRAINT "TransitionRecord_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_actingUserId_fkey" FOREIGN KEY ("actingUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldOption" ADD CONSTRAINT "CustomFieldOption_custom_field_definition_id_fkey" FOREIGN KEY ("custom_field_definition_id") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_queue" ADD CONSTRAINT "upload_queue_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_queue" ADD CONSTRAINT "upload_queue_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "ApplicantSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_operation_jobs" ADD CONSTRAINT "data_operation_jobs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUIDisplayPreference" ADD CONSTRAINT "UserUIDisplayPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_desk_knowledge_documents" ADD CONSTRAINT "service_desk_knowledge_documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_desk_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_desk_knowledge_chunks" ADD CONSTRAINT "service_desk_knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "service_desk_knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_desk_knowledge_chunks" ADD CONSTRAINT "service_desk_knowledge_chunks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_desk_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_desk_category_assignees" ADD CONSTRAINT "service_desk_category_assignees_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_desk_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantComment" ADD CONSTRAINT "ApplicantComment_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantComment" ADD CONSTRAINT "ApplicantComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_headcountId_fkey" FOREIGN KEY ("headcountId") REFERENCES "Headcount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookBodyConfig" ADD CONSTRAINT "WebhookBodyConfig_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dashboard" ADD CONSTRAINT "Dashboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardShare" ADD CONSTRAINT "DashboardShare_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardShare" ADD CONSTRAINT "DashboardShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemPrompt" ADD CONSTRAINT "SystemPrompt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SystemPromptCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Headcount" ADD CONSTRAINT "Headcount_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Headcount" ADD CONSTRAINT "Headcount_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionInterviewer" ADD CONSTRAINT "PositionInterviewer_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionInterviewer" ADD CONSTRAINT "PositionInterviewer_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionInterviewer" ADD CONSTRAINT "PositionInterviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertiseSkill" ADD CONSTRAINT "ExpertiseSkill_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ExpertiseGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalityTrait" ADD CONSTRAINT "PersonalityTrait_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PersonalityGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplateGroup" ADD CONSTRAINT "SkillTemplateGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ExpertiseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplateGroup" ADD CONSTRAINT "SkillTemplateGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SkillTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplateSkill" ADD CONSTRAINT "SkillTemplateSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "ExpertiseSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplateSkill" ADD CONSTRAINT "SkillTemplateSkill_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SkillTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplatePersonalityGroup" ADD CONSTRAINT "SkillTemplatePersonalityGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PersonalityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplatePersonalityGroup" ADD CONSTRAINT "SkillTemplatePersonalityGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SkillTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplatePersonalityTrait" ADD CONSTRAINT "SkillTemplatePersonalityTrait_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SkillTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTemplatePersonalityTrait" ADD CONSTRAINT "SkillTemplatePersonalityTrait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "PersonalityTrait"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionExpertiseGroup" ADD CONSTRAINT "PositionExpertiseGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ExpertiseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionExpertiseGroup" ADD CONSTRAINT "PositionExpertiseGroup_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionExpertiseSkill" ADD CONSTRAINT "PositionExpertiseSkill_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionExpertiseSkill" ADD CONSTRAINT "PositionExpertiseSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "ExpertiseSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionPersonalityGroup" ADD CONSTRAINT "PositionPersonalityGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PersonalityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionPersonalityGroup" ADD CONSTRAINT "PositionPersonalityGroup_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionPersonalityTrait" ADD CONSTRAINT "PositionPersonalityTrait_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionPersonalityTrait" ADD CONSTRAINT "PositionPersonalityTrait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "PersonalityTrait"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantEvaluation" ADD CONSTRAINT "ApplicantEvaluation_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantEvaluation" ADD CONSTRAINT "ApplicantEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantEvaluation" ADD CONSTRAINT "ApplicantEvaluation_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantEvaluationLink" ADD CONSTRAINT "ApplicantEvaluationLink_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantEvaluationLink" ADD CONSTRAINT "ApplicantEvaluationLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantExpertiseScore" ADD CONSTRAINT "ApplicantExpertiseScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ApplicantEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantExpertiseScore" ADD CONSTRAINT "ApplicantExpertiseScore_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "ExpertiseSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantPersonalityScore" ADD CONSTRAINT "ApplicantPersonalityScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ApplicantEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantPersonalityScore" ADD CONSTRAINT "ApplicantPersonalityScore_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "PersonalityTrait"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "hr_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_person_profile_id_fkey" FOREIGN KEY ("person_profile_id") REFERENCES "person_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_consents" ADD CONSTRAINT "screening_consents_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_consents" ADD CONSTRAINT "screening_consents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_cases" ADD CONSTRAINT "screening_cases_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_cases" ADD CONSTRAINT "screening_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_cases" ADD CONSTRAINT "screening_cases_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_findings" ADD CONSTRAINT "screening_findings_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "screening_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_findings" ADD CONSTRAINT "screening_findings_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_cost_centers" ADD CONSTRAINT "hr_cost_centers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "hr_cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_projects" ADD CONSTRAINT "hr_projects_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "hr_cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_transactions" ADD CONSTRAINT "advance_transactions_advance_id_fkey" FOREIGN KEY ("advance_id") REFERENCES "employee_advances"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "advance_transactions" ADD CONSTRAINT "advance_transactions_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "expense_claims"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "advance_transactions" ADD CONSTRAINT "advance_transactions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_advance_type_id_fkey" FOREIGN KEY ("advance_type_id") REFERENCES "expense_advance_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_travel_request_id_fkey" FOREIGN KEY ("travel_request_id") REFERENCES "travel_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_accounting_entries" ADD CONSTRAINT "expense_accounting_entries_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "expense_accounting_entries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_accounting_entry_lines" ADD CONSTRAINT "expense_accounting_entry_lines_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_accounting_entry_lines" ADD CONSTRAINT "expense_accounting_entry_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "expense_accounting_entries"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_accounting_mappings" ADD CONSTRAINT "expense_accounting_mappings_advance_type_id_fkey" FOREIGN KEY ("advance_type_id") REFERENCES "expense_advance_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_accounting_mappings" ADD CONSTRAINT "expense_accounting_mappings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_activities" ADD CONSTRAINT "expense_activities_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_approvals" ADD CONSTRAINT "expense_approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_approvals" ADD CONSTRAINT "expense_approvals_delegated_from_user_id_fkey" FOREIGN KEY ("delegated_from_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_claim_items" ADD CONSTRAINT "expense_claim_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_claim_items" ADD CONSTRAINT "expense_claim_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "expense_claims"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_advance_id_fkey" FOREIGN KEY ("advance_id") REFERENCES "employee_advances"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_travel_request_id_fkey" FOREIGN KEY ("travel_request_id") REFERENCES "travel_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_exchange_rates" ADD CONSTRAINT "expense_exchange_rates_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_policy_versions" ADD CONSTRAINT "expense_policy_versions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "expense_claims"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_claim_item_id_fkey" FOREIGN KEY ("claim_item_id") REFERENCES "expense_claim_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_receipts" ADD CONSTRAINT "expense_receipts_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_reimbursements" ADD CONSTRAINT "expense_reimbursements_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "expense_claims"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expense_reimbursements" ADD CONSTRAINT "expense_reimbursements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_asset_assignments" ADD CONSTRAINT "hr_asset_assignments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "hr_assets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_asset_assignments" ADD CONSTRAINT "hr_asset_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_transportation_assignments" ADD CONSTRAINT "hr_transportation_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_cases" ADD CONSTRAINT "hr_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_compensation_changes" ADD CONSTRAINT "hr_compensation_changes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_compensation_review_items" ADD CONSTRAINT "hr_compensation_review_items_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "hr_compensation_review_cycles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_compensation_review_items" ADD CONSTRAINT "hr_compensation_review_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_employee_payroll_profiles" ADD CONSTRAINT "hr_employee_payroll_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_employee_payroll_profiles" ADD CONSTRAINT "hr_employee_payroll_profiles_payroll_group_id_fkey" FOREIGN KEY ("payroll_group_id") REFERENCES "hr_payroll_groups"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_employment_assignments" ADD CONSTRAINT "hr_employment_assignments_correction_of_id_fkey" FOREIGN KEY ("correction_of_id") REFERENCES "hr_employment_assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_employment_assignments" ADD CONSTRAINT "hr_employment_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_employment_assignments" ADD CONSTRAINT "hr_employment_assignments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_employment_events" ADD CONSTRAINT "hr_employment_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_exit_cases" ADD CONSTRAINT "hr_exit_cases_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_internal_mobility_applications" ADD CONSTRAINT "hr_internal_mobility_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_internal_mobility_applications" ADD CONSTRAINT "hr_internal_mobility_applications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "hr_internal_opportunities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_payroll_inputs" ADD CONSTRAINT "hr_payroll_inputs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_payroll_payments" ADD CONSTRAINT "hr_payroll_payments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_privacy_request_activities" ADD CONSTRAINT "hr_privacy_request_activities_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_privacy_request_activities" ADD CONSTRAINT "hr_privacy_request_activities_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "hr_privacy_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_privacy_requests" ADD CONSTRAINT "hr_privacy_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_privacy_requests" ADD CONSTRAINT "hr_privacy_requests_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_succession_plans" ADD CONSTRAINT "hr_succession_plans_incumbent_employee_id_fkey" FOREIGN KEY ("incumbent_employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_successor_candidates" ADD CONSTRAINT "hr_successor_candidates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_successor_candidates" ADD CONSTRAINT "hr_successor_candidates_succession_plan_id_fkey" FOREIGN KEY ("succession_plan_id") REFERENCES "hr_succession_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_talent_review_entries" ADD CONSTRAINT "hr_talent_review_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hr_talent_review_entries" ADD CONSTRAINT "hr_talent_review_entries_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "hr_talent_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr_employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

