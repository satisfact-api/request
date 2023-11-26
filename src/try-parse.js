export default function tryParse(content) {
  try {
    return JSON.parse(content);
  } catch (_) {
    return content;
  }
}
