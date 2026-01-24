import {sqliteTable, text, integer, index, real } from "drizzle-orm/sqlite-core";
import {baseEntity} from "./columns.helpers.ts";

export const scrapers = sqliteTable("scrapers", {
    ...baseEntity,
    url: text("url").unique(),
    name: text("name").notNull(),
    image_url: text("image_url"),
    enabled: integer({mode: 'boolean'}),
});

export const auctions = sqliteTable("auctions", {
    ...baseEntity,
    url: text().unique(),
    title: text("title").notNull(),
    description: text("description"),
    startDate: integer({mode: 'timestamp'}),
    endDate: integer({mode: 'timestamp'}),
    itemsCount: text("items").notNull(),

    scraperId: integer("scraper_id").references(() => scrapers.id)
}, (table) => [
    index("scraper_index").on(table.scraperId)
]);

export const auctionItem = sqliteTable("auction_items", {
    ...baseEntity,
    url: text("url").unique(),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    currentPrice: real("current_price"),
    bidCount: integer("bid_count").notNull().default(0),

    mainCategoryId: integer("main_category_id").references(() => categories.id),
    auctionId: integer("auction_id").references(() => auctions.id)
})

export const categories = sqliteTable("categories", {
    ...baseEntity,
    name: text("name").notNull(),
    description: text("description"),
    isSystem: integer({mode: 'boolean'}),
})

export const categoryProbability = sqliteTable("category_probability", {
    ...baseEntity,
    probability: real("probability"),

    categoryId: integer("category_id").references(() => categories.id),
    itemId: integer("item_id").references(() => auctionItem.id)
})