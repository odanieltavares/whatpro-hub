# Templates de Conversas Realistas - v3.0

## Estrutura de Templates

Cada template contém:
- **tipo**: Identificador único
- **departamento**: Vendas, Suporte, Financeiro, Pós-Venda
- **produto**: O que está sendo solicitado
- **valor**: Valor estimado (se aplicável)
- **tipo_cliente**: Novo, Recorrente, VIP
- **origem**: Instagram, Google, Facebook, Indicação, WhatsApp
- **urgencia**: baixa, media, alta
- **mensagens**: Array de mensagens com tons humanizados

---

## Templates Disponíveis

### 1. VENDAS - Orçamento Site
**Contexto:** Cliente quer site institucional  
**Fluxo:** Cliente → SDR → Vendedor  
**Tom:** Casual e amigável  

### 2. VENDAS - E-commerce
**Contexto:** Cliente quer loja online  
**Fluxo:** Cliente → SDR → Vendedor  
**Tom:** Profissional e consultivo  

### 3. SUPORTE - Problema Técnico
**Contexto:** Sistema não funciona  
**Fluxo:** Cliente → SDR → Suporte  
**Tom:** Urgente mas calmo  

### 4. SUPORTE - Dúvida de Uso
**Contexto:** Cliente não sabe usar funcionalidade  
**Fluxo:** Cliente → SDR → Suporte  
**Tom:** Educado e paciente  

### 5. FINANCEIRO - Dúvida Boleto
**Contexto:** Cliente não recebeu cobrança  
**Fluxo:** Cliente → SDR → Financeiro  
**Tom:** Formal e direto  

### 6. FINANCEIRO - Negociação
**Contexto:** Cliente quer desconto/parcelamento  
**Fluxo:** Cliente → SDR → Financeiro  
**Tom:** Negocial  

### 7. PÓS-VENDA - Feedback Positivo
**Contexto:** Cliente elogiando serviço  
**Fluxo:** Cliente → Pós-venda  
**Tom:** Agradecido e feliz  

### 8. PÓS-VENDA - Reclamação
**Contexto:** Cliente insatisfeito  
**Fluxo:** Cliente → SDR → Pós-venda  
**Tom:** Firme mas educado  

### 9. VENDAS - Indicação
**Contexto:** Cliente indicado por outro  
**Fluxo:** Cliente → SDR → Vendedor  
**Tom:** Caloroso e receptivo  

### 10. SUPORTE - Manutenção
**Contexto:** Cliente quer manutenção/atualização  
**Fluxo:** Cliente → SDR → Suporte  
**Tom:** Técnico mas acessível  

---

## Personalidades dos Agentes

### SDR (Triagem)
- **João Silva**: Amigável, usa emojis, casual
- **Maria Costa**: Profissional, objetiva, cordial
- **Carlos Lima**: Empático, paciente, detalhista
- **Ana Santos**: Energética, proativa, dinâmica

### Vendedores
- **Ana Santos**: Consultiva, focada em valor
- **Bruno Sales**: Direto, objetivo, números
- **Carla Vendas**: Relacional, storytelling

### Suporte
- **Pedro Tech**: Técnico mas didático
- **Julia Support**: Paciente, passo a passo
- **Marcos IT**: Experiente, resolve rápido

### Financeiro
- **Roberto Finance**: Formal, preciso
- **Luciana Bills**: Empática, flexível
- **Fernando Cash**: Direto, processos

### Pós-Venda
- **Patricia Care**: Empática, resolutiva
- **Diego Service**: Atencioso, follow-up
- **Renata Success**: Proativa, antecipatória

---

## Variações de Tom

### CASUAL
```
"Oi! Tudo bem?"
"Que legal que gostou!"
"Show de bola!"
"Fico super feliz em ajudar 😊"
```

### PROFISSIONAL
```
"Bom dia!"
"Certamente podemos auxiliar"
"Vou verificar imediatamente"
"Fico à disposição"
```

### URGENTE
```
"Preciso de ajuda urgente!"
"É crítico!"
"Pode me atender agora?"
"Não está funcionando!"
```

### EMPÁTICO
```
"Entendo perfeitamente sua situação"
"Vamos resolver isso juntos"
"Pode deixar comigo"
"Vou te ajudar agora mesmo"
```

### TÉCNICO
```
"Vamos fazer o seguinte:"
"O procedimento é:"
"Segue o passo a passo:"
"Tecnicamente falando..."
```

---

## Boas Práticas

1. **Variar comprimento das mensagens**
   - Curtas: "Oi!", "Entendi", "Perfeito!"
   - Médias: "Que legal! Vou te ajudar com isso"
   - Longas: Explicações detalhadas

2. **Usar emojis naturalmente**
   - Não exagerar
   - Contexto apropriado
   - Variar por personalidade

3. **Tempo de resposta**
   - SDR: Imediato (segundos)
   - Especialista: Minutos
   - Cliente: Varia

