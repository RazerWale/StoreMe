"use server";

import { Query, ID } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { string } from "zod";
import { parseStringify } from "../utils";

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

  const result = await databases.listTables({
    databaseId: appwriteConfig.databaseId,
    queries: [Query.equal("email", email)],
  });

  return result.total > 0 ? result.tables[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken({
      userId: ID.unique(),
      email: email,
    });
    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

const createAccount = async ({
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
        avatar: "https://avatar.iran.liara.run/public/boy?username=Ash",
        accountId,
      },
    });
  }

  return parseStringify({ accountId });
};
