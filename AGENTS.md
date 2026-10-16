# Diretrizes para Agentes de IA — FVelloso SMS

Este documento estabelece as regras obrigatórias que qualquer agente de IA ou desenvolvedor automatizado deve seguir ao analisar, modificar ou estender o código do **FVelloso SMS**.

---

## 1. Regras Mandatórias de Engenharia

1. **Inspecione o Módulo Antes de Modificar:**
   - Antes de alterar qualquer arquivo, leia `ARCHITECTURE.md` e o `index.ts` do módulo correspondente em `src/modules/<modulo>/`.
   - Entenda as fronteiras entre `domain/`, `application/` e `infrastructure/`.

2. **Respeite as Fronteiras Arquiteturais:**
   - **NUNCA** coloque regras de negócio, cálculos matemáticos ou validações complexas diretamente dentro de componentes React (`page.tsx`, `components/`) ou em Route Handlers (`route.ts`).
   - Route Handlers devem ter no máximo 15–30 linhas e atuar como adaptadores HTTP que delegam para os casos de uso em `application/`.

3. **Mantenha o Domínio Puro:**
   - Arquivos dentro de `src/modules/*/domain/` **não podem** importar React, Next.js, Drizzle ORM, classes de banco de dados ou bibliotecas de UI.
   - Funções de domínio devem ser puras, determinísticas e fáceis de testar.

4. **Reutilize as Regras Existentes (Zero Duplicação):**
   - Não recrie cálculos de Homens-Hora ($HH$). Use `calculateTotalHh` e `calculateTotalWorkers` de `@/modules/rdo`.
   - Não recrie cálculos de Score de Qualidade. Use `calculateQualityScore` de `@/modules/quality`.
   - Não recrie cálculos de Matriz de Risco $3 \times 3$. Use `calcularNivel` de `@/modules/apr`.
   - Não recrie consolidações semanais. Use `calculateRsoSummary` de `@/modules/rso`.
   - Não recrie listas de obras ou perfis padrão. Importe `STATIC_PROJECTS` de `@/modules/projects` e `DEFAULT_PROFILE` de `@/modules/users`.

5. **Integridade do Banco de Dados:**
   - O banco de dados é um PostgreSQL único gerenciado pelo Drizzle ORM (`src/db/`).
   - **NUNCA** execute `drizzle-kit push`, `DROP TABLE`, `ALTER TABLE` destrutivo ou migrações que quebrem compatibilidade sem aprovação explícita do usuário.
   - Todas as queries devem ser resilientes: inclua fallbacks com `try/catch` para que o frontend continue funcional mesmo se o banco estiver indisponível localmente.

6. **Preservação de Contratos Públicos:**
   - **Rotas Públicas:** Nunca altere as URLs das páginas (`/dashboard`, `/rdo`, `/rso`, `/apr`, `/perfil`, `/login`) ou das APIs (`/api/rdos`, `/api/rso`, `/api/projects`, etc.).
   - **Persistência do Navegador:** Mantenha as chaves de `localStorage` (`rdo_draft_v1`, `rdo_active_project_id`, `rdo_user_session`) e os cookies de sessão (`fv_usuario`, `fv_obra`).
   - **Imutabilidade Histórica:** APRs no status `aprovada` são imutáveis e possuem snapshots textuais dos itens vinculados. Nunca altere uma APR aprovada.

7. **Testes Obrigatórios:**
   - Qualquer regra de cálculo ou validação nova ou alterada deve vir acompanhada de testes unitários no padrão Node 22 (`*.test.ts`).
   - **SEMPRE** execute `npm run typecheck && npm test` antes de reportar a conclusão da tarefa.

---

## 2. Padrão de Implementação de um Novo Caso de Uso

Ao criar uma nova operação em um módulo existente (ex.: `src/modules/rdo`):

```text
1. Domain:
   - Se houver nova regra, adicione em src/modules/rdo/domain/rules.ts
   - Adicione testes em src/modules/rdo/domain/rules.test.ts

2. Application:
   - Crie o caso de uso em src/modules/rdo/application/<acao>-rdo.ts
   - Valide entradas usando as regras de domínio
   - Invoque o repositório

3. Infrastructure:
   - Implemente o método no DrizzleRdoRepository se novas queries forem necessárias

4. Export:
   - Exporte a função pública em src/modules/rdo/index.ts

5. Route Handler:
   - Invoque o caso de uso em src/app/api/...
```

---

## 3. Checklist de Conclusão de Tarefa

Antes de entregar qualquer alteração:
- [ ] `npm run typecheck` executou e retornou código 0.
- [ ] `npm test` executou e todos os testes passaram (código 0).
- [ ] Nenhuma rota pública ou contrato de API foi quebrado.
- [ ] Nenhuma regra de negócio ficou solta dentro de componentes visuais.
- [ ] O comportamento do usuário final foi 100% preservado.

