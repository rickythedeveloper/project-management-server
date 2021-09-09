import { Pool, QueryConfig } from 'pg';
import { PROD } from '../constants';
import { OurQueryResultRow, UserProject, OmitID, UserAccount, Table, Project } from './tables';

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

const checkForOne = <T extends OurQueryResultRow>(rows: T[], title :string): T => {
	if (rows.length !== 1) throw new Error(`More than one ${title} has been created at once`);
	return rows[0];
};

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
	const newUser = checkForOne(result, 'user');
	return newUser;
};

const addUserProjectPair = async (user_id: number, project_id: number): Promise<UserProject> => {
	const userProjectPairQuery: QueryConfig = {
		text: `
			INSERT INTO ${Table[Table.user_projects]} (user_id, project_id)
			VALUES ($1, $2) RETURNING *
		`,
		values: [user_id, project_id],
	};
	const newPairs = await makeDatabaseQuery<UserProject>(userProjectPairQuery);
	const newPair = checkForOne(newPairs, 'user-project pair');
	return newPair;
};

const addProject = async (project: OmitID<Project>): Promise<Project> => {
	const query: QueryConfig = {
		text: `
			INSERT INTO ${Table[Table.projects]} (name, owner_user_id) 
			VALUES ($1, $2) RETURNING *
		`,
		values: [project.name, project.owner_user_id],
	};
	const newProjects = await makeDatabaseQuery<Project>(query);
	const newProject = checkForOne(newProjects, 'project');
	return newProject;
};

export const addProjectToUser = async (project: OmitID<Project>): Promise<Project> => {
	const newProject = await addProject(project);
	try {
		await addUserProjectPair(newProject.owner_user_id, newProject.id);
	} catch (error) {
		// TODO remove that project before throwing the error.
		throw Error('Could not add a user-project pair to the database, so deleting the new project altogether');
	}
	return newProject;
};
