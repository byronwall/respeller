import * as fs from "fs";

export function readFileAsync(filename: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

export type ProcessingFunc<T> = (data: string, file: string) => T;

export function processAllFiles<T>(
  files: string[],
  processor: ProcessingFunc<T>
) {
  const processResultPromises: Promise<T>[] = [];
  files.forEach(file => {
    // kick out if not a real file
    if (!fs.lstatSync(file).isFile()) {
      return;
    }
    // read the file
    const fileProm = readFileAsync(file);
    // create a new promise that returns the processing result
    const processorProm = new Promise<T>((resolve, reject) => {
      // wait for the file reading to be done
      fileProm
        .then(data => {
          // when done, run the processor on the data and resolve the result
          resolve(processor(data, file));
        })
        // push any errors back up the chain
        .catch(err => {
          console.error(err);
          reject(err);
        });
    });
    // pass out the result of promises for the processing results
    processResultPromises.push(processorProm);
  });
  return processResultPromises;
}
