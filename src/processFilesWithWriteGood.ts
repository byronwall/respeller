import writeGood from "write-good";

import { processAllFiles } from "./processAllFiles";

export async function processFilesWithWriteGood(files: string[]) {
  const allSugs = await Promise.all(
    processAllFiles(files, (data, file) => {
      return {
        file,
        suggestions: writeGood(data)
      };
    })
  );

  allSugs.forEach(sugs => {
    console.log(sugs.file);
    sugs.suggestions.forEach(sug => console.log(sug));
  });
}
