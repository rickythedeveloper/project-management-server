import { DataTable, OmitID, UserAccount } from '../structure';
import { checkForOne, pool } from '.';

const tableName = DataTable[DataTable.user_accounts];

export const addUser = async (user: OmitID<UserAccount>): Promise<UserAccount> => {
	const results = await pool.query<UserAccount>(
		`INSERT INTO ${tableName} (username, password_salt, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING *`,
		[user.username, user.password_salt, user.password_hash, user.name],
	);
	const addedUserAccount = checkForOne(results.rows, 'new user account');
	return addedUserAccount;
};
