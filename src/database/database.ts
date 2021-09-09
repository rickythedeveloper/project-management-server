import { Pool, QueryConfig } from 'pg';
import { PROD } from '../constants';
import { OurQueryResultRow, UserProject, OmitID, UserAccount, Table } from './tables';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: PROD ? { rejectUnauthorized: false } : false,
});

async function makeDatabaseQuery<R extends OurQueryResultRow, I extends any[] = any[]>(
	queryTextOrConfig: string | QueryConfig<I>, values?: I,
): Promise<R[]> {
	const client = await pool.connect();
	const result = await client.query<R, I>(queryTextOrConfig, values);
	client.release();
	return result.rows;
}

export const getAllUserProjects = async (): Promise<UserProject[]> => makeDatabaseQuery('SELECT * FROM user_projects');

export const addUser = async (user: OmitID<UserAccount>): Promise<UserAccount> => {
	const query: QueryConfig = {
		text: `
			INSERT INTO ${Table[Table.user_accounts]} (username, password_salt, password_hash, name) 
			VALUES ($1, $2, $3, $4) RETURNING *
		`,
		values: [user.username, user.password_salt, user.password_hash, user.name],
	};

	const result = await makeDatabaseQuery<UserAccount>(query);

	if (result.length !== 1) throw new Error('newUsers.length !== 1');
	return result[0];
};
