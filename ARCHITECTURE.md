# Arquitetura do Sistema — FVelloso SMS

Este documento detalha o desenho arquitetural do **FVelloso SMS (siteRDO)**, seus módulos de domínio, regras de dependência, padrões de projeto e diretrizes para manutenção e expansão contínua.

---

## 1. Visão Geral e Princípios Arquiteturais

A aplicação foi estruturada segundo o padrão **Monólito Modular + Feature-Based Architecture + Clean Architecture Simplificada**, incorporando conceitos práticos de **Arquitetura Hexagonal (Ports & Adapters)** nos pontos de integração com banco de dados e serviços externos.

A arquitetura foi projetada para ser mantida com extrema agilidade por um único engenheiro com auxílio de agentes de IA, priorizando:
1. **Baixo acoplamento e alta coesão:** cada módulo funcional possui seu próprio domínio, regras e casos de uso isolados.
2. **Independência do Domínio:** as regras de negócio centrais (cálculo de HH, validação de registros, matriz de risco, consolidação de relatórios) são funções puras em TypeScript, sem qualquer dependência de React, Next.js ou Drizzle.
3. **Fonte Única de Verdade:** constantes de fallback e regras de cálculo não são duplicadas entre telas ou rotas de API.
4. **Resiliência Operacional:** todas as rotas e casos de uso possuem degradação graciosa caso o banco PostgreSQL esteja temporariamente indisponível.
5. **Zero Complexidade Acidental:** sem microsserviços, sem filas desnecessárias, sem injeção de dependência pesada ou classes abstratas vazias.

---

## 2. Estrutura de Diretórios

```text
src/
├── app/                              # Camada Web / Delivery (Next.js App Router)
│   ├── (auth)/login/                 # Autenticação e sessão
│   ├── dashboard/                    # Painel executivo e qualidade
│   ├── rdo/                          # Visões de RDO (Lista, Calendário, Histograma)
│   ├── rso/                          # Relatório Semanal consolidado
│   ├── apr/                          # Wizard de APR e Base SST
│   ├── perfil/                       # Dados funcionais do usuário
│   └── api/                          # Route Handlers REST (delegam para application)
│
├── modules/                          # Módulos Funcionais Coesos
│   ├── rdo/                          # Registro Diário de Obra
│   │   ├── domain/                   # Cálculos de HH, validações, tipos
│   │   ├── application/              # Casos de uso (create, get, delete)
│   │   ├── infrastructure/           # Repositório Drizzle
│   │   └── index.ts                  # Contrato público do módulo
│   ├── rso/                          # Relatório Semanal de Obra
│   │   ├── domain/                   # Cálculos de agregação semanal
│   │   ├── application/              # Caso de uso getWeeklyRso
│   │   └── index.ts
│   ├── apr/                          # Análise Preliminar de Riscos
│   │   ├── domain/                   # Matriz de risco 3x3, máquina de estados, regras
│   │   └── index.ts
│   ├── sst/                          # Base de Conhecimento e Segurança
│   │   ├── domain/                   # NRs, medidas de controle
│   │   ├── infrastructure/           # Motor de busca (trigramas) e OpenAI adapter
│   │   └── index.ts
│   ├── quality/                      # Gestão da Qualidade
│   │   ├── domain/                   # Cálculo do Índice de Qualidade (RN03)
│   │   └── index.ts
│   ├── projects/                     # Obras e Projetos
│   │   ├── domain/                   # Entidade Project, constantes estáticas
│   │   ├── application/              # Caso de uso getProjects
│   │   └── index.ts
│   └── users/                        # Usuários e Perfis
│       ├── domain/                   # Entidade UserProfile, perfil padrão
│       ├── application/              # getProfile, updateProfile
│       └── index.ts
│
├── shared/                           # Recursos Compartilhados Transversais
│   ├── components/                   # AppLayout, TopHeader, Sidebar, BottomNav, ui.tsx
│   ├── errors/                       # AppError padronizado
│   └── types/                        # Tipos utilitários globais
│
├── context/                          # Estado Reativo Global de Interface
│   └── AppContext.tsx                # Obra ativa, perfil e rascunhos locais
│
└── db/                               # Acesso a Dados
    ├── index.ts                      # Instância singleton do Drizzle ORM
    └── schema.ts                     # Schema compartilhado do PostgreSQL
```

---

## 3. Responsabilidade das Camadas

