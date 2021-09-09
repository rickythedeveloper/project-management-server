import { Client, Pool } from 'pg';
import express from 'express';

const PROD = (process.env.PORT) ? true : false;
const PORT = process.env.PORT || 8000;

const app = express();

app.get('/', (req, res) => {
	res.send('Hello World');
});

app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${port}`);
});

const client = new Client({
	connectionString: process.env.DATABASE_URL,
	ssl: PROD ? { rejectUnauthorized: false } : false,
});

client.connect()
	.then(() => {
		client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
			if (err) throw err;
			for (let row of res.rows) {
				console.log(JSON.stringify(row));
			}
			client.end();
		});
	})
	.catch((error) => {
		console.log(error);
	});