4. **Transferências claras**
   - Sempre avisar antes
   - Apresentar quem vai atender
   - Contexto mantido

5. **Fechamento adequado**
   - Resumir ações
   - Próximos passos claros
   - Agradecer

---

## Exemplo de Nota Privada Completa

```
📋 TRIAGEM SDR - João Silva

COD. CLIENTE: COD-2024-0157
PROTOCOLO: #WP-2024-001234

RESUMO DA SOLICITAÇÃO:
Cliente solicita orçamento para desenvolvimento de site 
institucional. Consultoria de marketing digital. Quer 
8-10 páginas, design moderno e responsivo. Urgência: 
precisa lançar em 30 dias.

CONTEXTO ADICIONAL:
- Tipo: VIP
- Origem: Instagram
- Valor estimado: R$ 8.000 - R$ 12.000
- Departamento: Vendas
- Urgência: Alta (prazo + perfil VIP)
- Preferência: WhatsApp
- Melhor horário: Manhã (9h-12h)

QUALIFICAÇÃO:
✓ Budget adequado
✓ Necessidade clara
✓ Timeline definida
✓ Tomador de decisão
✓ Fit com nosso serviço

AÇÕES REALIZADAS:
✓ Dados básicos coletados
✓ Interesse qualificado (BANT OK)
✓ Prioridade definida: Alta
✓ Transferido para: Ana Santos (Vendas)
✓ Etiquetas aplicadas: vendas, orcamento, vip

HISTÓRICO DO CLIENTE:
- Cliente desde 2020
- Compras anteriores: 3 (R$ 32.000 total)
- NPS último atendimento: 10
- Indicou 2 novos clientes
- Sempre renova contratos

PRÓXIMOS PASSOS:
→ Ana: Enviar proposta em até 2h (SLA VIP)
→ Agendar call para amanhã 10h
→ Preparar cases similares
→ Follow-up: 24h se não responder
→ Meta: Fechar em 7 dias

OBSERVAÇÕES:
Cliente muito satisfeito historicamente. Alta chance 
de conversão. Potencial para upsell em marketing digital 
após entrega do site. Tratar com prioridade máxima.
```

---

## Exemplo de Nota de Contato (Histórico)

```
📝 HISTÓRICO DO CLIENTE

CLIENTE VIP - Alta Prioridade ⭐

═══════════════════════════════════════

📊 DADOS GERAIS:
- Cliente desde: 15/01/2020
- Total investido: R$ 32.000,00
- Número de projetos: 3
- NPS médio: 9.7/10
- Status pagamento: Sempre em dia

═══════════════════════════════════════

🛒 COMPRAS ANTERIORES:

1. Site E-commerce (15/08/2023)
   Valor: R$ 15.000
   Status: Entregue ✓
   Feedback: "Excelente trabalho!"
   
2. Sistema de Gestão (10/02/2023)
   Valor: R$ 12.000
   Status: Entregue ✓
   Feedback: "Superou expectativas"
   
3. Landing Page (05/09/2022)
   Valor: R$ 3.000
   Status: Entregue ✓
   Feedback: "Rápido e eficiente"
   
4. Manutenção Mensal
   Valor: R$ 600/mês
   Status: Ativo (renovado 2x)

═══════════════════════════════════════

👥 RELACIONAMENTO:

Indicações feitas:
• Maria Silva (fechou R$ 8k)
• Pedro Santos (fechou R$ 5k)

Participação em programas:
• Programa de indicação: Ativo
• Beta tester: Sim (novos produtos)

═══════════════════════════════════════

💡 PREFERÊNCIAS:

Comunicação:
- Canal preferido: WhatsApp ⭐
- Horário ideal: 9h - 12h
- Estilo: Objetivo e direto
- Velocidade resposta: Rápida

Pagamento:
- Forma preferida: PIX
- Sempre paga adiantado
- Histórico: 0 atrasos

Projetos:
- Gosta de acompanhar de perto
- Aprecia reuniões semanais
- Valoriza transparência
- Prefere entregas incrementais

═══════════════════════════════════════

🎯 POTENCIAL FUTURO:

Upsell identificado:
→ Marketing digital (interesse demonstrado)
→ Automações (perguntou sobre)
→ Aplicativo mobile (mencionou)

Possível LTV (3 anos): R$ 80.000

═══════════════════════════════════════

📝 OBSERVAÇÕES IMPORTANTES:

✓ Cliente extremamente satisfeito
✓ Sempre renova contratos
✓ Responde rapidamente
✓ Recomenda para network
✓ Aberto a novos produtos
✓ Confia na equipe
✓ Baixa manutenção

⚠️ ATENÇÕES:
• Valoriza prazo acima de tudo
• Não gosta de surpresas
• Aprecia comunicação proativa

═══════════════════════════════════════

🏆 CLASSIFICAÇÃO: VIP GOLD
Próxima revisão: Trimestral
Responsável conta: Ana Santos (Vendas)
```

---

**Desenvolvido para WhatPro Chat v3.0** 🚀
