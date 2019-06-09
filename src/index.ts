import commander from "commander";
import chalk from "chalk";
import processor from "flashtext.js";
import * as fs from "fs";

commander.version("1.0.0").description("Multi File Spelling Fixer");

commander.option("-w, --wordFile [path]", "Path to a word list");

commander
  .command("find <files...>")
  .alias("f")
  .description("Output list of spelling errors")
  .action(files => {
    console.log(chalk.yellow("== List of spelling errors =="));

    testSearchString(files, commander["wordFile"], false);
  });

commander
  .command("replace <files...>")
  .alias("r")
  .description("Replace spelling errors in files")
  .action(files => {
    console.log(chalk.yellow("== Replace errors =="));

    testSearchString(files, commander["wordFile"], true);
  });

if (
  !process.argv.slice(2).length /* || !/[arudl]/.test(process.argv.slice(2))*/
) {
  commander.outputHelp();
  process.exit();
}

commander.parse(process.argv);

function testSearchString(
  files: string[],
  wordListPath: string | undefined,
  shouldFix: boolean
) {
  if (wordListPath === undefined) {
    wordListPath = "words.txt";
  }

  const allWords = fs.readFileSync(wordListPath, "utf8");
  const eachWordPair = allWords.split("\n");

  const proc = new processor(true);
  eachWordPair.forEach(pair => {
    const pieces = pair.split("|");

    const wordError = pieces[0];

    if (pieces[1] === undefined) {
      proc.addKeyword(wordError);
    } else {
      // check if the dict offers multiple options

      let replacement = pieces[1];
      const replParts = replacement.split(",");

      // TODO: only replace behind a flag... otherwise skip
      if (replParts.length > 1) {
        replacement = replParts[0].trim();
      }

      proc.addKeyword(wordError, replacement);
      // add a capitalized option also
      if (wordError[0].toLowerCase() == wordError[0]) {
        const newSearch = wordError[0].toUpperCase() + wordError.substring(1);
        const newRepl = replacement[0].toUpperCase() + replacement.substring(1);

        proc.addKeyword(newSearch, newRepl);
      }
    }
  });

  files.forEach(file => {
    // kick out if not a real file
    if (!fs.lstatSync(file).isFile()) {
      return;
    }

    fs.readFile(file, "utf8", (err, data) => {
      if (err) {
        console.error(err);
        return;
      }

      const found = proc.extractKeywords(data);
      if (found.length > 0) {
        console.log(file, found);

        if (shouldFix) {
          const newString = proc.replaceKeywords(data);
          fs.writeFile(file, newString, err => {
            if (err) {
              console.error("error saving new file", err);
            }
          });
        }
      }
    });
  });
}
