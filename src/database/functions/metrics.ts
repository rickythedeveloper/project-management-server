import { DataTable, Metric, OmitID } from '../structure';
import { checkForOne, pool, rowWithIDExists } from '.';

const tableName = DataTable[DataTable.metrics];

export const addMetricToProject = async (metric: OmitID<Metric>): Promise<Metric> => {
	if (!await rowWithIDExists(DataTable.projects, metric.project_id)) throw new Error('Cannot add a metric to a non-existent project');

	const metricNameResults = await pool.query<Pick<Metric, 'title'>>(
		`SELECT title FROM ${tableName} WHERE project_id=$1`,
		[metric.project_id],
	);
	const metricNames = metricNameResults.rows.map(row => row.title);
	if (metricNames.indexOf(metric.title) !== -1) throw new Error('Cannot add a metric of the same name to the same project');

	const results = await pool.query<Metric>(
		`INSERT INTO ${tableName} (project_id, title) VALUES ($1, $2) RETURNING *`,
		[metric.project_id, metric.title],
	);
	const newMetric = checkForOne(results.rows, 'new metric');
	return newMetric;
};
