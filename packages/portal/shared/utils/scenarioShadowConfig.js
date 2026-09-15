export const DEFAULT_SCENARIO_SHADOW_LEVEL = 1;
export const SCENARIO_SHADOW_EVENT = "scenario-shadow-config-change";

export const normalizeScenarioShadowLevel = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_SCENARIO_SHADOW_LEVEL;
  return Math.min(4, Math.max(0, parsed));
};

export const applyScenarioShadowConfig = (settings) => {
  if (typeof document === "undefined") return DEFAULT_SCENARIO_SHADOW_LEVEL;
  const level = normalizeScenarioShadowLevel(settings?.shadow_config);
  document.documentElement.dataset.scenarioShadow = String(level);
  return level;
};

export const applyStoredScenarioShadowConfig = () => {
  if (typeof window === "undefined") return DEFAULT_SCENARIO_SHADOW_LEVEL;
  try {
    const settings = JSON.parse(localStorage.getItem("company_settings") || "{}");
    return applyScenarioShadowConfig(settings);
  } catch (error) {
    console.error("Unable to read scenario shadow configuration", error);
    return applyScenarioShadowConfig({});
  }
};
