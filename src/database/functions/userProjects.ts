import { UserProject, Table } from '../structure';
import { pool, checkForOne } from '.';
import { PoolClient, Pool } from 'pg';

export const getAllUserProjects = async (): Promise<UserProject[]> => {
	const results = await pool.query<UserProject>(`SELECT * FROM ${Table[Table.user_projects]}`);
	return results.rows;
};

export const addUserProjectPair = async (user_id: number, project_id: number, existingClient?: PoolClient): Promise<UserProject> => {
	const client: PoolClient | Pool = existingClient ? existingClient : pool;

	const combinationCheckResults = await client.query(`SELECT FROM ${Table[Table.user_projects]} WHERE user_id=$1 AND project_id=$2`, [user_id, project_id]);
	if (combinationCheckResults.rows.length !== 0) throw new Error('Cannot add a user-project pair that already exists');

	const addPairResult = await client.query<UserProject>(
		`INSERT INTO ${Table[Table.user_projects]} (user_id, project_id) VALUES ($1, $2) RETURNING *`,
		[user_id, project_id],
	);
	const newUserProject = checkForOne(addPairResult.rows, 'new user-project pair');
	return newUserProject;
};
