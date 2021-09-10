import { pool, checkForOne, rowWithIDExists } from './database';
import { OmitID, UserAccount, Table } from './tables';

export const addUser = async (user: OmitID<UserAccount>): Promise<UserAccount> => {
	const results = await pool.query<UserAccount>(
		`INSERT INTO ${Table[Table.user_accounts]} (username, password_salt, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING *`,
		[user.username, user.password_salt, user.password_hash, user.name],
	);
	const addedUserAccount = checkForOne(results.rows, 'new user account');
	return addedUserAccount;
};

export const deleteUser = async (userID: number): Promise<void> => {
	if (!await rowWithIDExists(Table.user_accounts, userID))
		throw new Error('Cannot delete a user that does not exist.');
	await pool.query(`DELETE FROM ${Table[Table.user_accounts]} WHERE id=$1`, [userID]);
};

export const updateUser = async (userID: number, data: Pick<UserAccount, 'username' | 'name'>): Promise<void> => {
	if (!await rowWithIDExists(Table.user_accounts, userID)) throw new Error('Cannot update a user that does not exist');
	await pool.query(`UPDATE ${Table[Table.user_accounts]} SET username=$1, name=$2 WHERE id=$3`, [data.username, data.name, userID]);
};

export const getUser = async (id: number): Promise<UserAccount> => {
	const results = await pool.query<UserAccount>(`SELECT * FROM ${Table[Table.user_accounts]} WHERE id=$1`, [id]);
	if (results.rows.length === 0) throw new Error(`Could not find user with id ${id}`);
	return results.rows[0];
};

export const getUsers = async (...IDs: number[]): Promise<UserAccount[]> => {
	if (IDs.length === 0) {
		const results = await pool.query<UserAccount>(`SELECT * FROM ${Table[Table.user_accounts]}`);
		return results.rows;
	} else {
		const users: UserAccount[] = [];
		IDs.forEach(async id => {
			const user = await getUser(id);
			users.push(user);
		});
		return users;
	}
};
