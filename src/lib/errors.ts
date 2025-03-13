export class PermissionError extends Error {
  constructor(message: string = 'Permissão insuficiente') {
    super(message);
    this.name = 'PermissionError';
  }
}

export class EmailNotVerifiedError extends Error {
  constructor(message: string = 'Email não verificado') {
    super(message);
    this.name = 'EmailNotVerifiedError';
  }
}

export function isFirebasePermissionError(error: any): boolean {
  return error?.message?.includes('Missing or insufficient permissions') ||
         error?.code === 'permission-denied';
}
