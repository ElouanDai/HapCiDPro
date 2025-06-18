import { promises as fs } from "fs";
import { join } from "path";
import { CompatabilityScan } from "../src/ohalm/CompatabilityScan";
import { CompatabilityIssue } from "../src/ohalm/CompatabilityIssue";  // Assuming this is the correct path

class FindAppAndScan {
    private static csvHeaderWritten: boolean = false;
    private static csvFilePath: string;  // Path for the consolidated CSV output

    private static async isHarmonyApp(directory: string): Promise<boolean> {
        try {
            const files = await fs.readdir(directory);
            const hasEntryFolder = files.includes('entry');
            const hasBuildProfile = files.includes('build-profile.json5');
            return hasEntryFolder && hasBuildProfile;
        } catch (error) {
            console.error('Error checking directory:', error);
            return false;
        }
    }

    private static async scanDirectory(directory: string, apiLifecycleDir: string): Promise<void> {
        const isHarmonyApp = await this.isHarmonyApp(directory);
        if (isHarmonyApp) {
            console.log(`Scanning OpenHarmony app at ${directory}`);
            const issues = await CompatabilityScan.scan(directory, apiLifecycleDir);
            await this.writeIssuesToCSV(issues, directory);
            console.log(`Completed scan and updated CSV for ${directory}`); // Progress update
        }

        try {
            const items = await fs.readdir(directory, { withFileTypes: true });
            await Promise.all(items.map(async (item) => {
                if (item.isDirectory()) {
                    const path = join(directory, item.name);
                    await this.scanDirectory(path, apiLifecycleDir);
                }
            }));
        } catch (error) {
            console.error('Error scanning directory:', error);
        }
    }

    private static async writeIssuesToCSV(issues: CompatabilityIssue[], outputDir: string): Promise<void> {
        if (!this.csvHeaderWritten) {
            const header = 'ProjectName,ProjectDir,MinSupportedSdkVersion,IssueType,API,MatchKey,IntroducedVersion,DeprecatedVersion,RemovedVersion,InsteadAPI\n';
            await fs.writeFile(this.csvFilePath, header, { flag: 'w' });  // Overwrite file if existing
            this.csvHeaderWritten = true;
        }
        
        const rows = issues.map(issue => 
            `${issue.projectName},${issue.projectDir},${issue.minSupportedSdkVersion},${issue.issueType},${issue.api},${issue.matchKey},${issue.introducedVersion},${issue.deprecatedVersion},${issue.removedVersion},${issue.insteadApi}`
        ).join('\n');

        if (rows.length > 0) {
            await fs.appendFile(this.csvFilePath, rows + '\n');  // Append issues to file
        }
    }

    public static async findAppsAndScan(inputDir: string, apiLifecycleDir: string): Promise<void> {
        this.csvFilePath = join(inputDir, 'ArkCiDOut.csv'); // Set the path for the CSV file
        console.log('Starting scan of all directories...');
        await this.scanDirectory(inputDir, apiLifecycleDir);
        console.log('Scanning complete.');
    }
}

const apiLifecycleDir = './resources';

FindAppAndScan.findAppsAndScan('/home/daihang/hdd/Data/ArkCiD/OHApps250220/openharmony-tpc', apiLifecycleDir)
    .then(() => console.log('All scans complete.'))
    .catch((error) => console.error('An error occurred during scanning:', error));
