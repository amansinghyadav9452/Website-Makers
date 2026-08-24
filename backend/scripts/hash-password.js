const { hashPassword } = require('../middleware/auth');
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-admin-password -- "your-strong-password"');
  process.exit(1);
}
console.log(hashPassword(password));
