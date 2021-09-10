import express, { Response } from 'express';
import { getAllUserProjects, addUser, addProjectToUser, addTicketToProject, addMetricToProject, addMetricOptionToMetric, addAssigneeToTicket } from './database/database';
import { OmitID, Project, UserAccount, Ticket, Metric, MetricOption, TicketAssignee } from './database/tables';
import { PORT } from './constants';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.send('Hello World');
});

interface APISuccessResponse {
	isSuccessful: true;
	result: any;
}

interface APIErrorResponse {
	isSuccessful: false;
	error: unknown;
}

type APIResponse = APISuccessResponse | APIErrorResponse;

app.get('/apitest', async (req, res) => {
	try {
		const results = await getAllUserProjects();
		res.send(results);
	} catch (err) {
		res.send(err);
	}
});

app.post('/addUser', async (req, res: Response<APIResponse>) => {
	try {
		const newUser: OmitID<UserAccount> = req.body;
		const addedUser = await addUser(newUser);
		res.json({ isSuccessful: true, result: addedUser });
	} catch (error) {
		res.json({ isSuccessful: false, error: error });
	}
});

app.post('/projects', async (req, res: Response<APIResponse>) => {
	try {
		const project: OmitID<Project> = req.body;
		const addedProject = await addProjectToUser(project);
		res.json({ isSuccessful: true, result: addedProject });
	} catch (error) {
		res.json({ isSuccessful: false, error: error });
	}
});

app.post('/tickets', async (req, res: Response<APIResponse>) => {
	try {
		const ticket: Omit<Ticket, 'id' | 'index_in_project'> = req.body;
		const addedTicket = await addTicketToProject(ticket);
		res.json({ isSuccessful: true, result: addedTicket });
	} catch (error) {
		res.json({ isSuccessful: false, error: error });
	}
});

app.post('/metrics', async (req, res: Response<APIResponse>) => {
	try {
		const metric: OmitID<Metric> = req.body;
		const addedMetric = await addMetricToProject(metric);
		res.json({ isSuccessful: true, result: addedMetric });
	} catch (error) {
		res.json({ isSuccessful: false, error: error });
	}
});

app.post('/metric-options', async (req, res: Response<APIResponse>) => {
	try {
		const metricOption: Omit<MetricOption, 'id' | 'index_in_metric'> = req.body;
		const addedMetricOption = await addMetricOptionToMetric(metricOption);
		res.json({ isSuccessful: true, result: addedMetricOption });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/ticket-assignees', async (req, res: Response<APIResponse>) => {
	try {
		const pair: TicketAssignee = req.body;
		const addedPair = await addAssigneeToTicket(pair);
		res.json({ isSuccessful: true, result: addedPair });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
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

		To add a metric to a project, try the following
		curl -d "project_id=3&title=some metric" -X POST http://localhost:${PORT}/metrics

		To add a metric option to a metric, try the following
		curl -d "metric_id=1&option_string=some metric option" -X POST http://localhost:${PORT}/metric-options

		To add a ticket assignee pair, try the following
		curl -d "ticket_id=1&assignee_user_id=1" -X POST http://localhost:${PORT}/ticket-assignees
	`);
});

