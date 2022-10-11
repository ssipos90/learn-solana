import { Keypair } from "@solana/web3.js";
import { readFile } from "fs/promises";

export async function createKeypairFromFile(
  filePath: string,
): Promise<Keypair> {
  const secretKeyString = await readFile(filePath, { encoding: 'utf8' });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

  return Keypair.fromSecretKey(secretKey);
}
