const { passwordHash } = require('../middleware/auth');
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-admin-password -- "your-password-at-least-12-chars"');
  process.exit(1);
}
console.log(passwordHash(password));
