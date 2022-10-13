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
import { start as startREPL } from "repl";

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
  connection: Connection,
  localKeypair: Keypair,
}

((async function main() {
  console.log("Launching client.");

  const connection: Connection = new Connection("https://api.devnet.solana.com", 'confirmed');
  console.log("Connected to network.");

  const localKeypair: Keypair = await getLocalAccount();
  console.log("Retrieved local keypair.");

  const config = {
    connection,
    localKeypair,
  };

  const repl = startREPL({
    prompt: 'uv> ',
    terminal: true,
    useGlobal: false
  });

  Object.assign(repl.context, {
    async run(name: string, seed: string) {
      const programStuff = programs.get(name);
      if (!programStuff) {
        throw new Error(`Invalid program name ${name}.`);
      }

      console.log(`Running program ${name}.`);

      const keypair = await getProgram(name);

      console.log(`Program ID: ${keypair.publicKey.toBase58()}`);

      const program: Program = {
        name,
        keypair
      };

      const clientPubkey: PublicKey = await configureClientAccount({
        accountSpaceSize: programStuff.size,
        connection,
        localKeypair,
        programId: program.keypair.publicKey,
        seed,
      });
      console.log("Configured client accounts.");

      await pingProgram(config, clientPubkey, program);
    },
    async airdrop() {
      await connection.confirmTransaction(
        await connection.requestAirdrop(
          localKeypair.publicKey,
          LAMPORTS_PER_SOL
        )
      );
      console.log("Recieved airdrop.");
    },
  });
})())
  .catch(e => console.error(e));

async function getLocalAccount(): Promise<Keypair> {
  const configYml = await readFile(CONFIG_FILE_PATH, { encoding: 'utf8' });
  console.log(configYml);
  const keypairPath = yaml.parse(configYml).keypair_path;

  return createKeypairFromFile(keypairPath);
}

async function getProgram(name: string): Promise<Keypair> {
  return await createKeypairFromFile(
    path.join(PROGRAM_PATH, name + '-keypair.json')
  );
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

interface Program {
  name: string;
  keypair: Keypair;
}

async function pingProgram(config: Config, clientPubkey: PublicKey, program: Program) {
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: clientPubkey, isSigner: false, isWritable: true }],
    programId: program.keypair.publicKey,
    data: Buffer.alloc(0),
  });

  await sendAndConfirmTransaction(
    config.connection,
    new Transaction().add(instruction),
    [config.localKeypair]
  );

  console.log("Ping successful.");
}
