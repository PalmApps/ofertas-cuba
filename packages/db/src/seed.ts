import { PROVINCES } from "@ofertas-cuba/shared";
import { createDb } from "./client";
import { provinces } from "./schema";

async function main() {
  const db = createDb();
  for (const p of PROVINCES) {
    await db
      .insert(provinces)
      .values({ id: p.id, name: p.name, slug: p.slug })
      .onConflictDoNothing();
  }
  console.log(`Seeded ${PROVINCES.length} provinces`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
