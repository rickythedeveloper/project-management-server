import { Table, Ticket } from '../structure';
import { rowWithIDExists, makeMultiQuery, checkForOne } from '.';

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
