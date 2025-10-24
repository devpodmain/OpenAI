export type DateRange = { fromISO: string; toISO: string };

export type CostAnalysisArgs = {
  dateRange?: DateRange;
  providers?: string[];
  granularity?: "day" | "week" | "month";
};

export type ServiceBreakdownArgs = {
  dateRange?: DateRange;
  provider?: string;
  limit?: number;
  sortBy?: "billed" | "effective";
};

export type ReportCriteriaArgs = {
  current?: {
    preset?: string;
    providers?: string[];
    granularity?: "day" | "week" | "month";
  };
};

const providersList = [
  { name: "AWS", color: "#FF9900", cost: 120000 },
  { name: "Azure", color: "#0078D4", cost: 45000 },
  { name: "GCP", color: "#4285F4", cost: 35000 },
  { name: "VMware", color: "#607078", cost: 10045.45 },
];

const dailyData = [
  { date: "2024-05-28", aws: 8500, azure: 3200, gcp: 2800, vmware: 1200 },
  { date: "2024-05-29", aws: 9200, azure: 3500, gcp: 3100, vmware: 1300 },
  { date: "2024-05-30", aws: 8800, azure: 3300, gcp: 2900, vmware: 1250 },
  { date: "2024-05-31", aws: 9500, azure: 3800, gcp: 3200, vmware: 1400 },
  { date: "2024-06-01", aws: 10200, azure: 4000, gcp: 3500, vmware: 1500 },
  { date: "2024-06-02", aws: 9800, azure: 3600, gcp: 3000, vmware: 1350 },
  { date: "2024-06-03", aws: 10500, azure: 4200, gcp: 3800, vmware: 1600 },
  { date: "2024-06-04", aws: 11000, azure: 4500, gcp: 4000, vmware: 1700 },
  { date: "2024-06-05", aws: 10800, azure: 4300, gcp: 3900, vmware: 1650 },
  { date: "2024-06-06", aws: 11200, azure: 4600, gcp: 4100, vmware: 1750 },
  { date: "2024-06-07", aws: 11500, azure: 4800, gcp: 4300, vmware: 1800 },
  { date: "2024-06-08", aws: 11800, azure: 5000, gcp: 4500, vmware: 1850 },
  { date: "2024-06-09", aws: 12000, azure: 5200, gcp: 4700, vmware: 1900 },
];

const services = [
  { name: "Amazon Dynamo - Indexed Data Store", billed: 2500, effective: 2400 },
  { name: "Amazon Dynamo - PITR Backup Storage", billed: 1800, effective: 1750 },
  { name: "Amazon Glacier", billed: 1200, effective: 1150 },
  { name: "Cold HDD", billed: 800, effective: 780 },
  { name: "General Purpose", billed: 3500, effective: 3400 },
  { name: "Azure Compute", billed: 2800, effective: 2750 },
  { name: "Azure Storage", billed: 1500, effective: 1450 },
  { name: "GCP Compute Engine", billed: 2200, effective: 2150 },
  { name: "VMware vSphere", billed: 1900, effective: 1850 },
];

function formatRangeLabel(range?: DateRange) {
  if (!range?.fromISO || !range?.toISO) return "May 28, 2024 - June 9, 2024";
  return `${new Date(range.fromISO).toLocaleDateString()} - ${new Date(range.toISO).toLocaleDateString()}`;
}

export async function getCostAnalysis(args: CostAnalysisArgs = {}) {
  const summary = {
    total: 210045.45,
    trend: 12,
    change: 25205.45,
    dateRange: formatRangeLabel(args.dateRange),
  };

  const filteredProviders =
    args.providers && args.providers.length
      ? providersList.filter(p => args.providers!.includes(p.name))
      : providersList;

  const series = dailyData;

  return {
    summary,
    providers: filteredProviders,
    series,
    _meta: {
      "openai/outputTemplate": "ui://widget/cost-analysis.html",
      timestamp: new Date().toISOString(),
    },
  };
}

export async function getServiceBreakdown(args: ServiceBreakdownArgs = {}) {
  let list = [...services];

  if (args.provider) {
    const byProvider = {
      AWS: (s: typeof services[number]) => s.name.startsWith("Amazon"),
      Azure: (s: typeof services[number]) => s.name.startsWith("Azure"),
      GCP: (s: typeof services[number]) => s.name.startsWith("GCP"),
      VMware: (s: typeof services[number]) => s.name.startsWith("VMware"),
    } as const;
    const pred = (byProvider as any)[args.provider];
    if (pred) list = list.filter(pred);
  }

  if (args.sortBy === "effective") {
    list.sort((a, b) => b.effective - a.effective);
  } else if (args.sortBy === "billed") {
    list.sort((a, b) => b.billed - a.billed);
  }

  const limit = args.limit && args.limit > 0 ? args.limit : 10;
  list = list.slice(0, limit);

  return {
    services: list,
    _meta: {
      "openai/outputTemplate": "ui://widget/service-breakdown.html",
      timestamp: new Date().toISOString(),
    },
  };
}

export async function getReportCriteria(args: ReportCriteriaArgs = {}) {
  const presets = [
    { id: "last_7_days", label: "Last 7 Days" },
    { id: "last_30_days", label: "Last 30 Days" },
    { id: "month_to_date", label: "Month to Date" },
  ];

  const providers = ["AWS", "Azure", "GCP", "VMware"];

  return {
    presets,
    providers,
    tags: [],
    current: {
      preset: args.current?.preset ?? "last_30_days",
      providers: args.current?.providers ?? providers,
      granularity: args.current?.granularity ?? "day",
    },
    _meta: {
      "openai/outputTemplate": "ui://widget/report-criteria.html",
      timestamp: new Date().toISOString(),
    },
  };
}

export async function getCloudDashboard() {
  const [cost, svc, crit] = await Promise.all([
    getCostAnalysis(),
    getServiceBreakdown(),
    getReportCriteria(),
  ]);

  return {
    structuredContent: {
      summary: cost.summary,
      providers: cost.providers,
      dailyData: cost.series,
      services: svc.services,
      criteria: crit.current,
    },
    content: [
      { type: "text", text: "CloudBolt Cost Report Dashboard", _meta: {} },
    ],
    _meta: {
      "openai/outputTemplate": "ui://widget/cloud-dashboard.html",
      timestamp: new Date().toISOString(),
      reportName: "CloudBolt Report 241024",
    },
  };
}

export const cloudDashboardTool = {
  name: "cloud-dashboard",
  title: "Multi-Cloud Cost Dashboard",
  description:
    "View comprehensive cloud costs and usage across AWS, Azure, GCP, and VMware.",
  _meta: {
    "openai/outputTemplate": "ui://widget/cloud-dashboard.html",
    "openai/appsSdk": {
      category: "analytics",
      tags: ["cloud", "cost", "dashboard", "analytics"],
      version: "1.0.0",
    },
  },
  inputSchema: {},
  run: getCloudDashboard as any,
};

