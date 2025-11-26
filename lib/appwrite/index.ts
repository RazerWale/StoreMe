import { appwriteConfig } from "./config";
import { Client } from "node-appwrite";

export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);
};
