import fs from 'fs';
import JSON5 from "json5"
import path from 'path';
import { CompatabilityIssue } from "../CompatabilityIssue";
import { Scene } from "@ArkAnalyzer/src/Scene";
import { ArkMethod } from "@ArkAnalyzer/src/core/model/ArkMethod";
import { ArkAssignStmt, ArkGotoStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt, ArkNopStmt, ArkSwitchStmt } from "@ArkAnalyzer/src/core/base/Stmt"
import { BasicBlock } from "@ArkAnalyzer/src/core/graph/BasicBlock";
import { Value } from "@ArkAnalyzer/src/core/base/Value";
import { Local } from "@ArkAnalyzer/src/core/base/Local";
import { AbstractInvokeExpr, ArkBinopExpr, ArkCastExpr, ArkConditionExpr, ArkInstanceInvokeExpr, ArkLengthExpr, ArkNewArrayExpr, ArkNewExpr, ArkStaticInvokeExpr, ArkTypeOfExpr, ArkUnopExpr } from "@ArkAnalyzer/src/core/base/Expr";
import { AbstractFieldRef, ArkArrayRef, ArkCaughtExceptionRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef, ArkThisRef } from "@ArkAnalyzer/src/core/base/Ref";
import { SceneConfig, Sdk } from "@ArkAnalyzer/src/Config";
import { Constant } from "@ArkAnalyzer/src/core/base/Constant";
import { Type, AnyType, UnknownType, UnclearReferenceType, PrimitiveType, BooleanType, NumberType, StringType, NullType, UndefinedType, LiteralType, UnionType, VoidType, NeverType, CallableType, ClassType, ArrayType, ArrayObjectType, TupleType, AliasType, ClassAliasType, TypeLiteralType, AnnotationType, AnnotationNamespaceType, AnnotationTypeQueryType } from "@ArkAnalyzer/src/core/base/Type";
import { ModelUtils } from "@ArkAnalyzer/src/core/common/ModelUtils";
import { ArkNamespace } from "@ArkAnalyzer/src/core/model/ArkNamespace";
import { ClassSignature, NamespaceSignature } from "@ArkAnalyzer/src/core/model/ArkSignature";

export class CompatabilityScan {
    /**
     * @param repoDir The repository path of the targeted OH app
     * @param apiLifecycleFile the file path of the collected api lifecycle file
     */
    public static scan(repoDir: string, apiLifecycleFile: string): CompatabilityIssue[] {
        console.log("start to check " + repoDir);
        let compatabilityIssueList:CompatabilityIssue[] = [];

        //(1) Get the supported API levels configured in the targeted app
        //Project->build-profile.json5->compatibleSdkVersion
        let minSupportedSdkVersion = this.getMinSupportedSdkVersion(repoDir);
        if (minSupportedSdkVersion == 16) {
            return compatabilityIssueList;
        }
        
        //(2) Get the list of OH APIs and their lifecycle mapping
        const apiLifecyclePath = path.join(apiLifecycleFile, 'ApiLifecycle');
        const apiIntroducedMap = this.loadApiLifecycleMap(path.join(apiLifecyclePath, 'apiIntroducedMap.json'));
        const apiDeprecatedMap = this.loadApiLifecycleMap(path.join(apiLifecyclePath, 'apiDeprecatedMap.json'));
        const apiRemovedMap = this.loadApiLifecycleMap(path.join(apiLifecyclePath, 'apiRemovedMap.json'));
        const apiInsteadMap = this.loadApiInsteadMap(path.join(apiLifecyclePath, 'apiInsteadMap.json'));

        //(3) Get the list of used APIs in the targeted app
        const sdks: Sdk[] = [
            {
                name: "etsSdk",
                path: "/home/daihang/ElouanFile/Research/ArkAnything/ArkCiD/Code/OpenHarmonySDK/11/ets",
                moduleName: ""
            },
        ];
        let config: SceneConfig = new SceneConfig();
        config.buildConfig("DemoProject",repoDir,sdks);
        config.buildFromProjectDir(repoDir);
        let scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        let methods = [];
        scene.inferTypes();
        for (const fl of scene.getFiles()) {
            for (const arkClass of fl.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    methods.push(arkMethod);
                }
            }
        }
        let valueList: Value[] = [];
        let apiList: string[] = [];
        for (let method of methods) { 
            // console.log(method.getSignature().toString());
            let blocks: Set<BasicBlock> = method.getBody().getCfg().getBlocks();
            blocks.forEach((block) => {
                let stmts: Stmt[]  = block.getStmts();
                let values: Value[] = [];
                stmts.forEach(stmt => {
                    values = values.concat(this.stmt2ValueList(stmt));
                });
                valueList = valueList.concat(values);
                let apis: string[] = [];
                values.forEach((value) => {
                    apis = apis.concat(this.value2ApiList(value,method));
                })
                apiList = apiList.concat(apis);
            });
        }
        // for (let api of apiList) {
        //     console.log(api);
        // }
        //(4) API Compatibility Analysis
        //总报告
        const parentDirPath = path.dirname(repoDir);
        const projectName = path.basename(repoDir);
        const outputFilePath = path.join(parentDirPath, "ArkCiDOutput.csv");
        // 确保输出文件存在，如果不存在则创建
        if (!fs.existsSync(outputFilePath)) {
            const headers = '项目名,最小支持SDK版本,问题类型,api,对应,引入版本,废弃版本,删除版本\n';
            fs.writeFileSync(outputFilePath, headers);
        }
        fs.appendFileSync(outputFilePath, '\n' + `项目名: ${projectName}, 最小支持SDK版本: ${minSupportedSdkVersion}` + '\n');
        // 项目报告
        // 确保ArkCiDResult目录存在
        const resultDirPath = path.join(repoDir, "ArkCiDResult");
        if (!fs.existsSync(resultDirPath)) {
            fs.mkdirSync(resultDirPath, { recursive: true });
        }
        const resultFilePath = path.join(resultDirPath, "ArkCiDResult.txt");
        // 使用fs.writeFileSync方法在循环之前初始化文件，确保文件是空的
        fs.writeFileSync(resultFilePath, '');
        const apiFilePath = path.join(resultDirPath, "ArkCiDApis.txt");
        // 使用fs.writeFileSync方法在循环之前初始化文件，确保文件是空的
        fs.writeFileSync(apiFilePath, '');

