import "server-only";
import { parseBuildEnv } from "./schema";

export const env = parseBuildEnv(process.env);
