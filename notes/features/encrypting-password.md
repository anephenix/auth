# Feature - encrypting the password

I want to create a way to setup a new User record in a database, and have the password that they use be encrypted, so that it is stored securely.

## Requirements

- [ ] Have a function to encrypt a password and return a hash for it
- [ ] Have a way for an ORM model to use that to encrypt the password before it is stored in the database
- [ ] Have a way for the ORM model to apply updates to the record without triggering an unnecessary update to the password field
- [ ] Have a way for the ORM model to reject a password if it is not secure enough, or non-existent, say ""

## Nice to haves

- [ ] Have a way to configure what field in the ORM is used for the password
- [ ] Have a way to setup the Password as a separate table so that you can attach it to a users table separately, rather than needing it to be implicitly stored with the Users table.
- [ ] Have a way to setup passwords so that they can be disabled, or expire after a certain time

## Thoughts

Actually, why does a password need to be stored in the Users table, if it can be stored in its own table, and simply associated with another model?

Then, you can have passwords linked to all kinds of things, not just users.

One possibility is that if you have it stored in a separate database/table, then every call to authenticate a user requires at least 2 database queries instead of just one, or you perform a query with a join to then fetch the user and the password field at the same time.

At a small scale this isn't really an issue (plus how often do password authentications occur?), but at large scale could this become a bottleneck - particularly with a popular service?

### How would that look like as a code example?

Well, you would probably need some kind of polymorphic association (id and type) to help specify that a password belongs to a user, and that in theory, a user could have multiple passwords (expired ones and the current one).

```typescript
import { Model } from 'objection';

// Q - Would we call this model password, as password.password feels repetitive. Maybe Credential as the model name instead?
export class Password extends Model {
    static tableName = 'passwords';

    // Q - Would we use a number or a uuid for the id fields?
    // Q - How would we setup the relationMappings for this?
    id!: number;
    entity_id!: number;
    entity_type!: string;
    password!: string;

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['entity_id', 'entity_type', 'password'],
            properties: {
                id: { type: 'integer' },
                entity_id: { type: 'integer' },
                entity_type: { type: 'string', minLength: 1 },
                password: { type: 'string', minLength: 1 },
            },
        };
    }
}
```

Then you would need to have some kind of way to do the following programmatically:

1 - Create the password record when a new user is created.
2 - Authenticate the user with their password record when they attempt to login
3 - Be able to update a password record when the user wants to update it.

You could create these as functions that abstract away the Password ORM model, and help to keep the integration simple for the developer.

```typescript
import { createPassword } from "@anephenix/auth";

// Some example code of creating a user

const newUser = new User({usernname: "paul", password: "mysecretpassword"});
await newUser.save();

// Inside of the User Model in Objection, we have this:

import { Model } from 'objection';
import { createPassword } from "@anephenix/auth";

export class User extends Model {
    static tableName = 'users';

    id!: number;
    username!: string;
    password?: string; // Plain password, only used during creation

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['username'],
            properties: {
                id: { type: 'integer' },
                username: { type: 'string', minLength: 1 },
                password: { type: 'string' },
            },
        };
    }

    /* 
        Hmm, here is an interesting problem
        
        If having a password saved is a key requirement before saving the 
        model, then that won't work because we only have an id for the model 
        once it is saved.
        
        Therefore, we probably need to do something else:

        1 - Validate the password before saving (if the password is valid, we 
            can create it)
        2 - When creating the password, we need some kind of unique id stored 
            in both the user model and the password model to create an 
            association. We could also remove the need for a polymorphic 
            association.

        There are in essence 3 things that need to happen:

        1 - Validating the password
        2 - Creating the password record
        3 - Creating the association between the password and the related 
            entity it belongs to (the user in this case). 

    */
    async $afterInsert(context: any) {
        if (this.password) {
            await createPassword({
                entity_id: this.id,
                entity_type: 'User',
                password: this.password,
            });
        }
    }
}
```

