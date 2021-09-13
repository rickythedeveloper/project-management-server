import { PostResponse } from '.';
import { OmitID, UserAccount } from '../database/structure';
import { Request, Response } from 'express';
import { addUser } from '../database/functions/users';

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
