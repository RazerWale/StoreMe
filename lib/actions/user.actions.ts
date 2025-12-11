"use server";

import { Query, ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { string } from "zod";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { avatarPlaceholder } from "@/constants";
import { redirect } from "next/navigation";

// Create account Flow
// 1. User enters full name and email
// 2. Check if the user already exist using the email (we will use to identify if we still need to create a user document or not)
// 3. Send OTP to user's email
// 4. This will send a secret key for creating a session.
// 5. Create a new user document if the user is a new user
// 6. return the user's accountId that will be userd to complete the logic.
// 7. Verify OTP and authenticate to login

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.usersTableId,
    queries: [Query.equal("email", email)],
  });
  return result.total > 0 ? result.rows[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createSessionClient();

  try {
    const session = await account.createEmailToken({
      userId: ID.unique(),
      email: email,
    });
    console.log("session userId - ", session.userId);
    console.log("session email - ", session);
    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);
  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Failed to send an OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();
    await databases.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.usersTableId,
      rowId: ID.unique(),
      data: {
        fullName,
        email,
        avatar: avatarPlaceholder,
        accountId,
      },
    });
    //   }
    return parseStringify({ accountId });
  } else {
    return parseStringify({ accountId });
  }
};

export const verifySecret = async ({
  userId,
  secret,
}: {
  userId: string;
  secret: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession({ userId, secret });

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/", // "/" = the cookie is available everywhere on your website.
      httpOnly: true, // This is very important for security.
      sameSite: "strict", // Controls when cookies are sent between different websites.
      secure: true, // Cookie is only sent over HTTPS
    });
    console.log("secret-", secret);
    console.log("userId--", userId);
    console.log("session-", session);
    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP");
  }
};

export const getCurrentUser = async () => {
  const { databases, account } = await createSessionClient();

  const result = await account.get();

  console.log(result);

  const user = await databases.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.usersTableId,
    queries: [Query.equal("accountId", result.$id)],
  });

  if (user.total <= 0) return null;

  return parseStringify(user.rows[0]);
};

export const logoutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession({ sessionId: "current" });
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
};

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);
    console.log("existingUser -", existingUser);
    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }
    return parseStringify({ accountId: null, error: "User not found" });
  } catch (error) {
    handleError(error, "Failed to sign in user");
  }
};
