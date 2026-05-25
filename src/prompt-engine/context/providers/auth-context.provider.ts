export function getAuthContext(): string {
  return `Authentication Context:
- JWT authentication
- Pinia auth store
- Vue Router guards
- Axios bearer interceptor
- useAuth composable
Reuse existing auth flow; do not introduce alternative auth systems.`;
}