### Item 1 - Validating the password

- We need something that can validate the password:
    - Check that it is present (and not an empty string)
    - Check that the password is long enough and meets criteria
    - Perhaps if doing password rotation, ensure that the password has not 
      been used previously.
    
### Item 2 - Creating the password

- We need something that can create the password record:
    - Hash the password and save it in the database table
    - Creating an id of some kind for potentially associating with the other entity

### Item 3 - Creating the association between the password and the entity.

- What is created first, the user or the password?
- Could you create a unique key and share it between the 2?
    - Save it on the User model, and then save it on the password model?

- Alternatively, you beforeInsert, validate the password, then afterInsert, create the password with the user id.
- That way, you can confirm that the user will be created alongside the password record, and store the user id and type in the password record.
- One caveat to keep in mind is that the id for the User could be a number or a string (for uuid), and you would need to be able to cater for that in a flexible way.
- Perhaps you can store it as a string (even a number could be stored as a string), and that resolves the issue.
- You would also need to have a way to find the password record for the user, in order to authenticate it.

### Ok, so the plan is:

1 - Implement a function to validate a password (a string, and if the user is an existing one, potentially pass their name and type in order to identify if it is a re-used password)

```typescript
import { Auth } from "@anephenix/auth";

const auth = new Auth({});

const examplePassword = 'letmein';

// Q - how do we specify the password criteria (min length, characters used etc)
// Q - how do we validate the password for an existing user against their existing set of passwords, or prevent re-using an old password?

/*
    Perhaps to answer the 2 questions below, you create a class instance from @anephenix/auth, passing things like:

    1 - What kind of authentication options to enable (password, magic link, MFA) along with the options for each kind
    2 - You can then configure it to be attached to a Objection.js model (User) as a separate table
    3 - 
*/

/*
  Q - Should this be an async/await call?
  
  Maybe not unless it has to do a DB call, say to check for existing 
  passwords that match it, if say reusing past passwords is forbidden.
*/
const isValid = auth.validatePassword(examplePassword);
```

## Ask an LLM for its "opinion"

So, I asked Gemma 3 for it's opinion, and here is a record of that conversation:

### My question

<i>
Afternoon. I'm building an authenitcation library in Node.js that allows a developer to setup authentication for their web app or API. One of the features in it is to specify the rules for a valid password (e.g. minimum length, maximum length (if that is a thing), the type of characters it must use, how many of them etc. Could you describe how to achieve that - would a regex be sufficient to pass in, or should it be passed in another way e.g. a function that checks the password, or a array of functions acting as rules.
</i>

### The LLM's answer

Okay, building an authentication library with flexible password rules is a 
solid design. Let's break down the best approach for implementing this in 
Node.js. A single regex might be *part* of the solution, but it's unlikely 
to be sufficient on its own to capture all the complexity you're aiming 
for. Here's a breakdown of options and recommendations, considering both 
expressiveness and maintainability:

**1.  The Recommended Approach:  A Configuration Object (Most Flexible & 
Maintainable)**

This is generally the most flexible and adaptable approach for your 
library. It avoids tightly coupling to regexes which can be brittle and 
difficult to modify.

* **Data Structure:**  You'll define a configuration object that holds the 
password rules. This object will have keys for each rule type.

```javascript
const passwordRules = {
  minLength: 8,
  maxLength: 20,
  charTypes: ['lowercase', 'uppercase', 'numbers', 'symbols'], // Array of 
allowed character types
  requiredSymbols: true, // Boolean - is a symbol required
  minNumbers: 2,
  maxNumbers: 4,
  minLowercase: 2,
  maxLowercase: 4,
  minUppercase: 2,
  maxUppercase: 4
};
```

* **Validation Function:**  Create a function that takes the password and 
the `passwordRules` configuration and performs the validation.

