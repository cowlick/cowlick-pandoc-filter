"use strict";
import * as assert from "assert";
import * as fs from "fs";
import * as glob from "glob";
import {promisify} from "util";
import * as child_process from "child_process";
import * as pandoc from "pandoc-filter";
import {Filter} from "../src/Filter";

const exec = promisify(child_process.exec);

describe("Filter", () => {
  describe("正しい構文を変換できる", () => {
    const path = "test/fixture/valid/";
    let files = glob.sync(`${path}**/*.md`);

    files.forEach((filePath: string) => {
      const baseName = filePath.substr(0, filePath.length - "/content.md".length).substr(path.length);
      const astFilePath = `${path}${baseName}/content.ast`;
      it(`${filePath}`, async () => {
        const p = await exec(`pandoc ${filePath} -f markdown -t json`);
        const ast: pandoc.Tree = JSON.parse(p.stdout);
        const filter = new Filter("");
        const actual = filter.apply(ast);
        const expectedAST = fs.readFileSync(astFilePath, "utf8");
        assert.deepEqual(actual[0].frames, JSON.parse(expectedAST));
      });
    });
  });
});
