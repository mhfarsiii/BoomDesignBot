export interface AuthConfig {
  allowedUserIds: number[];
}

export interface AuthorizedUserIdsProvider {
  getAllowedUserIds(): number[];
}
