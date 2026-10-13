/**
 * Database entity types for gyeongbuk-sw-system
 * These types align with the Supabase database schema
 */

/**
 * Common fields
 */
export type BaseEntity = {
  id: string
  created_at: string
  updated_at?: string
  deleted_at?: string | null
}

/**
 * Company
 */
export type Company = BaseEntity & {
  name: string
  registration_number: string | null
  ceo_name: string | null
  address: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
}

/**
 * Program
 */
export type Program = BaseEntity & {
  name: string
  description: string | null
  status: "draft" | "published" | "unpublished" | "archived"
  application_opens_at: string | null
  application_closes_at: string | null
  starts_at: string | null
  ends_at: string | null
  location: string | null
  capacity: number | null
  current_applicants: number
  allow_budget_change: boolean
}

/**
 * Budget
 */
export type Budget = BaseEntity & {
  program_id: string
  company_id: string
  fiscal_year: number
  status: "draft" | "submitted" | "reviewing" | "revision_requested" | "approved" | "rejected"
  submitted_by: string | null
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  total_amount: number | null
  note: string | null
}

/**
 * Budget Item
 */
export type BudgetItem = BaseEntity & {
  budget_id: string
  category: string
  detail: string
  item: string | null
  description: string | null
  quantity: number | null
  unit_price: number | null
  amount: number
  sort_order: number | null
}

/**
 * Budget Change
 */
export type BudgetChange = BaseEntity & {
  budget_id: string
  version: number
  change_type: "new" | "delete" | "amount_increase" | "amount_decrease" | "category_change" | "content_change"
  reason: string
  total_amount: number | null
  created_by: string
}

/**
 * Purchase Request
 */
export type PurchaseRequest = BaseEntity & {
  company_id: string
  requester_id: string
  item_name: string
  quantity: number
  unit_price: number | null
  requested_amount: number
  approved_amount: number | null
  paid_amount: number | null
  vendor: string
  category: string
  purpose: string | null
  purchase_date: string | null
  status: "draft" | "submitted" | "reviewing" | "approved" | "rejected" | "purchase_completed" | "proof_submitted" | "proof_approved" | "proof_rejected" | "completed"
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
}

/**
 * Proof Document
 */
export type ProofDocument = {
  id: string
  purchase_request_id: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_by: string
  uploaded_at: string
}

/**
 * Refund Application
 */
export type RefundApplication = BaseEntity & {
  company_id: string | null
  applicant_id: string
  refund_recipient_name: string
  refund_recipient_type: "company" | "individual"
  requested_amount: number
  approved_amount: number | null
  paid_amount: number | null
  payment_date: string
  vendor: string
  purpose: string
  payment_method: string
  category: string
  status: "draft" | "submitted" | "reviewing" | "revision_requested" | "approved" | "rejected" | "processing" | "completed"
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
}

/**
 * Program Application
 */
export type ProgramApplication = BaseEntity & {
  program_id: string
  applicant_id: string
  status: "draft" | "submitted" | "reviewing" | "approved" | "waitlisted" | "rejected" | "cancelled" | "completed" | "no_show"
  application_data: Record<string, any> | null
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  completed_at: string | null
}

/**
 * Certificate
 */
export type Certificate = BaseEntity & {
  application_id: string
  document_number: string
  participant_name: string
  affiliation: string | null
  program_name: string
  program_start_at: string
  program_end_at: string
  location: string | null
  issued_at: string
  issued_by: string
  verification_code: string
  pdf_path: string | null
  reissue_count: number
}

/**
 * Email Log
 */
export type EmailLog = BaseEntity & {
  template_id: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  body: string | null
  status: "pending" | "sending" | "sent" | "failed" | "cancelled"
  error_reason: string | null
  error_code: string | null
  sent_at: string | null
  retry_count: number
  metadata: Record<string, any> | null
}

/**
 * Status History
 */
export type StatusHistory = {
  id: string
  entity_type: string
  entity_id: string
  from_status: string | null
  to_status: string
  changed_by: string | null
  changed_at: string
  reason: string | null
  metadata: Record<string, any> | null
}

/**
 * Guide
 */
export type Guide = BaseEntity & {
  title: string
  slug: string
  content: string
  category: string | null
  sort_order: number
  is_published: boolean
  created_by: string | null
  updated_by: string | null
}

/**
 * FAQ
 */
export type FAQ = BaseEntity & {
  question: string
  answer: string
  category: string | null
  sort_order: number
  is_published: boolean
  view_count: number
  created_by: string | null
  updated_by: string | null
}

/**
 * Notice
 */
export type Notice = BaseEntity & {
  title: string
  content: string
  category: string
  is_important: boolean
  is_published: boolean
  published_at: string | null
  view_count: number
  created_by: string | null
  updated_by: string | null
}

/**
 * Document Template
 */
