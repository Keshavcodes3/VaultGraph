import { Button } from "@repo/ui/button";
import * as uiRoot from "@repo/ui";
import { Button as VButton } from "@vaultgraph/ui/button";

console.log("repo ui button:", typeof Button, "| root:", Object.keys(uiRoot).sort().join(","));
console.log("vaultgraph ui button:", typeof VButton);
