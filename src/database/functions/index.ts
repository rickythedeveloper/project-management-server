import { DataTable, DataTableProperty, OmitID, OurQueryResultRow } from '../structure';
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

export const rowWithIDExists = async (table: DataTable, id: number): Promise<boolean> => {
	const results = await pool.query(`SELECT * FROM ${DataTable[table]} WHERE id=$1`, [id]);
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

export const getRows = async <T extends DataTable>(table: T, IDs?: number[]): Promise<DataTableProperty<T>[]> => {
	if (IDs === undefined) {
		const results = await pool.query<DataTableProperty<T>>(`SELECT * FROM ${DataTable[table]}`);
		return results.rows;
	} else {
		let idString = '';
		for (let i = 1; i <= IDs.length; i++) {
			idString = idString.concat(`$${i}`);
			if (i < IDs.length) idString = idString.concat(', ');
		}
		const results = await pool.query<DataTableProperty<T>>(`SELECT * FROM ${DataTable[table]} WHERE id in (${idString})`, IDs);
		if (IDs.length !== results.rows.length) {
			console.log(`Requested projects with IDs ${IDs} but only got ${results.rows.map(row => row.id)}`);
		}
		return results.rows;
	}
};

export const editRow = async <T extends DataTable>(table: T, id: number, properties: Partial<OmitID<DataTableProperty<T>>>): Promise<void> => {
	if (!await rowWithIDExists(table, id)) throw new Error(`Cannot update a ${DataTable[table]} that does not exist`);

	let queryString = `UPDATE ${DataTable[table]} SET `;
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

export const deleteRow = async <T extends DataTable>(table: T, id: number): Promise<void> => {
	if (!await rowWithIDExists(table, id))
		throw new Error(`Cannot delete a ${DataTable[table]} that does not exist.`);
	pool.query(`DELETE FROM ${DataTable[table]} WHERE id=$1`, [id]);
};
