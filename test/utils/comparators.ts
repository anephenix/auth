const isRandomString = (str: string) => {
	return /^[a-f0-9]{64}$/.test(str);
};

const isHashed = (str: string) => {
	return /^\$argon2id\$v=(?:16|19)\$m=\d{1,10},t=\d{1,10},p=\d{1,3}(?:,keyid=[A-Za-z0-9+/]{0,11}(?:,data=[A-Za-z0-9+/]{0,43})?)?\$[A-Za-z0-9+/]{11,64}\$[A-Za-z0-9+/]{16,86}$/i.test(
		str,
	);
};

const isEmail = (identifier: string): boolean => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
};

const isIsoString = (date: string) => {
	const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
	return isoRegex.test(date);
};

export { isEmail, isRandomString, isHashed, isIsoString };
