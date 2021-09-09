# project-management-server

Server side app.

## How to start developing
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
1. In the code, set te `PROD` to `false`.
3. Do whatever testing
4. Push?
1. In the code, set te `PROD` back to `true`.

## Miscellaneous
- How to get the current DATABASE_URL in our production server\
`$ heroku config:get DATABASE_URL -a rtd-project-management`
- Run the local server with a connection to the production databse\
`$ DATABASE_URL=$(heroku config:get DATABASE_URL -a rtd-project-management) npm start`
