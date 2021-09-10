import { Pool, QueryConfig, PoolClient } from 'pg';
import { PROD } from '../constants';
import { OurQueryResultRow, UserProject, OmitID, UserAccount, Table, Project, Ticket, Metric, MetricOption, TicketAssignee } from './tables';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: PROD ? { rejectUnauthorized: false } : false,
});

const checkForOne = <T extends OurQueryResultRow>(rows: T[], title :string): T => {
	if (rows.length !== 1) throw new Error(`There should only be ${title}`);
	return rows[0];
};

const rowWithIDExists = async (table: Table, id: number): Promise<boolean> => {
	const results = await pool.query(`SELECT * FROM ${Table[table]} WHERE id=$1`, [id]);
	return results.rows.length === 1;
};

const makeMultiQuery = async <T>(queries: (client: PoolClient) => Promise<T>): Promise<T> => {
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

export const getAllUserProjects = async (): Promise<UserProject[]> => {
	const results = await pool.query<UserProject>(`SELECT * FROM ${Table[Table.user_projects]}`);
	return results.rows;
};

export const addUser = async (user: OmitID<UserAccount>): Promise<UserAccount> => {
	const results = await pool.query<UserAccount>(
		`INSERT INTO ${Table[Table.user_accounts]} (username, password_salt, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING *`,
		[user.username, user.password_salt, user.password_hash, user.name],
	);
	const addedUserAccount = checkForOne(results.rows, 'new user account');
	return addedUserAccount;
};

const addUserProjectPair = async (user_id: number, project_id: number, existingClient?: PoolClient): Promise<UserProject> => {
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

export const addTicketToProject = async (ticket: Omit<Ticket, 'id' | 'index_in_project'>): Promise<Ticket> => {
	if (!await rowWithIDExists(Table.projects, ticket.project_id)) throw new Error('Cannot add a ticket to a non-existent project');
	if (!await rowWithIDExists(Table.user_accounts, ticket.created_user_id)) throw new Error('Cannot add a ticket to a non-existent user');

	return makeMultiQuery(async (client) => {
		const ticketIndexResults = await client.query<Pick<Ticket, 'index_in_project'>>(
			`SELECT index_in_project FROM ${Table[Table.tickets]} WHERE project_id=$1`,
			[ticket.project_id],
		);
		const ticketIndices = ticketIndexResults.rows.map(row => row.index_in_project);
		const highestTicketIndex: null | number = ticketIndices.length === 0 ? null : Math.max(...ticketIndices);

		const ticketResults = await client.query<Ticket>(
			`INSERT INTO ${Table[Table.tickets]} (project_id, created_user_id, index_in_project, title) VALUES ($1, $2, $3, $4) RETURNING *`,
			[ticket.project_id, ticket.created_user_id, highestTicketIndex ? highestTicketIndex + 1 : 1, ticket.title],
		);
		const addedTicket = checkForOne(ticketResults.rows, 'new ticket');
		return addedTicket;
	});
};

export const addMetricToProject = async (metric: OmitID<Metric>): Promise<Metric> => {
	if (!await rowWithIDExists(Table.projects, metric.project_id)) throw new Error('Cannot add a metric to a non-existent project');

	const metricNameResults = await pool.query<Pick<Metric, 'title'>>(
		`SELECT title FROM ${Table[Table.metrics]} WHERE project_id=$1`,
		[metric.project_id],
	);
	const metricNames = metricNameResults.rows.map(row => row.title);
	if (metricNames.indexOf(metric.title) !== -1) throw new Error('Cannot add a metric of the same name to the same project');

	const results = await pool.query<Metric>(
		`INSERT INTO ${Table[Table.metrics]} (project_id, title) VALUES ($1, $2) RETURNING *`,
		[metric.project_id, metric.title],
	);
	const newMetric = checkForOne(results.rows, 'new metric');
	return newMetric;
};

export const addMetricOptionToMetric = async (metricOption: Omit<MetricOption, 'id' | 'index_in_metric'>): Promise<MetricOption> => {
	if (!await rowWithIDExists(Table.metrics, metricOption.metric_id))
		throw new Error('Could not add an option to a metric that does not exist. Check metric_option.metric_id.');

	return makeMultiQuery(async (client) => {
		const results = await client.query<Pick<MetricOption, 'index_in_metric'>>(
			`SELECT index_in_metric FROM ${Table[Table.metric_options]} WHERE metric_id=$1`,
			[metricOption.metric_id],
		);
		const indices = results.rows.map(row => row.index_in_metric);
		if (indices.length === 0) throw new Error('A metric with the specified id could not be found.');
		const highestIndex = Math.max(...indices);

		const metricOptionResults = await client.query<MetricOption>(
			`INSERT INTO ${Table[Table.metric_options]} (metric_id, index_in_metric, option_string) VALUES ($1, $2, $3) RETURNING *`,
			[metricOption.metric_id, highestIndex ? highestIndex + 1 : 1, metricOption.option_string],
		);
		const newMetricOption = checkForOne(metricOptionResults.rows, 'new metric option');
		return newMetricOption;
	});
};

const addTicketAssigneePair = async (ticketAssignee: TicketAssignee, existingClient?: PoolClient): Promise<TicketAssignee> => {
	const client: PoolClient | Pool = existingClient ? existingClient : pool;

	const combinationCheckResults = await client.query(
		`SELECT FROM ${Table[Table.ticket_assignees]} WHERE ticket_id=$1 AND assignee_user_id=$2`,
		[ticketAssignee.ticket_id, ticketAssignee.assignee_user_id],
	);
	if (combinationCheckResults.rows.length !== 0) throw new Error('Cannot add a ticket-assignee pair that already exists');

	const addPairResult = await client.query<TicketAssignee>(
		`INSERT INTO ${Table[Table.ticket_assignees]} (ticket_id, assignee_user_id) VALUES ($1, $2) RETURNING *;`,
		[ticketAssignee.ticket_id, ticketAssignee.assignee_user_id],
	);
	const newTicketAssignee = checkForOne(addPairResult.rows, 'new ticket-assignee pair');
	return newTicketAssignee;
};

export const addAssigneeToTicket = async (ticketAssignee: TicketAssignee) => {
	if (
		!await rowWithIDExists(Table.tickets, ticketAssignee.ticket_id) ||
		!await rowWithIDExists(Table.user_accounts, ticketAssignee.assignee_user_id)
	)
		throw new Error('Could not add a ticket assignee pair because either a ticket or a user account with the given IDs did not exist.');

	const newPair = await addTicketAssigneePair(ticketAssignee);
	return newPair;
};
