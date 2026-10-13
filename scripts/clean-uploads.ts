// Lists uploaded images that no article uses (not as a cover and not inside its text),
// and deletes them when asked. Images uploaded in the last day are left alone: they may
// belong to an article that is still being written and has not been saved.
// Run: npm run uploads:clean            (only lists)
//      npm run uploads:clean -- --delete
import { referencedUploads } from "../lib/articles/repository.ts";
import { deleteStoredImage, listStoredImages } from "../lib/uploads.ts";
import { openScriptDatabase } from "./open-db.ts";

const GRACE_MS = 24 * 60 * 60 * 1000;
const remove = process.argv.includes("--delete");

const { db } = openScriptDatabase();
const used = await referencedUploads(db);
const files = await listStoredImages();
const cutoff = Date.now() - GRACE_MS;

const abandoned = files.filter(
  (file) => !used.has(file.name) && file.modifiedAt.getTime() < cutoff,
);

console.log(`${files.length} uploaded file(s), ${used.size} in use, ${abandoned.length} abandoned.`);
for (const file of abandoned) {
  if (remove) await deleteStoredImage(file.name);
  console.log(`${remove ? "deleted" : "unused "}  ${file.name}  ${Math.round(file.bytes / 1024)} KB`);
}
if (abandoned.length > 0 && !remove) {
  console.log("Nothing was deleted. Run again with -- --delete to remove them.");
}
