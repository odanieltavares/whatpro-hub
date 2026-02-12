# Internal Chat Layout V2

## Goal
Replicar o layout do `chat-interno` no chat interno de produção e sandbox, com Tailwind custom e melhorias técnicas (A11y, estrutura, reuso e performance), mantendo a aparência idêntica.

## Tasks
- [ ] Mapear estrutura visual do `chat-interno` e componentizar layout V2 em `features/internalChat/components` → Verify: componentes criados e usados sem `@/components/ui/*`.
- [ ] Refatorar `InternalChatPage.tsx` para usar layout V2 com dados reais → Verify: `/chat` renderiza 3 colunas + perfil lateral + tela de perfil.
- [ ] Refatorar `InternalChatMockPage.tsx` para usar layout V2 → Verify: `/chat/sandbox` renderiza layout completo sem header/tabs antigos.
- [ ] Atualizar rotas para `/chat` e `/chat/sandbox` fora do `MainLayout` → Verify: telas full-screen.
- [ ] Ajustar CSS global (scrollbar + scrollbar-hide) → Verify: favoritos com scrollbar invisível, scrollbar fino e consistente.

## Done When
- [ ] `/chat` e `/chat/sandbox` exibem layout idêntico ao `chat-interno`, full-screen, sem UI lib.
