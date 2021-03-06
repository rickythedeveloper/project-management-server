import { PostResponse } from '..';
import { OmitID, Project, UserProject } from '../../database/structure';
import { Request, Response } from 'express';
import { addProjectToUser } from '../../database/functions/projects';

export const post = async (req: Request<{}, PostResponse<{ project: Project; userProject: UserProject }>, OmitID<Project>>, res: Response<PostResponse<{ project: Project; userProject: UserProject }>>) => {
	try {
		const project = req.body;
		const addedProject = await addProjectToUser(project);
		res.json({ isSuccessful: true, result: addedProject });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
