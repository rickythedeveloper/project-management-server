import { Request, Response } from 'express';
import { PostResponse } from '.';
import { Metric, OmitID } from '../database/structure';
import { addMetricToProject } from '../database/functions/metrics';

export const post = async (req: Request<{}, PostResponse<Metric>, OmitID<Metric>>, res: Response<PostResponse<Metric>>) => {
	try {
		const metric = req.body;
		const addedMetric = await addMetricToProject(metric);
		res.json({ isSuccessful: true, result: addedMetric });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