export type DocumentTemplate = BaseEntity & {
  title: string
  description: string | null
  category: string | null
  file_url: string
  file_name: string
  file_size: number | null
  download_count: number
  sort_order: number
  is_active: boolean
  version: string | null
  created_by: string | null
  updated_by: string | null
}

/**
 * Chat Conversation
 */
export type ChatConversation = BaseEntity & {
  user_id: string
  title: string | null
  status: "active" | "archived" | "deleted"
  started_at: string
  ended_at: string | null
  message_count: number
  metadata: Record<string, any> | null
}

/**
 * Chat Message
 */
export type ChatMessage = {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata: Record<string, any> | null
  created_at: string
}

/**
 * Chatbot Knowledge
 */
export type ChatbotKnowledge = BaseEntity & {
  category: string
  question: string
  answer: string
  keywords: string[] | null
  priority: number
  is_active: boolean
  hit_count: number
  created_by: string | null
  updated_by: string | null
}

/**
 * Notification Setting
 */
export type NotificationSetting = {
  id: string
  user_id: string
  setting_key: string
  is_enabled: boolean
  notification_type: "email" | "sms" | "in_app"
  created_at: string
  updated_at: string
}

/**
 * Notification
 */
export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  content: string | null
  link: string | null
  is_read: boolean
  read_at: string | null
  sent_email: boolean
  sent_email_at: string | null
  sent_sms: boolean
  sent_sms_at: string | null
  metadata: Record<string, any> | null
  created_at: string
}

/**
 * Email Template
 */
export type EmailTemplate = BaseEntity & {
  template_key: string
  subject: string
  body: string
  description: string | null
  is_active: boolean
  created_by: string | null
  updated_by: string | null
}

/**
 * Company Document
 */
export type CompanyDocument = BaseEntity & {
  company_id: string
  document_type: "business_registration" | "interim_report" | "final_report"
  title: string
  description: string | null
  file_name: string
  file_url: string
  file_size: number | null
  status: "draft" | "submitted" | "approved" | "rejected"
  submitted_at: string | null
  submitted_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
}

/**
 * Tables type for Supabase
 */
export type Database = {
  public: {
    Tables: {
      companies: { Row: Company; Insert: Omit<Company, "id">; Update: Partial<Company> }
      programs: { Row: Program; Insert: Omit<Program, "id">; Update: Partial<Program> }
      budgets: { Row: Budget; Insert: Omit<Budget, "id">; Update: Partial<Budget> }
      budget_items: { Row: BudgetItem; Insert: Omit<BudgetItem, "id">; Update: Partial<BudgetItem> }
      budget_changes: { Row: BudgetChange; Insert: Omit<BudgetChange, "id">; Update: Partial<BudgetChange> }
      purchase_requests: { Row: PurchaseRequest; Insert: Omit<PurchaseRequest, "id">; Update: Partial<PurchaseRequest> }
      proof_documents: { Row: ProofDocument; Insert: Omit<ProofDocument, "id">; Update: Partial<ProofDocument> }
      refund_applications: { Row: RefundApplication; Insert: Omit<RefundApplication, "id">; Update: Partial<RefundApplication> }
      program_applications: { Row: ProgramApplication; Insert: Omit<ProgramApplication, "id">; Update: Partial<ProgramApplication> }
      certificates: { Row: Certificate; Insert: Omit<Certificate, "id">; Update: Partial<Certificate> }
      email_logs: { Row: EmailLog; Insert: Omit<EmailLog, "id">; Update: Partial<EmailLog> }
      status_histories: { Row: StatusHistory; Insert: Omit<StatusHistory, "id">; Update: Partial<StatusHistory> }
      guides: { Row: Guide; Insert: Omit<Guide, "id">; Update: Partial<Guide> }
      faqs: { Row: FAQ; Insert: Omit<FAQ, "id">; Update: Partial<FAQ> }
      notices: { Row: Notice; Insert: Omit<Notice, "id">; Update: Partial<Notice> }
      document_templates: { Row: DocumentTemplate; Insert: Omit<DocumentTemplate, "id">; Update: Partial<DocumentTemplate> }
      chat_conversations: { Row: ChatConversation; Insert: Omit<ChatConversation, "id">; Update: Partial<ChatConversation> }
      chat_messages: { Row: ChatMessage; Insert: Omit<ChatMessage, "id">; Update: Partial<ChatMessage> }
      chatbot_knowledge: { Row: ChatbotKnowledge; Insert: Omit<ChatbotKnowledge, "id">; Update: Partial<ChatbotKnowledge> }
      notification_settings: { Row: NotificationSetting; Insert: Omit<NotificationSetting, "id">; Update: Partial<NotificationSetting> }
      notifications: { Row: Notification; Insert: Omit<Notification, "id">; Update: Partial<Notification> }
      email_templates: { Row: EmailTemplate; Insert: Omit<EmailTemplate, "id">; Update: Partial<EmailTemplate> }
      company_documents: { Row: CompanyDocument; Insert: Omit<CompanyDocument, "id">; Update: Partial<CompanyDocument> }
    }
  }
}
