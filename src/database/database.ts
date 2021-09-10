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
		text: `SELECT * FROM ${Table[table]} WHERE id=$1`,
		values: [id],
	};
	const results = await pool.query(query);
	return results.rows.length === 1;
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
	const results = await pool.query<UserAccount>(query);
	const addedUserAccount = checkForOne(results.rows, 'new user account');
	return addedUserAccount;
};

export const addProjectToUser = async (project: OmitID<Project>): Promise<{ project: Project; userProject: UserProject }> => {
	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		const addProjectQuery: QueryConfig = {
			text: `INSERT INTO ${Table[Table.projects]} (name, owner_user_id)  VALUES ($1, $2) RETURNING *`,
			values: [project.name, project.owner_user_id],
		};
		const projectResults = await client.query<Project>(addProjectQuery);
		const newProject = checkForOne(projectResults.rows, 'new proejct');

		const addUserProjectQuery: QueryConfig = {
			text: ` INSERT INTO ${Table[Table.user_projects]} (user_id, project_id) VALUES ($1, $2) RETURNING *`,
			values: [newProject.owner_user_id, newProject.id],
		};
		const userProjectResults = await client.query<UserProject>(addUserProjectQuery);
		const newUserProject = checkForOne(userProjectResults.rows, 'new user-project pair');

		await client.query('COMMIT');
		return { project: newProject, userProject: newUserProject };
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

export const addTicketToProject = async (ticket: Omit<Ticket, 'id' | 'index_in_project'>): Promise<Ticket> => {
	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		const getHighestIndexInProjectQuery: QueryConfig = {
			text: 'SELECT highest_index FROM projects WHERE id=$1',
			values: [ticket.project_id],
		};
		const highestIndexResults = await client.query(getHighestIndexInProjectQuery);
		const highestIndex = checkForOne(highestIndexResults.rows, 'highest index in project');

		const addTicketQuery: QueryConfig = {
			text: `INSERT INTO ${Table[Table.tickets]} (project_id, created_user_id, index_in_project, title) VALUES ($1, $2, $3, $4) RETURNING *`,
			values: [ticket.project_id, ticket.created_user_id, highestIndex + 1, ticket.title],
		};
		const ticketResults = await client.query(addTicketQuery);
		const addedTicket = checkForOne(ticketResults.rows, 'new ticket');

		const incrementHighestIndexInProjectQuery: QueryConfig = {
			text: 'UPDATE projects SET highest_index = highest_index + 1 WHERE id=$1',
			values: [ticket.project_id],
		};
		await client.query(incrementHighestIndexInProjectQuery);

		await client.query('COMMIT');
		return addedTicket;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

export const addMetricToProject = async (metric: OmitID<Metric>): Promise<Metric> => {
	const query: QueryConfig = {
		text: `INSERT INTO ${Table[Table.metrics]} (project_id, title) VALUES ($1, $2) RETURNING *`,
		values: [metric.project_id, metric.title],
	};
	const results = await pool.query<Metric>(query);
	const newMetric = checkForOne(results.rows, 'new metric');
	return newMetric;
};

export const addMetricOptionToMetric = async (metricOption: Omit<MetricOption, 'id' | 'index_in_metric'>): Promise<MetricOption> => {
	if (!await rowWithIDExists(Table.metrics, metricOption.metric_id))
		throw new Error('Could not add an option to a metric that does not exist. Check metric_option.metric_id.');

	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		const getHighestIndexQuery: QueryConfig = {
			text: `SELECT index_in_metric FROM ${Table[Table.metric_options]} WHERE metric_id=$1`,
			values: [metricOption.metric_id],
		};
		const results = await pool.query<Pick<MetricOption, 'index_in_metric'>>(getHighestIndexQuery);
		const indices = results.rows.map(row => row.index_in_metric);
		if (indices.length === 0) throw new Error('A metric with the specified id could not be found.');
		const highestIndex = Math.max(...indices);

		const addMetricOptionQuery: QueryConfig = {
			text: `
				INSERT INTO ${Table[Table.metric_options]} (metric_id, index_in_metric, option_string)
				VALUES ($1, $2, $3) RETURNING *
			`,
			values: [metricOption.metric_id, highestIndex ? highestIndex + 1 : 1, metricOption.option_string],
		};
		const metricOptionResults = await client.query<MetricOption>(addMetricOptionQuery);
		const newMetricOption = checkForOne(metricOptionResults.rows, 'new metric option');

		await client.query('COMMIT');
		return newMetricOption;

	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

export const addAssigneeToTicket = async (ticketAssignee: TicketAssignee) => {
	if (
		!await rowWithIDExists(Table.tickets, ticketAssignee.ticket_id) ||
		!await rowWithIDExists(Table.user_accounts, ticketAssignee.assignee_user_id)
	)
		throw new Error('Could not add a ticket assignee pair because either a ticket or a user account with the given IDs did not exist.');

	const query: QueryConfig = {
		text: `INSERT INTO ${Table[Table.ticket_assignees]} (ticket_id, assignee_user_id) VALUES ($1, $2) RETURNING *;`,
		values: [ticketAssignee.ticket_id, ticketAssignee.assignee_user_id],
	};
	const results = await pool.query(query);
	const newPair = checkForOne(results.rows, 'new ticket assignee pair');
	return newPair;
};
