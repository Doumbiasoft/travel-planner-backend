import { Request, Response } from "express";
import { sendResponse, sendError } from "../../utils/apiResponseFormat";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  Router,
  Get,
  Post,
  Delete,
  Patch,
  Use,
  Req,
  Res,
} from "@reflet/express";
import { HttpStatus } from "../../types/httpStatus";
import {
  validateBody,
  ValidationPatterns,
} from "../../middlewares/validation.middleware";
import { logRequest } from "../../middlewares/logging.middleware";
import { endpointMetadata } from "../../middlewares/endpointMetadata.middleware";
import { buildRoute } from "../../config/apiPrefix";
import {
  createUser,
  deleteUserAccount,
  findUser,
  findUserById,
  findUserByIdWithoutPassword,
  findUserByPasswordResetToken,
  updateUserByActivationToken,
  updateUserById,
} from "../../services/user.service";
import { User } from "../../models/User";
import { ENV } from "../../config/env";
import { readEmailTemplateContent } from "../../utils/emailTemplateReader";
import {
  ACCOUNT_ACTIVATION_TEMPLATE,
  ACCOUNT_PASSWORD_RESET_TEMPLATE,
} from "../../utils/constantEmailTemplatesNames";
import { EmailBox } from "../../models/EmailBox";
import { saveEmailBox } from "../../services/mailbox.service";
import authMiddleware from "../../middlewares/auth.middleware";
const REFRESH_TOKEN_PATH = "/api/v1/auth/refresh-token";

