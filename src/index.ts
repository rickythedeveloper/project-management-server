import * as metricOptionsAPI from './api/metricOptions';
import * as metricsAPI from './api/metrics';
import * as projectsAPI from './api/projects';
import * as ticketAssigneesAPI from './api/ticketAssignees';
import * as ticketsAPI from './api/tickets';
import * as usersAPI from './api/users';
import { PORT } from './constants';
import express from 'express';

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
app.get('/tickets', ticketsAPI.getAll);
app.get('/tickets/:id', ticketsAPI.getOne);
app.put('/tickets/:id', ticketsAPI.edit);
app.delete('/tickets/:id', ticketsAPI.del);

app.post('/metrics', metricsAPI.post);

app.post('/metric-options', metricOptionsAPI.post);

app.post('/ticket-assignees', ticketAssigneesAPI.post);

app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});

