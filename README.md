# project-management-server

Server side app.

## To pull heroku database
1. Start a postgresql server locally
`$ brew services start postgresql`
2. Pull database from heroku
`$ heroku pg:pull DATABASE_URL testdb --app rtd-project-management`
3. Open the database
`$psql testdb`