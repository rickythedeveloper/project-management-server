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
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/projects', async (req, res: Response<APIResponse>) => {
	try {
		const project: OmitID<Project> = req.body;
		const addedProject = await addProjectToUser(project);
		res.json({ isSuccessful: true, result: addedProject });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/tickets', async (req, res: Response<APIResponse>) => {
	try {
		const ticket: Omit<Ticket, 'id' | 'index_in_project'> = req.body;
		const addedTicket = await addTicketToProject(ticket);
		res.json({ isSuccessful: true, result: addedTicket });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/metrics', async (req, res: Response<APIResponse>) => {
	try {
		const metric: OmitID<Metric> = req.body;
		const addedMetric = await addMetricToProject(metric);
		res.json({ isSuccessful: true, result: addedMetric });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
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
	console.log(`Server started at http://localhost:${PORT}`);
});

