import DOMPurify from 'isomorphic-dompurify';

export function sanitizeSvg(buffer: Buffer): Buffer {
  const svgString = buffer.toString('utf-8');
  const clean = DOMPurify.sanitize(svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'foreignObject'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
  return Buffer.from(clean, 'utf-8');
}
