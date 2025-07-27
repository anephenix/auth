# Auth module

So, this is a library that provides:

* Authentication for users:
  * username and password
  * magic link
  * MFA support
* Forgot password flow
* Reset password flow
* Update password flow
* Update username/email flow
* Logout flow

----

## First task - cleanup the auth codebase first

- Use Modern Tooling
- Implement the setup that you have in other libraries to get it aligned
  - Use vitest for tests
  - Use biome for formatting/linting
  - Setup security check in GitHub
  - Setup dependabot in GitHub to get latest updates
  - Setup npm publish token for automatic token
  - Setup TypeScript and what is put into dist
  - Setup size for checking export size
  - 