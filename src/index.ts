import * as metricOptionsAPI from './api/metricOptions';
import * as metricsAPI from './api/metrics';
import * as projectsAPI from './api/projects';
import * as ticketAssigneesAPI from './api/ticketAssignees';
import * as ticketsAPI from './api/tickets';
import * as usersAPI from './api/users';
import * as dataTableAPI from './api/dataTable';
import { PORT } from './constants';
import express from 'express';
import { DataTable } from './database/structure';

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.post('/users', usersAPI.post);
app.delete('/users/:id', usersAPI.del);
app.put('/users/:id', usersAPI.put);
app.get('/users', usersAPI.getAll);
app.get('/users/:id', usersAPI.getOne);

app.post('/projects', projectsAPI.post);
app.get('/projects', projectsAPI.getAll);
app.get('/projects/:id', projectsAPI.getOne);
app.put('/projects/:id', projectsAPI.edit);
app.delete('/projects/:id', projectsAPI.del);

app.post('/tickets', ticketsAPI.post);
app.get('/tickets', (req, res) => { dataTableAPI.getAll(DataTable.tickets, res); });
app.get('/tickets/:id', (req, res) => { dataTableAPI.getOne(DataTable.tickets, req, res); });
app.put('/tickets/:id', (req, res) => { dataTableAPI.edit(DataTable.tickets, ['project_id', 'created_user_id', 'index_in_project'], req, res); });
app.delete('/tickets/:id', (req, res) => { dataTableAPI.del(DataTable.tickets, req, res); });

app.post('/metrics', metricsAPI.post);

app.post('/metric-options', metricOptionsAPI.post);

app.post('/ticket-assignees', ticketAssigneesAPI.post);

app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});