@Router(buildRoute("v1/auth"))
class AuthController {
  @Post("/register")
  @Use(
    endpointMetadata({
      summary: "Register a new user",
      description:
        "Register a new user with firstName, lastName, email, password",
    }),
    validateBody({
      rules: [
        {
          field: "firstName",
          required: true,
          type: "string",
          minLength: 3,
          maxLength: 50,
        },
        {
          field: "lastName",
          required: true,
          type: "string",
          minLength: 3,
          maxLength: 50,
        },
        {
          field: "email",
          required: true,
          type: "string",
          pattern: ValidationPatterns.EMAIL,
        },
        {
          field: "password",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async register(@Req req: Request, @Res res: Response) {
    let template: any = await readEmailTemplateContent(
      ACCOUNT_ACTIVATION_TEMPLATE
    );
    const { firstName, lastName, email, password } = req.body;

    try {
      if (!firstName || !lastName || !email || !password)
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      const existUser = await findUser(email);
      if (existUser) {
        return sendError(
          res,
          `This email address '${email}' is already in use. Please choose a different email`,
          HttpStatus.CONFLICT
        );
      }

      const hash = await bcrypt.hash(password, 10);

      const data: Partial<User> = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hash,
      };
      const user = await createUser(data);
      const accountActivationToken = jwt.sign(
        { _id: user._id },
        ENV.JWT_SECRET
      );
      user.activationToken = accountActivationToken;
      await user.save({ validateBeforeSave: false });

      const name = firstName.toString().split(" ")[0];
      template = template
        .replaceAll("%Name%", name)
        .replace(
          "%Link%",
          `${ENV.CLIENT_URL}/account/activate/${accountActivationToken}`
        );
      const activationEmail: Partial<EmailBox> = {
        to: { name: name, email: email },
        subject: "✅ Activate Your Travel Planner Account",
        content: template,
      };

      await saveEmailBox(activationEmail);
      return sendResponse(
        res,
        { ok: true },
        "User registered successfully",
        HttpStatus.CREATED
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post("/login")
  @Use(
    endpointMetadata({
      summary: "Sign in a user",
      description: "Sign in a user with email, password",
    }),
    validateBody({
      rules: [
        {
          field: "email",
          required: true,
          type: "string",
          pattern: ValidationPatterns.EMAIL,
        },
        {
          field: "password",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async login(@Req req: Request, @Res res: Response) {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);
      }

      const user = await findUser(email);
      if (!user) {
        return sendError(res, "Invalid credentials", HttpStatus.UNAUTHORIZED);
      }

      // Check if account is active
      if (!user.isActive) {
        return sendError(
          res,
          "Account not activated. Please check your email for activation link.",
          HttpStatus.UNAUTHORIZED
        );
      }

      if (!user.password || user.password === "") {
        return sendError(res, "Invalid credentials", HttpStatus.UNAUTHORIZED);
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return sendError(res, "Invalid credentials", HttpStatus.UNAUTHORIZED);
      }

      const accessToken = jwt.sign({ _id: user._id }, ENV.JWT_SECRET, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign({ _id: user._id }, ENV.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
      });

      user.activationToken = "";
      await user.save({ validateBeforeSave: false });

      return sendResponse(
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: ENV.NODE_ENV === "production",
          sameSite: "strict",
          path: REFRESH_TOKEN_PATH,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
        { accessToken: accessToken },
        "User signed in successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post("/refresh-token")
  @Use(
    endpointMetadata({
      summary: "User refresh token",
      description: "This allow a user to get a refresh token",
    }),
    logRequest()
  )
  async refreshToken(@Req req: Request, @Res res: Response) {
    const token = req.cookies?.refreshToken;
    if (!token)
      return sendError(res, "No refresh token", HttpStatus.UNAUTHORIZED);
    try {
      const payload = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as {
        _id: string;
      };
      const accessToken = jwt.sign({ _id: payload._id }, ENV.JWT_SECRET, {
        expiresIn: "15m",
      });
      return sendResponse(
        res,
        { accessToken: accessToken },
        "Refresh token regenerated successfully",
        HttpStatus.OK
      );
    } catch (err) {
      return sendError(
        res,
        "Invalid/expired refresh token",
        HttpStatus.UNAUTHORIZED
      );
    }
  }
  @Get("/me")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Get user info",
      description: "This fetch the current user info",
    }),
    logRequest()
  )
  async me(@Req req: Request, @Res res: Response) {
    if (!req.user?._id) {
      return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    const user = await findUserByIdWithoutPassword(req.user._id);
    return sendResponse(
      res,
      { user: user },
      "Fetched user info successfully",
      HttpStatus.OK
    );
  }
  @Post("/logout")
  @Use(
    endpointMetadata({
      summary: "Log out a user",
      description: "This logout the current user",
    }),
    logRequest()
  )
  async logout(@Req _req: Request, @Res res: Response) {
    res.clearCookie("refreshToken", { path: REFRESH_TOKEN_PATH });
    return sendResponse(
      res,
      { ok: true },
      "User logout successfully",
      HttpStatus.OK
    );
  }

  @Patch("/activate")
  @Use(
    endpointMetadata({
      summary: "Account activation",
      description: "Current user account activation",
    }),
    validateBody({
      rules: [
        {
          field: "accountActivationToken",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async activate(@Req req: Request, @Res res: Response) {
    const { accountActivationToken } = req.body;

    try {
      if (!accountActivationToken)
        return sendError(
          res,
          "Missing activation token",
          HttpStatus.BAD_REQUEST
        );
      const user = await updateUserByActivationToken(accountActivationToken, {
        activationToken: "",
        isActive: true,
      });
      if (!user) return sendError(res, "Expired link", HttpStatus.UNAUTHORIZED);

      return sendResponse(
        res,
        { ok: true },
        "User account activated successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("/forgot-password")
  @Use(
    endpointMetadata({
      summary: "Reset password",
      description:
        "Start the process of resetting a registered user's password by sending an email to change the password",
    }),
    validateBody({
      rules: [
        {
          field: "email",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async resetPassword(@Req req: Request, @Res res: Response) {
    const { email } = req.body;

    try {
      if (!email)
        return sendError(res, "Missing email field", HttpStatus.BAD_REQUEST);
      const user = await findUser(email, true);
      if (!user)
        return sendError(res, "Email not found", HttpStatus.UNAUTHORIZED);

      let template: any = await readEmailTemplateContent(
        ACCOUNT_PASSWORD_RESET_TEMPLATE
      );
      const passwordResetToken = jwt.sign({ _id: user._id }, ENV.JWT_SECRET, {
        expiresIn: "15m",
      });
      user.passwordResetToken = passwordResetToken;
      await user.save({ validateBeforeSave: false });
      const name = user.firstName.toString().split(" ")[0];
      template = template
        .replaceAll("%Name%", name)
        .replace(
          "%Link%",
          `${ENV.CLIENT_URL}/account/change-password/${passwordResetToken}`
        );
      const resetPasswordEmail: Partial<EmailBox> = {
        to: { name: name, email: email },
        subject: "🔁 🔑 Reset Your Account Password!",
        content: template,
      };

      await saveEmailBox(resetPasswordEmail);
      return sendResponse(
        res,
        { ok: true },
        "Reset password email has been sent successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("/verify-current-password")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Verify password",
      description: "Verify the current password",
    }),
    validateBody({
      rules: [
        {
          field: "password",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async verifyCurrentPassword(@Req req: Request, @Res res: Response) {
    const { password } = req.body;

    try {
      if (!password)
        return sendError(res, "Missing password", HttpStatus.BAD_REQUEST);
      const currentUserId = req.user?._id;
      if (!currentUserId)
        return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
      const user = await findUserById(currentUserId);
      if (!user)
        return sendError(res, "Account not found", HttpStatus.UNAUTHORIZED);

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return sendError(res, "Invalid password", HttpStatus.UNAUTHORIZED);

      return sendResponse(res, { ok: true }, "Password matched", HttpStatus.OK);
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch("/change-password")
  @Use(
    endpointMetadata({
      summary: "Change password",
      description: "Change the current user password",
    }),
    validateBody({
      rules: [
        {
          field: "passwordResetToken",
          required: true,
          type: "string",
        },
        {
          field: "password",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async changePassword(@Req req: Request, @Res res: Response) {
    const { passwordResetToken, password } = req.body;

    try {
      if (!passwordResetToken || !password)
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      try {
        await jwt.verify(passwordResetToken, ENV.JWT_SECRET);
      } catch (err) {
        return sendError(res, "Token expired", HttpStatus.UNAUTHORIZED);
      }

      const currentUser = await findUserByPasswordResetToken(
        passwordResetToken
      );
      if (!currentUser) {
        return sendError(res, "User not found", HttpStatus.NOT_FOUND);
      }
      const hash = await bcrypt.hash(password, 10);

      await updateUserById(currentUser._id, { password: hash });

      return sendResponse(
        res,
        { ok: true },
        "Password updated successfully",
        HttpStatus.CREATED
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("/change-password-token-validation")
  @Use(
    endpointMetadata({
      summary: "Check Token Validity",
      description: "Check if the token has not expired",
    }),
    validateBody({
      rules: [
        {
          field: "passwordResetToken",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async changePasswordTokenValidation(@Req req: Request, @Res res: Response) {
    const { passwordResetToken } = req.body;

    try {
      if (!passwordResetToken)
        return sendError(res, "Token missing", HttpStatus.BAD_REQUEST);

      try {
        await jwt.verify(passwordResetToken, ENV.JWT_SECRET);
      } catch (err) {
        return sendError(res, "Token expired", HttpStatus.UNAUTHORIZED);
      }

      const currentUser = await findUserByPasswordResetToken(
        passwordResetToken
      );
      if (!currentUser) {
        return sendError(res, "Expired Link", HttpStatus.NOT_FOUND);
      }

      return sendResponse(res, { ok: true }, "Valid Token", HttpStatus.CREATED);
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch("/update-profile")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Update user profile",
      description:
        "Update current user profile by changing the firstName or lastName",
    }),
    validateBody({
      rules: [
        {
          field: "firstName",
          required: false,
          type: "string",
          minLength: 3,
          maxLength: 50,
        },
        {
          field: "lastName",
          required: false,
          type: "string",
          minLength: 3,
          maxLength: 50,
        },
      ],
    }),
    logRequest()
  )
  async updateProfile(@Req req: Request, @Res res: Response) {
    const { firstName, lastName } = req.body;

    try {
      if (!firstName || !lastName)
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      const currentUserId = req.user?._id;
      if (!currentUserId) {
        return sendError(res, "Unauthorized", HttpStatus.UNAUTHORIZED);
      }
      const filter: any = {};
      if (firstName && lastName) {
        filter.firstName = firstName;
        filter.lastName = lastName;
      }
      if (firstName) {
        filter.firstName = firstName;
      }
      if (lastName) {
        filter.lastName = lastName;
      }

      await updateUserById(currentUserId, filter);

      return sendResponse(
        res,
        { ok: true },
        "User profile updated successfully",
        HttpStatus.CREATED
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete("/delete-account")
  @Use(
    authMiddleware,
    endpointMetadata({
      summary: "Delete account",
      description: "The current delete his account with all data",
    }),
    validateBody({
      rules: [
        {
          field: "email",
          required: true,
          type: "string",
          pattern: ValidationPatterns.EMAIL,
        },
      ],
    }),
    logRequest()
  )
  async deleteAccount(@Req req: Request, @Res res: Response) {
    const { email } = req.body;

    try {
      if (!email)
        return sendError(res, "Missing email field", HttpStatus.BAD_REQUEST);

      await deleteUserAccount(email.trim());

      return sendResponse(
        res,
        { ok: true },
        "Account deleted successfully",
        HttpStatus.NO_CONTENT
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("/oauth-google")
  @Use(
    endpointMetadata({
      summary: "Google Oauth-2.0",
      description: "Sign in or up a user with his Google Account",
    }),
    validateBody({
      rules: [
        {
          field: "firstName",
          required: true,
          type: "string",
          minLength: 3,
          maxLength: 50,
        },
        {
          field: "lastName",
          required: false,
          type: "string",
          minLength: 3,
          maxLength: 50,
        },
        {
          field: "email",
          required: true,
          type: "string",
          pattern: ValidationPatterns.EMAIL,
        },
        {
          field: "oauthUid",
          required: true,
          type: "string",
        },
        {
          field: "oauthProvider",
          required: true,
          type: "string",
        },
        {
          field: "oauthPicture",
          required: true,
          type: "string",
        },
      ],
    }),
    logRequest()
  )
  async oauthGoogle(@Req req: Request, @Res res: Response) {
    const { firstName, lastName, email, oauthUid, oauthPicture } = req.body;
    try {
      if (!firstName || !email || !oauthUid || !oauthPicture)
        return sendError(res, "Missing fields", HttpStatus.BAD_REQUEST);

      let user = await findUser(email, true);
      if (!user) {
        const data: Partial<User> = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: "",
          passwordResetToken: "",
          oauthUid: oauthUid,
          oauthProvider: "Google",
          oauthPicture: oauthPicture,
          isActive: true,
          isOauth: true,
        };
        user = await createUser(data);
      } else {
        user.firstName = firstName;
        user.lastName = lastName;
        user.oauthPicture = oauthPicture;
        user.oauthUid = oauthUid;
        user.oauthProvider = "Google";
        user.isActive = true;
        user.activationToken = "";
        user.passwordResetToken = "";
        user.isOauth = true;
        await user.save({ validateBeforeSave: false });
      }

      const accessToken = jwt.sign({ _id: user._id }, ENV.JWT_SECRET, {
        expiresIn: "15m",
      });
      const refreshToken = jwt.sign({ _id: user._id }, ENV.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
      });

      return sendResponse(
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: ENV.NODE_ENV === "production",
          sameSite: "strict",
          path: REFRESH_TOKEN_PATH,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
        { accessToken: accessToken },
        "User signed in successfully",
        HttpStatus.OK
      );
    } catch (err: any) {
      return sendError(res, err.message, HttpStatus.BAD_REQUEST);
    }
  }
}

export { AuthController };
