"use strict";
import * as fs from "fs";
import * as path from "path";
import * as commandpost from "commandpost";
import * as analyzer from "cowlick-analyzer";
import * as stdin from "get-stdin";
import {Filter} from "./Filter";

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"));

interface CompileOpts {
  output: string[];
}

const root = commandpost
  .create<CompileOpts, {}>("cowlick-pandoc-filter")
  .version(packageJson.version, "-v, --version")
  .description("filtering pandoc ast")
  .option("-o, --output <output>", "output dir")
  .action(async (opts: CompileOpts, args: {}) => {
    const output: string = opts.output[0] || "script";
    const outputPath = path.resolve(process.cwd(), output);
    const source = await stdin();
    const filter = new Filter("");
    const ast = filter.apply(JSON.parse(source));
    const result = analyzer.analyze(ast);
    try {
      await analyzer.mkdir(outputPath);
    } catch (e) {
      console.log("output directory already exists: " + outputPath);
    }
    await analyzer.generate(path.join(outputPath, "scenario.js"), result.scenario);
    for (const s of result.scripts) {
      await s.write(outputPath);
    }
  });

commandpost.exec(root, process.argv).then(
  () => {
    process.stdout.write("");
    process.exit(0);
  },
  err => {
    console.error("uncaught error", err);
    process.exit(1);
  }
);
