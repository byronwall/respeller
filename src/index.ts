#!/usr/bin/env node
import chalk from "chalk";
import commander from "commander";
import * as path from "path";

import markdownlint from "markdownlint";

import { findAndReplaceErrorsUsingWordList } from "./findAndReplaceErrorsUsingWordList";
import { processFilesWithSpellChecker } from "./processFilesWithSpellChecker";
import { processFilesWithWriteGood } from "./processFilesWithWriteGood";

const dirName = __dirname;
export const defaultWordList = path.join(dirName, "..", "words.txt");

commander.version("1.0.0").description("Multi File Spelling Fixer");

commander.option("-w, --wordFile [path]", "Path to a word list");
commander.option(
  "-p, --possibleWordFile [path]",
  "Path to list of words to check"
);
commander.option("-s, --saveFixes", "Include to save easy fixes to words list");

commander
  .command("grammar <files...>")
  .alias("g")
  .description("Runs the write-good library against the given files")
  .action((files: string[]) => {
    console.log(chalk.yellow("== Summary of write-good errors =="));
    processFilesWithWriteGood(files);
  });

commander
  .command("markdown <files...>")
  .alias("m")
  .description("Runs the markdownlint checks")
  .action((files: string[]) => {
    console.log(chalk.yellow("== Summary of markdownlint checks =="));
    const options: markdownlint.MarkdownlintOptions = {
      files,
      config: {
        "line-length": false,
        "first-line-h1": false as any
      }
    };

    markdownlint(options, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }

      for (let file in result) {
        if (result.hasOwnProperty(file) && result[file].length > 0) {
          console.log("files", file, result[file]);
        }
      }
    });
  });

commander
  .command("find <files...>")
  .alias("f")
  .description("Output list of spelling errors")
  .action(files => {
    console.log(chalk.yellow("== List of spelling errors using word list =="));
    findAndReplaceErrorsUsingWordList(files, commander["wordFile"], false);
  });

commander
  .command("replace <files...>")
  .alias("r")
  .description("Replace spelling errors in files")
  .action(files => {
    console.log(chalk.yellow("== Replace errors using word list =="));
    findAndReplaceErrorsUsingWordList(files, commander["wordFile"], true);
  });

commander
  .command("check <files...>")
  .alias("c")
  .description("Find spelling errors in files")
  .action((files: string[]) => {
    console.log(chalk.yellow("== Find spelling errors using spell checker =="));
    processFilesWithSpellChecker(files);
  });

if (!process.argv.slice(2).length) {
  commander.outputHelp();
  process.exit();
}

commander.parse(process.argv);
