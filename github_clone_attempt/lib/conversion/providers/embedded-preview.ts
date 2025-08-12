import JSZip from 'jszip'

// Best-effort extraction of embedded QuickLook/Preview.pdf from iWork files.
// Works for many modern .pages/.numbers/.key (they are ZIP containers with QuickLook previews).
// Returns a Buffer of the PDF preview if found, otherwise null.
export async function extractEmbeddedPdf(input: Buffer): Promise<Buffer | null> {
  // Quick zip signature checks (PK\x03\x04 or empty zip PK\x05\x06)
  if (input.length < 4) return null
  const sig = input.subarray(0, 4).toString('binary')
  if (sig !== 'PK\x03\x04' && sig !== 'PK\x05\x06') return null

  const zip = await JSZip.loadAsync(input).catch(() => null)
  if (!zip) return null

  const candidateNames = [
    'QuickLook/Preview.pdf',
    'QuickLook/preview.pdf',
    'preview.pdf',
    'Preview.pdf',
    'QuickLook/Thumbnail.pdf',
  ]

  // Create case-insensitive lookup
  const filesByLower = new Map<string, string>()
  Object.keys(zip.files).forEach((name) => filesByLower.set(name.toLowerCase(), name))

  for (const name of candidateNames) {
    const found = filesByLower.get(name.toLowerCase())
    if (found) {
      const file = zip.file(found)
      if (file) {
        const buf = await file.async('nodebuffer')
        // quick sanity check for PDF header
        if (buf.subarray(0, 5).toString('utf8') === '%PDF-') return buf
      }
    }
  }
  return null
}