```javascript
function validatePassword(password, rules) {
  const { minLength, maxLength, charTypes, requiredSymbols, minNumbers, 
maxNumbers, minLowercase, maxLowercase, minUppercase, maxUppercase } = 
rules;

  if (password.length < minLength || password.length > maxLength) {
    return false;
  }

  if (requiredSymbols && !hasSymbols(password)) {
    return false;
  }

  if (minNumbers && password.match(/\d/g).length < minNumbers) {
      return false;
  }

  if (maxNumbers && password.match(/\d/g).length > maxNumbers) {
      return false;
  }


  if (minLowercase && password.match(/[a-z]/g).length < minLowercase) {
      return false;
  }

  if (maxLowercase && password.match(/[a-z]/g).length > maxLowercase) {
      return false;
  }

  if (minUppercase && password.match(/[A-Z]/g).length < minUppercase) {
      return false;
  }

  if (maxUppercase && password.match(/[A-Z]/g).length > maxUppercase) {
      return false;
  }


  // Add more checks for specific char types here, using regex or simple 
string methods
  return true;
}

// Helper function to check for symbols (very basic)
function hasSymbols(password) {
  return /[!@#$%^&*()_+{}\[\]:;<=>?]+/.test(password);
}
```

* **Usage:**

```javascript
const password = 'P@sswOrd123';
const isValid = validatePassword(password, passwordRules);
console.log(isValid); // true
```

**2.  Regex-Based Approach (Use with Caution)**

While possible, relying *solely* on regex is generally less desirable for 
several reasons:

* **Complexity:** Complex password rules quickly become unwieldy and 
difficult to read within a regex.
* **Maintainability:** Changing a regex that covers multiple rules can be 
difficult to debug and modify.
* **Performance:** Complex regexes can be slower to execute.

If you *must* use regexes, you could have a single regex that accepts a 
range of allowed characters based on the configuration.  However, this 
approach will likely be difficult to extend as your rule requirements 
evolve.

**3. Array of Functions (Less Common, More Specialized)**

This approach involves an array of functions, each performing a specific 
validation check (e.g., checking for a minimum number of uppercase 
letters, a maximum number of digits, etc.).

```javascript
const validationFunctions = [
  (password) => password.length >= 8,
  (password) => password.match(/[A-Z]/g).length >= 2, // at least 2 
uppercase
  (password) => password.match(/\d/g).length >= 2       // at least 2 
numbers
];

function validatePasswordWithFunctions(password, functions) {
  for (const func of functions) {
    if (!func(password)) {
      return false;
    }
  }
  return true;
}

const password = 'P@sswOrd123';
const isValid = validatePasswordWithFunctions(password, 
validationFunctions);
console.log(isValid); // true
```

**Why the Configuration Object is the Best Choice:**

* **Clarity:** The rules are clearly defined in a single, 
easy-to-understand object.
* **Extensibility:**  Adding new rule types is straightforward – simply 
add a new key to the `passwordRules` object and update the validation 
function accordingly.
* **Testability:** It's easy to write unit tests for the validation 
function, verifying that it correctly applies the configured rules.
* **Separation of Concerns:**  The configuration object encapsulates the 
rules, separating them from the actual validation logic.

**Key Considerations for your Library**

* **Character Type Handling:** If you need to support a very large range 
of character types (e.g., Unicode characters), consider using a library 
specifically designed for that purpose.
* **Password Strength Scoring:** You might consider adding a "strength" 
scoring mechanism as an additional feature, based on the complexity of the 
password.

To help me refine my answer and give you even more targeted advice, could 
you tell me:

*   What is the expected level of complexity of the password rules you 
need to support?  (e.g., just length and a few character types, or more 
sophisticated requirements?)
*   Are there any specific performance concerns you need to address?

### My thoughts

Though I like the idea of using an array of functions to validate a password, 
I think that the object with configuration options would be the best one for 
developers to understand and use, so I will opt for that.