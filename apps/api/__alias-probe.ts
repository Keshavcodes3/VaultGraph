import { loginSchema, registerSchema } from "@vaultgraph/shared/auth-types";
import * as sharedRoot from "@vaultgraph/shared";
import * as repoShared from "@repo/shared/auth-types";
import { Button } from "@vaultgraph/ui/button";
import * as uiRoot from "@vaultgraph/ui";

console.log("vaultgraph auth-types:", typeof registerSchema.parse, typeof loginSchema.parse);
console.log("vaultgraph shared root:", Object.keys(sharedRoot).sort().join(","));
console.log("repo shared auth-types:", Object.keys(repoShared).sort().join(","));
console.log("vaultgraph ui button:", typeof Button, "| root:", Object.keys(uiRoot).sort().join(","));
console.log(
  "parse ok:",
  registerSchema.parse({ username: "abc", email: "a@b.com", password: "12345678" }).username,
);
