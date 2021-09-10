import { OurQueryResultRow, Table } from '../structure';
import { Pool, PoolClient } from 'pg';
import { PROD } from '../../constants';

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: PROD ? { rejectUnauthorized: false } : false,
});

export const checkForOne = <T extends OurQueryResultRow>(rows: T[], title :string): T => {
	if (rows.length !== 1) throw new Error(`There should only be ${title}`);
	return rows[0];
};

export const rowWithIDExists = async (table: Table, id: number): Promise<boolean> => {
	const results = await pool.query(`SELECT * FROM ${Table[table]} WHERE id=$1`, [id]);
	return results.rows.length === 1;
};

export const makeMultiQuery = async <T>(queries: (client: PoolClient) => Promise<T>): Promise<T> => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const returnObject = await queries(client);
		await client.query('COMMIT');
		return returnObject;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

