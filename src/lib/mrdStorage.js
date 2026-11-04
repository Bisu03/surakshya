import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Root directory for MRD document storage.
//
// In production (Docker) this MUST point at a mounted volume so uploaded files
// survive container restarts / rebuilds / redeploys. The Dockerfile creates
// `/app/storage` owned by the runtime user, and docker-compose.yml mounts a
// named volume there. Override with the MRD_STORAGE_PATH env var if needed.
export function getStorageRoot() {
  return (
    process.env.MRD_STORAGE_PATH ||
    path.join(process.cwd(), "storage", "mrd")
  );
}

// Absolute directory for a single folder's files.
export function getFolderDir(folderId) {
  return path.join(getStorageRoot(), String(folderId));
}

// Ensure a folder's directory exists on disk (created recursively). Safe to
// call repeatedly.
export async function ensureFolderDir(folderId) {
  const dir = getFolderDir(folderId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Build a collision-resistant on-disk filename, preserving the extension.
export function makeStoredName(originalName = "") {
  const ext = path.extname(originalName).slice(0, 20);
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

// Resolve the absolute path of a stored file, guarding against path traversal.
export function getFilePath(folderId, storedName) {
  const safeName = path.basename(String(storedName));
  return path.join(getFolderDir(folderId), safeName);
}

// Delete a folder's entire storage directory (and everything inside it).
export async function removeFolderDir(folderId) {
  await fs.rm(getFolderDir(folderId), { recursive: true, force: true });
}

// Delete a single stored file from disk.
export async function removeFile(folderId, storedName) {
  await fs.rm(getFilePath(folderId, storedName), { force: true });
}
