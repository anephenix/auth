import { describe, expect, it } from "vitest";
import auth from "../auth";
import { SmsCode } from "./SmsCode";

describe("SmsCode model", () => {
	describe("verifyCode", () => {
		describe("when the code is valid", () => {
			it("should return true", async () => {
				const smsCode = new SmsCode();
				const code = "d93j2s";
				smsCode.hashed_code = await auth.hashPassword(code);
				const isValid = await smsCode.verifyCode(code);
				expect(isValid).toBe(true);
			});
		});

		describe("when the code is invalid", () => {
			it("should return false", async () => {
				const smsCode = new SmsCode();
				const code = "d93j2s";
				smsCode.hashed_code = await auth.hashPassword("wrongcode");
				const isValid = await smsCode.verifyCode(code);
				expect(isValid).toBe(false);
			});
		});
	});
});
