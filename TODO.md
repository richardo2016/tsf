## requisites

- fibjs >= 0.26.0

## features

- Javascript APIs
    - `tsf.load`: load file/directories/zip as module
    - `tsf.run`: run file/directories/zip as module

- CLI commands
    - `run`: run typescript directly
    - `compile`: compile sfm/directories/zips to scripts/app

## test cases

- Javascript APIs
    - compile single file to
        - [ ] memory(string/Buffer)
        - [ ] file system
        - net
    - compile directories to
        - [ ] momory(file list)/zip(file list)
        - [ ] file system