import { OmitID, Project, Table, UserProject } from '../structure';
import { checkForOne, deleteRow, editRow, makeMultiQuery, pool, rowWithIDExists } from '.';
import { addUserProjectPair } from './userProjects';

export const addProjectToUser = async (project: OmitID<Project>): Promise<{ project: Project; userProject: UserProject }> => {
	if (!await rowWithIDExists(Table.user_accounts, project.owner_user_id)) throw new Error('Cannot add a project to a non-existent user.');

	const projectNameResults = await pool.query<Pick<Project, 'name'>>(`SELECT name FROM ${Table[Table.projects]} WHERE owner_user_id=$1`, [project.owner_user_id]);
	const projectNames = projectNameResults.rows.map(row => row.name);
	if (projectNames.indexOf(project.name) !== -1) throw new Error('Cannot add a project of the same name for the same user');

	return makeMultiQuery(async (client) => {
		const projectResults = await client.query<Project>(
			`INSERT INTO ${Table[Table.projects]} (name, owner_user_id)  VALUES ($1, $2) RETURNING *`,
			[project.name, project.owner_user_id],
		);
		const newProject = checkForOne(projectResults.rows, 'new proejct');

		const newUserProject = await addUserProjectPair(newProject.owner_user_id, newProject.id, client);
		return { project: newProject, userProject: newUserProject };
	});
};

export const getProject = async (id: number): Promise<Project> => {
	const results = await pool.query<Project>(`SELECT * FROM ${Table[Table.projects]} WHERE id=$1`, [id]);
	if (results.rows.length === 0) throw new Error(`Could not find a project with id ${id}`);
	const project = results.rows[0];
	return project;
};

export const getProjects = async (...IDs: number[]): Promise<Project[]> => {
	if (IDs.length === 0) {
		const results = await pool.query<Project>(`SELECT * FROM ${Table[Table.projects]}`);
		const projects = results.rows;
		return projects;
	} else {
		const projects: Project[] = [];
		IDs.forEach(async id => {
			try {
				projects.push(await getProject(id));
			} catch (error) {
				console.log(`Could not find a project with id ${id}`);
			}
		});
		return projects;
	}
};

export const editProject = async (id: number, properties: Partial<OmitID<Project>>) => {
	console.log(properties);
	await editRow(Table.projects, id, properties);
};

export const deleteProject = async (id: number) => {
	await deleteRow(Table.projects, id);
};
