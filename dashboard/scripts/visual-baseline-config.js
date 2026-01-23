const mockParams =
  "mock=1&mock_seed=baseline&mock_today=2025-12-31&mock_now=2025-12-31T12:00:00Z";
const landingParams = "screenshot=1";

export function createBaselineJobs(baseUrl) {
  return [
    {
      name: "dashboard-desktop",
      url: `${baseUrl}/?screenshot=1&${mockParams}`,
      width: 1512,
      height: 997,
      dpr: 2,
    },
    {
      name: "dashboard-mobile",
      url: `${baseUrl}/?screenshot=1&${mockParams}`,
      width: 390,
      height: 844,
      dpr: 2,
    },
    {
      name: "landing-desktop",
      url: `${baseUrl}/?${landingParams}`,
      width: 1440,
      height: 900,
      dpr: 2,
    },
  ];
}
