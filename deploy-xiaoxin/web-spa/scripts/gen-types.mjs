import fs from 'node:fs/promises'
import path from 'node:path'
import openapiTS, { astToString } from 'openapi-typescript'

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:8000'
const OUT = path.resolve('src/types/generated.ts')

async function main() {
  try {
    const ast = await openapiTS(new URL(`${API_BASE}/api/openapi.json`))
    const types = astToString(ast)
    await fs.mkdir(path.dirname(OUT), { recursive: true })
    await fs.writeFile(OUT, types, 'utf-8')
    console.log(`✅ Generated ${OUT}`)
  } catch (err) {
    console.error(`⚠️ ${err.message}`)
    console.log('Writing placeholder types (backend not ready).')
    await fs.mkdir(path.dirname(OUT), { recursive: true })
    await fs.writeFile(
      OUT,
      '// Placeholder: run again after backend exposes /api/openapi.json\nexport type {}\n',
      'utf-8'
    )
    console.log(`✅ Wrote placeholder ${OUT}`)
  }
}

main()
