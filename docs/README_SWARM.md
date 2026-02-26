# 🐝 Swarm Intelligence: Guia de Implementação e Uso

> **Protocolo de Colaboração Multi-Agente (Antigravity + Claude Code)**
> Este sistema permite que dois agentes operem simultaneamente no mesmo projeto sem conflitos, compartilhando um "cérebro central".

---

## 🚀 O Que é Isso?

O **Swarm (Enxame)** é uma estrutura de arquivos que cria um "Contrato de Colaboração" entre:
1.  **Antigravity (IDE Agent):** O Arquiteto. Planeja, vê o código visualmente, cria arquivos.
2.  **Claude Code (CLI Agent):** O Construtor. Executa testes, refatorações, scripts e auditorias rápidas.

Eles se comunicam através da pasta `.agent/swarm/state`, garantindo que um saiba o que o outro está fazendo.

---

## 📦 Como Instalar em Outro Projeto

Basta copiar a inteligência para o novo repositório.

### Passo 1: Copiar a Estrutura
No terminal, estando na raiz do projeto onde o Swarm já existe (`whatpro-hub`), execute:

```bash
# Copia a pasta .agent completa para o novo projeto
cp -r .agent /caminho/para/novo-projeto/

# Copia o arquivo de configuração do CLI
cp CLAUDE.md /caminho/para/novo-projeto/
```

### Passo 2: Inicializar a Memória
No **novo projeto**, é preciso resetar a memória para que os agentes leiam o novo contexto.

```bash
cd /caminho/para/novo-projeto/

# Renomeia o template de exemplo para o arquivo real
cp .agent/swarm/state/SWARM_MEMORY-example.md .agent/swarm/state/SWARM_MEMORY.md

# Opcional: Ajuste as permissões do script de handoff
chmod +x scripts/commit_swarm_handoff.sh
```

---

## 🛠️ Como Usar (Workflow do Dia a Dia)

### Cenário 1: Trabalho Solo (Só Antigravity)
*   **Você:** "Antigravity, crie a página de Login."
*   **Antigravity:** Trabalha normalmente. Não precisa ativar o Swarm se não houver conflito.

### Cenário 2: Trabalho em Enxame (Antigravity + Claude)
*   **Você:** *"Antigravity, planeje a arquitetura do Dashboard. Enquanto isso, quero que o Claude verifique se a API tem os endpoints necessários."*

#### O Processo Automático:
1.  **Antigravity:**
    *   Escreve no `SWARM_MEMORY.md`: *"Estou desenhando o Dashboard. Claude, por favor, audite a API buscando endpoints de métricas."*
    *   Fica focado no Frontend (`apps/frontend`).

2.  **Você (no Terminal):**
    *   Roda: `claude`
    *   O Claude lê o `CLAUDE.md`, que o manda ler o `SWARM_MEMORY.md`.
    *   Ele entende: *"Ah, meu parceiro quer que eu audite a API"* e executa a tarefa.

---

## 📂 Estrutura de Arquivos Importantes

*   `docs/README_SWARM.md`: Este arquivo.
*   `.agent/swarm/protocols/SWARM_MANIFESTO.md`: A "Constituição" das regras.
*   `.agent/swarm/state/SWARM_MEMORY.md`: O quadro branco compartilhado (Onde a mágica acontece).
*   `.agent/swarm/state/SWARM_ROLES.md`: Quem está fazendo o que (Líder vs Wingman).
*   `CLAUDE.md`: O arquivo que ensina o Claude Code a respeitar esse sistema.

---

## 💡 Dica Pro: O Script de Handoff

Se você (usuário) quiser forçar uma sincronização ou passar um recado rápido para o próximo agente, use o script:

```bash
./scripts/commit_swarm_handoff.sh "Claude, pare o que está fazendo e corrija os testes"
```

Isso grava a mensagem no topo da memória compartilhada.