        apiList.forEach(api => {
            if(api.startsWith("api/@"))
                api=api.slice(5);
            const apiParts = api.split('.').reverse(); // 将API名称按.分割并反转，以便从最具体的部分开始匹配
            fs.appendFileSync(apiFilePath, api+'\n'); // 保持原有逻辑，记录API
            let matches = Array.from(apiIntroducedMap.keys()).filter(key => {
                const keyParts = key.split('.').reverse(); // 同样对键进行分割和反转
                // 检查是否每个部分都匹配
                return apiParts.every((part, index) => keyParts[index] && keyParts[index] === part);
                //return apiParts.every((part, index) => keyParts[index] && keyParts[index].toLowerCase() === part.toLowerCase());
            });
        
            if (matches.length > 0) {
                // 假设最佳匹配是数组中的第一个元素
                let matchKey = matches[0];
                const introducedVersion = apiIntroducedMap.get(matchKey) || Infinity;
                const deprecatedVersion = apiDeprecatedMap.get(matchKey) || Infinity;
                const removedVersion = apiRemovedMap.get(matchKey) || Infinity;
                const insteadApi = apiInsteadMap.get(matchKey) || "";
                let issueType = '';
                if (deprecatedVersion != Infinity) issueType = 'D';
                if (removedVersion != Infinity) issueType = 'R';
                // if (removedVersion <= minSupportedSdkVersion) issueType = 'R';
                if (introducedVersion > minSupportedSdkVersion) issueType = 'I';
                if (issueType !== '') {
                    compatabilityIssueList.push(new CompatabilityIssue(projectName,repoDir,minSupportedSdkVersion,issueType,api,matchKey,introducedVersion,deprecatedVersion,removedVersion,insteadApi))
                    const resultString = `${projectName},${minSupportedSdkVersion},${issueType},${api},${matchKey},${introducedVersion},${deprecatedVersion},${removedVersion}\n`;
                    fs.appendFileSync(outputFilePath, resultString);
                }
                const resultString = `api: ${api}, 对应: ${matchKey}, 引入版本: ${introducedVersion}, 废弃版本: ${deprecatedVersion}, 删除版本: ${removedVersion}`;
                fs.appendFileSync(resultFilePath, resultString+'\n');
            }
        });

