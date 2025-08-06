import {
	//   ValidationError,
	//   NotFoundError,
	//   DBError,
	//   ConstraintViolationError,
	UniqueViolationError,
	//   NotNullViolationError,
	//   ForeignKeyViolationError,
	//   CheckViolationError,
	//   DataError
} from "objection";

/*
	This is used to handle errors and print a user-friendly message in place 
	of the raw error, as well as prevent sensitive data like raw SQL 
	statements from being exposed.
*/
const handleError = (error: Error): string => {
	if (error instanceof UniqueViolationError) {
		const message = `${error.columns.join(", ")} already exists.`;
		// Handle unique constraint violation
		return message;
	}
	return error.message;
};

export default handleError;
