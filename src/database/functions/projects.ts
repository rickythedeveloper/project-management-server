import { DataTable, OmitID, Project, UserProject } from '../structure';
import { checkForOne, makeMultiQuery, pool, rowWithIDExists } from '.';
import { addUserProjectPair } from './userProjects';

export const addProjectToUser = async (project: OmitID<Project>): Promise<{ project: Project; userProject: UserProject }> => {
	if (!await rowWithIDExists(DataTable.user_accounts, project.owner_user_id)) throw new Error('Cannot add a project to a non-existent user.');

	const projectNameResults = await pool.query<Pick<Project, 'name'>>(`SELECT name FROM ${DataTable[DataTable.projects]} WHERE owner_user_id=$1`, [project.owner_user_id]);
	const projectNames = projectNameResults.rows.map(row => row.name);
	if (projectNames.indexOf(project.name) !== -1) throw new Error('Cannot add a project of the same name for the same user');

	return makeMultiQuery(async (client) => {
		const projectResults = await client.query<Project>(
			`INSERT INTO ${DataTable[DataTable.projects]} (name, owner_user_id)  VALUES ($1, $2) RETURNING *`,
			[project.name, project.owner_user_id],
		);
		const newProject = checkForOne(projectResults.rows, 'new proejct');

		const newUserProject = await addUserProjectPair(newProject.owner_user_id, newProject.id, client);
		return { project: newProject, userProject: newUserProject };
	});
};
