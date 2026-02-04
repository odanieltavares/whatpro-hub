// STEP 1: The Database Schema (Prisma)
// Este arquivo contém a definição da string do schema para exibição e referência.

export const PRISMA_SCHEMA_SPEC = `
// schema.prisma (V2 Enterprise Edition)

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Multi-tenancy: Cada escritório de contabilidade é um Tenant
model Tenant {
  id          String   @id @default(uuid())
  name        String
  domain      String   @unique
  chatwootUrl String
  apiToken    String   // Encrypted
  createdAt   DateTime @default(now())

  workflows   Workflow[]
  cards       Card[]
  users       User[]
  contacts    Contact[]
  companies   ClientCompany[]
}

model User {
  id             String @id @default(uuid())
  tenantId       String
  tenant         Tenant @relation(fields: [tenantId], references: [id])
  chatwootUserId Int?
  email          String
  role           String // ADMIN, AGENT
}

// V2: Modelo de Contato (Dono de várias empresas)
model Contact {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  chatwootContactId Int    @unique
  name            String
  phone           String?
  email           String?
  
  // Um contato pode gerenciar N empresas
  companies       ClientCompany[]
  cards           Card[]
}

// V2: Entidade Jurídica (Contexto)
model ClientCompany {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  name        String
  cnpj        String   @unique
  taxRegime   String   // Simples, Presumido, Real
  
  contacts    Contact[] // Many-to-Many implícito ou explícito
  cards       Card[]
}

model Workflow {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  departmentCode String // Ex: FISC, RH, LEGAL
  name        String
  columns     Column[]
  @@unique([tenantId, name])
}

model Column {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])
  name        String
  position    Int
  chatwootTag String?
  stage       Stage    @default(HANDOVER)

  // V2: QA Gates (Checklist Obrigatório para entrar/sair)
  checklistTemplate Json? // Array de { id, text, required }

  cards       Card[]
}

enum Stage {
  TRIAGE
  HANDOVER
  WAITING
  RESOLUTION
}

// O "Shadow Database" da Conversa (V2)
model Card {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  // Contexto do Contato
  contactId   String
  contact     Contact  @relation(fields: [contactId], references: [id])

  // V2: Contexto da Empresa (Obrigatório para avançar workflow)
  clientCompanyId String?
  clientCompany   ClientCompany? @relation(fields: [clientCompanyId], references: [id])

  // V2: Protocolo Único (#YYYY-DEPT-SEQ)
  protocolNumber String @unique 

  columnId    String
  column      Column   @relation(fields: [columnId], references: [id])
  
  // Progresso do Checklist atual
  checklistProgress Json? // Array de IDs completados ["item_1", "item_2"]

  chatwootConversationId Int
  title       String?
  priority    String   @default("medium")
  chatwootAttributes Json?
  
  updatedAt    DateTime @updatedAt
  createdAt    DateTime @default(now())
  
  auditLogs    TicketAuditLog[]

  @@unique([tenantId, chatwootConversationId])
  @@index([columnId])
}

// V2: Immutable Audit Trail
model TicketAuditLog {
  id          String   @id @default(uuid())
  cardId      String
  card        Card     @relation(fields: [cardId], references: [id])
  
  actorId     String?  // ID do usuário do sistema ou "SYSTEM"
  actionType  String   // MOVED, CONTEXT_SWITCHED, CHECKLIST_UPDATE, TAG_ADDED
  
  previousValue String? // JSON stringified
  newValue      String? // JSON stringified
  
  timestamp   DateTime @default(now())
}
`;
