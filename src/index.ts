import express from 'express';
import { getAllUserProjects, addUser, addProjectToUser, addTicketToProject } from './database/database';
import { OmitID, Project, UserAccount, Ticket } from './database/tables';
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

app.post('/projects', async (req, res) => {
	try {
		const project: OmitID<Project> = req.body;
		const addedProject = await addProjectToUser(project);
		res.json({ isSuccessful: true, result: addedProject });
	} catch (error) {
		res.json({ isSuccessful: false, error: error });
	}
});

app.post('/tickets', async (req, res) => {
	try {
		const ticket: Omit<Ticket, 'id' | 'index_in_project'> = req.body;
		const addedTicket = await addTicketToProject(ticket);
		res.json({ isSuccessful: true, result: addedTicket });
	} catch (error) {
		res.json({ isSuccessful: false, error: error });
	}
});

app.listen(PORT, () => {
	console.log(`
		Server started at http://localhost:${PORT}

		To add a user, try the following
		curl -d "username=rickythedeveloper&password_hash=123456789012345678901234567890123456789012345678901234567890&password_salt=salthere&name=rickykawagishi" -X POST http://localhost:${PORT}/addUser

		To add a project to a user, try the following
		curl -d "name=some project&owner_user_id=1" -X POST http://localhost:${PORT}/projects

		To add a ticket to a project, try the following
		curl -d "project_id=3&created_user_id=1&title=some ticket man" -X POST http://localhost:${PORT}/tickets
	`);
});

