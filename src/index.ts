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

    console.log(files);

    testSearchString(files, commander["wordFile"]);
  });

commander
  .command("replace <files...>")
  .alias("r")
  .description("Replace spelling errors in files")
  .action(files => {
    console.log(chalk.yellow("== Replace errors =="), chalk.blue(files));
  });

if (
  !process.argv.slice(2).length /* || !/[arudl]/.test(process.argv.slice(2))*/
) {
  commander.outputHelp();
  process.exit();
}

commander.parse(process.argv);

function testSearchString(files: string[], wordListPath: string) {
  const allWords = fs.readFileSync(wordListPath, "utf8");
  const eachWordPair = allWords.split("\n");

  const proc = new processor();
  eachWordPair.forEach(pair => {
    const pieces = pair.split("|");
    if (pieces[1] === undefined) {
      proc.addKeyword(pieces[0]);
    } else {
      proc.addKeyword(pieces[0], pieces[1]);
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
        console.log("found", file, found);

        const newString = proc.replaceKeywords(data);

        console.log("new text", newString);
      }
    });
  });
}
