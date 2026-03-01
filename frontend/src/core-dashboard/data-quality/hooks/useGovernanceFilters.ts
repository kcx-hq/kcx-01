import { useMemo } from "react";
import type { GovernanceFilters } from "../types";

const omitAll = (value?: string): string | undefined =>
  !value || value === "All" ? undefined : value;

export function useGovernanceFilters(filters?: GovernanceFilters): Record<string, string> {
  return useMemo(() => {
    const base: Record<string, string> = {};
    const provider = omitAll(filters?.provider);
    const service = omitAll(filters?.service);
    const region = omitAll(filters?.region);
    const environment = omitAll(filters?.environment);
    const team = omitAll(filters?.team);
    const account = omitAll(filters?.account);
    const owner = omitAll(filters?.owner);
    const currencyMode = omitAll(filters?.currencyMode);
    const costBasisMode = omitAll(filters?.costBasisMode);

    if (provider) base.provider = provider;
    if (service) base.service = service;
    if (region) base.region = region;
    if (environment) base.environment = environment;
    if (team) base.team = team;
    if (account) base.account = account;
    if (owner) base.owner = owner;
    if (currencyMode) base.currencyMode = currencyMode;
    if (costBasisMode) base.costBasisMode = costBasisMode;

    return base;
  }, [
    filters?.provider,
    filters?.service,
    filters?.region,
    filters?.environment,
    filters?.team,
    filters?.account,
    filters?.owner,
    filters?.currencyMode,
    filters?.costBasisMode,
  ]);
}

export default useGovernanceFilters;
