# fix-package-conflicts
 Fix merge conflicts from merging package json (yarn or npm)


# Example usage: 
```
npx fix-package-conflicts pathToYourRepo branchName --useYarn
--incomingBranch=main
```
aka
```
npx fix-package-conflicts ~/Sites/react-snowpack zoinkl --useYarn
--incomingBranch=main
```


# Getting Help
```
npx fix-package-conflicts -h                                     
fix-package-conflicts [folderPath] [branch]

Merge in a branch and fix any merge conflicts.

USAGE: fix-package-conflicts ~/Sites/react-snowpack zoinkl --useYarn
--incomingBranch=main

Positionals:
  folderPath  folderPath to fix conflicts at eg ~/Sites/yourRepoName
                                               [default: "~/Sites/yourRepoName"]
  branch      branch to fix conflicts on eg someBranchWithConflicts
                                            [default: "someBranchWithConflicts"]

Options:
      --version         Show version number                            [boolean]
  -h, --help            Show help                                      [boolean]
  -i, --incomingBranch  Set the incoming branch to something other than master
                                                    [string] [default: "master"]
  -y, --useYarn         Run with yarn                                  [boolean]
```

# Example Output 
And here's the output from an example run: 
```
npx fix-package-conflicts ~/Sites/react-snowpack zoinkl --useYarn
CHECKING OUT /Users/tnrich/Sites/react-snowpack
MERGING master into zoinkl
CONFLICT DETECTED IN FILE: /Users/tnrich/Sites/react-snowpack/package.json
FILE ALREADY FIXED:  /Users/tnrich/Sites/react-snowpack/build/package.json
EXECUTING YARN TO FIX LOCK FILE ...may take a minute...
FINISHED
```


Credit for the internal logic goes to https://github.com/tgreen7