        return compatabilityIssueList;
    }

    private static  getMinSupportedSdkVersion(repoDir:string)  {
        let buildProfileJson5File = repoDir + "/build-profile.json5";
        let content = fs.readFileSync(buildProfileJson5File, 'utf8');
        let parsedJson = JSON5.parse(content);
    
        // 尝试直接从app对象中获取compatibleSdkVersion
        let minSupportedSdkVersion = parsedJson.app.compatibleSdkVersion;
    
        // 如果app对象中不存在compatibleSdkVersion，则假设它在products数组中的一个对象内
        if (minSupportedSdkVersion === undefined && parsedJson.app.products && parsedJson.app.products.length > 0) {
            // 此处假设我们总是获取第一个product对象中的compatibleSdkVersion
            minSupportedSdkVersion = parsedJson.app.products[0].compatibleSdkVersion;
        }
    
        // 如果minSupportedSdkVersion依然是undefined，表示没有找到compatibleSdkVersion
        if (minSupportedSdkVersion === undefined) {
            console.error('compatibleSdkVersion not found in the JSON file.');
            return null;
        }
    
        return minSupportedSdkVersion;
    }

    private static stmt2ValueList(stmt: Stmt): Value[] {
        let ret: Value[] = [];
        if (stmt instanceof ArkAssignStmt) {
            ret.push(stmt.getLeftOp());
            ret.push(stmt.getRightOp());
        } else if (stmt instanceof ArkInvokeStmt) {
            ret.push(stmt.getInvokeExpr());
        } else if (stmt instanceof ArkIfStmt) {
            ret.push(stmt.getConditionExprExpr());
        } else if (stmt instanceof ArkGotoStmt) {

        } else if (stmt instanceof ArkReturnStmt) {
            ret.push(stmt.getOp());
        } else if (stmt instanceof ArkReturnVoidStmt) {
            
        } else if (stmt instanceof ArkNopStmt) {
            
        } else if (stmt instanceof ArkSwitchStmt) {
            
        } else {
            if (stmt.constructor === Stmt) {
                // console.log('这是一个纯 Stmt 类型的实例');
            } else {
                // console.log('这是一个未知的 Stmt 子类');
            }
        }
        return ret;
    }

    private static value2ApiList(value: Value, method: ArkMethod): string[] {
        let ret: string[] = [];
        if (value instanceof Local) {

        } else if (value instanceof Constant) {

        } else if (value instanceof ArkInstanceInvokeExpr) {
            let packageClassName:string = '';
            let methodName:string = '';

            const base = value.getBase();
            if(base.getType() instanceof UnknownType) {
                let namespace = ModelUtils.getNamespaceWithName(base.getName(),method.getDeclaringArkClass());
                let packageName:string = '';
                let className:string = base.getName();
                if(namespace){
                    packageName = this.fileName2PackageName(namespace.getDeclaringArkFile().getFileSignature().getFileName()) + '.';
                }
                packageClassName = packageName + className;
            }
            else{
                packageClassName = this.getTypeName(value.getBase().getType()); 
            }
            methodName = value.getMethodSignature().getMethodSubSignature().getMethodName();
            ret.push(packageClassName+'.'+methodName);
        } else if (value instanceof ArkStaticInvokeExpr) {
            let methodSignature = value.getMethodSignature();
            let classSignature = methodSignature.getDeclaringClassSignature();
            let namespaceSignature = methodSignature.getDeclaringClassSignature().getDeclaringNamespaceSignature();
            let fileSignature = null;
            let packageName = "";
            let className = "";
            if(namespaceSignature){
                fileSignature = namespaceSignature.getDeclaringFileSignature();
                className = namespaceSignature.getNamespaceName()
            }
            else{
                fileSignature = classSignature.getDeclaringFileSignature();
                className = classSignature.getClassName();
            }
            if(fileSignature){
                packageName = this.fileName2PackageName(fileSignature!.getFileName());
            }
            let methodName = methodSignature.getMethodSubSignature().getMethodName();
            ret.push(packageName+'.'+className+'.'+methodName);
        } else if (value instanceof ArkNewExpr) {

        } else if (value instanceof ArkNewArrayExpr) {

        } else if (value instanceof ArkBinopExpr) {

        } else if (value instanceof ArkCastExpr) {

        } else if (value instanceof ArkConditionExpr) {

        } else if (value instanceof ArkLengthExpr) {

        } else if (value instanceof ArkTypeOfExpr) {

        } else if (value instanceof ArkUnopExpr) {

        } else if (value instanceof ArkArrayRef) {

        } else if (value instanceof ArkInstanceFieldRef) {
            let packageClassName:string = '';
            let fieldName:string = '';

            const base = value.getBase();
            if(base.getType() instanceof UnknownType) {
                let namespace = ModelUtils.getNamespaceWithName(base.getName(),method.getDeclaringArkClass());
                let packageName:string = '';
                let className:string = base.getName();
                if(namespace){
                    packageName = this.fileName2PackageName(namespace.getDeclaringArkFile().getFileSignature().getFileName()) + '.';
                }
                packageClassName = packageName + className;
            }
            else{
                packageClassName = this.getTypeName(value.getBase().getType()); 
            }
            fieldName = value.getFieldSignature().getFieldName();
            ret.push(packageClassName+'.'+fieldName);
        } else if (value instanceof ArkParameterRef) {

        } else if (value instanceof ArkStaticFieldRef) {
            let fieldSignature = value.getFieldSignature();
            let packageName = "";
            let className = "";

            let fileSignature = fieldSignature.getDeclaringSignature().getDeclaringFileSignature();
            if(fieldSignature.getDeclaringSignature() instanceof ClassSignature) {
                className = (fieldSignature.getDeclaringSignature() as ClassSignature).getClassName();
            }
            else if(fieldSignature.getDeclaringSignature() instanceof NamespaceSignature) {
                className = (fieldSignature.getDeclaringSignature() as NamespaceSignature).getNamespaceName();
            }
            if(fileSignature){
                packageName = this.fileName2PackageName(fileSignature!.getFileName());
            }
            let fieldName = fieldSignature.getFieldName();
            ret.push(packageName+'.'+className+'.'+fieldName);
        } else if (value instanceof ArkThisRef) {

        } else if (value instanceof ArkCaughtExceptionRef) {

        } else {
            // console.log("未知类型的 Value", value);
        }
        return ret;
    }

    private static getTypeName(type: Type): string {
        if (type instanceof AnyType) {
            return 'AnyType';
        } else if (type instanceof UnknownType) {
            return 'UnknownType';
        } else if (type instanceof UnclearReferenceType) {
            return 'UnclearReferenceType';
        } else if (type instanceof PrimitiveType) {
            // 这包括 BooleanType, NumberType, StringType, NullType, UndefinedType, LiteralType
            return 'PrimitiveType';
        } else if (type instanceof UnionType) {
            return 'UnionType';
        } else if (type instanceof VoidType) {
            return 'VoidType';
        } else if (type instanceof NeverType) {
            return 'NeverType';
        } else if (type instanceof CallableType) {
            return 'CallableType';
        } else if (type instanceof ClassType) {
            return this.fileName2PackageName(type.getClassSignature().getDeclaringFileSignature().getFileName())+'.'+type.getClassSignature().getClassName();
        } else if (type instanceof ArrayType) {
            return 'ArrayType';
        } else if (type instanceof ArrayObjectType) {
            return 'ArrayObjectType';
        } else if (type instanceof TupleType) {
            return 'TupleType';
        } else if (type instanceof AliasType) {
            return 'AliasType';
        } else if (type instanceof TypeLiteralType) {
            return 'TypeLiteralType';
        } else if (type instanceof AnnotationType) {
            // 这包括 AnnotationNamespaceType, AnnotationTypeQueryType
            return 'AnnotationType';
        } else {
            return 'OtherType';
        }
    }

    private static fileName2PackageName(fileName: string): string {
        // 去除开头的'@'符号（如果存在）
        if (fileName.startsWith("api\\@")) {
            fileName = fileName.substring(5);
        }
        
        // 去除文件扩展名'.d.ts'
        const packageName = fileName.replace('.d.ts', '');
        
        return packageName;
    }

    private static loadApiLifecycleMap(filePath: string): Map<string, number | null> {
        const rawJson = fs.readFileSync(filePath, 'utf8');
        const apiData = JSON5.parse(rawJson);
        const apiMap = new Map<string, number | null>();
        for (const [apiId, version] of Object.entries(apiData)) {
            apiMap.set(apiId, version as number | null);
        }
        return apiMap;
    }

    private static loadApiInsteadMap(filePath: string): Map<string, string> {
        const rawJson = fs.readFileSync(filePath, 'utf8');
        const apiData = JSON5.parse(rawJson);
        const apiMap = new Map<string, string>();
        for (const [apiId, version] of Object.entries(apiData)) {
            apiMap.set(apiId, version as string);
        }
        return apiMap;
    }
}