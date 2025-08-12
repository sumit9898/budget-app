import { describe, expect, it } from 'vitest';
import { SUPPORTED, isValidMapping, inferTypeFromName } from '@/lib/conversion/mappings';

describe('mappings', () => {
  it('validates supported targets', () => {
    expect(isValidMapping('pages', 'docx')).toBe(true);
    expect(isValidMapping('keynote', 'xlsx')).toBe(false);
  });
  it('infers types', () => {
    expect(inferTypeFromName('doc.pages')).toBe('pages');
    expect(inferTypeFromName('deck.key')).toBe('keynote');
  });
});

