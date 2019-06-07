declare class Processor {
  addKeyword(search: string, replace?: string): void;
  extractKeywords(textToSearch: string): string[];
  replaceKeywords(textToSearch: string): string;
}

export = Processor;
