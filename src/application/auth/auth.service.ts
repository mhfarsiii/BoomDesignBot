import type { AuthorizedUserIdsProvider } from "./types/auth-config.types";

export class AuthService {
  private readonly allowedUserIds: ReadonlySet<number>;

  constructor(provider: AuthorizedUserIdsProvider) {
    this.allowedUserIds = new Set(provider.getAllowedUserIds());
  }

  isAuthorized(userId: number): boolean {
    if (!Number.isInteger(userId) || userId <= 0) {
      return false;
    }

    return this.allowedUserIds.has(userId);
  }
}
