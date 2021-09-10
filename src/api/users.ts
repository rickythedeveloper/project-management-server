import { UserAccount, OmitID } from '../database/structure';
import { addUser, deleteUser, updateUser, getUser, getUsers } from '../database/functions/users';
import { Request, Response } from 'express';
import { PostResponse, DeleteResponse, PutResponse, GetResponse } from '..';

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

export const del = async (
	req: Request<{ id: string }>,
	res: Response<DeleteResponse>,
) => {
	try {
		const userID = parseInt(req.params.id);
		await deleteUser(userID);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const put = async (
	req: Request<{ id: string }, PutResponse, Pick<UserAccount, 'username' | 'name'>>,
	res: Response<PutResponse>,
) => {
	try {
		const userID = parseInt(req.params.id);
		const data: Pick<UserAccount, 'username' | 'name'> = req.body;
		await updateUser(userID, data);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getAll = async (res: Response<GetResponse<UserAccount[]>>) => {
	try {
		const users = await getUsers();
		res.json({ isSuccessful: true, result: users });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getOne = async (
	req: Request<{ id: string }>,
	res: Response<GetResponse<UserAccount>>,
) => {
	try {
		const userID = parseInt(req.params.id);
		const user = await getUser(userID);
		res.json({ isSuccessful: true, result: user });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
