# User-Management - Work in Progress

## Sources
https://www.docker.com/blog/how-to-use-the-postgres-docker-official-image/

Use latest release of penultimate postgres version: https://www.postgresql.org/docs/release/

https://medium.com/@jewelski/quickly-set-up-a-local-postgres-database-using-docker-5098052a4726

https://www.pgadmin.org/docs/pgadmin4/latest/index.html

## Start services

```bash
cd database
docker-compose up -d
docker ps
```

## Test user creation
```bash
curl -X POST http://localhost:8001/api/register/ \
-H "Content-Type: application/json" \
-d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword123"
}'
```

Collecting workspace information

I'll help you update the

README.md

 with instructions for starting services and testing user creation:

```markdown
## How to start the services

1. Navigate to the database directory:
```bash
cd database
```

2. Start all services using Docker Compose:
```bash
docker-compose up -d
```

3. Verify services are running:
```bash
docker ps
```

You should see three containers running:
- PostgreSQL database (data)
- pgAdmin (pgadmin)
- User Service (user-service)

## How to test user creation

1. Test the user registration endpoint using curl:

```bash
curl -X POST http://localhost:8001/api/register/ \
-H "Content-Type: application/json" \
-d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword123"
}'
```

2. Verify user creation through pgAdmin:
- Open http://localhost:5050 in your browser
- Login with:
  - Email: admin@admin.com
  - Password: bar
- Add new server connection:
  - Name: local
  - Host: database
  - Port: 5432
  - Database: postgres
  - Username: admin
  - Password: foo
- Navigate to:
  - Servers → local → Databases → postgres → Schemas → public → Tables → api_user
- Right-click on api_user → View/Edit Data → All Rows

3. Direct database verification using psql:
```bash
# Connect to PostgreSQL
docker exec -it data psql -U admin postgres

# List all tables
\dt

# View users
SELECT username, email FROM api_user;

# Exit psql
\q
```
