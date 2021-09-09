import { Pool } from 'pg';
import express from 'express';

const PROD = (process.env.PORT) ? true : false;
const PORT = process.env.PORT || 8000;

const app = express();
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: PROD ? { rejectUnauthorized: false } : false,
});

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.get('/apitest', async (req, res) => {
	try {
		const client = await pool.connect();
		const result = await client.query('SELECT * FROM user_projects');
		const results = { results: (result) ? result.rows : null };
		res.send(results);
		client.release();
	} catch (err) {
		console.error(err);
		res.send(err);
	}
});

app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});

