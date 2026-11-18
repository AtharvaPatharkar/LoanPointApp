/**
 * Deprecated: Direct database access from React Native mobile bundle has been decommissioned.
 * All database operations are securely handled through the backend REST API.
 */

export const isDatabaseConfigured = false;

export const getDbClient = (): never => {
  throw new Error(
    'Direct database connections from the mobile client are disabled for security. Use backend REST API.'
  );
};
