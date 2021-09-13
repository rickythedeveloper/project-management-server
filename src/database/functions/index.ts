import { OmitID, OurQueryResultRow, Table, TableProperty } from '../structure';
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

export const editRow = async <T extends Table>(table: T, id: number, properties: Partial<OmitID<TableProperty<T>>>): Promise<void> => {
	if (!await rowWithIDExists(table, id)) throw new Error(`Cannot update a ${Table[table]} that does not exist`);

	let queryString = `UPDATE ${Table[table]} SET `;
	const values: string[] = [];
	const entries = Object.entries(properties);
	entries.forEach((entry, index) => {
		queryString = queryString.concat(`${entry[0]}=$${index + 1}`);
		if (index < entries.length - 1) queryString = queryString.concat(',');
		queryString = queryString.concat(' ');
		values.push(String(entry[1]));
	});
	queryString = queryString.concat(`WHERE id=$${entries.length + 1}`);
	values.push(String(id));

	console.log('query string', queryString);

	await pool.query(queryString, values);
};

export const deleteRow = async <T extends Table>(table: T, id: number): Promise<void> => {
	if (!await rowWithIDExists(table, id))
		throw new Error(`Cannot delete a ${Table[table]} that does not exist.`);
	pool.query(`DELETE FROM ${Table[table]} WHERE id=$1`, [id]);
};
