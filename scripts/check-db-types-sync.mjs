// Fails if the two apps' generated database types have drifted apart. Both apps read one Supabase schema, so the files must match byte for byte.
// They are duplicated rather than shared because each app builds from its own root directory on Vercel and cannot import across app boundaries.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const paths = [
  'apps/admin/src/lib/supabase/types.ts',
  'apps/marketing/src/lib/supabase/types.ts',
]

const [admin, marketing] = paths.map((p) => readFileSync(join(root, p), 'utf8'))

if (admin !== marketing) {
  console.error('Database types are out of sync between apps.')
  console.error(`  ${paths[0]}`)
  console.error(`  ${paths[1]}`)
  console.error('\nCopy the updated file over the other, then re-run:')
  console.error(`  cp ${paths[0]} ${paths[1]}`)
  process.exit(1)
}

console.log('Database types are in sync.')
