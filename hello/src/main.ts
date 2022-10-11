import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from "@solana/web3.js";
import { readFile } from "fs/promises";
import path from "path";

const PROGRAM_KEYPAIR_PATH = path.join(
  path.resolve(process.cwd(), "../dist/program"),
  'program-keypair.json'
);

async function main() {
  console.log("launching client");

  const connection = new Connection("https://api.devnet.solana.com", 'confirmed');

  const secretKeyString = await readFile(PROGRAM_KEYPAIR_PATH, { encoding: 'utf8' });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const programKeypair = Keypair.fromSecretKey(secretKey);

  const programId: PublicKey = programKeypair.publicKey;

  const triggerKeypair = Keypair.generate();
  const airdropRequest = await connection.requestAirdrop(
    triggerKeypair.publicKey,
    LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction(airdropRequest);

  const instruction = new TransactionInstruction({
    programId,
    data: Buffer.alloc(0),
    keys: [{ pubkey: triggerKeypair.publicKey, isSigner: false, isWritable: true }],
  });

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [triggerKeypair],
  );
}

main()
  .catch(e => console.error(e));
