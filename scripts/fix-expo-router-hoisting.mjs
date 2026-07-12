#!/usr/bin/env node
// Workaround for a real, repeatedly-hit bug in this monorepo: adding almost
// any new dependency to app/package.json causes npm to stop hoisting
// expo-router to the root node_modules/, which breaks @expo/cli's internal
// @expo/router-server package (it resolves `expo-router/_ctx-shared` by
// walking up from its own location, which only reaches root node_modules,
// not app/node_modules) with:
//   Cannot find module 'expo-router/_ctx-shared'
// Confirmed non-obvious: this is not about which package or which version
// gets added -- it reproduced with expo-build-properties AND with a
// correctly SDK-pinned expo-notifications. See docs/MACHINE_SETUP.md.
//
// Fix: symlink root node_modules/expo-router -> app/node_modules/expo-router
// after every install. Safe to run repeatedly; only acts if the root copy
// is actually missing.
import { existsSync, symlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rootTarget = path.join(repoRoot, "node_modules", "expo-router");
const appSource = path.join(repoRoot, "app", "node_modules", "expo-router");

if (existsSync(rootTarget)) {
  console.log(
    "[fix-expo-router-hoisting] node_modules/expo-router already present, nothing to do.",
  );
} else if (!existsSync(appSource)) {
  console.log(
    "[fix-expo-router-hoisting] app/node_modules/expo-router not found either; skipping (expo-router may not be installed yet).",
  );
} else {
  symlinkSync(
    path.join("..", "app", "node_modules", "expo-router"),
    rootTarget,
  );
  console.log(
    "[fix-expo-router-hoisting] Created node_modules/expo-router -> app/node_modules/expo-router symlink.",
  );
}
