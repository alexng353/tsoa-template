import { FileChangeInfo } from "node:fs/promises";

type ConditionFn = (event: FileChangeInfo<string>) => boolean;
type Conditions = {
  [key: string]: ConditionFn | undefined;
};

export const defaultCondition = (event: FileChangeInfo<string>) => {
  if (!event.filename) return false;
  return event.filename?.startsWith("src") && event.filename.endsWith("~");
};

export const conditions: Conditions = {
  "alex@mba.local": defaultCondition,
  "alex@mba.taildf19.ts.net": defaultCondition,
};
