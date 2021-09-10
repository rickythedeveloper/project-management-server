import { Request, Response } from 'express';
import { TicketAssignee } from '../database/structure';
import { PostResponse } from '.';
import { addAssigneeToTicket } from '../database/functions/ticketAssignees';

export const post = async (req: Request<{}, PostResponse<TicketAssignee>, TicketAssignee>, res: Response<PostResponse<TicketAssignee>>) => {
	try {
		const pair = req.body;
		const addedPair = await addAssigneeToTicket(pair);
		res.json({ isSuccessful: true, result: addedPair });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
