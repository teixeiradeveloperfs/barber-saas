import { hashPassword } from '../src/admin/auth/admin-auth.service.js';

const password = process.argv[2];
if (!password) {
  console.error('Uso: pnpm admin:hash <senha>');
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
