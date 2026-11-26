import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { changedFiles, resolveBase } from "./changes.ts";

const dirs: string[] = [];

afterEach(() => {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

function git(cwd: string, ...args: string[]): string {
	return execFileSync(
		"git",
		[
			"-c",
			"user.name=t",
			"-c",
			"user.email=t@example.invalid",
			"-c",
			"commit.gpgsign=false",
			...args,
		],
		{ cwd, encoding: "utf8" },
	).trim();
}

function write(repo: string, file: string, text: string): void {
	writeFileSync(join(repo, file), text);
}

function commit(repo: string, file: string, text: string): void {
	write(repo, file, text);
	git(repo, "add", file);
	git(repo, "commit", "-q", "-m", file);
}

function initRepo(branch: string): string {
	const repo = mkdtempSync(join(tmpdir(), "visual-changes-"));
	dirs.push(repo);
	git(repo, "init", "-q", "-b", branch);
	commit(repo, "base.txt", "base\n");
	return repo;
}

/** A repository on a feature branch that starts at the one commit of main. */
function featureRepo(): string {
	const repo = initRepo("main");
	git(repo, "switch", "-q", "-c", "feature");
	return repo;
}

const changes = (repo: string) => changedFiles(repo, resolveBase(repo));

describe("changedFiles", () => {
	it("a committed change on the branch is reported", () => {
		const repo = featureRepo();
		commit(repo, "committed.txt", "new\n");
		expect(changes(repo)).toEqual(["committed.txt"]);
	});

	it("a staged change is reported", () => {
		const repo = featureRepo();
		write(repo, "base.txt", "staged\n");
		git(repo, "add", "base.txt");
		expect(changes(repo)).toEqual(["base.txt"]);
	});

	it("an unstaged change is reported", () => {
		const repo = featureRepo();
		write(repo, "base.txt", "unstaged\n");
		expect(changes(repo)).toEqual(["base.txt"]);
	});

	it("an untracked file is reported", () => {
		const repo = featureRepo();
		write(repo, "untracked.txt", "new\n");
		expect(changes(repo)).toEqual(["untracked.txt"]);
	});

	it("an ignored file is not reported", () => {
		const repo = featureRepo();
		commit(repo, ".gitignore", "ignored.txt\n");
		write(repo, "ignored.txt", "secret\n");
		expect(changes(repo)).toEqual([".gitignore"]);
	});
});

describe("resolveBase", () => {
	it("resolveBase uses main when there is no origin", () => {
		const repo = featureRepo();
		const onMain = git(repo, "rev-parse", "main");
		commit(repo, "committed.txt", "new\n");
		expect(resolveBase(repo)).toBe(onMain);
	});

	it("resolveBase falls back to HEAD without main", () => {
		const repo = initRepo("other");
		commit(repo, "second.txt", "second\n");
		expect(resolveBase(repo)).toBe(git(repo, "rev-parse", "HEAD"));
	});
});
