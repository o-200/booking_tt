## Project setup

```bash
$ cp .env.example .env
$ npm i
$ npx prisma migrate dev
```

## Compile and run the project

```bash
# start dev database using docker
$ docker compose up -d

# Startup project:

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test
```
