import { Pool, PoolClient } from 'pg';
import { DataTable, RelationalTable, UserAccount, UserProject } from '../structure';
import { checkForOne, makeMultiQuery, pool } from '.';

const tableName = RelationalTable[RelationalTable.user_projects];

export const getAllUserProjects = async (): Promise<UserProject[]> => {
	const results = await pool.query<UserProject>(`SELECT * FROM ${tableName}`);
	return results.rows;
};

export const addUserProjectPair = async (user_id: number, project_id: number, existingClient?: PoolClient): Promise<UserProject> => {
	const client: PoolClient | Pool = existingClient ? existingClient : pool;

	const combinationCheckResults = await client.query(`SELECT FROM ${tableName} WHERE user_id=$1 AND project_id=$2`, [user_id, project_id]);
	if (combinationCheckResults.rows.length !== 0) throw new Error('Cannot add a user-project pair that already exists');

	const addPairResult = await client.query<UserProject>(
		`INSERT INTO ${tableName} (user_id, project_id) VALUES ($1, $2) RETURNING *`,
		[user_id, project_id],
	);
	const newUserProject = checkForOne(addPairResult.rows, 'new user-project pair');
	return newUserProject;
};

export const getUsersForProject = async (projectID: number): Promise<UserAccount[]> => {
	return makeMultiQuery(async (client) => {
		const userIDsResults = await client.query<Pick<UserProject, 'user_id'>>(`SELECT user_id FROM ${RelationalTable[RelationalTable.user_projects]} WHERE project_id=$1`, [projectID]);
		const userIDs = userIDsResults.rows.map(row => row.user_id);

		if (userIDs.length === 0) return [];

		let usersQueryString = `SELECT * FROM ${DataTable[DataTable.user_accounts]} WHERE id in (`;
		usersQueryString = usersQueryString.concat(userIDs.map((id, index) => `$${index + 1}`).join(', '));
		usersQueryString = usersQueryString.concat(')');
		console.log(usersQueryString);
		const usersResults = await client.query<UserAccount>(usersQueryString, userIDs);
		const users = usersResults.rows;
		return users;
	});
};
