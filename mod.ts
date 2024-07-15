#!/usr/bin/env bun

const ALGORITHM = "aes-256-ctr";
const IV_LENGTH = 16;

import { open, unlink, rename } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const [_, __, mode, ...args] = Bun.argv;

switch (mode) {
  case "--generate-key":
    generateKey();
    break;

  case "--encrypt":
    encrypt(...(args as [string, string]));
    break;

  case "--decrypt":
    decrypt(...(args as [string, string, string]));
    break;

  default:
    console.log("Usage:");
    console.log("  ./mod.ts --generate-key");
    console.log("  ./mod.ts --encrypt file.png keyKeyKey");
    console.log("  ./mod.ts --decrypt file.png.enc keyKeyKey iviviv");
}

function generateKey() {
  console.log("Generating key...");
  const key = randomBytes(32).toString("hex");
  console.log(`Your random key is: ${key}`);
}

async function encrypt(file: string, key: string) {
  console.log(`Encrypting file "${file}" with key: ${key}`);

  const temporaryEncryptedFilePath =
    file + "." + randomBytes(4).toString("hex") + ".enc";

  const input = (await open(file)).createReadStream();
  const output = (
    await open(temporaryEncryptedFilePath, "wx")
  ).createWriteStream();

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(key, "hex"), iv);

  await pipeline(input, cipher, output);

  await unlink(file);
  await rename(temporaryEncryptedFilePath, file);

  console.log(`File successfully encrypted, the IV is: ${iv.toString("hex")}`);
}

async function decrypt(file: string, key: string, iv: string) {
  console.log(`Decrypting file "${file}" with key "${key}" and IV "${iv}".`);

  const temporaryDecryptedFilePath =
    file + "." + randomBytes(4).toString("hex") + ".dec";

  const input = (await open(file)).createReadStream();
  const output = (
    await open(temporaryDecryptedFilePath, "wx")
  ).createWriteStream();

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  await pipeline(input, decipher, output);

  await unlink(file);
  await rename(temporaryDecryptedFilePath, file);

  console.log(`File decrypted.`);
}
