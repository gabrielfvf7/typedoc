module TypeDoc.Factories
{
    export class SourceHandler extends BaseHandler
    {
        private basePath = new BasePath();

        private fileMappings:{[name:string]:Models.SourceFile} = {};


        constructor(dispatcher:Dispatcher) {
            super(dispatcher);

            dispatcher.on(Dispatcher.EVENT_DECLARATION, this.onProcess, this);
            dispatcher.on(Dispatcher.EVENT_BEGIN_DOCUMENT, this.onEnterDocument, this);
            dispatcher.on(Dispatcher.EVENT_BEGIN_RESOLVE, this.onEnterResolve, this);
            dispatcher.on(Dispatcher.EVENT_RESOLVE, this.onResolveReflection, this);
            dispatcher.on(Dispatcher.EVENT_END_RESOLVE, this.onLeaveResolve, this, 512);
        }


        onEnterDocument(state:DocumentState) {
            var fileName = state.document.fileName;
            this.basePath.add(fileName);

            var file = new Models.SourceFile(fileName);
            this.fileMappings[fileName] = file;
            state.project.files.push(file);
        }


        onProcess(state:DeclarationState) {
            if (state.isInherited) {
                if (state.kindOf([Models.Kind.Class, Models.Kind.Interface])) return;
                if (state.reflection.overwrites) return;
            } else if (!state.isSignature && !state.kindOf(Models.Kind.Parameter)) {
                var fileName = state.originalDeclaration.ast().fileName();
                if (this.fileMappings[fileName]) {
                    this.fileMappings[fileName].reflections.push(state.reflection);
                }
            }

            var ast      = state.declaration.ast();
            var fileName = state.declaration.ast().fileName();
            var snapshot = state.getSnapshot(fileName);

            this.basePath.add(fileName);
            state.reflection.sources.push({
                fileName: fileName,
                line:     snapshot.getLineNumber(ast.start())
            });
        }


        onEnterResolve(res:DispatcherEvent) {
            res.project.files.forEach((file) => {
                var fileName = file.fileName = this.basePath.trim(file.fileName);
                this.fileMappings[fileName] = file;
            });
        }


        onResolveReflection(res:ReflectionEvent) {
            res.reflection.sources.forEach((source) => {
                source.fileName = this.basePath.trim(source.fileName);
            });
        }


        onLeaveResolve(res:DispatcherEvent) {
            var home = res.project.directory;
            res.project.files.forEach((file) => {
                var reflections = [];
                file.reflections.forEach((reflection) => {
                    if (reflection.sources.length > 1) return;
                    var parent = reflection.parent;
                    while (!(parent instanceof Models.ProjectReflection)) {
                        if (reflections.indexOf(<Models.DeclarationReflection>parent) != -1) return;
                        parent = parent.parent;
                    }

                    reflections.push(reflection);
                });

                var directory = home;
                var path = Path.dirname(file.fileName);
                if (path != '.') {
                    path.split('/').forEach((path) => {
                        if (!directory.directories[path]) {
                            directory.directories[path] = new Models.SourceDirectory(path, directory);
                        }
                        directory = directory.directories[path];
                    });
                }

                directory.files.push(file);
                reflections.sort(GroupHandler.sortCallback);
                file.parent = directory;
                file.reflections = reflections;
            });
        }
    }


    Dispatcher.HANDLERS.push(SourceHandler);
}