import { OmitID, Table, Metric } from '../structure';
import { rowWithIDExists, pool, checkForOne } from '.';

export const addMetricToProject = async (metric: OmitID<Metric>): Promise<Metric> => {
	if (!await rowWithIDExists(Table.projects, metric.project_id)) throw new Error('Cannot add a metric to a non-existent project');

	const metricNameResults = await pool.query<Pick<Metric, 'title'>>(
		`SELECT title FROM ${Table[Table.metrics]} WHERE project_id=$1`,
		[metric.project_id],
	);
	const metricNames = metricNameResults.rows.map(row => row.title);
	if (metricNames.indexOf(metric.title) !== -1) throw new Error('Cannot add a metric of the same name to the same project');

	const results = await pool.query<Metric>(
		`INSERT INTO ${Table[Table.metrics]} (project_id, title) VALUES ($1, $2) RETURNING *`,
		[metric.project_id, metric.title],
	);
	const newMetric = checkForOne(results.rows, 'new metric');
	return newMetric;
};
