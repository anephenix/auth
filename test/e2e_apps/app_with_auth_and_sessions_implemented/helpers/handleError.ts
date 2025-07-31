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

const handleError = (error: Error): string => {
	if (error instanceof UniqueViolationError) {
		const message = `${error.columns.join(", ")} already exists.`;
		// Handle unique constraint violation
		return message;
	}
	return error.message;
};

export default handleError;
