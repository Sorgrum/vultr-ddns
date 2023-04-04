export type LocalError = {
  error: string;
};

export const isError = (arg: unknown): arg is LocalError => {
  if (arg === null) return false;
  if (typeof arg !== "object") return false;
  if (!Object.hasOwn(arg, "error")) return false;
  if ((arg as { error: string | null }).error === null) return false;
  return true;
};
