import { DeleteResponse, GetResponse, PostResponse, PutResponse } from '.';
import { OmitID, Project, UserProject } from '../database/structure';
import { Request, Response } from 'express';
import { addProjectToUser, deleteProject, editProject, getProject, getProjects } from '../database/functions/projects';

export const post = async (req: Request<{}, PostResponse<{ project: Project; userProject: UserProject }>, OmitID<Project>>, res: Response<PostResponse<{ project: Project; userProject: UserProject }>>) => {
	try {
		const project = req.body;
		const addedProject = await addProjectToUser(project);
		res.json({ isSuccessful: true, result: addedProject });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getAll = async (req: Request, res: Response<GetResponse<Project[]>>) => {
	try {
		const projects = await getProjects();
		res.json({ isSuccessful: true, result: projects });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getOne = async (req: Request<{ id: string }>, res: Response<GetResponse<Project>>) => {
	try {
		const id = parseInt(req.params.id);
		const project = await getProject(id);
		res.json({ isSuccessful: true, result: project });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const edit = async (req: Request<{ id: string }, PutResponse, Partial<OmitID<Project>>>, res: Response<PutResponse>) => {
	try {
		const id = parseInt(req.params.id);
		const properties = req.body;
		await editProject(id, properties);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const del = async (req: Request<{ id: string }>, res: Response<DeleteResponse>) => {
	try {
		const id = parseInt(req.params.id);
		await deleteProject(id);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
