describe('Auth service', () => {
	describe('initialization', () => {
		it('should initialize the service');
	});

	describe('#login', () => {
		describe('when the username and/or password are not provided', () => {
			it(
				'should throw an error about the username and password being required'
			);
		});

		describe('when the username and password are correct', () => {
			it('should create a session');

			it('should return a payload with the session id and token');
		});

		describe('when the username is not found', () => {
			it('should throw an error about the user not being found');
		});

		describe('when the password is incorrect', () => {
			it('should throw an error about the password being incorrect');
		});
	});
});
