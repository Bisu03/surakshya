import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const ENV_FILE = resolve(process.cwd(), ".env.local");
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema(
      {
        username: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: String, default: "Staff" },
        pageAccess: { type: [String], default: [] },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true },
    ),
  );

function parseEnv(contents) {
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getArguments() {
  const values = {};

  for (let index = 2; index < process.argv.length; index += 1) {
    const argument = process.argv[index];

    if (argument === "--help" || argument === "-h") {
      values.help = true;
      continue;
    }

    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const [rawKey, inlineValue] = argument.slice(2).split(/=(.*)/s, 2);
    const value = inlineValue ?? process.argv[++index];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${rawKey}`);
    }

    values[rawKey] = value;
  }

  return values;
}

function printUsage() {
  console.log(`
Seed the first administrator account.

Usage:
  node scripts/seedAdmin.mjs --username "Admin" --email "admin@example.com" --password "strong-password"

Alternatively, set SEED_ADMIN_USERNAME, SEED_ADMIN_EMAIL, and
SEED_ADMIN_PASSWORD in the environment and run:
  node scripts/seedAdmin.mjs
`.trim());
}

async function loadLocalEnv() {
  try {
    parseEnv(await readFile(ENV_FILE, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function seedAdmin() {
  const args = getArguments();

  if (args.help) {
    printUsage();
    return;
  }

  await loadLocalEnv();

  const username = (args.username ?? process.env.SEED_ADMIN_USERNAME)?.trim();
  const email = (args.email ?? process.env.SEED_ADMIN_EMAIL)
    ?.trim()
    .toLowerCase();
  const password = args.password ?? process.env.SEED_ADMIN_PASSWORD;
  const mongoUrl = process.env.NEXT_APP_MONGO_URL;

  if (!mongoUrl) {
    throw new Error(
      `NEXT_APP_MONGO_URL is not defined in ${ENV_FILE} or the environment.`,
    );
  }

  if (!username || !email || !password) {
    printUsage();
    throw new Error("Username, email, and password are required.");
  }

  if (!email.includes("@")) {
    throw new Error("Provide a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("The admin password must contain at least 8 characters.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUrl);
  console.log("MongoDB connected.");

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log(`No changes made: a user with email ${email} already exists.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    username,
    email,
    password: hashedPassword,
    role: "Admin",
    pageAccess: [],
    isActive: true,
  });

  console.log(`Admin user created successfully: ${email}`);
}

try {
  await seedAdmin();
} catch (error) {
  console.error(`Failed to seed admin: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
