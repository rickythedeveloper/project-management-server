import express, { Response } from 'express';
import { getAllUserProjects, addUser, addProjectToUser, addTicketToProject, addMetricToProject, addMetricOptionToMetric, addAssigneeToTicket, deleteUser, updateUser, getUsers, getUser } from './database/database';
import { OmitID, Project, UserAccount, Ticket, Metric, MetricOption, TicketAssignee, UserProject } from './database/tables';
import { PORT } from './constants';
import e from 'express';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.send('Hello World');
});

interface APIResponse {
	isSuccessful: boolean;
}
interface APISuccessWithData<T> extends APIResponse {
	isSuccessful: true;
	result: T;
}
interface APISuccessNoData extends APIResponse {
	isSuccessful: true;
}
interface APIError extends APIResponse {
	isSuccessful: false;
	error: string;
}

type PostResponse<T> = APISuccessWithData<T> | APIError;
type DeleteResponse = APISuccessNoData | APIError;
type PutResponse = APISuccessNoData | APIError;
type GetResponse<T> = APISuccessWithData<T> | APIError;

app.get('/apitest', async (req, res) => {
	try {
		const results = await getAllUserProjects();
		res.send(results);
	} catch (err) {
		res.send(err);
	}
});

app.post('/users', async (req, res: Response<PostResponse<UserAccount>>) => {
	try {
		const newUser: OmitID<UserAccount> = req.body;
		const addedUser = await addUser(newUser);
		res.json({ isSuccessful: true, result: addedUser });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.delete('/users/:id', async (req, res: Response<DeleteResponse>) => {
	try {
		const userID = parseInt(req.params.id);
		await deleteUser(userID);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.put('/users/:id', async (req, res: Response<PutResponse>) => {
	try {
		const userID = parseInt(req.params.id);
		const data: Pick<UserAccount, 'username' | 'name'> = req.body;
		await updateUser(userID, data);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.get('/users', async (req, res: Response<GetResponse<UserAccount[]>>) => {
	try {
		const users = await getUsers();
		res.json({ isSuccessful: true, result: users });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.get('/users/:id', async (req, res: Response<GetResponse<UserAccount>>) => {
	try {
		const userID = parseInt(req.params.id);
		const user = await getUser(userID);
		res.json({ isSuccessful: true, result: user });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/projects', async (req, res: Response<PostResponse<{ project: Project; userProject: UserProject }>>) => {
	try {
		const project: OmitID<Project> = req.body;
		const addedProject = await addProjectToUser(project);
		res.json({ isSuccessful: true, result: addedProject });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/tickets', async (req, res: Response<PostResponse<Ticket>>) => {
	try {
		const ticket: Omit<Ticket, 'id' | 'index_in_project'> = req.body;
		const addedTicket = await addTicketToProject(ticket);
		res.json({ isSuccessful: true, result: addedTicket });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/metrics', async (req, res: Response<PostResponse<Metric>>) => {
	try {
		const metric: OmitID<Metric> = req.body;
		const addedMetric = await addMetricToProject(metric);
		res.json({ isSuccessful: true, result: addedMetric });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/metric-options', async (req, res: Response<PostResponse<MetricOption>>) => {
	try {
		const metricOption: Omit<MetricOption, 'id' | 'index_in_metric'> = req.body;
		const addedMetricOption = await addMetricOptionToMetric(metricOption);
		res.json({ isSuccessful: true, result: addedMetricOption });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
});

app.post('/ticket-assignees', async (req, res: Response<PostResponse<TicketAssignee>>) => {
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

