import commander from "commander";
import chalk from "chalk";
import processor from "flashtext.js";
import * as fs from "fs";
import * as SpellChecker from "spellchecker";

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

commander
  .command("check <files...>")
  .alias("c")
  .description("FInd spelling errors in files")
  .action((files: string[]) => {
    console.log(chalk.yellow("== Find spelling errors =="));

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

        const errors = SpellChecker.checkSpelling(data);

        // TODO: work this up into a solid approach
        // TODO: consider how to choose the right dictionary, add custom words, etc.

        if (errors.length > 0) {
          console.log(
            file,
            errors.map(rng => data.substring(rng.start, rng.end))
          );
        }
      });
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
