// STEP 2: The Synchronization Logic (V2 Enterprise)
// Inclui: Context Switcher, Audit Trail, Protocol Gen, QA Gates

export const SYNC_SERVICE_CODE = `
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AntiGravityQueue } from './antiGravity';

@Injectable()
export class EnterpriseWorkflowService {
  private readonly logger = new Logger(EnterpriseWorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private antiGravity: AntiGravityQueue
  ) {}

  /**
   * MODULE 1: Context Switcher Logic
   * Define qual empresa o contato está representando nesta conversa.
   */
  async setCardContext(cardId: string, companyId: string, actorId: string) {
    const card = await this.prisma.card.findUnique({ 
        where: { id: cardId },
        include: { clientCompany: true } 
    });

    if (!card) throw new Error('Card not found');

    const company = await this.prisma.clientCompany.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('Company not found');

    const oldContext = card.clientCompany?.name || 'Unassigned';

    // Update Local DB
    await this.prisma.card.update({
      where: { id: cardId },
      data: { clientCompanyId: companyId }
    });

    // Sync to Chatwoot (Custom Attributes)
    await this.antiGravity.add({
      type: 'UPDATE_ATTRIBUTES',
      tenantId: card.tenantId,
      payload: {
        url: \`/api/v1/accounts/1/conversations/\${card.chatwootConversationId}/custom_attributes\`,
        body: { company_name: company.name, cnpj: company.cnpj, tax_regime: company.taxRegime }
      }
    });

    // Log Audit
    await this.logTicketEvent(cardId, actorId, 'CONTEXT_SWITCHED', oldContext, company.name);
    
    // Post Internal Note
    await this.postInternalNote(
      card.tenantId, 
      card.chatwootConversationId, 
      \`🏢 Contexto definido para: **\${company.name}** (\${company.cnpj})\`
    );
  }

  /**
   * MODULE 3: Department Routing & Protocol Generation
   */
  async generateProtocol(tenantId: string, deptCode: string): Promise<string> {
    const year = new Date().getFullYear();
    // Count existing cards created this year for this department
    const count = await this.prisma.card.count({
      where: { 
        tenantId, 
        createdAt: { gte: new Date(\`\${year}-01-01\`) },
        protocolNumber: { contains: deptCode }
      }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    return \`#\${year}-\${deptCode}-\${sequence}\`;
  }

  /**
   * MODULE 4: QA Gates & Movement Logic
   */
  async moveCard(cardId: string, targetColumnId: string, actorId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    const targetColumn = await this.prisma.column.findUnique({ 
        where: { id: targetColumnId },
        include: { workflow: true } 
    });

    // 1. Validate Context (Critical Gate)
    if (!card.clientCompanyId && targetColumn.stage !== 'TRIAGE') {
      throw new BadRequestException("⛔ ERRO: Você deve selecionar uma Empresa (Contexto) antes de mover o ticket da Triagem.");
    }

    // 2. Validate Checklist (QA Gate)
    if (targetColumn.checklistTemplate) {
      const checklist = targetColumn.checklistTemplate as any[];
      const completed = (card.checklistProgress as string[]) || [];
      
      const missingRequired = checklist
        .filter(item => item.required && !completed.includes(item.id))
        .map(item => item.text);

      if (missingRequired.length > 0) {
        throw new BadRequestException(\`📋 Checklist Incompleto: \${missingRequired.join(', ')}\`);
      }
    }

    // 3. Handle Department Transfer (Routing)
    const currentColumn = await this.prisma.column.findUnique({ 
        where: { id: card.columnId }, 
        include: { workflow: true } 
    });

    if (currentColumn.workflowId !== targetColumn.workflowId) {
        // Log Transfer Logic
        await this.postInternalNote(
            card.tenantId,
            card.chatwootConversationId,
            \`✈️ Transferência de Departamento: \${currentColumn.workflow.name} -> \${targetColumn.workflow.name} por \${actorId}\`
        );
    }

    // 4. Execute Move
    await this.prisma.card.update({
      where: { id: cardId },
      data: { columnId: targetColumnId }
    });

    // 5. Immutable Audit Log
    await this.logTicketEvent(cardId, actorId, 'MOVED', currentColumn.name, targetColumn.name);
    
    // 6. Trigger Chatwoot Sync (Tags/Assignee) via AntiGravity
    // ... (logic from previous step)
  }

  /**
   * MODULE 2: Immutable Audit Trail Helper
   */
  private async logTicketEvent(cardId: string, actorId: string, type: string, oldVal: string, newVal: string) {
    await this.prisma.ticketAuditLog.create({
      data: {
        cardId,
        actorId,
        actionType: type,
        previousValue: oldVal,
        newValue: newVal
      }
    });
  }

  // Helper for notes (Reused)
  private async postInternalNote(tenantId: string, convId: number, msg: string) {
    // Implementation using AntiGravity...
  }
}
`;
