# Security Specification for AI Reflection Journal

## 1. Data Invariants & Zero-Trust ABAC
- **Strict User Isolation**: Journal entries belong strictly to their author (`userId == request.auth.uid`). No cross-user access is permitted.
- **Path ID Integrity**: Document IDs must match regex `^[a-zA-Z0-9_\-]+$` and have length <= 128.
- **Data Completeness & Bounds**: String lengths (content <= 15000, title <= 200) and list constraints (tags size <= 10) are enforced on writes.
- **Immutable Keys**: `userId` and `createdAt` must remain immutable across updates.
- **Secure List Enforcer**: List queries on `/entries` MUST enforce `resource.data.userId == request.auth.uid`.
- **Private Profiles**: `/users/{userId}` is strictly readable and writable only by the authenticated user whose `request.auth.uid == userId`.

## 2. The "Dirty Dozen" Threat Scenarios
1. Unauthenticated reading of `/entries/{id}` -> DENIED
2. User A reading User B's `/entries/{id}` -> DENIED
3. User A querying `/entries` without filtering by their own `userId` -> DENIED
4. User A creating an entry with User B's `userId` -> DENIED
5. User updating an entry and modifying `userId` or `createdAt` -> DENIED
6. User injecting a 100KB title or 500 tags -> DENIED
7. User A writing to User B's `/users/{userId}` profile -> DENIED
8. Unauthenticated write to catch-all non-existent collection -> DENIED
9. User updating someone else's journal entry -> DENIED
10. User creating an entry with invalid path ID characters -> DENIED
11. User deleting another user's journal entry -> DENIED
12. Shadow update injecting arbitrary unauthorized fields -> DENIED
