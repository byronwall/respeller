import chalk from "chalk";
import commander from "commander";
import processor from "flashtext.js";
import * as fs from "fs";
import * as SpellChecker from "spellchecker";

commander.version("1.0.0").description("Multi File Spelling Fixer");

commander.option("-w, --wordFile [path]", "Path to a word list");
commander.option(
  "-p, --possibleWordFile [path]",
  "Path to list of words to check"
);

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

commander
  .command("check <files...>")
  .alias("c")
  .description("FInd spelling errors in files")
  .action((files: string[]) => {
    console.log(chalk.yellow("== Find spelling errors =="));

    const newErrors = new Set<string>();

    const fileReadPromises: Promise<string>[] = [];

    files.forEach(file => {
      // kick out if not a real file
      if (!fs.lstatSync(file).isFile()) {
        return;
      }

      const fileProm = readFileAsync(file);
      fileReadPromises.push(fileProm);

      fileProm
        .then(data => {
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
        })
        .catch(err => {
          console.error(err);
        });
    });

    const fixesToOutput: string[] = [""];
    const fixesToCheck: string[] = [""];
    const veryBadErrors: string[] = [];
    Promise.all(fileReadPromises).then(() => {
      //console.log("all errors: ", newErrors);

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
        const isAllLowerCase =
          error.toLowerCase() === error || isErrorCapitalized;
        const noPeriodInError = !(error.indexOf(".") > -1);
        const noPeriodInFix = !(fixes[0].indexOf(".") > -1);

        if (
          isLongEnough &&
          isAllLowerCase &&
          noPeriodInError &&
          noPeriodInFix
        ) {
          fixesToOutput.push(errorFix);
        } else {
          fixesToCheck.push(errorFix);
        }
      });

      // for each error

      // TODO: do a step to not add duplicates to the word lists

      // append the fixes to the word file if avialable
      const wordFile = commander["wordFile"];
      if (wordFile !== undefined) {
        fs.appendFileSync(wordFile, fixesToOutput.join("\n"));
      } else {
        console.log(fixesToOutput);
      }

      const possibleWordFile = commander["possibleWordFile"];
      if (possibleWordFile !== undefined) {
        fs.appendFileSync(possibleWordFile, fixesToCheck.join("\n"));
      } else {
        console.log(fixesToCheck);
      }

      console.log(veryBadErrors);
    });
  });

commander
  .command("build [file]")
  .alias("b")
  .description("Build a dict with first suggestion from word list")
  .action(file => {
    console.log(chalk.yellow("== Build errors =="));

    if (file === undefined) {
      file = "new_words.txt";
    }

    const newWords = fs.readFileSync(file, "utf8");

    // split that into lines

    const words = newWords.split("\n");

    words.forEach(word => {
      const replWords = SpellChecker.getCorrectionsForMisspelling(word);

      console.log("new words?", word, replWords);
    });

    // check each word against the dict to see what is suggested

    // outpt a new word list with the |

    //console.log(newWords);
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
    // skip blank lines and comments
    if (pair === "" || pair[0] === "#") {
      return;
    }
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

function readFileAsync(filename: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
