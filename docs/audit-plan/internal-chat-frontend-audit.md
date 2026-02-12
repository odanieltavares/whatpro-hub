# Internal Chat Frontend Audit

Date: 2026-02-11  
Scope: `/chat` and `/chat/sandbox` UI + state flow (React Query + Zustand)

## 1) Critical Errors Observed

### 1.1 Maximum update depth exceeded
**Symptom**
- React error boundary on `/chat`: "Maximum update depth exceeded".

**Likely Causes**
- Unstable snapshots from Zustand selectors returning new references during render.
- Repeated store updates from query sync effects when React Query updates the same data reference or replays data without value changes.

**Evidence**
- Console warning: "The result of getSnapshot should be cached to avoid an infinite loop".
- Error occurs inside `InternalChatPage` render tree.

**Fixes Applied**
- Store selectors memoized to return stable references when inputs are unchanged.
- Store now uses `createWithEqualityFn` with `shallow` to avoid re-renders on shallow-equal snapshots.
- Query sync effects now depend on `dataUpdatedAt` only and guard updates via refs.

## 2) State Flow Map

```
React Query
  -> useChatSettings/useRooms/useMessages
      -> guarded upsert into Zustand
          -> UI subscribes to Zustand slices
```

**Key Risk Area**
- Any selector returning fresh arrays/objects every render can break React 18 `useSyncExternalStore` expectations and cause infinite loops.

## 3) High-Risk Files

- `apps/frontend/src/features/internalChat/hooks/useChatHooks.ts`
- `apps/frontend/src/features/internalChat/store/useInternalChatStore.ts`
- `apps/frontend/src/features/internalChat/hooks/useInternalChatData.ts`
- `apps/frontend/src/features/internalChat/pages/InternalChatPage.tsx`
- `apps/frontend/src/features/internalChat/pages/InternalChatMockPage.tsx`

## 4) Gaps vs Spec/Backlog (Frontend)

### Missing or Partial (Front-End)
- Attachments upload flow and preview UX
- Full mentions notifications (backend driven)
- Presence / online status UX (partial)
- Moderation tools (pin limits, delete policies, audit logs)
- Advanced search and filtering
- Pagination controls for older history beyond virtualized list
- Per-room roles & permissions UI (partial)
- Reactions persistence (only local state for now)

## 5) Recommended Next Steps

1. Validate `/chat` error is gone after selector stabilization.
2. Add runtime logging for store update loops if the error persists.
3. Add backend fields (e.g., `last_message_author_id`) to enable read receipts in list without opening rooms.
