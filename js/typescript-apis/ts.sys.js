const { typescript } = require('./runtime')

/**
 * useless now
 */
exports.configTsSys = (ts = typescript) => {
    return ;
    ts.sys = (function () {
        const byteOrderMarkIndicator = "\uFEFF";
        function getFibSystem() {
            const nativePattern = /^native |^\([^)]+\)$|^(internal[\\/]|[a-zA-Z0-9_\s]+(\.js)?$)/;
            const _fs = require("fs");
            const _path = require("path");
            const _os = require("os");
            const _crypto = require("crypto");
            
            let activeSession;
            const profilePath = "./profile.cpuprofile";
            const Buffer = require("buffer").Buffer;
            const isNode4OrLater = true; // nodeVersion >= 4;
            const isLinuxOrMacOs = process.platform === "linux" || process.platform === "darwin";
            const platform = _os.platform();
            const useCaseSensitiveFileNames = isFileSystemCaseSensitive();
            const useNonPollingWatchers = process.env.TSC_NONPOLLING_WATCHER;
            const tscWatchFile = process.env.TSC_WATCHFILE;
            const tscWatchDirectory = process.env.TSC_WATCHDIRECTORY;
            const fsWatchFile = ts.createSingleFileWatcherPerName(fsWatchFileWorker, useCaseSensitiveFileNames);
            let dynamicPollingWatchFile;
            const fibSystem = {
                xxx: 123123,
                args: process.argv.slice(2),
                newLine: _os.EOL,
                useCaseSensitiveFileNames: useCaseSensitiveFileNames,
                write: function (s) {
                    process.stdout.write(s);
                },
                writeOutputIsTTY: function () {
                    return process.stdout.isTTY;
                },
                readFile: readFile,
                writeFile: writeFile,
                watchFile: getWatchFile(),
                watchDirectory: getWatchDirectory(),
                resolvePath: function (path) { return _path.resolve(path); },
                fileExists: fileExists,
                directoryExists: directoryExists,
                createDirectory: function (directoryName) {
                    if (!fibSystem.directoryExists(directoryName)) {
                        try {
                            _fs.mkdirSync(directoryName);
                        }
                        catch (e) {
                            if (e.code !== "EEXIST") {
                                throw e;
                            }
                        }
                    }
                },
                getExecutingFilePath: function () {
                    return __filename;
                },
                getCurrentDirectory: function () {
                    return process.cwd();
                },
                getDirectories: getDirectories,
                getEnvironmentVariable: function (name) {
                    return process.env[name] || "";
                },
                readDirectory: readDirectory,
                getModifiedTime: getModifiedTime,
                setModifiedTime: setModifiedTime,
                deleteFile: deleteFile,
                createHash: _crypto ? createSHA256Hash : generateDjb2Hash,
                createSHA256Hash: _crypto ? createSHA256Hash : undefined,
                getMemoryUsage: function () {
                    if (global.gc) {
                        global.gc();
                    }
                    return process.memoryUsage().heapUsed;
                },
                getFileSize: function (path) {
                    try {
                        const stat = _fs.statSync(path);
                        if (stat.isFile()) {
                            return stat.size;
                        }
                    }
                    catch (_a) { }
                    return 0;
                },
                exit: function (exitCode) {
                    disableCPUProfiler(function () { return process.exit(exitCode); });
                },
                enableCPUProfiler: enableCPUProfiler,
                disableCPUProfiler: disableCPUProfiler,
                realpath: realpath,
                debugMode: ts.some(process.execArgv, function (arg) { return /^--(inspect|debug)(-brk)?(=\d+)?$/i.test(arg); }),
                tryEnableSourceMapsForHost: function () {
                    try {
                        require("source-map-support").install();
                    }
                    catch (_a) {
                    }
                },
                setTimeout: setTimeout,
                clearTimeout: clearTimeout,
                clearScreen: function () {
                    process.stdout.write("\x1Bc");
                },
                setBlocking: function () {
                    if (process.stdout && process.stdout._handle && process.stdout._handle.setBlocking) {
                        process.stdout._handle.setBlocking(true);
                    }
                },
                bufferFrom: bufferFrom,
                base64decode: function (input) { return bufferFrom(input, "base64").toString("utf8"); },
                base64encode: function (input) { return bufferFrom(input).toString("base64"); },
                require: function (baseDir, moduleName) {
                    try {
                        const modulePath = ts.resolveJSModule(moduleName, baseDir, fibSystem);
                        return { module: require(modulePath), modulePath: modulePath, error: undefined };
                    }
                    catch (error) {
                        return { module: undefined, modulePath: undefined, error: error };
                    }
                }
            };
            return fibSystem;
            function enableCPUProfiler(path, cb) {
                if (activeSession) {
                    cb();
                    return false;
                }
                const inspector = require("inspector");
                if (!inspector || !inspector.Session) {
                    cb();
                    return false;
                }
                const session = new inspector.Session();
                session.connect();
                session.post("Profiler.enable", function () {
                    session.post("Profiler.start", function () {
                        activeSession = session;
                        profilePath = path;
                        cb();
                    });
                });
                return true;
            }
            function cleanupPaths(profile) {
                const externalFileCounter = 0;
                const remappedPaths = ts.createMap();
                const normalizedDir = ts.normalizeSlashes(__dirname);
                const fileUrlRoot = "file://" + (ts.getRootLength(normalizedDir) === 1 ? "" : "/") + normalizedDir;
                for (const _i = 0, _a = profile.nodes; _i < _a.length; _i++) {
                    const node = _a[_i];
                    if (node.callFrame.url) {
                        const url = ts.normalizeSlashes(node.callFrame.url);
                        if (ts.containsPath(fileUrlRoot, url, useCaseSensitiveFileNames)) {
                            node.callFrame.url = ts.getRelativePathToDirectoryOrUrl(fileUrlRoot, url, fileUrlRoot, ts.createGetCanonicalFileName(useCaseSensitiveFileNames), true);
                        }
                        else if (!nativePattern.test(url)) {
                            node.callFrame.url = (remappedPaths.has(url) ? remappedPaths : remappedPaths.set(url, "external" + externalFileCounter + ".js")).get(url);
                            externalFileCounter++;
                        }
                    }
                }
                return profile;
            }
            function disableCPUProfiler(cb) {
                if (activeSession && activeSession !== "stopping") {
                    const s_1 = activeSession;
                    activeSession.post("Profiler.stop", function (err, _a) {
                        const profile = _a.profile;
                        if (!err) {
                            try {
                                if (_fs.statSync(profilePath).isDirectory()) {
                                    profilePath = _path.join(profilePath, (new Date()).toISOString().replace(/:/g, "-") + "+P" + process.pid + ".cpuprofile");
                                }
                            }
                            catch (_b) {
                            }
                            try {
                                _fs.mkdirSync(_path.dirname(profilePath), { recursive: true });
                            }
                            catch (_c) {
                            }
                            _fs.writeFileSync(profilePath, JSON.stringify(cleanupPaths(profile)));
                        }
                        activeSession = undefined;
                        s_1.disconnect();
                        cb();
                    });
                    activeSession = "stopping";
                    return true;
                }
                else {
                    cb();
                    return false;
                }
            }
            function bufferFrom(input, encoding) {
                return Buffer.from && Buffer.from !== Int8Array.from
                    ? Buffer.from(input, encoding)
                    : new Buffer(input, encoding);
            }
            function isFileSystemCaseSensitive() {
                if (platform === "win32" || platform === "win64") {
                    return false;
                }
                return !fileExists(swapCase(__filename));
            }
            function swapCase(s) {
                return s.replace(/\w/g, function (ch) {
                    const up = ch.toUpperCase();
                    return ch === up ? ch.toLowerCase() : up;
                });
            }
            function getWatchFile() {
                switch (tscWatchFile) {
                    case "PriorityPollingInterval":
                        return fsWatchFile;
                    case "DynamicPriorityPolling":
                        return createDynamicPriorityPollingWatchFile({ getModifiedTime: getModifiedTime, setTimeout: setTimeout });
                    case "UseFsEvents":
                        return watchFileUsingFsWatch;
                    case "UseFsEventsWithFallbackDynamicPolling":
                        dynamicPollingWatchFile = createDynamicPriorityPollingWatchFile({ getModifiedTime: getModifiedTime, setTimeout: setTimeout });
                        return createWatchFileUsingDynamicWatchFile(dynamicPollingWatchFile);
                    case "UseFsEventsOnParentDirectory":
                        return createNonPollingWatchFile();
                }
                return useNonPollingWatchers ?
                    createNonPollingWatchFile() :
                    function (fileName, callback) { return fsWatchFile(fileName, callback, undefined); };
            }
            function getWatchDirectory() {
                const fsSupportsRecursive = isNode4OrLater && (process.platform === "win32" || process.platform === "darwin");
                if (fsSupportsRecursive) {
                    return watchDirectoryUsingFsWatch;
                }
                const watchDirectory = tscWatchDirectory === "RecursiveDirectoryUsingFsWatchFile" ?
                    createWatchDirectoryUsing(fsWatchFile) :
                    tscWatchDirectory === "RecursiveDirectoryUsingDynamicPriorityPolling" ?
                        createWatchDirectoryUsing(dynamicPollingWatchFile || createDynamicPriorityPollingWatchFile({ getModifiedTime: getModifiedTime, setTimeout: setTimeout })) :
                        watchDirectoryUsingFsWatch;
                const watchDirectoryRecursively = createRecursiveDirectoryWatcher({
                    useCaseSensitiveFileNames: useCaseSensitiveFileNames,
                    directoryExists: directoryExists,
                    getAccessibleSortedChildDirectories: function (path) { return getAccessibleFileSystemEntries(path).directories; },
                    watchDirectory: watchDirectory,
                    realpath: realpath
                });
                return function (directoryName, callback, recursive) {
                    if (recursive) {
                        return watchDirectoryRecursively(directoryName, callback);
                    }
                    return watchDirectory(directoryName, callback);
                };
            }
            function createNonPollingWatchFile() {
                const fileWatcherCallbacks = ts.createMultiMap();
                const dirWatchers = ts.createMap();
                const toCanonicalName = ts.createGetCanonicalFileName(useCaseSensitiveFileNames);
                return nonPollingWatchFile;
                function nonPollingWatchFile(fileName, callback) {
                    const filePath = toCanonicalName(fileName);
                    fileWatcherCallbacks.add(filePath, callback);
                    const dirPath = ts.getDirectoryPath(filePath) || ".";
                    const watcher = dirWatchers.get(dirPath) || createDirectoryWatcher(ts.getDirectoryPath(fileName) || ".", dirPath);
                    watcher.referenceCount++;
                    return {
                        close: function () {
                            if (watcher.referenceCount === 1) {
                                watcher.close();
                                dirWatchers.delete(dirPath);
                            }
                            else {
                                watcher.referenceCount--;
                            }
                            fileWatcherCallbacks.remove(filePath, callback);
                        }
                    };
                }
                function createDirectoryWatcher(dirName, dirPath) {
                    const watcher = fsWatchDirectory(dirName, function (_eventName, relativeFileName) {
                        if (!ts.isString(relativeFileName)) {
                            return;
                        }
                        const fileName = ts.getNormalizedAbsolutePath(relativeFileName, dirName);
                        const callbacks = fileName && fileWatcherCallbacks.get(toCanonicalName(fileName));
                        if (callbacks) {
                            for (const _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                                const fileCallback = callbacks_1[_i];
                                fileCallback(fileName, FileWatcherEventKind.Changed);
                            }
                        }
                    });
                    watcher.referenceCount = 0;
                    dirWatchers.set(dirPath, watcher);
                    return watcher;
                }
            }
            function fsWatchFileWorker(fileName, callback, pollingInterval) {
                _fs.watchFile(fileName, { persistent: true, interval: pollingInterval || 250 }, fileChanged);
                let eventKind;
                return {
                    close: function () { return _fs.unwatchFile(fileName, fileChanged); }
                };
                function fileChanged(curr, prev) {
                    const isPreviouslyDeleted = +prev.mtime === 0 || eventKind === FileWatcherEventKind.Deleted;
                    if (+curr.mtime === 0) {
                        if (isPreviouslyDeleted) {
                            return;
                        }
                        eventKind = FileWatcherEventKind.Deleted;
                    }
                    else if (isPreviouslyDeleted) {
                        eventKind = FileWatcherEventKind.Created;
                    }
                    else if (+curr.mtime === +prev.mtime) {
                        return;
                    }
                    else {
                        eventKind = FileWatcherEventKind.Changed;
                    }
                    callback(fileName, eventKind);
                }
            }
            function createFileWatcherCallback(callback) {
                return function (_fileName, eventKind) { return callback(eventKind === FileWatcherEventKind.Changed ? "change" : "rename", ""); };
            }
            function createFsWatchCallbackForFileWatcherCallback(fileName, callback) {
                return function (eventName) {
                    if (eventName === "rename") {
                        callback(fileName, fileExists(fileName) ? FileWatcherEventKind.Created : FileWatcherEventKind.Deleted);
                    }
                    else {
                        callback(fileName, FileWatcherEventKind.Changed);
                    }
                };
            }
            function createFsWatchCallbackForDirectoryWatcherCallback(directoryName, callback) {
                return function (eventName, relativeFileName) {
                    if (eventName === "rename") {
                        callback(!relativeFileName ? directoryName : ts.normalizePath(ts.combinePaths(directoryName, relativeFileName)));
                    }
                };
            }
            function fsWatch(fileOrDirectory, entryKind, callback, recursive, fallbackPollingWatchFile, pollingInterval) {
                let options;
                let lastDirectoryPartWithDirectorySeparator;
                let lastDirectoryPart;
                if (isLinuxOrMacOs) {
                    lastDirectoryPartWithDirectorySeparator = fileOrDirectory.substr(fileOrDirectory.lastIndexOf(ts.directorySeparator));
                    lastDirectoryPart = lastDirectoryPartWithDirectorySeparator.slice(ts.directorySeparator.length);
                }
                const watcher = !fileSystemEntryExists(fileOrDirectory, entryKind) ?
                    watchMissingFileSystemEntry() :
                    watchPresentFileSystemEntry();
                return {
                    close: function () {
                        watcher.close();
                        watcher = undefined;
                    }
                };
                function invokeCallbackAndUpdateWatcher(createWatcher) {
                    ts.sysLog("sysLog:: " + fileOrDirectory + ":: Changing watcher to " + (createWatcher === watchPresentFileSystemEntry ? "Present" : "Missing") + "FileSystemEntryWatcher");
                    callback("rename", "");
                    if (watcher) {
                        watcher.close();
                        watcher = createWatcher();
                    }
                }
                function watchPresentFileSystemEntry() {
                    if (options === undefined) {
                        if (isNode4OrLater && (process.platform === "win32" || process.platform === "darwin")) {
                            options = { persistent: true, recursive: !!recursive };
                        }
                        else {
                            options = { persistent: true };
                        }
                    }
                    try {
                        const presentWatcher = _fs.watch(fileOrDirectory, options, isLinuxOrMacOs ?
                            callbackChangingToMissingFileSystemEntry :
                            callback);
                        presentWatcher.on("error", function () { return invokeCallbackAndUpdateWatcher(watchMissingFileSystemEntry); });
                        return presentWatcher;
                    }
                    catch (e) {
                        return watchPresentFileSystemEntryWithFsWatchFile();
                    }
                }
                function callbackChangingToMissingFileSystemEntry(event, relativeName) {
                    return event === "rename" &&
                        (!relativeName ||
                            relativeName === lastDirectoryPart ||
                            relativeName.lastIndexOf(lastDirectoryPartWithDirectorySeparator) === relativeName.length - lastDirectoryPartWithDirectorySeparator.length) &&
                        !fileSystemEntryExists(fileOrDirectory, entryKind) ?
                        invokeCallbackAndUpdateWatcher(watchMissingFileSystemEntry) :
                        callback(event, relativeName);
                }
                function watchPresentFileSystemEntryWithFsWatchFile() {
                    ts.sysLog("sysLog:: " + fileOrDirectory + ":: Changing to fsWatchFile");
                    return fallbackPollingWatchFile(fileOrDirectory, createFileWatcherCallback(callback), pollingInterval);
                }
                function watchMissingFileSystemEntry() {
                    return fallbackPollingWatchFile(fileOrDirectory, function (_fileName, eventKind) {
                        if (eventKind === FileWatcherEventKind.Created && fileSystemEntryExists(fileOrDirectory, entryKind)) {
                            invokeCallbackAndUpdateWatcher(watchPresentFileSystemEntry);
                        }
                    }, pollingInterval);
                }
            }
            function watchFileUsingFsWatch(fileName, callback, pollingInterval) {
                return fsWatch(fileName, 0, createFsWatchCallbackForFileWatcherCallback(fileName, callback), false, fsWatchFile, pollingInterval);
            }
            function createWatchFileUsingDynamicWatchFile(watchFile) {
                return function (fileName, callback, pollingInterval) { return fsWatch(fileName, 0, createFsWatchCallbackForFileWatcherCallback(fileName, callback), false, watchFile, pollingInterval); };
            }
            function fsWatchDirectory(directoryName, callback, recursive) {
                return fsWatch(directoryName, 1, callback, !!recursive, fsWatchFile);
            }
            function watchDirectoryUsingFsWatch(directoryName, callback, recursive) {
                return fsWatchDirectory(directoryName, createFsWatchCallbackForDirectoryWatcherCallback(directoryName, callback), recursive);
            }
            function createWatchDirectoryUsing(fsWatchFile) {
                return function (directoryName, callback) { return fsWatchFile(directoryName, function () { return callback(directoryName); }, PollingInterval.Medium); };
            }
            function readFileWorker(fileName, _encoding) {
                if (!fileExists(fileName)) {
                    return undefined;
                }
                const buffer = _fs.readFileSync(fileName);
                const len = buffer.length;
                if (len >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
                    len &= ~1;
                    for (const i = 0; i < len; i += 2) {
                        const temp = buffer[i];
                        buffer[i] = buffer[i + 1];
                        buffer[i + 1] = temp;
                    }
                    return buffer.toString("utf16le", 2);
                }
                if (len >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
                    return buffer.toString("utf16le", 2);
                }
                if (len >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
                    return buffer.toString("utf8", 3);
                }
                return buffer.toString("utf8");
            }
            function readFile(fileName, _encoding) {
                ts.perfLogger.logStartReadFile(fileName);
                const file = readFileWorker(fileName, _encoding);
                ts.perfLogger.logStopReadFile();
                return file;
            }
            function writeFile(fileName, data, writeByteOrderMark) {
                ts.perfLogger.logEvent("WriteFile: " + fileName);
                if (writeByteOrderMark) {
                    data = byteOrderMarkIndicator + data;
                }
                let fd;
                try {
                    fd = _fs.openSync(fileName, "w");
                    _fs.writeSync(fd, data, undefined, "utf8");
                }
                finally {
                    if (fd !== undefined) {
                        _fs.closeSync(fd);
                    }
                }
            }
            function getAccessibleFileSystemEntries(path) {
                ts.perfLogger.logEvent("ReadDir: " + (path || "."));
                try {
                    const entries = _fs.readdirSync(path || ".").sort();
                    const files = [];
                    const directories = [];
                    for (const _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
                        const entry = entries_2[_i];
                        if (entry === "." || entry === "..") {
                            continue;
                        }
                        const name = ts.combinePaths(path, entry);
                        const stat = void 0;
                        try {
                            stat = _fs.statSync(name);
                        }
                        catch (e) {
                            continue;
                        }
                        if (stat.isFile()) {
                            files.push(entry);
                        }
                        else if (stat.isDirectory()) {
                            directories.push(entry);
                        }
                    }
                    return { files: files, directories: directories };
                }
                catch (e) {
                    return ts.emptyFileSystemEntries;
                }
            }
            function readDirectory(path, extensions, excludes, includes, depth) {
                return ts.matchFiles(path, extensions, excludes, includes, useCaseSensitiveFileNames, process.cwd(), depth, getAccessibleFileSystemEntries, realpath);
            }
            function fileSystemEntryExists(path, entryKind) {
                try {
                    const stat = _fs.statSync(path);
                    switch (entryKind) {
                        case 0: return stat.isFile();
                        case 1: return stat.isDirectory();
                        default: return false;
                    }
                }
                catch (e) {
                    return false;
                }
            }
            function fileExists(path) {
                return fileSystemEntryExists(path, 0);
            }
            function directoryExists(path) {
                return fileSystemEntryExists(path, 1);
            }
            function getDirectories(path) {
                ts.perfLogger.logEvent("ReadDir: " + path);
                return ts.filter(_fs.readdirSync(path), function (dir) { return fileSystemEntryExists(ts.combinePaths(path, dir), 1); });
            }
            function realpath(path) {
                try {
                    return _fs.realpathSync(path);
                }
                catch (_a) {
                    return path;
                }
            }
            function getModifiedTime(path) {
                try {
                    return _fs.statSync(path).mtime;
                }
                catch (e) {
                    return undefined;
                }
            }
            function setModifiedTime(path, time) {
                try {
                    _fs.utimesSync(path, time, time);
                }
                catch (e) {
                    return;
                }
            }
            function deleteFile(path) {
                try {
                    return _fs.unlinkSync(path);
                }
                catch (e) {
                    return;
                }
            }
            function createSHA256Hash(data) {
                const hash = _crypto.createHash("sha256");
                hash.update(data);
                return hash.digest("hex");
            }
        }

        const sys = getFibSystem();
        
        ts.patchWriteFileEnsuringDirectory(sys);
        return sys;
    })();
    if (ts.sys && ts.sys.getEnvironmentVariable) {
        ts.setCustomPollingValues(ts.sys);
        ts.Debug.currentAssertionLevel = /^development$/i.test(ts.sys.getEnvironmentVariable("NODE_ENV"))
            ? 1
            : 0;
    }
    if (ts.sys && ts.sys.debugMode) {
        ts.Debug.isDebugging = true;
    }
}