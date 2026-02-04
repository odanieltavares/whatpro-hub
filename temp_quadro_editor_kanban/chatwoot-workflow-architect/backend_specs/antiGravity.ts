// STEP 3: The "Anti-Gravity" Safety Net
// Queue System para tolerância a falhas na API do Chatwoot

export const ANTI_GRAVITY_CODE = `
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface QueueTask {
  id: string;
  type: 'POST_NOTE' | 'ASSIGN_AGENT' | 'UPDATE_STATUS';
  tenantId: string;
  payload: {
    url: string;
    method?: 'POST' | 'PATCH' | 'PUT';
    headers: any;
    body: any;
  };
  attempts: number;
  nextRetry: number; // Timestamp
}

@Injectable()
export class AntiGravityQueue {
  private queue: Map<string, QueueTask> = new Map();
  private readonly logger = new Logger(AntiGravityQueue.name);
  private isProcessing = false;

  constructor() {
    // Inicia o processador em background
    setInterval(() => this.processQueue(), 5000);
  }

  /**
   * Adiciona uma tarefa à fila
   */
  async add(taskData: Omit<QueueTask, 'id' | 'attempts' | 'nextRetry'>) {
    const id = Math.random().toString(36).substring(7);
    const task: QueueTask = {
      ...taskData,
      id,
      attempts: 0,
      nextRetry: Date.now() // Executar imediatamente
    };
    
    this.queue.set(id, task);
    this.logger.log(\`[Anti-Gravity] Tarefa \${id} (\${task.type}) adicionada à fila.\`);
    return id;
  }

  /**
   * Processador da Fila com Backoff Exponencial
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const now = Date.now();

    for (const [id, task] of this.queue) {
      if (task.nextRetry > now) continue;

      try {
        this.logger.debug(\`Tentando processar task \${id}...\`);
        
        await axios({
          url: task.payload.url,
          method: task.payload.method || 'POST',
          headers: task.payload.headers,
          data: task.payload.body,
          timeout: 5000 // Timeout curto para falhar rápido
        });

        // Sucesso: Remove da fila
        this.queue.delete(id);
        this.logger.log(\`[Anti-Gravity] Tarefa \${id} concluída com sucesso.\`);

      } catch (error) {
        task.attempts++;
        const maxAttempts = 5;

        if (task.attempts >= maxAttempts) {
          this.logger.error(\`[Anti-Gravity] Tarefa \${id} falhou permanentemente após \${maxAttempts} tentativas.\`);
          // Aqui poderia mover para uma tabela de "Dead Letter Queue" no banco
          this.queue.delete(id);
        } else {
          // Backoff Exponencial: 2s, 4s, 8s, 16s...
          const delay = Math.pow(2, task.attempts) * 1000;
          task.nextRetry = now + delay;
          this.logger.warn(\`[Anti-Gravity] Falha na tarefa \${id}. Tentativa \${task.attempts}. Próxima em \${delay}ms.\`);
        }
      }
    }

    this.isProcessing = false;
  }
}
`;
