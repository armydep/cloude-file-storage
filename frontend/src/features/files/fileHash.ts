import { sha256 } from "js-sha256"

export async function calculateSha256(file: File): Promise<string> {
  const chunkSize = 64 * 1024 // 64KB chunks to keep memory footprint constant
  let offset = 0
  const hashObject = sha256.create()

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize)
    const buffer = await chunk.arrayBuffer()
    hashObject.update(new Uint8Array(buffer))
    offset += chunkSize
  }

  return hashObject.hex()
}
