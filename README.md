# respeller

This is a utility CLI for fixing common spelling mistakes across a batch of files.

## Usage

help

```bash
respeller -h
```

show the words that are known and incorrect (would be replaced with `replace`)

```bash
repseller find *.md
```

correct the errors above and save the new files

```bash
respeller replace *.md
```

check for new spelling errors

```bash
repseller check *.md
```

process the inputs using write-good

```bash
respeller grammar *.md
```

You can also save the "simple" mistakes to your words list and have them available for auto-corrections. Simple is defined as:

- longer than 2 characters
- word is all lower case or only capitalized in the first letter
- word contains no period
- proposed replacement does not contain a period
- only 1 replacement is suggested

```bash
repseller check --saveFixes *.md
```

## How It Works

This simple utility keeps a list of common spelling mistakes that you can add to. It runs the `flashtext` algorithm across that list so that you can find those mistakes in your files. It also has the ability to automatically replace words with the suggested recommendation.
