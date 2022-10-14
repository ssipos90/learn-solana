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
import { start as startREPL } from "repl";
import { calculator, calculatorInstructionLayout, CalculatorInstructionOperation} from "./calculator";

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

interface Program {
  clientPubkey: PublicKey,
  programPubkey: PublicKey,
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

  const context: Record<string, Function> = {
    async run(seed: string, operation: CalculatorInstructionOperation, value: number) {

      const programKeypair = await getProgramKeypair('calculator');

      console.log(`Program ID: ${programKeypair.publicKey.toBase58()}`);

      const clientPubkey: PublicKey = await configureClientAccount({
        accountSpaceSize: calculator.size,
        connection,
        localKeypair,
        programId: programKeypair.publicKey,
        seed,
      });
      console.log("Configured client accounts.");


      const data = Buffer.alloc(calculatorInstructionLayout.span);
      calculatorInstructionLayout.encode({
        operation,
        value
      }, data);

      const program = {
        clientPubkey,
        programPubkey: programKeypair.publicKey
      };

      return pingProgram(config, program, data);
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
  };

  console.log('Available functions: ', Object.keys(context).join(', '));

  const repl = startREPL({
    prompt: 'command> ',
    terminal: true,
    useGlobal: false,
  });

  Object.assign(repl.context, context);
})())
  .catch(e => console.error(e));

async function getLocalAccount(): Promise<Keypair> {
  const configYml = await readFile(CONFIG_FILE_PATH, { encoding: 'utf8' });
  const keypairPath = yaml.parse(configYml).keypair_path;

  return createKeypairFromFile(keypairPath);
}

async function getProgramKeypair(name: string): Promise<Keypair> {
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

async function pingProgram(config: Config, program: Program, data: Buffer) {
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: program.clientPubkey, isSigner: false, isWritable: true }],
    programId: program.programPubkey,
    data,
  });

  return sendAndConfirmTransaction(
    config.connection,
    new Transaction().add(instruction),
    [config.localKeypair]
  );
}
