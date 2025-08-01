# App for password in the users table table

## Introduction

This app is testing the use case of using Auth with:

- password authentication enabled
- the password is stored in the users table
- the sessions are stored in a sessions table in the same database, rather than
  in Redis.

The idea being that this is an app that can run as a self-contained app with no 
dependencies other than Node.js

So in theory, you could install and run in one go - no need to run other 
3rd-party tools like Redis.

I'm curious to see how well this would work - say for an application used 
internally, as opposed to an app on the web that is serving many customers 
(I don't think that sqlite would be able to handle that, especially if it is 
handling the sessions as well).

## What do you need to build in order for this to work

- [x] Setup Auth with options for password validation and session configuration
- [x] Setup a User model with the password stored in the users table
- [x] Setup a Sessions model which will store the session tokens and expiry times in them
- [x] Setup a Fastify API endpoint for POST /signup
- [x] Setup a Fastify API endpoint for POST /login
- [x] Setup a Fastify API endpoint for GET /profile
- [x] Setup a Fastify API endpoint for POST /logout
- [x] Setup a Fastify API endpoint for POST /auth/refresh
- [ ] Setup a Fastify API endpoint for GET /sessions
- [ ] Setup a Fastify API endpoint for DELETE /sessions/:id (used to log out a session)
- [ ] Setup a Fastify API endpoint for DELETE /sessions (used to log out of all sessions)
- [ ] Write some unit tests for the User model (when you get a moment)
- [ ] Do a sweep of the codebase to re-organise code that is used across apps
- [ ] Identify code that could do with some unit tests (if not covered already)
- [ ] Update the unit tests that check cookie-based authorization to use the fetchWithCookie option

So, let's deal with the 1st item - Setting up Auth
