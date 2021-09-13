import { GetResponse, PostResponse } from '..';
import { DataTable, OmitID, UserAccount, UserProject } from '../../database/structure';
import { Request, Response } from 'express';
import * as dataTablaAPI from '../dataTables';
import { addUser } from '../../database/functions/users';
import { getUsersForProject } from '../../database/functions/userProjects';

export const post = async (
	req: Request<{}, PostResponse<UserAccount>, OmitID<UserAccount>>,
	res: Response<PostResponse<UserAccount>>,
) => {
	try {
		const newUser = req.body;
		const addedUser = await addUser(newUser);
		res.json({ isSuccessful: true, result: addedUser });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getAll = async (
	req: Request,
	res: Response<GetResponse<UserAccount[]>>,
): Promise<void> => {
	try {
		if (req.query.hasOwnProperty('project_id')) {
			const projectID = parseInt(req.query.project_id as string);
			const users = await getUsersForProject(projectID);
			res.json({ isSuccessful: true, result: users });
		} else {
			await dataTablaAPI.getAll(DataTable.user_accounts, res);
		}
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
