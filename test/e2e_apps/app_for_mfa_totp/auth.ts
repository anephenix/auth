import { Auth } from "../../../src/index";

/*
    Question - Would you need to pass any configuration options here for the 
    magic link feature?

    Perhaps if you had a way to load in the rest of the code you'd need:
        - controllers
        - routes
        - services
        - models

    I think that will come at a later stage.
*/

const auth = new Auth({
	sessionOptions: {
		accessTokenExpiresIn: 60 * 15, // 15 minutes
		refreshTokenExpiresIn: 86400 * 7, // 7 days
	},
});

export default auth;
