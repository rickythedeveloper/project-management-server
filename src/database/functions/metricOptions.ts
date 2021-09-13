import { DataTable, MetricOption } from '../structure';
import { checkForOne, makeMultiQuery, rowWithIDExists } from '.';

const tableName = DataTable[DataTable.metric_options];

export const addMetricOptionToMetric = async (metricOption: Omit<MetricOption, 'id' | 'index_in_metric'>): Promise<MetricOption> => {
	if (!await rowWithIDExists(DataTable.metrics, metricOption.metric_id))
		throw new Error('Could not add an option to a metric that does not exist. Check metric_option.metric_id.');

	return makeMultiQuery(async (client) => {
		const results = await client.query<Pick<MetricOption, 'index_in_metric'>>(
			`SELECT index_in_metric FROM ${tableName} WHERE metric_id=$1`,
			[metricOption.metric_id],
		);
		const indices = results.rows.map(row => row.index_in_metric);
		if (indices.length === 0) throw new Error('A metric with the specified id could not be found.');
		const highestIndex = Math.max(...indices);

		const metricOptionResults = await client.query<MetricOption>(
			`INSERT INTO ${tableName} (metric_id, index_in_metric, option_string) VALUES ($1, $2, $3) RETURNING *`,
			[metricOption.metric_id, highestIndex ? highestIndex + 1 : 1, metricOption.option_string],
		);
		const newMetricOption = checkForOne(metricOptionResults.rows, 'new metric option');
		return newMetricOption;
	});
};
