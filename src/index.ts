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

app.post('/tickets', ticketsAPI.post);

app.post('/metrics', metricsAPI.post);

app.post('/metric-options', metricOptionsAPI.post);

app.post('/ticket-assignees', ticketAssigneesAPI.post);

app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});

