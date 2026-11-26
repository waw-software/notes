import { execFileSync } from "node:child_process";

function git(repoRoot: string, args: string[]): string {
	return execFileSync("git", args, {
		cwd: repoRoot,
		encoding: "utf8",
		// A ref that is missing is expected; keep git's complaint off the terminal.
		stdio: ["ignore", "pipe", "pipe"],
	});
}

function tryGit(repoRoot: string, args: string[]): string | null {
	try {
		return git(repoRoot, args).trim();
	} catch (error) {
		// A numeric status is git saying no; anything else means git did not run.
		if (typeof (error as { status?: unknown }).status !== "number") {
			throw error;
		}
		return null;
	}
}

/** The order of `resolve_base` in scripts/lib/git-base.sh. */
export function resolveBase(repoRoot: string): string {
	for (const ref of ["origin/HEAD", "origin/main", "main"]) {
		if (
			tryGit(repoRoot, ["rev-parse", "--verify", "-q", `${ref}^{commit}`]) ===
			null
		) {
			continue;
		}
		const base = tryGit(repoRoot, ["merge-base", ref, "HEAD"]);
		if (base !== null) {
			return base;
		}
	}
	return git(repoRoot, ["rev-parse", "HEAD"]).trim();
}

export function changedFiles(repoRoot: string, base: string): string[] {
	// -z keeps git from quoting names with unusual characters.
	const lists = [
		git(repoRoot, ["diff", "--name-only", "-z", base]),
		git(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"]),
	];
	const files = lists.flatMap((list) => list.split("\0").filter(Boolean));
	return [...new Set(files)].sort();
}
