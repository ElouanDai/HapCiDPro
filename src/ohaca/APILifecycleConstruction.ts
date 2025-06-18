import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

interface ApiInfo {
  packageName: string;
  className: string;
  methodName: string;
  methodText: string;
  apiType: string;
  version: number | null;
  deprecated: number | null;
  useInstead: string;
}

export class APILifecycleConstruction {
  private static apiIntroducedMap: Map<string, number | null> = new Map();
  private static apiDeprecatedMap: Map<string, number | null> = new Map();
  private static apiRemovedMap: Map<string, number | null> = new Map();
  private static apiInsteadMap: Map<string, string | null> = new Map();

  private static versionNames: number[] = [7, 8, 9, 10, 11, 12, 13, 14, 15];
  private static filePaths: string[] = [
    "resources/Apis/Js_Api OpenHarmony-v3.0-LTS.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v3.1-Release.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v3.2-Release.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v4.0-Release.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v4.1-Release.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v5.0.0-Release.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v5.0.1-Release.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v5.0.2-Release.xlsx",
    "resources/Apis/Js_Api OpenHarmony-v5.0.3-Release.xlsx",
  ];

  public static constructLifecycle(): void {
    console.log("开始构建 API 生命周期");
    this.filePaths.forEach((filePath, index) => {
      const version: number = this.versionNames[index]; 
      console.log(`正在处理文件: ${filePath}`);
      const apis: ApiInfo[] = this.loadApisFromExcel(filePath);
      console.log(`从文件 ${filePath} 中加载到${apis.length}个API`);
      // 首先，将所有删除版本为空的 API 标记为在当前版本删除
      this.apiRemovedMap.forEach((value, key) => {
        if (value === null) {
          this.apiRemovedMap.set(key, version);
        }
      });
      apis.forEach(api => {
        if (api.apiType === 'Method' || api.apiType === 'Field') {
          let apiId: string;
          apiId = `${api.packageName}.${api.className}.${api.methodName}`;
          if (!this.apiIntroducedMap.has(apiId)) {
            // 如果 API 在 map 中不存在，设置其引入版本，引入版本为空则写当前版本
            this.apiIntroducedMap.set(apiId, api.version !== null ? api.version : version);
          } else {
            // 如果 API 在 map 中存在且 api.version 不是 null，更新其引入版本
            // if (api.version !== null) {
            //   this.apiIntroducedMap.set(apiId, api.version);
            // }
          }
          this.apiDeprecatedMap.set(apiId, api.deprecated);
          this.apiRemovedMap.set(apiId, null);
          const useInsteadValue = api.useInstead && api.useInstead.trim() !== "" && api.useInstead !== "N/A" ? api.useInstead : null;
          this.apiInsteadMap.set(apiId, useInsteadValue);
        }
      });
    });
    console.log(`已识别的 API 数量: ${this.apiIntroducedMap.size}`);

    this.saveMapToJson(this.apiIntroducedMap, "resources/ApiLifecycle/apiIntroducedMap.json");
    this.saveMapToJson(this.apiDeprecatedMap, "resources/ApiLifecycle/apiDeprecatedMap.json");
    this.saveMapToJson(this.apiRemovedMap, "resources/ApiLifecycle/apiRemovedMap.json");
    this.saveMapToJson(this.apiInsteadMap, "resources/ApiLifecycle/apiInsteadMap.json");
  }

  private static loadApisFromExcel(filePath: string): ApiInfo[] {
    console.log(`正在从文件 ${filePath} 加载 API 数据`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];
  
    const apis: ApiInfo[] = [];
  
    rawData.slice(1).forEach((row) => {
      const apiInfo: ApiInfo = {
        packageName: row[0],
        className: row[1],
        methodName: row[2],
        methodText: row[3],
        apiType: row[4],
        version: this.parseVersion(row[7]),
        deprecated: this.parseVersion(row[8]),
        useInstead: row[15],
      };
      apis.push(apiInfo);
    });
  
    return apis;
  }
  
  private static parseVersion(versionStr: string): number | null {
    return versionStr && versionStr !== "N/A" ? parseInt(versionStr) : null;
  }

  private static saveMapToJson(map: Map<string, number | string | null>, filePath: string): void {
    const obj: {[key: string]: number | string | null} = {};
    // //默认顺序输出
    // map.forEach((value, key) => {
    //   obj[key] = value;
    // });
    //id字典序输出
    const keys = Array.from(map.keys()).sort();
    for (const key of keys) {
      obj[key] = map.get(key)!; // 使用非空断言操作符确保值不为 undefined
    }

    // 确保目标目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    // 写入文件
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
    console.log(`结果已保存到 ${filePath}`);
  }
}