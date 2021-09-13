import { DataTable, OmitID, Ticket } from '../database/structure';
import { deleteRow, editRow, getRows } from '../database/functions';
import { DeleteResponse, GetResponse, PostResponse, PutResponse } from '.';
import { Request, Response } from 'express';
import { addTicketToProject } from '../database/functions/tickets';

export const post = async (req: Request<{}, PostResponse<Ticket>, Omit<Ticket, 'id' | 'index_in_project'>>, res: Response<PostResponse<Ticket>>) => {
	try {
		const ticket = req.body;
		const addedTicket = await addTicketToProject(ticket);
		res.json({ isSuccessful: true, result: addedTicket });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getAll = async (req: Request, res: Response<GetResponse<Ticket[]>>) => {
	try {
		const tickets = await getRows(DataTable.tickets);
		res.json({ isSuccessful: true, result: tickets });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getOne = async (req: Request<{ id: string }>, res: Response<GetResponse<Ticket>>) => {
	try {
		const id = parseInt(req.params.id);
		const tickets = await getRows(DataTable.tickets, [id]);
		if (tickets.length !== 1) throw new Error(`Could not find ticket with id ${id}`);
		res.json({ isSuccessful: true, result: tickets[0] });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const edit = async (req: Request<{ id: string }, PutResponse, Partial<Pick<Ticket, 'title'>>>, res: Response<PutResponse>) => {
	try {
		const id = parseInt(req.params.id);
		const properties = req.body;
		if (properties.hasOwnProperty('project_id')) throw new Error('Cannot change project_id of a ticket');
		if (properties.hasOwnProperty('created_user_id')) throw new Error('Cannot change created_user_id of a ticket');
		if (properties.hasOwnProperty('index_in_project')) throw new Error('Cannot change created_user_id of a ticket');
		await editRow(DataTable.tickets, id, properties);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const del = async (req: Request<{ id: string }>, res: Response<DeleteResponse>) => {
	try {
		const id = parseInt(req.params.id);
		await deleteRow(DataTable.tickets, id);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
