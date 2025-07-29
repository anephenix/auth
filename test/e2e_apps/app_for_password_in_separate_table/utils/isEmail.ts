// TODO - move to utility and write unit tests for it
const isEmail = (identifier: string): boolean => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
};

export default isEmail;
