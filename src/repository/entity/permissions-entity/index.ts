export default class PermissionEntity {
  public readonly Permissions: {
    READ?: string[];
    UPDATE?: string[];
    DELETE?: string[];
  };
}
