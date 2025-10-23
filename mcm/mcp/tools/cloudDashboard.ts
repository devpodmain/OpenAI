export async function getCloudDashboard() {
    return {
      structuredContent: {
        summary: {
          total: 210045.45,
          trend: 12,
          change: 25205.45,
          dateRange: "May 28, 2024 - June 9, 2024"
        },
        providers: [
          { name: "AWS", color: "#FF9900", cost: 120000 },
          { name: "Azure", color: "#0078D4", cost: 45000 },
          { name: "GCP", color: "#4285F4", cost: 35000 },
          { name: "VMware", color: "#607078", cost: 10045.45 }
        ],
        dailyData: [
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
          { date: "2024-06-09", aws: 12000, azure: 5200, gcp: 4700, vmware: 1900 }
        ],
        services: [
          { name: "Amazon Dynamo - Indexed Data Store", billed: 2500, effective: 2400 },
          { name: "Amazon Dynamo - PITR Backup Storage", billed: 1800, effective: 1750 },
          { name: "Amazon Glacier", billed: 1200, effective: 1150 },
          { name: "Cold HDD", billed: 800, effective: 780 },
          { name: "General Purpose", billed: 3500, effective: 3400 },
          { name: "Azure Compute", billed: 2800, effective: 2750 },
          { name: "Azure Storage", billed: 1500, effective: 1450 },
          { name: "GCP Compute Engine", billed: 2200, effective: 2150 },
          { name: "VMware vSphere", billed: 1900, effective: 1850 }
        ]
      },
      content: [
        {
          type: "text",
          text: "📊 CloudBolt Cost Report Dashboard",
          _meta: {},
        },
      ],
      _meta: {
        timestamp: new Date().toISOString(),
        reportName: "CloudBolt Report 241024"
      },
    };
  }
  
  export const cloudDashboardTool = {
    name: "cloud-dashboard",
    title: "Multi-Cloud Cost Dashboard",
    description: "View comprehensive cloud costs and usage across AWS, Azure, GCP, and VMware providers with interactive charts and detailed service breakdowns.",
    _meta: { 
      "openai/outputTemplate": "ui://widget/cloud-dashboard.html",
      "openai/appsSdk": {
        "category": "analytics",
        "tags": ["cloud", "cost", "dashboard", "analytics"],
        "version": "1.0.0"
      }
    },
    inputSchema: {},
    run: getCloudDashboard as any,
  };
  