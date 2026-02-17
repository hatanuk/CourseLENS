import { config } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { QdrantClient } from "@qdrant/js-client-rest"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, "..", ".env") })

const url = process.env.QDRANT_URL
const apiKey = process.env.QDRANT_API_KEY
const collection = process.env.QDRANT_COLLECTION ?? "chunks"

if (!url || !apiKey) {
  console.error("Set QDRANT_URL and QDRANT_API_KEY in .env")
  process.exit(1)
}

const client = new QdrantClient({ url, apiKey })

try {
  const exists = await client.collectionExists(collection)
  if (!exists.exists) {
    console.log(`Collection "${collection}" does not exist`)
    process.exit(0)
  }
  await client.deleteCollection(collection)
  console.log(`Deleted collection "${collection}"`)
} catch (err) {
  console.error(err)
  process.exit(1)
}
