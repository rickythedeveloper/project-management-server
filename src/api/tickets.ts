import { Request, Response } from 'express';
import { PostResponse } from '.';
import { Ticket } from '../database/structure';
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
