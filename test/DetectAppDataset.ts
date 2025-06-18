import fs from 'fs';
import path from 'path';
import { CompatabilityScan } from "../src/ohalm/CompatabilityScan";
import { APILifecycleConstruction } from "../src/APILifecycleConstruction";

let input_dir = '/home/daihang/ElouanFile/Research/ArkAnything/ArkCiD/Code/ArkCiD/test/DemoProjectDataset';

let apiLifecycleDir = './resources';

APILifecycleConstruction.constructLifecycle();

//总报告
const outputFilePath = path.join(input_dir, "ArkCiDOutput.csv");
// 确保输出文件存在，如果不存在则创建,如果存在则重置
fs.writeFileSync(outputFilePath, '');

const getDirectories = (source: string): string[] =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter((dirent: fs.Dirent) => dirent.isDirectory())
    .map((dirent: fs.Dirent) => path.join(source, dirent.name));

// 遍历每个子目录并执行scan函数
// 明确指定dir参数的类型
const directories = getDirectories(input_dir);
directories.forEach((dir: string) => {
    CompatabilityScan.scan(dir, apiLifecycleDir);
});
