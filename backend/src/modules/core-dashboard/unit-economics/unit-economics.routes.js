import express from "express";
import {
  getAllocationConfidence,
  getAllocationKpis,
  getAllocationOwnershipDrift,
  getAllocationSharedPool,
  getAllocationShowback,
  getDenominatorGate,
  getUnitBenchmarks,
  getUnitDecomposition,
  getUnitEconomicsSummary,
  getUnitKpis,
  getUnitTargetGap,
  getUnitTrend,
} from "./unit-economics.controller.js";

const router = express.Router();

router.get("/summary", getUnitEconomicsSummary);
router.get("/allocation/kpis", getAllocationKpis);
router.get("/allocation/showback", getAllocationShowback);
router.get("/allocation/shared-pool", getAllocationSharedPool);
router.get("/allocation/confidence", getAllocationConfidence);
router.get("/allocation/ownership-drift", getAllocationOwnershipDrift);
router.get("/unit-econ/kpis", getUnitKpis);
router.get("/unit-econ/trend", getUnitTrend);
router.get("/unit-econ/decomposition", getUnitDecomposition);
router.get("/unit-econ/benchmarks", getUnitBenchmarks);
router.get("/unit-econ/target-gap", getUnitTargetGap);
router.get("/unit-econ/denominator-gate", getDenominatorGate);

export default router;
