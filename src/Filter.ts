"use strict";
import * as pandoc from "pandoc-filter";
import * as analyzer from "cowlick-analyzer";
import {join} from "path";

export class Filter {
  private scenario: analyzer.Scenario;
  private format: string;
  private tmpScene: analyzer.Scene;

  private action = this.actionImpl.bind(this);

  constructor(format: string) {
    this.format = format;
    this.scenario = [];
  }

  apply(source: pandoc.Tree): analyzer.Scenario {
    pandoc.filter(source, this.action, this.format);
    this.scenario.push(this.tmpScene);
    return this.scenario;
  }

  private get frame(): analyzer.Frame {
    return this.tmpScene.frames[this.tmpScene.frames.length - 1];
  }

  private actionImpl<A extends keyof pandoc.EltMap>(
    key: A,
    value: pandoc.EltMap[A],
    format: string,
    meta: any
  ): undefined | pandoc.Elt<keyof pandoc.EltMap> | Array<pandoc.Elt<keyof pandoc.EltMap>> {
    switch (key) {
      case "Header":
        const [level, attr, xs] = value as pandoc.EltMap["Header"];
        return this.header(level, attr, xs);
      case "Para":
        this.frame.scripts.push({
          tag: "text",
          data: {
            values: [(value as pandoc.EltMap["Para"]).map(i => this.getStr(i)).join("")]
          }
        });
      default:
        return undefined;
    }
  }

  private header(level: number, attr: pandoc.Attr, xs: pandoc.Inline[]): undefined {
    if (level === 1) {
      if (this.tmpScene) {
        this.scenario.push(this.tmpScene);
      }
      this.tmpScene = {
        label: this.getStr(xs[0]),
        frames: [
          {
            scripts: []
          }
        ]
      };
    }
    return undefined;
  }

  private getStr(l: pandoc.Inline): string {
    if (l.t === "Str") {
      return l.c as pandoc.EltMap["Str"];
    } else if (l.t === "LineBreak") {
      return "\n";
    } else {
      throw new Error("Inline is not string");
    }
  }
}
