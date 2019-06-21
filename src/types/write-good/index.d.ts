// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

export = writeGood;

/*~ This example shows how to have multiple overloads for your function */
declare function writeGood(data: string, options?: any): writeGood.Suggestion[];

declare namespace writeGood {
  export interface Suggestion {
    reason: string;
    index: number;
    offset: number;
  }
}