### 3.1. Camada de Domínio (`domain/`)
- Contém entidades, tipos puros, invariantes e regras matemáticas/lógicas.
- **Regra de Ouro:** Não importa React, Next.js, Drizzle ou PostgreSQL.
- **Exemplos Reais:**
  - `calculateTotalHh` (`src/modules/rdo/domain/calculations.ts`): Calcula jornada padrão (8h, 4h ou 0h), efetivo próprio + terceirizado e horas extras.
  - `calcularNivel` (`src/modules/apr/domain/risk-matrix.ts`): Aplica a Matriz $3 \times 3$ ($P \times S$) e retorna o nível textual e símbolo romano (I a IV).
  - `calculateQualityScore` (`src/modules/quality/domain/calculations.ts`): Deduz 2,5% por ocorrência respeitando piso de 88%.
  - `canTransitionAprStatus` (`src/modules/apr/domain/state-machine.ts`): Valida transições de estado da APR, garantindo imutabilidade de registros aprovados.

### 3.2. Camada de Aplicação (`application/`)
- Orquestra os casos de uso do sistema.
- Executa validações de domínio, calcula valores necessários e interage com as portas de repositório.
- **Exemplos Reais:**
  - `createRdo` (`src/modules/rdo/application/create-rdo.ts`): Valida dados mínimos, computa dia da semana, calcula HH e persiste atomicamente.
  - `getWeeklyRso` (`src/modules/rso/application/get-weekly-rso.ts`): Consulta RDOs do período e gera agregação de indicadores e fotos.
  - `getProjects` (`src/modules/projects/application/get-projects.ts`): Garante fallback transparente quando o banco estiver indisponível.

### 3.3. Camada de Infraestrutura (`infrastructure/`)
- Implementa o acesso a banco de dados (Drizzle ORM), serviços de IA (OpenAI) e algoritmos em memória (trigramas).
- Encapsula erros de banco, impedindo vazamento de exceptions não tratadas para a camada web.

### 3.4. Camada de Apresentação e Rotas Web (`app/` e `components/`)
- Route Handlers (`src/app/api/*/route.ts`): Apenas recebem a requisição HTTP, extraem parâmetros, chamam o caso de uso correspondente e retornam a resposta formatada com tratamento de `AppError`.
- Componentes React: Focam exclusivamente em layout, feedback visual e interação com o usuário, delegando cálculos de negócio para as funções de domínio.

---

## 4. Estratégia de Testes Automatizados

O projeto utiliza o **Test Runner Nativo do Node 22** (`node --test --experimental-strip-types`), garantindo execução instantânea (sub-segundo) sem necessidade de dependências pesadas externas.

### Como rodar os testes:
```bash
# Executa todos os testes unitários do domínio
npm test

# Executa verificação estrita de tipagem TypeScript
npm run typecheck
```

### Escopo Atual de Testes:
- `src/modules/rdo/domain/calculations.test.ts`: 9 testes cobrindo todas as variações de jornada, efetivo e horas extras.
- `src/modules/rdo/domain/rules.test.ts`: 5 testes cobrindo dias da semana e validações obrigatórias de RDO.
- `src/modules/rso/domain/calculations.test.ts`: 2 testes de consolidação semanal de HH e efetivo.
- `src/modules/apr/domain/risk-matrix.test.ts`: 4 testes cobrindo todos os quadrantes da Matriz $3 \times 3$.
- `src/modules/apr/domain/state-machine.test.ts`: 7 testes validando transições de estado e imutabilidade de aprovação.
- `src/modules/quality/domain/calculations.test.ts`: 4 testes de dedução de qualidade e piso mínimo.

---

## 5. Diretrizes para Adição de Novas Funcionalidades

Ao criar uma nova funcionalidade (ex.: relatórios de medição ou checklist de máquinas):
1. Crie o diretório em `src/modules/<nome>/`.
2. Escreva as regras puras em `domain/` acompanhadas de seus testes unitários em `domain/*.test.ts`.
3. Implemente os casos de uso em `application/`.
4. Implemente as queries Drizzle em `infrastructure/`.
5. Exporte a API pública do módulo em `src/modules/<nome>/index.ts`.
6. Conecte as rotas de API em `src/app/api/` e os componentes visuais em `src/app/`.
7. Execute `npm run typecheck && npm test` antes de considerar a tarefa concluída.

