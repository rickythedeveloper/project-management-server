# project-management-server
## Overview
Server side app.

---

## Developer Guide
### Push / pull the database
Let's say you want to pull the production environment to your local machine as a database called 'projman' and do some testing / developing.
1. Pull the heroku postgresql database
	1. Start a postgresql server locally.\
	`$ brew services start postgresql`
	2. Pull database from heroku into a local database called 'projman'\
	`$ heroku pg:pull DATABASE_URL projman --app rtd-project-management`
	3. Open the database (optional)\
	`$ psql projman`
2. Set DATABASE_URL environment variable to your local database name\
`$ export DATABASE_URL=postgres://projman`
3. Do whatever.
4. Push the database to heroku\
`$ heroku pg:push projman DATABASE_URL --app rtd-project-management`\
You might have to run `$ heroku pg:reset` before pushing.
1. In the code, set te `PROD` back to `true`.

### Push code to Heroku
`$ git push heroku main` if you want to push main.\
`$ git push heroku whatever_local_branch:main` if you want to push a branch.

### Miscellaneous
#### How to
- get the current DATABASE_URL in our production server\
`$ heroku config:get DATABASE_URL -a rtd-project-management`
- run the local server with a connection to the production databse\
`$ DATABASE_URL=$(heroku config:get DATABASE_URL -a rtd-project-management) npm start`
- push code to heroku\
`$ git push heroku main` (if you want to push local main).\
`$ git push heroku whatever_local_branch:main` (if you want to push a local branch other than main)

---

## Database structure
### Primitive Tables
- user_accounts
	- id
	- username
	- password_hash
	- password_salt 
	- name
- user_data
	- TODO
- proejcts
	- id
	- name
	- owner_user_id
	- highest_index
- tickets
	- id
	- project_id
	- created_user_id
	- index_in_project
	- title
- metrics (progress, priority etc.)
	- id
	- project_id
	- title
- metric_options (todo, ongoing, priority 1, priority 2 etc.)
	- id
	- metric id
	- index_in_metric
	- option_string

### Relational Tables
- user_project
	- user_id
	- project_id
- ticket_asignees
	- ticket_id
	- assignee_user_id
