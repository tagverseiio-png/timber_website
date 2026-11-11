/**
 * Server-rendered JSON-LD. JSON.stringify does not escape "</script>", so a
 * product name/description containing markup could break out of the script
 * context. Escape "<" the same way Next.js does internally. Use this instead
 * of hand-rolled dangerouslySetInnerHTML JSON-LD scripts.
 */
function scriptEscapedJson(json: unknown): string {
  return JSON.stringify(json).replace(/</g, "\\u003c");
}

export function JsonLd({ json }: { json: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: scriptEscapedJson(json) }}
    />
  );
}
