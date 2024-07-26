import { logger } from "@lib/logger";
import argon2 from "@node-rs/argon2";
import { db, getFirst } from "@lib/db";
import { User, Users } from "@app/schema/user.schema";
import { desc, eq } from "drizzle-orm";
import { OneTimePins, OneTimePin } from "@app/schema/otp.schema";

export const OTP_COLLECTION = "otp" as const;

type RequestOTPOptions = {
  /** Validate user function */
  validate_user?: (user: User | null) => Promise<boolean>;
  /** Rate limit cooldown in milliseconds */
  cooldown?: number;
};

/** OTP Helper functions */
export const OTP = {
  /** Request an OTP
   * @param email - Email to register OTP under
   * @param reason - Reason for requesting OTP (e.g. "login", "register", "email_verification")
   *
   * @example
   * ```ts
   * OTPController.requestOTP("test@example.com", "login");
   * ```
   */
  async requestOTP(email: string, options?: RequestOTPOptions) {
    const {
      validate_user = async (user: User | null) => !!user,
      cooldown = 5000,
    } = options ?? {};

    const otp = OTP.genOTP();
    const hash = await argon2.hash(otp);

    const user = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email))
      .then(getFirst);

    const valid = await validate_user(user);
    if (!valid) {
      throw new Error("User does not exist");
    }

    const latest_otp = await db
      .select()
      .from(OneTimePins)
      .where(eq(OneTimePins.email, email))
      .orderBy(desc(OneTimePins.created_at))
      .then(getFirst);

    if (latest_otp) {
      // 5 second rate limit
      const now = new Date();
      const diff = now.getTime() - latest_otp.created_at.getTime();
      if (diff < cooldown) {
        throw new Error(
          "Please wait 5 seconds before requesting another verification code",
        );
      }
    }

    await db.insert(OneTimePins).values({
      email,
      hash,
    });

    return otp;
  },

  /**
   * Generate a random 8 character OTP
   * @returns {string} OTP
   *
   * @example
   * ```ts
   * const otp = gen_otp();
   * console.log(otp); // "a1b2c3d4"
   * ```
   */
  genOTP(): string {
    const pin =
      Math.random().toString(36).slice(2, 8) +
      Math.random().toString(36).slice(2, 4);

    if (pin.length !== 8) {
      logger.error("holy crap gen_otp actually failed");
      return this.genOTP();
    }

    return pin;
  },

  /**
   * Check if OTP is valid
   * @param email - Email to check OTP for
   * @param code - OTP to check
   * @returns {Promise<OneTimePin>} Verification code
   * @throws {Error} If OTP is invalid
   * @throws {Error} If OTP is already verified
   * @throws {Error} If OTP has been deleted
   * @throws {Error} If OTP is incorrect
   */
  checkOTP: async (email: string, code: string): Promise<OneTimePin> => {
    const verification = await db
      .select()
      .from(OneTimePins)
      .where(eq(OneTimePins.email, email))
      .orderBy(desc(OneTimePins.created_at))
      .then(getFirst);

    if (!verification) {
      throw new Error("No verification code found for this email");
    }

    if (verification.verified_at) {
      throw new Error("Email already verified");
    }

    if (!(await argon2.verify(verification.hash, code))) {
      throw new Error("Invalid verification code");
    }

    return verification;
  },

  /**
   * Burn OTP - Check OTP and mark it as verified
   * @param email - Email to check OTP for
   * @param code - OTP to check
   * @returns {Promise<void>}
   * @throws {Error} If OTP is invalid
   * @throws {Error} If OTP is already verified
   * @throws {Error} If OTP has been deleted
   * @throws {Error} If OTP is incorrect
   * @example
   * ```ts
   * await OTP.burnOTP("test@example.com", "a1b2c3d4");
   * ```
   */
  burnOTP: async (
    email: string,
    code: string,
    reason = "used",
  ): Promise<void> => {
    const verification = await OTP.checkOTP(email, code);

    await db
      .update(OneTimePins)
      .set({
        verified_at: new Date(),
        deleted_reason: reason,
      })
      .where(eq(OneTimePins.id, verification.id));
  },
};
