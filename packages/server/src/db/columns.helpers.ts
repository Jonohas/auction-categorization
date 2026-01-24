import { int, integer } from "drizzle-orm/sqlite-core";

export const timestamps = {
    createdAt: integer("createdAt", {mode: 'timestamp'}).default(new Date()).notNull(),
    updatedAt: integer("updatedAt", {mode: 'timestamp'}).$onUpdate(() => new Date()),
    deletedAt: integer("updatedAt", {mode: 'timestamp'})
}

export const baseEntity = {
    id: int().primaryKey({ autoIncrement: true }),
    ...timestamps
}