const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

function sanitizeHtml(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(String(dirty), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}

function sanitizePlainText(text) {
  if (!text) return '';
  return String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = { sanitizeHtml, sanitizePlainText };
