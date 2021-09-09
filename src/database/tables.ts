export enum Table {
	user_accounts,
	user_data,
	projects,
	tickets,
	metrics,
	metric_options,
	user_projects,
	ticket_assignees,
}

export interface UserAccount {
	id: number;
	username: string;
	password_salt: string;
	password_hash: string;
	name: string;
}

// interface UserData {}

export interface Project {
	id: number;
	name: string;
	owner_user_id: number;
	highest_index: number;
}

export interface Ticket {
	id: number;
	project_id: number;
	created_user_id: number;
	index_in_project: number;
	title: string;
}

export interface Metric {
	id: number;
	project_id: number;
	title: string;
}

export interface MetricOption {
	id: number;
	metric_id: number;
	index_in_metric: number;
	option_string: string;
}

export interface UserProject {
	user_id: number;
	project_id: number;
}

export interface TicketAssignee {
	ticket_id: number;
	assignee_user_id: number;
}

export type OurQueryResultRow = UserAccount | Project | Ticket | Metric | MetricOption | UserProject | TicketAssignee | { [column: string]: string } | { [column: string]: number };
export type OmitID<T> = Omit<T, 'id'>;
