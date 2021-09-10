import { Pool, PoolClient } from 'pg';
import { Table, TicketAssignee } from '../structure';
import { checkForOne, pool, rowWithIDExists } from '.';

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
