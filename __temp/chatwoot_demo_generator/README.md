# 🚀 WhatPro Chat - Gerador de Demos Mockadas

Sistema automatizado para gerar demos personalizadas por nicho no Chatwoot, facilitando apresentações de vendas do seu SaaS.

## 📋 Índice

- [Sobre](#sobre)
- [Nichos Disponíveis](#nichos-disponíveis)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Exemplos](#exemplos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Personalização](#personalização)

---

## 🎯 Sobre

Este sistema permite criar **demos realistas e personalizadas** para diferentes nichos de negócio, facilitando a apresentação do WhatPro Chat para potenciais clientes.

### ✨ Principais Recursos

- ✅ **9 nichos pré-configurados** com templates realistas
- ✅ **Geração automatizada** em 5-10 minutos
- ✅ **Dados em português brasileiro** usando Faker
- ✅ **Conversas contextualizadas** por nicho
- ✅ **Limpeza fácil** após apresentação
- ✅ **Personalizável** - fácil adicionar novos nichos

---

## 🏪 Nichos Disponíveis

| Nicho | Template | Conversas | Características |
|-------|----------|-----------|-----------------|
| **Contabilidade** | `contabilidade.json` | 35 | Declarações, MEI, folha de pagamento |
| **Concessionária** | `concessionaria.json` | 40 | Test-drive, financiamento, avaliações |
| **Peças para Moto** | `pecas-moto.json` | 38 | Peças, equipamentos, instalação |
| **Paróquia** | `paroquia.json` | 35 | Sacramentos, pastorais, eventos |
| **E-commerce** | `ecommerce.json` | 45 | Pedidos, rastreamento, trocas |
| **Saúde/Clínica** | `saude.json` | 35 | Consultas, exames, agendamentos |
| **Imobiliária** | `imobiliaria.json` | 38 | Alugar, comprar, visitas |
| **Restaurante** | `restaurante.json` | 50 | Delivery, reservas, cardápio |
| **Educação** | `educacao.json` | 36 | Matrículas, mensalidades, eventos |

---

## 🔧 Instalação

### Pré-requisitos

- Python 3.8 ou superior
- Acesso ao Chatwoot (instância própria ou cloud)
- API Key do Chatwoot

### 1. Clone ou baixe o projeto

```bash
# Se você tem o projeto em um repositório
git clone https://github.com/seu-usuario/chatwoot-demo-generator.git
cd chatwoot-demo-generator

# OU apenas crie a pasta e copie os arquivos
mkdir chatwoot_demo_generator
cd chatwoot_demo_generator
```

### 2. Instale as dependências

```bash
pip install faker requests --break-system-packages
```

> **Nota**: As dependências também são instaladas automaticamente na primeira execução.

---

## ⚙️ Configuração

### 1. Obter credenciais do Chatwoot

1. Faça login no seu Chatwoot
2. Vá em **Configurações** > **Perfil** > **Access Token**
3. Copie sua **API Key**
4. Anote o **ID da conta** (visível na URL: `/app/accounts/{ID}/`)

### 2. Configurar variáveis de ambiente

**Opção A: Arquivo .env (Recomendado)**

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais
nano .env
```

Preencha:
```bash
CHATWOOT_API_URL=https://app.chatwoot.com
CHATWOOT_API_KEY=sua-chave-api-aqui
CHATWOOT_ACCOUNT_ID=1
```

**Opção B: Variáveis de ambiente diretas**

```bash
export CHATWOOT_API_URL="https://app.chatwoot.com"
export CHATWOOT_API_KEY="sua-chave-api"
export CHATWOOT_ACCOUNT_ID="1"
```

---

## 🚀 Como Usar

### Listar nichos disponíveis

```bash
python gerar_demo.py --list
```

### Gerar demo para um nicho

```bash
python gerar_demo.py --nicho NOME_DO_NICHO
```

### Gerar demo com nome personalizado

```bash
python gerar_demo.py --nicho contabilidade --empresa "Escritório Silva Contabilidade"
```

### Limpar demos

```bash
# Limpar TUDO (cuidado!)
python limpar_demo.py --tudo

# Limpar apenas uma inbox específica
python limpar_demo.py --inbox "Escritório de Contabilidade Demo"
```

---

## 📚 Exemplos Práticos

### Exemplo 1: Demo para prospect de contabilidade

```bash
# Gerar demo personalizada
python gerar_demo.py --nicho contabilidade --empresa "Contabilidade João Silva"

# Resultado:
# ✅ Inbox criada: "Contabilidade João Silva"
# ✅ 25 contatos criados
# ✅ 35 conversas com contexto de contabilidade
# ✅ Etiquetas: declaracao-ir, mei, folha-pagamento, etc.
```

### Exemplo 2: Demo rápida de e-commerce

```bash
# Gerar com nome padrão
python gerar_demo.py --nicho ecommerce

# Resultado:
# ✅ Inbox: "E-commerce / Loja Virtual Demo"
# ✅ 30 contatos
# ✅ 45 conversas sobre pedidos, rastreamento, trocas
```

### Exemplo 3: Apresentação para paróquia

```bash
python gerar_demo.py --nicho paroquia --empresa "Paróquia São José"

# Conversas sobre:
# - Batismos, casamentos, primeira comunhão
# - Horários de missas
# - Pastorais e grupos
```

### Exemplo 4: Workflow completo de vendas

```bash
# 1. Prospect entra em contato
# "Tenho uma concessionária, quero ver o sistema"

# 2. Você gera a demo em 5 minutos
python gerar_demo.py --nicho concessionaria --empresa "AutoCar Veículos"

# 3. Apresenta a demo
# 4. Após a reunião, limpa os dados
python limpar_demo.py --inbox "AutoCar Veículos"
```

---

## 📁 Estrutura do Projeto

```
chatwoot_demo_generator/
│
├── gerar_demo.py              # Script principal de geração
├── limpar_demo.py             # Script de limpeza
├── .env.example               # Exemplo de configuração
├── README.md                  # Esta documentação
│
└── templates/                 # Templates por nicho
    ├── contabilidade.json
    ├── concessionaria.json
    ├── pecas-moto.json
    ├── paroquia.json
    ├── ecommerce.json
    ├── saude.json
    ├── imobiliaria.json
    ├── restaurante.json
    └── educacao.json
```

---

## 🎨 Personalização

### Adicionar novo nicho

1. Crie um arquivo JSON em `templates/`:

```json
{
  "nome": "Meu Novo Nicho",
  "descricao": "Descrição do nicho",
  "num_contatos": 25,
  "num_conversas": 30,
  "etiquetas": ["tag1", "tag2", "tag3"],
  "custom_attributes": {
    "atributo1": ["valor1", "valor2"],
    "atributo2": ["valor3", "valor4"]
  },
  "exemplo_mensagens": {
    "cliente": [
      "Mensagem exemplo 1 do cliente",
      "Mensagem exemplo 2 do cliente"
    ],
    "agente": [
      "Resposta exemplo 1 do agente",
      "Resposta exemplo 2 do agente"
    ]
  }
}
```

2. Salve como `templates/meu-nicho.json`

3. Use normalmente:
```bash
python gerar_demo.py --nicho meu-nicho
```

### Modificar templates existentes

Basta editar o arquivo JSON do nicho desejado em `templates/`.

Você pode:
- Adicionar mais mensagens
- Criar novas etiquetas
- Ajustar quantidade de contatos/conversas
- Personalizar atributos customizados

---

## 💡 Dicas de Uso

### Para Vendas

1. **Antes da reunião**: Gere a demo 5-10 minutos antes
2. **Durante apresentação**: Mostre conversas reais do nicho do cliente
3. **Após reunião**: Limpe os dados para liberar espaço

### Para Múltiplas Demos Simultâneas

Você pode ter várias demos ativas ao mesmo tempo:

```bash
python gerar_demo.py --nicho ecommerce --empresa "Loja A"
python gerar_demo.py --nicho saude --empresa "Clínica B"
python gerar_demo.py --nicho educacao --empresa "Escola C"
```

### Estratégia Híbrida

Mantenha sempre:
- **1 demo genérica** (e-commerce ou restaurante)
- **Templates dos seus 3-5 nichos principais**
- **Geração sob demanda** para prospects importantes

---

## 🔒 Segurança

- ✅ Use variáveis de ambiente para credenciais
- ✅ Nunca commite o arquivo `.env` no git
- ✅ Use API Keys com permissões adequadas
- ✅ Confirme antes de limpar dados (`--force` pula confirmação)

---

## 🆘 Solução de Problemas

### Erro: "Falha ao criar inbox"

- Verifique se as credenciais estão corretas
- Confirme que a API Key tem permissões
- Teste a conexão com o Chatwoot

### Erro: "Template não encontrado"

- Use `python gerar_demo.py --list` para ver os nichos disponíveis
- Verifique se o nome está correto (case-sensitive)

### Conversas não aparecem

- Aguarde alguns segundos após a geração
- Recarregue a página do Chatwoot
- Verifique se a inbox foi criada corretamente

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique esta documentação
2. Revise os exemplos
3. Entre em contato com o suporte técnico

---

## 🎉 Próximos Passos

Depois de dominar o básico:

1. ✅ Crie templates personalizados para seus nichos principais
2. ✅ Ajuste as mensagens para refletir seu tom de marca
3. ✅ Configure um processo padrão de vendas com demos
4. ✅ Treine a equipe de vendas no uso do sistema

---

## 📝 Licença

Este projeto é parte do WhatPro Chat e deve ser usado apenas internamente.

---

**Desenvolvido com ❤️ para o time WhatPro Chat**
