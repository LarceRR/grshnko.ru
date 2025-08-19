#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

const args = process.argv.slice(2);
const releaseType = args[0] || "patch"; // patch по умолчанию

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const currentVersion = pkg.version;

console.log(`Current version: ${currentVersion}`);
console.log(`Releasing new ${releaseType} version...`);

try {
  // Запускаем standard-version
  execSync(`npx standard-version --release-as ${releaseType}`, { stdio: "inherit" });

  // Получаем новую версию после standard-version
  const newPkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  const newVersion = newPkg.version;

  console.log(`New version: ${newVersion}`);

  // Пушим изменения и тег в Git
  execSync(`git push origin main --follow-tags`, { stdio: "inherit" });

  console.log(`Release ${newVersion} pushed successfully!`);
} catch (error) {
  console.error("Release failed:", error);
  process.exit(1);
}
