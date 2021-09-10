import { Pool, QueryConfig } from 'pg';
import { PROD } from '../constants';
import { OurQueryResultRow, UserProject, OmitID, UserAccount, Table, Project, Ticket, Metric, MetricOption, TicketAssignee } from './tables';

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
	if (rows.length !== 1) throw new Error(`There should only be ${title}`);
	return rows[0];
};

const rowWithIDExists = async (table: Table, id: number): Promise<boolean> => {
	const query: QueryConfig = {
		text: `
			SELECT * FROM ${Table[table]}
			WHERE id=$1
		`,
		values: [id],
	};
	const rows = await makeDatabaseQuery<Metric>(query);
	return rows.length === 1;
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

const getHighestIndexInProject = async (projectID: number): Promise<number> => {
	const query: QueryConfig = {
		text: `
			SELECT highest_index FROM projects WHERE id=$1
		`,
		values: [projectID],
	};
	const rows = await makeDatabaseQuery<{ highest_index: number }>(query);
	const row = checkForOne(rows, 'highest index');
	return row.highest_index;
};

const incrementHighestIndexInProject = async (projectID: number): Promise<void> => {
	const query: QueryConfig = {
		text: `
			UPDATE projects SET highest_index = highest_index + 1 WHERE id=$1
		`,
		values: [projectID],
	};
	await makeDatabaseQuery(query);
};

export const addTicketToProject = async (ticket: Omit<Ticket, 'id' | 'index_in_project'>): Promise<Ticket> => {
	const highestIndex = await getHighestIndexInProject(ticket.project_id);
	const query: QueryConfig = {
		text: `
		INSERT INTO ${Table[Table.tickets]} (project_id, created_user_id, index_in_project, title)
		VALUES ($1, $2, $3, $4) RETURNING *
		`,
		values: [ticket.project_id, ticket.created_user_id, highestIndex + 1, ticket.title],
	};
	const rows = await makeDatabaseQuery<Ticket>(query);
	const newTicket = checkForOne(rows, 'new ticket');
	await incrementHighestIndexInProject(ticket.project_id);
	return newTicket;
};

export const addMetricToProject = async (metric: OmitID<Metric>): Promise<Metric> => {
	const query: QueryConfig = {
		text: `
			INSERT INTO ${Table[Table.metrics]} (project_id, title)
			VALUES ($1, $2) RETURNING *
		`,
		values: [metric.project_id, metric.title],
	};
	const rows = await makeDatabaseQuery<Metric>(query);
	const newMetric = checkForOne(rows, 'new metric');
	return newMetric;
};

const getHighestOptionIndexInMetric = async (metricID: number): Promise<number | null>=> {
	const query: QueryConfig = {
		text: `
			SELECT index_in_metric FROM ${Table[Table.metric_options]}
			WHERE metric_id=$1
		`,
		values: [metricID],
	};
	const rows = await makeDatabaseQuery<Pick<MetricOption, 'index_in_metric'>>(query);
	const indices = rows.map(row => row.index_in_metric);
	if (indices.length === 0) return null;
	return Math.max(...indices);
};

export const addMetricOptionToMetric = async (metricOption: Omit<MetricOption, 'id' | 'index_in_metric'>): Promise<Metric> => {
	if (!await rowWithIDExists(Table.metrics, metricOption.metric_id))
		throw new Error('Could not add an option to a metric that does not exist. Check metric_option.metric_id.');

	const highestIndex = await getHighestOptionIndexInMetric(metricOption.metric_id);
	const query: QueryConfig = {
		text: `
			INSERT INTO ${Table[Table.metric_options]} (metric_id, index_in_metric, option_string)
			VALUES ($1, $2, $3) RETURNING *
		`,
		values: [metricOption.metric_id, highestIndex ? highestIndex + 1 : 1, metricOption.option_string],
	};
	const rows = await makeDatabaseQuery<Metric>(query);
	const newMetric = checkForOne(rows, 'new metric option');
	return newMetric;
};

export const addAssigneeToTicket = async (ticketAssignee: TicketAssignee) => {
	if (
		!await rowWithIDExists(Table.tickets, ticketAssignee.ticket_id) ||
		!await rowWithIDExists(Table.user_accounts, ticketAssignee.assignee_user_id)
	)
		throw new Error('Could not add a ticket assignee pair because either a ticket or a user account with the given IDs did not exist.');

	const query: QueryConfig = {
		text: `
			INSERT INTO ${Table[Table.ticket_assignees]} (ticket_id, assignee_user_id)
			VALUES ($1, $2) RETURNING *;
		`,
		values: [ticketAssignee.ticket_id, ticketAssignee.assignee_user_id],
	};
	const rows = await makeDatabaseQuery(query);
	const newPair = checkForOne(rows, 'new ticket assignee pair');
	return newPair;
};
