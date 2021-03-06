# project-management-server
## Overview
The server side app to go with the client app ([repo](https://github.com/rickythedeveloper/project-management-client/))
The production API is found at https://rtd-project-management.herokuapp.com/ .

---

## Developer Guide
### Pulling the database from Heroku
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
1. You are ready to go!

### Pushing the database to Heroku
Run the following.
`$ heroku pg:reset --confirm rtd-project-management; heroku pg:push projman DATABASE_URL --app rtd-project-management`

### Pushing the code to Heroku
`$ git push heroku main` (if you want to push local main).\
`$ git push heroku whatever_local_branch:main` (if you want to push a local branch other than main)

### Checking the API from terminal / browser
Method | Command
:-: | :-
GET | Go to http://localhost:8000/category or http://localhost:8000/category/id
POST | `$ curl -X POST http://localhost:8000/category -d "data=some data"`
PUT | `$ curl -X PUT http://localhost:8000/category/id -d "data=some data"`
DELETE | `$ curl -X DELETE http://localhost:8000/category/id`

### Miscellaneous
#### How to
- get the current DATABASE_URL in our production server\
`$ heroku config:get DATABASE_URL -a rtd-project-management`
- run the local server with a connection to the production databse\
`$ DATABASE_URL=$(heroku config:get DATABASE_URL -a rtd-project-management) npm start`

---

## Database structure
### Primitive Tables
#### user_accounts
Column | Type | Collation | Nullable | Default
:---:  | :--: | :--:      | :---:    | :---:
 id            | integer               |           | not null | nextval('user_accounts_id_seq'::regclass) 
 username      | character varying(30) |           | not null | 
 password_salt | character varying(40) |           | not null | 
 password_hash | character(60)         |           | not null | 
 name          | character varying(50) |           | not null | 
#### projects
Column | Type | Collation | Nullable | Default                
:---: | :---: | :---: | :---: | :---:
 id            | integer               |           | not null | nextval('projects_id_seq'::regclass)
 name          | character varying(30) |           | not null | 
 owner_user_id | integer               |           |          | 

#### tickets
Column | Type | Collation | Nullable | Default               
:-: | :-: | :-: | :-: | :-: 
 id               | integer               |           | not null | nextval('tickets_id_seq'::regclass)
 project_id       | integer               |           | not null | 
 created_user_id  | integer               |           |          | 
 index_in_project | integer               |           | not null | 
 title            | character varying(50) |           | not null |

#### metrics 
Column | Type | Collation | Nullable | Default               
:-: | :-: | :-: | :-: | :-: 
 id         | integer               |           | not null | nextval('metric_id_seq'::regclass)
 project_id | integer               |           | not null | 
 title      | character varying(20) |           | not null | 

#### metric_options
Column | Type??| Collation | Nullable |??Default                  
:-: | :-: | :-: | :-: | :-: | 
 id              | integer               |           | not null | nextval('metric_option_id_seq'::regclass)
 metric_id       | integer               |           | not null | 
 index_in_metric | integer               |           | not null | 
 option_string   | character varying(20) |           | not null | 

#### user_data
TODO

### Relational Tables
#### user_projects
Column | Type | Collation | Nullable | Default 
:-: | :-: | :-: | :-: | :-:
user_id    | integer |           | not null | 
project_id | integer |           | not null | 

#### ticket_asignees
Column | Type | Collation | Nullable | Default 
:-: | :-: | :-: | :-: | :-:
 ticket_id        | integer |           | not null | 
 assignee_user_id | integer |           | not null | 
