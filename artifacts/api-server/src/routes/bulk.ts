/**
 * GET /api/data  — returns all catalog data in one response (fast initial load)
 * POST /api/data — admin: bulk-replace all entities from a JSON snapshot
 *                  Used for dev→prod seeding and the "Publish Now" admin flow.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import {
  restaurantsTable, branchesTable, categoriesTable, menuItemsTable,
  offersTable, couponsTable, bannersTable, appSettingsTable,
  modifierGroupsTable, modifierOptionsTable, addOnsTable,
  itemModifierLinksTable, branchItemOverridesTable, branchCategoryOverridesTable,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { asyncHandler } from "../lib/validate";
import { eq } from "drizzle-orm";

const router = Router();

/** Public: fetch all catalog + settings data in one roundtrip */
router.get("/data", asyncHandler(async (_req, res) => {
  const [
    restaurants, branches, categories, menuItems,
    offers, coupons, banners, settings,
    modifierGroups, modifierOptions, addOns,
    itemModifierLinks, branchItemOverrides, branchCategoryOverrides,
  ] = await Promise.all([
    db.select().from(restaurantsTable).orderBy(restaurantsTable.sort_order),
    db.select().from(branchesTable),
    db.select().from(categoriesTable).orderBy(categoriesTable.sort_order),
    db.select().from(menuItemsTable).orderBy(menuItemsTable.sort_order),
    db.select().from(offersTable).orderBy(offersTable.sort_order),
    db.select().from(couponsTable),
    db.select().from(bannersTable).orderBy(bannersTable.sort_order),
    db.select().from(appSettingsTable).where(eq(appSettingsTable.id, 1)),
    db.select().from(modifierGroupsTable),
    db.select().from(modifierOptionsTable),
    db.select().from(addOnsTable),
    db.select().from(itemModifierLinksTable),
    db.select().from(branchItemOverridesTable),
    db.select().from(branchCategoryOverridesTable),
  ]);

  res.json({
    restaurants,
    branches,
    categories,
    menu_items: menuItems,
    offers,
    coupons,
    banners,
    settings: settings[0] ?? null,
    modifier_groups: modifierGroups,
    modifier_options: modifierOptions,
    add_ons: addOns,
    item_modifier_links: itemModifierLinks,
    branch_item_overrides: branchItemOverrides,
    branch_category_overrides: branchCategoryOverrides,
  });
}));

/** Admin: bulk-replace all catalog data from a JSON snapshot */
router.post("/data", requireAdmin, asyncHandler(async (req, res) => {
  const {
    restaurants = [], branches = [], categories = [], menu_items = [],
    offers = [], coupons = [], banners = [], settings,
    modifier_groups = [], modifier_options = [], add_ons = [],
    item_modifier_links = [], branch_item_overrides = [], branch_category_overrides = [],
  } = req.body as Record<string, any[]> & { settings?: any };

  // Helper: upsert an array into a table
  async function upsertAll(table: any, rows: any[], pk: string) {
    if (!rows.length) return;
    for (const row of rows) {
      await db.insert(table).values(row)
        .onConflictDoUpdate({ target: table[pk], set: row })
        .catch(() => {}); // skip rows with missing required fields
    }
  }

  await Promise.all([
    upsertAll(restaurantsTable, restaurants, "id"),
    upsertAll(branchesTable, branches, "id"),
    upsertAll(categoriesTable, categories, "id"),
    upsertAll(menuItemsTable, menu_items, "id"),
    upsertAll(offersTable, offers, "id"),
    upsertAll(couponsTable, coupons, "code"),
    upsertAll(bannersTable, banners, "id"),
    upsertAll(modifierGroupsTable, modifier_groups, "id"),
    upsertAll(modifierOptionsTable, modifier_options, "id"),
    upsertAll(addOnsTable, add_ons, "id"),
    upsertAll(itemModifierLinksTable, item_modifier_links, "id"),
    upsertAll(branchItemOverridesTable, branch_item_overrides, "id"),
    upsertAll(branchCategoryOverridesTable, branch_category_overrides, "id"),
  ]);

  // Upsert settings singleton
  if (settings) {
    const [existing] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.id, 1));
    if (existing) {
      await db.update(appSettingsTable).set({ ...settings, id: 1, updated_at: new Date() }).where(eq(appSettingsTable.id, 1));
    } else {
      await db.insert(appSettingsTable).values({ ...settings, id: 1 }).onConflictDoNothing();
    }
  }

  res.json({ success: true });
}));

export default router;
