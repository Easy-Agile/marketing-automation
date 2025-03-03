import { batchesOf } from "../util/helpers.js";

class ArgParser {

  #opts: { [opt: string]: string };

  constructor(argv: string[]) {
    const args = argv.flatMap(s => s.split('='));
    this.#opts = Object.fromEntries(batchesOf(args, 2));
  }

  get(option: string): string | undefined {
    const value = this.#opts[option];
    delete this.#opts[option];
    return value;
  }

  getChoiceOrFail<T extends string>(option: string, choices: T[]): T {
    const value = this.get(option) as T;
    if (!value || !choices.includes(value)) {
      console.log(`Error: ${option} must be ${Object.keys(choices)
        .map(c => `'${c}'`)
        .join(' or ')}`);
      process.exit(1);
    }
    return value;
  }

  failIfExtraOpts() {
    if (Object.keys(this.#opts).length > 0) {
      console.log(`Error: Unknown options passed:`, this.#opts);
      process.exit(1);
    }
  }

}

export const cli = new ArgParser(process.argv.slice(2));
