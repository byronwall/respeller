import chalk from "chalk";
import commander from "commander";
import * as fs from "fs";
import * as SpellChecker from "spellchecker";

import { defaultWordList } from ".";
import { processAllFiles } from "./processAllFiles";

export async function processFilesWithSpellChecker(files: string[]) {
  const newErrors = new Set<string>();
  const allProcessingProms = processAllFiles(files, (data, file) => {
    const errors = SpellChecker.checkSpelling(data);
    // TODO: work this up into a solid approach
    // TODO: consider how to choose the right dictionary, add custom words, etc.
    if (errors.length > 0) {
      const spellingErrors = errors.map(rng =>
        data.substring(rng.start, rng.end)
      );
      spellingErrors.forEach(error => newErrors.add(error));
      // TODO: add the ability to fix the errors right here
    }
  });
  await Promise.all(allProcessingProms);
  const fixesToOutput: string[] = [""];
  const fixesToCheck: string[] = [""];
  const veryBadErrors: string[] = [];
  // TODO: extract this code into a function
  newErrors.forEach(error => {
    const fixes = SpellChecker.getCorrectionsForMisspelling(error);
    if (fixes.length === 0) {
      veryBadErrors.push(error);
      return;
    }
    const isErrorCapitalized =
      error[0].toUpperCase() + error.substring(1).toLowerCase() === error;
    let errorFix = error + "|" + fixes.join(", ");
    if (isErrorCapitalized) {
      errorFix = errorFix.toLowerCase();
    }
    if (fixes.length > 1) {
      fixesToCheck.push(errorFix);
      return;
    }
    // check if only the first letter is capitalized
    const isLongEnough = error.length > 2;
    const isAllLowerCase = error.toLowerCase() === error || isErrorCapitalized;
    const noPeriodInError = !(error.indexOf(".") > -1);
    const noPeriodInFix = !(fixes[0].indexOf(".") > -1);
    if (isLongEnough && isAllLowerCase && noPeriodInError && noPeriodInFix) {
      fixesToOutput.push(errorFix);
    } else {
      fixesToCheck.push(errorFix);
    }
  });
  // for each error
  // TODO: do a step to not add duplicates to the word lists
  // append the fixes to the word file if avialable
  const saveToWordFile = commander["saveFixes"];
  if (saveToWordFile !== undefined) {
    fs.appendFileSync(defaultWordList, fixesToOutput.join("\n"));
    console.log(chalk.green("Words saved to the word list"));
  } else {
    console.log(
      chalk.yellow("Word list not saved.  Use option -s or --saveFixes")
    );
  }
  console.log(fixesToOutput);
  const possibleWordFile = commander["possibleWordFile"];
  if (possibleWordFile !== undefined) {
    fs.appendFileSync(possibleWordFile, fixesToCheck.join("\n"));
  } else {
    console.log(fixesToCheck);
  }
  console.log(veryBadErrors);
}
