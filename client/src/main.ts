import path from "path";
import os from "os";
import yaml from "yaml";
import {
  Connection, Keypair, LAMPORTS_PER_SOL,
  PublicKey, sendAndConfirmTransaction,
  SystemProgram, Transaction, TransactionInstruction
} from "@solana/web3.js";
import { readFile } from "fs/promises";
import { createKeypairFromFile } from "./util";
import { programs } from "./programs";

const CONFIG_FILE_PATH = path.resolve(
  os.homedir(),
  ".config",
  "solana",
  "cli",
  "config.yml",
);

const PROGRAM_PATH = path.resolve(
  process.cwd(),
  "..",
  "dist",
  "program",
);

interface Config {
  clientPubkey: PublicKey,
  connection: Connection,
  localKeypair: Keypair,
  programId: PublicKey,
  programKeypair: Keypair,
}

((async function main() {
  console.log("Launching client.");

  const programName = process.argv[3];
  if (typeof programName !== 'string') {
    console.error(`Invalid argument, missing program name.`);
    process.exit(1);
  }

  const programStuff = programs.get(programName);
  if (!programStuff) {
    console.error(`Invalid program name ${programName}.`);
    process.exit(2);
  }

  console.log(`Running program ${programName}.`);

  const connection: Connection = new Connection("https://api.devnet.solana.com", 'confirmed');
  console.log("Connected to network.");

  const localKeypair: Keypair = await getLocalAccount();
  console.log("Retrieved local keypair.");

  await connection.confirmTransaction(
    await connection.requestAirdrop(
      localKeypair.publicKey,
      LAMPORTS_PER_SOL
    )
  );
  console.log("Recieved airdrop.");

  const [programKeypair, programId]: [Keypair, PublicKey] = await getProgram(
    programName
  );
  console.log("Retrieved program keys.");

  const clientPubkey: PublicKey = await configureClientAccount({
    accountSpaceSize: programStuff.size,
    connection,
    localKeypair,
    programId,
    seed: "test1",
  });
  console.log("Configured client accounts.");

  const config = {
    clientPubkey,
    connection,
    localKeypair,
    programId,
    programKeypair,
  };

  await pingProgram(config, programName);
})())
  .catch(e => console.error(e));

async function getLocalAccount(): Promise<Keypair> {
  const configYml = await readFile(CONFIG_FILE_PATH, { encoding: 'utf8' });
  console.log(configYml);
  const keypairPath = yaml.parse(configYml).keypair_path;

  return createKeypairFromFile(keypairPath);
}

async function getProgram(programName: string): Promise<[Keypair, PublicKey]> {
  const programKeypair = await createKeypairFromFile(
    path.join(PROGRAM_PATH, programName + '-keypair.json')
  );
  const programId = programKeypair.publicKey;

  console.log(`Program ID: ${programId.toBase58()}`);

  return [programKeypair, programId];
}

interface ClientAccountConfig {
  accountSpaceSize: number;
  connection: Connection;
  localKeypair: Keypair;
  programId: PublicKey;
  seed: string;
}

async function configureClientAccount({
  accountSpaceSize,
  connection,
  localKeypair,
  programId,
  seed,
}: ClientAccountConfig): Promise<PublicKey> {
  const clientPubkey = await PublicKey.createWithSeed(
    localKeypair.publicKey,
    seed,
    programId,
  );
  console.log(`Client seed: ${seed}`);
  console.log(`Client ID: ${clientPubkey.toBase58()}`);
  const clientAccount = await connection.getAccountInfo(clientPubkey);

  if (clientAccount === null) {
    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        basePubkey: localKeypair.publicKey,
        fromPubkey: localKeypair.publicKey,
        lamports: LAMPORTS_PER_SOL,
        newAccountPubkey: clientPubkey,
        programId,
        seed,
        space: accountSpaceSize,
      })
    );
    await sendAndConfirmTransaction(connection, transaction, [localKeypair]);
    console.log('Created a new client account.');
  } else {
    console.log('Account exists, reusing...');
  }

  return clientPubkey;
}

async function pingProgram(config: Config, programName: string) {
  console.log(`Pinging program ${programName}...`);

  const instruction = new TransactionInstruction({
    keys: [{ pubkey: config.clientPubkey, isSigner: false, isWritable: true }],
    programId: config.programId,
    data: Buffer.alloc(0),
  });

  await sendAndConfirmTransaction(
    config.connection,
    new Transaction().add(instruction),
    [config.localKeypair]
  );

  console.log("Ping successful.");
}
