import express, { Request, Response } from 'express';
import { addAssigneeToTicket } from './database/functions/ticketAssignees';
import { addMetricOptionToMetric } from './database/functions/metricOptions';
import { addMetricToProject } from './database/functions/metrics';
import { addTicketToProject } from './database/functions/tickets';
import { OmitID, Project, UserAccount, Ticket, Metric, MetricOption, TicketAssignee, UserProject } from './database/structure';
import { getAllUserProjects } from './database/functions/userProjects';
import { addProjectToUser } from './database/functions/projects';
import { PORT } from './constants';
import * as usersAPI from './api/users';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.send('Hello World');
});

interface APIResponse { isSuccessful: boolean }
interface APISuccessNoData extends APIResponse { isSuccessful: true }
interface APISuccessWithData<T> extends APIResponse { isSuccessful: true; result: T }
interface APIError extends APIResponse { isSuccessful: false; error: string }

export type GetResponse<T> = APISuccessWithData<T> | APIError;
export type PostResponse<T> = APISuccessWithData<T> | APIError;
export type PutResponse = APISuccessNoData | APIError;
export type DeleteResponse = APISuccessNoData | APIError;

app.get('/apitest', async (req, res) => {
	try {
		const results = await getAllUserProjects();
		res.send(results);
	} catch (err) {
		res.send(err);
	}
});

app.post('/users', async (
	req: Request<{}, PostResponse<UserAccount>, OmitID<UserAccount>>,
	res: Response<PostResponse<UserAccount>>,
) => { usersAPI.post(req, res); });
app.delete('/users/:id', async (
	req,
	res: Response<DeleteResponse>,
) => { usersAPI.del(req, res); });
app.put('/users/:id', async (
	req: Request<{ id: string }, PutResponse, Pick<UserAccount, 'username' | 'name'>>,
	res: Response<PutResponse>,
) => { usersAPI.put(req, res); });
app.get('/users', async (req, res: Response<GetResponse<UserAccount[]>>) => { usersAPI.getAll(res); });
app.get('/users/:id', async (req, res: Response<GetResponse<UserAccount>>) => { usersAPI.getOne(req, res); });

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

