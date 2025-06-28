# 🔥 STRAPI Starter Template

This is a [Stapi v5](https://strapi.io/) project.

## 🥞 Tech stack

- node 22
- yarn 1.22
- Strapi 5
- TypeScript
- Docker
- Postgres 16 alpine (in local docker container)

## 📦 Included plugins and packages

- @strapi/plugin-color-picker
- @strapi/plugin-i18n
- @strapi/plugin-sentry
- @strapi/plugin-seo
- @strapi/plugin-users-permissions
- @strapi/provider-email-mailgun
- @strapi/provider-upload-aws-s3
- strapi-plugin-config-sync
- strapi-v5-plugin-populate-deep
- qs
- lodash
- pg

## 🚀 Get up and develop

### Environment variables

Copy & rename `.env.example` to `.env` and fill or update the values (most of the values are already set to default values, but you probably want to tweak them for your needs).

### Run locally in dev mode (with hot-reloading)

Preferred way of running Strapi locally is to run **Postgres in docker** container and **Strapi locally**.

```bash
(nvm use) # switch node version
(yarn) # deps are probably already installed running `yarn` in root

# start both services in 1 command [easiest way]
yarn dev
```

or

```bash
(nvm use) # switch node version
(yarn) # deps are probably already installed running `yarn` in root

# start Postgres in docker container
docker compose up -d db

# start Strapi locally
yarn develop
```

Another way is to run **Strapi in docker** container too. Currently, an available Strapi [Dockerfile](Dockerfile) is prepared only for **production** run (see below).

#### Default dev addresses

- Strapi runs on [http://localhost:1337](http://localhost:1337)
- Admin panel is available on [http://localhost:1337/admin](http://localhost:1337/admin)
- Postgres runs on [http://localhost:5432](http://localhost:5432)

### Init database

There is `strapi-export.tar.gz` file in root directory with some init data. You can optionally import it to your local database with:

```bash
# in this directory

yarn strapi import -f strapi-export.tar.gz
```

### Sync configuration

Go to Strapi admin panel and navigate to Settings > Config Sync > Tools. Click on "Import" button to import the configuration from files. More info about config sync is [below](#config-sync).

## 🛠️ Production build (Docker)

To build and run Strapi in Docker container use [Dockerfile](Dockerfile) prepared for **production** environment. It follows Strapi official documentation and recommended way of running app in Turborepo monorepo structure. Note, that Turborepo requires access to root `package.json`, `yarn.lock` and `turbo.json` files so you have to build it within whole monorepo context - run `docker build` from monorepo root. [More info here](https://turbo.build/repo/docs/handbook/deploying-with-docker).

```bash
# from monorepo root

# build image, name it and pass APP_URL as build arg to override localhost:1337 default value
docker build -t strapi:latest -f apps/strapi/Dockerfile --build-arg APP_URL=https://cms.strapi-domain.dev .

# run container using image
docker run -it --rm --name strapi -p 1337:1337 --env-file apps/strapi/.env strapi:latest
```

To change port, set `PORT` env variable in `.env` file and in `docker run` command (`-p` flag means port mapping between host:container).

Strapi requires Postgres database to run before it starts. There is no production `docker-compose.yml` file prepared with both services connected. Usually they are run separately (database in one container or in cloud servise, Strapi in another container).

To connect 2 different containers (Strapi and Postgres) in Docker, you have to create a network and run both containers in that network. So, for example, to run whole strapi app in docker containers:

```bash
# run Postgres in docker - you can use docker-compose.yml from this directory
docker compose up -d db

# run Strapi in docker and connect to same network. In docker-compose.yml there is a "db_network" network already defined, so you don't need to create it manually again, but just reference it in this run command
docker run -it --rm --name strapi -p 1337:1337 --env-file apps/strapi/.env --network=dev-templates_db_network strapi:latest

# set DATABASE_HOST or DATABASE_URL for Strapi in .env file - host should be set to "db" (name of the Postgres service in docker-compose.yml) or to IP of the host machine instead of "0.0.0.0"
DATABASE_HOST=db
```

## ✨ Features

### Plugins

Some preinstalled plugins (mailgun) are disabled by default. To turn them on go to [config/plugins.ts](config/plugins.ts) file and uncomment the lines. Some of them may require additional setting of API keys or different ENV variables.

User-permissions, seo and config-sync plugins are enabled by default. Sentry plugin requires setting up DSN key in ENV variables (see below).

#### AWS S3 caveats

In Heroku deployments you always should use S3 (or different external) storage instead of default local upload directory. Heroku resets dyno periodically (at least once a day or after every re-deploy) and so all uploaded files are removed.

Steps:

- go to [AWS console login](https://signin.aws.amazon.com/signin) and create bucket
- set ENV vars (at least `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_SECRET`, `AWS_REGION`, `AWS_BUCKET`)
- in [config/middlewares.ts](config/middlewares.ts) whitelist URL of that S3 bucket in `directives` and `img-src` objects. Otherwise Strapi blocks these URLs and images are broken in UI. By default whole "amazonaws.com" is whitelisted, but you can be more specific here.

[More info here](https://market.strapi.io/providers/@strapi-provider-upload-aws-s3)

#### Sentry logging

Tu enable Sentry plugin, set `SENTRY_DSN` to environment variables. By default, Sentry runs only in production mode, but you can change it in [config/plugins.ts](config/plugins.ts) file.

Sentry service can be used in Strapi controllers and services as any other service. Uncaught errors are logged automatically. More information can be found in [Sentry](https://docs.sentry.io/platforms/javascript/) and [Strapi](https://docs.strapi.io/dev-docs/plugins/sentry) docs.

```ts
// example of how to use Sentry in controller

async find(ctx) {
    // this will log error to Sentry automatically
    throw new Error("Not implemented")

    // get sentry service
    const sentry = strapi.plugin("sentry").service("sentry")

    // manual error logging
    sentry.sendError(new Error("My custom error"))

    // get direct access to the Sentry instance
    const instance = sentry.getInstance()
    // call captureMessage or other Sentry functions
    // pay attention, instance is undefined if Sentry is disabled (during development)
    instance?.captureMessage("My custom message")

    return []
},
```

#### Config-sync

[strapi-plugin-config-sync](https://www.npmjs.com/package/strapi-plugin-config-sync) plugin is installed by default to sync configuration between environments.

#### Relation population

The deep population logic is adapted from [strapi-v5-plugin-populate-deep](https://www.npmjs.com/package/strapi-v5-plugin-populate-deep) for use in this project. Its purpose is to populate the `content` dynamic zone of a page. This zone contains many nested components, all of which are fetched at once.

> [!CRITICAL]
> Deep population is not recommended for performance reasons. It’s always better to populate only the data you need. In future versions of this template, this logic will be removed and replaced with dynamic data population on the frontend.

The plugin is registered in the [populateDeep.ts](src/lifeCycles/populateDeep.ts) file, and its implementation can be found in [utils/populate-deep.ts](src/utils/populate-deep.ts). It is used in the `find` and `findOne` methods and is controlled via the `deepLevel` and `deepLevelIgnore` query parameters.

### Typescript

[Typescript is used in this template](https://docs.strapi.io/dev-docs/typescript). Typings schemas are generated automatically after code change by Strapi (based on configuration in [config/typescript.ts](config/typescript.ts) and stored in [types/generated/\*](types/generated) as ts definition files. Do not modify them manually, let Strapi do it. Don't forget to version them in git.

> [!WARNING]
> By enabling and generating types in Strapi, the API and models on the frontend are typed out-of-box. By turning it off, the code related to the API on the frontend will have to be modified.

### Lifecycle hooks

#### Registration emails

In [src/index.ts](src/index.ts) there are prepared hooks for sending email to admin and user after registration (`afterCreate` hook). By default they are **disabled** (commented out). Before enabling them, you have to turn on email plugin in `config/plugins.ts` and provide required ENV variables (**without email service emails won't work and Strapi will die with every user registration**).

### Transfer data between environments

Data can be easily transferred between environments in multiple ways. Check out official docs [https://docs.strapi.io/dev-docs/data-management](https://docs.strapi.io/dev-docs/data-management). Scripts are prepared in `package.json` see `export:all`, `export:content`, `import`, `transfer`.

### Cron jobs

Edit `config/cron-tasks.ts` to add cron jobs. Enable them by setting `CRON_ENABLED=true` in `.env` file.

### Strapi Live Previews

This starter supports Strapi's new feature: [Previews](https://docs.strapi.io/cms/features/preview). It works by embedding an iframe of the frontend application directly inside the editor.

In order to enable the feature, you need to configure the following environmental variables:

- `STRAPI_PREVIEW_ENABLED`: `true` to enable, otherwise disabled
- `CLIENT_URL`: Absolute URL of the frontend application (http://127.0.0.1:3000 for local development in most cases)
- `STRAPI_PREVIEW_SECRET`: shared secret between frontend and backend, which is used to authenticate if the preview can be viewed.
  If configured correctly, you should be able to visit previews for content types that have been implemented in the `preview.config` configuration object in `config/admin.ts`.
