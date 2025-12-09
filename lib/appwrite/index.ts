"use server";

import { appwriteConfig } from "./config";
import { cookies } from "next/headers";
import { Account, TablesDB, Storage, Avatars } from "node-appwrite";

const sdk = require("node-appwrite");

export const createSessionClient = async () => {
  const client = new sdk.Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  const session = (await cookies()).get("appwrite-session");

  if (session?.value) {
    client.setSession(session.value);
  }

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new TablesDB(client);
    },
  };
};

export const createAdminClient = async () => {
  const client = new sdk.Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

  // const session = (await cookies()).get("appwrite-session");
  // // if (!session || !session.value) throw new Error("No session");
  // client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    },
  };
};
