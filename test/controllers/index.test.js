describe('controller', () => {
	describe('#helloWorld', () => {
		it('should return a 200 status code');

		it('should return a message');
	});

	describe('#notFound', () => {
		it('should return a 404 status code');

		it('should return a message');
	});

	describe('#login', () => {
		describe('when the request body is invalid', () => {
			it('should return a 400 status code');

			it('should return a message');
		});

		describe('when the request body is valid', () => {
			describe('when the service returns an error', () => {
				it('should return a 500 status code');

				it('should return a message');
			});

			describe('when the service returns data', () => {
				it('should return a 201 status code');

				it('should return a message');
			});
		});
	});
});
