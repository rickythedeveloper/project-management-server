import { DataTable, DataTableProperty } from '../../database/structure';
import { Request, Response } from 'express';
import { deleteRow, editRow, getRows } from '../../database/functions';
import { DeleteResponse, GetResponse, PutResponse } from '..';

export const getAll = async <T extends DataTable>(
	table: T,
	res: Response<GetResponse<DataTableProperty<T>[]>>,
) => {
	try {
		const tickets = await getRows(table);
		res.json({ isSuccessful: true, result: tickets });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const getOne = async <T extends DataTable>(
	table: T,
	req: Request<{ id: string }>,
	res: Response<GetResponse<DataTableProperty<T>>>,
) => {
	try {
		const id = parseInt(req.params.id);
		const rows = await getRows(table, [id]);
		if (rows.length !== 1) throw new Error(`Could not find ticket with id ${id}`);
		res.json({ isSuccessful: true, result: rows[0] });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const edit = async <T extends DataTable>(
	table: T,
	immutableFields: string[],
	req: Request<{ id: string }, PutResponse, Partial<DataTableProperty<T>>>,
	res: Response<PutResponse>,
) => {
	try {
		const id = parseInt(req.params.id);
		const properties = req.body;
		immutableFields.forEach(field => {
			if (properties.hasOwnProperty(field)) throw new Error(`Cannot change ${field} of ${DataTable[table]}`);
		});
		await editRow(table, id, properties);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};

export const del = async <T extends DataTable>(
	table: T,
	req: Request<{ id: string }>,
	res: Response<DeleteResponse>,
) => {
	try {
		const id = parseInt(req.params.id);
		await deleteRow(table, id);
		res.json({ isSuccessful: true });
	} catch (error) {
		res.json({ isSuccessful: false, error: String(error) });
	}
};
