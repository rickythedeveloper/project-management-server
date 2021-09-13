import { Request, Response } from 'express';
import { MetricOption } from '../../database/structure';
import { PostResponse } from '..';
import { addMetricOptionToMetric } from '../../database/functions/metricOptions';

export const post = async (req: Request<{}, PostResponse<MetricOption>, Omit<MetricOption, 'id' | 'index_in_metric'>>, res: Response<PostResponse<MetricOption>>) => {
	try {
		const metricOption = req.body;
		const addedMetricOption = await addMetricOptionToMetric(metricOption);
		res.json({ isSuccessful: true, result: addedMetricOption });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
