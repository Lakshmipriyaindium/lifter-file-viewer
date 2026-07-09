// components/dotnet-api/type.ts
export interface ApiParameter {
  Name: string;
  Type: string;
  Source?: string;
}

export interface Endpoint {
  Name: string;
  HttpMethod: string;
  Route: string;
  ReturnType: string;
  ClassName: string;
  ApiType: string;
  Parameters: ApiParameter[];
}

export interface Project {
  Name: string;
  Path?: string; // Optional because we sanitize/remove it on export
  Language: string;
  Framework: string;
  Endpoints: Endpoint[];
}

export interface SoapServices {
  Total: number;
  Asmx: number;
  WcfSoap: number;
}

export interface RestMvcApis {
  Total: number;
  WcfRest: number;
  WebApi2: number;
  AspNetCore: number;
  Rest: number;
  Mvc: number;
}

export interface ApiTypeBreakdown {
  WcfSoap: number;
  WcfRest: number;
  WebApi2: number;
  AspNetCore: number;
  Rest: number;
  Mvc: number;
  Asmx: number;
}

export interface Summary {
  TotalSolutions: number;
  TotalProjects: number;
  TotalEndpoints: number;
  SoapServices: SoapServices;
  RestMvcApis: RestMvcApis;
  ApiTypeBreakdown: ApiTypeBreakdown;
  Languages: string[];
  FrameworkVersions: string[];
}

export interface DotNetApiAnalysisData {
  SolutionName: string;
  SolutionPath: string;
  AnalysisDate: string;
  Summary: Summary;
  Projects: Project[];
  AnalyzedSolutions: unknown[];
  Errors: unknown[];
}
