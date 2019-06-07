import commander from "commander";
import chalk from "chalk";

commander.version("1.0.0").description("Multi File Spelling Fixer");

commander
  .command("find <files...>")
  .alias("f")
  .description("Output list of spelling errors")
  .action(files => {
    console.log(
      chalk.yellow("== List of spelling errors =="),
      chalk.blue("files:", files)
    );
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
