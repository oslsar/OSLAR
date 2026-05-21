import { pool } from "./db";

export async function getItems() {
  const sql = `
    select *
    from medtrack.items
    order by name
  `;

  const result = await pool.query(sql);

  return result.rows;
}