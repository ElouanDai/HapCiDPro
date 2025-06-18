export class CompatabilityIssue {

  public projectName: string;
  public projectDir: string;
  public minSupportedSdkVersion: string;
  public issueType: string;
  public api: string;
  public matchKey: string;
  public introducedVersion: number;
  public deprecatedVersion: number;
  public removedVersion: number;
  public insteadApi: string;

  constructor(
      projectName: string,
      projectDir: string,
      minSupportedSdkVersion: string,
      issueType: string,
      api: string,
      matchKey: string,
      introducedVersion: number,
      deprecatedVersion: number,
      removedVersion: number,
      insteadApi: string
  ) {
      this.projectName = projectName;
      this.projectDir = projectDir;
      this.minSupportedSdkVersion = minSupportedSdkVersion;
      this.issueType = issueType;
      this.api = api;
      this.matchKey = matchKey;
      this.introducedVersion = introducedVersion;
      this.deprecatedVersion = deprecatedVersion;
      this.removedVersion = removedVersion;
      this.insteadApi = insteadApi;
  }

}
