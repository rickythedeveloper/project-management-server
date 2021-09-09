import express from 'express';
import { getAllUserProjects, addUser } from './database/database';
import { OmitID, UserAccount } from './database/tables';
import { PORT } from './constants';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.get('/apitest', async (req, res) => {
	try {
		const results = await getAllUserProjects();
		res.send(results);
	} catch (err) {
		res.send(err);
	}
});

app.post('/addUser', async (req, res) => {
	try {
		const newUser: OmitID<UserAccount> = req.body;
		const addedUser = await addUser(newUser);
		res.json({ isSuccessful: true, result: addedUser });
	} catch (error) {
		res.json({ isSuccessful: false, error: error });
	}
});

app.listen(PORT, () => {
	console.log(`
		Server started at http://localhost:${PORT}

		To add a user try teh following
		curl -d "username=rickythedeveloper&password_hash=123456789012345678901234567890123456789012345678901234567890&password_salt=salthere&name=rickykawagishi" -X POST http://localhost:${PORT}/addUser
	`);
});

